import { apiClient } from '@/lib/axios';
import { apiArray, apiObject } from '@/lib/apiResponse';
import { COMMUNITY_TYPE } from '../types/komunitas.types';
import type {
  KomunitasDetail, KomunitasFilters, KomunitasManager, KomunitasMember, KomunitasPageData,
  KomunitasPayload, KomunitasRegions, KomunitasStatus, KomunitasSummary, KomunitasTab, GeoOption,
} from '../types/komunitas.types';
import { positiveId, safeHttpUrl } from '../utils/komunitasUtils';

/** Kas memakai fungsi HTTP resmi yang sama; tidak ada request keuangan duplikat. */
export {
  fetchFinanceCategories, fetchPuraFinance, fetchPuraFinanceSummary,
  createFinanceEntry, updateFinanceEntry, deleteFinanceEntry,
} from '@/features/kelola-pura/api/kelolaPuraApi';

const invalid = () => new Error('Respons komunitas dari server tidak valid. Silakan coba lagi.');
function object(value: unknown) { return apiObject<Record<string, unknown>>(value); }
function requiredString(value: unknown): string { if (typeof value !== 'string') throw invalid(); return value; }
function optionalString(value: unknown): string { return value == null ? '' : requiredString(value); }
function id(value: unknown): number { const result = positiveId(value); if (!result) throw invalid(); return result; }
function status(value: unknown): KomunitasStatus {
  if (value !== 'Published' && value !== 'Review' && value !== 'Rejected') throw invalid();
  return value;
}
function manager(value: unknown): KomunitasManager {
  const row = object(value);
  return { user_id: id(row.user_id), name: requiredString(row.name), email: requiredString(row.email) };
}

/** Ringkasan dan detail diparse terpisah agar bentuk lokasi yang berbeda tidak tertukar. */
export function parseCommunitySummary(value: unknown, privateTab = false): KomunitasSummary {
  const row = object(value), location = object(row.location);
  if (row.type !== COMMUNITY_TYPE) throw new Error('Data di luar direktori Suka Duka ditolak.');
  return { id: id(row.id), name: requiredString(row.name), type: COMMUNITY_TYPE,
    location: { address: requiredString(location.address), city: requiredString(location.city), province: requiredString(location.province), country: requiredString(location.country) },
    ...(privateTab ? { status: status(row.status) } : {}),
  };
}
export function parseCommunityDetail(value: unknown): KomunitasDetail {
  const row = object(value);
  if (row.type !== COMMUNITY_TYPE) throw new Error('Profil ini bukan komunitas Suka Duka. Buka melalui Kelola Pura.');
  const optionalId = (key: string) => row[key] == null ? undefined : id(row[key]);
  const coordinate = (key: string, bound: number) => {
    const value = row[key];
    if (value == null) return undefined;
    if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > bound) throw invalid();
    return value;
  };
  return { id: id(row.id), name: requiredString(row.name), type: COMMUNITY_TYPE, status: status(row.status),
    address: optionalString(row.address), city: optionalString(row.city), province: optionalString(row.province), country: optionalString(row.country),
    phone: optionalString(row.phone), location_url: optionalString(row.location_url),
    country_id: optionalId('country_id'), province_id: optionalId('province_id'), city_id: optionalId('city_id'),
    latitude: coordinate('latitude', 90), longitude: coordinate('longitude', 180),
    manager: row.manager == null ? [] : apiArray<unknown>(row.manager).map(manager),
  };
}
const directory: Record<KomunitasTab, string> = { semua: '/puras', saya: '/puras/my', pengajuan: '/puras/unpublished' };
export async function fetchCommunities(tab: KomunitasTab, filters: KomunitasFilters, cursor?: string, signal?: AbortSignal): Promise<KomunitasPageData> {
  const { data } = await apiClient.get(directory[tab], { signal, params: {
    view: 'summary', scope: 'community', limit: 20, cursor,
    ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim())),
  } });
  const page = object(data), pagination = object(page.pagination);
  if (!Number.isInteger(pagination.limit) || Number(pagination.limit) < 1 || Number(pagination.limit) > 100 ||
      typeof pagination.has_more !== 'boolean' || !(pagination.next_cursor === null || typeof pagination.next_cursor === 'string') ||
      (pagination.has_more && !pagination.next_cursor)) throw invalid();
  return { data: apiArray<unknown>(page.data).map(row => parseCommunitySummary(row, tab !== 'semua')),
    pagination: { limit: Number(pagination.limit), has_more: pagination.has_more, next_cursor: pagination.next_cursor as string | null } };
}
export async function fetchCommunityRegions(tab: KomunitasTab, signal?: AbortSignal): Promise<KomunitasRegions> {
  const { data } = await apiClient.get(`${directory[tab]}/regions`, { signal, params: { scope: 'community' } });
  return { countries: apiArray<unknown>(object(data.data).countries).map(value => {
    const country = object(value);
    return { name: requiredString(country.name), provinces: apiArray<unknown>(country.provinces).map(value => {
      const province = object(value);
      return { name: requiredString(province.name), cities: apiArray<unknown>(province.cities).map(requiredString) };
    }) };
  }) };
}
export async function fetchCommunity(idValue: number, signal?: AbortSignal): Promise<KomunitasDetail> {
  const response = await apiClient.get(`/puras/${id(idValue)}`, { signal });
  const profile = parseCommunityDetail(response.data?.data);
  if (profile.id !== idValue) throw invalid();
  return profile;
}

