import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false, cacheDir: `/tmp/piodalan-reminder-test-${process.pid}`,
  resolve: { alias: { '@': `${process.cwd()}/src` } }, optimizeDeps: { noDiscovery: true, include: [] },
  ssr: { noExternal: ['react-dom'] },
  plugins: [{ name: 'piodalan-reminder-portal', enforce: 'pre', resolveId(source) { if (source === 'react-dom') return '\0piodalan-reminder-portal'; }, load(id) { if (id === '\0piodalan-reminder-portal') return 'export const createPortal = node => node;'; } }],
  server: { middlewareMode: true, ws: false }, appType: 'custom',
});
const previousDocument = globalThis.document;
globalThis.document = { body: {} };
const { PengingatPiodalanResultDialog } = await server.ssrLoadModule('/src/features/pengingat/components/PengingatPiodalanResultDialog.tsx');
const { PiodalanResultList } = await server.ssrLoadModule('/src/features/piodalan/components/PiodalanResultList.tsx');
const { PiodalanDetailModal } = await server.ssrLoadModule('/src/features/piodalan/components/PiodalanDetailModal.tsx');
const { PiodalanPuraListModal } = await server.ssrLoadModule('/src/features/piodalan/components/PiodalanPuraListModal.tsx');
const { fetchPiodalanResultCandidate } = await server.ssrLoadModule('/src/features/pengingat/api/pengingatPiodalanSource.ts');
const { privateCalendarCandidates, piodalanCandidates } = await server.ssrLoadModule('/src/features/pengingat/utils/pengingatSources.ts');
const { reminderCreatePayload } = await server.ssrLoadModule('/src/features/pengingat/api/pengingatApi.ts');
const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');
const { useAuthStore, authQueryScope } = await server.ssrLoadModule('/src/stores/useAuthStore.ts');
const initialAuth = { ...useAuthStore.getInitialState() };
const adapter = apiClient.defaults.adapter;
afterEach(() => { apiClient.defaults.adapter = adapter; Object.assign(useAuthStore.getInitialState(), initialAuth); useAuthStore.setState(initialAuth); });
after(async () => { await server.close(); if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument; });

const free = { tier: 'Free', maxPerFeature: 1, canRepeat: false };
const premium = { tier: 'Premium', maxPerFeature: 10, canRepeat: true };
const date = '2099-04-02';
const group = { dateStr: date, formattedDate: '2 April 2099', dayName: 'Kamis', wewaran: 'Wraspati Wage Watugunung', totalPura: 2, puras: [{ id: 21, name: 'Pura Satu', city: 'Gianyar' }, { id: 22, name: 'Pura Dua', city: 'Badung' }] };
const profile = { id: 21, name: 'Pura Satu', type: 'Umum', status: 'published', benchmark: 'Pawukon', saptawara: 'Wraspati', pancawara: 'Wage', wuku: 'Watugunung' };
const day = (tanggal = date, id = '21') => ({ tanggal, wewaran: group.wewaran, sasih: 'Kadasa', total_pura: 1, puras: [{ id, nama: id === '21' ? 'Pura Satu' : 'Pura Dua', tipe: 'Umum' }] });
const [puraCandidate] = piodalanCandidates({ mode: 'pura', pura_id: '21', tahun: 2099 }, { schedules: [day()] }, profile, '2099-01-01');
const queryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false, refetchOnMount: false, gcTime: Infinity } } });

function render({ policy = free, entries = [], guest = false, selectedDate = date, error = false, background = false, lockedPuraId, source, sourceError = false } = {}) {
  const auth = { ...initialAuth, isAuthenticated: !guest, user: guest ? null : { id: 'fixture', role: 'Guest' }, token: guest ? null : 'fixture-only' };
  Object.assign(useAuthStore.getInitialState(), auth); useAuthStore.setState(auth);
  const scope = authQueryScope(auth);
  const client = queryClient();
  client.setQueryData(['reminders', scope], entries);
  client.setQueryData(['reminder-policy', scope], policy);
  const sourceKey = ['pengingat-source', scope, 'piodalan-result', selectedDate, lockedPuraId];
  if (source !== undefined || sourceError) client.setQueryData(sourceKey, source ?? null);
  if (sourceError) client.getQueryCache().find({ queryKey: sourceKey }).setState({ status: 'error', error: new Error('Jadwal pura gagal diperiksa'), fetchStatus: 'idle' });
  if (background) for (const query of client.getQueryCache().getAll()) query.setState({ fetchStatus: 'fetching' });
  if (error) client.getQueryCache().find({ queryKey: ['reminder-policy', scope] }).setState({ status: 'error', error: new Error('Paket gagal diperiksa'), fetchStatus: 'idle' });
  try {
    return renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(MemoryRouter, { initialEntries: ['/piodalan?tab=bulan'] }, React.createElement(PengingatPiodalanResultDialog, { group: { ...group, dateStr: selectedDate }, lockedPuraId, onClose() {} }))));
  } finally { client.clear(); }
}

