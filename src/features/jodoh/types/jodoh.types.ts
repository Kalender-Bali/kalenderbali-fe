/**
 * ============================================================================
 * KONTRAK DATA & TIPE TYPESCRIPT: RAMALAN JODOH (PAL SRI SEDANA)
 * ============================================================================
 * Berkas ini mendefinisikan tipe data TypeScript untuk fitur Ramalan Jodoh.
 *
 * Karakteristik & Keselarasan Kontrak:
 *  1. 100% Selaras dengan Backend Go (`kalenderbali-be/internal/domain/jodoh.go`).
 *  2. Semua properti menggunakan snake_case pada transport JSON sesuai payload API.
 *  3. Menyediakan tipe DTO Permintaan (Request), Respon (Response), Status Kategori,
 *     dan Parameter URL untuk sinkronisasi state peramban (URL-as-State).
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BLOK 1: STATUS KATEGORI & KESIMPULAN KECOCOKAN
// ----------------------------------------------------------------------------

/**
 * Kode status kategorisasi hasil perhitungan kecocokan perjodohan dari server Go.
 *  - SANGAT_BERJODOH : Skor >= 80% (Tingkat keselarasan sangat tinggi)
 *  - BERJODOH        : Skor >= 60% s.d. < 80% (Hubungan harmonis dan saling melengkapi)
 *  - KURANG_BERJODOH : Skor >= 30% s.d. < 60% (Cukup seimbang, butuh penyesuaian)
 *  - TIDAK_BERJODOH  : Skor < 30% (Potensi perbedaan karakter cukup besar)
 */
export type JodohStatusCode =
  | 'SANGAT_BERJODOH'
  | 'BERJODOH'
  | 'KURANG_BERJODOH'
  | 'TIDAK_BERJODOH';

/**
 * Label bahasa Indonesia yang ramah pengguna untuk status kesimpulan.
 */
export type JodohStatusLabel =
  | 'Sangat Berjodoh'
  | 'Berjodoh'
  | 'Kurang Berjodoh'
  | 'Tidak Berjodoh';

// ----------------------------------------------------------------------------
// BLOK 2: DTO PERMINTAAN (REQUEST PAYLOAD)
// ----------------------------------------------------------------------------

/**
 * Data masukan untuk satu pihak (Diri Anda atau Pasangan).
 */
export interface JodohPersonInput {
  /**
   * Nama lengkap pihak bersangkutan (opsional, sebagai label identitas).
   * Maksimal 100 karakter. Jika dikosongkan, server otomatis mengisi "Anda" / "Pasangan".
   */
  nama?: string;

  /**
   * Tanggal lahir masehi dalam format YYYY-MM-DD (wajib diisi).
   * Contoh: "2000-01-01"
   */
  tanggal_lahir: string;
}

/**
 * Payload permintaan HTTP POST yang dikirimkan ke endpoint `/api/v1/search/jodoh`.
 */
export interface JodohRequest {
  /** Data pihak pertama (Diri Anda) */
  diri: JodohPersonInput;

  /** Data pihak kedua (Pasangan) */
  pasangan: JodohPersonInput;
}

// ----------------------------------------------------------------------------
// BLOK 3: MODEL ENTITAS HASIL ASTROLOGIS (PERSON RESULT)
// ----------------------------------------------------------------------------

/**
 * Rincian astrologis penanggalan Bali untuk satu individu yang dihitung oleh server Go.
 */
export interface JodohPersonResult {
  /** Nama pihak (setelah dinormalisasi dengan default fallback jika kosong) */
  nama: string;

  /** Tanggal lahir dalam format YYYY-MM-DD */
  tanggal_lahir: string;

  /** Nama siklus 7 hari (Redite s/d Saniscara) */
  saptawara: string;

  /** Nama siklus 5 hari (Umanis s/d Kliwon) */
  pancawara: string;

  /** Nama siklus 6 hari (Tungleh s/d Maulu) */
  sadwara: string;

  /** Ringkasan weton kelahiran, gabungan Saptawara + Pancawara (contoh: "Saniscara Umanis") */
  weton: string;

  /** Jumlah nilai urip Saptawara dan Pancawara (rentang 7 s.d. 18) */
  neptu: number;

  /** Nilai urip siklus Sadwara (Tungleh=7, Aryang=6, Urukung=5, Paniron=8, Was=9, Maulu=3) */
  urip_sadwara: number;
}

// ----------------------------------------------------------------------------
// BLOK 4: MODEL ENTITAS METODE PETENUNGAN (PAL SRI SEDANA)
// ----------------------------------------------------------------------------

