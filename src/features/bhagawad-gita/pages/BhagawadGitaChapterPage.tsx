import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { VerseCard } from '../components/VerseCard';
import { JumpToVerseDropdown } from '../components/JumpToVerseDropdown';
import { GuestUnlockBanner } from '../components/GuestUnlockBanner';
import { useChapterDetail } from '../hooks/useBhagawadGita';

/**
 * ==============================================================================
 * HALAMAN BACA: BhagawadGitaChapterPage (Halaman Detail Bab & Sloka)
 * ==============================================================================
 * Menampilkan bait sloka lengkap satu bab (1 s/d 78 sloka):
 * 1. Breadcrumb hierarkis Wargabali & tombol kembali ke katalog
 * 2. Header kartu bab berlatar putih dengan rincian ringkasan isi & stat counter
 * 3. Dropdown navigasi cepat "Lompat ke Sloka"
 * 4. Daftar sloka lengkap (Sansekerta, terjemahan, dan ulasan filosofis)
 * 5. Penegakan hak akses Guest (Bab 3-18 preview 3 sloka + GuestUnlockBanner)
 * ==============================================================================
 */

export default function BhagawadGitaChapterPage() {
  const { chapterNumber } = useParams<{ chapterNumber: string }>();
  const num = parseInt(chapterNumber || '1', 10);

  const { data: detail, isLoading, error, refetch } = useChapterDetail(num);

  // Dynamic Document Title
  useEffect(() => {
    if (detail?.chapter) {
      document.title = `Bab ${detail.chapter.roman_number}: ${detail.chapter.transliterated_name} · Bhagawad Gita | Kalender Bali`;
    }
  }, [detail]);

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-lg mx-auto my-12 space-y-3 shadow-xs">
        <RefreshCw className="w-8 h-8 animate-spin text-[#0d9488] mx-auto" />
        <h3 className="text-base font-bold text-[#0f172a]">
          Memuat Sloka Bab {num}...
        </h3>
        <p className="text-xs text-slate-500">
          Menyiapkan transliterasi Sansekerta dan ulasan filosofis mendalam.
        </p>
      </div>
    );
  }

  // Error State (Bab tidak ditemukan atau koneksi gagal)
  if (error || !detail) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto my-12 space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#0f172a]">Bab Tidak Ditemukan</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Gagal memuat bait sloka untuk Bab {chapterNumber}.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to="/bhagawadgita"
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog</span>
          </Link>
          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 px-5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] text-white font-bold text-xs sm:text-sm shadow-xs transition-all inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </button>
        </div>
      </div>
    );
  }

  const { chapter, verses, is_locked, total_count, preview_count } = detail;

  return (
    <div className="space-y-6 pb-12">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. BREADCRUMB NAVIGASI & TOMBOL KEMBALI                                */}
      {/* ---------------------------------------------------------------------- */}
      <div className="space-y-3">
        <nav
          aria-label="Breadcrumb"
          className="text-xs font-semibold text-slate-400 flex flex-wrap items-center gap-2 select-none"
        >
          <span>Wargabali</span>
          <span className="text-slate-300">/</span>
          <span>Layanan</span>
          <span className="text-slate-300">/</span>
          <Link to="/bhagawadgita" className="hover:text-teal-700 transition-colors">
            Bhagawad Gita
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-teal-700 font-bold truncate max-w-xs">
            Bab {chapter.roman_number}: {chapter.transliterated_name}
          </span>
        </nav>

        <div>
          <Link
            to="/bhagawadgita"
            className="inline-flex items-center text-xs sm:text-sm font-bold text-[#0d9488] hover:text-[#0c8a7d] transition-colors [touch-action:manipulation]"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Kembali ke Daftar Bab</span>
          </Link>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. KARTU HEADER DETAIL BAB                                             */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold text-[#0d9488] uppercase tracking-widest block">
              BAB {chapter.roman_number}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              {chapter.transliterated_name}
            </h1>
            <p className="text-sm sm:text-base text-slate-500 italic mt-0.5">
              "{chapter.translation}"
            </p>
          </div>

          {/* Kotak Stat Total Sloka */}
          <div className="bg-[#e6f7f5] border border-[#ccf0ea] rounded-xl p-3 sm:p-3.5 text-center min-w-[105px] shrink-0">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
              TOTAL SLOKA
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tabular-nums tracking-tight block my-0.5">
              {chapter.total_verses}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              Bait Suci
            </span>
          </div>
        </div>

        {/* Ringkasan Filosofis Bab */}
        <div className="pt-3 border-t border-slate-100">
          <h2 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
            Ringkasan Isi Bab:
          </h2>
          <div className="bg-[#f8fafc] border border-slate-200/70 rounded-xl p-4 sm:p-5 text-slate-700 text-sm leading-relaxed">
            {chapter.summary}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. SUB-HEADER: JUDUL DAFTAR SLOKA & DROPDOWN LOMPAT SLOKA              */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#0d9488]" />
          <h2 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
            Daftar Sloka ({verses.length}{is_locked ? ` dari ${total_count}` : ''})
          </h2>
        </div>

        {/* Dropdown Navigasi Cepat Nomor Sloka */}
        <JumpToVerseDropdown totalVerses={verses.length} />
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 4. DAFTAR KARTU SLOKA                                                  */}
      {/* ---------------------------------------------------------------------- */}
      <div className="space-y-4">
        {verses.map((v) => (
          <VerseCard key={v.verse_number} verse={v} />
        ))}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 5. BANNER AKSES PENUH JIKA TIERING GUEST TERKUNCI                      */}
      {/* ---------------------------------------------------------------------- */}
      {is_locked && (
        <GuestUnlockBanner
          totalVerses={total_count}
          previewCount={preview_count}
        />
      )}
    </div>
  );
}
