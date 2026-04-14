interface Props {
  onSelect: (scope: 'THIS_ONLY' | 'THIS_AND_AFTER' | 'ALL') => void;
  onCancel: () => void;
}

export default function RecurringDeleteModal({ onSelect, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-72 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-gray-800">반복 일정 삭제</h2>
        <p className="text-sm text-gray-500 -mt-1">삭제할 범위를 선택하세요.</p>

        <div className="flex flex-col gap-2 mt-1">
          <button
            onClick={() => onSelect('THIS_ONLY')}
            className="w-full text-left px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            이 항목만
          </button>
          <button
            onClick={() => onSelect('THIS_AND_AFTER')}
            className="w-full text-left px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            이후 모두
          </button>
          <button
            onClick={() => onSelect('ALL')}
            className="w-full text-left px-4 py-2.5 rounded-lg border border-red-100 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            전체
          </button>
        </div>

        <button
          onClick={onCancel}
          className="mt-1 w-full px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          취소
        </button>
      </div>
    </div>
  );
}
