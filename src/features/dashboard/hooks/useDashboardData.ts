/**
 * ============================================================================
 * CUSTOM HOOK: useDashboardData (TanStack Query Orchestrator Dashboard)
 * ============================================================================
 * Hook orkestrator utama untuk seluruh data yang disajikan di halaman Dashboard.
 *
 * Menerapkan Prinsip Efisiensi (fe_strategy.md):
 *  1. ZERO DUPLICATION: Mengonsumsi langsung hook useKalenderTahun dari modul
 *     kalender tanpa membuat query HTTP baru ke server Go.
 *  2. ZERO-LOADING: Data 1 tahun kalender di memori RAM browser Lapis 3 digunakan
 *     bersama oleh Hero "Hari Ini", Mini Kalender, dan daftar Hari Raya Berikutnya.
 *  3. TIMEZONE LOCK: Mengunci evaluasi tanggal harian ke zona waktu absolut
 *     WITA (UTC+8 / Asia/Makassar) menggunakan getTodayWITA().
 *  4. Memakai ringkasan padewasan dan aturan piodalan dari data API.
 * ============================================================================
 */

import { useState, useMemo, useCallback } from 'react';
import { useReadQuery } from '@/lib/useReadQuery';
import { fetchDewasaAyuToday } from '@/features/ala-ayuning-dewasa/api/alaAyuningApi';
import { useKalenderTahun } from '@/features/kalender/hooks/useKalender';
import { fetchPuraObservances } from '@/features/piodalan/api/piodalanApi';
import {
  formatFullIndoDate,
  getIndoDayName,
  getIndoMonthName,
  getTodayWITA,
  getWarigaSummary,
  parseISODate,
} from '@/features/kalender/utils/calendarUtils';
import type {
  DashboardHeroData,
  DashboardMiniCalendarDay,
} from '../types/dashboard.types';
import {
  buildDashboardDewasaAyu,
  extractTopUpcomingHariRaya,
  extractTopUpcomingPiodalan,
  generateMiniCalendarGrid,
} from '../utils/dashboardUtils';

const HOLIDAY_LIMIT = 7;
const PIODALAN_LIMIT = 4;

