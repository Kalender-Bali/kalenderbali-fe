import { hasActivePremium } from '@/lib/subscription';
import { apiClient } from '@/lib/axios';
import { apiObject } from '@/lib/apiResponse';
import { useAuthStore, type AuthUser } from '@/stores/useAuthStore';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationResponse,
  ForgotPasswordResponse,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  GoogleLoginRequest,
  GoogleLoginResponse,
  GoogleRegisterRequest,
  GoogleLinkRequest,
  UserProfileResponse,
  BackendUserProfile,
  UserSubscriptionResponse,
  UserSubscriptionData,
  UserTier,
} from '../types/auth.types';

export class ProfileLoadError extends Error {
  readonly code = 'PROFILE_UNAVAILABLE';

  constructor(cause?: unknown) {
    super('Profil akun belum berhasil dimuat. Silakan coba login kembali.', { cause });
    this.name = 'ProfileLoadError';
  }
}

// Identitas wajib berasal dari profil resmi; respons kosong/parsial tidak menjadi sesi.
function assertUserProfile(value: unknown): asserts value is BackendUserProfile {
  const profile = value as Partial<BackendUserProfile> | null | undefined;
  const validId = typeof profile?.id === 'number'
    ? Number.isSafeInteger(profile.id) && profile.id > 0
    : typeof profile?.id === 'string' && /^[1-9]\d*$/.test(profile.id);

  if (!validId
    || typeof profile?.name !== 'string' || !profile.name.trim()
    || typeof profile?.email !== 'string' || !profile.email.trim()
    || typeof profile?.role !== 'string' || !profile.role.trim()
    || typeof profile?.is_verified !== 'boolean') {
    throw new ProfileLoadError();
  }
}

/**
 * ==============================================================================
 * HELPER: MENGHITUNG TIER PENGGUNA UNTUK TAMPILAN ANTARMUKA (FRONTEND)
 * ==============================================================================
 * Aturan Pemetaan:
 * 1. Admin: Jika role backend adalah 'admin', tetap tampil sebagai 'Admin'.
 * 2. Premium: Jika memiliki transaksi yang masih aktif di tabel store_purchases
 *    (is_premium bernilai true dan masa berlaku belum kedaluwarsa).
 * 3. Free: Pengguna biasa (guest / member) tanpa paket premium atau yang sudah habis masa aktifnya.
 *
 * *Catatan Arsitektur: Role di database & backend tetap utuh (guest, member, admin).
 * Hanya label dan visualisasi antarmuka di frontend yang membedakan Free vs Premium.
 */
export function getUserTier(
  role?: string,
  isPremium?: boolean,
  premiumExpiresAt?: string | null
): UserTier {
  const normalizedRole = (role || '').trim().toLowerCase();
  if (normalizedRole === 'admin') {
    return 'Admin';
  }

  return hasActivePremium({ isPremium, premiumExpiresAt }) ? 'Premium' : 'Free';
}

/**
 * ==============================================================================
 * HELPER: NORMALISASI PROFIL PENGGUNA (Backend User + Subscription -> AuthUser)
 * ==============================================================================
 * Mengonversi format entitas profil dan data langganan tabel store_purchases
 * menjadi entitas yang siap dikonsumsi oleh store dan komponen antarmuka React.
 */
export function normalizeUserProfile(
  profile: BackendUserProfile,
  subscription?: UserSubscriptionData | null
): AuthUser {
  assertUserProfile(profile);
  // Evaluasi keaktifan premium dari pengecekan tabel store_purchases
  const premiumExpiresAt = subscription?.active_until ?? profile.premium_expires_at ?? null;
  const isPremium = hasActivePremium({
    isPremium: Boolean(subscription?.is_premium ?? profile.is_premium),
    premiumExpiresAt,
  });

  // Hitung tier tampilan antarmuka (Admin | Premium | Free)
  const tier = getUserTier(profile.role, isPremium, premiumExpiresAt);

  return {
    id: String(profile.id),
    name: profile.name,
    email: profile.email,
    phone: profile.phone || '',
    role: profile.role,
    tier,
    isVerified: profile.is_verified,
    avatar: profile.avatar || null,
    avatarUrl: profile.avatar || null,
    username: profile.email ? profile.email.split('@')[0] : profile.name,
    contributionStatus: profile.contribution_status || null,
    isPremium,
    premiumExpiresAt,
  };
}

