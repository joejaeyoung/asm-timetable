import { create } from 'zustand';
import type { ScheduleBlock, RecurrenceRule } from '@/types';
import { api } from '@/lib/api';

interface CreateRecurringPayload {
  userId: string | null;  // null = 팀 전체 일정
  teamId: string;
  startDate: string;
  startTime: string;
  endTime: string;
  description?: string;
  rule: RecurrenceRule;
}

interface ScheduleStore {
  blocks: ScheduleBlock[];
  fetchByMonth: (teamId: string, month: string) => Promise<void>;
  fetchByWeek: (teamId: string, weekId: string) => Promise<void>;
  /** 로컬 ID(local-)로 생성된 블록을 API에 저장 후 실제 ID로 교체 */
  upsertBlock: (block: ScheduleBlock) => Promise<void>;
  createRecurringBlocks: (payload: CreateRecurringPayload) => Promise<void>;
  removeBlock: (id: string, scope?: 'THIS_ONLY' | 'THIS_AND_AFTER' | 'ALL') => Promise<void>;
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

  createRecurringBlocks: async (payload: CreateRecurringPayload) => {
    const saved = await api.createRecurringBlocks({
      userId: payload.userId,
      teamId: payload.teamId,
      date: payload.startDate,
      startDate: payload.startDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
      description: payload.description,
      daysOfWeek: payload.rule.daysOfWeek,
      endCondition: payload.rule.endCondition,
      endDate: payload.rule.endDate,
      occurrences: payload.rule.occurrences,
    });
    set((state) => ({ blocks: [...state.blocks, ...saved] }));
  },

  removeBlock: async (id: string, scope: 'THIS_ONLY' | 'THIS_AND_AFTER' | 'ALL' = 'THIS_ONLY') => {
    const prev = get().blocks;
    const block = prev.find((b) => b.id === id);
    const groupId = block?.recurrenceGroupId;

    // 낙관적 삭제: scope에 따라 제거할 블록 결정
    let idsToRemove: Set<string>;
    if (!groupId || scope === 'THIS_ONLY') {
      idsToRemove = new Set([id]);
    } else if (scope === 'ALL') {
      idsToRemove = new Set(prev.filter((b) => b.recurrenceGroupId === groupId).map((b) => b.id));
    } else {
      const targetIndex = block?.recurrenceIndex ?? 0;
      idsToRemove = new Set(
        prev
          .filter((b) => b.recurrenceGroupId === groupId && (b.recurrenceIndex ?? 0) >= targetIndex)
          .map((b) => b.id),
      );
    }

    set((state) => ({ blocks: state.blocks.filter((b) => !idsToRemove.has(b.id)) }));
    try {
      if (!id.startsWith('local-')) {
        if (scope === 'THIS_ONLY' || !groupId) {
          await api.deleteBlock(id);
        } else {
          await api.deleteBlockWithScope(id, scope);
        }
      }
    } catch (e) {
      set({ blocks: prev });
      console.error('블록 삭제 실패:', e);
      throw e;
    }
  },
}));
