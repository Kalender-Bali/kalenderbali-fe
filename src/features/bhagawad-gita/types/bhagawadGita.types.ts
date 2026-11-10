/**
 * ==============================================================================
 * TIPE DATA: BHAGAWAD GITA (KONTRAK DATA FRONTEND)
 * ==============================================================================
 * Mendefinisikan struktur objek data Bhagawad Gita yang disinkronkan dengan
 * respons backend Go (/api/v1/bhagawadgita).
 * ==============================================================================
 */

/** Entitas satu bab dari 18 bab Bhagawad Gita */
export interface Chapter {
  number: number;
  roman_number: string;
  transliterated_name: string;
  translation: string;
  total_verses: number;
  summary: string;
}

/** Entitas satu sloka dari 700 sloka */
export interface Verse {
  chapter_number: number;
  verse_number: number;
  sloka: string;
  translation: string;
  narrative: string;
  topic_id: string;
}

/** Entitas satu topik dari 21 tema refleksi hidup */
export interface Topic {
  id: string;
  name: string;
  description: string;
  verse_count: number;
  icon_name: string;
}

/** Detail bab lengkap dengan daftar sloka dan metadata pembatasan hak akses (tiering) */
export interface ChapterDetail {
  chapter: Chapter;
  verses: Verse[];
  is_locked: boolean;
  preview_count: number;
  total_count: number;
}

/** Detail topik lengkap dengan daftar sloka pilihan dan metadata pembatasan hak akses */
export interface TopicDetail {
  topic: Topic;
  verses: Verse[];
  is_locked: boolean;
  preview_count: number;
  total_count: number;
}

/** DTO request pencarian semantik (makna/rasa) */
export interface SemanticSearchRequest {
  query: string;
  topic_id?: string;
  threshold?: number;
}

/** Item hasil pencarian semantik beserta skor kemiripan kosinus */
export interface SemanticSearchResultItem {
  verse: Verse;
  score: number;
}

/** DTO hasil pencarian teks biasa */
export interface TextSearchResult {
  chapters: Chapter[];
  topics: Topic[];
  verses: Verse[];
}

/** Tab navigasi aktif pada katalog Bhagawad Gita (Sesuai Mobile: Hanya Daftar Bab & Topik/Refleksi) */
export type BhagawadGitaTab = 'chapters' | 'topics';

/** Mode pencarian aktif: Teks biasa vs Pintar Semantik (IR) */
export type BhagawadGitaSearchMode = 'text' | 'semantic';

/** Envelope respons standar dari backend Go */
export interface ApiResponse<T> {
  data: T;
  meta: {
    request_id: string;
    data_version: string;
    total?: number;
  };
  error: {
    code: string;
    message: string;
  } | null;
}

