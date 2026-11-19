import { formatFullIndoDate, getIndoDayName } from '@/features/kalender/utils/calendarUtils';
import type { CardStyle, StructuredCardContent } from '@/features/share-card/utils/shareCardDraft';
import type { WarigaPersonalItem } from '../types/warigaPersonal.types';

// Warna mengikuti kategori yang sudah dipakai pada detail Wariga Personal.
const colors = {
  Guru: { accent: '#0284c7', background: '#f0f9ff' },
  Ratu: { accent: '#059669', background: '#ecfdf5' },
  Lara: { accent: '#b45309', background: '#fffbeb' },
  Pati: { accent: '#e11d48', background: '#fff1f2' },
};

export function buildWarigaPersonalShareCard(item: WarigaPersonalItem, uripKelahiran: number): {
  content: StructuredCardContent; initialStyle: CardStyle; fileName: string;
} {
  const { accent, background } = colors[item.wariga];
  // Angka dan klasifikasi berasal dari hasil Go untuk tanggal yang dipilih.
  const details = [
    `Perhitungan: ${item.total_urip_kumulatif} % 4 = ${item.modulo}`,
    ...(item.modulo === 0 ? [`Angka perwakilan: ${item.angka_perwakilan}`] : []),
    ...(item.keterangan?.trim() ? [`Keterangan: ${item.keterangan.trim()}`] : []),
  ];
  return {
    content: {
      kind: 'structured', title: 'Wariga Personal', accent,
      iconPath: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3 6.3-2.1Z',
      context: `${getIndoDayName(item.tanggal)}, ${formatFullIndoDate(item.tanggal)}`,
      result: `${item.wariga} · ${item.status_hari === 'baik' ? 'Baik' : 'Buruk'}`,
      facts: [`Urip kelahiran: ${uripKelahiran}`, `Urip tanggal: ${item.total_urip_hari}`],
      textDetails: details,
    },
    initialStyle: { layout: 'standar', topColor: '#ffffff', bottomColor: background, textColor: '#0f172a', background: { kind: 'none' } },
    fileName: `wariga-personal-${item.tanggal}.png`,
  };
}
