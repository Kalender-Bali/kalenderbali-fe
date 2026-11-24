import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useReadQuery, readQueryFeedback } from '@/lib/useReadQuery';
import { shouldRetryRead, READ_RETRY_DELAY } from '@/lib/readRetry';
import { authQueryScope, useAuthQueryScope, useAuthStore } from '@/stores/useAuthStore';
import * as api from '../api/komunitasApi';
import type { KomunitasFilters, KomunitasTab, KomunitasPayload, KomunitasFinancePayload, KomunitasFinanceUpdate } from '../types/komunitas.types';
import { positiveId, todayWita } from '../utils/komunitasUtils';

/** URL menyimpan navigasi, filter, dan buku terpilih; cursor milik query halaman. */
export function useKomunitasUrl() {
  const [params, setParams] = useSearchParams();
  const rawTab = params.get('tab');
  const tab: KomunitasTab = rawTab === 'saya' || rawTab === 'pengajuan' ? rawTab : 'semua';
  const filters: KomunitasFilters = { search: params.get('q') || '', country: params.get('country') || '', province: params.get('province') || '', city: params.get('city') || '' };
  const patch = (values: Record<string, string | null>, replace = false) => setParams(previous => {
    const next = new URLSearchParams(previous);
    Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    return next;
  }, { replace });
  const yearValue = params.get('year');
  const year = yearValue === 'semua' ? 'semua' : /^\d{4}$/.test(yearValue || '') && Number(yearValue) > 0 ? yearValue! : todayWita().slice(0, 4);
  return { params, tab, filters, id: positiveId(params.get('id')), view: params.get('view') === 'kas' ? 'kas' : 'list',
    dialog: params.get('dialog') || '', year, category: positiveId(params.get('category')),
    entryType: params.get('entry') === 'debit' || params.get('entry') === 'kredit' ? params.get('entry')! : '', patch,
    setTab: (next: KomunitasTab) => patch({ tab: next === 'semua' ? null : next, country: null, province: null, city: null, id: null, dialog: null, view: null }),
    open: (id: number, view: 'detail' | 'kas') => patch({ id: String(id), view: view === 'kas' ? 'kas' : null, dialog: view === 'detail' ? 'detail' : null }),
    close: () => patch({ id: null, view: null, dialog: null }),
    reset: () => patch({ q: null, country: null, province: null, city: null }),
  };
}

/** Cache direktori komunitas terpisah dari daftar pura; auth scope mencegah kebocoran antar-akun. */
export function useKomunitasList(tab: KomunitasTab, filters: KomunitasFilters, enabled = true) {
  const scope = useAuthQueryScope();
  const query = useInfiniteQuery({
    queryKey: ['komunitas', 'list', tab, filters, scope], meta: { authScoped: true },
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => api.fetchCommunities(tab, filters, pageParam, signal),
    getNextPageParam: (last, _pages, previous, cursors) => {
      const cursor = last.pagination.next_cursor;
      // Cursor berulang tidak boleh membuat tombol memuat halaman yang sama tanpa akhir.
      return last.pagination.has_more && cursor && cursor !== previous && !cursors.includes(cursor) ? cursor : undefined;
    }, enabled, retry: shouldRetryRead, retryDelay: READ_RETRY_DELAY, networkMode: 'always', staleTime: 30_000,
  });
  const items = [...new Map(query.data?.pages.flatMap(page => page.data).map(item => [item.id, item]) ?? []).values()];
  return { ...readQueryFeedback(query), items };
}
export function useKomunitasRegions(tab: KomunitasTab, enabled = true) {
  const scope = useAuthQueryScope();
  return useReadQuery({ queryKey: ['komunitas', 'regions', tab, scope], meta: { authScoped: true },
    queryFn: ({ signal }) => api.fetchCommunityRegions(tab, signal), enabled, staleTime: 30_000 });
}
export function useKomunitasDetail(id?: number) {
  const scope = useAuthQueryScope();
  return useReadQuery({ queryKey: ['komunitas', 'detail', id, scope], meta: { authScoped: true },
    queryFn: ({ signal }) => api.fetchCommunity(id!, signal), enabled: !!id, staleTime: 0, refetchOnWindowFocus: true });
}
export function useKomunitasGeo(level: 'countries' | 'provinces' | 'cities', parent?: number) {
  return useReadQuery({ queryKey: ['geo', level, parent], queryFn: ({ signal }) => api.fetchGeoOptions(level, parent, signal),
    enabled: level === 'countries' || !!parent, staleTime: 86_400_000 });
}
export function useKomunitasMembers(enabled: boolean) {
  const scope = useAuthQueryScope();
  return useReadQuery({ queryKey: ['komunitas', 'members', scope], meta: { authScoped: true },
    queryFn: ({ signal }) => api.fetchCommunityMembers(signal), enabled, staleTime: 30_000 });
}
export function useKomunitasCategories() {
  return useReadQuery({ queryKey: ['finance', 'categories'], queryFn: api.fetchFinanceCategories, staleTime: 86_400_000 });
}
export function useKomunitasFinance(id: number, year: string, category?: number, entryType?: string) {
  const scope = useAuthQueryScope();
  const yearParam = year === 'semua' ? undefined : year;
  const entries = useReadQuery({ queryKey: ['pura', 'finance', 'entries', String(id), yearParam, category, entryType, scope],
    meta: { authScoped: true }, queryFn: () => api.fetchPuraFinance(id, yearParam, category, entryType || undefined), staleTime: 30_000 });
  const summary = useReadQuery({ queryKey: ['pura', 'finance', 'summary', String(id), yearParam, category, scope],
    meta: { authScoped: true }, queryFn: () => api.fetchPuraFinanceSummary(id, yearParam, category), staleTime: 30_000 });
  return { entries, summary };
}

