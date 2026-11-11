import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});
after(async () => server.close());

const { OtonanResultSection } = await server.ssrLoadModule('/src/features/otonan/components/OtonanResultSection.tsx');
const { downloadOtonanICS } = await server.ssrLoadModule('/src/features/otonan/utils/otonanUtils.ts');

const elements = { saptawara: 'Redite', pancawara: 'Paing', wuku: 'Sinta' };
function renderResults(mode, cycles, dates = ['2023-05-21', '2023-12-17']) {
  return renderToStaticMarkup(React.createElement(OtonanResultSection, {
    data: {
      input_dinormalisasi: { tipe_pencarian: mode, elemen: elements, sebelum_jam_6: false },
      hasil: dates.map((tanggal, i) => ({ tanggal, perayaan_ke: cycles[i], detail_elemen: elements })),
      penjelasan: '',
    },
    onOpenDetailModal: () => {},
  }));
}

test('mode elemen menampilkan kedua tanggal tanpa mengklaim nomor siklus sejak lahir', () => {
  for (const cycles of [[null, null], [40, 41], [-2, -1]]) {
    const html = renderResults('elemen_kalender', cycles);
    assert.match(html, /21 Mei 2023/);
    assert.match(html, /17 Desember 2023/);
    assert.doesNotMatch(html, /SIKLUS KE|sejak tanggal lahir/);
  }
});

test('mode tanggal lahir tetap menampilkan nomor siklus yang diketahui', () => {
  const html = renderResults('tanggal_lahir', [37], ['2023-06-09']);
  assert.match(html, /9 Juni 2023/);
  assert.match(html, /SIKLUS KE/);
  assert.match(html, />37<\/span>/);
  assert.match(html, /sejak tanggal lahir/);
  assert.doesNotMatch(renderResults('tanggal_lahir', [null]), /SIKLUS KE|sejak tanggal lahir/);
});

test('ekspor kalender tidak menulis siklus null, dan mempertahankan siklus tanggal lahir', async (t) => {
  let blob;
  t.mock.method(URL, 'createObjectURL', (value) => { blob = value; return 'blob:otonan'; });
  t.mock.method(URL, 'revokeObjectURL', () => {});
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({ setAttribute() {}, click() {} }),
    body: { appendChild() {}, removeChild() {} },
  };
  t.after(() => {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  });
  for (const perayaanKe of [null, 37]) {
    downloadOtonanICS({ tanggal: '2023-05-21', perayaanKe, ...elements });
    const content = await blob.text();
    assert.match(content, /DTSTART;VALUE=DATE:20230521/);
    if (perayaanKe === null) {
      assert.match(content, /SUMMARY:Otonan \(Redite Paing Sinta\)/);
      assert.doesNotMatch(content, /Siklus ke-|Otonan ke-|null|undefined/);
    } else {
      assert.match(content, /SUMMARY:Otonan ke-37/);
      assert.match(content, /Siklus ke-37/);
    }
  }
});
