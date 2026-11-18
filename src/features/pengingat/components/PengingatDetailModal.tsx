import { useCallback } from 'react';
import { Bell, CalendarDays, Trash2 } from 'lucide-react';
import { PENGINGAT_CATEGORIES } from '../data/pengingatData';
import type { PengingatEntry } from '../types/pengingat.types';
import { formatReminderDate, getAlertLabel, getConditionLabel, getCountdown } from '../utils/pengingatUtils';
import { PengingatModal } from './PengingatModal';

interface PengingatDetailModalProps {
  entry: PengingatEntry;
  today: string;
  deleting?: boolean;
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onDelete: () => void;
  onConfirmDelete: () => Promise<void>;
}

export function PengingatDetailModal({ entry, today, deleting, busy, error, onClose, onDelete, onConfirmDelete }: PengingatDetailModalProps) {
  const close = useCallback(() => { if (!busy) onClose(); }, [busy, onClose]);
  const category = PENGINGAT_CATEGORIES.find(item => item.id === entry.kind)!;
  const secondaryButton = 'h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-2';

  return <PengingatModal title={deleting ? 'Hapus catatan pengingat?' : entry.title} description={deleting ? 'Pengingat beserta jadwal dan notifikasinya akan dihapus dari akunmu.' : category.title} onClose={close} footer={deleting ? <>
    <button type="button" onClick={close} disabled={busy} className={secondaryButton}>Batal</button>
    <button type="button" onClick={() => void onConfirmDelete()} disabled={busy} className="h-11 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"><Trash2 className="w-4 h-4" />{busy ? 'Menghapus…' : 'Hapus catatan'}</button>
  </> : <>
    <button type="button" onClick={onDelete} className="min-h-11 px-2 mr-auto text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"><Trash2 className="w-4 h-4" />Hapus</button>
    <button type="button" onClick={onClose} className={secondaryButton}>Tutup</button>
  </>}>
    {deleting ? <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900"><p className="font-bold text-sm text-slate-800 dark:text-slate-100 break-words">{entry.title}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{category.title}</p></div> : <>
      <div className="bg-[#f8fafc] dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700 p-4 flex items-start gap-3"><CalendarDays className="w-5 h-5 text-[#0d9488] dark:text-teal-400 shrink-0 mt-0.5" /><div><p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 tabular-nums">{formatReminderDate(entry.nextDate)}</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">{entry.eventTime ? `${entry.eventTime.replace(':', '.')} WITA` : 'Sepanjang hari'} · {getCountdown(entry.nextDate, today)}</p></div></div>
      <dl className="space-y-4 text-sm">
        <div><dt className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Patokan jadwal</dt><dd className="mt-1.5 text-slate-700 dark:text-slate-300 font-medium tabular-nums">{getConditionLabel(entry.condition)}</dd></div>
        {entry.sourceLabel && <div><dt className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Sumber</dt><dd className="mt-1.5 text-slate-700 dark:text-slate-300 font-medium">{entry.sourceLabel}</dd></div>}
        <div><dt className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Perulangan</dt><dd className="mt-1.5 text-slate-700 dark:text-slate-300 font-medium tabular-nums">{!entry.repeat ? 'Hanya kejadian ini' : entry.repeatLabel ?? (entry.condition.basis === 'kelahiran' || entry.condition.basis === 'pawukon' ? 'Setiap siklus 210 hari' : 'Setiap perayaan berikutnya')}</dd></div>
        {entry.source?.feature === 'otonan' && entry.source.result.perayaan_ke != null && <div><dt className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Perayaan Otonan</dt><dd className="mt-1.5 text-slate-700 dark:text-slate-300 font-medium tabular-nums">Otonan ke-{entry.source.result.perayaan_ke}</dd></div>}
        {entry.source?.feature === 'piodalan' && <div><dt className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Jadwal pura</dt><dd className="mt-1.5 text-slate-700 dark:text-slate-300 font-medium">{entry.source.pura.pelaksanaan_aktual ? 'Memiliki catatan pelaksanaan dari pengelola' : 'Berdasarkan patokan kalender pura'}</dd></div>}
        {entry.source?.feature === 'mengatur-dewasa' && <div><dt className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Kriteria kegiatan</dt><dd className="mt-1.5 space-y-3">{entry.source.criteria.sections.map((section, index) => <div key={`${section.label}-${index}`}><p className="text-xs font-bold text-slate-700 dark:text-slate-300">{section.label}</p><ul className="mt-1 space-y-1 text-xs text-slate-500 dark:text-slate-400">{section.groups.filter(group => group.length).map((group, groupIndex) => <li key={groupIndex}>{group.join(' dan ')}</li>)}</ul></div>)}</dd></div>}
        <div><dt className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Waktu pengingat</dt><dd className="mt-1.5 flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium tabular-nums"><Bell className="w-4 h-4 text-[#0d9488] dark:text-teal-400" />{getAlertLabel(entry)}</dd></div>
        {entry.note && <div><dt className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Catatan</dt><dd className="mt-1.5 text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{entry.note}</dd></div>}
      </dl>
      {entry.scheduleError && <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">{entry.scheduleError} Sistem akan mencoba memeriksanya kembali.</p>}
      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">Tersimpan di akunmu. Notifikasi mengikuti waktu WITA.</p>
    </>}
    {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
  </PengingatModal>;
}