/** Respons mutation sesi lama tidak boleh mengubah cache atau memberi sukses di akun baru. */
export async function inCommunitySession<T>(operation: () => Promise<T>, invalidate: () => Promise<void>): Promise<T> {
  const before = useAuthStore.getState();
  if (!before.isAuthenticated || !before.token) throw new Error('Silakan login kembali.');
  const result = await operation();
  const after = useAuthStore.getState();
  if (before.token !== after.token || authQueryScope(before) !== authQueryScope(after)) throw new Error('Sesi berubah. Muat ulang untuk memeriksa hasil penyimpanan.');
  await invalidate();
  if (authQueryScope(before) !== authQueryScope(useAuthStore.getState())) throw new Error('Sesi berubah. Muat ulang untuk memeriksa hasil penyimpanan.');
  return result;
}
export function useKomunitasMutations(id?: number) {
  const client = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['komunitas'] }),
      client.invalidateQueries({ queryKey: ['pura', 'detail'] }),
      client.invalidateQueries({ queryKey: ['piodalan', 'puras'] }),
      ...(id ? [client.invalidateQueries({ queryKey: ['pura', 'finance', 'entries', String(id)] }),
        client.invalidateQueries({ queryKey: ['pura', 'finance', 'summary', String(id)] })] : []),
    ]);
  };
  // Mutation tidak diulang otomatis; 403 juga menyegarkan mapping yang mungkin sudah dicabut.
  const config = { retry: false, networkMode: 'always' as const, onError: invalidate };
  const run = <T,>(operation: () => Promise<T>) => inCommunitySession(operation, invalidate);
  const save = useMutation({ ...config, mutationFn: (payload: KomunitasPayload) => run(() => api.saveCommunity(payload, id)) });
  const moderate = useMutation({ ...config, mutationFn: (status: 'Published' | 'Rejected') => run(() => api.moderateCommunity(id!, status)) });
  const review = useMutation({ ...config, mutationFn: (payload: { status: 'Published' | 'Rejected' | 'Review'; note?: string }) => run(() => api.reviewCommunity(id!, payload.status, payload.note)) });
  const remove = useMutation({ ...config, mutationFn: () => run(() => api.deleteCommunity(id!)) });
  const addManager = useMutation({ ...config, mutationFn: (userId: number) => run(() => api.addCommunityManager(id!, userId)) });
  const removeManager = useMutation({ ...config, mutationFn: (userId: number) => run(() => api.removeCommunityManager(id!, userId)) });
  const createFinance = useMutation({ ...config, mutationFn: (payload: KomunitasFinancePayload) => run(() => api.createFinanceEntry(id!, { ...payload, pura_id: id! })) });
  const updateFinance = useMutation({ ...config, mutationFn: ({ entryId, payload }: { entryId: number; payload: KomunitasFinanceUpdate }) => run(() => api.updateFinanceEntry(entryId, payload)) });
  const removeFinance = useMutation({ ...config, mutationFn: (entryId: number) => run(() => api.deleteFinanceEntry(entryId)) });
  return { save, moderate, review, remove, addManager, removeManager, createFinance, updateFinance, removeFinance };
}
