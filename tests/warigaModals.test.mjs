import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

// Render komponen aslinya; hanya batas jaringan/query dan portal DOM yang diganti.
// Dua payload berbeda memastikan modal tidak lagi memakai sembilan konstanta.
const server = await createServer({
  configFile: false,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  ssr: { noExternal: ['@tanstack/react-query', 'react-dom'] },
  plugins: [{
    name: 'wariga-render-fixtures',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === '@tanstack/react-query') return '\0wariga-query';
      if (source === 'react-dom') return '\0wariga-portal';
      if (source === '../hooks/usePiodalan' && importer?.endsWith('PiodalanDetailModal.tsx')) return '\0wariga-piodalan-query';
    },
    load(id) {
      if (id === '\0wariga-query') return 'export const useQuery = () => globalThis.__warigaQuery;';
      if (id === '\0wariga-piodalan-query') return 'export const useDayWariga = () => globalThis.__warigaQuery;';
      if (id === '\0wariga-portal') return 'export const createPortal = (node) => node;';
    },
  }],
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});
const oldDocument = globalThis.document;
globalThis.document = { body: {} };
after(async () => {
  await server.close();
  if (oldDocument === undefined) delete globalThis.document;
  else globalThis.document = oldDocument;
  delete globalThis.__warigaQuery;
});

const { OtonanDetailModal } = await server.ssrLoadModule('/src/features/otonan/components/OtonanDetailModal.tsx');
const { PiodalanDetailModal } = await server.ssrLoadModule('/src/features/piodalan/components/PiodalanDetailModal.tsx');
const { calculateIngkel, calculateZodiak } = await server.ssrLoadModule('/src/features/otonan/utils/warigaUtils.ts');
const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');
const otonanApi = await server.ssrLoadModule('/src/features/otonan/api/otonanApi.ts');
const piodalanApi = await server.ssrLoadModule('/src/features/piodalan/api/piodalanApi.ts');

const attributes = ['jejepan', 'lintang', 'panca_sudha', 'pangarasan', 'rakam', 'watek_madya', 'watek_alit', 'eka_jala_rsi', 'pratiti'];
function fixture(marker) {
  return {
    tanggal: '2000-01-01',
    wewaran: {
      ekawara: { nama: '-' }, saptawara: { nama: 'Saniscara' },
      pancawara: { nama: 'Kliwon' }, wuku: { nama: 'Klawu' },
      ingkel: { nama: 'Manuk' }, neptu: 17,
      ...Object.fromEntries(attributes.map((key) => [key, { nama: `${marker} ${key}` }])),
    },
    sasih: { nama_sasih: 'kapitu', tahun_saka: 1921 },
    pengalantaka: { pengalantaka: 'Pangelong', penanggal_1: 10 },
  };
}
function renderModal(Component, query) {
  globalThis.__warigaQuery = { isLoading: false, isError: false, refetch() {}, ...query };
  return renderToStaticMarkup(React.createElement(Component, {
    isOpen: true, onClose() {}, selectedDate: '2000-01-01',
    schedule: { dateStr: '2000-01-01', formattedDate: '1 Januari 2000', dayName: 'Sabtu' },
  }));
}

for (const Component of [OtonanDetailModal, PiodalanDetailModal]) {
  test(`${Component.name}: sembilan atribut berubah mengikuti API dan Ekawara - dipertahankan`, () => {
    for (const marker of ['Hari pertama', 'Hari kedua']) {
      const html = renderModal(Component, { data: fixture(marker) });
      for (const key of attributes) assert.ok(html.includes(`${marker} ${key}`), key);
      assert.match(html, /Manuk/);
      assert.match(html, />17<\/span>/);
      assert.match(html, /Ekawara<\/span><div[^>]*><span[^>]*>-<\/span>/);
      assert.doesNotMatch(html, /Puwuh Atarung|Sidha Kasobagian|Luang|Jaramarana/);
    }
  });

  test(`${Component.name}: data kosong, gagal, dan memuat tidak menyajikan hasil rekaan`, () => {
    for (const [query, message] of [
      [{ data: null }, 'Rincian Wariga belum tersedia'],
      [{ isError: true }, 'Rincian Wariga gagal dimuat'],
      [{ isLoading: true }, 'Memuat rincian Wariga'],
    ]) {
      const html = renderModal(Component, query);
      assert.ok(html.includes(message), message);
      assert.doesNotMatch(html, /Puwuh Atarung|Sidha Kasobagian|Jaramarana|Luang/);
    }
  });

  test(`${Component.name}: atribut parsial ditampilkan - tanpa panah penjelasan palsu`, () => {
    const day = fixture('API');
    delete day.wewaran.lintang;
    const html = renderModal(Component, { data: day });
    assert.match(html, /Lintang<\/span><div[^>]*><span[^>]*>-<\/span>/);
    assert.doesNotMatch(html, /Buka penjelasan Lintang/);
  });
}

test('Ingkel mengenali ejaan Wuku 28; input tidak dikenal tidak menjadi Taru', () => {
  for (const name of ['Klawu', 'Kelawu', 'Kulawu', ' klawu ']) assert.equal(calculateIngkel(name), 'Manuk');
  assert.equal(calculateIngkel(), '-');
  assert.equal(calculateIngkel('tidak dikenal'), '-');
});

test('batas Zodiak React yang sudah ada dipertahankan', () => {
  assert.equal(calculateZodiak('2026-09-22'), 'Virgo');
  assert.equal(calculateZodiak('2026-10-22'), 'Libra');
  assert.equal(calculateZodiak('2026-11-21'), 'Scorpio');
  assert.equal(calculateZodiak(), '-');
});

for (const [name, api] of [['Otonan', otonanApi], ['Piodalan', piodalanApi]]) {
  test(`${name}: fetch tanggal yang diminta, kosong jika tidak ada, kegagalan diteruskan`, async (t) => {
    let payload = [fixture('API')];
    const get = t.mock.method(apiClient, 'get', async (_url, config) => {
      assert.equal(config.params.start_date, '2000-01-01');
      assert.equal(config.params.end_date, '2000-01-01');
      return { data: { data: payload } };
    });
    assert.deepEqual(await api.fetchDayWariga('2000-01-01'), payload[0]);
    payload = [{ ...fixture('Tanggal lain'), tanggal: '2000-01-02' }];
    assert.equal(await api.fetchDayWariga('2000-01-01'), null);
    payload = [];
    assert.equal(await api.fetchDayWariga('2000-01-01'), null);
    get.mock.mockImplementation(async () => { throw new Error('jaringan gagal'); });
    await assert.rejects(api.fetchDayWariga('2000-01-01'), /jaringan gagal/);
  });
}
