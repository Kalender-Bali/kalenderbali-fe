import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppDialog } from '@/components/ui/AppDialog';
import { ProfileContributor } from '@/features/profile/components/ProfileContributor';
import { useAlertStore } from '@/stores/useAlertStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { submitKeterangan } from '../api/keteranganSubmissionApi';
import type { KeteranganValue } from '../types/keterangan.types';

const secondary = 'min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';
const primary = 'min-h-11 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50';

export function KeteranganEdit({ item }: { item: KeteranganValue }) {
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const [params, setParams] = useSearchParams();
  const allowed = Boolean(token && ['contributor', 'member', 'admin'].includes(user?.role.trim().toLowerCase() ?? ''));
  const resume = params.has('contributor_action') && params.get('contributor_value') === String(item.id);
  const [dialog, setDialog] = useState<'gate' | 'edit' | 'success' | null>(() => resume ? (allowed ? 'edit' : 'gate') : null);
  const [description, setDescription] = useState(item.description || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // ID mempertahankan elemen yang dipilih saat pengguna kembali dari login.
  useEffect(() => {
    if (!resume) return;
    const next = new URLSearchParams(params);
    next.delete('contributor_action'); next.delete('contributor_value');
    setParams(next, { replace: true });
  }, [resume, params, setParams]);

  const openEdit = () => {
    setError('');
    setDescription(item.description || '');
    if (!token) {
      const next = new URLSearchParams(params);
      next.set('contributor_value', String(item.id));
      setParams(next, { replace: true });
    }
    setDialog(allowed ? 'edit' : 'gate');
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const trimmed = description.trim();
    if (!trimmed || [...trimmed].length > 20000) { setError('Isi keterangan sampai 20.000 karakter.'); return; }
    setBusy(true); setError('');
    try {
      await submitKeterangan(String(item.id), trimmed);
      if (useAuthStore.getState().token === token) {
        setDialog('success');
        useAlertStore.getState().showAlert('Pengajuan edit keterangan berhasil dikirim!');
      }
    } catch (cause) {
      if (useAuthStore.getState().token === token) setError(cause instanceof Error ? cause.message : 'Pengajuan gagal dikirim.');
    } finally { setBusy(false); }
  }

  return <>
    <button type="button" className={secondary} onClick={openEdit}>Ajukan Edit Keterangan</button>
    {dialog === 'gate' && <ProfileContributor gate admin={false} contributor={false} actionClassName={secondary} onClose={() => setDialog(null)} />}
    {dialog === 'edit' && <AppDialog title="Ajukan Edit Keterangan" description={`Usulan untuk ${item.name} akan ditinjau oleh admin.`} focusField onClose={() => { if (!busy) setDialog(null); }} footer={<><button type="button" className={secondary} disabled={busy} onClick={() => setDialog(null)}>Batal</button><button form={`edit-keterangan-${item.id}`} className={primary} disabled={busy}>{busy ? 'Mengirim…' : 'Kirim Pengajuan'}</button></>}>
      <form id={`edit-keterangan-${item.id}`} onSubmit={submit} className="space-y-2">
        <label className="block text-sm font-semibold">
          Usulan keterangan
          <textarea
            name="description"
            required
            maxLength={20000}
            rows={8}
            value={description}
            onChange={event => setDescription(event.target.value)}
            className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm font-normal"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <button type="button" onClick={() => setDescription(item.description || '')} className="font-medium text-teal-700 hover:underline">
            Reset ke teks semula
          </button>
          <span>{[...description].length.toLocaleString('id-ID')} / 20.000 karakter</span>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
      </form>
    </AppDialog>}
    {dialog === 'success' && <AppDialog title="Pengajuan terkirim" description="Admin akan meninjau usulan edit Keterangan Anda." onClose={() => setDialog(null)} footer={<button type="button" className={primary} onClick={() => setDialog(null)}>Selesai</button>}><p className="text-sm text-slate-600">Pantau statusnya melalui tombol Pengajuan Keterangan pada halaman ini.</p></AppDialog>}
  </>;
}
