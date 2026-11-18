import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false, cacheDir: `/tmp/otonan-reminder-test-${process.pid}`,
  resolve: { alias: { '@': `${process.cwd()}/src` } }, optimizeDeps: { noDiscovery: true, include: [] },
  ssr: { noExternal: ['react-dom'] },
  plugins: [{ name: 'otonan-reminder-portal', enforce: 'pre', resolveId(source) { if (source === 'react-dom') return '\0otonan-reminder-portal'; }, load(id) { if (id === '\0otonan-reminder-portal') return 'export const createPortal = node => node;'; } }],
  server: { middlewareMode: true, ws: false }, appType: 'custom',
});
const previousDocument = globalThis.document;
globalThis.document = { body: {} };
const { PengingatOtonanResultDialog } = await server.ssrLoadModule('/src/features/pengingat/components/PengingatOtonanResultDialog.tsx');
const { useAuthStore, authQueryScope } = await server.ssrLoadModule('/src/stores/useAuthStore.ts');
const initialAuth = { ...useAuthStore.getInitialState() };
const { otonanCandidates } = await server.ssrLoadModule('/src/features/pengingat/utils/pengingatSources.ts');
const { reminderCreatePayload } = await server.ssrLoadModule('/src/features/pengingat/api/pengingatApi.ts');
afterEach(() => { Object.assign(useAuthStore.getInitialState(), initialAuth); useAuthStore.setState(initialAuth); });
after(async () => { await server.close(); if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument; });

const free = { tier: 'Free', maxPerFeature: 1, canRepeat: false };
const premium = { tier: 'Premium', maxPerFeature: 10, canRepeat: true };
const elements = { saptawara: 'Anggara', pancawara: 'Umanis', wuku: 'Uye' };
const request = { tipe_pencarian: 'tanggal_lahir', tanggal_lahir: '2000-01-01', sebelum_jam_6: true, tahun_target: 2099 };
const response = {
  input_dinormalisasi: { tipe_pencarian: 'tanggal_lahir', tanggal_lahir_sipil: '2000-01-01', tanggal_lahir_kalender: '1999-12-31', sebelum_jam_6: true, elemen: elements },
  hasil: ['2099-02-03', '2099-09-01'].map((tanggal, i) => ({ tanggal, perayaan_ke: 170 + i, detail_elemen: { ...elements, sasih: 'Kawulu' } })), penjelasan: '',
};
function render({ policy = free, entries = [], guest = false, date = '2099-09-01', input = request, result = response, error, background = false } = {}) {
  const auth = { ...initialAuth, isAuthenticated: !guest, user: guest ? null : { id: 'fixture', role: 'Guest' }, token: guest ? null : 'fixture-only' };
  Object.assign(useAuthStore.getInitialState(), auth); useAuthStore.setState(auth);
  const scope = authQueryScope(auth);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false, refetchOnMount: false, gcTime: Infinity } } });
  client.setQueryData(['reminders', scope], entries);
  client.setQueryData(['reminder-policy', scope], policy);
  if (background) for (const query of client.getQueryCache().getAll()) query.setState({ fetchStatus: 'fetching' });
  if (error) client.getQueryCache().find({ queryKey: ['reminder-policy', scope] }).setState({ status: 'error', error: new Error('Paket gagal diperiksa'), fetchStatus: 'idle' });
  try {
    return renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(MemoryRouter, { initialEntries: ['/otonan?type=tanggal_lahir'] }, React.createElement(PengingatOtonanResultDialog, { request: input, response: result, date, onClose() {} }))));
  } finally { client.clear(); }
}

test('hasil kedua mengisi tanggal dan dasar lahir tanpa meminta pencarian ulang', () => {
  const html = render();
  assert.match(html, /dateTime="2099-09-01"/);
  assert.doesNotMatch(html, /dateTime="2099-02-03"/);
  assert.match(html, /Nama anggota keluarga \/ catatan otonan/);
  assert.match(html, /required=""[^>]*maxLength="100"/);
  assert.match(html, /sebelum 06.00 WITA/);
  assert.match(html, /Anggara · Umanis · Uye/);
  assert.match(html, /Hanya jadwal yang dipilih/);
  assert.doesNotMatch(html, /Hitung jadwal Otonan|<input[^>]*type="date"|<select/);
  assert.doesNotMatch(html, /<button[^>]*disabled=""[^>]*>Simpan pengingat/);
  const selected = otonanCandidates(request, response, '2099-01-01').find(item => item.nextDate === '2099-09-01');
  const payload = reminderCreatePayload({ ...selected, title: 'Otonan Ibu', repeat: false, alertDays: [7,3,1,0], note: 'Persiapan' });
  assert.equal(payload.nextDate, '2099-09-01');
  assert.equal(payload.kind, 'otonan');
  assert.deepEqual(payload.source, { feature: 'otonan', request });
  assert.equal(payload.source.result, undefined);
});

test('mode wewaran mempertahankan ID asli dan tidak mengubahnya menjadi tanggal lahir', () => {
  const input = { tipe_pencarian: 'elemen_kalender', saptawara_id: '9007199254740993', pancawara_id: '22', wuku_id: '33', tahun_target: 2099 };
  const result = { ...response, input_dinormalisasi: { tipe_pencarian: 'elemen_kalender', sebelum_jam_6: false, elemen: elements } };
  const html = render({ input, result });
  assert.match(html, /Anggara Umanis · Uye/);
  assert.doesNotMatch(html, /Lahir |06.00 WITA/);
  const selected = otonanCandidates(input, result, '2099-01-01')[1];
  assert.deepEqual(reminderCreatePayload({ ...selected, title: 'Otonan', repeat: false, alertDays: [0] }).source.request, input);
});

test('Premium dapat mengatur perulangan 210 hari; Free penuh membuka alert Premium', () => {
  assert.match(render({ policy: premium }), /Setiap siklus 210 hari/);
  assert.match(render({ policy: premium }), /Perulangan berjalan selama Premium aktif/);
  const full = render({ entries: [{ kind: 'otonan' }] });
  assert.match(full, /Tambah Lebih Banyak Pengingat/);
  assert.doesNotMatch(full, /Simpan pengingat/);
  assert.match(render({ entries: [{ kind: 'hari-raya' }] }), /Simpan pengingat/);
  const premiumFull = render({ policy: premium, entries: Array.from({ length: 10 }, () => ({ kind: 'otonan' })) });
  assert.match(premiumFull, /Batas Pengingat Tercapai/);
  assert.doesNotMatch(premiumFull, /Tingkatkan ke Premium|Simpan pengingat/);
});

test('tamu, tanggal lampau, tanggal di luar hasil, dan paket gagal tidak bisa menyimpan', () => {
  const guest = render({ guest: true });
  assert.match(guest, /href="\/login"/);
  assert.doesNotMatch(guest, /<button[^>]*>Simpan pengingat<\/button>/);
  for (const [settings, message] of [
    [{ date: '2000-01-01' }, /Tanggal sudah terlewat/],
    [{ date: '2099-11-01' }, /Jadwal Otonan tidak tersedia/],
    [{ error: true }, /Paket gagal diperiksa/],
  ]) {
    const html = render(settings);
    assert.match(html, message);
    assert.doesNotMatch(html, /Simpan pengingat/);
  }
});

test('sinkronisasi berkala mempertahankan form pengaturan yang sedang diisi', () => {
  const html = render({ background: true });
  assert.match(html, /Catatan persiapan/);
  assert.match(html, /Simpan pengingat/);
  assert.doesNotMatch(html, /Memeriksa paket dan pengingat yang tersimpan/);
});
