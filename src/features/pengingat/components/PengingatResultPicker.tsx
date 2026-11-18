import { useId } from 'react';
import { CalendarCheck } from 'lucide-react';
import type { PengingatCandidate } from '../types/pengingat.types';
import { formatReminderDate, getCountdown } from '../utils/pengingatUtils';

export function PengingatResultPicker({ candidates, selected, today, onSelect }: { candidates: PengingatCandidate[]; selected: PengingatCandidate | null; today: string; onSelect: (key: string) => void }) {
  const groupId = useId();
  if (!candidates.length) return null;
  return <fieldset className="space-y-2">
    <legend className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-teal-600" />Pilih jadwal hasil pencarian <span className="text-xs text-slate-400 tabular-nums">({candidates.length})</span></legend>
    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
      {candidates.map(candidate => <label key={candidate.key} className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer ${selected?.key === candidate.key ? 'border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/40' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
        <input type="radio" name={groupId} checked={selected?.key === candidate.key} onChange={() => onSelect(candidate.key)} className="w-4 h-4 mt-0.5 shrink-0 accent-teal-600" />
        <span className="min-w-0"><span className="block text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">{formatReminderDate(candidate.nextDate)}<span className="ml-2 text-[11px] font-semibold text-teal-700 dark:text-teal-300">{getCountdown(candidate.nextDate, today)}</span></span><span className="block text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed break-words">{candidate.description}</span></span>
      </label>)}
    </div>
  </fieldset>;
}
