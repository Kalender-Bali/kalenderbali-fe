import { useLayoutEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import { useSidebarStore } from '@/stores/useSidebarStore';

export default function AppLayout() {
  // Mengambil state isCollapsed dari store agar margin konten utama
  // bisa menyesuaikan secara otomatis saat sidebar menciut atau melebar
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebarStore();
  const sidebarRef = useRef<HTMLElement>(null);
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);
  const restoreSidebarFocus = useRef(false);

  useLayoutEffect(() => {
    if (!isMobileOpen) {
      if (restoreSidebarFocus.current) {
        restoreSidebarFocus.current = false;
        sidebarToggleRef.current?.focus({ preventScroll: true });
      }
      return;
    }
    const drawer = sidebarRef.current;
    if (!drawer) return;
    const desktop = window.matchMedia('(min-width: 64rem)');
    if (desktop.matches) {
      closeMobile();
      return;
    }
    const closeOnDesktop = () => { if (desktop.matches) closeMobile(); };
    restoreSidebarFocus.current = true;
    drawer.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobile();
      } else if (event.key === 'Tab') {
        const items = Array.from(drawer.querySelectorAll<HTMLElement>('a[href], button'))
          .filter(item => !item.closest('[inert]') && item.getClientRects().length > 0);
        const first = items[0];
        const last = items.at(-1);
        const active = document.activeElement;
        if (event.shiftKey ? active === first || active === drawer : active === last) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }
    };

    desktop.addEventListener('change', closeOnDesktop);
    drawer.addEventListener('keydown', onKeyDown);
    return () => {
      desktop.removeEventListener('change', closeOnDesktop);
      drawer.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileOpen, closeMobile]);

  return (
    <div className="min-h-screen bg-[#f4f7f6] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex font-sans antialiased transition-colors duration-200">
      {/* ========================================================= */}
      {/* 1. SIDEBAR NAVIGASI KIRI                                 */}
      {/* Mengatur navigasi modul, sub-menu, serta drawer mobile   */}
      {/* ========================================================= */}
      <Sidebar sidebarRef={sidebarRef} />

      {/* ========================================================= */}
      {/* 2. AREA KONTEN KANAN (NAVBAR + HALAMAN AKTIF + FOOTER)    */}
      {/* Padding kiri (pl) disesuaikan secara dinamis:            */}
      {/* - Di mobile (< 1024px): pl-0 (sidebar berupa overlay)    */}
      {/* - Di desktop saat ciut: lg:pl-20 (80px)                  */}
      {/* - Di desktop saat penuh: lg:pl-64 (256px)                */}
      {/* ========================================================= */}
      <div
        inert={isMobileOpen}
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Header / Top Navbar (Hamburger, aksi, notifikasi, profil) */}
        <Navbar sidebarToggleRef={sidebarToggleRef} />

        {/* Konten Utama Halaman (Tempat komponen halaman dari <Outlet /> ditampilkan) */}
        <main className="flex-1 w-full max-w-[1560px] mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Footer Aplikasi Mandiri Sesuai Desain Mockup */}
        <Footer />
      </div>
    </div>
  );
}
