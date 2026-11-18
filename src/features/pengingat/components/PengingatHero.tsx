import { ArrowUpRight, BellRing } from 'lucide-react';
import type { PengingatEntry } from '../types/pengingat.types';
import { formatReminderDate, getCountdown, getReminderStatus, sortReminders } from '../utils/pengingatUtils';

interface PengingatHeroProps {
  entries: PengingatEntry[];
  today: string;
  onDetail: (entry: PengingatEntry) => void;
}

export function PengingatHero({ entries, today, onDetail }: PengingatHeroProps) {
  const active = entries.filter(entry => getReminderStatus(entry, today) === 'aktif');
  const next = sortReminders(active, today)[0];
  const past = entries.length - active.length;

  return <>
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="space-y-1.5">
        <nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-400 flex items-center gap-2"><span>Wargabali</span><span className="text-slate-300">/</span><span aria-current="page" className="text-teal-700 dark:text-teal-400 font-bold">Pengingat</span></nav>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] dark:text-slate-100 tracking-tight">Pengingat Saya</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">Catat hari pentingmu. Kelola pengingat keluarga dalam satu tempat.</p>
      </div>
    </div>

    <div className="rounded-2xl border border-[#ccf0ea] dark:border-teal-900 bg-[#e6f7f5] dark:bg-teal-950/30 p-5 sm:p-6 flex flex-col xl:flex-row xl:items-center gap-5 xl:gap-8">
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-white/80 dark:bg-teal-900/50 border border-teal-200/60 dark:border-teal-800 text-[#0f766e] dark:text-teal-300 flex items-center justify-center shrink-0"><BellRing className="w-5 h-5" /></div>
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#0f766e] dark:text-teal-400">Agenda terdekat</p>
          {next ? <button type="button" onClick={() => onDetail(next)} className="group text-left py-1 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-teal-600 max-w-full">
            <span className="flex items-center gap-2 text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-slate-100"><span className="truncate">{next.title}</span><ArrowUpRight className="w-4 h-4 shrink-0 text-teal-700 dark:text-teal-300 group-hover:translate-x-0.5 transition-transform" /></span>
            <span className="block mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium tabular-nums">{formatReminderDate(next.nextDate)}{next.eventTime && ` · ${next.eventTime.replace(':', '.')} WITA`}<span className="mx-2 text-teal-600/50">·</span><span className="font-bold text-[#0f766e] dark:text-teal-300">{getCountdown(next.nextDate, today)}</span></span>
          </button> : <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-2">{entries.length ? 'Belum ada agenda aktif mendatang.' : 'Hari penting berikutnya dimulai dari catatanmu.'}</p>}
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-4 sm:gap-7 border-t xl:border-t-0 xl:border-l border-teal-200/70 dark:border-teal-900 pt-4 xl:pt-0 xl:pl-7 shrink-0">
        {[['Catatan', entries.length], ['Aktif', active.length], ['Terlewat', past]].map(([label, count]) => <div key={label} className="min-w-14"><dt className="text-[10px] sm:text-[11px] font-bold text-[#0f766e] dark:text-teal-400">{label}</dt><dd className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-[#0f172a] dark:text-slate-100 mt-0.5">{count}</dd></div>)}
      </dl>
    </div>
  </>;
}
