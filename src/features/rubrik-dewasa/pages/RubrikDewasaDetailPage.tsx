import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { DataSkeleton } from '@/components/ui/DataSkeleton';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { getTodayWITA } from '@/features/kalender/utils/calendarUtils';
import { MengaturDewasaDetailModal } from '@/features/mengatur-dewasa/components/MengaturDewasaDetailModal';
import { useMengaturDewasaSearch } from '@/features/mengatur-dewasa/hooks/useMengaturDewasaQueries';
import type { DewasaDateResult } from '@/features/mengatur-dewasa/types/mengaturDewasa.types';
import { useAuthQueryScope, useAuthStore } from '@/stores/useAuthStore';
import { deleteRubrik } from '../api/rubrikDewasaApi';
import { RubrikComments } from '../components/RubrikComments';
import { RubrikDateResults } from '../components/RubrikDateResults';
import { RubrikDeleteDialog } from '../components/RubrikDeleteDialog';
import { rubrikInput, rubrikLabel, rubrikPanel, rubrikPrimary, rubrikSecondary } from '../components/rubrikStyles';
import { useRubrikDetail, useRubrikMutation } from '../hooks/useRubrikDewasa';
import type { RubrikDewasa, RubrikNavigationState } from '../types/rubrikDewasa.types';
import { canAuthorRubrik, canManageOwnedContent } from '../utils/rubrikAccess';
import { buildRubrikSearch } from '../utils/rubrikDates';

const monthFormat = new Intl.DateTimeFormat('id-ID', { month: 'long', timeZone: 'UTC' });
const dateFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Makassar' });
const months = Array.from({ length: 12 }, (_, index) => monthFormat.format(new Date(Date.UTC(2024, index, 1))));

export default function RubrikDewasaDetailPage() {
  const { id = '' } = useParams();
  const scope = useAuthQueryScope();
  const query = useRubrikDetail(id);
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return <p>Rubrik tidak ditemukan.</p>;
  if (!query.data && query.isLoading) return <DataSkeleton label="Memuat rubrik" className="h-64" />;
  if (!query.data) return <QueryErrorState title="Rubrik tidak dapat dimuat" error={query.error} onRetry={() => void query.refetch()} />;
  return <RubrikDetail key={`${id}:${scope}`} rubrik={query.data} />;
}

