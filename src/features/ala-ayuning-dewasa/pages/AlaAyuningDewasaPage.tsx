import { useEffect, useRef } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAlaAyuning } from '../hooks/useAlaAyuning';
import { AlaAyuningHero } from '../components/AlaAyuningHero';
import { AlaAyuningSearchCard } from '../components/AlaAyuningSearchCard';
import { AlaAyuningSummaryCard } from '../components/AlaAyuningSummaryCard';
import { AlaAyuningPawukonCard } from '../components/AlaAyuningPawukonCard';
import { AlaAyuningDasarSection } from '../components/AlaAyuningDasarSection';
import { AlaAyuningDateResultsCard } from '../components/AlaAyuningDateResultsCard';
import { AlaAyuningDetailModal } from '../components/AlaAyuningDetailModal';
import { AlaAyuningSkeleton } from '../components/AlaAyuningSkeleton';
import { getIndoMonthName, parseISODate } from '@/features/kalender/utils/calendarUtils';

/**
 * ============================================================================
 * HALAMAN UTAMA: AlaAyuningDewasaPage (Orkestrator Fitur Ala Ayuning Dewasa)
 * ============================================================================
 * Halaman utama yang menyatukan seluruh komponen fitur Padewasan Kalender Bali:
 *  1. Hero & Breadcrumb (AlaAyuningHero):
 *     - Header standar Wargabali, judul H1, aksi reset "Hari ini", dan tombol salin tautan.
 *     - Banner toska hero dengan metrik harian aktif dan status hari dari Go backend.
 *
 *  2. Form Pencarian Interaktif 2-Mode (AlaAyuningSearchCard):
 *     - Segmented Tab Switcher: "Berdasarkan Tanggal" vs "Cari Nama Padewasan".
 *     - Terintegrasi dua arah dengan URL Query Parameters (URL-as-State pattern).
 *
 *  3. Dynamic Document Title (fe_strategy.md Bagian 8.13):
 *     - Memperbarui judul tab browser secara reaktif sesuai tanggal atau nama padewasan.
 *
 *  4. Penyajian Hasil Berdasarkan Mode:
 *     - Mode Tanggal:
 *       * Row Atas (Split 2-Kolom): Ringkasan Kualitas Hari (SummaryCard) & Pawukon WITA (PawukonCard).
 *       * Row Bawah: Grid 2-Kolom Dasar Padewasan Aktif dengan badge resmi Alahing Dewasa.
 *     - Mode Nama Padewasan (Paritas Gambar 1 & 2 Sistem Laravel Lama):
 *       * Daftar tanggal jatuh padewasan dalam bulan/tahun terpilih & kartu informasi sastra lontar.
 *
 *  5. Dialog Modal Pop-up (AlaAyuningDetailModal):
 *     - Uraian mendalam makna budaya, anjuran yadnya, dan pedoman Alahing Dewasa.
 *
 *  6. Isolasi Loading & Error:
 *     - Skeleton presisi dimensi (CLS = 0) saat memuat data.
 *     - Kartu error interaktif dengan tombol "Coba Lagi" saat terjadi kendala jaringan.
 *
 * Menerapkan Standar Baku:
 *  - fe_strategy.md (Multi-layer cache, Zero-Loading UX, Tabular numbers, WITA lock)
 *  - AGENTS.md (Palet warna resmi, tipografi, card container, tombol ergonomis 44px)
 * ============================================================================
 */

