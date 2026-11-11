/**
 * ==============================================================================
 * TIPE DATA FITUR: MEMBER PREMIUM & LANGGANAN
 * ==============================================================================
 * Berkas ini mendefinisikan seluruh kontrak tipe data (TypeScript interfaces)
 * yang selaras 100% dengan skema Data Transfer Object (DTO) backend Go.
 * ==============================================================================
 */

/**
 * Entitas produk langganan yang ditarik langsung dari database PostgreSQL
 * melalui endpoint GET /api/v1/subscription-products
 */
export interface SubscriptionProduct {
  /** ID unik produk di database */
  id: number;
  /** Identifier unik produk dari provider (contoh: "member_premium_bulanan_1") */
  product_id: string;
  /** Nama tampilan paket langganan (contoh: "Member Premium Bulanan") */
  name: string;
  /** Harga paket dalam nominal Rupiah numerik (contoh: 5000 atau 50000) */
  price: number;
}

/**
 * Status hak istimewa (entitlement) pengguna aktif dari endpoint
 * GET /api/v1/purchases/my-active-product
 */
export interface UserEntitlement {
  /** Penanda apakah pengguna saat ini berstatus premium */
  is_premium: boolean;
  /** Tanggal masa kedaluwarsa langganan aktif (ISO string atau null jika tidak aktif) */
  active_until: string | null;
  /** Kode produk aktif yang sedang digunakan pengguna */
  active_product: string | null;
}

/**
 * Entitas riwayat transaksi langganan pengguna dari endpoint
 * GET /api/v1/purchases/my-purchases
 */
export interface PurchaseHistoryItem {
  /** ID unik transaksi di tabel store_purchases */
  id: number;
  /** ID pengguna pemilik transaksi */
  user_id: number;
  /** Kode produk langganan yang dibeli */
  product_id: string;
  /** Nama paket langganan */
  product_name: string;
  /** ID pesanan dari provider payment gateway (contoh: order-xxx) */
  provider_purchase_id: string;
  /** Nominal transaksi jika tersedia */
  gross_amount?: number;
  /** Token transaksi Midtrans Snap */
  purchase_token?: string;
  /** Waktu transaksi dibuat / dibayar */
  purchased_at: string | null;
  /** Tanggal masa berlaku langganan ini berakhir */
  expired_at: string | null;
  /** Status transaksi: "settlement" | "pending" | "expire" | "cancel" */
  status: string;
  /** Waktu pencatatan transaksi */
  created_at?: string;
}

/**
 * Respon pesanan Midtrans baru dari endpoint POST /api/v1/purchases/midtrans
 */
export interface MidtransOrderResponse {
  /** ID unik pesanan transaksi */
  order_id: string;
  /** Total nominal pembayaran yang harus diselesaikan (Rupiah) */
  gross_amount: number;
  /** Snap token untuk memicu popup pembayaran Midtrans */
  token: string;
  /** URL pengalihan halaman pembayaran resmi Midtrans (fallback jika popup Snap terblokir) */
  redirect_url: string;
}

/**
 * Kartu keuntungan hak istimewa member premium (presentasi frontend)
 */
export interface BenefitCardItem {
  id: string;
  title: string;
  description: string;
  category: 'kalender' | 'wariga' | 'pura' | 'garis-hidup';
  badge: string;
}
