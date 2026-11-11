import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  X,
  BookOpen,
  Heart,
  Calculator,
  Compass,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Scale,
} from 'lucide-react';
import { modalOverlayVariants, modalContentVariants } from '@/lib/animations';

/**
 * ============================================================================
 * PROPS: JodohGuideModalProps
 * ============================================================================
 */
interface JodohGuideModalProps {
  /** Menandai apakah modal dialog sedang terbuka */
  isOpen: boolean;
  /** Callback untuk menutup dialog modal */
  onClose: () => void;
}

/**
 * Tipe tab aktif di dalam modal panduan
 */
type GuideTab = 'panduan' | 'metode' | 'simulasi';

/**
 * ============================================================================
 * KOMPONEN: JodohGuideModal (Modal Dialog Panduan Petenungan Jodoh)
 * ============================================================================
 * Menyajikan panduan lengkap mengenai cara kerja, istilah, 4 metode perhitungan,
 * dan simulasi contoh Ramalan Jodoh Pal Sri Sedana.
 *
 * Menerapkan Standar AGENTS.md Bagian 4 Poin 6 & 7:
 *  1. createPortal(..., document.body) dengan z-index z-[100].
 *  2. Backdrop: fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4.
 *  3. Wadah Dialog: bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl max-h-[90vh].
 *  4. Header: bg-gradient-to-r from-teal-50/60 via-slate-50/40 to-emerald-50/30 dengan tombol tutup X.
 *  5. Navigasi Tab Segmented: p-1 bg-slate-100 rounded-xl flex gap-1.
 *  6. Aksesibilitas: Kunci scroll body saat terbuka dan listener tombol Escape.
 * ============================================================================
 */
