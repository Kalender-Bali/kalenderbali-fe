import type { FC } from 'react';

/**
 * ==============================================================================
 * KOMPONEN: BhagawadGitaSkeleton (Pemuat Kerangka Dimensi Presisi)
 * ==============================================================================
 * Menyajikan Skeleton Screen yang dimensi lebar dan tingginya 100% identik
 * dengan struktur antarmuka asli saat data pertama kali ditarik dari API (Cold Start).
 *
 * Mencegah pergeseran tata letak (Cumulative Layout Shift / CLS = 0)
 * sesuai standar performa fe_strategy.md (Bab 8.3) dan AGENTS.md (Bagian 4.8).
 * ==============================================================================
 */

export const BhagawadGitaSkeleton: FC = () => {
  return (
    <div className="space-y-6 pb-12 animate-pulse select-none">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. SKELETON HEADER                                                     */}
      {/* ---------------------------------------------------------------------- */}
      <div className="space-y-2.5">
        <div className="h-4 w-36 bg-slate-200 rounded" />
        <div className="h-9 w-64 bg-slate-200 rounded-xl" />
        <div className="h-4 w-80 sm:w-96 bg-slate-100 rounded" />
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. SKELETON SEARCH BAR CONTAINER                                       */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Input Text Skeleton */}
        <div className="h-12 w-full bg-slate-100 rounded-xl border border-slate-200/60" />
        {/* Mode Toggle Buttons Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 bg-slate-100 rounded-lg" />
          <div className="h-9 w-40 bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. SKELETON SEGMENTED TAB SWITCHER                                     */}
      {/* ---------------------------------------------------------------------- */}
      <div className="h-11 w-80 bg-slate-100 rounded-xl border border-slate-200/40 p-1 flex gap-1">
        <div className="h-full w-1/3 bg-white rounded-lg shadow-2xs" />
        <div className="h-full w-1/3 bg-transparent rounded-lg" />
        <div className="h-full w-1/3 bg-transparent rounded-lg" />
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 4. SKELETON 3-COLUMN CARD GRID (6 KARTU BAB/TOPIK)                     */}
      {/* ---------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between h-[180px]"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/60 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-3 w-full bg-slate-100 rounded" />
                <div className="h-3 w-4/5 bg-slate-100 rounded" />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="h-5 w-20 bg-slate-100 rounded-full" />
              <div className="h-4 w-16 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
