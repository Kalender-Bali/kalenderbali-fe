import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import type { UpcomingHariRayaItem } from '../types/dashboard.types';
import { HariRayaDetailModal } from '@/features/kalender/components/HariRayaDetailModal';
import { getHariRayaBadgeStyle } from '@/features/kalender/utils/calendarUtils';

/**
 * ============================================================================
 * KOMPONEN: DashboardUpcomingHariRaya (Baris 2 Kanan — Hari Raya Berikutnya)
 * ============================================================================
 * Menampilkan daftar vertikal maksimal 7 Hari Raya / Rahina terdekat pada bulan aktif.
 *
 * Mengadopsi Desain Sesuai Arahan:
 *  - Menggunakan layout list vertikal "Agenda Mendatang" dari mockup.
 *  - Mengubah judul menjadi "Hari Raya Berikutnya" (subteks: "Rahina dan upacara terdekat").
 *  - INTERAKSI KLIK ITEM (Sesuai Arahan Gambar 2):
 *    Jika item hari raya diklik, JANGAN dialihkan (redirect) ke halaman lain,
 *    melainkan buka modal dialog pop-up uraian "Makna & Filosofi" hari raya tersebut
 *    menggunakan HariRayaDetailModal.
 *  - Tombol bawah "Lihat semua hari raya" tetap mengarah ke /hari-raya.
 *
 * Mengikuti Aturan Desain AGENTS.md:
 *  - Kotak tanggal beraksen warna semantik (Gold Amber, Mint Teal, Rose Crimson).
 *  - Tipografi tabular-nums untuk angka tanggal dan hitungan sisa hari.
 * ============================================================================
 */

interface DashboardUpcomingHariRayaProps {
  /** Array hari raya terdekat (akan diambil maksimal 7 item teratas) */
  items: UpcomingHariRayaItem[];
}

export const DashboardUpcomingHariRaya: React.FC<DashboardUpcomingHariRayaProps> = ({
  items,
}) => {
  const navigate = useNavigate();

  // State untuk mengontrol pembukaan modal pop-up detail makna & filosofi hari raya
  const [selectedHoliday, setSelectedHoliday] = useState<{
    id?: string;
    nama: string;
  } | null>(null);

  // Memastikan menampilkan maksimal 7 agenda hari raya terdekat kedepan
  const topSevenItems = items.slice(0, 7);

  // Handler interaksi: membuka modal popup saat item hari raya diklik
  const handleHolidayClick = (item: UpcomingHariRayaItem) => {
    setSelectedHoliday({
      id: item.holidayId,
      nama: item.nama,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      {/* =================================================================== */}
      {/* 1. HEADER KARTU: JUDUL & SUBTEKS DESKRIPTIF                         */}
      {/* =================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-white tracking-tight">
              Hari Raya Berikutnya
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Rahina dan upacara terdekat
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. DAFTAR LIST 7 HARI RAYA TERATAS                                */}
        {/* ================================================================= */}
        <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-0.5">
          {topSevenItems.length === 0 ? (
            /* State kosong jika bulan aktif tidak memiliki hari raya */
            <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 text-xs font-medium">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              Tidak ada agenda hari raya pada bulan ini.
            </div>
          ) : (
            topSevenItems.map((item) => {
              // Pewarnaan semantik kotak tanggal statis sesuai tingkatan kalender Bali
              const badgeStyle = getHariRayaBadgeStyle(item.nama);

              return (
                <div
                  key={item.id}
                  onClick={() => handleHolidayClick(item)}
                  className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-500/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xs transition-all cursor-pointer group"
                  title={`Klik untuk melihat makna & filosofi ${item.nama}`}
                >
                  {/* SISI KIRI: Kotak Tanggal Vertikal (Angka + Singkatan Bulan) */}
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-xl border flex flex-col items-center justify-center transition-transform group-hover:scale-105 ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                  >
                    <span className="text-xs sm:text-sm font-extrabold tabular-nums leading-none">
                      {item.dayNumber}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-0.5">
                      {item.monthShort}
                    </span>
                  </div>

                  {/* SISI TENGAH: Nama Hari Raya & Keterangan Acara/Pura */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[#0f172a] dark:text-white leading-snug truncate group-hover:text-[#0e9f90] dark:group-hover:text-teal-400 transition-colors">
                      {item.nama}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                      {item.keterangan}
                    </p>
                  </div>

                  {/* SISI KANAN: Pill Countdown Hari Tersisa */}
                  <div className="shrink-0 text-right">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 tabular-nums shadow-2xs">
                      {item.daysRemainingText}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. TOMBOL AKSI BAWAH: LIHAT SEMUA HARI RAYA                         */}
      {/* =================================================================== */}
      <div className="mt-4 pt-2">
        <button
          type="button"
          onClick={() => navigate('/hari-raya')}
          className="w-full py-2.5 px-4 rounded-xl bg-[#f0fbf9] dark:bg-teal-950/40 hover:bg-[#e6f7f5] dark:hover:bg-teal-900/50 text-[#0f766e] dark:text-teal-300 font-bold text-xs sm:text-sm border border-[#ccf0ea] dark:border-teal-800/60 transition-all text-center inline-flex items-center justify-center gap-1.5 cursor-pointer [touch-action:manipulation] active:scale-[0.99]"
        >
          <span>Lihat semua hari raya</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* =================================================================== */}
      {/* 4. MODAL POP-UP: MAKNA & FILOSOFI HARI RAYA (SESUAI GAMBAR 2)       */}
      {/* =================================================================== */}
      <HariRayaDetailModal
        isOpen={Boolean(selectedHoliday)}
        onClose={() => setSelectedHoliday(null)}
        holidayId={selectedHoliday?.id}
        holidayName={selectedHoliday?.nama}
      />
    </div>
  );
};
