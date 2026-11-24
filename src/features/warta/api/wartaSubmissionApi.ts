import { apiClient } from '@/lib/axios';
import type { ArticleBackendItem } from '../types/warta.types';

// Endpoint ini mengembalikan pengajuan milik Contributor atau antrean Admin.
export async function fetchWartaSubmissions(page: number) {
  const response = await apiClient.get<{ data: ArticleBackendItem[]; total: number }>('/articles/unpublished', { params: { page, per_page: 20 } });
  return response.data;
}

export async function updateWartaSubmission(id: number | string, status: 'Review' | 'Published' | 'Rejected', note = '') {
  await apiClient.put(`/submissions/warta/${id}/status`, { status, review_note: note });
}
