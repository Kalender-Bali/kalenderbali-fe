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
import { useQuery } from '@tanstack/react-query';
import { fetchDewasaAyuToday } from '@/features/ala-ayuning-dewasa/api/alaAyuningApi';
import { useKalenderTahun } from '@/features/kalender/hooks/useKalender';
import { useAllPuras } from '@/features/piodalan/hooks/usePiodalan';
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
  DewasaAyuDashboard,
  PiodalanDashboardItem,
  UpcomingHariRayaItem,
} from '../types/dashboard.types';
import {
  extractTopUpcomingHariRaya,
  extractTopUpcomingPiodalan,
  generateMiniCalendarGrid,
} from '../utils/dashboardUtils';

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
    kalenderData: rawCalendarDays = [],
    daysMap,
    isLoading,
    isError,
    error,
    refetch,
  } = useKalenderTahun(calendarYear, calendarMonth);

  // Konsumsi data kalender tahun berjalan untuk evaluasi agenda terdekat hari ini
  // (Zero-Loading: jika calendarYear === todayParsed.year, TanStack Query langsung
  // menggunakan instance query yang sama di memori RAM).
  const { kalenderData: todayYearCalendarDays = [] } = useKalenderTahun(todayParsed.year);

  // Konsumsi data tahun berikutnya untuk kesinambungan agenda melewati batas pergantian tahun
  const { kalenderData: nextCalendarYearDays = [] } = useKalenderTahun(calendarYear + 1, undefined, {
    enabled: rawCalendarDays.length > 0 && calendarYear < 2200,
  });

  const { kalenderData: nextTodayYearCalendarDays = [] } = useKalenderTahun(todayParsed.year + 1, undefined, {
    enabled: todayYearCalendarDays.length > 0 && todayParsed.year < 2200,
  });

  // Konsumsi master data pura resmi dari Backend Go (staleTime 24 jam di RAM)
  const { data: purasList = [] } = useAllPuras();
  const dewasaToday = useQuery({
    queryKey: ['ala-ayuning-dewasa', 'today', todayWITA],
    queryFn: fetchDewasaAyuToday,
    staleTime: 1000 * 60 * 5,
  });

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
      quoteHariIni: dewasaToday.data?.headline || 'Petunjuk padewasan belum tersedia.',
    };
  }, [todayYearCalendarDays, todayWITA, dewasaToday.data]);

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
  const holidaysDaysPool = useMemo(() => {
    if (nextCalendarYearDays.length > 0) {
      return [...rawCalendarDays, ...nextCalendarYearDays];
    }
    return rawCalendarDays;
  }, [rawCalendarDays, nextCalendarYearDays]);

  const upcomingHariRaya: UpcomingHariRayaItem[] = useMemo(() => {
    return extractTopUpcomingHariRaya(
      holidaysDaysPool,
      todayWITA,
      calendarYear,
      calendarMonth,
      7
    );
  }, [holidaysDaysPool, todayWITA, calendarYear, calendarMonth]);

  // ---------------------------------------------------------------------------
  // 8. Integrasi Data Dewasa Ayu Hari Ini & Piodalan Terdekat (Masing-masing 3 Item)
  // ---------------------------------------------------------------------------
  const dewasaAyu: DewasaAyuDashboard = {
    status: dewasaToday.data?.status_label === 'BAIK' ? 'BAIK' : 'NETRAL',
    statusLabel: dewasaToday.isLoading ? 'MEMUAT' : dewasaToday.data?.status_label || 'BELUM TERSEDIA',
    headline: dewasaToday.data?.headline || (dewasaToday.isLoading ? 'Memuat petunjuk padewasan hari ini.' : 'Petunjuk padewasan belum tersedia.'),
    items: (dewasaToday.data?.items ?? []).map((item) => ({
      id: item.id, nama: item.nama, keterangan: item.keterangan || '', tag: 'PADEWASAN',
    })),
    actionUrl: '/ala-ayuning-dewasa',
  };

  // Ekstraksi 3 piodalan pura terdekat setelah hari ini dari data real kalender & pura resmi
  const realUpcomingPiodalan: PiodalanDashboardItem[] = useMemo(() => {
    const daysPool = [...todayYearCalendarDays, ...nextTodayYearCalendarDays];

    return extractTopUpcomingPiodalan(
      daysPool,
      purasList,
      todayWITA,
      3
    );
  }, [todayYearCalendarDays, nextTodayYearCalendarDays, purasList, todayWITA]);

  // Seluruh data piodalan di dashboard 100% menggunakan data real hasil kalkulasi master pura resmi backend Go
  const piodalan: PiodalanDashboardItem[] = realUpcomingPiodalan;

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
    piodalan,
    piodalanList: piodalan,

    // Status Jaringan & State TanStack Query
    isLoading,
    isError,
    error,
    refetch,
  };
}
