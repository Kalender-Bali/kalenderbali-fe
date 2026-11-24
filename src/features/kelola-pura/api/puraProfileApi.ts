import { apiClient } from '@/lib/axios';

export interface PuraProfilePayload {
  name: string;
  type: string;
  country_id: number;
  province_id?: number;
  city_id?: number;
  phone?: string;
  address?: string;
  location_url?: string;
  benchmark?: string;
  wuku?: string;
  saptawara?: string;
  pancawara?: string;
  sasih?: string;
  purnama_tilem?: string;
  latitude?: number;
  longitude?: number;
}

// Form Pura memakai endpoint profil yang sama untuk pendaftaran dan perbaikan.
export async function savePuraProfile(payload: PuraProfilePayload, id?: number) {
  const response = id ? await apiClient.put(`/puras/${id}`, payload) : await apiClient.post('/puras', payload);
  return response.data.data;
}

export async function reviewPuraProfile(id: number, status: 'Review' | 'Published' | 'Rejected', note = '') {
  await apiClient.put(`/submissions/pura/${id}/status`, { status, review_note: note });
}

export interface PuraSubmission {
  id: number;
  name: string;
  type: string;
  status: 'Review' | 'Rejected' | 'Published';
  submitted_by?: number | null;
  review_note?: string;
  country_id?: number;
  province_id?: number;
  city_id?: number;
  phone?: string;
  address?: string;
  location_url?: string;
  latitude?: number;
  longitude?: number;
  benchmark?: string;
  wuku?: string;
  saptawara?: string;
  pancawara?: string;
  sasih?: string;
  purnama_tilem?: string;
}

// Filter direktori menjaga pengajuan Suka Duka tetap berada di Komunitas.
export async function fetchPuraSubmissions() {
  const response = await apiClient.get<{ data: PuraSubmission[] }>('/puras/unpublished');
  return response.data.data.filter(item => item.type !== 'Suka Duka');
}
