import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { VerseCard } from '../components/VerseCard';
import { GuestUnlockBanner } from '../components/GuestUnlockBanner';
import { useTopicDetail } from '../hooks/useBhagawadGita';

/**
 * ==============================================================================
 * HALAMAN TOPIK: BhagawadGitaTopicPage (Halaman Refleksi Hidup & Sloka Terpilih)
 * ==============================================================================
 * Menampilkan bait-bait sloka kurasi bertema khusus (sesuai Gambar 3 Android):
 * 1. Breadcrumb hierarkis Wargabali & tombol kembali ke tab Topik & Refleksi
 * 2. Header kartu topik berlatar putih dengan ikon refleksi & deskripsi
 * 3. Judul "Daftar Sloka Terpilih" dengan angka tabular-nums
 * 4. Daftar VerseCard dengan nomor bab & nomor sloka tertera
 * 5. Penegakan hak akses Guest (preview sloka kurasi + GuestUnlockBanner)
 * ==============================================================================
 */

export default function BhagawadGitaTopicPage() {
  const { topicId } = useParams<{ topicId: string }>();

  const { data: detail, isLoading, error, refetch } = useTopicDetail(topicId || '');

  // Dynamic Document Title
  useEffect(() => {
    if (detail?.topic) {
      document.title = `${detail.topic.name} · Refleksi Bhagawad Gita | Kalender Bali`;
    }
  }, [detail]);

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-lg mx-auto my-12 space-y-3 shadow-xs">
        <RefreshCw className="w-8 h-8 animate-spin text-[#0d9488] mx-auto" />
        <h3 className="text-base font-bold text-[#0f172a]">
          Memuat Sloka Refleksi Hidup...
        </h3>
        <p className="text-xs text-slate-500">
          Mengambil bait-bait sloka kurasi dan ulasan filosofis.
        </p>
      </div>
    );
  }

  // Error State (Topik tidak ditemukan atau jaringan terganggu)
  if (error || !detail) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto my-12 space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#0f172a]">Topik Tidak Ditemukan</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Gagal memuat sloka untuk tema refleksi yang Anda pilih.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to="/bhagawadgita?tab=topics"
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Topik & Refleksi</span>
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

  const { topic, verses, is_locked, total_count, preview_count } = detail;

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
          <Link to="/bhagawadgita?tab=topics" className="hover:text-teal-700 transition-colors">
            Bhagawad Gita
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-teal-700 font-bold truncate max-w-xs">
            Refleksi: {topic.name}
          </span>
        </nav>

        <div>
          <Link
            to="/bhagawadgita?tab=topics"
            className="inline-flex items-center text-xs sm:text-sm font-bold text-[#0d9488] hover:text-[#0c8a7d] transition-colors [touch-action:manipulation]"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Kembali ke Topik & Refleksi</span>
          </Link>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. KARTU HEADER DETAIL TOPIK (SESUAI GAMBAR 3 ANDROID)                 */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Refleksi Emosi & Spiritual</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              {topic.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              {topic.description}
            </p>
          </div>

          {/* Kotak Stat Sloka Terpilih */}
          <div className="bg-[#e6f7f5] border border-[#ccf0ea] rounded-xl p-3 sm:p-3.5 text-center min-w-[105px] shrink-0">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
              SLOKA TERPILIH
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tabular-nums tracking-tight block my-0.5">
              {topic.verse_count}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              Bait Kurasi
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. SUB-HEADER: DAFTAR SLOKA TERPILIH                                   */}
      {/* ---------------------------------------------------------------------- */}
      <div className="pt-2 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#0d9488]" />
          <span>
            Daftar Sloka Terpilih ({verses.length}{is_locked ? ` dari ${total_count}` : ''})
          </span>
        </h2>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 4. DAFTAR KARTU SLOKA                                                  */}
      {/* ---------------------------------------------------------------------- */}
      <div className="space-y-4">
        {verses.map((v) => (
          <VerseCard
            key={`${v.chapter_number}-${v.verse_number}`}
            verse={v}
            showChapterNumber={true}
          />
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
