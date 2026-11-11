import { toApiError } from '@/lib/apiError';
import { apiClient } from '@/lib/axios';
import type {
  PadewasanItem,
  PadewasanHarian,
  CariAlaAyuningRequest,
  CariByNamaRequest,
  CariByNamaResponse,
  DewasaAyuTodayResponse,
  AlaAyuningAPIEnvelope,
  PawukonHarianInfo,
} from '../types/alaAyuning.types';
import { getIndoDayName, parseISODate } from '@/features/kalender/utils/calendarUtils';

/**
 * ============================================================================
 * LAPISAN API: ALA AYUNING DEWASA (PADEWASAN KALENDER BALI)
 * ============================================================================
 * Berkas ini bertanggung jawab sebagai gerbang komunikasi HTTP antara frontend React
 * dan endpoint resmi Backend Go (`backend-go/kalenderbali-be`):
 *
 * Daftar Endpoint yang Terhubung:
 *  1. GET /api/v1/search/ala-ayuning-dewasa (Evaluasi rentang tanggal harian)
 *  2. GET /api/v1/search/ala-ayuning-dewasa/by-name (Pencarian tanggal jatuh per nama)
 *  3. GET /api/v1/ala-ayuning-dewasa/master (Katalog 220 kriteria padewasan)
 *  4. GET /api/v1/ala-ayuning-dewasa/today (Rekomendasi padewasan hari ini)
 *  5. GET /api/v1/kalender (Pengambilan data Pawukon, Wewaran, dan Sasih)
 *
 * Karakteristik Teknis:
 *  - Menggunakan instance terpusat `apiClient` dari `@/lib/axios` dengan baseURL `/api/v1`.
 *  - Caching ramah browser (Header HTTP Cache-Control telah dipasang oleh server Go).
 *  - Bebas dari perhitungan fiktif: Seluruh data dievaluasi deterministik oleh server Go.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BLOK 1: PENGAMBILAN PADEWASAN HARIAN (SATU TANGGAL TERTENTU)
// ----------------------------------------------------------------------------
/**
 * fetchPadewasanHarian mengambil seluruh kriteria padewasan yang aktif pada
 * satu tanggal Masehi tertentu (format YYYY-MM-DD).
 *
 * Endpoint Backend:
 *   GET /api/v1/search/ala-ayuning-dewasa?tanggal_mulai=...&tanggal_selesai=...&beserta_keterangan=true
 *
 * @param tanggal Tanggal Masehi yang ingin dievaluasi (format "YYYY-MM-DD")
 * @returns Promise berisi daftar PadewasanItem (nama, keterangan sastra, severity_code)
 */
export async function fetchPadewasanHarian(tanggal: string): Promise<PadewasanItem[]> {
  if (!tanggal || tanggal.trim() === '') {
    throw new Error('Parameter tanggal wajib diisi.');
  }

  try {
    const response = await apiClient.get<AlaAyuningAPIEnvelope<PadewasanHarian[]>>(
      '/search/ala-ayuning-dewasa',
      {
        params: {
          tanggal_mulai: tanggal.trim(),
          tanggal_selesai: tanggal.trim(),
          beserta_keterangan: true,
        },
      }
    );

    const hasilList = response.data?.data;
    if (Array.isArray(hasilList) && hasilList.length > 0) {
      return hasilList[0].padewasan || [];
    }

    return [];
  } catch (caught) {
    const error = toApiError(caught);
    const errorMsg =
      error?.response?.data?.error?.message ||
      error?.message ||
      'Gagal memuat data padewasan harian dari server.';
    throw new Error(errorMsg, { cause: caught });
  }
}

