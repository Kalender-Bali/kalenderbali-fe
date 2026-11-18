import { Users, MapPin, ArrowUpRight, Wallet } from 'lucide-react';
import type { KomunitasSummary } from '../types/komunitas.types';
import { statusStyle } from '../utils/komunitasUtils';
import { secondaryButton } from './komunitasStyles';

/** Kartu hanya memakai summary; kontak dan daftar pengelola dimuat saat detail dibuka. */
export function KomunitasCard({ item, onOpen }: { item: KomunitasSummary; onOpen: (id: number, view: 'detail' | 'kas') => void }) {
  return <article className="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-3"><span className="rounded-xl bg-[#e6f7f5] p-3 text-teal-700"><Users size={24} /></span><span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-700">Suka Duka</span></div>
    <h2 className="text-base font-extrabold leading-relaxed text-slate-900">{item.name}</h2>
    <div className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-slate-500"><MapPin size={16} className="mt-1 shrink-0" /><p>{[item.location.address, item.location.city, item.location.province, item.location.country].filter(Boolean).join(', ') || 'Lokasi belum diatur'}</p></div>
    {item.status && <span className={`mt-4 self-start rounded-lg px-2.5 py-1 text-xs font-bold ${statusStyle[item.status]}`}>{item.status === 'Review' ? 'Menunggu review' : item.status === 'Rejected' ? 'Ditolak' : 'Terbit'}</span>}
    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4"><button type="button" className={`${secondaryButton} flex-1`} onClick={() => onOpen(item.id, 'detail')}>Lihat Profil<ArrowUpRight size={16} /></button><button type="button" className={`${secondaryButton} text-teal-700`} onClick={() => onOpen(item.id, 'kas')}><Wallet size={16} />Buku Kas</button></div>
  </article>;
}
