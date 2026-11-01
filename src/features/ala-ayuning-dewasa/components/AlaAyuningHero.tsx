import React from 'react';

/**
 * ============================================================================
 * KOMPONEN: AlaAyuningHero (Header Halaman Ala Ayuning Dewasa)
 * ============================================================================
 * Komponen ini menyajikan bagian navigasi dan header atas halaman Ala Ayuning Dewasa,
 * mengikuti pola desain seragam halaman matang (OtonanHero, KeteranganHero):
 *  1. Breadcrumb navigasi hierarkis: Wargabali / Layanan / Ala Ayuning Dewasa
 *  2. Judul H1 halaman
 *  3. Deskripsi ringkas fungsi halaman
 *
 * Mengikuti Aturan AGENTS.md:
 *  - H1: text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight
 *  - Breadcrumb: text-xs font-semibold text-slate-400, segmen aktif text-teal-700 font-bold
 *  - Tata letak terbuka tanpa amplop card pembungkus luar
 * ============================================================================
 */

export const AlaAyuningHero: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      {/* ================================================================= */}
      {/* BLOK 1: Breadcrumb Navigasi & Judul H1 Halaman                    */}
      {/* ================================================================= */}
      <div className="space-y-1.5">
        {/* Breadcrumb navigasi hierarkis */}
        <nav
          aria-label="Breadcrumb"
          className="text-xs font-semibold text-slate-400 flex items-center gap-2 select-none"
        >
          <span>Wargabali</span>
          <span className="text-slate-300">/</span>
          <span>Layanan</span>
          <span className="text-slate-300">/</span>
          <span className="text-teal-700 font-bold">Ala Ayuning Dewasa</span>
        </nav>

        {/* Judul H1 Halaman */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
          Ala Ayuning Dewasa
        </h1>

        {/* Deskripsi ringkas fungsi halaman */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
          Panduan memilih waktu dan hari baik berdasarkan tradisi penanggalan Bali,
          perhitungan Pawukon, serta 220 kriteria Padewasan otentik.
        </p>
      </div>
    </div>
  );
};
