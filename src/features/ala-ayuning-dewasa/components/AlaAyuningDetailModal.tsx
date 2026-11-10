import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, AlertOctagon, CheckCircle2, Info } from 'lucide-react';
import type { PadewasanItem } from '../types/alaAyuning.types';
import { getAlahingDewasaMeta } from '../types/alaAyuning.types';

/**
 * ============================================================================
 * KOMPONEN: AlaAyuningDetailModal (Pop-up Uraian Sastra Padewasan)
 * ============================================================================
 * Dialog modal pop-up yang menyajikan penjelasan mendalam suatu kriteria
 * Padewasan (Ala Ayuning Dewasa) ketika salah satu kartu diklik:
 *  1. Header Gradient Lembut: Nama Padewasan, nomor ID master, dan tombol tutup X.
 *  2. Badge Alahing Dewasa: Penjelasan hirarki kekuatan hari (Sasih, Penanggal, Dauh, Wuku).
 *  3. Uraian Makna Budaya Otentik: Deskripsi makna lontar yang berasal dari master data Go.
 *  4. Petunjuk Praktis: Rekomendasi anjuran dan larangan kegiatan/yadnya.
 *
 * Mengikuti Panduan AGENTS.md Bagian 4 Poin 7:
 *  - createPortal ke document.body dengan z-index z-[100]
 *  - Backdrop: bg-slate-900/40 backdrop-blur-xs
 *  - Wadah Dialog: bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl
 *  - Aksesibilitas WAI-ARIA: Listener Escape & penguncian overflow body
 * ============================================================================
 */

interface AlaAyuningDetailModalProps {
  /** Penanda apakah dialog modal sedang terbuka */
  isOpen: boolean;

  /** Handler untuk menutup dialog modal */
  onClose: () => void;

  /** Data kriteria padewasan yang sedang ditampilkan */
  item: PadewasanItem | null;
}

export const AlaAyuningDetailModal: React.FC<AlaAyuningDetailModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  // Listener tombol Escape untuk menutup dialog secara aksesibel
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Mengunci scrollbar halaman utama ketika dialog sedang aktif
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !item) return null;

  const alahingMeta = getAlahingDewasaMeta(item.severity_code);
  const isLarangan =
    item.keterangan?.toLowerCase().includes('tidak baik') ||
    item.keterangan?.toLowerCase().includes('hindari');

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-150 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-padewasan-title"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =================================================================== */}
        {/* BLOK 1: HEADER DIALOG MODAL (GRADIENT LEMBUT SESUAI AGENTS.MD)      */}
        {/* =================================================================== */}
        <div className="p-6 bg-gradient-to-r from-teal-50/70 via-slate-50/50 to-emerald-50/40 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-800 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-teal-800 dark:text-teal-300 uppercase tracking-widest block">
                TATA SASTRA PADEWASAN
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                · ID #{item.id}
              </span>
            </div>

            <h3
              id="modal-padewasan-title"
              className="text-xl sm:text-2xl font-extrabold text-[#0f172a] dark:text-white tracking-tight"
            >
              {item.nama}
            </h3>
          </div>

          {/* Tombol Tutup X (Min 36x36px target sentuh) */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 active:scale-95 transition-all cursor-pointer [touch-action:manipulation]"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =================================================================== */}
        {/* BLOK 2: BADGE ALAHING DEWASA                                        */}
        {/* =================================================================== */}
        <div className="px-6 pt-4 pb-0 flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-400">
            Tingkat Alahing Dewasa:
          </span>

          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border shadow-2xs ${alahingMeta.badgeStyle}`}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            <span>{alahingMeta.level} — {alahingMeta.label}</span>
          </span>
        </div>

        {/* =================================================================== */}
        {/* BLOK 3: SCROLLABLE BODY & DESKRIPSI SASTRA LONTAR                   */}
        {/* =================================================================== */}
        <div className="overflow-y-auto p-6 space-y-4">
          {/* Uraian Makna Budaya */}
          <div className="bg-[#f8fafc] dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-800 p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2">
              {isLarangan ? (
                <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Makna & Pengaruh Hari
              </h4>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              {item.keterangan || 'Tidak ada uraian pantangan atau anjuran khusus untuk kriteria ini.'}
            </p>
          </div>

          {/* Kotak Edukatif: Filosofi Hirarki Alahing Dewasa */}
          <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 flex items-start gap-3">
            <Info className="w-4 h-4 text-teal-700 dark:text-teal-300 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <strong className="text-teal-900 dark:text-teal-300 font-bold block">
                Pedoman Pembatalan Hari ({alahingMeta.label})
              </strong>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {alahingMeta.keterangan}
              </p>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* BLOK 4: FOOTER DIALOG MODAL DENGAN TOMBOL TUTUP                     */}
        {/* =================================================================== */}
        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold text-xs shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center gap-2 [touch-action:manipulation]"
          >
            <span>Tutup</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
