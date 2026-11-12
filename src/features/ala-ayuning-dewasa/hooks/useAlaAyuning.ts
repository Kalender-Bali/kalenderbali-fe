import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useReadQuery } from '@/lib/useReadQuery';
import { getTodayWITA, parseISODate } from '@/features/kalender/utils/calendarUtils';
import {
  fetchPadewasanHarian,
  searchPadewasanByName,
  fetchMasterPadewasan,
  fetchDewasaAyuSummary,
  fetchDayPawukon,
} from '../api/alaAyuningApi';
import type {
  PadewasanItem,
  CariByNamaResponse,
  DewasaAyuTodayResponse,
  PawukonHarianInfo,
  AlaAyuningSearchMode,
} from '../types/alaAyuning.types';
// enrichPadewasanItem melengkapi data padewasan dari backend dengan data lokal master
// sebagai fallback ketika backend tidak dapat menyediakan nama/keterangan (misal: DB tidak terload).
import { enrichPadewasanItem } from '../constants/masterPadewasanData';

/**
 * ============================================================================
 * CUSTOM HOOK: useAlaAyuning
 * ============================================================================
 * Hook orkestrator terpusat untuk fitur Ala Ayuning Dewasa (Padewasan Kalender Bali):
 *
 * Tanggung Jawab Utama:
 *  1. Sinkronisasi Status ke URL (URL-as-State Pattern):
 *     - Parameter mode pencarian (?mode=date atau ?mode=name).
 *     - Parameter tanggal aktif (?date=YYYY-MM-DD).
 *     - Parameter pencarian nama (?name=...&month=...&year=...).
 *     - Menjamin tautan dapat dibagikan (shareable) dan ramah navigasi Back/Forward.
 *
 *  2. Manajemen State Server & Multi-Layer RAM Cache (fe_strategy.md):
 *     - Memanfaatkan TanStack Query dengan staleTime 1 jam untuk data harian
 *       dan staleTime Infinity untuk 220 katalog master padewasan.
 *     - Mengeliminasi getaran layout shift (CLS = 0) dan mencegah query berulang.
 *
 *  3. Integrasi Bebas Bug & Data Valid (No Logic Duplication):
 *     - Menghubungkan langsung ke hasil perhitungan deterministik Backend Go
 *       tanpa mengarang rumus atau menduplikasi evaluasi di JavaScript klien.
 * ============================================================================
 */

