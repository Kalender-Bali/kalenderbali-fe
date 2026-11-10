import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { formatFullIndoDate, getIndoMonthName, getTodayWITA } from '@/features/kalender/utils/calendarUtils';
import { useAuthStore } from '@/stores/useAuthStore';
import { CustomCriteriaEditor } from '../components/CustomCriteriaEditor';
import { MengaturDewasaDetailModal } from '../components/MengaturDewasaDetailModal';
import { MengaturDewasaForm } from '../components/MengaturDewasaForm';
import { MengaturDewasaHeader } from '../components/MengaturDewasaHeader';
import { MengaturDewasaResults } from '../components/MengaturDewasaResults';
import { MengaturDewasaSummary } from '../components/MengaturDewasaSummary';
import { useDewasaActivities, useDewasaActivity, useDewasaCriteriaFields, useDewasaCriteriaOptions, useMengaturDewasaSearch } from '../hooks/useMengaturDewasaQueries';
import type { CustomCriteriaDraft, DewasaCriteriaSummary, DewasaDateResult } from '../types/mengaturDewasa.types';
import { buildActivitySearchRequest, buildCustomRules, buildCustomSearchRequest, readDewasaUrlContext, restoreCustomDraft, summarizeSearchCriteria } from '../utils/mengaturDewasaUtils';

const LOGIN_DRAFT_KEY = 'mengatur-dewasa:login-draft';
const emptyCustom = (): CustomCriteriaDraft => ({ recommended: [], avoid: [] });

// Draft custom disimpan sementara di tab saat login, bukan disebarkan melalui URL.
function readInitialForm(params: URLSearchParams, today: string) {
  const context = readDewasaUrlContext(params, today);
  let custom = emptyCustom();
  if (context.mode === 'custom' && typeof window !== 'undefined') {
    try {
      const raw = window.sessionStorage.getItem(LOGIN_DRAFT_KEY);
      if (raw && raw.length < 64000) {
        const saved: unknown = JSON.parse(raw);
        if (saved && typeof saved === 'object' && 'createdAt' in saved && 'custom' in saved && typeof saved.createdAt === 'number' && Date.now() - saved.createdAt >= 0 && Date.now() - saved.createdAt < 30 * 60 * 1000) {
          custom = restoreCustomDraft(saved.custom) ?? custom;
        }
      }
    } catch {
      // Penyimpanan dapat dinonaktifkan browser; form tetap dapat digunakan.
    }
  }
  return {
    ...context,
    custom,
  };
}

