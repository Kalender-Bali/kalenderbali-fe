import type { CalendarGridDay, KalenderHarian, PiodalanTerdekatItem } from '../types/kalender.types';
import type { PuraBackendItem } from '@/features/piodalan/types/piodalan.types';

/**
 * ============================================================================
 * UTILITAS KALENDER BALI & PENANGGALAN
 * ============================================================================
 * Berkas ini menyediakan fungsi-fungsi esensial yang murni, ringan, dan efisien:
 *  1. Normalisasi tanggal ke zona waktu WITA (UTC+8) agar bebas dari bug off-by-one.
 *  2. Kamus lookup Urip, Arah Mata Angin (Pangider-ider), dan Dina Ka-.
 *  3. Generator matriks grid 7 kolom untuk tampilan kalender bulanan.
 *  4. Penentu varian warna badge hari raya sesuai estetika desain mockup.
 *  5. Generator berkas iCalendar (.ics) untuk ekspor agenda ke Google/Apple Calendar.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. Kamus Nilai Wariga (Urip, Arah Pengider-ider, dan Urutan Dina)
// ---------------------------------------------------------------------------

/**
 * Nilai Urip (Neptu) resmi untuk tiap siklus Pancawara.
 */
export const URIP_PANCAWARA: Record<string, number> = {
  Umanis: 5,
  Paing: 9,
  Pon: 7,
  Wage: 4,
  Kliwon: 8,
};

/**
 * Nilai Urip (Neptu) resmi untuk tiap siklus Saptawara.
 */
export const URIP_SAPTAWARA: Record<string, number> = {
  Redite: 5,
  Soma: 4,
  Anggara: 3,
  Buda: 7,
  Wraspati: 8,
  Sukra: 6,
  Saniscara: 9,
};

/**
 * Arah mata angin pengider-ider berdasarkan Pancawara.
 */
export const ARAH_PANCAWARA: Record<string, string> = {
  Umanis: 'Timur',
  Paing: 'Selatan',
  Pon: 'Barat',
  Wage: 'Utara',
  Kliwon: 'Tengah',
};

/**
 * Urutan Dina (hari dalam satu wuku) dari Redite (hari ke-1) s.d. Saniscara (hari ke-7).
 */
export const DINA_SAPTAWARA: Record<string, number> = {
  Redite: 1,
  Soma: 2,
  Anggara: 3,
  Buda: 4,
  Wraspati: 5,
  Sukra: 6,
  Saniscara: 7,
};

/**
 * Menghitung total Urip, Arah Mata Angin, dan Dina Wuku dari nama Saptawara & Pancawara.
 */
export function getWarigaSummary(saptawaraName: string, pancawaraName: string) {
  const uripSapta = URIP_SAPTAWARA[saptawaraName] || 0;
  const uripPanca = URIP_PANCAWARA[pancawaraName] || 0;
  const totalUrip = uripSapta + uripPanca;
  const arah = ARAH_PANCAWARA[pancawaraName] || 'Pusat';
  const dinaKa = DINA_SAPTAWARA[saptawaraName] || 1;

  return { totalUrip, arah, dinaKa };
}

// ---------------------------------------------------------------------------
// 2. Normalisasi Zona Waktu WITA (UTC+8 / Asia/Makassar) & Pemformatan Tanggal
// ---------------------------------------------------------------------------

const NAMA_BULAN_INDO = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const NAMA_HARI_INDO = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
];

/**
 * Mengembalikan tanggal hari ini dalam format "YYYY-MM-DD" yang dikunci
 * secara mutlak ke zona waktu WITA (UTC+8), mencegah bug pergeseran tanggal
 * bagi pengguna di wilayah WIB, WIT, maupun luar negeri.
 */
export function getTodayWITA(): string {
  const now = new Date();
  // Format tanggal dalam zona waktu Asia/Makassar (WITA)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // Menghasilkan "YYYY-MM-DD"
}

/**
 * Mengonversi tanggal "YYYY-MM-DD" menjadi teks lengkap Indonesia.
 * Contoh: "2026-09-22" -> "22 September 2026"
 */
export function formatFullIndoDate(dateString: string): string {
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (!year || !month || !day) return dateString;
  return `${day} ${NAMA_BULAN_INDO[month - 1]} ${year}`;
}

/**
 * Mengambil nama bulan Indonesia (1-12).
 */
export function getIndoMonthName(month: number): string {
  return NAMA_BULAN_INDO[month - 1] || '';
}

