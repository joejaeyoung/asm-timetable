# Calendar Feature

## Responsibility
- Display a full monthly calendar as the app's primary landing view
- Each week row is clickable → navigates to that week's timetable

## Components
### `MonthlyCalendar`
- Renders a 7-column (Mon–Sun) × N-row grid for the selected month
- Each cell = one `DayCell` component
- Week row has an `onClick` handler → calls `onWeekSelect(weekId)`

### `WeekCell`
- Displays the week number and date range (e.g. "W16 · Apr 14–20")
- Highlights the current week
- On click → navigates to `/week/:weekId`

### `DayCell`
- Shows day number
- If any schedule blocks exist for that day → renders a color dot per member
- Clicking a day cell → navigates to `/week/:weekId` with that day focused

## State & Data Flow
useSchedule(month) 
→ fetches all blocks for the month from /api/schedule?
month=YYYY-MM → stored in scheduleStore

MonthlyCalendar 
→ reads scheduleStore 
→ passes block counts to DayCell per date

## Navigation
- Route: `/` or `/calendar/:year/:month`
- Week route: `/week/:weekId` (e.g. `/week/2025-W16`)
- Use `react-router-dom` `useNavigate`

## Key Logic
```typescript
// Generate week rows for a month
function getWeeksInMonth(year: number, month: number): WeekRow[] {
  // Returns array of { weekId, days: Date[] }
  // weekId format: 'YYYY-W##'
  // Each row always starts Monday, ends Sunday
}
```

## Color Dot Rules
- One dot per member who has ≥1 block on that day
- Dot color = `member.color`
- Max 5 dots displayed; if more → show count badge instead
- Dot size: 8px circle

## Do NOT
- Fetch schedule data inside `DayCell` — data flows down from `MonthlyCalendar`
- Navigate to a daily view — the app only has monthly and weekly views