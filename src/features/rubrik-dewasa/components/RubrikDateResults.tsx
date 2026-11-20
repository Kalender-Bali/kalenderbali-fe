import { useState } from 'react';
import { DataSkeleton } from '@/components/ui/DataSkeleton';
import { fetchMasterPadewasan } from '@/features/ala-ayuning-dewasa/api/alaAyuningApi';
import { MengaturDewasaResults } from '@/features/mengatur-dewasa/components/MengaturDewasaResults';
import { useDewasaActivities, useDewasaCriteriaFields, useMengaturDewasaSearch } from '@/features/mengatur-dewasa/hooks/useMengaturDewasaQueries';
import type { DewasaDateResult, DewasaSearchResponse, MengaturDewasaSearchRequest } from '@/features/mengatur-dewasa/types/mengaturDewasa.types';
import { useReadQuery } from '@/lib/useReadQuery';
import { filterRubrikDates, noDateFilter } from '../utils/rubrikDates';
import { RubrikCriterionValue } from './RubrikCriterionValue';
import { rubrikInput, rubrikLabel, rubrikPanel, rubrikSecondary } from './rubrikStyles';

interface Props {
  response: DewasaSearchResponse;
  range: MengaturDewasaSearchRequest;
  onSelect: (result: DewasaDateResult) => void;
}

export function RubrikDateResults({ response, range, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState(noDateFilter);
  const [field, setField] = useState('');
  const [activityID, setActivityID] = useState('');
  const fields = useDewasaCriteriaFields();
  const activities = useDewasaActivities();
  const padewasan = useReadQuery({
    queryKey: ['ala-ayuning', 'master'], queryFn: fetchMasterPadewasan,
    enabled: open, staleTime: Infinity, gcTime: 24 * 60 * 60 * 1000,
  });
  const activitySearch = useMengaturDewasaSearch();
  const activityResponse = activitySearch.variables?.mode === 'activity' && activitySearch.variables.activity_id === activityID
    ? activitySearch.data : undefined;
  const activityDates = activityID && activityResponse
    ? new Set(activityResponse.data.results.map((date) => date.tanggal))
    : undefined;
  const pendingActivity = Boolean(activityID && !activityResponse && activitySearch.isPending);
  const filtered = filterRubrikDates(response.data.results, filters, activityDates);
  const filterCount = Object.values(filters.parameters).filter(Boolean).length + Number(Boolean(filters.requiredPadewasan)) +
    Number(Boolean(filters.excludedPadewasan)) + Number(Boolean(activityID));

  function searchActivity(next: string) {
    setActivityID(next);
    activitySearch.cancelSearch();
    if (!next) return;
    // Perpotongan dua hasil Go mempertahankan pantangan kegiatan dan kriteria rubrik.
    activitySearch.mutate({
      mode: 'activity', activity_id: next, tanggal_mulai: range.tanggal_mulai,
      tanggal_selesai: range.tanggal_selesai, include_rejected: false,
    });
  }

  return (
    <section className={rubrikPanel}>
      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Hasil tanggal</h2>
      {response.data.results.length > 0 && (
        <details className="mt-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700" onToggle={(event) => setOpen(event.currentTarget.open)}>
          <summary className="cursor-pointer py-2 text-sm font-bold text-teal-700 dark:text-teal-300">
            Filter lanjutan {filterCount > 0 && <span className="tabular-nums">({filterCount})</span>}
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rubrik-date-field" className={rubrikLabel}>Parameter tambahan</label>
              <select id="rubrik-date-field" className={`${rubrikInput} h-11`} value={field} onChange={(event) => setField(event.target.value)}>
                <option value="">Pilih parameter</option>
                {fields.data?.map((item) => <option key={item.field} value={item.field}>{item.label}</option>)}
              </select>
            </div>
            <RubrikCriterionValue field={fields.data?.find((item) => item.field === field)} value={filters.parameters[field] ?? ''}
              onChange={(value) => setFilters((current) => ({ ...current, parameters: { ...current.parameters, [field]: value } }))} />
            {(['requiredPadewasan', 'excludedPadewasan'] as const).map((key) => (
              <div key={key}>
                <label className={rubrikLabel} htmlFor={key}>{key === 'requiredPadewasan' ? 'Harus memiliki Ala Ayuning' : 'Hindari Ala Ayuning'}</label>
                <select id={key} className={`${rubrikInput} h-11`} value={filters[key]} disabled={padewasan.isLoading}
                  onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}>
                  <option value="">{padewasan.isLoading ? 'Memuat pilihan…' : 'Tidak dibatasi'}</option>
                  {padewasan.data?.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label htmlFor="rubrik-date-activity" className={rubrikLabel}>Kegiatan yang dianjurkan</label>
              <select id="rubrik-date-activity" className={`${rubrikInput} h-11`} value={activityID} onChange={(event) => searchActivity(event.target.value)}>
                <option value="">Semua kegiatan</option>
                {activities.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
          </div>
          {(fields.isError || activities.isError || padewasan.isError) && (
            <button type="button" className="mt-3 min-h-11 text-sm font-bold text-rose-700 underline dark:text-rose-300" onClick={() => {
              if (fields.isError) void fields.refetch();
              if (activities.isError) void activities.refetch();
              if (padewasan.isError) void padewasan.refetch();
            }}>Muat ulang pilihan filter</button>
          )}
          {Object.entries(filters.parameters).filter(([, value]) => value).map(([key, value]) => (
            <button key={key} type="button" className="mr-2 mt-3 min-h-11 rounded-xl border border-teal-200 px-3 text-xs font-bold text-teal-700 dark:text-teal-300"
              aria-label={`Hapus filter ${fields.data?.find((item) => item.field === key)?.label ?? key}`}
              onClick={() => setFilters((current) => ({ ...current, parameters: { ...current.parameters, [key]: '' } }))}>
              {fields.data?.find((item) => item.field === key)?.label ?? key} · {value} ×
            </button>
          ))}
          <button type="button" className={`mt-3 ${rubrikSecondary}`} disabled={!filterCount} onClick={() => {
            setFilters(noDateFilter);
            setField('');
            searchActivity('');
          }}>Reset Filter</button>
        </details>
      )}
      {pendingActivity ? (
        <div className="mt-4"><DataSkeleton label="Memeriksa kecocokan kegiatan" className="h-24" /></div>
      ) : activityID && !activityResponse ? (
        <div role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">
          {activitySearch.error?.message ?? 'Kecocokan kegiatan belum dapat dimuat.'}{' '}
          <button type="button" className="min-h-11 font-bold underline" onClick={() => searchActivity(activityID)}>Coba lagi</button>
        </div>
      ) : (
        <>
          <p className="mt-3 text-xs text-slate-500 tabular-nums dark:text-slate-400" role="status">{filtered.length} tanggal ditemukan</p>
          {filtered.length > 0
            ? <MengaturDewasaResults response={{ ...response, data: { ...response.data, results: filtered } }} fields={fields.data ?? []} eligibleOnly onSelect={onSelect} />
            : <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Tidak ada tanggal yang cocok untuk periode dan filter ini.</p>}
        </>
      )}
    </section>
  );
}
