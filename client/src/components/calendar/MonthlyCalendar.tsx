import { useNavigate, useParams } from 'react-router-dom';
import { useScheduleByMonth } from '@/hooks/useSchedule';
import { getWeeksInMonth, formatMonthLabel, weekIdFromDate, formatDateStr } from '@/utils/calendar';
import WeekCell from './WeekCell';
import DayCell from './DayCell';
import type { ScheduleBlock } from '@/types';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export default function MonthlyCalendar() {
  const navigate = useNavigate();
  const params = useParams<{ teamId: string; year: string; month: string }>();
  const teamId = params.teamId ?? '';

  const now = new Date();
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
  // URL month is 1-indexed, Date month is 0-indexed
  const month = params.month ? parseInt(params.month, 10) - 1 : now.getMonth();

  const monthParam = `${year}-${String(month + 1).padStart(2, '0')}`;
  const blocks = useScheduleByMonth(teamId, monthParam);
  const weeks = getWeeksInMonth(year, month);

  function goToPrev() {
    const d = new Date(year, month - 1, 1);
    navigate(`/teams/${teamId}/calendar/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  function goToNext() {
    const d = new Date(year, month + 1, 1);
    navigate(`/teams/${teamId}/calendar/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  function blocksForDate(date: Date): ScheduleBlock[] {
    const dateStr = formatDateStr(date);
    return blocks.filter((b) => b.date === dateStr);
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrev}
          className="px-3 py-1 rounded hover:bg-gray-100 text-gray-600"
        >
          ‹
        </button>
        <h1 className="text-xl font-semibold text-gray-800">
          {formatMonthLabel(year, month)}
        </h1>
        <button
          onClick={goToNext}
          className="px-3 py-1 rounded hover:bg-gray-100 text-gray-600"
        >
          ›
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-[80px_repeat(7,1fr)] mb-1">
        <div />
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center text-xs font-medium text-gray-500 py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week) => (
        <div
          key={week.weekId}
          className="grid grid-cols-[80px_repeat(7,1fr)] border-t border-gray-100"
        >
          {/* Week label */}
          <WeekCell
            weekId={week.weekId}
            days={week.days}
            onClick={() => navigate(`/teams/${teamId}/week/${week.weekId}`)}
          />

          {/* Day cells */}
          {week.days.map((day) => (
            <DayCell
              key={day.toISOString()}
              date={day}
              blocks={blocksForDate(day)}
              weekId={weekIdFromDate(day)}
              onNavigate={(wid) => navigate(`/teams/${teamId}/week/${wid}`)}
              isCurrentMonth={day.getMonth() === month}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
