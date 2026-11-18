import { Plus, Users, Globe2 } from 'lucide-react';
import { primaryButton } from './komunitasStyles';

/** Statistik menjelaskan cakupan data: jumlah dimuat bukan total seluruh database. */
export function KomunitasHero({ loaded, countries, loading, onRegister }: { loaded: number; countries?: number; loading: boolean; onRegister: () => void }) {
  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="space-y-2"><nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-400">Wargabali <span className="mx-2">/</span> Layanan <span className="mx-2">/</span> <span className="text-teal-700">Komunitas Suka Duka</span></nav>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#0f172a] sm:text-3xl lg:text-4xl">Komunitas Suka Duka</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-500">Temukan paguyuban krama Hindu-Bali, jalin kebersamaan, dan lihat transparansi kas komunitas.</p>
      </div>
      <button type="button" onClick={onRegister} className={primaryButton}><Plus size={18} />Daftarkan Komunitas</button>
    </header>
    <section className="flex flex-col justify-between gap-5 rounded-2xl border border-[#ccf0ea] bg-[#e6f7f5] p-5 sm:p-7 lg:flex-row lg:items-center">
      <div className="flex items-center gap-4"><span className="rounded-2xl bg-white p-3 text-teal-700"><Users size={30} /></span><div><h2 className="text-lg font-extrabold text-slate-900">Bersama dalam suka dan duka</h2><p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">Ruang untuk mengenal komunitas, mengelola profil, dan mencatat kas secara terbuka.</p></div></div>
      <div className="grid shrink-0 grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#ccf0ea] bg-white/80 p-3 text-center"><span className="text-[11px] font-bold text-slate-500">Komunitas dimuat</span><p className="my-1 text-3xl font-extrabold tabular-nums text-slate-900">{loading ? '—' : loaded}</p><span className="text-[10px] text-slate-500">Sesuai tab dan filter aktif</span></div>
        <div className="rounded-xl border border-[#ccf0ea] bg-white/80 p-3 text-center"><span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500"><Globe2 size={12} />Negara jangkauan</span><p className="my-1 text-3xl font-extrabold tabular-nums text-slate-900">{countries ?? '—'}</p><span className="text-[10px] text-slate-500">Cakupan pada tab aktif</span></div>
      </div>
    </section>
  </div>;
}
