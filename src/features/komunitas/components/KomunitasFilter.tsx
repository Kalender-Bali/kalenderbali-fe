import { useEffect, useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type { KomunitasFilters, KomunitasRegions, KomunitasTab } from '../types/komunitas.types';
import { inputStyle, secondaryButton } from './komunitasStyles';

/** Draft pencarian lokal memberi jeda 300 ms; filter hierarkis mereset pilihan turunannya. */
export function KomunitasFilter({ tab, filters, regions, regionsLoading, onTab, onFilters, onReset }: {
  tab: KomunitasTab; filters: KomunitasFilters; regions?: KomunitasRegions; regionsLoading: boolean;
  onTab: (tab: KomunitasTab) => void; onFilters: (values: Record<string, string | null>, replace?: boolean) => void; onReset: () => void;
}) {
  const [draft, setDraft] = useState({ source: filters.search, value: filters.search });
  // Simpan URL terakhir yang diamati agar Back tidak memutar ulang draft lama dengan sumber sama.
  // Penyesuaian bersyarat saat render mempertahankan fokus dan tidak membutuhkan efek setState.
  if (draft.source !== filters.search) setDraft({ source: filters.search, value: filters.search });
  const search = draft.source === filters.search ? draft.value : filters.search;
  useEffect(() => {
    if (search === filters.search) return;
    const timer = setTimeout(() => onFilters({ q: search.trim() || null }, true), 300);
    return () => clearTimeout(timer);
  }, [search, filters.search, onFilters]);
  const countries = regions?.countries ?? [];
  const provinces = countries.find(country => country.name === filters.country)?.provinces ?? [];
  const cities = provinces.find(province => province.name === filters.province)?.cities ?? [];
  return <section aria-label="Filter komunitas" className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5">
    <div className="flex flex-col justify-between gap-4 xl:flex-row">
      <div role="group" aria-label="Daftar komunitas" className="flex shrink-0 gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {([['semua', 'Semua Komunitas'], ['saya', 'Komunitas Saya'], ['pengajuan', 'Pengajuan']] as const).map(([value, label]) =>
          <button type="button" key={value} aria-pressed={tab === value} onClick={() => onTab(value)} className={`min-h-11 flex-1 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap sm:text-sm ${tab === value ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>)}
      </div>
      <label className="relative flex-1 xl:max-w-sm"><span className="sr-only">Cari nama komunitas</span><Search size={18} className="absolute top-3 left-3 text-slate-400" /><input value={search} onChange={event => setDraft({ source: filters.search, value: event.target.value })} type="search" placeholder="Cari nama komunitas…" className={`${inputStyle} pl-10`} /></label>
    </div>
    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_auto]">
      <label><span className="mb-1 block text-xs font-bold text-slate-500">Negara</span><select value={filters.country} disabled={regionsLoading || !countries.length} onChange={event => onFilters({ country: event.target.value, province: null, city: null })} className={inputStyle}><option value="">Semua negara</option>{countries.map(country => <option key={country.name}>{country.name}</option>)}</select></label>
      <label><span className="mb-1 block text-xs font-bold text-slate-500">Provinsi</span><select value={filters.province} disabled={regionsLoading || !provinces.length} onChange={event => onFilters({ province: event.target.value, city: null })} className={inputStyle}><option value="">Semua provinsi</option>{provinces.map(province => <option key={province.name}>{province.name}</option>)}</select></label>
      <label><span className="mb-1 block text-xs font-bold text-slate-500">Kota / Kabupaten</span><select value={filters.city} disabled={regionsLoading || !cities.length} onChange={event => onFilters({ city: event.target.value })} className={inputStyle}><option value="">Semua kota</option>{cities.map(city => <option key={city}>{city}</option>)}</select></label>
      {Object.values(filters).some(Boolean) && <button type="button" onClick={onReset} className={`${secondaryButton} self-end`}><RotateCcw size={16} />Reset filter</button>}
    </div>
  </section>;
}
