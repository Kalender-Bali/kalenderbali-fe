import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  X,
  BookOpen,
  TrendingUp,
  Calculator,
  ArrowRight,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import type { GarisHidupGuideTab } from '../types/garisHidup.types';
import { modalOverlayVariants, modalContentVariants } from '@/lib/animations';

/**
 * ============================================================================
 * PROPS: GarisHidupGuideModalProps
 * ============================================================================
 */
interface GarisHidupGuideModalProps {
  /** Menandai apakah dialog modal sedang terbuka */
  isOpen: boolean;
  /** Callback untuk menutup dialog modal */
  onClose: () => void;
}

/**
 * ============================================================================
 * KOMPONEN: GarisHidupGuideModal (Modal Dialog Panduan Garis Hidup)
 * ============================================================================
 * Menyajikan panduan lengkap mengenai filosofi, tata cara pengisian, istilah,
 * 4 langkah perhitungan, simulasi contoh Urip 12, dan interpretasi skala nilai
 * berdasarkan naskah Lontar Pal Sri Sedana.
 *
 * Menerapkan Standar AGENTS.md Bagian 4 Poin 6 & 7:
 *  1. createPortal(..., document.body) dengan z-index z-[100].
 *  2. Backdrop: fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4.
 *  3. Wadah Dialog: bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl max-h-[90vh].
 *  4. Header: bg-gradient-to-r from-teal-50/70 via-slate-50/40 to-emerald-50/40 dengan tombol tutup X.
 *  5. Navigasi Tab Segmented: p-1 bg-slate-100 rounded-xl flex gap-1.
 *  6. Aksesibilitas: Kunci scroll body saat terbuka dan listener tombol Escape.
 * ============================================================================
 */
