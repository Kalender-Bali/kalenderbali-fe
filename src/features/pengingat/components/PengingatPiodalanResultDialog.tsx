import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authQueryScope, useAuthStore } from '@/stores/useAuthStore';
import { useReadQuery } from '@/lib/useReadQuery';
import { toApiError } from '@/lib/apiError';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import type { PiodalanDayGroup } from '@/features/piodalan/types/piodalan.types';
import { getTodayWITA } from '@/features/piodalan/utils/piodalanUtils';
import { PremiumUpgradeModal } from '@/features/kelola-pura/components/PremiumUpgradeModal';
import { usePengingat, usePengingatMutations, usePengingatPolicy } from '../hooks/usePengingat';
import { privateCalendarCandidates } from '../utils/pengingatSources';
import { fetchPiodalanResultCandidate } from '../api/pengingatPiodalanSource';
import { formatReminderDate, getConditionLabel } from '../utils/pengingatUtils';
import { PengingatAddDialog } from './PengingatAddDialog';
import { PengingatModal } from './PengingatModal';
import { PengingatField, PengingatSelect, PengingatSourceFeedback } from './PengingatFormControls';

interface Props { group: PiodalanDayGroup; lockedPuraId?: string; onClose: () => void }

export function PengingatPiodalanResultDialog(props: Props) {
  const scope = useAuthStore(authQueryScope);
  return <PiodalanReminderDialog key={`${scope}:${props.group.dateStr}:${props.lockedPuraId ?? 'optional'}`} {...props} />;
}

