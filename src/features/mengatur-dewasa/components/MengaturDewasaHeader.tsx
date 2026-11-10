import { formatFullIndoDate, getIndoDayName } from '@/features/kalender/utils/calendarUtils';

interface MengaturDewasaHeaderProps {
  today: string;
}

// Header mengikuti hierarki breadcrumb dan tipografi halaman layanan lain.
export function MengaturDewasaHeader({ today }: MengaturDewasaHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="space-y-1.5">
        <nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-400 flex items-center gap-2 select-none">
          <span>Wargabali</span><span className="text-slate-300">/</span>
          <span>Layanan</span><span className="text-slate-300">/</span>
          <span className="text-teal-700 font-bold">Mengatur Dewasa</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
          Mengatur Dewasa
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
          Temukan tanggal berdasarkan kriteria kegiatan dalam penanggalan Bali.
        </p>
      </div>
      <p className="text-xs font-semibold text-slate-500 tabular-nums">
        {getIndoDayName(today)}, {formatFullIndoDate(today)}
      </p>
    </div>
  );
}
