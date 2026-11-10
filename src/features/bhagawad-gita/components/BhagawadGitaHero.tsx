import type { FC } from 'react';

/**
 * ==============================================================================
 * KOMPONEN: BhagawadGitaHero (Header & Breadcrumb Standar Wargabali)
 * ==============================================================================
 * Mengimplementasikan header standar sesuai panduan AGENTS.md (Bagian 4.1):
 * 1. Breadcrumb navigasi hierarkis: Wargabali / Layanan / Bhagawad Gita
 * 2. Judul H1 (text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a])
 * 3. Deskripsi ringkas fungsi halaman
 * ==============================================================================
 */

export const BhagawadGitaHero: FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      {/* ---------------------------------------------------------------------- */}
      {/* Breadcrumb Navigasi Hierarkis & Judul H1 Halaman                       */}
      {/* ---------------------------------------------------------------------- */}
      <div className="space-y-1.5">
        {/* Breadcrumb Navigasi */}
        <nav
          aria-label="Breadcrumb"
          className="text-xs font-semibold text-slate-400 flex items-center gap-2 select-none"
        >
          <span>Wargabali</span>
          <span className="text-slate-300">/</span>
          <span>Layanan</span>
          <span className="text-slate-300">/</span>
          <span className="text-teal-700 font-bold">Bhagawad Gita</span>
        </nav>

        {/* Judul H1 Halaman Utama */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
          Bhagawad Gita
        </h1>

        {/* Deskripsi Ringkas Filosofi & Fungsi Layanan */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
          Nyanyian rohani Ilahi Sri Krishna kepada Arjuna di Medan Kurukshetra. Sumber petunjuk
          kebijaksanaan hidup, ketenangan jiwa, dan penegakan dharma sejati.
        </p>
      </div>
    </div>
  );
};