function RubrikDetail({ rubrik }: { rubrik: RubrikDewasa }) {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as RubrikNavigationState | null) ?? {};
  const user = useAuthStore((session) => session.isAuthenticated ? session.user : null);
  const canManage = canAuthorRubrik(user?.role) && canManageOwnedContent(user, rubrik.user_id);
  const deletion = useRubrikMutation(deleteRubrik);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const params = new URLSearchParams(location.search);
  params.delete('month');
  params.delete('year');
  const catalogSearch = state.catalogSearch ?? (params.size ? `?${params}` : '');
  const backTo = state.mySearch !== undefined ? `/rubrik-dewasa/saya${state.mySearch}` : `/rubrik-dewasa${catalogSearch}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Link to={backTo} state={state} className="text-xs font-bold text-teal-700 dark:text-teal-300">
            ← {state.mySearch !== undefined ? 'Rubrik Saya' : 'Rubrik Dewasa Ayu'}
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">{rubrik.nama}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {rubrik.author_name || 'Kontributor'}
            {rubrik.created_at && <> · <time dateTime={rubrik.created_at} className="tabular-nums">{dateFormat.format(new Date(rubrik.created_at))}</time></>}
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Link to={`/rubrik-dewasa/${rubrik.id}/ubah`} state={{ ...state, catalogSearch }} className={rubrikSecondary}>Ubah Rubrik</Link>
            <button type="button" className={`${rubrikSecondary} text-rose-700 dark:text-rose-300`}
              onClick={() => { deletion.reset(); setConfirmDelete(true); }}>Hapus Rubrik</button>
          </div>
        )}
      </header>

      <RubrikDateSearch key={location.search} rubrik={rubrik}>
        <section className={rubrikPanel}>
          {rubrik.deskripsi && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200">{rubrik.deskripsi}</p>}
          {/* Setiap kelompok mengikuti kriteria Dicari dan Dihindari yang tersimpan. */}
          {(['dicari', 'dihindari'] as const).map((kind) => (
            <div key={kind} className="mt-4 first:mt-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{kind === 'dicari' ? 'Kriteria Dicari' : 'Kriteria Dihindari'}</h2>
              {rubrik.criteria[kind].length ? (
                <ul className="mt-2 space-y-2">
                  {rubrik.criteria[kind].map((group, index) => (
                    <li key={index} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <strong>{group.label || `Kelompok ${index + 1}`}</strong>
                      <p>{group.conditions.map((condition) => `${condition.parameter}: ${condition.value}`).join(' · ')}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tidak ada kriteria {kind}.</p>}
            </div>
          ))}
        </section>
      </RubrikDateSearch>

      <RubrikComments rubrik={rubrik} />

      {confirmDelete && (
        <RubrikDeleteDialog title="Hapus rubrik?" description={`Rubrik “${rubrik.nama}” beserta komentarnya akan dihapus.`}
          pending={deletion.isPending} error={deletion.error} onClose={() => setConfirmDelete(false)}
          onDelete={() => deletion.mutate(rubrik.id, { onSuccess: () => navigate(backTo, { state, replace: true }) })} />
      )}
    </div>
  );
}

function RubrikDateSearch({ rubrik, children }: { rubrik: RubrikDewasa; children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = useAuthStore((state) => Boolean(state.isAuthenticated && state.user && state.token));
  const [currentYear, currentMonth] = getTodayWITA().split('-').map(Number);
  const params = new URLSearchParams(location.search);
  const monthParam = params.get('month');
  const rawMonth = Number(monthParam);
  const rawYear = Number(params.get('year'));
  const [month, setMonth] = useState(monthParam !== null && Number.isInteger(rawMonth) && rawMonth >= 0 && rawMonth <= 12 ? rawMonth : currentMonth);
  const [year, setYear] = useState(String(Number.isInteger(rawYear) && rawYear >= 1800 && rawYear <= 2200 ? rawYear : currentYear));
  const search = useMengaturDewasaSearch();
  const [selected, setSelected] = useState<DewasaDateResult | null>(null);
  const [validation, setValidation] = useState('');
  const criteria = rubrik.evaluation_criteria;

  function resetResults() {
    search.cancelSearch();
    setSelected(null);
    setValidation('');
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!criteria || search.isPending) return;
    const request = buildRubrikSearch(criteria, month, Number(year));
    if (!request) {
      setValidation('Masukkan tahun antara 1800 dan 2200.');
      return;
    }
    if (!authenticated) {
      params.set('month', String(month));
      params.set('year', year);
      navigate('/login', { state: { from: { pathname: `${location.pathname}?${params}` } } });
      return;
    }
    resetResults();
    search.mutate(request);
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <div className="space-y-6">
        {children}
        {search.isPending && <DataSkeleton label="Mencari tanggal…" className="h-24" />}
        {search.isError && <QueryErrorState title="Gagal menghitung tanggal" error={search.error}
          onRetry={() => { if (search.variables) search.mutate(search.variables); }} />}
        {search.data && search.variables && (
          <RubrikDateResults key={search.submittedAt} response={search.data} range={search.variables} onSelect={setSelected} />
        )}
      </div>
      <aside className={rubrikPanel}>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Hitung tanggal</h2>
        <form onSubmit={calculate} className="mt-4 space-y-4">
          <div>
            <label htmlFor="rubrik-month" className={rubrikLabel}>Bulan</label>
            <select id="rubrik-month" value={month} className={`${rubrikInput} h-11`}
              onChange={(event) => { setMonth(Number(event.target.value)); resetResults(); }}>
              <option value={0}>Semua bulan</option>
              {months.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="rubrik-year" className={rubrikLabel}>Tahun</label>
            <input id="rubrik-year" type="number" min={1800} max={2200} required value={year} className={`${rubrikInput} h-11 tabular-nums`}
              onChange={(event) => { setYear(event.target.value); resetResults(); }} />
          </div>
          {validation && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{validation}</p>}
          {!criteria && <p className="text-sm text-amber-800 dark:text-amber-300">Kriteria rubrik ini belum dapat dihitung.</p>}
          <button disabled={!criteria || search.isPending} className={`w-full ${rubrikPrimary}`}>Hitung Tanggal Dewasa Ayu</button>
        </form>
      </aside>
      {selected && <MengaturDewasaDetailModal result={selected} fields={[]} activityName={rubrik.nama} shareContext="rubrik" onClose={() => setSelected(null)} />}
    </div>
  );
}
