import { hasActivePremium } from '@/lib/subscription';
import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  PlusCircle,
  Pencil,
  Trash2,
  Crown,
  MapPin,
  Send,
  Eye,
} from 'lucide-react';
import type { PuraBackendItem, PuraFinanceEntry } from '../types/kelolaPura.types';
import {
  usePuraFinanceData,
  useFinanceCategoriesData,
  useFinanceMutations,
  useFinanceSubmissions,
} from '../hooks/useKelolaPura';
import {
  formatRupiah,
  formatDateWITA,
  getPuraTypeBadgeStyle,
  formatPuraLocation,
} from '../utils/kelolaPuraUtils';
import { FinanceEntryModal } from './FinanceEntryModal';
import { FinanceSubmissionModal } from './FinanceSubmissionModal';
import { FinanceSubmissionsDrawer } from './FinanceSubmissionsDrawer';
import { FinanceDeleteConfirmModal } from './FinanceDeleteConfirmModal';
import { PremiumUpgradeModal } from './PremiumUpgradeModal';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { QueryErrorState } from '@/components/ui/QueryErrorState';

/**
 * ==============================================================================
 * PROPS: PuraKeuanganView
 * ==============================================================================
 * Menerima data master pura terpilih dan profil detail untuk hak tulis:
 * - puraId: ID database pura yang sedang ditinjau transparansi keuangannya
 * - pura: Objek profil pura (atau null jika sedang dimuat)
 * - managementProfile: Profil detail terverifikasi untuk mapping pengelola (atau null)
 */
interface PuraKeuanganViewProps {
  puraId: number;
  pura: PuraBackendItem | null;
  managementProfile: PuraBackendItem | null;
}

type FinanceDialog = { kind: 'entry'; entry: PuraFinanceEntry | null } | { kind: 'submission' | 'upgrade' };

/**
 * ==============================================================================
 * KOMPONEN: PuraKeuanganView (Sub-Halaman Transparansi Kas Pura)
 * ==============================================================================
 * Memodernisasi tampilan laporan kas pura (sesuai Gambar 4) dengan arsitektur peran:
 * 1. Hak Akses Sesuai Peran (Role-Based Access Control):
 *    - Guest / Member Non-Premium: Dapat melihat seluruh data mutasi kas & ringkasan
 *      secara publik. Tombol 'Ajukan Usulan' menampilkan petunjuk upgrade Premium.
 *    - Member (Premium): Dapat melihat data + tombol aktif 'Ajukan Usulan / Koreksi Kas'.
 *    - Admin: Full Control dapat menambah (+), mengubah, dan menghapus catatan kas
 *      secara langsung, serta memverifikasi (Approve/Reject) usulan dari member.
 * 2. 4 Kartu Metrik Ringkasan Kas (Saldo Bersih, Total Punia, Total Pengeluaran, Jumlah Transaksi).
 * 3. Filter Interaktif: Filter tahun anggaran, filter kategori, dan tab jenis arus kas.
 * 4. Tabel Mutasi Kas Terstruktur: Tanggal WITA, kategori, uraian, debit/kredit, dan tombol aksi.
 * 5. Drawer Review Usulan Komunitas: Khusus Admin untuk meninjau usulan yang diajukan member.
 * ==============================================================================
 */
