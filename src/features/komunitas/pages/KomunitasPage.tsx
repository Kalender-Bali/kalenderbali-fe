import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthQueryScope, useAuthStore } from '@/stores/useAuthStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { useKomunitasDetail, useKomunitasList, useKomunitasMutations, useKomunitasRegions, useKomunitasUrl } from '../hooks/useKomunitas';
import { canManageCommunity, canRegister, isAdmin } from '../utils/komunitasUtils';
import { KomunitasHero } from '../components/KomunitasHero';
import { KomunitasFilter } from '../components/KomunitasFilter';
import { KomunitasList } from '../components/KomunitasList';
import { KomunitasDetailModal } from '../components/KomunitasDetailModal';
import { KomunitasFormModal } from '../components/KomunitasFormModal';
import { KomunitasManagersModal } from '../components/KomunitasManagersModal';
import { KomunitasDeleteConfirmModal } from '../components/KomunitasDeleteConfirmModal';
import { KomunitasKeuanganView } from '../components/KomunitasKeuanganView';
import { KomunitasSkeleton } from '../components/KomunitasSkeleton';
import { primaryButton, secondaryButton } from '../components/komunitasStyles';

/** Pergantian akun memasang ulang workspace supaya draft/modal sesi sebelumnya dibuang. */
export default function KomunitasPage() {
  const scope = useAuthQueryScope();
  return <KomunitasWorkspace key={scope} />;
}
function KomunitasWorkspace() {
  const user = useAuthStore(state => state.user), authenticated = useAuthStore(state => state.isAuthenticated);
  const navigate = useNavigate(), location = useLocation(), url = useKomunitasUrl();
  const allowed = authenticated && canRegister(user), admin = authenticated && isAdmin(user);
  // /my mengikuti mapping setiap akun login; Pengajuan tetap mengikuti role Member/Admin.
  const tabAllowed = url.tab === 'semua' || (authenticated && (url.tab === 'saya' || canRegister(user)));
  const list = useKomunitasList(url.tab, url.filters, tabAllowed && url.view !== 'kas');
  const regions = useKomunitasRegions(url.tab, tabAllowed && url.view !== 'kas');
  const detail = useKomunitasDetail(url.id), mutations = useKomunitasMutations(url.dialog === 'create' ? undefined : url.id);
  const profile = !detail.isError ? detail.data : undefined;
  const manage = authenticated && canManageCommunity(user, profile);
  const showAlert = useAlertStore(state => state.showAlert);
  const [actionError, setActionError] = useState('');
  useEffect(() => { document.title = 'Komunitas Suka Duka — Wargabali'; }, []);
  const login = (returnPath = `${location.pathname}${location.search}`) => navigate('/login', { state: { from: { pathname: returnPath } } });
  const register = () => {
    if (!authenticated) login('/komunitas?dialog=create');
    else url.patch({ dialog: 'create', id: null, view: null });
  };
  const dialog = url.dialog;
  const closeDialog = () => url.patch({ dialog: null, ...(url.view === 'kas' ? {} : { id: null }) });
  const mutationBusy = mutations.moderate.isPending || mutations.save.isPending || mutations.remove.isPending || mutations.addManager.isPending || mutations.removeManager.isPending;

  // Detail divalidasi terlebih dahulu; URL buku kas tidak langsung dipercaya sebagai komunitas.
  if (url.view === 'kas') {
    if (!url.id) return <QueryErrorState title="ID komunitas tidak valid" onRetry={url.close} />;
    if (detail.isLoading && !profile) return <KomunitasSkeleton />;
    if (detail.isError || !profile) return <div className="space-y-4"><button type="button" onClick={url.close} className={secondaryButton}>Kembali ke daftar</button><QueryErrorState title="Buku kas belum dapat dibuka" error={detail.error} onRetry={() => void detail.refetch()} /></div>;
    return <KomunitasKeuanganView key={profile.id} profile={profile} canManage={manage} year={url.year} category={url.category} entryType={url.entryType} onFilters={url.patch} onBack={url.close} />;
  }
  return <div className="space-y-6 pb-8">
    <KomunitasHero loaded={list.items.length} countries={regions.isError || !tabAllowed ? undefined : regions.data?.countries.length} loading={list.isLoading || list.isError || !tabAllowed} onRegister={register} />
    <KomunitasFilter key={url.tab} tab={url.tab} filters={url.filters} regions={regions.data} regionsLoading={regions.isLoading} onTab={url.setTab} onFilters={url.patch} onReset={url.reset} />
    {!tabAllowed ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><h2 className="text-lg font-extrabold text-slate-900">{authenticated ? 'Akses Member diperlukan' : 'Masuk untuk melihat komunitas Anda'}</h2><p className="mt-2 mb-5 text-sm text-slate-500">{authenticated ? 'Tab ini tersedia bagi akun Member dan Admin.' : 'Kelola profil komunitas dan pantau pengajuan melalui akun Anda.'}</p>{!authenticated && <button type="button" onClick={() => login()} className={primaryButton}>Masuk ke Akun</button>}</div> : <>
      {regions.isError && <QueryErrorState title="Filter wilayah belum dapat dimuat" error={regions.error} onRetry={() => void regions.refetch()} />}
      {list.isError && <QueryErrorState title="Daftar komunitas belum dapat dimuat" error={list.error} onRetry={() => void list.refetch()} />}
      {(!list.isError || list.items.length > 0) && <KomunitasList items={list.items} loading={list.isLoading} more={!!list.hasNextPage} loadingMore={list.isFetchingNextPage} onMore={() => void list.fetchNextPage()} onOpen={url.open} onRegister={register} filtered={Object.values(url.filters).some(Boolean)} />}
    </>}
    {dialog === 'detail' && url.id && <KomunitasDetailModal profile={profile} loading={detail.isLoading && !profile} error={detail.error} onRetry={() => void detail.refetch()} onClose={closeDialog} canManage={manage} admin={admin} onAction={action => { setActionError(''); url.patch({ dialog: action }); }} onKas={() => url.open(url.id!, 'kas')} busy={mutationBusy} actionError={actionError} onModerate={async status => {
      setActionError(''); try { await mutations.moderate.mutateAsync(status); showAlert(status === 'Published' ? 'Komunitas berhasil diterbitkan.' : 'Pengajuan komunitas ditolak.'); }
      catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Moderasi gagal.'); }
    }} />}
    {dialog === 'create' && allowed && <KomunitasFormModal key="create" admin={admin} busy={mutations.save.isPending} onClose={closeDialog} onSave={async payload => {
      const saved = await mutations.save.mutateAsync(payload); showAlert(saved.status === 'Published' ? 'Komunitas berhasil diterbitkan.' : 'Pengajuan terkirim. Anda menjadi pengelola komunitas.'); url.patch({ dialog: 'detail', id: String(saved.id), tab: saved.status === 'Published' ? null : 'pengajuan' });
    }} />}
    {dialog === 'create' && !allowed && <div role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{authenticated ? 'Pendaftaran tersedia bagi akun Member atau Admin.' : 'Silakan masuk untuk mendaftarkan komunitas.'}{!authenticated && <button type="button" className={`${secondaryButton} ml-3`} onClick={() => login('/komunitas?dialog=create')}>Masuk</button>}<button type="button" onClick={closeDialog} className={`${secondaryButton} ml-2`}>Tutup</button></div>}
    {dialog === 'edit' && profile && manage && <KomunitasFormModal key={profile.id} profile={profile} admin={admin} busy={mutations.save.isPending} onClose={() => url.patch({ dialog: 'detail' })} onSave={async payload => { await mutations.save.mutateAsync(payload); showAlert('Profil komunitas berhasil diperbarui.'); url.patch({ dialog: 'detail' }); }} />}
    {dialog === 'managers' && profile && admin && <KomunitasManagersModal profile={profile} busy={mutationBusy} onClose={() => url.patch({ dialog: 'detail' })} onAdd={async id => { await mutations.addManager.mutateAsync(id); showAlert('Pengelola berhasil ditambahkan.'); }} onRemove={async id => { await mutations.removeManager.mutateAsync(id); showAlert('Hak pengelola berhasil dicabut.'); }} />}
    {dialog === 'delete' && profile && admin && <KomunitasDeleteConfirmModal title="Hapus Komunitas?" description={`Hapus ${profile.name} beserta mapping pengelola dan seluruh riwayat kasnya? Tindakan ini tidak dapat dibatalkan.`} busy={mutations.remove.isPending} onClose={() => url.patch({ dialog: 'detail' })} onConfirm={async () => { await mutations.remove.mutateAsync(); url.close(); showAlert('Komunitas berhasil dihapus.'); }} />}
    {/* URL aksi tanpa hak atau detail yang gagal tetap memberikan jalan kembali. */}
    {['edit', 'managers', 'delete'].includes(dialog) && (!profile || (dialog === 'edit' ? !manage : !admin)) && <div role="alert" className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"><p>{detail.isLoading && !profile ? 'Memeriksa profil dan hak akses…' : detail.error instanceof Error ? detail.error.message : 'Anda tidak memiliki hak menjalankan aksi ini.'}</p><button type="button" onClick={closeDialog} className={secondaryButton}>Kembali ke daftar</button></div>}
  </div>;
}
