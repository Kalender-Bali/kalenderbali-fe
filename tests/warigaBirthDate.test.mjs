import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

// Hook, modal, dan fungsi API asli; ganti batas router, query, serta portal DOM.
const server = await createServer({
  configFile: false,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  ssr: { noExternal: ['@tanstack/react-query', 'react-router-dom', 'react-dom'] },
  plugins: [{
    name: 'birth-date-fixtures', enforce: 'pre',
    resolveId(source) {
      if (source === '@tanstack/react-query') return '\0birth-query';
      if (source === 'react-router-dom') return '\0birth-router';
      if (source === 'react-dom') return '\0birth-portal';
    },
    load(id) {
      if (id === '\0birth-query') return `export function useQuery(config) {
        globalThis.__birthQueries.push(config);
        const data = config.queryKey[0] === 'wariga-personal' ? globalThis.__birthResponse
          : config.queryKey[0] === 'kalender' ? globalThis.__birthDay : [];
        return { data, isLoading: false, isFetching: false, isError: false, refetch() {} };
      }`;
      if (id === '\0birth-router') return 'export const useSearchParams = () => [new URLSearchParams(globalThis.__birthParams), () => {}];';
      if (id === '\0birth-portal') return 'export const createPortal = node => node;';
    },
  }],
  server: { middlewareMode: true, ws: false }, appType: 'custom',
});
const oldDocument = globalThis.document;
globalThis.document = { body: {} };
after(async () => {
  await server.close();
  if (oldDocument === undefined) delete globalThis.document;
  else globalThis.document = oldDocument;
  for (const key of ['__birthParams', '__birthResponse', '__birthDay', '__birthQueries']) delete globalThis[key];
});
const { useWarigaPersonal } = await server.ssrLoadModule('/src/features/wariga-personal/hooks/useWarigaPersonal.ts');
const { WarigaTanggalLahirModal } = await server.ssrLoadModule('/src/features/wariga-personal/components/WarigaTanggalLahirModal.tsx');
const { DewasaTanggalLahirModal } = await server.ssrLoadModule('/src/features/wariga-personal/components/DewasaTanggalLahirModal.tsx');
const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');

function renderHook(civil, beforeSix, identity) {
  globalThis.__birthQueries = [];
  globalThis.__birthParams = `tgl_lahir=${civil}&sebelum_jam_6=${beforeSix}&bulan=11&tahun=2026`;
  globalThis.__birthResponse = identity ? { identitas_kelahiran: identity, hasil: [] } : undefined;
  let result;
  function Probe() { result = useWarigaPersonal(); return null; }
  renderToStaticMarkup(React.createElement(Probe));
  return result;
}

for (const [civil, beforeSix, effective, saptawara, pancawara] of [
  ['2000-01-01', true, '1999-12-31', 'Sukra', 'Kliwon'],
  ['2000-01-01', false, '2000-01-01', 'Saniscara', 'Umanis'],
  ['2000-03-01', true, '2000-02-29', 'Anggara', 'Kliwon'],
]) {
  test(`${civil}, sebelum 06.00=${beforeSix}: kedua rincian meminta tanggal efektif ${effective}`, async t => {
    const identity = {
      tanggal_lahir_sipil: civil, sebelum_jam_6: beforeSix, tanggal_lahir_kalender: effective,
      wewaran: { saptawara, pancawara },
    };
    const result = renderHook(civil, beforeSix, identity);
    assert.equal(result.calendarBirthDate, effective);
    const dewasaQuery = globalThis.__birthQueries.find(q => q.queryKey[0] === 'dewasa-kelahiran');
    assert.equal(dewasaQuery.queryKey.at(-1), effective);
    globalThis.__birthDay = { tanggal: effective, wewaran: { saptawara: { nama: saptawara }, pancawara: { nama: pancawara } } };
    const props = { isOpen: true, onClose() {}, birthDate: civil, calendarBirthDate: result.calendarBirthDate };
    const html = renderToStaticMarkup(React.createElement(WarigaTanggalLahirModal, { ...props, identitasKelahiran: identity }));
    assert.ok(html.includes(saptawara));
    assert.ok(html.includes(pancawara));
    const warigaQuery = globalThis.__birthQueries.find(q => q.queryKey[0] === 'kalender');
    assert.equal(warigaQuery.queryKey.at(-1), effective);
    assert.equal(warigaQuery.enabled, true);
    const calls = [];
    t.mock.method(apiClient, 'get', async (url, { params }) => {
      calls.push({ url, params });
      return { data: { data: url === '/kalender' ? [globalThis.__birthDay] : [{ padewasan: [{ nama: 'Dewasa efektif' }] }] } };
    });
    assert.equal((await warigaQuery.queryFn()).tanggal, effective);
    const items = await dewasaQuery.queryFn();
    assert.equal(items[0].nama, 'Dewasa efektif');
    assert.equal(calls[0].params.start_date, effective);
    assert.equal(calls[0].params.end_date, effective);
    assert.equal(calls[1].params.tanggal_mulai, effective);
    assert.equal(calls[1].params.tanggal_selesai, effective);
    const dewasaHtml = renderToStaticMarkup(React.createElement(DewasaTanggalLahirModal, { ...props, items, isLoading: false }));
    assert.match(dewasaHtml, /Dewasa efektif/);
    for (const content of [html, dewasaHtml]) {
      assert.match(content, /Tanggal lahir:/);
      if (beforeSix) assert.match(content, /Tanggal perhitungan:.*sebelum 06\.00 WITA/);
      else assert.doesNotMatch(content, /Tanggal perhitungan:/);
    }
  });
}

test('menunggu respons backend yang cocok; tidak memakai tanggal sipil sebagai fallback', () => {
  for (const identity of [
    undefined,
    { tanggal_lahir_sipil: '2000-01-02', sebelum_jam_6: true, tanggal_lahir_kalender: '2000-01-01' },
    { tanggal_lahir_sipil: '2000-01-01', sebelum_jam_6: false, tanggal_lahir_kalender: '2000-01-01' },
  ]) {
    const result = renderHook('2000-01-01', true, identity);
    assert.equal(result.calendarBirthDate, '');
    assert.equal(globalThis.__birthQueries.find(q => q.queryKey[0] === 'dewasa-kelahiran').enabled, false);
    const html = renderToStaticMarkup(React.createElement(WarigaTanggalLahirModal, {
      isOpen: true, onClose() {}, birthDate: '2000-01-01', calendarBirthDate: result.calendarBirthDate,
    }));
    assert.equal(globalThis.__birthQueries.find(q => q.queryKey[0] === 'kalender').enabled, false);
    assert.match(html, /animate-pulse/);
    assert.doesNotMatch(html, /Saniscara|Umanis|Sukra|Kliwon/);
  }
});
