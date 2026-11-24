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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

function extractErrorMessage(error: any): string {
  const errorPayload = error.response?.data;
  let errorMessage =
    errorPayload?.error?.message ||
    errorPayload?.message ||
    (typeof errorPayload?.error === 'string' ? errorPayload.error : null);

  if (!errorMessage) {
    if (error.response?.status === 502) {
      errorMessage = 'Server backend Go (Port 8080) sedang tidak aktif atau tidak dapat dijangkau. Silakan jalankan backend terlebih dahulu.';
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Koneksi jaringan gagal. Tidak dapat menghubungi server backend.';
    } else {
      errorMessage = 'Terjadi kesalahan pada server';
    }
  }
  return errorMessage;
}

function createApiError(error: any) {
  const errorPayload = error.response?.data;
  const errorMessage = extractErrorMessage(error);
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
  return err;
}

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
  async (error) => {
    // Pertahankan identitas pembatalan agar query tidak menganggapnya gangguan server.
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const activeToken = useAuthStore.getState().token;
    const refreshToken = useAuthStore.getState().refreshToken;
    const headers = originalRequest?.headers;
    const requestAuthorization = headers?.get?.('Authorization') ?? headers?.Authorization;
    const isCurrentToken = Boolean(activeToken && requestAuthorization === `Bearer ${activeToken}`);
    const isAuthUrl = Boolean(
      originalRequest?.url?.includes('/refresh') ||
      originalRequest?.url?.includes('/login') ||
      originalRequest?.url?.includes('/register')
    );

    // Jika memiliki refreshToken aktif dan token kedaluwarsa, lakukan silent token refresh
    if (error.response?.status === 401 && isCurrentToken && refreshToken && !originalRequest?._retry && !isAuthUrl) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (originalRequest.headers) {
              if (typeof originalRequest.headers.set === 'function') {
                originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
              } else {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshUrl = `${apiClient.defaults.baseURL || '/api/v1'}/refresh`;
      try {
        const { data } = await axios.post<{ access_token: string; refresh_token?: string }>(
          refreshUrl,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );
        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token || refreshToken;
        useAuthStore.getState().setToken(newAccessToken, newRefreshToken);
        if (originalRequest.headers) {
          if (typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
          } else {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
        }
        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        return Promise.reject(createApiError(error));
      } finally {
        isRefreshing = false;
      }
    }

    // Respons 401 dari token lama tidak boleh menghapus sesi yang sudah berganti.
    if (error.response?.status === 401 && isCurrentToken) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(createApiError(error));
  }
);
