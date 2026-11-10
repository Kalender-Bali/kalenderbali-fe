import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
  Share2,
  Edit3,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type { GarisHidupProfileResult } from '../types/garisHidup.types';

/**
 * ============================================================================
 * PROPS: GarisHidupResultSectionProps
 * ============================================================================
 */
interface GarisHidupResultSectionProps {
  /** Seluruh hasil komputasi dari backend Go (1 sampai 5 profil peserta) */
  results: GarisHidupProfileResult[];
  /** Indeks peserta yang sedang aktif dipilih pada tab */
  activeParticipantIndex: number;
  /** Callback untuk mengubah tab peserta aktif */
  onSelectParticipant: (index: number) => void;
  /** Callback opsional untuk scroll kembali ke form input */
  onModifySearch?: () => void;
}

/**
 * Format tanggal ISO (YYYY-MM-DD) ke bahasa Indonesia formal (DD Bulan YYYY)
 */
function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${day} ${months[monthIndex] || parts[1]} ${year}`;
}

/**
 * Menentukan konfigurasi gaya semantik resmi berdasarkan skor nilai (0 s/d 9)
 */
function getScoreStyling(nilai: number) {
  if (nilai <= 1) {
    return {
      text: 'text-rose-700',
      bg: 'bg-rose-50/80',
      border: 'border-rose-200',
      circleBg: 'bg-rose-600',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
      category: 'Masa Perjuangan',
    };
  }
  if (nilai <= 4) {
    return {
      text: 'text-teal-800',
      bg: 'bg-[#e6f7f5]',
      border: 'border-[#ccf0ea]',
      circleBg: 'bg-[#0e9f90]',
      badge: 'bg-teal-100 text-teal-800 border-teal-200',
      dot: 'bg-teal-500',
      category: 'Masa Stabil',
    };
  }
  return {
    text: 'text-emerald-800',
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-200',
    circleBg: 'bg-emerald-600',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    category: 'Masa Kejayaan',
  };
}

/**
 * ============================================================================
 * KOMPONEN: GarisHidupResultSection (Area Penyajian Hasil Analisis Lengkap)
 * ============================================================================
 * Menyajikan visualisasi komprehensif ramalan Pal Sri Sedana:
 *  1. Tab Pemilih Profil Multi-Peserta: Beralih antar peserta dalam 0 milidetik.
 *  2. Kartu Profil & Fase Saat Ini: Lingkaran metrik nilai, wewaran, dan fase aktif.
 *  3. Visualisasi Kurva Garis Hidup (Native SVG): Grafik fluktuasi rezeki (0–108 thn).
 *  4. Matriks Timeline 18 Siklus: Baris rincian usia lengkap dengan highlight periode aktif.
 *  5. Catatan Kearifan Budaya Pal Sri Sedana: Panduan mawas diri & kebijaksanaan hidup.
 * ============================================================================
 */
export const GarisHidupResultSection: React.FC<GarisHidupResultSectionProps> = ({
  results,
  activeParticipantIndex,
  onSelectParticipant,
  onModifySearch,
}) => {
  // Kontrol buka/tutup tabel lengkap 18 siklus
  const [isTimelineExpanded, setIsTimelineExpanded] = useState<boolean>(true);

  // Status feedback salin tautan
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  // Titik periode aktif yang sedang di-hover pada grafik SVG
  const [hoveredCycleIndex, setHoveredCycleIndex] = useState<number | null>(null);

  // Validasi keamanan batas data hasil
  if (!results || results.length === 0) return null;
  const currentResult = results[activeParticipantIndex] || results[0];

  const currentPhaseStyling = getScoreStyling(currentResult.periode_saat_ini.nilai);

  // -------------------------------------------------------------------------
  // HANDLER SALIN RINGKASAN
  // -------------------------------------------------------------------------
  const handleShare = async () => {
    const summary = `Garis Hidup Pal Sri Sedana · Kalender Bali\nNama: ${currentResult.nama} (${currentResult.umur} Tahun)\nWeton: ${currentResult.saptawara} ${currentResult.pancawara} (Urip: ${currentResult.urip})\nFase Saat Ini (${currentResult.periode_saat_ini.min_umur}–${currentResult.periode_saat_ini.max_umur} Thn): Nilai ${currentResult.periode_saat_ini.nilai} - ${currentResult.periode_saat_ini.keterangan.toUpperCase()}\n\nLihat selengkapnya di: ${window.location.href}`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(summary);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2500);
      }
    } catch {
      // Fallback diam
    }
  };

  // -------------------------------------------------------------------------
  // PERHITUNGAN KOORDINAT GRAFIK KURVA SVG NATIVE (720 x 200)
  // -------------------------------------------------------------------------
  const svgWidth = 720;
  const svgHeight = 200;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 45;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;
  const maxScore = 9;

  const periods = currentResult.seluruh_periode;
  const points = periods.map((period, i) => {
    const x = padLeft + (i / (periods.length - 1)) * chartW;
    const y = padTop + (1 - period.nilai / maxScore) * chartH;
    return { x, y, period, index: i };
  });

  // Membuat string path SVG kurva
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Membuat path kurva dengan area tertutup untuk warna gradien bawah
  const areaPath = `M ${points[0].x},${padTop + chartH} L ${points[0].x},${points[0].y} ${points
    .slice(1)
    .map((p) => `L ${p.x},${p.y}`)
    .join(' ')} L ${points[points.length - 1].x},${padTop + chartH} Z`;

  // Indeks periode saat ini pada array 18 periode
  const activeCycleIndex = periods.findIndex(
    (p) =>
      p.min_umur === currentResult.periode_saat_ini.min_umur &&
      p.max_umur === currentResult.periode_saat_ini.max_umur
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ===================================================================== */}
      {/* BLOK 1: TAB PEMILIH PROFIL PESERTA (JIKA MULTI-PESERTA)               */}
      {/* ===================================================================== */}
      {results.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between gap-3 pb-2.5 mb-2.5 border-b border-slate-100">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Pilih Profil Peserta ({results.length} Orang)
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Klik profil untuk melihat grafik dan rincian siklus masing-masing
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {results.map((res, idx) => {
              const isSelected = idx === activeParticipantIndex;
              const styling = getScoreStyling(res.periode_saat_ini.nilai);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectParticipant(idx)}
                  className={`h-11 px-4 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2.5 shrink-0 transition-all cursor-pointer [touch-action:manipulation] ${
                    isSelected
                      ? 'bg-[#0e9f90] text-white shadow-xs'
                      : 'bg-[#f8fafc] border border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span className="truncate max-w-[130px] sm:max-w-[180px]">
                    {res.nama}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded tabular-nums ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : `${styling.bg} ${styling.text} border ${styling.border}`
                    }`}
                  >
                    {res.umur} Thn · Nilai {res.periode_saat_ini.nilai}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* BLOK 2: KARTU PROFIL & FASE SAAT INI (HERO RESULT CARD)               */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Header Profil Peserta & Tombol Aksi */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#e6f7f5] border border-[#ccf0ea] text-teal-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
                  {currentResult.nama}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 tabular-nums">
                  {currentResult.umur} Tahun
                </span>
                {currentResult.melewati_batas_tabel && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    &gt; 108 Tahun
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lahir: {formatTanggalIndo(currentResult.tanggal_lahir)}</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="px-2 py-0.5 rounded-md bg-[#e6f7f5] text-teal-800 font-bold border border-teal-200/60">
                  {currentResult.saptawara}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#f0fdf4] text-emerald-800 font-bold border border-emerald-200/60">
                  {currentResult.pancawara}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200/60 tabular-nums">
                  Total Urip: {currentResult.urip}
                </span>
              </div>
            </div>
          </div>

          {/* Tombol Aksi (Salin & Ubah) */}
          <div className="flex items-center gap-2 shrink-0 self-start">
            <button
              type="button"
              onClick={handleShare}
              title="Salin Ringkasan Garis Hidup"
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer [touch-action:manipulation]"
            >
              {hasCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Bagikan</span>
                </>
              )}
            </button>

            {onModifySearch && (
              <button
                type="button"
                onClick={onModifySearch}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer [touch-action:manipulation]"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Ubah</span>
              </button>
            )}
          </div>
        </div>

        {/* Kotak Fase Saat Ini (Current Phase Highlight Box) */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border ${currentPhaseStyling.border} ${currentPhaseStyling.bg} space-y-2`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
              Fase Usia Saat Ini ({currentResult.periode_saat_ini.min_umur}–
              {currentResult.periode_saat_ini.max_umur} Tahun):
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/70 border border-slate-200/60 text-slate-700">
              {currentPhaseStyling.category}
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl ${currentPhaseStyling.circleBg} text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-xs tabular-nums`}
            >
              {currentResult.periode_saat_ini.nilai}
            </div>

            <div className="space-y-0.5 flex-1">
              <span
                className={`text-lg sm:text-xl font-extrabold uppercase tracking-tight block ${currentPhaseStyling.text}`}
              >
                {currentResult.periode_saat_ini.keterangan}
              </span>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {currentResult.periode_saat_ini.nilai <= 1 &&
                  'Masa perjuangan dan keprihatinan. Dianjurkan hidup berhemat, sabar, dan berhati-hati.'}
                {currentResult.periode_saat_ini.nilai >= 2 &&
                  currentResult.periode_saat_ini.nilai <= 4 &&
                  'Masa stabil dan berkembang. Perjalanan hidup berlangsung dengan kelancaran wajar.'}
                {currentResult.periode_saat_ini.nilai >= 5 &&
                  'Masa kejayaan dan kelimpahan rezeki. Saat yang mulia untuk memperkuat ikhtiar dan berdana punia.'}
              </p>
            </div>
          </div>
        </div>

        {/* Grid 2 Kolom: Fase Masa Lalu & Masa Depan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Box Masa Lalu */}
          <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200/70 space-y-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  currentResult.periode_lalu
                    ? getScoreStyling(currentResult.periode_lalu.nilai).dot
                    : 'bg-slate-300'
                }`}
              />
              <span className="text-xs font-bold text-slate-700">
                Masa Lalu{' '}
                {currentResult.periode_lalu &&
                  `(${currentResult.periode_lalu.min_umur}–${currentResult.periode_lalu.max_umur} Thn)`}
                :
              </span>
            </div>

            {currentResult.periode_lalu ? (
              <p className="text-xs text-slate-600 pl-4.5">
                <span className="font-bold text-[#0f172a]">
                  {currentResult.periode_lalu.keterangan}
                </span>{' '}
                <span className="text-slate-400">
                  (Nilai: {currentResult.periode_lalu.nilai})
                </span>
              </p>
            ) : (
              <p className="text-xs text-slate-400 pl-4.5 italic">
                Peserta masih berada di masa awal kehidupan.
              </p>
            )}
          </div>

          {/* Box Masa Depan */}
          <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200/70 space-y-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  currentResult.periode_depan
                    ? getScoreStyling(currentResult.periode_depan.nilai).dot
                    : 'bg-slate-300'
                }`}
              />
              <span className="text-xs font-bold text-slate-700">
                Masa Depan{' '}
                {currentResult.periode_depan &&
                  `(${currentResult.periode_depan.min_umur}–${currentResult.periode_depan.max_umur} Thn)`}
                :
              </span>
            </div>

            {currentResult.periode_depan ? (
              <p className="text-xs text-slate-600 pl-4.5">
                <span className="font-bold text-[#0f172a]">
                  {currentResult.periode_depan.keterangan}
                </span>{' '}
                <span className="text-slate-400">
                  (Nilai: {currentResult.periode_depan.nilai})
                </span>
              </p>
            ) : (
              <p className="text-xs text-slate-400 pl-4.5 italic">
                Telah melampaui rentang akhir tabel Pal Sri Sedana.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BLOK 3: VISUALISASI KURVA GARIS HIDUP (NATIVE SVG)                    */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
              Kurva Perjalanan Hidup (Pal Sri Sedana)
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Fluktuasi nilai rezeki (0–9) dari usia 0 s/d 108 tahun dalam siklus 6 tahunan.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0e9f90]" />
              <span>Kurva Rezeki</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-teal-200" />
              <span>Usia Saat Ini</span>
            </span>
          </div>
        </div>

        {/* Kanvas Grafik Kurva SVG Responsif */}
        <div className="relative w-full overflow-x-auto pb-2">
          <div className="min-w-[640px]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto select-none"
            >
              <defs>
                {/* Gradien Area Bawah Garis */}
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0e9f90" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#0e9f90" stopOpacity="0.0" />
                </linearGradient>

                {/* Filter Bayangan Halus */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow
                    dx="0"
                    dy="2"
                    stdDeviation="2"
                    floodColor="#0e9f90"
                    floodOpacity="0.3"
                  />
                </filter>
              </defs>

              {/* Garis Grid Horizontal (Nilai 0, 3, 6, 9) */}
              {[0, 3, 6, 9].map((val) => {
                const y = padTop + (1 - val / maxScore) * chartH;
                return (
                  <g key={val}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 font-mono font-bold"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area Terisi Gradien Lembut di Bawah Kurva */}
              <path d={areaPath} fill="url(#curveGradient)" />

              {/* Garis Kurva Utama Garis Hidup */}
              <polyline
                fill="none"
                stroke="#0e9f90"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                points={polylinePoints}
              />

              {/* Titik Koordinat (18 Titik Siklus) */}
              {points.map((pt) => {
                const isCurrent = pt.index === activeCycleIndex;
                const isHovered = pt.index === hoveredCycleIndex;

                return (
                  <g
                    key={pt.index}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredCycleIndex(pt.index)}
                    onMouseLeave={() => setHoveredCycleIndex(null)}
                  >
                    {/* Lingkaran Berdenyut untuk Titik Usia Saat Ini */}
                    {isCurrent && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="12"
                        className="fill-teal-400/30 animate-pulse"
                      />
                    )}

                    {/* Lingkaran Titik Asli */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isCurrent ? 6 : isHovered ? 5.5 : 4}
                      className={`${
                        isCurrent
                          ? 'fill-teal-700 stroke-white stroke-2'
                          : isHovered
                          ? 'fill-teal-600 stroke-white stroke-2'
                          : 'fill-white stroke-teal-600 stroke-2'
                      } transition-all`}
                    />

                    {/* Label Angka Nilai di Atas Titik */}
                    <text
                      x={pt.x}
                      y={pt.y - 8}
                      textAnchor="middle"
                      className={`text-[9px] font-bold ${
                        isCurrent
                          ? 'fill-teal-800 font-extrabold'
                          : 'fill-slate-500'
                      }`}
                    >
                      {pt.period.nilai}
                    </text>

                    {/* Label Rentang Usia di Sumbu X Bawah */}
                    <text
                      x={pt.x}
                      y={svgHeight - 12}
                      textAnchor="middle"
                      className={`text-[8.5px] font-mono ${
                        isCurrent
                          ? 'fill-teal-800 font-extrabold text-[9.5px]'
                          : 'fill-slate-400'
                      }`}
                    >
                      {pt.period.min_umur}y
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Banner Tooltip Interaktif Saat Titik Disorot */}
        {hoveredCycleIndex !== null && points[hoveredCycleIndex] && (
          <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs animate-in fade-in duration-100">
            <div className="space-y-0.5">
              <span className="font-bold text-teal-300">
                Usia {points[hoveredCycleIndex].period.min_umur}–
                {points[hoveredCycleIndex].period.max_umur} Tahun:
              </span>
              <p className="text-slate-300 capitalize">
                {points[hoveredCycleIndex].period.keterangan}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-teal-500/30 text-teal-300 font-bold tabular-nums">
              Nilai: {points[hoveredCycleIndex].period.nilai}
            </span>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* BLOK 4: DAFTAR RINCIAN LENGKAP 18 SIKLUS (0 S/D 108 TAHUN)           */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
              Perjalanan Hidup (18 Siklus)
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Rentang 6-tahunan ramalan Pal Sri Sedana dari usia 0 s/d 108 tahun.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsTimelineExpanded((prev) => !prev)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer [touch-action:manipulation]"
          >
            {isTimelineExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 text-slate-500" />
                <span>Tutup</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-slate-500" />
                <span>Lihat Semua</span>
              </>
            )}
          </button>
        </div>

        {/* Daftar Baris Siklus Usia */}
        {isTimelineExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {periods.map((period, idx) => {
              const isCurrent = idx === activeCycleIndex;
              const styling = getScoreStyling(period.nilai);

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                    isCurrent
                      ? 'bg-[#e6f7f5] border-teal-400 ring-2 ring-teal-200/60 shadow-2xs'
                      : 'bg-[#f8fafc] border-slate-200/70 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-200/70 text-slate-700 font-bold flex items-center justify-center text-xs tabular-nums shrink-0">
                      {idx + 1}
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold tabular-nums ${
                            isCurrent ? 'text-teal-900' : 'text-[#0f172a]'
                          }`}
                        >
                          {period.min_umur} – {period.max_umur} tahun
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-[#0e9f90] text-white">
                            Saat Ini
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 block capitalize">
                        {period.keterangan}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border tabular-nums shrink-0 ${styling.badge}`}
                  >
                    Nilai {period.nilai}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* BLOK 5: CATATAN KEARIFAN BUDAYA PAL SRI SEDANA                         */}
      {/* ===================================================================== */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-teal-800 text-xs sm:text-sm font-bold">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span>Kearifan Tradisi Pal Sri Sedana</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Dalam tradisi Wariga Hindu Bali, petenungan <strong>Pal Sri Sedana</strong> merupakan
          khazanah kearifan lokal yang digunakan sebagai pedoman mawas diri untuk memahami
          dinamika siklus naik-turun rezeki dan tantangan hidup, bukan takdir mutlak.
          Ketika berada di periode perjuangan (nilai 0–1), krama Bali dianjurkan senantiasa
          berhemat, bersabar, dan memperbanyak kebajikan. Sebaliknya, saat berada di fase
          kejayaan (nilai 5–9), dianjurkan memperkuat rasa syukur dan memperbanyak sedekah (dana punia).
        </p>
      </div>
    </div>
  );
};

