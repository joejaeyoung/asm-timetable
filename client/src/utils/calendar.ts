import type { WeekRow } from '@/types';
import { getISOWeek, getISOWeekYear, startOfISOWeek, addDays } from 'date-fns';

export function getWeeksInMonth(year: number, month: number): WeekRow[] {
  // month is 0-indexed (0 = January)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Walk from the Monday of the first day's week to the last day
  const startMonday = startOfISOWeek(firstDay);
  const rows: WeekRow[] = [];

  let cursor = startMonday;
  while (cursor <= lastDay) {
    const days: Date[] = Array.from({ length: 7 }, (_, i) => addDays(cursor, i));
    const isoWeek = getISOWeek(cursor);
    const isoYear = getISOWeekYear(cursor);
    const weekId = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
    rows.push({ weekId, days });
    cursor = addDays(cursor, 7);
  }

  return rows;
}

export function weekIdFromDate(date: Date): string {
  const isoWeek = getISOWeek(date);
  const isoYear = getISOWeekYear(date);
  return `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
}

/** Parse 'YYYY-W##' → Monday Date of that week */
export function mondayOfWeekId(weekId: string): Date {
  const [yearStr, weekPart] = weekId.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekPart, 10);

  // Jan 4 is always in week 1 of the ISO year
  const jan4 = new Date(year, 0, 4);
  const monday1 = startOfISOWeek(jan4);
  return addDays(monday1, (week - 1) * 7);
}

export function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });
}

export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
