/**
 * ============================================================================
 * KONTRAK DATA & TIPE TYPESCRIPT: GARIS HIDUP (PAL SRI SEDANA)
 * ============================================================================
 * Berkas ini menetapkan seluruh tipe data, antarmuka (interfaces), dan kontrak API
 * untuk fitur ramalan Garis Hidup (Pal Sri Sedana siklus 6-tahunan).
 *
 * Selaras dengan:
 *  1. Domain Backend Go: `kalenderbali-be/internal/domain/garis_hidup.go`
 *  2. HTTP Handler Envelope: `kalenderbali-be/internal/delivery/http/handler/garis_hidup_handler.go`
 *  3. Pedoman Arsitektur: `fe_strategy.md` & `frontend-reactjs/AGENTS.md`
 * ============================================================================
 */

// ============================================================================
// BLOK 1: MODEL PERIODE SIKLUS (PAL SRI SEDANA 6-TAHUNAN)
// ============================================================================

/**
 * GarisHidupPeriod merepresentasikan satu kolom rentang usia pada tabel Pal Sri Sedana.
 * Terdapat 18 periode usia inklusif: 0–6 tahun, 7–12 tahun, ..., hingga 103–108 tahun.
 */
export interface GarisHidupPeriod {
  /** Batas bawah rentang usia dalam tahun penuh (misal: 0, 7, 13, 19, 25) */
  min_umur: number;

  /** Batas atas rentang usia dalam tahun penuh (misal: 6, 12, 18, 24, 30) */
  max_umur: number;

  /** Nilai potensi rezeki/keberuntungan pada skala angka 0 sampai 9 */
  nilai: number;

  /** Tafsir makna tradisional (misal: "kesakitan (penderitaan)", "penghasilan sedikit", "baik sekali") */
  keterangan: string;
}

// ============================================================================
// BLOK 2: MODEL HASIL ANALISIS SATU PESERTA
// ============================================================================

/**
 * GarisHidupProfileResult memuat hasil komputasi lengkap untuk satu profil peserta.
 * Dihasilkan secara independen oleh Backend Go berdasarkan tanggal lahir yang diuji.
 */
export interface GarisHidupProfileResult {
  /** Nama pengenal profil (default: "Anda" untuk peserta tunggal, atau "Profil N" untuk multi-peserta) */
  nama: string;

  /** Tanggal lahir sipil Masehi dalam format ISO YYYY-MM-DD */
  tanggal_lahir: string;

  /** Usia peserta dalam tahun penuh berdasarkan ulang tahun terakhir pada tanggal acuan WITA */
  umur: number;

  /** Nama hari dalam siklus Saptawara (Redite s/d Saniscara) */
  saptawara: string;

  /** Nama pasaran dalam siklus Pancawara (Umanis s/d Kliwon) */
  pancawara: string;

  /** Penjumlahan urip Saptawara dan Pancawara kelahiran (rentang 7 s/d 18) */
  urip: number;

  /** Periode siklus 6-tahunan yang sedang aktif dialami peserta saat ini */
  periode_saat_ini: GarisHidupPeriod;

  /** Periode siklus 6-tahunan sebelumnya (bernilai null jika usia peserta masih 0–6 tahun) */
  periode_lalu: GarisHidupPeriod | null;

  /** Periode siklus 6-tahunan mendatang (bernilai null jika usia peserta sudah melampaui 108 tahun) */
  periode_depan: GarisHidupPeriod | null;

  /** Seluruh 18 siklus kehidupan dari usia 0 sampai 108 tahun dalam urutan menaik */
  seluruh_periode: GarisHidupPeriod[];

  /** Penanda khusus jika umur peserta telah melampaui batas akhir tabel lontar (> 108 tahun) */
  melewati_batas_tabel: boolean;
}

// ============================================================================
// BLOK 3: METADATA & ENVELOPE RESPONS HTTP (BACKEND GO)
// ============================================================================

/**
 * GarisHidupMeta memuat metadata server untuk menjamin reproduktibilitas hasil komputasi.
 */
export interface GarisHidupMeta {
  /** Zona waktu kanonik yang digunakan untuk penentuan tanggal hari ini (selalu "Asia/Makassar") */
  timezone: string;

  /** Tanggal sipil WITA saat request diproses oleh server dalam format YYYY-MM-DD */
  tanggal_acuan: string;

  /** Versi aturan perhitungan Garis Hidup di server (misal: "garis-hidup-1.0.0") */
  rule_version: string;

  /** Versi tabel data lontar Pal Sri Sedana yang aktif di server */
  table_version: string;

  /** Pengenal unik request HTTP untuk audit dan pelacakan */
  request_id?: string;
}

/**
 * GarisHidupResponseData adalah struktur pembungkus array hasil peserta.
 */
export interface GarisHidupResponseData {
  /** Daftar hasil analisis seluruh peserta terurut sesuai urutan input form */
  hasil: GarisHidupProfileResult[];
}

/**
 * GarisHidupAPIEnvelope adalah amplop respons standar JSON dari server Go:
 * { data, meta, error }
 */
export interface GarisHidupAPIEnvelope {
  data: GarisHidupResponseData | null;
  meta: GarisHidupMeta;
  error: {
    code: string;
    message: string;
  } | null;
}

// ============================================================================
// BLOK 4: MODEL REQUEST PAYLOAD KE SERVER GO
// ============================================================================

/**
 * GarisHidupParticipantRequest adalah DTO input untuk satu orang peserta.
 */
export interface GarisHidupParticipantRequest {
  /** Nama peserta (opsional, maks 100 karakter Unicode) */
  nama?: string;

  /** Tanggal lahir berformat ISO YYYY-MM-DD (wajib, tahun 1800 - 2200, tidak boleh di masa depan) */
  tanggal_lahir: string;
}

/**
 * GarisHidupRequest adalah body JSON yang dikirim ke endpoint POST /api/v1/search/garis-hidup.
 * Menerima minimal 1 dan maksimal 5 orang peserta sekaligus.
 */
export interface GarisHidupRequest {
  peserta: GarisHidupParticipantRequest[];
}

// ============================================================================
// BLOK 5: MODEL FORM STATE & UI TAMPILAN KLIEN (REACTJS)
// ============================================================================

/**
 * GarisHidupParticipantInput merepresentasikan satu entri form di sisi klien React.
 * Menyertakan ID unik sementara untuk kestabilan rendering list `key` di DOM.
 */
export interface GarisHidupParticipantInput {
  /** ID unik acak sementara di sisi klien (misal: "p-1711234567") */
  id: string;

  /** Masukan nama dari pengguna */
  nama: string;

  /** Masukan tanggal lahir format ISO YYYY-MM-DD untuk API backend */
  tanggal_lahir: string;
}

/**
 * Tipe tab aktif pada dialog modal panduan edukasi.
 */
export type GarisHidupGuideTab = 'panduan' | 'istilah' | 'simulasi';

/**
 * Kategori interpretasi nilai rezeki untuk penentuan warna semantik resmi:
 *  - 'perjuangan': Nilai 0 - 1 (Rose Crimson / Warning)
 *  - 'stabil': Nilai 2 - 4 (Teal Tirta / Amber Gold)
 *  - 'kejayaan': Nilai 5 - 9 (Emerald Green / Purple Success)
 */
export type GarisHidupScoreCategory = 'perjuangan' | 'stabil' | 'kejayaan';

