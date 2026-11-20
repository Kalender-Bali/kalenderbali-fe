import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useReadQuery } from '@/lib/useReadQuery';
import { authQueryScope, useAuthQueryScope, useAuthStore } from '@/stores/useAuthStore';
import { authorizeCardExport, fetchCardExportQuota } from '../api/cardExportQuota';
import { pendingCardExport } from '../utils/cardExportOperation';

const quotaKey = (scope: string) => ['card-export-quota', scope] as const;

export function useCardExportQuota() {
  const client = useQueryClient();
  const scope = useAuthQueryScope();
  const signedIn = useAuthStore((state) => Boolean(state.isAuthenticated && state.token && state.user));
  const query = useReadQuery({
    queryKey: quotaKey(scope),
    enabled: signedIn,
    meta: { authScoped: true },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    queryFn: ({ signal }) => {
      const state = useAuthStore.getState();
      if (!state.token || authQueryScope(state) !== scope) throw new DOMException('Sesi berubah.', 'AbortError');
      return fetchCardExportQuota(state.token, signal);
    },
  });
  const { data, refetch } = query;

  // Gunakan waktu reset dari backend agar kartu yang dibiarkan terbuka ikut diperbarui.
  useEffect(() => {
    if (!signedIn || !data) return;
    const wait = Date.parse(data.resets_at) - Date.now();
    if (!Number.isFinite(wait) || wait <= 0) return;
    const timer = window.setTimeout(() => void refetch(), wait + 250);
    return () => window.clearTimeout(timer);
  }, [data, refetch, signedIn]);

  async function authorize(file: File, signal: AbortSignal) {
    const { user, token } = useAuthStore.getState();
    if (!user || !token || !signedIn) throw new Error('Masuk untuk mengekspor kartu gambar.');
    const assertSession = () => {
      signal.throwIfAborted();
      const current = useAuthStore.getState();
      if (authQueryScope(current) !== scope || current.token !== token) {
        throw new DOMException('Sesi berubah.', 'AbortError');
      }
    };
    const operation = await pendingCardExport(file, user.id);
    assertSession();
    // Batalkan pembacaan lama agar respons kuota yang baru tidak tertimpa.
    await client.cancelQueries({ queryKey: quotaKey(scope), exact: true });
    assertSession();
    const result = await authorizeCardExport(token, operation.id, signal);
    operation.clear();
    assertSession();
    client.setQueryData(quotaKey(scope), result.quota);
    return result;
  }

  return { signedIn, scope, status: data, loading: query.isLoading, error: query.isError, refetch, authorize };
}
