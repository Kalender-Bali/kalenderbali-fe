import { useState } from 'react';
import { AppDialog } from '@/components/ui/AppDialog';
import { apiClient } from '@/lib/axios';
import { useReadQuery } from '@/lib/useReadQuery';
import { useAlertStore } from '@/stores/useAlertStore';
import { useAuthQueryScope, useAuthStore } from '@/stores/useAuthStore';
import { fetchPuraSubmissions, reviewPuraProfile, type PuraSubmission } from '../api/puraProfileApi';

export function PuraSubmissions({ onClose, onEdit }: { onClose: () => void; onEdit: (item: PuraSubmission) => void }) {
  const scope = useAuthQueryScope();
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  const admin = user?.role.toLowerCase() === 'admin';
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<PuraSubmission | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const list = useReadQuery({ queryKey: ['pura', 'submissions', scope], queryFn: fetchPuraSubmissions, meta: { authScoped: true }, staleTime: 0 });
  const quotas = useReadQuery({ queryKey: ['submission-quotas', scope], queryFn: async () => (await apiClient.get<{data: {category: string; pending: number; limit: number}[]}>('/users/submission-quotas')).data.data, meta: { authScoped: true }, enabled: !admin, staleTime: 0 });
  const quota = quotas.data?.find(item => item.category === 'pura');
  const button = 'min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold disabled:opacity-50';
  async function review(id: number, status: 'Review' | 'Rejected' | 'Published', reason = '') {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await reviewPuraProfile(id, status, reason);
      if (useAuthStore.getState().token !== token) return;
      setSelected(null); setNote(''); setConfirmApprove(null);
      useAlertStore.getState().showAlert(
        status === 'Published'
          ? 'Profil Pura berhasil disetujui dan dipublikasikan!'
          : status === 'Rejected'
            ? 'Pengajuan Pura berhasil ditolak.'
            : 'Pengajuan Pura berhasil dikirim ulang!'
      );
      await Promise.all([list.refetch(), ...(!admin ? [quotas.refetch()] : [])]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Pengajuan gagal diperbarui.'); }
    finally { setBusy(false); }
  }
  return <AppDialog title={admin ? 'Pengajuan Pura' : 'Pengajuan Pura Saya'} description="Pantau pengajuan profil Pura." onClose={onClose}>
    {quota && <p className="mb-4 text-sm">Pengajuan menunggu <span className="tabular-nums">{quota.pending}/{quota.limit}</span></p>}
    {quotas.isError && <button className="text-sm underline" onClick={() => void quotas.refetch()}>Muat ulang kuota</button>}
    {list.isLoading ? <p role="status">Memuat pengajuan…</p> : list.isError ? <p role="alert">Pengajuan belum dapat dimuat. <button className="underline" onClick={() => void list.refetch()}>Coba lagi</button></p> : !list.data?.length ? <p className="text-sm">Belum ada pengajuan Pura.</p> : <div className="space-y-3">{list.data.map(item => <article key={item.id} className="rounded-xl border border-slate-200 p-4"><h3 className="font-bold">{item.name}</h3><p className="text-sm">{item.type} · {item.status === 'Rejected' ? 'Ditolak' : 'Menunggu review'}</p>{item.address && <p className="text-sm">{item.address}</p>}{item.review_note && <p className="mt-2 text-sm">Catatan admin: {item.review_note}</p>}<div className="mt-3 flex flex-wrap gap-2">{(admin || String(item.submitted_by) === String(user?.id)) && <button className={button} disabled={busy} onClick={() => onEdit(item)}>Edit Pengajuan</button>}{!admin && item.status === 'Rejected' && String(item.submitted_by) === String(user?.id) && <button className={button} disabled={busy || !quota || quota.pending >= quota.limit} onClick={() => void review(item.id, 'Review')}>Kirim Ulang</button>}{admin && item.status === 'Review' && <><button className={button} disabled={busy} onClick={() => setConfirmApprove(item)}>Setujui</button><button className={button} disabled={busy} onClick={() => setSelected(item.id)}>Tolak</button></>}</div>{selected === item.id && <form className="mt-3 space-y-2" onSubmit={event => { event.preventDefault(); if (note.trim()) void review(item.id, 'Rejected', note.trim()); }}><label className="block text-sm font-semibold">Alasan penolakan<textarea required maxLength={2000} value={note} onChange={event => setNote(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 p-3" /></label><button disabled={busy} className={button}>Kirim penolakan</button></form>}</article>)}</div>}
    {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
    {confirmApprove && (
      <AppDialog
        title="Setujui Pengajuan Pura"
        description={`Setujui dan publikasikan profil pura "${confirmApprove.name}" ke katalog publik?`}
        onClose={() => { if (!busy) setConfirmApprove(null); }}
        footer={
          <>
            <button type="button" className={button} disabled={busy} onClick={() => setConfirmApprove(null)}>Batal</button>
            <button
              type="button"
              className="min-h-11 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
              disabled={busy}
              onClick={() => void review(confirmApprove.id, 'Published')}
            >
              {busy ? 'Menyetujui…' : 'Ya, Setujui'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Profil Pura yang disetujui akan dapat dilihat oleh seluruh pengguna aplikasi.</p>
      </AppDialog>
    )}
  </AppDialog>;
}
