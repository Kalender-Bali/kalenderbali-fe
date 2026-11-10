import React from 'react';
import { Compass } from 'lucide-react';
import type { PawukonHarianInfo } from '../types/alaAyuning.types';
import { parseISODate, getIndoMonthName } from '@/features/kalender/utils/calendarUtils';

/**
 * ============================================================================
 * KOMPONEN: AlaAyuningPawukonCard (Pawukon Hari Ini - WITA)
 * ============================================================================
 * Komponen kartu informasi penanggalan di kolom kanan tengah (sesuai Gambar 3):
 *  1. Header Kartu: Judul "Pawukon Hari Ini" dan badge lokasi resmi "WITA".
 *  2. Display Tanggal Besar: Tanggal Masehi besar, nama hari Saptawara, dan Sasih.
 *  3. Matriks 4 Dimensi Penanggalan Bali:
 *     - Wuku: Siklus 30 wuku (Sinta s.d. Watugunung).
 *     - Pancawara: Siklus 5 pasaran (Umanis, Paing, Pon, Wage, Kliwon).
 *     - Saptawara: Siklus 7 hari (Redite s.d. Saniscara).
 *     - Urip: Jumlah urip Saptawara + Pancawara (ber-tabular-nums).
 *  4. Footer: Catatan penjelas keselarasan kosmis penanggalan Bali.
 *
 * Mengikuti Panduan AGENTS.md:
 *  - Wadah Card: bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs
 *  - Tipografi: Angka besar text-3xl sm:text-4xl font-extrabold tabular-nums
 *  - Aksen Semantik 4 Pilar: Wuku (violet), Pancawara (emerald), Saptawara (teal), Sasih (amber)
 * ============================================================================
 */

interface AlaAyuningPawukonCardProps {
  /** Tanggal aktif "YYYY-MM-DD" */
  activeDate: string;

  /** Informasi pawukon harian dari server Go */
  pawukonInfo: PawukonHarianInfo | null;
}

export const AlaAyuningPawukonCard: React.FC<AlaAyuningPawukonCardProps> = ({
  activeDate,
  pawukonInfo,
}) => {
  // Format tampilan tanggal besar
  const { day, month, year } = parseISODate(activeDate);
  const monthName = getIndoMonthName(month);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
      {/* ===================================================================== */}
      {/* BLOK 1: HEADER KARTU & BADGE WILAYAH WITA                             */}
      {/* ===================================================================== */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-white tracking-tight flex items-center gap-2">
            <Compass className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Pawukon Hari Ini</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Dimensi kosmis kalender pembentuk sifat padewasan
          </p>
        </div>

        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-[#e6f7f5] dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 shadow-2xs">
          WITA
        </span>
      </div>

      {/* ===================================================================== */}
      {/* BLOK 2: DISPLAY TANGGAL BESAR & INFORMASI SASIH                       */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl sm:text-5xl font-extrabold text-[#0f172a] dark:text-white tabular-nums tracking-tight">
            {day}
          </span>
          <div>
            <span className="text-sm sm:text-base font-extrabold text-[#0f172a] dark:text-white uppercase tracking-wider block">
              {monthName} {year}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">
              {pawukonInfo?.hariBali || 'Hari Bali'} · {pawukonInfo?.sasih ? `Sasih ${pawukonInfo.sasih}` : 'Sasih Bali'}
            </span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* BLOK 3: TABEL 4 DIMENSI PAWUKON RESMI                               */}
        {/* =================================================================== */}
        <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-[#f8fafc] dark:bg-slate-800/60">
          {/* Baris Wuku */}
          <div className="flex items-center justify-between px-4 py-2.5 text-xs">
            <span className="font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest text-[11px]">
              Wuku
            </span>
            <span className="font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-md border border-violet-200/60 dark:border-violet-800/60">
              {pawukonInfo?.wuku || '-'}
            </span>
          </div>

          {/* Baris Pancawara */}
          <div className="flex items-center justify-between px-4 py-2.5 text-xs">
            <span className="font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest text-[11px]">
              Pancawara
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
              {pawukonInfo?.pancawara || '-'}
            </span>
          </div>

          {/* Baris Saptawara */}
          <div className="flex items-center justify-between px-4 py-2.5 text-xs">
            <span className="font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest text-[11px]">
              Saptawara
            </span>
            <span className="font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800/60">
              {pawukonInfo?.saptawara || '-'}
            </span>
          </div>

          {/* Baris Urip */}
          <div className="flex items-center justify-between px-4 py-2.5 text-xs">
            <span className="font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest text-[11px]">
              Urip (Neptu)
            </span>
            <span className="font-extrabold text-[#0f172a] dark:text-white tabular-nums text-sm">
              {pawukonInfo?.urip || 0}
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BLOK 4: FOOTER CATATAN KOSMIS                                         */}
      {/* ===================================================================== */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 font-medium">
        Kombinasi siklus Wuku dan Wewaran di atas menentukan kemunculan aturan padewasan hari ini.
      </div>
    </div>
  );
};
