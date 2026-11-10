import { ListChecks } from 'lucide-react';
import type { DewasaCriteriaSummary, DewasaSearchResponse } from '../types/mengaturDewasa.types';

interface Props {
  response: DewasaSearchResponse | undefined;
  criteria: DewasaCriteriaSummary | null;
}

// Ringkasan memakai metadata respons dan snapshot kriteria saat tombol cari ditekan.
export function MengaturDewasaSummary({ response, criteria }: Props) {
  return (
    <aside className="space-y-6">
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs">
        <h2 className="text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-white tracking-tight">Ringkasan analisis</h2>
        {response ? (
          <dl className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-3"><dt className="text-sm text-slate-600 dark:text-slate-300 order-2">hari dianalisis</dt><dd className="text-2xl font-extrabold tabular-nums text-[#0f172a] dark:text-white">{response.meta.evaluated_days}</dd></div>
            <div className="flex items-center gap-3"><dt className="text-sm text-slate-600 dark:text-slate-300 order-2">tanggal memenuhi kriteria</dt><dd className="text-2xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">{response.meta.eligible_days}</dd></div>
            <div className="flex items-center gap-3"><dt className="text-sm text-slate-600 dark:text-slate-300 order-2">tanggal memiliki konflik</dt><dd className="text-2xl font-extrabold tabular-nums text-rose-600 dark:text-rose-400">{response.meta.conflict_days}</dd></div>
          </dl>
        ) : <p className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 flex items-start gap-2"><ListChecks className="w-4 h-4 shrink-0 mt-0.5" /> Ringkasan muncul setelah pencarian.</p>}
      </section>
      {response && criteria && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 shadow-xs">
          <h2 className="text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-white tracking-tight">Kriteria pencarian</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{response.data.activity?.name ?? 'Kriteria sendiri'}</p>
          {criteria.mode === 'custom' && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Semua syarat dalam kelompok harus cocok; antarkelompok berlaku salah satu.</p>}
          {criteria.sections.map((section) => (
            <div key={section.label} className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-[#0f172a] dark:text-white">{section.label}</h3>
              {section.groups.some((group) => group.length > 0) ? section.groups.map((group, index) => group.length > 0 && (
                <div key={index} className="mt-2">
                  {criteria.mode === 'custom' && <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kelompok {index + 1}</p>}
                  <ul className="mt-1 space-y-1">{group.map((item, itemIndex) => <li key={`${item}-${itemIndex}`} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item}</li>)}</ul>
                </div>
              )) : <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tidak ada</p>}
            </div>
          ))}
        </section>
      )}
    </aside>
  );
}
