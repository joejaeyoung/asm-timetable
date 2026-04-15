export interface PatchNote {
  id: string;
  date: string; // 'YYYY-MM-DD'
  title: string;
  items: string[];
}

// 새 항목은 배열 맨 앞에 추가
export const PATCH_NOTES: PatchNote[] = [
  {
    id: 'v0.3.0',
    date: '2026-04-15',
    title: 'v0.3.0',
    items: [
      '팀 일정 기능 추가 — 팀 전용 일정 블록을 생성할 수 있습니다.',
      '반복 일정 삭제 범위 선택 기능 추가',
    ],
  },
];
