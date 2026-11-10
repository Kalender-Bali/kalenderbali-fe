import React, { useState } from 'react';
import {
  Heart,
  Share2,
  Check,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import type { JodohData, PetenunganItem, JodohStatusCode } from '../types/jodoh.types';

/**
 * ============================================================================
 * PROPS: JodohResultSectionProps
 * ============================================================================
 */
interface JodohResultSectionProps {
  /** Objek data hasil ramalan jodoh lengkap dari backend Go */
  result: JodohData;
  /** Callback opsional untuk mengarahkan scroll kembali ke form input */
  onModifySearch?: () => void;
}

/**
 * ============================================================================
 * HELPER: Format Tanggal Indonesia Sederhana
 * ============================================================================
 */
const BULAN_INDO = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatTanggalLahirIndo(isoDate: string): string {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${d} ${BULAN_INDO[m] || ''} ${y}`;
  }
  return isoDate;
}

/**
 * Menentukan konfigurasi warna berdasarkan status kode kecocokan
 */
function getStatusTheme(statusCode: JodohStatusCode, skor: number) {
  if (skor >= 80 || statusCode === 'SANGAT_BERJODOH') {
    return {
      textColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      borderCard: 'border-emerald-200/80',
      glowBg: 'from-emerald-500/10 via-transparent to-transparent',
      barColor: '#059669', // emerald-600
    };
  }
  if (skor >= 60 || statusCode === 'BERJODOH') {
    return {
      textColor: 'text-teal-700',
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
      borderCard: 'border-teal-200/80',
      glowBg: 'from-teal-500/10 via-transparent to-transparent',
      barColor: '#0d9488', // teal-600
    };
  }
  if (skor >= 30 || statusCode === 'KURANG_BERJODOH') {
    return {
      textColor: 'text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      borderCard: 'border-amber-200/80',
      glowBg: 'from-amber-500/10 via-transparent to-transparent',
      barColor: '#d97706', // amber-600
    };
  }
  return {
    textColor: 'text-rose-700',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    borderCard: 'border-rose-200/80',
    glowBg: 'from-rose-500/10 via-transparent to-transparent',
    barColor: '#e11d48', // rose-600
  };
}

/**
 * Menentukan label pilar fokus untuk masing-masing metode tenung
 */
function getPilarTenungLabel(namaTenung: string): string {
  const lower = namaTenung.toLowerCase();
  if (lower.includes('jatukarma')) return 'Sandang Pangan & Harmoni';
  if (lower.includes('catur')) return 'Keturunan & Sentana';
  if (lower.includes('panca')) return 'Kedudukan & Martabat';
  if (lower.includes('tripramana')) return 'Rezeki & Ketenangan';
  return 'Wariga Pal Sri Sedana';
}

/**
 * ============================================================================
 * KOMPONEN: JodohResultSection (Penyajian Hasil Perhitungan Ramalan Jodoh)
 * ============================================================================
 * Menampilkan ringkasan hasil analisis kecocokan secara elegan, modern, dan informatif:
 *  1. Hero Match Card:
 *     - Header nama pasangan berikon hati + tombol "Salin Ringkasan".
 *     - Kotak Skor Raksasa (text-5xl sm:text-6xl font-extrabold tabular-nums) & badge status.
 *     - Box Komparasi 2 Profil: Weton, Neptu, Sadwara Diri vs Pasangan.
 *  2. Grid 4 Metode Tenung:
 *     - Grid 2x2 desktop untuk Jatukarma, Urip Catur, Urip Panca, dan Tripramana.
 *     - Nama arketipe hasil, nilai numerik (0–100), progress bar, dan tafsir makna.
 *  3. Catatan Budaya Wariga:
 *     - Pesan etika kebijaksanaan tradisional dari server Go.
 * ============================================================================
 */
export const JodohResultSection: React.FC<JodohResultSectionProps> = ({
  result,
  onModifySearch,
}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const theme = getStatusTheme(result.status_code, result.skor_akhir);

  // -------------------------------------------------------------------------
  // BLOK 1: HANDLER SALIN RINGKASAN KE PAPAN KLIP (CLIPBOARD)
  // -------------------------------------------------------------------------
  const handleCopySummary = async () => {
    try {
      const summaryText = `Ramalan Jodoh (Pal Sri Sedana) · Kalender Bali
Pasangan: ${result.diri.nama} & ${result.pasangan.nama}
Skor Kecocokan: ${result.skor_akhir}% (${result.kesimpulan})

• ${result.diri.nama}: ${result.diri.weton} (Neptu ${result.diri.neptu}, Sadwara ${result.diri.sadwara})
• ${result.pasangan.nama}: ${result.pasangan.weton} (Neptu ${result.pasangan.neptu}, Sadwara ${result.pasangan.sadwara})

Rincian 4 Metode Tenung:
1. ${result.jatukarma.nama_tenung}: ${result.jatukarma.nama_hasil} (Skor ${result.jatukarma.nilai}) - ${result.jatukarma.keterangan}
2. ${result.urip_catur.nama_tenung}: ${result.urip_catur.nama_hasil} (Skor ${result.urip_catur.nilai}) - ${result.urip_catur.keterangan}
3. ${result.urip_panca.nama_tenung}: ${result.urip_panca.nama_hasil} (Skor ${result.urip_panca.nilai}) - ${result.urip_panca.keterangan}
4. ${result.tripramana.nama_tenung}: ${result.tripramana.nama_hasil} (Skor ${result.tripramana.nilai}) - ${result.tripramana.keterangan}

Cek selengkapnya di: ${window.location.href}`;

      await navigator.clipboard.writeText(summaryText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback jika API clipboard diblokir browser
      setIsCopied(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* =================================================================== */}
      {/* BLOK 2: HERO MATCH OVERVIEW CARD (RINGKASAN UTAMA)                  */}
      {/* =================================================================== */}
      <div
        className={`bg-white rounded-2xl border ${theme.borderCard} p-5 sm:p-7 shadow-xs relative overflow-hidden`}
      >
        {/* Aksen gradasi halus di sudut atas */}
        <div
          className={`absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl ${theme.glowBg} pointer-events-none rounded-tr-2xl`}
        />

        {/* Baris Atas: Judul Pasangan & Aksi Salin */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-500 shadow-2xs shrink-0">
              <Heart className="w-5 h-5 fill-rose-500/30 text-rose-600" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block">
                Hasil Analisis Perjodohan
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
                {result.diri.nama} <span className="text-rose-500 font-normal">&amp;</span> {result.pasangan.nama}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tombol Salin Ringkasan */}
            <button
              type="button"
              onClick={handleCopySummary}
              aria-label="Salin ringkasan ramalan jodoh"
              className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 [touch-action:manipulation] shadow-2xs"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Ringkasan Tersalin!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-500" />
                  <span>Salin Ringkasan</span>
                </>
              )}
            </button>

            {/* Tombol Ubah Data */}
            {onModifySearch && (
              <button
                type="button"
                onClick={onModifySearch}
                className="h-10 px-3 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer [touch-action:manipulation]"
              >
                <span>Ubah</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Baris Tengah: Tampilan Metrik Skor Raksasa */}
        <div className="py-6 text-center space-y-2 relative z-10">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
            Skor Keselarasan Pal Sri Sedana
          </span>

          <div className="inline-block p-4 sm:p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 shadow-2xs space-y-2">
            <span
              className={`text-5xl sm:text-6xl font-extrabold tabular-nums tracking-tight block ${theme.textColor}`}
            >
              {result.skor_akhir % 1 === 0
                ? `${result.skor_akhir.toFixed(0)}%`
                : `${result.skor_akhir.toFixed(1)}%`}
            </span>

            <span
              className={`inline-block text-xs font-extrabold px-3 py-1 rounded-full border ${theme.badgeBg}`}
            >
              {result.kesimpulan}
            </span>
          </div>

          <p className="text-xs text-slate-500 max-w-md mx-auto pt-1 font-medium">
            Rata-rata kumulatif dari 4 pilar petenungan kuno penanggalan Bali.
          </p>
        </div>

        {/* ================================================================= */}
        {/* BLOK 3: DUA BOX KOMPARASI PROFIL (DATA DIRI VS DATA PASANGAN)      */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 relative z-10">
          {/* BOX PROFIL 1: DIRI */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#f8fafc] border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50">
                Data Diri
              </span>
              <span className="text-[11px] font-mono text-slate-400">Pihak 1</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#0f172a] truncate">
                {result.diri.nama}
              </h3>
              <p className="text-xs text-slate-500">
                Lahir: {formatTanggalLahirIndo(result.diri.tanggal_lahir)}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/70 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Weton Kelahiran</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                  {result.diri.weton}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nilai Neptu</span>
                <span className="font-extrabold text-[#0f172a] tabular-nums">
                  {result.diri.neptu}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sadwara (Urip)</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {result.diri.sadwara} (Urip {result.diri.urip_sadwara})
                </span>
              </div>
            </div>
          </div>

          {/* BOX PROFIL 2: PASANGAN */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#f8fafc] border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/50">
                Data Pasangan
              </span>
              <span className="text-[11px] font-mono text-slate-400">Pihak 2</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#0f172a] truncate">
                {result.pasangan.nama}
              </h3>
              <p className="text-xs text-slate-500">
                Lahir: {formatTanggalLahirIndo(result.pasangan.tanggal_lahir)}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/70 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Weton Kelahiran</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                  {result.pasangan.weton}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nilai Neptu</span>
                <span className="font-extrabold text-[#0f172a] tabular-nums">
                  {result.pasangan.neptu}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sadwara (Urip)</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {result.pasangan.sadwara} (Urip {result.pasangan.urip_sadwara})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* BLOK 4: GRID 4 METODE PETENUNGAN (PAL SRI SEDANA)                   */}
      {/* =================================================================== */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0f172a] tracking-tight">
              Rincian 4 Metode Tenung
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Hasil komputasi mandiri dari 4 pilar petenungan tradisi Bali
            </p>
          </div>
          <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/60 hidden sm:inline-block">
            4 Pilar Tenung
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.daftar_tenung.map((item: PetenunganItem, index: number) => {
            const pilarLabel = getPilarTenungLabel(item.nama_tenung);

            return (
              <div
                key={item.nama_tenung || index}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3 hover:border-teal-500/40 hover:shadow-sm transition-all"
              >
                {/* Header Kartu Tenung */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50/80 px-2 py-0.5 rounded border border-teal-200/50 block w-fit mb-1">
                      {pilarLabel}
                    </span>
                    <h3 className="text-base font-bold text-[#0f172a]">
                      {item.nama_tenung}
                    </h3>
                  </div>

                  <span className="text-xs font-mono font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/60 shrink-0">
                    Nilai: {item.nilai}
                  </span>
                </div>

                {/* Arketipe Hasil & Keterangan */}
                <div className="space-y-1 pt-1">
                  {item.nama_hasil && (
                    <div className="flex items-baseline gap-1.5 text-sm">
                      <span className="text-slate-400 font-medium text-xs">Hasil:</span>
                      <span className="font-extrabold text-[#0d9488] text-base">
                        {item.nama_hasil}
                      </span>
                      {item.sisa > 0 && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          (Sisa {item.sisa})
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.keterangan}
                  </p>
                </div>

                {/* Bar Persentase Mini */}
                <div className="pt-2">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, item.nilai))}%`,
                        backgroundColor:
                          item.nilai >= 70 ? '#0d9488' : item.nilai >= 40 ? '#d97706' : '#e11d48',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* BLOK 5: CATATAN BUDAYA & ETIKA WARIGA (CULTURAL WISDOM BOX)          */}
      {/* =================================================================== */}
      {result.catatan_budaya && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
            <Info className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Catatan Filosofis Petenungan Pal Sri Sedana</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {result.catatan_budaya}
          </p>
          <p className="text-[11px] text-slate-400 pt-1 font-medium">
            Aturan: {result.meta?.rule_version || 'jodoh-1.0.0'} &middot; Standar Waktu:{' '}
            {result.meta?.timezone || 'WITA'} (Pergantian hari:{' '}
            {result.meta?.waktu_pergantian_hari || '06:00 WITA'})
          </p>
        </div>
      )}
    </div>
  );
};

