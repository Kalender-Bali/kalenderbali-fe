import { AlertCircle, RefreshCw } from 'lucide-react';

interface QueryErrorStateProps {
  title: string;
  error?: unknown;
  onRetry: () => void;
}

/** Dipakai saat request gagal; hasil kosong tetap ditangani oleh tampilan datanya. */
export function QueryErrorState({ title, error, onRetry }: QueryErrorStateProps) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-200/90 bg-white dark:bg-slate-900 dark:border-rose-900/60 p-5 sm:p-6 shadow-xs space-y-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {error instanceof Error ? error.message : 'Data belum dapat dimuat. Silakan coba lagi.'}
          </p>
        </div>
      </div>
      <button type="button" onClick={onRetry} className="h-11 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-sm font-bold inline-flex items-center gap-2 cursor-pointer [touch-action:manipulation]">
        <RefreshCw className="w-4 h-4" /> Coba Lagi
      </button>
    </div>
  );
}
