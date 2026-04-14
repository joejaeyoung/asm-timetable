import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/store/authStore';
import { useTeamStore } from '@/store/teamStore';
import { useScheduleStore } from '@/store/scheduleStore';
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

  const user = allUsers.find((u) => u.id === block.userId);
  const color = user?.color ?? '#ccc';
  const isOwner = currentUser?.id === block.userId;

  const startSlot = timeToSlot(block.startTime);
  const endSlot = timeToSlot(block.endTime);

  if (nightFolded && startSlot >= FOLD_START && endSlot <= FOLD_END) return null;

  const topY = slotToVisualY(startSlot, nightFolded);
  const bottomY = slotToVisualY(endSlot, nightFolded);
  const height = Math.max(bottomY - topY - 2, 4);

  function handleContextMenu(e: React.MouseEvent) {
    if (!isOwner) return;
    e.preventDefault();
    e.stopPropagation();
    setShowTooltip(false);
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  async function handleDelete() {
    await removeBlock(block.id);
    setContextMenu(null);
  }

  return (
    <>
      {/* Visual layer — pointer-events-none so drag passes through to slot cells */}
      <div
        className="absolute rounded px-1 overflow-hidden text-xs font-medium z-10 pointer-events-none"
        style={{
          top: topY,
          height,
          left: `calc(${colIndex} * (100% / 7) + 1px)`,
          width: `calc(100% / 7 - 2px)`,
          backgroundColor: color + 'cc',
          color: '#fff',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      >
        <span className="truncate block leading-[20px]">{user?.name ?? '?'}</span>
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

      {/* Interaction overlay — only for owner: hover tooltip + right-click delete */}
      {isOwner && (
        <div
          className="absolute z-20 pointer-events-auto"
          style={{
            top: topY,
            height,
            left: `calc(${colIndex} * (100% / 7) + 1px)`,
            width: `calc(100% / 7 - 2px)`,
            cursor: 'context-menu',
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onContextMenu={handleContextMenu}
        >
          {showTooltip && !contextMenu && (
            <div className="absolute z-30 left-full ml-1 top-0 w-44 bg-gray-800 text-white text-xs rounded p-2 shadow-lg pointer-events-none">
              <div className="font-semibold">{user?.name}</div>
              <div className="opacity-75">{block.startTime} – {block.endTime}</div>
              {block.description && <div className="mt-1 opacity-90">{block.description}</div>}
              <div className="mt-1 opacity-50 text-[10px]">우클릭으로 삭제</div>
            </div>
          )}
        </div>
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
