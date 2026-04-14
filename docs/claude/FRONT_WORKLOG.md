# Work Log

## Phase 1–5 완료 (2026-04-14 이전)

### Phase 1: 프론트엔드 스캐폴딩
- Vite + React 18 + TypeScript + Tailwind CSS + Zustand 초기 설정
- react-router-dom 라우팅 구성
- 경로 별칭 `@/` → `client/src/`

### Phase 2: 타입 & 스토어 (Mock)
- `types/index.ts`: Member, ScheduleBlock, TimeSlot, WeekRow
- `store/memberStore.ts`: Mock 멤버 5명, login/logout/addMember/removeMember
- `store/scheduleStore.ts`: Mock 블록 3개, upsert/remove

### Phase 3: 월간 캘린더
- MonthlyCalendar, WeekCell, DayCell 컴포넌트
- `/calendar/:year/:month` 라우트
- 주간 행 클릭 → `/week/:weekId` 이동

### Phase 4: 주간 타임테이블 + 드래그
- WeeklyTimetable: 00:00–24:00, 30분 슬롯, 새벽 02–06시 fold 기능
- DragBlock, DescriptionModal, useDrag, MemberSelector
- 마우스 드래그로 스케줄 블록 생성 + 겹침 검사

### Phase 5: 공통 가용성
- AvailabilityList, useAvailability, utils/availability.ts
- 전체 팀원의 동시 공가 시간대 계산 (00:00–24:00 범위)

---

## Phase 8: 개인 계정 + 팀 시스템 (2026-04-14~)

### 배경
기존 구조는 멤버 선택 드롭다운으로 "로그인"하고, TeamPage에서 멤버를 직접 추가·삭제.
실제 개인 계정 + 다중 팀 구조가 필요하여 아키텍처 변경.

### 변경 사항 요약
- `Member` → `User` (개인 계정 개념 도입)
- `authStore.ts` 신규: 로그인/회원가입
- `teamStore.ts` 신규: 다중 팀, 강제 초대, 삭제
- 스케줄 뷰에서 팀원 변경 UI 제거 → TeamSettingsPage에서만 관리
- 라우트 팀 스코프로 변경 (`/teams/:teamId/calendar/...`)

---

## 현재 상태

| Phase | 내용 | 상태 |
|-------|------|------|
| 1 | 프론트엔드 스캐폴딩 | ✅ 완료 |
| 2 | 타입 & 스토어 (Mock) | ✅ 완료 |
| 3 | 월간 캘린더 | ✅ 완료 |
| 4 | 주간 타임테이블 + 드래그 | ✅ 완료 |
| 5 | 공통 가용성 | ✅ 완료 |
| 6 | Spring Boot 백엔드 | ⬜ 미완료 (나중에) |
| 7 | 프론트 ↔ 백엔드 연결 | ⬜ 미완료 (나중에) |
| 8 | 개인 계정 + 팀 시스템 | 🔄 진행 중 |

---

## 주요 의사결정 이력

| 날짜 | 결정 | 이유 |
|------|------|------|
| 2026-04-14 이전 | Supabase 제거 → MySQL + Spring Boot | 백엔드 직접 제어 |
| 2026-04-14 이전 | 가용성 클라이언트 계산 | DB 저장 없이 실시간 반영 |
| 2026-04-14 이전 | 00:00–24:00 전체 표시, 새벽 fold | UX: 전 시간 지원하되 야간 축소 |
| 2026-04-14 | Member → User, 개인 계정 도입 | 팀 시스템과 인증 분리 |
| 2026-04-14 | 팀원 관리 = TeamSettingsPage만 | 스케줄 뷰 오염 방지 |
| 2026-04-14 | Phase 6·7 (백엔드) 나중으로 미룸 | 프론트 UX 먼저 완성 |

---

## Phase 7: 프론트엔드 ↔ 백엔드 API 연결 (2026-04-14)

### 변경 파일

#### `client/src/lib/api.ts`
- `setAuthUserId(id)` 함수 추가 — 로그인 시 호출, 이후 모든 요청에 `X-User-Id` 헤더 자동 첨부
- `ApiError` 클래스 추가 — `status: number` 필드 포함, `Error` 상속
- `getMyTeams(userId)` — `?userId=` 쿼리 파라미터 포함
- `getTeamMembers(teamId)` — 반환 타입 `TeamMemberApiResponse[]` (서버 DTO 형식)
- 204 No Content 응답 처리 (`undefined as T` 반환)
- `erasableSyntaxOnly` 호환: constructor parameter property 미사용

#### `client/src/store/authStore.ts`
- mock 제거 — `api.login()` / `api.register()` 실제 호출
- 로그인 성공 시 `setAuthUserId(user.id)` 호출
- 로그아웃 시 `setAuthUserId(null)` 호출
- `getMockUsers()` 제거 (더 이상 필요 없음)

#### `client/src/store/teamStore.ts`
- mock 데이터 제거, 모든 actions → 실제 API 호출
- `fetchMyTeams`: 팀 목록 fetch → 각 팀 멤버 병렬 fetch → `allUsers` / `memberships` 구성
- `TeamMemberApiResponse` → `TeamMembership` 변환 (userId는 `mr.user.id`에서 추출)

#### `client/src/store/scheduleStore.ts`
- `fetchByMonth` / `fetchByWeek` → 실제 API fetch
- `upsertBlock`: 낙관적 업데이트 + API 저장
  - `local-` prefix ID → `POST /api/schedule` → 서버 ID로 교체
  - 실 ID → `PUT /api/schedule/{id}`
  - 실패 시 롤백
- `removeBlock`: 낙관적 삭제 + `DELETE /api/schedule/{id}`, 실패 시 롤백

#### `WeeklyTimetable.tsx`, `DragBlock.tsx`
- `upsertBlock` / `removeBlock`이 async로 변경됨에 따라 `await` 추가

### 에러 처리 규칙
| 상황 | 처리 |
|------|------|
| 401 (이메일 없음) | `ApiError.message` → 로그인 페이지 인라인 표시 |
| 409 (중복) | `ApiError.message` → 각 페이지 인라인 표시 |
| 403 (권한 없음) | `ApiError.message` → 인라인 표시 |
| 네트워크 오류 | `Error.message` → 인라인 표시 |

### 빌드 결과
```
✓ tsc --noEmit   (타입 에러 0)
✓ vite build     (290 kB, 353 modules)
```
