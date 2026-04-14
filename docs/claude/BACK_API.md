# API 명세서

**Base URL**: `http://localhost:8080` (개발) / `https://{서버도메인}` (운영)  
**Content-Type**: `application/json`  
**인증**: `X-User-Id` 헤더 (쓰기 작업 시 현재 사용자 ID 전달)

---

## 공통 에러 응답

| HTTP Status | 상황 |
|-------------|------|
| 400 Bad Request | 요청 파라미터/바디 유효성 실패 |
| 401 Unauthorized | 이메일 없음 (로그인 실패) |
| 403 Forbidden | 권한 없음 (owner만 가능한 작업) |
| 404 Not Found | 리소스 없음 |
| 409 Conflict | 중복 (이메일, 이미 팀원 등) |

---

## Auth

### POST /api/auth/login
이메일로 로그인 (비밀번호 없음 — Phase 7에서 추가 예정)

**Request Body**
```json
{
  "email": "minjun@harness.io"
}
```

**Response 200**
```json
{
  "id": "uuid-string",
  "name": "김민준",
  "email": "minjun@harness.io",
  "color": "#4A90E2"
}
```

**Error**
- `401` — 등록되지 않은 이메일

---

### POST /api/auth/register
신규 계정 생성. 성공 시 자동 로그인 응답 반환.

**Request Body**
```json
{
  "name": "김민준",
  "email": "minjun@harness.io",
  "color": "#4A90E2"
}
```

**Validation**
- `name`: 필수
- `email`: 필수, 이메일 형식
- `color`: 필수, `#RRGGBB` hex 형식

**Response 201**
```json
{
  "id": "uuid-string",
  "name": "김민준",
  "email": "minjun@harness.io",
  "color": "#4A90E2"
}
```

**Error**
- `409` — 이미 사용 중인 이메일

---

## Teams

### GET /api/teams?userId={userId}
현재 사용자가 속한 팀 목록 조회

**Query Params**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `userId` | string | ✅ | 조회할 사용자 ID |

**Response 200**
```json
[
  {
    "id": "team-uuid",
    "name": "개발팀",
    "ownerId": "user-uuid",
    "description": "백엔드/프론트엔드 개발팀",
    "createdAt": "2026-01-01T00:00:00Z"
  }
]
```

---

### POST /api/teams
새 팀 생성. 생성자는 자동으로 owner 역할로 팀원 등록.

**Headers**
```
X-User-Id: {현재 사용자 ID}
```

**Request Body**
```json
{
  "name": "개발팀",
  "description": "백엔드/프론트엔드 개발팀"
}
```

**Validation**
- `name`: 필수

