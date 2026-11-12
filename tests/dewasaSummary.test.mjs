import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false, resolve: { alias: { '@': `${process.cwd()}/src` } },
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, ws: false }, appType: 'custom',
});
after(() => server.close());
const { DewasaActivityDetails, DewasaActivityPanel } = await server.ssrLoadModule('/src/features/ala-ayuning-dewasa/components/DewasaActivityPanel.tsx');
const { DashboardDewasaAyu } = await server.ssrLoadModule('/src/features/dashboard/components/DashboardDewasaAyu.tsx');
const { AlaAyuningSummaryCard } = await server.ssrLoadModule('/src/features/ala-ayuning-dewasa/components/AlaAyuningSummaryCard.tsx');
const { fetchDewasaAyuSummary, fetchDewasaAyuToday } = await server.ssrLoadModule('/src/features/ala-ayuning-dewasa/api/alaAyuningApi.ts');
const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');

const description = 'Baik untuk menanam tebu, mentimun. Tidak baik untuk upacara atau yadnya, mengadakan pertemuan (rapat), berenggama.';
const reason = { calendar_value_id: '39', name: 'Dadig Krana', description, recommendation: 'avoid' };
const activity = { activity_id: '2', activity_name: 'Dewa Yadnya', status: 'conflict', matched_avoid: [reason], matched_recommended: [{ calendar_value_id: '3', name: 'Amerta Akasa', description: 'Baik untuk Dewa Yadnya.', recommendation: 'recommended' }] };

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

test('pemilih kegiatan dan dashboard tidak memberi putusan universal sebelum kegiatan dipilih', () => {
  const panel = renderToStaticMarkup(React.createElement(DewasaActivityPanel, { activities: [activity], id: 'preview-activity' }));
  assert.match(panel, /Pilih kegiatan/);
  assert.match(panel, /Dewa Yadnya/);
  assert.doesNotMatch(panel, /Ada anjuran untuk kegiatan ini/);
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(DashboardDewasaAyu, { data: { status: 'NETRAL', statusLabel: 'PER KEGIATAN', headline: 'Ada pantangan untuk kegiatan tertentu hari ini.', activityGuidance: [activity], items: [], actionUrl: '/ala-ayuning-dewasa?date=2026-11-12' } })));
  assert.match(html, /PER KEGIATAN|Pilih kegiatan/);
  assert.doesNotMatch(html, />BAIK<|baik untuk berbagai upacara/);
});

test('ringkasan tidak mengisi status BAIK ketika ringkasan belum tersedia', () => {
  const html = renderToStaticMarkup(React.createElement(AlaAyuningSummaryCard, { formattedDate: '12 November 2026', padewasanList: [] }));
  assert.match(html, /PER KEGIATAN/);
  assert.doesNotMatch(html, />BAIK</);
  const warning = renderToStaticMarkup(React.createElement(AlaAyuningSummaryCard, { formattedDate: '12 November 2026', padewasanList: [], statusLabel: 'KURANG BAIK' }));
  assert.doesNotMatch(warning, /bg-emerald-50/);
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
