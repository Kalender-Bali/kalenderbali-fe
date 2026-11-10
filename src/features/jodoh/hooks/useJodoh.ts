import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchJodoh } from '../api/jodohApi';
import type {
  JodohData,
  JodohRequest,
  JodohSearchParams,
  JodohFormData,
} from '../types/jodoh.types';

/**
 * ============================================================================
 * CUSTOM HOOK: useJodoh (State Management & Sinkronisasi URL)
 * ============================================================================
 * Hook orkestrator terpusat untuk fitur Ramalan Jodoh (Pal Sri Sedana):
 *  1. Server State Management: Menggunakan TanStack Query dengan konfigurasi Lapis 3
 *     RAM Cache (staleTime 30 menit, gcTime 24 jam) sesuai panduan `fe_strategy.md`.
 *  2. URL-as-State Synchronization: Menyinkronkan status pencarian ke query parameter
 *     URL (?nama_diri=...&tgl_diri=...&nama_pasangan=...&tgl_pasangan=...) sehingga
 *     tautan ramalan dapat langsung dibagikan (shareable), tahan refresh browser (F5),
 *     dan mendukung tombol navigasi Back/Forward.
 *  3. Validasi Presisi Klien: Memastikan kedua tanggal lahir berformat ISO (YYYY-MM-DD)
 *     sebelum mengeksekusi request jaringan ke backend Go.
 *  4. Aksi Swap Ergonomis: Menyediakan fungsi `swapPartners` untuk menukar posisi Diri
 *     dan Pasangan secara instan dengan 1 klik.
 * ============================================================================
 */

/**
 * Regex format tanggal ISO YYYY-MM-DD standar sipil masehi.
 */
