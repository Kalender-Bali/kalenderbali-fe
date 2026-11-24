import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppDialog } from '@/components/ui/AppDialog';
import { useReadQuery } from '@/lib/useReadQuery';
import { useAlertStore } from '@/stores/useAlertStore';
import { useAuthQueryScope, useAuthStore } from '@/stores/useAuthStore';
import { fetchKeteranganSubmissions, reviewKeterangan, type KeteranganSubmission } from '../api/keteranganSubmissionApi';

const button = 'min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';
const labels = { Review: 'Menunggu review', Approved: 'Disetujui', Rejected: 'Ditolak' };

export function KeteranganSubmissions({ onClose }: { onClose: () => void }) {
  const scope = useAuthQueryScope();
  const token = useAuthStore(state => state.token);
  const admin = useAuthStore(state => state.user?.role.trim().toLowerCase() === 'admin');
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reject, setReject] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [approveItem, setApproveItem] = useState<KeteranganSubmission | null>(null);
  const list = useReadQuery({ queryKey: ['keterangan-submissions', scope, admin, page], queryFn: () => fetchKeteranganSubmissions(admin, page), meta: { authScoped: true }, staleTime: 0 });

  async function review(item: KeteranganSubmission, approve: boolean, reviewNote = '') {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await reviewKeterangan(item.id, approve, reviewNote);
      if (useAuthStore.getState().token !== token) return;
      setReject(null); setNote(''); setApproveItem(null);
      useAlertStore.getState().showAlert(
        approve
          ? `Usulan keterangan "${item.item_name}" berhasil disetujui!`
          : `Usulan keterangan "${item.item_name}" berhasil ditolak.`
      );
      await Promise.all([list.refetch(), client.invalidateQueries({ queryKey: ['keterangan'] }), client.invalidateQueries({ queryKey: ['hari-raya'] })]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal memproses pengajuan.'); }
    finally { setBusy(false); }
  }

  return <AppDialog title={admin ? 'Review Pengajuan Keterangan' : 'Pengajuan Keterangan Saya'} description={admin ? 'Bandingkan teks sebelum mengambil keputusan.' : 'Pantau status dan catatan admin untuk usulan Anda.'} onClose={() => { if (!busy) onClose(); }}>
    {list.isLoading ? <p role="status">Memuat pengajuan…</p> : list.isError ? <p role="alert">Pengajuan belum dapat dimuat. <button type="button" className="underline" onClick={() => void list.refetch()}>Coba lagi</button></p> : !list.data?.data.length ? <p className="text-sm text-slate-500">Belum ada pengajuan Keterangan.</p> : <div className="space-y-3">{list.data.data.map(item => <article key={item.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
      <div><h3 className="font-bold">{item.item_name}</h3><p className="text-sm text-slate-500">{labels[item.status]}{admin && ` · ${item.submitter_name}`}</p></div>
      <div className="grid gap-3 sm:grid-cols-2"><div><h4 className="text-xs font-bold text-slate-500">Keterangan sebelumnya</h4><p className="whitespace-pre-wrap break-words text-sm">{item.original_description || 'Belum ada keterangan'}</p></div><div><h4 className="text-xs font-bold text-slate-500">Usulan</h4><p className="whitespace-pre-wrap break-words text-sm">{item.proposed_description}</p></div></div>
      {item.review_note && <p className="whitespace-pre-wrap break-words text-sm">Catatan admin: {item.review_note}</p>}
      {admin && item.status === 'Review' && <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={busy} onClick={() => setApproveItem(item)}>Setujui</button><button type="button" className={button} disabled={busy} onClick={() => { setReject(item.id); setNote(''); }}>Tolak</button></div>}
      {admin && reject === item.id && <form className="space-y-2" onSubmit={event => { event.preventDefault(); if (note.trim()) void review(item, false, note.trim()); }}><label className="block text-sm font-semibold">Alasan penolakan<textarea required maxLength={2000} value={note} onChange={event => setNote(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 p-3" /></label><button className={button} disabled={busy}>Kirim penolakan</button></form>}
    </article>)}</div>}
    {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error} <button type="button" className="underline" onClick={() => void list.refetch()}>Muat ulang</button></p>}
    <div className="mt-4 flex flex-wrap gap-2"><button type="button" className={button} disabled={page <= 1 || busy} onClick={() => setPage(page - 1)}>Sebelumnya</button><button type="button" className={button} disabled={busy || page * 20 >= (list.data?.total ?? 0)} onClick={() => setPage(page + 1)}>Berikutnya</button></div>
    {approveItem && (
      <AppDialog
        title="Setujui Usulan Keterangan"
        description={`Setujui usulan perubahan untuk ${approveItem.item_name}? Teks keterangan resmi akan langsung diperbarui dengan usulan baru ini.`}
        onClose={() => { if (!busy) setApproveItem(null); }}
        footer={
          <>
            <button
              type="button"
              className={button}
              disabled={busy}
              onClick={() => setApproveItem(null)}
            >
              Batal
            </button>
            <button
              type="button"
              className="min-h-11 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
              disabled={busy}
              onClick={() => void review(approveItem, true)}
            >
              {busy ? 'Menyetujui…' : 'Ya, Setujui'}
            </button>
          </>
        }
      >
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-slate-700">Elemen: {approveItem.item_name}</p>
          <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3">
            <span className="text-xs font-bold text-teal-800">Teks usulan yang akan diterbitkan:</span>
            <p className="mt-1 whitespace-pre-wrap break-words text-slate-700">{approveItem.proposed_description}</p>
          </div>
        </div>
      </AppDialog>
    )}
  </AppDialog>;
}
