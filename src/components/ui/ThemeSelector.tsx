import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sun, Moon, Palette, Check } from 'lucide-react';
import {
  useThemeStore,
  ACCENT_OPTIONS,
} from '@/stores/useThemeStore';
import { popoverVariants } from '@/lib/animations';

/**
 * Komponen ThemeSelector
 * Mengatur pilihan Mode (Terang & Gelap dengan visual preview UI)
 * serta pilihan Aksen Warna Aplikasi.
 */
export function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { mode, accent, setMode, setAccent } = useThemeStore();

  const currentAccent = ACCENT_OPTIONS.find((a) => a.id === accent) || ACCENT_OPTIONS[0];

  // Menutup dropdown saat pengguna mengklik di luar area komponen
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ========================================================= */}
      {/* TOMBOL PEMICU (NAVBAR TRIGGER BUTTON)                      */}
      {/* Mengikuti standar ukuran touch target min-w-11 min-h-11    */}
      {/* ========================================================= */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="min-w-11 min-h-11 flex items-center justify-center p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 active:scale-95 rounded-xl transition-all cursor-pointer relative [touch-action:manipulation]"
        title="Pengaturan Tema & Aksen Warna"
        aria-label="Atur Tema Tampilan"
        aria-expanded={isOpen}
      >
        {/* Ikon Tema Konstan */}
        <Palette size={18} className="transition-transform duration-200" />
      </button>

      {/* ========================================================= */}
      {/* POPOVER / DROPDOWN PANEL PENGATURAN TEMA                  */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="theme-popover"
            variants={popoverVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 mt-2 w-80 sm:w-88 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden z-50 select-none"
          >
            {/* Header Panel */}
          <div className="p-3.5 bg-gradient-to-r from-slate-50 via-teal-50/20 to-slate-50 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-2xs"
                style={{ backgroundColor: currentAccent.colorHex }}
              >
                <Palette size={14} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs tracking-tight">
                  Tema & Tampilan
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sesuaikan mode dan nuansa warna
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 space-y-4">
            {/* Bagian 1: Pemilihan Mode (Visual Mini UI Card: Terang vs Gelap) */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-2">
                Mode Tampilan
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. KARTU PREVIEW MODE TERANG */}
                <button
                  type="button"
                  onClick={() => setMode('light')}
                  className={`group relative flex flex-col p-2 rounded-2xl border text-left transition-all cursor-pointer [touch-action:manipulation] ${
                    mode === 'light'
                      ? 'border-primary ring-2 ring-primary/20 bg-primary-subtle/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Mini Window Mockup Terang */}
                  <div
                    data-theme-preview="light"
                    className="w-full h-20 rounded-xl bg-slate-100 p-1.5 flex flex-col gap-1 border border-slate-200/90 shadow-2xs overflow-hidden"
                  >
                    {/* Window Titlebar */}
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: currentAccent.colorHex }}
                      />
                    </div>

                    {/* Window Layout (Sidebar + Main) */}
                    <div className="flex-1 flex gap-1.5 overflow-hidden">
                      {/* Mini Sidebar */}
                      <div className="w-1/3 h-full bg-white rounded-md p-1 flex flex-col gap-1 border border-slate-200/60 shadow-2xs">
                        <div
                          className="w-full h-1.5 rounded-xs"
                          style={{ backgroundColor: currentAccent.colorHex }}
                        />
                        <div className="w-3/4 h-1 bg-slate-200 rounded-xs" />
                        <div className="w-1/2 h-1 bg-slate-200 rounded-xs" />
                      </div>

                      {/* Mini Main Area */}
                      <div className="flex-1 h-full flex flex-col gap-1">
                        <div className="h-3 bg-white rounded-md border border-slate-200/60 p-0.5 flex items-center justify-between">
                          <div className="w-6 h-1 bg-slate-300 rounded-xs" />
                          <div
                            className="w-2 h-1 rounded-xs"
                            style={{ backgroundColor: currentAccent.colorHex }}
                          />
                        </div>
                        <div className="flex-1 bg-white rounded-md border border-slate-200/60 p-1 flex flex-col gap-0.5">
                          <div className="w-full h-1 bg-slate-200 rounded-xs" />
                          <div className="w-2/3 h-1 bg-slate-200 rounded-xs" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Label Bawah + Checkmark Indicator */}
                  <div className="flex items-center justify-between mt-2.5 px-0.5">
                    <div className="flex items-center gap-1.5">
                      <Sun
                        size={13}
                        className={mode === 'light' ? 'text-primary' : 'text-slate-400'}
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Terang
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                        mode === 'light'
                          ? 'bg-primary border-primary text-white shadow-2xs'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {mode === 'light' && <Check size={10} strokeWidth={3} />}
                    </div>
                  </div>
                </button>

                {/* 2. KARTU PREVIEW MODE GELAP */}
                <button
                  type="button"
                  onClick={() => setMode('dark')}
                  className={`group relative flex flex-col p-2 rounded-2xl border text-left transition-all cursor-pointer [touch-action:manipulation] ${
                    mode === 'dark'
                      ? 'border-primary ring-2 ring-primary/20 bg-primary-subtle/30 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Mini Window Mockup Gelap */}
                  <div
                    data-theme-preview="dark"
                    className="w-full h-20 rounded-xl bg-slate-950 p-1.5 flex flex-col gap-1 border border-slate-800 shadow-2xs overflow-hidden"
                  >
                    {/* Window Titlebar */}
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: currentAccent.colorHex }}
                      />
                    </div>

                    {/* Window Layout (Sidebar + Main) */}
                    <div className="flex-1 flex gap-1.5 overflow-hidden">
                      {/* Mini Sidebar */}
                      <div className="w-1/3 h-full bg-slate-900 rounded-md p-1 flex flex-col gap-1 border border-slate-800/80 shadow-2xs">
                        <div
                          className="w-full h-1.5 rounded-xs"
                          style={{ backgroundColor: currentAccent.colorHex }}
                        />
                        <div className="w-3/4 h-1 bg-slate-800 rounded-xs" />
                        <div className="w-1/2 h-1 bg-slate-800 rounded-xs" />
                      </div>

                      {/* Mini Main Area */}
                      <div className="flex-1 h-full flex flex-col gap-1">
                        <div className="h-3 bg-slate-900 rounded-md border border-slate-800/80 p-0.5 flex items-center justify-between">
                          <div className="w-6 h-1 bg-slate-700 rounded-xs" />
                          <div
                            className="w-2 h-1 rounded-xs"
                            style={{ backgroundColor: currentAccent.colorHex }}
                          />
                        </div>
                        <div className="flex-1 bg-slate-900 rounded-md border border-slate-800/80 p-1 flex flex-col gap-0.5">
                          <div className="w-full h-1 bg-slate-800 rounded-xs" />
                          <div className="w-2/3 h-1 bg-slate-800 rounded-xs" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Label Bawah + Checkmark Indicator */}
                  <div className="flex items-center justify-between mt-2.5 px-0.5">
                    <div className="flex items-center gap-1.5">
                      <Moon
                        size={13}
                        className={mode === 'dark' ? 'text-primary' : 'text-slate-400'}
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Gelap
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                        mode === 'dark'
                          ? 'bg-primary border-primary text-white shadow-2xs'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {mode === 'dark' && <Check size={10} strokeWidth={3} />}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Bagian 2: Pemilihan Aksen Warna */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                  Aksen Warna
                </label>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {currentAccent.name}{' '}
                  <span className="text-slate-400 font-normal">({currentAccent.label})</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {ACCENT_OPTIONS.map((item) => {
                  const isSelected = accent === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAccent(item.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs transition-all cursor-pointer [touch-action:manipulation] text-left ${
                        isSelected
                          ? 'border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-800/90 font-bold text-slate-900 dark:text-white shadow-2xs ring-1 ring-slate-300 dark:ring-slate-600'
                          : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.colorHex }}
                      >
                        {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
  );
}
