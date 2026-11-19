import React, { lazy, Suspense, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  X,
  BookOpen,
  Clock,
  Compass,
  Bell,
  BellRing,
  Check,
  Share2,
} from 'lucide-react';
import { AppDialog } from '@/components/ui/AppDialog';
import { DataSkeleton } from '@/components/ui/DataSkeleton';
import { formatFullIndoDate, isValidISODate } from '@/features/kalender/utils/calendarUtils';
import type {
  HariRayaCardItem,
  HariRayaMasterItem,
  HariRayaUpcomingInfo,
} from '../types/hariRaya.types';
import { HariRayaReminderModal } from './HariRayaReminderModal';
import {
  capitalize,
  getCategoryPillStyles,
} from '../utils/hariRayaUtils';
import { buildHariRayaShareCard } from '../utils/hariRayaShareCard';

const ShareCardDialog = lazy(() => import('@/features/share-card/components/ShareCardDialog'));
const shareTitle = 'Bagikan Hari Raya';

/**
 * ============================================================================
 * KOMPONEN: HariRayaDetailModal
 * ============================================================================
 * Modal dialog pop-up standar AGENTS.md (Bab 4.7) untuk menyajikan penjelasan
 * filosofis lengkap hari raya yang bersumber dari lontar Sundarigama di database Go.
 *
 * Standar Aksesibilitas & Tampilan:
 *  1. createPortal(..., document.body) dengan z-index z-[100]
 *  2. Backdrop blur halus: fixed inset-0 bg-slate-900/40 backdrop-blur-xs
 *  3. Header bergradien: from-teal-50/60 via-slate-50/40 to-emerald-50/30
 *  4. Tombol tutup X ergonomis min 36x36px
 *  5. Body scrollable independen dengan overflow-y-auto
 *  6. Listener keyboard tombol "Escape" dan penguncian scroll body dokumen
 * ============================================================================
 */

interface HariRayaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardItem: HariRayaCardItem | null;
  masterItem?: HariRayaMasterItem | null;
}

