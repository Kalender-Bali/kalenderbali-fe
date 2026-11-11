import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, Landmark, Search, MapPin, Info } from 'lucide-react';
import type { KalenderHarian, PiodalanItem } from '../types/kalender.types';
import { formatFullIndoDate, getIndoDayName } from '../utils/calendarUtils';
import { modalOverlayVariants, modalContentVariants } from '@/lib/animations';

/**
 * ============================================================================
 * KOMPONEN: DayPiodalanModal (Modal Daftar Lengkap Piodalan Hari Ini)
 * ============================================================================
 * Modal dialog pop-up yang menampilkan daftar seluruh pura yang melangsungkan
 * upacara piodalan pada hari terpilih di Kalender Bali:
 *  - Header dengan gradien halus, ikon Landmark, tanggal lengkap, dan wewaran.
 *  - Toolbar pencarian interaktif untuk menyaring pura berdasarkan nama,
 *    kabupaten, atau klasifikasi pura.
 *  - Grid 2 kolom kartu pura responsif dengan aksen warna serasi dan klasifikasi.
 *  - Aksesibilitas keyboard (Escape) dan body scroll lock.
 *  - Dukungan tema penuh (Light & Dark mode).
 * ============================================================================
 */

interface DayPiodalanModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateString: string;
  dayData?: KalenderHarian;
  piodalanList: PiodalanItem[];
}

export const DayPiodalanModal: React.FC<DayPiodalanModalProps> = ({
  isOpen,
  onClose,
  dateString,
  dayData,
  piodalanList,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Listener tombol 'Escape' untuk aksesibilitas & lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset pencarian setiap kali modal dibuka atau tanggal berubah
  const [previousInputs1, setPreviousInputs1] = useState<readonly unknown[] | null>(null);
  const currentInputs1 = [isOpen, dateString];
  if (previousInputs1 === null || currentInputs1.some((value, index) => !Object.is(value, previousInputs1[index]))) {
    setPreviousInputs1(currentInputs1);
    if (!isOpen) {
      setSearchQuery('');
    }
  
  }

  // Filter daftar pura secara instan berdasarkan query pencarian
  const filteredList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return piodalanList;

    return piodalanList.filter((item) => {
      return (
        item.puraName.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.distance.toLowerCase().includes(query)
      );
    });
  }, [piodalanList, searchQuery]);

  if (!isOpen) return null;

  const indoDayName = getIndoDayName(dateString);
  const formattedDate = formatFullIndoDate(dateString);
  const saptawaraName = dayData?.wewaran?.saptawara?.nama;
  const pancawaraName = dayData?.wewaran?.pancawara?.nama;
  const wukuName = dayData?.wewaran?.wuku?.nama;
  const namaSasih = dayData?.sasih?.nama_sasih;

  const wewaranSubtitle = [
    saptawaraName && pancawaraName ? `${saptawaraName} ${pancawaraName}` : '',
    wukuName ? `Wuku ${wukuName}` : '',
    namaSasih ? `Sasih ${namaSasih.charAt(0).toUpperCase() + namaSasih.slice(1)}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 overscroll-contain">
      {/* 1. Backdrop Gelap dengan Efek Blur Menyeluruh */}
      <motion.div
        key="piodalan-modal-backdrop"
        variants={modalOverlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* 2. Kontainer Kotak Modal Dialog */}
      <motion.div
        key="piodalan-modal-content"
        variants={modalContentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden z-10 max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Header dengan Sentuhan Gradien Lembut */}
        <div className="relative bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50 dark:from-teal-950/40 dark:via-slate-900 dark:to-emerald-950/30 px-6 sm:px-8 py-4 sm:py-5 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-teal-100/80 dark:bg-teal-950 text-teal-800 dark:text-teal-300 mt-0.5 shrink-0 border border-teal-200/60 dark:border-teal-800/60">
              <Landmark className="w-5 h-5" />
            </span>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0d9488] dark:text-teal-400">
                  Agenda Piodalan Pura
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#e6f7f5] dark:bg-teal-950/70 border border-teal-200/60 dark:border-teal-800/60 text-[#0d9488] dark:text-teal-300 tabular-nums">
                  {piodalanList.length} Lokasi
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#0f172a] dark:text-white tracking-tight">
                Piodalan {indoDayName}, {formattedDate}
              </h3>
              {wewaranSubtitle && (
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {wewaranSubtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 min-w-9 min-h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer [touch-action:manipulation] shrink-0"
            aria-label="Tutup jendela daftar piodalan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Pencarian Cepat */}
        <div className="p-4 sm:px-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pura atau kabupaten..."
              className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-[#0f172a] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            {searchQuery ? (
              <span>
                Ditemukan <strong className="text-teal-700 dark:text-teal-400 font-bold">{filteredList.length}</strong> dari {piodalanList.length} pura
              </span>
            ) : (
              <span>
                Total <strong className="text-[#0f172a] dark:text-white font-bold">{piodalanList.length}</strong> pura terdaftar
              </span>
            )}
          </div>
        </div>

        {/* Konten Scrollable: Grid Daftar Pura */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[62vh] space-y-3">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Info className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Pura tidak ditemukan
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Tidak ada pura yang sesuai dengan kata kunci "{searchQuery}".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredList.map((pio) => (
                <div
                  key={pio.id}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-teal-300 dark:hover:border-teal-700/60 transition-all shadow-2xs group"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      pio.accentColor === 'amber'
                        ? 'bg-[#fef3c7] dark:bg-amber-950/60 text-[#d97706] dark:text-amber-400'
                        : 'bg-[#e6f7f5] dark:bg-teal-950/60 text-[#0d9488] dark:text-teal-400'
                    }`}
                  >
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-xs sm:text-sm font-bold text-[#0f172a] dark:text-white group-hover:text-[#0d9488] dark:group-hover:text-teal-300 transition-colors block truncate">
                      {pio.puraName}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{pio.location}</span>
                    </div>
                    {pio.distance && (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600/60">
                        {pio.distance}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-4 sm:px-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden sm:block">
            Menampilkan agenda piodalan pura penanggalan Pawukon & Sasih
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 ml-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation]"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

