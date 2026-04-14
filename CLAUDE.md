# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# CLAUDE.md — Harness Engineering Schedule Manager

## Purpose
Web-based team schedule management tool.
Identify shared availability by visualizing each member's schedule in one place.

## Tech Stack
| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18 + TypeScript + Vite      |
| Styling    | Tailwind CSS                      |
| State      | Zustand                           |
| Backend    | Spring Boot 3 (REST API)          |
| Database   | MySQL + JPA                       |
| Auth       | 개인 계정 (이메일 기반, mock: 이메일 조회) |

## Project Structure
```
/
├── client/
│   └── src/
│       ├── components/
│       │   ├── calendar/       # MonthlyCalendar, WeekCell, DayCell
│       │   ├── timetable/      # WeeklyTimetable, DragBlock, DescriptionModal
│       │   ├── availability/   # AvailabilityList
│       │   └── layout/         # AppLayout, Header
│       ├── store/
│       │   ├── authStore.ts    # 로그인/회원가입 (currentUser)
│       │   ├── teamStore.ts    # 팀 목록, 팀원, 초대/삭제
│       │   └── scheduleStore.ts
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── MyTeamsPage.tsx
│       │   └── TeamSettingsPage.tsx
│       ├── hooks/              # useSchedule, useDrag, useAvailability
│       ├── lib/
│       │   └── api.ts
│       ├── types/index.ts
│       └── utils/
│           ├── calendar.ts
│           └── availability.ts  # Single source of truth for slot logic
└── server/
    └── src/main/java/harness/schedule/
        ├── controller/
        ├── service/
        ├── repository/
        └── dto/
```

## Route Structure
| 경로 | 페이지 |
|------|--------|
| `/login` | LoginPage — 이메일 로그인 |
| `/register` | RegisterPage — 신규 계정 |
| `/teams` | MyTeamsPage — 내 팀 목록 |
| `/teams/:teamId/settings` | TeamSettingsPage — 팀원 초대/삭제 |
| `/teams/:teamId/calendar/:year/:month` | MonthlyCalendar |
| `/teams/:teamId/week/:weekId` | WeeklyTimetable |

## Shared TypeScript Types
```typescript
// client/src/types/index.ts

export interface User {
  id: string;
  name: string;
  color: string;       // hex e.g. '#4A90E2'
  email: string;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  description?: string;
  createdAt: string;
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
```

## Color System
Colors are stored on User. Always read from `teamStore.allUsers` — never hardcode in components.
Default palette exported from `authStore.ts` as `COLOR_PALETTE`.

## Global Conventions
- All components must be fully typed — no `any`
- Data fetching lives in custom hooks only, never inside components directly
- Derived state (availability) is always computed on the fly — never stored in DB
- Drag snaps to **30-minute slots**
- Working hours: **00:00 – 24:00** (새벽 02–06 fold 기능)
- User colors are read from `teamStore.allUsers` — never hardcode in components
- **팀원 추가/삭제는 TeamSettingsPage에서만** — 스케줄 뷰(AppLayout)에서 절대 금지

## Feature Docs
| Feature              | File                              |
|----------------------|-----------------------------------|
| Auth / Login         | `docs/claude/AUTH.md`             |
| Teams system         | `docs/claude/TEAMS.md`            |
| Monthly calendar     | `docs/claude/CALENDAR.md`         |
| Weekly timetable     | `docs/claude/TIMETABLE.md`        |
| Availability logic   | `docs/claude/AVAILABILITY.md`     |
| DB / API             | `docs/claude/DATA.md`             |
| Work log             | `docs/claude/WORKLOG.md`          |

## Do NOT
- Fetch data directly in components
- Store computed availability in the database
- Hardcode user colors in components
- Use `any` type
- Add team member management UI inside schedule views (AppLayout children)
- Use old `memberStore` login/logout — use `authStore` instead
