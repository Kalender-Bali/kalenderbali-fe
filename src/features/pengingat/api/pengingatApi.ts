import { apiClient } from '@/lib/axios';
import { apiArray } from '@/lib/apiResponse';
import type { PengingatEntry, PengingatNotificationPage, PengingatPolicy } from '../types/pengingat.types';

export async function fetchPengingatPolicy(signal?: AbortSignal): Promise<PengingatPolicy> {
  const response = await apiClient.get<{ data: PengingatPolicy }>('/reminders/limits', { signal });
  const policy = response.data?.data;
  if (!policy || !((policy.tier === 'Free' && policy.maxPerFeature === 1 && policy.canRepeat === false) ||
    (policy.tier === 'Premium' && policy.maxPerFeature === 10 && policy.canRepeat === true))) {
    throw new Error('Batas paket pengingat belum dapat diperiksa.');
  }
  return policy;
}

export function reminderCreatePayload(entry: PengingatEntry) {
  const source = entry.source;
  if (!source) throw new Error('Pilih jadwal dari fitur sumber terlebih dahulu.');
  return {
    kind: entry.kind, title: entry.title, nextDate: entry.nextDate, repeat: entry.repeat,
    alertDays: entry.alertDays, note: entry.note,
    source: source.feature === 'piodalan-pribadi' || source.feature === 'hari-raya-pribadi'
      ? { feature: source.feature, condition: source.condition }
      : { feature: source.feature, request: source.request },
  };
}

export async function fetchPengingat(signal?: AbortSignal): Promise<PengingatEntry[]> {
  const response = await apiClient.get('/reminders', { signal });
  return apiArray<PengingatEntry>(response.data?.data);
}

export async function createPengingat(entry: PengingatEntry): Promise<PengingatEntry> {
  const response = await apiClient.post<{ data: PengingatEntry }>('/reminders', reminderCreatePayload(entry));
  if (!response.data?.data?.id) throw new Error('Pengingat belum berhasil disimpan.');
  return response.data.data;
}

export async function deletePengingat(id: string): Promise<void> {
  await apiClient.delete(`/reminders/${encodeURIComponent(id)}`);
}

export async function fetchPengingatNotifications(page = 1, signal?: AbortSignal): Promise<PengingatNotificationPage> {
  const response = await apiClient.get<{ data: PengingatNotificationPage }>('/reminder-notifications', { params: { page, per_page: 20 }, signal });
  const data = response.data?.data;
  if (!data || !Array.isArray(data.items)) throw new Error('Notifikasi belum dapat dimuat.');
  return data;
}

export async function markPengingatNotificationRead(id: string): Promise<void> {
  await apiClient.put(`/reminder-notifications/${encodeURIComponent(id)}/read`);
}