// Halaman menyusun form dan hasil; evaluasi tanggal tetap dikerjakan backend.
export default function MengaturDewasaPage() {
  const [params, setParams] = useSearchParams();
  const paramsKey = params.toString();
  const location = useLocation();
  const navigate = useNavigate();
  const [today] = useState(getTodayWITA);
  const [form, setForm] = useState(() => readInitialForm(params, today));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<DewasaDateResult | null>(null);
  const [submittedCriteria, setSubmittedCriteria] = useState<DewasaCriteriaSummary | null>(null);
  const observedUrl = useRef(paramsKey);
  const writtenUrl = useRef<string | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated && Boolean(state.token && state.user));
  const activities = useDewasaActivities();
  const activityQuery = useDewasaActivity(form.mode === 'activity' ? form.activityId || null : null);
  const fields = useDewasaCriteriaFields(form.mode === 'custom');
  const search = useMengaturDewasaSearch();
  const activity = !activityQuery.isError && activityQuery.data?.id === form.activityId ? activityQuery.data : null;

  // Query tiap field referensi sekali, sekalipun dipakai di beberapa kelompok.
  const selectedFields = new Set([...form.custom.recommended, ...form.custom.avoid].flatMap((group) => group.items.map((item) => item.field)));
  const referenceFields = form.mode === 'custom' ? (fields.data ?? []).filter((field) => field.value_kind === 'reference_value' && selectedFields.has(field.field)).map((field) => field.field).sort() : [];
  const referenceQueries = useDewasaCriteriaOptions(referenceFields);
  const options = Object.fromEntries(referenceFields.map((field, index) => [field, referenceQueries[index]]));
  const valuesByField = Object.fromEntries(referenceFields.map((field, index) => [field, referenceQueries[index]?.isSuccess ? referenceQueries[index].data : undefined]));
  const customCount = [...form.custom.recommended, ...form.custom.avoid].reduce((sum, group) => sum + group.items.length, 0);
  const closeDetail = useCallback(() => setSelectedResult(null), []);
  const cancelSearch = search.cancelSearch;

  useEffect(() => {
    try { window.sessionStorage.removeItem(LOGIN_DRAFT_KEY); } catch { /* Browser dapat menonaktifkan penyimpanan. */ }
  }, []);

  // Detail dan snapshot hasil juga dibersihkan ketika sesi berubah atau logout.
  useEffect(() => useAuthStore.subscribe((current, previous) => {
    if (current.user?.id !== previous.user?.id || current.token !== previous.token || current.isAuthenticated !== previous.isAuthenticated) {
      setSelectedResult(null);
      setSubmittedCriteria(null);
      if (previous.isAuthenticated && !current.isAuthenticated) {
        setSessionNotice('Sesi berakhir atau Anda telah keluar. Masuk kembali untuk mencari tanggal.');
      } else if (current.isAuthenticated) {
        setSessionNotice('Sesi berubah. Silakan lakukan pencarian kembali.');
      }
    }
  }), []);

  // Back/Forward membaca ulang konteks URL tanpa menyalin kriteria pribadi ke URL.
  useEffect(() => {
    if (observedUrl.current === paramsKey) return;
    observedUrl.current = paramsKey;
    if (writtenUrl.current === paramsKey) { writtenUrl.current = null; return; }
    const context = readDewasaUrlContext(new URLSearchParams(paramsKey), today);
    cancelSearch();
    setSelectedResult(null);
    setSubmittedCriteria(null);
    setValidationError(null);
    setForm((previous) => ({ ...previous, ...context }));
  }, [paramsKey, today, cancelSearch]);

  useEffect(() => {
    const year = Number(form.year);
    const context = Number.isInteger(year) && year >= 1800 && year <= 2200 ? ` · ${getIndoMonthName(form.month)} ${year}` : '';
    document.title = selectedResult ? `${formatFullIndoDate(selectedResult.tanggal)} · Mengatur Dewasa | Kalender Bali` : `Mengatur Dewasa${context} | Kalender Bali`;
  }, [form.month, form.year, selectedResult]);

  // Perubahan input membatalkan hasil sebelumnya agar tidak dipakai pada kriteria baru.
  function updateForm(patch: Partial<typeof form>) {
    search.cancelSearch();
    setSelectedResult(null);
    setSubmittedCriteria(null);
    setValidationError(null);
    const next = { ...form, ...patch };
    setForm(next);
    if ('custom' in patch) return;
    // Input tahun yang belum lengkap tetap di state; URL hanya menerima tahun valid.
    const nextParams = new URLSearchParams(params);
    nextParams.set('mode', next.mode);
    nextParams.set('month', String(next.month));
    const year = Number(next.year);
    if (Number.isInteger(year) && year >= 1800 && year <= 2200) nextParams.set('year', String(year));
    if (next.mode === 'activity' && next.activityId) nextParams.set('activity', next.activityId);
    else nextParams.delete('activity');
    const nextKey = nextParams.toString();
    if (nextKey !== paramsKey) {
      writtenUrl.current = nextKey;
      setParams(nextParams, { replace: 'year' in patch });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let request;
    if (form.mode === 'activity') {
      request = buildActivitySearchRequest(form.activityId, form.month, Number(form.year));
      if (!request || !activity || activityQuery.isError || activityQuery.isFetching || activity.rules.length === 0) return;
    } else {
      const built = buildCustomRules(form.custom, fields.isError ? [] : fields.data ?? [], valuesByField);
      if (!built.rules) {
        setValidationError(built.error);
        return;
      }
      request = buildCustomSearchRequest(built.rules, form.month, Number(form.year));
      if (!request) {
        setValidationError('Pilih bulan dan tahun yang valid (1800–2200).');
        return;
      }
    }

    if (!isAuthenticated) {
      // LoginPage kembali ke pathname ini. Draft custom disimpan per-tab dengan batas waktu.
      const draftParams = new URLSearchParams({ mode: form.mode, month: String(form.month), year: form.year });
      if (form.mode === 'activity') draftParams.set('activity', form.activityId);
      else {
        try {
          window.sessionStorage.setItem(LOGIN_DRAFT_KEY, JSON.stringify({ createdAt: Date.now(), custom: form.custom }));
        } catch {
          setValidationError('Draft tidak dapat disimpan untuk login. Periksa pengaturan penyimpanan browser.');
          return;
        }
      }
      navigate('/login', { state: { from: { pathname: `${location.pathname}?${draftParams}` } } });
      return;
    }

    setValidationError(null);
    setSessionNotice(null);
    setSubmittedCriteria(summarizeSearchCriteria(request, activity, fields.data ?? [], valuesByField));
    search.mutate(request);
  }

  return (
    <div className="space-y-6 pb-12">
      <MengaturDewasaHeader today={today} />
      {sessionNotice && <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">{sessionNotice}</div>}
      <MengaturDewasaForm
        mode={form.mode}
        onModeChange={(mode) => updateForm({ mode })}
        customHasCriteria={customCount > 0}
        validationError={validationError}
        customEditor={<CustomCriteriaEditor draft={form.custom} fields={fields.data ?? []} options={options} isLoading={fields.isLoading} error={fields.error} onRetry={() => void fields.refetch()} onChange={(custom) => updateForm({ custom })} />}
        activities={activities.data ?? []}
        activity={activity}
        activityId={form.activityId}
        month={form.month}
        year={form.year}
        isActivitiesLoading={activities.isLoading}
        activitiesError={activities.error}
        isActivityLoading={activityQuery.isFetching}
        activityError={activityQuery.error}
        isSearching={search.isPending}
        onActivityChange={(activityId) => updateForm({ activityId })}
        onMonthChange={(month) => updateForm({ month })}
        onYearChange={(year) => updateForm({ year })}
        onRetryActivities={() => void activities.refetch()}
        onRetryActivity={() => void activityQuery.refetch()}
        onSubmit={handleSubmit}
      />

      {/* Tampilkan panel setelah pencarian dimulai; ringkasan memakai metadata respons backend. */}
      {(search.isPending || search.error || search.data) && <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section aria-busy={search.isPending} className={`${search.data ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs`}>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">Hasil pencarian</h2>
          {search.isPending && <div className="mt-5 space-y-3 animate-pulse" aria-label="Mencari tanggal"><div className="h-5 w-44 bg-slate-100 rounded-xl" /><div className="h-20 bg-slate-100 rounded-xl" /></div>}
          {!search.isPending && search.error && <div role="alert" className="mt-5 flex flex-wrap items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800"><AlertCircle className="w-5 h-5 shrink-0" /><div className="flex-1 min-w-0"><p className="text-sm font-bold">Gagal mencari tanggal</p><p className="mt-1 text-sm">{search.error.message}</p></div>{search.variables && <button type="button" onClick={() => { if (search.variables) search.mutate(search.variables); }} className="min-h-11 px-3 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-800 font-bold text-xs sm:text-sm cursor-pointer inline-flex items-center gap-2 [touch-action:manipulation]"><RefreshCw className="w-4 h-4" /> Coba lagi</button>}</div>}
          {!search.isPending && search.data && <><p aria-live="polite" className="mt-2 text-sm text-slate-500"><span className="font-semibold tabular-nums">{search.data.meta.eligible_days}</span> tanggal memenuhi kriteria · {getIndoMonthName(form.month)} <span className="tabular-nums">{form.year}</span>{search.data.data.activity && ` · ${search.data.data.activity.name}`}</p><MengaturDewasaResults response={search.data} fields={fields.data ?? []} onSelect={setSelectedResult} />{search.variables && <Link to={`/kalender?date=${encodeURIComponent(search.variables.tanggal_mulai)}`} className="mt-5 min-h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors inline-flex items-center justify-center [touch-action:manipulation]">Tampilkan kalender lengkap</Link>}</>}
        </section>
        {search.data && <div className="lg:col-span-4"><MengaturDewasaSummary response={search.data} criteria={submittedCriteria} /></div>}
      </div>}
      {selectedResult && <MengaturDewasaDetailModal result={selectedResult} fields={fields.data ?? []} onClose={closeDetail} />}
    </div>
  );
}
