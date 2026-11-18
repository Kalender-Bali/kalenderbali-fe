import { useState } from 'react';
import type { FormEvent } from 'react';
import type { KomunitasFinanceCategory, KomunitasFinanceEntry, KomunitasFinancePayload } from '../types/komunitas.types';
import { todayWita } from '../utils/komunitasUtils';
import { KomunitasModal } from './KomunitasModal';
import { inputStyle, primaryButton, secondaryButton } from './komunitasStyles';

/** Form transaksi selalu mengikat pemilik ke profil aktif; tanggal diperlakukan sebagai tanggal WITA. */
export function KomunitasFinanceModal({ communityId, communityName, entry, categories, busy, onClose, onSave }: {
  communityId: number; communityName: string; entry?: KomunitasFinanceEntry; categories: KomunitasFinanceCategory[];
  busy: boolean; onClose: () => void; onSave: (payload: KomunitasFinancePayload) => Promise<void>;
}) {
  const [form, setForm] = useState({ category: String(entry?.category_id || ''), entryType: entry?.entry_type || 'debit', amount: entry?.amount?.toString() || '', date: entry?.transaction_date || todayWita(), note: entry?.note || '' });
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    const amount = Number(form.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) { setError('Nominal harus berupa Rupiah bulat positif dalam batas angka yang aman.'); return; }
    if (!categories.some(category => category.id === Number(form.category))) { setError('Pilih kategori transaksi yang tersedia.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date) || Number.isNaN(Date.parse(`${form.date}T00:00:00+08:00`))) { setError('Tanggal transaksi tidak valid.'); return; }
    try { await onSave({ pura_id: communityId, category_id: Number(form.category), entry_type: form.entryType as 'debit' | 'kredit', amount, transaction_date: form.date, note: form.note.trim() }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Transaksi belum berhasil disimpan.'); }
  };
  return <KomunitasModal title={entry ? 'Edit Transaksi Kas' : 'Tambah Transaksi Kas'} description={communityName} onClose={onClose} busy={busy}><form onSubmit={submit}><fieldset disabled={busy} className="space-y-4">
    <label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Jenis transaksi</span><select value={form.entryType} onChange={event => setForm({ ...form, entryType: event.target.value as 'debit' | 'kredit' })} className={inputStyle}><option value="debit">Pemasukan (Debit)</option><option value="kredit">Pengeluaran (Kredit)</option></select></label>
    <label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Kategori *</span><select required value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} className={inputStyle}><option value="">Pilih kategori</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
    <div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-xs font-bold text-slate-500">Nominal Rupiah *</span><input required type="number" inputMode="numeric" min={1} max={Number.MAX_SAFE_INTEGER} step={1} value={form.amount} onChange={event => setForm({ ...form, amount: event.target.value })} className={`${inputStyle} tabular-nums`} /></label><label><span className="mb-1 block text-xs font-bold text-slate-500">Tanggal transaksi (WITA) *</span><input required type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} className={`${inputStyle} tabular-nums`} /></label></div>
    <label className="block"><span className="mb-1 block text-xs font-bold text-slate-500">Catatan</span><textarea rows={3} maxLength={2000} value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} placeholder="Rincian pemasukan atau penggunaan kas…" className={inputStyle} /></label>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} className={secondaryButton}>Batal</button><button type="submit" disabled={busy || !categories.length} className={primaryButton}>{busy ? 'Menyimpan…' : 'Simpan Transaksi'}</button></div>
  </fieldset></form></KomunitasModal>;
}