function stubSource(pura = profile, schedules = [day()], failure = false) {
  const calls = [];
  apiClient.defaults.adapter = async config => {
    calls.push(config);
    if (failure) throw { response: { status: 503, data: { message: 'Jadwal belum dapat diperiksa' } }, config };
    const data = config.url.startsWith('/puras/') ? pura : { mode: 'pura', filter: {}, total_jadwal: schedules.length, schedules };
    return { config, status: 200, statusText: 'OK', headers: {}, data: { data } };
  };
  return calls;
}

test('tanggal terisi, nama pengingat dan pura opsional, tanpa pura langsung dapat disimpan', () => {
  const html = render();
  assert.match(html, /dateTime="2099-04-02"/);
  assert.match(html, /Nama pengingat \(opsional\)/);
  assert.match(html, /Pura \(opsional\)/);
  assert.match(html, /<option value="" selected="">Tanpa pura tertentu/);
  assert.match(html, /Pura Satu · Gianyar/);
  assert.match(html, /Pura Dua · Badung/);
  assert.doesNotMatch(html, /required=""|<input[^>]*type="date"/);
  assert.doesNotMatch(html, /<button[^>]*disabled=""[^>]*>Simpan pengingat/);
  const [candidate] = privateCalendarCandidates('piodalan', { basis: 'tanggal', date }, [date], '2099-01-01');
  const payload = reminderCreatePayload({ ...candidate, repeat: false, alertDays: [1, 0] });
  assert.equal(payload.kind, 'piodalan');
  assert.equal(payload.nextDate, date);
  assert.deepEqual(payload.source, { feature: 'piodalan-pribadi', condition: { basis: 'tanggal', date } });
});

test('tanggal tanpa pura tetap sekali kejadian untuk Free maupun Premium', () => {
  for (const policy of [free, premium]) {
    const html = render({ policy });
    assert.match(html, /Hanya jadwal yang dipilih/);
    assert.doesNotMatch(html, /<select[^>]*>.*Setiap piodalan berikutnya/);
    assert.match(html, /H-7/);
    assert.match(html, /H-3/);
    assert.match(html, /H-1/);
    assert.match(html, /Hari H/);
    assert.doesNotMatch(html, /type="time"/);
  }
});

test('kuota Piodalan dihitung bersama pengingat katalog dan kriteria sendiri', () => {
  for (const origin of ['fitur', 'pribadi']) {
    const html = render({ entries: [{ kind: 'piodalan', origin }] });
    assert.match(html, /Tambah Lebih Banyak Pengingat/);
    assert.doesNotMatch(html, /<button[^>]*>Simpan pengingat<\/button>/);
  }
  assert.match(render({ entries: [{ kind: 'otonan' }, { kind: 'hari-raya' }] }), /Simpan pengingat/);
  assert.match(render({ policy: premium, entries: Array.from({ length: 9 }, () => ({ kind: 'piodalan' })) }), /Simpan pengingat/);
  const full = render({ policy: premium, entries: Array.from({ length: 10 }, () => ({ kind: 'piodalan' })) });
  assert.match(full, /Batas Pengingat Tercapai/);
  assert.doesNotMatch(full, /Simpan pengingat|Tingkatkan ke Premium/);
});

