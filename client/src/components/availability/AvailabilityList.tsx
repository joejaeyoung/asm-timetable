import { useAvailability } from '@/hooks/useAvailability';

interface Props {
  date: string; // 'YYYY-MM-DD'
}

export default function AvailabilityList({ date }: Props) {
  const slots = useAvailability(date);

  return (
    <div className="px-1 py-2 border-t border-gray-100">
      <p className="text-[11px] text-gray-400 mb-1">✅ 공통 가능</p>
      {slots.length === 0 ? (
        <p className="text-[11px] text-gray-300">없음</p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {slots.map((slot) => (
            <span
              key={`${slot.startTime}-${slot.endTime}`}
              className="text-[11px] bg-green-50 text-green-700 rounded px-1.5 py-0.5 leading-tight"
            >
              {slot.startTime} – {slot.endTime}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
