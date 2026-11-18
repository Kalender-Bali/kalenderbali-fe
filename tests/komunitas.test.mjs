import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

// Adapter simulasi hanya hidup di proses tes; aplikasi tetap mengambil seluruh data dari API Go.
const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
const server = await createServer({ configFile: false, cacheDir: `/tmp/komunitas-tests-${process.pid}`, optimizeDeps: { noDiscovery: true, include: [] }, resolve: { alias: { '@': `${process.cwd()}/src` } }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
const api = await server.ssrLoadModule('/src/features/komunitas/api/komunitasApi.ts');
const utils = await server.ssrLoadModule('/src/features/komunitas/utils/komunitasUtils.ts');
const hooks = await server.ssrLoadModule('/src/features/komunitas/hooks/useKomunitas.ts');
const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');
const { useAuthStore } = await server.ssrLoadModule('/src/stores/useAuthStore.ts');
const kelola = await server.ssrLoadModule('/src/features/kelola-pura/api/kelolaPuraApi.ts');
const piodalan = await server.ssrLoadModule('/src/features/piodalan/api/piodalanApi.ts');
const { KomunitasCard } = await server.ssrLoadModule('/src/features/komunitas/components/KomunitasCard.tsx');
const { KomunitasList } = await server.ssrLoadModule('/src/features/komunitas/components/KomunitasList.tsx');
const { default: KomunitasPage } = await server.ssrLoadModule('/src/features/komunitas/pages/KomunitasPage.tsx');
const originalAdapter = apiClient.defaults.adapter;
afterEach(() => { apiClient.defaults.adapter = originalAdapter; useAuthStore.getState().logout(); });
after(async () => { await server.close(); delete globalThis.localStorage; });
const location = { address: 'Pura A', city: 'Denpasar', province: 'Bali', country: 'Indonesia' };
const summary = { id: 20, name: 'Suka Duka B', type: 'Suka Duka', location };
const profile = { id: 20, name: 'Suka Duka B', type: 'Suka Duka', status: 'Review', ...location, manager: [{ user_id: 7, name: 'Pengelola', email: 'manager@example.test' }] };
const filters = { search: '', country: '', province: '', city: '' };
const payload = { name: ' Komunitas B ', type: 'Suka Duka', phone: '081234', address: 'Pura A', country_id: 1, province_id: 2, city_id: 3, location_url: 'https://maps.example.test/b' };
const entry = { id: 100, pura_id: 20, category_id: 1, category_name: 'Iuran', transaction_date: '2026-11-18', entry_type: 'debit', amount: 2000, note: 'Iuran bulan ini' };
function respond(body, inspect = () => {}) {
  apiClient.defaults.adapter = async config => { inspect(config); return { config, data: body, status: 200, statusText: 'OK', headers: {} }; };
}
function login(id = '7', role = 'Member') { useAuthStore.getState().login({ id, name: id, email: `${id}@example.test`, role }, `token-${id}`); }
function probeMutations(client, id = 20) {
  let result;
  function Probe() { result = hooks.useKomunitasMutations(id); return null; }
  renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(Probe)));
  return result;
}
function client() { return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false, gcTime: 0 } } }); }

