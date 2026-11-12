import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useReadQuery } from '@/lib/useReadQuery';
import { useNavigate } from 'react-router-dom';
import { premiumApi } from '../api/premiumApi';
import { useAuthStore, useAuthQueryScope } from '@/stores/useAuthStore';
import { authService } from '@/features/auth/services/authService';
import { useAlertStore } from '@/stores/useAlertStore';
import type { SubscriptionProduct } from '../types/premium.types';

/**
 * ==============================================================================
 * CUSTOM HOOK: usePremium (Manajemen Caching, Status Langganan, & Checkout)
 * ==============================================================================
 * Mengelola sinkronisasi server state menggunakan TanStack Query (fe_strategy.md 7.1)
 * dan orkestrasi checkout pembayaran Midtrans (Snap Popup dengan Fallback Redirect).
 * ==============================================================================
 */
export function usePremium() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const authScope = useAuthQueryScope();
  const { showAlert } = useAlertStore();

  // State proses checkout agar tombol memiliki feedback loading
  const [processingProductId, setProcessingProductId] = useState<string | null>(null);

  // State untuk mengontrol visibilitas dialog modal riwayat transaksi
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // ============================================================================
  // QUERY 1: KATALOG PRODUK LANGGANAN DARI BACKEND GO (100% REAL)
  // StaleTime 30 menit sesuai pedoman fe_strategy.md agar zero-loading
  // ============================================================================
  const productsQuery = useReadQuery({
    queryKey: ['subscription', 'products'],
    queryFn: premiumApi.getSubscriptionProducts,
    staleTime: 1000 * 60 * 30, // 30 Menit fresh di RAM
    gcTime: 1000 * 60 * 60 * 24, // 24 Jam di memori
  });

  // ============================================================================
  // QUERY 2: STATUS LANGGANAN AKTIF PENGGUNA SAAT INI (100% REAL)
  // ============================================================================
  const activeSubscriptionQuery = useReadQuery({
    queryKey: ['subscription', 'my-active-product', authScope],
    meta: { authScoped: true },
    queryFn: premiumApi.getMyActiveSubscription,
    enabled: Boolean(isAuthenticated),
    staleTime: 1000 * 60 * 5, // 5 Menit
  });

  // ============================================================================
  // QUERY 3: RIWAYAT TRANSAKSI PEMBELIAN PENGGUNA (100% REAL)
  // ============================================================================
  const purchasesHistoryQuery = useReadQuery({
    queryKey: ['subscription', 'my-purchases', authScope],
    meta: { authScoped: true },
    queryFn: premiumApi.getMyPurchases,
    enabled: Boolean(isAuthenticated),
    staleTime: 1000 * 60 * 5,
  });

  // ============================================================================
  // HANDLER: INTI ALUR TRANSAKSI PEMBAYARAN MIDTRANS (ROBUST DUAL-ACTION)
  // ============================================================================
  const handleCheckout = async (product: SubscriptionProduct) => {
    // 1. Cek autentikasi: Jika belum login, alihkan ke halaman login
    if (!isAuthenticated || !user) {
      showAlert('Silakan masuk ke akun Anda terlebih dahulu untuk berlangganan.');
      navigate('/login', { state: { from: '/premium' } });
      return;
    }

    setProcessingProductId(product.product_id);

    try {
      // 2. Minta pembuatan order & token snap resmi dari backend Go
      const order = await premiumApi.createMidtransOrder(product.product_id);

      // 3. Verifikasi ketersediaan Midtrans Snap SDK di window
      const snap = (window as unknown as { snap?: { pay: (token: string, options: Record<string, unknown>) => void } }).snap;

      if (snap && typeof snap.pay === 'function') {
        // ALUR A: Buka popup interaktif Midtrans Snap di layar
        snap.pay(order.token, {
          onSuccess: async () => {
            try {
              const current = await authService.syncUserSubscription();
              showAlert(current?.isPremium ? `Paket ${product.name} sudah aktif.` : 'Pembayaran diterima. Aktivasi langganan masih diproses.');
            } catch {
              showAlert('Pembayaran diterima, tetapi status langganan belum berhasil diperiksa. Silakan coba lagi di halaman Premium.');
            } finally {
              queryClient.invalidateQueries({ queryKey: ['subscription'] });
            }
          },
          onPending: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
            showAlert('Pesanan Anda sedang menunggu penyelesaian pembayaran.');
          },
          onError: () => {
            showAlert('Pembayaran gagal atau dibatalkan. Silakan coba kembali.');
          },
          onClose: () => {
            // Popup ditutup oleh pengguna
          },
        });
      } else if (order.redirect_url) {
        // ALUR B (FALLBACK ANTI-GAGAL): Jika Snap popup terblokir ad-blocker,
        // buka tautan redirect resmi Midtrans yang dikirim server Go
        window.location.href = order.redirect_url;
      } else {
        throw new Error('Tautan pembayaran tidak tersedia.');
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memproses pesanan pembayaran.';
      showAlert(errorMsg);
    } finally {
      setProcessingProductId(null);
    }
  };

  return {
    products: productsQuery.data || [],
    isLoadingProducts: productsQuery.isLoading,
    isErrorProducts: productsQuery.isError,
    productsError: productsQuery.error,
    refetchProducts: productsQuery.refetch,

    activeSubscription: activeSubscriptionQuery.data,
    isLoadingActiveSubscription: activeSubscriptionQuery.isLoading,
    activeSubscriptionError: activeSubscriptionQuery.isError ? activeSubscriptionQuery.error : null,
    refetchActiveSubscription: activeSubscriptionQuery.refetch,

    purchasesHistory: purchasesHistoryQuery.data || [],
    isLoadingHistory: purchasesHistoryQuery.isLoading,
    historyError: purchasesHistoryQuery.isError ? purchasesHistoryQuery.error : null,
    refetchHistory: purchasesHistoryQuery.refetch,

    processingProductId,
    handleCheckout,

    isHistoryModalOpen,
    setIsHistoryModalOpen,

    user,
    isAuthenticated,
  };
}

