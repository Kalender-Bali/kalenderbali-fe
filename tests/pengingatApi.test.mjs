import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';

const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
const server = await createServer({ configFile: false, cacheDir: `/tmp/kalender-pengingat-vite-${process.pid}`, optimizeDeps: { noDiscovery: true, include: [] }, resolve: { alias: { '@': `${process.cwd()}/src` } }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
after(async () => { await server.close(); delete globalThis.localStorage; });
const api = await server.ssrLoadModule('/src/features/pengingat/api/pengingatApi.ts');
const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');
const { useAuthStore, authQueryScope } = await server.ssrLoadModule('/src/stores/useAuthStore.ts');
const { usePengingatMutations } = await server.ssrLoadModule('/src/features/pengingat/hooks/usePengingat.ts');
const adapter = apiClient.defaults.adapter;
afterEach(() => { apiClient.defaults.adapter = adapter; useAuthStore.getState().logout(); });
const sample = { id: 'local-draft', kind: 'piodalan', title: 'Merajan', nextDate: '2026-11-20', repeat: false, alertDays: [1, 0], alertTime: '18:00', note: '', source: { feature: 'piodalan-pribadi', condition: { basis: 'tanggal', date: '2026-11-20' }, result: { tanggal: 'forged-client-result' } } };
const login = id => useAuthStore.getState().login({ id, name: id, email: `${id}@example.test`, role: 'Guest', isPremium: false }, `token-${id}`);
function mutations(client) {
  let result;
  function Probe() { result = usePengingatMutations(); return null; }
  renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(Probe)));
  return result;
}

test('payload pengingat tidak mengirim ID client, pemilik, atau hasil perhitungan client', () => {
  const payload = api.reminderCreatePayload({ ...sample, user_id: 'other-account', condition: { basis: 'hari-raya', name: 'forged' } });
  assert.equal(payload.id, undefined);
  assert.equal(payload.user_id, undefined);
  assert.equal(payload.condition, undefined);
  assert.equal(payload.source.result, undefined);
  assert.deepEqual(payload.source.condition, sample.source.condition);
  assert.throws(() => api.reminderCreatePayload({ ...sample, source: undefined }), /fitur sumber/);
});

test('kriteria pencarian tetap dikirim dalam bentuk asli termasuk ID string besar', () => {
  const request = { tipe_pencarian: 'elemen_kalender', tahun_target: 2027, saptawara_id: '9007199254740993', pancawara_id: '2', wuku_id: '3' };
  const payload = api.reminderCreatePayload({ ...sample, kind: 'otonan', source: { feature: 'otonan', request, normalized: {}, result: {} } });
  assert.deepEqual(payload.source, { feature: 'otonan', request });
});

test('Hari Raya kriteria sendiri mengirim patokan tanpa hasil client atau request katalog', () => {
  const payload = api.reminderCreatePayload({ ...sample, kind: 'hari-raya', source: { ...sample.source, feature: 'hari-raya-pribadi' } });
  assert.equal(payload.source.feature, 'hari-raya-pribadi');
  assert.deepEqual(payload.source.condition, sample.source.condition);
  assert.equal(payload.source.request, undefined);
  assert.equal(payload.source.result, undefined);
});

test('penyimpanan memakai ID dan jadwal kanonik dari backend', async () => {
  login('42');
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: 0 } } });
  apiClient.defaults.adapter = async config => ({ status: 201, statusText: 'Created', headers: {}, config, data: { data: { ...sample, id: '9007199254740993', title: 'Nama kanonik' } } });
  const { create } = mutations(client);
  const saved = await create.mutateAsync(sample);
  assert.equal(saved.id, '9007199254740993');
  assert.equal(client.getQueryData(['reminders', authQueryScope(useAuthStore.getState())])[0].title, 'Nama kanonik');
  client.clear();
});

test('respons simpan dari sesi lama tidak masuk ke cache akun berikutnya', async () => {
  login('42');
  const before = authQueryScope(useAuthStore.getState());
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: 0 } } });
  let finish, started;
  const ready = new Promise(resolve => { started = resolve; });
  apiClient.defaults.adapter = config => new Promise(resolve => { finish = () => resolve({ status: 201, statusText: 'Created', headers: {}, config, data: { data: { ...sample, id: '1' } } }); started(); });
  const { create } = mutations(client);
  const operation = create.mutateAsync(sample);
  await ready;
  login('43'); finish();
  await assert.rejects(operation, /Sesi berubah/);
  assert.equal(client.getQueryData(['reminders', before]), undefined);
  assert.equal(client.getQueryData(['reminders', authQueryScope(useAuthStore.getState())]), undefined);
  client.clear();
});

test('hapus gagal tidak menghilangkan pengingat dari cache', async () => {
  login('42');
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: 0 } } });
  const key = ['reminders', authQueryScope(useAuthStore.getState())];
  client.setQueryData(key, [{ ...sample, id: '1' }]);
  apiClient.defaults.adapter = async () => { throw Object.assign(new Error('Tidak terhubung'), { response: { status: 503, data: { error: { message: 'Tidak terhubung' } } } }); };
  const { remove } = mutations(client);
  await assert.rejects(remove.mutateAsync('1'), /Tidak terhubung/);
  assert.equal(client.getQueryData(key).length, 1);
  client.clear();
});

test('notifikasi membaca halaman backend dan menandai ID string tanpa pembulatan', async () => {
  const calls = [];
  apiClient.defaults.adapter = async config => { calls.push(config); return { status: 200, statusText: 'OK', headers: {}, config, data: { data: { items: [], total: 30, unread: 2 } } }; };
  const page = await api.fetchPengingatNotifications(2);
  await api.markPengingatNotificationRead('9007199254740993');
  assert.equal(page.total, 30);
  assert.equal(calls[0].params.page, 2);
  assert.equal(calls[1].url, '/reminder-notifications/9007199254740993/read');
});

test('batas paket berasal dari server dan payload tidak lengkap tidak dianggap Free atau Premium', async () => {
  for (const policy of [{ tier: 'Free', maxPerFeature: 1, canRepeat: false }, { tier: 'Premium', maxPerFeature: 10, canRepeat: true }]) {
    apiClient.defaults.adapter = async config => ({ status: 200, statusText: 'OK', headers: {}, config, data: { data: policy } });
    assert.deepEqual(await api.fetchPengingatPolicy(), policy);
  }
  for (const policy of [null, {}, { tier: 'Free', maxPerFeature: 10, canRepeat: true }]) {
    apiClient.defaults.adapter = async config => ({ status: 200, statusText: 'OK', headers: {}, config, data: { data: policy } });
    await assert.rejects(api.fetchPengingatPolicy(), /belum dapat diperiksa/);
  }
});

test('penolakan batas server mempertahankan daftar dan menyegarkan status paket', async () => {
  login('42');
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: 0 } } });
  const scope = authQueryScope(useAuthStore.getState());
  const key = ['reminders', scope];
  client.setQueryData(key, [{ ...sample, id: '1' }]);
  client.setQueryData(['reminder-policy', scope], { tier: 'Premium', maxPerFeature: 10, canRepeat: true });
  apiClient.defaults.adapter = async () => { throw Object.assign(new Error('Batas tercapai'), { response: { status: 409, data: { error: { code: 'reminder_limit_reached', message: 'Batas tercapai' } } } }); };
  await assert.rejects(mutations(client).create.mutateAsync(sample), /Batas tercapai/);
  assert.equal(client.getQueryData(key).length, 1);
  assert.equal(client.getQueryState(['reminder-policy', scope]).isInvalidated, true);
  client.clear();
});
