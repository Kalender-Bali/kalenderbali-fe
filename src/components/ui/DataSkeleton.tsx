/** Skeleton untuk satu blok data; label hanya dibacakan pembaca layar. */
export function DataSkeleton({ label = 'Memuat data...', className = 'h-48' }: { label?: string; className?: string }) {
  return <div role="status" aria-busy="true" aria-label={label} className={`rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 p-5 sm:p-6 ${className}`}>
    <span className="sr-only">{label}</span>
    <div aria-hidden="true" className="h-full space-y-4 animate-pulse">
      <div className="h-5 w-2/5 rounded-lg bg-slate-100 dark:bg-slate-800" />
      <div className="h-4 w-3/4 rounded-lg bg-slate-100 dark:bg-slate-800" />
      <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
    </div>
  </div>;
}
