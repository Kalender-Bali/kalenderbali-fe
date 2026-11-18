import { useState } from 'react';
import type { KomunitasDetail } from '../types/komunitas.types';
import { useKomunitasMembers } from '../hooks/useKomunitas';
import { KomunitasModal } from './KomunitasModal';
import { QueryErrorState } from '@/components/ui/QueryErrorState';
import { inputStyle, primaryButton, secondaryButton } from './komunitasStyles';

/** Admin menunjuk akun dari katalog asli; pencabutan memerlukan konfirmasi per pengguna. */
export function KomunitasManagersModal({ profile, busy, onClose, onAdd, onRemove }: {
  profile: KomunitasDetail; busy: boolean; onClose: () => void; onAdd: (id: number) => Promise<void>; onRemove: (id: number) => Promise<void>;
}) {
  const members = useKomunitasMembers(true);
  const [selected, setSelected] = useState(''), [search, setSearch] = useState(''), [error, setError] = useState(''), [confirm, setConfirm] = useState<number>();
  const candidates = members.data?.filter(member => !profile.manager.some(manager => manager.user_id === member.id) && `${member.name} ${member.email}`.toLowerCase().includes(search.toLowerCase())) ?? [];
  const run = async (operation: () => Promise<void>) => { setError(''); try { await operation(); setSelected(''); setConfirm(undefined); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Perubahan pengelola gagal.'); } };
  return <KomunitasModal title="Atur Pengelola" description={profile.name} onClose={onClose} busy={busy}>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <ul className="space-y-3">{profile.manager.map(manager => <li key={manager.user_id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-slate-900">{manager.name}</p><p className="break-all text-xs text-slate-500">{manager.email}</p></div><button type="button" disabled={busy} onClick={() => setConfirm(manager.user_id)} className={`${secondaryButton} text-rose-700`}>Cabut akses</button></div>{confirm === manager.user_id && <div className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800"><p>Cabut hak kelola {manager.name} dari komunitas ini?</p><div className="mt-2 flex gap-2"><button type="button" disabled={busy} onClick={() => void run(() => onRemove(manager.user_id))} className={secondaryButton}>Ya, cabut</button><button type="button" disabled={busy} onClick={() => setConfirm(undefined)} className={secondaryButton}>Batal</button></div></div>}</li>)}</ul>
    {!profile.manager.length && <p className="text-sm text-slate-500">Belum ada pengelola.</p>}
    <section className="space-y-3 border-t border-slate-100 pt-4"><h3 className="text-sm font-bold text-slate-900">Tambahkan pengelola</h3>{members.isLoading ? <p role="status" className="text-sm text-slate-500">Memuat pengguna…</p> : members.isError ? <QueryErrorState title="Pengguna belum dapat dimuat" error={members.error} onRetry={() => void members.refetch()} /> : <>
      <label className="block"><span className="sr-only">Cari pengguna</span><input value={search} onChange={event => { setSearch(event.target.value); setSelected(''); }} placeholder="Cari nama atau email pengguna…" className={inputStyle} /></label>
      <label className="block"><span className="sr-only">Pilih pengguna</span><select value={selected} disabled={busy} onChange={event => setSelected(event.target.value)} className={inputStyle}><option value="">Pilih pengguna</option>{candidates.map(member => <option key={member.id} value={member.id}>{member.name} — {member.email}</option>)}</select></label>
      {!candidates.length && <p className="text-sm text-slate-500">Tidak ada pengguna yang sesuai atau semua sudah menjadi pengelola.</p>}
      <button type="button" disabled={busy || !candidates.some(member => member.id === Number(selected))} onClick={() => void run(() => onAdd(Number(selected)))} className={primaryButton}>{busy ? 'Menyimpan…' : 'Tambahkan Pengelola'}</button>
    </>}</section>
  </KomunitasModal>;
}
