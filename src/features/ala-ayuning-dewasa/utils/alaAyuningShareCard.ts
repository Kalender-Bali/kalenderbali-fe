import { formatFullIndoDate, getIndoDayName } from '@/features/kalender/utils/calendarUtils';
import type { CardStyle, StructuredCardContent } from '@/features/share-card/utils/shareCardDraft';
import type { DewasaActivityGuidance, PadewasanItem, PawukonHarianInfo } from '../types/alaAyuning.types';

export function buildAlaAyuningShareCard(item: PadewasanItem, tanggal: string, pawukon: PawukonHarianInfo | null, guidance: DewasaActivityGuidance[]): {
  content: StructuredCardContent; initialStyle: CardStyle; fileName: string;
} {
  // Hanya gunakan penanggalan yang benar-benar berasal dari tanggal terpilih.
  const day = pawukon?.tanggal === tanggal ? pawukon : null;
  const wara = [day?.saptawara, day?.pancawara].filter(value => value && value !== '-').join(' ');
  const wuku = day?.wuku && day.wuku !== '-' ? `Wuku ${day.wuku}` : '';
  const lunar = [day?.pengalantaka, day?.penanggal1 || '', day?.penanggal2 ? `/ ${day.penanggal2}` : ''].filter(Boolean).join(' ');
  const sasih = day?.sasih && day.sasih !== '-' ? `Sasih ${day.sasih}` : '';
  const facts = [[wara, wuku].filter(Boolean).join(' · '), [lunar, sasih].filter(Boolean).join(' · ')].filter(Boolean);

  // Kegiatan dicocokkan melalui ID unsur dan status harian Go mengutamakan pantangan.
  const recommended: string[] = [];
  const avoid: string[] = [];
  for (const activity of guidance) {
    const matchedAvoid = activity.matched_avoid.some(reason => reason.calendar_value_id === item.id);
    const matchedRecommended = activity.matched_recommended.some(reason => reason.calendar_value_id === item.id);
    if (matchedAvoid) avoid.push(activity.activity_name);
    if (matchedRecommended && activity.status === 'eligible' && activity.matched_avoid.length === 0) recommended.push(activity.activity_name);
  }
  const slug = item.nama.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  return {
    content: {
      kind: 'structured', title: 'Ala Ayuning Dewasa', accent: '#b45309',
      iconPath: 'M3 5h18v16H3z M7 2v6 M17 2v6 M3 10h18',
      context: `${getIndoDayName(tanggal)}, ${formatFullIndoDate(tanggal)}`,
      result: item.nama, facts,
      textDetails: [item.keterangan?.trim() ? `Keterangan: ${item.keterangan.trim()}` : '', recommended.length ? `Dianjurkan: ${recommended.join(', ')}` : '', avoid.length ? `Dihindari: ${avoid.join(', ')}` : ''].filter(Boolean),
    },
    initialStyle: { layout: 'standar', topColor: '#ffffff', bottomColor: '#fffbeb', textColor: '#0f172a', background: { kind: 'none' } },
    fileName: `${slug || 'padewasan'}-${tanggal}.png`,
  };
}
