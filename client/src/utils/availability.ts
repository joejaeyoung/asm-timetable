import type { ScheduleBlock, TimeSlot } from '@/types';

const WORK_START = '00:00';
const WORK_END = '24:00';

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function toTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function getSharedAvailability(
  blocks: ScheduleBlock[],
  date: string,
  memberIds?: Set<string>,
): TimeSlot[] {
  const workStart = toMinutes(WORK_START);
  const workEnd = toMinutes(WORK_END);

  // 1. Filter blocks for this date (and optionally by visible member IDs)
  const dayBlocks = blocks.filter(
    (b) => b.date === date && (!memberIds || b.userId === null || memberIds.has(b.userId)),
  );

  if (dayBlocks.length === 0) {
    return [{ startTime: WORK_START, endTime: WORK_END }];
  }

  // 2. Convert to minute ranges, clamped to working hours
  const ranges = dayBlocks.map((b) => ({
    start: Math.max(toMinutes(b.startTime), workStart),
    end: Math.min(toMinutes(b.endTime), workEnd),
  }));

  // 3. Sort and merge overlapping ranges
  ranges.sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const r of ranges) {
    if (r.start >= r.end) continue; // skip invalid after clamping
    if (merged.length === 0 || r.start > merged[merged.length - 1].end) {
      merged.push({ ...r });
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, r.end);
    }
  }

  // 4. Find gaps within [workStart, workEnd]
  const gaps: TimeSlot[] = [];
  let cursor = workStart;
  for (const occ of merged) {
    if (occ.start > cursor) {
      gaps.push({ startTime: toTimeString(cursor), endTime: toTimeString(occ.start) });
    }
    cursor = Math.max(cursor, occ.end);
  }
  if (cursor < workEnd) {
    gaps.push({ startTime: toTimeString(cursor), endTime: toTimeString(workEnd) });
  }

  // 5. Filter slots shorter than 30 minutes
  return gaps.filter(
    (g) => toMinutes(g.endTime) - toMinutes(g.startTime) >= 30,
  );
}
