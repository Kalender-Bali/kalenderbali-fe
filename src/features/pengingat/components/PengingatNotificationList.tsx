import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BellRing, X } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { toApiError } from '@/lib/apiError';
import { usePengingatMutations, usePengingatNotifications } from '../hooks/usePengingat';
import { formatReminderDate } from '../utils/pengingatUtils';
import { PENGINGAT_CATEGORIES } from '../data/pengingatData';
import type { PengingatNotification } from '../types/pengingat.types';
import { PengingatNotificationPagination } from './PengingatNotificationPagination';

export function PengingatNotificationList({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const authenticated = useAuthStore(state => state.isAuthenticated && Boolean(state.user && state.token));
  const query = usePengingatNotifications(page);
  const { markRead } = usePengingatMutations();
  const navigate = useNavigate();
  const location = useLocation();
  const data = query.data;
  async function open(item: PengingatNotification) {
    setError('');
    try {
      if (!item.readAt) await markRead.mutateAsync(item.id);
      navigate(`/pengingat?reminder=${encodeURIComponent(item.reminderId)}`);
      onClose();
    } catch (failure) { setError(toApiError(failure).message || 'Notifikasi belum dapat dibuka.'); }
  }

  return <>
    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-teal-50/60 via-slate-50/40 to-emerald-50/30 flex items-start justify-between gap-3">
      <div><p className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488]">Notifikasi</p><h3 className="mt-1 text-sm font-extrabold text-slate-900 dark:text-slate-100">Pengingat Saya</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">{authenticated ? `${data?.unread ?? 0} belum dibaca · waktu WITA` : 'Pemberitahuan dari pengingat pribadimu.'}</p></div>
      <button type="button" onClick={onClose} aria-label="Tutup notifikasi" className="min-w-11 min-h-11 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
    </div>
    {!authenticated ? <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400"><p>Masuk untuk melihat notifikasi pengingatmu.</p><Link to="/login" state={{ from: location }} onClick={onClose} className="mt-3 min-h-11 inline-flex items-center font-bold text-teal-700 dark:text-teal-300">Masuk ke akun</Link></div> : <>
      {query.isLoading && !data && <div role="status" aria-label="Memuat notifikasi" className="p-4 space-y-3 animate-pulse"><div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-3/4" /><div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" /></div>}
      {query.isError && <div role="alert" className="p-4 text-xs text-rose-700 dark:text-rose-300">Notifikasi belum dapat dimuat. <button type="button" onClick={() => void query.refetch()} className="min-h-11 font-bold cursor-pointer">Coba lagi</button></div>}
      {!query.isLoading && !query.isError && data?.items.length === 0 && <div className="p-7 text-center"><BellRing className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto" /><p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Belum ada notifikasi</p><p className="mt-1 text-xs text-slate-400 leading-relaxed">Notifikasi muncul saat jadwal pengingatmu tiba.</p></div>}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">{data?.items.map(item => <li key={item.id}><button type="button" disabled={markRead.isPending} onClick={() => void open(item)} className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 ${item.readAt ? '' : 'bg-teal-50/40 dark:bg-teal-950/20'}`}>
        <span className="flex items-start gap-2"><span className="flex-1 min-w-0"><span className="block text-xs font-extrabold text-slate-800 dark:text-slate-100 break-words">{item.title}</span><span className="block mt-1 text-[11px] text-slate-500 dark:text-slate-400">{PENGINGAT_CATEGORIES.find(category => category.id === item.kind)?.title}</span></span>{!item.readAt && <span aria-label="Belum dibaca" className="w-2 h-2 mt-1 rounded-full bg-[#0d9488] shrink-0" />}</span>
        <span className="block mt-2 text-[11px] font-semibold text-teal-700 dark:text-teal-300 tabular-nums">{item.offsetDays ? `H-${item.offsetDays}` : 'Hari H'} · {formatReminderDate(item.occurrenceDate, true)}</span>
        <span className="block mt-1 text-[10px] text-slate-400 tabular-nums">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeZone: 'Asia/Makassar' }).format(new Date(item.scheduledAt))}</span>
      </button></li>)}</ul>
      {error && <p role="alert" className="px-4 py-2 text-xs text-rose-600 dark:text-rose-300">{error}</p>}
      {data && <PengingatNotificationPagination page={page} total={data.total} onChange={setPage} />}
    </>}
    <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 text-center"><Link to="/pengingat" onClick={onClose} className="min-h-11 inline-flex items-center justify-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-300"><BellRing className="w-4 h-4" />Kelola pengingat</Link></div>
  </>;
}
