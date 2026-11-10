import { useState } from 'react';
import type { FC } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import type { Verse } from '../types/bhagawadGita.types';

/**
 * ==============================================================================
 * KOMPONEN: VerseCard (Kartu Sloka Bhagawad Gita & Narasi Filosofis)
 * ==============================================================================
 * Menampilkan bait sloka suci lengkap (sesuai Gambar 3 & 5 Android):
 * 1. Badge nomor sloka berlatar Mint Teal (Bab X • Sloka Y)
 * 2. Tombol Salin Teks ke Clipboard
 * 3. Transliterasi Latin Sansekerta tebal (font-semibold text-[#0f172a])
 * 4. Terjemahan bahasa Indonesia miring (italic text-slate-600)
 * 5. Accordion expand/collapse "Lihat Pembahasan & Narasi" dengan wadah
 *    inner surface box (#f8fafc) untuk kenyamanan membaca ulasan mendalam.
 * ==============================================================================
 */

interface VerseCardProps {
  verse: Verse;
  showChapterNumber?: boolean;
}

export const VerseCard: FC<VerseCardProps> = ({
  verse,
  showChapterNumber = false,
}) => {
  const [isNarrativeExpanded, setIsNarrativeExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fungsi menyalin teks sloka dan terjemahan ke clipboard
  const handleCopy = async () => {
    const textToCopy = `Bhagawad Gita Bab ${verse.chapter_number} Sloka ${verse.verse_number}\n\n"${verse.sloka}"\n\nArtinya:\n${verse.translation}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      console.error('Gagal menyalin teks sloka');
    }
  };

  const label = showChapterNumber
    ? `Bab ${verse.chapter_number} • Sloka ${verse.verse_number}`
    : `Sloka ${verse.verse_number}`;

  return (
    <div
      id={`sloka-${verse.verse_number}`}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4 transition-all duration-200 hover:shadow-sm"
    >
      {/* ---------------------------------------------------------------------- */}
      {/* 1. HEADER KARTU: BADGE NOMOR SLOKA & TOMBOL SALIN                      */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        {/* Badge Nomor Sloka Mint Teal */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#e6f7f5] dark:bg-teal-950/60 text-[#0f766e] dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 tabular-nums">
          {label}
        </span>

        {/* Tombol Salin Teks */}
        <button
          type="button"
          onClick={handleCopy}
          title={isCopied ? 'Tersalin ke Clipboard!' : 'Salin Teks Sloka & Terjemahan'}
          aria-label="Salin teks sloka"
          className="p-2 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer [touch-action:manipulation]"
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. TEKS SLOKA SANSEKERTA (TRANSLITERASI LATIN TEBAL)                   */}
      {/* ---------------------------------------------------------------------- */}
      <div>
        <p className="text-base sm:text-lg font-semibold text-[#0f172a] dark:text-slate-100 leading-relaxed font-sans">
          {verse.sloka}
        </p>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. TERJEMAHAN BAHASA INDONESIA (ITALIC)                                */}
      {/* ---------------------------------------------------------------------- */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 italic leading-relaxed">
          "{verse.translation}"
        </p>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 4. ACCORDION PEMBAHASAN & NARASI FILOSOFIS                            */}
      {/* ---------------------------------------------------------------------- */}
      {verse.narrative && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsNarrativeExpanded(!isNarrativeExpanded)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0d9488] dark:text-teal-400 hover:text-[#0c8a7d] dark:hover:text-teal-300 transition-colors cursor-pointer select-none [touch-action:manipulation]"
          >
            <span>
              {isNarrativeExpanded ? 'Tutup Pembahasan & Narasi' : 'Lihat Pembahasan & Narasi'}
            </span>
            {isNarrativeExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Kotak Inner Surface Penjelasan Narasi */}
          {isNarrativeExpanded && (
            <div className="mt-3 bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/80 rounded-xl p-4 sm:p-5 text-slate-700 dark:text-slate-200 text-sm leading-relaxed space-y-2 animate-in fade-in">
              <h5 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                Ulasan Filosofis:
              </h5>
              <p className="leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                {verse.narrative}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
