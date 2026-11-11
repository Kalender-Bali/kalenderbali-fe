import React from 'react';
import { Check, Sparkles, Crown, Loader2 } from 'lucide-react';
import type { SubscriptionProduct } from '../types/premium.types';

/**
 * ==============================================================================
 * PROPS: PremiumPlanCards
 * ==============================================================================
 */
interface PremiumPlanCardsProps {
  products: SubscriptionProduct[];
  processingProductId: string | null;
  onSelectProduct: (product: SubscriptionProduct) => void;
}

/**
 * ==============================================================================
 * KOMPONEN: PremiumPlanCards (Dua Kartu Paket Langganan: Bulanan & Tahunan)
 * ==============================================================================
 * Menampilkan data produk langganan 100% REAL dari endpoint backend Go:
 *  - Format mata uang Rupiah konsisten dengan tabular-nums (AGENTS.md Bagian 1.2)
 *  - Kartu Tahunan disorot dengan badge "Hemat 17%" dan aksen Amber Gold
 *  - Tombol interaktif dengan ergonomi sentuh h-11 dan state feedback loading
 * ==============================================================================
 */
export const PremiumPlanCards: React.FC<PremiumPlanCardsProps> = ({
  products,
  processingProductId,
  onSelectProduct,
}) => {
  // Helper memformat nominal angka menjadi format Rupiah Indonesia
  const formatRupiah = (val: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Urutkan produk: bulanan terlebih dahulu, lalu tahunan
  const sortedProducts = [...products].sort((a, b) => a.price - b.price);

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight">
          Pilihan Paket Member
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Tentukan jangka waktu keanggotaan yang sesuai dengan kebutuhan Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-2">
        {sortedProducts.map((product) => {
          const productId = product.product_id || String(product.id || '');
          // Evaluasi apakah produk ini adalah paket tahunan
          const isYearly =
            productId.toLowerCase().includes('tahunan') ||
            (product.name || '').toLowerCase().includes('tahun');

          const isProcessing = Boolean(processingProductId && processingProductId === productId);

          return (
            <div
              key={product.id || productId}
              className={`relative bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 ${
                isYearly
                  ? 'border-2 border-amber-400 dark:border-amber-600 shadow-xl shadow-amber-500/5'
                  : 'border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-teal-500/40'
              }`}
            >
              {/* Badge Rekomendasi / Paling Hemat Khusus Paket Tahunan */}
              {isYearly && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[11px] font-extrabold uppercase tracking-wider py-1 px-3.5 rounded-full shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                  <Crown size={13} className="fill-white" />
                  <span>Paling Hemat • 2 Bulan Gratis</span>
                </div>
              )}

              {/* Bagian Header Kartu: Nama & Ikon Paket */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                      {isYearly ? 'PAKET TAHUNAN' : 'PAKET BULANAN'}
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#0f172a] dark:text-white tracking-tight">
                      {product.name}
                    </h3>
                  </div>

                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isYearly
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                        : 'bg-teal-50 dark:bg-teal-950/40 text-[#0d9488] dark:text-teal-400 border border-teal-200 dark:border-teal-800/60'
                    }`}
                  >
                    {isYearly ? <Sparkles size={20} /> : <Crown size={20} />}
                  </div>
                </div>

                {/* Nominal Harga (Wajib tabular-nums untuk stabilitas layout) */}
                <div className="pt-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] dark:text-white tabular-nums tracking-tight">
                      {formatRupiah(product.price)}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      {isYearly ? '/ 1 Tahun' : '/ 1 Bulan'}
                    </span>
                  </div>

                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
                    {isYearly
                      ? 'Setara Rp 4.160/bulan (Hemat Rp 10.000 dibanding bulanan)'
                      : 'Setara ~Rp 160/hari untuk akses lengkap'}
                  </p>
                </div>

                {/* Rincian Poin Hak Istimewa */}
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                    Hak Istimewa Termasuk:
                  </span>

                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={11} strokeWidth={3} />
                    </div>
                    <span>Akses penuh seluruh rincian Wariga & Ala Ayuning</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={11} strokeWidth={3} />
                    </div>
                    <span>Kalkulator Wariga Personal tanpa batasan kuota</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={11} strokeWidth={3} />
                    </div>
                    <span>Hak mengajukan diri & mendaftarkan piodalan pura</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={11} strokeWidth={3} />
                    </div>
                    <span>
                      {isYearly
                        ? 'Prioritas verifikasi data & aktif selama 365 hari penuh'
                        : 'Masa aktif 30 hari kalender'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tombol Aksi Pembayaran Midtrans */}
              <div className="pt-6">
                <button
                  type="button"
                  disabled={Boolean(processingProductId)}
                  onClick={() => onSelectProduct(product)}
                  className={`w-full h-11 px-6 rounded-xl font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50 disabled:cursor-not-allowed ${
                    isYearly
                      ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white'
                      : 'bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Menghubungkan ke Midtrans...</span>
                    </>
                  ) : (
                    <span>
                      {isYearly ? 'Pilih Paket Tahunan' : 'Pilih Paket Bulanan'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

