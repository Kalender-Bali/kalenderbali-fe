import { useState, useEffect } from 'react';
import { useReadQuery } from '@/lib/useReadQuery';
import { useAuthQueryScope } from '@/stores/useAuthStore';
import {
  fetchChapters,
  fetchChapterDetail,
  fetchTopics,
  fetchTopicDetail,
  searchSemantic,
  searchText,
} from '../api/bhagawadGitaApi';

/**
 * ==============================================================================
 * HOOKS: BHAGAWAD GITA (TANSTACK QUERY SERVER STATE)
 * ==============================================================================
 * Mengelola server state, caching jangka panjang (Zero-Loading UX) untuk
 * 18 bab, 21 topik, detail sloka, dan pencarian semantik (IR).
 * ==============================================================================
 */

/** Hook untuk mengambil daftar 18 bab (statis seumur hidup aplikasi) */
export function useChapters() {
  return useReadQuery({
    queryKey: ['bhagawadgita', 'chapters'],
    queryFn: fetchChapters,
    staleTime: Infinity,
  });
}

/** Hook untuk mengambil detail bab dan daftar slokanya */
export function useChapterDetail(chapterNumber: number) {
  const authScope = useAuthQueryScope();
  return useReadQuery({
    queryKey: ['bhagawadgita', 'chapter', chapterNumber, authScope],
    meta: { authScoped: true },
    queryFn: () => fetchChapterDetail(chapterNumber),
    enabled: chapterNumber >= 1 && chapterNumber <= 18,
    staleTime: 1000 * 60 * 30, // 30 menit
  });
}

/** Hook untuk mengambil daftar 21 topik refleksi hidup */
export function useTopics() {
  return useReadQuery({
    queryKey: ['bhagawadgita', 'topics'],
    queryFn: fetchTopics,
    staleTime: Infinity,
  });
}

/** Hook untuk mengambil detail topik tertentu dan sloka pilihannya */
export function useTopicDetail(topicId: string) {
  const authScope = useAuthQueryScope();
  return useReadQuery({
    queryKey: ['bhagawadgita', 'topic', topicId, authScope],
    meta: { authScoped: true },
    queryFn: () => fetchTopicDetail(topicId),
    enabled: Boolean(topicId),
    staleTime: 1000 * 60 * 30, // 30 menit
  });
}

/** Hook pencarian semantik dengan debouncing */
export function useSemanticSearch(query: string, topicId?: string) {
  const authScope = useAuthQueryScope();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);
    return () => clearTimeout(handler);
  }, [query]);

  return useReadQuery({
    queryKey: ['bhagawadgita', 'search-semantic', debouncedQuery, topicId, authScope],
    meta: { authScoped: true },
    queryFn: () => searchSemantic({ query: debouncedQuery, topic_id: topicId }),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 1000 * 60 * 5, // 5 menit
  });
}

/** Hook pencarian teks biasa */
export function useTextSearch(query: string) {
  const authScope = useAuthQueryScope();
  return useReadQuery({
    queryKey: ['bhagawadgita', 'search-text', query, authScope],
    meta: { authScoped: true },
    queryFn: () => searchText(query),
    enabled: Boolean(query.trim()),
    staleTime: 1000 * 60 * 5,
  });
}

