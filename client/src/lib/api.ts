import type { User, Team, ScheduleBlock, RecurrenceRule } from '@/types';

// 프로덕션: VITE_API_URL='' → 상대경로 → Nginx 프록시 경유 (same-origin, CORS 없음)
// 로컬 dev: VITE_API_URL 미설정 → undefined → 'http://localhost:8080' 폴백
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

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

// ── Midnight normalization ────────────────────────────────────────────────────
// "24:00" is used internally in the frontend (correct string ordering + rendering)
// but Java LocalTime only supports 00:00–23:59, so we convert at API boundaries.

/** Frontend→Backend: "24:00" → "00:00" */
function denormalizeTime(t: string): string {
  return t === '24:00' ? '00:00' : t;
}

/** Backend→Frontend: endTime "00:00" → "24:00" (means end-of-day) */
function normalizeBlock(b: ScheduleBlock): ScheduleBlock {
  return b.endTime === '00:00' ? { ...b, endTime: '24:00' } : b;
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
    request<ScheduleBlock[]>(`/api/schedule?teamId=${encodeURIComponent(teamId)}&month=${month}`)
      .then((blocks) => blocks.map(normalizeBlock)),

  getScheduleByWeek: (teamId: string, weekId: string) =>
    request<ScheduleBlock[]>(`/api/schedule?teamId=${encodeURIComponent(teamId)}&week=${weekId}`)
      .then((blocks) => blocks.map(normalizeBlock)),

  createBlock: (body: Omit<ScheduleBlock, 'id'>) =>
    request<ScheduleBlock>('/api/schedule', {
      method: 'POST',
      body: JSON.stringify({ ...body, endTime: denormalizeTime(body.endTime) }),
    }).then(normalizeBlock),

  updateBlock: (id: string, body: Partial<Omit<ScheduleBlock, 'id' | 'userId' | 'teamId'>>) =>
    request<ScheduleBlock>(`/api/schedule/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...body,
        ...(body.endTime ? { endTime: denormalizeTime(body.endTime) } : {}),
      }),
    }).then(normalizeBlock),

  deleteBlock: (id: string) =>
    request<void>(`/api/schedule/${id}`, { method: 'DELETE' }),

  createRecurringBlocks: (body: Omit<ScheduleBlock, 'id' | 'recurrenceGroupId' | 'recurrenceIndex'> & RecurrenceRule & { startDate: string }) =>
    request<ScheduleBlock[]>('/api/schedule/recurring', {
      method: 'POST',
      body: JSON.stringify({ ...body, endTime: denormalizeTime(body.endTime) }),
    }).then((blocks) => blocks.map(normalizeBlock)),

  deleteBlockWithScope: (id: string, scope: 'THIS_ONLY' | 'THIS_AND_AFTER' | 'ALL') =>
    request<void>(`/api/schedule/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ scope }),
    }),
};