export function useDashboardData() {
  // ---------------------------------------------------------------------------
  // 1. Inisialisasi Tanggal Hari Ini (WITA Absolut) & State Navigasi
  // ---------------------------------------------------------------------------
  const todayWITA = useMemo(() => getTodayWITA(), []);
  const todayParsed = useMemo(() => parseISODate(todayWITA), [todayWITA]);

  // State bulan dan tahun aktif untuk Mini Kalender (disatukan dalam satu state atomik
  // agar transisi tahun murni/pure tanpa efek ganda pada React StrictMode)
  const [calendarDate, setCalendarDate] = useState<{ year: number; month: number }>({
    year: todayParsed.year,
    month: todayParsed.month,
  });
  const { year: calendarYear, month: calendarMonth } = calendarDate;

  // State tanggal terpilih pada Mini Kalender (default: hari ini)
  const [selectedDate, setSelectedDate] = useState<string>(todayWITA);

  // ---------------------------------------------------------------------------
  // 2. Konsumsi Data Kalender 1 Tahun dari Backend Go via TanStack Query
  // ---------------------------------------------------------------------------
  // useKalenderTahun mengembalikan { kalenderData, daysMap, isLoading, ... }
  // Mengambil data 365 hari lengkap yang tersimpan di cache memori RAM (Zero-Loading).
  const {
    kalenderData: rawCalendarDays,
    daysMap,
    isLoading,
    isError,
    error,
    refetch,
  } = useKalenderTahun(calendarYear);

  // Konsumsi data kalender tahun berjalan untuk evaluasi agenda terdekat hari ini
  // (Zero-Loading: jika calendarYear === todayParsed.year, TanStack Query langsung
  // menggunakan instance query yang sama di memori RAM).
  const { kalenderData: todayYearCalendarDays } = useKalenderTahun(todayParsed.year);

  const { data: purasList, error: purasError, refetch: refetchPuras, isLoading: isPurasLoading } = useReadQuery({
    queryKey: ['piodalan', 'puras', 'observances'],
    queryFn: fetchPuraObservances,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 48,
    refetchOnWindowFocus: false,
  });
  const dewasaToday = useReadQuery({
    queryKey: ['ala-ayuning-dewasa', 'today', todayWITA],
    queryFn: fetchDewasaAyuToday,
    staleTime: 1000 * 60 * 5,
  });
  const dewasaAyu = buildDashboardDewasaAyu(dewasaToday.data, todayWITA);

  // ---------------------------------------------------------------------------
  // 3. Kompilasi Data Hero "HARI INI"
  // ---------------------------------------------------------------------------
  // Mengagregasikan identitas wewaran hari ini (Saptawara, Pancawara, Wuku, Sasih,
  // Pengalantaka, Urip, Arah, dan Dina ka-) dari data tanggal todayWITA.
  const heroData: DashboardHeroData = useMemo(() => {
    const todayDay = todayYearCalendarDays.find((day) => day.tanggal === todayWITA);

    const saptawaraName = todayDay?.wewaran?.saptawara?.nama || '-';
    const pancawaraName = todayDay?.wewaran?.pancawara?.nama || '-';
    const wukuName = todayDay?.wewaran?.wuku?.nama || '-';
    const rawSasih = todayDay?.sasih?.nama_sasih || '-';
    const sasihName = rawSasih.charAt(0).toUpperCase() + rawSasih.slice(1);

    // Ambil pengalantaka (Penanggal / Panglong beserta angkanya)
    const pengalantakaFase = todayDay?.pengalantaka?.pengalantaka || '-';
    const penanggalAngka = todayDay?.pengalantaka?.penanggal_1 ?? '-';
    const pengalantakaFormatted = `${pengalantakaFase} ${penanggalAngka}`;

    // Hitung Urip, Arah Pengider-ider, dan Dina Ka- (1 s.d. 7) via helper matematis
    const warigaSummary = getWarigaSummary(saptawaraName, pancawaraName);

    return {
      tanggalISO: todayWITA,
      tanggalFormatted: formatFullIndoDate(todayWITA),
      hariMasehi: getIndoDayName(todayWITA),
      saptawara: saptawaraName,
      pancawara: pancawaraName,
      wuku: wukuName,
      sasih: sasihName,
      pengalantaka: pengalantakaFormatted,
      dinaKa: todayDay ? warigaSummary.dinaKa : null,
      urip: todayDay?.wewaran.neptu ?? null,
      arah: todayDay ? `Arah ${warigaSummary.arah.toLowerCase()}` : 'Arah belum tersedia',
      quoteHariIni: dewasaAyu.headline,
      tahunSaka: todayDay?.sasih?.tahun_saka ?? null,
    };
  }, [todayYearCalendarDays, todayWITA, dewasaAyu.headline]);

  // ---------------------------------------------------------------------------
  // 4. Generator Matriks Sel Mini Kalender Bulanan (Senin s.d. Minggu)
  // ---------------------------------------------------------------------------
  const calendarGridCells: DashboardMiniCalendarDay[] = useMemo(() => {
    return generateMiniCalendarGrid(calendarYear, calendarMonth, selectedDate, daysMap);
  }, [calendarYear, calendarMonth, selectedDate, daysMap]);

  // Label bulan & rentang sasih untuk header Mini Kalender (contoh: "Sasih Katiga - Kapat")
  const calendarHeaderInfo = useMemo(() => {
    const monthName = getIndoMonthName(calendarMonth);
    const title = `${monthName} ${calendarYear}`;

    // Cari nama sasih pada awal dan akhir bulan aktif
    const monthPrefix = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-`;
    const daysInMonth = rawCalendarDays.filter((d) => d.tanggal.startsWith(monthPrefix));
    const firstSasihRaw = daysInMonth[0]?.sasih?.nama_sasih;
    const lastSasihRaw = daysInMonth[daysInMonth.length - 1]?.sasih?.nama_sasih;

    let sasihSubtitle = 'Sasih Kalender Bali';
    if (firstSasihRaw && lastSasihRaw) {
      const fCap = firstSasihRaw.charAt(0).toUpperCase() + firstSasihRaw.slice(1);
      const lCap = lastSasihRaw.charAt(0).toUpperCase() + lastSasihRaw.slice(1);
      sasihSubtitle = fCap === lCap ? `Sasih ${fCap}` : `Sasih ${fCap} - ${lCap}`;
    }

    return { title, sasihSubtitle };
  }, [calendarYear, calendarMonth, rawCalendarDays]);

  // ---------------------------------------------------------------------------
  // 6. Navigasi Pergantian Bulan pada Mini Kalender (< >)
  // ---------------------------------------------------------------------------
  const handlePrevMonth = useCallback(() => {
    setCalendarDate((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCalendarDate((prev) => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  }, []);

  const handleSelectDate = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
  }, []);

  // ---------------------------------------------------------------------------
  // 7. Penarikan Maksimal 7 Hari Raya Terdekat (Lintas Bulan jika Diperlukan)
  // ---------------------------------------------------------------------------
  const holidaysThisYear = useMemo(() => extractTopUpcomingHariRaya(
    rawCalendarDays, todayWITA, calendarYear, calendarMonth, HOLIDAY_LIMIT,
  ), [rawCalendarDays, todayWITA, calendarYear, calendarMonth]);
  const needsNextHolidayYear = rawCalendarDays.length > 0 && calendarYear < 2200 && holidaysThisYear.length < HOLIDAY_LIMIT;
  const { kalenderData: nextCalendarYearDays } = useKalenderTahun(calendarYear + 1, undefined, { enabled: needsNextHolidayYear });
  const upcomingHariRaya = useMemo(() => {
    if (!needsNextHolidayYear || !nextCalendarYearDays.length) return holidaysThisYear;
    return [...holidaysThisYear, ...extractTopUpcomingHariRaya(
      nextCalendarYearDays, todayWITA, calendarYear, calendarMonth, HOLIDAY_LIMIT - holidaysThisYear.length,
    )];
  }, [needsNextHolidayYear, nextCalendarYearDays, holidaysThisYear, todayWITA, calendarYear, calendarMonth]);

  // ---------------------------------------------------------------------------
  // 8. Integrasi Data Dewasa Ayu Hari Ini & Piodalan Terdekat
  // ---------------------------------------------------------------------------
  const piodalanThisYear = useMemo(() => purasList
    ? extractTopUpcomingPiodalan(todayYearCalendarDays, purasList, todayWITA, PIODALAN_LIMIT) : [],
  [todayYearCalendarDays, purasList, todayWITA]);
  const needsNextPiodalanYear = todayYearCalendarDays.length > 0 && Boolean(purasList?.length)
    && todayParsed.year < 2200 && piodalanThisYear.length < PIODALAN_LIMIT;
  const { kalenderData: nextTodayYearCalendarDays, isLoading: isNextPiodalanYearLoading } = useKalenderTahun(
    todayParsed.year + 1, undefined, { enabled: needsNextPiodalanYear },
  );
  const piodalan = useMemo(() => {
    if (!needsNextPiodalanYear || !nextTodayYearCalendarDays.length || !purasList) return piodalanThisYear;
    return [...piodalanThisYear, ...extractTopUpcomingPiodalan(
      nextTodayYearCalendarDays, purasList, todayWITA, PIODALAN_LIMIT - piodalanThisYear.length,
    )];
  }, [needsNextPiodalanYear, nextTodayYearCalendarDays, piodalanThisYear, purasList, todayWITA]);

  return {
    // Data Hero Hari Ini
    heroData,

    // Data Mini Kalender
    calendarHeaderInfo,
    calendarGridCells,
    calendarYear,
    calendarMonth,
    selectedDate,
    handlePrevMonth,
    handleNextMonth,
    handleSelectDate,

    // Data Hari Raya Berikutnya (Maksimal 7 di Bulan Aktif)
    upcomingHariRaya,

    // Data Dewasa Ayu & Piodalan (3 Item Teratas)
    dewasaAyu,
    isDewasaLoading: dewasaToday.isLoading,
    dewasaError: dewasaToday.isError ? dewasaToday.error : null,
    refetchDewasa: dewasaToday.refetch,
    piodalan,
    piodalanList: piodalan,
    piodalanError: purasError,
    refetchPiodalan: refetchPuras,
    isPiodalanLoading: isPurasLoading || (needsNextPiodalanYear && isNextPiodalanYearLoading && piodalan.length === 0),

    // Status Jaringan & State TanStack Query
    isLoading,
    isError,
    error,
    refetch,
  };
}