/**
 * Hasil evaluasi untuk satu metode petenungan tertentu.
 * Digunakan pada:
 *  1. Tenung Jatukarma (Siklus 5 - Pangan & Keharmonisan)
 *  2. Tenung Urip Catur (Siklus 4 - Keturunan / Sentana & Rezeki)
 *  3. Tenung Urip Panca (Siklus 5 - Kedudukan & Martabat)
 *  4. Tenung Tripramana (Siklus 16 - Rezeki & Ketenangan)
 */
export interface PetenunganItem {
  /** Nama metode petenungan (contoh: "Tenung Jatukarma") */
  nama_tenung: string;

  /**
   * Sisa hasil pembagian modulo matematis (sisa 0 dibaca sebagai angka pembagi penuh).
   * Contoh: sisa 0 pada pembagi 5 dibaca 5.
   */
  sisa: number;

  /** Nama arketipe hasil perhitungan (contoh: "Gedong", "Sri", "Peta", "Punggel") */
  nama_hasil: string;

  /** Deskripsi arti/makna tradisional dari arketipe hasil tersebut */
  keterangan: string;

  /** Nilai numerik terstandarisasi untuk metode ini (rentang 0 s.d. 100) */
  nilai: number;
}

/**
 * Metadata konteks perhitungan yang dikembalikan oleh backend Go.
 */
export interface JodohMeta {
  /** Zona waktu perhitungan kanonik (selalu "Asia/Makassar" / WITA) */
  timezone: string;

  /** Tanggal acuan eksekusi di server (YYYY-MM-DD) */
  tanggal_acuan: string;

  /** Versi aturan perhitungan tenung Pal Sri Sedana (contoh: "jodoh-1.0.0") */
  rule_version: string;

  /** Waktu pergantian hari kalender adat Bali (06:00 WITA) */
  waktu_pergantian_hari: string;
}

// ----------------------------------------------------------------------------
// BLOK 5: DTO RESPON LENGKAP DARI SERVER GO
// ----------------------------------------------------------------------------

/**
 * Objek data utama hasil ramalan perjodohan dari server Go.
 */
export interface JodohData {
  /** Profil astrologis pihak Diri */
  diri: JodohPersonResult;

  /** Profil astrologis pihak Pasangan */
  pasangan: JodohPersonResult;

  /** Hasil metode 1: Tenung Jatukarma (Siklus 5) */
  jatukarma: PetenunganItem;

  /** Hasil metode 2: Tenung Urip Catur (Siklus 4) */
  urip_catur: PetenunganItem;

  /** Hasil metode 3: Tenung Urip Panca (Siklus 5) */
  urip_panca: PetenunganItem;

  /** Hasil metode 4: Tenung Tripramana (Siklus 16) */
  tripramana: PetenunganItem;

  /**
   * Koleksi 4 metode tenung dalam bentuk array untuk mempermudah perulangan (.map)
   * pada komponen antarmuka React.
   */
  daftar_tenung: PetenunganItem[];

  /** Skor akhir rata-rata dari ke-4 metode (rentang 0.0 s.d. 100.0) */
  skor_akhir: number;

  /** Kode status mesin kecocokan untuk styling dinamis */
  status_code: JodohStatusCode;

  /** Label kesimpulan berbahasa Indonesia untuk ditampilkan ke pengguna */
  kesimpulan: string;

  /** Pesan etika budaya dan filosofis wariga dari server */
  catatan_budaya: string;

  /** Metadata aturan dan zona waktu */
  meta: JodohMeta;
}

/**
 * Pembungkus envelope standar respons JSON dari Backend Go:
 * `{ "data": ..., "meta": ..., "error": null }`
 */
export interface JodohAPIEnvelope {
  data: JodohData;
  meta: Record<string, unknown>;
  error: {
    code: string;
    message: string;
    field?: string;
  } | null;
}

// ----------------------------------------------------------------------------
// BLOK 6: TIPE STATE LOKAL FORM & SINKRONISASI URL (URL-AS-STATE)
// ----------------------------------------------------------------------------

/**
 * Struktur data internal form input pada antarmuka pengguna.
 */
export interface JodohFormData {
  namaDiri: string;
  tanggalLahirDiri: string;
  namaPasangan: string;
  tanggalLahirPasangan: string;
}

/**
 * Parameter query URL yang disinkronisasikan ke peramban:
 * `?nama_diri=Made&tgl_diri=1998-05-12&nama_pasangan=Ayu&tgl_pasangan=1999-08-20`
 */
export interface JodohSearchParams {
  nama_diri?: string;
  tgl_diri: string;
  nama_pasangan?: string;
  tgl_pasangan: string;
}