/** Whitelist payload mengunci tipe dan mencegah status/pengelola/odalan dikirim oleh form. */
export function communityPayload(input: KomunitasPayload): KomunitasPayload {
  if (!input.name.trim() || !input.phone.trim() || !input.address.trim() || !safeHttpUrl(input.location_url)) throw new Error('Lengkapi nama, telepon, alamat, dan URL peta HTTP/HTTPS.');
  const coordinate = (value: number | undefined, bound: number) => {
    if (value !== undefined && (!Number.isFinite(value) || Math.abs(value) > bound)) throw new Error('Koordinat tidak valid.');
    return value;
  };
  return { name: input.name.trim(), type: COMMUNITY_TYPE, phone: input.phone.trim(), address: input.address.trim(),
    country_id: id(input.country_id), ...(input.province_id ? { province_id: id(input.province_id) } : {}), ...(input.city_id ? { city_id: id(input.city_id) } : {}),
    location_url: input.location_url.trim(), latitude: coordinate(input.latitude, 90), longitude: coordinate(input.longitude, 180) };
}
export async function saveCommunity(input: KomunitasPayload, communityId?: number) {
  const payload = communityPayload(input);
  const response = communityId ? await apiClient.put(`/puras/${id(communityId)}`, payload) : await apiClient.post('/puras', payload);
  return parseCommunityDetail(response.data?.data);
}
export async function moderateCommunity(communityId: number, nextStatus: 'Published' | 'Rejected') {
  const response = await apiClient.put(`/puras/${id(communityId)}/status`, { status: nextStatus });
  return parseCommunityDetail(response.data?.data);
}
export async function deleteCommunity(communityId: number) { await apiClient.delete(`/puras/${id(communityId)}`); }
export async function addCommunityManager(communityId: number, userId: number) { await apiClient.post(`/puras/${id(communityId)}/managers`, { user_id: id(userId) }); }
export async function removeCommunityManager(communityId: number, userId: number) { await apiClient.delete(`/puras/${id(communityId)}/managers/${id(userId)}`); }
export async function fetchCommunityManagers(communityId: number, signal?: AbortSignal) {
  const response = await apiClient.get(`/puras/${id(communityId)}/managers`, { signal });
  return apiArray<unknown>(response.data?.data).map(manager);
}

/** Pembacaan kandidat ditangani query satu kali, tanpa retry service admin bertumpuk. */
export async function fetchCommunityMembers(signal?: AbortSignal): Promise<KomunitasMember[]> {
  const response = await apiClient.get('/admin/members', { signal });
  return apiArray<unknown>(response.data?.data).map(value => {
    const row = object(value); return { id: id(row.id), name: requiredString(row.name), email: requiredString(row.email) };
  });
}
export async function fetchGeoOptions(level: 'countries' | 'provinces' | 'cities', parent?: number, signal?: AbortSignal): Promise<GeoOption[]> {
  const path = level === 'countries' ? '/geo/countries' : level === 'provinces' ? `/geo/countries/${id(parent)}/provinces` : `/geo/provinces/${id(parent)}/cities`;
  const response = await apiClient.get(path, { signal });
  return apiArray<unknown>(response.data?.data).map(value => {
    const row = object(value); return { id: id(row.id), code: requiredString(row.code), name: requiredString(row.name) };
  });
}
