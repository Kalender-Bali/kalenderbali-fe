import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, BadgeCheck, LogOut, Pencil } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AppDialog } from '@/components/ui/AppDialog';
import { authService } from '@/features/auth/services/authService';
import { premiumApi } from '@/features/premium/api/premiumApi';
import { useReadQuery } from '@/lib/useReadQuery';
import { useAuthQueryScope, useAuthStore, type AuthUser } from '@/stores/useAuthStore';
import { ProfileContributor } from '../components/ProfileContributor';

const card = 'min-w-0 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-slate-900';
const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 dark:bg-primary dark:text-slate-950';
const secondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800';
const field = 'mt-1.5 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const dateFormatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Makassar' });

export default function ProfilePage() {
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  // Form dan pesan dari sesi lama tidak boleh muncul pada akun berikutnya.
  return user && token ? <ProfileContent key={token} user={user} token={token} /> : null;
}

function ProfileContent({ user, token }: { user: AuthUser; token: string }) {
  const navigate = useNavigate();
  const scope = useAuthQueryScope();
  const [dialog, setDialog] = useState<'edit' | 'logout' | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState('');
  const profile = useReadQuery({
    queryKey: ['profile', scope],
    queryFn: () => authService.getProfile(token),
    meta: { authScoped: true },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const profileData = profile.data;
  useEffect(() => {
    if (!profileData || useAuthStore.getState().token !== token) return;
    const { name, phone, role, contribution_status, avatar } = profileData;
    useAuthStore.getState().updateUser({ name, phone, role, contributionStatus: contribution_status, avatar });
  }, [profileData, token]);

  const membership = useReadQuery({
    queryKey: ['subscription', 'my-active-product', scope],
    queryFn: premiumApi.getMyActiveSubscription,
    meta: { authScoped: true },
    staleTime: 5 * 60 * 1000,
  });

  const role = user.role.trim().toLowerCase();
  const admin = role === 'admin';
  const contributor = role === 'contributor' || role === 'member';
  const paid = membership.data?.is_premium === true;
  const membershipLabel = admin ? 'Benefit Admin Aktif' : contributor ? 'Contributor Aktif'
    : membership.isError ? 'Status belum tersedia' : paid ? 'Premium Aktif'
      : membership.data ? 'Akun Gratis' : 'Memuat status…';
  const activeUntil = membership.data?.active_until ? Date.parse(membership.data.active_until) : NaN;
  const initials = user.name.trim().split(/\s+/);
  const avatarText = initials.length > 1 ? initials.slice(0, 2).map(word => word[0]).join('') : user.name.trim().slice(0, 2);

  function openEdit() {
    setFormError('');
    setDialog('edit');
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get('name') ?? '').trim();
    const phone = String(fields.get('phone') ?? '').trim();
    if (!name) { setFormError('Nama lengkap wajib diisi.'); return; }
    if (phone && !/^\+?[0-9]{8,15}$/.test(phone.replace(/[\s-]/g, ''))) {
      setFormError('Masukkan nomor telepon yang valid.');
      return;
    }
    setFormError('');
    setBusy(true);
    try {
      await authService.updateProfile({ name, phone });
      if (useAuthStore.getState().token !== token) return;
      // Server sudah menyimpan nilai ini, meski pembacaan ulang masih berjalan.
      useAuthStore.getState().updateUser({ name, phone });
      setFeedback('Profil berhasil diperbarui.');
      setDialog(null);
      void profile.refetch();
    } catch (error) {
      if (useAuthStore.getState().token !== token) return;
      setFormError(error instanceof Error ? error.message : 'Gagal menyimpan profil.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (busy) return;
    setBusy(true);
    await authService.logout();
    navigate('/', { replace: true });
  }

  const closeDialog = () => { if (!busy) setDialog(null); };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-5">
      <header className="space-y-1.5">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:underline">Wargabali</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-bold text-teal-700 dark:text-teal-400">Profil</span>
        </nav>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-slate-100">Profil</h1>
      </header>

      {/* Identitas dan kontak menjadi bagian utama halaman akun. */}
      <section aria-label="Informasi akun" className={card}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div aria-hidden="true" className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border border-primary-border bg-primary-light text-base font-extrabold text-teal-700 sm:size-14 dark:text-teal-400">
              {avatarText.toUpperCase()}
              {user.avatarUrl && (
                <img src={user.avatarUrl} alt="" width={56} height={56}
                  className="absolute inset-0 size-full object-cover"
                  onError={event => { event.currentTarget.hidden = true; }} />
              )}
            </div>
            <h2 className="min-w-0 wrap-anywhere text-lg font-extrabold text-slate-900 sm:text-xl dark:text-slate-100">{user.name}</h2>
          </div>
          <button type="button" className={secondary} onClick={openEdit}>
            <Pencil size={16} aria-hidden="true" /> Edit Profil
          </button>
        </div>
        <dl className="mt-5 grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-2 sm:gap-6 dark:border-slate-800">
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email</dt>
            <dd className="mt-1 wrap-anywhere font-semibold">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nomor Telepon</dt>
            <dd className="mt-1 wrap-anywhere font-semibold">{user.phone || 'Belum diisi'}</dd>
          </div>
        </dl>
        {feedback && <p role="status" className="mt-3 text-sm font-medium text-teal-700 dark:text-teal-400">{feedback}</p>}
        {profile.isError && (
          <p role="status" className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Profil terbaru belum berhasil dimuat.{' '}
            <button type="button" className="font-semibold underline" onClick={() => void profile.refetch()}>Muat ulang profil</button>
          </p>
        )}
      </section>

      {/* Status dan aksi terkait akun punya tinggi sesuai isinya. */}
      <section className={card} aria-label="Keanggotaan dan Contributor">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <div className="flex min-w-0 items-start gap-3">
            <BadgeCheck aria-hidden="true" size={21} className="mt-0.5 shrink-0 text-teal-700 dark:text-teal-400" />
            <div className="min-w-0 space-y-1">
              <h2 className="text-base font-extrabold">Keanggotaan</h2>
              <p className="text-sm font-semibold">{membershipLabel}</p>
              {(admin || contributor || membership.data) && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{admin || contributor || paid ? 'Bebas Iklan Aktif' : 'Akses standar'}</p>
              )}
              {membership.data?.active_product && <p className="wrap-anywhere text-sm">{membership.data.active_product}</p>}
              {Number.isFinite(activeUntil) && <p className="text-sm tabular-nums">Berlaku hingga {dateFormatter.format(activeUntil)} WITA</p>}
              {membership.isError && <button type="button" className="text-sm font-semibold underline" onClick={() => void membership.refetch()}>Coba lagi</button>}
            </div>
          </div>
          <Link className={secondary} to="/premium">Lihat keanggotaan <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <div id="contributor" className="mt-4 scroll-mt-24 border-t border-slate-200 pt-4 dark:border-slate-800">
          <ProfileContributor admin={admin} contributor={contributor} actionClassName={secondary} />
        </div>
      </section>

      <div className="flex justify-end">
        <button type="button" className={secondary} onClick={() => setDialog('logout')}>
          <LogOut size={16} aria-hidden="true" /> Keluar
        </button>
      </div>

      {dialog === 'edit' && (
        <AppDialog title="Edit Profil" description="Perbarui nama lengkap dan nomor telepon Anda."
          focusField onClose={closeDialog} footer={
            <>
              <button type="button" className={secondary} disabled={busy} onClick={closeDialog}>Batal</button>
              <button type="submit" form="profile-edit" className={primary} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan Perubahan'}</button>
            </>
          }>
          <form id="profile-edit" className="space-y-4" onSubmit={save}>
            <label className="block text-sm font-semibold">Nama Lengkap
              <input name="name" className={field} defaultValue={user.name} autoComplete="name" required />
            </label>
            <label className="block text-sm font-semibold">Nomor Telepon
              <input name="phone" className={field} defaultValue={user.phone ?? ''} autoComplete="tel" type="tel" />
            </label>
            <p className="text-sm text-slate-500 dark:text-slate-400">Email akun <span className="wrap-anywhere font-semibold">{user.email}</span></p>
            {formError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{formError}</p>}
          </form>
        </AppDialog>
      )}
      {dialog === 'logout' && (
        <AppDialog title="Keluar dari Akun" description="Anda perlu masuk kembali untuk mengakses profil."
          onClose={closeDialog} footer={
            <>
              <button type="button" className={secondary} disabled={busy} onClick={closeDialog}>Batal</button>
              <button type="button" className="min-h-11 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white disabled:opacity-50"
                disabled={busy} onClick={() => void logout()}>{busy ? 'Keluar…' : 'Keluar'}</button>
            </>
          }>{null}</AppDialog>
      )}
    </div>
  );
}