export const JodohGuideModal: React.FC<JodohGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('panduan');

  // -------------------------------------------------------------------------
  // BLOK 1: AKSESIBILITAS (ESCAPE LISTENER & KUNCI SCROLL BODY)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    // Kunci scroll halaman belakang
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Listener tombol Escape
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
      aria-labelledby="jodoh-guide-modal-title"
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-[100]"
    >
      {/* Backdrop Blur */}
          <motion.div
            key="jodoh-backdrop"
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          <motion.div
            key="jodoh-modal-content"
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
              id="jodoh-guide-modal-title"
              className="text-lg sm:text-xl font-extrabold text-[#0f172a] tracking-tight flex items-center gap-2"
            >
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500 shrink-0" />
              <span>Panduan Petenungan Jodoh</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Tata cara pengisian, istilah wariga, rumus perhitungan, dan simulasi Pal Sri Sedana.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Panduan"
            className="min-w-9 min-h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0 [touch-action:manipulation]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =================================================================== */}
        {/* BLOK 3: SEGMENTED TAB SWITCHER (AGENTS.md Bagian 4 Poin 6)           */}
        {/* =================================================================== */}
        <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-slate-100 bg-white shrink-0">
          <div className="p-1 bg-slate-100 rounded-xl flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('panduan')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2 px-3 rounded-lg transition-all cursor-pointer font-bold ${
                activeTab === 'panduan'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Cara Kerja & Skala</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('metode')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2 px-3 rounded-lg transition-all cursor-pointer font-bold ${
                activeTab === 'metode'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Istilah & 4 Metode</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('simulasi')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2 px-3 rounded-lg transition-all cursor-pointer font-bold ${
                activeTab === 'simulasi'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Simulasi Contoh</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* BLOK 4: SCROLLABLE BODY KONTEN TAB                                  */}
        {/* =================================================================== */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-sm text-slate-600 leading-relaxed">
          {/* TAB 1: PANDUAN CARA KERJA & SKALA HASIL */}
          {activeTab === 'panduan' && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              {/* Bagian 1. Tentang Fitur */}
              <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-4 space-y-3">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <Compass className="w-4 h-4 text-teal-600" />
                  <span>1. Tentang Fitur & Alur Evaluasi</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  Ramalan Jodoh menggunakan petenungan kuno <strong>Pal Sri Sedana</strong> untuk
                  menilai tingkat keselarasan dan keharmonisan antara dua insan berdasarkan
                  weton hari lahir masing-masing.
                </p>

                {/* Stepper Alur 3 Langkah */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 text-center space-y-1">
                    <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider block">
                      Langkah 1
                    </span>
                    <span className="text-xs font-bold text-slate-800 block">Input Data</span>
                    <span className="text-[11px] text-slate-500 block">
                      Isi nama & tanggal lahir kedua pihak
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 text-center space-y-1">
                    <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider block">
                      Langkah 2
                    </span>
                    <span className="text-xs font-bold text-slate-800 block">Proses Tenung</span>
                    <span className="text-[11px] text-slate-500 block">
                      Kalkulasi 4 metode Pal Sri Sedana
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 text-center space-y-1">
                    <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider block">
                      Langkah 3
                    </span>
                    <span className="text-xs font-bold text-slate-800 block">Baca Hasil</span>
                    <span className="text-[11px] text-slate-500 block">
                      Ringkasan skor & tafsir budaya
                    </span>
                  </div>
                </div>
              </div>

              {/* Bagian 2. Cara Mengisi */}
              <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <HelpCircle className="w-4 h-4 text-teal-600" />
                  <span>2. Langkah Pengisian Data</span>
                </div>
                <ul className="text-xs sm:text-sm text-slate-600 space-y-2 pl-4 list-decimal marker:text-teal-600 marker:font-bold">
                  <li>
                    <strong>Masukkan nama Anda dan nama pasangan:</strong> Nama berfungsi sebagai
                    label pengenal profil hasil analisis (opsional; jika kosong default-nya
                    &ldquo;Anda&rdquo; dan &ldquo;Pasangan&rdquo;).
                  </li>
                  <li>
                    <strong>Pilih tanggal lahir masing-masing secara tepat:</strong> Penanggalan
                    Bali bertumpu pada ketepatan hari kelahiran masehi (rentang tahun 1800 s.d.
                    2200).
                  </li>
                  <li>
                    <strong>Tekan tombol &ldquo;Hitung Kecocokan&rdquo;:</strong> Sistem akan
                    memproses 4 metode petenungan secara deterministik dan instan.
                  </li>
                </ul>
              </div>

              {/* Bagian 6. Cara Membaca Hasil & Skala Skor */}
              <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-4 space-y-3">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <Scale className="w-4 h-4 text-teal-600" />
                  <span>3. Skala Skor & Makna Kesimpulan</span>
                </div>
                <p className="text-xs text-slate-500">
                  Tingkat keselarasan ditentukan berdasarkan skor rata-rata keempat metode:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-900">
                        Skor &ge; 80% &middot; Sangat Berjodoh (Sangat Cocok)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                        Harmoni Tinggi
                      </span>
                    </div>
                    <p className="text-emerald-800/90 text-[11px] leading-relaxed">
                      Tingkat keharmonisan sangat tinggi, saling melengkapi karakter, dan membawa
                      ketenteraman serta keberkahan dalam berumah tangga.
                    </p>
                  </div>

                  <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-xl space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-teal-900">
                        Skor 60% s.d. &lt; 80% &middot; Berjodoh (Cocok)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full">
                        Harmonis
                      </span>
                    </div>
                    <p className="text-teal-800/90 text-[11px] leading-relaxed">
                      Hubungan harmonis, memiliki fondasi saling mendukung, rukun, dan membawa
                      kelancaran rezeki bersama.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-900">
                        Skor 30% s.d. &lt; 60% &middot; Kurang Berjodoh (Cukup Cocok)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                        Perlu Penyesuaian
                      </span>
                    </div>
                    <p className="text-amber-800/90 text-[11px] leading-relaxed">
                      Cukup seimbang, memerlukan sedikit penyesuaian watak, keterbukaan komunikasi,
                      dan saling memupuk pengertian.
                    </p>
                  </div>

                  <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-rose-900">
                        Skor &lt; 30% &middot; Tidak Berjodoh (Kurang Cocok)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full">
                        Perbedaan Karakter
                      </span>
                    </div>
                    <p className="text-rose-800/90 text-[11px] leading-relaxed">
                      Terdapat potensi perbedaan watak yang cukup menonjol. Dianjurkan saling
                      memupuk kesabaran, kedewasaan, dan mawas diri.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ISTILAH & 4 METODE TENUNG */}
          {activeTab === 'metode' && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              {/* Istilah Penting */}
              <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-4 space-y-3">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                  <span>Glosarium Istilah Wariga Jodoh</span>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                    <strong className="text-slate-900 block mb-0.5">Neptu:</strong>
                    <span className="text-slate-600 text-xs">
                      Jumlah urip Saptawara (7 hari) dan Pancawara (5 pasaran) pada hari kelahiran
                      seseorang (rentang nilai 7 s.d. 18).
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                    <strong className="text-slate-900 block mb-0.5">Urip Sadwara:</strong>
                    <span className="text-slate-600 text-xs">
                      Nilai siklus enam harian yang dipakai khusus pada metode Tripramana:
                      <em> Tungleh 7, Aryang 6, Urukung 5, Paniron 8, Was 9, Maulu 3</em>.
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                    <strong className="text-slate-900 block mb-0.5">Tenung:</strong>
                    <span className="text-slate-600 text-xs">
                      Metode perhitungan tradisional Wariga Bali untuk mengetahui kecenderungan
                      watak hubungan dan dinamika rumah tangga.
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                    <strong className="text-slate-900 block mb-0.5">Aturan Sisa Pembagian:</strong>
                    <span className="text-slate-600 text-xs">
                      Dalam tradisi petenungan Bali, jika sisa pembagian bernilai 0, maka dibaca
                      sebagai angka pembagi penuh. Contohnya, sisa 0 pada pembagi 5 dibaca sebagai 5.
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Metode Tenung */}
              <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-4 space-y-3">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <Calculator className="w-4 h-4 text-teal-600" />
                  <span>Rumus 4 Metode Petenungan</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">1. Tenung Jatukarma (Siklus 5)</span>
                      <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold">
                        Mod 5
                      </span>
                    </div>
                    <p className="text-slate-500 font-mono text-[11px]">
                      Rumus: (Neptu₁ + Neptu₂) % 5 (sisa 0 = 5)
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      Menilai aspek peruntungan sandang-pangan dan keharmonisan hidup bersama: Sri
                      (75), Gedong (90), Peta (45), Lara (25), Pati (10).
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">2. Tenung Urip Catur (Siklus 4)</span>
                      <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold">
                        Mod 4
                      </span>
                    </div>
                    <p className="text-slate-500 font-mono text-[11px]">
                      Rumus: (Neptu₁ + Neptu₂) % 4 (sisa 0 = 4)
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      Menilai aspek keturunan (sentana) dan kelangsungan rezeki: Gento (45), Gembili
                      (70), Sugih (85), Punggel (10).
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">3. Tenung Urip Panca (Siklus 5)</span>
                      <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold">
                        Mod 5
                      </span>
                    </div>
                    <p className="text-slate-500 font-mono text-[11px]">
                      Rumus: (Neptu₁ + Neptu₂) % 5 (sisa 0 = 5)
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      Menilai aspek derajat kedudukan dan martabat sosial: Sri (85), Dana (70), Lara
                      (40), Pati (15), Lungguh (75).
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">4. Tenung Tripramana (Siklus 16)</span>
                      <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold">
                        Mod 16
                      </span>
                    </div>
                    <p className="text-slate-500 font-mono text-[11px]">
                      Rumus: ((Neptu₁ + Sadwara₁) + (Neptu₂ + Sadwara₂)) % 16 (sisa 0 = 16)
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      Menilai kelancaran rezeki dan ketenteraman batin yang menggabungkan energi
                      siklus Sadwara.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIMULASI CONTOH NYATA */}
          {activeTab === 'simulasi' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-4 space-y-3">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Studi Kasus: Contoh Perhitungan Lengkap</span>
                </div>
                <p className="text-xs text-slate-500">
                  Berikut simulasi pasangan nyata sebagaimana tercantum dalam pedoman resmi:
                </p>

                {/* Profil 2 Orang */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-900 block">Orang 1</span>
                    <div className="text-slate-600 text-[11px] space-y-0.5">
                      <p>Neptu: <strong className="text-slate-900">12</strong></p>
                      <p>Sadwara: <strong className="text-slate-900">Aryang (Urip 6)</strong></p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-900 block">Orang 2</span>
                    <div className="text-slate-600 text-[11px] space-y-0.5">
                      <p>Neptu: <strong className="text-slate-900">13</strong></p>
                      <p>Sadwara: <strong className="text-slate-900">Maulu (Urip 3)</strong></p>
                    </div>
                  </div>
                </div>

                {/* Hasil 4 Tenung */}
                <div className="space-y-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">Jatukarma (12+13)%5 = 0 &rarr; 5</span>
                      <p className="text-[11px] text-slate-500">Hasil: Pati (Mati salah satu)</p>
                    </div>
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                      Skor: 10
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">Urip Catur (12+13)%4 = 1</span>
                      <p className="text-[11px] text-slate-500">Hasil: Gento / Sri</p>
                    </div>
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                      Skor: 45
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">Urip Panca (12+13)%5 = 0 &rarr; 5</span>
                      <p className="text-[11px] text-slate-500">Hasil: Lungguh / Satru</p>
                    </div>
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                      Skor: 75
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">Tripramana ((12+6)+(13+3))%16 = 2</span>
                      <p className="text-[11px] text-slate-500">Hasil: Mengku Kedatwan</p>
                    </div>
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                      Skor: 55
                    </span>
                  </div>
                </div>

                {/* Rata-rata Skor */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-900 text-xs">
                      Perhitungan Skor Rata-rata:
                    </span>
                    <span className="font-mono font-bold text-amber-900 text-sm">46.25%</span>
                  </div>
                  <p className="text-[11px] font-mono text-amber-800">
                    (10 + 45 + 75 + 55) / 4 = 46,25%
                  </p>
                  <p className="text-[11px] text-amber-800 font-semibold">
                    Kesimpulan: Cukup Cocok / Kurang Berjodoh
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* BLOK 5: FOOTER DIALOG DENGAN TOMBOL TUTUP                           */}
        {/* =================================================================== */}
        <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 [touch-action:manipulation] active:scale-98"
          >
            <span>Tutup Panduan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

