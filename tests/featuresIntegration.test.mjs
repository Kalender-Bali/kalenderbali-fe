import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});

after(async () => {
  await server.close();
});

function wrapRouter(element) {
  return React.createElement(MemoryRouter, null, element);
}

test('Kontak: render KontakHero, KontakDeveloperCard, dan KontakFormCard', async () => {
  const { KontakHero } = await server.ssrLoadModule('/src/features/kontak/components/KontakHero.tsx');
  const { KontakDeveloperCard } = await server.ssrLoadModule('/src/features/kontak/components/KontakDeveloperCard.tsx');
  const { KontakFormCard } = await server.ssrLoadModule('/src/features/kontak/components/KontakFormCard.tsx');

  const htmlHero = renderToStaticMarkup(wrapRouter(React.createElement(KontakHero)));
  assert.ok(htmlHero.includes('Info Kontak'));

  const htmlDev = renderToStaticMarkup(wrapRouter(React.createElement(KontakDeveloperCard)));
  assert.ok(htmlDev.includes('Bali Integrated Solution') || htmlDev.includes('bali.integrated.solution@gmail.com'));

  const htmlForm = renderToStaticMarkup(wrapRouter(React.createElement(KontakFormCard)));
  assert.ok(htmlForm.includes('Kirim Masukan atau Pertanyaan'));
  assert.ok(htmlForm.includes('Nama Lengkap'));
});

test('Dashboard: DashboardDewasaAyu merender status BAIK dan daftar padewasan', async () => {
  const { DashboardDewasaAyu } = await server.ssrLoadModule('/src/features/dashboard/components/DashboardDewasaAyu.tsx');
  const fixture = {
    status: 'BAIK',
    statusLabel: 'BAIK',
    headline: 'Hari ini memiliki pengaruh padewasan yang baik.',
    items: [
      { id: '1', nama: 'Amerta Dewa', keterangan: 'Baik untuk upacara', tag: 'PADEWASAN' },
      { id: '2', nama: 'Amerta Gati', keterangan: 'Baik untuk usaha', tag: 'PADEWASAN' },
    ],
    actionUrl: '/ala-ayuning-dewasa',
  };

  const html = renderToStaticMarkup(wrapRouter(React.createElement(DashboardDewasaAyu, { data: fixture })));
  assert.ok(html.includes('DEWASA AYU HARI INI'));
  assert.ok(html.includes('BAIK'));
  assert.ok(html.includes('Amerta Dewa'));
  assert.ok(html.includes('Amerta Gati'));
});

test('Ramalan Sifat: RamalanSifatHero dan Skeleton merender komponen tanpa error', async () => {
  const { RamalanSifatHero } = await server.ssrLoadModule('/src/features/ramalan-sifat/components/RamalanSifatHero.tsx');
  const { RamalanSifatSkeleton, RamalanSifatResultSectionSkeleton } = await server.ssrLoadModule('/src/features/ramalan-sifat/components/RamalanSifatSkeleton.tsx');

  const heroHtml = renderToStaticMarkup(wrapRouter(React.createElement(RamalanSifatHero)));
  assert.ok(heroHtml.includes('Ramalan Sifat'));

  const skelHtml = renderToStaticMarkup(wrapRouter(React.createElement(RamalanSifatSkeleton)));
  assert.ok(skelHtml.includes('animate-pulse'));

  const resSkelHtml = renderToStaticMarkup(wrapRouter(React.createElement(RamalanSifatResultSectionSkeleton)));
  assert.ok(resSkelHtml.includes('animate-pulse'));
});

test('Premium: PremiumPlanCards merender daftar produk dengan benar', async () => {
  const { PremiumPlanCards } = await server.ssrLoadModule('/src/features/premium/components/PremiumPlanCards.tsx');
  const products = [
    {
      id: 1,
      product_id: 'member_premium_bulanan_1',
      name: 'Member Premium Bulanan',
      price: 25000,
    },
    {
      id: 2,
      product_id: 'member_premium_tahunan_1',
      name: 'Member Premium Tahunan',
      price: 250000,
    },
  ];

  const html = renderToStaticMarkup(wrapRouter(React.createElement(PremiumPlanCards, {
    products,
    processingProductId: null,
    onSelectProduct() {},
  })));
  assert.ok(html.includes('Member Premium Bulanan'));
  assert.ok(html.includes('Member Premium Tahunan'));
  assert.ok(html.includes('PAKET TAHUNAN'));
});

test('Error Boundary: getDerivedStateFromError mengaktifkan state hasError dan merender UI pemulihan', async () => {
  const { ErrorBoundary } = await server.ssrLoadModule('/src/components/ui/ErrorBoundary.tsx');
  const instance = new ErrorBoundary({ children: null });
  const derived = ErrorBoundary.getDerivedStateFromError(new Error('Fatal UI Error'));
  assert.equal(derived.hasError, true);

  instance.state = derived;
  const html = renderToStaticMarkup(wrapRouter(instance.render()));
  assert.ok(html.includes('Terjadi Kendala pada Tampilan'));
  assert.ok(html.includes('Muat Ulang Halaman'));
  assert.ok(html.includes('Beranda'));
});

test('Hari Raya: HariRayaHero merender header dan deskripsi fitur', async () => {
  const { HariRayaHero } = await server.ssrLoadModule('/src/features/hari-raya/components/HariRayaHero.tsx');
  const html = renderToStaticMarkup(wrapRouter(React.createElement(HariRayaHero)));
  assert.ok(html.includes('Hari Raya'));
  assert.ok(html.includes('Wargabali'));
});

test('Wariga Personal: WarigaPersonalHero merender judul dan breadcrumb', async () => {
  const { WarigaPersonalHero } = await server.ssrLoadModule('/src/features/wariga-personal/components/WarigaPersonalHero.tsx');
  const html = renderToStaticMarkup(wrapRouter(React.createElement(WarigaPersonalHero)));
  assert.ok(html.includes('Wariga Personal'));
  assert.ok(html.includes('Layanan'));
});
