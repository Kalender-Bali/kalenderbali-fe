import { formatFullIndoDate, getIndoDayName } from '@/features/kalender/utils/calendarUtils';
import type { CardStyle, StructuredCardContent } from '@/features/share-card/utils/shareCardDraft';
import type { DewasaDateResult } from '../types/mengaturDewasa.types';

// Seluruh nilai kalender dan kecocokan berasal dari hasil pencarian Go.
export function buildMengaturDewasaShareCard(result: DewasaDateResult, activity: string): {
  content: StructuredCardContent; initialStyle: CardStyle; fileName: string;
} {
  const calendar = result.calendar;
  const wewaran = calendar?.wewaran;
  const phase = calendar?.pengalantaka;
  const lunarDay = phase?.penanggal_1 ? `${phase.penanggal_1}${phase.penanggal_2 > 0 ? ` / ${phase.penanggal_2}` : ''}` : '';
  const sasihPhase = [phase?.pengalantaka, lunarDay, calendar?.sasih?.nama_sasih && `Sasih ${calendar.sasih.nama_sasih}`].filter(Boolean).join(' ');
  const reasons = result.matched_recommended.map((item) => item.name).filter(Boolean);
  const padewasan = (calendar?.padewasan ?? []).slice(0, 6).map((item) => item.nama).filter(Boolean);
  const facts = [
    ...(sasihPhase ? [`Sasih & Fase: ${sasihPhase}`] : []),
    ...(wewaran?.eka_jala_rsi?.nama ? [`Eka Jala Rsi: ${wewaran.eka_jala_rsi.nama}`] : []),
    ...(reasons.length ? [`Kriteria cocok: ${reasons.length}`] : []),
  ];
  return {
    content: {
      kind: 'structured', title: 'Mengatur Dewasa', accent: '#b45309',
      context: `${getIndoDayName(result.tanggal)}, ${formatFullIndoDate(result.tanggal)}`,
      result: [wewaran?.saptawara?.nama, wewaran?.pancawara?.nama, wewaran?.wuku?.nama].filter(Boolean).join(' ') || 'Memenuhi kriteria',
      facts: [`Kegiatan: ${activity}`, ...facts],
      textDetails: [
        ...(reasons.length ? [`Kriteria mendukung: ${reasons.join(', ')}`] : []),
        ...(padewasan.length ? [`Ala Ayuning Dewasa: ${padewasan.join(', ')}`] : []),
      ],
    },
    initialStyle: { layout: 'standar', topColor: '#ffffff', bottomColor: '#fffbeb', textColor: '#0f172a', background: { kind: 'none' } },
    fileName: `mengatur-dewasa-${result.tanggal}.png`,
  };
}
