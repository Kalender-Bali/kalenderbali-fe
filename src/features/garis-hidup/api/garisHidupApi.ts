import { apiClient } from '@/lib/axios';
import type {
  GarisHidupRequest,
  GarisHidupProfileResult,
  GarisHidupAPIEnvelope,
} from '../types/garisHidup.types';

/**
 * ============================================================================
 * LAPISAN API: GARIS HIDUP (PAL SRI SEDANA)
 * ============================================================================
 * Berkas ini bertindak sebagai jembatan komunikasi HTTP antara frontend React
 * dan layanan Backend Go untuk perhitungan Garis Hidup (Pal Sri Sedana).
 *
 * Prinsip Desain & Keamanan:
 *  1. Preservasi Privasi (PII Protection): Menggunakan metode HTTP POST dengan
 *     payload JSON di body permintaan, sehingga tanggal lahir dan nama tidak
 *     terekspos pada access log proxy/server (selaras dengan Cache-Control: private, no-store).
 *  2. Klien HTTP Terpusat: Memanfaatkan instance `apiClient` dari `@/lib/axios`
 *     yang sudah terkonfigurasi dengan prefix baseURL `/api/v1` dan batas timeout 15 detik.
 *  3. Validasi Pra-Pengiriman: Memastikan masukan memenuhi batasan sebelum
 *     melakukan panggilan jaringan guna menghemat kuota pengguna.
 * ============================================================================
 */

// ============================================================================
// BLOK 1: VALIDASI INPUT DI SISI KLIEN (PRE-REQUEST VALIDATION)
// ============================================================================

/** Regex format tanggal ISO YYYY-MM-DD standar sipil masehi */
const DATE_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Memvalidasi format dasar payload sebelum dikirimkan ke jaringan,
 * guna memberikan umpan balik instan tanpa membebani server Go.
 */
function validateGarisHidupPayload(payload: GarisHidupRequest): void {
  if (!payload.peserta || !Array.isArray(payload.peserta) || payload.peserta.length === 0) {
    throw new Error('Minimal satu peserta wajib diisi.');
  }

  if (payload.peserta.length > 5) {
    throw new Error('Jumlah peserta maksimal 5 orang.');
  }

  for (let i = 0; i < payload.peserta.length; i++) {
    const p = payload.peserta[i];
    const indexLabel = `Peserta ${i + 1}`;

    if (!p.tanggal_lahir || p.tanggal_lahir.trim() === '') {
      throw new Error(`Tanggal lahir untuk ${indexLabel} wajib diisi.`);
    }

    if (!DATE_ISO_REGEX.test(p.tanggal_lahir.trim())) {
      throw new Error(`Format tanggal lahir ${indexLabel} harus YYYY-MM-DD.`);
    }

    if (p.nama && p.nama.trim().length > 100) {
      throw new Error(`Nama ${indexLabel} maksimal 100 karakter.`);
    }
  }
}

// ============================================================================
// BLOK 2: FUNGSI UTAMA PENGIRIMAN PERMINTAAN PERHITUNGAN GARIS HIDUP
// ============================================================================

/**
 * searchGarisHidup mengirimkan permintaan perhitungan siklus garis hidup Pal Sri Sedana ke backend Go.
 *
 * Endpoint Backend:
 *   POST /api/v1/search/garis-hidup
 *
 * @param payload Objek masukan yang berisi array 1–5 peserta (nama & tanggal lahir).
 * @returns Promise berisi daftar `GarisHidupProfileResult` untuk setiap peserta yang dihitung.
 */
export async function searchGarisHidup(
  payload: GarisHidupRequest
): Promise<GarisHidupProfileResult[]> {
  // 1. Validasi masukan data di sisi klien
  validateGarisHidupPayload(payload);

  // 2. Normalisasi string nama & tanggal lahir agar bersih dari spasi liar
  const sanitizedPayload: GarisHidupRequest = {
    peserta: payload.peserta.map((p) => ({
      nama: p.nama?.trim() || '',
      tanggal_lahir: p.tanggal_lahir.trim(),
    })),
  };

  try {
    // 3. Eksekusi HTTP POST ke endpoint Go via instance apiClient terpusat
    const response = await apiClient.post<GarisHidupAPIEnvelope>(
      '/search/garis-hidup',
      sanitizedPayload
    );

    // 4. Verifikasi ketersediaan data pada envelope respon backend
    if (!response.data || !response.data.data || !response.data.data.hasil) {
      const serverErrorMessage =
        response.data?.error?.message ||
        'Data hasil perhitungan garis hidup tidak ditemukan dari server.';
      throw new Error(serverErrorMessage);
    }

    return response.data.data.hasil;
  } catch (error: unknown) {
    // ========================================================================
    // BLOK 3: PENANGANAN KESALAHAN RESPON DARI BACKEND GO
    // ========================================================================
    // Ekstraksi pesan kesalahan ramah pengguna dari error envelope server Go:
    // Contoh error: "peserta 2: tanggal lahir tidak boleh di masa depan",
    // "tahun kelahiran di luar rentang 1800-2200", dsb.

    const err = error as {
      response?: {
        data?: {
          error?: {
            message?: string;
            details?: {
              peserta_ke?: number;
            };
          };
          message?: string;
        };
      };
      message?: string;
    };

    if (err?.response?.data?.error?.message) {
      const errObj = err.response.data.error;
      const pesertaContext = errObj.details?.peserta_ke
        ? ` (pada Peserta ${errObj.details.peserta_ke})`
        : '';
      throw new Error(`${errObj.message}${pesertaContext}`, { cause: error });
    }

    if (err?.response?.data?.message) {
      throw new Error(err.response.data.message, { cause: error });
    }

    if (err?.message) {
      throw new Error(err.message, { cause: error });
    }

    throw new Error('Terjadi kesalahan saat menghubungkan ke server Kalender Bali.', { cause: error });
  }
}