/**
 * ==============================================================================
 * AUTH SERVICE: PUSAT PEMANGGILAN API AUTENTIKASI BACKEND GO
 * ==============================================================================
 */
export const authService = {
  /**
   * Mengirim kredensial login (email & kata sandi) ke backend
   * Endpoint: POST /api/v1/login
   */
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/login', payload);
    return response.data;
  },

  /**
   * Mengambil data profil lengkap pengguna yang sedang aktif menggunakan Bearer Token
   * Endpoint: GET /api/v1/users/profile
   */
  async getProfile(customToken?: string): Promise<BackendUserProfile> {
    try {
      const headers = customToken ? { Authorization: `Bearer ${customToken}` } : undefined;
      const response = await apiClient.get<UserProfileResponse>('/users/profile', { headers });
      const profile = response.data?.data;
      assertUserProfile(profile);
      return profile;
    } catch (error) {
      throw error instanceof ProfileLoadError ? error : new ProfileLoadError(error);
    }
  },

  /**
   * Mengambil status langganan aktif pengguna langsung dari tabel store_purchases
   * Endpoint: GET /api/v1/purchases/my-active-product
   */
  async getMyActiveSubscription(customToken?: string): Promise<UserSubscriptionData> {
    const headers = customToken ? { Authorization: `Bearer ${customToken}` } : undefined;
    const response = await apiClient.get<UserSubscriptionResponse>('/purchases/my-active-product', { headers });
    const subscription = apiObject<UserSubscriptionData>(response.data?.data);
    if (typeof subscription.is_premium !== 'boolean') throw new Error('Respons status langganan tidak valid. Silakan coba lagi.');
    return subscription;
  },

  /**
   * Helper Tingkat Tinggi: Mengonstruksi AuthUser lengkap dengan pengecekan store_purchases
   */
  async buildAuthUser(profile: BackendUserProfile, customToken?: string): Promise<AuthUser> {
    const officialUser = normalizeUserProfile(profile);
    try {
      const sub = await this.getMyActiveSubscription(customToken);
      return { ...normalizeUserProfile(profile, sub), subscriptionUnavailable: false };
    } catch {
      // Login memakai profil resmi; gangguan langganan ditandai, bukan dianggap Free.
      return { ...officialUser, subscriptionUnavailable: true };
    }
  },

  /**
   * Helper Tingkat Tinggi: Login sekaligus Ambil Profil & Cek Langganan store_purchases
   * Menyederhanakan penulisan kode di komponen antarmuka (LoginPage) agar tetap ringkas.
   */
  async loginAndFetchProfile(payload: LoginRequest): Promise<{
    user: AuthUser;
    token: string;
    refreshToken: string;
  }> {
    // 1. Dapatkan token dari endpoint login (POST /api/v1/login)
    const loginResult = await this.login(payload);
    const token = loginResult.access_token;

    // 2. Profil wajib berhasil. Gangguan pemeriksaan langganan ditandai terpisah.
    // Token belum disimpan ke store sehingga profil gagal tidak membuat sesi semu.
    const profile = await this.getProfile(token);
    const user = await this.buildAuthUser(profile, token);

    return {
      user,
      token: loginResult.access_token,
      refreshToken: loginResult.refresh_token,
    };
  },

  /**
   * Sinkronisasi data langganan pengguna yang sedang login saat aplikasi berjalan.
   * Jika status transaksi di store_purchases berubah atau kedaluwarsa, store diperbarui otomatis.
   */
  async syncUserSubscription(): Promise<AuthUser | null> {
    const currentState = useAuthStore.getState();
    if (!currentState.isAuthenticated || !currentState.user) {
      return null;
    }
    const isCurrentSession = () => {
      const latest = useAuthStore.getState();
      return latest.isAuthenticated && latest.user?.id === currentState.user?.id && latest.token === currentState.token;
    };

    try {
      const sub = await this.getMyActiveSubscription(currentState.token || undefined);
      if (!isCurrentSession()) return useAuthStore.getState().user;

      const premiumExpiresAt = sub.active_until ?? null;
      const isPremium = hasActivePremium({ isPremium: Boolean(sub.is_premium), premiumExpiresAt });
      const tier = getUserTier(currentState.user.role, isPremium, premiumExpiresAt);

      const updatedUser: AuthUser = {
        ...currentState.user,
        isPremium,
        premiumExpiresAt,
        tier,
        subscriptionUnavailable: false,
      };

      currentState.updateUser(updatedUser);
      return updatedUser;
    } catch (error) {
      if (isCurrentSession()) currentState.updateUser({ subscriptionUnavailable: true });
      throw error;
    }
  },

  /**
   * Mendaftarkan pengguna baru ke database backend
   * Endpoint: POST /api/v1/register
   * Backend akan otomatis mengirimkan kode verifikasi 4-digit ke email via Brevo SMTP
   */
  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/register', payload);
    return response.data;
  },

  /**
   * Memverifikasi alamat email menggunakan kode 4-digit numerik yang dikirim via email
   * Endpoint: POST /api/v1/verify-email
   */
  async verifyEmail(payload: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const response = await apiClient.post<VerifyEmailResponse>('/verify-email', payload);
    return response.data;
  },

  /**
   * Meminta pengiriman ulang kode verifikasi email jika kode sebelumnya kedaluwarsa
   * Endpoint: POST /api/v1/resend-verification (Jeda cooldown 60 detik)
   */
  async resendVerification(email: string): Promise<ResendVerificationResponse> {
    const response = await apiClient.post<ResendVerificationResponse>('/resend-verification', { email });
    return response.data;
  },

  /**
   * Lupa Password Langkah 1: Meminta pengiriman kode reset ke email
   * Endpoint: POST /api/v1/forgot-password
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>('/forgot-password', { email });
    return response.data;
  },

  /**
   * Lupa Password Langkah 2: Memverifikasi kode 4-digit reset untuk mendapatkan reset_grant
   * Endpoint: POST /api/v1/verify-reset-code
   */
  async verifyResetCode(payload: VerifyResetCodeRequest): Promise<VerifyResetCodeResponse> {
    const response = await apiClient.post<VerifyResetCodeResponse>('/verify-reset-code', payload);
    return response.data;
  },

  /**
   * Lupa Password Langkah 3: Mengubah kata sandi baru menggunakan reset_grant
   * Endpoint: POST /api/v1/reset-password
   */
  async resetPassword(payload: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await apiClient.post<ResetPasswordResponse>('/reset-password', payload);
    return response.data;
  },

  /**
   * Autentikasi Google: Mengirimkan ID Token dari Google Identity Services
   * Endpoint: POST /api/v1/auth/google
   */
  async googleLogin(idToken: string): Promise<GoogleLoginResponse> {
    const payload: GoogleLoginRequest = { id_token: idToken };
    const response = await apiClient.post<GoogleLoginResponse>('/auth/google', payload);
    return response.data;
  },

  /**
   * Pendaftaran akun Google baru yang belum lengkap (profil & password)
   * Endpoint: POST /api/v1/auth/google/register
   */
  async googleRegister(payload: GoogleRegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/google/register', payload);
    return response.data;
  },

  /**
   * Menautkan akun Google ke akun lokal yang sudah ada
   * Endpoint: POST /api/v1/auth/google/link
   */
  async googleLink(payload: GoogleLinkRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/google/link', payload);
    return response.data;
  },

  /**
   * Menghapus sesi masuk di backend dan membersihkan penyimpanan state lokal
   * Endpoint: POST /api/v1/logout
   */
  async logout(): Promise<void> {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) {
        await apiClient.post('/logout', { refresh_token: refreshToken });
      }
    } catch (err) {
      // Sesuai kontrak: logout di sisi klien tetap wajib dilakukan walaupun request jaringan gagal
      console.warn('Network logout failed, clearing local session anyway:', err);
    } finally {
      useAuthStore.getState().logout();
    }
  },
};
