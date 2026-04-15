import { useState } from 'react';
import type { PatchNote } from '@/data/patchNotes';

interface Props {
  notes: PatchNote[];
}

export default function PatchNotesCard({ notes }: Props) {
  const [open, setOpen] = useState(false);

  if (notes.length === 0) return null;

  const latest = notes[0];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">공지사항</span>
          <span className="text-xs text-gray-400">{latest.title}</span>
        </div>
        <span className="text-xs text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-3">
          {notes.map((note) => (
            <div key={note.id}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-700">{note.title}</span>
                <span className="text-[10px] text-gray-400">{note.date}</span>
              </div>
              <ul className="flex flex-col gap-0.5">
                {note.items.map((item, i) => (
                  <li key={i} className="text-xs text-gray-500 flex gap-1.5">
                    <span className="text-gray-300 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
