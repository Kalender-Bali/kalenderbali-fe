import React, { useState } from 'react';
import {
  User,
  Heart,
  ArrowLeftRight,
  Sparkles,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { AestheticDatePicker } from '@/components/ui/AestheticDatePicker';
import type { JodohFormData } from '../types/jodoh.types';

/**
 * ============================================================================
 * PROPS: JodohFormSectionProps
 * ============================================================================
 */
interface JodohFormSectionProps {
  /** Nilai awal nama diri dari URL/state induk */
  initialNamaDiri?: string;
  /** Nilai awal tanggal lahir diri (YYYY-MM-DD) */
  initialTanggalLahirDiri?: string;
  /** Nilai awal nama pasangan dari URL/state induk */
  initialNamaPasangan?: string;
  /** Nilai awal tanggal lahir pasangan (YYYY-MM-DD) */
  initialTanggalLahirPasangan?: string;
  /** Callback saat form disubmit dengan data valid */
  onSubmit: (formData: JodohFormData) => void;
  /** Callback opsional saat tombol swap ditekan */
  onSwap?: () => void;
  /** Callback opsional saat tombol reset ditekan */
  onReset?: () => void;
  /** Status apakah sedang memuat data dari API */
  isLoading?: boolean;
}

/**
 * ============================================================================
 * KOMPONEN: JodohFormSection (Form Masukan 2 Kolom Berdampingan)
 * ============================================================================
 * Formulir masukan profil Diri dan Pasangan yang disesuaikan untuk standar Web:
 *  1. Layout Berdampingan (2 Kolom): Data Anda di kiri dan Data Pasangan di kanan,
 *     memberikan komparasi visual seimbang tanpa scrolling vertikal berlebih.
 *  2. Pemilih Tanggal Estetik (AestheticDatePicker): Menjamin keseragaman format
 *     tanggal (dd/mm/yyyy ➔ YYYY-MM-DD) dengan modul Otonan dan Ramalan Sifat.
 *  3. Fitur Tukar Posisi (Swap): Menukar data Diri ↔ Pasangan secara instan
 *     untuk membuktikan sifat simetris/komutatif petenungan Pal Sri Sedana.
 *  4. Standar Desain AGENTS.md:
 *     - Kontainer: bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs
 *     - Kontrol input: tinggi ergonomis h-11 (44px) dengan [touch-action:manipulation]
 *     - Tombol primer: bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a]
 * ============================================================================
 */
export const JodohFormSection: React.FC<JodohFormSectionProps> = ({
  initialNamaDiri = '',
  initialTanggalLahirDiri = '',
  initialNamaPasangan = '',
  initialTanggalLahirPasangan = '',
  onSubmit,
  onSwap,
  onReset,
  isLoading = false,
}) => {
  // -------------------------------------------------------------------------
  // BLOK 1: STATE LOKAL FORMULIR & SINKRONISASI INITIAL PROPS
  // -------------------------------------------------------------------------
  const [namaDiri, setNamaDiri] = useState<string>(initialNamaDiri);
  const [tanggalLahirDiri, setTanggalLahirDiri] = useState<string>(initialTanggalLahirDiri);
  const [namaPasangan, setNamaPasangan] = useState<string>(initialNamaPasangan);
  const [tanggalLahirPasangan, setTanggalLahirPasangan] = useState<string>(initialTanggalLahirPasangan);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sinkronisasi state lokal jika props awal berubah (misal: tombol Back browser atau Swap)
  const [previousInputs1, setPreviousInputs1] = useState<readonly unknown[] | null>(null);
  const currentInputs1 = [initialNamaDiri];
  if (previousInputs1 === null || currentInputs1.some((value, index) => !Object.is(value, previousInputs1[index]))) {
    setPreviousInputs1(currentInputs1);
    setNamaDiri(initialNamaDiri);

  }

  const [previousInputs2, setPreviousInputs2] = useState<readonly unknown[] | null>(null);
  const currentInputs2 = [initialTanggalLahirDiri];
  if (previousInputs2 === null || currentInputs2.some((value, index) => !Object.is(value, previousInputs2[index]))) {
    setPreviousInputs2(currentInputs2);
    setTanggalLahirDiri(initialTanggalLahirDiri);

  }

  const [previousInputs3, setPreviousInputs3] = useState<readonly unknown[] | null>(null);
  const currentInputs3 = [initialNamaPasangan];
  if (previousInputs3 === null || currentInputs3.some((value, index) => !Object.is(value, previousInputs3[index]))) {
    setPreviousInputs3(currentInputs3);
    setNamaPasangan(initialNamaPasangan);

  }

  const [previousInputs4, setPreviousInputs4] = useState<readonly unknown[] | null>(null);
  const currentInputs4 = [initialTanggalLahirPasangan];
  if (previousInputs4 === null || currentInputs4.some((value, index) => !Object.is(value, previousInputs4[index]))) {
    setPreviousInputs4(currentInputs4);
    setTanggalLahirPasangan(initialTanggalLahirPasangan);

  }

  // -------------------------------------------------------------------------
  // BLOK 2: HANDLER AKSI TUKAR POSISI (SWAP)
  // -------------------------------------------------------------------------
  const handleSwap = () => {
    const tempNama = namaDiri;
    const tempTgl = tanggalLahirDiri;

    setNamaDiri(namaPasangan);
    setTanggalLahirDiri(tanggalLahirPasangan);
    setNamaPasangan(tempNama);
    setTanggalLahirPasangan(tempTgl);
    setErrorMessage(null);

    if (onSwap) {
      onSwap();
    }
  };

  // -------------------------------------------------------------------------
  // BLOK 3: HANDLER SUBMIT FORM DENGAN VALIDASI SISI KLIEN
  // -------------------------------------------------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validasi kelengkapan tanggal lahir
    if (!tanggalLahirDiri || tanggalLahirDiri.trim() === '') {
      setErrorMessage('Silakan pilih tanggal lahir Anda terlebih dahulu.');
      return;
    }

    if (!tanggalLahirPasangan || tanggalLahirPasangan.trim() === '') {
      setErrorMessage('Silakan pilih tanggal lahir pasangan Anda terlebih dahulu.');
      return;
    }

    // Kirimkan data form yang telah bersih ke handler induk
    onSubmit({
      namaDiri: namaDiri.trim(),
      tanggalLahirDiri: tanggalLahirDiri.trim(),
      namaPasangan: namaPasangan.trim(),
      tanggalLahirPasangan: tanggalLahirPasangan.trim(),
    });
  };

  // Handler reset form ke nilai kosong
  const handleReset = () => {
    setNamaDiri('');
    setTanggalLahirDiri('');
    setNamaPasangan('');
    setTanggalLahirPasangan('');
    setErrorMessage(null);

    if (onReset) {
      onReset();
    }
  };

  const hasAnyInput = Boolean(
    namaDiri || tanggalLahirDiri || namaPasangan || tanggalLahirPasangan
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-6"
    >
      {/* =================================================================== */}
      {/* BLOK 4: GRID 2 KOLOM FORM (DATA DIRI VS DATA PASANGAN)              */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* KOLOM 1: DATA DIRI ANDA */}
        <div className="jodoh-card space-y-4 p-4 sm:p-5 rounded-xl bg-slate-50/50 dark:bg-slate-950/35 border border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60 dark:border-slate-700/80">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#0f172a] dark:text-white">
                Data Anda
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Profil pihak pertama (Diri)
              </p>
            </div>
          </div>

          {/* Input Nama Lengkap Diri */}
          <div>
            <label
              htmlFor="jodoh-nama-diri"
              className="text-[11px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-1.5"
            >
              Nama Lengkap (Opsional)
            </label>
            <input
              id="jodoh-nama-diri"
              type="text"
              value={namaDiri}
              onChange={(e) => setNamaDiri(e.target.value)}
              placeholder="Contoh: I Made Wijaya"
              maxLength={100}
              disabled={isLoading}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0f172a] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all disabled:bg-slate-50 dark:disabled:bg-slate-800"
            />
          </div>

          {/* Input Tanggal Lahir Diri */}
          <div>
            <label
              htmlFor="jodoh-tgl-diri"
              className="text-[11px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-1.5"
            >
              Tanggal Lahir Anda <span className="text-rose-500">*</span>
            </label>
            <AestheticDatePicker
              id="jodoh-tgl-diri"
              value={tanggalLahirDiri}
              onChange={(iso) => {
                setTanggalLahirDiri(iso);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="dd/mm/yyyy"
              minYear={1800}
              allowFuture={false}
              className="w-full"
            />
          </div>
        </div>

        {/* KOLOM 2: DATA PASANGAN */}
        <div className="jodoh-card space-y-4 p-4 sm:p-5 rounded-xl bg-slate-50/50 dark:bg-slate-950/35 border border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/60 dark:border-slate-700/80">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-300 shrink-0">
              <Heart className="w-4 h-4 fill-rose-500/20" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#0f172a] dark:text-white">
                Data Pasangan
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Profil pihak kedua (Pasangan)
              </p>
            </div>
          </div>

          {/* Input Nama Lengkap Pasangan */}
          <div>
            <label
              htmlFor="jodoh-nama-pasangan"
              className="text-[11px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-1.5"
            >
              Nama Pasangan (Opsional)
            </label>
            <input
              id="jodoh-nama-pasangan"
              type="text"
              value={namaPasangan}
              onChange={(e) => setNamaPasangan(e.target.value)}
              placeholder="Contoh: Ni Luh Putu Ayu"
              maxLength={100}
              disabled={isLoading}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0f172a] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all disabled:bg-slate-50 dark:disabled:bg-slate-800"
            />
          </div>

          {/* Input Tanggal Lahir Pasangan */}
          <div>
            <label
              htmlFor="jodoh-tgl-pasangan"
              className="text-[11px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-1.5"
            >
              Tanggal Lahir Pasangan <span className="text-rose-500">*</span>
            </label>
            <AestheticDatePicker
              id="jodoh-tgl-pasangan"
              value={tanggalLahirPasangan}
              onChange={(iso) => {
                setTanggalLahirPasangan(iso);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="dd/mm/yyyy"
              minYear={1800}
              allowFuture={false}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* BLOK 5: NOTIFIKASI KESALAHAN VALIDASI LOKAL                         */}
      {/* =================================================================== */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs sm:text-sm animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* BLOK 6: FOOTER AKSI (HITUNG, TUKAR POSISI, RESET)                   */}
      {/* =================================================================== */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {/* Tombol Tukar Posisi (Swap Diri & Pasangan) */}
          <button
            type="button"
            onClick={handleSwap}
            disabled={isLoading}
            title="Tukar posisi profil Diri dan Pasangan"
            aria-label="Tukar posisi profil Diri dan Pasangan"
            className="h-11 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50"
          >
            <ArrowLeftRight className="w-4 h-4 text-teal-600" />
            <span>Tukar Posisi</span>
          </button>

          {/* Tombol Reset Input */}
          {hasAnyInput && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              title="Bersihkan formulir"
              aria-label="Bersihkan formulir"
              className="min-w-11 h-11 px-3 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 active:scale-95 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer [touch-action:manipulation] text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>

        {/* Tombol Utama Hitung Kecocokan */}
        <button
          type="submit"
          disabled={isLoading}
          className="h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isLoading ? 'Menghitung Tenung...' : 'Hitung Kecocokan'}</span>
        </button>
      </div>
    </form>
  );
};

