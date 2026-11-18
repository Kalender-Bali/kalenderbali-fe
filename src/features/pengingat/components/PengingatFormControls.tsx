import type { ReactNode } from 'react';
import { AlertCircle, ChevronDown, Search } from 'lucide-react';

export const PENGINGAT_INPUT = 'w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0f172a] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-colors tabular-nums disabled:opacity-50';

export function PengingatField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</span>{children}</label>;
}

export function PengingatSelect({ value, onChange, children, disabled = false, required = true }: { value: string; onChange: (value: string) => void; children: ReactNode; disabled?: boolean; required?: boolean }) {
  return <span className="relative block"><select required={required} value={value} onChange={event => onChange(event.target.value)} disabled={disabled} className={`${PENGINGAT_INPUT} appearance-none pr-10 cursor-pointer`}>{children}</select><ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" /></span>;
}

export function PengingatSearchButton({ loading, disabled, children }: { loading: boolean; disabled?: boolean; children: ReactNode }) {
  return <button type="submit" disabled={loading || disabled} className="h-11 px-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-950 font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"><Search className="w-4 h-4" />{loading ? 'Mencari jadwal…' : children}</button>;
}

export function PengingatSourceFeedback({ loading, error, empty, onRetry }: { loading?: boolean; error?: Error | null; empty?: boolean; onRetry?: () => void }) {
  if (loading) return <div role="status" aria-label="Memuat jadwal dari fitur" className="animate-pulse rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3"><div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" /><div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg" /><span className="sr-only">Memuat jadwal dari fitur…</span></div>;
  if (error) return <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs text-rose-700 dark:text-rose-300"><p className="flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error.message || 'Jadwal belum dapat dimuat.'}</p>{onRetry && <button type="button" onClick={onRetry} className="min-h-11 font-bold cursor-pointer">Coba lagi</button>}</div>;
  if (empty) return <p role="status" className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 leading-relaxed">Tidak ada jadwal mendatang yang sesuai pada periode ini. Coba periode atau kriteria lain.</p>;
  return null;
}
