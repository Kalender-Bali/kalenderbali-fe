import { DataSkeleton } from '@/components/ui/DataSkeleton';
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { DewasaAyuDashboard } from '../types/dashboard.types';
import { formatFullIndoDate } from '@/features/kalender/utils/calendarUtils';
import { QueryErrorState } from '@/components/ui/QueryErrorState';

/**
 * ============================================================================
 * KOMPONEN: DashboardDewasaAyu (Baris 3 Kiri — Dewasa Ayu Hari Ini)
 * ============================================================================
 * Menampilkan konteks padewasan hari ini dalam zona WITA:
 *  - Latar Card: Gradient Teal Tirta Bali pekat (from-[#0e9f90] via-[#0c8e80] to-[#0a756a])
 *  - Baris Atas: Nama fitur dan tanggal hari ini
 *  - Headline: Ringkasan narasi petunjuk hari ini
 *  - Area Tengah: Pratinjau padewasan aktif beserta keterangan lengkapnya
 *  - Baris Bawah: Tautan "Lihat selengkapnya →" menuju ke /ala-ayuning-dewasa
 *
 * Mengikuti Aturan Desain AGENTS.md:
 *  - Target sentuh ergonomis min 44x44px dengan touch-action: manipulation
 *  - Efek glassmorphism halus (bg-white/10 hover:bg-white/15 backdrop-blur-xs)
 * ============================================================================
 */

interface DashboardDewasaAyuProps {
  data: DewasaAyuDashboard;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

export const DashboardDewasaAyu: React.FC<DashboardDewasaAyuProps> = ({ data, error, onRetry, isLoading }) => {
  if (isLoading) return <DataSkeleton label="Memuat petunjuk Dewasa Ayu..." className="h-72" />;

  if (error && onRetry) return <QueryErrorState title="Gagal memuat petunjuk Dewasa Ayu" error={error} onRetry={onRetry} />;

  // Memastikan hanya mengambil maksimal 3 item padewasan teratas sesuai instruksi
  const topThreeItems = (data.items || []).slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-[#0e9f90] via-[#0c8e80] to-[#0a756a] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/90 text-white rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col justify-between h-full dark:border dark:border-teal-500/25">
      {/* Ornamen dekorasi watermark halus di pojok kanan bawah */}
      <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/5 dark:bg-teal-500/10 rounded-full pointer-events-none blur-xl" />

      {/* =================================================================== */}
      {/* 1. BARIS ATAS: NAMA FITUR & STATUS RINGKASAN                        */}
      {/* =================================================================== */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          {/* Pill Nama Modul dengan ikon sparkle */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 dark:bg-teal-950/80 dark:border dark:border-teal-500/40 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles size={13} className="text-teal-200 dark:text-teal-300 shrink-0" />
            <span>DEWASA AYU HARI INI</span>
          </div>

          {/* Tanggal ringkasan tetap mengikuti hari ini WITA */}
          <div className="px-2.5 py-0.5 rounded-full bg-white/20 dark:bg-emerald-950/60 dark:border dark:border-emerald-500/30 backdrop-blur-xs text-white dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-widest">
            <time dateTime={data.tanggalISO} className="tabular-nums">{formatFullIndoDate(data.tanggalISO)}</time>
          </div>
        </div>

        {/* Konteks padewasan harian tanpa penilaian baik/buruk secara umum */}
        <p className="text-xs sm:text-sm text-teal-50/90 dark:text-slate-300 font-medium leading-snug mb-3 tabular-nums">
          {data.headline}
        </p>

        {/* ================================================================= */}
        {/* 2. AREA TENGAH: PRATINJAU PADEWASAN HARI INI                     */}
        {/* ================================================================= */}
        <div className="space-y-2.5">
          {topThreeItems.map((item) => (
            <Link
              key={item.id}
              to={data.actionUrl}
              className="block min-h-11 p-2.5 sm:p-3 rounded-xl bg-white/10 dark:bg-slate-800/80 hover:bg-white/15 dark:hover:bg-slate-800 border border-white/10 dark:border-slate-700/80 backdrop-blur-xs transition-all cursor-pointer group [touch-action:manipulation] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-teal-100 dark:group-hover:text-teal-300 transition-colors">
                  {item.nama}
                </h3>
                <span className="text-[9px] sm:text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-white/20 dark:bg-teal-950/90 dark:border dark:border-teal-700/60 text-white dark:text-teal-300 uppercase tracking-wider">
                  {item.tag}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-teal-100/80 dark:text-slate-300 font-medium whitespace-pre-line break-words mt-1">
                {item.keterangan}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. BARIS BAWAH: KETERANGAN SUMBER & TAUTAN SELENGKAPNYA             */}
      {/* =================================================================== */}
      <div className="flex items-center justify-between gap-3 pt-3 mt-4 border-t border-white/10 dark:border-slate-800">
        <span className="text-[11px] text-teal-100/70 dark:text-slate-400 font-medium">
          {data.total > topThreeItems.length
            ? <span className="tabular-nums">Menampilkan {topThreeItems.length} dari {data.total} padewasan</span>
            : 'Wariga harian'}
        </span>

        {/* Tautan Lihat Selengkapnya ke Halaman Ala Ayuning Dewasa */}
        <Link
          to={data.actionUrl}
          className="inline-flex min-h-11 items-center gap-1.5 text-xs font-bold text-white hover:text-teal-200 dark:text-teal-300 dark:hover:text-teal-200 transition-colors cursor-pointer [touch-action:manipulation] py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span>Lihat selengkapnya</span>
          <ArrowRight size={13} className="shrink-0" />
        </Link>
      </div>
    </div>
  );
};
