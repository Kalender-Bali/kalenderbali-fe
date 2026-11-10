import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

/**
 * ============================================================================
 * TEST SUITE: GARIS HIDUP (PAL SRI SEDANA)
 * ============================================================================
 * Pengujian otomatis end-to-end unit & SSR komponen untuk fitur Garis Hidup:
 *  1. Memverifikasi validasi payload masukan peserta (1–5 orang, ISO YYYY-MM-DD).
 *  2. Menguji rendering SSR komponen GarisHidupHero (Breadcrumb, H1, Eyebrow).
 *  3. Menguji rendering SSR komponen GarisHidupFormSection (Daftar input peserta).
 *  4. Menguji rendering SSR komponen GarisHidupResultSection (Profil, Kurva SVG, 18 Siklus).
 *  5. Menguji rendering SSR komponen GarisHidupSkeleton (Zero Layout Shift).
 * ============================================================================
 */

// Inisialisasi Vite server mode SSR tanpa binding port jaringan
const server = await createServer({
  configFile: false,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});

after(async () => {
  await server.close();
});

// ============================================================================
// BLOK 1: IMPORT MODUL-MODUL GARIS HIDUP VIA VITE SSR
// ============================================================================
const { searchGarisHidup } = await server.ssrLoadModule('/src/features/garis-hidup/api/garisHidupApi.ts');
const { GarisHidupHero } = await server.ssrLoadModule('/src/features/garis-hidup/components/GarisHidupHero.tsx');
const { GarisHidupFormSection } = await server.ssrLoadModule('/src/features/garis-hidup/components/GarisHidupFormSection.tsx');
const { GarisHidupResultSection } = await server.ssrLoadModule('/src/features/garis-hidup/components/GarisHidupResultSection.tsx');
const { GarisHidupResultSectionSkeleton, GarisHidupSkeleton } = await server.ssrLoadModule('/src/features/garis-hidup/components/GarisHidupSkeleton.tsx');