export const GarisHidupGuideModal: React.FC<GarisHidupGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<GarisHidupGuideTab>('panduan');

  // =========================================================================
  // BLOK 1: AKSESIBILITAS (ESCAPE LISTENER & KUNCI SCROLL BODY)
  // =========================================================================
  useEffect(() => {
    if (!isOpen) return;

    // Kunci scroll halaman latar belakang
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Listener keyboard tombol Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="garis-hidup-guide-modal-title"
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[100]"
    >
      {/* Backdrop Blur */}
          <motion.div
            key="garis-hidup-backdrop"
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          <motion.div
            key="garis-hidup-modal"
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* =================================================================== */}
            {/* BLOK 2: HEADER MODAL DENGAN GRADASI HALUS & TOMBOL TUTUP X          */}
            {/* =================================================================== */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50/70 via-slate-50/40 to-emerald-50/40 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488]">
              <Sparkles className="w-3.5 h-3.5 text-[#0d9488]" />
              <span>Pedoman Budaya Wariga</span>
            </div>
            <h2
              id="garis-hidup-guide-modal-title"
              className="text-lg sm:text-xl font-extrabold text-[#0f172a] tracking-tight"
            >
              Panduan Garis Hidup (Pal Sri Sedana)
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Tata cara pengisian, istilah wariga, alur perhitungan, dan interpretasi siklus 6-tahunan.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Panduan"
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 active:scale-95 text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center shrink-0 cursor-pointer [touch-action:manipulation]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* =================================================================== */}
        {/* BLOK 3: SEGMENTED TAB SWITCHER (3 TAB)                              */}
        {/* =================================================================== */}
        <div className="p-1 bg-slate-100 rounded-xl flex gap-1 mx-5 sm:mx-6 mt-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('panduan')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer [touch-action:manipulation] ${
              activeTab === 'panduan'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Panduan & Alur
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('istilah')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer [touch-action:manipulation] ${
              activeTab === 'istilah'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Istilah & Rumus
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulasi')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer [touch-action:manipulation] ${
              activeTab === 'simulasi'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Simulasi & Baca Hasil
          </button>
        </div>

        {/* =================================================================== */}
        {/* BLOK 4: BADAN KONTEN SCROLLABLE                                     */}
        {/* =================================================================== */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm text-slate-700 leading-relaxed">
          {/* TAB 1: PANDUAN & ALUR KERJA */}
          {activeTab === 'panduan' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Seksi 1: Tentang Fitur */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0f172a]">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <span>1. Tentang Fitur Garis Hidup</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <strong>Garis Hidup</strong> adalah analisis fluktuasi perjalanan rezeki dan
                  pasang-surut kehidupan seseorang dalam siklus usia 6 tahunan berdasarkan
                  naskah lontar kuno <strong>Pal Sri Sedana</strong>. Siklus ini memberikan
                  peta proyeksi dinamika kehidupan dari masa kanak-kanak hingga usia senja (0 s/d 108 tahun).
                </p>

                {/* 3 Langkah Alur Kerja */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 block">
                      Tahap 1 · Input
                    </span>
                    <span className="text-xs font-bold text-slate-800 block">Isi Data Peserta</span>
                    <p className="text-[11px] text-slate-500">
                      Masukkan nama (opsional) dan pilih tanggal lahir Masehi (1 s/d 5 orang).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 block">
                      Tahap 2 · Proses
                    </span>
                    <span className="text-xs font-bold text-slate-800 block">Kalkulasi Pal Sri Sedana</span>
                    <p className="text-[11px] text-slate-500">
                      Sistem menghitung urip kelahiran, umur kanonik WITA, dan memetakan 18 siklus.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 block">
                      Tahap 3 · Hasil
                    </span>
                    <span className="text-xs font-bold text-slate-800 block">Baca Kurva & Rincian</span>
                    <p className="text-[11px] text-slate-500">
                      Pelajari fase saat ini, proyeksi masa depan, dan kurva pasang surut rezeki.
                    </p>
                  </div>
                </div>
              </div>

              {/* Seksi 2: Cara Mengisi */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0f172a]">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>2. Cara Mengisi Formulir</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-[#f8fafc] p-2.5 rounded-xl border border-slate-200/60">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      1
                    </span>
                    <span>
                      <strong>Nama (Opsional):</strong> Masukkan nama sebagai pengenal profil. Jika dikosongkan, sistem otomatis menamainya <em>"Anda"</em> (peserta tunggal) atau <em>"Profil N"</em> (multi-peserta).
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-[#f8fafc] p-2.5 rounded-xl border border-slate-200/60">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      2
                    </span>
                    <span>
                      <strong>Tanggal Lahir:</strong> Pilih tanggal lahir Masehi melalui pemilih tanggal yang tersedia. Gunakan pemilih tahun untuk melompat cepat ke tahun kelahiran lampau.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-[#f8fafc] p-2.5 rounded-xl border border-slate-200/60">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      3
                    </span>
                    <span>
                      <strong>Tambah Peserta (Opsional):</strong> Anda dapat menambahkan hingga maksimal 5 peserta untuk membandingkan perjalanan hidup anggota keluarga sekaligus.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-[#f8fafc] p-2.5 rounded-xl border border-slate-200/60">
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                      4
                    </span>
                    <span>
                      <strong>Hitung Garis Hidup:</strong> Tekan tombol utama untuk memproses grafik kurva dan tabel 18 periode usia.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ISTILAH & RUMUS PERHITUNGAN */}
          {activeTab === 'istilah' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Seksi 3: Istilah yang Digunakan */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0f172a]">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                  <span>3. Istilah Kunci dalam Garis Hidup</span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-3 bg-[#f8fafc] rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-xs font-bold text-[#0f172a] block">Urip Kelahiran</span>
                    <p className="text-xs text-slate-600">
                      Jumlah neptu kelahiran yang diperoleh dari penjumlahan nilai hari Saptawara (Redite: 5 s/d Saniscara: 9) dan Pancawara (Umanis: 5 s/d Kliwon: 8). Menghasilkan angka total antara <strong>7 sampai 18</strong>.
                    </p>
                  </div>

                  <div className="p-3 bg-[#f8fafc] rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-xs font-bold text-[#0f172a] block">Periode Usia (18 Siklus)</span>
                    <p className="text-xs text-slate-600">
                      Pembagian tahapan kehidupan setiap 6 tahun penuh, dimulai dari rentang 0–6 tahun, 7–12 tahun, 13–18 tahun, hingga 103–108 tahun.
                    </p>
                  </div>

                  <div className="p-3 bg-[#f8fafc] rounded-xl border border-slate-200/70 space-y-1">
                    <span className="text-xs font-bold text-[#0f172a] block">Tingkat Rezeki / Nilai (0 s/d 9)</span>
                    <p className="text-xs text-slate-600">
                      Skala angka 0 sampai 9 yang menggambarkan potensi kelancaran rezeki, kesehatan, kemudahan usaha, dan dinamika spiritual pada siklus tertentu.
                    </p>
                  </div>
                </div>
              </div>

              {/* Seksi 4: Cara Perhitungan */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0f172a]">
                  <Calculator className="w-4 h-4 text-teal-600" />
                  <span>4. Alur Penentuan Nilai Garis Hidup</span>
                </div>

                {/* Flow Stepper Alur Perhitungan */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block">Input Tanggal Lahir</span>
                      <span className="text-slate-500">Masehi (YYYY-MM-DD)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center text-slate-400">
                    <ArrowRight className="w-4 h-4 rotate-90" />
                  </div>

                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block">Hitung Total Urip</span>
                      <span className="text-slate-500">Urip Saptawara + Urip Pancawara (Rentang 7–18)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center text-slate-400">
                    <ArrowRight className="w-4 h-4 rotate-90" />
                  </div>

                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block">Tentukan Periode Usia Aktif</span>
                      <span className="text-slate-500">Hitung umur tahun penuh berdasarkan tanggal acuan WITA</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center text-slate-400">
                    <ArrowRight className="w-4 h-4 rotate-90" />
                  </div>

                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center shrink-0">
                      4
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block">Temukan Nilai pada Tabel Pal Sri Sedana</span>
                      <span className="text-slate-500">Pertemuan baris urip kelahiran dengan kolom 18 periode usia</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIMULASI & CARA MEMBACA HASIL */}
          {activeTab === 'simulasi' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Seksi 5: Contoh Sederhana */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0f172a]">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>5. Contoh Simulasi Pembacaan Tabel</span>
                </div>

                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/70 text-xs text-teal-900 space-y-1">
                  <span className="font-bold block">Studi Kasus Contoh:</span>
                  <p>
                    Seseorang memiliki <strong>Urip Kelahiran 12</strong> dan saat ini berusia <strong>27 tahun</strong> (berada pada rentang periode usia <strong>25–30 tahun</strong>).
                  </p>
                </div>

                {/* Visualisasi Bilah Nilai 6 Periode Awal Sesuai Gambar Mobile */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                    Contoh Fluktuasi Periode Awal (Urip 12):
                  </span>

                  {/* 0-6 tahun */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700">0–6 tahun</span>
                      <span className="text-rose-600 font-bold">Nilai 0 · kesakitan (penderitaan)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full w-[5%]" />
                    </div>
                  </div>

                  {/* 7-12 tahun */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700">7–12 tahun</span>
                      <span className="text-emerald-700 font-bold">Nilai 5 · hidup senang</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[55%]" />
                    </div>
                  </div>

                  {/* 13-18 tahun */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700">13–18 tahun</span>
                      <span className="text-amber-700 font-bold">Nilai 1 · penghasilan sedikit</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[12%]" />
                    </div>
                  </div>

                  {/* 19-24 tahun */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700">19–24 tahun</span>
                      <span className="text-rose-600 font-bold">Nilai 0 · kesakitan (penderitaan)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full w-[5%]" />
                    </div>
                  </div>

                  {/* 25-30 tahun (PERIODE CONTOH - HIGHLIGHTED) */}
                  <div className="p-3 bg-[#e6f7f5] rounded-xl border-2 border-[#0e9f90] space-y-1.5 shadow-2xs">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-teal-900">25–30 tahun</span>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#0e9f90] text-white">
                          Periode Contoh
                        </span>
                      </div>
                      <span className="text-teal-800 font-extrabold">Nilai 4 · baik sekali</span>
                    </div>
                    <div className="w-full bg-teal-200/60 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#0e9f90] h-full w-[44%]" />
                    </div>
                  </div>

                  {/* 31-36 tahun */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700">31–36 tahun</span>
                      <span className="text-rose-600 font-bold">Nilai 0 · kesakitan (penderitaan)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full w-[5%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seksi 6: Cara Membaca Hasil & Makna Skala Skor */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0f172a]">
                  <HelpCircle className="w-4 h-4 text-teal-600" />
                  <span>6. Cara Membaca Hasil & Panduan Skala Nilai</span>
                </div>

                <div className="space-y-2">
                  {/* Nilai 0-1 */}
                  <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200/80 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 font-extrabold flex items-center justify-center shrink-0 text-xs">
                      0–1
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <span className="font-bold text-rose-900 block">
                        Masa Perjuangan & Keprihatinan
                      </span>
                      <p className="text-rose-700 leading-relaxed">
                        Potensi ujian rezeki atau kesehatan. Dianjurkan hidup berhemat, mawas diri, memperbanyak kebajikan, dan berhati-hati dalam mengambil keputusan spekulatif.
                      </p>
                    </div>
                  </div>

                  {/* Nilai 2-4 */}
                  <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/80 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-extrabold flex items-center justify-center shrink-0 text-xs">
                      2–4
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <span className="font-bold text-teal-900 block">
                        Masa Stabil & Berkembang
                      </span>
                      <p className="text-teal-700 leading-relaxed">
                        Kehidupan berjalan dengan kelancaran wajar. Usaha dan ikhtiar mulai membuahkan hasil stabil, saat yang baik untuk menabung dan memperkuat pondasi keluarga.
                      </p>
                    </div>
                  </div>

                  {/* Nilai 5-9 */}
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center shrink-0 text-xs">
                      5–9
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <span className="font-bold text-emerald-900 block">
                        Masa Kejayaan & Keberlimpahan
                      </span>
                      <p className="text-emerald-700 leading-relaxed">
                        Puncak potensi rezeki, kemudahan karier, dan kesuksesan ikhtiar. Sangat dianjurkan untuk banyak berdana punia (berbagi rezeki) dan bersyukur.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2.5 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    Ramalan Pal Sri Sedana adalah sarana mawas diri dan motivasi persiapan hidup, bukan takdir mutlak yang membatasi ikhtiar manusia.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* BLOK 5: FOOTER MODAL DENGAN TOMBOL AKSI TUTUP                       */}
        {/* =================================================================== */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Tekan <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-600">Esc</kbd> untuk menutup
          </span>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all active:scale-98 cursor-pointer [touch-action:manipulation] ml-auto"
          >
            Tutup Panduan
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

