import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';
export type ThemeAccent = 'teal' | 'orange' | 'blue' | 'amber' | 'rose' | 'purple' | 'emerald';

export interface AccentOption {
  id: ThemeAccent;
  name: string;
  label: string;
  colorHex: string;
  bgClass: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: 'teal', name: 'Teal', label: 'Tradisi', colorHex: '#0d9488', bgClass: 'bg-[#0d9488]' },
  { id: 'orange', name: 'Orange', label: 'Surya', colorHex: '#ea580c', bgClass: 'bg-[#ea580c]' },
  { id: 'blue', name: 'Blue', label: 'Samudra', colorHex: '#2563eb', bgClass: 'bg-[#2563eb]' },
  { id: 'amber', name: 'Amber', label: 'Sakral', colorHex: '#d97706', bgClass: 'bg-[#d97706]' },
  { id: 'rose', name: 'Rose', label: 'Merona', colorHex: '#e11d48', bgClass: 'bg-[#e11d48]' },
  { id: 'purple', name: 'Purple', label: 'Brahmana', colorHex: '#9333ea', bgClass: 'bg-[#9333ea]' },
];

const normalizeAccent = (accent: unknown): ThemeAccent => {
  if (accent === 'emerald') return 'orange';
  return ACCENT_OPTIONS.some((a) => a.id === accent) ? (accent as ThemeAccent) : 'teal';
};

interface ThemeState {
  mode: ThemeMode;
  accent: ThemeAccent;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: ThemeAccent) => void;
  toggleMode: () => void;
}

/**
 * Menjalankan perubahan tema dengan animasi transisi halus (View Transitions API jika didukung)
 */
const runWithTransition = (fn: () => void) => {
  if (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    typeof (document as unknown as { startViewTransition?: (cb: () => void) => void }).startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
      fn();
    });
  } else {
    fn();
  }
};

/**
 * Menerapkan class .dark dan atribut data-accent ke elemen <html>
 */
export const applyThemeToDOM = (mode: ThemeMode, accent: ThemeAccent) => {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const isDark = mode === 'dark';
  const validAccent = normalizeAccent(accent);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  root.setAttribute('data-accent', validAccent);
  root.setAttribute('data-mode', isDark ? 'dark' : 'light');
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      accent: 'teal',

      setMode: (mode) => {
        set({ mode });
        runWithTransition(() => {
          applyThemeToDOM(mode, get().accent);
        });
      },

      setAccent: (accent) => {
        const validAccent = normalizeAccent(accent);
        set({ accent: validAccent });
        runWithTransition(() => {
          applyThemeToDOM(get().mode, validAccent);
        });
      },

      toggleMode: () => {
        const nextMode: ThemeMode = get().mode === 'dark' ? 'light' : 'dark';
        set({ mode: nextMode });
        runWithTransition(() => {
          applyThemeToDOM(nextMode, get().accent);
        });
      },
    }),
    {
      name: 'kalenderbali-theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const validMode: ThemeMode = state.mode === 'dark' ? 'dark' : 'light';
          const validAccent = normalizeAccent(state.accent);
          applyThemeToDOM(validMode, validAccent);
        } else {
          applyThemeToDOM('light', 'teal');
        }
      },
    }
  )
);

// Inisialisasi awal sinkron saat modul dimuat untuk menghindari flicker
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('kalenderbali-theme-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state) {
        const initialMode: ThemeMode = parsed.state.mode === 'dark' ? 'dark' : 'light';
        const initialAccent = normalizeAccent(parsed.state.accent);
        applyThemeToDOM(initialMode, initialAccent);
      }
    } else {
      applyThemeToDOM('light', 'teal');
    }
  } catch {
    applyThemeToDOM('light', 'teal');
  }
}
