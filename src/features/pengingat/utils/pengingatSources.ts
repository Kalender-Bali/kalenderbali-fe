import type { OtonanResponseData, OtonanSearchParams } from '@/features/otonan/types/otonan.types';
import type { HariRayaSearchResponse } from '@/features/hari-raya/types/hariRaya.types';
import type { BackendPiodalanSearchResult, PiodalanSearchParams, PuraBackendItem } from '@/features/piodalan/types/piodalan.types';
import type { DewasaCriteriaSummary, DewasaSearchResponse, MengaturDewasaSearchRequest } from '@/features/mengatur-dewasa/types/mengaturDewasa.types';
import type { PengingatCandidate, PengingatCondition } from '../types/pengingat.types';
import { getConditionLabel } from './pengingatUtils';

export function otonanCandidates(request: OtonanSearchParams, response: OtonanResponseData, today: string): PengingatCandidate[] {
  const normalized = response.input_dinormalisasi;
  const condition: PengingatCondition = request.tipe_pencarian === 'tanggal_lahir'
    ? { basis: 'kelahiran', birthDate: normalized.tanggal_lahir_sipil ?? request.tanggal_lahir!, beforeSix: normalized.sebelum_jam_6 }
    : { basis: 'pawukon', ...normalized.elemen };
  return response.hasil.filter(result => result.tanggal >= today).map(result => ({
    key: result.tanggal, kind: 'otonan', title: 'Otonan keluarga', nextDate: result.tanggal, eventTime: '',
    description: `${Object.values(normalized.elemen).join(' · ')}${result.perayaan_ke == null ? '' : ` · Otonan ke-${result.perayaan_ke}`}`,
    condition, origin: 'pribadi', sourceLabel: 'Perhitungan Otonan', repeatLabel: 'Setiap siklus 210 hari',
    source: { feature: 'otonan', request, result, normalized },
  }));
}

export function hariRayaCandidates(request: { nama: string; year: number }, response: HariRayaSearchResponse, today: string): PengingatCandidate[] {
  return response.kejadian.filter(result => result.tanggal >= today).map(result => ({
    key: `${response.hari_raya.id}:${result.tanggal}`, kind: 'hari-raya', title: response.hari_raya.nama,
    nextDate: result.tanggal, eventTime: '', description: `${result.saptawara} ${result.pancawara} · ${result.wuku} · Sasih ${result.sasih.nama_sasih}`,
    condition: { basis: 'hari-raya', name: response.hari_raya.nama }, origin: 'fitur',
    sourceLabel: response.hari_raya.nama, repeatLabel: 'Setiap perayaan berikutnya',
    source: { feature: 'hari-raya', request, holiday: response.hari_raya, result },
  }));
}

export function piodalanCandidates(request: PiodalanSearchParams, response: BackendPiodalanSearchResult, selectedPura: PuraBackendItem, today: string): PengingatCandidate[] {
  const condition: PengingatCondition | null = selectedPura.benchmark?.toLowerCase() === 'pawukon' && selectedPura.saptawara && selectedPura.pancawara && selectedPura.wuku
    ? { basis: 'pawukon', saptawara: selectedPura.saptawara, pancawara: selectedPura.pancawara, wuku: selectedPura.wuku }
    : selectedPura.benchmark?.toLowerCase() === 'sasih' && selectedPura.sasih && ['Purnama', 'Tilem'].includes(selectedPura.purnama_tilem ?? '')
      ? { basis: 'sasih', sasih: selectedPura.sasih, phase: selectedPura.purnama_tilem as 'Purnama' | 'Tilem' } : null;
  return response.schedules.filter(day => day.tanggal >= today).flatMap(day => day.puras.filter(pura => String(pura.id) === String(selectedPura.id)).map(pura => ({
    key: `${pura.id}:${day.tanggal}`, kind: 'piodalan' as const, title: pura.nama,
    nextDate: day.tanggal, eventTime: '',
    description: `${day.wewaran} · ${day.sasih}${pura.pelaksanaan_aktual ? ' · Ada catatan pelaksanaan pengelola' : ' · Berdasarkan kalender pura'}`,
    condition: condition ?? { basis: 'tanggal' as const, date: day.tanggal }, origin: 'fitur' as const,
    sourceLabel: pura.nama, repeatLabel: condition ? 'Setiap piodalan berikutnya' : null,
    source: { feature: 'piodalan' as const, request, result: day, pura },
  })));
}

export function privatePiodalanCandidates(condition: PengingatCondition, dates: string[], today: string): PengingatCandidate[] {
  return privateCalendarCandidates('piodalan', condition, dates, today);
}

export function privateCalendarCandidates(kind: 'piodalan' | 'hari-raya', condition: PengingatCondition, dates: string[], today: string): PengingatCandidate[] {
  const label = kind === 'piodalan' ? 'Piodalan keluarga' : 'Hari raya keluarga';
  return dates.filter(date => date >= today).map(date => ({
    key: date, kind, title: label, nextDate: date, eventTime: '', description: getConditionLabel(condition),
    condition, origin: 'pribadi', sourceLabel: label,
    repeatLabel: condition.basis === 'pawukon' ? 'Setiap siklus 210 hari' : condition.basis === 'sasih' ? 'Setiap perayaan sesuai Sasih' : null,
    source: { feature: kind === 'piodalan' ? 'piodalan-pribadi' : 'hari-raya-pribadi', condition, result: { tanggal: date } },
  }));
}

export function dewasaCandidates(request: MengaturDewasaSearchRequest, response: DewasaSearchResponse, criteria: DewasaCriteriaSummary, today: string): PengingatCandidate[] {
  const title = response.data.activity?.name ?? 'Kegiatan dengan kriteria sendiri';
  return response.data.results.filter(result => result.tanggal >= today && result.eligible && result.status === 'eligible').map(result => ({
    key: result.tanggal, kind: 'mengatur-dewasa', title, nextDate: result.tanggal, eventTime: '',
    description: result.matched_recommended.map(reason => reason.name).join(' · ') || 'Memenuhi kriteria pencarian',
    condition: { basis: 'tanggal', date: result.tanggal }, origin: 'pribadi', sourceLabel: title, repeatLabel: null,
    source: { feature: 'mengatur-dewasa', request, result, meta: response.meta, criteria },
  }));
}
