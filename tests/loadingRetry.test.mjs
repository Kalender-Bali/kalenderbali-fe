import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import { QueryClient, QueryObserver, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const server = await createServer({ configFile: false, cacheDir: `/tmp/kalender-loading-retry-vite-${process.pid}`, resolve: { alias: { '@': `${process.cwd()}/src` } }, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
after(() => server.close());
const { shouldRetryRead, withReadRetry, READ_RETRY_DELAY } = await server.ssrLoadModule('/src/lib/readRetry.ts');
const { readQueryFeedback } = await server.ssrLoadModule('/src/lib/useReadQuery.ts');
const { queryClient } = await server.ssrLoadModule('/src/lib/queryClient.ts');
const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');
const { adminService } = await server.ssrLoadModule('/src/features/admin/services/adminService.ts');
const { default: GitaPage } = await server.ssrLoadModule('/src/features/bhagawad-gita/pages/BhagawadGitaPage.tsx');
const { useAuthStore, authQueryScope } = await server.ssrLoadModule('/src/stores/useAuthStore.ts');
const { DashboardDewasaAyu } = await server.ssrLoadModule('/src/features/dashboard/components/DashboardDewasaAyu.tsx');
const { default: CalendarPage } = await server.ssrLoadModule('/src/features/kalender/pages/CalendarPage.tsx');
const { useMengaturDewasaSearch } = await server.ssrLoadModule('/src/features/mengatur-dewasa/hooks/useMengaturDewasaQueries.ts');
const failure = status => Object.assign(new Error('Layanan sementara gagal'), { status });

test('satu kebijakan retry untuk query, sebab error terbungkus, dan pembatalan', () => {
  assert.equal(READ_RETRY_DELAY, 1000);
  assert.equal(queryClient.getDefaultOptions().queries.retry, shouldRetryRead);
  for (const status of [400, 401, 403, 404, 422, 429]) {
    assert.equal(shouldRetryRead(0, failure(status)), false);
    assert.equal(shouldRetryRead(0, new Error('Terbungkus', { cause: failure(status) })), false);
  }
  for (const error of [failure(500), failure(503), new Error('Network unavailable')]) {
    assert.equal(shouldRetryRead(0, error), true);
    assert.equal(shouldRetryRead(1, error), false);
  }
  assert.equal(shouldRetryRead(0, new DOMException('Dibatalkan', 'AbortError')), false);
  assert.equal(shouldRetryRead(0, Object.assign(new Error(), { code: 'ERR_CANCELED' })), false);
});

for (const succeeds of [true, false]) {
  test(`retry otomatis: loading tetap aktif hingga percobaan kedua ${succeeds ? 'berhasil' : 'gagal'}`, async () => {
    const client = new QueryClient();
    let calls = 0, complete, started;
    const second = new Promise(resolve => { started = resolve; });
    const observer = new QueryObserver(client, { queryKey: ['retry', succeeds], retry: shouldRetryRead, retryDelay: 0, queryFn: async () => {
      calls++;
      if (calls === 1) throw failure(503);
      started();
      return new Promise((resolve, reject) => { complete = () => succeeds ? resolve(['data']) : reject(failure(503)); });
    } });
    const states = [];
    const unsubscribe = observer.subscribe(result => states.push(readQueryFeedback(result)));
    try {
      await second;
      assert.equal(calls, 2);
      assert.equal(states.at(-1).isLoading, true);
      assert.equal(states.at(-1).isError, false);
      assert.equal(states.at(-1).error, null);
      const finished = observer.refetch({ cancelRefetch: false });
      complete();
      await finished;
      const final = readQueryFeedback(observer.getCurrentResult());
      assert.equal(calls, 2);
      assert.equal(final.isLoading, false);
      assert.equal(final.isError, !succeeds);
      assert.equal(Boolean(final.error), !succeeds);
    } finally { unsubscribe(); client.clear(); }
  });
}

test('error lama disembunyikan selama refetch dengan cache berlangsung', () => {
  const result = { data: ['data lama'], isLoading: false, isFetching: true, isError: true, error: failure(503) };
  const view = readQueryFeedback(result);
  assert.equal(view.isLoading, true);
  assert.equal(view.error, null);
  assert.equal(view.isError, false);
  assert.deepEqual(view.data, ['data lama']);
  assert.equal(result.isError, true); // Feedback does not mutate the query result.
});

test('pembatalan saat jeda retry menghentikan percobaan berikutnya', async () => {
  const controller = new AbortController();
  let calls = 0;
  const pending = withReadRetry(async () => { calls++; throw failure(503); }, controller.signal);
  queueMicrotask(() => controller.abort());
  await assert.rejects(pending, error => error.name === 'AbortError');
  assert.equal(calls, 1);
});

test('admin mengulang pembacaan sekali; perubahan role tidak dikirim ulang', async t => {
  const adapter = apiClient.defaults.adapter;
  t.after(() => { apiClient.defaults.adapter = adapter; });
  let calls = 0;
  apiClient.defaults.adapter = async config => {
    calls++;
    if (calls % 2 === 1) throw Object.assign(new Error(), { config, response: { status: 503, data: { message: 'Layanan sementara gagal' } } });
    return { config, status: 200, headers: {}, data: { data: [] } };
  };
  for (const read of [() => adminService.getAllMembers(), () => adminService.getAllPurchases()]) {
    const before = calls;
    assert.deepEqual(await read(), []);
    assert.equal(calls - before, 2);
  }
  const before = calls;
  await assert.rejects(adminService.updateMemberRole('7', 'Member'));
  assert.equal(calls - before, 1);
});

test('perhitungan Mengatur Dewasa diulang sekali dan input lama tidak dikirim dengan akun baru', async t => {
  const adapter = apiClient.defaults.adapter;
  t.after(() => { apiClient.defaults.adapter = adapter; useAuthStore.getState().logout(); });
  for (const switchAccount of [false, true]) {
    useAuthStore.getState().login({ id: '7', role: 'Guest', isPremium: false }, 'token-seven', 'refresh-seven');
    const client = new QueryClient();
    let search;
    function Probe() { search = useMengaturDewasaSearch(); return null; }
    renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(Probe)));
    let calls = 0, requested;
    const started = new Promise(resolve => { requested = resolve; });
    apiClient.defaults.adapter = async config => {
      calls++;
      if (calls === 1) {
        requested();
        throw Object.assign(new Error(), { config, response: { status: 503, data: { message: 'Layanan sementara gagal' } } });
      }
      assert.equal(config.headers.Authorization, 'Bearer token-seven');
      return { config, status: 200, headers: {}, data: { data: { results: [] }, meta: { eligible_days: 0 } } };
    };
    try {
      const pending = search.mutateAsync({ mode: 'activity', activity_id: '1', tanggal_mulai: '2026-11-12', tanggal_selesai: '2026-11-12' });
      await started;
      if (switchAccount) {
        useAuthStore.getState().login({ id: '8', role: 'Guest', isPremium: false }, 'token-eight', 'refresh-eight');
        await assert.rejects(pending, error => error.name === 'AbortError');
        assert.equal(calls, 1);
      } else {
        assert.deepEqual((await pending).data.results, []);
        assert.equal(calls, 2);
      }
    } finally { client.clear(); }
  }
});

test('Gita memisahkan retry yang berjalan, error final, dan hasil kosong untuk kedua mode', () => {
  const scope = authQueryScope(useAuthStore.getInitialState());
  for (const mode of ['semantic', 'text']) {
    const client = new QueryClient({ defaultOptions: { queries: { retryOnMount: false } } });
    client.setQueryData(['bhagawadgita', 'chapters'], []);
    client.setQueryData(['bhagawadgita', 'topics'], []);
    const key = mode === 'semantic' ? ['bhagawadgita', 'search-semantic', 'karma', undefined, scope] : ['bhagawadgita', 'search-text', 'karma', scope];
    const query = client.getQueryCache().build(client, { queryKey: key });
    const render = () => renderToStaticMarkup(React.createElement(
      // Use the same external QueryClientProvider instance used by the actual page.
      QueryClientProvider, { client }, React.createElement(MemoryRouter, { initialEntries: [`/bhagawadgita?mode=${mode}&q=karma`] }, React.createElement(GitaPage))));
    try {
      query.setState({ status: 'error', error: failure(503), fetchStatus: 'fetching' });
      const loading = render();
      assert.match(loading, /aria-busy="true"/);
      assert.doesNotMatch(loading, /Gagal mencari sloka|Coba Lagi|Tidak ada sloka yang sesuai|Tidak ada bab yang cocok/);
      query.setState({ status: 'error', error: failure(503), fetchStatus: 'idle' });
      const error = render();
      assert.match(error, /Gagal mencari sloka/);
      assert.match(error, /Coba Lagi/);
      assert.doesNotMatch(error, /Tidak ada sloka yang sesuai|Tidak ada bab yang cocok/);
      client.setQueryData(key, mode === 'semantic' ? [] : { chapters: [], topics: [], verses: [] });
      const empty = render();
      assert.doesNotMatch(empty, /Gagal mencari sloka/);
      assert.match(empty, /Tidak ada sloka yang sesuai|Tidak ada bab yang cocok/);
    } finally { client.clear(); }
  }
});

test('dashboard Dewasa Ayu dan kalender tidak menampilkan data kosong ketika loading', () => {
  const client = new QueryClient();
  try {
    const dashboard = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(DashboardDewasaAyu, { isLoading: true, data: { items: [] } })));
    assert.match(dashboard, /aria-busy="true"/);
    assert.doesNotMatch(dashboard, /BELUM TERSEDIA|Coba Lagi/);
    const calendar = renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(MemoryRouter, { initialEntries: ['/kalender?date=2026-11-12'] }, React.createElement(CalendarPage))));
    assert.match(calendar, /aria-label="Memuat kalender\.\.\."/);
    assert.doesNotMatch(calendar, /Tidak ada agenda|0 Lokasi|Coba Lagi|Detail tanggal/);
  } finally { client.clear(); }
});
