import { useState } from 'react';
import { ArrowLeft, Plus, Pencil, Trash2, Wallet, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { useAlertStore } from '@/stores/useAlertStore';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import type { KomunitasDetail, KomunitasFinanceEntry } from '../types/komunitas.types';
import { useKomunitasCategories, useKomunitasFinance, useKomunitasMutations } from '../hooks/useKomunitas';
import { financeDate, rupiah, todayWita } from '../utils/komunitasUtils';
import { KomunitasFinanceModal } from './KomunitasFinanceModal';
import { KomunitasDeleteConfirmModal } from './KomunitasDeleteConfirmModal';
import { cardStyle, inputStyle, primaryButton, secondaryButton } from './komunitasStyles';

/** Buku kas hanya membaca ID komunitas aktif; filter jenis tidak mengubah ringkasan debit/kredit. */
export function KomunitasKeuanganView({ profile, canManage, year, category, entryType, onFilters, onBack }: {
  profile: KomunitasDetail; canManage: boolean; year: string; category?: number; entryType: string;
  onFilters: (patch: Record<string, string | null>) => void; onBack: () => void;
}) {
  const { entries, summary } = useKomunitasFinance(profile.id, year, category, entryType);
  const categories = useKomunitasCategories(), mutations = useKomunitasMutations(profile.id);
  const [editing, setEditing] = useState<KomunitasFinanceEntry | 'new' | null>(null), [deleting, setDeleting] = useState<KomunitasFinanceEntry | null>(null);
  const showAlert = useAlertStore(state => state.showAlert);
  const busy = mutations.createFinance.isPending || mutations.updateFinance.isPending || mutations.removeFinance.isPending;
  const currentYear = Number(todayWita().slice(0, 4));
  const years = [...new Set([...(year === 'semua' ? [] : [Number(year)]), ...Array.from({ length: currentYear - 1899 }, (_, index) => currentYear + 1 - index)])].sort((a, b) => b - a);
  return <div className="space-y-6">
    <button type="button" onClick={onBack} className={secondaryButton}><ArrowLeft size={17} />Kembali ke Daftar Komunitas</button>
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-extrabold tracking-widest text-teal-700 uppercase">Buku Kas Komunitas</p><h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{profile.name}</h1><p className="mt-2 text-sm text-slate-500">Transparansi pemasukan dan pengeluaran kas komunitas.</p></div>{canManage && <button type="button" onClick={() => setEditing('new')} disabled={busy || categories.isLoading || categories.isError || !categories.data?.length} className={primaryButton}><Plus size={17} />Tambah Transaksi Kas</button>}</header>
    {/* Ringkasan berlabel filter agar selisih tahun tertentu tidak dianggap saldo penutupan. */}
    {summary.isError ? <QueryErrorState title="Ringkasan kas belum dapat dimuat" error={summary.error} onRetry={() => void summary.refetch()} /> : <div className="grid gap-4 md:grid-cols-3">{[
      { title: 'Saldo berdasarkan filter', value: summary.data?.saldo, icon: Wallet, color: 'bg-[#e6f7f5] text-teal-700' },
      { title: 'Total Pemasukan (Debit)', value: summary.data?.total_debit, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-700' },
      { title: 'Total Pengeluaran (Kredit)', value: summary.data?.total_kredit, icon: TrendingDown, color: 'bg-rose-50 text-rose-700' },
    ].map(stat => <div key={stat.title} className={cardStyle}><stat.icon size={20} className={`mb-4 box-content rounded-xl p-2.5 ${stat.color}`} /><p className="text-xs font-semibold text-slate-500">{stat.title}</p><p className="mt-2 text-xl font-extrabold tabular-nums text-slate-900">{summary.isLoading || stat.value == null ? '—' : rupiah(stat.value)}</p><p className="mt-2 text-xs tabular-nums text-slate-400">{year === 'semua' ? 'Semua tahun' : `Tahun ${year}`} · {category ? categories.data?.find(item => item.id === category)?.name || 'Kategori terpilih' : 'Semua kategori'}</p></div>)}</div>}
    <section className={`${cardStyle} space-y-5`}>
      <div className="flex items-center gap-2"><Receipt size={20} className="text-teal-700" /><h2 className="text-lg font-extrabold text-slate-900">Mutasi Kas</h2></div>
      <div className="grid gap-3 sm:grid-cols-3"><label><span className="mb-1 block text-xs font-bold text-slate-500">Tahun</span><select value={year} onChange={event => onFilters({ year: event.target.value })} className={`${inputStyle} tabular-nums`}><option value="semua">Semua tahun</option>{years.map(value => <option key={value} value={value}>{value}</option>)}</select></label><label><span className="mb-1 block text-xs font-bold text-slate-500">Kategori</span><select value={category || ''} disabled={categories.isLoading || categories.isError} onChange={event => onFilters({ category: event.target.value || null })} className={inputStyle}><option value="">Semua kategori</option>{categories.data?.map(value => <option key={value.id} value={value.id}>{value.name}</option>)}</select></label><label><span className="mb-1 block text-xs font-bold text-slate-500">Jenis transaksi (tabel)</span><select value={entryType} onChange={event => onFilters({ entry: event.target.value || null })} className={inputStyle}><option value="">Semua jenis</option><option value="debit">Pemasukan</option><option value="kredit">Pengeluaran</option></select></label></div>
      {categories.isError && <QueryErrorState title="Kategori kas belum dapat dimuat" error={categories.error} onRetry={() => void categories.refetch()} />}
      {categories.data?.length === 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Kategori transaksi belum tersedia. Pencatatan kas menunggu kategori dari pengelola sistem.</p>}
      {entries.isError ? <QueryErrorState title="Mutasi kas belum dapat dimuat" error={entries.error} onRetry={() => void entries.refetch()} /> : entries.isLoading ? <div role="status" aria-label="Memuat mutasi kas" className="h-64 animate-pulse rounded-xl bg-slate-100" /> : <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[700px] text-left text-sm"><caption className="sr-only">Transaksi kas {profile.name}</caption><thead className="bg-slate-50 text-xs font-bold text-slate-500"><tr>{['Tanggal', 'Kategori', 'Catatan', 'Debit', 'Kredit', ...(canManage ? ['Aksi'] : [])].map(label => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{entries.data?.map(entry => <tr key={entry.id} className="hover:bg-slate-50/60"><td className="whitespace-nowrap px-4 py-4 tabular-nums text-slate-500">{financeDate(entry.transaction_date)}</td><td className="px-4 py-4 font-semibold text-slate-700">{entry.category_name}</td><td className="max-w-sm break-words px-4 py-4 text-slate-500">{entry.note || '—'}</td><td className="whitespace-nowrap px-4 py-4 text-right font-bold tabular-nums text-emerald-700">{entry.entry_type === 'debit' ? rupiah(entry.amount) : '—'}</td><td className="whitespace-nowrap px-4 py-4 text-right font-bold tabular-nums text-rose-700">{entry.entry_type === 'kredit' ? rupiah(entry.amount) : '—'}</td>{canManage && <td className="px-4 py-4"><div className="flex gap-1"><button type="button" aria-label={`Edit transaksi ${entry.note || entry.category_name}`} disabled={busy || categories.isError || categories.isLoading} onClick={() => setEditing(entry)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50"><Pencil size={16} /></button><button type="button" aria-label={`Hapus transaksi ${entry.note || entry.category_name}`} disabled={busy} onClick={() => setDeleting(entry)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-rose-700 hover:bg-rose-50"><Trash2 size={16} /></button></div></td>}</tr>)}</tbody></table>
        {!entries.data?.length && <p className="p-10 text-center text-sm text-slate-500">Belum ada transaksi untuk filter ini.</p>}
      </div>}
    </section>
    {canManage && editing && <KomunitasFinanceModal key={editing === 'new' ? 'new' : editing.id} communityId={profile.id} communityName={profile.name} entry={editing === 'new' ? undefined : editing} categories={categories.data || []} busy={busy} onClose={() => setEditing(null)} onSave={async payload => {
      if (editing === 'new') await mutations.createFinance.mutateAsync(payload);
      else await mutations.updateFinance.mutateAsync({ entryId: editing.id, payload });
      setEditing(null); showAlert('Transaksi kas komunitas berhasil disimpan.');
    }} />}
    {canManage && deleting && <KomunitasDeleteConfirmModal title="Hapus Transaksi Kas?" description={`${profile.name}: ${rupiah(deleting.amount)} (${deleting.entry_type === 'debit' ? 'pemasukan' : 'pengeluaran'}), ${deleting.category_name}, ${financeDate(deleting.transaction_date)}. ${deleting.note || ''} Penghapusan memperbarui saldo komunitas dan tidak dapat dibatalkan.`} busy={busy} onClose={() => setDeleting(null)} onConfirm={async () => { await mutations.removeFinance.mutateAsync(deleting.id); setDeleting(null); showAlert('Transaksi kas komunitas berhasil dihapus.'); }} />}
  </div>;
}