// ----------------------------------------------------------------------------
// BLOK 2: PENGAMBILAN PADEWASAN RENTANG TANGGAL (MAKSIMAL 366 HARI)
// ----------------------------------------------------------------------------
/**
 * fetchPadewasanRentang mengambil daftar padewasan untuk rentang tanggal tertentu.
 * Digunakan untuk pemetaan kalender bulanan atau pencarian periode khusus.
 *
 * Endpoint Backend:
 *   GET /api/v1/search/ala-ayuning-dewasa
 *
 * @param req Parameter tanggal mulai, tanggal selesai, dan opsi keterangan
 * @returns Promise berisi array PadewasanHarian per tanggal
 */
export async function fetchPadewasanRentang(
  req: CariAlaAyuningRequest
): Promise<PadewasanHarian[]> {
  try {
    const response = await apiClient.get<AlaAyuningAPIEnvelope<PadewasanHarian[]>>(
      '/search/ala-ayuning-dewasa',
      {
        params: {
          tanggal_mulai: req.tanggal_mulai,
          tanggal_selesai: req.tanggal_selesai,
          beserta_keterangan: req.beserta_keterangan ?? true,
        },
      }
    );

    return response.data?.data || [];
  } catch (caught) {
    const error = toApiError(caught);
    const errorMsg =
      error?.response?.data?.error?.message ||
      error?.message ||
      'Gagal memuat rentang padewasan dari server.';
    throw new Error(errorMsg, { cause: caught });
  }
}

// ----------------------------------------------------------------------------
// BLOK 3: PENCARIAN TANGGAL JATUH BERDASARKAN NAMA PADEWASAN (PARITAS LARAVEL)
// ----------------------------------------------------------------------------
/**
 * searchPadewasanByName mencari seluruh tanggal dalam satu bulan di mana kriteria
 * padewasan tertentu aktif (sesuai Gambar 1 & 2 dari sistem Laravel lama).
 *
 * Endpoint Backend:
 *   GET /api/v1/search/ala-ayuning-dewasa/by-name?nama=...&bulan=...&tahun=...
 *
 * Contoh penggunaan:
 *   Mencari kapan saja "Agni Agung Doyan Basmi" aktif pada Oktober 2026.
 *
 * @param req Parameter nama padewasan, angka bulan (1..12), dan tahun (YYYY)
 * @returns Promise berisi CariByNamaResponse lengkap (deskripsi, severity, & daftar tanggal jatuh)
 */
export async function searchPadewasanByName(
  req: CariByNamaRequest
): Promise<CariByNamaResponse> {
  if (!req.nama || req.nama.trim() === '') {
    throw new Error('Nama kriteria padewasan wajib dipilih.');
  }

  try {
    const response = await apiClient.get<AlaAyuningAPIEnvelope<CariByNamaResponse>>(
      '/search/ala-ayuning-dewasa/by-name',
      {
        params: {
          nama: req.nama.trim(),
          bulan: req.bulan,
          tahun: req.tahun,
        },
      }
    );

    if (!response.data || !response.data.data) {
      throw new Error('Hasil pencarian nama padewasan tidak ditemukan.');
    }

    return response.data.data;
  } catch (caught) {
    const error = toApiError(caught);
    const errorMsg =
      error?.response?.data?.error?.message ||
      error?.message ||
      'Gagal melakukan pencarian padewasan berdasarkan nama.';
    throw new Error(errorMsg, { cause: caught });
  }
}

// ----------------------------------------------------------------------------
// BLOK 4: KATALOG MASTER 220 PADEWASAN (UNTUK DROPDOWN & AUTOCOMPLETE)
// ----------------------------------------------------------------------------
/**
 * fetchMasterPadewasan mengambil seluruh 220 katalog kriteria padewasan dari memori RAM
 * server Go. Sangat ringan dan ideal di-cache jangka panjang (staleTime: Infinity).
 *
 * Endpoint Backend:
 *   GET /api/v1/ala-ayuning-dewasa/master
 *
 * @returns Promise berisi 220 PadewasanItem (id, nama, keterangan, severity_code)
 */
