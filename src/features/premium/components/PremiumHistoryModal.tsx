import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, History, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { PurchaseHistoryItem } from '../types/premium.types';

/**
 * ==============================================================================
 * PROPS: PremiumHistoryModal
 * ==============================================================================
 */
interface PremiumHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchases: PurchaseHistoryItem[];
  isLoading: boolean;
}

/**
 * ==============================================================================
 * KOMPONEN: PremiumHistoryModal (Dialog Modal Pop-up Riwayat Transaksi Pengguna)
 * ==============================================================================
 * Mengikuti standar baku AGENTS.md Bagian 4.7:
 *  1. createPortal ke document.body dengan z-index z-[100]
 *  2. Backdrop blur halus dengan listener penutupan saat klik luar
 *  3. Aksesibilitas keyboard tombol Escape & penguncian overflow body
 *  4. Data riil 100% dari endpoint GET /api/v1/purchases/my-purchases
 * ==============================================================================
 */
export const PremiumHistoryModal: React.FC<PremiumHistoryModalProps> = ({
  isOpen,
  onClose,
  purchases,
  isLoading,
}) => {
  // Listener tombol keyboard Escape untuk menutup modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Kunci scroll body saat modal terbuka
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

  if (!isOpen) return null;

  // Format nominal mata uang Rupiah
  const formatRupiah = (val: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
    >
      {/* 1. Backdrop Gelap dengan Blur */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Wadah Utama Dialog Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50/70 via-slate-50/50 to-emerald-50/40 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100/70 dark:bg-teal-950 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
              <History size={18} />
            </div>
            <div>
              <h3
                id="history-modal-title"
                className="text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-white tracking-tight"
              >
                Riwayat Transaksi Langganan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Daftar pembayaran paket akun premium yang tercatat di akun Anda.
              </p>
            </div>
          </div>

          {/* Tombol Tutup X */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela riwayat"
            className="min-w-9 min-h-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer [touch-action:manipulation]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Isi Modal: Daftar Transaksi */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-3 flex-1">
          {isLoading ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Memuat riwayat transaksi...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <History size={32} className="text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Belum Ada Riwayat Transaksi
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                Anda belum pernah melakukan pembelian paket premium. Pilih paket bulanan atau tahunan untuk mulai berlangganan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map((item) => {
                const statusLower = (item.status || '').toLowerCase();
                const isSuccess =
                  statusLower === 'settlement' ||
                  statusLower === 'success' ||
                  statusLower === 'capture';
                const isPending = statusLower === 'pending';

                return (
                  <div
                    key={item.id || item.provider_purchase_id}
                    className="bg-[#f8fafc] dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/80 p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {item.provider_purchase_id || `TRX-${item.id}`}
                        </span>
                        <h4 className="text-sm font-bold text-[#0f172a] dark:text-white">
                          {item.product_name || item.product_id}
                        </h4>
                      </div>

                      {/* Badge Status Pembayaran */}
                      {isSuccess ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 size={11} /> Berhasil
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full">
                          <Clock size={11} /> Menunggu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2.5 py-0.5 rounded-full capitalize">
                          <XCircle size={11} /> {item.status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50 dark:border-slate-700/60 text-slate-500 dark:text-slate-400">
                      <span className="tabular-nums">
                        {item.purchased_at
                          ? new Date(item.purchased_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </span>

                      {item.gross_amount ? (
                        <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                          {formatRupiah(item.gross_amount)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

