import { Plus, Trash2, RefreshCw, ChevronDown } from 'lucide-react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CriteriaDraftItem, CustomCriteriaDraft, DewasaCriteriaField, DewasaCriteriaValue } from '../types/mengaturDewasa.types';
import { createCriteriaGroup, createCriteriaItem } from '../utils/mengaturDewasaUtils';

interface Props {
  draft: CustomCriteriaDraft;
  fields: DewasaCriteriaField[];
  options: Record<string, UseQueryResult<DewasaCriteriaValue[], Error>>;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onChange: (draft: CustomCriteriaDraft) => void;
}

const input = 'w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0f172a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400';
const button = 'min-h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50 disabled:cursor-not-allowed';

// Setiap baris menerima pilihan resmi dari field yang sedang dipilih.
function CriteriaRow({ item, fields, options, onChange, onRemove }: {
  item: CriteriaDraftItem;
  fields: DewasaCriteriaField[];
  options: Props['options'];
  onChange: (item: CriteriaDraftItem) => void;
  onRemove: () => void;
}) {
  const field = fields.find((entry) => entry.field === item.field);
  const query = field?.value_kind === 'reference_value' ? options[field.field] : undefined;
  return (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-start">
      <div className="relative flex-1 min-w-0">
        <label htmlFor={`${item.id}-field`} className="sr-only">Jenis kriteria</label>
        <select id={`${item.id}-field`} className={`${input} appearance-none pr-10`} value={item.field} onChange={(event) => onChange({ ...item, field: event.target.value, value: '' })}>
          <option value="">Pilih jenis kriteria</option>
          {fields.map((entry) => <option key={entry.field} value={entry.field}>{entry.label}</option>)}
        </select>
        <ChevronDown aria-hidden="true" className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      <div className="flex-1 min-w-0">
        <label htmlFor={`${item.id}-value`} className="sr-only">Nilai kriteria</label>
        {field?.value_kind === 'integer' ? (
          <input id={`${item.id}-value`} type="number" inputMode="numeric" min={field.min} max={field.max} step="1" placeholder={`${field.min}–${field.max}`} value={item.value} onChange={(event) => onChange({ ...item, value: event.target.value })} className={`${input} tabular-nums`} />
        ) : (
          <div className="relative">
            <select id={`${item.id}-value`} className={`${input} appearance-none pr-10`} value={item.value} disabled={!field || (field.value_kind === 'reference_value' && (!query?.isSuccess || query.isError))} onChange={(event) => onChange({ ...item, value: event.target.value })}>
              <option value="">{query?.isLoading ? 'Memuat pilihan...' : 'Pilih nilai'}</option>
              {field?.value_kind === 'enum' && field.allowed_values.map((value) => <option key={value} value={value}>{value}</option>)}
              {field?.value_kind === 'reference_value' && query?.data?.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}
            </select>
            <ChevronDown aria-hidden="true" className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}
        {query?.isError && <p role="alert" className="mt-1 text-xs text-rose-700">Gagal memuat pilihan. <button type="button" onClick={() => void query.refetch()} className="min-h-11 px-1 font-bold underline cursor-pointer [touch-action:manipulation]">Coba lagi</button></p>}
      </div>
      <button type="button" onClick={onRemove} aria-label="Hapus kriteria" className={`${button} sm:w-11 sm:px-0`}><Trash2 className="w-4 h-4" /><span className="sm:hidden">Hapus kriteria</span></button>
    </div>
  );
}

// Satu kelompok berarti semua baris harus cocok; kelompok lain adalah alternatif.
export function CustomCriteriaEditor({ draft, fields, options, isLoading, error, onRetry, onChange }: Props) {
  const total = [...draft.recommended, ...draft.avoid].reduce((sum, group) => sum + group.items.length, 0);
  const sections = [
    { key: 'recommended' as const, title: 'Kriteria mendukung', description: 'Tanggal harus cocok dengan setidaknya satu kelompok mendukung, jika ada.' },
    { key: 'avoid' as const, title: 'Kriteria dihindari', description: 'Tanggal dinyatakan konflik jika cocok dengan salah satu kelompok dihindari.' },
  ];

  if (isLoading) return <div className="animate-pulse space-y-3" aria-label="Memuat jenis kriteria"><div className="h-4 w-40 bg-slate-100 rounded-xl" /><div className="h-20 bg-slate-100 rounded-xl" /></div>;
  if (error) return <div role="alert" className="text-sm text-rose-800">Gagal memuat jenis kriteria: {error.message} <button type="button" onClick={onRetry} className={`${button} ml-2`}><RefreshCw className="w-4 h-4" /> Coba lagi</button></div>;
  if (!fields.length) return <p className="text-sm text-slate-500">Belum ada jenis kriteria yang tersedia.</p>;

  return (
    <div className="space-y-6">
      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">Semua kriteria dalam satu kelompok harus cocok. Antarkelompok berlaku pilihan salah satu.</p>
      {sections.map(({ key, title, description }) => (
        <section key={key} className="space-y-3" aria-label={title}>
          <div><h4 className="text-sm font-bold text-[#0f172a] dark:text-white">{title}</h4><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p></div>
          {draft[key].map((group, groupIndex) => (
            <fieldset key={group.id} className="rounded-xl bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 p-4 space-y-3">
              <legend className="px-1 text-xs font-bold text-slate-700 dark:text-slate-300">Kelompok {groupIndex + 1}</legend>
              {group.items.map((item) => (
                <CriteriaRow key={item.id} item={item} fields={fields} options={options}
                  onChange={(next) => onChange({ ...draft, [key]: draft[key].map((entry) => entry.id === group.id ? { ...entry, items: entry.items.map((old) => old.id === item.id ? next : old) } : entry) })}
                  onRemove={() => onChange({ ...draft, [key]: draft[key].flatMap((entry) => entry.id !== group.id ? [entry] : entry.items.length === 1 ? [] : [{ ...entry, items: entry.items.filter((old) => old.id !== item.id) }]) })}
                />
              ))}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={button} disabled={group.items.length >= 20 || total >= 100} onClick={() => onChange({ ...draft, [key]: draft[key].map((entry) => entry.id === group.id ? { ...entry, items: [...entry.items, createCriteriaItem()] } : entry) })}><Plus className="w-4 h-4" /> Tambah syarat dalam kelompok</button>
                <button type="button" className={button} onClick={() => onChange({ ...draft, [key]: draft[key].filter((entry) => entry.id !== group.id) })}><Trash2 className="w-4 h-4" /> Hapus kelompok</button>
              </div>
            </fieldset>
          ))}
          <button type="button" className={button} disabled={draft[key].length >= 20 || total >= 100} onClick={() => onChange({ ...draft, [key]: [...draft[key], createCriteriaGroup()] })}><Plus className="w-4 h-4" /> Tambah kelompok {key === 'recommended' ? 'mendukung' : 'dihindari'}</button>
        </section>
      ))}
    </div>
  );
}
