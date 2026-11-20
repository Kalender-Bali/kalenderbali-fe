import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthQueryScope, useAuthStore } from '@/stores/useAuthStore';
import { changeRubrikComment, type RubrikCommentAction } from '../api/rubrikDewasaApi';
import { useRubrikMutation } from '../hooks/useRubrikDewasa';
import type { RubrikComment, RubrikDewasa } from '../types/rubrikDewasa.types';
import { canManageOwnedContent } from '../utils/rubrikAccess';
import { RubrikDeleteDialog } from './RubrikDeleteDialog';
import { rubrikInput, rubrikLabel, rubrikPanel, rubrikPrimary, rubrikSecondary } from './rubrikStyles';

export function RubrikComments({ rubrik }: { rubrik: RubrikDewasa }) {
  const scope = useAuthQueryScope();
  return <CommentSection key={scope} rubrik={rubrik} />;
}

function CommentSection({ rubrik }: { rubrik: RubrikDewasa }) {
  const location = useLocation();
  const user = useAuthStore((state) => state.isAuthenticated ? state.user : null);
  const write = useRubrikMutation((action: RubrikCommentAction) => changeRubrikComment(rubrik.id, action));
  const [text, setText] = useState('');
  const [editing, setEditing] = useState<RubrikComment | null>(null);
  const [editText, setEditText] = useState('');
  const [toDelete, setToDelete] = useState<RubrikComment | null>(null);

  function submit(event: FormEvent<HTMLFormElement>, comment?: RubrikComment) {
    event.preventDefault();
    const value = (comment ? editText : text).trim();
    if (!user || !value || write.isPending) return;
    write.mutate(comment ? { kind: 'update', id: comment.id, text: value } : { kind: 'create', text: value }, {
      onSuccess: () => {
        if (comment) setEditing(null);
        else setText('');
      },
    });
  }

  return (
    <section className={rubrikPanel}>
      <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Komentar <span className="tabular-nums">({rubrik.comment_count})</span></h2>
      {rubrik.comments?.length ? (
        <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          {rubrik.comments.map((comment) => (
            <li key={comment.id} className="space-y-2 py-3">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{comment.author_name || 'Pengguna'}</p>
              {editing?.id === comment.id ? (
                <form onSubmit={(event) => submit(event, comment)} className="space-y-2">
                  <label className={rubrikLabel} htmlFor={`ubah-komentar-${comment.id}`}>Ubah komentar</label>
                  <textarea id={`ubah-komentar-${comment.id}`} value={editText} onChange={(event) => setEditText(event.target.value)} required rows={3} className={`${rubrikInput} py-2`} />
                  <div className="flex flex-wrap gap-2">
                    <button className={rubrikPrimary} disabled={write.isPending || !editText.trim()}>Simpan Komentar</button>
                    <button className={rubrikSecondary} type="button" disabled={write.isPending}
                      onClick={() => { write.reset(); setEditing(null); }}>Batal</button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="whitespace-pre-line break-words text-sm text-slate-600 dark:text-slate-300">{comment.isi}</p>
                  {canManageOwnedContent(user, comment.user_id) && (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={rubrikSecondary} disabled={write.isPending}
                        onClick={() => { write.reset(); setEditing(comment); setEditText(comment.isi); }}>Ubah Komentar</button>
                      <button type="button" className={rubrikSecondary} disabled={write.isPending}
                        onClick={() => { write.reset(); setToDelete(comment); }}>Hapus Komentar</button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Belum ada komentar.</p>}

      {user ? (
        <form onSubmit={submit} className="mt-5 space-y-2">
          <label htmlFor="rubrik-comment" className={rubrikLabel}>Tulis komentar</label>
          <textarea id="rubrik-comment" value={text} onChange={(event) => setText(event.target.value)} required rows={3} className={`${rubrikInput} py-2`} />
          <button className={rubrikPrimary} disabled={write.isPending || !text.trim()}>Kirim Komentar</button>
        </form>
      ) : (
        <Link to="/login" state={{ from: { pathname: `${location.pathname}${location.search}` } }} className={`mt-5 ${rubrikSecondary}`}>Masuk untuk berkomentar</Link>
      )}
      {write.error && !toDelete && <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">{write.error.message}</p>}
      {toDelete && (
        <RubrikDeleteDialog title="Hapus komentar?" description="Komentar akan dihapus dari rubrik ini."
          pending={write.isPending} error={write.error} onClose={() => setToDelete(null)}
          onDelete={() => write.mutate({ kind: 'delete', id: toDelete.id }, { onSuccess: () => setToDelete(null) })} />
      )}
    </section>
  );
}
