import type { PawukonHarianInfo } from '../types/alaAyuning.types';

/** Atribut penanggalan sebagai satu baris informasi di bawah tanggal hasil. */
export function AlaAyuningPawukonSection({ pawukonInfo }: { pawukonInfo: PawukonHarianInfo | null }) {
  if (!pawukonInfo) {
    return <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Data Pawukon belum tersedia untuk tanggal ini.</p>;
  }

  const dimensions = [
    { label: 'Saptawara', value: pawukonInfo.saptawara, color: 'text-[#0f766e] dark:text-teal-300' },
    { label: 'Pancawara', value: pawukonInfo.pancawara, color: 'text-[#15803d] dark:text-emerald-300' },
    { label: 'Wuku', value: pawukonInfo.wuku, color: 'text-[#6d28d9] dark:text-violet-300' },
    { label: 'Sasih', value: pawukonInfo.sasih, color: 'text-[#b45309] dark:text-amber-300' },
    { label: 'Urip (Neptu)', value: pawukonInfo.urip, color: 'text-slate-900 dark:text-white' },
  ];

  return (
    <dl aria-label="Pawukon tanggal pilihan" className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-8">
      {dimensions.map(({ label, value, color }) => (
        <div key={label} className="min-w-0 space-y-1">
          <dt className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{label}</dt>
          <dd className={`text-sm font-bold break-words tabular-nums ${color}`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
