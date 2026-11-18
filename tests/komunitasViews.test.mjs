import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

// Portal diganti hanya untuk render server di tes; hooks, role, URL, dan cache tetap asli.
const server = await createServer({ configFile: false, cacheDir: `/tmp/komunitas-view-tests-${process.pid}`, optimizeDeps: { noDiscovery: true, include: [] }, resolve: { alias: { '@': `${process.cwd()}/src` } }, ssr: { noExternal: ['react-dom'] }, plugins: [{ name: 'test-dialog-portal', enforce: 'pre', resolveId(source) { if (source === 'react-dom') return '\0dialog-portal'; }, load(id) { if (id === '\0dialog-portal') return 'export const createPortal = children => children;'; } }], server: { middlewareMode: true, ws: false }, appType: 'custom' });
const { default: Page } = await server.ssrLoadModule('/src/features/komunitas/pages/KomunitasPage.tsx');
const { useAuthStore, authQueryScope } = await server.ssrLoadModule('/src/stores/useAuthStore.ts');
const { KomunitasFinanceModal } = await server.ssrLoadModule('/src/features/komunitas/components/KomunitasFinanceModal.tsx');
// SSR Zustand normalnya memakai initial state; tes memilih sesi eksplisit sebagai snapshot server.
const initialState = useAuthStore.getInitialState;
const previousDocument = globalThis.document;
globalThis.document = { body: {} };
afterEach(() => { useAuthStore.getState().logout(); Object.assign(initialState(), useAuthStore.getState()); });
after(async () => { useAuthStore.getInitialState = initialState; await server.close(); if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument; });
const profile = { id: 20, type: 'Suka Duka', status: 'Review', name: 'Komunitas B', address: 'Pura A', country: 'Indonesia', province: 'Bali', city: 'Denpasar', phone: '081234', location_url: 'https://maps.example.test/b', country_id: 1, province_id: 2, city_id: 3, manager: [{ user_id: 7, name: 'Pengelola B', email: 'b@example.test' }] };
const categories = [{ id: 1, name: 'Iuran' }];
function setup(id, role) {
  if (id) useAuthStore.getState().login({ id, role, name: id, email: `${id}@example.test` }, `test-${id}`);
  Object.assign(initialState(), useAuthStore.getState());
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: Infinity } } });
  client.setQueryData(['komunitas', 'detail', 20, authQueryScope(useAuthStore.getState())], profile);
  client.setQueryData(['finance', 'categories'], categories);
  client.setQueryData(['geo', 'countries', undefined], [{ id: 1, code: 'ID', name: 'Indonesia' }]);
  client.setQueryData(['geo', 'provinces', 1], [{ id: 2, code: 'BA', name: 'Bali' }]);
  client.setQueryData(['geo', 'cities', 2], [{ id: 3, code: 'DP', name: 'Denpasar' }]);
  return client;
}
function render(client, path) {
  return renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(Page))));
}
test('profil publik menampilkan pengelola tanpa memberi tombol edit atau moderasi', () => {
  const client = setup();
  client.setQueryData(['komunitas', 'detail', 20, authQueryScope(useAuthStore.getState())], { ...profile, status: 'Published' });
  const html = render(client, '/komunitas?id=20&dialog=detail');
  assert.match(html, /Pengelola B/); assert.doesNotMatch(html, /Edit Profil|Atur Pengelola|Setujui/); client.clear();
});
test('Member terpetakan mendapat edit profil, sedangkan Member lain tidak', () => {
  for (const [id, expected] of [['7', true], ['8', false]]) {
    const client = setup(id, 'Member'); const html = render(client, '/komunitas?id=20&dialog=detail');
    assert.equal(html.includes('Edit Profil'), expected); assert.doesNotMatch(html, /Atur Pengelola|Setujui/); client.clear();
  }
});
test('Admin mendapat moderasi Review serta pengelolaan mapping dan hapus profil', () => {
  const client = setup('9', 'Admin'), html = render(client, '/komunitas?id=20&dialog=detail');
  for (const label of ['Setujui', 'Tolak Pengajuan', 'Atur Pengelola', 'Hapus Komunitas']) assert.ok(html.includes(label));
  client.clear();
});
test('URL edit tanpa mapping tidak membuka form profil', () => {
  const client = setup('8', 'Member'), html = render(client, '/komunitas?id=20&dialog=edit');
  assert.match(html, /tidak memiliki hak/); assert.doesNotMatch(html, /Simpan Perubahan/); client.clear();
});
test('pendaftaran Member tidak mensyaratkan Premium dan tidak menampilkan field piodalan', () => {
  const client = setup('7', 'Member'), html = render(client, '/komunitas?dialog=create');
  assert.match(html, /otomatis menjadi pengelola/); assert.match(html, /URL Google Maps/);
  assert.doesNotMatch(html, /Wuku|Sasih|Benchmark|Upgrade Premium/); client.clear();
});
test('buku kas menampilkan sumber terpilih dan hak CRUD hanya bagi pengelola', () => {
  for (const [id, editable] of [['7', true], ['8', false]]) {
    const client = setup(id, 'Member'), scope = authQueryScope(useAuthStore.getState());
    const transaction = { id: 100, pura_id: 20, category_id: 1, category_name: 'Iuran', entry_type: 'debit', amount: 2000, transaction_date: '2026-11-18', note: 'Kas Komunitas B' };
    client.setQueryData(['pura', 'finance', 'entries', '20', '2026', undefined, '', scope], [transaction]);
    client.setQueryData(['pura', 'finance', 'entries', '10', '2026', undefined, '', scope], [{ ...transaction, pura_id: 10, note: 'Kas Pura A' }]);
    client.setQueryData(['pura', 'finance', 'summary', '20', '2026', undefined, scope], { total_debit: 2000, total_kredit: 0, saldo: 2000 });
    const html = render(client, '/komunitas?id=20&view=kas&year=2026');
    assert.match(html, /Kas Komunitas B/); assert.doesNotMatch(html, /Kas Pura A|Total Gabungan/);
    assert.equal(html.includes('Tambah Transaksi Kas'), editable); assert.equal(html.includes('Edit transaksi'), editable); client.clear();
  }
});
test('form transaksi menerima tanggal, kategori, dan nominal tanpa field odalan atau tutup buku', () => {
  const html = renderToStaticMarkup(React.createElement(KomunitasFinanceModal, { communityId: 20, communityName: 'Komunitas B', categories, busy: false, onClose() {}, async onSave() {} }));
  assert.match(html, /Nominal Rupiah/); assert.match(html, /Tanggal transaksi \(WITA\)/); assert.match(html, /Iuran/);
  assert.doesNotMatch(html, /Wuku|Sasih|Tutup Buku/);
});
