export const backgroundPresets = [
  { id: 'natural_pattern', label: 'Pola natural' },
  { id: 'pattern1', label: 'Pola 1' },
  { id: 'pattern2', label: 'Pola 2' },
  { id: 'pattern3', label: 'Pola 3' },
  { id: 'pattern4', label: 'Pola 4' },
  { id: 'pattern5', label: 'Pola 5' },
  { id: 'temple1', label: 'Pura 1' },
  { id: 'temple2', label: 'Pura 2' },
  { id: 'temple3', label: 'Pura 3' },
] as const;

type PresetId = (typeof backgroundPresets)[number]['id'];

export type CardBackground =
  | { kind: 'preset'; id: PresetId }
  | { kind: 'photo'; image: HTMLImageElement }
  | { kind: 'none' };

export interface CardStyle {
  layout: 'ucapan' | 'standar';
  topColor: string;
  bottomColor: string;
  textColor: string;
  background: CardBackground;
}

export interface CardDraft {
  greeting: string;
  message: string;
  sender: string;
  style: CardStyle;
}

// Nilai bawaan mengikuti kartu Ucapan Android dan dipakai kembali saat reset.
export const defaultStyle: CardStyle = {
  layout: 'ucapan',
  topColor: '#3f82f6',
  bottomColor: '#08978d',
  textColor: '#ffffff',
  background: { kind: 'preset', id: backgroundPresets[0].id },
};

// Thumbnail dan gambar ekspor menggunakan potongan foto yang sama.
export function backgroundUrl(id: PresetId, thumbnail = false): string {
  return `${import.meta.env.BASE_URL}assets/images/kartu-ucapan/${id}${thumbnail ? '-thumb' : ''}.webp`;
}

export const messageLimit = 120;
export const senderLimit = 40;

const segmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('id', { granularity: 'grapheme' })
  : null;

// Emoji gabungan dan huruf beraksen dihitung sebagai satu karakter.
export function characters(text: string): string[] {
  return segmenter ? Array.from(segmenter.segment(text), ({ segment }) => segment) : Array.from(text);
}
