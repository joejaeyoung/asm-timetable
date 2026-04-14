import { useState } from 'react';

interface Props {
  onConfirm: (description: string) => void;
  onCancel: () => void;
  dateLabel: string;
  startTime: string;
  endTime: string;
}

export default function DescriptionModal({ onConfirm, onCancel, dateLabel, startTime, endTime }: Props) {
  const [description, setDescription] = useState('');

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

        <textarea
          autoFocus
          className="border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 h-24"
          placeholder="설명 (선택)"
          maxLength={100}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <p className="text-[11px] text-gray-400 text-right -mt-2">{description.length}/100</p>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(description)}
            className="px-4 py-1.5 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-lg"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
