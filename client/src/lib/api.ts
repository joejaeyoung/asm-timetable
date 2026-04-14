import type { User, Team, ScheduleBlock, RecurrenceRule } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ── Auth user ID (set on login, cleared on logout) ────────────────────────────
let _authUserId: string | null = null;
export function setAuthUserId(id: string | null) {
  _authUserId = id;
}

// ── API Error ─────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ── Backend response types (mapped from server DTOs) ─────────────────────────
export interface TeamMemberApiResponse {
  user: User;
  teamId: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

// ── Request helper ────────────────────────────────────────────────────────────
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(_authUserId ? { 'X-User-Id': _authUserId } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string> | undefined) },
  });

  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── API client ────────────────────────────────────────────────────────────────
export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login: (email: string) =>
    request<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  register: (data: Omit<User, 'id'>) =>
    request<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Teams ─────────────────────────────────────────────────────────────────
  getMyTeams: (userId: string) =>
    request<Team[]>(`/api/teams?userId=${encodeURIComponent(userId)}`),

  createTeam: (name: string, description?: string) =>
    request<Team>('/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  deleteTeam: (teamId: string) =>
    request<void>(`/api/teams/${teamId}`, { method: 'DELETE' }),

  getTeamMembers: (teamId: string) =>
    request<TeamMemberApiResponse[]>(`/api/teams/${teamId}/members`),

  inviteMember: (teamId: string, email: string) =>
    request<TeamMemberApiResponse>(`/api/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  removeMember: (teamId: string, userId: string) =>
    request<void>(`/api/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),

  // ── Schedule ──────────────────────────────────────────────────────────────
  getScheduleByMonth: (teamId: string, month: string) =>
    request<ScheduleBlock[]>(`/api/schedule?teamId=${encodeURIComponent(teamId)}&month=${month}`),

  getScheduleByWeek: (teamId: string, weekId: string) =>
    request<ScheduleBlock[]>(`/api/schedule?teamId=${encodeURIComponent(teamId)}&week=${weekId}`),

  createBlock: (body: Omit<ScheduleBlock, 'id'>) =>
    request<ScheduleBlock>('/api/schedule', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateBlock: (id: string, body: Partial<Omit<ScheduleBlock, 'id' | 'userId' | 'teamId'>>) =>
    request<ScheduleBlock>(`/api/schedule/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteBlock: (id: string) =>
    request<void>(`/api/schedule/${id}`, { method: 'DELETE' }),

  createRecurringBlocks: (body: Omit<ScheduleBlock, 'id' | 'recurrenceGroupId' | 'recurrenceIndex'> & RecurrenceRule & { startDate: string }) =>
    request<ScheduleBlock[]>('/api/schedule/recurring', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteBlockWithScope: (id: string, scope: 'THIS_ONLY' | 'THIS_AND_AFTER' | 'ALL') =>
    request<void>(`/api/schedule/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ scope }),
    }),
};
