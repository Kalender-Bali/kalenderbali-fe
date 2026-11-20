import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { DataSkeleton } from '@/components/ui/DataSkeleton';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { useDewasaCriteriaFields } from '@/features/mengatur-dewasa/hooks/useMengaturDewasaQueries';
import type { DewasaCriteriaField } from '@/features/mengatur-dewasa/types/mengaturDewasa.types';
import { useAuthQueryScope, useAuthStore } from '@/stores/useAuthStore';
import { saveRubrik } from '../api/rubrikDewasaApi';
import { RubrikCriterionValue } from '../components/RubrikCriterionValue';
import { rubrikInput, rubrikLabel, rubrikPanel, rubrikPrimary, rubrikSecondary } from '../components/rubrikStyles';
import { useRubrikDetail, useRubrikMutation } from '../hooks/useRubrikDewasa';
import type { RubrikCriteria, RubrikDraft, RubrikDewasa, RubrikNavigationState } from '../types/rubrikDewasa.types';
import { canAuthorRubrik, canManageOwnedContent } from '../utils/rubrikAccess';

const sections = { dicari: 'Dicari', dihindari: 'Dihindari' } as const;
const emptyCondition = { parameter: '', value: '' };
const sasihNames = ['Kasa', 'Karo', 'Katiga', 'Kapat', 'Kalima', 'Kaenam', 'Kapitu', 'Kawulu', 'Kasanga', 'Kadasa', 'Jyestha', 'Sradha'];
type CriterionOption = { code: string; field: DewasaCriteriaField; label: string; values?: string[] };

// Simpan bentuk parameter yang dibaca Flutter, dengan katalog nilai dan batas dari Go.
function rubrikOptions(fields: DewasaCriteriaField[]): CriterionOption[] {
  return fields.flatMap((field): CriterionOption[] => {
    switch (field.field) {
      case 'neptu':
      case 'pratiti':
        return [];
      case 'sasih_no':
        return [{ code: 'sasih', field, label: field.label, values: sasihNames }];
      case 'lunar_day':
        return [
          { code: 'penanggal', field, label: 'Penanggal' },
          { code: 'pangelong', field, label: 'Pangelong' },
        ];
      case 'lunar_phase':
        return [{ code: 'pengalantaka', field, label: field.label }];
      case 'lunar_event':
        return [{ code: 'purnama_tilem', field, label: field.label, values: field.value_kind === 'enum' ? field.allowed_values.filter((value) => value !== '-') : [] }];
      case 'panca_sudha':
        return [{ code: 'panca_sadha', field, label: field.label }];
      default:
        return [{ code: field.field, field, label: field.label }];
    }
  });
}

export default function RubrikDewasaFormPage() {
  const { id = '' } = useParams();
  const user = useAuthStore((state) => state.isAuthenticated ? state.user : null);
  const scope = useAuthQueryScope();
  const query = useRubrikDetail(canAuthorRubrik(user?.role) ? id : '');
  const location = useLocation();
  const navigation = (location.state as RubrikNavigationState | null) ?? {};
  if (!canAuthorRubrik(user?.role)) return <Navigate to="/rubrik-dewasa" replace />;
  if (id && (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))) return <p>Rubrik tidak ditemukan.</p>;
  if (id && query.isLoading && !query.data) return <DataSkeleton label="Memuat rubrik" className="h-64" />;
  if (id && (query.isError || !query.data)) return <QueryErrorState title="Rubrik tidak dapat dimuat" error={query.error} onRetry={() => void query.refetch()} />;
  if (query.data && !canManageOwnedContent(user, query.data.user_id)) return <Navigate to={`/rubrik-dewasa/${id}`} replace />;

  return <RubrikForm key={`${scope}:${id}`} existing={query.data} navigation={navigation} />;
}

