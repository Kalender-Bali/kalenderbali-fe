import React from 'react';

/**
 * ============================================================================
 * KOMPONEN: GarisHidupSkeleton & GarisHidupResultSectionSkeleton
 * ============================================================================
 * Loading skeleton screen berdimensi presisi untuk mencegah pergeseran tata letak
 * (Cumulative Layout Shift / CLS = 0) saat data Garis Hidup dimuat dari backend Go:
 *  1. GarisHidupResultSectionSkeleton:
 *     - Tab Switcher: Tab pemilih profil peserta.
 *     - Kartu Profil & Fase Saat Ini: Nama, umur, wewaran, box fase saat ini,
 *       dan komparasi fase masa lalu & masa depan.
 *     - Grafik Kurva Garis Hidup: Kanvas grafik SVG berdimensi presisi.
 *     - Tabel 18 Siklus: Baris siklus usia 0 s/d 108 tahun.
 *  2. GarisHidupSkeleton:
 *     - Fallback Suspense tingkat rute penuh saat berkas halaman sedang di-lazy load.
 *
 * Menerapkan Standar fe_strategy.md Bagian 8.3 & AGENTS.md Bagian 4 Poin 8:
 *  - Tone warna denyut: slate-200 / slate-100 dengan efek animate-pulse.
 * ============================================================================
 */

// ============================================================================
// BLOK 1: SKELETON HASIL PERHITUNGAN (RESULT SECTION SKELETON)
// ============================================================================
/**
 * GarisHidupResultSectionSkeleton dirender saat pengguna menekan tombol
 * "Hitung Garis Hidup" dan TanStack Query sedang menunggu respons dari endpoint Go.
 */
export const GarisHidupResultSectionSkeleton: React.FC = () => {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Sedang menghitung garis hidup..."
    >
      {/* 1. SKELETON TAB PEMILIH PESERTA (JIKA MULTI-PESERTA) */}
      <div className="flex gap-2 pb-1 overflow-x-auto">
        <div className="h-10 w-36 bg-slate-200/80 rounded-xl shrink-0" />
        <div className="h-10 w-40 bg-slate-100 rounded-xl shrink-0" />
      </div>

      {/* 2. SKELETON KARTU PROFIL & FASE SAAT INI */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Header Profil Peserta */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 shrink-0" />
            <div className="space-y-1.5">
              <div className="h-6 w-48 sm:w-64 bg-slate-200/80 rounded-lg" />
              <div className="h-3.5 w-36 bg-slate-100 rounded-md" />
            </div>
          </div>
          <div className="h-8 w-28 bg-slate-100 rounded-lg hidden sm:block" />
        </div>

        {/* Kotak Fase Saat Ini (Highlight Box) */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2.5">
          <div className="h-3 w-32 bg-slate-200/70 rounded" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200/80 shrink-0" />
            <div className="space-y-1 flex-1">
              <div className="h-5 w-40 bg-slate-200/90 rounded" />
              <div className="h-3 w-28 bg-slate-100 rounded" />
            </div>
          </div>
        </div>

        {/* Grid 2 Kolom: Fase Masa Lalu & Masa Depan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200/60 flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-slate-200/80 shrink-0" />
            <div className="space-y-1 flex-1">
              <div className="h-3 w-24 bg-slate-200/70 rounded" />
              <div className="h-4 w-36 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200/60 flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-slate-200/80 shrink-0" />
            <div className="space-y-1 flex-1">
              <div className="h-3 w-24 bg-slate-200/70 rounded" />
              <div className="h-4 w-36 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. SKELETON GRAFIK KURVA GARIS HIDUP */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="space-y-1">
            <div className="h-5 w-48 bg-slate-200/80 rounded" />
            <div className="h-3 w-64 bg-slate-100 rounded" />
          </div>
          <div className="h-7 w-20 bg-slate-100 rounded-lg" />
        </div>
        {/* Kanvas Grafik Shimmer */}
        <div className="h-48 sm:h-56 w-full bg-slate-50 rounded-xl border border-slate-200/60 flex items-end justify-between p-4 gap-2">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="w-full bg-slate-200/70 rounded-t"
              style={{ height: `${20 + ((i * 17) % 65)}%` }}
            />
          ))}
        </div>
      </div>

      {/* 4. SKELETON TABEL 18 SIKLUS KEHIDUPAN */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="h-5 w-44 bg-slate-200/80 rounded" />
          <div className="h-4 w-20 bg-slate-100 rounded" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-11 w-full bg-slate-50 rounded-xl border border-slate-200/50 flex items-center px-4 justify-between"
            >
              <div className="h-3.5 w-28 bg-slate-200/70 rounded" />
              <div className="h-3.5 w-40 bg-slate-100 rounded hidden sm:block" />
              <div className="h-5 w-16 bg-slate-200/60 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// BLOK 2: SKELETON TINGKAT RUTE HALAMAN PENUH (PAGE SKELETON)
// ============================================================================
/**
 * GarisHidupSkeleton digunakan sebagai fallback Suspense pada AppRoutes.tsx
 * saat berkas GarisHidupPage sedang diunduh di latar belakang.
 */
export const GarisHidupSkeleton: React.FC = () => {
  return (
    <div
      className="space-y-6 pb-12 animate-pulse"
      aria-busy="true"
      aria-label="Sedang memuat modul garis hidup..."
    >
      {/* 1. Header Hero Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-40 bg-slate-200/60 rounded" />
          <div className="h-8 w-56 sm:w-72 bg-slate-200/90 rounded-lg" />
          <div className="h-4 w-80 sm:w-96 bg-slate-100 rounded" />
        </div>
        <div className="h-11 w-36 bg-slate-200/70 rounded-xl" />
      </div>

      {/* 2. Form Section Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="h-5 w-32 bg-slate-200/80 rounded" />
          <div className="h-8 w-28 bg-slate-100 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-11 w-full bg-slate-100 rounded-xl" />
          <div className="h-11 w-full bg-slate-100 rounded-xl" />
        </div>
        <div className="flex justify-end pt-2">
          <div className="h-11 w-44 bg-slate-200/80 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default GarisHidupSkeleton;