// ============================================================================
// BLOK 2: DATA MOCK RESMI SESUAI KONTRAK BACKEND GO & CONTOH PANDUAN
// ============================================================================
const mockGarisHidupData = [
  {
    nama: 'I Wayan Raditya',
    tanggal_lahir: '2000-01-01',
    umur: 26,
    saptawara: 'Saniscara',
    pancawara: 'Umanis',
    urip: 14,
    periode_saat_ini: {
      min_umur: 25,
      max_umur: 30,
      nilai: 4,
      keterangan: 'baik sekali',
    },
    periode_lalu: {
      min_umur: 19,
      max_umur: 24,
      nilai: 4,
      keterangan: 'baik sekali',
    },
    periode_depan: {
      min_umur: 31,
      max_umur: 36,
      nilai: 0,
      keterangan: 'kesakitan (penderitaan)',
    },
    seluruh_periode: [
      { min_umur: 0, max_umur: 6, nilai: 1, keterangan: 'penghasilan sedikit' },
      { min_umur: 7, max_umur: 12, nilai: 0, keterangan: 'kesakitan (penderitaan)' },
      { min_umur: 13, max_umur: 18, nilai: 1, keterangan: 'penghasilan sedikit' },
      { min_umur: 19, max_umur: 24, nilai: 4, keterangan: 'baik sekali' },
      { min_umur: 25, max_umur: 30, nilai: 4, keterangan: 'baik sekali' },
      { min_umur: 31, max_umur: 36, nilai: 0, keterangan: 'kesakitan (penderitaan)' },
      { min_umur: 37, max_umur: 42, nilai: 1, keterangan: 'penghasilan sedikit' },
      { min_umur: 43, max_umur: 48, nilai: 4, keterangan: 'baik sekali' },
      { min_umur: 49, max_umur: 54, nilai: 1, keterangan: 'penghasilan sedikit' },
      { min_umur: 55, max_umur: 60, nilai: 4, keterangan: 'baik sekali' },
      { min_umur: 61, max_umur: 66, nilai: 4, keterangan: 'baik sekali' },
      { min_umur: 67, max_umur: 72, nilai: 1, keterangan: 'penghasilan sedikit' },
      { min_umur: 73, max_umur: 78, nilai: 1, keterangan: 'penghasilan sedikit' },
      { min_umur: 79, max_umur: 84, nilai: 0, keterangan: 'kesakitan (penderitaan)' },
      { min_umur: 85, max_umur: 90, nilai: 1, keterangan: 'penghasilan sedikit' },
      { min_umur: 91, max_umur: 96, nilai: 0, keterangan: 'kesakitan (penderitaan)' },
      { min_umur: 97, max_umur: 102, nilai: 1, keterangan: 'penghasilan sedikit' },
      { min_umur: 103, max_umur: 108, nilai: 4, keterangan: 'baik sekali' },
    ],
    melewati_batas_tabel: false,
  },
  {
    nama: 'Ni Kadek Ayu',
    tanggal_lahir: '2002-05-15',
    umur: 23,
    saptawara: 'Buda',
    pancawara: 'Kliwon',
    urip: 15,
    periode_saat_ini: {
      min_umur: 19,
      max_umur: 24,
      nilai: 5,
      keterangan: 'hidup senang',
    },
    periode_lalu: {
      min_umur: 13,
      max_umur: 18,
      nilai: 2,
      keterangan: 'berkembang',
    },
    periode_depan: {
      min_umur: 25,
      max_umur: 30,
      nilai: 7,
      keterangan: 'sangat beruntung',
    },
    seluruh_periode: [
      { min_umur: 0, max_umur: 6, nilai: 2, keterangan: 'berkembang' },
      { min_umur: 7, max_umur: 12, nilai: 3, keterangan: 'cukup baik' },
      { min_umur: 13, max_umur: 18, nilai: 2, keterangan: 'berkembang' },
      { min_umur: 19, max_umur: 24, nilai: 5, keterangan: 'hidup senang' },
      { min_umur: 25, max_umur: 30, nilai: 7, keterangan: 'sangat beruntung' },
      { min_umur: 31, max_umur: 36, nilai: 4, keterangan: 'baik sekali' },
      { min_umur: 37, max_umur: 42, nilai: 2, keterangan: 'berkembang' },
      { min_umur: 43, max_umur: 48, nilai: 1, keterangan: 'penghasilan sedikit' },
      { min_umur: 49, max_umur: 54, nilai: 3, keterangan: 'cukup baik' },
      { min_umur: 55, max_umur: 60, nilai: 6, keterangan: 'kejayaan' },
      { min_umur: 61, max_umur: 66, nilai: 4, keterangan: 'baik sekali' },
      { min_umur: 67, max_umur: 72, nilai: 2, keterangan: 'berkembang' },
      { min_umur: 73, max_umur: 78, nilai: 1, keterangan: 'penghasilan sedikit' },
      { min_umur: 79, max_umur: 84, nilai: 2, keterangan: 'berkembang' },
      { min_umur: 85, max_umur: 90, nilai: 3, keterangan: 'cukup baik' },
      { min_umur: 91, max_umur: 96, nilai: 1, keterangan: 'penghasilan sedikit' },
      { min_umur: 97, max_umur: 102, nilai: 2, keterangan: 'berkembang' },
      { min_umur: 103, max_umur: 108, nilai: 5, keterangan: 'hidup senang' },
    ],
    melewati_batas_tabel: false,
  },
];

// ============================================================================
// BLOK 3: UNIT TEST VALIDASI PRA-KIRIM API (searchGarisHidup)
// ============================================================================
test('searchGarisHidup: Menolak payload jika peserta kosong', async () => {
  await assert.rejects(
    async () => {
      await searchGarisHidup({ peserta: [] });
    },
    {
      name: 'Error',
      message: 'Minimal satu peserta wajib diisi.',
    }
  );
});

test('searchGarisHidup: Menolak payload jika peserta lebih dari 5', async () => {
  const overParticipants = Array.from({ length: 6 }).map((_, i) => ({
    nama: `Peserta ${i + 1}`,
    tanggal_lahir: '2000-01-01',
  }));

  await assert.rejects(
    async () => {
      await searchGarisHidup({ peserta: overParticipants });
    },
    {
      name: 'Error',
      message: 'Jumlah peserta maksimal 5 orang.',
    }
  );
});

test('searchGarisHidup: Menolak jika tanggal lahir salah satu peserta kosong', async () => {
  await assert.rejects(
    async () => {
      await searchGarisHidup({
        peserta: [{ nama: 'Wayan', tanggal_lahir: '' }],
      });
    },
    {
      name: 'Error',
      message: 'Tanggal lahir untuk Peserta 1 wajib diisi.',
    }
  );
});

test('searchGarisHidup: Menolak jika format tanggal bukan ISO YYYY-MM-DD', async () => {
  await assert.rejects(
    async () => {
      await searchGarisHidup({
        peserta: [{ nama: 'Wayan', tanggal_lahir: '01/01/2000' }],
      });
    },
    {
      name: 'Error',
      message: 'Format tanggal lahir Peserta 1 harus YYYY-MM-DD.',
    }
  );
});

