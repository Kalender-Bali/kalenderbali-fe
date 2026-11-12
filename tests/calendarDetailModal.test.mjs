import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

// SSR cannot render DOM portals; keep the real modal and replace only the portal.
const server = await createServer({
  configFile: false,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  ssr: { noExternal: ['react-dom'] },
  plugins: [{
    name: 'modal-portal-fixture', enforce: 'pre',
    resolveId(source) { if (source === 'react-dom') return '\0calendar-portal'; },
    load(id) { if (id === '\0calendar-portal') return 'export const createPortal = node => node;'; },
  }],
  server: { middlewareMode: true, ws: false }, appType: 'custom',
});
const previousDocument = globalThis.document;
globalThis.document = { body: {} };
after(async () => {
  await server.close();
  if (previousDocument === undefined) delete globalThis.document;
  else globalThis.document = previousDocument;
});
const { DayDetailModal } = await server.ssrLoadModule('/src/features/kalender/components/DayDetailModal.tsx');
const dateString = '2026-11-12';
const render = dayData => renderToStaticMarkup(React.createElement(MemoryRouter, null,
  React.createElement(DayDetailModal, { isOpen: true, onClose() {}, dateString, dayData })));

test('modal detail menampilkan anjuran dan pantangan dari data padewasan', () => {
  const html = render({ tanggal: dateString, padewasan: [{ nama: 'Petunjuk uji', keterangan: 'Baik untuk membaca lontar. Tidak baik untuk mencetak naskah.' }] });
  assert.match(html, /PETUNJUK PADEWASAN/);
  assert.match(html, /Dianjurkan:/);
  assert.match(html, /membaca lontar/i);
  assert.match(html, /Pantangan:/);
  assert.match(html, /mencetak naskah/i);
  assert.match(html, /Lihat selengkapnya/);
});

test('modal membedakan padewasan kosong dan data hari yang belum tersedia', () => {
  const empty = render({ tanggal: dateString, padewasan: [] });
  assert.match(empty, /Tidak ada rincian padewasan pada tanggal ini/);
  assert.doesNotMatch(empty, /Dianjurkan:|Pantangan:/);
  const unavailable = render(undefined);
  assert.match(unavailable, /Data padewasan belum tersedia/);
  assert.doesNotMatch(unavailable, /Tidak ada rincian padewasan pada tanggal ini/);
});
