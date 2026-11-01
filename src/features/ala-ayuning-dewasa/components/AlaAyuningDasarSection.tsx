import React from 'react';
import { Layers, ChevronRight, CheckCircle2, AlertOctagon, Sparkles } from 'lucide-react';
import type { PadewasanItem } from '../types/alaAyuning.types';
import { getAlahingDewasaMeta } from '../types/alaAyuning.types';

/**
 * ============================================================================
 * KOMPONEN: AlaAyuningDasarSection (Dasar Ala Ayuning Dewasa - 100% Data Go)
 * ============================================================================
 * Komponen penyaji grid 2-kolom seluruh kriteria padewasan yang aktif pada hari
 * yang dipilih (sesuai Gambar 3 pada desain target baru):
 *  1. Header Section: Judul "Dasar Ala Ayuning Dewasa" dan badge jumlah unsur aktif.
 *  2. Grid Kartu Interaktif 2-Kolom:
 *     - Simbol status kultural:
 *       - Ikon centang hijau (Unsur berwatak baik/positif)
 *       - Ikon seru merah/amber (Unsur larangan/pantangan)
 *       - Ikon bantuan kontekstual (Unsur khusus pekerjaan tertentu)
 *     - Nama resmi kriteria Padewasan (contoh: "Carik Walangati", "Asuajeg Munggah").
 *     - Badge resmi Alahing Dewasa (Tingkat 1 Sasih, Tingkat 2 Penanggal, Tingkat 3 Dauh, Tingkat 4 Wuku).
 *     - Deskripsi makna budaya otentik yang bersumber dari tabel PostgreSQL
 *       `calendar_reference_values.description` (bukan buatan LLM).
 *  3. Interaktivitas: Mengklik kartu akan membuka modal pop-up telaah mendalam.
 *
 * Mengikuti Panduan AGENTS.md:
 *  - Wadah Card: bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs
 *  - Kartu Interaktif: hover:border-teal-500/40 hover:shadow-sm transition-all cursor-pointer active:scale-[0.99]
 * ============================================================================
 */

interface AlaAyuningDasarSectionProps {
  /** Seluruh daftar padewasan aktif pada tanggal yang sedang dilihat */
  padewasanList: PadewasanItem[];

  /** Handler ketika salah satu kartu padewasan diklik untuk telaah detail */
  onSelectPadewasan: (item: PadewasanItem) => void;
}

export const AlaAyuningDasarSection: React.FC<AlaAyuningDasarSectionProps> = ({
  padewasanList,
  onSelectPadewasan,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
      {/* ===================================================================== */}
      {/* BLOK 1: HEADER SECTION & BADGE TOTAL UNSUR AKTIF                      */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <span>Dasar Ala Ayuning Dewasa</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Kriteria tradisional hasil evaluasi 220 aturan Padewasan penanggalan Bali
          </p>
        </div>

        {/* Badge Jumlah Unsur Aktif */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-[#e6f7f5] text-teal-800 border border-teal-200/60 shadow-2xs self-start sm:self-auto">
          {padewasanList.length} UNSUR AKTIF
        </span>
      </div>

      {/* ===================================================================== */}
      {/* BLOK 2: GRID 2-KOLOM KARTU PADEWASAN (SESUAI GAMBAR 3)                */}
      {/* ===================================================================== */}
      {padewasanList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {padewasanList.map((item) => {
            const alahingMeta = getAlahingDewasaMeta(item.severity_code);
            const isLarangan =
              item.keterangan?.toLowerCase().includes('tidak baik') ||
              item.keterangan?.toLowerCase().includes('hindari');

            return (
              <div
                key={item.id}
                onClick={() => onSelectPadewasan(item)}
                className="group p-4 sm:p-4.5 rounded-xl border border-slate-200/80 bg-[#f8fafc]/50 hover:bg-white hover:border-teal-500/40 hover:shadow-xs transition-all cursor-pointer active:scale-[0.99] flex flex-col justify-between space-y-3"
              >
                {/* Header Kartu: Ikon Status, Nama Padewasan, & Badge Alahing */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    {/* Ikon Karakteristik Budaya */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        isLarangan
                          ? 'bg-rose-50 border-rose-200/70 text-rose-600'
                          : 'bg-emerald-50 border-emerald-200/70 text-emerald-600'
                      }`}
                    >
                      {isLarangan ? (
                        <AlertOctagon className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Nama Padewasan */}
                    <h4 className="text-sm font-extrabold text-[#0f172a] group-hover:text-teal-700 transition-colors">
                      {item.nama}
                    </h4>
                  </div>

                  {/* Badge Alahing Dewasa */}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${alahingMeta.badgeStyle}`}
                    title={alahingMeta.keterangan}
                  >
                    {alahingMeta.label}
                  </span>
                </div>

                {/* Deskripsi Makna Budaya Otentik */}
                <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
                  {item.keterangan || 'Tidak ada uraian pantangan atau anjuran khusus.'}
                </p>

                {/* Footer Kartu: Indikator Klik */}
                <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-teal-600 font-medium transition-colors">
                  <span>ID Sastra #{item.id}</span>
                  <span className="inline-flex items-center gap-0.5 font-bold">
                    <span>Rincian</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* State Kosong Jika Tidak Ada Padewasan Aktif */
        <div className="p-8 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-slate-400 mx-auto" />
          <h4 className="text-sm font-extrabold text-slate-700">
            Tidak Ada Unsur Padewasan Khusus
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Pada tanggal ini tidak ditemukan padewasan yang bersifat larangan keras maupun anjuran utama.
          </p>
        </div>
      )}
    </div>
  );
};