export default function AlaAyuningDewasaPage() {
  const {
    // Mode pencarian aktif
    activeMode,
    setSearchMode,

    // Parameter aktif
    activeDate,
    queryDate,
    queryName,
    queryMonth,
    queryYear,

    // Data query harian (Mode Tanggal)
    padewasanList,
    pawukonInfo,
    todaySummary,

    // Data query per nama (Mode Nama)
    masterPadewasan,
    isMasterLoading,
    byNameResult,

    // Status loading & error
    isLoading,
    isFetching,
    isError,
    errorMessage,
    refetch,

    // Aksi navigasi
    handleSelectDate,
    handleSearchByName,

    // Modal detail padewasan
    selectedPadewasan,
    isDetailModalOpen,
    openDetailModal,
    closeDetailModal,
  } = useAlaAyuning();

  // Ref kontainer section dasar padewasan untuk aksi smooth-scroll
  const dasarSectionRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // BLOK 1: SINKRONISASI JUDUL TAB BROWSER (DYNAMIC DOCUMENT TITLE)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (activeMode === 'date') {
      const { day, month, year } = parseISODate(activeDate);
      const monthName = getIndoMonthName(month);
      const wukuText = pawukonInfo?.wuku ? ` · Wuku ${pawukonInfo.wuku}` : '';
      document.title = `Ala Ayuning Dewasa: ${day} ${monthName} ${year}${wukuText} | Kalender Bali`;
    } else if (activeMode === 'name' && queryName) {
      const monthName = getIndoMonthName(queryMonth);
      document.title = `Padewasan: ${queryName} (${monthName} ${queryYear}) | Kalender Bali`;
    } else {
      document.title = 'Ala Ayuning Dewasa · Panduan Hari Baik & Buruk | Kalender Bali';
    }
  }, [activeMode, activeDate, queryName, queryMonth, queryYear, pawukonInfo]);

  // Handler smooth-scroll ke bagian daftar padewasan aktif
  const handleScrollToDasar = () => {
    if (dasarSectionRef.current) {
      dasarSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Format tanggal terformat untuk kartu ringkasan
  const { day, month, year } = parseISODate(activeDate);
  const formattedActiveDate = `${day} ${getIndoMonthName(month)} ${year}`;

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* BLOK 2: HEADER BREADCRUMB & JUDUL UTAMA                             */}
      {/* ===================================================================== */}
      <AlaAyuningHero />

      {/* ===================================================================== */}
      {/* BLOK 3: FORM PENCARIAN 2-MODE (BERDASARKAN TANGGAL & CARI NAMA)       */}
      {/* ===================================================================== */}
      <AlaAyuningSearchCard
        activeMode={activeMode}
        onModeChange={setSearchMode}
        selectedDate={queryDate}
        onDateChange={handleSelectDate}
        selectedName={queryName}
        selectedMonth={queryMonth}
        selectedYear={queryYear}
        onSearchByName={handleSearchByName}
        masterList={masterPadewasan}
        isMasterLoading={isMasterLoading}
        isLoading={isLoading || isFetching}
      />

      {/* ===================================================================== */}
      {/* BLOK 4: KONDISI PENANGANAN: SKELETON LOADING STATE (CLS = 0)          */}
      {/* ===================================================================== */}
      {isLoading && <AlaAyuningSkeleton />}

      {/* ===================================================================== */}
      {/* BLOK 5: KONDISI PENANGANAN: ERROR STATE TERSTRUKTUR                   */}
      {/* ===================================================================== */}
      {isError && !isLoading && (
        <div className="bg-white rounded-2xl border border-rose-200/90 p-6 sm:p-8 shadow-xs text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
              Gagal Memuat Data Ala Ayuning Dewasa
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {errorMessage || 'Terjadi gangguan saat menghubungkan ke server Kalender Bali.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all active:scale-98 cursor-pointer [touch-action:manipulation]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* BLOK 6: AREA PENYAJIAN HASIL (READY STATE DARI BACKEND GO)            */}
      {/* ===================================================================== */}
      {!isLoading && !isError && (
        <>
          {/* ----------------------------------------------------------------- */}
          {/* SUB-BLOK A: HASIL MODE 1 - BERDASARKAN TANGGAL                    */}
          {/* ----------------------------------------------------------------- */}
          {activeMode === 'date' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Row Tengah: Ringkasan Hari Ini (Kiri) + Pawukon WITA (Kanan) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Kolom Kiri: Kartu Ringkasan Kualitas Hari (7 dari 12 Kolom) */}
                <div className="lg:col-span-7">
                  <AlaAyuningSummaryCard
                    formattedDate={formattedActiveDate}
                    statusLabel={todaySummary?.status_label || 'BAIK'}
                    headline={todaySummary?.headline}
                    padewasanList={padewasanList}
                    onScrollToDasar={handleScrollToDasar}
                  />
                </div>

                {/* Kolom Kanan: Kartu 4 Dimensi Pawukon Hari Ini (5 dari 12 Kolom) */}
                <div className="lg:col-span-5">
                  <AlaAyuningPawukonCard
                    activeDate={activeDate}
                    pawukonInfo={pawukonInfo}
                  />
                </div>
              </div>

              {/* Row Bawah: Grid 2-Kolom Seluruh Unsur Padewasan Aktif */}
              <div ref={dasarSectionRef}>
                <AlaAyuningDasarSection
                  padewasanList={padewasanList}
                  onSelectPadewasan={openDetailModal}
                />
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* SUB-BLOK B: HASIL MODE 2 - CARI NAMA PADEWASAN (PARITAS LARAVEL)  */}
          {/* ----------------------------------------------------------------- */}
          {activeMode === 'name' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {byNameResult ? (
                /* Hasil pencarian nama — tampil setelah pengguna menekan tombol Cari */
                <AlaAyuningDateResultsCard
                  result={byNameResult}
                  onSelectDate={(date) => {
                    // Ketika tanggal jatuh diklik, alihkan pengguna ke pemeriksaan tanggal penuh
                    setSearchMode('date');
                    handleSelectDate(date);
                  }}
                />
              ) : (
                /* Default sebelum pencarian: tampilkan hasil tanggal hari ini (sama dengan mode date)
                   agar konten tidak kosong saat pengguna baru beralih ke tab Cari Nama Padewasan */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7">
                    <AlaAyuningSummaryCard
                      formattedDate={formattedActiveDate}
                      statusLabel={todaySummary?.status_label || 'BAIK'}
                      headline={todaySummary?.headline}
                      padewasanList={padewasanList}
                      onScrollToDasar={handleScrollToDasar}
                    />
                  </div>
                  <div className="lg:col-span-5">
                    <AlaAyuningPawukonCard
                      activeDate={activeDate}
                      pawukonInfo={pawukonInfo}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ===================================================================== */}
      {/* BLOK 7: DIALOG MODAL DETAIL MAKNA SASTRA LONTAR                       */}
      {/* ===================================================================== */}
      <AlaAyuningDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        item={selectedPadewasan}
      />
    </div>
  );
}

