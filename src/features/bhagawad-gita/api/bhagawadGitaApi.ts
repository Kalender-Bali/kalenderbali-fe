import { apiClient } from '@/lib/axios';
import type {
  ApiResponse,
  Chapter,
  ChapterDetail,
  Topic,
  TopicDetail,
  SemanticSearchRequest,
  SemanticSearchResultItem,
  TextSearchResult,
} from '../types/bhagawadGita.types';

/**
 * ==============================================================================
 * API SERVICE: BHAGAWAD GITA
 * ==============================================================================
 * Berkas ini menyediakan fungsi-fungsi pemanggil REST API ke Backend Go
 * pada prefix /api/v1/bhagawadgita/*.
 * ==============================================================================
 */

/** Mengambil katalog 18 bab Bhagawad Gita */
export async function fetchChapters(): Promise<Chapter[]> {
  const response = await apiClient.get<ApiResponse<Chapter[]>>('/bhagawadgita/chapters');
  return response.data.data;
}

/** Mengambil detail bab tertentu beserta daftar slokanya */
export async function fetchChapterDetail(chapterNumber: number): Promise<ChapterDetail> {
  const response = await apiClient.get<ApiResponse<ChapterDetail>>(
    `/bhagawadgita/chapters/${chapterNumber}`
  );
  return response.data.data;
}

/** Mengambil katalog 21 topik refleksi hidup */
export async function fetchTopics(): Promise<Topic[]> {
  const response = await apiClient.get<ApiResponse<Topic[]>>('/bhagawadgita/topics');
  return response.data.data;
}

/** Mengambil detail topik tertentu beserta daftar sloka pilihannya */
export async function fetchTopicDetail(topicId: string): Promise<TopicDetail> {
  const response = await apiClient.get<ApiResponse<TopicDetail>>(
    `/bhagawadgita/topics/${topicId}`
  );
  return response.data.data;
}

/** Menjalankan pencarian semantik (makna/rasa) menggunakan IR Cosine Similarity */
export async function searchSemantic(
  payload: SemanticSearchRequest
): Promise<SemanticSearchResultItem[]> {
  const response = await apiClient.post<ApiResponse<SemanticSearchResultItem[]>>(
    '/bhagawadgita/search',
    payload
  );
  return response.data.data;
}

/** Menjalankan pencarian teks biasa pada katalog bab, topik, dan terjemahan */
export async function searchText(query: string): Promise<TextSearchResult> {
  const response = await apiClient.get<ApiResponse<TextSearchResult>>(
    '/bhagawadgita/search/text',
    { params: { q: query } }
  );
  return response.data.data;
}

