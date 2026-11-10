import { type FormEvent, type ReactNode } from 'react';
import { AlertCircle, ChevronDown, RefreshCw, Search } from 'lucide-react';
import { getIndoMonthName } from '@/features/kalender/utils/calendarUtils';
import type { DewasaActivity, DewasaActivitySummary } from '../types/mengaturDewasa.types';

interface MengaturDewasaFormProps {
  mode: 'activity' | 'custom';
  onModeChange: (mode: 'activity' | 'custom') => void;
  customEditor: ReactNode;
  customHasCriteria: boolean;
  validationError: string | null;
  activities: DewasaActivitySummary[];
  activity: DewasaActivity | null;
  activityId: string;
  month: number;
  year: string;
  isActivitiesLoading: boolean;
  activitiesError: Error | null;
  isActivityLoading: boolean;
  activityError: Error | null;
  isSearching: boolean;
  onActivityChange: (value: string) => void;
  onMonthChange: (value: number) => void;
  onYearChange: (value: string) => void;
  onRetryActivities: () => void;
  onRetryActivity: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const labelClass = 'text-[11px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-widest block mb-1.5';
const inputClass = 'w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0f172a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all';

// Form ini mempertahankan kontrak activity_id sebagai string dan memilih rentang bulan.
export function MengaturDewasaForm({
  mode, onModeChange, customEditor, customHasCriteria, validationError,
  activities, activity, activityId, month, year,
  isActivitiesLoading, activitiesError, isActivityLoading, activityError, isSearching,
  onActivityChange, onMonthChange, onYearChange, onRetryActivities, onRetryActivity, onSubmit,
}: MengaturDewasaFormProps) {
  const hasRules = Boolean(activity && activity.rules.length > 0);
  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] dark:text-white tracking-tight">Susun kriteria</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Pilih kriteria dan periode untuk mencari tanggal.</p>
        </div>
        <div role="group" aria-label="Cara menyusun kriteria" className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex flex-wrap gap-1 self-start">
          {([['activity', 'Gunakan template'], ['custom', 'Kriteria sendiri']] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={mode === value} onClick={() => onModeChange(value)} className={`min-h-11 rounded-lg px-3 text-xs sm:text-sm transition-colors cursor-pointer [touch-action:manipulation] ${mode === value ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'}`}>{label}</button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-4 items-end">
          {mode === 'activity' && <div className="xl:col-span-4">
            <label htmlFor="dewasa-activity" className={labelClass}>Template kegiatan</label>
            <div className="relative">
              <select id="dewasa-activity" value={activityId} onChange={(e) => onActivityChange(e.target.value)} disabled={isActivitiesLoading || Boolean(activitiesError)} required className={`${inputClass} appearance-none pr-10 disabled:bg-slate-50 disabled:text-slate-400`}>
                <option value="">{isActivitiesLoading ? 'Memuat kegiatan...' : 'Pilih kegiatan'}</option>
                {activities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <ChevronDown aria-hidden="true" className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>}
          {/* Kolom periode mengisi ruang yang tersedia sesuai mode form. */}
          <div className={mode === 'activity' ? 'xl:col-span-3' : 'xl:col-span-5'}>
            <label htmlFor="dewasa-month" className={labelClass}>Bulan</label>
            <div className="relative">
              <select id="dewasa-month" value={month} onChange={(e) => onMonthChange(Number(e.target.value))} className={`${inputClass} appearance-none pr-10`}>
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{getIndoMonthName(i + 1)}</option>)}
              </select>
              <ChevronDown aria-hidden="true" className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div className={mode === 'activity' ? 'xl:col-span-3' : 'xl:col-span-5'}>
            <label htmlFor="dewasa-year" className={labelClass}>Tahun</label>
            <input id="dewasa-year" type="number" inputMode="numeric" min="1800" max="2200" step="1" required value={year} onChange={(e) => onYearChange(e.target.value)} className={`${inputClass} tabular-nums`} />
          </div>
          <div className="sm:col-span-2 xl:col-span-2 flex justify-end">
            <button type="submit" disabled={(mode === 'activity' ? !hasRules || Boolean(activityError) || isActivityLoading : !customHasCriteria) || isSearching} className="w-full sm:w-auto sm:min-w-40 h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50 disabled:cursor-not-allowed">
              <Search className="w-4 h-4" /> {isSearching ? 'Mencari tanggal...' : 'Cari tanggal'}
            </button>
          </div>
        </div>

        {mode === 'activity' && activitiesError && (
          <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0" /> <span>Gagal memuat kegiatan: {activitiesError.message}</span>
            <button type="button" onClick={onRetryActivities} className="min-h-11 inline-flex items-center gap-1.5 font-bold text-rose-800 cursor-pointer"><RefreshCw className="w-4 h-4" /> Coba lagi</button>
          </div>
        )}
        {mode === 'activity' && !isActivitiesLoading && !activitiesError && activities.length === 0 && <p className="text-sm text-slate-500">Belum ada template kegiatan yang tersedia.</p>}
        {validationError && <p role="alert" className="text-sm text-rose-700">{validationError}</p>}

        {/* Status pemuatan dan kesalahan template tetap terlihat tanpa menampilkan daftar kriterianya. */}
        {mode === 'activity' && activityId && isActivityLoading && <p role="status" className="text-sm text-slate-500">Memuat kriteria template...</p>}
        {mode === 'activity' && activityId && activityError && <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-rose-800"><AlertCircle className="w-4 h-4" /> <span>Gagal memuat kriteria: {activityError.message}</span><button type="button" onClick={onRetryActivity} className="min-h-11 inline-flex items-center gap-1.5 font-bold cursor-pointer"><RefreshCw className="w-4 h-4" /> Coba lagi</button></div>}
        {mode === 'activity' && activity && !isActivityLoading && !activityError && !hasRules && <p className="text-sm text-slate-500">Template ini belum memiliki kriteria yang dapat digunakan.</p>}

        {/* Penyusunan kriteria ditampilkan hanya untuk mode kriteria sendiri. */}
        {mode === 'custom' && <div className="border-t border-slate-100 pt-5">
          <h3 className="text-sm sm:text-base font-bold text-[#0f172a]">Kriteria yang digunakan</h3>
          <div className="mt-3">{customEditor}</div>
        </div>}
      </form>
    </section>
  );
}