/**
 * Mengambil nama hari Masehi Indonesia dari tanggal "YYYY-MM-DD".
 * Contoh: "2026-09-22" -> "Selasa"
 */
export function getIndoDayName(dateString: string): string {
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return NAMA_HARI_INDO[date.getUTCDay()];
}

/** Memvalidasi tanggal sipil Gregorian tanpa membiarkan Date menggulirkan hari. */
export function isValidISODate(dateString: string): boolean {
  if (dateString.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const [year, month, day] = dateString.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysPerMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysPerMonth[month - 1];
}

/** Memecah tanggal "YYYY-MM-DD" menjadi angka numerik. */
export function parseISODate(dateString: string): { year: number; month: number; day: number } {
  const parts = dateString.split('-').map(Number);
  return {
    year: parts[0] || 2026,
    month: parts[1] || 1,
    day: parts[2] || 1,
  };
}

/**
 * Menggabungkan angka year, month, day menjadi string format "YYYY-MM-DD".
 */
export function toISODateString(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// 3. Generator Matriks Grid Kalender Bulanan (7 Kolom: Min s.d. Sab)
// ---------------------------------------------------------------------------

/**
 * Menghasilkan susunan 35 atau 42 sel tanggal untuk satu bulan kalender,
 * lengkap dengan sel tanggal sebelum (overlap bulan lalu) dan sesudah (overlap bulan depan).
 *
 * @param year Tahun Masehi (misal: 2026)
 * @param month Bulan Masehi 1-12 (misal: 9 untuk September)
 * @param selectedDate Tanggal yang sedang aktif/dipilih ("YYYY-MM-DD")
 * @param daysMap Map data KalenderHarian dari backend dengan key "YYYY-MM-DD"
 */
export function generateMonthGrid(
  year: number,
  month: number,
  selectedDate: string,
  daysMap: Map<string, KalenderHarian>
): CalendarGridDay[] {
  const todayWITA = getTodayWITA();
  const gridCells: CalendarGridDay[] = [];

  // Hari pertama di bulan aktif (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)
  const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  // Jumlah hari di bulan aktif
  const daysInCurrentMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  // Jumlah hari di bulan sebelumnya
  const daysInPrevMonth = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  // 1. Sel dari Bulan Sebelumnya (Trailing days)
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i;
    const dateStr = toISODateString(prevYear, prevMonth, dayNumber);
    gridCells.push({
      dateString: dateStr,
      dayNumber,
      isCurrentMonth: false,
      isToday: dateStr === todayWITA,
      isSelected: dateStr === selectedDate,
      data: daysMap.get(dateStr),
    });
  }

  // 2. Sel dari Bulan Aktif (Current month days)
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateStr = toISODateString(year, month, day);
    gridCells.push({
      dateString: dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === todayWITA,
      isSelected: dateStr === selectedDate,
      data: daysMap.get(dateStr),
    });
  }

  // 3. Sel dari Bulan Berikutnya (Leading days untuk melengkapi kelipatan 7 baris)
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const remainingCells = (7 - (gridCells.length % 7)) % 7;
  // Jika barisnya baru 4 atau 5 baris (total < 35), tambahkan 7 sel lagi agar layout konsisten
  const targetTotal = gridCells.length + remainingCells < 35 ? 35 : gridCells.length + remainingCells;

  let nextDayCounter = 1;
  while (gridCells.length < targetTotal) {
    const dateStr = toISODateString(nextYear, nextMonth, nextDayCounter);
    gridCells.push({
      dateString: dateStr,
      dayNumber: nextDayCounter,
      isCurrentMonth: false,
      isToday: dateStr === todayWITA,
      isSelected: dateStr === selectedDate,
      data: daysMap.get(dateStr),
    });
    nextDayCounter++;
  }

  return gridCells;
}

// ---------------------------------------------------------------------------
// 4. Styling Semantik Badge Hari Raya
// ---------------------------------------------------------------------------

export interface BadgeColorStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

