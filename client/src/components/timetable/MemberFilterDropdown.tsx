import { useState, useRef, useEffect } from 'react';
import type { User } from '@/types';

interface Props {
  members: User[];
  visibleIds: Set<string>;
  onChange: (ids: Set<string>) => void;
}

export default function MemberFilterDropdown({ members, visibleIds, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 팀 일정 가상 유저를 맨 앞에 정렬
  const sorted = [...members].sort((a, b) => (b.virtualUser ? 1 : 0) - (a.virtualUser ? 1 : 0));

  const allVisible = visibleIds.size === members.length;
  const isFiltered = visibleIds.size < members.length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function toggleMember(id: string) {
    const next = new Set(visibleIds);
    if (next.has(id)) {
      if (next.size === 1) return; // 최소 1명 유지
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(next);
  }

  function toggleAll() {
    if (allVisible) {
      // 전체 해제: 현재 유저(첫 번째) 1명만 남김
      onChange(new Set([members[0]?.id].filter(Boolean) as string[]));
    } else {
      onChange(new Set(members.map((m) => m.id)));
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
          isFiltered
            ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
        }`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        {allVisible ? '모든 멤버' : `${visibleIds.size}/${members.length}명`}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {/* 전체 토글 */}
          <button
            onClick={toggleAll}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 border-b border-gray-100"
          >
            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
              allVisible ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
            }`}>
              {allVisible && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            {allVisible ? '전체 해제' : '전체 선택'}
          </button>

          {/* 멤버 목록 */}
          {sorted.map((member) => {
            const checked = visibleIds.has(member.id);
            return (
              <button
                key={member.id}
                onClick={() => toggleMember(member.id)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                  checked ? 'border-transparent' : 'border-gray-300'
                }`}
                  style={checked ? { backgroundColor: member.color } : {}}
                >
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: member.color }}
                />
                <span className="text-gray-700 truncate">{member.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
