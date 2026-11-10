import { apiClient } from '@/lib/axios';
import type {
  DewasaActivity,
  DewasaActivitySummary,
  DewasaApiEnvelope,
  DewasaCriteriaField,
  DewasaCriteriaValue,
  DewasaSearchData,
  DewasaSearchMeta,
  DewasaSearchResponse,
  MengaturDewasaSearchRequest,
} from '../types/mengaturDewasa.types';

// Pertahankan metadata pencarian dan tolak envelope sukses tanpa data.
function requireData<T>(envelope: DewasaApiEnvelope<T>): T {
  if (envelope.error) throw new Error(envelope.error.message);
  if (envelope.data === null || envelope.data === undefined) {
    throw new Error('Data Mengatur Dewasa tidak tersedia.');
  }
  return envelope.data;
}

// Katalog publik: template, detail aturan, field, dan pilihan referensi resmi.
export async function fetchDewasaActivities(signal?: AbortSignal): Promise<DewasaActivitySummary[]> {
  const response = await apiClient.get<DewasaApiEnvelope<DewasaActivitySummary[]>>(
    '/mengatur-dewasa/activities', { signal },
  );
  return requireData(response.data);
}

export async function fetchDewasaActivity(id: string, signal?: AbortSignal): Promise<DewasaActivity> {
  const response = await apiClient.get<DewasaApiEnvelope<DewasaActivity>>(
    `/mengatur-dewasa/activities/${encodeURIComponent(id)}`, { signal },
  );
  return requireData(response.data);
}

export async function fetchDewasaCriteriaFields(signal?: AbortSignal): Promise<DewasaCriteriaField[]> {
  const response = await apiClient.get<DewasaApiEnvelope<DewasaCriteriaField[]>>(
    '/mengatur-dewasa/criteria-fields', { signal },
  );
  return requireData(response.data);
}

export async function fetchDewasaCriteriaValues(field: string, signal?: AbortSignal): Promise<DewasaCriteriaValue[]> {
  const response = await apiClient.get<DewasaApiEnvelope<DewasaCriteriaValue[]>>(
    `/mengatur-dewasa/criteria-fields/${encodeURIComponent(field)}/values`, { signal },
  );
  return requireData(response.data);
}

// Pencarian hanya dijalankan setelah submit dan menggunakan token dari apiClient.
export async function searchMengaturDewasa(
  request: MengaturDewasaSearchRequest,
  signal?: AbortSignal,
): Promise<DewasaSearchResponse> {
  const response = await apiClient.post<DewasaApiEnvelope<DewasaSearchData, DewasaSearchMeta>>(
    '/search/mengatur-dewasa', request, { signal },
  );
  return { data: requireData(response.data), meta: response.data.meta };
}
