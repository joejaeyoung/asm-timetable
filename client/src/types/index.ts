export interface User {
  id: string;
  name: string;
  color: string; // hex e.g. '#4A90E2'
  email: string;
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
  userId: string;      // 블록 소유자 (구 memberId)
  teamId: string;
  date: string;        // 'YYYY-MM-DD'
  startTime: string;   // 'HH:MM'
  endTime: string;     // 'HH:MM'
  description?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface WeekRow {
  weekId: string;  // 'YYYY-W##'
  days: Date[];    // 7 days, Mon–Sun
}
