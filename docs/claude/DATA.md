# Data Layer

## Database Schema (MySQL)
```sql
CREATE TABLE users (
  id         VARCHAR(36) PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  color      VARCHAR(7) NOT NULL,   -- hex e.g. '#4A90E2', must be unique
  email      VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teams (
  id          VARCHAR(36) PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  owner_id    VARCHAR(36) NOT NULL REFERENCES users(id),
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_memberships (
  team_id    VARCHAR(36) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id    VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       ENUM('owner', 'member') NOT NULL DEFAULT 'member',
  joined_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE schedule_blocks (
  id          VARCHAR(36) PRIMARY KEY,
  user_id     VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id     VARCHAR(36) NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedule_date        ON schedule_blocks(date);
CREATE INDEX idx_schedule_team_date   ON schedule_blocks(team_id, date);
CREATE INDEX idx_schedule_user_date   ON schedule_blocks(user_id, date);
```

## API Endpoints (Spring Boot) — Phase 6·7에서 구현

### Auth
```
POST /api/auth/register    → Create user account
POST /api/auth/login       → Login (returns user info)
```

### Teams
```
GET  /api/teams            → List teams for current user
POST /api/teams            → Create team
DELETE /api/teams/:id      → Delete team (owner only)

GET  /api/teams/:id/members         → List team members
POST /api/teams/:id/members         → Invite member (force invite)
DELETE /api/teams/:id/members/:uid  → Remove member (owner only)
```

### Schedule
```
GET  /api/schedule?teamId=&month=YYYY-MM  → Blocks for month
GET  /api/schedule?teamId=&week=YYYY-W##  → Blocks for week
POST /api/schedule                         → Create block
PUT  /api/schedule/:id                     → Update block
DELETE /api/schedule/:id                   → Delete block
```

### Request / Response Shapes
```typescript
// POST /api/schedule
type CreateBlockRequest = {
  userId: string;
  teamId: string;
  date: string;        // 'YYYY-MM-DD'
  startTime: string;   // 'HH:MM'
  endTime: string;     // 'HH:MM'
  description?: string;
}

// Response (all block endpoints)
type ScheduleBlockResponse = ScheduleBlock; // see types/index.ts
```

## Zustand Store Shape
```typescript
// store/authStore.ts
type AuthStore = {
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  register: (data: Omit<User, 'id'>) => Promise<User>;
}

// store/teamStore.ts
type TeamStore = {
  allUsers: User[];
  teams: Team[];
  memberships: TeamMembership[];
  currentTeamId: string | null;
  fetchMyTeams: (userId: string) => Promise<void>;
  createTeam: (name: string, description?: string) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  inviteMember: (teamId: string, email: string) => Promise<void>;
  removeMember: (teamId: string, userId: string) => Promise<void>;
  setCurrentTeam: (teamId: string) => void;
  getTeamMembers: (teamId: string) => User[];
}

// store/scheduleStore.ts
type ScheduleStore = {
  blocks: ScheduleBlock[];
  fetchByMonth: (teamId: string, month: string) => Promise<void>;
  fetchByWeek:  (teamId: string, weekId: string) => Promise<void>;
  upsertBlock:  (block: ScheduleBlock) => void;
  removeBlock:  (id: string) => void;
}
```

## Do NOT
- Store computed availability in DB
- Fetch schedule without teamId scope
- Call backend directly from components — use custom hooks
