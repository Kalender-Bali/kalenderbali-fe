import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

/**
 * ============================================================================
 * TEST SUITE: RAMALAN JODOH (PAL SRI SEDANA)
 * ============================================================================
 * Pengujian otomatis end-to-end unit & SSR komponen untuk fitur Ramalan Jodoh:
 *  1. Memverifikasi validasi payload masukan Diri & Pasangan (ISO YYYY-MM-DD).
 *  2. Menguji rendering SSR komponen JodohHero (Breadcrumb & Judul H1).
 *  3. Menguji rendering SSR komponen JodohFormSection (2 Kolom Diri vs Pasangan).
 *  4. Menguji rendering SSR komponen JodohResultSection (Hero Card, Skor %, 4 Tenung).
 *  5. Menguji rendering SSR komponen JodohSkeleton (Zero Layout Shift).
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

// ----------------------------------------------------------------------------
// BLOK 1: IMPORT MODUL-MODUL JODOH VIA VITE SSR
// ----------------------------------------------------------------------------
const { searchJodoh } = await server.ssrLoadModule('/src/features/jodoh/api/jodohApi.ts');
const { JodohHero } = await server.ssrLoadModule('/src/features/jodoh/components/JodohHero.tsx');
const { JodohFormSection } = await server.ssrLoadModule('/src/features/jodoh/components/JodohFormSection.tsx');
const { JodohResultSection } = await server.ssrLoadModule('/src/features/jodoh/components/JodohResultSection.tsx');
const { JodohResultSectionSkeleton, JodohSkeleton } = await server.ssrLoadModule('/src/features/jodoh/components/JodohSkeleton.tsx');

// ----------------------------------------------------------------------------
// BLOK 2: DATA MOCK RESMI SESUAI KONTRAK BACKEND GO & CONTOH PANDUAN
// ----------------------------------------------------------------------------
const mockJodohData = {
  diri: {
    nama: 'I Made Wijaya',
    tanggal_lahir: '2000-01-01',
    saptawara: 'Saniscara',
    pancawara: 'Umanis',
    sadwara: 'Paniron',
    weton: 'Saniscara Umanis',
    neptu: 14,
    urip_sadwara: 8,
  },
  pasangan: {
    nama: 'Ni Luh Putu Ayu',
    tanggal_lahir: '2000-01-01',
    saptawara: 'Saniscara',
    pancawara: 'Umanis',
    sadwara: 'Paniron',
    weton: 'Saniscara Umanis',
    neptu: 14,
    urip_sadwara: 8,
  },
  jatukarma: {
    nama_tenung: 'Tenung Jatukarma',
    sisa: 3,
    nama_hasil: 'Peta',
    keterangan: 'Sering bertengkar',
    nilai: 45,
  },
  urip_catur: {
    nama_tenung: 'Tenung Urip Catur',
    sisa: 4,
    nama_hasil: 'Punggel',
    keterangan: 'Kehilangan rejeki atau mati salah satu',
    nilai: 10,
  },
  urip_panca: {
    nama_tenung: 'Tenung Urip Panca',
    sisa: 3,
    nama_hasil: 'Lara',
    keterangan: 'Anggota rumah tangga dalam kesusahan atau kesulitan',
    nilai: 40,
  },
  tripramana: {
    nama_tenung: 'Tenung Tripramana',
    sisa: 12,
    nama_hasil: 'Sedana Nulus',
    keterangan: 'Sedana nulus, rezeki lancar/gampang',
    nilai: 85,
  },
  daftar_tenung: [
    {
      nama_tenung: 'Tenung Jatukarma',
      sisa: 3,
      nama_hasil: 'Peta',
      keterangan: 'Sering bertengkar',
      nilai: 45,
    },
    {
      nama_tenung: 'Tenung Urip Catur',
      sisa: 4,
      nama_hasil: 'Punggel',
      keterangan: 'Kehilangan rejeki atau mati salah satu',
      nilai: 10,
    },
    {
      nama_tenung: 'Tenung Urip Panca',
      sisa: 3,
      nama_hasil: 'Lara',
      keterangan: 'Anggota rumah tangga dalam kesusahan atau kesulitan',
      nilai: 40,
    },
    {
      nama_tenung: 'Tenung Tripramana',
      sisa: 12,
      nama_hasil: 'Sedana Nulus',
      keterangan: 'Sedana nulus, rezeki lancar/gampang',
      nilai: 85,
    },
  ],
  skor_akhir: 45.0,
  status_code: 'KURANG_BERJODOH',
  kesimpulan: 'Kurang Berjodoh',
  catatan_budaya:
    'Petenungan Pal Sri Sedana merupakan khazanah kearifan lokal Wariga Bali sebagai pedoman mawas diri dan saling memahami watak.',
  meta: {
    timezone: 'Asia/Makassar',
    tanggal_acuan: '2026-11-06',
    rule_version: 'jodoh-1.0.0',
    waktu_pergantian_hari: '06:00 WITA',
  },
};

// ----------------------------------------------------------------------------
// BLOK 3: UJI VALIDASI INPUT SISI KLIEN (jodohApi.ts)
// ----------------------------------------------------------------------------
test('jodohApi: validasi gagal jika tanggal lahir diri kosong', async () => {
  await assert.rejects(
    async () => {
      await searchJodoh({
        diri: { nama: 'Made', tanggal_lahir: '' },
        pasangan: { nama: 'Ayu', tanggal_lahir: '2000-01-01' },
      });
    },
    {
      name: 'Error',
      message: 'Tanggal lahir Anda wajib diisi.',
    }
  );
});

test('jodohApi: validasi gagal jika format tanggal lahir tidak sesuai ISO YYYY-MM-DD', async () => {
  await assert.rejects(
    async () => {
      await searchJodoh({
        diri: { nama: 'Made', tanggal_lahir: '01/01/2000' }, // Bukan YYYY-MM-DD
        pasangan: { nama: 'Ayu', tanggal_lahir: '2000-01-01' },
      });
    },
    {
      name: 'Error',
      message: 'Format tanggal lahir Anda harus YYYY-MM-DD.',
    }
  );
});

test('jodohApi: validasi gagal jika tanggal lahir pasangan kosong', async () => {
  await assert.rejects(
    async () => {
      await searchJodoh({
        diri: { nama: 'Made', tanggal_lahir: '2000-01-01' },
        pasangan: { nama: 'Ayu', tanggal_lahir: '' },
      });
    },
    {
      name: 'Error',
      message: 'Tanggal lahir pasangan wajib diisi.',
    }
  );
});

// ----------------------------------------------------------------------------
// BLOK 4: UJI RENDERING SSR KOMPONEN JodohHero
// ----------------------------------------------------------------------------
test('JodohHero: merender judul H1, breadcrumb, dan tombol panduan dengan benar', () => {
  const html = renderToString(React.createElement(JodohHero, { onOpenGuide: () => {} }));

  assert.ok(html.includes('Ramalan Jodoh'), 'Judul H1 Ramalan Jodoh harus dirender');
  assert.ok(html.includes('Petenungan Pal Sri Sedana'), 'Label budaya harus dirender');
  assert.ok(html.includes('Panduan Petenungan'), 'Tombol Panduan harus dirender');
  assert.ok(html.includes('Wargabali'), 'Breadcrumb harus memuat Wargabali');
});

// ----------------------------------------------------------------------------
// BLOK 5: UJI RENDERING SSR KOMPONEN JodohFormSection
// ----------------------------------------------------------------------------
test('JodohFormSection: merender form 2 kolom (Data Anda & Data Pasangan) serta tombol aksi', () => {
  const html = renderToString(
    React.createElement(JodohFormSection, {
      initialNamaDiri: 'I Made Wijaya',
      initialTanggalLahirDiri: '2000-01-01',
      initialNamaPasangan: 'Ni Luh Putu Ayu',
      initialTanggalLahirPasangan: '2000-01-01',
      onSubmit: () => {},
      onSwap: () => {},
      isLoading: false,
    })
  );

  assert.ok(html.includes('Data Anda'), 'Header kolom Data Anda harus dirender');
  assert.ok(html.includes('Data Pasangan'), 'Header kolom Data Pasangan harus dirender');
  assert.ok(html.includes('Tukar Posisi'), 'Tombol Tukar Posisi harus dirender');
  assert.ok(html.includes('Hitung Kecocokan'), 'Tombol Hitung Kecocokan harus dirender');
  assert.ok(html.includes('I Made Wijaya'), 'Input value Nama Diri harus terpasang');
  assert.ok(html.includes('Ni Luh Putu Ayu'), 'Input value Nama Pasangan harus terpasang');
});

// ----------------------------------------------------------------------------
// BLOK 6: UJI RENDERING SSR KOMPONEN JodohResultSection
// ----------------------------------------------------------------------------
test('JodohResultSection: merender nama pasangan, skor 45%, kesimpulan, dan 4 metode tenung', () => {
  const html = renderToString(
    React.createElement(JodohResultSection, {
      result: mockJodohData,
      onModifySearch: () => {},
    })
  );

  // Verifikasi nama dan skor
  assert.ok(html.includes('I Made Wijaya'), 'Nama Diri harus tampil di hasil');
  assert.ok(html.includes('Ni Luh Putu Ayu'), 'Nama Pasangan harus tampil di hasil');
  assert.ok(html.includes('45%'), 'Skor persentase 45% harus tampil');
  assert.ok(html.includes('Kurang Berjodoh'), 'Badge kesimpulan Kurang Berjodoh harus tampil');

  // Verifikasi weton kedua pihak
  assert.ok(html.includes('Saniscara Umanis'), 'Weton Saniscara Umanis harus tampil');
  assert.ok(html.includes('14'), 'Neptu 14 harus tampil');

  // Verifikasi 4 metode tenung
  assert.ok(html.includes('Tenung Jatukarma'), 'Metode Jatukarma harus tampil');
  assert.ok(html.includes('Peta'), 'Arketipe Peta harus tampil');
  assert.ok(html.includes('Tenung Urip Catur'), 'Metode Urip Catur harus tampil');
  assert.ok(html.includes('Punggel'), 'Arketipe Punggel harus tampil');
  assert.ok(html.includes('Tenung Urip Panca'), 'Metode Urip Panca harus tampil');
  assert.ok(html.includes('Lara'), 'Arketipe Lara harus tampil');
  assert.ok(html.includes('Tenung Tripramana'), 'Metode Tripramana harus tampil');
  assert.ok(html.includes('Sedana Nulus'), 'Arketipe Sedana Nulus harus tampil');

  // Verifikasi tombol salin ringkasan & catatan budaya
  assert.ok(html.includes('Salin Ringkasan'), 'Tombol Salin Ringkasan harus ada');
  assert.ok(html.includes('Catatan Filosofis'), 'Box Catatan Filosofis harus ada');
});

// ----------------------------------------------------------------------------
// BLOK 7: UJI RENDERING SSR KOMPONEN SKELETON
// ----------------------------------------------------------------------------
test('JodohSkeleton: merender atribut aksesibilitas aria-busy untuk mencegah CLS', () => {
  const htmlSection = renderToString(React.createElement(JodohResultSectionSkeleton));
  assert.ok(htmlSection.includes('aria-busy="true"'), 'Result skeleton harus memiliki aria-busy');

  const htmlFull = renderToString(React.createElement(JodohSkeleton));
  assert.ok(htmlFull.includes('aria-busy="true"'), 'Full page skeleton harus memiliki aria-busy');
});

