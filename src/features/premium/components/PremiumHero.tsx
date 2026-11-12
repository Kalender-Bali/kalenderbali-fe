import { hasActivePremium } from '@/lib/subscription';
import React from 'react';
import { Crown, Sparkles, History, ShieldCheck } from 'lucide-react';
import type { AuthUser } from '@/stores/useAuthStore';
import type { UserEntitlement } from '../types/premium.types';

/**
 * ==============================================================================
 * PROPS: PremiumHero
 * ==============================================================================
 */
interface PremiumHeroProps {
  user: AuthUser | null;
  activeSubscription?: UserEntitlement | null;
  onOpenHistory: () => void;
  isSubscriptionUnavailable?: boolean;
}

/**
 * ==============================================================================
 * KOMPONEN: PremiumHero (Header Halaman & Status Pengguna Aktif)
 * ==============================================================================
 * Mengikuti standar AGENTS.md Bagian 4.1:
 *  - Breadcrumb hierarkis standar: Wargabali / Layanan / Member Premium
 *  - Eyebrow: LANGGANAN & PREMIUM (teal Tirta Bali)
 *  - H1: Skala font terstruktur (text-2xl sm:text-3xl lg:text-4xl font-extrabold)
 *  - Menampilkan status langganan riil pengguna saat ini (Free vs Premium)
 * ==============================================================================
 */
export const PremiumHero: React.FC<PremiumHeroProps> = ({
  user,
  activeSubscription,
  onOpenHistory,
  isSubscriptionUnavailable = false,
}) => {
  // Evaluasi apakah user memiliki status premium aktif saat ini
  const isUserPremium = activeSubscription
    ? hasActivePremium({ isPremium: activeSubscription.is_premium, premiumExpiresAt: activeSubscription.active_until })
    : hasActivePremium(user);
  const subscriptionUnknown = Boolean(user) && (isSubscriptionUnavailable || (!activeSubscription && user?.subscriptionUnavailable));

  // Format tanggal kedaluwarsa langganan dengan tabular numbers
  const formattedExpiryDate = activeSubscription?.active_until
    ? new Date(activeSubscription.active_until).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : user?.premiumExpiresAt
    ? new Date(user.premiumExpiresAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* 1. BREADCRUMB NAVIGASI & JUDUL UTAMA HALAMAN                          */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          {/* Breadcrumb navigasi hierarkis */}
          <nav
            aria-label="Breadcrumb"
            className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-2 select-none"
          >
            <span>Wargabali</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span>Layanan</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-teal-700 dark:text-teal-400 font-bold">Member Premium</span>
          </nav>

          {/* Eyebrow Label Modul */}
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488] dark:text-teal-400 flex items-center gap-1.5">
            <Sparkles size={14} className="fill-[#0d9488]/20" /> LANGGANAN & PREMIUM
          </span>

          {/* Judul H1 Halaman */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] dark:text-white tracking-tight">
            Jadi Member Premium
          </h1>

          {/* Deskripsi ringkas halaman */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
            Tingkatkan keanggotaan Anda untuk menikmati akses lengkap tanpa batasan pada Wariga Personal, Kalender Bali, Ala Ayuning Dewasa, dan pengelolaan pura.
          </p>
        </div>

        {/* Tombol Aksi Cepat: Riwayat Transaksi (Jika sudah login) */}
        {user && (
          <div className="shrink-0">
            <button
              type="button"
              onClick={onOpenHistory}
              className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-95 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] shadow-2xs"
            >
              <History size={16} className="text-slate-500 dark:text-slate-400" />
              <span>Riwayat Transaksi</span>
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. KARTU STATUS AKUN AKTIF PENGGUNA (REAL TIME)                       */}
      {/* ===================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isUserPremium
                  ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              {isUserPremium ? <Crown size={22} /> : <ShieldCheck size={22} />}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  STATUS AKUN ANDA
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isUserPremium
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {subscriptionUnknown ? 'BELUM DAPAT DIPERIKSA' : isUserPremium ? 'MEMBER PREMIUM' : 'AKUN STANDAR (GRATIS)'}
                </span>
              </div>

              <p className="text-sm font-semibold text-[#0f172a] dark:text-white">
                {user ? user.name : 'Pengunjung Tamu'}
                {formattedExpiryDate && isUserPremium && !subscriptionUnknown && (
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-2">
                    • Aktif s.d.{' '}
                    <strong className="text-amber-700 dark:text-amber-400 tabular-nums">
                      {formattedExpiryDate}
                    </strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {subscriptionUnknown ? 'Status langganan belum berhasil diperbarui.' : isUserPremium
              ? 'Anda memiliki akses penuh ke seluruh fitur eksklusif.'
              : 'Tingkatkan paket untuk membuka seluruh fitur premium.'}
          </div>
        </div>
      </div>
    </div>
  );
};

