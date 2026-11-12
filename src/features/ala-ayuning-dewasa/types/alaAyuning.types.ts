import type { DewasaDateStatus, DewasaMatchedReason } from '@/features/mengatur-dewasa/types/mengaturDewasa.types';

/**
 * ============================================================================
 * KONTRAK TIPE DATA: ALA AYUNING DEWASA (PADEWASAN KALENDER BALI)
 * ============================================================================
 * Berkas ini mendefinisikan seluruh antarmuka (interface), tipe masukan (request),
 * tipe keluaran (response), amplop API standar, dan metadata semantik untuk
 * fitur Ala Ayuning Dewasa pada frontend React.
 *
 * Prinsip Desain:
 *  1. Presisi Keamanan Angka: Seluruh ID padewasan diserialisasi dan ditangani
 *     sebagai `string` (mencegah pembulatan IEEE-754 53-bit JavaScript).
 *  2. 100% Sesuai Kontrak Backend Go: Mengacu langsung ke DTO domain Go
 *     (`backend-go/kalenderbali-be/internal/domain/ala_ayuning.go`).
 *  3. Dokumentasi Menyeluruh: Setiap blok kode dilengkapi komentar penjelasan
 *     fungsionalitas untuk kemudahan pemeliharaan sistem.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BLOK 1: ENTITAS INTI PADEWASAN (HARI BAIK & BURUK)
// ----------------------------------------------------------------------------

/**
 * PadewasanItem merepresentasikan satu kriteria padewasan (Ala Ayuning Dewasa)
 * yang bersumber dari tabel resmi `calendar_reference_values` (reference_type_id = 2)
 * dan `auspicious_day_details`.
 */
export interface PadewasanItem {
  /** ID unik padewasan (string 1..220) */
  id: string;

  /** Nama kriteria padewasan (misal: "Agni Agung Doyan Basmi", "Amerta Danta") */
  nama: string;

  /** Makna budaya, anjuran yadnya, atau pantangan pekerjaan berdasarkan sastra lontar */
  keterangan?: string;

  /**
   * Tingkat keparahan / kekuatan pembatalan hari (Alahing Dewasa):
   * - "1": Alahing Sasih (kekuatan tertinggi, tak terbatalkan wuku/wara)
   * - "2": Alahing Penanggal/Pangelong
   * - "3": Alahing Dauh
   * - "4": Alahing Wuku/Wara
   */
  severity_code?: string;
}

/**
 * PadewasanHarian merangkum seluruh daftar padewasan yang aktif pada satu hari tertentu.
 */
export interface PadewasanHarian {
  /** Format tanggal Masehi kanonik "YYYY-MM-DD" pada zona waktu WITA */
  tanggal: string;

  /** Daftar seluruh kriteria padewasan yang aktif pada tanggal tersebut */
  padewasan: PadewasanItem[];

  /** Jumlah total kriteria padewasan aktif */
  total: number;
}

// ----------------------------------------------------------------------------
// BLOK 2: REQUEST & RESPONSE DTO (PENCARIAN RENTANG & PENCARIAN NAMA)
// ----------------------------------------------------------------------------

/**
 * CariAlaAyuningRequest adalah parameter masukan pencarian rentang tanggal harian.
 */
export interface CariAlaAyuningRequest {
  /** Batas awal tanggal pencarian "YYYY-MM-DD" (Wajib) */
  tanggal_mulai: string;

  /** Batas akhir tanggal pencarian "YYYY-MM-DD" (Wajib) */
  tanggal_selesai: string;

  /** Flag penanda apakah deskripsi lengkap & severity_code perlu disertakan (default: true) */
  beserta_keterangan?: boolean;
}

/**
 * CariByNamaRequest adalah parameter masukan pencarian tanggal jatuh berdasarkan nama padewasan.
 */
export interface CariByNamaRequest {
  /** Nama padewasan yang dicari (contoh: "Agni Agung Doyan Basmi", "Amerta Danta") */
  nama: string;

  /** Angka bulan Masehi 1 s.d. 12 */
  bulan: number;

  /** Angka tahun Masehi 4 digit (misal: 2026) */
  tahun: number;
}

/**
 * CariByNamaResponse merangkum hasil pencarian tanggal jatuh padewasan tertentu dalam satu bulan.
 */
export interface CariByNamaResponse {
  /** ID padewasan yang dicari */
  id: string;

  /** Nama padewasan */
  nama: string;

  /** Uraian makna dan peruntukan budaya */
  keterangan: string;

  /** Kode keparahan alahing dewasa ("1".."4") */
  severity_code: string;

