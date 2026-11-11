import { toApiError } from '@/lib/apiError';
import { apiClient } from '@/lib/axios';
import type {
  JodohRequest,
  JodohData,
  JodohAPIEnvelope,
} from '../types/jodoh.types';

/**
 * ============================================================================
 * LAPISAN API: RAMALAN JODOH (PETENUNGAN PAL SRI SEDANA)
 * ============================================================================
 * Berkas ini bertindak sebagai jembatan komunikasi HTTP antara frontend React
 * dan layanan Backend Go untuk evaluasi ramalan kecocokan perjodohan.
 *
 * Prinsip Desain & Keamanan:
 *  1. Preservasi Privasi (PII Protection): Menggunakan metode HTTP POST dengan
 *     payload JSON di body permintaan, sehingga tanggal lahir dan nama tidak
 *     terekspos pada access log proxy/server.
 *  2. Header Tanpa Cache: Backend Go menyematkan "Cache-Control: private, no-store"
 *     untuk menjamin kerahasiaan data pribadi pengguna.
 *  3. Klien HTTP Terpusat: Memanfaatkan instance `apiClient` dari `@/lib/axios`
 *     yang sudah terkonfigurasi dengan prefix `/api/v1` dan penanganan timeout.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BLOK 1: VALIDASI INPUT DI SISI KLIEN (PRE-REQUEST VALIDATION)
// ----------------------------------------------------------------------------

/**
 * Regex format tanggal ISO YYYY-MM-DD standar sipil masehi.
 */
const DATE_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Memvalidasi format dasar payload sebelum dikirimkan ke jaringan,
 * guna memberikan umpan balik instan tanpa membebani server Go.
 */
function validateJodohPayload(payload: JodohRequest): void {
  if (!payload.diri?.tanggal_lahir || payload.diri.tanggal_lahir.trim() === '') {
    throw new Error('Tanggal lahir Anda wajib diisi.');
  }

  if (!DATE_ISO_REGEX.test(payload.diri.tanggal_lahir.trim())) {
    throw new Error('Format tanggal lahir Anda harus YYYY-MM-DD.');
  }

  if (!payload.pasangan?.tanggal_lahir || payload.pasangan.tanggal_lahir.trim() === '') {
    throw new Error('Tanggal lahir pasangan wajib diisi.');
  }

  if (!DATE_ISO_REGEX.test(payload.pasangan.tanggal_lahir.trim())) {
    throw new Error('Format tanggal lahir pasangan harus YYYY-MM-DD.');
  }
}

// ----------------------------------------------------------------------------
// BLOK 2: FUNGSI UTAMA PENGIRIMAN PERMINTAAN PERHITUNGAN JODOH
// ----------------------------------------------------------------------------

/**
 * searchJodoh mengirimkan permintaan evaluasi kecocokan perjodohan ke backend Go.
 *
 * Endpoint Backend:
 *   POST /api/v1/search/jodoh
 *
 * @param payload Objek masukan yang berisi data Diri dan Pasangan (nama & tanggal lahir).
 * @returns Promise berisi `JodohData` (profil astrologis weton, 4 tenung, skor, dan kesimpulan).
 */
export async function searchJodoh(payload: JodohRequest): Promise<JodohData> {
  // 1. Validasi masukan tanggal di sisi klien
  validateJodohPayload(payload);

  // 2. Normalisasi string nama & tanggal agar bersih dari spasi liar
  const sanitizedPayload: JodohRequest = {
    diri: {
      nama: payload.diri.nama?.trim() || '',
      tanggal_lahir: payload.diri.tanggal_lahir.trim(),
    },
    pasangan: {
      nama: payload.pasangan.nama?.trim() || '',
      tanggal_lahir: payload.pasangan.tanggal_lahir.trim(),
    },
  };

  try {
    // 3. Eksekusi HTTP POST ke endpoint Go via instance apiClient terpusat
    const response = await apiClient.post<JodohAPIEnvelope>(
      '/search/jodoh',
      sanitizedPayload
    );

    // 4. Verifikasi ketersediaan data pada envelope respon backend
    if (!response.data || !response.data.data) {
      const serverErrorMessage =
        response.data?.error?.message ||
        'Data hasil perhitungan ramalan jodoh tidak ditemukan dari server.';
      throw new Error(serverErrorMessage);
    }

    return response.data.data;
  } catch (caught) {
    const error = toApiError(caught);
    // ------------------------------------------------------------------------
    // BLOK 3: PENANGANAN KESALAHAN RESPON DARI BACKEND GO
    // ------------------------------------------------------------------------
    // Ekstraksi pesan kesalahan ramah pengguna dari error envelope server Go:
    // Contoh error: "tahun kelahiran di luar rentang 1800-2200", "tanggal masa depan", dll.

    if (error?.response?.data?.error?.message) {
      const errObj = error.response.data.error;
      const pihakContext = errObj.pihak ? ` (pada data ${errObj.pihak})` : '';
      throw new Error(`${errObj.message}${pihakContext}`, { cause: caught });
    }

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message, { cause: caught });
    }

    if (error?.message) {
      throw new Error(error.message, { cause: caught });
    }

    throw new Error('Terjadi kesalahan saat menghubungkan ke server Kalender Bali.', { cause: caught });
  }
}

