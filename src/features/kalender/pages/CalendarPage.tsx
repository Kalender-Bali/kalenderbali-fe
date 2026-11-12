import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { DataSkeleton } from '@/components/ui/DataSkeleton';
import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { EASE_SMOOTH } from '@/lib/animations';
import { useKalenderTahun, useMonthlyPiodalan } from '../hooks/useKalender';
import {
  exportHariRayaToICS,
  generateMonthGrid,
  getTodayWITA,
  isValidISODate,
  parseISODate,
  toISODateString,
} from '../utils/calendarUtils';
import { CalendarHeader } from '../components/CalendarHeader';
import { CalendarHero } from '../components/CalendarHero';
import { CalendarGrid } from '../components/CalendarGrid';
import { CalendarInspector } from '../components/CalendarInspector';
import { CalendarBottomSection } from '../components/CalendarBottomSection';
import { DayDetailModal } from '../components/DayDetailModal';

/**
 * ============================================================================
 * HALAMAN UTAMA: CalendarPage (Penyusun Kalender Bali Lengkap)
 * ============================================================================
 * Halaman orchestrator yang merakit seluruh sub-komponen kalender:
 *
 * Prinsip Arsitektur Utama (fe_strategy.md):
 *  1. URL-as-State: Status tanggal aktif dikontrol oleh query param URL
 *     (`/kalender?date=YYYY-MM-DD`). Tautan dapat dibagikan (shareable),
 *     mendukung tombol browser Back/Forward, dan tahan terhadap refresh halaman (F5).
 *  2. Zero-Loading: Mengambil data 1 tahun via `useKalenderTahun` (TanStack Query
 *     dengan `staleTime: Infinity`). Pergantian bulan & klik tanggal berjalan dalam 0ms.
 *  3. Responsivitas Layar Penuh:
 *     - Layar Desktop (lg): Split layout 2 kolom (Kolom Kiri 67% Grid, Kolom Kanan 33% Inspector).
 *     - Layar Mobile / Tablet: Tata letak vertikal terurut yang nyaman disentuh (min 44x44px).
 * ============================================================================
 */

export default function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawDate = searchParams.get('date');

  // Stop before mounting calendar hooks, grids, or details for an invalid URL.
  if (rawDate !== null && !isValidISODate(rawDate)) {
    return (
      <div className="space-y-6 w-full max-w-[1560px] mx-auto pb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">Kalender Bali</h1>
        <div role="alert" className="bg-white rounded-2xl border border-rose-200/90 p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Tanggal kalender tidak valid</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tanggal pada tautan ini tidak ada atau formatnya tidak sesuai. Gunakan tanggal Masehi yang valid.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.set('date', getTodayWITA());
              setSearchParams(nextParams, { replace: true });
            }}
            className="h-11 px-5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all cursor-pointer [touch-action:manipulation]"
          >
            Buka kalender hari ini
          </button>
        </div>
      </div>
    );
  }

  return <CalendarContent />;
}

function CalendarContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State lokal modal dialog rincian hari (dibuka saat tombol "Lihat detail hari" diklik)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // -------------------------------------------------------------------------
  // 1. SINKRONISASI TANGGAL AKTIF KE URL PARAMETER (?date=YYYY-MM-DD)
  // -------------------------------------------------------------------------
  const todayWITA = useMemo(() => getTodayWITA(), []);

  // Parameter sudah divalidasi CalendarPage; URL tanpa tanggal memakai hari ini.
  const selectedDate = searchParams.get('date') || todayWITA;

  // Uraikan tahun, bulan, dan hari dari tanggal terpilih
  const { year: activeYear, month: activeMonth } = useMemo(
    () => parseISODate(selectedDate),
    [selectedDate]
  );

  // -------------------------------------------------------------------------
  // 2. KONSUMSI DATA 1 TAHUN VIA TANSTACK QUERY (ZERO-LOADING)
  // -------------------------------------------------------------------------
  const {
    kalenderData,
    daysMap,
    isLoading,
    isError,
    error,
    refetch,
    getMonthDays,
    getMonthHolidays,
    getDayData,
  } = useKalenderTahun(activeYear, activeMonth);

  // Data tanggal yang sedang dipilih
  const selectedData = useMemo(() => getDayData(selectedDate), [getDayData, selectedDate]);

  // Data seluruh hari di bulan aktif & daftar hari raya bulan aktif
  const currentMonthDays = useMemo(
    () => getMonthDays(activeMonth),
    [getMonthDays, activeMonth]
  );
  const currentMonthHolidays = useMemo(
    () => getMonthHolidays(activeMonth),
    [getMonthHolidays, activeMonth]
  );

  // Ambil ringkasan piodalan bulan aktif secara instan & tangguh (Hybrid Resilient Engine)
  const { data: monthlyPiodalan, isLoading: isPiodalanLoading, isError: isPiodalanError, error: piodalanError, refetch: refetchPiodalan } = useMonthlyPiodalan(
    activeYear,
    activeMonth,
    currentMonthDays,
    todayWITA,
    kalenderData
  );

  // -------------------------------------------------------------------------
  // 3. GENERATOR MATRIKS GRID BULANAN (7 KOLOM: MIN s.d. SAB)
  // -------------------------------------------------------------------------
  const gridCells = useMemo(
    () => generateMonthGrid(activeYear, activeMonth, selectedDate, daysMap),
    [activeYear, activeMonth, selectedDate, daysMap]
  );

  // Subteks Tahun Saka & Sasih untuk header CalendarGrid
  const sakaYearText = useMemo(() => {
    // Ambil data hari pertengahan bulan untuk representasi Sasih bulan ini
    const midDay = currentMonthDays[Math.floor(currentMonthDays.length / 2)];
    const tahunSaka = midDay?.sasih?.tahun_saka || 1948;
    const rawSasih = midDay?.sasih?.nama_sasih || 'kapat';
    const namaSasih = rawSasih.charAt(0).toUpperCase() + rawSasih.slice(1);
    return `Saka ${tahunSaka} · Sasih ${namaSasih}`;
  }, [currentMonthDays]);

  // -------------------------------------------------------------------------
  // 4. ACTION HANDLERS (NAVIGASI & AKSI)
  // -------------------------------------------------------------------------

  /**
   * Mengubah tanggal terpilih dan menyinkronkannya langsung ke parameter URL.
   */
  const handleSelectDate = (newDateStr: string) => {
    if (!isValidISODate(newDateStr)) return;
    setSearchParams({ date: newDateStr });
  };

  /**
   * Mereset tampilan ke tanggal hari ini (zona WITA).
   */
  const handleResetToday = () => {
    setSearchParams({ date: todayWITA });
  };

  /**
   * Navigasi ke bulan sebelumnya.
   */
  const handlePrevMonth = () => {
    let newYear = activeYear;
    let newMonth = activeMonth - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const newDateStr = toISODateString(newYear, newMonth, 1);
    setSearchParams({ date: newDateStr });
  };

  /**
   * Navigasi ke bulan berikutnya.
   */
  const handleNextMonth = () => {
    let newYear = activeYear;
    let newMonth = activeMonth + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const newDateStr = toISODateString(newYear, newMonth, 1);
    setSearchParams({ date: newDateStr });
  };

  /**
   * Mengunduh berkas iCal (.ics) untuk seluruh hari raya di bulan aktif.
   */
  const handleDownloadICS = () => {
    exportHariRayaToICS(activeYear, activeMonth, currentMonthDays);
  };

  /**
   * Berpindah ke modul daftar Hari Raya lengkap.
   */
  const handleNavigateToFullHoliday = () => {
    navigate('/hari-raya');
  };

  if (isLoading) return (
    <div className="space-y-6">
      <CalendarHeader onDownloadICS={handleDownloadICS} isLoading />
      <DataSkeleton label="Memuat ringkasan kalender..." className="h-44" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 p-6" role="status" aria-label="Memuat kalender..." aria-busy="true">
          <div aria-hidden="true" className="animate-pulse space-y-5">
            <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="grid grid-cols-7 gap-2">{gridCells.map((_, index) => <div key={index} className="h-20 sm:h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}</div>
          </div>
        </div>
        <div className="lg:col-span-4"><DataSkeleton label="Memuat detail tanggal..." className="h-full min-h-96" /></div>
      </div>
    </div>
  );
  if (isError) return <QueryErrorState title="Gagal memuat data kalender" error={error ? new Error(error) : undefined} onRetry={() => { void refetch(); }} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: EASE_SMOOTH }}
      className="space-y-6 w-full max-w-[1560px] mx-auto pb-12"
    >
      {/* ========================================================= */}
      {/* 1. HEADER HALAMAN & TOMBOL AKSI CEPAT                     */}
      {/* ========================================================= */}
      <CalendarHeader
        onDownloadICS={handleDownloadICS}
        isLoading={isLoading}
      />

      {/* ========================================================= */}
      {/* NOTIFIKASI ERROR (JIKA KONEKSI KE SERVER GAGAL)          */}
      {/* ========================================================= */}


      {/* ========================================================= */}
      {/* 2. TOP HERO BAR (RINGKASAN BULAN & ZODIAK)                */}
      {/* ========================================================= */}
      <CalendarHero
        year={activeYear}
        month={activeMonth}
        sakaYearText={sakaYearText}
        monthlyHolidays={currentMonthHolidays}
        todayDateString={todayWITA}
        monthlyPiodalanCount={isPiodalanError || isPiodalanLoading ? null : monthlyPiodalan?.totalPuras}
        isLoading={isLoading}
      />

      {/* ========================================================= */}
      {/* 3. GRID UTAMA (SPLIT LAYOUT: GRID BULANAN + INSPECTOR)   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri (~67%): Matriks Bulanan 7 Kolom */}
        <div className="lg:col-span-8">
          <CalendarGrid
            year={activeYear}
            month={activeMonth}
            gridCells={gridCells}
            onSelectDate={handleSelectDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onResetToday={handleResetToday}
            canResetToday={selectedDate !== todayWITA}
          />
        </div>

        {/* Kolom Kanan (~33%): Panel Detail Tanggal Terpilih (Equal Height dengan Grid) */}
        <div className="lg:col-span-4 h-full">
          <CalendarInspector
            selectedDate={selectedDate}
            selectedData={selectedData}
            isToday={selectedDate === todayWITA}
            onOpenDetailModal={() => setIsDetailModalOpen(true)}
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. BAGIAN BAWAH: HARI RAYA BULAN INI & PIODALAN TERDEKAT  */}
      {/* ========================================================= */}
      <CalendarBottomSection
        monthlyHolidays={currentMonthHolidays}
        onSelectDate={handleSelectDate}
        onNavigateToFullHoliday={handleNavigateToFullHoliday}
        monthlyPiodalans={monthlyPiodalan?.upcomingItems}
        monthlyPiodalanTotal={monthlyPiodalan?.totalPuras}
        piodalanError={isPiodalanError ? piodalanError : null}
        isPiodalanLoading={isPiodalanLoading}
        onRetryPiodalan={() => { void refetchPiodalan(); }}
        activeYear={activeYear}
        activeMonth={activeMonth}
      />

      {/* ========================================================= */}
      {/* 5. MODAL DIALOG RINCIAN PENANGGALAN BALI LENGKAP         */}
      {/* ========================================================= */}
      <DayDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        dateString={selectedDate}
        dayData={selectedData}
      />
    </motion.div>
  );
}
