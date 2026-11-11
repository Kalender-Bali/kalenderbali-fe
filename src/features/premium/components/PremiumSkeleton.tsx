import React from 'react';

/**
 * ==============================================================================
 * KOMPONEN: PremiumSkeleton (Placeholder Dimensi Presisi untuk CLS = 0)
 * ==============================================================================
 * Sesuai pedoman fe_strategy.md 8.3:
 * Menggunakan denyut shimmer lembut dengan dimensi yang menyamai persis elemen
 * asli agar tidak terjadi pergeseran tata letak (Cumulative Layout Shift / CLS = 0).
 * ==============================================================================
 */
export const PremiumSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Memuat paket langganan">
      {/* 1. SKELETON HERO HEADER */}
      <div className="space-y-3">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-9 w-72 sm:w-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-4 w-full max-w-xl bg-slate-100 dark:bg-slate-800/60 rounded-md" />
      </div>

      {/* 2. SKELETON STATUS AKUN AKTIF */}
      <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800" />

      {/* 3. SKELETON 2 KARTU PAKET HARGA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {[1, 2].map((idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-10 w-44 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded-md" />
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 w-full bg-slate-100 dark:bg-slate-800/70 rounded-md" />
              ))}
            </div>
            <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        ))}
      </div>

      {/* 4. SKELETON GRID 4 KEUNTUNGAN */}
      <div className="space-y-4 pt-4">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-12 w-full bg-slate-100 dark:bg-slate-800/60 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

