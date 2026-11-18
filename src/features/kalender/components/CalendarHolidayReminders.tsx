import { BellPlus } from 'lucide-react';
import type { HariRayaItem } from '../types/kalender.types';
import { getHariRayaBadgeStyle } from '../utils/calendarUtils';

interface CalendarHolidayRemindersProps {
  holidays: HariRayaItem[];
  date: string;
  today: string;
  onDetail: (holiday: HariRayaItem) => void;
  onAdd: (holiday: HariRayaItem) => void;
}

export function CalendarHolidayReminders({ holidays, date, today, onDetail, onAdd }: CalendarHolidayRemindersProps) {
  if (!holidays.length) return null;
  const past = date < today;
  return <section className="space-y-2" aria-label="Hari Raya dan pengingat">
    <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Hari Raya &amp; Rerainan</h4>
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {holidays.map(holiday => {
        const badge = getHariRayaBadgeStyle(holiday.nama);
        return <li key={holiday.id || holiday.nama} className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <button type="button" onClick={() => onDetail(holiday)} title="Klik untuk membaca penjelasan hari raya ini" className={`min-h-11 self-start inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold ${badge.bg} ${badge.text} transition-colors cursor-pointer group active:scale-95 [touch-action:manipulation]`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${badge.dot}`} />
            <span className="text-left">{holiday.nama}</span><span aria-hidden="true" className="text-[10px] opacity-60 group-hover:opacity-100">↗</span>
          </button>
          <button type="button" aria-label={`Tambah pengingat ${holiday.nama}`} disabled={past} onClick={() => onAdd(holiday)} title={past ? 'Tanggal ini sudah terlewat' : `Ingatkan ${holiday.nama} pada tanggal ini`} className="min-h-11 px-3 rounded-xl border border-teal-200/60 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [touch-action:manipulation]">
            <BellPlus className="w-4 h-4" aria-hidden="true" />Tambah pengingat
          </button>
        </li>;
      })}
    </ul>
    {past && <p className="text-xs text-slate-400 dark:text-slate-500">Pengingat tersedia untuk hari ini atau tanggal mendatang.</p>}
  </section>;
}
