import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

const server = await createServer({ configFile: false, cacheDir: `/tmp/kalender-pengingat-limits-${process.pid}`, optimizeDeps: { noDiscovery: true, include: [] }, resolve: { alias: { '@': `${process.cwd()}/src` } }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
after(() => server.close());
const { PengingatFeatureCard } = await server.ssrLoadModule('/src/features/pengingat/components/PengingatFeatureCard.tsx');
const { PENGINGAT_CATEGORIES } = await server.ssrLoadModule('/src/features/pengingat/data/pengingatData.ts');
const { PengingatNotificationPagination } = await server.ssrLoadModule('/src/features/pengingat/components/PengingatNotificationPagination.tsx');
const free = { tier: 'Free', maxPerFeature: 1, canRepeat: false };
const premium = { tier: 'Premium', maxPerFeature: 10, canRepeat: true };
function render(category, total, policy) {
  return renderToStaticMarkup(React.createElement(MemoryRouter, {}, React.createElement(PengingatFeatureCard, { category, total, policy, entries: [], today: '2026-11-13', filtered: true, expanded: false, onExpand() {}, onAdd() {}, onDetail() {} })));
}

test('tombol tambah tetap dapat diklik saat kuota penuh dan kartu tidak menampilkan keterangan kuota', () => {
  for (const category of PENGINGAT_CATEGORIES) {
    for (const [total, policy, disabled] of [[0,free,false],[1,free,false],[9,premium,false],[10,premium,false],[11,premium,false],[0,null,true]]) {
      const html = render(category,total,policy);
      assert.equal(/<button[^>]*disabled=""[^>]*>.*?Tambah/s.test(html),disabled, `${category.id}, count=${total}, tier=${policy?.tier}`);
    }
    assert.doesNotMatch(render(category,1,free), /1\/1 pengingat|Batas fitur tercapai|Upgrade Premium/);
    assert.doesNotMatch(render(category,10,premium), /10\/10 pengingat|Hapus salah satu catatan/);
  }
});

test('halaman notifikasi tetap bisa kembali setelah penghapusan mengurangi total', () => {
  for (const [page, total, previousDisabled, nextDisabled] of [[1,21,true,false], [2,21,false,true], [2,20,false,true], [3,0,false,true]]) {
    let changed;
    const element = PengingatNotificationPagination({ page, total, onChange(value) { changed = value; } });
    const buttons = element.props.children.filter(child => child.type === 'button');
    assert.equal(buttons[0].props.disabled, previousDisabled);
    assert.equal(buttons[1].props.disabled, nextDisabled);
    if (!previousDisabled) {
      buttons[0].props.onClick();
      assert.equal(changed, Math.min(page - 1, Math.max(1, Math.ceil(total / 20))));
    }
    const html = renderToStaticMarkup(element);
    assert.match(html, /Notifikasi sebelumnya/);
    if (page > Math.max(1, Math.ceil(total / 20))) assert.match(html, /Halaman tidak tersedia/);
  }
  for (const total of [0,1,20]) assert.equal(PengingatNotificationPagination({ page: 1, total, onChange() {} }), null);
});
