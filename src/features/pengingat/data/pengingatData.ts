import type { PengingatCategory } from '../types/pengingat.types';

export const PENGINGAT_CATEGORIES: PengingatCategory[] = [
  { id: 'otonan', title: 'Pengingat Otonan', singular: 'otonan', description: 'Hari istimewa setiap anggota keluarga.', icon: 'users', accent: 'bg-[#e6f7f5] text-[#0f766e] border-teal-200/60 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800' },
  { id: 'piodalan', title: 'Pengingat Piodalan', singular: 'piodalan', description: 'Piodalan pura, merajan, dan acara keluarga.', icon: 'landmark', accent: 'bg-[#ede9fe] text-[#6d28d9] border-violet-200/60 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800' },
  { id: 'hari-raya', title: 'Pengingat Hari Raya', singular: 'hari raya', description: 'Rahina dan hari raya yang ingin kamu ikuti.', icon: 'sun', accent: 'bg-[#fffbeb] text-[#b45309] border-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
  { id: 'mengatur-dewasa', title: 'Pengingat Dewasa', singular: 'dewasa', description: 'Tanggal pilihan untuk rencana kegiatanmu.', icon: 'calendar', accent: 'bg-[#f0fdf4] text-[#15803d] border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
];

export const EMPTY_PAWUKON = { saptawaraId: '', pancawaraId: '', wukuId: '' };

