import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false, resolve: { alias: { '@': `${process.cwd()}/src` } },
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, ws: false }, appType: 'custom',
});
after(() => server.close());
const { DewasaActivityDetails, DewasaActivityPanel } = await server.ssrLoadModule('/src/features/ala-ayuning-dewasa/components/DewasaActivityPanel.tsx');
const { DashboardDewasaAyu } = await server.ssrLoadModule('/src/features/dashboard/components/DashboardDewasaAyu.tsx');
const { buildDashboardDewasaAyu } = await server.ssrLoadModule('/src/features/dashboard/utils/dashboardUtils.ts');
const { AlaAyuningSummaryCard } = await server.ssrLoadModule('/src/features/ala-ayuning-dewasa/components/AlaAyuningSummaryCard.tsx');
const { buildPracticalSummary } = await server.ssrLoadModule('/src/features/ala-ayuning-dewasa/utils/practicalSummary.ts');
const { default: AlaAyuningDewasaPage } = await server.ssrLoadModule('/src/features/ala-ayuning-dewasa/pages/AlaAyuningDewasaPage.tsx');
const { fetchDewasaAyuSummary, fetchDewasaAyuToday } = await server.ssrLoadModule('/src/features/ala-ayuning-dewasa/api/alaAyuningApi.ts');
const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');

const description = 'Baik untuk menanam tebu, mentimun. Tidak baik untuk upacara atau yadnya, mengadakan pertemuan (rapat), berenggama.';
const reason = { calendar_value_id: '39', name: 'Dadig Krana', description, recommendation: 'avoid' };
const activity = { activity_id: '2', activity_name: 'Dewa Yadnya', status: 'conflict', matched_avoid: [reason], matched_recommended: [{ calendar_value_id: '3', name: 'Amerta Akasa', description: 'Baik untuk Dewa Yadnya.', recommendation: 'recommended' }] };
const meditation = { activity_id: '17', activity_name: 'Tapa, Brata, Yoga, Semadi, Penyucian Diri', status: 'eligible', matched_avoid: [], matched_recommended: [{ calendar_value_id: '7', name: 'Amerta Danta', recommendation: 'recommended' }] };

test('pantangan Dadig Krana tetap utuh dan didahulukan ketika juga ada anjuran', () => {
  const html = renderToStaticMarkup(React.createElement(DewasaActivityDetails, { activity }));
  assert.match(html, /Ada pantangan untuk kegiatan ini/);
  assert.ok(html.includes(description));
  assert.ok(html.indexOf('Dadig Krana') < html.indexOf('Amerta Akasa'));
  assert.match(html, /tidak membatalkan pantangan/);
  assert.doesNotMatch(html, /truncate|line-clamp|baik untuk berbagai upacara/);
});

test('rincian membedakan anjuran kegiatan dan belum ada anjuran', () => {
  for (const [status, recommended, expected] of [
    ['eligible', activity.matched_recommended, 'Ada anjuran untuk kegiatan ini'],
    ['no_match', [], 'Belum ada anjuran yang cocok'],
  ]) {
    const html = renderToStaticMarkup(React.createElement(DewasaActivityDetails, { activity: { ...activity, status, matched_avoid: [], matched_recommended: recommended } }));
    assert.ok(html.includes(expected));
    assert.doesNotMatch(html, /Ada pantangan untuk kegiatan ini|baik untuk berbagai upacara/);
  }
});

test('panel kegiatan tetap meminta pilihan sebelum menampilkan anjuran', () => {
  const panel = renderToStaticMarkup(React.createElement(DewasaActivityPanel, { activities: [activity], id: 'preview-activity' }));
  assert.match(panel, /Pilih kegiatan/);
  assert.match(panel, /Dewa Yadnya/);
  assert.doesNotMatch(panel, /Ada anjuran untuk kegiatan ini/);
});

test('dashboard langsung menampilkan tanggal WITA dan padewasan hari ini tanpa pemilih kegiatan', () => {
  const items = [
    { id: '39', nama: 'Dadig Krana', keterangan: description },
    { id: '3', nama: 'Amerta Akasa', keterangan: 'Baik untuk Dewa Yadnya.' },
    { id: '4', nama: 'Padewasan ketiga', keterangan: 'Keterangan ketiga.' },
    { id: '5', nama: 'Padewasan keempat', keterangan: 'Keterangan keempat.' },
  ];
  const data = buildDashboardDewasaAyu({
    tanggal: '2026-11-15', total: 10, items,
    status_label: 'PER KEGIATAN', headline: 'Pilih kegiatan dan periksa rinciannya.',
    activity_guidance: [activity],
  }, '2026-11-15');
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(DashboardDewasaAyu, { data })));
  assert.match(html, /DEWASA AYU HARI INI/);
  assert.match(html, /dateTime="2026-11-15"/);
  assert.match(html, /15 November 2026/);
  assert.match(html, /10 padewasan aktif hari ini/);
  assert.match(html, /Dadig Krana/);
  assert.ok(html.includes(description));
  assert.match(html, /Amerta Akasa/);
  assert.match(html, /Menampilkan 3 dari 10 padewasan/);
  assert.match(html, /href="\/ala-ayuning-dewasa\?mode=date&amp;date=2026-11-15"/);
  assert.doesNotMatch(html, /PER KEGIATAN|Pilih kegiatan|<select|Padewasan keempat|>BAIK<|baik untuk berbagai upacara|line-clamp/);
});