export const HariRayaDetailModal: React.FC<HariRayaDetailModalProps> = ({
  isOpen,
  onClose,
  cardItem,
  masterItem,
}) => {
  // State modal pengingat dan status aktif per hari raya
  const [isReminderModalOpen, setIsReminderModalOpen] = useState<boolean>(false);
  const [isReminderActive, setIsReminderActive] = useState<boolean>(() => {
    try {
      return cardItem?.id ? localStorage.getItem(`reminder_${cardItem.id}_active`) === 'true' : false;
    } catch {
      return false;
    }
  });
  const [notificationFeedback, setNotificationFeedback] = useState<string | null>(null);
  const [shareSelection, setShareSelection] = useState<{ id: string; trigger: HTMLButtonElement } | null>(null);

  // Draf mengikuti satu kejadian; menutup detail atau berpindah kejadian mengakhiri sesi berbagi.
  const activeShare = isOpen && shareSelection?.id === cardItem?.id ? shareSelection : null;
  if (shareSelection && !activeShare) setShareSelection(null);
  const cardToShare = useMemo(() => activeShare && cardItem ? buildHariRayaShareCard(cardItem, masterItem) : null,
    [activeShare, cardItem, masterItem]);
  const closeShare = () => setShareSelection(null);

  // Sinkronkan status aktif saat cardItem berganti
  const [prevCardId, setPrevCardId] = useState<string | number | undefined>(cardItem?.id);
  if (cardItem?.id !== prevCardId) {
    setPrevCardId(cardItem?.id);
    try {
      setIsReminderActive(
        cardItem?.id ? localStorage.getItem(`reminder_${cardItem.id}_active`) === 'true' : false
      );
    } catch {
      setIsReminderActive(false);
    }
    setNotificationFeedback(null);
  }

  const handleDetailEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented || isReminderModalOpen) return;
    event.preventDefault();
    onClose();
  });

  // Editor mengambil alih Escape dan penguncian scroll selama dialog berbagi aktif.
  const isDetailActive = isOpen && !!cardItem && !activeShare;
  useEffect(() => {
    if (!isDetailActive) return;
    const handleKeyDown = (event: KeyboardEvent) => handleDetailEscape(event);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDetailActive]);

  if (!isOpen || !cardItem) return null;

  // Handler simpan pengingat
  const handleSaveReminder = () => {
    setIsReminderActive(true);
    try {
      if (cardItem?.id) {
        localStorage.setItem(`reminder_${cardItem.id}_active`, 'true');
      }
    } catch {
      // Abaikan jika storage diblokir peramban
    }
    const name = cardItem.nama || masterItem?.nama || 'Hari Raya';
    setNotificationFeedback(`Pengingat untuk ${name} telah diunduh. Impor berkas .ics ke aplikasi kalender Anda.`);
    setTimeout(() => setNotificationFeedback(null), 4000);
  };

  // Handler batalkan pengingat
  const handleCancelReminder = () => {
    setIsReminderActive(false);
    try {
      if (cardItem?.id) {
        localStorage.removeItem(`reminder_${cardItem.id}_active`);
      }
    } catch {
      // Abaikan jika storage diblokir peramban
    }
    setNotificationFeedback('Preferensi lokal dihapus. Hapus juga acara di aplikasi kalender jika sudah diimpor.');
    setTimeout(() => setNotificationFeedback(null), 3000);
  };

  // Konversi kartu hari raya menjadi objek info pengingat
  const cardReminderInfo: HariRayaUpcomingInfo = {
    item: cardItem,
    daysRemaining: 0,
    countdownText: `Perayaan ${cardItem.nama}`,
    wuku: cardItem.wuku ? capitalize(cardItem.wuku) : 'Sinta',
    sasih: cardItem.sasih ? capitalize(cardItem.sasih) : 'Kapat',
  };

  // Nama hari raya dan deskripsi filosofis resmi dari database Go
  const namaHariRaya = cardItem.nama || masterItem?.nama || 'Hari Raya Bali';
  const jenis = cardItem.jenis || masterItem?.jenis || 'hari_raya';
  const deskripsi =
    cardItem.keterangan ||
    masterItem?.keterangan ||
    'Hari suci ini dirayakan oleh umat Hindu di Bali untuk memohon kerahayuan, penyucian lahir dan batin, serta keharmonisan jagat raya sekala dan niskala.';

  const formattedDate = cardItem.tanggal ? formatFullIndoDate(cardItem.tanggal) : '-';
  const categoryPillStyles = getCategoryPillStyles(cardItem.categoryTag);
  const canShare = Boolean(cardItem.nama.trim()) && isValidISODate(cardItem.tanggal);
  const shareDescription = cardToShare ? `${cardToShare.content.context} · ${cardToShare.content.result}` : '';

  // Detail tetap terpasang supaya tombol pembuka dan posisi gulir tersedia saat editor ditutup.
  const detailDialog = createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-hari-raya-title"
      className={activeShare ? 'hidden' : 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in'}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      {/* Wadah Utama Dialog Modal */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl sm:max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden relative">
        {/* =============================================================== */}
        {/* BLOK 1: Header Dialog dengan Latar Gradien Lembut               */}
        {/* =============================================================== */}
        <div className="p-6 sm:p-7 bg-gradient-to-r from-teal-50/70 via-slate-50/50 to-emerald-50/40 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            {/* Pill Kategori dan Jenis Hari Raya */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full select-none ${categoryPillStyles}`}
              >
                {cardItem.categoryTag}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 capitalize">
                {jenis.replace('_', ' ')}
              </span>
            </div>

            {/* Judul Besar Hari Raya */}
            <h2
              id="modal-hari-raya-title"
              className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight leading-snug"
            >
              {namaHariRaya}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Rincian penanggalan dan makna filosofis perayaan.
            </p>
          </div>

          {/* Tombol Tutup X (Min 36x36px) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer border border-transparent hover:border-slate-200 [touch-action:manipulation]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =============================================================== */}
        {/* BLOK 2: Body Modal Scrollable                                   */}
        {/* =============================================================== */}
        <div className="min-h-0 overflow-y-auto p-6 sm:p-7 space-y-5">
          {/* Baris Rincian Penanggalan (Tanggal Masehi, Wuku, Sasih) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Kotak Tanggal Masehi */}
            <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-3.5 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                <Calendar className="w-3 h-3" /> TANGGAL
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#0f172a] block">
                {cardItem.dayName ? `${capitalize(cardItem.dayName)}, ` : ''}
                {formattedDate}
              </span>
            </div>

            {/* Kotak Siklus Wuku */}
            <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-3.5 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                <Compass className="w-3 h-3" /> WUKU
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#0f172a] block">
                {cardItem.wuku ? capitalize(cardItem.wuku) : '-'}
              </span>
            </div>

            {/* Kotak Sasih & Tahun Saka */}
            <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-3.5 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                <Clock className="w-3 h-3" /> SASIH
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#0f172a] block">
                {cardItem.sasih ? capitalize(cardItem.sasih) : '-'}{' '}
                {cardItem.tahunSaka ? `(${cardItem.tahunSaka} Saka)` : ''}
              </span>
            </div>
          </div>

          {/* Kotak Uraian Filosofis Lontar Sundarigama */}
          <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-5 space-y-2">
            <span className="text-[11px] font-extrabold text-teal-700 uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              MAKNA FILOSOFIS
            </span>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
              {deskripsi}
            </p>
          </div>
        </div>

        {/* =============================================================== */}
        {/* BLOK 3: Footer Dialog                                           */}
        {/* =============================================================== */}
        <div className="shrink-0 p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Feedback Notifikasi Banner */}
          {notificationFeedback ? (
            <div className="text-xs text-teal-800 font-semibold flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{notificationFeedback}</span>
            </div>
          ) : (
            <div />
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {canShare && (
              <button type="button" aria-haspopup="dialog"
                onClick={(event) => setShareSelection({ id: cardItem.id, trigger: event.currentTarget })}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-teal-600 active:bg-slate-100 sm:text-sm [touch-action:manipulation]">
                <Share2 aria-hidden="true" className="size-4" /> Bagikan Kartu
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsReminderModalOpen(true)}
              className="min-h-11 px-4 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer inline-flex items-center gap-2 active:scale-98 [touch-action:manipulation]"
              title={`Atur pengingat untuk ${namaHariRaya}`}
            >
              {isReminderActive ? (
                <>
                  <BellRing className="w-4 h-4 text-white shrink-0" />
                  <span>Unduh Lagi</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 text-white shrink-0" />
                  <span>Unduh pengingat kalender</span>
                </>
              )}
            </button>

            {/* Tombol Tutup Dialog */}
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs active:scale-98 [touch-action:manipulation]"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Modal Dialog Pop-up Konfigurasi Pengingat */}
        <HariRayaReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          upcomingInfo={cardReminderInfo}
          isCurrentlyActive={isReminderActive}
          onSaveReminder={handleSaveReminder}
          onCancelReminder={handleCancelReminder}
        />
      </div>
    </div>,
    document.body
  );

  return (
    <>
      {detailDialog}
      {activeShare && cardToShare && (
        <Suspense fallback={
          <AppDialog title={shareTitle} description={shareDescription} returnFocus={activeShare.trigger} onClose={closeShare}>
            <DataSkeleton label="Memuat kartu Hari Raya" className="h-72" />
          </AppDialog>
        }>
          <ShareCardDialog title={shareTitle} description={shareDescription} trigger={activeShare.trigger} onClose={closeShare}
            content={cardToShare.content} initialStyle={cardToShare.initialStyle} fileName={cardToShare.fileName} />
        </Suspense>
      )}
    </>
  );
};