/**
 * Menentukan skema warna badge hari raya berdasarkan kelompok tradisi Hindu Bali:
 * Skema warna ini sepenuhnya STATIS sesuai tingkatan/kategori rahinan dan TIDAK
 * mengikuti perubahan aksen tema tampilan pengguna.
 *
 * 1. Siklus Sasih (Pengalantaka):
 *    - Purnama -> Merah Rose (Simbol lingkaran merah kalender Bali)
 *    - Tilem -> Hitam / Dark Slate (Simbol lingkaran hitam kalender Bali)
 * 2. Kelompok Kliwonan:
 *    - Kajeng Kliwon -> Oranye / Terracotta
 * 3. Kelompok Tumpek (Saniscara Kliwon):
 *    - 6 Tumpek (Landep, Wariga, Kuningan, Krulut, Kandang/Uye, Wayang) -> Kuning Emas (Amber)
 * 4. Kelompok Hari Raya Besar Utama (Kemenangan Dharma, Pustaka Suci & Sasih Akbar):
 *    - Galungan & Rangkaian (Sugian, Penyekeban, Penyajaan, Penampahan, Galungan, Umanis, Pamaridan Guru, Pemacekan Agung, Ulihan, Pegatwakan)
 *    - Kuningan & Penampahan Kuningan
 *    - Saraswati & Rangkaian (Banyu Pinaruh, Soma Ribek, Sabuh Mas, Pagerwesi, Penegtegan, Paid-Paidan, Pangredanan, Urip)
 *    - Nyepi & Rangkaian (Melasti, Tawur Kesanga, Nyepi, Ngembak Geni)
 *    - Siwalatri / Siwaratri
 *    -> Hijau Zamrud (Emerald)
 * 5. Kelompok Rahinan Rutin Wewaran (Pemujaan Bhatara & Kemakmuran Rezeki / Sri Sedana):
 *    - Buda Cemeng (Ukir, Langkir, Merakih, Menail, Kelawu), Rambut Sedana / Sadhana, Bhatari Sri,
 *      Bhatara Guru (Persembahan Bhatara Guru), Bhatara Brahma, Bhatara Wisnu
 *    -> Biru Langit (Sky)
 * 6. Kelompok Rahinan Rutin Wewaran (Asmara Kasih & Spiritual):
 *    - Anggara Kasih (Kulantir, Julungwangi, Medangsia, Tambir, Perangbakat, Dukut)
 *    -> Ungu Lembut (Purple)
 * 7. Kelompok Rahinan Wewaran Kliwon:
 *    - Buda Kliwon (Matal, Ugu, Pegatwakan, Gumbreg, Dunggulan, Pahang)
 *    -> Cyan / Tosca Statis
 * 8. Default Rahinan Lainnya:
 *    -> Netral Slate Statis
 */
