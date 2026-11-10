import { useState } from 'react';
import { CalendarSearch } from 'lucide-react';
import { formatFullIndoDate, getIndoDayName } from '@/features/kalender/utils/calendarUtils';
import type { DewasaCriteriaField, DewasaDateResult, DewasaDateStatus, DewasaMatchedReason, DewasaSearchResponse } from '../types/mengaturDewasa.types';

interface Props {
  response: DewasaSearchResponse;
  fields: DewasaCriteriaField[];
  onSelect: (result: DewasaDateResult) => void;
}

const statusInfo: Record<DewasaDateStatus, { label: string; badge: string }> = {
  eligible: { label: 'Memenuhi kriteria', badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' },
  conflict: { label: 'Ada konflik', badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60' },
  no_match: { label: 'Tidak cocok', badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
};

function Reasons({ title, reasons, fields }: { title: string; reasons: DewasaMatchedReason[]; fields: DewasaCriteriaField[] }) {
  if (!reasons.length) return null;
  return <div><h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">{title}</h4><ul className="mt-1 space-y-1">{reasons.map((reason, index) => <li key={`${reason.field ?? ''}-${reason.calendar_value_id ?? reason.name}-${index}`} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed"><span className="font-semibold">{reason.field ? `${fields.find((field) => field.field === reason.field)?.label ?? reason.field}: ` : ''}{reason.name}</span>{reason.description && <span> — {reason.description}</span>}</li>)}</ul></div>;
}

// Tampilkan status dan alasan apa adanya, termasuk eligible tanpa reason pada avoid-only.
function ResultRow({ result, fields, onSelect }: { result: DewasaDateResult; fields: DewasaCriteriaField[]; onSelect: (result: DewasaDateResult) => void }) {
  const info = statusInfo[result.status];
  const wewaran = result.calendar?.wewaran;
  const calendarText = [wewaran?.saptawara?.nama, wewaran?.pancawara?.nama, wewaran?.wuku?.nama].filter(Boolean).join(' · ');
  const hasReasons = result.matched_recommended.length > 0 || result.matched_avoid.length > 0;
  return (
    <li className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{getIndoDayName(result.tanggal)}</p><h3 className="mt-1 text-sm sm:text-base font-bold text-[#0f172a] dark:text-white tabular-nums">{formatFullIndoDate(result.tanggal)}</h3>{calendarText && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{calendarText}</p>}</div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${info.badge}`}>{info.label}</span>
      </div>
      {hasReasons && <details className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-2"><summary className="min-h-11 flex items-center text-xs font-bold text-teal-700 dark:text-teal-400 cursor-pointer [touch-action:manipulation]">Lihat alasan</summary><div className="space-y-3 pb-2"><Reasons title="Kriteria mendukung yang cocok" reasons={result.matched_recommended} fields={fields} /><Reasons title="Kriteria dihindari yang cocok" reasons={result.matched_avoid} fields={fields} /></div></details>}
      <button type="button" onClick={() => onSelect(result)} className="mt-2 min-h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer [touch-action:manipulation]">Detail tanggal</button>
    </li>
  );
}

// Filter hanya menyaring hasil backend; urutan tanggal dan status tidak dihitung ulang.
export function MengaturDewasaResults({ response, fields, onSelect }: Props) {
  const [filter, setFilter] = useState<DewasaDateStatus>('eligible');
  const results = response.data.results;
  const visible = results.filter((item) => item.status === filter);
  return (
    <div className="mt-5 space-y-4">
      <div role="group" aria-label="Filter status tanggal" className="flex flex-wrap gap-2">
        {(Object.keys(statusInfo) as DewasaDateStatus[]).map((status) => (
          <button key={status} type="button" aria-pressed={filter === status} onClick={() => setFilter(status)} className={`min-h-11 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-colors cursor-pointer [touch-action:manipulation] ${filter === status ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200/60 dark:border-teal-800/60' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            {statusInfo[status].label} <span className="tabular-nums">({results.filter((item) => item.status === status).length})</span>
          </button>
        ))}
      </div>
      {visible.length ? <ul className="space-y-3">{visible.map((item) => <ResultRow key={item.tanggal} result={item} fields={fields} onSelect={onSelect} />)}</ul> : <div className="rounded-xl bg-[#f8fafc] dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 p-5 flex items-start gap-3"><CalendarSearch className="w-5 h-5 text-teal-700 dark:text-teal-400 shrink-0" /><p className="text-sm text-slate-600 dark:text-slate-300">Tidak ada tanggal dengan status ini pada periode yang dipilih.</p></div>}
    </div>
  );
}
