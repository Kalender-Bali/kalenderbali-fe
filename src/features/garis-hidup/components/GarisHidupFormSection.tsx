import React from 'react';
import {
  UserPlus,
  Trash2,
  TrendingUp,
  RotateCcw,
  AlertCircle,
  User,
  Loader2,
} from 'lucide-react';
import { AestheticDatePicker } from '@/components/ui/AestheticDatePicker';
import type { GarisHidupParticipantInput } from '../types/garisHidup.types';

/**
 * ============================================================================
 * PROPS: GarisHidupFormSectionProps
 * ============================================================================
 */
interface GarisHidupFormSectionProps {
  /** Daftar entri peserta yang sedang diedit (1 sampai 5 orang) */
  entries: GarisHidupParticipantInput[];
  /** Callback untuk menambahkan satu peserta baru */
  onAddParticipant: () => void;
  /** Callback untuk menghapus peserta pada indeks tertentu */
  onRemoveParticipant: (index: number) => void;
  /** Callback untuk memperbarui nama atau tanggal lahir peserta */
  onUpdateParticipant: (
    index: number,
    field: 'nama' | 'tanggal_lahir',
    value: string
  ) => void;
  /** Callback saat tombol "Hitung Garis Hidup" ditekan */
  onSubmit: () => void;
  /** Callback opsional untuk mereset formulir ke keadaan default */
  onReset?: () => void;
  /** Status apakah sedang memuat data dari API Go */
  isLoading?: boolean;
  /** Pesan kesalahan validasi lokal (jika ada) */
  errorMessage?: string | null;
}

/**
 * ============================================================================
 * KOMPONEN: GarisHidupFormSection (Form Masukan Multi-Peserta)
 * ============================================================================
 * Formulir masukan data profil peserta (1 s/d 5 orang) yang disesuaikan
 * untuk standar antarmuka Web yang matang:
 *  1. Tata Letak Fleksibel & Responsif: Pada layar tablet/desktop, kolom Nama
 *     dan Tanggal Lahir tertata rapi berdampingan (2 kolom) tanpa scrolling vertikal berlebih.
 *  2. Pemilih Tanggal Estetik (`AestheticDatePicker`): Memanfaatkan komponen
 *     pemilih tanggal bersama yang sudah terintegrasi, mencegah tanggal masa depan,
 *     dan mendukung seleksi tahun kelahiran lampau dengan cepat.
 *  3. Aksi Dinamis Multi-Peserta: Pengguna dapat menambah hingga 5 peserta
 *     atau menghapus peserta dengan tombol ikon ergonomis ($36 \times 36$ px).
 *  4. Standar Desain AGENTS.md:
 *     - Kontainer: bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs.
 *     - Input: tinggi seragam h-11 (44px) dengan [touch-action:manipulation].
 *     - Tombol primer: bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a].
 * ============================================================================
 */
