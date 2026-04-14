import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { mondayOfWeekId, weekIdFromDate, formatDateStr } from '@/utils/calendar';
import { snapToSlot, useDrag } from '@/hooks/useDrag';
import { useScheduleByWeek } from '@/hooks/useSchedule';
import { useAuthStore } from '@/store/authStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { useTeamStore } from '@/store/teamStore';
import DragBlock from './DragBlock';
import DescriptionModal from './DescriptionModal';
import MemberFilterDropdown from './MemberFilterDropdown';
import AvailabilityList from '@/components/availability/AvailabilityList';
import type { ScheduleBlock, RecurrenceRule } from '@/types';

const SLOT_HEIGHT = 32;
const WORK_START = 0;
const WORK_END = 24;
const TOTAL_SLOTS = (WORK_END - WORK_START) * 2; // 48

const FOLD_START = 4;   // slot index: 02:00
const FOLD_END = 12;    // slot index: 06:00
const FOLD_H = 28;      // height of collapsed fold bar (px)

function formatWeekLabel(weekId: string, monday: Date): string {
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const [year, week] = weekId.split('-');
  return `${year}-${month}-${week}`;
}

function slotLabel(index: number): string {
  const totalMins = index * 30;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getVisualY(slot: number, folded: boolean): number {
  if (slot < FOLD_START) return slot * SLOT_HEIGHT;
  if (folded) return FOLD_START * SLOT_HEIGHT + FOLD_H + (slot - FOLD_END) * SLOT_HEIGHT;
  return slot * SLOT_HEIGHT;
}

function getGridHeight(folded: boolean): number {
  if (folded) return FOLD_START * SLOT_HEIGHT + FOLD_H + (TOTAL_SLOTS - FOLD_END) * SLOT_HEIGHT;
  return TOTAL_SLOTS * SLOT_HEIGHT;
}

function slotForCell(date: Date, slotIndex: number): string {
  return `${formatDateStr(date)} ${slotLabel(slotIndex)}`;
}

export default function WeeklyTimetable() {
  const navigate = useNavigate();
  const { teamId, weekId } = useParams<{ teamId: string; weekId: string }>();
  const [nightFolded, setNightFolded] = useState(true);

  const currentUser = useAuthStore((s) => s.currentUser);
  const upsertBlock = useScheduleStore((s) => s.upsertBlock);
  const createRecurringBlocks = useScheduleStore((s) => s.createRecurringBlocks);
  const getTeamMembers = useTeamStore((s) => s.getTeamMembers);

  const effectiveTeamId = teamId ?? '';
  const effectiveWeekId = weekId ?? weekIdFromDate(new Date());
  const monday = mondayOfWeekId(effectiveWeekId);

  const teamMembers = getTeamMembers(effectiveTeamId);
  const [visibleMemberIds, setVisibleMemberIds] = useState<Set<string>>(
    () => new Set(teamMembers.map((m) => m.id)),
  );
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const blocks = useScheduleByWeek(effectiveTeamId, effectiveWeekId);
  const { drag, startDrag, moveDrag, endDrag, cancelDrag } = useDrag(currentUser?.id ?? '');

  const [pendingBlock, setPendingBlock] = useState<{
    date: string; startTime: string; endTime: string;
  } | null>(null);

  function handleMouseDown(date: Date, slotIndex: number) {
    if (!currentUser) return;
    startDrag(slotForCell(date, slotIndex));
  }

  function handleMouseMove(date: Date, slotIndex: number) {
    if (!drag.isDragging) return;
    moveDrag(slotForCell(date, slotIndex));
  }

  function handleMouseUp() {
    const result = endDrag();
    if (result) setPendingBlock(result);
  }

  async function handleModalConfirm(description: string, recurrence: RecurrenceRule | null) {
    if (!pendingBlock || !currentUser) return;

    if (recurrence) {
      await createRecurringBlocks({
        userId: currentUser.id,
        teamId: effectiveTeamId,
        startDate: pendingBlock.date,
        startTime: pendingBlock.startTime,
        endTime: pendingBlock.endTime,
        description,
        rule: recurrence,
      });
    } else {
      const newBlock: ScheduleBlock = {
        id: `local-${Date.now()}`,
        userId: currentUser.id,
        teamId: effectiveTeamId,
        ...pendingBlock,
        description,
      };
      await upsertBlock(newBlock);
    }
    setPendingBlock(null);
  }

  function isDragHighlighted(date: Date, slotIndex: number): boolean {
    if (!drag.isDragging || !drag.startSlot || !drag.endSlot) return false;
    const slot = slotForCell(date, slotIndex);
    const [min, max] = drag.startSlot <= drag.endSlot
      ? [drag.startSlot, drag.endSlot]
      : [drag.endSlot, drag.startSlot];
    return slot >= min && slot <= max;
  }

  const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
  const gridHeight = getGridHeight(nightFolded);

  // Slot indices to render interactively (exclude hidden fold range)
  const visibleSlots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i)
    .filter((i) => !nightFolded || i < FOLD_START || i >= FOLD_END);

  return (
    <div
      className="max-w-5xl mx-auto p-4 select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={cancelDrag}
    >
      {/* Navigation header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(`/teams/${effectiveTeamId}/calendar/${monday.getFullYear()}/${String(monday.getMonth() + 1).padStart(2, '0')}`)}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← 캘린더로
        </button>
        <h1 className="text-lg font-semibold text-gray-800">
          {formatWeekLabel(effectiveWeekId, monday)}
        </h1>
        {/* 현재 사용자 표시 + 팀원 필터 */}
        <div className="flex items-center gap-3">
          {teamMembers.length > 1 && (
            <MemberFilterDropdown
              members={teamMembers}
              visibleIds={visibleMemberIds}
              onChange={setVisibleMemberIds}
            />
          )}
          {currentUser && (
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold"
                style={{ backgroundColor: currentUser.color }}
              >
                {currentUser.name[0]}
              </span>
              <span className="text-sm text-gray-600">{currentUser.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Availability row */}
      <div className="flex mb-1">
        <div className="w-14 shrink-0" />
        {days.map((day, i) => (
          <div key={i} className="flex-1 border border-gray-100 rounded">
            <AvailabilityList date={formatDateStr(day)} memberIds={visibleMemberIds} />
          </div>
        ))}
      </div>

      {/* Day header */}
      <div className="flex items-end">
        <div className="w-14 shrink-0" />
        <div className="flex-1 flex">
          {days.map((day, i) => {
            const today = new Date();
            const isToday =
              day.getFullYear() === today.getFullYear() &&
              day.getMonth() === today.getMonth() &&
              day.getDate() === today.getDate();
            return (
              <div key={i} className="flex-1 text-center py-1">
                <div className="text-xs text-gray-500">{DAY_LABELS[i]}</div>
                <div className={`text-sm font-medium mx-auto w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-blue-500 text-white' : 'text-gray-800'
                }`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Night-hours fold toggle */}
      <div className="flex justify-end mb-1">
        <button
          onClick={() => setNightFolded(!nightFolded)}
          className="text-[11px] text-gray-400 hover:text-blue-500 transition-colors"
        >
          {nightFolded ? '▸ 새벽 시간 (02–06시) 펼치기' : '▴ 새벽 시간 접기'}
        </button>
      </div>

      {/* Timetable grid */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden">

        {/* Time labels */}
        <div className="w-14 shrink-0 border-r border-gray-200 bg-gray-50 relative" style={{ height: gridHeight }}>
          {visibleSlots.map((i) => (
            <div
              key={i}
              className="absolute text-[10px] text-gray-400 pr-1 text-right w-full"
              style={{ top: getVisualY(i, nightFolded), height: SLOT_HEIGHT, lineHeight: `${SLOT_HEIGHT}px` }}
            >
              {i % 2 === 0 ? slotLabel(i) : ''}
            </div>
          ))}

          {/* Fold bar in time labels */}
          <div
            className="absolute w-full flex items-center justify-center border-y border-gray-200 bg-gray-100 z-10"
            style={{ top: FOLD_START * SLOT_HEIGHT, height: FOLD_H }}
          >
            <span className="text-[10px] text-gray-400">🌙</span>
          </div>
        </div>

        {/* Grid columns */}
        <div className="flex-1 relative" style={{ height: gridHeight }}>

          {/* Horizontal grid lines */}
          {visibleSlots.map((i) => (
            <div
              key={i}
              className={`absolute w-full border-t pointer-events-none ${
                i % 2 === 0 ? 'border-gray-200' : 'border-gray-100'
              }`}
              style={{ top: getVisualY(i, nightFolded) }}
            />
          ))}

          {/* Fold bar in grid */}
          {nightFolded && (
            <div
              className="absolute w-full z-10 bg-slate-50 border-y border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors"
              style={{ top: FOLD_START * SLOT_HEIGHT, height: FOLD_H }}
              onClick={() => setNightFolded(false)}
            >
              <span className="text-[11px] text-slate-400">02:00 – 06:00  ▸ 펼치기</span>
            </div>
          )}

          {/* DragBlocks */}
          <div className="absolute inset-0 pointer-events-none">
            {blocks
              .filter((block) => visibleMemberIds.has(block.userId))
              .map((block) => {
                const colIndex = days.findIndex((d) => formatDateStr(d) === block.date);
                if (colIndex < 0) return null;
                return (
                  <DragBlock key={block.id} block={block} colIndex={colIndex} nightFolded={nightFolded} />
                );
              })}
          </div>

          {/* Interactive slot cells */}
          <div className="flex absolute inset-0">
            {days.map((day, colIdx) => (
              <div key={colIdx} className="flex-1 relative border-r border-gray-100 last:border-r-0">
                {visibleSlots.map((slotIdx) => (
                  <div
                    key={slotIdx}
                    className={`absolute w-full cursor-crosshair transition-colors ${
                      isDragHighlighted(day, slotIdx) ? 'bg-blue-100' : 'hover:bg-gray-50'
                    }`}
                    style={{ top: getVisualY(slotIdx, nightFolded), height: SLOT_HEIGHT }}
                    onMouseDown={() => handleMouseDown(day, slotIdx)}
                    onMouseMove={() => handleMouseMove(day, slotIdx)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description modal */}
      {pendingBlock && (
        <DescriptionModal
          dateLabel={format(new Date(pendingBlock.date), 'M월 d일')}
          startTime={snapToSlot(pendingBlock.startTime)}
          endTime={pendingBlock.endTime}
          dayOfWeek={new Date(pendingBlock.date).getDay()}
          onConfirm={handleModalConfirm}
          onCancel={() => setPendingBlock(null)}
        />
      )}
    </div>
  );
}