// ============================================================================
// BLOK 4: SSR TEST KOMPONEN GarisHidupHero
// ============================================================================
test('GarisHidupHero: Merender breadcrumb, H1, eyebrow, dan tombol panduan', () => {
  const html = renderToString(React.createElement(GarisHidupHero, { onOpenGuide: () => {} }));

  assert.ok(html.includes('Wargabali'), 'Breadcrumb harus ada Wargabali');
  assert.ok(html.includes('Garis Hidup'), 'Judul H1 Garis Hidup harus ada');
  assert.ok(html.includes('Pal Sri Sedana (6 Tahunan)'), 'Eyebrow Pal Sri Sedana harus ada');
  assert.ok(html.includes('Panduan Garis Hidup'), 'Tombol Panduan Garis Hidup harus ada');
});

// ============================================================================
// BLOK 5: SSR TEST KOMPONEN GarisHidupFormSection
// ============================================================================
test('GarisHidupFormSection: Merender form masukan peserta dengan benar', () => {
  const entries = [
    { id: 'p1', nama: 'I Wayan Raditya', tanggal_lahir: '2000-01-01' },
  ];

  const html = renderToString(
    React.createElement(GarisHidupFormSection, {
      entries,
      onAddParticipant: () => {},
      onRemoveParticipant: () => {},
      onUpdateParticipant: () => {},
      onSubmit: () => {},
    })
  );

  assert.ok(html.includes('Data Peserta'), 'Header Data Peserta harus ada');
  assert.ok(html.includes('/5 Orang'), 'Counter peserta harus /5 Orang');
  assert.ok(html.includes('Hitung Garis Hidup'), 'Tombol Hitung harus ada');
  assert.ok(html.includes('Tambah Peserta'), 'Tombol Tambah Peserta harus ada');
});

// ============================================================================
// BLOK 6: SSR TEST KOMPONEN GarisHidupResultSection
// ============================================================================
test('GarisHidupResultSection: Merender profil, kurva SVG, dan 18 siklus', () => {
  const html = renderToString(
    React.createElement(GarisHidupResultSection, {
      results: mockGarisHidupData,
      activeParticipantIndex: 0,
      onSelectParticipant: () => {},
    })
  );

  // Tab Multi-Peserta
  assert.ok(html.includes('I Wayan Raditya'), 'Nama peserta 1 harus ada');
  assert.ok(html.includes('Ni Kadek Ayu'), 'Nama peserta 2 pada tab switcher harus ada');

  // Wewaran & Urip
  assert.ok(html.includes('Saniscara'), 'Saptawara Saniscara harus dirender');
  assert.ok(html.includes('Umanis'), 'Pancawara Umanis harus dirender');
  assert.ok(html.includes('Total Urip'), 'Total Urip harus dirender');
  assert.ok(html.includes('14'), 'Angka urip 14 harus ada');

  // Fase Saat Ini
  assert.ok(html.toLowerCase().includes('baik sekali'), 'Status fase saat ini baik sekali harus ada');
  assert.ok(html.includes('Fase Usia Saat Ini'), 'Label Fase Usia Saat Ini harus ada');

  // Kurva SVG Native
  assert.ok(html.includes('<svg'), 'Elemen SVG grafik harus dirender');
  assert.ok(html.includes('polyline'), 'Garis kurva polyline harus ada');

  // Tabel 18 Siklus
  assert.ok(html.includes('Perjalanan Hidup (18 Siklus)'), 'Header 18 Siklus harus ada');
  assert.ok(html.includes('Saat Ini'), 'Badge penanda Saat Ini harus ada');
  assert.ok(html.includes('103') && html.includes('108'), 'Periode akhir 103-108 harus ada');
});

// ============================================================================
// BLOK 7: SSR TEST KOMPONEN GarisHidupSkeleton
// ============================================================================
test('GarisHidupSkeleton & GarisHidupResultSectionSkeleton: Merender placeholder beranimasi', () => {
  const resultSkeletonHtml = renderToString(React.createElement(GarisHidupResultSectionSkeleton));
  assert.ok(resultSkeletonHtml.includes('animate-pulse'), 'Harus menyertakan animate-pulse');
  assert.ok(resultSkeletonHtml.includes('aria-busy="true"'), 'Aria-busy harus true');

  const pageSkeletonHtml = renderToString(React.createElement(GarisHidupSkeleton));
  assert.ok(pageSkeletonHtml.includes('animate-pulse'), 'Page skeleton harus animate-pulse');
});
