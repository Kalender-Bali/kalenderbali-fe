import type { DewasaCustomRules } from '@/features/mengatur-dewasa/types/mengaturDewasa.types';

export interface RubrikCondition { parameter: string; value: string }
export interface RubrikGroup { id?: number; label: string; conditions: RubrikCondition[] }
export interface RubrikCriteria { dicari: RubrikGroup[]; dihindari: RubrikGroup[] }
export interface RubrikDraft { nama: string; deskripsi: string; criteria: RubrikCriteria }
export interface RubrikComment {
  id: number;
  user_id: number;
  author_name: string;
  isi: string;
  created_at: string;
}
export interface RubrikDewasa extends RubrikDraft {
  id: number;
  user_id: number;
  author_name: string;
  created_at: string;
  comment_count: number;
  comments?: RubrikComment[];
  evaluation_criteria?: DewasaCustomRules;
  evaluation_error?: string;
}

export interface RubrikNavigationState {
  catalogSearch?: string;
  mySearch?: string;
}