function RubrikForm({ existing, navigation }: { existing?: RubrikDewasa; navigation: RubrikNavigationState }) {
  const navigate = useNavigate();
  const catalog = useDewasaCriteriaFields();
  const options = rubrikOptions(catalog.data ?? []);
  const [draft, setDraft] = useState<RubrikDraft>(() => existing
    ? { nama: existing.nama, deskripsi: existing.deskripsi, criteria: existing.criteria }
    : { nama: '', deskripsi: '', criteria: { dicari: [], dihindari: [] } });
  const [validation, setValidation] = useState('');
  const mutation = useRubrikMutation((value: RubrikDraft) => saveRubrik(value, existing?.id));
  const { catalogSearch = '', mySearch } = navigation;
  const cancelPath = mySearch !== undefined
    ? `/rubrik-dewasa/saya${mySearch}`
    : existing ? `/rubrik-dewasa/${existing.id}${catalogSearch}` : `/rubrik-dewasa${catalogSearch}`;
  const allGroups = [...draft.criteria.dicari, ...draft.criteria.dihindari];
  const total = allGroups.reduce((sum, group) => sum + group.conditions.length, 0);
  const title = existing ? 'Ubah Rubrik' : 'Buat Rubrik';

  function setGroups(kind: keyof RubrikCriteria, groups: RubrikCriteria[typeof kind]) {
    setDraft((current) => ({ ...current, criteria: { ...current.criteria, [kind]: groups } }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    const name = draft.nama.trim();
    const validGroups = allGroups.every((group) => group.conditions.length > 0 &&
      group.conditions.every((condition) => condition.parameter && condition.value.trim()) &&
      new Set(group.conditions.map(({ parameter, value }) => JSON.stringify([parameter, value.trim()]))).size === group.conditions.length);
    if (!name || !total || !validGroups) {
      setValidation('Isi nama rubrik dan lengkapi minimal satu kriteria. Hapus kriteria yang sama dalam satu kelompok.');
      return;
    }
    setValidation('');
    mutation.mutate({ ...draft, nama: name, deskripsi: draft.deskripsi.trim() }, {
      onSuccess: (rubrik) => navigate(`/rubrik-dewasa/${rubrik.id}${mySearch ?? catalogSearch}`, { state: navigation, replace: true }),
    });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-500">
          Wargabali / Layanan / <Link to={`/rubrik-dewasa${catalogSearch}`} className="text-teal-700 dark:text-teal-300">Rubrik Dewasa Ayu</Link> / {title}
        </nav>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">{title}</h1>
      </header>
      <form onSubmit={submit} className="space-y-5">
        <section className={`${rubrikPanel} space-y-4`}>
          <div>
            <label htmlFor="rubrik-name" className={rubrikLabel}>Nama rubrik</label>
            <input id="rubrik-name" className={`${rubrikInput} h-11`} required maxLength={255}
              value={draft.nama} onChange={(event) => setDraft({ ...draft, nama: event.target.value })} />
          </div>
          <div>
            <label htmlFor="rubrik-description" className={rubrikLabel}>Deskripsi</label>
            <textarea id="rubrik-description" className={`${rubrikInput} py-2`} rows={4}
              value={draft.deskripsi} onChange={(event) => setDraft({ ...draft, deskripsi: event.target.value })} />
          </div>
        </section>
        {catalog.isLoading && !catalog.data && <DataSkeleton label="Memuat katalog kriteria" className="h-28" />}
        {catalog.isError && <QueryErrorState title="Katalog kriteria tidak dapat dimuat" error={catalog.error} onRetry={() => void catalog.refetch()} />}
        {catalog.data && (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-300">Semua kriteria dalam satu kelompok harus cocok. Antarkelompok berlaku pilihan salah satu.</p>
            {(Object.keys(sections) as (keyof RubrikCriteria)[]).map((kind) => {
              const groups = draft.criteria[kind];
              return (
                <fieldset key={kind} className={`${rubrikPanel} space-y-4`} aria-label={`Kriteria ${sections[kind]}`}>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Kriteria {sections[kind]}</h2>
                  {groups.map((group, groupIndex) => {
                    const groupKey = `${kind}-${groupIndex}`;
                    const updateGroup = (next: typeof group) => setGroups(kind, groups.map((item, index) => index === groupIndex ? next : item));
                    return (
                      <div key={groupKey} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-800 tabular-nums dark:text-slate-100">Kelompok {groupIndex + 1}</h3>
                          <button type="button" className={rubrikSecondary} onClick={() => setGroups(kind, groups.filter((_, index) => index !== groupIndex))}>Hapus Kelompok</button>
                        </div>
                        <label className={rubrikLabel}>Nama kelompok (opsional)
                          <input className={`mt-1 h-11 ${rubrikInput}`} value={group.label}
                            onChange={(event) => updateGroup({ ...group, label: event.target.value })} />
                        </label>
                        {group.conditions.map((condition, index) => {
                          const option = options.find((item) => item.code === condition.parameter);
                          const replace = (next: typeof condition) => updateGroup({ ...group,
                            conditions: group.conditions.map((item, itemIndex) => itemIndex === index ? next : item),
                          });
                          return (
                            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                              <div>
                                <label className={rubrikLabel} htmlFor={`${groupKey}-${index}`}>Parameter</label>
                                <select id={`${groupKey}-${index}`} className={`${rubrikInput} h-11`} value={condition.parameter}
                                  onChange={(event) => replace({ parameter: event.target.value, value: '' })} required>
                                  <option value="">Pilih parameter</option>
                                  {condition.parameter && !option && <option value={condition.parameter}>{condition.parameter}</option>}
                                  {options.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
                                </select>
                              </div>
                              {option || !condition.parameter
                                ? <RubrikCriterionValue field={option?.field} value={condition.value} options={option?.values} required
                                    onChange={(value) => replace({ ...condition, value })} />
                                : <label className={rubrikLabel}>Nilai tersimpan
                                    <input className={`mt-1 h-11 ${rubrikInput}`} value={condition.value} required
                                      onChange={(event) => replace({ ...condition, value: event.target.value })} />
                                  </label>}
                              <button type="button" className={rubrikSecondary} disabled={group.conditions.length === 1}
                                onClick={() => updateGroup({ ...group, conditions: group.conditions.filter((_, itemIndex) => itemIndex !== index) })}>Hapus Kriteria</button>
                            </div>
                          );
                        })}
                        <button type="button" className={rubrikSecondary} disabled={group.conditions.length >= 20 || total >= 100}
                          onClick={() => updateGroup({ ...group, conditions: [...group.conditions, emptyCondition] })}>Tambah Kriteria</button>
                      </div>
                    );
                  })}
                  <button type="button" className={rubrikSecondary} disabled={groups.length >= 20 || total >= 100}
                    onClick={() => setGroups(kind, [...groups, { label: '', conditions: [emptyCondition] }])}>Tambah Kelompok {sections[kind]}</button>
                </fieldset>
              );
            })}
          </>
        )}
        {(validation || mutation.error) && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{validation || mutation.error?.message}</p>}
        <div className="flex flex-wrap gap-2">
          <Link to={cancelPath} state={navigation} className={rubrikSecondary}>Batal</Link>
          <button className={rubrikPrimary} disabled={!catalog.data || mutation.isPending}>
            {mutation.isPending ? 'Menyimpan…' : existing ? 'Simpan Perubahan' : 'Terbitkan Rubrik'}
          </button>
        </div>
      </form>
    </div>
  );
}