export function getHariRayaBadgeStyle(nama: string): BadgeColorStyle {
  const lower = nama.toLowerCase();

  // 1. Purnama -> Lingkaran Merah khas Kalender Bali (Simbol Candra Purwa / Bulan Purnama)
  if (lower.includes('purnama')) {
    return {
      bg: 'bg-rose-100 dark:bg-rose-950/70',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200/70 dark:border-rose-800/80',
      dot: 'bg-rose-500 dark:bg-rose-400',
    };
  }

  // 2. Tilem -> Lingkaran Hitam Pekat khas Kalender Bali (Simbol Candra Surya / Bulan Mati)
  if (lower.includes('tilem')) {
    return {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-800 dark:text-slate-100',
      border: 'border-slate-300/80 dark:border-slate-700',
      dot: 'bg-slate-900 dark:bg-slate-300',
    };
  }

  // 3. Kajeng Kliwon -> Oranye / Terracotta (Pertemuan Triwara & Pancawara Kliwon)
  if (lower.includes('kajeng kliwon')) {
    return {
      bg: 'bg-orange-100 dark:bg-orange-950/70',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-200/70 dark:border-orange-800/80',
      dot: 'bg-orange-500 dark:bg-orange-400',
    };
  }

  // 4. Kelompok Tumpek (Saniscara Kliwon - Landep, Wariga, Kuningan, Krulut, Kandang/Uye, Wayang) -> Kuning Emas
  if (lower.includes('tumpek')) {
    return {
      bg: 'bg-amber-100 dark:bg-amber-950/70',
      text: 'text-amber-900 dark:text-amber-300',
      border: 'border-amber-200/70 dark:border-amber-800/80',
      dot: 'bg-amber-500 dark:bg-amber-400',
    };
  }

  // 5. Kelompok Hari Raya Besar Utama (Kemenangan Dharma, Pustaka Suci & Sasih Akbar) -> Hijau Zamrud
  if (
    lower.includes('galungan') ||
    lower.includes('kuningan') ||
    lower.includes('saraswati') ||
    lower.includes('pagerwesi') ||
    lower.includes('banyu pinaruh') ||
    lower.includes('soma ribek') ||
    lower.includes('sabuh mas') ||
    lower.includes('nyepi') ||
    lower.includes('siwalatri') ||
    lower.includes('siwaratri') ||
    lower.includes('sugian') ||
    lower.includes('penyekeban') ||
    lower.includes('penyajaan') ||
    lower.includes('penampahan') ||
    lower.includes('ulihan') ||
    lower.includes('pemacekan agung') ||
    lower.includes('pamaridan guru') ||
    lower.includes('pegatwakan') ||
    lower.includes('penegtegan') ||
    lower.includes('paid-paidan') ||
    lower.includes('pangredanan')
  ) {
    return {
      bg: 'bg-emerald-100 dark:bg-emerald-950/70',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-200/70 dark:border-emerald-800/80',
      dot: 'bg-emerald-500 dark:bg-emerald-400',
    };
  }

  // 6. Kelompok Rahinan Rutin Wewaran (Pemujaan Bhatara & Kemakmuran Rezeki / Sri Sedana) -> Biru Langit
  if (
    lower.includes('buda cemeng') ||
    lower.includes('rambut sadhana') ||
    lower.includes('rambut sedana') ||
    lower.includes('bhatari sri') ||
    lower.includes('bhatara guru') ||
    lower.includes('bhatara brahma') ||
    lower.includes('bhatara wisnu')
  ) {
    return {
      bg: 'bg-sky-100 dark:bg-sky-950/70',
      text: 'text-sky-800 dark:text-sky-300',
      border: 'border-sky-200/70 dark:border-sky-800/80',
      dot: 'bg-sky-500 dark:bg-sky-400',
    };
  }

  // 7. Kelompok Rahinan Rutin Wewaran (Anggara Kasih - Asmara Kasih & Spiritual) -> Ungu Lembut
  if (lower.includes('anggara kasih')) {
    return {
      bg: 'bg-purple-100 dark:bg-purple-950/70',
      text: 'text-purple-800 dark:text-purple-300',
      border: 'border-purple-200/70 dark:border-purple-800/80',
      dot: 'bg-purple-500 dark:bg-purple-400',
    };
  }

  // 8. Kelompok Rahinan Wewaran Kliwon (Buda Kliwon) -> Cyan / Tosca Statis
  if (lower.includes('buda kliwon')) {
    return {
      bg: 'bg-cyan-100 dark:bg-cyan-950/70',
      text: 'text-cyan-800 dark:text-cyan-300',
      border: 'border-cyan-200/70 dark:border-cyan-800/80',
      dot: 'bg-cyan-500 dark:bg-cyan-400',
    };
  }

  // 9. Default Rahinan / Hari Raya Lainnya -> Netral Slate Statis
  return {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400 dark:bg-slate-400',
  };
}

// ---------------------------------------------------------------------------
// 5. Generator Berkas iCalendar (.ics) Client-Side
// ---------------------------------------------------------------------------

/**
 * Menghasilkan dan memicu unduhan berkas .ics kalender untuk seluruh hari raya
 * di bulan atau tahun tertentu tanpa ketergantungan library luar.
 */
