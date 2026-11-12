import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useReadQuery } from '@/lib/useReadQuery';
import { searchGarisHidup } from '../api/garisHidupApi';
import type {
  GarisHidupProfileResult,
  GarisHidupRequest,
  GarisHidupParticipantInput,
} from '../types/garisHidup.types';

/**
 * ============================================================================
 * CUSTOM HOOK: useGarisHidup (Orkestrator State, Form Dinamis & URL Sync)
 * ============================================================================
 * Hook orkestrator terpusat untuk fitur Garis Hidup (Pal Sri Sedana):
 *  1. Server State Management: Menggunakan TanStack Query dengan konfigurasi Lapis 3
 *     RAM Cache (staleTime 30 menit, gcTime 24 jam) sesuai panduan `fe_strategy.md`.
 *  2. URL-as-State Synchronization: Menyinkronkan status pencarian ke query parameter
 *     URL (?p1_nama=...&p1_tgl=...&p2_nama=...&p2_tgl=...) sehingga hasil perhitungan
 *     dapat langsung dibagikan (shareable), tahan refresh browser (F5), dan
 *     mendukung tombol navigasi Back/Forward.
 *  3. Form Dinamis Multi-Peserta: Mengelola penambahan, pengurangan, dan pengeditan
 *     1 sampai 5 peserta secara reaktif di sisi klien.
 *  4. Tab Peserta Aktif: Mengontrol indeks peserta yang sedang aktif ditampilkan
 *     pada kurva dan tabel saat terdapat lebih dari 1 peserta.
 * ============================================================================
 */

/** Regex format tanggal ISO YYYY-MM-DD standar sipil masehi */
const DATE_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Helper pembuat ID unik acak sederhana untuk kestabilan key rendering di React
 */
