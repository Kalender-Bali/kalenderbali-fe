import { apiClient } from '@/lib/axios';

export interface KeteranganSubmission {
  id: string;
  value_id: string;
  item_name: string;
  submitter_name: string;
  original_description: string;
  proposed_description: string;
  status: 'Review' | 'Approved' | 'Rejected';
  review_note: string;
  submitted_at: string;
}

export async function submitKeterangan(valueId: string, description: string) {
  await apiClient.post('/keterangan/submissions', { value_id: valueId, description });
}

export async function fetchKeteranganSubmissions(admin: boolean, page: number) {
  const path = admin ? '/admin/keterangan/submissions' : '/keterangan/submissions';
  const response = await apiClient.get<{ data: KeteranganSubmission[]; total: number }>(path, { params: { page, per_page: 20 } });
  return { data: response.data.data ?? [], total: response.data.total };
}

export async function reviewKeterangan(id: string, approve: boolean, reviewNote: string) {
  await apiClient.put(`/admin/keterangan/submissions/${encodeURIComponent(id)}`, { approve, review_note: reviewNote });
}
