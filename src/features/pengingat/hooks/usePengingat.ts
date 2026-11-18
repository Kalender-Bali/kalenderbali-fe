import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReadQuery } from '@/lib/useReadQuery';
import { authQueryScope, useAuthStore } from '@/stores/useAuthStore';
import { createPengingat, deletePengingat, fetchPengingat, fetchPengingatPolicy, fetchPengingatNotifications, markPengingatNotificationRead } from '../api/pengingatApi';
import type { PengingatEntry } from '../types/pengingat.types';

function usePengingatSession() {
  const scope = useAuthStore(authQueryScope);
  const authenticated = useAuthStore(state => state.isAuthenticated && Boolean(state.user && state.token));
  return { scope, authenticated };
}

export function usePengingat() {
  const { scope, authenticated } = usePengingatSession();
  return useReadQuery({ queryKey: ['reminders', scope], queryFn: ({ signal }) => fetchPengingat(signal), enabled: authenticated, meta: { authScoped: true }, staleTime: 15_000, gcTime: 0, refetchInterval: 30_000, refetchOnWindowFocus: true });
}

export function usePengingatNotifications(page = 1) {
  const { scope, authenticated } = usePengingatSession();
  return useReadQuery({ queryKey: ['reminder-notifications', scope, page], queryFn: ({ signal }) => fetchPengingatNotifications(page, signal), enabled: authenticated, meta: { authScoped: true }, staleTime: 10_000, gcTime: 0, refetchInterval: 30_000, refetchOnWindowFocus: true });
}

export function usePengingatPolicy() {
  const { scope, authenticated } = usePengingatSession();
  return useReadQuery({ queryKey: ['reminder-policy', scope], queryFn: ({ signal }) => fetchPengingatPolicy(signal), enabled: authenticated, meta: { authScoped: true }, staleTime: 0, gcTime: 0, refetchInterval: 30_000, refetchOnWindowFocus: true });
}

// A response from an old session must not populate the next account's screen.
async function inCurrentReminderSession<T>(operation: () => Promise<T>, completed: (result: T, scope: string) => void): Promise<T> {
  const before = useAuthStore.getState();
  if (!before.isAuthenticated || !before.user || !before.token) throw new Error('Masuk terlebih dahulu untuk mengelola pengingat.');
  const result = await operation();
  const after = useAuthStore.getState();
  if (!after.isAuthenticated || after.user?.id !== before.user.id || after.token !== before.token) throw new Error('Sesi berubah. Silakan buka kembali pengingat.');
  completed(result, authQueryScope(after));
  return result;
}

export function usePengingatMutations() {
  const client = useQueryClient();
  const invalidate = (scope: string) => {
    void client.invalidateQueries({ queryKey: ['reminders', scope] });
    void client.invalidateQueries({ queryKey: ['reminder-notifications', scope] });
    void client.invalidateQueries({ queryKey: ['reminder-policy', scope] });
  };
  const create = useMutation({ mutationFn: (entry: PengingatEntry) => inCurrentReminderSession(() => createPengingat(entry), (saved, scope) => {
    client.setQueryData<PengingatEntry[]>(['reminders', scope], current => [...(current ?? []), saved]);
    invalidate(scope);
  }), onError: () => invalidate(authQueryScope(useAuthStore.getState())), networkMode: 'always', retry: false });
  const remove = useMutation({ mutationFn: (id: string) => inCurrentReminderSession(async () => { await deletePengingat(id); return id; }, (removedId, scope) => {
    client.setQueryData<PengingatEntry[]>(['reminders', scope], current => current?.filter(entry => entry.id !== removedId) ?? []);
    invalidate(scope);
  }), networkMode: 'always', retry: false });
  const markRead = useMutation({ mutationFn: (id: string) => inCurrentReminderSession(() => markPengingatNotificationRead(id), (_result, scope) => invalidate(scope)), networkMode: 'always', retry: false });
  return { create, remove, markRead };
}