test('tamu, tanggal lampau, dan pemeriksaan paket gagal tidak bisa menyimpan', () => {
  for (const [settings, message] of [[{ guest: true }, /href="\/login"/], [{ selectedDate: '2000-01-01' }, /Tanggal sudah terlewat/], [{ error: true }, /Paket gagal diperiksa/]]) {
    const html = render(settings);
    assert.match(html, message);
    assert.doesNotMatch(html, /<button[^>]*>Simpan pengingat<\/button>/);
  }
});

test('sinkronisasi berkala tidak mengganti form yang sedang diisi', () => {
  const html = render({ background: true });
  assert.match(html, /Pura \(opsional\)/);
  assert.match(html, /Catatan persiapan/);
  assert.doesNotMatch(html, /Memeriksa paket dan pengingat yang tersimpan/);
});

test('dari rincian pura, identitas dan tanggal terkunci tanpa opsi ganti atau nama pengganti', () => {
  for (const policy of [free, premium]) {
    const html = render({ policy, lockedPuraId: '21', source: puraCandidate });
    assert.match(html, /Pura pilihan/);
    assert.match(html, /Pura Satu/);
    assert.match(html, /dateTime="2099-04-02"/);
    assert.doesNotMatch(html, /Pura Dua|Tanpa pura tertentu|Pura \(opsional\)|Nama pengingat|type="date"/);
    assert.doesNotMatch(html, /<button[^>]*disabled=""[^>]*>Simpan pengingat/);
    if (policy.canRepeat) assert.match(html, /<option value="berulang" selected="">Setiap piodalan berikutnya/);
    else assert.doesNotMatch(html, /<select/);
    assert.match(html, /Catatan persiapan/);
  }
});

test('pura terkunci yang belum terverifikasi, gagal, atau hilang tidak beralih ke pengingat tanpa pura', () => {
  for (const [settings, message] of [
    [{}, /Memuat jadwal dari fitur/],
    [{ source: null }, /Jadwal pura pada tanggal ini sudah tidak tersedia/],
    [{ sourceError: true }, /Jadwal pura gagal diperiksa/],
  ]) {
    const html = render({ lockedPuraId: '21', ...settings });
    assert.match(html, message);
    assert.match(html, /<button[^>]*disabled=""[^>]*>Simpan pengingat/);
    assert.doesNotMatch(html, /Pilih pura lain|Tanpa pura tertentu|<select/);
  }
  for (const lockedPuraId of ['999', '']) {
    const html = render({ lockedPuraId });
    assert.match(html, /Pura tidak tersedia/);
    assert.doesNotMatch(html, /Simpan pengingat/);
  }
});

test('pura terkunci tetap mengikuti kuota dan mempertahankan form ketika sinkronisasi berkala', () => {
  assert.match(render({ lockedPuraId: '21', entries: [{ kind: 'piodalan' }] }), /Tambah Lebih Banyak Pengingat/);
  assert.match(render({ lockedPuraId: '21', policy: premium, entries: Array.from({ length: 10 }, () => ({ kind: 'piodalan' })) }), /Batas Pengingat Tercapai/);
  const html = render({ lockedPuraId: '21', source: puraCandidate, policy: premium, background: true });
  assert.match(html, /Pura pilihan/);
  assert.match(html, /Setiap piodalan berikutnya/);
  assert.doesNotMatch(html, /Memeriksa paket dan pengingat yang tersimpan|Memuat jadwal dari fitur/);
});

test('tombol rincian susunan acara berlaku untuk pura yang sedang dibuka dan tanggalnya', () => {
  for (const [initialSelectedPuraId, selectedDate] of [[21, date], [22, date], [21, '2000-01-01'], [null, date]]) {
    const client = queryClient();
    try {
      const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(PiodalanPuraListModal, { isOpen: true, dayGroup: { ...group, dateStr: selectedDate }, initialSelectedPuraId, onClose() {}, onAddReminder() {} })));
      if (!initialSelectedPuraId) { assert.doesNotMatch(html, /Tambah pengingat/); continue; }
      assert.match(html, /Tambah pengingat/);
      const button = html.match(/<button[^>]*title="(?:Tanggal ini sudah terlewat|Atur pengingat Pura (?:Satu|Dua) pada 2 April 2099)"[^>]*>/)?.[0];
      assert.ok(button);
      assert.equal(button.includes('disabled=""'), selectedDate < date);
      if (selectedDate === date) assert.ok(button.includes(initialSelectedPuraId === 21 ? 'Pura Satu' : 'Pura Dua'));
    } finally { client.clear(); }
  }
});

