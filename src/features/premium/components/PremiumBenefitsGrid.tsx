import React from 'react';
import { Calendar, UserCheck, Landmark, TrendingUp } from 'lucide-react';
import { PREMIUM_BENEFITS } from '../constants/premiumBenefits';

/**
 * ==============================================================================
 * KOMPONEN: PremiumBenefitsGrid (4 Kartu Pilar Keunggulan Member)
 * ==============================================================================
 * Menyajikan transformasi visual modern dari teks keuntungan di website lama:
 *  - 4 Pilar Budaya: Kalender, Wariga Personal, Kelola Pura, & Garis Hidup
 *  - Mengikuti warna semantik AGENTS.md Bagian 3.C (Teal, Emerald, Amber, Violet)
 * ==============================================================================
 */
export const PremiumBenefitsGrid: React.FC = () => {
  // Pemetaan ikon & warna semantik sesuai kategori 4 pilar
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'kalender':
        return {
          icon: <Calendar size={20} />,
          badgeClass:
            'bg-teal-50 dark:bg-teal-950/60 text-[#0f766e] dark:text-teal-300 border-teal-200/70 dark:border-teal-800',
          iconBoxClass:
            'bg-teal-50 dark:bg-teal-950/50 text-[#0d9488] dark:text-teal-400 border-teal-200/60 dark:border-teal-800',
        };
      case 'wariga':
        return {
          icon: <UserCheck size={20} />,
          badgeClass:
            'bg-emerald-50 dark:bg-emerald-950/60 text-[#15803d] dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800',
          iconBoxClass:
            'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800',
        };
      case 'pura':
        return {
          icon: <Landmark size={20} />,
          badgeClass:
            'bg-amber-50 dark:bg-amber-950/60 text-[#b45309] dark:text-amber-300 border-amber-200/70 dark:border-amber-800',
          iconBoxClass:
            'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800',
        };
      case 'garis-hidup':
      default:
        return {
          icon: <TrendingUp size={20} />,
          badgeClass:
            'bg-violet-50 dark:bg-violet-950/60 text-[#6d28d9] dark:text-violet-300 border-violet-200/70 dark:border-violet-800',
          iconBoxClass:
            'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border-violet-200/60 dark:border-violet-800',
        };
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight">
          Keuntungan Menjadi Member
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Akses eksklusif di bawah ini akan terbuka seketika setelah pembayaran Anda berhasil diverifikasi.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PREMIUM_BENEFITS.map((item) => {
          const theme = getCategoryTheme(item.category);

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3 flex flex-col justify-between hover:border-teal-500/30 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${theme.iconBoxClass}`}
                  >
                    {theme.icon}
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${theme.badgeClass}`}
                  >
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-[#0f172a] dark:text-white tracking-tight leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs font-normal text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

