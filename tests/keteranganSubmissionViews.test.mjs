import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

const server = await createServer({ configFile: false, cacheDir: `/tmp/keterangan-view-${process.pid}`, optimizeDeps: { noDiscovery: true, include: [] }, resolve: { alias: { '@': `${process.cwd()}/src` } }, ssr: { noExternal: ['react-dom'] }, plugins: [{ name: 'portal', enforce: 'pre', resolveId(id) { if (id === 'react-dom') return '\0portal'; }, load(id) { if (id === '\0portal') return 'export const createPortal = children => children'; } }], server: { middlewareMode: true, ws: false }, appType: 'custom' });
const { KeteranganSubmissions } = await server.ssrLoadModule('/src/features/keterangan/components/KeteranganSubmissions.tsx');
const { KeteranganEdit } = await server.ssrLoadModule('/src/features/keterangan/components/KeteranganEdit.tsx');
const { PuraProfileForm } = await server.ssrLoadModule('/src/features/kelola-pura/components/PuraProfileForm.tsx');
const { default: WartaPage } = await server.ssrLoadModule('/src/features/warta/pages/WartaPage.tsx');
const { default: KeteranganDetailPage } = await server.ssrLoadModule('/src/features/keterangan/pages/KeteranganDetailPage.tsx');
const { Routes, Route } = await import('react-router-dom');
const { useAuthStore, authQueryScope } = await server.ssrLoadModule('/src/stores/useAuthStore.ts');
const previousDocument = globalThis.document;
globalThis.document = { body: {} };
after(async () => { useAuthStore.getState().logout(); await server.close(); if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument; });

test('admin dapat meninjau isi lama dan usulan, kontributor hanya melihat status sendiri', () => {
  for (const role of ['admin', 'contributor']) {
    useAuthStore.getState().login({ id: '4', role, name: 'Test', email: 'test@example.test' }, 'test-token');
    Object.assign(useAuthStore.getInitialState(), useAuthStore.getState());
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    client.setQueryData(['keterangan-submissions', authQueryScope(useAuthStore.getState()), role === 'admin', 1], { data: [{ id: '1', item_name: 'Sinta', submitter_name: 'Pemohon', original_description: 'Sebelum', proposed_description: 'Usulan', status: 'Review' }], total: 1 }, { updatedAt: Date.now() + 60000 });
    const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(MemoryRouter, null, React.createElement(KeteranganSubmissions, { onClose() {} }))));
    for (const text of ['Sinta', 'Sebelum', 'Usulan', 'Menunggu review']) assert.match(html, new RegExp(text));
    assert.equal(html.includes('Setujui'), role === 'admin');
    assert.equal(html.includes('Tolak'), role === 'admin');
    client.clear();
  }
});

test('setelah masuk dari Warta, pengguna biasa kembali ke panel akses kontributor', () => {
  useAuthStore.getState().login({ id: '5', role: 'user', name: 'Test', email: 'test@example.test' }, 'test-token');
  Object.assign(useAuthStore.getInitialState(), useAuthStore.getState());
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(MemoryRouter, { initialEntries: ['/warta?contributor_action=1'] }, React.createElement(WartaPage))));
  assert.match(html, /Akses Contributor diperlukan/);
  client.clear();
});

test('setelah masuk dari Keterangan, panel hanya dibuka untuk elemen yang dipilih', () => {
  useAuthStore.getState().login({ id: '5', role: 'user', name: 'Test', email: 'test@example.test' }, 'test-token');
  Object.assign(useAuthStore.getInitialState(), useAuthStore.getState());
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const render = id => renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(MemoryRouter, { initialEntries: ['/keterangan/wuku?contributor_action=1&contributor_value=10'] }, React.createElement(KeteranganEdit, { item: { id, name: 'Sinta', description: 'Lama' } }))));
  assert.match(render('10'), /Akses Contributor diperlukan/);
  assert.doesNotMatch(render('11'), /Akses Contributor diperlukan/);
  client.clear();
});

