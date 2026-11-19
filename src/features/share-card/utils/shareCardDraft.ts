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

export interface StructuredCardContent {
  kind: 'structured';
  title: string;
  accent: string;
  iconPath?: string;
  context: string;
  result: string;
  source?: string;
  facts: readonly string[];
  textDetails?: readonly string[];
}

export interface CardDraft {
  content: StructuredCardContent | { kind: 'greeting'; text: string };
  message: string;
  sender: string;
  style: CardStyle;
}

// Thumbnail dan gambar ekspor menggunakan potongan foto yang sama.
export function backgroundUrl(id: PresetId, thumbnail = false): string {
  return `${import.meta.env.BASE_URL}assets/images/kartu-ucapan/${id}${thumbnail ? '-thumb' : ''}.webp`;
}

export const messageLimit = 120;
export const senderLimit = 40;
export const cardBrand = 'Kalender Bali Lengkap';

// Pesan dan pengirim punya format yang sama untuk kanvas dan teks berbagi.
export function cardSenderLine(sender: string): string {
  const name = sender.trim();
  return name ? `Dari: ${name}` : '';
}

export function formatCardText({ content, message, sender }: CardDraft): string {
  const lines = content.kind === 'structured'
    ? [content.title, content.context, content.result, content.source, ...content.facts, ...(content.textDetails ?? [])]
    : [content.text];
  return [...lines, message.trim(), cardSenderLine(sender), cardBrand].filter(Boolean).join('\n\n');
}

const segmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('id', { granularity: 'grapheme' })
  : null;

// Emoji gabungan dan huruf beraksen dihitung sebagai satu karakter.
export function characters(text: string): string[] {
  return segmenter ? Array.from(segmenter.segment(text), ({ segment }) => segment) : Array.from(text);
}
