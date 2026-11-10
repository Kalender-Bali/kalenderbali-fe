import { useState, useEffect, useRef } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useGarisHidup } from '../hooks/useGarisHidup';
import { GarisHidupHero } from '../components/GarisHidupHero';
import { GarisHidupFormSection } from '../components/GarisHidupFormSection';
import { GarisHidupResultSection } from '../components/GarisHidupResultSection';
import { GarisHidupResultSectionSkeleton } from '../components/GarisHidupSkeleton';
import { GarisHidupGuideModal } from '../components/GarisHidupGuideModal';

/**
 * ============================================================================
 * HALAMAN UTAMA: GarisHidupPage (Garis Hidup Pal Sri Sedana)
 * ============================================================================
 * Halaman orkestrator fitur Garis Hidup (Pal Sri Sedana 6-Tahunan) yang menyatukan:
 *  1. Header & Hero Banner dengan tombol Panduan (GarisHidupHero).
 *  2. Formulir Masukan Multi-Peserta 1–5 Orang (GarisHidupFormSection).
 *  3. Modal Dialog Panduan Interaktif Berbasis 3 Tab (GarisHidupGuideModal).
 *  4. Dynamic Document Title: Memperbarui judul tab browser secara reaktif.
 *  5. Penyajian 4 Skenario Tampilan Sesuai fe_strategy.md:
 *     - Belum ada input: Form + Kartu Edukasi Pengantar 3 Pilar Garis Hidup.
 *     - Sedang memuat: GarisHidupResultSectionSkeleton (CLS = 0).
 *     - Terjadi error: Kartu error interaktif dengan tombol "Coba Lagi".
 *     - Berhasil: GarisHidupResultSection lengkap (100% Real Data dari Go).
 *  6. Navigasi Cepat (Scroll-to-Form) saat tombol "Ubah" pada kartu hasil diklik.
 * ============================================================================
 */
export default function GarisHidupPage() {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    formEntries,
    tambahPeserta,
    hapusPeserta,
    updatePeserta,
    executeSearch,
    resetSearch,
    activeParticipantIndex,
    setActiveParticipantIndex,
  } = useGarisHidup();

  // State untuk mengontrol visibilitas dialog modal panduan edukasi
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  // Ref kontainer form untuk aksi scroll halus saat pengguna klik tombol "Ubah"
  const formSectionRef = useRef<HTMLDivElement>(null);

  // =========================================================================
  // BLOK 1: SINKRONISASI JUDUL TAB BROWSER (DYNAMIC DOCUMENT TITLE)
  // =========================================================================
  useEffect(() => {
    if (data && data.length > 0) {
      const activeRes = data[activeParticipantIndex] || data[0];
      document.title = `Garis Hidup: ${activeRes.nama} (${activeRes.umur} Thn · Nilai ${activeRes.periode_saat_ini.nilai}) | Kalender Bali`;
    } else {
      document.title =
        'Garis Hidup (Pal Sri Sedana) · Perjalanan Hidup Wariga | Kalender Bali';
    }
  }, [data, activeParticipantIndex]);

  // =========================================================================
  // BLOK 2: HANDLER MODIFIKASI PENCARIAN (SCROLL KE FORM)
  // =========================================================================
  const handleModifySearch = () => {
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ===================================================================== */}
      {/* BLOK 3: HEADER BREADCRUMB & HERO BANNER                               */}
      {/* ===================================================================== */}
      <GarisHidupHero onOpenGuide={() => setIsGuideModalOpen(true)} />

      {/* ===================================================================== */}
      {/* BLOK 4: FORM MASUKAN DINAMIS MULTI-PESERTA                            */}
      {/* ===================================================================== */}
      <div ref={formSectionRef}>
        <GarisHidupFormSection
          entries={formEntries}
          onAddParticipant={tambahPeserta}
          onRemoveParticipant={hapusPeserta}
          onUpdateParticipant={updatePeserta}
          onSubmit={executeSearch}
          onReset={resetSearch}
          isLoading={isLoading || isFetching}
          errorMessage={isError ? null : undefined}
        />
      </div>

      {/* ===================================================================== */}
      {/* BLOK 5: AREA PENYAJIAN HASIL (4 KONDISI TAMPILAN)                     */}
      {/* ===================================================================== */}

      {/* Skenario A: Sedang Memuat Data (Loading Skeleton CLS = 0) */}
      {(isLoading || (isFetching && !data)) && (
        <GarisHidupResultSectionSkeleton />
      )}

      {/* Skenario B: Terjadi Kesalahan Jaringan / Validasi Server */}
      {isError && !isLoading && (
        <div className="bg-white rounded-2xl border border-rose-200/90 p-6 sm:p-8 shadow-xs text-center max-w-xl mx-auto space-y-4 animate-in fade-in duration-150">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
              Gagal Memuat Garis Hidup
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {error ||
                'Terjadi gangguan saat menghubungkan ke server Kalender Bali.'}
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

      {/* Skenario C: Data Berhasil Dimuat (100% Real Data dari Go Backend) */}
      {data && !isLoading && (
        <GarisHidupResultSection
          results={data}
          activeParticipantIndex={activeParticipantIndex}
          onSelectParticipant={setActiveParticipantIndex}
          onModifySearch={handleModifySearch}
        />
      )}

      {/* ===================================================================== */}
      {/* BLOK 6: MODAL DIALOG PANDUAN EDUKATIF                                 */}
      {/* ===================================================================== */}
      <GarisHidupGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}

