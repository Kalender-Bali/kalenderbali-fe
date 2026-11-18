import { Search, X } from 'lucide-react';
import { PENGINGAT_CATEGORIES } from '../data/pengingatData';
import type { PengingatFilter as KindFilter } from '../types/pengingat.types';

interface PengingatFilterProps {
  search: string;
  kind: KindFilter;
  counts: Record<KindFilter, number>;
  onSearch: (value: string) => void;
  onKind: (value: KindFilter) => void;
}

export function PengingatFilter({ search, kind, counts, onSearch, onKind }: PengingatFilterProps) {
  const filters: { value: KindFilter; label: string }[] = [
    { value: 'semua', label: 'Semua' },
    ...PENGINGAT_CATEGORIES.map(category => ({
      value: category.id,
      label: category.id === 'mengatur-dewasa' ? 'Mengatur Dewasa' : category.title.replace('Pengingat ', ''),
    })),
  ];
  return <div className="space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="relative flex-1">
        <label htmlFor="pengingat-search" className="sr-only">Cari pengingat</label>
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        <input id="pengingat-search" type="search" value={search} onChange={event => onSearch(event.target.value)} placeholder="Cari nama, pura, atau kegiatan…" className="w-full h-11 pl-10 pr-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] [&::-webkit-search-cancel-button]:appearance-none" />
        {search && <button type="button" onClick={() => onSearch('')} aria-label="Hapus pencarian" className="absolute right-0 top-0 min-w-11 min-h-11 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl cursor-pointer"><X className="w-4 h-4" /></button>}
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div role="group" aria-label="Filter fitur pengingat" className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
        {filters.map(({ value, label }) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => onKind(value)} className={`min-h-11 px-3 rounded-lg text-xs sm:text-sm cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-teal-600 ${kind === value ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 font-medium'}`}>
          {label}{' '}<span className={`ml-1.5 text-[10px] sm:text-[11px] tabular-nums ${kind === value ? 'text-teal-700 dark:text-teal-300' : 'text-slate-400'}`}>{counts[value]}</span>
        </button>)}
      </div>
    </div>
  </div>;
}
