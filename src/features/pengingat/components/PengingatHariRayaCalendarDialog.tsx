import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authQueryScope, useAuthStore } from '@/stores/useAuthStore';
import { useReadQuery } from '@/lib/useReadQuery';
import { toApiError } from '@/lib/apiError';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { searchHariRayaSpesifik } from '@/features/hari-raya/api/hariRayaApi';
import type { HariRayaItem } from '@/features/kalender/types/kalender.types';
import { getTodayWITA } from '@/features/kalender/utils/calendarUtils';
import { PremiumUpgradeModal } from '@/features/kelola-pura/components/PremiumUpgradeModal';
import { usePengingat, usePengingatMutations, usePengingatPolicy } from '../hooks/usePengingat';
import { hariRayaCandidates } from '../utils/pengingatSources';
import { formatReminderDate } from '../utils/pengingatUtils';
import { PengingatAddDialog } from './PengingatAddDialog';
import { PengingatModal } from './PengingatModal';

interface Props { holiday: HariRayaItem; date: string; onClose: () => void }

/** Reset the form if the authenticated account changes while it is open. */
export function PengingatHariRayaCalendarDialog(props: Props) {
  const scope = useAuthStore(authQueryScope);
  return <CalendarReminderDialog key={scope} {...props} />;
}

function CalendarReminderDialog({ holiday, date, onClose }: Props) {
  const authenticated = useAuthStore(state => state.isAuthenticated && Boolean(state.user && state.token));
  const scope = useAuthStore(authQueryScope);
  const location = useLocation();
  const reminders = usePengingat();
  const policyQuery = usePengingatPolicy();
  const { create } = usePengingatMutations();
  const [saved, setSaved] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const today = getTodayWITA();
  const policy = policyQuery.data;
  const full = limitReached || Boolean(policy && reminders.data && reminders.data.filter(entry => entry.kind === 'hari-raya').length >= policy.maxPerFeature);
  const source = useReadQuery({
    queryKey: ['pengingat-source', scope, 'calendar-holiday', holiday.nama, date],
    enabled: authenticated && Boolean(policy) && !full && date >= today,
    meta: { authScoped: true }, gcTime: 0, staleTime: 0,
    queryFn: async () => {
      const request = { nama: holiday.nama, year: Number(date.slice(0, 4)) };
      const response = await searchHariRayaSpesifik(request.nama, request.year);
      // Never silently switch to a different celebration date or a custom source.
      return hariRayaCandidates(request, response, today).find(candidate => candidate.nextDate === date) ?? null;
    },
  });
  const closeButton = <button type="button" onClick={onClose} className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold cursor-pointer">Tutup</button>;
  const info = (title: string, children: ReactNode) => <PengingatModal title={title} description={`${holiday.nama} · ${formatReminderDate(date)}`} onClose={onClose} footer={closeButton}>{children}</PengingatModal>;

  if (!authenticated) return info('Masuk untuk menambahkan pengingat', <div className="space-y-4"><p className="text-sm text-slate-600 dark:text-slate-300">Simpan pengingat Hari Raya ke akunmu.</p><Link to="/login" state={{ from: location }} className="h-11 px-5 rounded-xl bg-[#0e9f90] text-white text-sm font-bold inline-flex items-center" onClick={onClose}>Masuk ke akun</Link></div>);
  if (saved) return info('Pengingat berhasil ditambahkan', <div className="space-y-4"><p role="status" className="text-sm text-slate-600 dark:text-slate-300">{holiday.nama} sudah tersimpan di Pengingat Hari Raya.</p><Link to="/pengingat" onClick={onClose} className="min-h-11 inline-flex items-center text-sm font-bold text-teal-700 dark:text-teal-300">Lihat pengingat</Link></div>);
  if (date < today) return info('Tanggal sudah terlewat', <p className="text-sm text-slate-600 dark:text-slate-300">Pilih kejadian Hari Raya pada hari ini atau tanggal mendatang.</p>);
  if (reminders.isError || policyQuery.isError) return info('Pengingat belum dapat diperiksa', <QueryErrorState title="Data pengingat belum dapat dimuat" error={reminders.isError ? reminders.error : policyQuery.error} onRetry={() => { void reminders.refetch(); void policyQuery.refetch(); }} />);
  if (!policy || !reminders.data) return info('Menyiapkan pengingat', <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Memeriksa paket dan pengingat yang tersimpan…</p>);
  if (full) {
    if (policy.tier === 'Free') return <PremiumUpgradeModal isOpen onClose={onClose} title="Tambah Lebih Banyak Pengingat" description="Batas pengingat hari raya untuk akun Free sudah tercapai. Tingkatkan ke Premium untuk menambahkan lebih banyak pengingat." benefits={['Hingga 10 pengingat per fitur', 'Pengingat berulang sesuai siklus fitur selama Premium aktif']} />;
    return info('Batas Pengingat Tercapai', <p className="text-sm text-slate-600 dark:text-slate-300">Kamu sudah menyimpan <span className="tabular-nums">10</span> pengingat Hari Raya. Hapus salah satu catatan untuk menambahkan pengingat baru.</p>);
  }
  if (source.isError) return info('Jadwal Hari Raya belum dapat diperiksa', <QueryErrorState title="Jadwal belum dapat dimuat" error={source.error} onRetry={() => void source.refetch()} />);
  if (!source.isSuccess) return info('Memeriksa jadwal Hari Raya', <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Memeriksa Hari Raya pada tanggal pilihan…</p>);
  if (!source.data) return info('Jadwal Hari Raya tidak tersedia', <p className="text-sm text-slate-600 dark:text-slate-300">Hari Raya ini tidak ditemukan pada tanggal pilihan. Muat ulang kalender untuk melihat jadwal terbaru.</p>);
  const candidate = source.data;
  return <PengingatAddDialog title="Tambah pengingat Hari Raya" description="Hari Raya dan tanggal mengikuti pilihanmu di kalender." nameLabel="Nama Hari Raya" namePlaceholder="" showName={false} candidate={candidate} policy={policy} today={today} onClose={onClose} onSave={async entry => {
    try { await create.mutateAsync(entry); setSaved(true); }
    catch (failure) {
      const error = toApiError(failure);
      if (error.code === 'reminder_limit_reached') setLimitReached(true);
      throw failure;
    }
  }}>
    <div className="rounded-xl bg-[#f8fafc] dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 p-4 space-y-2">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Hari Raya pilihan</p>
      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{candidate.title}</p>
      <time dateTime={date} className="block text-sm font-semibold text-teal-700 dark:text-teal-300 tabular-nums">{formatReminderDate(date)}</time>
    </div>
  </PengingatAddDialog>;
}
