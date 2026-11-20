import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});
after(() => server.close());

const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');
const { fetchRubrikList, saveRubrik, deleteRubrik, changeRubrikComment } = await server.ssrLoadModule('/src/features/rubrik-dewasa/api/rubrikDewasaApi.ts');
const { default: RubrikDewasaPage } = await server.ssrLoadModule('/src/features/rubrik-dewasa/pages/RubrikDewasaPage.tsx');
const { buildRubrikSearch, filterRubrikDates } = await server.ssrLoadModule('/src/features/rubrik-dewasa/utils/rubrikDates.ts');

function renderList(url, search, page, payload) {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity } } });
  // Hasil masuk melalui cache query, sama seperti ketika halaman menerima respons Go.
  client.setQueryData(['rubrik-dewasa', 'list', search, page], payload);
  try {
    return renderToString(React.createElement(QueryClientProvider, { client },
      React.createElement(MemoryRouter, { initialEntries: [url] }, React.createElement(RubrikDewasaPage))));
  } finally {
    client.clear();
  }
}

test('API daftar Rubrik mengirim kata kunci dan nomor halaman ke Go', async (t) => {
  const originalAdapter = apiClient.defaults.adapter;
  t.after(() => { apiClient.defaults.adapter = originalAdapter; });
  const signal = new AbortController().signal;
  apiClient.defaults.adapter = async (config) => {
    assert.equal(config.url, '/rubrik-dewasa');
    assert.deepEqual(config.params, { search: 'Kajeng Kliwon', page: 2, per_page: 20 });
    assert.equal(config.signal, signal);
    return { status: 200, statusText: 'OK', headers: {}, config, data: { data: [{ id: 21 }], total: 21 } };
  };
  assert.deepEqual(await fetchRubrikList('Kajeng Kliwon', 2, signal), { data: [{ id: 21 }], total: 21 });
});

test('halaman terakhir mempertahankan pencarian saat detail dibuka dan menonaktifkan halaman berikutnya', () => {
  const html = renderList('/rubrik-dewasa?q=Kajeng+Kliwon&page=2', 'Kajeng Kliwon', 2, {
    data: [{ id: 21, nama: 'Kajeng Kliwon', author_name: 'Kontributor', comment_count: 1 }], total: 21,
  });
  assert.match(html, /value="Kajeng Kliwon"/);
  assert.match(html, /href="\/rubrik-dewasa\/21\?q=Kajeng\+Kliwon&amp;page=2"/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Berikutnya<\/button>/);
  assert.doesNotMatch(html, /<button[^>]*disabled=""[^>]*>Sebelumnya<\/button>/);
});

test('hasil pencarian kosong menyampaikan status dan tidak menawarkan halaman selanjutnya', () => {
  const html = renderList('/rubrik-dewasa?q=kosong', 'kosong', 1, { data: [], total: 0 });
  assert.match(html, /Belum ada rubrik yang sesuai/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Sebelumnya<\/button>/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>Berikutnya<\/button>/);
});

test('pengelolaan rubrik dan komentar memakai endpoint serta payload Go', async (t) => {
  const originalAdapter = apiClient.defaults.adapter;
  t.after(() => { apiClient.defaults.adapter = originalAdapter; });
  const requests = [];
  apiClient.defaults.adapter = async (config) => {
    requests.push([config.method, config.url, config.data && JSON.parse(config.data)]);
    const data = config.url.endsWith('/my') ? { data: [{ id: 21 }], total: 1 } : { data: { id: 21 } };
    return { status: 200, statusText: 'OK', headers: {}, config, data };
  };
  const draft = { nama: 'Rubrik uji', deskripsi: '', criteria: {
    dicari: [{ label: '', conditions: [{ parameter: 'saptawara', value: 'Buda' }] }], dihindari: [],
  } };
  await fetchRubrikList('', 1, new AbortController().signal, true);
  await saveRubrik(draft);
  await saveRubrik(draft, 21);
  await changeRubrikComment(21, { kind: 'create', text: 'Pertanyaan' });
  await changeRubrikComment(21, { kind: 'update', id: 3, text: 'Pertanyaan baru' });
  await changeRubrikComment(21, { kind: 'delete', id: 3 });
  await deleteRubrik(21);
  assert.deepEqual(requests, [
    ['get', '/rubrik-dewasa/my', undefined], ['post', '/rubrik-dewasa', draft], ['put', '/rubrik-dewasa/21', draft],
    ['post', '/rubrik-dewasa/21/comments', { isi: 'Pertanyaan' }], ['put', '/rubrik-dewasa/21/comments/3', { isi: 'Pertanyaan baru' }],
    ['delete', '/rubrik-dewasa/21/comments/3', undefined], ['delete', '/rubrik-dewasa/21', undefined],
  ]);
});

test('semua bulan memakai satu rentang Go dan awal/akhir bulan mengikuti tahun kabisat', () => {
  const rules = { recommended_any: [], avoid_any: [] };
  assert.deepEqual(buildRubrikSearch(rules, 0, 2028), {
    mode: 'custom', custom: rules, tanggal_mulai: '2028-01-01', tanggal_selesai: '2028-12-31',
    include_calendar: true, include_rejected: false,
  });
  assert.equal(buildRubrikSearch(rules, 2, 2028).tanggal_selesai, '2028-02-29');
  assert.equal(buildRubrikSearch(rules, 0, 2201), null);
});

test('filter tambahan menyaring fakta kalender dan beririsan dengan tanggal kegiatan dari Go', () => {
  const results = [
    { tanggal: '2028-02-01', calendar: { wewaran: { saptawara: { nama: 'Anggara' } }, pengalantaka: { penanggal_2: 8 }, padewasan: [{ id: '9' }] } },
    { tanggal: '2028-02-08', calendar: { wewaran: { saptawara: { nama: 'Anggara' } }, pengalantaka: { penanggal_1: 8 }, padewasan: [{ id: '9' }, { id: '4' }] } },
    { tanggal: '2028-02-15', calendar: { wewaran: { saptawara: { nama: 'Anggara' } }, pengalantaka: { penanggal_1: 8 }, padewasan: [{ id: '9' }] } },
  ];
  const filters = { parameters: { saptawara: 'Anggara', lunar_day: '8' }, requiredPadewasan: '9', excludedPadewasan: '4' };
  assert.deepEqual(filterRubrikDates(results, filters, new Set(['2028-02-01', '2028-02-08'])), [results[0]]);
  assert.deepEqual(filterRubrikDates(results, { parameters: {}, requiredPadewasan: '', excludedPadewasan: '' }), results);
});
