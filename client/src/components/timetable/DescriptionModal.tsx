import { useState } from 'react';
import type { RecurrenceDayOfWeek, RecurrenceRule } from '@/types';

// JS getDay() → ISO DayOfWeek (0=Sun→7, 1=Mon→1, ...)
function jsToIsoDay(jsDay: number): RecurrenceDayOfWeek {
  return (jsDay === 0 ? 7 : jsDay) as RecurrenceDayOfWeek;
}

const DAY_LABELS: { iso: RecurrenceDayOfWeek; label: string }[] = [
  { iso: 1, label: '월' },
  { iso: 2, label: '화' },
  { iso: 3, label: '수' },
  { iso: 4, label: '목' },
  { iso: 5, label: '금' },
  { iso: 6, label: '토' },
  { iso: 7, label: '일' },
];

interface Props {
  onConfirm: (description: string, recurrence: RecurrenceRule | null, isTeamBlock: boolean) => void;
  onCancel: () => void;
  dateLabel: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number; // JS getDay() value (0=Sun, 1=Mon, ...)
  hasTeamConflict?: boolean;
}

export default function DescriptionModal({
  onConfirm,
  onCancel,
  dateLabel,
  startTime,
  endTime,
  dayOfWeek,
  hasTeamConflict = false,
}: Props) {
  const [description, setDescription] = useState('');
  const [isTeamBlock, setIsTeamBlock] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<RecurrenceDayOfWeek>>(
    () => new Set([jsToIsoDay(dayOfWeek)]),
  );
  const [endCondition, setEndCondition] = useState<'date' | 'count'>('count');
  const [endDate, setEndDate] = useState('');
  const [occurrences, setOccurrences] = useState(4);

  const currentIsoDay = jsToIsoDay(dayOfWeek);

  function toggleDay(iso: RecurrenceDayOfWeek) {
    if (iso === currentIsoDay) return; // 현재 요일은 해제 불가
    const next = new Set(selectedDays);
    next.has(iso) ? next.delete(iso) : next.add(iso);
    setSelectedDays(next);
  }

  function handleConfirm() {
    const recurrence: RecurrenceRule | null = isRecurring
      ? {
          daysOfWeek: Array.from(selectedDays),
          endCondition,
          endDate: endCondition === 'date' ? endDate : undefined,
          occurrences: endCondition === 'count' ? occurrences : undefined,
        }
      : null;
    onConfirm(description, recurrence, isTeamBlock);
  }

  const canConfirm = !isRecurring || (
    endCondition === 'count' || (endCondition === 'date' && endDate !== '')
  );

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-80 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-base font-semibold text-gray-800">일정 추가</h2>
          <p className="text-sm text-gray-500 mt-1">
            {dateLabel} · {startTime} – {endTime}
          </p>
        </div>

        <div>
          <textarea
            autoFocus
            className="border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 h-20 w-full"
            placeholder="설명 (선택)"
            maxLength={100}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="text-[11px] text-gray-400 text-right mt-0.5">{description.length}/100</p>
        </div>

        {hasTeamConflict && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
            ⚠ 팀 일정과 겹칩니다. 그래도 추가하시겠습니까?
          </div>
        )}

        {/* 팀 일정 / 반복 설정 */}
        <div className="border-t border-gray-100 pt-3 flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 accent-blue-500"
              checked={isTeamBlock}
              onChange={(e) => setIsTeamBlock(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">팀 일정</span>
          </label>
          {isTeamBlock && (
            <p className="text-xs text-gray-400 pl-1 -mt-1">팀원 누구나 볼 수 있는 공용 일정입니다.</p>
          )}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 accent-blue-500"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">매주 반복</span>
          </label>

          {isRecurring && (
            <div className="flex flex-col gap-3 pl-1">
              {/* 요일 선택 */}
              <div className="flex gap-1">
                {DAY_LABELS.map(({ iso, label }) => {
                  const selected = selectedDays.has(iso);
                  const isFixed = iso === currentIsoDay;
                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={isFixed}
                      onClick={() => toggleDay(iso)}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      } ${isFixed ? 'opacity-70 cursor-default' : ''}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* 종료 조건 */}
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600">
                  <input
                    type="radio"
                    name="endCondition"
                    value="count"
                    checked={endCondition === 'count'}
                    onChange={() => setEndCondition('count')}
                    className="accent-blue-500"
                  />
                  횟수
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600">
                  <input
                    type="radio"
                    name="endCondition"
                    value="date"
                    checked={endCondition === 'date'}
                    onChange={() => setEndCondition('date')}
                    className="accent-blue-500"
                  />
                  날짜
                </label>
              </div>

              {endCondition === 'count' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={2}
                    max={52}
                    value={occurrences}
                    onChange={(e) => setOccurrences(Math.min(52, Math.max(2, Number(e.target.value))))}
                    className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <span className="text-sm text-gray-500">회 반복</span>
                </div>
              ) : (
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
                />
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-4 py-1.5 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