export const GarisHidupFormSection: React.FC<GarisHidupFormSectionProps> = ({
  entries,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateParticipant,
  onSubmit,
  onReset,
  isLoading = false,
  errorMessage = null,
}) => {
  const isMaxReached = entries.length >= 5;
  const isMinReached = entries.length <= 1;

  // -------------------------------------------------------------------------
  // HANDLER SUBMIT DENGAN PREVENT DEFAULT
  // -------------------------------------------------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onSubmit();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-6">
      {/* ===================================================================== */}
      {/* BLOK 1: HEADER SEKSI FORMULIR & TOMBOL TAMBAH PESERTA                 */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-white tracking-tight">
              Data Peserta
            </h2>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 tabular-nums">
              {entries.length}/5 Orang
            </span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
            Masukkan data 1 sampai 5 orang untuk menghitung dan membandingkan garis hidup.
          </p>
        </div>

        {/* Tombol Tambah Peserta */}
        {!isMaxReached && (
          <button
            type="button"
            onClick={onAddParticipant}
            disabled={isLoading}
            className="h-9 px-3.5 rounded-xl border border-teal-200/80 dark:border-teal-800/60 bg-teal-50/70 dark:bg-teal-950/40 hover:bg-teal-100/80 dark:hover:bg-teal-900/50 active:bg-teal-200/80 text-teal-800 dark:text-teal-300 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer [touch-action:manipulation] disabled:opacity-50 self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5 text-teal-700 dark:text-teal-300" />
            <span>Tambah Peserta</span>
          </button>
        )}
      </div>

      {/* ===================================================================== */}
      {/* BLOK 2: BANNER PESAN KESALAHAN VALIDASI LOKAL (JIKA ADA)              */}
      {/* ===================================================================== */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* BLOK 3: DAFTAR KARTU MASUKAN PESERTA (1 S/D 5 PESERTA)                */}
      {/* ===================================================================== */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3.5">
          {entries.map((entry, index) => {
            const participantNumber = index + 1;
            const inputNameId = `garis-hidup-nama-${entry.id}`;

            return (
              <div
                key={entry.id}
                className="garis-hidup-card p-4 sm:p-5 rounded-xl bg-[#f8fafc] dark:bg-slate-950/35 border border-slate-200/70 dark:border-slate-800 space-y-3.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Header Kartu Peserta: Label Peserta N + Tombol Hapus */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold flex items-center justify-center text-xs tabular-nums">
                      {participantNumber}
                    </span>
                    <span className="text-xs font-bold text-[#0f172a] dark:text-white">
                      Peserta {participantNumber}
                    </span>
                    {index === 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                        Utama
                      </span>
                    )}
                  </div>

                  {/* Tombol Hapus Peserta (hanya jika peserta > 1) */}
                  {!isMinReached && (
                    <button
                      type="button"
                      onClick={() => onRemoveParticipant(index)}
                      disabled={isLoading}
                      title={`Hapus Peserta ${participantNumber}`}
                      aria-label={`Hapus Peserta ${participantNumber}`}
                      className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer [touch-action:manipulation] disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Grid Input 2 Kolom (Nama & Tanggal Lahir) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Kolom 1: Nama Peserta (Opsional) */}
                  <div>
                    <label
                      htmlFor={inputNameId}
                      className="text-[11px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-1.5"
                    >
                      Nama (Opsional)
                    </label>
                    <div className="relative">
                      <input
                        id={inputNameId}
                        type="text"
                        value={entry.nama}
                        maxLength={100}
                        onChange={(e) =>
                          onUpdateParticipant(index, 'nama', e.target.value)
                        }
                        placeholder={
                          index === 0
                            ? 'Contoh: I Wayan Raditya'
                            : `Contoh: Profil ${participantNumber}`
                        }
                        disabled={isLoading}
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0f172a] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all disabled:opacity-50"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Kolom 2: Tanggal Lahir Masehi (AestheticDatePicker) */}
                  <div>
                    <label
                      htmlFor={`tgl-${entry.id}`}
                      className="text-[11px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-1.5"
                    >
                      Tanggal Lahir <span className="text-rose-500">*</span>
                    </label>
                    <AestheticDatePicker
                      id={`tgl-${entry.id}`}
                      value={entry.tanggal_lahir}
                      onChange={(isoDate) =>
                        onUpdateParticipant(index, 'tanggal_lahir', isoDate)
                      }
                      placeholder="dd/mm/yyyy"
                      allowFuture={false}
                      required
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* =================================================================== */}
        {/* BLOK 4: BARIS TOMBOL AKSI UTAMA (HITUNG & RESET)                    */}
        {/* =================================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
          {/* Tombol Reset */}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              disabled={isLoading}
              className="w-full sm:w-auto h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-600 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 [touch-action:manipulation] disabled:opacity-50 order-2 sm:order-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Formulir</span>
            </button>
          )}

          {/* Tombol Hitung Garis Hidup */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto sm:min-w-[200px] h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-60 order-1 sm:order-2 ml-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghitung...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>Hitung Garis Hidup</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

