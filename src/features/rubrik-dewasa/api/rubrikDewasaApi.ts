import { apiClient } from '@/lib/axios';
import type { RubrikDraft, RubrikDewasa } from '../types/rubrikDewasa.types';

export const RUBRIK_PAGE_SIZE = 20;
const collection = '/rubrik-dewasa';
const detail = (id: string | number) => `${collection}/${encodeURIComponent(id)}`;

// ID numerik dari Go harus masih berada dalam presisi JavaScript.
function validateRubrik(item: RubrikDewasa): RubrikDewasa {
  if (!Number.isSafeInteger(item.id) || item.id <= 0) throw new Error('ID rubrik tidak dapat diproses dengan aman.');
  return item;
}

export async function fetchRubrikList(search: string, page: number, signal: AbortSignal, mine = false) {
  const response = await apiClient.get<{ data: RubrikDewasa[]; total: number }>(mine ? `${collection}/my` : collection, {
    params: { search, page, per_page: RUBRIK_PAGE_SIZE },
    signal,
  });
  return { data: response.data.data.map(validateRubrik), total: response.data.total };
}

export async function fetchRubrikDetail(id: string, signal: AbortSignal) {
  const response = await apiClient.get<{ data: RubrikDewasa }>(detail(id), { signal });
  return validateRubrik(response.data.data);
}

export async function saveRubrik(draft: RubrikDraft, id?: number) {
  const response = id === undefined
    ? await apiClient.post<{ data: RubrikDewasa }>(collection, draft)
    : await apiClient.put<{ data: RubrikDewasa }>(detail(id), draft);
  return validateRubrik(response.data.data);
}

export async function deleteRubrik(id: number) {
  await apiClient.delete(detail(id));
}

export type RubrikCommentAction =
  | { kind: 'create'; text: string }
  | { kind: 'update'; id: number; text: string }
  | { kind: 'delete'; id: number };

export async function changeRubrikComment(rubrik: number, action: RubrikCommentAction) {
  const url = `${detail(rubrik)}/comments`;
  switch (action.kind) {
    case 'create': await apiClient.post(url, { isi: action.text }); break;
    case 'update': await apiClient.put(`${url}/${action.id}`, { isi: action.text }); break;
    case 'delete': await apiClient.delete(`${url}/${action.id}`); break;
  }
}
