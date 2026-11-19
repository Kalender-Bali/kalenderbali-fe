import type { StructuredCardContent } from '@/features/share-card/utils/shareCardDraft';
import type { GarisHidupPeriod, GarisHidupProfileResult } from '../types/garisHidup.types';

// Isi kartu selalu berasal dari profil dan periode yang dipilih pengguna.
export function buildGarisHidupShareCard(profile: GarisHidupProfileResult, period: GarisHidupPeriod): StructuredCardContent {
  const range = `${period.min_umur}–${period.max_umur} tahun`;
  const weton = [profile.saptawara, profile.pancawara].filter(Boolean).join(' ');
  const text = period.keterangan.trim();
  return {
    kind: 'structured', title: 'Garis Hidup', accent: '#0284c7',
    iconPath: 'M3 17l6-6 4 4 8-8 M15 7h6v6',
    context: profile.nama, result: text.charAt(0).toLocaleUpperCase('id') + text.slice(1),
    facts: [`Rentang umur: ${range}`, ...(weton ? [`Wewaran kelahiran: ${weton}`] : []), `Total urip: ${profile.urip}`],
  };
}

export function currentPeriodIndex(profile: GarisHidupProfileResult): number {
  const index = profile.seluruh_periode.findIndex(period => period.min_umur === profile.periode_saat_ini.min_umur && period.max_umur === profile.periode_saat_ini.max_umur);
  return index < 0 ? 0 : index;
}
