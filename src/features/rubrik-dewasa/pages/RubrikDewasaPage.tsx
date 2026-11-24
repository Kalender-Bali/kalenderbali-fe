import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DataSkeleton } from '@/components/ui/DataSkeleton';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { useAuthQueryScope, useAuthStore } from '@/stores/useAuthStore';
import { deleteRubrik, RUBRIK_PAGE_SIZE } from '../api/rubrikDewasaApi';
import { RubrikDeleteDialog } from '../components/RubrikDeleteDialog';
import { rubrikInput, rubrikLabel, rubrikPanel, rubrikPrimary, rubrikSecondary } from '../components/rubrikStyles';
import { useRubrikList, useRubrikMutation } from '../hooks/useRubrikDewasa';
import type { RubrikDewasa, RubrikNavigationState } from '../types/rubrikDewasa.types';
import { ProfileContributor } from '@/features/profile/components/ProfileContributor';
import { canAuthorRubrik } from '../utils/rubrikAccess';

export default function RubrikDewasaPage({ mine = false }: { mine?: boolean }) {
  const canAuthor = useAuthStore((state) => state.isAuthenticated && canAuthorRubrik(state.user?.role));
  const scope = useAuthQueryScope();
  const { state } = useLocation();
  const catalogSearch = (state as RubrikNavigationState | null)?.catalogSearch ?? '';
  if (mine && !canAuthor) return <Navigate to={`/rubrik-dewasa${catalogSearch}`} replace />;
  return <RubrikCatalog key={mine ? scope : 'public'} mine={mine} canAuthor={canAuthor} />;
}

