import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { toApiError } from '@/lib/apiError';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePengingat, usePengingatMutations, usePengingatPolicy } from '../hooks/usePengingat';
import { PengingatSkeleton } from '../components/PengingatSkeleton';
import { BellRing, Check, RotateCcw, SearchX, X } from 'lucide-react';
import { getTodayWITA } from '@/features/kalender/utils/calendarUtils';
import { PengingatHero } from '../components/PengingatHero';
import { PengingatFilter } from '../components/PengingatFilter';
import { PengingatFeatureCard } from '../components/PengingatFeatureCard';
import { PengingatEntryModal } from '../components/PengingatEntryModal';
import { PengingatDetailModal } from '../components/PengingatDetailModal';
import { PengingatModal } from '../components/PengingatModal';
import { PremiumUpgradeModal } from '@/features/kelola-pura/components/PremiumUpgradeModal';
import { PENGINGAT_CATEGORIES } from '../data/pengingatData';
import { getConditionLabel } from '../utils/pengingatUtils';
import type { PengingatDialog, PengingatEntry, PengingatFilter as KindFilter, PengingatKind } from '../types/pengingat.types';

/** Daftar pribadi berasal dari backend; tidak menggunakan data contoh atau localStorage. */
export default function PengingatPage() {
  const [today, setToday] = useState(getTodayWITA);
  const query = usePengingat();
  const policyQuery = usePengingatPolicy();
  const policy = policyQuery.isError ? null : policyQuery.data ?? null;
  const { create, remove } = usePengingatMutations();
  const entries = useMemo(() => query.data ?? [], [query.data]);
  const [params, setParams] = useSearchParams();
  const linkedId = params.get('reminder');
  const [deleteError, setDeleteError] = useState('');
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<KindFilter>('semua');
  const [expandedKinds, setExpandedKinds] = useState<PengingatKind[]>([]);
  const [dialog, setDialog] = useState<PengingatDialog | null>(null);
  const [notice, setNotice] = useState('');
  const [blockedKind, setBlockedKind] = useState<PengingatKind | null>(null);
  const closeLimitDialog = useCallback(() => setBlockedKind(null), []);
  const closeDialog = useCallback(() => { setDialog(null); setParams(current => { const next = new URLSearchParams(current); next.delete('reminder'); return next; }, { replace: true }); }, [setParams]);

  useEffect(() => useAuthStore.subscribe((current, previous) => {
    if (current.user?.id !== previous.user?.id || current.isAuthenticated !== previous.isAuthenticated) { setDialog(null); setBlockedKind(null); setNotice(''); setExpandedKinds([]); }
  }), []);

  useEffect(() => {
    document.title = 'Pengingat Saya · Kalender Bali';
    const refreshToday = () => setToday(getTodayWITA());
    const timer = window.setInterval(refreshToday, 60_000);
    window.addEventListener('focus', refreshToday);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refreshToday); };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 5_000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const searched = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id');
    return entries.filter(entry => !query || `${entry.title} ${entry.sourceLabel} ${entry.note} ${getConditionLabel(entry.condition)}`.toLocaleLowerCase('id').includes(query));
  }, [entries, search]);
  const counts: Record<KindFilter, number> = { semua: searched.length, otonan: 0, piodalan: 0, 'hari-raya': 0, 'mengatur-dewasa': 0 };
  searched.forEach(entry => { counts[entry.kind]++; });
  const filtered = searched.filter(entry => kind === 'semua' || entry.kind === kind);
  const hasFilter = Boolean(search.trim());
  const categories = PENGINGAT_CATEGORIES.filter(category => (kind === 'semua' || category.id === kind) &&
    (!hasFilter || filtered.some(entry => entry.kind === category.id)));
  const visibleDialog = dialog ?? (linkedId ? { type: 'detail' as const, id: linkedId } : null);
  const selectedEntry = visibleDialog && visibleDialog.type !== 'form' ? entries.find(entry => entry.id === visibleDialog.id) : undefined;

  const resetFilters = () => { setSearch(''); setKind('semua'); };
  const openAdd = (feature: PengingatKind) => {
    if (!policy) return;
    if (entries.filter(entry => entry.kind === feature).length >= policy.maxPerFeature) {
      setBlockedKind(feature);
      return;
    }
    setDialog({ type: 'form', kind: feature });
  };
  const addEntry = async (entry: PengingatEntry) => {
    await create.mutateAsync(entry);
    setExpandedKinds(current => current.includes(entry.kind) ? current : [...current, entry.kind]);
    // Pastikan catatan yang baru disimpan terlihat, termasuk jika filter sebelumnya berbeda.
    resetFilters();
    closeDialog();
    setNotice(`${entry.title} ditambahkan.`);
  };

  if (query.isLoading && !query.data) return <PengingatSkeleton />;
  if (query.isError && !query.data) return <QueryErrorState title="Pengingat belum dapat dimuat" error={query.error} onRetry={() => void query.refetch()} />;

  return <div className="space-y-6 pb-8">
    <PengingatHero entries={entries} today={today} onDetail={entry => setDialog({ type: 'detail', id: entry.id })} />

    {policyQuery.isError && <QueryErrorState title="Batas paket pengingat belum dapat diperiksa" error={policyQuery.error} onRetry={() => void policyQuery.refetch()} />}

    {query.isError && <QueryErrorState title="Sinkronisasi pengingat belum berhasil" error={query.error} onRetry={() => void query.refetch()} />}
    <div className="space-y-4">
      <PengingatFilter search={search} kind={kind} counts={counts} onSearch={setSearch} onKind={setKind} />
    </div>

    <p role="status" aria-live="polite" className="sr-only">Menampilkan {filtered.length} catatan dalam {categories.length} kartu fitur.</p>
    {categories.length ? <div className={`grid grid-cols-1 gap-5 sm:gap-6 items-start ${kind === 'semua' ? 'xl:grid-cols-2' : ''}`}>
      {categories.map(category => <PengingatFeatureCard key={category.id} category={category} policy={policy} entries={filtered.filter(entry => entry.kind === category.id)} total={entries.filter(entry => entry.kind === category.id).length} today={today} filtered={hasFilter} expanded={expandedKinds.includes(category.id)} onExpand={() => setExpandedKinds(current => current.includes(category.id) ? current.filter(value => value !== category.id) : [...current, category.id])} onAdd={() => openAdd(category.id)} onDetail={entry => setDialog({ type: 'detail', id: entry.id })} />)}
    </div> : <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 px-6 py-14 text-center flex flex-col items-center">
      <SearchX className="w-9 h-9 text-slate-300 dark:text-slate-600 mb-4" /><h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Belum ada pengingat yang cocok</h3><p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">Coba nama lain atau ubah filter untuk menemukan catatanmu.</p><button type="button" onClick={resetFilters} className="mt-5 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer inline-flex items-center gap-2"><RotateCcw className="w-4 h-4" />Reset filter</button>
    </div>}

    <div className="flex items-start gap-2 text-xs text-slate-400 dark:text-slate-500 leading-relaxed px-1"><BellRing className="w-4 h-4 shrink-0" /><p>Pengingat pribadi hanya untukmu. Catatan keluarga tidak menjadi data publik.</p></div>

    {dialog?.type === 'form' && <PengingatEntryModal key={dialog.kind} kind={dialog.kind} policy={policy} today={today} onClose={closeDialog} onSave={addEntry} />}
    {blockedKind && policy?.tier === 'Free' && <PremiumUpgradeModal isOpen onClose={closeLimitDialog}
      title="Tambah Lebih Banyak Pengingat"
      description={<>Batas pengingat {PENGINGAT_CATEGORIES.find(category => category.id === blockedKind)?.singular} untuk akun Free sudah tercapai. Tingkatkan ke Premium untuk menambahkan lebih banyak pengingat.</>}
      benefits={['Hingga 10 pengingat per fitur', 'Pengingat berulang sesuai siklus fitur selama Premium aktif']} />}
    {blockedKind && policy?.tier === 'Premium' && <PengingatModal title="Batas Pengingat Tercapai" description="Kuota pengingat fitur ini sudah penuh." onClose={closeLimitDialog}
      footer={<button type="button" onClick={closeLimitDialog} className="h-11 px-4 rounded-xl bg-[#0e9f90] text-white text-sm font-bold cursor-pointer">Tutup</button>}>
      <p className="text-sm text-slate-600 dark:text-slate-300">Kamu sudah menyimpan <span className="tabular-nums">10</span> pengingat untuk fitur ini. Hapus salah satu catatan untuk menambahkan pengingat baru.</p>
    </PengingatModal>}
    {selectedEntry && visibleDialog?.type !== 'form' && <PengingatDetailModal entry={selectedEntry} today={today} deleting={visibleDialog?.type === 'delete'} busy={remove.isPending} error={deleteError} onClose={closeDialog} onDelete={() => { setDeleteError(''); setDialog({ type: 'delete', id: selectedEntry.id }); }} onConfirmDelete={async () => {
      if (remove.isPending) return;
      setDeleteError('');
      try { await remove.mutateAsync(selectedEntry.id); closeDialog(); setNotice(`${selectedEntry.title} dihapus.`); }
      catch (failure) { setDeleteError(toApiError(failure).message || 'Pengingat belum berhasil dihapus.'); }
    }} />}
    {linkedId && !selectedEntry && !query.isLoading && <p role="status" className="text-sm text-slate-500">Pengingat dari tautan ini sudah tidak tersedia.</p>}

    {notice && <div role="status" aria-live="polite" className="fixed bottom-5 right-4 sm:right-6 z-[120] max-w-[calc(100vw-2rem)] sm:max-w-md bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 shadow-lg rounded-2xl px-4 py-3 flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0"><Check className="w-4 h-4" /></span><p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 break-words">{notice}</p><button type="button" onClick={() => setNotice('')} aria-label="Tutup pemberitahuan" className="min-w-11 min-h-11 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><X className="w-4 h-4" /></button></div>}
  </div>;
}
