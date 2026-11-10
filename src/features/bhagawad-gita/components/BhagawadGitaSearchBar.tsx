import type { FC } from 'react';
import { Search, Sparkles, FileText, X, Brain } from 'lucide-react';
import type { Topic } from '../types/bhagawadGita.types';

/**
 * ==============================================================================
 * KOMPONEN: BhagawadGitaSearchBar (Pusat Pencarian Multi-Mode)
 * ==============================================================================
 * Mengakomodasi 2 mode pencarian sesuai alur Android (Gambar 1, 2, 4, 5):
 *  1. Pencarian Teks Biasa: Filter cepat judul bab, nama topik, & terjemahan sloka.
 *  2. Pencarian Pintar (IR): Pencarian berbasis makna, rasa batin, & sinonim kata
 *     menggunakan algoritma Cosine Similarity di Backend Go.
 *
 * Fitur Tambahan Web UX:
 *  - Interactive Sample Keyword Pills pada panduan Pencarian Makna (IR) saat query kosong.
 *  - Horizontally scrollable topic filter chips saat mode Pintar aktif.
 *  - Tip navigasi instan nomor sloka (format "2:47").
 * ==============================================================================
 */

interface BhagawadGitaSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSemanticMode: boolean;
  onModeChange: (isSemantic: boolean) => void;
  selectedTopicId?: string;
  onTopicChange: (topicId?: string) => void;
  topics: Topic[];
}

export const BhagawadGitaSearchBar: FC<BhagawadGitaSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  isSemanticMode,
  onModeChange,
  selectedTopicId,
  onTopicChange,
  topics,
}) => {
  // Contoh kata kunci populer untuk memicu Pencarian Makna (IR) secara instan
  const sampleKeywords = [
    'kedamaian',
    'kesedihan',
    'kebimbangan',
    'kewajiban',
    'kemarahan',
    'senang',
    'kematian',
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-4">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. INPUT FIELD PENCARIAN UTAMA                                         */}
      {/* ---------------------------------------------------------------------- */}
      <div className="relative">
        {/* Ikon Pencarian Kiri */}
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>

        {/* Input Text Ergonomis (Tinggi 48px) */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            isSemanticMode
              ? 'Cari makna atau rasa...'
              : 'Cari bab...'
          }
          className="w-full h-12 pl-11 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0f172a] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
        />

        {/* Tombol Hapus Query (Clear) */}
        {searchQuery.trim().length > 0 && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Bersihkan pencarian"
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. MODE SWITCHER: PENCARIAN TEKS VS PENCARIAN PINTAR (IR)             */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex items-center gap-2 pt-0.5">
        {/* Tombol Mode Teks Biasa */}
        <button
          type="button"
          onClick={() => onModeChange(false)}
          className={`h-9 px-3.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer select-none [touch-action:manipulation] ${
            !isSemanticMode
              ? 'bg-[#0e9f90] hover:bg-[#0c8a7d] text-white shadow-2xs'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Pencarian Teks</span>
        </button>

        {/* Tombol Mode Pintar Semantik */}
        <button
          type="button"
          onClick={() => onModeChange(true)}
          className={`h-9 px-3.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer select-none [touch-action:manipulation] ${
            isSemanticMode
              ? 'bg-[#0e9f90] hover:bg-[#0c8a7d] text-white shadow-2xs'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pencarian Pintar</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. FILTER CHIP TOPIK HORISONTAL (KHUSUS MODE PENCARIAN PINTAR)         */}
      {/* ---------------------------------------------------------------------- */}
      {isSemanticMode && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <p className="text-[11px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-widest">
            Saring Berdasarkan Topik Refleksi:
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {/* Opsi Semua Topik */}
            <button
              type="button"
              onClick={() => onTopicChange(undefined)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer [touch-action:manipulation] ${
                !selectedTopicId
                  ? 'bg-[#0e9f90] text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold'
              }`}
            >
              Semua Topik
            </button>

            {/* Daftar Chip Topik dari API Backend */}
            {topics.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onTopicChange(t.id === selectedTopicId ? undefined : t.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer [touch-action:manipulation] ${
                  selectedTopicId === t.id
                    ? 'bg-[#0e9f90] text-white font-bold shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 4. KARTU PANDUAN PENCARIAN MAKNA (IR) - SESUAI GAMBAR 2 ANDROID        */}
      {/* Tampil saat mode Semantik aktif namun user belum mengetikkan kata      */}
      {/* ---------------------------------------------------------------------- */}
      {isSemanticMode && searchQuery.trim().length === 0 && (
        <div className="bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 sm:p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e6f7f5] dark:bg-teal-950/60 text-[#0d9488] dark:text-teal-400 border border-[#ccf0ea] dark:border-teal-800/60 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0f172a] dark:text-white">
                Pencarian Makna (IR)
              </h4>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Temukan sloka berdasarkan kesamaan makna kata dan sinonim. Ketik kata kunci seperti "kesedihan", "kebimbangan", "kewajiban", atau "kedamaian".
          </p>

          {/* Tombol Kata Kunci Contoh Interaktif (Quick Trigger) */}
          <div className="pt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 mr-1">
              Coba Kata Kunci:
            </span>
            {sampleKeywords.map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => setSearchQuery(keyword)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-700 hover:border-teal-300 dark:hover:border-slate-600 transition-all cursor-pointer shadow-2xs [touch-action:manipulation]"
              >
                "{keyword}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
