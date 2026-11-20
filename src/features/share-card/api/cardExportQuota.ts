import { apiClient } from '@/lib/axios';

export interface CardExportQuota {
  date: string;
  timezone: string;
  used: number;
  limit: number;
  remaining: number;
  resets_at: string;
  is_unlimited: boolean;
}

type ExportAuthorization =
  | { allowed: true; quota: CardExportQuota }
  | { allowed: false; quota: CardExportQuota };

export async function fetchCardExportQuota(token: string, signal?: AbortSignal) {
  const response = await apiClient.get<{ data: CardExportQuota }>('/users/card-export-quota', {
    headers: { Authorization: `Bearer ${token}` }, signal,
  });
  return response.data.data;
}

export async function authorizeCardExport(token: string, operationId: string, signal: AbortSignal): Promise<ExportAuthorization> {
  const response = await apiClient.post<{ data: CardExportQuota; code?: string }>(
    '/users/card-exports',
    { operation_id: operationId },
    {
      headers: { Authorization: `Bearer ${token}` }, signal,
      // Kuota yang dikembalikan pada 409 juga merupakan status terbaru dari Go.
      validateStatus: (status) => (status >= 200 && status < 300) || status === 409,
    },
  );
  if (response.status === 409) {
    if (response.data.code !== 'daily_card_limit_reached') throw new Error('Izin ekspor gagal diperiksa.');
    return { allowed: false, quota: response.data.data };
  }
  if (!response.data?.data) throw new Error('Izin ekspor gagal diperiksa.');
  return { allowed: true, quota: response.data.data };
}
