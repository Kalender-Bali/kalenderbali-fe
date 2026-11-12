import axios from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';
import { CALENDAR_RULES_VERSION, usesCalendarRules } from './calendarCache';

/**
 * ==============================================================================
 * INSTANCE AXIOS TERPUSAT (Kalender Bali API Client)
 * ==============================================================================
 * Menghubungkan frontend React dengan backend Go.
 * Menggunakan baseURL dari environment atau default '/api/v1' yang diteruskan via Vite Proxy.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Timeout 15 detik untuk mengantisipasi jaringan lambat
});

/**
 * ==============================================================================
 * REQUEST INTERCEPTOR: SINKRONISASI BEARER TOKEN JWT
 * ==============================================================================
 * Membaca token akses secara langsung dari Zustand useAuthStore (Single Source of Truth).
 * Mencegah anti-pattern penyimpanan ganda pada localStorage.
 */
apiClient.interceptors.request.use(
  (config) => {
    if ((!config.method || config.method.toLowerCase() === 'get') && usesCalendarRules(config.url)) {
      if (config.params instanceof URLSearchParams) {
        config.params = new URLSearchParams(config.params);
        config.params.set('rules_version', CALENDAR_RULES_VERSION);
      } else {
        config.params = { ...config.params, rules_version: CALENDAR_RULES_VERSION };
      }
    }
    // Ambil token aktif dari state Zustand
    const token = useAuthStore.getState().token;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * ==============================================================================
 * RESPONSE INTERCEPTOR: PENANGANAN STATUS & EKSTRAKSI ERROR BACKEND
 * ==============================================================================
 * Meneruskan respon sukses (2xx) dan mengekstrak struktur error terstandarisasi dari Go
 * (seperti: reason, remaining_attempts, retry_at, atau EMAIL_NOT_VERIFIED).
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Pertahankan identitas pembatalan agar query tidak menganggapnya gangguan server.
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // Respons 401 dari token lama tidak boleh menghapus sesi yang sudah berganti.
    const activeToken = useAuthStore.getState().token;
    const headers = error.config?.headers;
    const requestAuthorization = headers?.get?.('Authorization') ?? headers?.Authorization;
    if (error.response?.status === 401 && activeToken && requestAuthorization === `Bearer ${activeToken}`) {
      useAuthStore.getState().logout();
    }

    // Ekstrak pesan dan metadata error terstruktur dari backend Go
    const errorPayload = error.response?.data;
    let errorMessage =
      errorPayload?.error?.message ||
      errorPayload?.message ||
      (typeof errorPayload?.error === 'string' ? errorPayload.error : null);

    // Jika backend offline atau proxy 502 Bad Gateway
    if (!errorMessage) {
      if (error.response?.status === 502) {
        errorMessage = 'Server backend Go (Port 8080) sedang tidak aktif atau tidak dapat dijangkau. Silakan jalankan backend terlebih dahulu.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Koneksi jaringan gagal. Tidak dapat menghubungi server backend.';
      } else {
        errorMessage = 'Terjadi kesalahan pada server';
      }
    }

    // Buat objek Error kaya metadata untuk dikonsumsi oleh komponen antarmuka
    const err = new Error(errorMessage) as Error & {
      status?: number;
      code?: string;
      reason?: string;
      remainingAttempts?: number;
      retryAt?: string | null;
      email?: string;
      response?: typeof error.response;
    };

    err.status = error.response?.status;
    err.code = errorPayload?.code || errorPayload?.error?.code;
    err.reason = errorPayload?.reason;
    err.remainingAttempts = errorPayload?.remaining_attempts;
    err.retryAt = errorPayload?.retry_at;
    err.email = errorPayload?.email; // Berguna untuk error 403 EMAIL_NOT_VERIFIED
    err.response = error.response;

    return Promise.reject(err);
  }
);