export const PuraKeuanganView: React.FC<PuraKeuanganViewProps> = ({
  puraId,
  pura,
  managementProfile,
}) => {
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();

  // ============================================================================
  // 1. EVALUASI PERAN & HAK AKSES PENGGUNA AKTIF
  // ============================================================================
  // Role Admin memiliki hak penuh untuk menambah, mengubah, dan menghapus transaksi
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const roleLower = (user.role || '').toLowerCase();
    return roleLower === 'admin' || user.tier === 'Admin';
  }, [user]);

  // Mapping terbaru menentukan hak tulis kas; Premium tetap hanya jalur usulan lama.
  const canManage = !!managementProfile && (isAdmin ||
    managementProfile.manager?.some(manager => String(manager.user_id) === user?.id) === true);

  // Role Member Premium memiliki hak mengajukan draf usulan catatan kas baru
  const isPremium = useMemo(() => {
    if (!user) return false;
    return hasActivePremium(user);
  }, [user]);

  // ============================================================================
  // 2. STATE FILTER KEUANGAN (TAHUN, KATEGORI, JENIS KAS)
  // ============================================================================
  const [selectedYear, setSelectedYear] = useState<string>('Semua');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [entryTypeFilter, setEntryTypeFilter] = useState<'all' | 'debit' | 'kredit'>('all');

  // State Modal Aksi Keuangan
  const [dialog, setDialog] = useState<FinanceDialog | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<PuraFinanceEntry | null>(null);
  const [showSubmissionsDrawer, setShowSubmissionsDrawer] = useState<boolean>(false);

  // ============================================================================
  // 3. PENGAMBILAN DATA KAS ASINKRON (BACKEND GO VIA TANSTACK QUERY)
  // ============================================================================
  // Ambil daftar mutasi kas dan kalkulasi ringkasan kas (Saldo, Total Debit, Total Kredit)
  const { entries, summary, isLoading, isError, error, refetch } = usePuraFinanceData(
    puraId,
    selectedYear === 'Semua' ? undefined : selectedYear,
    selectedCategory === 'Semua' ? undefined : selectedCategory,
    entryTypeFilter === 'all' ? undefined : entryTypeFilter
  );

  // Ambil master kategori kas untuk dropdown filter dan form modal
  const { data: categories = [], error: categoriesError, isError: isCategoriesError, refetch: refetchCategories } = useFinanceCategoriesData();

  // Hook aksi mutasi untuk Admin
  const { deleteEntry, isDeleting } = useFinanceMutations(puraId);

  // Hook antrean usulan kas dari member
  const { submissions, pendingCount, markApproved, markRejected } = useFinanceSubmissions(puraId);

  // Daftar opsi tahun yang tersedia dari data riil transaksi kas
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    entries.forEach((e) => {
      if (e.transaction_date) {
        const y = e.transaction_date.slice(0, 4);
        if (y) yearsSet.add(y);
      }
    });
    const arr = Array.from(yearsSet).sort().reverse();
    return arr.length > 0 ? arr : [String(new Date().getFullYear())];
  }, [entries]);

  // Ambil gaya visual badge tipe pura
  const badgeStyle = getPuraTypeBadgeStyle(pura?.type);

  // Handler: Tutup modal konfirmasi hapus transaksi kas
  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setEntryToDelete(null);
    }
  };

  // Handler: Eksekusi konfirmasi hapus transaksi kas oleh Admin
  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      await deleteEntry(entryToDelete.id);
      setEntryToDelete(null);
    } catch {
      showAlert("Transaksi kas gagal dihapus. Silakan coba lagi.");
    }
  };

  if (isError) return <QueryErrorState title="Gagal memuat laporan kas pura" error={error} onRetry={() => refetch()} />;
  if (isLoading) return (
    <div aria-busy="true" aria-label="Memuat laporan kas pura" className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0, 1, 2, 3].map(key => <div key={key} className="h-28 rounded-2xl bg-slate-100" />)}</div>
      <div className="h-64 rounded-2xl bg-slate-100" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 4. KARTU INFORMASI UTAMA: IDENTITAS PURA & KONTROL TRANSAKSI         */}
      {/* ==================================================================== */}
      <section
        aria-label="Header Transparansi Keuangan Pura"
        className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs"
      >
        {isCategoriesError && <QueryErrorState title="Gagal memuat kategori kas" error={categoriesError} onRetry={() => refetchCategories()} />}
        {/* Identitas Pura & Tombol Aksi Sesuai Peran Pengguna */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Lencana Klasifikasi Tipe Pura */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle.container}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeStyle.dot}`}
                  aria-hidden="true"
                />
                <span>{pura?.type || 'Pura Umum'}</span>
              </span>
            </div>

            {/* Judul Utama Identitas Pura */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Transparansi Kas {pura?.name || 'Pura'}
            </h2>

            {/* Lokasi Pura */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 font-medium">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              <span>
                {formatPuraLocation(pura)}
              </span>
            </div>
          </div>

          {/* Baris Tombol Aksi Pengguna */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {/* Aksi kas langsung tersedia bagi Admin atau pengelola pura yang dipetakan. */}
            {canManage && (
              <button
                type="button"
                onClick={() => setDialog({ kind: 'entry', entry: null })}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0e9f90] text-white hover:bg-[#0c8a7d] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                <span>Catat Transaksi Baru</span>
              </button>
            )}

            {/* Aksi 2: Drawer Review Usulan Komunitas (Khusus Admin) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowSubmissionsDrawer((prev) => !prev)}
                className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  pendingCount > 0
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Eye className="w-4 h-4 text-amber-600" aria-hidden="true" />
                <span>Usulan Member</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white tabular-nums">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            {/* Aksi 3: Tombol Ajukan Usulan / Koreksi Kas (Untuk Member / Guest) */}
            {!canManage && (
              <button
                type="button"
                onClick={() => setDialog({ kind: isAdmin || isPremium ? 'submission' : 'upgrade' })}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <Send className="w-4 h-4 text-[#0e9f90]" aria-hidden="true" />
                <span>Ajukan Usulan / Koreksi Kas</span>
                {isPremium && (
                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. EMPAT KARTU METRIK RINGKASAN KAS (TABULAR-NUMS PRESISI)           */}
      {/* ==================================================================== */}
      <section
        aria-label="Ringkasan Arus Kas Pura"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Kartu 1: Saldo Kas Pura */}
        <div className="bg-gradient-to-br from-teal-500/10 via-white to-emerald-500/5 rounded-2xl border border-teal-200/80 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Saldo Kas Pura</span>
            <span className="text-xl sm:text-2xl font-extrabold text-teal-950 tabular-nums block">
              {formatRupiah(summary?.saldo ?? 0)}
            </span>
            <span className="text-[11px] text-teal-700 font-medium">Saldo kas mutasi berjalan</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0e9f90] shrink-0">
            <Wallet className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>

        {/* Kartu 2: Total Kas Masuk (Punia) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Total Kas Masuk (Punia)</span>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 tabular-nums block">
              {formatRupiah(summary?.total_debit ?? 0)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Total dana punia diterima</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>

        {/* Kartu 3: Total Kas Keluar (Pengeluaran / Belanja) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Total Kas Keluar (Belanja)</span>
            <span className="text-xl sm:text-2xl font-extrabold text-rose-600 tabular-nums block">
              {formatRupiah(summary?.total_kredit ?? 0)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Banten, upacara & operasional</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <TrendingDown className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>

        {/* Kartu 4: Jumlah Baris Transaksi Terdata */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Jumlah Transaksi</span>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums block">
              {entries.length} Catatan
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Sesuai filter aktif</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-500 shrink-0">
            <Receipt className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. DRAWER TINJAUAN USULAN MEMBER (KHUSUS ROLE ADMINISTRATOR)         */}
      {/* ==================================================================== */}
      {isAdmin && showSubmissionsDrawer && (
        <FinanceSubmissionsDrawer
          submissions={submissions}
          onApprove={markApproved}
          onReject={markRejected}
          onClose={() => setShowSubmissionsDrawer(false)}
        />
      )}

      {/* ==================================================================== */}
      {/* 7. BILAH KONTROL FILTER (TAHUN, KATEGORI, JENIS KAS)                 */}
      {/* ==================================================================== */}
      <section
        aria-label="Panel Filter Transaksi Kas"
        className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tab Pilihan Aliran Kas (Semua vs Masuk vs Keluar) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl self-start">
            <button
              type="button"
              onClick={() => setEntryTypeFilter('all')}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                entryTypeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Mutasi
            </button>
            <button
              type="button"
              onClick={() => setEntryTypeFilter('debit')}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                entryTypeFilter === 'debit'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Kas Masuk (Punia)
            </button>
            <button
              type="button"
              onClick={() => setEntryTypeFilter('kredit')}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                entryTypeFilter === 'kredit'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Kas Keluar (Belanja)
            </button>
          </div>

          {/* Dropdown Filter Tahun Anggaran & Kategori */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Tahun */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-semibold">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                aria-label="Pilih tahun anggaran kas"
                className="min-h-[38px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] cursor-pointer"
              >
                <option value="Semua">Semua Tahun</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Kategori */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-semibold">Kategori:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Pilih kategori transaksi kas"
                className="min-h-[38px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] cursor-pointer"
              >
                <option value="Semua">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. TABEL MUTASI KAS PURA (RESPONSIF DENGAN HORIZONTAL SCROLL)        */}
      {/* ==================================================================== */}
      <section
        aria-label="Tabel Catatan Mutasi Kas"
        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
      >
        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="p-6 space-y-3" aria-busy="true">
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        )}

        {/* Tabel Data Mutasi Kas */}
        {!isLoading && entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th scope="col" className="py-3.5 px-4 w-12 text-center">
                    #
                  </th>
                  <th scope="col" className="py-3.5 px-4 whitespace-nowrap">
                    Tanggal
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Aliran
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Kategori
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Uraian / Keterangan
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-right whitespace-nowrap">
                    Nominal (Rp)
                  </th>
                  {canManage && (
                    <th scope="col" className="py-3.5 px-4 text-center w-28">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {entries.map((entry, index) => {
                  const isDebit = entry.entry_type === 'debit';
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-teal-50/20 transition-colors group"
                    >
                      {/* Nomor Baris */}
                      <td className="py-3 px-4 text-center text-slate-400 font-mono tabular-nums">
                        {index + 1}
                      </td>

                      {/* Tanggal Transaksi */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        {formatDateWITA(entry.transaction_date)}
                      </td>

                      {/* Badge Aliran Kas */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isDebit
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isDebit ? (
                            <>
                              <TrendingUp className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                              <span>Kas Masuk</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-3 h-3 text-rose-600" aria-hidden="true" />
                              <span>Kas Keluar</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Kategori Transaksi */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-900 font-semibold">
                        {entry.category_name}
                      </td>

                      {/* Uraian Keterangan */}
                      <td className="py-3 px-4 text-slate-600 max-w-xs sm:max-w-md">
                        <p className="line-clamp-2">{entry.note || '—'}</p>
                      </td>

                      {/* Nominal Transaksi (Tabular Numbers) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold tabular-nums">
                        <span className={isDebit ? 'text-emerald-700' : 'text-rose-700'}>
                          {isDebit ? '+' : '-'}
                          {formatRupiah(entry.amount)}
                        </span>
                      </td>

                      {/* Tombol Aksi Khusus Admin */}
                      {canManage && (
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {/* Tombol Edit */}
                            <button
                              type="button"
                              onClick={() => setDialog({ kind: 'entry', entry })}
                              aria-label={`Ubah catatan ${entry.note}`}
                              title="Ubah catatan kas"
                              className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>

                            {/* Tombol Hapus */}
                            <button
                              type="button"
                              onClick={() => setEntryToDelete(entry)}
                              disabled={isDeleting}
                              aria-label={`Hapus catatan ${entry.note}`}
                              title="Hapus catatan kas"
                              className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State: Tidak Ada Transaksi Kas yang Cocok */}
        {!isLoading && entries.length === 0 && (
          <div className="p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mx-auto text-slate-400">
              <Receipt className="w-7 h-7" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Belum Ada Catatan Transaksi Kas
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Tidak ada entri mutasi kas yang ditemukan untuk kriteria filter yang Anda pilih.
                {canManage && ' Anda dapat menambahkan catatan kas baru melalui tombol di atas.'}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* 9. MODAL FORMULIR TRANSAKSI KAS (KHUSUS ADMINISTRATOR)               */}
      {/* ==================================================================== */}
      <FinanceEntryModal
        isOpen={dialog?.kind === 'entry' && canManage}
        onClose={() => setDialog(current => current?.kind === 'entry' ? null : current)}
        puraId={puraId}
        puraName={pura?.name || 'Pura'}
        entryToEdit={dialog?.kind === 'entry' ? dialog.entry : null}
        categories={categories}
        onSubmitSuccess={() => refetch()}
      />

      {/* ==================================================================== */}
      {/* 10. MODAL FORMULIR PENGUSULAN KAS (KHUSUS MEMBER PREMIUM)            */}
      {/* ==================================================================== */}
      <FinanceSubmissionModal
        isOpen={dialog?.kind === 'submission'}
        onClose={() => setDialog(null)}
        puraId={puraId}
        puraName={pura?.name || 'Pura'}
        categories={categories}
      />

      {/* ==================================================================== */}
      {/* 11. MODAL KONFIRMASI HAPUS TRANSAKSI KAS (KHUSUS ADMINISTRATOR)      */}
      {/* ==================================================================== */}
      <FinanceDeleteConfirmModal
        isOpen={Boolean(entryToDelete) && canManage}
        entry={entryToDelete}
        isLoading={isDeleting}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      {/* ==================================================================== */}
      {/* 12. MODAL DIALOG UPGRADE PREMIUM (UNTUK GUEST / MEMBER FREE)         */}
      {/* ==================================================================== */}
      <PremiumUpgradeModal
        isOpen={dialog?.kind === 'upgrade'}
        onClose={() => setDialog(null)}
        title="Fitur Khusus Member Premium"
        description={
          <>
            Pengajuan koreksi dan usulan catatan kas pura adalah hak istimewa bagi{' '}
            <strong className="text-amber-800 font-bold">Member Premium</strong> untuk menjaga
            keabsahan data transparansi komunitas.
          </>
        }
        benefits={[
          'Mengajukan usulan mutasi kas pura',
          'Mendapatkan notifikasi piodalan pura keluarga',
          'Akses penuh perhitungan wariga terperinci',
        ]}
      />
    </div>
  );
};