test('elemen di halaman berikutnya tetap ditemukan setelah kembali dari login', () => {
  useAuthStore.getState().login({ id: '5', role: 'user', name: 'Test', email: 'test@example.test' }, 'test-token');
  Object.assign(useAuthStore.getInitialState(), useAuthStore.getState());
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const category = { id: '25', code: 'wuku', name: 'Wuku', description: '' };
  const values = Array.from({ length: 20 }, (_, i) => ({ id: String(i + 1), name: `Elemen ${i + 1}`, description: 'Lama', aliases: [] }));
  client.setQueryData(['keterangan', 'types'], [category], { updatedAt: Date.now() + 60000 });
  client.setQueryData(['keterangan', 'types', 'wuku'], { type: category, values, total: 20 }, { updatedAt: Date.now() + 60000 });
  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(MemoryRouter, { initialEntries: ['/keterangan/wuku?contributor_action=1&contributor_value=12'] }, React.createElement(Routes, null, React.createElement(Route, { path: '/keterangan/:typeCode', element: React.createElement(KeteranganDetailPage) })))));
  assert.match(html, /Elemen 12/); assert.match(html, /Akses Contributor diperlukan/);
  client.clear();
});

test('pengajuan Pura tidak dapat disimpan saat daftar kota profil masih dimuat', () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['geo', 'countries', undefined], [{ id: 1, name: 'Indonesia' }], { updatedAt: Date.now() + 60000 });
  client.setQueryData(['geo', 'provinces', 1], [{ id: 2, name: 'Bali' }], { updatedAt: Date.now() + 60000 });
  const profile = { id: 1, name: 'Pura Uji', type: 'Kawitan', country_id: 1, province_id: 2, city_id: 3 };
  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(PuraProfileForm, { profile, onClose() {}, onSaved() {} })));
  assert.match(html, /<button[^>]*disabled=""[^>]*>Simpan Perubahan<\/button>/);
  client.setQueryData(['geo', 'cities', 2], [{ id: 3, name: 'Denpasar' }], { updatedAt: Date.now() + 60000 });
  const loaded = renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(PuraProfileForm, { profile, onClose() {}, onSaved() {} })));
  assert.match(loaded, /<option value="3" selected="">Denpasar<\/option>/);
  assert.doesNotMatch(loaded, /<button[^>]*disabled=""[^>]*>Simpan Perubahan<\/button>/);
  client.setQueryData(['geo', 'cities', 2], [{ id: 4, name: 'Gianyar' }], { updatedAt: Date.now() + 60000 });
  const missing = renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(PuraProfileForm, { profile, onClose() {}, onSaved() {} })));
  assert.match(missing, /Kota sebelumnya tidak tersedia/);
  assert.match(missing, /<button[^>]*disabled=""[^>]*>Simpan Perubahan<\/button>/);
  client.clear();
});

test('pilihan Pancawara Pura cocok dengan nilai Kliwon pada data master', () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const profile = { id: 1, name: 'Pura Uji', type: 'Kawitan', benchmark: 'Pawukon', pancawara: 'Kliwon' };
  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(PuraProfileForm, { profile, onClose() {}, onSaved() {} })));
  assert.match(html, /<option[^>]*selected=""[^>]*>Kliwon<\/option>/);
  client.clear();
});

test('pilihan Wuku dan Sasih menggunakan nama yang benar-benar ada di master', () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const render = benchmark => renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(PuraProfileForm, { profile: { id: 1, name: 'Pura Uji', type: 'Kawitan', benchmark }, onClose() {}, onSaved() {} })));
  const wuku = render('Pawukon');
  assert.match(wuku, />Klurut<\/option>/); assert.match(wuku, />Klawu<\/option>/);
  const sasih = render('Sasih');
  for (const value of ['ketiga', 'kenam', 'kepitu', 'kawulu', 'kesanga', 'kedasa', 'jiyestha', 'sadha']) assert.match(sasih, new RegExp(`value="${value}"`));
  client.clear();
});
