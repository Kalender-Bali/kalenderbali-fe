import { Users, Plus } from 'lucide-react';
import type { KomunitasSummary } from '../types/komunitas.types';
import { KomunitasCard } from './KomunitasCard';
import { primaryButton, secondaryButton } from './komunitasStyles';

/** Skeleton memakai ukuran kartu; empty state hanya dipakai setelah request berhasil. */
export function KomunitasList({ items, loading, more, loadingMore, onMore, onOpen, onRegister, filtered }: {
  items: KomunitasSummary[]; loading: boolean; more: boolean; loadingMore: boolean; onMore: () => void;
  onOpen: (id: number, view: 'detail' | 'kas') => void; onRegister: () => void; filtered: boolean;
}) {
  if (loading && !items.length) return <div role="status" aria-label="Memuat komunitas" className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="min-h-72 animate-pulse space-y-5 rounded-2xl border border-slate-200 bg-white p-5"><div className="h-12 w-12 rounded-xl bg-slate-100" /><div className="h-5 w-3/4 rounded bg-slate-100" /><div className="h-16 rounded bg-slate-100" /><div className="h-11 rounded bg-slate-100" /></div>)}</div>;
  if (!items.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Users size={36} className="mx-auto text-teal-600" /><h2 className="mt-4 text-lg font-extrabold text-slate-900">{filtered ? 'Komunitas tidak ditemukan' : 'Belum ada komunitas pada daftar ini'}</h2><p className="mx-auto mt-2 mb-5 max-w-md text-sm text-slate-500">{filtered ? 'Coba kata pencarian atau wilayah lain.' : 'Mulai daftarkan suka duka atau paguyuban Anda untuk membangun kebersamaan.'}</p><button type="button" onClick={onRegister} className={primaryButton}><Plus size={16} />Daftarkan Komunitas</button></div>;
  return <div className="space-y-5"><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map(item => <KomunitasCard key={item.id} item={item} onOpen={onOpen} />)}</div>{more && <div className="text-center"><button type="button" disabled={loadingMore} onClick={onMore} className={secondaryButton}>{loadingMore ? 'Memuat…' : 'Muat Lebih Banyak'}</button></div>}</div>;
}
