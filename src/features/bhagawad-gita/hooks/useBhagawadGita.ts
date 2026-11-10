import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  return useQuery({
    queryKey: ['bhagawadgita', 'chapters'],
    queryFn: fetchChapters,
    staleTime: Infinity,
  });
}

/** Hook untuk mengambil detail bab dan daftar slokanya */
export function useChapterDetail(chapterNumber: number) {
  return useQuery({
    queryKey: ['bhagawadgita', 'chapter', chapterNumber],
    queryFn: () => fetchChapterDetail(chapterNumber),
    enabled: chapterNumber >= 1 && chapterNumber <= 18,
    staleTime: 1000 * 60 * 30, // 30 menit
  });
}

/** Hook untuk mengambil daftar 21 topik refleksi hidup */
export function useTopics() {
  return useQuery({
    queryKey: ['bhagawadgita', 'topics'],
    queryFn: fetchTopics,
    staleTime: Infinity,
  });
}

/** Hook untuk mengambil detail topik tertentu dan sloka pilihannya */
export function useTopicDetail(topicId: string) {
  return useQuery({
    queryKey: ['bhagawadgita', 'topic', topicId],
    queryFn: () => fetchTopicDetail(topicId),
    enabled: Boolean(topicId),
    staleTime: 1000 * 60 * 30, // 30 menit
  });
}

/** Hook pencarian semantik dengan debouncing */
export function useSemanticSearch(query: string, topicId?: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);
    return () => clearTimeout(handler);
  }, [query]);

  return useQuery({
    queryKey: ['bhagawadgita', 'search-semantic', debouncedQuery, topicId],
    queryFn: () => searchSemantic({ query: debouncedQuery, topic_id: topicId }),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 1000 * 60 * 5, // 5 menit
  });
}

/** Hook pencarian teks biasa */
export function useTextSearch(query: string) {
  return useQuery({
    queryKey: ['bhagawadgita', 'search-text', query],
    queryFn: () => searchText(query),
    staleTime: 1000 * 60 * 5,
  });
}

