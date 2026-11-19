import type { CardStyle, StructuredCardContent } from '@/features/share-card/utils/shareCardDraft';
import type { Verse } from '../types/bhagawadGita.types';

const bookPath = 'M12 7v14M12 7c-2.8-2.3-6.5-2.8-10-1.5v13c3.5-1.3 7.2-.8 10 2.5 2.8-3.3 6.5-3.8 10-2.5v-13C18.5 4.2 14.8 4.7 12 7Z';

export const bhagawadGitaShareStyle: CardStyle = {
  layout: 'standar',
  topColor: '#ffffff',
  bottomColor: '#fffbeb',
  textColor: '#0f172a',
  background: { kind: 'none' },
};

// Gambar menampilkan terjemahan dan rujukan; teks juga memuat sloka dan pembahasan.
export function buildBhagawadGitaShareCard(verse: Verse): { content: StructuredCardContent; fileName: string } {
  const sloka = verse.sloka?.trim();
  const narrative = verse.narrative?.trim();
  return {
    content: {
      kind: 'structured',
      title: 'Bhagawadgita',
      accent: '#b45309',
      iconPath: bookPath,
      context: 'Renungan Bhagawadgita',
      result: verse.translation?.trim() ?? '',
      source: `Bhagawadgita · Bab ${verse.chapter_number}, Sloka ${verse.verse_number}`,
      facts: [],
      textDetails: [
        ...(sloka ? [`Sloka: ${sloka}`] : []),
        ...(narrative ? [`Pembahasan: ${narrative}`] : []),
      ],
    },
    fileName: `bhagawadgita-bab-${verse.chapter_number}-sloka-${verse.verse_number}.png`,
  };
}
