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
const { CalendarHolidayReminders } = await server.ssrLoadModule('/src/features/kalender/components/CalendarHolidayReminders.tsx');
const dateString = '2026-11-12';
const render = dayData => renderToStaticMarkup(React.createElement(MemoryRouter, null,
  React.createElement(DayDetailModal, { isOpen: true, onClose() {}, onAddReminder() {}, dateString, dayData })));

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

test('tanggal tanpa Hari Raya tidak menampilkan tombol pengingat', () => {
  assert.doesNotMatch(render({ tanggal: dateString, hari_raya: [], padewasan: [] }), /Tambah pengingat/);
});

test('setiap Hari Raya mempunyai tombol terpisah yang meneruskan identitas pilihan', () => {
  const holidays = [{ id: '9007199254740993', nama: 'Kajeng Kliwon' }, { id: '2', nama: 'Purnama' }];
  let added, detail;
  const element = CalendarHolidayReminders({ holidays, date: '2026-11-24', today: '2026-11-16', onAdd: item => { added = item; }, onDetail: item => { detail = item; } });
  const html = renderToStaticMarkup(element);
  assert.equal((html.match(/aria-label="Tambah pengingat /g) ?? []).length, 2);
  assert.doesNotMatch(html, /disabled=""/);
  const rows = element.props.children[1].props.children;
  for (let i = 0; i < holidays.length; i++) {
    rows[i].props.children[1].props.onClick();
    assert.equal(added, holidays[i]);
    rows[i].props.children[0].props.onClick();
    assert.equal(detail, holidays[i]);
  }
});

test('Hari Raya yang sudah terlewat tetap bisa dilihat tetapi tidak disimpan pada tanggal lampau', () => {
  const html = renderToStaticMarkup(React.createElement(CalendarHolidayReminders, {
    holidays: [{ id: '1', nama: 'Sabuh Mas' }], date: '2026-11-03', today: '2026-11-16', onAdd() {}, onDetail() {},
  }));
  assert.match(html, /aria-label="Tambah pengingat Sabuh Mas" disabled=""/);
  assert.match(html, /Pengingat tersedia untuk hari ini atau tanggal mendatang/);
});
