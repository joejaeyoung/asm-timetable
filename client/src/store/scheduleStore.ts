import { create } from 'zustand';
import type { ScheduleBlock } from '@/types';
import { api } from '@/lib/api';

interface ScheduleStore {
  blocks: ScheduleBlock[];
  fetchByMonth: (teamId: string, month: string) => Promise<void>;
  fetchByWeek: (teamId: string, weekId: string) => Promise<void>;
  /** 로컬 ID(local-)로 생성된 블록을 API에 저장 후 실제 ID로 교체 */
  upsertBlock: (block: ScheduleBlock) => Promise<void>;
  removeBlock: (id: string) => Promise<void>;
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  blocks: [],

  fetchByMonth: async (teamId: string, month: string) => {
    const blocks = await api.getScheduleByMonth(teamId, month);
    set({ blocks });
  },

  fetchByWeek: async (teamId: string, weekId: string) => {
    const blocks = await api.getScheduleByWeek(teamId, weekId);
    set({ blocks });
  },

  upsertBlock: async (block: ScheduleBlock) => {
    if (block.id.startsWith('local-')) {
      // 신규 블록 — 낙관적 업데이트 후 API 저장
      set((state) => ({ blocks: [...state.blocks, block] }));
      try {
        const saved = await api.createBlock({
          userId: block.userId,
          teamId: block.teamId,
          date: block.date,
          startTime: block.startTime,
          endTime: block.endTime,
          description: block.description,
        });
        // 임시 ID를 서버 ID로 교체
        set((state) => ({
          blocks: state.blocks.map((b) => (b.id === block.id ? saved : b)),
        }));
      } catch (e) {
        // 실패 시 롤백
        set((state) => ({ blocks: state.blocks.filter((b) => b.id !== block.id) }));
        console.error('블록 저장 실패:', e);
        throw e;
      }
    } else {
      // 기존 블록 수정
      set((state) => ({
        blocks: state.blocks.map((b) => (b.id === block.id ? block : b)),
      }));
      try {
        await api.updateBlock(block.id, {
          date: block.date,
          startTime: block.startTime,
          endTime: block.endTime,
          description: block.description,
        });
      } catch (e) {
        // 실패 시 서버에서 재로딩은 다음 fetch 시 처리
        console.error('블록 수정 실패:', e);
        throw e;
      }
    }
  },

  removeBlock: async (id: string) => {
    // 낙관적 삭제
    const prev = get().blocks;
    set((state) => ({ blocks: state.blocks.filter((b) => b.id !== id) }));
    try {
      if (!id.startsWith('local-')) {
        await api.deleteBlock(id);
      }
    } catch (e) {
      // 실패 시 롤백
      set({ blocks: prev });
      console.error('블록 삭제 실패:', e);
      throw e;
    }
  },
}));
