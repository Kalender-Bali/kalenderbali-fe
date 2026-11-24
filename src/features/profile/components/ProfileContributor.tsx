import { useState, type FormEvent } from 'react';
import { ArrowRight, HandHeart } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppDialog } from '@/components/ui/AppDialog';
import { apiClient } from '@/lib/axios';
import { useReadQuery } from '@/lib/useReadQuery';
import { useAlertStore } from '@/stores/useAlertStore';
import { useAuthQueryScope, useAuthStore } from '@/stores/useAuthStore';

type Application = { status: 'pending' | 'approved' | 'rejected'; description: string; review_note?: string };
const statusLabels = { pending: 'Menunggu persetujuan', approved: 'Disetujui', rejected: 'Ditolak' };

export function ProfileContributor({ admin, contributor, actionClassName, gate = false, onClose }: {
  admin: boolean;
  contributor: boolean;
  actionClassName: string;
  gate?: boolean;
  onClose?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = useAuthStore(state => state.isAuthenticated);
  const scope = useAuthQueryScope();
  const token = useAuthStore(state => state.token);
  const [open, setOpen] = useState(gate);
  const [step, setStep] = useState<'access' | 'form' | 'success'>(gate ? 'access' : 'form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const query = useReadQuery({
    queryKey: ['profile', 'contributor-application', scope],
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<{ data: Application | null }>('/users/contributor-application', { signal });
      return response.data.data;
    },
    enabled: !admin && authenticated,
    meta: { authScoped: true },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const application = query.data;
  const status = submitted ? 'pending' : application?.status;
  const canApply = !admin && !contributor && query.isSuccess && status !== 'pending';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !canApply) return;
    const description = String(new FormData(event.currentTarget).get('description') ?? '').trim();
    const length = [...description].length;
    if (length < 10 || length > 2000) {
      setError('Alasan wajib berisi 10–2.000 karakter.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await apiClient.post('/users/request-contributor', { description });
      if (useAuthStore.getState().token !== token) return;
      // Tampilkan pending segera agar pengguna tidak mengirim pengajuan yang sama lagi.
      setSubmitted(true);
      useAlertStore.getState().showAlert('Permohonan status kontributor berhasil dikirim!');
      if (gate) setStep('success');
      else setOpen(false);
      const result = await query.refetch();
      if (result.isSuccess) setSubmitted(false);
    } catch (caught) {
      if (useAuthStore.getState().token === token) {
        setError(caught instanceof Error ? caught.message : 'Pengajuan gagal dikirim.');
      }
    } finally {
      setBusy(false);
    }
  }

  const close = () => { if (!busy) { setOpen(false); onClose?.(); } };

  return (
    <>
      {!gate && <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
        <div className="flex min-w-0 items-start gap-3">
          <HandHeart aria-hidden="true" size={21} className="mt-0.5 shrink-0 text-teal-700 dark:text-teal-400" />
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-extrabold">Contributor</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {admin ? 'Tinjau pengajuan dan kelola Contributor aktif.'
                : contributor ? 'Status Contributor aktif.'
                  : status ? statusLabels[status]
                    : query.isError ? 'Status pengajuan belum tersedia.'
                      : query.isLoading ? 'Memuat status…' : 'Belum ada pengajuan.'}
            </p>
            {(application?.review_note || query.isError) && (
              <p className="wrap-anywhere text-sm text-slate-600 dark:text-slate-400">
                {application?.review_note && `Catatan admin: ${application.review_note}`}{' '}
                {query.isError && <button type="button" className="font-semibold underline" onClick={() => void query.refetch()}>Coba lagi</button>}
              </p>
            )}
          </div>
        </div>
        {admin ? (
          <Link to="/admin/kontribusi" className={actionClassName}>Kelola Contributor <ArrowRight size={16} aria-hidden="true" /></Link>
        ) : (canApply || application) && (
          <button type="button" className={actionClassName} onClick={() => { setError(''); setOpen(true); }}>
            {canApply ? 'Menjadi Contributor' : 'Lihat pengajuan'} <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>}
      {open && gate && step !== 'form' && (
        <AppDialog title={step === 'success' ? 'Pengajuan berhasil dikirim' : 'Akses Contributor diperlukan'} description={step === 'success' ? 'Anda bisa melihat status pengajuan di Profil.' : 'Aksi ini tersedia untuk Contributor.'} onClose={close} footer={<><button type="button" className={actionClassName} onClick={close}>{step === 'success' ? 'Selesai' : 'Batal'}</button>{step === 'success' || application?.status === 'pending' ? <Link className={actionClassName} to="/profil#contributor">Pergi ke Profil</Link> : <button type="button" className={actionClassName} disabled={authenticated && !query.isSuccess} onClick={() => { if (!authenticated) { const query = new URLSearchParams(location.search); query.set('contributor_action', '1'); navigate('/login', { state: { from: { ...location, search: `?${query}` } } }); } else setStep('form'); }}>{authenticated ? 'Ajukan Contributor' : 'Masuk'}</button>}</>}>{application?.status === 'pending' ? <p>Pengajuan sedang ditinjau.</p> : application?.review_note ? <p>Catatan admin: {application.review_note}</p> : null}{query.isError && <button type="button" onClick={() => void query.refetch()}>Coba lagi</button>}</AppDialog>
      )}
      {open && step === 'form' && (
        <AppDialog title={canApply ? 'Menjadi Contributor' : 'Pengajuan Contributor'}
          description={canApply ? 'Contributor dapat mengajukan Pura, Suka Duka, dan Warta.' : 'Status dan alasan pengajuan Anda.'}
          focusField={canApply} onClose={close} footer={canApply ? (
            <>
              <button type="button" className={actionClassName} disabled={busy} onClick={close}>Batal</button>
              <button type="submit" form="contributor-application" disabled={busy}
                className="min-h-11 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 dark:bg-primary dark:text-slate-950">
                {busy ? 'Mengirim…' : 'Kirim Pengajuan'}
              </button>
            </>
          ) : undefined}>
          {application && (
            <div className="mb-4 space-y-1 text-sm">
              <p className="font-semibold">{statusLabels[application.status]}</p>
              <p className="whitespace-pre-wrap wrap-anywhere text-slate-600 dark:text-slate-300">{application.description}</p>
            </div>
          )}
          {canApply && (
            <form id="contributor-application" onSubmit={submit}>
              <label className="block text-sm font-semibold">Alasan menjadi Contributor
                <textarea name="description" rows={4} required aria-describedby="contributor-description-help"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-teal-600 dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <p id="contributor-description-help" className="mt-2 text-xs text-slate-500 dark:text-slate-400">Isi 10–2.000 karakter.</p>
              {error && <p role="alert" className="mt-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
            </form>
          )}
        </AppDialog>
      )}
    </>
  );
}
