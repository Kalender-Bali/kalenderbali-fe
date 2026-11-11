import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Landmark, ChevronRight, Sparkles } from 'lucide-react';
import type { KalenderHarian, HariRayaItem } from '../types/kalender.types';
import {
  getIndoDayName,
  getIndoMonthName,
  parseISODate,
  getHariRayaBadgeStyle,
} from '../utils/calendarUtils';
import { useDayPiodalan } from '../hooks/useKalender';
import { HariRayaDetailModal } from './HariRayaDetailModal';
import { DayPiodalanModal } from './DayPiodalanModal';
import { EASE_SMOOTH } from '@/lib/animations';

/**
 * ============================================================================
 * KOMPONEN: CalendarInspector (Detail Tanggal - Panel Kanan)
 * ============================================================================
 * Panel inspektur rincian tanggal kalender yang sedang dipilih:
 *  1. Header: "Detail tanggal" dan badge "HARI INI" (jika tanggal dipilih = hari ini).
 *  2. Angka Tanggal Besar (text-7xl) & Nama Hari Masehi/Saptawara (sejajar vertikal).
 *  3. Pill Sasih & Pill Wuku.
 *  4. Section HARI RAYA & RERAINAN pada tanggal tersebut:
 *     - Menampilkan daftar perayaan keagamaan pada tanggal yang dipilih.
 *     - Interaktif: Mengklik hari raya memunculkan HariRayaDetailModal dengan
 *       makna & penjelasan filosofis lengkap (sesuai Gambar 2).
 *  5. Daftar "Piodalan hari ini": Nama pura, lokasi, dan jarak.
 *  6. Tombol Aksi: "Lihat detail hari" untuk membuka modal wewaran & urip lengkap.
 * ============================================================================
 */

interface CalendarInspectorProps {
  selectedDate: string;
  selectedData?: KalenderHarian;
  isToday: boolean;
  onOpenDetailModal: () => void;
}

