import type {
  PuraFinanceCategory, PuraFinanceEntry, PuraFinanceSummary,
  CreateFinanceEntryPayload, UpdateFinanceEntryPayload,
} from '@/features/kelola-pura/types/kelolaPura.types';

/** Direktori menggunakan profil Suka Duka, bukan tipe pura atau role akun baru. */
export const COMMUNITY_TYPE = 'Suka Duka' as const;
export type KomunitasStatus = 'Published' | 'Review' | 'Rejected';
export type KomunitasTab = 'semua' | 'saya' | 'pengajuan';
export interface KomunitasLocation { address: string; city: string; province: string; country: string }
export interface KomunitasSummary {
  id: number;
  name: string;
  type: typeof COMMUNITY_TYPE;
  location: KomunitasLocation;
  status?: KomunitasStatus;
}
export interface KomunitasManager { user_id: number; name: string; email: string }

/** Detail HTTP memiliki lokasi di tingkat atas dan field pengelola bernama manager. */
export interface KomunitasDetail extends KomunitasLocation {
  id: number;
  name: string;
  type: typeof COMMUNITY_TYPE;
  status: KomunitasStatus;
  phone: string;
  location_url: string;
  country_id?: number;
  province_id?: number;
  city_id?: number;
  latitude?: number;
  longitude?: number;
  manager: KomunitasManager[];
}
export interface KomunitasFilters { search: string; country: string; province: string; city: string }
export interface KomunitasPageData {
  data: KomunitasSummary[];
  pagination: { limit: number; has_more: boolean; next_cursor: string | null };
}
export interface KomunitasRegionCountry { name: string; provinces: { name: string; cities: string[] }[] }
export interface KomunitasRegions { countries: KomunitasRegionCountry[] }
export interface GeoOption { id: number; code: string; name: string }
export interface KomunitasMember { id: number; name: string; email: string }

/** Payload eksplisit mencegah field odalan, status, atau mapping disisipkan lewat form. */
export interface KomunitasPayload {
  name: string;
  type: typeof COMMUNITY_TYPE;
  phone: string;
  address: string;
  country_id: number;
  province_id?: number;
  city_id?: number;
  location_url: string;
  latitude?: number;
  longitude?: number;
}

/** Struktur keuangan dipakai bersama, tetapi pemilik kas selalu ID profil terpilih. */
export type KomunitasFinanceCategory = PuraFinanceCategory;
export type KomunitasFinanceEntry = PuraFinanceEntry;
export type KomunitasFinanceSummary = Omit<PuraFinanceSummary, 'entries'>;
export type KomunitasFinancePayload = CreateFinanceEntryPayload;
export type KomunitasFinanceUpdate = UpdateFinanceEntryPayload;
