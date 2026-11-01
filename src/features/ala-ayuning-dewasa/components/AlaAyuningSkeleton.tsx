import React from 'react';

/**
 * ============================================================================
 * KOMPONEN: AlaAyuningSkeleton (Loading State Presisi Dimensi - CLS = 0)
 * ============================================================================
 * Komponen skeleton loading yang mereplikasi dimensi dan tata letak asli
 * dari kartu ringkasan, kartu pawukon, dan grid padewasan aktif:
 *  1. Zero Layout Shift (CLS = 0): Lebar, tinggi, padding, dan struktur baris
 *     100% identik dengan kartu riil saat data selesai dimuat.
 *  2. Denyut Halus (animate-pulse) dengan palet abu-abu netral (bg-slate-100).
 *  3. Mencegah getaran layar saat transisi antara cold-start dan server state.
 *
 * Mengikuti Panduan fe_strategy.md Bagian 8.3 & AGENTS.md Bagian 4 Poin 8.
 * ============================================================================
 */

export const AlaAyuningSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse select-none" aria-busy="true" aria-label="Memuat data padewasan">
      {/* ===================================================================== */}
      {/* SKELETON 1: ROW TENGAH (RINGKASAN KIRI + PAWUKON KANAN)               */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Skeleton Summary Card (7 dari 12 Kolom) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-slate-200 rounded-lg" />
              <div className="h-3 w-56 bg-slate-100 rounded-md" />
            </div>
            <div className="h-6 w-20 bg-slate-200 rounded-full" />
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="h-4 w-48 bg-slate-200 rounded-md" />
            <div className="h-3 w-full bg-slate-100 rounded-md" />
            <div className="h-3 w-3/4 bg-slate-100 rounded-md" />
          </div>

          <div className="space-y-2 pt-1">
            <div className="h-3 w-36 bg-slate-200 rounded-md" />
            <div className="flex flex-wrap gap-2">
              <div className="h-7 w-28 bg-slate-100 rounded-lg" />
              <div className="h-7 w-32 bg-slate-100 rounded-lg" />
              <div className="h-7 w-24 bg-slate-100 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Skeleton Pawukon Card (5 dari 12 Kolom) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="h-5 w-36 bg-slate-200 rounded-lg" />
            <div className="h-5 w-12 bg-slate-100 rounded-md" />
          </div>

          <div className="flex items-baseline gap-3">
            <div className="h-10 w-12 bg-slate-200 rounded-xl" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-32 bg-slate-200 rounded-md" />
              <div className="h-3 w-40 bg-slate-100 rounded-md" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/70 p-3 bg-slate-50 space-y-2">
            <div className="h-5 bg-slate-100 rounded-md" />
            <div className="h-5 bg-slate-100 rounded-md" />
            <div className="h-5 bg-slate-100 rounded-md" />
            <div className="h-5 bg-slate-100 rounded-md" />
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SKELETON 2: ROW BAWAH (GRID 2-KOLOM DASAR ALA AYUNING)                */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-slate-200 rounded-lg" />
            <div className="h-3 w-64 bg-slate-100 rounded-md" />
          </div>
          <div className="h-6 w-28 bg-slate-200 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/60 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-200" />
                  <div className="h-4 w-28 bg-slate-200 rounded-md" />
                </div>
                <div className="h-4 w-20 bg-slate-200 rounded-md" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-slate-100 rounded-md" />
                <div className="h-3 w-5/6 bg-slate-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

