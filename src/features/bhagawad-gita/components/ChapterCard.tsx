import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import type { Chapter } from '../types/bhagawadGita.types';

/**
 * ==============================================================================
 * KOMPONEN: ChapterCard (Kartu Katalog Bab Bhagawad Gita)
 * ==============================================================================
 * Menampilkan ringkasan satu bab dari 18 bab Bhagawad Gita (sesuai Gambar 4 Android):
 * 1. Kotak nomor Romawi beraksen Mint Teal (#e6f7f5, #ccf0ea)
 * 2. Judul bab transliterasi Sansekerta & terjemahan bahasa Indonesia
 * 3. Ringkasan isi filosofis bab (terpotong rapi dengan line-clamp-2)
 * 4. Badge jumlah sloka dengan angka tabular-nums
 * 5. Tautan aksi "Baca Bab ->" dengan efek hover micro-interaction
 * ==============================================================================
 */

interface ChapterCardProps {
  chapter: Chapter;
}

export const ChapterCard: FC<ChapterCardProps> = ({ chapter }) => {
  return (
    <Link
      to={`/bhagawadgita/bab/${chapter.number}`}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-teal-500/40 dark:hover:border-teal-500/40 hover:shadow-sm transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between cursor-pointer [touch-action:manipulation]"
    >
      <div className="space-y-3">
        {/* Baris Atas: Nomor Romawi & Judul Bab */}
        <div className="flex items-start gap-3.5">
          {/* Kotak Nomor Romawi Mint */}
          <div className="w-12 h-12 rounded-xl bg-[#e6f7f5] dark:bg-teal-950/60 border border-[#ccf0ea] dark:border-teal-800/60 flex items-center justify-center text-[#0f766e] dark:text-teal-300 font-extrabold text-lg shrink-0 group-hover:scale-105 transition-transform select-none">
            {chapter.roman_number}
          </div>

          {/* Judul & Terjemahan Bab */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-white group-hover:text-[#0d9488] dark:group-hover:text-teal-300 transition-colors truncate">
              {chapter.transliterated_name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic truncate mt-0.5">
              {chapter.translation}
            </p>
          </div>
        </div>

        {/* Ringkasan Cerita/Filosofi Bab */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {chapter.summary}
        </p>
      </div>

      {/* Baris Bawah: Total Sloka & Tautan Baca Bab */}
      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {/* Badge Total Sloka */}
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 tabular-nums">
          <BookOpen className="w-3.5 h-3.5 text-[#0d9488] dark:text-teal-400" />
          <span>{chapter.total_verses} Sloka</span>
        </span>

        {/* Tautan Aksi Navigasi */}
        <span className="text-xs sm:text-sm font-bold text-[#0d9488] dark:text-teal-400 group-hover:text-[#0a756a] dark:group-hover:text-teal-300 inline-flex items-center gap-1 group-hover:translate-x-1 transition-all">
          <span>Baca Bab</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
};
