import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authQueryScope, useAuthStore } from '@/stores/useAuthStore';
import { toApiError } from '@/lib/apiError';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import type { OtonanResponseData, OtonanSearchParams } from '@/features/otonan/types/otonan.types';
import { getTodayWITA } from '@/features/otonan/utils/otonanUtils';
import { PremiumUpgradeModal } from '@/features/kelola-pura/components/PremiumUpgradeModal';
import { usePengingat, usePengingatMutations, usePengingatPolicy } from '../hooks/usePengingat';
import { otonanCandidates } from '../utils/pengingatSources';
import { formatReminderDate, getConditionLabel } from '../utils/pengingatUtils';
import { PengingatAddDialog } from './PengingatAddDialog';
import { PengingatModal } from './PengingatModal';

interface Props {
  request: OtonanSearchParams;
  response: OtonanResponseData;
  date: string;
  onClose: () => void;
}

/** Uses the exact search and date clicked in the Otonan result; the server validates them again on save. */
export function PengingatOtonanResultDialog(props: Props) {
  const scope = useAuthStore(authQueryScope);
  return <OtonanReminderDialog key={scope} {...props} />;
}

function OtonanReminderDialog({ request, response, date, onClose }: Props) {
  const authenticated = useAuthStore(state => state.isAuthenticated && Boolean(state.user && state.token));
  const location = useLocation();
  const reminders = usePengingat();
  const policyQuery = usePengingatPolicy();
  const { create } = usePengingatMutations();
  const [savedName, setSavedName] = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const today = getTodayWITA();
  const policy = policyQuery.data;
  const candidate = response.input_dinormalisasi?.elemen
    ? otonanCandidates(request, response, today).find(item => item.nextDate === date) ?? null : null;
  const full = limitReached || Boolean(policy && reminders.data && reminders.data.filter(entry => entry.kind === 'otonan').length >= policy.maxPerFeature);
  const closeButton = <button type="button" onClick={onClose} className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold cursor-pointer">Tutup</button>;
  const info = (title: string, children: ReactNode) => <PengingatModal title={title} description={`Otonan · ${formatReminderDate(date)}`} onClose={onClose} footer={closeButton}>{children}</PengingatModal>;

  if (!authenticated) return info('Masuk untuk menambahkan pengingat', <div className="space-y-4"><p className="text-sm text-slate-600 dark:text-slate-300">Simpan pengingat Otonan ke akunmu.</p><Link to="/login" state={{ from: location }} onClick={onClose} className="h-11 px-5 rounded-xl bg-[#0e9f90] text-white text-sm font-bold inline-flex items-center">Masuk ke akun</Link></div>);
  if (savedName) return info('Pengingat berhasil ditambahkan', <div className="space-y-4"><p role="status" className="text-sm text-slate-600 dark:text-slate-300">{savedName} sudah tersimpan di Pengingat Otonan.</p><Link to="/pengingat" onClick={onClose} className="min-h-11 inline-flex items-center text-sm font-bold text-teal-700 dark:text-teal-300">Lihat pengingat</Link></div>);
  if (date < today) return info('Tanggal sudah terlewat', <p className="text-sm text-slate-600 dark:text-slate-300">Pilih hasil otonan pada hari ini atau tanggal mendatang.</p>);
  if (!candidate) return info('Jadwal Otonan tidak tersedia', <p className="text-sm text-slate-600 dark:text-slate-300">Tanggal pilihan tidak ada pada hasil perhitungan. Hitung ulang Otonan sebelum menambahkan pengingat.</p>);
  if (reminders.isError || policyQuery.isError) return info('Pengingat belum dapat diperiksa', <QueryErrorState title="Data pengingat belum dapat dimuat" error={reminders.isError ? reminders.error : policyQuery.error} onRetry={() => { void reminders.refetch(); void policyQuery.refetch(); }} />);
  if (!policy || !reminders.data) return info('Menyiapkan pengingat', <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Memeriksa paket dan pengingat yang tersimpan…</p>);
  if (full) {
    if (policy.tier === 'Free') return <PremiumUpgradeModal isOpen onClose={onClose} title="Tambah Lebih Banyak Pengingat" description="Batas pengingat otonan untuk akun Free sudah tercapai. Tingkatkan ke Premium untuk menambahkan lebih banyak pengingat." benefits={['Hingga 10 pengingat per fitur', 'Pengingat berulang sesuai siklus fitur selama Premium aktif']} />;
    return info('Batas Pengingat Tercapai', <p className="text-sm text-slate-600 dark:text-slate-300">Kamu sudah menyimpan <span className="tabular-nums">10</span> pengingat Otonan. Hapus salah satu catatan untuk menambahkan pengingat baru.</p>);
  }
  return <PengingatAddDialog title="Tambah pengingat Otonan" description="Tanggal dan dasar perhitungan mengikuti hasil Otonan yang kamu pilih." nameLabel="Nama anggota keluarga / catatan otonan" namePlaceholder="Contoh: Otonan Ibu" requireName candidate={candidate} policy={policy} today={today} onClose={onClose} onSave={async entry => {
    try { const saved = await create.mutateAsync(entry); setSavedName(saved.title); }
    catch (failure) { if (toApiError(failure).code === 'reminder_limit_reached') setLimitReached(true); throw failure; }
  }}>
    <div className="rounded-xl bg-[#f8fafc] dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 p-4 space-y-2">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Tanggal Otonan pilihan</p>
      <time dateTime={date} className="block text-sm font-bold text-teal-700 dark:text-teal-300 tabular-nums">{formatReminderDate(date)}</time>
      <p className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">{getConditionLabel(candidate.condition)}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{candidate.description}</p>
    </div>
  </PengingatAddDialog>;
}
