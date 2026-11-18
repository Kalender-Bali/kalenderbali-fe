import type { DewasaActivityGuidance, PadewasanItem } from '../types/alaAyuning.types';

const activityLabels: Record<string, string> = {
  'Bhuta Yadnya': 'upacara Bhuta Yadnya',
  'Dewa Yadnya': 'upacara Dewa Yadnya',
  'Manusa Yadnya': 'upacara Manusa Yadnya',
  'Pitra Yadnya': 'upacara Pitra Yadnya',
  'Resi Yadnya': 'upacara Resi Yadnya',
  'Upacara Melaspas': 'upacara melaspas',
  'Upacara Pernikahan': 'pernikahan',
  'Upacara Potong Rambut': 'upacara potong rambut',
  'Membuat Tempat Usaha': 'membuat tempat usaha',
  'Membangun Rumah': 'membangun rumah',
  'Membuat Tembok Pekarangan atau Penyengker': 'membuat tembok pekarangan atau penyengker',
  'Membangun Bangunan Suci': 'membangun tempat suci',
  'Mulai Berdagang': 'mulai berdagang',
  'Mulai Membangun Usaha': 'memulai usaha',
  'Pindah Rumah': 'pindah rumah',
  'Manusa Yadnya (Potong Gigi)': 'upacara potong gigi',
  'Tapa, Brata, Yoga, Semadi, Penyucian Diri': 'tapa brata, yoga, semadi, dan penyucian diri',
};

const listFormatter = new Intl.ListFormat('id', { style: 'long', type: 'conjunction' });

/**
 * Ringkas seluruh kecocokan aturan resmi pada hasil tanggal yang sama.
 * Pantangan selalu didahulukan; nama, kata "baik", dan bobot Alahing Dewasa
 * tidak dipakai untuk menebak bahwa suatu kegiatan cocok.
 */
export function buildPracticalSummary(items: PadewasanItem[], guidance: DewasaActivityGuidance[] = []) {
  const activeIDs = new Set(items.map(item => item.id));
  const activities = new Map<string, { label: string; recommended: boolean; avoid: boolean }>();

  for (const activity of guidance) {
    const name = activity.activity_name.trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase('id');
    const entry = activities.get(key) ?? {
      label: activityLabels[name] ?? name,
      recommended: false,
      avoid: false,
    };
    entry.recommended ||= activity.matched_recommended.some(reason => activeIDs.has(reason.calendar_value_id ?? ''));
    entry.avoid ||= activity.matched_avoid.some(reason => activeIDs.has(reason.calendar_value_id ?? ''));
    activities.set(key, entry);
  }

  const matched = [...activities.values()];
  const recommended = matched.filter(activity => activity.recommended && !activity.avoid).map(activity => activity.label);
  const avoid = matched.filter(activity => activity.avoid).map(activity => activity.label);
  const hasConflict = matched.some(activity => activity.recommended && activity.avoid);

  return {
    overview: items.length === 0
      ? 'Belum ada anjuran atau pantangan khusus yang tercatat untuk tanggal ini.'
      : recommended.length > 0 && avoid.length > 0
        ? 'Tanggal ini mendukung beberapa kegiatan, tetapi ada juga rencana yang sebaiknya ditunda.'
        : avoid.length > 0
          ? 'Sebaiknya berhati-hati merencanakan kegiatan pada tanggal ini karena ada pantangan yang perlu diperhatikan.'
          : recommended.length > 0
            ? 'Tanggal ini dapat dimanfaatkan untuk kegiatan yang mendapat anjuran berikut.'
            : 'Belum ada kesimpulan kegiatan yang dapat dibuat dari hasil tanggal ini. Periksa anjuran dan pantangan pada rincian setiap unsur.',
    recommended: recommended.length > 0 ? `${listFormatter.format(recommended)}.` : null,
    avoid: avoid.length > 0 ? `${listFormatter.format(avoid)}.` : null,
    conflict: hasConflict
      ? 'Sebagian kegiatan memiliki anjuran sekaligus pantangan. Untuk kegiatan tersebut, utamakan pantangannya; adanya anjuran lain tidak membatalkan pantangan.'
      : null,
  };
}