function PiodalanReminderDialog({ group, lockedPuraId, onClose }: Props) {
  const authenticated = useAuthStore(state => state.isAuthenticated && Boolean(state.user && state.token));
  const scope = useAuthStore(authQueryScope);
  const location = useLocation();
  const reminders = usePengingat();
  const policyQuery = usePengingatPolicy();
  const { create } = usePengingatMutations();
  const [selectedPuraId, setPuraId] = useState('');
  const locked = lockedPuraId !== undefined;
  const puraId = lockedPuraId ?? selectedPuraId;
  const lockedPura = locked ? group.puras.find(pura => String(pura.id) === puraId) : null;
  const [savedName, setSavedName] = useState('');
  const [limitReached, setLimitReached] = useState(false);
  const today = getTodayWITA();
  const date = group.dateStr;
  const policy = policyQuery.data;
  const full = limitReached || Boolean(policy && reminders.data && reminders.data.filter(entry => entry.kind === 'piodalan').length >= policy.maxPerFeature);
  const source = useReadQuery({
    queryKey: ['pengingat-source', scope, 'piodalan-result', date, puraId],
    enabled: authenticated && Boolean(policy) && !full && Boolean(puraId) && group.puras.some(pura => String(pura.id) === puraId) && date >= today,
    meta: { authScoped: true }, gcTime: 0, staleTime: 0,
    queryFn: () => fetchPiodalanResultCandidate(group, puraId, today),
  });
  const dateCandidate = privateCalendarCandidates('piodalan', { basis: 'tanggal', date }, [date], today)[0];
  if (dateCandidate) { dateCandidate.title = `Piodalan ${formatReminderDate(date)}`; dateCandidate.sourceLabel = 'Tanggal Piodalan pilihan'; }
  const candidate = locked || puraId ? (!source.isError && source.data) || null : dateCandidate ?? null;
  const closeButton = <button type="button" onClick={onClose} className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold cursor-pointer">Tutup</button>;
  const info = (title: string, children: ReactNode) => <PengingatModal title={title} description={`Piodalan · ${formatReminderDate(date)}`} onClose={onClose} footer={closeButton}>{children}</PengingatModal>;

  if (!authenticated) return info('Masuk untuk menambahkan pengingat', <div className="space-y-4"><p className="text-sm text-slate-600 dark:text-slate-300">Simpan pengingat Piodalan ke akunmu.</p><Link to="/login" state={{ from: location }} onClick={onClose} className="h-11 px-5 rounded-xl bg-[#0e9f90] text-white text-sm font-bold inline-flex items-center">Masuk ke akun</Link></div>);
  if (savedName) return info('Pengingat berhasil ditambahkan', <div className="space-y-4"><p role="status" className="text-sm text-slate-600 dark:text-slate-300">{savedName} sudah tersimpan di Pengingat Piodalan.</p><Link to="/pengingat" onClick={onClose} className="min-h-11 inline-flex items-center text-sm font-bold text-teal-700 dark:text-teal-300">Lihat pengingat</Link></div>);
  if (date < today) return info('Tanggal sudah terlewat', <p className="text-sm text-slate-600 dark:text-slate-300">Pilih tanggal piodalan pada hari ini atau mendatang.</p>);
  if (locked && !lockedPura) return info('Pura tidak tersedia', <p className="text-sm text-slate-600 dark:text-slate-300">Pura ini tidak ditemukan pada jadwal tanggal pilihan. Tutup pengaturan dan periksa kembali hasil pencarian.</p>);
  if (reminders.isError || policyQuery.isError) return info('Pengingat belum dapat diperiksa', <QueryErrorState title="Data pengingat belum dapat dimuat" error={reminders.isError ? reminders.error : policyQuery.error} onRetry={() => { void reminders.refetch(); void policyQuery.refetch(); }} />);
  if (!policy || !reminders.data) return info('Menyiapkan pengingat', <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Memeriksa paket dan pengingat yang tersimpan…</p>);
  if (full) {
    if (policy.tier === 'Free') return <PremiumUpgradeModal isOpen onClose={onClose} title="Tambah Lebih Banyak Pengingat" description="Batas pengingat piodalan untuk akun Free sudah tercapai. Tingkatkan ke Premium untuk menambahkan lebih banyak pengingat." benefits={['Hingga 10 pengingat per fitur', 'Pengingat berulang sesuai siklus fitur selama Premium aktif']} />;
    return info('Batas Pengingat Tercapai', <p className="text-sm text-slate-600 dark:text-slate-300">Kamu sudah menyimpan <span className="tabular-nums">10</span> pengingat Piodalan. Hapus salah satu catatan untuk menambahkan pengingat baru.</p>);
  }
  return <PengingatAddDialog title="Tambah pengingat Piodalan" description={locked ? 'Pura dan tanggal mengikuti rincian yang kamu buka. Atur kapan kamu ingin diingatkan.' : 'Tanggal mengikuti hasil pilihanmu. Pilih pura jika ingin mengikuti jadwal pura tertentu.'} showName={!locked} nameLabel="Nama pengingat (opsional)" namePlaceholder="Contoh: Piodalan keluarga" candidate={candidate} policy={policy} today={today} onClose={onClose} onSave={async entry => {
    try { const saved = await create.mutateAsync(entry); setSavedName(saved.title); }
    catch (failure) { if (toApiError(failure).code === 'reminder_limit_reached') setLimitReached(true); throw failure; }
  }}>
    <div className="rounded-xl bg-[#f8fafc] dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 p-4 space-y-2">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Tanggal Piodalan pilihan</p>
      <time dateTime={date} className="block text-sm font-bold text-teal-700 dark:text-teal-300 tabular-nums">{formatReminderDate(date)}</time>
      {candidate && <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{getConditionLabel(candidate.condition)}</p>}
    </div>
    {lockedPura ? <div className="rounded-xl bg-[#f8fafc] dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 p-4 space-y-2"><p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Pura pilihan</p><p className="text-sm font-bold text-slate-800 dark:text-slate-100">{candidate?.sourceLabel || lockedPura.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">Pura dan tanggal sudah ditetapkan dari rincian susunan acara.</p></div> : <PengingatField label="Pura (opsional)"><PengingatSelect required={false} value={puraId} onChange={setPuraId}><option value="">Tanpa pura tertentu</option>{group.puras.map(pura => <option key={String(pura.id)} value={String(pura.id)}>{pura.name}{pura.city ? ` · ${pura.city}` : ''}</option>)}</PengingatSelect></PengingatField>}
    {puraId ? <><PengingatSourceFeedback loading={source.isLoading && !source.data} error={source.isError ? source.error : null} onRetry={() => void source.refetch()} />{source.isSuccess && !source.data && <p role="status" className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{locked ? 'Jadwal pura pada tanggal ini sudah tidak tersedia. Tutup pengaturan dan periksa kembali jadwal pura.' : 'Jadwal pura pada tanggal ini sudah tidak tersedia. Pilih pura lain atau simpan tanpa pura tertentu.'}</p>}</> : <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Tanpa pura tertentu, pengingat berlaku satu kali pada tanggal ini. Pilih pura untuk mengikuti jadwal dan pilihan perulangannya.</p>}
  </PengingatAddDialog>;
}
