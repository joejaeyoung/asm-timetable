export interface User {
  id: string;
  name: string;
  color: string; // hex e.g. '#4A90E2'
  email: string;
  virtualUser?: boolean; // 팀 일정 가상 유저
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  description?: string;
  createdAt: string; // ISO string
}

export interface TeamMembership {
  teamId: string;
  userId: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface ScheduleBlock {
  id: string;
  userId: string;
  teamId: string;
  date: string;        // 'YYYY-MM-DD'
  startTime: string;   // 'HH:MM'
  endTime: string;     // 'HH:MM'
  description?: string;
  recurrenceGroupId?: string | null;
  recurrenceIndex?: number;
}

// ISO 요일: 1=월, 2=화, ..., 7=일
export type RecurrenceDayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface RecurrenceRule {
  daysOfWeek: RecurrenceDayOfWeek[];
  endCondition: 'date' | 'count';
  endDate?: string;      // 'YYYY-MM-DD'
  occurrences?: number;  // 2–52
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface WeekRow {
  weekId: string;  // 'YYYY-W##'
  days: Date[];    // 7 days, Mon–Sun
}
