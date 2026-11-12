import React from 'react';
import { Sparkles, ArrowDown, ShieldCheck, Info } from 'lucide-react';
import type { PadewasanItem, DewasaActivityGuidance } from '../types/alaAyuning.types';
import { DewasaActivityPanel } from './DewasaActivityPanel';

/**
 * ============================================================================
 * KOMPONEN: AlaAyuningSummaryCard (Ringkasan Kualitas Hari Ini)
 * ============================================================================
 * Komponen kartu ringkasan di kolom kiri tengah (sesuai Gambar 3):
 *  1. Status Kualitas Hari: Badge semantik (BAIK, NETRAL, atau PERLU DIPERHATIKAN)
 *     yang bersumber resmi dari server Go.
 *  2. Headline Petunjuk Budaya: Ringkasan narasi petunjuk aktivitas hari ini.
 *  3. Pengelompokan Unsur Padewasan:
 *     - Unsur Utama (Alahing Sasih & Penanggal): Padewasan dengan bobot pengaruh tinggi.
 *     - Unsur Harian (Alahing Dauh & Wuku/Wara): Padewasan dengan pengaruh kondisional.
 *  4. Tautan Aksi Cepat: "Lihat dasar perhitungan ↓" untuk melakukan smooth-scroll
 *     ke rincian grid padewasan aktif di bawah.
 *
 * Mengikuti Panduan AGENTS.md:
 *  - Wadah Card: bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs
 *  - Badge semantik konsisten: emerald untuk baik, amber untuk netral, rose untuk larangan
 * ============================================================================
 */

interface AlaAyuningSummaryCardProps {
  /** Tanggal aktif terformat (contoh: "31 Oktober 2026") */
  formattedDate: string;

  /** Status kualitas hari dari server Go ("BAIK", "NETRAL", dll) */
  statusLabel?: string;

  /** Narasi ringkasan petunjuk hari ini dari server Go */
  headline?: string;

  /** Seluruh daftar padewasan aktif pada tanggal tersebut */
  padewasanList: PadewasanItem[];
  activityGuidance?: DewasaActivityGuidance[];

  /** Handler klik tombol "Lihat dasar perhitungan ↓" */
  onScrollToDasar?: () => void;
}

export const AlaAyuningSummaryCard: React.FC<AlaAyuningSummaryCardProps> = ({
  formattedDate,
  statusLabel = 'PER KEGIATAN',
  headline,
  padewasanList,
  activityGuidance,
  onScrollToDasar,
}) => {
  // Pisahkan padewasan ke dalam 2 kelompok resmi Alahing Dewasa
  const unsurUtama = padewasanList.filter(
    (p) => p.severity_code === '1' || p.severity_code === '2'
  );
  const unsurHarian = padewasanList.filter(
    (p) => p.severity_code === '3' || p.severity_code === '4' || !p.severity_code
  );

  // Penentuan gaya badge status kualitas hari
  const isBaik = statusLabel.toUpperCase() === 'BAIK';
  const badgeColorClass = isBaik
    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
      {/* ===================================================================== */}
      {/* BLOK 1: HEADER KARTU & STATUS BADGE                                   */}
      {/* ===================================================================== */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-white tracking-tight">
            Ringkasan Padewasan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Evaluasi pengaruh padewasan pada tanggal aktif
          </p>
        </div>

        {/* Badge Status Kualitas Hari */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border shadow-2xs ${badgeColorClass}`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{statusLabel}</span>
        </span>
      </div>

      {/* ===================================================================== */}
      {/* BLOK 2: NARASI HEADLINE & PETUNJUK HARI INI                           */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="flex items-start gap-3.5 p-4 rounded-xl bg-teal-50/70 dark:bg-slate-800/80 border border-teal-200/60 dark:border-slate-700/80">
          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-teal-200/80 dark:border-slate-700 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-5 h-5 text-[#0d9488] dark:text-teal-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-[#0f172a] dark:text-white">
              Pedoman Pelaksanaan Dewasa
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {headline ||
                'Makna padewasan bergantung pada kegiatan. Perhatikan anjuran dan pantangan pada rincian setiap unsur.'}
            </p>
          </div>
        </div>

        {activityGuidance && activityGuidance.length > 0 && (
          <DewasaActivityPanel activities={activityGuidance} id="summary-dewasa-activity" />
        )}

        {/* =================================================================== */}
        {/* BLOK 3: KLASIFIKASI UNSUR PADEWASAN RESMI (ALAHING DEWASA)          */}
        {/* =================================================================== */}
        <div className="space-y-3 pt-1">
          {/* Sub-blok A: Unsur Berpengaruh Kuat (Alahing Sasih & Penanggal) */}
          {unsurUtama.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest block">
                UNSUR BERPENGARUH UTAMA (ALAHING SASIH / PENANGGAL)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {unsurUtama.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{item.nama}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sub-blok B: Unsur Harian (Alahing Dauh & Wuku/Wara) */}
          {unsurHarian.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest block">
                UNSUR HARIAN (ALAHING DAUH / WUKU / PASARAN)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {unsurHarian.slice(0, 8).map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    <span>{item.nama}</span>
                  </span>
                ))}
                {unsurHarian.length > 8 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-bold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                    +{unsurHarian.length - 8} lainnya
                  </span>
                )}
              </div>
            </div>
          )}

          {padewasanList.length === 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center space-y-1">
              <Info className="w-5 h-5 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Tidak ada catatan khusus padewasan yang aktif pada tanggal ini.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BLOK 4: FOOTER KARTU & TAUTAN SMOOTH SCROLL                           */}
      {/* ===================================================================== */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>
          Berdasarkan <strong className="font-bold text-[#0f172a] tabular-nums">{padewasanList.length}</strong> unsur pada {formattedDate}
        </span>

        {onScrollToDasar && padewasanList.length > 0 && (
          <button
            type="button"
            onClick={onScrollToDasar}
            className="text-teal-700 hover:text-teal-900 font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Lihat rincian</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

