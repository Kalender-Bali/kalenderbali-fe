import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Moon, Layers, Compass, ArrowRight } from 'lucide-react';
import type { DashboardHeroData } from '../types/dashboard.types';

/**
 * ============================================================================
 * KOMPONEN: DashboardHero (Baris 1 Kiri — Banner Hero Penanggalan HARI INI)
 * ============================================================================
 * Menampilkan ringkasan komprehensif penanggalan Bali hari ini:
 *  1. Header atas: Eyebrow "HARI INI" dengan ikon kalender & badge Tahun Saka.
 *  2. Judul tanggal Masehi besar (tabular-nums) & baris wewaran lengkap.
 *  3. 3 Kotak statistik terstruktur rapi dengan ikon tematik (Sasih, Pawukon, Urip).
 *  4. Footer bawah selaras dengan card pengingat: ringkasan status padewasan &
 *     tautan navigasi cepat ke /kalender.
 *
 * Mengikuti Aturan Desain AGENTS.md:
 *  - Latar mint lembut: bg-[#eaf7f5] dengan border border-[#cbebe5]
 *  - Tipografi tabular-nums untuk angka tanggal dan urip
 * ============================================================================
 */

interface DashboardHeroProps {
  heroData: DashboardHeroData;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({ heroData }) => {
  return (
    <div className="bg-[#eaf7f5] dark:bg-slate-900 border border-[#cbebe5] dark:border-teal-500/20 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between h-full transition-all">
      <div className="space-y-4">
        {/* ================================================================= */}
        {/* 1. HEADER ATAS: EYEBROW & BADGE TAHUN SAKA / STATUS               */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-[#0e9f90] dark:text-teal-400 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0e9f90] dark:text-teal-400">
              HARI INI
            </span>
          </div>

          {heroData.tahunSaka ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-800 text-teal-800 dark:text-teal-300 border border-teal-200/70 dark:border-teal-700/60 shadow-2xs tabular-nums">
              Tahun Saka {heroData.tahunSaka}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-800 text-teal-800 dark:text-teal-300 border border-teal-200/70 dark:border-teal-700/60 shadow-2xs">
              WITA (UTC+8)
            </span>
          )}
        </div>

        {/* ================================================================= */}
        {/* 2. IDENTITAS TANGGAL & WEWARAN HARI INI                           */}
        {/* ================================================================= */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] dark:text-white tabular-nums tracking-tight">
            {heroData.tanggalFormatted}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
            {heroData.hariMasehi} · {heroData.saptawara} {heroData.pancawara} · Wuku {heroData.wuku}
          </p>
        </div>

        {/* ================================================================= */}
        {/* 3. STATISTIK TANGGAL: SASIH, PAWUKON, URIP                        */}
        {/* ================================================================= */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
          {/* KOTAK 1: SASIH & PENGLANTAKA */}
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest truncate">
                SASIH
              </span>
              <Moon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-white tracking-tight block truncate">
                {heroData.sasih}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium block truncate mt-0.5">
                {heroData.pengalantaka}
              </span>
            </div>
          </div>

          {/* KOTAK 2: PAWUKON & DINA KE- */}
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest truncate">
                PAWUKON
              </span>
              <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-white tracking-tight block truncate">
                {heroData.wuku}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium block truncate mt-0.5">
                Dina ka-{heroData.dinaKa ?? '-'}
              </span>
            </div>
          </div>

          {/* KOTAK 3: URIP & ARAH PENGIDER-IDER */}
          <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest truncate">
                URIP
              </span>
              <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-white tabular-nums tracking-tight block">
                {heroData.urip ?? '-'}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium block truncate capitalize mt-0.5">
                {heroData.arah}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. FOOTER BAWAH: STATUS PADEWASAN & TAUTAN KALENDER LENGKAP        */}
      {/* =================================================================== */}
      <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-teal-200/50 dark:border-teal-900/40">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
            {heroData.quoteHariIni || 'Informasi kalender & wewaran Bali'}
          </span>
        </div>

        <Link
          to="/kalender"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0d9488] dark:text-teal-400 hover:text-[#0c8a7d] transition-colors cursor-pointer shrink-0 [touch-action:manipulation] py-1"
        >
          <span>Buka kalender</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};
