import type { StructuredCardContent } from '@/features/share-card/utils/shareCardDraft';
import type { KomposisiKarakter } from '../types/ramalanSifat.types';

const pillars = [
  ['saptawara', 'Saptawara'],
  ['pancawara', 'Pancawara'],
  ['wuku', 'Wuku'],
  ['zodiak', 'Zodiak'],
] as const;

// Gunakan uraian Go yang tersedia sebagai sumber tunggal pilihan dan isi kartu.
export function ramalanSifatOptions(karakter: KomposisiKarakter) {
  return pillars.flatMap(([key, label]) => {
    const element = karakter[key];
    const description = element?.penjelasan?.trim();
    if (!description || description === '-') return [];
    return [{ key, label: `${label} · ${element.nama}`, category: label, element }];
  });
}

export type RamalanSifatOption = ReturnType<typeof ramalanSifatOptions>[number];

export function buildRamalanSifatShareCard(option: RamalanSifatOption): StructuredCardContent {
  return {
    kind: 'structured',
    title: 'Ramalan Sifat',
    accent: '#b45309',
    context: 'Anda',
    result: option.element.penjelasan.trim(),
    facts: [`${option.category}: ${option.element.nama}`],
  };
}
