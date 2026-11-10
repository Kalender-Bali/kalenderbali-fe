import React from 'react';

/**
 * ============================================================================
 * KOMPONEN: JodohSkeleton & JodohResultSectionSkeleton
 * ============================================================================
 * Loading skeleton screen berdimensi presisi untuk mencegah pergeseran tata letak
 * (Cumulative Layout Shift / CLS = 0) saat data Ramalan Jodoh dimuat dari backend Go:
 *  1. JodohResultSectionSkeleton:
 *     - Hero Match Card: Nama pasangan, metrik persentase skor, dan 2 box profil.
 *     - Grid 4 Metode Tenung: 4 kartu berdimensi identik (grid 2x2).
 *     - Catatan Budaya Wariga: Box disclaimer filosofis.
 *  2. JodohSkeleton:
 *     - Fallback Suspense tingkat rute penuh saat berkas halaman sedang di-lazy load.
 *
 * Menerapkan Standar fe_strategy.md Bagian 8.3 & AGENTS.md Bagian 4 Poin 8:
 *  - Tone warna denyut: slate-200 / slate-100 dengan efek animate-pulse.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BLOK 1: SKELETON HASIL PERHITUNGAN (RESULT SECTION SKELETON)
// ----------------------------------------------------------------------------
/**
 * JodohResultSectionSkeleton dirender saat pengguna menekan tombol "Hitung Kecocokan"
 * dan TanStack Query sedang menunggu respons dari endpoint Go.
 */
export const JodohResultSectionSkeleton: React.FC = () => {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Sedang menghitung petenungan jodoh..."
    >
      {/* 1. HERO MATCH OVERVIEW CARD SKELETON */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Baris Atas: Judul Pasangan & Tombol Salin */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
            <div className="space-y-1.5">
              <div className="h-6 w-56 sm:w-72 bg-slate-200/80 rounded-lg" />
              <div className="h-3.5 w-40 bg-slate-100 rounded-md" />
            </div>
          </div>
          <div className="h-9 w-32 bg-slate-100 rounded-xl" />
        </div>

        {/* Baris Tengah: Kotak Skor Utama (Stat Counter Raksasa) */}
        <div className="py-4 text-center">
          <div className="inline-block p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/60 min-w-[200px] space-y-2">
            <div className="h-3 w-28 bg-slate-200/60 rounded mx-auto" />
            <div className="h-14 sm:h-16 w-36 bg-slate-200/90 rounded-xl mx-auto" />
            <div className="h-6 w-28 bg-slate-100 rounded-full mx-auto" />
          </div>
        </div>

        {/* Baris Bawah: Komparasi 2 Profil (Data Diri vs Data Pasangan) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Box Profil 1: Diri */}
          <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-200/70 rounded-md" />
              <div className="h-4 w-16 bg-slate-100 rounded-md" />
            </div>
            <div className="space-y-1.5">
              <div className="h-5 w-40 bg-slate-200/80 rounded-md" />
              <div className="h-3.5 w-28 bg-slate-100 rounded-md" />
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-100 rounded" />
                <div className="h-3 w-28 bg-slate-200/60 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-14 bg-slate-100 rounded" />
                <div className="h-3 w-12 bg-slate-200/60 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-100 rounded" />
                <div className="h-3 w-24 bg-slate-200/60 rounded" />
              </div>
            </div>
          </div>

          {/* Box Profil 2: Pasangan */}
          <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-slate-200/70 rounded-md" />
              <div className="h-4 w-16 bg-slate-100 rounded-md" />
            </div>
            <div className="space-y-1.5">
              <div className="h-5 w-44 bg-slate-200/80 rounded-md" />
              <div className="h-3.5 w-28 bg-slate-100 rounded-md" />
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-100 rounded" />
                <div className="h-3 w-28 bg-slate-200/60 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-14 bg-slate-100 rounded" />
                <div className="h-3 w-12 bg-slate-200/60 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-100 rounded" />
                <div className="h-3 w-24 bg-slate-200/60 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GRID 4 METODE PETENUNGAN SKELETON (GRID 2x2) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-64 bg-slate-200/80 rounded-lg" />
          <div className="h-4 w-32 bg-slate-100 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3.5 shadow-xs"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-44 bg-slate-200/80 rounded-md" />
                <div className="h-5 w-16 bg-slate-100 rounded-full" />
              </div>
              <div className="h-4 w-32 bg-slate-200/60 rounded-md" />
              <div className="space-y-1.5 pt-1">
                <div className="h-3.5 w-full bg-slate-100 rounded" />
                <div className="h-3.5 w-4/5 bg-slate-100 rounded" />
              </div>
              {/* Progress bar shimmer */}
              <div className="h-2 w-full bg-slate-100 rounded-full pt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. CATATAN BUDAYA SKELETON */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-200/70" />
          <div className="h-4 w-48 bg-slate-200/70 rounded-md" />
        </div>
        <div className="space-y-1.5 pt-1">
          <div className="h-3.5 w-full bg-slate-100 rounded" />
          <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// BLOK 2: SKELETON HALAMAN LENGKAP (FULL PAGE SUSPENSE FALLBACK)
// ----------------------------------------------------------------------------
/**
 * JodohSkeleton digunakan sebagai fallback Suspense saat modul halaman Jodoh
 * sedang diunduh di latar belakang melalui React.lazy().
 */
export const JodohSkeleton: React.FC = () => {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Memuat modul Ramalan Jodoh..."
    >
      {/* 1. Header & Breadcrumb Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-4 w-44 bg-slate-200/70 rounded-md" />
          <div className="h-9 w-64 bg-slate-200/80 rounded-xl" />
          <div className="h-4 w-96 max-w-full bg-slate-200/60 rounded-md" />
        </div>
        <div className="h-11 w-44 bg-slate-100 rounded-xl shrink-0" />
      </div>

      {/* 2. Form Card 2 Kolom Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-4">
            <div className="h-5 w-32 bg-slate-200/70 rounded" />
            <div className="h-11 bg-white border border-slate-200 rounded-xl" />
            <div className="h-11 bg-white border border-slate-200 rounded-xl" />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-4">
            <div className="h-5 w-32 bg-slate-200/70 rounded" />
            <div className="h-11 bg-white border border-slate-200 rounded-xl" />
            <div className="h-11 bg-white border border-slate-200 rounded-xl" />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="h-11 w-32 bg-slate-100 rounded-xl" />
          <div className="h-11 w-40 bg-slate-200/80 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

