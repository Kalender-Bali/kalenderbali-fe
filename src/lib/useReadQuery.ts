import { useQuery, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';
import { READ_RETRY_DELAY, shouldRetryRead } from './readRetry';

/** Status tampilan mencakup request awal, retry otomatis, dan pemuatan ulang data cache. */
export function readQueryFeedback<T extends { isLoading: boolean; isFetching?: boolean; fetchStatus?: string; isError: boolean; error: unknown }>(query: T) {
  const isLoading = query.isLoading || Boolean(query.isFetching) || query.fetchStatus === 'paused';
  return { ...query, isLoading, isError: !isLoading && query.isError, error: isLoading ? null : query.error };
}

/** Hook pembacaan bersama: UI tetap loading sampai seluruh percobaan selesai. */
export function useReadQuery<TQueryFnData = unknown, TError = Error, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  const query = useQuery({ retry: shouldRetryRead, retryDelay: READ_RETRY_DELAY, networkMode: 'always', ...options });
  return readQueryFeedback(query);
}
