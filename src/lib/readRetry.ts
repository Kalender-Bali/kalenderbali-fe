export const READ_RETRY_DELAY = 1000;

/** Satu pengulangan untuk gangguan sementara; validasi, izin, dan pembatalan tidak diulang. */
export function shouldRetryRead(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  let current = error;
  const seen = new Set<unknown>();
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    const detail = current as { name?: string; code?: string; __CANCEL__?: boolean; status?: number; response?: { status?: number }; cause?: unknown };
    if (detail.__CANCEL__ || detail.name === 'AbortError' || detail.name === 'CanceledError' || detail.code === 'ERR_CANCELED') return false;
    const status = detail.status ?? detail.response?.status;
    if (status !== undefined && status >= 400 && status < 500) return false;
    current = detail.cause;
  }
  return true;
}

/** Untuk pembacaan di luar query (admin) dan POST perhitungan tanpa penulisan data. */
export async function withReadRetry<T>(read: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  for (let failures = 0; ; failures++) {
    signal?.throwIfAborted();
    try { return await read(); }
    catch (error) {
      if (signal?.aborted || !shouldRetryRead(failures, error)) throw error;
      await new Promise<void>((resolve, reject) => {
        const abort = () => { clearTimeout(timer); reject(signal?.reason); };
        const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, READ_RETRY_DELAY);
        signal?.addEventListener('abort', abort, { once: true });
      });
    }
  }
}
