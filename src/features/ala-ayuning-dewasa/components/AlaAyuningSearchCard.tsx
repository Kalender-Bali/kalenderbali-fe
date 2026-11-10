import React, { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { AestheticDatePicker } from '@/components/ui/AestheticDatePicker';
import type { PadewasanItem, AlaAyuningSearchMode } from '../types/alaAyuning.types';

/**
 * ============================================================================
 * KOMPONEN: AlaAyuningSearchCard (Form Pencarian Kecocokan Dewasa)
 * ============================================================================
 * Form pencarian interaktif dengan dua mode, mengikuti pola desain seragam
 * OtonanFormSection dan WarigaPersonalForm:
 *
 *  1. Header Form + Segmented Tab Switcher (bg-slate-100 p-1 rounded-xl)
 *     - Tab "Berdasarkan Tanggal": Memeriksa seluruh padewasan aktif pada tanggal tertentu.
 *     - Tab "Cari Nama Padewasan": Mencari tanggal jatuh suatu padewasan dalam 1 bulan.
 *
 *  2. Mode Berdasarkan Tanggal:
 *     - AestheticDatePicker (komponen shared UI) — sama dengan Otonan dan Wariga Personal.
 *     - Tombol aksi "Lihat kecocokan" beraksen Teal (#0e9f90).
 *
 *  3. Mode Cari Nama Padewasan:
 *     - Dropdown 220 kriteria padewasan dari master Go backend.
 *     - Pilihan Bulan dan Tahun (dropdown).
 *     - Tombol "Cari tanggal jatuh".
 *
 * Mengikuti Panduan AGENTS.md:
 *  - Wadah Card: bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs
 *  - Seluruh kontrol h-11 (44px), [touch-action:manipulation]
 *  - Label: text-[11px] font-extrabold text-slate-400 uppercase tracking-widest
 *  - Dropdown: ChevronDown di sisi kanan, appearance-none
 *  - Tombol primer: bg-[#0e9f90] hover:bg-[#0c8a7d] active:scale-98
 * ============================================================================
 */

interface AlaAyuningSearchCardProps {
  /** Mode pencarian aktif ('date' | 'name') */
  activeMode: AlaAyuningSearchMode;
  onModeChange: (mode: AlaAyuningSearchMode) => void;

  /** Nilai tanggal aktif untuk mode tanggal (format YYYY-MM-DD) */
  selectedDate: string;
  onDateChange: (date: string) => void;

  /** Parameter untuk mode nama padewasan */
  selectedName: string;
  selectedMonth: number;
  selectedYear: number;
  onSearchByName: (name: string, month: number, year: number) => void;

  /** Katalog master data 220 padewasan dari server Go */
  masterList: PadewasanItem[];
  isMasterLoading?: boolean;

  /** Status pemuatan data dari server */
  isLoading?: boolean;
}

const BULAN_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

export const AlaAyuningSearchCard: React.FC<AlaAyuningSearchCardProps> = ({
  activeMode,
  onModeChange,
  selectedDate,
  onDateChange,
  selectedName,
  selectedMonth,
  selectedYear,
  onSearchByName,
  masterList,
  isMasterLoading = false,
  isLoading = false,
}) => {
  // State lokal untuk mencegah refetch di setiap ketukan
  const [localDate, setLocalDate] = useState(selectedDate);
  const [localName, setLocalName] = useState(selectedName);
  const [localMonth, setLocalMonth] = useState(selectedMonth);
  const [localYear, setLocalYear] = useState(selectedYear);

  // Opsi tahun: 5 tahun lalu s.d. 10 tahun mendatang
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i);

  // Sinkronisasi state lokal saat props dari URL berubah
  useEffect(() => {
    setLocalDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setLocalName(selectedName || masterList[0]?.nama || '');
    setLocalMonth(selectedMonth);
    setLocalYear(selectedYear);
  }, [selectedName, selectedMonth, selectedYear, masterList]);

  // Handler submit mode tanggal
  const handleDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localDate && localDate.trim() !== '') {
      onDateChange(localDate.trim());
    }
  };

  // Handler submit mode nama padewasan
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localName && localName.trim() !== '') {
      onSearchByName(localName.trim(), localMonth, localYear);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs">
      {/* ===================================================================== */}
      {/* BLOK 1: HEADER FORM & SEGMENTED TAB SWITCHER                         */}
      {/* Pola seragam dengan OtonanFormSection (flex justify-between)          */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        {/* Judul & Deskripsi Form */}
        <div>
          <h3 className="text-lg font-extrabold text-[#0f172a] dark:text-white tracking-tight">
            Cari Kecocokan Dewasa
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Pilih metode pencarian untuk menelusuri hari baik dan buruk.
          </p>
        </div>

        {/* Segmented Tab Switcher — seragam dengan Otonan (bg-slate-100 p-1 rounded-xl) */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl inline-flex items-center gap-1 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onModeChange('date')}
            className={`py-1.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeMode === 'date'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
            }`}
          >
            Berdasarkan Tanggal
          </button>
          <button
            type="button"
            onClick={() => onModeChange('name')}
            className={`py-1.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeMode === 'name'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
            }`}
          >
            Cari Nama Padewasan
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BLOK 2: BODY FORM (berganti sesuai mode aktif)                        */}
      {/* ===================================================================== */}

      {/* MODE TANGGAL: Pemilih tanggal dengan AestheticDatePicker               */}
      {activeMode === 'date' && (
        <form onSubmit={handleDateSubmit} className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            {/* Field Tanggal Pemeriksaan — pakai AestheticDatePicker seragam dengan Otonan */}
            <div className="lg:col-span-7 space-y-1.5">
              <label
                htmlFor="ala-date-picker"
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                TANGGAL PEMERIKSAAN
              </label>
              {/* AestheticDatePicker: komponen shared UI dengan kalender popover estetik
                  (sama digunakan oleh Otonan dan Wariga Personal) */}
              <AestheticDatePicker
                id="ala-date-picker"
                value={localDate}
                onChange={(iso) => setLocalDate(iso)}
                placeholder="dd/mm/yyyy"
                allowFuture={true}
                required
              />
            </div>

            {/* Tombol Aksi "Lihat kecocokan" */}
            <div className="lg:col-span-5">
              <button
                type="submit"
                disabled={isLoading || !localDate}
                className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50 [touch-action:manipulation]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mencari...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Cari</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Keterangan kontekstual di bawah input */}
          <p className="text-xs text-slate-400 font-medium mt-3">
            Periksa seluruh unsur padewasan yang aktif pada tanggal di atas, lengkap dengan
            analisis 4 pilar Pawukon dan uraian sastra budaya tervalidasi.
          </p>
        </form>
      )}

      {/* MODE NAMA: Pencarian tanggal jatuh berdasarkan nama padewasan          */}
      {activeMode === 'name' && (
        <form onSubmit={handleNameSubmit} className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            {/* Dropdown Nama Padewasan (lg:col-span-6) */}
            <div className="sm:col-span-2 lg:col-span-6 space-y-1.5">
              <label
                htmlFor="ala-name-select"
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                NAMA ALA AYUNING DEWASA
              </label>
              <div className="relative">
                <select
                  id="ala-name-select"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  disabled={isMasterLoading || masterList.length === 0}
                  className="w-full h-11 px-4 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all cursor-pointer appearance-none truncate [touch-action:manipulation]"
                  required
                >
                  {isMasterLoading ? (
                    <option value="">Memuat 220 kriteria padewasan...</option>
                  ) : (
                    masterList.map((item) => (
                      <option key={item.id} value={item.nama}>
                        {item.nama}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Dropdown Bulan (lg:col-span-2) */}
            <div className="sm:col-span-1 lg:col-span-2 space-y-1.5">
              <label
                htmlFor="ala-month-select"
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                BULAN
              </label>
              <div className="relative">
                <select
                  id="ala-month-select"
                  value={localMonth}
                  onChange={(e) => setLocalMonth(Number(e.target.value))}
                  className="w-full h-11 px-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all cursor-pointer appearance-none [touch-action:manipulation]"
                >
                  {BULAN_OPTIONS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Dropdown Tahun (lg:col-span-2) */}
            <div className="sm:col-span-1 lg:col-span-2 space-y-1.5">
              <label
                htmlFor="ala-year-select"
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                TAHUN
              </label>
              <div className="relative">
                <select
                  id="ala-year-select"
                  value={localYear}
                  onChange={(e) => setLocalYear(Number(e.target.value))}
                  className="w-full h-11 px-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all cursor-pointer appearance-none tabular-nums [touch-action:manipulation]"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Tombol Aksi "Cari tanggal jatuh" (lg:col-span-2) */}
            <div className="sm:col-span-2 lg:col-span-2">
              <button
                type="submit"
                disabled={isLoading || !localName}
                className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50 [touch-action:manipulation]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mencari...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Cari</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Keterangan kontekstual di bawah form nama */}
          <p className="text-xs text-slate-400 font-medium mt-3">
            Temukan tanggal-tanggal di mana kriteria padewasan ini jatuh pada bulan dan tahun
            terpilih (contoh: hari <em>Agni Agung Doyan Basmi</em> pada Oktober 2026).
          </p>
        </form>
      )}
    </div>
  );
};