test('dashboard membedakan hari tanpa padewasan dan ringkasan yang belum tersedia', () => {
  const empty = buildDashboardDewasaAyu({ tanggal: '2026-11-15', total: 0, items: [] }, '2026-11-15');
  const unavailable = buildDashboardDewasaAyu(null, '2026-11-15');
  assert.equal(empty.headline, 'Tidak ada padewasan aktif yang tercatat hari ini.');
  assert.equal(unavailable.headline, 'Petunjuk padewasan hari ini belum tersedia.');
  for (const data of [empty, unavailable]) {
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(DashboardDewasaAyu, { data })));
    assert.match(html, /15 November 2026/);
    assert.doesNotMatch(html, /PER KEGIATAN|Pilih kegiatan|<select|>BAIK</);
  }
});

test('ringkasan menyimpulkan kegiatan yang dianjurkan dan ditunda tanpa pemilih kegiatan', () => {
  const padewasanList = [
    { id: '39', nama: 'Dadig Krana', keterangan: description, severity_code: '1' },
    { id: '3', nama: 'Amerta Akasa', keterangan: 'Baik untuk Dewa Yadnya.', severity_code: '2' },
    { id: '7', nama: 'Amerta Danta', keterangan: 'Baik untuk tapa, brata, yoga, semadi, dan penyucian diri.' },
    ...Array.from({ length: 9 }, (_, i) => ({ id: `harian-${i}`, nama: `Unsur harian ${i}`, severity_code: '4' })),
  ];
  const html = renderToStaticMarkup(React.createElement(AlaAyuningSummaryCard, {
    activeDate: '2026-11-12', pawukonInfo: null,
    formattedDate: '12 November 2026', padewasanList, onScrollToDasar() {},
    activityGuidance: [activity, meditation],
  }));
  assert.match(html, /12 UNSUR AKTIF/);
  assert.match(html, /Kesimpulan untuk tanggal ini/);
  assert.match(html, /Baik untuk<\/h4>/);
  assert.match(html, /tapa brata, yoga, semadi, dan penyucian diri/);
  assert.match(html, /Sebaiknya ditunda<\/h4>/);
  assert.match(html, /upacara Dewa Yadnya/);
  assert.match(html, /tidak membatalkan pantangan/);
  assert.doesNotMatch(html, /Hasil pada|terdiri dari|unsur utama|unsur harian/);
  assert.doesNotMatch(html, /Dadig Krana|Amerta Akasa|Unsur harian 0|lainnya|UNSUR BERPENGARUH UTAMA|UNSUR HARIAN/);
  assert.match(html, /Lihat rincian/);
  assert.doesNotMatch(html, /PER KEGIATAN|Pilih kegiatan|<select|>BAIK<|baik untuk berbagai upacara/);
});

test('ringkasan kosong tidak memberi penilaian hari baik atau tautan rincian kosong', () => {
  const html = renderToStaticMarkup(React.createElement(AlaAyuningSummaryCard, {
    activeDate: '2000-01-01', pawukonInfo: null,
    formattedDate: '1 Januari 2000', padewasanList: [], onScrollToDasar() {},
  }));
  assert.match(html, /0 UNSUR AKTIF/);
  assert.match(html, /Belum ada anjuran atau pantangan khusus yang tercatat/);
  assert.doesNotMatch(html, /PER KEGIATAN|Pilih kegiatan|<select|>BAIK<|Lihat rincian/);
});

