import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { CustomCriteriaEditor } from '@/features/mengatur-dewasa/components/CustomCriteriaEditor';
import { MengaturDewasaForm } from '@/features/mengatur-dewasa/components/MengaturDewasaForm';
import { useDewasaActivities, useDewasaActivity, useDewasaCriteriaFields, useDewasaCriteriaOptions, useMengaturDewasaSearch } from '@/features/mengatur-dewasa/hooks/useMengaturDewasaQueries';
import { buildActivitySearchRequest, buildCustomRules, buildCustomSearchRequest, summarizeSearchCriteria } from '@/features/mengatur-dewasa/utils/mengaturDewasaUtils';
import type { CustomCriteriaDraft, DewasaCriteriaSummary, MengaturDewasaSearchRequest } from '@/features/mengatur-dewasa/types/mengaturDewasa.types';
import type { PengingatAddProps } from '../types/pengingat.types';
import { dewasaCandidates } from '../utils/pengingatSources';
import { PengingatAddDialog } from './PengingatAddDialog';
import { PengingatSourceFeedback } from './PengingatFormControls';
import { PengingatResultPicker } from './PengingatResultPicker';

export function PengingatDewasaForm(props: PengingatAddProps) {
  const { today } = props;
  const location = useLocation();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated && Boolean(state.token && state.user));
  const [form, setForm] = useState({ mode: 'activity' as 'activity' | 'custom', activityId: '', month: Number(today.slice(5, 7)), year: today.slice(0, 4), custom: { recommended: [], avoid: [] } as CustomCriteriaDraft });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ request: MengaturDewasaSearchRequest; criteria: DewasaCriteriaSummary } | null>(null);
  const [selectedKey, setSelectedKey] = useState('');
  const activities = useDewasaActivities();
  const activityQuery = useDewasaActivity(form.mode === 'activity' ? form.activityId || null : null);
  const activity = !activityQuery.isError && activityQuery.data?.id === form.activityId ? activityQuery.data : null;
  const fields = useDewasaCriteriaFields(form.mode === 'custom');
  const search = useMengaturDewasaSearch();
  const selectedFields = new Set([...form.custom.recommended, ...form.custom.avoid].flatMap(group => group.items.map(item => item.field)));
  const referenceFields = form.mode === 'custom' ? (fields.data ?? []).filter(field => field.value_kind === 'reference_value' && selectedFields.has(field.field)).map(field => field.field).sort() : [];
  const references = useDewasaCriteriaOptions(referenceFields);
  const options = Object.fromEntries(referenceFields.map((field, index) => [field, references[index]]));
  const valuesByField = Object.fromEntries(referenceFields.map((field, index) => [field, references[index]?.isSuccess ? references[index].data : undefined]));
  const customCount = [...form.custom.recommended, ...form.custom.avoid].reduce((sum, group) => sum + group.items.length, 0);
  const candidates = submitted && search.data && !search.isPending && !search.isError ? dewasaCandidates(submitted.request, search.data, submitted.criteria, today) : [];
  const selected = candidates.find(item => item.key === selectedKey) ?? candidates[0] ?? null;

  function updateForm(patch: Partial<typeof form>) {
    search.cancelSearch(); setSubmitted(null); setSelectedKey(''); setValidationError(null);
    setForm(current => ({ ...current, ...patch }));
  }

  return <PengingatAddDialog {...props} title="Tambah pengingat Mengatur Dewasa" description="Pilih kegiatan dan tanggal yang ingin diingatkan." nameLabel="Nama rencana kegiatan" namePlaceholder="Contoh: Mulai renovasi rumah" requireName candidate={selected}
    beforeName={<div role="group" aria-label="Cara menyusun kriteria" className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex gap-1">{([['activity', 'Gunakan Template'], ['custom', 'Kriteria Sendiri']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={form.mode === value} onClick={() => updateForm({ mode: value })} className={`flex-1 min-w-0 min-h-11 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${form.mode === value ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-200 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>{label}</button>)}</div>}>
    <MengaturDewasaForm embedded mode={form.mode} onModeChange={mode => updateForm({ mode })} activityId={form.activityId} month={form.month} year={form.year}
      activities={activities.data ?? []} activity={activity ?? null} isActivitiesLoading={activities.isLoading} activitiesError={activities.isError ? activities.error : null} isActivityLoading={activityQuery.isLoading} activityError={activityQuery.isError ? activityQuery.error : null} isSearching={search.isPending}
      onActivityChange={activityId => updateForm({ activityId })} onMonthChange={month => updateForm({ month })} onYearChange={year => updateForm({ year })} onRetryActivities={() => void activities.refetch()} onRetryActivity={() => void activityQuery.refetch()} customHasCriteria={customCount > 0} validationError={validationError}
      customEditor={<CustomCriteriaEditor compact draft={form.custom} fields={fields.data ?? []} options={options} isLoading={fields.isLoading} error={fields.isError ? fields.error : null} onRetry={() => void fields.refetch()} onChange={custom => updateForm({ custom })} />}
      onSubmit={event => {
        event.preventDefault();
        if (!isAuthenticated) { setValidationError('Masuk terlebih dahulu untuk mencari tanggal, sesuai akses fitur Mengatur Dewasa.'); return; }
        let request: MengaturDewasaSearchRequest | null;
        if (form.mode === 'activity') {
          request = buildActivitySearchRequest(form.activityId, form.month, Number(form.year));
          if (!activity || activityQuery.isLoading || activityQuery.isError || !activity.rules.length) return;
        } else {
          const built = buildCustomRules(form.custom, fields.isError ? [] : fields.data ?? [], valuesByField);
          if (!built.rules) { setValidationError(built.error); return; }
          request = buildCustomSearchRequest(built.rules, form.month, Number(form.year));
        }
        if (!request) { setValidationError('Lengkapi kegiatan, bulan, dan tahun pencarian (1800–2200).'); return; }
        setValidationError(null); setSelectedKey('');
        setSubmitted({ request, criteria: summarizeSearchCriteria(request, activity ?? null, fields.data ?? [], valuesByField) });
        search.mutate(request);
      }} />
    {!isAuthenticated && <p className="text-xs text-slate-500 dark:text-slate-400">Pencarian tanggal memerlukan akun. <Link to="/login" state={{ from: location }} className="font-bold text-teal-700 dark:text-teal-300 underline">Masuk ke akun</Link></p>}
    <PengingatSourceFeedback loading={search.isPending} error={search.isError ? search.error : null} empty={Boolean(submitted && search.isSuccess && !candidates.length)} />
    <PengingatResultPicker candidates={candidates} selected={selected} today={today} onSelect={setSelectedKey} />
    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Pengingat memakai satu tanggal hasil pilihanmu. Tanggal yang konflik atau tidak cocok tidak dapat dipilih.</p>
  </PengingatAddDialog>;
}
