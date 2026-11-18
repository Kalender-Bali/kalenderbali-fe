import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { KomunitasModal } from './KomunitasModal';
import { secondaryButton } from './komunitasStyles';

/** Konfirmasi menampilkan objek dan dampak penghapusan; error mempertahankan dialog. */
export function KomunitasDeleteConfirmModal({ title, description, busy, onClose, onConfirm }: {
  title: string; description: string; busy: boolean; onClose: () => void; onConfirm: () => Promise<void>;
}) {
  const [error, setError] = useState('');
  return <KomunitasModal title={title} onClose={onClose} busy={busy}><div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-relaxed text-rose-800"><Trash2 className="mb-3" size={24} />{description}</div>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className={secondaryButton}>Batal</button><button type="button" disabled={busy} onClick={async () => { setError(''); try { await onConfirm(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Penghapusan gagal.'); } }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-700 px-5 text-sm font-bold text-white hover:bg-rose-800 disabled:opacity-50">{busy ? 'Menghapus…' : 'Ya, Hapus'}</button></div>
  </KomunitasModal>;
}