test('halaman menyimpulkan seluruh hasil memakai aturan tanggal yang sama dan mempertahankan rincian', () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  client.setQueryData(['ala-ayuning', 'master'], []);
  client.setQueryData(['ala-ayuning', 'harian', '2000-01-01'], [
    { id: '39', nama: 'Dadig Krana', keterangan: description, severity_code: '1' },
    { id: '3', nama: 'Amerta Akasa', keterangan: 'Baik untuk Dewa Yadnya.', severity_code: '4' },
  ]);
  client.setQueryData(['ala-ayuning', 'pawukon', '2000-01-01'], {
    tanggal: '2000-01-01', hariBali: 'Sabtu · Saniscara', sasih: 'Kapitu',
    wuku: 'Sinta', pancawara: 'Umanis', saptawara: 'Saniscara', urip: 11,
  });
  client.setQueryData(['ala-ayuning', 'summary', '2000-01-01'], {
    tanggal: '2000-01-01', total: 2, items: [], activity_guidance: [activity],
  });
  try {
    const renderPage = (url) => renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
      React.createElement(MemoryRouter, { initialEntries: [url] }, React.createElement(AlaAyuningDewasaPage))));
    const html = renderPage('/ala-ayuning-dewasa?mode=date&date=2000-01-01');
    assert.match(html, /Kesimpulan untuk tanggal ini/);
    assert.match(html, /Sebaiknya ditunda<\/h4>/);
    assert.match(html, /upacara Dewa Yadnya/);
    assert.ok(html.indexOf('<time') < html.indexOf('Kesimpulan untuk tanggal ini'));
    assert.ok(html.indexOf('aria-label="Pawukon tanggal pilihan"') < html.indexOf('Kesimpulan untuk tanggal ini'));
    assert.match(html, /Dasar Ala Ayuning Dewasa/);
    assert.equal((html.match(/aria-label="Ringkasan padewasan dan pawukon"/g) ?? []).length, 1);
    assert.match(html, /aria-label="Pawukon tanggal pilihan"/);
    assert.match(html, /Kapitu/);
    assert.match(html, /dateTime="2000-01-01"[^>]*>1 Januari 2000<\/time>/);
    assert.equal((html.match(/1 Januari 2000/g) ?? []).length, 1);
    assert.match(html, /Sinta/);
    assert.match(html, /Umanis/);
    assert.match(html, /Urip \(Neptu\)/);
    assert.match(html, />11<\/dd>/);
    assert.match(html, /WITA/);
    assert.equal((html.match(/Dadig Krana/g) ?? []).length, 1);
    assert.ok(html.includes(description));
    assert.doesNotMatch(html, /PER KEGIATAN|Pilih kegiatan|Memuat data padewasan/);
    const initial = renderPage('/ala-ayuning-dewasa');
    assert.doesNotMatch(initial, /Ringkasan Padewasan|Dasar Ala Ayuning Dewasa/);
  } finally {
    client.clear();
  }
});

test('pantangan tidak masuk anjuran, termasuk kecocokan setelah tiga unsur pertama', () => {
  const summary = buildPracticalSummary([
    { id: '3' }, { id: '7' }, { id: '8' }, { id: '39' },
  ], [activity, meditation]);
  assert.match(summary.recommended, /tapa brata/);
  assert.doesNotMatch(summary.recommended, /Dewa Yadnya/);
  assert.match(summary.avoid, /Dewa Yadnya/);
  assert.match(summary.conflict, /tidak membatalkan pantangan/);
});

test('ringkasan tidak mengarang kegiatan dari nama unsur atau memakai alasan di luar hasil aktif', () => {
  const summary = buildPracticalSummary([{ id: '999', nama: 'Amerta Baik Untuk Segala Upacara' }], [activity, meditation]);
  assert.equal(summary.recommended, null);
  assert.equal(summary.avoid, null);
  assert.match(summary.overview, /Belum ada kesimpulan kegiatan/);
});

test('seluruh pantangan dipertahankan dan hasil tanpa pantangan tidak disebut aman untuk semua kegiatan', () => {
  const guidance = Array.from({ length: 8 }, (_, i) => ({
    ...activity, activity_id: String(i), activity_name: `Kegiatan ${i}`, matched_recommended: [],
  }));
  const summary = buildPracticalSummary([{ id: '39' }], guidance);
  for (let i = 0; i < 8; i++) assert.ok(summary.avoid.includes(`Kegiatan ${i}`));
  const recommended = buildPracticalSummary([{ id: '7' }], [meditation]);
  assert.match(recommended.recommended, /penyucian diri/);
  assert.equal(recommended.avoid, null);
  assert.doesNotMatch(recommended.overview, /aman|semua kegiatan|tidak ada pantangan/i);
});

test('ringkasan memakai tanggal yang diminta, versi cache baru, dan meneruskan kegagalan', async t => {
  const calls = [];
  const get = t.mock.method(apiClient, 'get', async (url, config) => {
    calls.push({ url, params: config.params });
    return { data: { data: { tanggal: '2000-01-01', activity_guidance: [activity] } } };
  });
  assert.equal((await fetchDewasaAyuSummary('2000-01-01')).tanggal, '2000-01-01');
  assert.equal(calls[0].params.date, '2000-01-01');
  assert.equal(calls[0].params.summary_version, 'activity-guidance-v2');
  await fetchDewasaAyuToday();
  assert.equal(calls[1].params.summary_version, 'activity-guidance-v2');
  get.mock.mockImplementation(async () => ({ data: { data: { tanggal: '2026-11-12' } } }));
  await assert.rejects(fetchDewasaAyuSummary('2000-01-01'), /tanggal yang dipilih/);
  get.mock.mockImplementation(async () => { throw new Error('Layanan gagal'); });
  await assert.rejects(fetchDewasaAyuSummary('2000-01-01'), /Layanan gagal/);
});
