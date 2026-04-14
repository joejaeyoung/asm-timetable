import { format } from 'date-fns';
import { weekIdFromDate } from '@/utils/calendar';

interface Props {
  weekId: string;
  days: Date[];
  onClick: () => void;
}

export default function WeekCell({ weekId, days, onClick }: Props) {
  const today = new Date();
  const currentWeekId = weekIdFromDate(today);
  const isCurrentWeek = weekId === currentWeekId;

  const first = days[0];
  const last = days[6];
  const rangeLabel =
    first.getMonth() === last.getMonth()
      ? `${format(first, 'MMM d')}–${format(last, 'd')}`
      : `${format(first, 'MMM d')}–${format(last, 'MMM d')}`;

  const weekNum = weekId.split('-W')[1];

  return (
    <div
      className={`px-2 py-1 cursor-pointer text-left rounded hover:bg-blue-50 transition-colors ${
        isCurrentWeek ? 'bg-blue-50 font-semibold' : ''
      }`}
      onClick={onClick}
    >
      <span className="text-xs text-gray-500">W{weekNum} · {rangeLabel}</span>
    </div>
  );
}
