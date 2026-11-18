import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false, cacheDir: `/tmp/calendar-reminder-test-${process.pid}`,
  resolve: { alias: { '@': `${process.cwd()}/src` } }, optimizeDeps: { noDiscovery: true, include: [] },
  ssr: { noExternal: ['react-dom'] },
  plugins: [{ name: 'calendar-reminder-portal', enforce: 'pre', resolveId(source) { if (source === 'react-dom') return '\0reminder-portal'; }, load(id) { if (id === '\0reminder-portal') return 'export const createPortal = node => node;'; } }],
  server: { middlewareMode: true, ws: false }, appType: 'custom',
});
const previousDocument = globalThis.document;
globalThis.document = { body: {} };
const { PengingatHariRayaCalendarDialog } = await server.ssrLoadModule('/src/features/pengingat/components/PengingatHariRayaCalendarDialog.tsx');
const { useAuthStore, authQueryScope } = await server.ssrLoadModule('/src/stores/useAuthStore.ts');
const initialAuth = { ...useAuthStore.getInitialState() };
const { hariRayaCandidates } = await server.ssrLoadModule('/src/features/pengingat/utils/pengingatSources.ts');
const { reminderCreatePayload } = await server.ssrLoadModule('/src/features/pengingat/api/pengingatApi.ts');
afterEach(() => { Object.assign(useAuthStore.getInitialState(), initialAuth); useAuthStore.setState(initialAuth); });
after(async () => { await server.close(); if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument; });

const holiday = { id: '9007199254740993', nama: 'Purnama', jenis: 'rerainan' };
const date = '2099-01-24';
const occurrence = tanggal => ({ tanggal, saptawara: 'Sukra', pancawara: 'Kliwon', wuku: 'Landep', sasih: { nama_sasih: 'Kapitu' } });
const [candidate] = hariRayaCandidates({ nama: holiday.nama, year: 2099 }, { hari_raya: holiday, kejadian: [occurrence(date)] }, '2099-01-01');
const free = { tier: 'Free', maxPerFeature: 1, canRepeat: false };
const premium = { tier: 'Premium', maxPerFeature: 10, canRepeat: true };

function render({ policy = free, entries = [], guest = false, source = candidate, error, background = false } = {}) {
  // Zustand uses the initial snapshot for SSR. Set both snapshots for each isolated render.
  const auth = { ...initialAuth, isAuthenticated: !guest, user: guest ? null : { id: 'fixture', role: 'Guest' }, token: guest ? null : 'fixture-only' };
  Object.assign(useAuthStore.getInitialState(), auth); useAuthStore.setState(auth);
  const scope = authQueryScope(auth);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false, refetchOnMount: false, gcTime: Infinity } } });
  client.setQueryData(['reminders', scope], entries);
  client.setQueryData(['reminder-policy', scope], policy);
  client.setQueryData(['pengingat-source', scope, 'calendar-holiday', holiday.nama, date], source);
  if (background) for (const query of client.getQueryCache().getAll()) query.setState({ fetchStatus: 'fetching' });
  if (error) client.getQueryCache().find({ queryKey: ['reminder-policy', scope] }).setState({ status: 'error', error: new Error('Paket gagal diperiksa'), fetchStatus: 'idle' });
  try {
    return renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(MemoryRouter, { initialEntries: [`/kalender?date=${date}`] }, React.createElement(PengingatHariRayaCalendarDialog, { holiday, date, onClose() {} }))));
  } finally { client.clear(); }
}

test('form kalender mengunci Hari Raya dan tanggal; Free hanya satu kejadian', () => {
  const html = render();
  assert.match(html, /Hari Raya pilihan/);
  assert.match(html, /Purnama/);
  assert.match(html, /dateTime="2099-01-24"/);
  assert.match(html, /Hanya jadwal yang dipilih/);
  assert.doesNotMatch(html, /Sebutan pribadi|Kriteria Sendiri|Cari jadwal|<select/);
  assert.doesNotMatch(html, /<button[^>]*disabled=""[^>]*>Simpan pengingat/);
  const payload = reminderCreatePayload({ ...candidate, repeat: false, alertDays: [1,0], note: '' });
  assert.equal(payload.kind, 'hari-raya');
  assert.equal(payload.nextDate, date);
  assert.deepEqual(payload.source, { feature: 'hari-raya', request: { nama: 'Purnama', year: 2099 } });
});

test('Premium mendapat pilihan perulangan pada sumber katalog', () => {
  const html = render({ policy: premium });
  assert.match(html, /Setiap perayaan berikutnya/);
  assert.match(html, /Perulangan berjalan selama Premium aktif/);
});

test('sinkronisasi berkala tidak mengganti form yang masih diisi dengan layar loading', () => {
  const html = render({ background: true });
  assert.match(html, /Hari Raya pilihan/);
  assert.match(html, /Catatan persiapan/);
  assert.match(html, /Simpan pengingat/);
  assert.doesNotMatch(html, /Memeriksa paket dan pengingat yang tersimpan|Memeriksa Hari Raya pada tanggal pilihan/);
});

test('Free penuh membuka alert Premium; Premium penuh menampilkan batas', () => {
  assert.match(render({ entries: [{ kind: 'hari-raya' }] }), /Tambah Lebih Banyak Pengingat/);
  assert.doesNotMatch(render({ entries: [{ kind: 'hari-raya' }] }), /Simpan pengingat/);
  const html = render({ policy: premium, entries: Array.from({ length: 10 }, () => ({ kind: 'hari-raya' })) });
  assert.match(html, /Batas Pengingat Tercapai/);
  assert.doesNotMatch(html, /Tingkatkan ke Premium|Simpan pengingat/);
  assert.match(render({ entries: [{ kind: 'piodalan' }] }), /Simpan pengingat/);
});

test('tamu diarahkan login dan kegagalan sumber atau paket tidak memberi form simpan', () => {
  const guest = render({ guest: true });
  assert.match(guest, /href="\/login"/);
  assert.doesNotMatch(guest, /<button[^>]*>Simpan pengingat<\/button>/);
  assert.match(render({ source: null }), /Jadwal Hari Raya tidak tersedia/);
  assert.doesNotMatch(render({ source: null }), /Simpan pengingat/);
  assert.match(render({ error: true }), /Paket gagal diperiksa/);
  assert.doesNotMatch(render({ error: true }), /Simpan pengingat/);
});