export const CalendarInspector: React.FC<CalendarInspectorProps> = ({
  selectedDate,
  selectedData,
  isToday,
  onOpenDetailModal,
}) => {
  const { year, month, day } = parseISODate(selectedDate);
  const monthName = getIndoMonthName(month);
  const indoDayName = getIndoDayName(selectedDate);

  // State untuk mengontrol pop-up penjelasan hari raya yang diklik
  const [selectedHoliday, setSelectedHoliday] = useState<HariRayaItem | null>(null);

  // State untuk mengontrol pop-up daftar piodalan lengkap
  const [isPiodalanModalOpen, setIsPiodalanModalOpen] = useState(false);

  // Status hari Minggu
  const isSunday = indoDayName === 'Minggu';

  // Wewaran harian
  const saptawaraName = selectedData?.wewaran?.saptawara?.nama || '-';
  const wukuName = selectedData?.wewaran?.wuku?.nama || '-';
  const namaSasih = selectedData?.sasih?.nama_sasih
    ? selectedData.sasih.nama_sasih.charAt(0).toUpperCase() + selectedData.sasih.nama_sasih.slice(1)
    : '-';

  // Daftar hari raya / rerainan pada tanggal terpilih
  const hariRayaList = selectedData?.hari_raya || [];

  // Data Piodalan Real dari Mesin Pencarian Go (Hybrid Resilient Engine)
  const { data: dayPiodalanData, isLoading: isLoadingDayPio } = useDayPiodalan(
    selectedDate,
    selectedData
  );
  const piodalanList = dayPiodalanData?.items || [];
  const piodalanTotal = dayPiodalanData?.totalCount ?? 0;

  // Batasi maksimal 5 piodalan di panel inspector agar tidak overflow
  const displayedPiodalans = piodalanList.slice(0, 5);
  const hasMorePiodalans = piodalanTotal > 5;

  // Status Purnama / Tilem jika ada pada tanggal ini
  const purnamaTilem =
    selectedData?.pengalantaka?.purnama_tilem && selectedData.pengalantaka.purnama_tilem !== '-'
      ? selectedData.pengalantaka.purnama_tilem
      : null;

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xs flex flex-col justify-between h-full">
        {/* ========================================================= */}
        {/* KONTEN ATAS & TENGAH (FLEX-1 UNTUK MENGISI TINGGI)        */}
        {/* ========================================================= */}
        <motion.div
          key={selectedDate}
          initial={{ opacity: 0.6, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: EASE_SMOOTH }}
          className="flex-1 flex flex-col space-y-5 sm:space-y-6"
        >
          {/* ========================================================= */}
          {/* 1. HEADER DETAIL TANGGAL                                  */}
          {/* ========================================================= */}
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-lg font-extrabold text-[#0f172a] dark:text-white tracking-tight">
              Detail tanggal
            </h3>
            {isToday && (
              <span className="text-[10px] font-extrabold text-[#0d9488] dark:text-teal-300 bg-[#e6f7f5] dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 px-3 py-1 rounded-full uppercase tracking-wider">
                Hari ini
              </span>
            )}
          </div>

          {/* ========================================================= */}
          {/* 2. TAMPILAN TANGGAL BESAR & NAMA HARI (SEJAJAR VERTIKAL)   */}
          {/* ========================================================= */}
          <div className="flex items-center gap-4">
            <span
              className={`text-6xl sm:text-7xl font-extrabold tabular-nums leading-none tracking-tight ${
                isSunday ? 'text-rose-600 dark:text-rose-400' : 'text-[#0f172a] dark:text-white'
              }`}
            >
              {day}
            </span>
            <div className="flex flex-col justify-center space-y-1">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">
                {monthName} {year}
              </span>
              <span className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-slate-100 block leading-tight">
                <span className={isSunday ? 'text-rose-600 dark:text-rose-400' : ''}>{indoDayName}</span> · {saptawaraName}
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. PILL SASIH, WUKU, & PURNAMA/TILEM (AGENTS.md Bab 3.C)  */}
          {/* ========================================================= */}
          <div className="flex flex-wrap gap-2.5">
            <span className="inline-flex items-center text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#fffbeb] dark:bg-amber-950/40 text-[#b45309] dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
              Sasih {namaSasih}
            </span>
            <span className="inline-flex items-center text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#ede9fe] dark:bg-purple-950/40 text-[#6d28d9] dark:text-purple-300 border border-violet-200/60 dark:border-purple-800/60">
              Wuku {wukuName}
            </span>
            {purnamaTilem && (() => {
              const ptStyle = getHariRayaBadgeStyle(purnamaTilem);
              return (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full ${ptStyle.bg} ${ptStyle.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ptStyle.dot}`} />
                  <span>{purnamaTilem}</span>
                </span>
              );
            })()}
          </div>

          {/* ========================================================= */}
          {/* 4. HARI RAYA & RERAINAN PADA TANGGAL INI                  */}
          {/* ========================================================= */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0f172a] dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Hari Raya & Rerainan
              </span>
              {hariRayaList.length > 0 && (
                <span className="text-[10px] font-extrabold text-primary bg-primary-subtle border border-primary-border px-2.5 py-0.5 rounded-full uppercase tabular-nums">
                  {hariRayaList.length} Perayaan
                </span>
              )}
            </div>

            {hariRayaList.length > 0 ? (
              <div className="space-y-2">
                {hariRayaList.map((hr) => {
                  const badgeStyle = getHariRayaBadgeStyle(hr.nama);
                  return (
                    <div
                      key={hr.id || hr.nama}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedHoliday(hr)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedHoliday(hr);
                        }
                      }}
                      className="group p-3 rounded-xl border border-slate-200/80 bg-[#f8fafc] hover:bg-slate-100/70 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between active:scale-98 [touch-action:manipulation]"
                      title="Klik untuk membaca penjelasan hari raya ini"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${badgeStyle.bg} ${badgeStyle.border}`}>
                          <span className={`w-2 h-2 rounded-full ${badgeStyle.dot}`} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-extrabold text-[#0f172a] dark:text-white group-hover:text-primary transition-colors block truncate">
                            {hr.nama}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium block">
                            Klik untuk melihat penjelasan ↗
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                  <Sparkles className="w-4 h-4 opacity-40 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="min-w-0 text-left">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Hari Biasa</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium block truncate">
                    Tidak ada rahinan / perayaan khusus
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 5. DAFTAR PIODALAN HARI INI                               */}
          {/* ========================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-[#0f172a] dark:text-white">
                Piodalan hari ini
              </span>
              {isLoadingDayPio ? (
                <span className="text-xs font-bold text-[#0d9488] dark:text-teal-400 tabular-nums">
                  Memuat...
                </span>
              ) : hasMorePiodalans ? (
                <button
                  type="button"
                  onClick={() => setIsPiodalanModalOpen(true)}
                  className="text-xs font-bold text-[#0d9488] dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline cursor-pointer transition-colors"
                  title={`Lihat seluruh ${piodalanTotal} piodalan pada tanggal ini`}
                >
                  Lihat selengkapnya ↗
                </button>
              ) : (
                <span className="text-xs font-bold text-[#0d9488] dark:text-teal-400 tabular-nums">
                  {piodalanTotal} lokasi
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {isLoadingDayPio ? (
                <div className="p-3.5 rounded-xl border border-slate-100/90 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800/40 text-center">
                  <span className="text-xs text-slate-400 font-medium">
                    Memeriksa agenda piodalan pura...
                  </span>
                </div>
              ) : piodalanList.length === 0 ? (
                <div className="p-3.5 rounded-xl border border-slate-100/90 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800/40 text-center">
                  <span className="text-xs text-slate-400 font-medium">
                    Tidak ada perayaan piodalan pura pada tanggal ini.
                  </span>
                </div>
              ) : (
                displayedPiodalans.map((pio) => (
                  <div
                    key={pio.id}
                    className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-100/90 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors [touch-action:manipulation]"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        pio.accentColor === 'amber'
                          ? 'bg-[#fef3c7] dark:bg-amber-950/60 text-[#d97706] dark:text-amber-400'
                          : 'bg-[#e6f7f5] dark:bg-teal-950/60 text-[#0d9488] dark:text-teal-400'
                      }`}
                    >
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-bold text-[#0f172a] dark:text-white block truncate">
                        {pio.puraName}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-400 font-medium block truncate tabular-nums">
                        {pio.location} · {pio.distance}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* 6. TOMBOL AKSI DI BAWAH (STANDAR SECONDARY AGENTS.md)    */}
        {/* ========================================================= */}
        <div className="pt-5 mt-auto">
          <button
            type="button"
            onClick={onOpenDetailModal}
            className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-2xs active:scale-98 [touch-action:manipulation]"
          >
            Lihat detail hari
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. MODAL POP-UP PENJELASAN MAKNA HARI RAYA                */}
      {/* ========================================================= */}
      {selectedHoliday && (
        <HariRayaDetailModal
          isOpen={!!selectedHoliday}
          onClose={() => setSelectedHoliday(null)}
          holidayId={selectedHoliday.id}
          holidayName={selectedHoliday.nama}
        />
      )}

      {/* ========================================================= */}
      {/* 8. MODAL POP-UP DAFTAR LENGKAP PIODALAN HARI INI          */}
      {/* ========================================================= */}
      <DayPiodalanModal
        isOpen={isPiodalanModalOpen}
        onClose={() => setIsPiodalanModalOpen(false)}
        dateString={selectedDate}
        dayData={selectedData}
        piodalanList={piodalanList}
      />
    </>
  );
};
