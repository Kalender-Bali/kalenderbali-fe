import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

/**
 * ============================================================================
 * PROPS: JodohHeroProps
 * ============================================================================
 */
interface JodohHeroProps {
  /** Callback untuk memicu dialog modal panduan petenungan terbuka */
  onOpenGuide: () => void;
}

/**
 * ============================================================================
 * KOMPONEN: JodohHero (Header Halaman Ramalan Jodoh)
 * ============================================================================
 * Komponen ini menyajikan bagian navigasi atas dan judul utama halaman Ramalan Jodoh.
 *
 * Menerapkan Standar AGENTS.md Bagian 4 Poin 1 & fe_strategy.md:
 *  1. Tata letak borderless terbuka tanpa amplop pembungkus ganda.
 *  2. Breadcrumb hierarkis: Wargabali / Layanan / Ramalan Jodoh.
 *  3. Judul H1 Halaman: "Ramalan Jodoh" (text-2xl sm:text-3xl lg:text-4xl font-extrabold).
 *  4. Deskripsi fungsi halaman yang rapi dan kontekstual terhadap tradisi Pal Sri Sedana.
 *  5. Tombol aksi cepat di sudut kanan untuk memicu Modal Panduan Petenungan Lengkap.
 * ============================================================================
 */
export const JodohHero: React.FC<JodohHeroProps> = ({ onOpenGuide }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      {/* ===================================================================== */}
      {/* BLOK 1: BREADCRUMB NAVIGASI & JUDUL H1 HALAMAN                        */}
      {/* ===================================================================== */}
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
          <span className="text-teal-700 font-bold">Ramalan Jodoh</span>
        </nav>

        {/* Eyebrow Label Budaya */}
        <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488]">
          <Sparkles className="w-3.5 h-3.5 text-[#0d9488]" />
          <span>Petenungan Pal Sri Sedana</span>
        </div>

        {/* Judul H1 Halaman */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
          Ramalan Jodoh
        </h1>

        {/* Deskripsi ringkas fungsi halaman */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
          Evaluasi keselarasan dan keharmonisan rumah tangga berdasarkan pertemuan
          weton kelahiran dua insan melalui 4 metode petenungan kuno Wariga Bali.
        </p>
      </div>

      {/* ===================================================================== */}
      {/* BLOK 2: TOMBOL AKSI CEPAT (PANDUAN PETENUNGAN)                        */}
      {/* ===================================================================== */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenGuide}
          aria-label="Buka Panduan Petenungan Jodoh"
          className="h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] shadow-2xs hover:border-teal-500/40"
        >
          <BookOpen className="w-4 h-4 text-teal-600" />
          <span>Panduan Petenungan</span>
        </button>
      </div>
    </div>
  );
};

