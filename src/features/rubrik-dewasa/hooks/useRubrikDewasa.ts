import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReadQuery } from '@/lib/useReadQuery';
import { useAuthQueryScope } from '@/stores/useAuthStore';
import { fetchRubrikDetail, fetchRubrikList } from '../api/rubrikDewasaApi';

const rubrikKey = ['rubrik-dewasa'];

export function useRubrikList(search: string, page: number, mine = false) {
  const scope = useAuthQueryScope();
  return useReadQuery({
    queryKey: mine ? [...rubrikKey, 'my', scope, search, page] : [...rubrikKey, 'list', search, page],
    queryFn: ({ signal }) => fetchRubrikList(search, page, signal, mine),
    gcTime: mine ? 0 : undefined,
  });
}

export function useRubrikDetail(id: string) {
  return useReadQuery({
    queryKey: [...rubrikKey, 'detail', id],
    queryFn: ({ signal }) => fetchRubrikDetail(id, signal),
    enabled: /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)),
  });
}

export function useRubrikMutation<Input, Result>(mutationFn: (input: Input) => Promise<Result>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn, retry: false, networkMode: 'always',
    // Mutasi dapat mengubah detail, posisi pada daftar, dan jumlah komentar.
    onSuccess: () => client.invalidateQueries({ queryKey: rubrikKey }),
  });
}
