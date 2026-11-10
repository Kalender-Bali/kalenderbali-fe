import type { KalenderHarian } from '@/features/kalender/types/kalender.types';

// Kontrak katalog mengikuti backend; seluruh ID uint64 tetap string di frontend.
export type DewasaRecommendation = 'recommended' | 'avoid';
export type DewasaDateStatus = 'eligible' | 'conflict' | 'no_match';

export interface DewasaActivitySummary {
  id: string;
  name: string;
  recommended_count: number;
  avoid_count: number;
}

export interface DewasaActivityRule {
  calendar_value_id: string;
  name: string;
  description?: string;
  severity_code?: string;
  recommendation: DewasaRecommendation;
}

export interface DewasaActivity {
  id: string;
  name: string;
  rules: DewasaActivityRule[];
}

// Jenis field menentukan apakah form mengirim value_id, angka, atau enum.
export type DewasaCriteriaField =
  | { field: string; label: string; value_kind: 'reference_value'; reference_type_code: string }
  | { field: string; label: string; value_kind: 'integer'; min: number; max: number }
  | { field: string; label: string; value_kind: 'enum'; allowed_values: string[] };

export interface DewasaCriteriaValue {
  id: string;
  name: string;
}

// Satu kriteria memakai ID referensi ATAU nilai skalar, tidak keduanya.
export type DewasaCriterion =
  | { field: string; value_id: string; value?: never }
  | { field: string; value: string | number; value_id?: never };

export interface DewasaCriterionGroup {
  all: DewasaCriterion[];
}

export interface DewasaCustomRules {
  recommended_any: DewasaCriterionGroup[];
  avoid_any: DewasaCriterionGroup[];
}

// Draft hanya menyimpan pilihan pengguna; label dan nilai resmi berasal dari API.
export interface CriteriaDraftItem {
  id: string;
  field: string;
  value: string;
}

export interface CriteriaDraftGroup {
  id: string;
  items: CriteriaDraftItem[];
}

export interface CustomCriteriaDraft {
  recommended: CriteriaDraftGroup[];
  avoid: CriteriaDraftGroup[];
}

// Snapshot label untuk menjelaskan konfigurasi yang dikirim pada satu pencarian.
export interface DewasaCriteriaSummary {
  mode: 'activity' | 'custom';
  sections: { label: string; groups: string[][] }[];
}

interface DewasaSearchRange {
  tanggal_mulai: string;
  tanggal_selesai: string;
  include_rejected?: boolean;
  include_calendar?: boolean;
}

// Mode memastikan activity_id dan custom tidak terkirim bersamaan.
export type MengaturDewasaSearchRequest = DewasaSearchRange & (
  | { mode: 'activity'; activity_id: string; custom?: never }
  | { mode: 'custom'; custom: DewasaCustomRules; activity_id?: never }
);

export interface DewasaMatchedReason {
  source: 'activity_rule' | 'custom_criterion';
  recommendation: DewasaRecommendation;
  name: string;
  field?: string;
  calendar_value_id?: string;
  description?: string;
  severity_code?: string;
  group_index?: number;
}

export interface DewasaDateResult {
  tanggal: string;
  status: DewasaDateStatus;
  eligible: boolean;
  matched_recommended: DewasaMatchedReason[];
  matched_avoid: DewasaMatchedReason[];
  matched_custom_groups?: number[];
  conflicting_groups?: number[];
  calendar?: KalenderHarian;
}

export interface DewasaSearchData {
  mode: 'activity' | 'custom';
  activity?: { id: string; name: string };
  results: DewasaDateResult[];
}

export interface DewasaMeta {
  request_id: string;
  timezone: string;
  rule_version: string;
  calendar_rule_version: string;
  master_data_version: string;
  total?: number;
  evaluated_days?: number;
  eligible_days?: number;
  conflict_days?: number;
}

export interface DewasaSearchMeta extends DewasaMeta {
  evaluated_days: number;
  eligible_days: number;
  conflict_days: number;
}

export interface DewasaSearchResponse {
  data: DewasaSearchData;
  meta: DewasaSearchMeta;
}

export interface DewasaApiEnvelope<T, Meta extends DewasaMeta = DewasaMeta> {
  data: T | null;
  meta: Meta;
  error: { code: string; message: string } | null;
}
