import { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { popoverVariants } from '@/lib/animations';
import {
  Menu,
  Bell,
  Sparkles,
  ChevronDown,
  WifiOff,
  LogIn,
  LogOut,
  User as UserIcon,
  Crown,
} from 'lucide-react';
import { ThemeSelector } from '@/components/ui/ThemeSelector';
import { useSidebarStore } from '@/stores/useSidebarStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { getUserTier, authService } from '@/features/auth/services/authService';
import { usePengingatNotifications } from '@/features/pengingat/hooks/usePengingat';
import { PengingatNotificationList } from '@/features/pengingat/components/PengingatNotificationList';

export default function Navbar({ sidebarToggleRef }: { sidebarToggleRef: React.RefObject<HTMLButtonElement | null> }) {
  const navigate = useNavigate();

  // Mengambil action toggle sidebar dari global store Zustand
  const { toggleCollapse, toggleMobile } = useSidebarStore();

  // Mengambil status autentikasi dan data pengguna dari Auth Store
  const { user, isAuthenticated } = useAuthStore();

  // Sinkronisasi status langganan aktif dari tabel store_purchases saat pengguna membuka aplikasi
  useEffect(() => {
    if (isAuthenticated) {
      authService.syncUserSubscription().catch(() => {});
    }
  }, [isAuthenticated]);

  // Menghitung status tier tampilan antarmuka (Admin | Premium | Free)
  // Berdasarkan kueri tabel store_purchases tanpa merusak peran backend (guest/member/admin)
  const userTier = useMemo(() => {
    if (!user) return 'Free';
    return getUserTier(user.role, user.isPremium, user.premiumExpiresAt);
  }, [user]);

  // State untuk dropdown menu profil akun pengguna
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // State untuk melacak status koneksi internet (fe_strategy.md Bagian 8.4: Graceful Offline)
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // State untuk popover notifikasi pengingat pribadi
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const notifications = usePengingatNotifications();
  const unreadNotifications = notifications.data?.unread ?? 0;

  /**
   * Helper untuk mengambil 1-2 huruf inisial dari nama pengguna jika avatar belum tersedia
   */
  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  /**
   * Listener event online/offline browser untuk menampilkan indikator mode offline
   */
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Menutup popover notifikasi saat pengguna mengklik di luar area popover
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  /**
   * Menutup dropdown menu profil pengguna saat mengklik di luar area menu
   */
  useEffect(() => {
    const handleClickOutsideUserMenu = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutsideUserMenu);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideUserMenu);
    };
  }, [showUserMenu]);

  /**
   * Handler tombol hamburger (responsive drawer di mobile vs mini-rail di desktop)
   */
  const handleToggleSidebar = () => {
    if (!window.matchMedia('(min-width: 64rem)').matches) {
      toggleMobile();
    } else {
      toggleCollapse();
    }
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. CONTAINER NAVBAR UTAMA (STICKY TOP HEADER)             */}
      {/* Mengikuti standar AGENTS.md Bagian 5.2:                    */}
      {/* Tinggi h-18 (72px), backdrop blur, border-slate-200/80    */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-30 h-18 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 select-none transition-colors">
        {/* ========================================================= */}
        {/* SISI KIRI: TOMBOL HAMBURGER TOGGLE SIDEBAR                */}
        {/* Target sentuh min 44x44px & touch-action: manipulation    */}
        {/* ========================================================= */}
        <div className="flex items-center gap-3">
          <button
            ref={sidebarToggleRef}
            type="button"
            onClick={handleToggleSidebar}
            className="min-w-11 min-h-11 flex items-center justify-center p-2 text-slate-600 dark:text-slate-300 hover:text-[#0f172a] dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 active:scale-95 rounded-xl transition-all cursor-pointer [touch-action:manipulation]"
            title="Buka / Tutup Sidebar Navigasi"
            aria-label="Toggle Sidebar"
            aria-controls="site-sidebar"
          >
            <Menu size={22} />
          </button>

          {/* Indikator Mode Offline (AGENTS.md Bagian 5.2 Offline Mode Pill) */}
          {!isOnline && (
            <div
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-full shadow-2xs"
              title="Koneksi terputus. Aplikasi menggunakan data cache lokal."
            >
              <WifiOff size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Mode Offline</span>
              <span className="text-[10px] text-amber-600 sm:hidden">Offline</span>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SISI KANAN: TOMBOL AKSI, NOTIFIKASI & PROFIL PENGGUNA     */}
        {/* ========================================================= */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Tombol Badge "★ Premium" (Pill Dinamis Mengikuti Aksen Tema Aktif) */}
          <button
            type="button"
            onClick={() => navigate('/premium')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-subtle hover:bg-primary-light/50 dark:hover:bg-primary-border/25 active:scale-95 text-primary-text text-xs font-bold rounded-full border border-primary-border transition-all shadow-2xs cursor-pointer [touch-action:manipulation]"
            title="Fitur Premium & Donasi Komunitas"
          >
            <Sparkles size={14} className="text-primary-text fill-primary/20 shrink-0" />
            <span className="font-bold">Premium</span>
          </button>

          {/* Tombol Pemilih Tema & Aksen Warna (Menggantikan Fullscreen) */}
          <ThemeSelector />

          {/* ======================================================= */}
          {/* TOMBOL LONCENG NOTIFIKASI PENGINGAT PRIBADI    */}
          {/* ======================================================= */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="min-w-11 min-h-11 flex items-center justify-center p-2 text-slate-600 dark:text-slate-300 hover:text-[#0f172a] dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 active:scale-95 rounded-xl transition-all cursor-pointer relative [touch-action:manipulation]"
              title="Notifikasi pengingat pribadi"
              aria-label={unreadNotifications ? `Lihat ${unreadNotifications} notifikasi belum dibaca` : 'Lihat notifikasi pengingat'}
              aria-expanded={showNotifications}
            >
              <Bell size={18} />

              {unreadNotifications > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold tabular-nums inline-flex items-center justify-center ring-2 ring-white dark:ring-slate-900">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}
            </button>

            {/* POPOVER NOTIFIKASI PENGINGAT (AGENTS.md Bagian 5.2: w-80 sm:w-96) */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  key="notification-popover"
                  variants={popoverVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="fixed top-20 left-4 w-[calc(100vw-2rem)] max-h-[calc(100dvh-5.5rem)] overflow-y-auto sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 z-50 select-none"
                >
                  <PengingatNotificationList onClose={() => setShowNotifications(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

          {/* Garis Pembatas Vertikal Halus */}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          {/* ======================================================= */}
          {/* BLOK OTENTIKASI & PROFIL PENGGUNA DINAMIS               */}
          {/* - Jika Belum Masuk: Tampilkan Tombol "Masuk"            */}
          {/* - Jika Sudah Masuk: Tampilkan Foto, Nama, Status & Menu */}
          {/* ======================================================= */}
          {!isAuthenticated || !user ? (
            /* TOMBOL "MASUK" (Kondisi Belum Login / Tamu) */
            <NavLink
              to="/login"
              className="h-10 px-3.5 sm:px-4.5 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer [touch-action:manipulation]"
              title="Masuk ke Akun Anda"
            >
              <LogIn size={16} className="shrink-0" />
              <span>Masuk</span>
            </NavLink>
          ) : (
            /* WIDGET PROFIL PENGGUNA DENGAN DROPDOWN (Kondisi Sudah Login) */
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors cursor-pointer group [touch-action:manipulation]"
                title="Buka Menu Akun Pengguna"
                aria-label="Menu Akun Pengguna"
              >
                {/* Foto Profil: Gambar Asli jika ada URL, atau Inisial jika tidak ada */}
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-border shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ring-2 ring-primary-border">
                    {getInitials(user.name)}
                  </div>
                )}

                {/* Nama dan Status Pengguna */}
                <div className="hidden md:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-[#0f172a] dark:text-slate-100 group-hover:text-primary transition-colors truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider truncate max-w-[120px] flex items-center gap-1 ${
                      userTier === 'Admin'
                        ? 'text-slate-700'
                        : userTier === 'Premium'
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {userTier === 'Premium' && <Crown size={11} className="text-amber-500 shrink-0" />}
                    {userTier}
                  </span>
                </div>

                {/* Panah Indikator Dropdown */}
                <ChevronDown
                  size={14}
                  className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-150 hidden md:block ${
                    showUserMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Popover Dropdown Akun Pengguna */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    key="user-menu-popover"
                    variants={popoverVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 mt-2 w-60 sm:w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden z-50 select-none"
                  >
                    {/* Header Profil Ringkas */}
                  <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-border shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ring-2 ring-primary-border">
                        {getInitials(user.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-[#0f172a] dark:text-slate-100 truncate">
                        {user.name}
                      </h5>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                        {user.username ? `@${user.username}` : user.email || 'Akun Aktif'}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase tracking-wider border shadow-2xs ${
                          userTier === 'Admin'
                            ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                            : userTier === 'Premium'
                            ? 'bg-gradient-to-r from-amber-50 to-amber-100/70 dark:from-amber-950/40 dark:to-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {userTier === 'Premium' && <Crown size={10} className="text-amber-600 shrink-0" />}
                        {userTier === 'Free' && <Sparkles size={10} className="text-slate-400 shrink-0" />}
                        {userTier}
                      </span>
                    </div>
                  </div>

                  {/* Menu Navigasi Profil */}
                  <div className="p-1.5 space-y-0.5">
                    <NavLink
                      to="/login"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-[#0f172a] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors [touch-action:manipulation]"
                    >
                      <UserIcon size={15} className="text-slate-400 shrink-0" />
                      <span>Profil & Pengaturan Akun</span>
                    </NavLink>
                  </div>

                  {/* Footer: Tombol Keluar (Logout) */}
                  <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30">
                    <button
                      type="button"
                      onClick={() => {
                        authService.logout().catch(() => {});
                        setShowUserMenu(false);
                        useAlertStore.getState().showAlert('Berhasil logout!');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer [touch-action:manipulation]"
                    >
                      <LogOut size={15} className="shrink-0 text-rose-500" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      </header>

    </>
  );
}
