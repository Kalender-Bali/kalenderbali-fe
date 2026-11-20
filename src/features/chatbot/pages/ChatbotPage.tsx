import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Bot, MessageCircle, Plus, Send, Square, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { chatApi, sendChat } from '../api/chatApi';
import type { ChatMessage, ChatQuota, ChatRoom } from '../api/chatApi';
import { ChatError } from '../api/stream';
import { relatedLinks } from '../api/relatedLinks';
import type { RelatedLink } from '../api/relatedLinks';

const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0e9f90] px-5 text-sm font-bold text-white transition-colors hover:bg-[#0c8a7d] disabled:cursor-not-allowed disabled:opacity-50';
const secondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';
const suggestions = ['Apa itu Pancawara?', 'Jelaskan arti Saptawara', 'Apa yang dimaksud dengan wuku?'];
const progress: Record<string, string> = { processing: 'Memahami pertanyaan Anda…', searching: 'Mencari informasi Kalender Bali…', composing: 'Menyusun jawaban untuk Anda…' };
type DisplayMessage = Pick<ChatMessage, 'role' | 'content'> & { id: string; keterangan?: boolean; links?: RelatedLink[]; clarification?: boolean };

function messageText(error: unknown) { return error instanceof Error ? error.message : 'Sistem sedang mengalami masalah. Silakan coba lagi.'; }
function roomLabel(room: ChatRoom) {
  const date = new Date(room.created_at);
  return Number.isNaN(date.getTime()) ? 'Percakapan' : `Percakapan ${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Makassar' }).format(date)}`;
}

export default function ChatbotPage() {
  const { user, isAuthenticated } = useAuthStore();
  return <div className="space-y-6 pb-8">
    <header className="space-y-1.5">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-400"><span>Wargabali</span><span>/</span><span>Layanan</span><span>/</span><span className="font-bold text-teal-700">Asisten Kalender Bali</span></nav>
      <h1 className="text-2xl font-extrabold tracking-tight text-[#0f172a] sm:text-3xl lg:text-4xl">Asisten Kalender Bali</h1>
      <p className="max-w-2xl text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">Tanyakan istilah dan keterangan yang tersedia di Kalender Bali dengan bahasa sehari-hari.</p>
    </header>
    {!isAuthenticated || !user ? <section className="rounded-2xl border border-slate-200/90 bg-white p-7 text-center shadow-xs"><Bot className="mx-auto text-teal-600" size={32} /><h2 className="mt-3 text-lg font-extrabold text-slate-900">Masuk untuk menggunakan asisten</h2><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">Asisten tersedia untuk pengguna premium aktif dan administrator.</p><Link className={`${primary} mt-5`} to="/login" state={{ from: { pathname: '/chatbot' } }}>Masuk ke akun</Link></section> : <ChatSession key={user.id} premiumExpiresAt={user.premiumExpiresAt} isAdmin={user.role.trim().toLowerCase() === 'admin'} />}
  </div>;
}

function ChatSession({ premiumExpiresAt, isAdmin }: { premiumExpiresAt?: string | null; isAdmin: boolean }) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [room, setRoom] = useState<number | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [quota, setQuota] = useState<ChatQuota | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [roomLoading, setRoomLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [clock, setClock] = useState(() => Date.now());
  const active = useRef(true);
  const controller = useRef<AbortController | null>(null);
	const sending = useRef(false);
  const loadVersion = useRef(0);
  const isExpired = !isAdmin && Boolean(premiumExpiresAt && Number.isFinite(Date.parse(premiumExpiresAt)) && Date.parse(premiumExpiresAt) <= clock);

  // Batalkan permintaan dan abaikan respons lama saat akun atau halaman berubah.
  useEffect(() => {
    active.current = true;
    void Promise.all([chatApi.rooms(), chatApi.quota()]).then(([items, balance]) => { if (active.current) { setRooms(items); setQuota(balance); setError(''); } }).catch((cause: unknown) => { if (active.current) setError(messageText(cause)); }).finally(() => { if (active.current) setLoading(false); });
    return () => { active.current = false; controller.current?.abort(); };
  }, []);
  useEffect(() => {
    if (!premiumExpiresAt || isAdmin) return;
    const expires = Date.parse(premiumExpiresAt);
    if (!Number.isFinite(expires) || expires <= Date.now()) return;
    const timer = window.setTimeout(() => setClock(Date.now()), Math.min(expires - Date.now() + 50, 2147483647));
    return () => window.clearTimeout(timer);
  }, [premiumExpiresAt, isAdmin, clock]);
  useEffect(() => {
    if (!quota || quota.can_start) return;
    const reset = Date.parse(quota.resets_at);
    if (!Number.isFinite(reset) || reset <= Date.now()) return;
    // Setelah reset WITA, ambil saldo baru tanpa menunggu pengguna mengirim pesan.
    const timer = window.setTimeout(() => {
      void chatApi.quota().then(value => { if (active.current) setQuota(value); }).catch(() => { if (active.current) setError('Kuota belum dapat diperiksa. Silakan muat ulang.'); });
    }, Math.min(reset - Date.now() + 1000, 2147483647));
    return () => window.clearTimeout(timer);
  }, [quota]);

  async function refresh() {
    setLoading(true); setError(''); setErrorCode('');
    try { const [items, balance] = await Promise.all([chatApi.rooms(), chatApi.quota()]); if (active.current) { setRooms(items); setQuota(balance); } }
    catch (cause) { if (active.current) { setQuota(null); setError(messageText(cause)); } }
    finally { if (active.current) setLoading(false); }
  }
  async function openRoom(item: ChatRoom) {
    if (busy) return;
    const version = ++loadVersion.current;
    setRoom(item.id); setMessages([]); setRoomLoading(true); setError(''); setErrorCode('');
    try { const data = await chatApi.messages(item.id); if (active.current && version === loadVersion.current) setMessages(data.map(m => ({ ...m, id: String(m.id), links: relatedLinks(m.references) }))); }
    catch (cause) { if (active.current && version === loadVersion.current) setError(messageText(cause)); }
    finally { if (active.current && version === loadVersion.current) setRoomLoading(false); }
  }
  function newRoom() { if (busy) return; ++loadVersion.current; setRoom(null); setMessages([]); setRoomLoading(false); setError(''); setErrorCode(''); setDraft(''); }
  async function removeRoom(item: ChatRoom) {
    if (busy || !window.confirm('Hapus percakapan ini beserta seluruh pesannya?')) return;
    setRoomLoading(true); setError('');
    try { await chatApi.removeRoom(item.id); if (!active.current) return; setRooms(previous => previous.filter(value => value.id !== item.id)); if (room === item.id) newRoom(); }
    catch (cause) { if (active.current) setError(messageText(cause)); }
    finally { if (active.current) setRoomLoading(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending.current || busy || loading || roomLoading || !quota?.can_start || isExpired || errorCode === 'PREMIUM_REQUIRED') return;
	// Kunci segera agar dua klik cepat tidak membuat dua permintaan berbayar.
	sending.current = true;
    setBusy(true); setError(''); setErrorCode(''); setStatus('Memahami pertanyaan Anda…'); setDraft('');
    const abort = new AbortController(); controller.current = abort;
    let selected = room;
    let searched = false;
    try {
      if (selected === null) {
        const created = await chatApi.createRoom();
        if (!active.current || abort.signal.aborted) { if (active.current) setDraft(message); return; }
        selected = created.id; setRoom(selected); setRooms(previous => [created, ...previous]);
      }
      const operation = crypto.randomUUID();
      setMessages(previous => [...previous, { id: operation, role: 'user', content: message }]);
      const result = await sendChat(selected, operation, message, abort.signal, update => {
        if (!active.current) return;
        if (update.feature === 'keterangan') searched = true;
        setStatus(progress[update.stage] || 'Memproses permintaan Anda…');
      });
      if (active.current) setMessages(previous => [...previous, { id: `${operation}-answer`, role: 'assistant', content: result.answer, keterangan: searched, links: relatedLinks(result.references), clarification: Boolean(result.clarification_reason) }]);
    } catch (cause) {
      if (active.current) {
        setDraft(message);
        if (abort.signal.aborted) setError('Permintaan dihentikan. Periksa kembali histori sebelum mengirim ulang.');
        else { setError(messageText(cause)); setErrorCode((cause as ChatError)?.code || ''); }
      }
    } finally {
	  sending.current = false;
      if (active.current) {
        setBusy(false); setStatus(''); controller.current = null; setClock(Date.now());
		setQuota(null);
        void chatApi.quota().then(value => { if (active.current) setQuota(value); }).catch(() => { if (active.current) setError('Kuota belum dapat diperiksa. Silakan muat ulang.'); });
      }
    }
  }

  const disabled = busy || loading || roomLoading || !quota?.can_start || isExpired || errorCode === 'PREMIUM_REQUIRED';
  return <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
    <aside className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs sm:p-5">
      <div className="flex items-center justify-between gap-2"><h2 className="text-base font-extrabold tracking-tight text-slate-900">Percakapan</h2><button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-teal-700 hover:bg-teal-50 disabled:opacity-50" title="Percakapan baru" aria-label="Percakapan baru" disabled={busy || roomLoading} onClick={newRoom}><Plus size={20} /></button></div>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">Histori tersimpan di akun selama satu bulan.</p>
      <div className="mt-4 max-h-56 space-y-1 overflow-y-auto lg:max-h-[32rem]">
        {loading ? <div aria-label="Memuat percakapan" className="h-12 animate-pulse rounded-xl bg-slate-100" /> : rooms.length === 0 ? <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Belum ada percakapan tersimpan.</p> : rooms.map(item => <div key={item.id} className={`flex items-center rounded-xl border ${room === item.id ? 'border-teal-200 bg-teal-50' : 'border-transparent hover:bg-slate-50'}`}><button type="button" disabled={busy || roomLoading} onClick={() => void openRoom(item)} className="min-h-11 min-w-0 flex-1 truncate px-3 text-left text-xs font-semibold text-slate-700 disabled:opacity-50" aria-current={room === item.id ? 'true' : undefined}>{roomLabel(item)}</button><button type="button" disabled={busy || roomLoading} onClick={() => void removeRoom(item)} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 disabled:opacity-50" aria-label={`Hapus ${roomLabel(item)}`}><Trash2 size={16} /></button></div>)}
      </div>
      {quota && <div className="mt-5 rounded-xl border border-teal-200/60 bg-[#e6f7f5] p-3"><span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-700">Sisa kuota hari ini</span><p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{quota.remaining.toLocaleString('id-ID')} <span className="text-xs font-semibold text-slate-500">token</span></p><p className="mt-1 text-xs text-slate-500">Diperbarui pukul 00.00 WITA</p></div>}
    </aside>
    <section className="flex min-h-[560px] min-w-0 flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xs" aria-label="Chatbot Kalender Bali">
      <div className="flex items-center gap-3 border-b border-slate-100 p-4 sm:p-5"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e6f7f5] text-teal-700"><Bot size={22} /></div><div><h2 className="text-base font-extrabold text-slate-900">Asisten Kalender Bali</h2><p className="text-xs text-slate-500">Siap membantu menjelaskan keterangan</p></div></div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite" aria-relevant="additions text">
        {roomLoading ? <div aria-label="Memuat pesan" className="h-20 animate-pulse rounded-xl bg-slate-100" /> : messages.length === 0 && !busy ? <div className="mx-auto max-w-lg py-8 text-center"><MessageCircle className="mx-auto text-teal-600" size={30} /><h3 className="mt-3 text-lg font-extrabold text-slate-900">Apa yang ingin Anda ketahui?</h3><p className="mt-2 text-sm leading-relaxed text-slate-500">Mulai dengan pertanyaan tentang keterangan Kalender Bali.</p><div className="mt-5 flex flex-wrap justify-center gap-2">{suggestions.map(text => <button key={text} type="button" disabled={disabled} onClick={() => setDraft(text)} className="rounded-xl border border-teal-200/60 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100 disabled:opacity-50">{text}</button>)}</div></div> : messages.map(item => <div key={item.id} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[80%] ${item.role === 'user' ? 'bg-[#0e9f90] text-white' : 'border border-slate-200/70 bg-slate-50 text-slate-700'}`}><p className="whitespace-pre-wrap break-words">{item.content}</p>{Boolean(item.links?.length) && <div className="mt-3 flex flex-wrap gap-2">{item.links?.map(link => <div key={link.to} className="flex flex-wrap gap-1">{(item.clarification || (item.links?.length || 0) > 1) && <button type="button" disabled={disabled} onClick={() => setDraft(link.choice)} className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-100 disabled:opacity-50">Pilih {link.label}</button>}<Link to={link.to} className="rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50">Lihat {link.label}</Link></div>)}</div>}{item.links && item.links.length > 1 && <p className="mt-2 text-xs text-slate-500">Pilih salah satu keterangan atau tuliskan jawaban Anda di bawah.</p>}{item.keterangan && !item.links?.length && <Link to="/keterangan" className="mt-3 inline-block font-bold text-teal-700 underline underline-offset-2">Lihat halaman Keterangan</Link>}</div></div>)}
        {busy && <p role="status" className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700"><span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-teal-600" />{status}</p>}
      </div>
      <div className="border-t border-slate-100 p-4 sm:p-5">
        {isExpired || errorCode === 'PREMIUM_REQUIRED' ? <div role="alert" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Langganan premium aktif diperlukan untuk mengirim pesan. <Link to="/premium" className="font-bold underline">Lihat paket premium</Link></div> : quota && !quota.can_start ? <div role="alert" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Sisa kuota hari ini belum cukup untuk memulai pesan. Kuota diperbarui pukul 00.00 WITA. <button type="button" onClick={() => void refresh()} className="font-bold underline">Periksa kembali</button></div> : null}
        {error && <div role="alert" className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error} {(loading || !quota) && <button type="button" onClick={() => void refresh()} className="ml-2 font-bold underline">Coba lagi</button>}</div>}
        <form onSubmit={event => void submit(event)} className="flex items-end gap-2"><label className="sr-only" htmlFor="chat-message">Pesan Anda</label><textarea id="chat-message" value={draft} onChange={event => setDraft(event.target.value)} maxLength={4000} rows={2} disabled={disabled} placeholder="Tulis pertanyaan Anda…" className="min-h-11 min-w-0 flex-1 resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50" />{busy ? <button type="button" className={secondary} onClick={() => controller.current?.abort()}><Square size={16} /> Hentikan</button> : <button type="submit" className={primary} disabled={disabled || !draft.trim()} aria-label="Kirim pesan"><Send size={16} /><span className="hidden sm:inline">Kirim</span></button>}</form>
        <p className="mt-2 text-xs text-slate-400">Jawaban menggunakan informasi yang tersedia di Kalender Bali.</p>
      </div>
    </section>
  </div>;
}