**Response 201**
```json
{
  "id": "team-uuid",
  "name": "개발팀",
  "ownerId": "user-uuid",
  "description": "백엔드/프론트엔드 개발팀",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

### DELETE /api/teams/{teamId}
팀 삭제. **owner만 가능.** 팀 삭제 시 모든 멤버십도 함께 삭제.

**Headers**
```
X-User-Id: {현재 사용자 ID}
```

**Response 204** (No Content)

**Error**
- `403` — owner 아님
- `404` — 팀 없음

---

### GET /api/teams/{teamId}/members
팀원 목록 조회 (role 포함)

**Response 200**
```json
[
  {
    "user": {
      "id": "user-uuid",
      "name": "김민준",
      "email": "minjun@harness.io",
      "color": "#4A90E2"
    },
    "teamId": "team-uuid",
    "role": "owner",
    "joinedAt": "2026-01-01T00:00:00Z"
  },
  {
    "user": {
      "id": "user-uuid-2",
      "name": "이서연",
      "email": "seoyeon@harness.io",
      "color": "#E25C5C"
    },
    "teamId": "team-uuid",
    "role": "member",
    "joinedAt": "2026-01-02T00:00:00Z"
  }
]
```

---

### POST /api/teams/{teamId}/members
팀원 초대 (강제 초대, 거절 불가). **owner만 가능.**

**Headers**
```
X-User-Id: {현재 사용자 ID}
```

**Request Body**
```json
{
  "email": "jiho@harness.io"
}
```

**Response 201**
```json
{
  "user": {
    "id": "user-uuid",
    "name": "박지호",
    "email": "jiho@harness.io",
    "color": "#50C878"
  },
  "teamId": "team-uuid",
  "role": "member",
  "joinedAt": "2026-01-03T00:00:00Z"
}
```

**Error**
- `403` — owner 아님
- `404` — 등록되지 않은 이메일
- `409` — 이미 팀원

---

### DELETE /api/teams/{teamId}/members/{targetUserId}
팀원 내보내기. **owner만 가능.** owner 본인은 제거 불가.

**Headers**
```
X-User-Id: {현재 사용자 ID}
```

**Response 204** (No Content)

**Error**
- `400` — 팀장 본인 제거 시도
- `403` — owner 아님
- `404` — 팀원 아님

---

## Schedule

### GET /api/schedule?teamId={}&month=YYYY-MM
월별 스케줄 블록 조회

**Query Params**
| 파라미터 | 타입 | 필수 | 예시 |
|---------|------|------|------|
| `teamId` | string | ✅ | `t1` |
| `month` | string | ✅ (month 또는 week 중 하나) | `2026-04` |

**Response 200**
```json
[
  {
    "id": "block-uuid",
    "userId": "user-uuid",
    "teamId": "team-uuid",
    "date": "2026-04-14",
    "startTime": "09:00",
    "endTime": "11:00",
    "description": "스프린트 플래닝"
  }
]
```
날짜 오름차순 → 시작시간 오름차순 정렬

---

### GET /api/schedule?teamId={}&week=YYYY-W##
주별 스케줄 블록 조회 (ISO 주차, 월~일)

**Query Params**
| 파라미터 | 타입 | 필수 | 예시 |
|---------|------|------|------|
| `teamId` | string | ✅ | `t1` |
| `week` | string | ✅ | `2026-W16` |

**Response 200** — 월별 조회와 동일한 형식

**Error**
- `400` — `month` / `week` 파라미터 모두 없을 때

---

### POST /api/schedule
스케줄 블록 생성

**Request Body**
```json
{
  "userId": "user-uuid",
  "teamId": "team-uuid",
  "date": "2026-04-14",
  "startTime": "09:00",
  "endTime": "11:00",
  "description": "스프린트 플래닝"
}
```

**Validation**
- `userId`, `teamId`: 필수
- `date`: 필수, `YYYY-MM-DD` 형식
- `startTime`, `endTime`: 필수, `HH:MM` 형식
- `endTime > startTime` 검증

**Response 201** — 생성된 블록 객체

**Error**
- `400` — endTime ≤ startTime
- `404` — userId 또는 teamId 없음

---

### PUT /api/schedule/{id}
스케줄 블록 수정 (부분 수정 가능)

**Request Body** (모든 필드 optional)
```json
{
  "date": "2026-04-15",
  "startTime": "10:00",
  "endTime": "12:00",
  "description": "일정 변경"
}
```

**Response 200** — 수정된 블록 객체

**Error**
- `404` — 블록 없음

---

### DELETE /api/schedule/{id}
스케줄 블록 삭제

**Response 204** (No Content)

**Error**
- `404` — 블록 없음

---

## 공통 타입 정의

### User
```json
{
  "id": "string (UUID)",
  "name": "string",
  "email": "string",
  "color": "string (#RRGGBB)"
}
```

### Team
```json
{
  "id": "string (UUID)",
  "name": "string",
  "ownerId": "string (UUID)",
  "description": "string | null",
  "createdAt": "string (ISO 8601)"
}
```

### ScheduleBlock
```json
{
  "id": "string (UUID)",
  "userId": "string (UUID)",
  "teamId": "string (UUID)",
  "date": "string (YYYY-MM-DD)",
  "startTime": "string (HH:MM)",
  "endTime": "string (HH:MM)",
  "description": "string | null"
}
```