function RubrikCatalog({ mine, canAuthor }: { mine: boolean; canAuthor: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const rawPage = Number(params.get('page'));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= Math.floor(Number.MAX_SAFE_INTEGER / RUBRIK_PAGE_SIZE) ? rawPage : 1;
  const query = useRubrikList(search, page, mine);
  const deletion = useRubrikMutation(deleteRubrik);
  const [showContributor, setShowContributor] = useState(() => new URLSearchParams(location.search).has('contributor_action') && !canAuthor);
  // Lanjutkan aksi sekali setelah login dengan izin akun terbaru.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has('contributor_action')) return;
    params.delete('contributor_action');
    if (canAuthor) navigate('/rubrik-dewasa/buat', { replace: true, state: { catalogSearch: params.toString() ? `?${params}` : '' } });
    else setParams(params, { replace: true });
  }, [canAuthor, location.search, navigate, setParams]);
  const [toDelete, setToDelete] = useState<RubrikDewasa | null>(null);
  const lastPage = Math.max(1, Math.ceil((query.data?.total ?? 0) / RUBRIK_PAGE_SIZE));
  const title = mine ? 'Rubrik Saya' : 'Rubrik Dewasa Ayu';
  const catalogSearch = mine
    ? (location.state as RubrikNavigationState | null)?.catalogSearch ?? ''
    : location.search;
  const navState: RubrikNavigationState = { catalogSearch, mySearch: mine ? location.search : undefined };

  function update(nextSearch: string, nextPage: number) {
    const next = new URLSearchParams();
    if (nextSearch) next.set('q', nextSearch);
    if (nextPage > 1) next.set('page', String(nextPage));
    setParams(next, { state: location.state });
  }

  // Daftar yang berkurang, misalnya setelah hapus, kembali ke halaman yang masih ada.
  useEffect(() => {
    if (!query.isSuccess || query.isLoading || page <= lastPage) return;
    const valid = new URLSearchParams(location.search);
    if (lastPage === 1) valid.delete('page');
    else valid.set('page', String(lastPage));
    setParams(valid, { replace: true, state: location.state });
  }, [lastPage, location.search, location.state, page, query.isLoading, query.isSuccess, setParams]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5">
          <nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-500">
            Wargabali / Layanan / {mine ? <Link to={`/rubrik-dewasa${catalogSearch}`} className="text-teal-700 dark:text-teal-300">Rubrik Dewasa Ayu</Link> : title}
            {mine && ' / Rubrik Saya'}
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">{title}</h1>
          {!mine && <p className="text-sm text-slate-500 dark:text-slate-400">Telusuri kriteria padewasan dan temukan tanggal yang sesuai.</p>}
        </div>
        {!canAuthor && !mine && <button type="button" className={rubrikPrimary} onClick={() => setShowContributor(true)}>Buat Rubrik</button>}
        {canAuthor && (
          <div className="flex flex-wrap gap-2">
            {mine
              ? <Link to={`/rubrik-dewasa${catalogSearch}`} className={rubrikSecondary}>Katalog Rubrik</Link>
              : <Link to="/rubrik-dewasa/saya" state={navState} className={rubrikSecondary}>Rubrik Saya</Link>}
            <Link to="/rubrik-dewasa/buat" state={navState} className={rubrikPrimary}>Buat Rubrik</Link>
          </div>
        )}
      </header>

      {showContributor && <ProfileContributor gate admin={false} contributor={false} actionClassName={rubrikSecondary} onClose={() => setShowContributor(false)} />}
      <section className={rubrikPanel}>
        <form className="flex items-end gap-2" role="search" onSubmit={(event) => {
          event.preventDefault();
          update(String(new FormData(event.currentTarget).get('q') ?? '').trim(), 1);
        }}>
          <div className="min-w-0 flex-1">
            <label htmlFor="rubrik-search" className={rubrikLabel}>Cari rubrik</label>
            <input id="rubrik-search" name="q" key={search} defaultValue={search} placeholder="Cari rubrik padewasan" className={`${rubrikInput} h-11`} />
          </div>
          <button className={rubrikPrimary}>Cari</button>
        </form>

        {query.isLoading && !query.data && <div className="mt-5"><DataSkeleton label="Memuat rubrik…" className="h-28" /></div>}
        {query.isError && (
          <div className="mt-5">
            <QueryErrorState title="Gagal memuat rubrik" error={query.error} onRetry={() => void query.refetch()} />
            {page > 1 && <button type="button" className={`mt-3 ${rubrikSecondary}`} onClick={() => update(search, page - 1)}>Halaman sebelumnya</button>}
          </div>
        )}
        {query.data && (
          <div className="mt-5 space-y-5" aria-busy={query.isLoading}>
            {query.data.data.length > 0 && (
              <ul className="grid gap-4 md:grid-cols-2">
                {query.data.data.map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-700">
                    <Link to={`/rubrik-dewasa/${item.id}${location.search}`} state={navState}
                      className="block rounded-xl p-5 hover:bg-teal-50/60 focus-visible:outline-2 focus-visible:outline-teal-600 dark:hover:bg-slate-800">
                      <h2 className="font-bold text-slate-900 dark:text-white">{item.nama}</h2>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.author_name || 'Kontributor'} · <span className="tabular-nums">{item.comment_count} komentar</span></p>
                      {item.deskripsi && <p className="mt-3 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{item.deskripsi}</p>}
                    </Link>
                    {mine && (
                      <div className="flex flex-wrap gap-2 px-5 pb-5">
                        <Link to={`/rubrik-dewasa/${item.id}/ubah`} state={navState} className={rubrikSecondary}>Ubah</Link>
                        <button type="button" className={`${rubrikSecondary} text-rose-700 dark:text-rose-300`}
                          onClick={() => { deletion.reset(); setToDelete(item); }}>Hapus</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!query.data.data.length && <p className="text-sm text-slate-500 dark:text-slate-400">{mine && !search && page === 1 ? 'Anda belum membuat rubrik.' : 'Belum ada rubrik yang sesuai.'}</p>}
            <nav aria-label="Halaman rubrik" className="flex flex-wrap items-center gap-3 text-sm">
              <button type="button" disabled={query.isLoading || page === 1} onClick={() => update(search, page - 1)} className={rubrikSecondary}>Sebelumnya</button>
              <span className="tabular-nums">Halaman {page}</span>
              <button type="button" disabled={query.isLoading || page >= lastPage} onClick={() => update(search, page + 1)} className={rubrikSecondary}>Berikutnya</button>
            </nav>
          </div>
        )}
      </section>

      {toDelete && (
        <RubrikDeleteDialog title="Hapus rubrik?" description={`Rubrik “${toDelete.nama}” beserta komentarnya akan dihapus.`}
          pending={deletion.isPending} error={deletion.error} onClose={() => setToDelete(null)}
          onDelete={() => deletion.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })} />
      )}
    </div>
  );
}