const DATE_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function useJodoh() {
  const [searchParams, setSearchParams] = useSearchParams();

  // -------------------------------------------------------------------------
  // BLOK 1: RESOLUSI PARAMETER DARI URL (URL-AS-STATE PATTERN)
  // -------------------------------------------------------------------------
  // Membaca parameter identitas dan tanggal lahir kedua belah pihak dari query string URL
  const queryNamaDiri = searchParams.get('nama_diri') || '';
  const queryTglDiri = searchParams.get('tgl_diri') || '';
  const queryNamaPasangan = searchParams.get('nama_pasangan') || '';
  const queryTglPasangan = searchParams.get('tgl_pasangan') || '';

  // Validasi kedua tanggal lahir harus terisi dan berformat ISO YYYY-MM-DD
  const isSearchValid = useMemo(() => {
    return (
      Boolean(queryTglDiri && DATE_ISO_REGEX.test(queryTglDiri)) &&
      Boolean(queryTglPasangan && DATE_ISO_REGEX.test(queryTglPasangan))
    );
  }, [queryTglDiri, queryTglPasangan]);

  // Objek parameter aktif untuk konsumsi komponen antarmuka
  const activeParams: JodohSearchParams | null = useMemo(() => {
    if (!isSearchValid) return null;
    return {
      nama_diri: queryNamaDiri,
      tgl_diri: queryTglDiri,
      nama_pasangan: queryNamaPasangan,
      tgl_pasangan: queryTglPasangan,
    };
  }, [isSearchValid, queryNamaDiri, queryTglDiri, queryNamaPasangan, queryTglPasangan]);

  // -------------------------------------------------------------------------
  // BLOK 2: EKSEKUSI QUERY DENGAN TANSTACK QUERY (LAPIS 3 RAM CACHE)
  // -------------------------------------------------------------------------
  // Payload JSON yang dikirimkan ke backend Go (POST /api/v1/search/jodoh)
  const queryPayload: JodohRequest = useMemo(
    () => ({
      diri: {
        nama: queryNamaDiri,
        tanggal_lahir: queryTglDiri,
      },
      pasangan: {
        nama: queryNamaPasangan,
        tanggal_lahir: queryTglPasangan,
      },
    }),
    [queryNamaDiri, queryTglDiri, queryNamaPasangan, queryTglPasangan]
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<JodohData, Error>({
    queryKey: ['jodoh', queryNamaDiri, queryTglDiri, queryNamaPasangan, queryTglPasangan],
    queryFn: async () => {
      return await searchJodoh(queryPayload);
    },
    // Query hanya dieksekusi jika kedua tanggal lahir telah lolos validasi
    enabled: isSearchValid,

    // Konfigurasi cache resmi fe_strategy.md:
    // 1. Data segar selama 30 menit (pindah halaman/tab kembali instan 0ms)
    staleTime: 1000 * 60 * 30,

    // 2. Data dipertahankan di RAM memori browser selama 24 jam
    gcTime: 1000 * 60 * 60 * 24,

    // 3. Matikan auto-refetch saat pengguna berpindah tab peramban
    refetchOnWindowFocus: false,

    // 4. Coba ulang 1 kali jika terjadi kegagalan jaringan sementara
    retry: 1,
  });

  // -------------------------------------------------------------------------
  // BLOK 3: FUNGSI AKSI NAVIGASI PENCARIAN (SET PARAMETER URL)
  // -------------------------------------------------------------------------

  /**
   * executeSearch memperbarui URL query params untuk memicu pencarian ramalan jodoh.
   * Parameter disimpan ke URL sehingga tautan langsung dapat dibagikan ke orang lain.
   */
  const executeSearch = useCallback(
    (formData: JodohFormData) => {
      const nextParams = new URLSearchParams(searchParams);

      if (formData.namaDiri && formData.namaDiri.trim()) {
        nextParams.set('nama_diri', formData.namaDiri.trim());
      } else {
        nextParams.delete('nama_diri');
      }

      if (formData.tanggalLahirDiri) {
        nextParams.set('tgl_diri', formData.tanggalLahirDiri.trim());
      } else {
        nextParams.delete('tgl_diri');
      }

      if (formData.namaPasangan && formData.namaPasangan.trim()) {
        nextParams.set('nama_pasangan', formData.namaPasangan.trim());
      } else {
        nextParams.delete('nama_pasangan');
      }

      if (formData.tanggalLahirPasangan) {
        nextParams.set('tgl_pasangan', formData.tanggalLahirPasangan.trim());
      } else {
        nextParams.delete('tgl_pasangan');
      }

      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  /**
   * swapPartners menukar nilai form/URL antara Diri dan Pasangan secara instan.
   * Memudahkan pengguna menguji sifat komutatif / simetri petenungan.
   */
  const swapPartners = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);

    const currentNamaDiri = nextParams.get('nama_diri') || '';
    const currentTglDiri = nextParams.get('tgl_diri') || '';
    const currentNamaPasangan = nextParams.get('nama_pasangan') || '';
    const currentTglPasangan = nextParams.get('tgl_pasangan') || '';

    // Tukar nama
    if (currentNamaPasangan) {
      nextParams.set('nama_diri', currentNamaPasangan);
    } else {
      nextParams.delete('nama_diri');
    }
    if (currentNamaDiri) {
      nextParams.set('nama_pasangan', currentNamaDiri);
    } else {
      nextParams.delete('nama_pasangan');
    }

    // Tukar tanggal lahir
    if (currentTglPasangan) {
      nextParams.set('tgl_diri', currentTglPasangan);
    } else {
      nextParams.delete('tgl_diri');
    }
    if (currentTglDiri) {
      nextParams.set('tgl_pasangan', currentTglDiri);
    } else {
      nextParams.delete('tgl_pasangan');
    }

    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  /**
   * resetSearch membersihkan semua query parameter pencarian aktif dari URL,
   * mengembalikan halaman ke kondisi awal (awal buka).
   */
  const resetSearch = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('nama_diri');
    nextParams.delete('tgl_diri');
    nextParams.delete('nama_pasangan');
    nextParams.delete('tgl_pasangan');
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  // -------------------------------------------------------------------------
  // BLOK 4: KONTRAK KELUARAN HOOK UNTUK KOMPONEN UI
  // -------------------------------------------------------------------------
  return {
    data: data || null,
    isLoading,
    isFetching,
    isError,
    error: error?.message || null,
    refetch,
    activeParams,
    hasActiveSearch: isSearchValid,
    executeSearch,
    swapPartners,
    resetSearch,
  };
}

