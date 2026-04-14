import { useTeamStore } from '@/store/teamStore';
import type { ScheduleBlock } from '@/types';

interface Props {
  date: Date;
  blocks: ScheduleBlock[];
  weekId: string;
  onNavigate: (weekId: string) => void;
  isCurrentMonth: boolean;
}

export default function DayCell({ date, blocks, weekId, onNavigate, isCurrentMonth }: Props) {
  const allUsers = useTeamStore((s) => s.allUsers);

  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  // Unique user IDs with blocks on this day
  const userIds = [...new Set(blocks.map((b) => b.userId))];
  const showCount = userIds.length > 5;
  const visibleIds = showCount ? userIds.slice(0, 4) : userIds;

  return (
    <div
      className={`flex flex-col items-center gap-1 p-1 cursor-pointer hover:bg-gray-50 rounded min-h-[52px] select-none ${
        !isCurrentMonth ? 'opacity-30' : ''
      }`}
      onClick={() => onNavigate(weekId)}
    >
      <span
        className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
          isToday ? 'bg-blue-500 text-white' : 'text-gray-800'
        }`}
      >
        {date.getDate()}
      </span>

      {userIds.length > 0 && (
        <div className="flex flex-wrap gap-0.5 justify-center">
          {visibleIds.map((uid) => {
            const user = allUsers.find((u) => u.id === uid);
            return (
              <span
                key={uid}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: user?.color ?? '#ccc' }}
              />
            );
          })}
          {showCount && (
            <span className="text-[10px] text-gray-500 leading-none">
              +{userIds.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
