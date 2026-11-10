import { Link } from 'react-router-dom';

/**
 * ============================================================================
 * KOMPONEN: Footer (Footer Aplikasi Kalender Bali)
 * ============================================================================
 * Mengikuti standar AGENTS.md Bagian 5.4:
 *  1. Sisi Kiri: Hak Cipta & Slogan ("Melestarikan warisan budaya...") dengan tabular-nums
 *  2. Bagian Tengah: Tautan legal & komunikasi (Privasi · Ketentuan · Kontak)
 *  3. Sisi Kanan: Badge resmi Google Play & Versi 2.0 dengan tabular-nums
 * ============================================================================
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-slate-400 mt-auto select-none transition-colors">
      <div className="max-w-[1560px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* ========================================================= */}
        {/* 1. SISI KIRI: HAK CIPTA & SLOGAN PELESTARIAN BUDAYA       */}
        {/* Sesuai AGENTS.md Bagian 5.4 & tabular-nums pada tahun      */}
        {/* ========================================================= */}
        <div className="text-center md:text-left space-y-0.5">
          <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
            © <span className="tabular-nums font-semibold">{currentYear}</span> Kalender Bali Lengkap
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Melestarikan warisan budaya melalui pengalaman digital yang mudah diakses.
          </p>
        </div>

        {/* ========================================================= */}
        {/* 2. SISI TENGAH: TAUTAN PRIVASI, KETENTUAN, DAN KONTAK     */}
        {/* Sesuai AGENTS.md Bagian 5.4                               */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <a
            href="#privasi"
            className="hover:text-primary transition-colors"
            title="Kebijakan Privasi"
          >
            Privasi
          </a>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <a
            href="#ketentuan"
            className="hover:text-primary transition-colors"
            title="Syarat & Ketentuan Penggunaan"
          >
            Ketentuan
          </a>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <Link
            to="/kontak"
            className="hover:text-primary transition-colors font-semibold"
            title="Buka Halaman Info Kontak Pengembang"
          >
            Kontak
          </Link>
        </div>

        {/* ========================================================= */}
        {/* 3. SISI KANAN: BADGE GOOGLE PLAY & LABEL VERSI 2.0        */}
        {/* Sesuai AGENTS.md Bagian 5.4 & tabular-nums                */}
        {/* ========================================================= */}
        <div className="flex flex-col items-center md:items-end gap-1">
          {/* Tombol Badge Google Play Resmi */}
          <a
            href="https://play.google.com/store/apps/details?id=com.infowariga.android"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 active:bg-slate-100 border border-slate-200/90 dark:border-slate-700 rounded-xl shadow-2xs transition-all hover:scale-[1.02] active:scale-95 group cursor-pointer [touch-action:manipulation]"
            title="Dapatkan di Google Play"
          >
            {/* Logo Google Play Vector Multi-Color */}
            <svg
              className="w-5 h-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3.609 1.814L13.793 12 3.61 22.186A2.215 2.215 0 0 1 3 20.615V3.385c0-.598.225-1.157.609-1.571z"
                fill="#00D2FF"
              />
              <path
                d="M17.41 8.384l-3.617 3.616 3.617 3.616 4.148-2.395a1.442 1.442 0 0 0 0-2.442l-4.148-2.395z"
                fill="#FFCE00"
              />
              <path
                d="M3.609 1.814l10.184 10.186 3.617-3.616L5.352.887a1.464 1.464 0 0 0-1.743.927z"
                fill="#00F076"
              />
              <path
                d="M3.609 22.186l13.793-7.97-3.609-3.608L3.609 20.794a1.464 1.464 0 0 0 0 1.392z"
                fill="#FF3333"
              />
            </svg>

            {/* Label Teks Get It On Google Play */}
            <div className="text-left leading-tight">
              <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                GET IT ON
              </div>
              <div className="text-xs font-bold text-[#0f172a] dark:text-white -mt-0.5 group-hover:text-primary transition-colors">
                Google Play
              </div>
            </div>
          </a>

          {/* Label Versi Rilis Aplikasi dengan Tabular Nums */}
          <span className="text-[10px] text-slate-400 font-medium tabular-nums">
            Versi 2.0
          </span>
        </div>
      </div>
    </footer>
  );
}
