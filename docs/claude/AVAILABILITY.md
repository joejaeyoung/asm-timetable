# Availability Feature

## Responsibility
- Compute time slots where ALL members are simultaneously free
- Display the result below each day column in the weekly timetable

## Single Source of Truth
All availability logic lives in `client/src/utils/availability.ts`.
Do not duplicate this logic in components, stores, or the backend.

## Core Algorithm
```typescript
// client/src/utils/availability.ts

const WORK_START = '00:00';
const WORK_END   = '24:00';

/**
 * Returns time slots where no member has a schedule block.
 * @param blocks  All schedule blocks for the target date
 * @param date    Target date 'YYYY-MM-DD'
 */
export function getSharedAvailability(
  blocks: ScheduleBlock[],
  date: string
): TimeSlot[] {
  // 1. Filter blocks for this date
  // 2. Convert all blocks to minute ranges [startMin, endMin]
  // 3. Union all ranges → occupied minutes set
  // 4. Find gaps within [WORK_START, WORK_END]
  // 5. Convert gaps back to TimeSlot[]
}

// Helper: 'HH:MM' → minutes since midnight
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Helper: minutes since midnight → 'HH:MM'
function toTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
```

## Data Flow
useAvailability(date) 
→ reads scheduleStore (already fetched by WeeklyTimetable) 
→ calls getSharedAvailability(blocks, date) 
→ returns TimeSlot[]

AvailabilityList 
→ consumes useAvailability(date) 
→ renders slot list below each day column

## `AvailabilityList` Component
- Positioned below the last time row of its day column
- Title: "✅ 공통 가능" (small, muted)
- Each slot rendered as a pill: e.g. `14:00 – 15:30`
- If no shared slots → show "없음" in muted text
- Slots < 30 min are filtered out and not shown

## API Endpoint (optional server-side check)
GET /api/availability?date=YYYY-MM-DD 
GET /api/availability?week=YYYY-W##

Returns the same result as the client-side function.
Use for external integrations only — the UI always uses the local utility.

## Edge Cases
| Case                                   | Behavior                        |
|----------------------------------------|---------------------------------|
| No blocks for the day                  | Entire working hours = available|
| All slots fully occupied               | Return empty array              |
| Block extends past WORK_END            | Clamp to WORK_END               |
| Block starts before WORK_START         | Clamp to WORK_START             |
| Only one member in team                | That member's free time = result|

## Do NOT
- Store availability results in the database
- Recompute availability inside `AvailabilityList` directly
- Show slots shorter than 30 minutes
