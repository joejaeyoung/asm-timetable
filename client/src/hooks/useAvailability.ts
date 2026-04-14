import { useScheduleStore } from '@/store/scheduleStore';
import { getSharedAvailability } from '@/utils/availability';
import type { TimeSlot } from '@/types';

export function useAvailability(date: string): TimeSlot[] {
  const blocks = useScheduleStore((s) => s.blocks);
  return getSharedAvailability(blocks, date);
}
