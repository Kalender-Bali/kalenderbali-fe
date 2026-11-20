import { AppDialog } from '@/components/ui/AppDialog';
import { rubrikSecondary } from './rubrikStyles';

interface Props {
  title: string;
  description: string;
  pending: boolean;
  error?: Error | null;
  onClose: () => void;
  onDelete: () => void;
}

export function RubrikDeleteDialog({ title, description, pending, error, onClose, onDelete }: Props) {
  const close = () => { if (!pending) onClose(); };
  return (
    <AppDialog title={title} description={description} onClose={close} footer={(
      <>
        <button type="button" onClick={close} disabled={pending} className={rubrikSecondary}>Batal</button>
        <button type="button" onClick={onDelete} disabled={pending} className="min-h-11 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-800 disabled:opacity-50">
          {pending ? 'Menghapus…' : 'Hapus'}
        </button>
      </>
    )}>
      {error && <p role="alert" className="mb-2 text-sm text-rose-700 dark:text-rose-300">{error.message}</p>}
      <p className="text-sm text-slate-600 dark:text-slate-300">Penghapusan bersifat permanen.</p>
    </AppDialog>
  );
}
