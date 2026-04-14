@RULE.md
@ERROR.md
# Schedule Manager — 남은 작업 계획

1. 일정 생성시 반복 기능 추가
	1. 주차별 반복 등 (요일 지정 가능)

---

# 신기능 구현 계획

브랜치 전략: `feat/기능명` 브랜치를 기능별로 따로 생성 (RULE.md 기준)
**구현 순서**: feat/member-filter → feat/recurring-schedule

---

## Feature 2: 일정 반복 기능 (feat/recurring-schedule)

**아키텍처**: 서버가 반복 블록을 개별 ScheduleBlock 행으로 생성. 공통 `recurrenceGroupId`(UUID)로 연결.

### 타입 추가 (`client/src/types/index.ts`)
```typescript
// ScheduleBlock에 추가
recurrenceGroupId?: string | null;
recurrenceIndex?: number;  // THIS_AND_AFTER 삭제용 순서 인덱스

export type RecurrenceDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=월...6=일
export interface RecurrenceRule {
  daysOfWeek: RecurrenceDayOfWeek[];
  endCondition: 'date' | 'count';
  endDate?: string;      // 'YYYY-MM-DD'
  occurrences?: number;  // 2–52
}
```

### 백엔드 변경
| 파일 | 변경 내용 |
|------|----------|
| `server/.../entity/ScheduleBlock.java` | `recurrenceGroupId` (VARCHAR 36), `recurrenceIndex` (INT) 추가 |
| DB Migration | `ALTER TABLE` + 인덱스 |
| `server/.../dto/response/ScheduleBlockResponse.java` | `recurrenceGroupId` 필드 추가 |
| `server/.../dto/request/CreateRecurringScheduleBlockRequest.java` | **신규** |
| `server/.../dto/request/DeleteScheduleBlockRequest.java` | **신규** — scope: `THIS_ONLY \| THIS_AND_AFTER \| ALL` |
| `server/.../repository/ScheduleBlockRepository.java` | `deleteByRecurrenceGroupId`, `deleteByGroupIdAndIndexGte` 추가 |
| `server/.../service/ScheduleBlockService.java` | `createRecurring()`, `deleteWithScope()` 추가 |
| `server/.../controller/ScheduleBlockController.java` | `POST /api/schedule/recurring` 추가, `DELETE /{id}` body 지원 |

새 API:
- `POST /api/schedule/recurring` → `List<ScheduleBlockResponse>` (201)
- `DELETE /api/schedule/{id}` body: `{ scope: "THIS_ONLY"|"THIS_AND_AFTER"|"ALL" }`

### 프론트엔드 변경
| 파일 | 변경 내용 |
|------|----------|
| `client/src/lib/api.ts` | `createRecurringBlocks()`, `deleteBlockWithScope()` 추가 |
| `client/src/store/scheduleStore.ts` | `createRecurringBlocks` action, `removeBlock` scope 파라미터 추가 |
| `client/src/components/timetable/DescriptionModal.tsx` | 반복 설정 UI 섹션 추가 |
| `client/src/components/timetable/RecurringDeleteModal.tsx` | **신규** — "이 항목만 / 이후 모두 / 전체" 3선택 모달 |
| `client/src/components/timetable/DragBlock.tsx` | 반복 블록 우클릭 시 RecurringDeleteModal 표시 |
| `client/src/components/timetable/WeeklyTimetable.tsx` | `handleModalConfirm` 반복/단건 분기 처리 |

**DescriptionModal 반복 UI** (설명 textarea 아래에 추가)
1. "매주 반복" 체크박스 토글
2. (ON 시) 요일 버튼 7개 (월~일) — 현재 요일 기본 선택+비활성
3. 종료 조건 라디오: "날짜 지정" vs "횟수 지정"
4. 조건부 입력: `<input type="date">` 또는 숫자 스피너 (2–52)

---

## Feature 3. 메인 화면 수정
안내문구 추가
- 중복 계정 생성이 가능하지만, 꼭 필요할 경우만 여러 계정 사용 부탁드립니다.
- 개발자 : 조재영
- 깃허브 링크 : https://github.com/joejaeyoung
- 링크드인 : https://www.linkedin.com/in/jaeyoung-jo-a18447306/
- 문의사항 : webex