test('pilihan pura diverifikasi ulang dan mempertahankan tanggal hasil yang diklik', async () => {
  const calls = stubSource(profile, [day('2099-01-01'), day(date, '22'), day()]);
  const candidate = await fetchPiodalanResultCandidate(group, '21', '2099-01-01');
  assert.equal(candidate.nextDate, date);
  assert.equal(candidate.title, 'Pura Satu');
  assert.deepEqual(candidate.condition, { basis: 'pawukon', saptawara: 'Wraspati', pancawara: 'Wage', wuku: 'Watugunung' });
  assert.equal(candidate.repeatLabel, 'Setiap piodalan berikutnya');
  assert.ok(calls.some(call => call.url === '/puras/21'));
  const params = calls.find(call => call.url === '/search/piodalan').params;
  assert.deepEqual({ mode: params.mode, pura_id: params.pura_id, tahun: params.tahun }, { mode: 'pura', pura_id: '21', tahun: 2099 });
  const payload = reminderCreatePayload({ ...candidate, repeat: true, alertDays: [7, 3, 1, 0] });
  assert.deepEqual(payload.source, { feature: 'piodalan', request: { mode: 'pura', pura_id: '21', tahun: 2099 } });
  assert.equal(payload.nextDate, date);
});

test('dasar Sasih untuk perulangan berasal dari profil pura aktual', async () => {
  stubSource({ ...profile, benchmark: 'Sasih', sasih: 'Kadasa', purnama_tilem: 'Purnama' });
  const candidate = await fetchPiodalanResultCandidate(group, '21', '2099-01-01');
  assert.deepEqual(candidate.condition, { basis: 'sasih', sasih: 'Kadasa', phase: 'Purnama' });
  assert.equal(candidate.repeatLabel, 'Setiap piodalan berikutnya');
});

test('pura di luar hasil dan tanggal lampau ditolak tanpa request', async () => {
  const calls = stubSource();
  assert.equal(await fetchPiodalanResultCandidate(group, '999', '2099-01-01'), null);
  assert.equal(await fetchPiodalanResultCandidate(group, '', '2099-01-01'), null);
  assert.equal(await fetchPiodalanResultCandidate(group, '21', '2100-01-01'), null);
  assert.equal(calls.length, 0);
});

test('perubahan jadwal, ketidakcocokan pura, dan gangguan API tidak diganti tanggal lain', async () => {
  for (const [pura, schedules] of [[profile, [day('2099-04-03')]], [profile, [day(date, '22')]], [{ ...profile, id: 22 }, [day()]]]) {
    stubSource(pura, schedules);
    assert.equal(await fetchPiodalanResultCandidate(group, '21', '2099-01-01'), null);
  }
  stubSource(profile, [day()], true);
  await assert.rejects(fetchPiodalanResultCandidate(group, '21', '2099-01-01'), /Jadwal belum dapat diperiksa/);
});

test('kartu hasil hanya menyediakan List Pura dan Detail Tanggal; pengingat tersedia di detail', () => {
  const past = { ...group, dateStr: '2000-01-01', formattedDate: '1 Januari 2000' };
  const html = renderToStaticMarkup(React.createElement(PiodalanResultList, { dayGroups: [group, past], totalCount: 4, onOpenPuraList() {}, onOpenDayWariga() {} }));
  assert.match(html, /List Pura/);
  assert.match(html, /Detail Tanggal/);
  assert.doesNotMatch(html, /Tambah pengingat/);
  for (const schedule of [group, past]) {
    const client = queryClient();
    try {
      const detail = renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(PiodalanDetailModal, { isOpen: true, schedule, onClose() {}, onAddReminder() {} })));
      assert.match(detail, /Tambah pengingat/);
      assert.match(detail, /Tutup/);
      const button = detail.match(/<button[^>]*title="(?:Tanggal ini sudah terlewat|Atur pengingat untuk tanggal ini; pilihan pura opsional)"[^>]*>/)?.[0];
      assert.ok(button);
      assert.equal(button.includes('disabled=""'), schedule === past);
    } finally { client.clear(); }
  }
});
