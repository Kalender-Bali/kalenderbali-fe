import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useReadQuery } from '@/lib/useReadQuery';
import { fetchKalenderTahun } from '../api/kalenderApi';
import type { KalenderHarian, PiodalanItem } from '../types/kalender.types';
import { fetchPuraObservances, searchPiodalan } from '@/features/piodalan/api/piodalanApi';
import { useAllPuras } from '@/features/piodalan/hooks/usePiodalan';
import { matchPurasForDay, extractMonthPiodalanSummary } from '../utils/calendarUtils';

const EMPTY_YEAR: KalenderHarian[] = [];

function usePuraObservances() {
  return useReadQuery({
    queryKey: ['piodalan', 'puras', 'observances'],
    queryFn: fetchPuraObservances,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 48,
    refetchOnWindowFocus: false,
  });
}

/**
 * ============================================================================
 * CUSTOM HOOK: useKalenderTahun (TanStack Query Orchestrator)
 * ============================================================================
 * Hook ini bertindak sebagai otak penyedia data Kalender Bali di frontend.
 *
 * Prinsip Arsitektur Utama (Sesuai fe_strategy.md):
 *  1. 1-Year Chunking: Tarik 1 tahun penuh sekaligus (GET /api/v1/kalender?year=YYYY).
 *  2. Zero-Loading Navigation: Konfigurasi `staleTime: Infinity` menjamin navigasi
 *     antar bulan (Januari s.d. Desember) berjalan seketika dalam 0 milidetik
 *     tanpa HTTP request berulang ke server.
 *  3. In-Memory O(1) Lookup: Mengonversi array 365 hari ke Map<string, KalenderHarian>
 *     agar pencarian data tanggal mana pun selesai dalam waktu O(1) tanpa looping array.
 *  4. Silent Prefetching: Mengunduh data tahun berikutnya secara tersembunyi
 *     di background saat user berada di bulan November atau Desember, sehingga
 *     ketika user menekan tombol pindah tahun ke tahun depan, datanya sudah siap di RAM.
 * ============================================================================
 */

