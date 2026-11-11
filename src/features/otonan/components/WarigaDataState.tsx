import { AlertCircle } from 'lucide-react';

interface WarigaDataStateProps {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/** Data kalender yang belum tersedia tidak diganti dengan hasil perhitungan rekaan. */
export function WarigaDataState({ isLoading, isError, onRetry }: WarigaDataStateProps) {
  if (isLoading) {
    return (
      <div role="status" aria-label="Memuat rincian Wariga" className="p-6 space-y-3.5 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div key={index} className="flex justify-between py-2 border-b border-slate-100">
            <div className="h-4 bg-slate-200 rounded w-28" />
            <div className="h-4 bg-slate-200 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div role={isError ? 'alert' : 'status'} className="p-6 bg-white space-y-3">
      <div className="flex items-center gap-2 text-amber-800">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <p className="text-sm font-bold">
          {isError ? 'Rincian Wariga gagal dimuat' : 'Rincian Wariga belum tersedia'}
        </p>
      </div>
      <p className="text-xs text-slate-500">
        {isError ? 'Periksa koneksi Anda lalu coba lagi.' : 'Data kalender untuk tanggal ini belum tersedia.'}
      </p>
      <button type="button" onClick={onRetry} className="h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer">
        Coba Lagi
      </button>
    </div>
  );
}
