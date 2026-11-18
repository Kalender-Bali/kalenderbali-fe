import type { OtonanHasilItem, OtonanNormalizedInput, OtonanSearchParams } from '@/features/otonan/types/otonan.types';
import type { HariRayaMasterItem, KejadianHariRayaDetail } from '@/features/hari-raya/types/hariRaya.types';
import type { BackendPiodalanPuraDetail, BackendPiodalanScheduleDay, PiodalanSearchParams } from '@/features/piodalan/types/piodalan.types';
import type { DewasaCriteriaSummary, DewasaDateResult, DewasaSearchMeta, MengaturDewasaSearchRequest } from '@/features/mengatur-dewasa/types/mengaturDewasa.types';

export type PengingatKind = 'otonan' | 'piodalan' | 'hari-raya' | 'mengatur-dewasa';
export type PengingatStatus = 'aktif' | 'terlewat';
export type PengingatFilter = 'semua' | PengingatKind;

export type PengingatCondition =
  | { basis: 'kelahiran'; birthDate: string; beforeSix: boolean }
  | { basis: 'pawukon'; saptawara: string; pancawara: string; wuku: string }
  | { basis: 'sasih'; sasih: string; phase: 'Purnama' | 'Tilem' }
  | { basis: 'hari-raya'; name: string }
  | { basis: 'tanggal'; date: string };

/** Input dan hasil sumber disimpan bersama agar jadwal tidak lepas dari kriterianya. */
export type PengingatSource =
  | { feature: 'otonan'; request: OtonanSearchParams; result: OtonanHasilItem; normalized: OtonanNormalizedInput }
  | { feature: 'hari-raya'; request: { nama: string; year: number }; holiday: HariRayaMasterItem; result: KejadianHariRayaDetail }
  | { feature: 'piodalan'; request: PiodalanSearchParams; result: BackendPiodalanScheduleDay; pura: BackendPiodalanPuraDetail }
  | { feature: 'piodalan-pribadi'; condition: PengingatCondition; result: { tanggal: string } }
  | { feature: 'hari-raya-pribadi'; condition: PengingatCondition; result: { tanggal: string } }
  | { feature: 'mengatur-dewasa'; request: MengaturDewasaSearchRequest; result: DewasaDateResult; meta: DewasaSearchMeta; criteria: DewasaCriteriaSummary };

export interface PengingatPolicy {
  tier: 'Free' | 'Premium';
  maxPerFeature: 1 | 10;
  canRepeat: boolean;
}

/** Catatan pribadi yang tersimpan pada backend. */
export interface PengingatEntry {
  id: string;
  kind: PengingatKind;
  title: string;
  nextDate: string;
  eventTime: string;
  condition: PengingatCondition;
  origin: 'pribadi' | 'fitur';
  sourceLabel: string;
  repeat: boolean;
  alertDays: number[];
  note: string;
  source?: PengingatSource;
  repeatLabel?: string | null;
  scheduleError?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PengingatCandidate {
  key: string;
  kind: PengingatKind;
  title: string;
  nextDate: string;
  eventTime: string;
  description: string;
  condition: PengingatCondition;
  origin: 'pribadi' | 'fitur';
  sourceLabel: string;
  repeatLabel: string | null;
  source: PengingatSource;
}

export interface PengingatAddProps {
  policy: PengingatPolicy | null;
  today: string;
  onClose: () => void;
  onSave: (entry: PengingatEntry) => Promise<void>;
}

export interface PengingatNotification {
  id: string;
  reminderId: string;
  kind: PengingatKind;
  title: string;
  occurrenceDate: string;
  offsetDays: number;
  scheduledAt: string;
  deliveredAt: string;
  readAt: string | null;
}

export interface PengingatNotificationPage {
  items: PengingatNotification[];
  unread: number;
  total: number;
}

export interface PengingatCategory {
  id: PengingatKind;
  title: string;
  description: string;
  singular: string;
  icon: 'users' | 'landmark' | 'sun' | 'calendar';
  accent: string;
}

export type PengingatDialog =
  | { type: 'form'; kind: PengingatKind }
  | { type: 'detail'; id: string }
  | { type: 'delete'; id: string };
