import { useEffect } from 'react';
import { useScheduleStore } from '@/store/scheduleStore';

export function useScheduleByMonth(teamId: string, month: string) {
  const fetchByMonth = useScheduleStore((s) => s.fetchByMonth);
  const blocks = useScheduleStore((s) => s.blocks);

  useEffect(() => {
    if (teamId) fetchByMonth(teamId, month);
  }, [teamId, month, fetchByMonth]);

  return blocks;
}

export function useScheduleByWeek(teamId: string, weekId: string) {
  const fetchByWeek = useScheduleStore((s) => s.fetchByWeek);
  const blocks = useScheduleStore((s) => s.blocks);

  useEffect(() => {
    if (teamId) fetchByWeek(teamId, weekId);
  }, [teamId, weekId, fetchByWeek]);

  return blocks;
}
