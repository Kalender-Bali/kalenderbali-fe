import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Sparkles,
  CalendarCheck,
} from 'lucide-react';
import { usePengingat } from '@/features/pengingat/hooks/usePengingat';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { useAuthStore } from '@/stores/useAuthStore';
import type { PengingatEntry, PengingatKind } from '@/features/pengingat/types/pengingat.types';
import { formatReminderDate, getConditionLabel, getCountdown } from '@/features/pengingat/utils/pengingatUtils';
import { computeDaysDifference } from '../utils/dashboardUtils';

const EMPTY_REMINDERS: PengingatEntry[] = [];

/**
 * ============================================================================
 * KOMPONEN: DashboardPengingat (Baris 1 Kanan — Pengingat Terdekat H-7)
 * ============================================================================
 * Menampilkan agenda pengingat terdekat yang masuk dalam rentang H-7 (H-7 s.d. Hari H).
 *
 * Fitur & Karakteristik (Sesuai Arahan Pengguna):
 *  1. FILTER H-7: Menyeleksi pengingat aktif dengan 0 <= daysDiff <= 7.
 *  2. AUTO CAROUSEL: Jika terdapat 2 atau lebih pengingat yang memenuhi H-7,
 *     komponen otomatis berganti slide setiap 5 detik dengan transisi halus.
 *  3. KONTROL INTERAKTIF:
 *     - Berhenti sejenak (pause) saat kursor diarahkan (hover).
 *     - Tombol navigasi manual (sebelumnya & berikutnya).
 *     - Indikator dot untuk memilih slide langsung.
 *  4. STATE ANGGUN:
 *     - State kosong informatif jika belum ada pengingat pada H-7.
 *     - Tampilan ajakan masuk (login) jika pengguna belum terautentikasi.
 *  5. TAUTAN CEPAT: Tombol navigasi langsung ke halaman /pengingat.
 * ============================================================================
 */

interface DashboardPengingatProps {
  /** Tanggal hari ini zona WITA (format "YYYY-MM-DD") */
  todayDateISO: string;
}

/** Pemetaan gaya visual badge kategori pengingat */
const KIND_METADATA: Record<
  PengingatKind,
  { label: string; badgeStyle: string }
