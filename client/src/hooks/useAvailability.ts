import { useScheduleStore } from '@/store/scheduleStore';
import { getSharedAvailability } from '@/utils/availability';
import type { TimeSlot } from '@/types';

export function useAvailability(date: string, memberIds?: Set<string>): TimeSlot[] {
  const blocks = useScheduleStore((s) => s.blocks);
  return getSharedAvailability(blocks, date, memberIds);
}
