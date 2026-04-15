import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/store/authStore';
import { useTeamStore } from '@/store/teamStore';
import { useScheduleStore } from '@/store/scheduleStore';
import RecurringDeleteModal from './RecurringDeleteModal';
import type { ScheduleBlock } from '@/types';

const SLOT_HEIGHT = 32;
const FOLD_START = 4;
const FOLD_END = 12;
const FOLD_H = 28;

function timeToSlot(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 2 + (m >= 30 ? 1 : 0);
}

function slotToVisualY(slot: number, folded: boolean): number {
  if (slot < FOLD_START) return slot * SLOT_HEIGHT;
  if (folded) {
    if (slot < FOLD_END) return FOLD_START * SLOT_HEIGHT;
    return FOLD_START * SLOT_HEIGHT + FOLD_H + (slot - FOLD_END) * SLOT_HEIGHT;
  }
  return slot * SLOT_HEIGHT;
}

interface Props {
  block: ScheduleBlock;
  colIndex: number;
  nightFolded: boolean;
}

export default function DragBlock({ block, colIndex, nightFolded }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const allUsers = useTeamStore((s) => s.allUsers);
  const removeBlock = useScheduleStore((s) => s.removeBlock);

  const [showTooltip, setShowTooltip] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showRecurringDeleteModal, setShowRecurringDeleteModal] = useState(false);

  const user = allUsers.find((u) => u.id === block.userId);
  const isTeamBlock = user?.virtualUser ?? false;
  const color = isTeamBlock ? '#9ca3af' : (user?.color ?? '#ccc');
  const canDelete = isTeamBlock || currentUser?.id === block.userId;

  const startSlot = timeToSlot(block.startTime);
  const endSlot = timeToSlot(block.endTime);

  if (nightFolded && startSlot >= FOLD_START && endSlot <= FOLD_END) return null;

  const topY = slotToVisualY(startSlot, nightFolded);
  const bottomY = slotToVisualY(endSlot, nightFolded);
  const height = Math.max(bottomY - topY - 2, 4);

  // 짧은 블록이 위에 오도록 z-index 계산 (1슬롯=30분, 짧을수록 높은 값)
  const durationSlots = Math.max(endSlot - startSlot, 1);
  const blockZIndex = 10 + Math.max(0, 48 - durationSlots);

  function handleContextMenu(e: React.MouseEvent) {
    if (!canDelete) return;
    e.preventDefault();
    e.stopPropagation();
    setShowTooltip(false);
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  function handleDelete() {
    setContextMenu(null);
    if (block.recurrenceGroupId) {
      setShowRecurringDeleteModal(true);
    } else {
      void removeBlock(block.id);
    }
  }

  async function handleRecurringDelete(scope: 'THIS_ONLY' | 'THIS_AND_AFTER' | 'ALL') {
    setShowRecurringDeleteModal(false);
    await removeBlock(block.id, scope);
  }

  return (
    <>
      {/* Visual layer — pointer-events-none so drag passes through to slot cells */}
      <div
        className="absolute rounded px-1 overflow-hidden text-xs font-medium pointer-events-none"
        style={{
          top: topY,
          height,
          left: `calc(${colIndex} * (100% / 7) + 1px)`,
          width: `calc(100% / 7 - 2px)`,
          backgroundColor: color + 'cc',
          color: '#fff',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          zIndex: blockZIndex,
        }}
      >
        <span className="truncate block leading-[20px]">{isTeamBlock ? '🏷 팀' : (user?.name ?? '?')}</span>
        {block.description && (() => {
          const NAME_H = 20;
          const LINE_H = 14;
          const maxLines = Math.max(1, Math.floor((height - NAME_H) / LINE_H));
          return (
            <span
              className="block text-[10px] opacity-80 overflow-hidden"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: 'vertical',
                lineHeight: `${LINE_H}px`,
              } as React.CSSProperties}
            >
              {block.description}
            </span>
          );
        })()}
      </div>

      {/* Interaction overlay — hover tooltip for all blocks, right-click delete for owner only */}
      <div
        className="absolute pointer-events-auto"
        style={{
          top: topY,
          height,
          left: `calc(${colIndex} * (100% / 7) + 1px)`,
          width: `calc(100% / 7 - 2px)`,
          cursor: canDelete ? 'context-menu' : 'default',
          zIndex: blockZIndex + 10,
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onContextMenu={canDelete ? handleContextMenu : undefined}
      >
        {showTooltip && !contextMenu && (
          <div className="absolute z-30 left-full ml-1 top-0 w-44 bg-gray-800 text-white text-xs rounded p-2 shadow-lg pointer-events-none">
            <div className="font-semibold">{user?.name}</div>
            <div className="opacity-75">{block.startTime} – {block.endTime}</div>
            {block.description && <div className="mt-1 opacity-90">{block.description}</div>}
            {canDelete && <div className="mt-1 opacity-50 text-[10px]">우클릭으로 삭제</div>}
          </div>
        )}
      </div>

      {/* 반복 삭제 범위 선택 모달 */}
      {showRecurringDeleteModal && createPortal(
        <RecurringDeleteModal
          onSelect={handleRecurringDelete}
          onCancel={() => setShowRecurringDeleteModal(false)}
        />,
        document.body,
      )}

      {/* Context menu — portal to document.body */}
      {contextMenu && createPortal(
        <>
          <div
            className="fixed inset-0 z-40"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              onClick={handleDelete}
            >
              <span>🗑</span> 일정 삭제
            </button>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