  /** Bulan yang dievaluasi (1..12) */
  bulan: number;

  /** Tahun yang dievaluasi */
  tahun: number;

  /** Daftar tanggal dalam format "YYYY-MM-DD" di mana padewasan ini aktif */
  tanggal_jatuh: string[];

  /** Jumlah hari di mana padewasan ini jatuh */
  total_hari: number;
}

export interface DewasaActivityGuidance {
  activity_id: string;
  activity_name: string;
  status: DewasaDateStatus;
  matched_recommended: DewasaMatchedReason[];
  matched_avoid: DewasaMatchedReason[];
}

/** Petunjuk harian berdasarkan aturan kegiatan, beserta anjuran dan pantangannya. */
export interface DewasaAyuTodayResponse {
  /** Tanggal hari ini "YYYY-MM-DD" (WITA) */
  tanggal: string;

  /** Status ringkasan; penilaian spesifik tersedia di activity_guidance. */
  status_label: string;

  /** Narasi petunjuk padewasan hari ini */
  headline: string;
  activity_guidance?: DewasaActivityGuidance[];

  /** 3 padewasan terbaik berwatak positif (ayu) hari ini */
  items: PadewasanItem[];

  /** Total padewasan aktif hari ini */
  total: number;
}

// ----------------------------------------------------------------------------
// BLOK 3: AMPLOP STANDAR API BACKEND GO {data, meta, error}
// ----------------------------------------------------------------------------

/**
 * AlaAyuningAPIEnvelope adalah pembungkus respons JSON resmi dari server Go.
 */
export interface AlaAyuningAPIEnvelope<T> {
  data: T;
  meta?: {
    total?: number;
    total_hari?: number;
    data_version?: string;
    execution_time_ms?: number;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
  } | null;
}

// ----------------------------------------------------------------------------
// BLOK 4: TIPE DATA BANTUAN UI & INTEGRASI PAWUKON
// ----------------------------------------------------------------------------

/**
 * Mode pencarian antarmuka pengguna:
 * - 'date': Memeriksa seluruh padewasan pada tanggal tertentu (default).
 * - 'name': Mencari tanggal jatuh padewasan spesifik di suatu bulan/tahun (Paritas Laravel).
 */
export type AlaAyuningSearchMode = 'date' | 'name';

/**
 * PawukonHarianInfo merangkum 4 pilar penanggalan Bali harian untuk kartu informasi kanan.
 */
export interface PawukonHarianInfo {
  tanggal: string;
  hariMasehi: string;
  hariBali: string;
  sasih: string;
  wuku: string;
  pancawara: string;
  saptawara: string;
  urip: number;
}

/**
 * Metadata Alahing Dewasa untuk pewarnaan badge semantik yang konsisten.
 */
export interface AlahingDewasaMeta {
  level: string;
  label: string;
  badgeStyle: string;
  borderStyle: string;
  textStyle: string;
  keterangan: string;
}

/**
 * getAlahingDewasaMeta mengembalikan konfigurasi visual badge berdasarkan severity_code resmi.
 */
export function getAlahingDewasaMeta(severityCode?: string): AlahingDewasaMeta {
  switch (severityCode) {
    case '1':
      return {
        level: 'Tingkat 1',
        label: 'Alahing Sasih',
        badgeStyle: 'bg-rose-50 text-rose-800 border-rose-200',
        borderStyle: 'border-rose-200',
        textStyle: 'text-rose-700',
        keterangan: 'Kekuatan larangan/anjuran tertinggi; tidak dapat dibatalkan oleh Wuku atau Wewaran.',
      };
    case '2':
      return {
        level: 'Tingkat 2',
        label: 'Alahing Penanggal',
        badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200',
        borderStyle: 'border-amber-200',
        textStyle: 'text-amber-700',
        keterangan: 'Ditentukan oleh posisi tithi/fase bulan; mengalahkan pengaruh Wuku dan Wara.',
      };
    case '3':
      return {
        level: 'Tingkat 3',
        label: 'Alahing Dauh',
        badgeStyle: 'bg-teal-50 text-teal-800 border-teal-200',
        borderStyle: 'border-teal-200',
        textStyle: 'text-teal-700',
        keterangan: 'Dipengaruhi oleh waktu pelaksanaan (dauh) dalam sehari.',
      };
    case '4':
    default:
      return {
        level: 'Tingkat 4',
        label: 'Alahing Wuku/Wara',
        badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
        borderStyle: 'border-slate-200',
        textStyle: 'text-slate-600',
        keterangan: 'Ditentukan oleh perjumpaan siklus mingguan (Pawukon dan Pasaran).',
      };
  }
}

