/**
 * ==============================================================================
 * SISTEM PRESET ANIMASI ELEGAN & SMOOTH (MOTION / REACT)
 * ==============================================================================
 * Koleksi token timing, easing, dan variants animasi yang konsisten untuk seluruh
 * aplikasi Kalender Bali. Dirancang dengan karakteristik:
 * 1. Clean & Elegan: Berbasis kurva cubic-bezier (Apple/macOS standard)
 * 2. Tenang & Tidak Berlebihan: Bebas dari efek membal (bouncy) kartun yang norak
 * 3. Ringan & 60/120 FPS: Menggunakan GPU accelerated properties (opacity & transform)
 * ==============================================================================
 */

import type { Transition, Variants } from 'motion/react';

// Kurva Easing Standar Emas (Apple/macOS Fluid Interface)
// Mulai dengan cepat dan responsif, lalu mendarat dengan sangat halus & lembut
export const EASE_SMOOTH = [0.16, 1, 0.3, 1] as const;
export const EASE_OUT = [0, 0, 0.2, 1] as const;
export const EASE_IN = [0.4, 0, 1, 1] as const;

/**
 * 1. Modal Dialog Overlay (Backdrop Blur)
 * Transisi fade-in lembut untuk latar belakang gelap saat modal dibuka/ditutup
 */
export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

/**
 * 2. Modal Dialog Content (Wadah Kartu Pop-up)
 * Muncul dari scale 0.96 & turun sedikit, lalu membesar mulus ke ukuran normal
 */
export const modalContentVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: EASE_SMOOTH,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 4,
    transition: {
      duration: 0.15,
      ease: EASE_SMOOTH,
    },
  },
};

/**
 * 3. Popover & Dropdown (Navbar Notifications, Theme Selector, Profil Menu)
 * Membuka dropdown dengan translasi mikro ke bawah yang anggun
 */
export const popoverVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -6,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: EASE_SMOOTH,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -4,
    transition: {
      duration: 0.12,
      ease: 'easeIn',
    },
  },
};

/**
 * 4. Toast Floating Alert (SuccessAlert di sudut kanan bawah)
 * Meluncur halus dari bawah dengan sedikit zoom, lalu fade-out anggun saat ditutup
 */
export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.94,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.24,
      ease: EASE_SMOOTH,
    },
  },
  exit: {
    opacity: 0,
    y: 12,
    scale: 0.96,
    transition: {
      duration: 0.18,
      ease: EASE_SMOOTH,
    },
  },
};

/**
 * 5. Tab Content Switcher
 * Transisi saat berpindah tab di Otonan, Padewasan, Jodoh, dsb.
 */
export const tabContentVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 6,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: EASE_SMOOTH,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.12,
      ease: 'easeIn',
    },
  },
};

/**
 * 6. Staggered Container & Item Fade In
 * Untuk memunculkan kartu-kartu hasil pencarian secara berurutan halus
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: EASE_SMOOTH,
    },
  },
};

/**
 * Konfigurasi transisi tap / hover standar tombol micro-interaction
 */
export const tapScaleTransition: Transition = {
  duration: 0.1,
  ease: 'easeInOut',
};