test('direktori publik mengirim scope, filter, dan cursor server tanpa membutuhkan total global', async () => {
  let request;
  respond({ data: [summary], pagination: { limit: 20, has_more: true, next_cursor: 'MjA' } }, config => { request = config; });
  const result = await api.fetchCommunities('semua', { ...filters, search: 'Dharma', country: 'Indonesia' }, 'MTA');
  assert.equal(request.url, '/puras');
  assert.deepEqual(request.params, { view: 'summary', scope: 'community', limit: 20, cursor: 'MTA', search: 'Dharma', country: 'Indonesia' });
  assert.equal(result.pagination.next_cursor, 'MjA'); assert.equal(result.data[0].location.city, 'Denpasar');
});
test('setiap tab memakai endpoint dan status sesuai konteks privat', async () => {
  for (const [tab, path] of [['saya', '/puras/my'], ['pengajuan', '/puras/unpublished']]) {
    respond({ data: [{ ...summary, status: 'Review' }], pagination: { limit: 20, has_more: false, next_cursor: null } }, config => assert.equal(config.url, path));
    assert.equal((await api.fetchCommunities(tab, filters)).data[0].status, 'Review');
  }
});
test('payload pagination rusak atau profil pura dalam scope community ditolak', async () => {
  for (const body of [
    { data: [], pagination: {} },
    { data: [], pagination: { limit: 20, has_more: true, next_cursor: null } },
    { data: [{ ...summary, type: 'Kawitan' }], pagination: { limit: 20, has_more: false, next_cursor: null } },
  ]) { respond(body); await assert.rejects(api.fetchCommunities('semua', filters)); }
});
test('status privat wajib tetapi status publik boleh dihilangkan', () => {
  assert.equal(api.parseCommunitySummary(summary).status, undefined);
  assert.throws(() => api.parseCommunitySummary(summary, true));
});
test('detail menerima field opsional yang dihilangkan dan membaca manager, bukan managers', () => {
  const parsed = api.parseCommunityDetail(profile);
  assert.equal(parsed.manager[0].user_id, 7); assert.equal(parsed.phone, ''); assert.equal(parsed.latitude, undefined);
  assert.deepEqual(api.parseCommunityDetail({ ...profile, manager: undefined }).manager, []);
  assert.throws(() => api.parseCommunityDetail({ ...profile, type: 'Kawitan' }), /bukan komunitas/);
});
test('hak pengelola berasal dari mapping ID profil, terpisah dari Premium dan role Member', () => {
  const parsed = api.parseCommunityDetail(profile);
  for (const role of ['Member', 'Guest']) assert.equal(utils.canManageCommunity({ id: '7', role }, parsed), true);
  assert.equal(utils.canManageCommunity({ id: '8', role: 'Member', isPremium: true }, parsed), false);
  assert.equal(utils.canManageCommunity({ id: '9', role: 'Admin' }, parsed), true);
  assert.equal(utils.canManageCommunity(null, parsed), false);
  assert.equal(utils.canManageCommunity({ id: '7', role: 'Member' }, { ...parsed, manager: [] }), false);
  assert.equal(utils.canRegister({ role: 'Guest' }), false); assert.equal(utils.canRegister({ role: 'Member' }), true);
});
test('payload form mengunci Suka Duka serta membuang status, odalan, dan pengelola', () => {
  const result = api.communityPayload({ ...payload, type: 'Kawitan', status: 'Published', benchmark: 'Pawukon', manager: [{ user_id: 9 }] });
  assert.equal(result.type, 'Suka Duka'); assert.equal(result.name, 'Komunitas B');
  for (const key of ['status', 'benchmark', 'manager']) assert.equal(result[key], undefined);
  assert.equal(result.location_url, payload.location_url); assert.equal(result.map_url, undefined);
});
test('URL berbahaya, koordinat salah, dan ID tidak utuh tidak dapat dikirim', () => {
  for (const patch of [{ location_url: 'javascript:alert(1)' }, { latitude: 91 }, { longitude: NaN }, { country_id: -1 }, { country_id: 1.5 }]) assert.throws(() => api.communityPayload({ ...payload, ...patch }));
  assert.equal(utils.safeHttpUrl('data:text/html,hello'), undefined);
  assert.equal(utils.positiveId(true), undefined); assert.equal(utils.positiveId('9007199254740993'), undefined);
});
test('simpan baru memakai POST dan edit memakai PUT dengan payload whitelist', async () => {
  const calls = []; respond({ data: profile }, config => calls.push(config));
  await api.saveCommunity(payload); await api.saveCommunity(payload, 20);
  assert.equal(calls[0].method, 'post'); assert.equal(calls[0].url, '/puras');
  assert.equal(calls[1].method, 'put'); assert.equal(calls[1].url, '/puras/20');
  assert.equal(JSON.parse(calls[0].data).location_url, payload.location_url);
});
test('katalog wilayah mengikuti tab dan mempertahankan negara tanpa provinsi', async () => {
  for (const [tab, path] of [['semua', '/puras/regions'], ['saya', '/puras/my/regions'], ['pengajuan', '/puras/unpublished/regions']]) {
    respond({ data: { countries: [{ name: 'Australia', provinces: [] }] } }, config => { assert.equal(config.url, path); assert.equal(config.params.scope, 'community'); });
    assert.deepEqual((await api.fetchCommunityRegions(tab)).countries[0].provinces, []);
  }
});
test('master geo memakai parent ID sedangkan katalog anggota hanya memakai endpoint Admin', async () => {
  const calls = []; respond({ data: [{ id: 1, code: 'ID', name: 'Indonesia' }] }, config => calls.push(config));
  await api.fetchGeoOptions('countries'); await api.fetchGeoOptions('provinces', 1); await api.fetchGeoOptions('cities', 2);
  assert.deepEqual(calls.map(config => config.url), ['/geo/countries', '/geo/countries/1/provinces', '/geo/provinces/2/cities']);
  respond({ data: [{ id: 7, name: 'Member', email: 'a@example.test' }] }, config => assert.equal(config.url, '/admin/members'));
  assert.equal((await api.fetchCommunityMembers())[0].id, 7);
});
test('kas dua profil di tempat sama tetap memakai ID yang berbeda; baris salah pemilik ditolak', async () => {
  for (const id of [10, 20]) {
    respond({ data: [{ ...entry, pura_id: id }] }, config => assert.equal(config.url, `/puras/${id}/finance`));
    assert.equal((await api.fetchPuraFinance(id))[0].pura_id, id);
  }
  respond({ data: [{ ...entry, pura_id: 10 }] });
  await assert.rejects(api.fetchPuraFinance(20), /profil lain/);
});
test('summary kas mengikuti filter year/category dan tidak membutuhkan entries', async () => {
  const expected = { total_debit: 2000, total_kredit: 500, saldo: 1500, debit_per_category: [], kredit_per_category: [] };
  respond({ data: expected }, config => assert.deepEqual(config.params, { year: '2026', category_id: 1 }));
  assert.deepEqual(await api.fetchPuraFinanceSummary(20, '2026', 1), expected);
});
test('respons simpan kas rusak atau ID berbeda tidak memberi sukses palsu', async () => {
  respond({ message: 'Created' });
  await assert.rejects(api.createFinanceEntry(20, entry));
  respond({ data: { ...entry, pura_id: 10 } });
  await assert.rejects(api.createFinanceEntry(20, entry), /profil lain/);
  respond({ data: { ...entry, id: 101 } });
  await assert.rejects(api.updateFinanceEntry(100, { amount: 2000 }), /ID transaksi/);
});
test('kesalahan HTTP tidak dianggap komunitas kosong, kandidat kosong, atau kas nol', async () => {
  for (const status of [401, 403, 503]) {
    apiClient.defaults.adapter = async config => { throw Object.assign(new Error('Gagal'), { config, response: { status, data: { message: 'Akses gagal' } } }); };
    for (const read of [() => api.fetchCommunities('semua', filters), () => api.fetchCommunity(20), () => api.fetchCommunityRegions('semua'), () => api.fetchCommunityMembers(), () => api.fetchPuraFinanceSummary(20)]) await assert.rejects(read());
  }
});
test('Kelola Pura dan Piodalan mengecualikan Suka Duka sebelum menyimpan daftar bersama', async () => {
  respond({ data: [{ id: 10, name: 'Pura A', type: 'Kawitan' }, { id: 20, name: 'Suka Duka B', type: ' Suka Duka ' }] });
  assert.deepEqual((await kelola.fetchPuraList()).map(item => item.id), [10]);
  assert.deepEqual((await piodalan.fetchPuraList()).map(item => item.id), [10]);
  respond({ data: profile });
  await assert.rejects(kelola.fetchPuraDetail(20), /menu Komunitas/); await assert.rejects(piodalan.fetchPuraDetail(20), /menu Komunitas/);
});
test('mutation transaksi mengunci ID path dan body serta invalidasi hanya buku terpilih', async () => {
  login(); const queryClient = client();
  const own = ['pura', 'finance', 'entries', '20'], other = ['pura', 'finance', 'entries', '10'];
  queryClient.setQueryData(own, []); queryClient.setQueryData(other, []);
  respond({ data: entry }, config => { assert.equal(config.url, '/puras/20/finance'); assert.equal(JSON.parse(config.data).pura_id, 20); });
  await probeMutations(queryClient).createFinance.mutateAsync({ ...entry, pura_id: 10 });
  assert.equal(queryClient.getQueryState(own).isInvalidated, true); assert.equal(queryClient.getQueryState(other).isInvalidated, false);
  queryClient.clear();
});
test('mutation gagal tidak diulang otomatis dan tidak menghapus transaksi cache', async () => {
  login(); const queryClient = client(), key = ['pura', 'finance', 'entries', '20']; queryClient.setQueryData(key, [entry]);
  let count = 0;
  apiClient.defaults.adapter = async config => { count++; throw Object.assign(new Error('Ditolak'), { config, response: { status: 403, data: { message: 'Hak dicabut' } } }); };
  await assert.rejects(probeMutations(queryClient).removeFinance.mutateAsync(100), /Hak dicabut/);
  assert.equal(count, 1); assert.equal(queryClient.getQueryData(key).length, 1); queryClient.clear();
});
test('respons mutation dari akun lama tidak diterapkan setelah pergantian sesi', async () => {
  login(); let finish, started;
  const ready = new Promise(resolve => { started = resolve; });
  const queryClient = client();
  apiClient.defaults.adapter = config => new Promise(resolve => { finish = () => resolve({ config, data: { data: profile }, status: 200, statusText: 'OK', headers: {} }); started(); });
  const operation = probeMutations(queryClient, undefined).save.mutateAsync(payload);
  await ready; login('8'); finish();
  await assert.rejects(operation, /Sesi berubah/); queryClient.clear();
});
test('hari dan tahun default menggunakan WITA walaupun tanggal UTC masih sebelumnya', () => {
  assert.equal(utils.todayWita(new Date('2026-12-31T18:00:00Z')), '2027-01-01');
  assert.match(utils.financeDate('2026-11-18'), /18 Nov 2026/);
});
test('SSR direktori publik dan tab privat tamu dirender tanpa meminta login seluruh route', () => {
  for (const [path, expected] of [['/komunitas', /Komunitas Suka Duka/], ['/komunitas?tab=saya', /Masuk untuk melihat komunitas Anda/], ['/komunitas?tab=pengajuan', /Masuk untuk melihat komunitas Anda/]]) {
    const queryClient = client();
    const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client: queryClient }, React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(KomunitasPage))));
    assert.match(html, expected); assert.doesNotMatch(html, /Tutup Buku|Total Gabungan/); queryClient.clear();
  }
});
test('kartu dan empty state menampilkan sumber asli serta tidak mengarang profil', () => {
  const html = renderToStaticMarkup(React.createElement(KomunitasCard, { item: summary, onOpen() {} }));
  assert.match(html, /Suka Duka B/); assert.match(html, /Lihat Profil/); assert.match(html, /Buku Kas/);
  const empty = renderToStaticMarkup(React.createElement(KomunitasList, { items: [], loading: false, more: false, loadingMore: false, onMore() {}, onOpen() {}, onRegister() {}, filtered: false }));
  assert.match(empty, /Belum ada komunitas/); assert.doesNotMatch(empty, /Suka Duka B/);
});
