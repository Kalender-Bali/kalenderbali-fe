/** Metadata pesan gagal dari interceptor HTTP, termasuk OTP dan status validasi. */
export interface ApiClientError extends Error {
  status?: number;
  code?: string;
  remainingAttempts?: number;
  retryAt?: string | null;
  response?: {
    status?: number;
    data?: { message?: string; error?: { message?: string; pihak?: string } };
  };
}

export function toApiError(value: unknown): ApiClientError {
  if (typeof value === 'object' && value !== null) return value as ApiClientError;
  return new Error(typeof value === 'string' ? value : 'Terjadi kesalahan pada server.');
}
