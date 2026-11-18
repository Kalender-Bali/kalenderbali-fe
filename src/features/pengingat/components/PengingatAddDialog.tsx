import { useCallback, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toApiError } from '@/lib/apiError';
import type { PengingatAddProps, PengingatCandidate } from '../types/pengingat.types';
import { PengingatModal } from './PengingatModal';
import { PENGINGAT_INPUT, PengingatField, PengingatSelect } from './PengingatFormControls';

interface PengingatAddDialogProps extends PengingatAddProps {
  title: string;
  description: string;
  nameLabel: string;
  namePlaceholder: string;
  requireName?: boolean;
  showName?: boolean;
  beforeName?: ReactNode;
  candidate: PengingatCandidate | null;
  children: ReactNode;
}

/** Hanya nama pribadi, preferensi alarm, dan catatan yang dibagi antarfitur. */
export function PengingatAddDialog({ title, description, nameLabel, namePlaceholder, requireName, showName = true, beforeName, candidate, children, today, policy, onClose, onSave }: PengingatAddDialogProps) {
  const formId = useId();
  const [name, setName] = useState('');
  const [alertDays, setAlertDays] = useState([1, 0]);
  const [repeat, setRepeat] = useState(Boolean(policy?.canRepeat));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const close = useCallback(() => { if (!savingRef.current) onClose(); }, [onClose]);

  return <PengingatModal title={title} description={description} onClose={close} footer={<>
    <button type="button" onClick={close} disabled={saving} className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm cursor-pointer disabled:opacity-50">Batal</button>
    <button type="submit" form={formId} disabled={!candidate || !policy || saving} className="h-11 px-5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{saving ? 'Menyimpan…' : 'Simpan pengingat'}</button>
  </>}>
    <fieldset disabled={saving} className="min-w-0 space-y-5">
    {beforeName}
    {showName && <PengingatField label={nameLabel}><input form={formId} required={requireName} maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder={namePlaceholder} className={PENGINGAT_INPUT} /></PengingatField>}
    {children}
    <form id={formId} className="space-y-5 border-t border-slate-100 dark:border-slate-800 pt-5" onSubmit={async event => {
      event.preventDefault();
      if (savingRef.current) return;
      if (!policy) { setError('Batas paket belum dapat diperiksa. Coba lagi setelah status paket dimuat.'); return; }
      if (!candidate || candidate.nextDate < today) { setError('Pilih jadwal mendatang dari hasil fitur terlebih dahulu.'); return; }
      if (showName && requireName && !name.trim()) { setError('Lengkapi nama catatan terlebih dahulu.'); return; }
      if (!alertDays.length) { setError('Pilih setidaknya satu waktu pengingat.'); return; }
      savingRef.current = true; setSaving(true); setError('');
      try { await onSave({
        id: crypto.randomUUID(), kind: candidate.kind, title: (showName && name.trim()) || candidate.title,
        nextDate: candidate.nextDate, eventTime: candidate.eventTime, condition: structuredClone(candidate.condition),
        origin: candidate.origin, sourceLabel: candidate.sourceLabel, source: structuredClone(candidate.source),
        repeatLabel: candidate.repeatLabel, repeat: Boolean(policy.canRepeat && candidate.repeatLabel && repeat),
        alertDays: [...alertDays], note: note.trim(),
      }); } catch (failure) { setError(toApiError(failure).message || 'Pengingat belum berhasil disimpan.'); }
      finally { savingRef.current = false; setSaving(false); }
    }}>
      {candidate && <div className="rounded-xl bg-[#f8fafc] dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Perulangan</p>
        {candidate.repeatLabel && policy?.canRepeat ? <div className="mt-2"><PengingatSelect value={repeat ? 'berulang' : 'sekali'} onChange={value => setRepeat(value === 'berulang')}><option value="berulang">{candidate.repeatLabel}</option><option value="sekali">Hanya jadwal yang dipilih</option></PengingatSelect><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Perulangan berjalan selama Premium aktif.</p></div> : <><p className="mt-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">Hanya jadwal yang dipilih</p>{candidate.repeatLabel && policy?.tier === 'Free' && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Pengingat berulang tersedia untuk <Link to="/premium" className="font-bold text-teal-700 dark:text-teal-300 underline">Premium</Link>.</p>}</>}
      </div>}
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Waktu pengingat</legend>
        <div className="flex flex-wrap gap-2">{[7, 3, 1, 0].map(day => <label key={day} className={`inline-flex items-center gap-2 rounded-xl border px-3 min-h-11 text-xs sm:text-sm font-semibold cursor-pointer tabular-nums ${alertDays.includes(day) ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}><input type="checkbox" checked={alertDays.includes(day)} onChange={event => setAlertDays(current => event.target.checked ? [...current, day] : current.filter(value => value !== day))} className="w-3.5 h-3.5 accent-teal-600" />{day ? `H-${day}` : 'Hari H'}</label>)}</div>
      </fieldset>
      <PengingatField label="Catatan persiapan (opsional)"><textarea maxLength={500} rows={2} value={note} onChange={event => setNote(event.target.value)} placeholder="Persiapan yang perlu diingat…" className={`${PENGINGAT_INPUT} h-auto py-3 resize-y font-normal leading-relaxed`} /></PengingatField>
      {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-300 flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</p>}
      <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">Pengingat disimpan ke akunmu. Notifikasi muncul di lonceng sejak awal hari pengingat dalam WITA.</p>
    </form>
    </fieldset>
  </PengingatModal>;
}