export function useKalenderTahun(year: number, activeMonth?: number, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  // -------------------------------------------------------------------------
  // 1. Eksekusi Query 1 Tahun Penuh dengan TanStack Query
  // -------------------------------------------------------------------------
  const {
    data: rawData = EMPTY_YEAR,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadQuery({
    queryKey: ['kalender', year],
    queryFn: () => fetchKalenderTahun(year),
    enabled: options?.enabled ?? true,
    // Data penanggalan matematis bersifat pasti dan permanen untuk tahun tersebut
    staleTime: Infinity,
    // Pertahankan di memori RAM browser selama 24 jam
    gcTime: 1000 * 60 * 60 * 24,
    // Jangan fetch ulang saat pengguna bolak-balik tab browser
    refetchOnWindowFocus: false,
    // Coba ulang 1x jika ada kegagalan jaringan

  });

  // -------------------------------------------------------------------------
  // 2. In-Memory Map untuk Pencarian Instan O(1) berdasarkan "YYYY-MM-DD"
  // -------------------------------------------------------------------------
  const daysMap = useMemo(() => {
    const map = new Map<string, KalenderHarian>();
    for (let i = 0; i < rawData.length; i++) {
      const day = rawData[i];
      if (day?.tanggal) {
        map.set(day.tanggal, day);
      }
    }
    return map;
  }, [rawData]);

  // -------------------------------------------------------------------------
  // 3. Silent Background Prefetching (fe_strategy.md Bab 4)
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Hanya lakukan prefetch tahun berikutnya (year + 1) jika user sudah berada
    // di pengujung tahun (November atau Desember) untuk menyambut pergantian tahun.
    if (rawData.length > 0 && activeMonth && activeMonth >= 11 && year < 2200 && options?.enabled !== false) {
      const nextYear = year + 1;
      queryClient.prefetchQuery({
        queryKey: ['kalender', nextYear],
        queryFn: () => fetchKalenderTahun(nextYear),
        staleTime: Infinity,
      });
    }
  }, [year, activeMonth, queryClient, rawData.length, options?.enabled]);

  return {
    kalenderData: rawData,
    daysMap,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

// ============================================================================
// 5. HOOK INTEGRASI MESIN PIODALAN RESILIEN (HYBRID BE & RAM CACHE)
// ============================================================================

/**
 * useDayPiodalan mengambil daftar pura yang melangsungkan piodalan pada tanggal tertentu.
 * Menggunakan pendekatan Hybrid Resilient:
 *  1. Instan O(1): Menghitung kecocokan 461 master pura dari cache RAM TanStack Query jika dayData tersedia.
 *  2. Sinkronisasi Backend: Memanggil GET /api/v1/search/piodalan (mode 'rentang' 1 hari) secara asinkron.
 *  3. Zero Empty Flash: Komponen langsung menerima data riil tanpa menunggu roundtrip jaringan.
 *
 * @param dateStr Tanggal target format YYYY-MM-DD
 * @param dayData Objek KalenderHarian tanggal terpilih (opsional, dari daysMap)
 */
export function useDayPiodalan(dateStr?: string, dayData?: KalenderHarian) {
  const { data: observances } = usePuraObservances();
  const { data: purasList, isLoading: isPurasLoading } = useAllPuras();

  // Hitung kecocokan pura secara instan di memori browser berdasarkan wewaran & sasih tanggal tersebut
  const inMemoryResult = useMemo(() => {
    if (!dayData || !purasList) return null;
    const matched = matchPurasForDay(dayData, purasList);
    const items: PiodalanItem[] = matched.map((p, idx) => ({
      id: `pio-${p.id}`,
      puraName: p.name,
      location: p.city || p.address || 'Bali',
      distance: p.type || 'Kahyangan Jagat',
      accentColor: (idx % 2 === 0 ? 'teal' : 'amber') as 'teal' | 'amber',
    }));
    return {
      items,
      totalCount: items.length,
    };
  }, [dayData, purasList]);

  const query = useReadQuery<{
    items: PiodalanItem[];
    totalCount: number;
  }>({
    queryKey: ['kalender', 'piodalan', 'day', dateStr],
    queryFn: async () => {
      if (!dateStr) return { items: [], totalCount: 0 };

      const res = await searchPiodalan({
        mode: 'rentang',
        start_date: dateStr,
        end_date: dateStr,
      });

      if (res && Array.isArray(res.schedules) && res.schedules.length > 0) {
        const daySched = res.schedules[0];
        const puras = Array.isArray(daySched.puras) ? daySched.puras : [];
        if (puras.length > 0) {
          const items: PiodalanItem[] = puras.map((p, idx) => ({
            id: `pio-${p.id || idx}`,
            puraName: p.nama,
            location: p.kabupaten || p.alamat || 'Bali',
            distance: p.tipe || 'Kahyangan Jagat',
            accentColor: idx % 2 === 0 ? 'teal' : 'amber',
          }));
          return { items, totalCount: items.length };
        }
      }

      return { items: [], totalCount: 0 };
    },
    enabled: Boolean(dateStr),
    initialData: inMemoryResult || undefined,
    staleTime: 1000 * 60 * 15, // Fresh 15 menit di memori RAM
    refetchOnWindowFocus: false,
  });

  const data = query.data?.totalCount ? query.data : inMemoryResult ?? query.data;
  const countFromRules = !inMemoryResult && !data?.totalCount && dayData && observances
    ? matchPurasForDay(dayData, observances).length
    : undefined;
  const waitingForProfiles = isPurasLoading && Boolean(countFromRules);
  return {
    ...query,
    data,
    totalCount: waitingForProfiles ? countFromRules : data?.totalCount ?? countFromRules,
    isLoading: (!inMemoryResult && query.isLoading) || waitingForProfiles,
  };
}

/**
 * useMonthlyPiodalan mengambil ringkasan agenda piodalan seluruh pura dalam satu bulan kalender.
 * Menggunakan pendekatan Hybrid Resilient:
 *  1. Menghitung total piodalan dan 3 agenda terdekat dari aturan pura begitu kalender tersedia.
 *  2. Lookahead Antar-Bulan: Jika sisa piodalan bulan aktif kurang dari 3, secara cerdas mengambil
 *     agenda dari bulan mendatang (selama dateStr >= todayISO), tanpa menampilkan tanggal masa lalu.
 *  3. Navigasi Presisi: Setiap item dilengkapi `dateStr` sehingga pengguna dapat mengklik
 *     kartu piodalan terdekat untuk langsung memfokuskan kalender ke tanggal tersebut.
 *
 * @param year Tahun Masehi target
 * @param month Nomor bulan Masehi (1 s.d. 12)
 * @param monthDays Daftar hari bulan aktif. Undefined jika kalender bulan ini tidak tersedia.
 * @param todayISO Tanggal hari ini format YYYY-MM-DD WITA (opsional)
 * @param allYearDays Seluruh hari dalam tahun aktif untuk lookahead ke bulan depan (opsional)
 */
export function useMonthlyPiodalan(
  year: number,
  month: number,
  monthDays?: KalenderHarian[],
  todayISO?: string,
  allYearDays?: KalenderHarian[]
) {
  const observances = usePuraObservances();
  const { data: publishedPuras } = useAllPuras();
  const rules = observances.data ?? publishedPuras;

  const inMemorySummary = useMemo(() => {
    if (!monthDays?.length || !rules) return null;
    return extractMonthPiodalanSummary(monthDays, rules, todayISO, allYearDays);
  }, [monthDays, rules, todayISO, allYearDays]);

  const useFallback = !inMemorySummary && (!monthDays || observances.isError);

  const queryResult = useReadQuery({
    queryKey: ['kalender', 'piodalan', 'month', year, month],
    queryFn: () => searchPiodalan({ mode: 'bulan', bulan: month, tahun: year }),
    enabled: Boolean(year && month) && useFallback,
    staleTime: 1000 * 60 * 10, // Fresh 10 menit di memori RAM
    refetchOnWindowFocus: false,
  });

  const fallbackSummary = useMemo(() => {
    const schedules = queryResult.data?.schedules;
    if (!schedules) return undefined;
    return {
      totalPuras: schedules.reduce((total, schedule) => total + schedule.puras.length, 0),
      upcomingItems: schedules
        .filter(schedule => schedule.tanggal >= (todayISO ?? '') && schedule.puras.length > 0)
        .slice(0, 3)
        .map(schedule => ({
          id: schedule.tanggal,
          dayNumber: schedule.tanggal.slice(8, 10),
          wukuTitle: schedule.wewaran || 'Piodalan Pura',
          puraCountText: `${schedule.puras.length} pura`,
          dateStr: schedule.tanggal,
        })),
    };
  }, [queryResult.data, todayISO]);

  if (inMemorySummary) {
    return { ...queryResult, data: inMemorySummary, isLoading: false, isError: false, error: null };
  }
  return { ...queryResult, data: fallbackSummary, isLoading: Boolean(year && month) && (!useFallback || queryResult.isLoading) };
}