export function useAlaAyuning() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tanggal acuan hari ini terkunci ke zona waktu resmi WITA (Asia/Makassar / UTC+8)
  const todayWITA = useMemo(() => getTodayWITA(), []);
  const todayParsed = useMemo(() => parseISODate(todayWITA), [todayWITA]);

  // -------------------------------------------------------------------------
  // BLOK 1: RESOLUSI PARAMETER PENCARIAN DARI URL (URL-AS-STATE)
  // -------------------------------------------------------------------------

  // Mode aktif: 'date' (pemeriksaan tanggal) atau 'name' (pencarian nama padewasan)
  const queryModeParam = searchParams.get('mode');
  const activeMode: AlaAyuningSearchMode = queryModeParam === 'name' ? 'name' : 'date';

  // Parameter untuk Mode Tanggal: query URL eksplisit
  const queryDateParam = searchParams.get('date') || '';

  // Validasi format tanggal ISO (YYYY-MM-DD)
  const isDateValid = useMemo(() => {
    return Boolean(queryDateParam && /^\d{4}-\d{2}-\d{2}$/.test(queryDateParam));
  }, [queryDateParam]);

  // Tanggal aktif evaluasi data backend: jika URL kosong, default evaluasi hari ini WITA
  const activeDate = isDateValid ? queryDateParam : todayWITA;

  // Parameter untuk Mode Nama Padewasan:
  const queryName = searchParams.get('name') || '';
  const queryMonth = Number(searchParams.get('month')) || todayParsed.month;
  const queryYear = Number(searchParams.get('year')) || todayParsed.year;

  // URL berisi kriteria yang sudah dikirim lewat tombol Cari atau tautan hasil.
  // Tanggal hari ini sebagai default internal belum berarti pencarian dijalankan.
  const hasSearched = activeMode === 'date' ? isDateValid : Boolean(queryName);

  // State lokal untuk pop-up modal detail uraian sastra padewasan yang dipilih
  const [selectedPadewasan, setSelectedPadewasan] = useState<PadewasanItem | null>(null);

  // -------------------------------------------------------------------------
  // BLOK 2: QUERY 1 - MASTER DATA 220 PADEWASAN (KATALOG DROPDOWN)
  // -------------------------------------------------------------------------
  /**
   * Mengambil 220 master padewasan dari memori RAM Go untuk mengisi opsi autocomplete/dropdown.
   * Dikonfigurasi dengan staleTime Infinity karena data master referensi permanen.
   */
  const masterPadewasanQuery = useReadQuery<PadewasanItem[], Error>({
    queryKey: ['ala-ayuning', 'master'],
    queryFn: fetchMasterPadewasan,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24, // 24 jam di RAM
    refetchOnWindowFocus: false,
  });

  // -------------------------------------------------------------------------
  // BLOK 3: QUERY 2 - RINGKASAN KEGIATAN PADA TANGGAL PILIHAN
  // -------------------------------------------------------------------------
  /**
   * Mengambil anjuran dan pantangan per kegiatan untuk tanggal yang sedang diperiksa.
   */
  const dateSummaryQuery = useReadQuery<DewasaAyuTodayResponse, Error>({
    queryKey: ['ala-ayuning', 'summary', activeDate],
    queryFn: () => fetchDewasaAyuSummary(activeDate),
    enabled: activeMode === 'date' && hasSearched,
    staleTime: 1000 * 60 * 60, // Segar selama 1 jam
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  // -------------------------------------------------------------------------
  // BLOK 4: QUERY 3 - PADEWASAN HARIAN PADA TANGGAL AKTIF (MODE TANGGAL)
  // -------------------------------------------------------------------------
  /**
   * Mengambil seluruh kriteria padewasan yang aktif pada tanggal terpilih beserta
   * uraian makna budaya dan tingkat keparahan Alahing Dewasa.
   */
  const padewasanHarianQuery = useReadQuery<PadewasanItem[], Error>({
    queryKey: ['ala-ayuning', 'harian', activeDate],
    queryFn: async () => {
      return await fetchPadewasanHarian(activeDate);
    },
    enabled: activeMode === 'date' && isDateValid,
    staleTime: 1000 * 60 * 60, // 1 jam cache
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,

  });

  // -------------------------------------------------------------------------
  // BLOK 5: QUERY 4 - PAWUKON HARIAN WITA (WUKU, PANCAWARA, SAPTAWARA, URIP)
  // -------------------------------------------------------------------------
  /**
   * Mengambil atribut 4 pilar penanggalan Bali untuk mengisi kartu "Pawukon Hari Ini".
   */
  const pawukonHarianQuery = useReadQuery<PawukonHarianInfo | null, Error>({
    queryKey: ['ala-ayuning', 'pawukon', activeDate],
    queryFn: async () => {
      return await fetchDayPawukon(activeDate);
    },
    enabled: activeMode === 'date' && isDateValid,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  // -------------------------------------------------------------------------
  // BLOK 6: QUERY 5 - PENCARIAN TANGGAL JATUH BERDASARKAN NAMA (MODE NAMA)
  // -------------------------------------------------------------------------
  /**
   * Mencari seluruh tanggal jatuh dalam satu bulan tertentu di mana padewasan
   * yang dicari aktif (paritas sistem Laravel lama Gambar 1 & 2).
   */
  const byNameQuery = useReadQuery<CariByNamaResponse | null, Error>({
    queryKey: ['ala-ayuning', 'by-name', queryName, queryMonth, queryYear],
    queryFn: async () => {
      if (!queryName) return null;
      return await searchPadewasanByName({
        nama: queryName,
        bulan: queryMonth,
        tahun: queryYear,
      });
    },
    enabled: activeMode === 'name' && Boolean(queryName),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,

  });

  // -------------------------------------------------------------------------
  // BLOK 7: HANDLER AKSI PENGGUNA (NAVIGASI & PERGANTIAN PARAMETER)
  // -------------------------------------------------------------------------

  /**
   * setSearchMode mengganti mode antara 'date' dan 'name' dengan memperbarui URL.
   */
  const setSearchMode = useCallback(
    (mode: AlaAyuningSearchMode) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('mode', mode);

      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  /**
   * handleSelectDate memperbarui tanggal aktif yang sedang diperiksa.
   */
  const handleSelectDate = useCallback(
    (date: string) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('mode', 'date');
      nextParams.set('date', date);
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  /**
   * handleResetToday mereset tanggal aktif kembali ke hari ini WITA.
   */
  const handleResetToday = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('mode', 'date');
    nextParams.set('date', todayWITA);
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams, todayWITA]);

  /**
   * handleSearchByName mengeksekusi pencarian tanggal jatuh padewasan tertentu per bulan/tahun.
   */
  const handleSearchByName = useCallback(
    (name: string, month: number, year: number) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('mode', 'name');
      nextParams.set('name', name);
      nextParams.set('month', String(month));
      nextParams.set('year', String(year));
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  /**
   * Kontrol buka/tutup modal dialog detail sastra padewasan
   */
  const openDetailModal = useCallback((item: PadewasanItem) => {
    setSelectedPadewasan(item);
  }, []);

  const closeDetailModal = useCallback(() => {
    setSelectedPadewasan(null);
  }, []);

  // -------------------------------------------------------------------------
  // BLOK 8: PERHITUNGAN STATISTIK RINGKASAN HARI INI (DERIVED METRICS)
  // -------------------------------------------------------------------------

  /**
   * padewasanList adalah daftar padewasan yang sudah diperkaya (enriched) dari master lokal.
   *
   * Latar Belakang:
   * Backend Go menggunakan `itemsByID` (map yang diisi dari DB saat startup) untuk mengisi
   * nama dan keterangan. Jika DB tidak ter-load (misal: koneksi gagal saat startup), backend
   * mengembalikan fallback "Padewasan #<ID>" dan keterangan kosong.
   *
   * Strategi frontend: panggil `enrichPadewasanItem` pada setiap item untuk mengganti
   * "Padewasan #<ID>" dan keterangan kosong dengan data dari `masterPadewasanData.ts`
   * (220 data hardcoded dari DB resmi yang sama). Ini memastikan UI selalu menampilkan
   * nama dan keterangan yang benar tanpa bergantung pada kondisi runtime DB backend.
   */
  const padewasanList = useMemo<PadewasanItem[]>(() => {
    const raw = padewasanHarianQuery.data || [];
    // Perkaya setiap item dengan data master lokal sebagai fallback
    return raw.map(enrichPadewasanItem);
  }, [padewasanHarianQuery.data]);

  // Klasifikasi padewasan berdasarkan tingkat keparahan Alahing Dewasa resmi:
  // Tingkat 1 (Sasih) & Tingkat 2 (Penanggal): Unsur Kuat / Pengaruh Utama
  // Tingkat 3 (Dauh) & Tingkat 4 (Wuku/Pasaran): Unsur Harian / Kondisional
  const { totalAktif, unsurKuatCount, unsurHarianCount } = useMemo(() => {
    const total = padewasanList.length;
    let kuat = 0;
    let harian = 0;

    for (const p of padewasanList) {
      if (p.severity_code === '1' || p.severity_code === '2') {
        kuat += 1;
      } else {
        harian += 1;
      }
    }

    return {
      totalAktif: total,
      unsurKuatCount: kuat,
      unsurHarianCount: harian,
    };
  }, [padewasanList]);

  // -------------------------------------------------------------------------
  // BLOK 9: STATUS LOADING & ERROR GABUNGAN
  // -------------------------------------------------------------------------
  const hasResults = hasSearched && (activeMode === 'date'
    ? padewasanHarianQuery.isSuccess && pawukonHarianQuery.isSuccess && dateSummaryQuery.isSuccess
    : byNameQuery.isSuccess && Boolean(byNameQuery.data));

  const isLoading =
    activeMode === 'date'
      ? padewasanHarianQuery.isLoading || pawukonHarianQuery.isLoading || dateSummaryQuery.isLoading
      : byNameQuery.isLoading;

  const isFetching =
    activeMode === 'date'
      ? padewasanHarianQuery.isFetching || pawukonHarianQuery.isFetching || dateSummaryQuery.isFetching
      : byNameQuery.isFetching;

  const isError =
    activeMode === 'date'
      ? padewasanHarianQuery.isError || pawukonHarianQuery.isError || dateSummaryQuery.isError
      : byNameQuery.isError;

  const errorMessage =
    (activeMode === 'date'
      ? padewasanHarianQuery.error?.message || pawukonHarianQuery.error?.message || dateSummaryQuery.error?.message
      : byNameQuery.error?.message) || null;

  const refetch = useCallback(() => {
    if (activeMode === 'date') {
      padewasanHarianQuery.refetch();
      pawukonHarianQuery.refetch();
      dateSummaryQuery.refetch();
    } else {
      byNameQuery.refetch();
    }
  }, [activeMode, padewasanHarianQuery, pawukonHarianQuery, dateSummaryQuery, byNameQuery]);

  // -------------------------------------------------------------------------
  // BLOK 10: KONTRAK KELUARAN HOOK UNTUK KOMPONEN UI
  // -------------------------------------------------------------------------
  return {
    // Mode pencarian aktif
    activeMode,
    setSearchMode,

    // Parameter aktif
    activeDate,
    queryDate: queryDateParam,
    todayWITA,
    isToday: activeDate === todayWITA,
    queryName,
    queryMonth,
    queryYear,

    // Data query harian (Mode Tanggal)
    padewasanList,
    pawukonInfo: pawukonHarianQuery.data || null,
    daySummary: dateSummaryQuery.data || null,

    // Statistik metrik harian
    totalAktif,
    unsurKuatCount,
    unsurHarianCount,

    // Data query per nama (Mode Nama)
    masterPadewasan: masterPadewasanQuery.data || [],
    isMasterLoading: masterPadewasanQuery.isLoading,
    masterError: masterPadewasanQuery.isError ? masterPadewasanQuery.error : null,
    refetchMaster: masterPadewasanQuery.refetch,
    byNameResult: byNameQuery.data || null,

    // Status pemuatan & kesalahan
    hasSearched,
    hasResults,
    isLoading,
    isFetching,
    isError,
    errorMessage,
    refetch,

    // Aksi navigasi
    handleSelectDate,
    handleResetToday,
    handleSearchByName,

    // Modal detail padewasan
    selectedPadewasan,
    isDetailModalOpen: Boolean(selectedPadewasan),
    openDetailModal,
    closeDetailModal,
  };
}