function createClientId(prefix = 'peserta'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

export function useGarisHidup() {
  const [searchParams, setSearchParams] = useSearchParams();

  // =========================================================================
  // BLOK 1: RESOLUSI PARAMETER DARI URL (URL-AS-STATE PATTERN)
  // =========================================================================
  // Mengekstrak parameter p1 s/d p5 dari query string URL jika tersedia
  const urlParticipants: Array<{ nama: string; tanggal_lahir: string }> = useMemo(() => {
    const list: Array<{ nama: string; tanggal_lahir: string }> = [];

    // Dukungan backward-compatibility jika URL memakai format tunggal ?tgl=...&nama=...
    const singleTgl = searchParams.get('tgl');
    const singleNama = searchParams.get('nama');
    if (singleTgl && DATE_ISO_REGEX.test(singleTgl)) {
      list.push({
        nama: singleNama || '',
        tanggal_lahir: singleTgl,
      });
      return list;
    }

    // Ekstraksi multi-peserta berbasis prefix p1 s/d p5
    for (let i = 1; i <= 5; i++) {
      const tgl = searchParams.get(`p${i}_tgl`);
      const nama = searchParams.get(`p${i}_nama`);

      if (tgl && DATE_ISO_REGEX.test(tgl)) {
        list.push({
          nama: nama || '',
          tanggal_lahir: tgl,
        });
      }
    }

    return list;
  }, [searchParams]);

  // Validasi apakah parameter URL membentuk permintaan pencarian yang sah
  const isSearchActive = urlParticipants.length > 0;

  // =========================================================================
  // BLOK 2: STATE FORMULIR MULTI-PESERTA (LOKAL)
  // =========================================================================
  // Menginisialisasi form input dari URL atau 1 peserta kosong default (placeholder dd/mm/yyyy)
  const [formEntries, setFormEntries] = useState<GarisHidupParticipantInput[]>(() => {
    if (urlParticipants.length > 0) {
      return urlParticipants.map((p, idx) => ({
        id: createClientId(`p${idx + 1}`),
        nama: p.nama,
        tanggal_lahir: p.tanggal_lahir,
      }));
    }
    return [
      {
        id: createClientId('p1'),
        nama: '',
        tanggal_lahir: '',
      },
    ];
  });

  // Sinkronisasi state lokal saat URL query berubah (misal tombol Back/Forward browser)
  // Mengikuti pola resmi React: menyesuaikan state saat prop/URL berubah tanpa cascading effect
  const urlSearchString = searchParams.toString();
  const [prevSearchString, setPrevSearchString] = useState<string>(urlSearchString);

  if (urlSearchString !== prevSearchString) {
    setPrevSearchString(urlSearchString);
    if (urlParticipants.length > 0) {
      setFormEntries(
        urlParticipants.map((p, idx) => ({
          id: createClientId(`p${idx + 1}`),
          nama: p.nama,
          tanggal_lahir: p.tanggal_lahir,
        }))
      );
    }
  }

  // Pesan validasi error lokal sebelum request dikirim
  const [localFormError, setLocalFormError] = useState<string | null>(null);

  // Tab peserta aktif yang sedang dipilih di tampilan hasil (0-indexed)
  const [activeParticipantIndex, setActiveParticipantIndex] = useState<number>(0);

  // Batasi indeks tab agar tidak melebihi jumlah peserta yang ada
  const safeActiveIndex = Math.min(
    activeParticipantIndex,
    Math.max(0, (urlParticipants.length > 0 ? urlParticipants.length : formEntries.length) - 1)
  );

  // =========================================================================
  // BLOK 3: EKSEKUSI QUERY DENGAN TANSTACK QUERY (LAPIS 3 RAM CACHE)
  // =========================================================================
  // Payload JSON yang dikirimkan ke backend Go (POST /api/v1/search/garis-hidup)
  const queryPayload: GarisHidupRequest = useMemo(
    () => ({
      peserta: urlParticipants.map((p) => ({
        nama: p.nama,
        tanggal_lahir: p.tanggal_lahir,
      })),
    }),
    [urlParticipants]
  );

  // Kunci cache query unik yang merepresentasikan kombinasi seluruh peserta
  const queryCacheKey = useMemo(
    () => [
      'garis-hidup',
      ...urlParticipants.map((p) => `${p.nama}:${p.tanggal_lahir}`),
    ],
    [urlParticipants]
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useReadQuery<GarisHidupProfileResult[], Error>({
    queryKey: queryCacheKey,
    queryFn: async () => {
      return await searchGarisHidup(queryPayload);
    },
    // Query hanya dieksekusi jika terdapat parameter pencarian aktif dari URL
    enabled: isSearchActive,

    // Konfigurasi Lapis 3 RAM Cache resmi fe_strategy.md:
    staleTime: 1000 * 60 * 30, // 30 menit segar di memori
    gcTime: 1000 * 60 * 60 * 24, // 24 jam bertahan di memori RAM
    refetchOnWindowFocus: false, // Tidak auto-refetch saat berganti tab

  });

  // =========================================================================
  // BLOK 4: MANIPULASI FORMULIR (TAMBAH, HAPUS, UPDATE, RESET)
  // =========================================================================

  /**
   * Menambahkan satu baris peserta baru (maksimal 5 peserta).
   */
  const tambahPeserta = useCallback(() => {
    setFormEntries((prev) => {
      if (prev.length >= 5) return prev;
      return [
        ...prev,
        {
          id: createClientId(`p${prev.length + 1}`),
          nama: '',
          tanggal_lahir: '',
        },
      ];
    });
    setLocalFormError(null);
  }, []);

  /**
   * Menghapus baris peserta pada indeks tertentu (minimal menyisakan 1 peserta).
   */
  const hapusPeserta = useCallback((index: number) => {
    setFormEntries((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
    setLocalFormError(null);
  }, []);

  /**
   * Memperbarui field nama atau tanggal lahir peserta pada indeks tertentu.
   */
  const updatePeserta = useCallback(
    (index: number, field: 'nama' | 'tanggal_lahir', value: string) => {
      setFormEntries((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { ...next[index], [field]: value };
        }
        return next;
      });
      setLocalFormError(null);
    },
    []
  );

  /**
   * Mengembalikan form ke keadaan awal (1 peserta default) dan membersihkan URL.
   */
  const resetSearch = useCallback(() => {
    setFormEntries([
      {
        id: createClientId('p1'),
        nama: '',
        tanggal_lahir: '',
      },
    ]);
    setActiveParticipantIndex(0);
    setLocalFormError(null);
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // =========================================================================
  // BLOK 5: EKSEKUSI PENCARIAN (TRIGGER DARI TOMBOL HITUNG)
  // =========================================================================

  /**
   * Memvalidasi form lokal dan menyinkronkan masukan ke query params URL
   * untuk memicu TanStack Query secara reaktif.
   */
  const executeSearch = useCallback(() => {
    setLocalFormError(null);

    // 1. Validasi lokal: setiap peserta harus memiliki tanggal lahir valid
    for (let i = 0; i < formEntries.length; i++) {
      const entry = formEntries[i];
      const label = `Peserta ${i + 1}`;

      if (!entry.tanggal_lahir || !entry.tanggal_lahir.trim()) {
        setLocalFormError(`Tanggal lahir ${label} wajib diisi.`);
        return;
      }

      if (!DATE_ISO_REGEX.test(entry.tanggal_lahir.trim())) {
        setLocalFormError(`Format tanggal lahir ${label} harus YYYY-MM-DD.`);
        return;
      }
    }

    // 2. Susun objek URLSearchParams baru
    const nextParams = new URLSearchParams();
    formEntries.forEach((entry, idx) => {
      const pNum = idx + 1;
      nextParams.set(`p${pNum}_tgl`, entry.tanggal_lahir.trim());
      if (entry.nama && entry.nama.trim()) {
        nextParams.set(`p${pNum}_nama`, entry.nama.trim());
      }
    });

    // 3. Update URL browser (memicu TanStack Query dan mengizinkan deep-linking)
    setSearchParams(nextParams, { replace: false });
    setActiveParticipantIndex(0);
  }, [formEntries, setSearchParams]);

  return {
    // Data & status respons server Go
    data,
    isLoading,
    isFetching,
    isError,
    error: error?.message || localFormError,
    refetch,

    // Status pencarian aktif
    isSearchActive,
    urlParticipants,

    // State dan fungsi manipulasi form
    formEntries,
    tambahPeserta,
    hapusPeserta,
    updatePeserta,
    executeSearch,
    resetSearch,

    // Tab peserta aktif
    activeParticipantIndex: safeActiveIndex,
    setActiveParticipantIndex,
  };
}