export async function fetchMasterPadewasan(): Promise<PadewasanItem[]> {
  try {
    const response = await apiClient.get<AlaAyuningAPIEnvelope<PadewasanItem[]>>(
      '/ala-ayuning-dewasa/master'
    );

    return response.data?.data || [];
  } catch (caught) {
    const error = toApiError(caught);
    console.error('Gagal mengambil master data padewasan:', error);
    return [];
  }
}

// ----------------------------------------------------------------------------
// BLOK 5: WIDGET REKOMENDASI PADEWASAN HARI INI
// ----------------------------------------------------------------------------
/**
 * fetchDewasaAyuToday mengambil ringkasan kualitas padewasan untuk hari ini WITA,
 * lengkap dengan status hari dan 3 rekomendasi padewasan berwatak positif (ayu).
 *
 * Endpoint Backend:
 *   GET /api/v1/ala-ayuning-dewasa/today
 *
 * @returns Promise berisi DewasaAyuTodayResponse
 */
export async function fetchDewasaAyuToday(): Promise<DewasaAyuTodayResponse | null> {
  try {
    const response = await apiClient.get<AlaAyuningAPIEnvelope<DewasaAyuTodayResponse>>(
      '/ala-ayuning-dewasa/today'
    );

    return response.data?.data || null;
  } catch (caught) {
    const error = toApiError(caught);
    console.error('Gagal mengambil rekomendasi dewasa ayu hari ini:', error);
    return null;
  }
}

// ----------------------------------------------------------------------------
// BLOK 6: INTEGRASI PAWUKON HARIAN (WUKU, PANCAWARA, SAPTAWARA, URIP)
// ----------------------------------------------------------------------------
/**
 * fetchDayPawukon mengambil 4 pilar penanggalan Bali (Wuku, Pancawara, Saptawara, Urip, Sasih)
 * untuk tanggal tertentu dari endpoint `/kalender` untuk mengisi kartu "Pawukon Hari Ini".
 *
 * Endpoint Backend:
 *   GET /api/v1/kalender?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 *
 * @param tanggal Tanggal Masehi (format YYYY-MM-DD)
 * @returns Promise berisi PawukonHarianInfo terstruktur
 */
export async function fetchDayPawukon(tanggal: string): Promise<PawukonHarianInfo | null> {
  try {
    const response = await apiClient.get('/kalender', {
      params: {
        start_date: tanggal,
        end_date: tanggal,
      },
    });

    const dayData = response.data?.data?.[0];
    if (!dayData) return null;

    const { day, month, year } = parseISODate(tanggal);
    const indoDay = getIndoDayName(tanggal);

    const saptawaraNama = dayData.wewaran?.saptawara?.nama || '-';
    const pancawaraNama = dayData.wewaran?.pancawara?.nama || '-';
    const wukuNama = dayData.wewaran?.wuku?.nama || '-';
    const sasihNama = dayData.sasih?.nama_sasih || '-';

    // Neptu (Urip) adalah field integer langsung di dalam `wewaran` yang dihitung
    // oleh backend Go dari penjumlahan urip Saptawara + Pancawara (bukan field dari sub-objek).
    // Ref: backend-go/domain/wewaran.go → ElemenWarigaLengkap.Neptu (json:"neptu")
    // Struct Wewaran meng-embed ElemenWarigaLengkap, sehingga serialisasi JSON menghasilkan:
    //   { "wewaran": { "neptu": 10, "saptawara": { "id": "7", "nama": "Saniscara" }, ... } }
    const totalUrip = Number(dayData.wewaran?.neptu || 0);

    return {
      tanggal,
      hariMasehi: `${indoDay}, ${day} ${month} ${year}`,
      hariBali: `${indoDay} · ${saptawaraNama}`,
      sasih: sasihNama,
      wuku: wukuNama,
      pancawara: pancawaraNama,
      saptawara: saptawaraNama,
      urip: totalUrip,
    };
  } catch (error) {
    console.error('Gagal mengambil data pawukon harian:', error);
    return null;
  }
}

