import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { usePremium } from '../hooks/usePremium';
import { PremiumHero } from '../components/PremiumHero';
import { PremiumPlanCards } from '../components/PremiumPlanCards';
import { PremiumBenefitsGrid } from '../components/PremiumBenefitsGrid';
import { PremiumHistoryModal } from '../components/PremiumHistoryModal';
import { PremiumSkeleton } from '../components/PremiumSkeleton';
import { QueryErrorState } from '@/components/ui/QueryErrorState';

/**
 * ==============================================================================
 * HALAMAN UTAMA: PremiumPage (Jadi Member Premium & Langganan)
 * ==============================================================================
 * Halaman orkestrator yang menyatukan alur produk langganan 100% REAL dari Go:
 *  1. Header & Breadcrumb dengan status tier pengguna (PremiumHero)
 *  2. Dua kartu pilihan paket Bulanan & Tahunan (PremiumPlanCards)
 *  3. Empat pilar keunggulan hak istimewa member (PremiumBenefitsGrid)
 *  4. Dialog modal pop-up riwayat transaksi (PremiumHistoryModal)
 *  5. Dynamic Document Title sinkron sesuai pedoman fe_strategy.md 8.13
 * ==============================================================================
 */
export default function PremiumPage() {
  const {
    products,
    isLoadingProducts,
    isErrorProducts,
    productsError,
    refetchProducts,
    activeSubscription,
    isLoadingActiveSubscription,
    activeSubscriptionError,
    refetchActiveSubscription,
    purchasesHistory,
    isLoadingHistory,
    historyError,
    refetchHistory,
    processingProductId,
    handleCheckout,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    user,
  } = usePremium();

  // Sinkronisasi Judul Tab Browser Dinamis (fe_strategy.md 8.13)
  useEffect(() => {
    document.title = 'Member Premium & Langganan · Akses Fitur Penuh | Kalender Bali';
  }, []);

  const historyModal = (
    <PremiumHistoryModal
      isOpen={isHistoryModalOpen}
      onClose={() => setIsHistoryModalOpen(false)}
      purchases={purchasesHistory}
      isLoading={isLoadingHistory}
      error={historyError}
      onRetry={() => refetchHistory()}
    />
  );

  // Kondisi 1: Sedang memuat data katalog paket (Skeleton presisi, CLS = 0)
  if (isLoadingProducts) {
    return <PremiumSkeleton />;
  }

  // Kondisi 2: Terjadi kegagalan jaringan saat mengambil paket
  if (isErrorProducts) {
    return (
      <div className="space-y-6">
        <PremiumHero
          user={user}
          activeSubscription={activeSubscription}
          isSubscriptionUnavailable={Boolean(activeSubscriptionError) || isLoadingActiveSubscription}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
        />
        {activeSubscriptionError && <QueryErrorState title="Status langganan belum dapat diperiksa" error={activeSubscriptionError} onRetry={() => refetchActiveSubscription()} />}
        {historyModal}

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-8 text-center max-w-md mx-auto space-y-4 my-8 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Gagal Memuat Paket Langganan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {productsError instanceof Error
                ? productsError.message
                : 'Terjadi gangguan saat menghubungkan ke server Kalender Bali.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetchProducts()}
            className="h-10 px-5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] text-white text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer [touch-action:manipulation]"
          >
            <RefreshCw size={14} />
            <span>Coba Lagi</span>
          </button>
        </div>
      </div>
    );
  }

  // Kondisi 3: Berhasil memuat data (Tampilan Normal)
  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header & Status Keanggotaan Akun */}
      <PremiumHero
        user={user}
        activeSubscription={activeSubscription}
        isSubscriptionUnavailable={Boolean(activeSubscriptionError) || isLoadingActiveSubscription}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
      />

      {/* 2. Kartu Pilihan Paket (Bulanan & Tahunan) */}
      {activeSubscriptionError && <QueryErrorState title="Status langganan belum dapat diperiksa" error={activeSubscriptionError} onRetry={() => refetchActiveSubscription()} />}
      <PremiumPlanCards
        products={products}
        processingProductId={processingProductId}
        onSelectProduct={handleCheckout}
      />

      {/* 3. Empat Pilar Keunggulan Member */}
      <PremiumBenefitsGrid />

      {/* 4. Modal Pop-up Riwayat Transaksi */}
      {historyModal}
    </div>
  );
}
