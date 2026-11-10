import { toISODateString } from '@/features/kalender/utils/calendarUtils';
import type { CriteriaDraftGroup, CriteriaDraftItem, CustomCriteriaDraft, DewasaActivity, DewasaCriteriaField, DewasaCriteriaSummary, DewasaCriteriaValue, DewasaCriterion, DewasaCustomRules, MengaturDewasaSearchRequest } from '../types/mengaturDewasa.types';

let nextDraftId = 0;

// URL hanya membawa konteks navigasi; kriteria pribadi tetap di state lokal.
export function readDewasaUrlContext(params: URLSearchParams, today: string) {
  const [todayYear, todayMonth] = today.split('-').map(Number);
  const month = Number(params.get('month'));
  const year = Number(params.get('year'));
  const activity = params.get('activity') || '';
  return {
    mode: params.get('mode') === 'custom' ? 'custom' as const : 'activity' as const,
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : todayMonth,
    year: String(Number.isInteger(year) && year >= 1800 && year <= 2200 ? year : todayYear),
    activityId: /^[1-9]\d{0,19}$/.test(activity) ? activity : '',
  };
}
export function createCriteriaItem(): CriteriaDraftItem {
  return { id: `criteria-${++nextDraftId}`, field: '', value: '' };
}

export function createCriteriaGroup(): CriteriaDraftGroup {
  return { id: `group-${++nextDraftId}`, items: [createCriteriaItem()] };
}

// Batasi dan bentuk ulang draft setelah login; semua nilai tetap divalidasi lagi terhadap API.
export function restoreCustomDraft(value: unknown): CustomCriteriaDraft | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  let count = 0;
  function readGroups(raw: unknown): CriteriaDraftGroup[] | null {
    if (!Array.isArray(raw) || raw.length > 20) return null;
    const groups: CriteriaDraftGroup[] = [];
    for (const group of raw) {
      if (!group || typeof group !== 'object' || !Array.isArray(group.items) || group.items.length < 1 || group.items.length > 20) return null;
      const items: CriteriaDraftItem[] = [];
      for (const item of group.items) {
        if (!item || typeof item.field !== 'string' || item.field.length > 80 || typeof item.value !== 'string' || item.value.length > 100 || ++count > 100) return null;
        items.push({ ...createCriteriaItem(), field: item.field, value: item.value });
      }
      groups.push({ ...createCriteriaGroup(), items });
    }
    return groups;
  }
  const recommended = readGroups(candidate.recommended);
  const avoid = readGroups(candidate.avoid);
  return recommended && avoid ? { recommended, avoid } : null;
}

// AND berada di dalam `all`; OR terjadi antarkelompok pada setiap daftar.
export function buildCustomRules(
  draft: CustomCriteriaDraft,
  fields: DewasaCriteriaField[],
  valuesByField: Record<string, DewasaCriteriaValue[] | undefined>,
): { rules: DewasaCustomRules | null; error: string | null } {
  const definitions = new Map(fields.map((field) => [field.field, field]));
  let count = 0;
  function readGroups(groups: CriteriaDraftGroup[]): DewasaCriterion[][] | null {
    if (groups.length > 20) return null;
    const result: DewasaCriterion[][] = [];
    for (const group of groups) {
      if (!group.items.length || group.items.length > 20) return null;
      const seen = new Set<string>();
      const items: DewasaCriterion[] = [];
      for (const item of group.items) {
        if (++count > 100) return null;
        const field = definitions.get(item.field);
        if (!field || !item.value) return null;
        let criterion: DewasaCriterion;
        if (field.value_kind === 'reference_value') {
          if (!valuesByField[field.field]?.some((value) => value.id === item.value)) return null;
          criterion = { field: field.field, value_id: item.value };
        } else if (field.value_kind === 'integer') {
          if (!/^\d+$/.test(item.value)) return null;
          const number = Number(item.value);
          if (!Number.isSafeInteger(number) || number < field.min || number > field.max) return null;
          criterion = { field: field.field, value: number };
        } else {
          if (!field.allowed_values.includes(item.value)) return null;
          criterion = { field: field.field, value: item.value };
        }
        const key = `${criterion.field}:${'value_id' in criterion ? criterion.value_id : criterion.value}`;
        if (seen.has(key)) return null;
        seen.add(key);
        items.push(criterion);
      }
      result.push(items);
    }
    return result;
  }
  if (draft.recommended.length + draft.avoid.length === 0) return { rules: null, error: 'Tambahkan sedikitnya satu kelompok kriteria.' };
  const recommended = readGroups(draft.recommended);
  const avoid = readGroups(draft.avoid);
  if (!recommended || !avoid) return { rules: null, error: 'Lengkapi setiap kriteria dengan pilihan yang tersedia, dan hindari duplikasi dalam satu kelompok.' };
  return { rules: { recommended_any: recommended.map((all) => ({ all })), avoid_any: avoid.map((all) => ({ all })) }, error: null };
}

export function buildCustomSearchRequest(rules: DewasaCustomRules, month: number, year: number): MengaturDewasaSearchRequest | null {
  const range = buildMonthRange(month, year);
  if (!range) return null;
  return { mode: 'custom', custom: rules, ...range };
}

// Bekukan label saat submit agar ringkasan mengikuti request yang menghasilkan respons.
export function summarizeSearchCriteria(
  request: MengaturDewasaSearchRequest,
  activity: DewasaActivity | null,
  fields: DewasaCriteriaField[],
  valuesByField: Record<string, DewasaCriteriaValue[] | undefined>,
): DewasaCriteriaSummary {
  if (request.mode === 'activity') {
    return {
      mode: 'activity',
      sections: (['recommended', 'avoid'] as const).map((type) => ({
        label: type === 'recommended' ? 'Mendukung' : 'Dihindari',
        groups: [activity?.rules.filter((rule) => rule.recommendation === type).map((rule) => rule.name) ?? []],
      })),
    };
  }
  const format = (criterion: DewasaCriterion) => {
    const field = fields.find((item) => item.field === criterion.field);
    const name = 'value_id' in criterion && criterion.value_id !== undefined
      ? valuesByField[criterion.field]?.find((value) => value.id === criterion.value_id)?.name ?? criterion.value_id
      : String(criterion.value);
    return `${field?.label ?? criterion.field}: ${name}`;
  };
  return {
    mode: 'custom',
    sections: [
      { label: 'Mendukung', groups: request.custom.recommended_any.map((group) => group.all.map(format)) },
      { label: 'Dihindari', groups: request.custom.avoid_any.map((group) => group.all.map(format)) },
    ],
  };
}

// Rentang memakai tanggal sipil saja; backend menghitung aturan kalender Bali.
function buildMonthRange(month: number, year: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1800 || year > 2200) {
    return null;
  }
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    tanggal_mulai: toISODateString(year, month, 1),
    tanggal_selesai: toISODateString(year, month, lastDay),
    include_rejected: true,
    include_calendar: true,
  };
}

export function buildActivitySearchRequest(activityId: string, month: number, year: number): MengaturDewasaSearchRequest | null {
  const range = buildMonthRange(month, year);
  if (!range || !/^[1-9]\d{0,19}$/.test(activityId)) return null;
  return { mode: 'activity', activity_id: activityId, ...range };
}
