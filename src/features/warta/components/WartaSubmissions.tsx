import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppDialog } from '@/components/ui/AppDialog';
import { apiClient } from '@/lib/axios';
import { useReadQuery } from '@/lib/useReadQuery';
import { useAlertStore } from '@/stores/useAlertStore';
import { useAuthQueryScope, useAuthStore } from '@/stores/useAuthStore';
import { fetchWartaSubmissions, updateWartaSubmission } from '../api/wartaSubmissionApi';
import type { ArticleBackendItem } from '../types/warta.types';

export function WartaSubmissions({ onClose, onEdit }: { onClose: () => void; onEdit: (article: ArticleBackendItem) => void }) {
  const scope = useAuthQueryScope();
  const token = useAuthStore(state => state.token);
  const admin = useAuthStore(state => state.user?.role.toLowerCase() === 'admin');
  const [rejectId, setRejectId] = useState<number | string | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<ArticleBackendItem | null>(null);
  const [note, setNote] = useState('');
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const list = useReadQuery({ queryKey: ['articles', 'submissions', scope, page], queryFn: () => fetchWartaSubmissions(page), meta: { authScoped: true }, staleTime: 0 });
  const quotas = useReadQuery({ queryKey: ['submission-quotas', scope], queryFn: async () => (await apiClient.get<{ data: { category: string; pending: number; limit: number }[] }>('/users/submission-quotas')).data.data, meta: { authScoped: true }, staleTime: 0 });
  const quota = quotas.data?.find(item => item.category === 'warta');
  async function review(article: ArticleBackendItem, status: 'Review' | 'Published' | 'Rejected', reviewNote = '') {
    if (busy) return;
    setError(''); setBusy(true);
    try {
      await updateWartaSubmission(article.id, status, reviewNote);
      setRejectId(null);
      setNote('');
      setConfirmApprove(null);
      useAlertStore.getState().showAlert(
        status === 'Published'
          ? `Warta "${article.title}" berhasil disetujui dan diterbitkan!`
          : status === 'Rejected'
            ? `Pengajuan warta "${article.title}" berhasil ditolak.`
            : `Pengajuan warta "${article.title}" berhasil dikirim ulang!`
      );
      if (useAuthStore.getState().token !== token) return;
      await Promise.all([client.invalidateQueries({ queryKey: ['articles'] }), quotas.refetch()]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal mengirim ulang.'); }
    finally { setBusy(false); }
  }
  const button = 'min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';
  return <AppDialog title={admin ? "Pengajuan Warta" : "Pengajuan Warta Saya"} description={admin ? "Tinjau Warta yang belum terbit." : "Pantau dan perbaiki Warta yang belum terbit."} onClose={onClose}>
    {!admin && quota && <p className="mb-4 text-sm text-slate-600">Pengajuan menunggu <span className="tabular-nums">{quota.pending}/{quota.limit}</span></p>}
    {!admin && quotas.isError && <p className="mb-4 text-sm text-rose-700">Kuota belum dapat dimuat. <button type="button" className="underline" onClick={() => void quotas.refetch()}>Coba lagi</button></p>}
    {list.isLoading ? <p role="status">Memuat pengajuan…</p> : list.isError ? <p role="alert">Pengajuan belum dapat dimuat. <button type="button" className="underline" onClick={() => void list.refetch()}>Coba lagi</button></p> : !list.data?.data.length ? <p className="text-sm text-slate-500">Belum ada pengajuan Warta.</p> : <div className="space-y-3">{list.data.data.map(article => <article key={article.id} className="rounded-xl border border-slate-200 p-4"><h3 className="font-bold">{article.title}</h3><p className="mt-1 text-sm text-slate-500">{article.publication_status === 'Rejected' ? 'Ditolak' : 'Menunggu review'}</p>{article.review_note && <p className="mt-2 whitespace-pre-wrap text-sm">Catatan admin: {article.review_note}</p>}<div className="mt-3 flex flex-wrap gap-2"><button type="button" className={button} disabled={busy} onClick={() => onEdit(article)}>Edit Pengajuan</button>{!admin && article.publication_status === 'Rejected' && <button type="button" className={button} disabled={busy || !quota || quota.pending >= quota.limit} onClick={() => void review(article, 'Review')}>Kirim Ulang</button>}{admin && article.publication_status === 'Review' && <><button type="button" className={button} disabled={busy} onClick={() => setConfirmApprove(article)}>Setujui</button><button type="button" className={button} disabled={busy} onClick={() => { setRejectId(article.id); setNote(''); }}>Tolak</button></>}</div>{admin && rejectId === article.id && <form className="mt-3 space-y-2" onSubmit={event => { event.preventDefault(); if (note.trim()) void review(article, 'Rejected', note.trim()); }}><label className="block text-sm font-semibold">Alasan penolakan<textarea required maxLength={2000} value={note} onChange={event => setNote(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 p-3" /></label><button className={button} disabled={busy}>Kirim penolakan</button></form>}</article>)}</div>}
    {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
    <div className="mt-4 flex gap-2"><button type="button" className={button} disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button><button type="button" className={button} disabled={page * 20 >= (list.data?.total ?? 0)} onClick={() => setPage(page + 1)}>Berikutnya</button></div>
    {confirmApprove && (
      <AppDialog
        title="Setujui Pengajuan Warta"
        description={`Setujui dan publikasikan artikel warta "${confirmApprove.title}" ke katalog warta budaya?`}
        onClose={() => { if (!busy) setConfirmApprove(null); }}
        footer={
          <>
            <button type="button" className={button} disabled={busy} onClick={() => setConfirmApprove(null)}>Batal</button>
            <button
              type="button"
              className="min-h-11 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
              disabled={busy}
              onClick={() => void review(confirmApprove, 'Published')}
            >
              {busy ? 'Menyetujui…' : 'Ya, Setujui'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Artikel warta yang disetujui akan langsung tampil di halaman Warta Budaya publik.</p>
      </AppDialog>
    )}
  </AppDialog>;
}
