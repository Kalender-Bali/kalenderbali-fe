import { useId } from 'react';
import { Bell, CalendarDays, ChevronDown, ChevronRight, Landmark, Plus, Sun, Users } from 'lucide-react';
import type { PengingatCategory, PengingatEntry, PengingatPolicy } from '../types/pengingat.types';
import { formatReminderDate, getAlertLabel, getConditionLabel, getCountdown, getReminderStatus, sortReminders } from '../utils/pengingatUtils';

const ICONS = { users: Users, landmark: Landmark, sun: Sun, calendar: CalendarDays };

interface PengingatFeatureCardProps {
  category: PengingatCategory;
  entries: PengingatEntry[];
  total: number;
  policy: PengingatPolicy | null;
  today: string;
  filtered: boolean;
  expanded: boolean;
  onExpand: () => void;
  onAdd: () => void;
  onDetail: (entry: PengingatEntry) => void;
}

/** Satu kartu per fitur; setiap catatan pengguna ditampilkan sebagai baris di dalamnya. */
export function PengingatFeatureCard({ category, entries, total, policy, today, filtered, expanded, onExpand, onAdd, onDetail }: PengingatFeatureCardProps) {
  const titleId = useId();
  const listId = useId();
  const Icon = ICONS[category.icon];
  const sorted = sortReminders(entries, today);
  const visible = expanded || filtered ? sorted : sorted.slice(0, 3);
  const activeCount = entries.filter(entry => getReminderStatus(entry, today) === 'aktif').length;

  return <section aria-labelledby={titleId} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col min-w-0 overflow-hidden">
    <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 flex items-start gap-3.5">
      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${category.accent}`}><Icon className="w-5 h-5" /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h2 id={titleId} className="text-base sm:text-lg font-extrabold tracking-tight text-[#0f172a] dark:text-slate-100">{category.title}</h2>
          <span aria-label={`${entries.length} dari ${total} catatan`} className="text-[11px] font-bold tabular-nums bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg shrink-0">{filtered ? `${entries.length}/${total}` : total}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">{category.description}</p>
      </div>
    </div>

    {entries.length ? <>
      <div className="mx-5 sm:mx-6 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 tabular-nums"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" />{activeCount} aktif<span className="mx-1">·</span>{entries.length} catatan{filtered ? ' sesuai filter' : ' tersimpan'}</div>
      <ul id={listId} className="px-5 sm:px-6 divide-y divide-slate-100 dark:divide-slate-800">
        {visible.map(entry => {
          const status = getReminderStatus(entry, today);
          return <li key={entry.id} className="flex items-start gap-1 sm:gap-2 py-3.5">
            <button type="button" onClick={() => onDetail(entry)} className="flex-1 min-w-0 text-left rounded-lg group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#0f766e] dark:group-hover:text-teal-300 break-words">{entry.title}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">{getConditionLabel(entry.condition)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs tabular-nums">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{formatReminderDate(entry.nextDate, true)}{entry.eventTime && ` · ${entry.eventTime.replace(':', '.')}`}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${status === 'terlewat' ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300' : 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300'}`}>{getCountdown(entry.nextDate, today)}</span>
                {entry.origin === 'pribadi' && <span className="text-[10px] text-slate-400 dark:text-slate-500">Pribadi</span>}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 tabular-nums"><Bell className="w-3 h-3 shrink-0" />{getAlertLabel(entry)}</p>
            </button>
          </li>;
        })}
      </ul>
    </> : <div className="flex-1 mx-5 sm:mx-6 mb-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-800/40 min-h-40 flex flex-col items-center justify-center text-center px-5 py-7">
      <Icon className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-3" />
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{filtered ? 'Belum ada catatan yang cocok' : 'Belum ada catatan'}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mt-1 max-w-60">{filtered ? 'Coba kata kunci lainnya.' : 'Tambahkan tanggal pentingmu. Semua catatannya akan terkumpul di sini.'}</p>
    </div>}

    <div className="mt-auto px-5 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-x-2">
      {!filtered && sorted.length > 3 ? <button type="button" aria-expanded={expanded} aria-controls={listId} onClick={onExpand} className="min-h-11 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-teal-600 tabular-nums">{expanded ? 'Ringkas daftar' : `Lihat semua (${sorted.length})`}<ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} /></button> : <span className="text-[11px] text-slate-400 dark:text-slate-500">{entries.length ? 'Sesuai kebutuhanmu' : 'Mulai catatan pertama'}</span>}
      <button type="button" disabled={!policy} onClick={onAdd} className="min-h-11 text-xs font-bold text-[#0f766e] dark:text-teal-300 hover:text-[#0d9488] inline-flex items-center gap-1.5 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"><Plus className="w-4 h-4" />Tambah {category.singular}</button>
    </div>
  </section>;
}
