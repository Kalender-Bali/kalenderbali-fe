import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Sparkles,
  Search,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { BhagawadGitaTab } from '../types/bhagawadGita.types';
import { BhagawadGitaHero } from '../components/BhagawadGitaHero';
import { BhagawadGitaSearchBar } from '../components/BhagawadGitaSearchBar';
import { ChapterCard } from '../components/ChapterCard';
import { TopicChipCard } from '../components/TopicChipCard';
import { VerseCard } from '../components/VerseCard';
import { BhagawadGitaSkeleton } from '../components/BhagawadGitaSkeleton';
import {
  useChapters,
  useTopics,
  useSemanticSearch,
  useTextSearch,
} from '../hooks/useBhagawadGita';

/**
 * ==============================================================================
 * HALAMAN UTAMA: BhagawadGitaPage (Katalog & Pencarian Suci Bhagawad Gita)
 * ==============================================================================
 * Mengorkestrasi pengalaman membaca dan pencarian pustaka suci Bhagawad Gita:
 *
 * Prinsip Arsitektur Utama (fe_strategy.md & AGENTS.md):
 *  1. Paritas Fitur Mobile: Hanya 2 tab utama ('Daftar Bab' & 'Topik & Refleksi').
 *  2. Dual-Sync State: State lokal responsif instan (0ms) yang tersinkronisasi
 *     dua arah ke URL searchParams (?tab=...&mode=...&q=...&topic=...).
 *  3. Zero-Loading UX: Data 18 bab dan 21 topik ditarik 1x dengan staleTime Infinity.
 *     Perpindahan antar-tab dan mode berlangsung seketika tanpa jeda.
 *  4. Zero Layout Shift (CLS = 0): Menyajikan Skeleton Screen presisi saat cold start.
 *  5. Dynamic Document Title: Memperbarui judul tab browser secara reaktif.
 *  6. Palet Resmi Wargabali: Teal Tirta Bali (#0e9f90, #0d9488, #e6f7f5, #ccf0ea).
 * ==============================================================================
 */

