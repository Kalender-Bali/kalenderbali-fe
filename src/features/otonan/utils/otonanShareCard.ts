import type { StructuredCardContent } from '@/features/share-card/utils/shareCardDraft';
import type { OtonanHasilItem, OtonanNormalizedInput } from '../types/otonan.types';
import { formatIndoDate } from './otonanUtils';

const accent = '#6d28d9';
const cakePath = 'M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8m-2 0h20M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2c.6 0 1.2-.3 2-1M12 11V8m0-6c1 0 2 1.6 2 3a2 2 0 0 1-4 0c0-1.4 1-3 2-3Z';

export function hasOtonanBirthDetails(input: OtonanNormalizedInput | undefined): boolean {
  return input?.tipe_pencarian === 'tanggal_lahir' && Boolean(input.tanggal_lahir_sipil);
}

// Bentuk isi gambar dan teks dari hasil Go yang sudah dimuat oleh halaman.
export function buildOtonanShareContent(
  item: OtonanHasilItem,
  input: OtonanNormalizedInput | undefined,
  includeBirth = false,
): StructuredCardContent {
  const detail = item.detail_elemen;
  const saptawara = detail?.saptawara?.trim() || input?.elemen?.saptawara?.trim();
  const pancawara = detail?.pancawara?.trim() || input?.elemen?.pancawara?.trim();
  const wuku = detail?.wuku?.trim() || input?.elemen?.wuku?.trim();
  const facts: string[] = [];
  const textDetails: string[] = [];
  const dateOptions = { withDayName: true };

  if (input?.tipe_pencarian === 'tanggal_lahir' && item.perayaan_ke != null) {
    facts.push(`Perayaan: Otonan ke-${item.perayaan_ke}`);
  }
  if (includeBirth && input?.tipe_pencarian === 'tanggal_lahir' && input.tanggal_lahir_sipil) {
    facts.push(`Tanggal lahir: ${formatIndoDate(input.tanggal_lahir_sipil, dateOptions)}`);
    if (input.sebelum_jam_6) {
      facts.push('Waktu lahir: Sebelum 06.00 WITA');
      if (input.tanggal_lahir_kalender) {
        textDetails.push(`Patokan kalender: ${formatIndoDate(input.tanggal_lahir_kalender, dateOptions)}`);
      }
    }
  }

  return {
    kind: 'structured',
    title: 'Otonan',
    accent,
    iconPath: cakePath,
    context: formatIndoDate(item.tanggal, dateOptions),
    result: [[saptawara, pancawara].filter(Boolean).join(' '), wuku ? `Wuku ${wuku}` : ''].filter(Boolean).join('\n'),
    facts,
    textDetails,
  };
}
