import { useState, useEffect, useRef } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useJodoh } from '../hooks/useJodoh';
import { JodohHero } from '../components/JodohHero';
import { JodohFormSection } from '../components/JodohFormSection';
import { JodohResultSection } from '../components/JodohResultSection';
import { JodohResultSectionSkeleton } from '../components/JodohSkeleton';
import { JodohGuideModal } from '../components/JodohGuideModal';
import type { JodohFormData } from '../types/jodoh.types';

/**
 * ============================================================================
 * HALAMAN UTAMA: JodohPage (Ramalan Jodoh Pal Sri Sedana)
 * ============================================================================
 * Halaman orkestrator fitur Ramalan Jodoh penanggalan Bali yang menyatukan:
 *  1. Header & Hero Banner dengan tombol Panduan (JodohHero).
 *  2. Form Masukan 2 Kolom Diri vs Pasangan + Fitur Swap (JodohFormSection).
 *  3. Modal Dialog Panduan Interaktif Berbasis Tab (JodohGuideModal).
 *  4. Dynamic Document Title: Memperbarui judul tab browser secara reaktif.
 *  5. Dual-State Rendering (Sesuai fe_strategy.md):
 *     - Belum ada input: Menampilkan Form + Kartu Edukasi Pengantar Pal Sri Sedana.
 *     - Sedang memuat: Menampilkan JodohResultSectionSkeleton (CLS = 0).
 *     - Terjadi error: Menampilkan kartu error interaktif dengan tombol "Coba Lagi".
 *     - Berhasil: Menampilkan JodohResultSection lengkap (100% Real Data dari Go).
 *  6. Navigasi Cepat (Scroll-to-Form) saat tombol "Ubah" pada kartu hasil diklik.
 * ============================================================================
 */
export default function JodohPage() {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    activeParams,
    executeSearch,
    swapPartners,
    resetSearch,
  } = useJodoh();

  // State untuk mengontrol visibilitas dialog modal panduan
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  // Ref kontainer form untuk aksi scroll halus saat pengguna klik tombol "Ubah"
  const formSectionRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // BLOK 1: SINKRONISASI JUDUL TAB BROWSER (DYNAMIC DOCUMENT TITLE)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (data && data.diri && data.pasangan) {
      const skorFormatted =
        data.skor_akhir % 1 === 0
          ? `${data.skor_akhir.toFixed(0)}%`
          : `${data.skor_akhir.toFixed(1)}%`;

      document.title = `Kecocokan Jodoh: ${data.diri.nama} & ${data.pasangan.nama} (${skorFormatted} · ${data.kesimpulan}) | Kalender Bali`;
    } else {
      document.title = 'Ramalan Jodoh (Pal Sri Sedana) · Kecocokan Weton Bali | Kalender Bali';
    }
  }, [data]);

  // -------------------------------------------------------------------------
  // BLOK 2: HANDLER PENGIRIMAN & MODIFIKASI PENCARIAN
  // -------------------------------------------------------------------------
  const handleFormSubmit = (formData: JodohFormData) => {
    executeSearch(formData);
  };

  const handleModifySearch = () => {
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ===================================================================== */}
      {/* BLOK 3: HEADER BREADCRUMB & HERO BANNER                               */}
      {/* ===================================================================== */}
      <JodohHero onOpenGuide={() => setIsGuideModalOpen(true)} />

      {/* ===================================================================== */}
      {/* BLOK 4: FORM MASUKAN 2 KOLOM (DENGAN REF SCROLL HALUS)                */}
      {/* ===================================================================== */}
      <div ref={formSectionRef}>
        <JodohFormSection
          initialNamaDiri={activeParams?.nama_diri || ''}
          initialTanggalLahirDiri={activeParams?.tgl_diri || ''}
          initialNamaPasangan={activeParams?.nama_pasangan || ''}
          initialTanggalLahirPasangan={activeParams?.tgl_pasangan || ''}
          onSubmit={handleFormSubmit}
          onSwap={swapPartners}
          onReset={resetSearch}
          isLoading={isLoading || isFetching}
        />
      </div>

      {/* ===================================================================== */}
      {/* BLOK 5: AREA PENYAJIAN HASIL (CONDITIONAL STATES)                     */}
      {/* ===================================================================== */}

      {/* Skenario A: Sedang Memuat Data (Loading Skeleton CLS = 0) */}
      {(isLoading || (isFetching && !data)) && (
        <JodohResultSectionSkeleton />
      )}

      {/* Skenario B: Terjadi Kesalahan Jaringan / Validasi Server */}
      {isError && !isLoading && (
        <div className="bg-white rounded-2xl border border-rose-200/90 p-6 sm:p-8 shadow-xs text-center max-w-xl mx-auto space-y-4 animate-in fade-in duration-150">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
              Gagal Memuat Ramalan Jodoh
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {error || 'Terjadi gangguan saat menghubungkan ke server Kalender Bali.'}
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
        <JodohResultSection
          result={data}
          onModifySearch={handleModifySearch}
        />
      )}

      {/* ===================================================================== */}
      {/* BLOK 6: MODAL DIALOG PANDUAN PETENUNGAN INTERAKTIF                    */}
      {/* ===================================================================== */}
      <JodohGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}

