import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { RefreshCw, Save, ShieldCheck } from 'lucide-react';
import { chatApi } from '@/features/chatbot/api/chatApi';
import type { ChatSettings, ChatStats } from '@/features/chatbot/api/chatApi';
import { limitLabels, parseSettings } from '../chatSettings';
import type { LimitDraft, LimitKey } from '../chatSettings';

const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0e9f90] px-5 text-sm font-bold text-white hover:bg-[#0c8a7d] disabled:opacity-50';
const input = 'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20';
const fields = Object.keys(limitLabels) as LimitKey[];
const initial: LimitDraft = { premium_daily_tokens: '', admin_daily_tokens: '', global_tokens_minute: '', global_tokens_day: '', global_requests_minute: '', global_requests_day: '' };
const labels: Record<string, string> = { missing_information: 'Informasi kurang', ambiguous_request: 'Pertanyaan ambigu', completed: 'Terkonfirmasi', pending: 'Dalam proses', uncertain: 'Tidak pasti', success: 'Berhasil', error: 'Gagal', keterangan: 'Keterangan', warta: 'Warta', rubrik_dewasa: 'Rubrik Dewasa', geografi: 'Geografi', gita_public: 'Bhagawad Gita', kalender: 'Kalender', wewaran: 'Wewaran', sasih: 'Sasih', hari_raya: 'Hari Raya', ala_ayuning: 'Ala Ayuning', otonan: 'Otonan', ramalan_sifat: 'Ramalan Sifat', garis_hidup: 'Garis Hidup', jodoh: 'Jodoh', pura: 'Pura', piodalan: 'Piodalan', acara: 'Acara', keuangan: 'Keuangan', akun: 'Akun' };
const fmt = (value: number) => value.toLocaleString('id-ID');
function asDraft(settings: ChatSettings): LimitDraft { return Object.fromEntries(fields.map(key => [key, String(settings[key])])) as LimitDraft; }

export default function AdminChatPage() {
  const [draft, setDraft] = useState<LimitDraft>(initial);
  const [maintenance, setMaintenance] = useState(false);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    void Promise.all([chatApi.settings(), chatApi.stats()]).then(([settings, statistics]) => { if (active) { setDraft(asDraft(settings)); setMaintenance(settings.maintenance); setStats(statistics); setError(''); } }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Pengaturan belum dapat dimuat.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  async function save(event: FormEvent) {
    event.preventDefault(); setError(''); setNotice('');
    try {
      const next = parseSettings(draft, maintenance);
      setSaving(true);
      const saved = await chatApi.saveSettings(next);
      setDraft(asDraft(saved)); setMaintenance(saved.maintenance); setNotice('Pengaturan chatbot berhasil disimpan.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Pengaturan belum dapat disimpan.'); }
    finally { setSaving(false); }
  }
  function reload() { setLoading(true); setRevision(value => value + 1); setNotice(''); }
  const rows = stats?.data || [];
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const tokens = rows.reduce((sum, row) => sum + row.tokens, 0);
  const reserved = rows.reduce((sum, row) => sum + row.unconfirmed_reserved_tokens, 0);
  const globalUnset = fields.slice(2).some(key => draft[key] === '0');
  return <div className="space-y-6 pb-8">
    <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div className="space-y-1.5"><nav aria-label="Breadcrumb" className="flex gap-2 text-xs font-semibold text-slate-400"><span>Wargabali</span><span>/</span><span>Admin</span><span>/</span><span className="font-bold text-teal-700">Chatbot</span></nav><h1 className="text-2xl font-extrabold tracking-tight text-[#0f172a] sm:text-3xl lg:text-4xl">Pengelolaan Chatbot</h1><p className="max-w-2xl text-sm leading-relaxed text-slate-500">Pantau pemakaian dan atur ketersediaan asisten Kalender Bali.</p></div><button type="button" onClick={reload} disabled={loading || saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} /> Muat ulang</button></header>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error} {loading === false && !stats && <button type="button" onClick={reload} className="font-bold underline">Coba lagi</button>}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div>}
    {loading ? <div className="h-56 animate-pulse rounded-2xl bg-slate-100" aria-label="Memuat pengaturan chatbot" /> : stats && <>
      {globalUnset && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">Batas global provider belum lengkap. Chatbot belum dapat memanggil model sampai semua batas global diisi.</div>}
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Ringkasan statistik 30 hari">{[{ label: 'Permintaan tercatat', value: total }, { label: 'Token terkonfirmasi', value: tokens }, { label: 'Token belum terkonfirmasi', value: reserved }].map(item => <div key={item.label} className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs"><span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">{item.label}</span><p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">{fmt(item.value)}</p></div>)}</section>
      <form onSubmit={event => void save(event)} className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-teal-600" size={22} /><div><h2 className="text-xl font-bold tracking-tight text-slate-900">Ketersediaan dan kuota</h2><p className="mt-1 text-sm text-slate-500">Perubahan disimpan bersama identitas administrator. Angka global harus mengikuti batas akun provider.</p></div></div>
        <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"><input type="checkbox" checked={maintenance} onChange={event => setMaintenance(event.target.checked)} className="h-4 w-4 accent-teal-600" /> Aktifkan maintenance chatbot</label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{fields.map(key => <label key={key} className="block"><span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-widest text-slate-500">{limitLabels[key]}</span><input className={input} inputMode="numeric" type="number" min={key.endsWith('daily_tokens') ? 1 : 0} max={2147483647} step={1} required value={draft[key]} onChange={event => setDraft(previous => ({ ...previous, [key]: event.target.value }))} /></label>)}</div>
        <p className="text-xs leading-relaxed text-slate-500">Nilai batas global 0 menonaktifkan pemanggilan model. Kuota pengguna direset pukul 00.00 WITA.</p><button type="submit" className={button} disabled={saving}>{saving ? 'Menyimpan…' : <><Save size={16} /> Simpan pengaturan</>}</button>
      </form>
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7"><h2 className="text-xl font-bold tracking-tight text-slate-900">Statistik penggunaan</h2><p className="mt-1 text-sm text-slate-500">Data agregat 30 hari tanpa isi pesan. Token belum terkonfirmasi adalah reservasi, bukan pemakaian aktual.</p>
        {!stats.cache_stats_available && <p className="mt-2 text-xs text-slate-500">Statistik cache belum tersedia.</p>}
        {stats.clarification_stats_available && <p className="mt-1 text-xs text-slate-500">Klarifikasi dihitung ketika model memakai kategori terstruktur.</p>}
        {rows.length === 0 ? <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Belum ada penggunaan yang tercatat.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="border-b border-slate-200 text-slate-500"><tr>{['Tanggal WITA', 'Fitur', 'Hasil', 'Klarifikasi', 'Status kuota', 'Jumlah', 'Token', 'Durasi rata-rata'].map(label => <th key={label} scope="col" className="px-2 py-3 font-bold">{label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.date}-${row.state}-${row.feature}-${row.clarification_reason}-${row.outcome}-${index}`} className="border-b border-slate-100 text-slate-700"><td className="px-2 py-3 tabular-nums">{row.date}</td><td className="px-2 py-3">{row.feature ? labels[row.feature] || row.feature : '—'}</td><td className="px-2 py-3">{row.outcome ? labels[row.outcome] || row.outcome : '—'}</td><td className="px-2 py-3">{row.clarification_reason ? labels[row.clarification_reason] || row.clarification_reason : '—'}</td><td className="px-2 py-3">{labels[row.state] || row.state}</td><td className="px-2 py-3 tabular-nums">{fmt(row.count)}</td><td className="px-2 py-3 tabular-nums">{fmt(row.tokens)}{row.unconfirmed_reserved_tokens > 0 && <span className="block text-slate-500">+{fmt(row.unconfirmed_reserved_tokens)} cadangan</span>}</td><td className="px-2 py-3 tabular-nums">{row.average_duration_ms == null ? '—' : `${(row.average_duration_ms / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} dtk`}</td></tr>)}</tbody></table></div>}
      </section>
    </>}
  </div>;
}