export function exportHariRayaToICS(
  year: number,
  month: number,
  calendarDays: KalenderHarian[]
) {
  const events: string[] = [];
  const monthName = getIndoMonthName(month);

  calendarDays.forEach((day) => {
    if (day.hari_raya && day.hari_raya.length > 0) {
      const [y, m, d] = day.tanggal.split('-');
      const dtStart = `${y}${m}${d}`;
      // Akhir tanggal all-day event adalah hari berikutnya (RFC 5545)
      const nextDay = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d) + 1));
      const dtEnd = nextDay.toISOString().slice(0, 10).replace(/-/g, '');

      day.hari_raya.forEach((hr) => {
        const uid = `kalender-bali-${hr.id || ''}-${day.tanggal}@kalenderbali.app`;
        const summary = hr.nama;
        const description = `Perayaan Rahina Hindu Bali: ${hr.nama}. Wuku: ${day.wewaran?.wuku?.nama || '-'}, Sasih: ${day.sasih?.nama_sasih || '-'}.`;

        events.push(
          [
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${dtStart}T000000Z`,
            `DTSTART;VALUE=DATE:${dtStart}`,
            `DTEND;VALUE=DATE:${dtEnd}`,
            `SUMMARY:${summary}`,
            `DESCRIPTION:${description}`,
            'STATUS:CONFIRMED',
            'TRANSP:TRANSPARENT',
            'END:VEVENT',
          ].join('\r\n')
        );
      });
    }
  });

  if (events.length === 0) {
    alert('Tidak ada agenda hari raya pada bulan ini untuk diunduh.');
    return;
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kalender Bali Digital//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Kalender Bali ${monthName} ${year}`,
    'X-WR-TIMEZONE:Asia/Makassar',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Kalender-Bali-${monthName}-${year}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// 8. MESIN PENCOCOKAN PIODALAN KALENDER (Pawukon 210 Hari & Sasih Candra)
// ============================================================================

/**
 * Normalisasi string nama wewaran/sasih agar toleran terhadap variasi kapitalisasi dan penulisan ejaan.
 */
export const normalizeCalendarString = (s?: string | null): string => {
  if (!s) return '';
  const lower = s.toLowerCase().trim();
  if (lower === 'kedasa') return 'kadasa';
  if (lower === 'ketiga') return 'katiga';
  if (lower === 'kelima') return 'kalima';
  if (lower === 'kenam' || lower === 'kaenam') return 'kanem';
  if (lower === 'kepitu') return 'kapitu';
  if (lower === 'kesanga') return 'kasanga';
  if (lower === 'dunggulan') return 'dungulan';
  if (lower === 'kulawu' || lower === 'kelawu') return 'klawu';
  if (lower === 'klurut') return 'krulut';
  if (['jyestha', 'jyesta', 'jiyesta'].includes(lower)) return 'jiyestha';
  if (lower === 'sada') return 'sadha';
  if (lower === 'wrespati') return 'wraspati';
  if (lower === 'budha') return 'buda';
  if (lower === 'keliwon') return 'kliwon';
  return lower;
};

/**
 * Bobot prioritas kategori pura untuk penentuan urutan nama pura terkemuka:
 * Kahyangan Jagat / Sad Kahyangan (1) > Dang Kahyangan (2) > Kahyangan Tiga (3) > Swagina (4) > Kawitan (5) > Lainnya (6).
 */
export const getPuraPriorityScore = (type?: string | null): number => {
  const t = (type || '').toLowerCase();
  if (t.includes('kahyangan jagat') || t.includes('sad kahyangan')) return 1;
  if (t.includes('dang kahyangan')) return 2;
  if (t.includes('kahyangan tiga')) return 3;
  if (t.includes('swagina')) return 4;
  if (t.includes('kawitan')) return 5;
  return 6;
};

/**
 * Mencocokkan daftar pura yang melangsungkan piodalan pada suatu hari kalender tertentu.
 * Menggunakan aturan Pawukon (210 hari) dan Sasih (Candra) dengan toleransi variasi ejaan.
 */
export function matchPurasForDay(
  day: KalenderHarian,
  purasList: PuraBackendItem[]
): PuraBackendItem[] {
  if (!day || !Array.isArray(purasList) || purasList.length === 0) return [];

  const dWuku = normalizeCalendarString(day.wewaran?.wuku?.nama);
  const dSapta = normalizeCalendarString(day.wewaran?.saptawara?.nama);
  const dPanca = normalizeCalendarString(day.wewaran?.pancawara?.nama);
  const dSasih = normalizeCalendarString(day.sasih?.nama_sasih);
  const dPT = normalizeCalendarString(day.pengalantaka?.purnama_tilem);

  const matched: PuraBackendItem[] = [];

  for (const p of purasList) {
    const bench = (p.benchmark || '').toLowerCase();

    // 1. Berbasis Pawukon (siklus 210 hari)
    const hasPawukon = Boolean(p.wuku || p.saptawara || p.pancawara);
    const hasSasih = Boolean(p.sasih || p.purnama_tilem);
    if (hasPawukon && (!bench.includes('sasih') || !hasSasih)) {
      const pWuku = normalizeCalendarString(p.wuku);
      const pSapta = normalizeCalendarString(p.saptawara);
      const pPanca = normalizeCalendarString(p.pancawara);
      if ((!pWuku || pWuku === dWuku) && (!pSapta || pSapta === dSapta) && (!pPanca || pPanca === dPanca)) {
        matched.push(p);
        continue;
      }
    }

    // 2. Berbasis Sasih (Candra)
    if (hasSasih && (!hasPawukon || bench.includes('sasih'))) {
      const pSasih = normalizeCalendarString(p.sasih);
      const pPT = normalizeCalendarString(p.purnama_tilem);
      if ((!pSasih || pSasih === dSasih) && (!pPT || pPT === dPT)) {
        matched.push(p);
      }
    }
  }

  // Urutkan berdasarkan prioritas kesakralan pura terkemuka
  matched.sort((a, b) => {
    const prioA = getPuraPriorityScore(a.type);
    const prioB = getPuraPriorityScore(b.type);
    if (prioA !== prioB) return prioA - prioB;
    return a.name.localeCompare(b.name, 'id');
  });

  return matched;
}

/**
 * Mengekstrak ringkasan agenda piodalan seluruh pura dalam satu bulan kalender aktif.
 * Mengembalikan total pura yang melangsungkan upacara pada bulan tersebut dan hingga 3 piodalan terdekat.
 *
 * Aturan Piodalan Terdekat:
 * 1. Hanya menampilkan piodalan yang belum lewat dari hari ini (dateStr >= todayISO).
 * 2. Menampung hingga 3 agenda piodalan terdekat.
 * 3. Jika sisa agenda piodalan di bulan aktif kurang dari 3, dapat mengambil piodalan terdekat
 *    dari bulan berikutnya (lookahead) dengan indikator nama bulan, selama tidak lewat dari hari ini.
 */
export function extractMonthPiodalanSummary(
  monthDays: KalenderHarian[],
  purasList: PuraBackendItem[],
  todayISO?: string,
  allYearDays?: KalenderHarian[]
): {
  totalPuras: number;
  upcomingItems: PiodalanTerdekatItem[];
} {
  if (
    !Array.isArray(monthDays) ||
    monthDays.length === 0 ||
    !Array.isArray(purasList) ||
    purasList.length === 0
  ) {
    return { totalPuras: 0, upcomingItems: [] };
  }

  const monthShortNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  // Helper untuk merangkai wukuTitle
  const getDayWukuTitle = (day: KalenderHarian): string => {
    if (day.wewaran?.saptawara?.nama && day.wewaran?.pancawara?.nama && day.wewaran?.wuku?.nama) {
      return `${day.wewaran.saptawara.nama} ${day.wewaran.pancawara.nama} ${day.wewaran.wuku.nama}`;
    }
    if (day.hari_raya && day.hari_raya.length > 0) {
      return day.hari_raya[0].nama;
    }
    return day.sasih?.nama_sasih ? `Sasih ${day.sasih.nama_sasih}` : 'Piodalan Pura';
  };

  // 1. Akumulasi total lokasi piodalan pada bulan aktif ini
  let totalPuras = 0;
  const daysWithPiodalanInCurrentMonth: {
    dateStr: string;
    dayNum: string;
    wukuTitle: string;
    count: number;
  }[] = [];

  for (const day of monthDays) {
    const matched = matchPurasForDay(day, purasList);
    if (matched.length > 0) {
      totalPuras += matched.length;
      const dayNum = day.tanggal.split('-')[2] || '01';

      daysWithPiodalanInCurrentMonth.push({
        dateStr: day.tanggal,
        dayNum,
        wukuTitle: getDayWukuTitle(day),
        count: matched.length,
      });
    }
  }

  // 2. Ambil piodalan terdekat di bulan aktif yang BELUM LEWAT (dateStr >= todayISO)
  const upcomingItems: PiodalanTerdekatItem[] = [];
  const currentMonthNum = monthDays[0]?.tanggal
    ? parseInt(monthDays[0].tanggal.split('-')[1], 10)
    : 1;

  const eligibleInCurrentMonth = todayISO
    ? daysWithPiodalanInCurrentMonth.filter((d) => d.dateStr >= todayISO)
    : daysWithPiodalanInCurrentMonth;

  for (const d of eligibleInCurrentMonth) {
    if (upcomingItems.length < 3) {
      upcomingItems.push({
        id: `up-${d.dateStr}`,
        dayNumber: d.dayNum,
        wukuTitle: d.wukuTitle,
        puraCountText: `${d.count} pura`,
        dateStr: d.dateStr,
      });
    }
  }

  // 3. Jika slot kartu (maks 3) belum penuh dan terdapat data hari-hari berikutnya (lookahead ke bulan depan):
  // Tambahkan piodalan terdekat dari bulan-bulan mendatang selama dateStr >= todayISO
  if (upcomingItems.length < 3 && Array.isArray(allYearDays) && allYearDays.length > 0) {
    const lastDayCurrentMonth = monthDays[monthDays.length - 1]?.tanggal || '';

    // Ambil hari-hari setelah bulan aktif ini yang juga >= todayISO
    const subsequentDays = allYearDays
      .filter((day) => day.tanggal > lastDayCurrentMonth && (!todayISO || day.tanggal >= todayISO))
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    for (const day of subsequentDays) {
      if (upcomingItems.length >= 3) break;

      const matched = matchPurasForDay(day, purasList);
      if (matched.length > 0) {
        const dayNum = day.tanggal.split('-')[2] || '01';
        const dayMonthNum = parseInt(day.tanggal.split('-')[1], 10);
        const monthLabel = monthShortNames[dayMonthNum - 1] || '';
        const monthSuffix = dayMonthNum !== currentMonthNum ? ` · ${monthLabel}` : '';

        upcomingItems.push({
          id: `up-${day.tanggal}`,
          dayNumber: dayNum,
          wukuTitle: getDayWukuTitle(day),
          puraCountText: `${matched.length} pura${monthSuffix}`,
          dateStr: day.tanggal,
        });
      }
    }
  }

  return { totalPuras, upcomingItems };
}

// ---------------------------------------------------------------------------
// 8. Generator Rangkuman Sintesis Padewasan (Dianjurkan vs Pantangan)
// ---------------------------------------------------------------------------

export interface PadewasanSummary {
  dianjurkan: string;
  pantangan: string | null;
}

const PADEWASAN_DOMAIN_RULES = [
  // Prioritas Utama: Pantangan Yadnya & Larangan Kritis
  {
    type: 'pantangan' as const,
    label: 'Manusa Yadnya (wiwaha, potong rambut, mapendes)',
    pattern: /manusa yadnya|wiwaha|mapendes|potong rambut/i,
  },
  {
    type: 'pantangan' as const,
    label: 'Pitra Yadnya (ngaben, atiwa-tiwa, nyekah)',
    pattern: /pitra yadnya|ngaben|penguburan|atiwa-tiwa|nyekah/i,
  },
  {
    type: 'pantangan' as const,
    label: 'mengatapi rumah atau melaspas',
    pattern: /mengatapi rumah|melaspas|atap rumah/i,
  },
  {
    type: 'pantangan' as const,
    label: 'bepergian jauh atau urusan penting',
    pattern: /bepergian|pekerjaan penting bepergian/i,
  },
  {
    type: 'pantangan' as const,
    label: 'membangun atau memasuki rumah baru',
    pattern: /membangun rumah|memasuki rumah baru|pindah rumah/i,
  },
  {
    type: 'pantangan' as const,
    label: 'upacara keagamaan tertentu',
    pattern: /semua upacara|dewasa ayu/i,
  },
  {
    type: 'pantangan' as const,
    label: 'bercocok tanam tertentu',
    pattern: /bercocok tanam|menanam padi/i,
  },

  // Prioritas Utama: Dianjurkan / Favorable
  {
    type: 'baik' as const,
    label: 'upacara Dewa Yadnya dan peribadatan',
    pattern: /dewa yadnya|ibadah|tempat suci|pemujaan|merajan|sanggah|pura/i,
  },
  {
    type: 'baik' as const,
    label: 'pernikahan dan upacara perkawinan',
    pattern: /perkawinan|nikah|pernikahan|wiwaha/i,
  },
  {
    type: 'baik' as const,
    label: 'memulai usaha dan perniagaan',
    pattern: /usaha|perusahaan|dagang|berjualan|rejeki/i,
  },
  {
    type: 'baik' as const,
    label: 'membangun rumah dan sarana fisik',
    pattern: /membangun rumah|pindah rumah|bikin rumah|membuat lumbung|dapur/i,
  },
  {
    type: 'baik' as const,
    label: 'bercocok tanam dan pertanian',
    pattern: /bercocok tanam|tanam|padi|bibit|kebun|sawah|biji/i,
  },
  {
    type: 'baik' as const,
    label: 'kegiatan Panca Yadnya',
    pattern: /panca yadnya|segala jenis upacara|upacara yadnya/i,
  },
  {
    type: 'baik' as const,
    label: 'tapa brata, yoga, dan penyucian diri',
    pattern: /tapa|brata|yoga|semadi|bersuci|penyucian/i,
  },
  {
    type: 'baik' as const,
    label: 'membuat perlengkapan dan alat kerja',
    pattern: /membuat alat|kerajinan|senjata|bata|genteng|meramu obat/i,
  },
];

/**
 * Menyintesis seluruh unsur padewasan harian menjadi rangkuman seimbang:
 *  - Dianjurkan: Kumpulan aktivitas berwatak baik/ayu yang selaras pada hari tersebut.
 *  - Pantangan: Kumpulan larangan penting/pantangan yang harus dihindari.
 */
export function getPadewasanSummary(
  items?: { nama: string; keterangan?: string }[]
): PadewasanSummary {
  if (!items || items.length === 0) {
    return {
      dianjurkan: 'Tidak ada petunjuk khusus pada tanggal ini.',
      pantangan: null,
    };
  }

  const baikDetected = new Set<string>();
  const pantanganDetected = new Set<string>();
  const rawBaikFallback: string[] = [];
  const rawPantanganFallback: string[] = [];

  // 1. Pindai aturan terstruktur berdasarkan urutan prioritas budaya
  for (const rule of PADEWASAN_DOMAIN_RULES) {
    for (const it of items) {
      const text = it.keterangan || '';
      const sentences = text.split(/(?<=[.;])\s+/);

      for (const raw of sentences) {
        const s = raw.trim();
        if (!s) continue;

        const isNeg = /tidak baik|kurang baik|pantangan|hindari|jangan/i.test(s);
        if (rule.type === 'pantangan' && isNeg && rule.pattern.test(s)) {
          pantanganDetected.add(rule.label);
        } else if (rule.type === 'baik' && !isNeg && /baik/i.test(s) && rule.pattern.test(s)) {
          baikDetected.add(rule.label);
        }
      }
    }
  }

  // 2. Kumpulkan kalimat fallback jika aturan domain tidak mencakup kriteria unik
  for (const it of items) {
    const text = it.keterangan || '';
    const sentences = text.split(/(?<=[.;])\s+/);

    for (const raw of sentences) {
      const s = raw.trim();
      if (!s) continue;

      const isNeg = /tidak baik|kurang baik|pantangan|hindari|jangan/i.test(s);
      let matched = false;

      for (const rule of PADEWASAN_DOMAIN_RULES) {
        if ((rule.type === 'pantangan' && isNeg && rule.pattern.test(s)) ||
            (rule.type === 'baik' && !isNeg && /baik/i.test(s) && rule.pattern.test(s))) {
          matched = true;
          break;
        }
      }

      if (!matched) {
        if (isNeg) {
          const clean = s
            .replace(/^bersifat\s+[^,]+,?\s*/i, '')
            .replace(/^(terutama\s+)?tidak baik\s+(untuk\s+|melakukan\s+)?/i, '')
            .replace(/^kurang baik\s+(untuk\s+)?/i, '')
            .replace(/[.;]+$/, '')
            .trim();
          if (clean.length > 3) rawPantanganFallback.push(clean);
        } else if (/baik/i.test(s)) {
          const clean = s
            .replace(/^baik\s+(untuk\s+|melakukan\s+|membuat\s+)?/i, '')
            .replace(/[.;]+$/, '')
            .trim();
          if (clean.length > 3) rawBaikFallback.push(clean);
        }
      }
    }
  }

  // Lengkapi dengan fallback jika deteksi kategori masih di bawah ambang batas
  for (const fb of rawBaikFallback) {
    if (baikDetected.size >= 3) break;
    baikDetected.add(fb);
  }

  for (const fb of rawPantanganFallback) {
    if (pantanganDetected.size >= 3) break;
    pantanganDetected.add(fb);
  }

  const formatList = (set: Set<string>, max = 3): string | null => {
    const list = Array.from(set).slice(0, max);
    if (list.length === 0) return null;
    if (list.length === 1) {
      const item = list[0].replace(/[.;]+$/, '').trim();
      return item.charAt(0).toUpperCase() + item.slice(1) + '.';
    }
    if (list.length === 2) {
      const first = list[0].replace(/[.;]+$/, '').trim();
      const second = list[1].replace(/[.;]+$/, '').trim();
      return first.charAt(0).toUpperCase() + first.slice(1) + ' serta ' + second + '.';
    }
    const last = list.pop()!.replace(/[.;]+$/, '').trim();
    return (
      list.map((t, idx) => {
        const clean = t.replace(/[.;]+$/, '').trim();
        return idx === 0 ? clean.charAt(0).toUpperCase() + clean.slice(1) : clean;
      }).join(', ') +
      ', serta ' +
      last +
      '.'
    );
  };

  return {
    dianjurkan: formatList(baikDetected, 3) || 'Melakukan aktivitas sehari-hari yang wajar.',
    pantangan: formatList(pantanganDetected, 3),
  };
}
