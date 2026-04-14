# Teams Feature

## Overview
사용자는 여러 팀에 속할 수 있음. 팀별로 스케줄을 독립적으로 관리.
팀 초대는 강제 초대 (거절 불가). 팀 삭제는 owner만 가능.

## Data Model

```typescript
interface Team {
  id: string;
  name: string;
  ownerId: string;      // User.id
  description?: string;
  createdAt: string;    // ISO string
}

interface TeamMembership {
  teamId: string;
  userId: string;
  role: 'owner' | 'member';
  joinedAt: string;
}
```

## Store: `teamStore.ts`

```typescript
interface TeamStore {
  allUsers: User[];           // 앱 내 모든 유저 (DragBlock 색상 조회용)
  teams: Team[];              // 현재 로그인 유저가 속한 팀 목록
  memberships: TeamMembership[];  // 전체 팀-유저 관계
  currentTeamId: string | null;

  fetchMyTeams: (userId: string) => Promise<void>;
  createTeam: (name: string, description?: string) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  inviteMember: (teamId: string, email: string) => Promise<void>; // 강제 초대
  removeMember: (teamId: string, userId: string) => Promise<void>;
  setCurrentTeam: (teamId: string) => void;

  getTeamMembers: (teamId: string) => User[];   // 파생 데이터
  getCurrentTeam: () => Team | null;
}
```

## Routes

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/teams` | `MyTeamsPage` | 내가 속한 팀 목록, 팀 생성 |
| `/teams/:teamId/settings` | `TeamSettingsPage` | 팀원 목록(읽기전용) + 초대 + 삭제 |
| `/teams/:teamId/calendar/:year/:month` | `MonthlyCalendar` | 해당 팀 월간 캘린더 |
| `/teams/:teamId/week/:weekId` | `WeeklyTimetable` | 해당 팀 주간 타임테이블 |

## 팀 초대 플로우
1. `TeamSettingsPage` → 이메일 입력 (owner만 접근 가능)
2. `teamStore.inviteMember(teamId, email)` 호출
3. Mock: `allUsers`에서 이메일 조회 → 없으면 에러
4. 이미 멤버이면 에러
5. `memberships`에 즉시 추가 (강제 초대, 거절 불가)

## 팀 삭제 플로우
1. `TeamSettingsPage` → "팀 삭제" 버튼 (owner만 표시)
2. 확인 다이얼로그 → 확인 시 `teamStore.deleteTeam(teamId)` 호출
3. `teams` 목록에서 제거 + 관련 `memberships` 제거
4. `/teams`로 이동

## 스케줄 뷰와의 분리
- `AppLayout` (calendar, timetable) 하위에서는 팀원 추가/삭제 UI 없음
- Header의 "팀 설정" 링크만 제공 → `TeamSettingsPage`로 이동
- 스케줄 블록 생성 시 팀원 변경 불가 (로그인 유저 본인만)

## Mock 데이터
```typescript
// teamStore.ts
const MOCK_USERS: User[] = [
  { id: 'u1', name: '김민준', email: 'minjun@harness.io', color: '#4A90E2' },
  { id: 'u2', name: '이서연', email: 'seoyeon@harness.io', color: '#E25C5C' },
  { id: 'u3', name: '박지호', email: 'jiho@harness.io', color: '#50C878' },
  { id: 'u4', name: '최유나', email: 'yuna@harness.io', color: '#F5A623' },
  { id: 'u5', name: '정태양', email: 'taeyang@harness.io', color: '#9B59B6' },
];

const MOCK_TEAMS: Team[] = [
  { id: 't1', name: '개발팀', ownerId: 'u1', createdAt: '2026-01-01T00:00:00Z' },
  { id: 't2', name: '디자인팀', ownerId: 'u2', createdAt: '2026-01-15T00:00:00Z' },
];

const MOCK_MEMBERSHIPS: TeamMembership[] = [
  { teamId: 't1', userId: 'u1', role: 'owner', joinedAt: '2026-01-01T00:00:00Z' },
  { teamId: 't1', userId: 'u2', role: 'member', joinedAt: '2026-01-02T00:00:00Z' },
  { teamId: 't1', userId: 'u3', role: 'member', joinedAt: '2026-01-03T00:00:00Z' },
  { teamId: 't2', userId: 'u2', role: 'owner', joinedAt: '2026-01-15T00:00:00Z' },
  { teamId: 't2', userId: 'u4', role: 'member', joinedAt: '2026-01-16T00:00:00Z' },
];
```

## Do NOT
- 스케줄 뷰(AppLayout)에서 팀원 추가/삭제 UI 표시
- 초대 거절 기능 구현 (강제 초대 정책)
- owner 아닌 멤버에게 초대/삭제/팀삭제 버튼 노출
