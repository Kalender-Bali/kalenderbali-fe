import React from 'react';
import { Sparkles, ArrowDown, Layers, CheckCircle2, TriangleAlert } from 'lucide-react';
import type { DewasaActivityGuidance, PadewasanItem, PawukonHarianInfo } from '../types/alaAyuning.types';
import { AlaAyuningPawukonSection } from './AlaAyuningPawukonSection';
import { getIndoDayName } from '@/features/kalender/utils/calendarUtils';
import { buildPracticalSummary } from '../utils/practicalSummary';

/**
 * ============================================================================
 * KOMPONEN: AlaAyuningSummaryCard (Ringkasan Hasil Padewasan)
 * ============================================================================
 * Kartu ini memakai daftar hasil yang sama dengan bagian rincian di bawahnya:
 *  1. Jumlah unsur aktif pada tanggal hasil pencarian.
 *  2. Kesimpulan praktis anjuran dan pantangan dari seluruh hasil tanggal pilihan.
 *  3. Tautan Aksi Cepat: "Lihat dasar perhitungan ↓" untuk melakukan smooth-scroll
 *     ke rincian grid padewasan aktif di bawah.
 *
 * Mengikuti Panduan AGENTS.md:
 *  - Wadah Card: bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs
 *  - Jumlah unsur bukan penilaian baik atau buruk untuk seluruh kegiatan.
 * ============================================================================
 */

interface AlaAyuningSummaryCardProps {
  activeDate: string;
  pawukonInfo: PawukonHarianInfo | null;
  /** Tanggal aktif terformat (contoh: "31 Oktober 2026") */
  formattedDate: string;

  /** Seluruh daftar padewasan aktif pada tanggal tersebut */
  padewasanList: PadewasanItem[];
  activityGuidance?: DewasaActivityGuidance[];

  /** Handler klik tombol "Lihat dasar perhitungan ↓" */
  onScrollToDasar?: () => void;
}

export const AlaAyuningSummaryCard: React.FC<AlaAyuningSummaryCardProps> = ({
  activeDate,
  pawukonInfo,
  formattedDate,
  padewasanList,
  activityGuidance,
  onScrollToDasar,
}) => {
  const summary = buildPracticalSummary(padewasanList, activityGuidance);

  return (
    <section aria-label="Ringkasan padewasan dan pawukon" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-white tracking-tight">
            <Sparkles className="w-5 h-5 text-[#0d9488] dark:text-teal-400 shrink-0" aria-hidden="true" />
            Ringkasan Padewasan
          </h3>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#e6f7f5] dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 tabular-nums">
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            {padewasanList.length} UNSUR AKTIF
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <time dateTime={activeDate} className="text-sm font-bold text-[#0f172a] dark:text-white tabular-nums">{formattedDate}</time>
          <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
          <span>{getIndoDayName(activeDate)} · WITA</span>
        </p>
        <AlaAyuningPawukonSection pawukonInfo={pawukonInfo} />
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <div className="space-y-3">
          <h4 className="text-sm sm:text-base font-bold text-[#0f172a] dark:text-white">
            Kesimpulan untuk tanggal ini
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed tabular-nums">
            {summary.overview}
          </p>
          {summary.recommended && (
            <div className="flex items-start gap-3 rounded-xl border not-dark:border-emerald-200/80 dark:border-teal-200 bg-linear-to-br from-emerald-50 via-teal-50 to-white dark:bg-none dark:bg-teal-50 p-4 sm:p-5">
              <div className="w-9 h-9 rounded-xl not-dark:bg-white/80 dark:bg-teal-50 border not-dark:border-emerald-200/60 dark:border-teal-200 flex items-center justify-center shrink-0 not-dark:text-emerald-700 dark:text-teal-300">
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 space-y-1.5">
                <h4 className="text-sm sm:text-base font-bold not-dark:text-emerald-800 dark:text-teal-300">Baik untuk</h4>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed break-words">{summary.recommended}</p>
              </div>
            </div>
          )}
          {summary.avoid && (
            <div className="flex items-start gap-3 rounded-xl border not-dark:border-amber-200/80 dark:border-amber-500/40 bg-linear-to-br from-amber-50 via-amber-50/60 to-white dark:bg-none dark:bg-amber-500/16 p-4 sm:p-5">
              <div className="w-9 h-9 rounded-xl not-dark:bg-white/80 dark:bg-amber-500/16 border not-dark:border-amber-200/60 dark:border-amber-500/40 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
                <TriangleAlert className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 space-y-1.5">
                <h4 className="text-sm sm:text-base font-bold text-amber-800 dark:text-amber-300">Sebaiknya ditunda</h4>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed break-words">{summary.avoid}</p>
              </div>
            </div>
          )}
          {summary.conflict && <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{summary.conflict}</p>}
        </div>
      </div>

      <div>
        {padewasanList.length > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2">
            {onScrollToDasar && (
              <button
                type="button"
                onClick={onScrollToDasar}
                className="min-h-11 inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 cursor-pointer transition-colors [touch-action:manipulation]"
              >
                Lihat rincian
                <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
