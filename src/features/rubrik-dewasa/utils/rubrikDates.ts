import { normalizeCalendarString, toISODateString } from '@/features/kalender/utils/calendarUtils';
import { buildCustomSearchRequest } from '@/features/mengatur-dewasa/utils/mengaturDewasaUtils';
import type { DewasaCustomRules, DewasaDateResult, MengaturDewasaSearchRequest } from '@/features/mengatur-dewasa/types/mengaturDewasa.types';

export function buildRubrikSearch(rules: DewasaCustomRules, month: number, year: number): MengaturDewasaSearchRequest | null {
  if (month !== 0) {
    const request = buildCustomSearchRequest(rules, month, year);
    return request && { ...request, include_rejected: false };
  }
  if (!Number.isInteger(year) || year < 1800 || year > 2200) return null;
  // API menerima satu tahun sipil, termasuk tahun kabisat.
  return {
    mode: 'custom', custom: rules, tanggal_mulai: toISODateString(year, 1, 1),
    tanggal_selesai: toISODateString(year, 12, 31), include_calendar: true, include_rejected: false,
  };
}

export interface RubrikDateFilter {
  parameters: Record<string, string>;
  requiredPadewasan: string;
  excludedPadewasan: string;
}

export const noDateFilter: RubrikDateFilter = { parameters: {}, requiredPadewasan: '', excludedPadewasan: '' };

export function filterRubrikDates(results: DewasaDateResult[], filters: RubrikDateFilter, activityDates?: ReadonlySet<string>) {
  const { parameters, requiredPadewasan, excludedPadewasan } = filters;
  const requested = Object.entries(parameters).filter(([, value]) => value !== '');
  return results.filter((result) => {
    if (activityDates && !activityDates.has(result.tanggal)) return false;
    if (!requested.length && !requiredPadewasan && !excludedPadewasan) return true;
    const calendar = result.calendar;
    if (!calendar) return false;
    // Filter tampilan membandingkan fakta kalender yang telah dihitung Go.
    const padewasan = calendar.padewasan ?? [];
    if (requiredPadewasan && !padewasan.some((item) => item.id === requiredPadewasan)) return false;
    if (excludedPadewasan && padewasan.some((item) => item.id === excludedPadewasan)) return false;
    return requested.every(([key, value]) => {
      const lunar = calendar.pengalantaka;
      switch (key) {
        case 'sasih_no': return String(calendar.sasih?.no_sasih) === value;
        case 'lunar_day': return [lunar?.penanggal_1, lunar?.penanggal_2].some((day) => String(day) === value);
        case 'lunar_phase': return lunar?.pengalantaka === value;
        case 'lunar_event': return lunar?.purnama_tilem === value;
        case 'neptu': return String(calendar.wewaran?.neptu) === value;
        default: {
          const item = calendar.wewaran?.[key as keyof typeof calendar.wewaran];
          return typeof item === 'object' && item !== null &&
            normalizeCalendarString(item.nama) === normalizeCalendarString(value);
        }
      }
    });
  });
}
