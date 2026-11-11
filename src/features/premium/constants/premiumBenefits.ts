import type { BenefitCardItem } from '../types/premium.types';

/**
 * ==============================================================================
 * KONSTANTA KEUNTUNGAN MEMBER PREMIUM
 * ==============================================================================
 * Merupakan rincian hak istimewa yang diadaptasi dan disempurnakan dari halaman
 * website lama (Kalender, Wariga Personal, Kelola Pura) dengan penambahan
 * modul modern Pal Sri Sedana (Garis Hidup).
 * ==============================================================================
 */

export const PREMIUM_BENEFITS: BenefitCardItem[] = [
  {
    id: 'kalender',
    category: 'kalender',
    badge: 'Akses Penuh',
    title: 'Kalender Bali & Ala Ayuning Lengkap',
    description:
      'Dapatkan akses lengkap untuk melihat rincian Wariga, Ala Ayuning Dewasa, dan makna sastra secara langsung dari tanggal yang dipilih pada menu Kalender tanpa batasan.',
  },
  {
    id: 'wariga',
    category: 'wariga',
    badge: 'Tanpa Batas',
    title: 'Wariga Personal Bebas Kuota',
    description:
      'Dapatkan akses penuh pada menu Wariga Personal untuk mengevaluasi kecocokan weton kelahiran, karakter diri, dan hari baik secara mendalam tanpa batasan frekuensi.',
  },
  {
    id: 'pura',
    category: 'pura',
    badge: 'Hak Istimewa',
    title: 'Kelola & Usul Data Pura',
    description:
      'Dapatkan akses istimewa untuk mengajukan diri sebagai penanggung jawab pura, mendaftarkan jadwal piodalan pura keluarga/kawitan, serta menyusun tahapan upacara.',
  },
  {
    id: 'garis-hidup',
    category: 'garis-hidup',
    badge: 'Multi-Peserta',
    title: 'Garis Hidup (Pal Sri Sedana)',
    description:
      'Akses pemetaan siklus rezeki dan perjalanan hidup 6-tahunan multi-peserta keluarga secara lengkap dengan grafik perbandingan interaktif.',
  },
];

