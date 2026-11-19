import { formatFullIndoDate } from '@/features/kalender/utils/calendarUtils';
import type { CardStyle, StructuredCardContent } from '@/features/share-card/utils/shareCardDraft';
import type { HariRayaBadgeVariant, HariRayaCardItem, HariRayaMasterItem } from '../types/hariRaya.types';

// Setiap bagian ikon berawal dari koordinat absolut agar tetap tepat di satu Path2D.
const celebrationPath = [
  'M5.8 11.3 2 22l10.7-3.79',
  'M4 3h.01M22 8h.01M15 2h.01M22 20h.01',
  'M22 2l-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10',
  'M22 13l-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17',
  'M11 2l.33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7',
  'M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z',
].join(' ');

// Kanvas memakai warna palet tanggal web berdasarkan varian yang sudah dipilih halaman.
const palette: Record<HariRayaBadgeVariant, { accent: string; background: string }> = {
  gold: { accent: '#b45309', background: '#fffbeb' },
  rose: { accent: '#e11d48', background: '#fff1f2' },
  mint: { accent: '#0f766e', background: '#e6f7f5' },
  purple: { accent: '#6d28d9', background: '#ede9fe' },
  emerald: { accent: '#15803d', background: '#f0fdf4' },
};

export function buildHariRayaShareCard(
  card: HariRayaCardItem,
  master?: HariRayaMasterItem | null,
): { content: StructuredCardContent; initialStyle: CardStyle; fileName: string } {
  const { accent, background } = palette[card.badgeVariant];
  const nama = card.nama.trim();
  const slug = nama.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');

  // Baca rincian dari tanggal yang dipilih dan lewati kolom yang belum berisi nilai.
  const wewaran = [card.saptawara, card.triwara, card.pancawara, card.wuku]
    .map((value) => value?.trim()).filter((value) => value && value !== '-').join(', ');
  const sasih = card.sasih?.trim();
  const jenis = (card.jenis?.trim() || master?.jenis?.trim())?.replaceAll('_', ' ');
  const keterangan = card.keterangan?.trim() || master?.keterangan?.trim();

  return {
    content: {
      kind: 'structured',
      title: 'Hari Raya',
      iconPath: celebrationPath,
      accent,
      context: nama,
      result: [card.dayName, formatFullIndoDate(card.tanggal)].filter(Boolean).join(', '),
      facts: [
        wewaran ? `Wewaran: ${wewaran}` : '',
        sasih && sasih !== '-' ? `Sasih: ${sasih}` : '',
        card.tahunSaka ? `Tahun Saka: ${card.tahunSaka}` : '',
      ].filter(Boolean),
      // Keterangan resmi melengkapi teks berbagi, sementara gambar berisi ringkasan tanggal.
      textDetails: [jenis ? `Jenis: ${jenis}` : '', keterangan ? `Keterangan: ${keterangan}` : ''].filter(Boolean),
    },
    initialStyle: {
      layout: 'standar',
      topColor: '#ffffff',
      bottomColor: background,
      textColor: '#0f172a',
      background: { kind: 'none' },
    },
    fileName: [slug || 'hari-raya', card.tanggal].join('-') + '.png',
  };
}
