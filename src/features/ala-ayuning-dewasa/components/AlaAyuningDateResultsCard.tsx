import React from 'react';
import { ChevronRight, Info, CheckCircle2, AlertOctagon } from 'lucide-react';
import type { CariByNamaResponse } from '../types/alaAyuning.types';
import { getAlahingDewasaMeta } from '../types/alaAyuning.types';
import { getIndoMonthName, getIndoDayName, parseISODate } from '@/features/kalender/utils/calendarUtils';

/**
 * ============================================================================
 * KOMPONEN: AlaAyuningDateResultsCard (Hasil Pencarian Nama Padewasan)
 * ============================================================================
 * Komponen ini mereplikasi hasil pencarian nama padewasan pada Gambar 2 sistem
 * Laravel lama dengan balutan antarmuka modern seragam (AGENTS.md):
 *  1. Kolom Kiri: Daftar tanggal-tanggal jatuh padewasan tersebut pada bulan/tahun terpilih.
 *     - Dilengkapi nama hari Masehi & Bali (IndoDayName).
 *     - Interaktif: Mengklik tanggal akan mengalihkan pengguna ke mode pemeriksaan
 *       tanggal penuh untuk menelaah seluruh padewasan yang aktif di hari itu.
 *  2. Kolom Kanan: Kartu Informasi Makna Budaya & Sastra Lontar.
 *     - Nama resmi kriteria padewasan.
 *     - Badge tingkat keparahan Alahing Dewasa resmi (Level 1 s.d. 4).
 *     - Uraian lengkap pantangan, anjuran, dan sifat kosmisnya.
 *
 * Mengikuti Panduan AGENTS.md:
 *  - Wadah Card: bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs
 *  - Angka ber-tabular-nums
 * ============================================================================
 */

interface AlaAyuningDateResultsCardProps {
  /** Hasil pencarian nama dari server Go */
  result: CariByNamaResponse;

  /** Handler ketika salah satu tanggal jatuh diklik */
  onSelectDate: (date: string) => void;
}

export const AlaAyuningDateResultsCard: React.FC<AlaAyuningDateResultsCardProps> = ({
  result,
  onSelectDate,
}) => {
  const monthName = getIndoMonthName(result.bulan);
  const alahingMeta = getAlahingDewasaMeta(result.severity_code);

  const isLarangan =
    result.keterangan?.toLowerCase().includes('tidak baik') ||
    result.keterangan?.toLowerCase().includes('hindari');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ===================================================================== */}
      {/* BLOK 1: KOLOM KIRI - DAFTAR TANGGAL JATUH (5 dari 12 Kolom Desktop)  */}
      {/* ===================================================================== */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Header Hasil Pencarian */}
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-[#0f172a] tracking-tight">
              Tanggal Jatuh di Bulan Ini
            </h3>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md tabular-nums">
              {result.total_hari} Hari
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Periode: {monthName} {result.tahun}
          </p>
        </div>

        {/* Daftar Tanggal Jatuh */}
        {result.tanggal_jatuh.length > 0 ? (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {result.tanggal_jatuh.map((dateStr) => {
              const { day } = parseISODate(dateStr);
              const dayName = getIndoDayName(dateStr);

              return (
                <div
                  key={dateStr}
                  onClick={() => onSelectDate(dateStr)}
                  className="group p-3.5 rounded-xl border border-slate-200/80 bg-[#f8fafc]/60 hover:bg-white hover:border-teal-500/50 hover:shadow-xs transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    {/* Kotak Tanggal */}
                    <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200/70 text-teal-800 flex flex-col items-center justify-center shrink-0">
                      <span className="text-sm font-extrabold tabular-nums leading-none">
                        {day}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-teal-600">
                        {monthName.slice(0, 3)}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-[#0f172a] group-hover:text-teal-700 transition-colors">
                        {dayName}, {day} {monthName} {result.tahun}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Klik untuk periksa hari lengkap
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1">
            <Info className="w-5 h-5 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Kriteria ini tidak jatuh pada bulan {monthName} {result.tahun}.
            </p>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* BLOK 2: KOLOM KANAN - INFORMASI SASTRA LONTAR (7 dari 12 Kolom Desktop)*/}
      {/* ===================================================================== */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        {/* Header Kartu Informasi */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                INFORMASI ALA AYUNING DEWASA
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                · ID #{result.id}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
              {result.nama}
            </h3>
          </div>

          {/* Badge Tingkat Alahing Dewasa */}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border shadow-2xs shrink-0 ${alahingMeta.badgeStyle}`}
            title={alahingMeta.keterangan}
          >
            {alahingMeta.label}
          </span>
        </div>

        {/* Uraian Makna Budaya & Sastra Lontar */}
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-xl bg-[#f8fafc] border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-2">
              {isLarangan ? (
                <AlertOctagon className="w-4 h-4 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Uraian Makna & Peruntukan
              </h4>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed font-normal">
              {result.keterangan || 'Tidak ada deskripsi khusus dalam master data.'}
            </p>
          </div>

          {/* Penjelasan Hirarki Alahing Dewasa */}
          <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200/60 flex items-start gap-3">
            <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-0.5">
              <strong className="text-teal-900 font-bold block">
                {alahingMeta.level}: {alahingMeta.label}
              </strong>
              <p className="text-slate-500 leading-relaxed">
                {alahingMeta.keterangan}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
