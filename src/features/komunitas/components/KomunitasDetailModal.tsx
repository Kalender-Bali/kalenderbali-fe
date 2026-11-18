import { useState } from 'react';
import { MapPin, Phone, ExternalLink, Pencil, Users, Trash2, Wallet } from 'lucide-react';
import type { KomunitasDetail } from '../types/komunitas.types';
import { useKomunitasFinance } from '../hooks/useKomunitas';
import { rupiah, safeHttpUrl, statusStyle, todayWita } from '../utils/komunitasUtils';
import { KomunitasModal } from './KomunitasModal';
import { primaryButton, secondaryButton } from './komunitasStyles';
import { QueryErrorState } from '@/components/ui/QueryErrorState';

/** Ringkasan cepat kas diambil hanya ketika tab kas dipasang, bukan untuk seluruh kartu. */
function QuickFinance({ profile, onOpen }: { profile: KomunitasDetail; onOpen: () => void }) {
  const { summary } = useKomunitasFinance(profile.id, todayWita().slice(0, 4));
  return <div className="space-y-4"><p className="text-sm text-slate-500">Ringkasan tahun <span className="tabular-nums">{todayWita().slice(0, 4)}</span> untuk {profile.name}.</p>
    {summary.isLoading ? <p role="status" className="animate-pulse rounded-xl bg-slate-100 p-6">Memuat ringkasan kas…</p> : summary.isError ? <QueryErrorState title="Ringkasan belum dapat dimuat" error={summary.error} onRetry={() => void summary.refetch()} /> : summary.data && <dl className="grid gap-3 sm:grid-cols-3">{[['Saldo tahun terpilih', summary.data.saldo], ['Pemasukan', summary.data.total_debit], ['Pengeluaran', summary.data.total_kredit]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-2 text-sm font-extrabold tabular-nums text-slate-900">{rupiah(Number(value))}</dd></div>)}</dl>}
    <button type="button" onClick={onOpen} className={primaryButton}><Wallet size={17} />Buka Buku Kas Lengkap</button>
  </div>;
}
/** Detail menggabungkan informasi publik, pintasan kas, dan aksi sesuai hak profil aktif. */
export function KomunitasDetailModal({ profile, loading, error, onRetry, onClose, canManage, admin, onAction, onKas, onModerate, busy, actionError }: {
  profile?: KomunitasDetail; loading: boolean; error: unknown; onRetry: () => void; onClose: () => void;
  canManage: boolean; admin: boolean; onAction: (action: string) => void; onKas: () => void;
  onModerate: (status: 'Published' | 'Rejected') => void; busy: boolean; actionError: string;
}) {
  const [tab, setTab] = useState('info');
  const map = safeHttpUrl(profile?.location_url || '');
  return <KomunitasModal title={profile?.name || 'Profil Komunitas'} onClose={onClose} busy={busy}>
    {loading ? <div role="status" className="h-64 animate-pulse rounded-xl bg-slate-100" aria-label="Memuat profil" /> : error ? <QueryErrorState title="Profil belum dapat dibuka" error={error} onRetry={onRetry} /> : profile && <>
      <div className="flex gap-2"><span className="rounded-lg bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">Suka Duka</span><span className={`rounded-lg px-3 py-1 text-xs font-bold ${statusStyle[profile.status]}`}>{profile.status}</span></div>
      <div role="group" aria-label="Bagian profil" className="flex gap-1 rounded-xl bg-slate-100 p-1">{[['info', 'Informasi'], ['kas', 'Buku Kas']].map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value)} aria-pressed={tab === value} className={`min-h-11 flex-1 rounded-lg text-sm font-bold ${tab === value ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>{label}</button>)}</div>
      {tab === 'kas' ? <QuickFinance profile={profile} onOpen={onKas} /> : <div className="space-y-5">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"><p className="flex gap-2"><MapPin size={18} className="shrink-0" />{[profile.address, profile.city, profile.province, profile.country].filter(Boolean).join(', ') || 'Alamat belum tersedia'}</p>
          <p className="flex items-center gap-2"><Phone size={17} />{profile.phone || 'Telepon belum tersedia'}</p>
          {map && <a href={map} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-bold text-teal-700"><ExternalLink size={16} />Buka Google Maps</a>}
          {profile.latitude != null && profile.longitude != null && <p className="text-xs tabular-nums text-slate-500">Koordinat: {profile.latitude}, {profile.longitude}</p>}
        </div>
        <section><h3 className="mb-2 text-sm font-bold text-slate-900">Pengelola komunitas</h3>{profile.manager.length ? <ul className="space-y-2">{profile.manager.map(manager => <li key={manager.user_id} className="flex items-center gap-2 text-sm text-slate-600"><Users size={16} />{manager.name}</li>)}</ul> : <p className="text-sm text-slate-500">Belum ada pengelola terdaftar.</p>}</section>
      </div>}
      {actionError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{actionError}</p>}
      {/* Hak mutasi mengikuti mapping profil; moderasi dan pengelola hanya untuk Admin. */}
      {admin && profile.status === 'Review' && <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">Pengajuan menunggu peninjauan Anda.</p><div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => onModerate('Published')} className={primaryButton}>Setujui</button><button type="button" disabled={busy} onClick={() => onModerate('Rejected')} className={secondaryButton}>Tolak Pengajuan</button></div></div>}
      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">{canManage && <button type="button" disabled={busy} onClick={() => onAction('edit')} className={secondaryButton}><Pencil size={16} />Edit Profil</button>}{admin && <><button type="button" disabled={busy} onClick={() => onAction('managers')} className={secondaryButton}><Users size={16} />Atur Pengelola</button><button type="button" disabled={busy} onClick={() => onAction('delete')} className={`${secondaryButton} text-rose-700`}><Trash2 size={16} />Hapus Komunitas</button></>}</div>
    </>}
  </KomunitasModal>;
}