export default function BhagawadGitaPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ---------------------------------------------------------------------------
  // 1. REKONSTRUKSI & SINKRONISASI STATE (REACT STATE + URL-AS-STATE)
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<BhagawadGitaTab>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'topics') return tabParam;
    return 'chapters';
  });

  const [isSemanticMode, setIsSemanticMode] = useState<boolean>(() => {
    return searchParams.get('mode') === 'semantic';
  });

  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(() => {
    return searchParams.get('topic') || undefined;
  });

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    return searchParams.get('q') || '';
  });

  // Sinkronkan state saat URL query berubah (misal navigasi Back/Forward browser)
  const [previousInputs1, setPreviousInputs1] = useState<readonly unknown[] | null>(null);
  const currentInputs1 = [searchParams];
  if (previousInputs1 === null || currentInputs1.some((value, index) => !Object.is(value, previousInputs1[index]))) {
    setPreviousInputs1(currentInputs1);
    const tabParam = searchParams.get('tab') as BhagawadGitaTab | null;
    setActiveTab(tabParam === 'topics' ? tabParam : 'chapters');
    setIsSemanticMode(searchParams.get('mode') === 'semantic');
    setSelectedTopicId(searchParams.get('topic') || undefined);
    setSearchQuery(searchParams.get('q') || '');

  }

  // Handler pergantian mode: Pencarian Teks vs Pencarian Pintar (IR)
  const handleModeChange = (semantic: boolean) => {
    setIsSemanticMode(semantic);
    setSelectedTopicId(undefined);
    setSearchQuery('');

    const next = new URLSearchParams(searchParams);
    if (semantic) {
      next.set('mode', 'semantic');
    } else {
      next.delete('mode');
    }
    next.delete('topic');
    next.delete('q');
    setSearchParams(next, { replace: true });
  };

  // Handler pergantian tab katalog
  const handleTabChange = (tab: BhagawadGitaTab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    if (tab === 'chapters') {
      next.delete('tab');
    } else {
      next.set('tab', tab);
    }
    setSearchParams(next, { replace: true });
  };

  // Handler pergantian filter topik (mode pintar)
  const handleTopicFilterChange = (topicId?: string) => {
    setSelectedTopicId(topicId);
    const next = new URLSearchParams(searchParams);
    if (topicId) {
      next.set('topic', topicId);
    } else {
      next.delete('topic');
    }
    setSearchParams(next, { replace: true });
  };

  // Debouncing otomatis untuk mengalirkan searchQuery ke URL searchParams
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get('q') || '';
      const trimmed = searchQuery.trim();
      if (trimmed !== currentQ) {
        const next = new URLSearchParams(searchParams);
        if (trimmed) {
          next.set('q', trimmed);
        } else {
          next.delete('q');
        }
        setSearchParams(next, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchParams, setSearchParams]);

  // ---------------------------------------------------------------------------
  // 2. PENGAMBILAN DATA DARI BACKEND GO (TANSTACK QUERY)
  // ---------------------------------------------------------------------------
  const {
    data: chapters = [],
    isLoading: isLoadingChapters,
    error: errorChapters,
    refetch: refetchChapters,
  } = useChapters();

  const {
    data: topics = [],
    isLoading: isLoadingTopics,
  } = useTopics();

  // Pencarian Pintar Semantik (IR Cosine Similarity) di Backend Go
  const {
    data: semanticResults,
    isLoading: isSearchingSemantic,
  } = useSemanticSearch(
    isSemanticMode && searchQuery.trim().length > 0 ? searchQuery : '',
    selectedTopicId
  );

  // Pencarian Teks Biasa pada Bab, Topik, & Sloka di Backend Go
  const {
    data: textResults,
  } = useTextSearch(
    !isSemanticMode && searchQuery.trim().length > 0 ? searchQuery : ''
  );

  // ---------------------------------------------------------------------------
  // 3. DYNAMIC DOCUMENT TITLE (fe_strategy.md Bab 8.13)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (searchQuery.trim()) {
      document.title = `Pencarian: "${searchQuery}" · Bhagawad Gita | Kalender Bali`;
    } else if (activeTab === 'topics') {
      document.title = 'Topik & Refleksi Hidup · Bhagawad Gita | Kalender Bali';
    } else {
      document.title = 'Bhagawad Gita · 18 Bab Yoga Suci | Kalender Bali';
    }
  }, [searchQuery, activeTab]);

  // ---------------------------------------------------------------------------
  // 4. PENANGANAN LOADING SKELETON (ZERO CLS)
  // ---------------------------------------------------------------------------
  if (isLoadingChapters || isLoadingTopics) {
    return <BhagawadGitaSkeleton />;
  }

  // ---------------------------------------------------------------------------
  // 5. PENANGANAN KESALAHAN JARINGAN (ERROR STATE)
  // ---------------------------------------------------------------------------
  if (errorChapters) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto my-8 space-y-4 shadow-xs animate-in fade-in">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#0f172a]">
            Gagal Memuat Data Bhagawad Gita
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Terjadi gangguan saat menghubungkan ke server pustaka suci.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetchChapters()}
          className="h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation]"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Coba Lagi</span>
        </button>
      </div>
    );
  }

  // Data Bab dan Topik yang ditampilkan (difilter jika ada pencarian teks aktif)
  const displayedChapters = textResults && !isSemanticMode && searchQuery.trim()
    ? textResults.chapters
    : chapters;

  const displayedTopics = textResults && !isSemanticMode && searchQuery.trim()
    ? textResults.topics
    : topics;

  return (
    <div className="space-y-6 pb-12">
      {/* ===================================================================== */}
      {/* 1. HEADER & BREADCRUMB STANDAR WARGABALI                             */}
      {/* ===================================================================== */}
      <BhagawadGitaHero />

      {/* ===================================================================== */}
      {/* 2. PUSAT PENCARIAN (TEKS BIASA & PINTAR SEMANTIK IR)                  */}
      {/* ===================================================================== */}
      <BhagawadGitaSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSemanticMode={isSemanticMode}
        onModeChange={handleModeChange}
        selectedTopicId={selectedTopicId}
        onTopicChange={handleTopicFilterChange}
        topics={topics}
      />

      {/* ===================================================================== */}
      {/* 3. HASIL PENCARIAN PINTAR SEMANTIK (JIKA MODE SEMANTIK & QUERY ADA)   */}
      {/* ===================================================================== */}
      {isSemanticMode && searchQuery.trim().length > 0 ? (
        <div className="space-y-4 animate-in fade-in">
          {/* Header Bar Hasil Pencarian */}
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0d9488]" />
              <span>
                Hasil Pencarian Makna & Relevansi ({semanticResults?.length ?? 0} Sloka)
              </span>
            </h2>
          </div>

          {/* Loading Indicator saat Evaluasi Cosine Similarity */}
          {isSearchingSemantic ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 flex items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-[#0d9488] dark:text-teal-400" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Menganalisis kemiripan makna & rasa sloka...
              </span>
            </div>
          ) : semanticResults && semanticResults.length > 0 ? (
            <div className="space-y-4">
              {semanticResults.map((item) => (
                <VerseCard
                  key={`${item.verse.chapter_number}-${item.verse.verse_number}`}
                  verse={item.verse}
                  showChapterNumber={true}
                />
              ))}
            </div>
          ) : (
            /* Empty State Pencarian Semantik */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-10 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0f172a] dark:text-white">
                Tidak ada sloka yang sesuai dengan kata kunci "{searchQuery}"
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Coba gunakan kata rasa lain seperti "kesedihan", "bimbang", "tugas", "kedamaian", atau ketik langsung "2:47".
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ===================================================================== */
        /* 4. KATALOG UTAMA (SEGMENTED TABS: BAB, TOPIK, & TERSIMPAN)            */
        /* ===================================================================== */
        <div className="space-y-6">
          {/* Segmented Tab Switcher Standar AGENTS.md Bagian 4.6 */}
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex gap-1 w-full sm:w-fit overflow-x-auto select-none">
            {/* Tab 1: Daftar Bab */}
            <button
              type="button"
              onClick={() => handleTabChange('chapters')}
              className={`py-2 px-3.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer inline-flex items-center gap-2 shrink-0 [touch-action:manipulation] ${
                activeTab === 'chapters'
                  ? 'bg-white dark:bg-slate-700 text-[#0f172a] dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#0d9488] dark:text-teal-400" />
              <span>Daftar Bab ({displayedChapters.length})</span>
            </button>

            {/* Tab 2: Topik & Refleksi */}
            <button
              type="button"
              onClick={() => handleTabChange('topics')}
              className={`py-2 px-3.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer inline-flex items-center gap-2 shrink-0 [touch-action:manipulation] ${
                activeTab === 'topics'
                  ? 'bg-white dark:bg-slate-700 text-[#0f172a] dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#0d9488] dark:text-teal-400" />
              <span>Topik & Refleksi ({displayedTopics.length})</span>
            </button>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* TAB 1: DAFTAR 18 BAB (GRID 3-KOLOM WEB)                           */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'chapters' && (
            <div className="space-y-6">
              {displayedChapters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayedChapters.map((ch) => (
                    <ChapterCard key={ch.number} chapter={ch} />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
                  Tidak ada bab yang cocok dengan kata kunci "{searchQuery}".
                </div>
              )}

              {/* Tampilkan sloka yang cocok jika ada hasil pencarian teks terjemahan */}
              {textResults?.verses && textResults.verses.length > 0 && (
                <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
                  <h3 className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-white">
                    Sloka dengan Terjemahan Terkait ({textResults.verses.length})
                  </h3>
                  <div className="space-y-4">
                    {textResults.verses.map((v) => (
                      <VerseCard
                        key={`${v.chapter_number}-${v.verse_number}`}
                        verse={v}
                        showChapterNumber={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* TAB 2: TOPIK & REFLEKSI HIDUP (GRID 3-KOLOM WEB)                  */}
          {/* ----------------------------------------------------------------- */}
          {activeTab === 'topics' && (
            <div className="space-y-4">
              {displayedTopics.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedTopics.map((t) => (
                    <TopicChipCard key={t.id} topic={t} />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
                  Tidak ada topik yang cocok dengan kata kunci "{searchQuery}".
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
