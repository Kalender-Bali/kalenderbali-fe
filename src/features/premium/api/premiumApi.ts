import { apiArray, apiObject } from '@/lib/apiResponse';
import { toApiError } from '@/lib/apiError';
import { apiClient } from '@/lib/axios';
import type {
  SubscriptionProduct,
  UserEntitlement,
  PurchaseHistoryItem,
  MidtransOrderResponse,
} from '../types/premium.types';

/**
 * ==============================================================================
 * LAPISAN API: MEMBER PREMIUM & TRANSAKSI PEMBAYARAN
 * ==============================================================================
 * Mengatur seluruh panggilan jaringan HTTP langsung ke endpoint resmi backend Go:
 *  1. GET /api/v1/subscription-products   -> Katalog paket langganan riil
 *  2. GET /api/v1/purchases/my-active-product -> Status aktif langganan pengguna
 *  3. GET /api/v1/purchases/my-purchases      -> Riwayat riil transaksi pengguna
 *  4. POST /api/v1/purchases/midtrans         -> Inisiasi order token Midtrans
 * ==============================================================================
 */

export const premiumApi = {
  /**
   * Mengambil daftar paket produk langganan yang tersedia dari PostgreSQL
   * Endpoint: GET /api/v1/subscription-products (Publik)
   */
  async getSubscriptionProducts(): Promise<SubscriptionProduct[]> {
    try {
      const response = await apiClient.get<{ data: SubscriptionProduct[] }>(
        '/subscription-products'
      );
      return apiArray<SubscriptionProduct>(response.data?.data);
    } catch (caught) {
      const error = toApiError(caught);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        'Gagal memuat daftar paket langganan dari server.';
      throw new Error(message, { cause: caught });
    }
  },

  /**
   * Mengambil status langganan aktif pengguna yang sedang login
   * Endpoint: GET /api/v1/purchases/my-active-product (Harus login)
   */
  async getMyActiveSubscription(): Promise<UserEntitlement | null> {
    try {
      const response = await apiClient.get<{ data: UserEntitlement }>(
        '/purchases/my-active-product'
      );
      const subscription = apiObject<UserEntitlement>(response.data?.data);
      if (typeof subscription.is_premium !== 'boolean') throw new Error('Respons status langganan tidak valid. Silakan coba lagi.');
      return subscription;
    } catch (caught) {
      const error = toApiError(caught);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        'Gagal memeriksa status langganan aktif.';
      throw new Error(message, { cause: caught });
    }
  },

  /**
   * Mengambil riwayat transaksi pembelian paket milik akun pengguna
   * Endpoint: GET /api/v1/purchases/my-purchases (Harus login)
   */
  async getMyPurchases(): Promise<PurchaseHistoryItem[]> {
    try {
      const response = await apiClient.get<{ data: PurchaseHistoryItem[] }>(
        '/purchases/my-purchases'
      );
      return apiArray<PurchaseHistoryItem>(response.data?.data);
    } catch (caught) {
      const error = toApiError(caught);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        'Gagal memuat riwayat transaksi pembayaran.';
      throw new Error(message, { cause: caught });
    }
  },

  /**
   * Memulai pesanan pembelian paket premium ke Midtrans Payment Gateway
   * Endpoint: POST /api/v1/purchases/midtrans (Harus login)
   *
   * @param productId Identifier paket produk (contoh: "member_premium_bulanan_1")
   * @returns Data pesanan berisi order_id, snap token, dan redirect_url
   */
  async createMidtransOrder(productId: string): Promise<MidtransOrderResponse> {
    try {
      const response = await apiClient.post<{
        message: string;
        data: MidtransOrderResponse;
      }>('/purchases/midtrans', {
        product_id: productId,
      });

      if (!response.data?.data) {
        throw new Error('Respon transaksi dari server tidak valid.');
      }

      return response.data.data;
    } catch (caught) {
      const error = toApiError(caught);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        'Gagal memulai proses transaksi pembayaran. Silakan coba lagi.';
      throw new Error(message, { cause: caught });
    }
  },
};

