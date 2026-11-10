import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles, LogIn, UserPlus } from 'lucide-react';

/**
 * ==============================================================================
 * KOMPONEN: GuestUnlockBanner (Banner Ajakan Akses Penuh Hak Akses)
 * ==============================================================================
 * Ditampilkan saat pengguna dengan peran Guest membuka Bab 3 s/d 18 atau
 * topik refleksi yang melebihi batas kuota cuplikan gratis (preview_count).
 * Mengajak pengguna untuk mendaftar/masuk akun Kalender Bali secara gratis.
 * ==============================================================================
 */

interface GuestUnlockBannerProps {
  totalVerses?: number;
  previewCount?: number;
}

export const GuestUnlockBanner: FC<GuestUnlockBannerProps> = ({
  totalVerses = 700,
  previewCount = 3,
}) => {
  return (
    <div className="bg-[#e6f7f5]/40 border border-[#ccf0ea] rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xs my-6 animate-in fade-in">
      {/* Ikon Gembok Berlatar Mint */}
      <div className="w-12 h-12 mx-auto rounded-xl bg-[#e6f7f5] border border-[#ccf0ea] flex items-center justify-center text-[#0d9488]">
        <Lock className="w-5 h-5" />
      </div>

      {/* Judul & Penjelasan */}
      <div className="max-w-md mx-auto space-y-1.5">
        <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
          Buka Akses Seluruh {totalVerses} Sloka & Narasi
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
          Saat ini Anda sedang membaca {previewCount} sloka cuplikan gratis. Masuk atau daftarkan akun
          Kalender Bali secara gratis untuk mempelajari seluruh 18 Bab, 700 Sloka, dan narasi filosofis
          mendalam tanpa batas.
        </p>
      </div>

      {/* Tombol Masuk & Daftar */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {/* Tombol Masuk (Primary) */}
        <Link
          to="/login"
          className="h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation]"
        >
          <LogIn className="w-4 h-4" />
          <span>Masuk ke Akun</span>
        </Link>

        {/* Tombol Daftar (Secondary Outline) */}
        <Link
          to="/register"
          className="h-11 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Daftar Gratis</span>
        </Link>
      </div>

      {/* Catatan Kaki */}
      <div className="pt-1 flex items-center justify-center text-xs text-[#0d9488] font-semibold gap-1">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Pendaftaran cepat & 100% gratis untuk seluruh umat</span>
      </div>
    </div>
  );
};
