import { useState, useCallback } from 'react';
import { useScheduleStore } from '@/store/scheduleStore';
import { useTeamStore } from '@/store/teamStore';

export interface DragState {
  isDragging: boolean;
  startSlot: string | null; // 'YYYY-MM-DD HH:MM'
  endSlot: string | null;
  currentUserId: string;
}

export function snapToSlot(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const snapped = m < 30 ? 0 : 30;
  return `${String(h).padStart(2, '0')}:${String(snapped).padStart(2, '0')}`;
}

/** Check if two time ranges overlap (exclusive end) */
function hasOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function useDrag(userId: string) {
  const blocks = useScheduleStore((s) => s.blocks);
  const allUsers = useTeamStore((s) => s.allUsers);
  const [drag, setDrag] = useState<DragState>({
    isDragging: false,
    startSlot: null,
    endSlot: null,
    currentUserId: userId,
  });

  // 'YYYY-MM-DD HH:MM' slot string
  const startDrag = useCallback((slot: string) => {
    setDrag({ isDragging: true, startSlot: slot, endSlot: slot, currentUserId: userId });
  }, [userId]);

  const moveDrag = useCallback((slot: string) => {
    setDrag((prev) => prev.isDragging ? { ...prev, endSlot: slot } : prev);
  }, []);

  const endDrag = useCallback((): { date: string; startTime: string; endTime: string; teamConflict: boolean } | null => {
    if (!drag.startSlot || !drag.endSlot) {
      setDrag((p) => ({ ...p, isDragging: false }));
      return null;
    }

    const [dateA, timeA] = drag.startSlot.split(' ');
    const [, timeB] = drag.endSlot.split(' ');

    // Ensure start < end
    const startTime = timeA <= timeB ? timeA : timeB;
    const endRaw = timeA <= timeB ? timeB : timeA;

    // Add 30 min to end slot (slot represents the start of the 30-min cell)
    const [eh, em] = endRaw.split(':').map(Number);
    const endMinutes = eh * 60 + em + 30;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    // Overlap check against same user's blocks
    const conflict = blocks.some(
      (b) =>
        b.userId === userId &&
        b.date === dateA &&
        hasOverlap(startTime, endTime, b.startTime, b.endTime),
    );

    setDrag({ isDragging: false, startSlot: null, endSlot: null, currentUserId: userId });

    if (conflict) return null;

    const teamConflict = blocks.some(
      (b) =>
        b.date === dateA &&
        (allUsers.find((u) => u.id === b.userId)?.virtualUser ?? false) &&
        hasOverlap(startTime, endTime, b.startTime, b.endTime),
    );

    return { date: dateA, startTime, endTime, teamConflict };
  }, [drag, userId, blocks, allUsers]);

  const cancelDrag = useCallback(() => {
    setDrag({ isDragging: false, startSlot: null, endSlot: null, currentUserId: userId });
  }, [userId]);

  return { drag, startDrag, moveDrag, endDrag, cancelDrag };
}
