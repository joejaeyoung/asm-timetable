# Timetable Feature

## Responsibility
- Display a 7-column (Mon–Sun) × time-slot grid for a selected week
- Allow each member to drag to mark their occupied time slots
- Show a description modal on drag-end for adding context

## Components
### `WeeklyTimetable`
- Outer grid: 7 columns (days) × 48 rows (00:00–24:00, 30-min slots)
- 새벽 02:00–06:00 구간은 fold(접기) 가능
- Renders all existing `DragBlock` components for the week
- Listens for drag events to create new blocks

### `TimeSlotCell`
- Represents one 30-minute cell in the grid
- Handles `onMouseDown` to start drag
- Shows hover highlight when drag is in progress

### `DragBlock`
- Colored block positioned absolutely over the grid
- Color = `member.color` of the block's owner
- Shows `member.name` and `description` on hover (tooltip)
- Existing blocks: click → open edit modal
- New drag: spans from dragStart to dragEnd, snapped to 30-min slots

### `DescriptionModal`
- Opens after drag completes
- Fields: description (textarea)
- On submit → POST `/api/schedule` → close modal
- On cancel → discard drag

## Drag Logic
```typescript
// hooks/useDrag.ts

type DragState = {
  isDragging: boolean;
  startSlot: string | null;   // 'YYYY-MM-DD HH:MM'
  endSlot: string | null;
  currentMemberId: string;
}

// Snap helper
function snapToSlot(time: string): string {
  // Round minutes down to nearest 00 or 30
}
```

Events:
1. `onMouseDown` on `TimeSlotCell` → set `dragState.startSlot`
2. `onMouseMove` → update `dragState.endSlot` (live preview)
3. `onMouseUp` → finalize range → open `DescriptionModal`

## Grid Dimensions
| Property       | Value              |
|----------------|--------------------|
| Column width   | `calc(100% / 7)`   |
| Row height     | 32px               |
| Time range     | 00:00 – 24:00      |
| Slot interval  | 30 minutes         |
| Total rows     | 48                 |
| Fold range     | 02:00 – 06:00 (toggle) |

## User Context
- 새 드래그 블록은 항상 로그인 유저(`authStore.currentUser.id`) 본인 것으로 생성
- `currentUserId`는 `authStore`에서 읽음 — 별도 멤버 선택 드롭다운 없음

## Do NOT
- Allow overlapping blocks for the same member on the same slot
- Snap to intervals smaller than 30 minutes
- Trigger POST before the description modal is confirmed