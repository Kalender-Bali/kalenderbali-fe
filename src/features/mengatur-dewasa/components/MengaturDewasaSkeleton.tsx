// Skeleton menjaga bentuk halaman saat modul dimuat melalui lazy route.
export function MengaturDewasaSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Memuat halaman Mengatur Dewasa" aria-busy="true">
      <div className="space-y-3"><div className="h-3 w-48 bg-slate-100 rounded-xl" /><div className="h-9 w-64 bg-slate-100 rounded-xl" /><div className="h-4 w-80 max-w-full bg-slate-100 rounded-xl" /></div>
      <div className="h-36 rounded-2xl bg-slate-100" />
      <div className="h-72 rounded-2xl bg-slate-100" />
      <div className="grid lg:grid-cols-12 gap-6"><div className="lg:col-span-8 h-64 rounded-2xl bg-slate-100" /><div className="lg:col-span-4 h-48 rounded-2xl bg-slate-100" /></div>
    </div>
  );
}