> = {
  otonan: {
    label: 'Otonan',
    badgeStyle:
      'bg-teal-50 text-teal-800 border-teal-200/80 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
  },
  piodalan: {
    label: 'Piodalan',
    badgeStyle:
      'bg-violet-50 text-violet-800 border-violet-200/80 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
  },
  'hari-raya': {
    label: 'Hari Raya',
    badgeStyle:
      'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  'mengatur-dewasa': {
    label: 'Dewasa Ayu',
    badgeStyle:
      'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
};

/** Penentu warna dan teks badge hitung mundur */
function getCountdownBadge(daysDiff: number): { text: string; badgeStyle: string } {
  if (daysDiff === 0) {
    return {
      text: 'HARI INI',
      badgeStyle:
        'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300',
    };
  }
  if (daysDiff === 1) {
    return {
      text: 'BESOK (H-1)',
      badgeStyle:
        'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300',
    };
  }
  return {
    text: `H-${daysDiff} (${daysDiff} HARI LAGI)`,
    badgeStyle:
      'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300',
  };
}

export const DashboardPengingat: React.FC<DashboardPengingatProps> = ({
  todayDateISO,
}) => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Konsumsi data pengingat dari TanStack Query hook
  const { data, isLoading, isError, error, refetch } = usePengingat();
  const reminders = data ?? EMPTY_REMINDERS;

  // State untuk auto carousel
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // ---------------------------------------------------------------------------
  // 1. FILTER PENGINGAT DALAM RENTANG H-7 (0 <= daysDiff <= 7)
  // ---------------------------------------------------------------------------
  const upcomingH7Reminders = useMemo(() => {
    if (!reminders || !Array.isArray(reminders)) return [];

    return reminders
      .map((r: PengingatEntry) => {
        const daysDiff = computeDaysDifference(r.nextDate, todayDateISO);
        return { ...r, daysDiff };
      })
      .filter((r) => r.daysDiff >= 0 && r.daysDiff <= 7)
      .sort((a, b) => a.daysDiff - b.daysDiff || a.title.localeCompare(b.title, 'id'));
  }, [reminders, todayDateISO]);

  // Cari pengingat masa depan terdekat jika belum ada yang masuk H-7
  const nextFutureReminder = useMemo(() => {
    if (!reminders || !Array.isArray(reminders)) return null;

    const futureList = reminders
      .map((r: PengingatEntry) => {
        const daysDiff = computeDaysDifference(r.nextDate, todayDateISO);
        return { ...r, daysDiff };
      })
      .filter((r) => r.daysDiff > 7)
      .sort((a, b) => a.daysDiff - b.daysDiff);

    return futureList[0] || null;
  }, [reminders, todayDateISO]);

  const totalH7Count = upcomingH7Reminders.length;
  // Pastikan indeks selalu berada dalam rentang valid tanpa sinkronisasi setState
  const safeIndex = totalH7Count > 0 ? currentIndex % totalH7Count : 0;

  // ---------------------------------------------------------------------------
  // 2. LOGIKA AUTO CAROUSEL (BERPUTAR TIAP 5 DETIK JIKA >= 2 ITEM)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (totalH7Count <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalH7Count);
    }, 5000);

    return () => clearInterval(interval);
  }, [totalH7Count, isPaused]);

  // Navigasi manual carousel
  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? totalH7Count - 1 : prev - 1));
  }, [totalH7Count]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % totalH7Count);
  }, [totalH7Count]);

  const activeReminder = upcomingH7Reminders[safeIndex];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col justify-between h-full transition-all"
    >
      <div className="space-y-4">
        {/* ================================================================= */}
        {/* HEADER ATAS: EYEBROW & KONTROL CAROUSEL                           */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-900/60 text-[#0e9f90] dark:text-teal-400 flex items-center justify-center shrink-0">
              <Bell className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0e9f90] dark:text-teal-400">
              PENGINGAT TERDEKAT (H-7)
            </span>
          </div>

          {/* Navigasi Slide & Indikator jika >= 2 Pengingat */}
          {totalH7Count > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Slide sebelumnya"
                className="w-7 h-7 rounded-lg bg-[#f8fafc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-teal-700 hover:border-teal-300 flex items-center justify-center cursor-pointer transition-colors [touch-action:manipulation]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 tabular-nums px-1">
                {currentIndex + 1}/{totalH7Count}
              </span>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Slide berikutnya"
                className="w-7 h-7 rounded-lg bg-[#f8fafc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-teal-700 hover:border-teal-300 flex items-center justify-center cursor-pointer transition-colors [touch-action:manipulation]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* KONTEN UTAMA: KARTU PENGINGAT (H-7) / EMPTY STATE                 */}
        {/* ================================================================= */}
        {isLoading && data === undefined ? (
          /* State Loading Skeleton */
          <div role="status" aria-label="Memuat pengingat" className="bg-[#f8fafc] dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 shadow-2xs space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-md" />
          </div>
        ) : !isAuthenticated ? (
          /* State Pengguna Belum Login */
          <div className="bg-[#f8fafc] dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 shadow-2xs text-center space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#0e9f90] dark:text-teal-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f172a] dark:text-white">
                Pantau Acara Penting Keluargamu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Masuk ke akun Anda untuk menyinkronkan pengingat Otonan, Piodalan, dan Hari Raya.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0e9f90] hover:bg-[#0c8a7d] text-white text-xs font-bold transition-all cursor-pointer [touch-action:manipulation]"
            >
              <span>Masuk Akun</span>
            </button>
          </div>
        ) : isError && data === undefined ? (
          <QueryErrorState title="Gagal memuat pengingat" error={error} onRetry={() => { void refetch(); }} />
        ) : totalH7Count > 0 && activeReminder ? (
          /* Slide Kartu Pengingat Aktif (H-7) */
          <div
            onClick={() => navigate('/pengingat')}
            className="bg-[#f8fafc] dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 shadow-2xs hover:border-teal-300 dark:hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group space-y-3"
            title="Klik untuk membuka detail di Pengingat"
          >
            {/* Baris Atas: Kategori Kind & Badge Countdown */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Badge Kategori Fitur */}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wide ${
                  KIND_METADATA[activeReminder.kind]?.badgeStyle ||
                  'bg-teal-50 text-teal-800 border-teal-200'
                }`}
              >
                {KIND_METADATA[activeReminder.kind]?.label || activeReminder.kind}
              </span>

              {/* Badge Hitung Mundur Sisa Hari */}
              {(() => {
                const { text, badgeStyle } = getCountdownBadge(activeReminder.daysDiff);
                return (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tabular-nums shadow-2xs ${badgeStyle}`}
                  >
                    {text}
                  </span>
                );
              })()}
            </div>

            {/* Judul Pengingat */}
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-white group-hover:text-[#0e9f90] transition-colors truncate">
                {activeReminder.title}
              </h3>

              {/* Penanggalan Kondisi (Pawukon/Sasih/Lahir) */}
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {getConditionLabel(activeReminder.condition)}
              </p>
            </div>

            {/* Tanggal & Waktu Pelaksanaan */}
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="tabular-nums font-semibold">
                  {formatReminderDate(activeReminder.nextDate)}
                </span>
              </div>

              {activeReminder.eventTime && (
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="tabular-nums">
                    {activeReminder.eventTime.replace(':', '.')} WITA
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* State Kosong (Belum ada yang masuk rentang H-7) */
          <div className="bg-[#f8fafc] dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 shadow-2xs text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-400 flex items-center justify-center mx-auto">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f172a] dark:text-white">
                Tidak ada pengingat dalam 7 hari ke depan
              </h3>
              {nextFutureReminder ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Pengingat terdekat:{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {nextFutureReminder.title}
                  </span>{' '}
                  ({getCountdown(nextFutureReminder.nextDate, todayDateISO)})
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Tambahkan jadwal otonan, piodalan, atau acara penting keluargamu.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* FOOTER BAWAH: INDIKATOR CAROUSEL & TAUTAN LIHAT SELENGKAPNYA       */}
      {/* =================================================================== */}
      <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
        {/* Indikator Titik Carousel jika >= 2 Pengingat */}
        {totalH7Count > 1 ? (
          <div className="flex items-center gap-1.5">
            {upcomingH7Reminders.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Beralih ke pengingat ke-${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-5 bg-[#0e9f90]'
                    : 'w-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                }`}
              />
            ))}
            <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1 hidden sm:inline">
              Auto carousel
            </span>
          </div>
        ) : (
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            {totalH7Count === 1 ? '1 Pengingat Terdekat' : 'Fitur Pengingat'}
          </span>
        )}

        {/* Tombol Tautan Menuju Halaman Pengingat */}
        <button
          type="button"
          onClick={() => navigate('/pengingat')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0d9488] dark:text-teal-400 hover:text-[#0c8a7d] transition-colors cursor-pointer [touch-action:manipulation] py-1"
        >
          <span>Buka pengingat</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
