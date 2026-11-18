/** Fallback route lazy menyiapkan ruang header dan grid sebelum modul selesai dimuat. */
export function KomunitasSkeleton() {
  return <div role="status" aria-label="Memuat halaman komunitas" className="space-y-6 animate-pulse"><div className="h-24 rounded-2xl bg-slate-200/60" /><div className="h-40 rounded-2xl bg-teal-100/60" /><div className="h-36 rounded-2xl bg-slate-200/60" /><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map(index => <div key={index} className="h-72 rounded-2xl bg-slate-200/60" />)}</div></div>;
}
