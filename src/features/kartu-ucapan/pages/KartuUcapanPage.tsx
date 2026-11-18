import { useEffect, useRef, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { characters, defaultStyle, messageLimit, senderLimit } from '../utils/kartuUcapanDraft';
import type { CardDraft, CardStyle } from '../utils/kartuUcapanDraft';
import { KartuUcapanStylePanel } from '../components/KartuUcapanStylePanel';
import { KartuUcapanPreview } from '../components/KartuUcapanPreview';
import { canShareCard, createCardPng, downloadCard } from '../utils/exportKartuUcapan';

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:font-medium placeholder:text-slate-400 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500';
const labelClass = 'mb-1.5 block text-[11px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400';
const panelClass = 'min-w-0 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7 dark:border-slate-800 dark:bg-slate-900';
const buttonBaseClass = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-50 [touch-action:manipulation]';
const primaryButtonClass = `${buttonBaseClass} bg-[#0e9f90] text-white shadow-xs enabled:hover:bg-[#0c8a7d] enabled:active:bg-[#0a756a]`;
const outlineButtonClass = `${buttonBaseClass} border border-slate-200 bg-white text-slate-700 enabled:hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:enabled:hover:bg-slate-800`;

export default function KartuUcapanPage() {
  // Draft lokal menjadi sumber yang sama untuk form, pratinjau, dan ekspor.
  const [draft, setDraft] = useState<CardDraft>({
    greeting: '',
    message: '',
    sender: '',
    style: defaultStyle,
  });
  const hasGreeting = draft.greeting.trim().length > 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderedDraft, setRenderedDraft] = useState<CardDraft | null>(null);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const [prepared, setPrepared] = useState<{ draft: CardDraft; file: File | null } | null>(null);
  const [encodeAttempt, setEncodeAttempt] = useState(0);
  const [exportError, setExportError] = useState<{ draft: CardDraft; message: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [shareSupported] = useState(() => canShareCard());
  const exportInProgress = useRef(false);
  const file = !isReadingPhoto && prepared?.draft === draft ? prepared.file : null;
  const shareAvailable = prepared?.file ? canShareCard(prepared.file) : shareSupported;
  const encodeFailed = prepared?.draft === draft && !prepared.file && !isReadingPhoto;

  useEffect(() => {
    const previous = document.title;
    document.title = 'Kartu Ucapan | Kalender Bali';
    return () => { document.title = previous; };
  }, []);

  // Siapkan file setelah pengguna berhenti mengedit agar klik Bagikan bisa langsung
  // membuka dialog browser. Hasil dari draft lama tidak pernah dipakai.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!hasGreeting || isReadingPhoto || renderedDraft !== draft || !canvas) return;
    let current = true;
    const timer = window.setTimeout(() => {
      createCardPng(canvas).then((png) => {
        if (current) setPrepared({ draft, file: png });
      }).catch(() => {
        if (current) setPrepared({ draft, file: null });
      });
    }, 220);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [draft, encodeAttempt, hasGreeting, isReadingPhoto, renderedDraft]);

  function updateText(field: 'greeting' | 'message' | 'sender', value: string, limit?: number) {
    const text = limit === undefined ? value : characters(value).slice(0, limit).join('');
    setDraft((current) => current[field] === text ? current : { ...current, [field]: text });
  }

  function updateStyle(patch: Partial<CardStyle>) {
    setDraft((current) => ({ ...current, style: { ...current.style, ...patch } }));
  }

  // Pembatalan dialog adalah bagian alur normal; draft tetap tersedia.
  async function exportImage(share: boolean) {
    if (!file || exportInProgress.current) return;
    exportInProgress.current = true;
    setIsExporting(true);
    setExportError(null);
    try {
      if (share) await navigator.share({ files: [file] });
      else downloadCard(file);
    } catch (error) {
      if (!(share && error instanceof DOMException && error.name === 'AbortError')) {
        setExportError({ draft, message: share ? 'Gagal membagikan gambar. Coba unduh PNG.' : 'Gagal mengunduh gambar. Silakan coba lagi.' });
      }
    } finally {
      exportInProgress.current = false;
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header layanan mengikuti hierarki halaman Otonan. */}
      <header className="space-y-1.5">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>Wargabali</span>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <span>Layanan</span>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <span aria-current="page" className="font-bold text-teal-700 dark:text-teal-300">Kartu Ucapan</span>
        </nav>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-slate-100">
          Kartu Ucapan
        </h1>
        <p className="max-w-2xl text-xs font-medium leading-relaxed text-slate-500 sm:text-sm dark:text-slate-400">
          Buat kartu ucapan dengan gaya pilihan Anda, lalu bagikan sebagai gambar.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
        {/* Urutan di layar sempit menempatkan pratinjau sebelum form. */}
        <div className="space-y-6 lg:col-start-1 lg:row-start-1">
          <section className={panelClass} aria-labelledby="kartu-ucapan-form-title">
            <h2 id="kartu-ucapan-form-title" className="mb-4 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">Isi Kartu</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="kartu-isi" className={labelClass}>Isi ucapan</label>
                <textarea id="kartu-isi" required rows={3} value={draft.greeting}
                  placeholder="Tuliskan ucapan Anda" aria-describedby={hasGreeting ? undefined : 'kartu-isi-help'}
                  className={`${fieldClass} min-h-24 resize-y`}
                  onChange={(event) => updateText('greeting', event.target.value)} />
                {!hasGreeting && <p id="kartu-isi-help" className="mt-1 text-xs text-slate-500 dark:text-slate-400">Isi teks ucapan untuk mulai berbagi.</p>}
              </div>
              <div>
                <label htmlFor="kartu-pesan" className={labelClass}>Pesan (opsional)</label>
                <textarea id="kartu-pesan" rows={2} value={draft.message} aria-describedby="kartu-pesan-count"
                  className={`${fieldClass} min-h-16 resize-y`}
                  onChange={(event) => updateText('message', event.target.value, messageLimit)} />
                <p id="kartu-pesan-count" className="mt-1 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {characters(draft.message).length}/{messageLimit}
                </p>
              </div>
              <div>
                <label htmlFor="kartu-pengirim" className={labelClass}>Nama pengirim (opsional)</label>
                <input id="kartu-pengirim" type="text" value={draft.sender} aria-describedby="kartu-pengirim-count"
                  className={`${fieldClass} h-11`}
                  onChange={(event) => updateText('sender', event.target.value, senderLimit)} />
                <p id="kartu-pengirim-count" className="mt-1 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {characters(draft.sender).length}/{senderLimit}
                </p>
              </div>
            </div>
          </section>
          <KartuUcapanStylePanel style={draft.style} onChange={updateStyle}
            onReset={() => updateStyle(defaultStyle)} onPhotoPending={setIsReadingPhoto} />
        </div>

        {/* Aksi pindah ke bawah editor di ponsel dan tetap bersama pratinjau di desktop. */}
        <div className="contents lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:block lg:space-y-4">
          <section className={`${panelClass} row-start-1`} aria-labelledby="kartu-ucapan-preview-title">
            <h2 id="kartu-ucapan-preview-title" className="mb-4 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">Pratinjau</h2>
            <KartuUcapanPreview canvasRef={canvasRef} draft={draft} renderedDraft={renderedDraft} onRendered={setRenderedDraft} />
          </section>
          <div className={`${panelClass} row-start-3 space-y-3`}>
            <div className="flex flex-wrap gap-2">
              {shareAvailable && (
                <button type="button" disabled={!file || isExporting} onClick={() => void exportImage(true)}
                  className={`${primaryButtonClass} grow`}>
                  <Share2 aria-hidden="true" className="size-4" /> Bagikan Gambar
                </button>
              )}
              <button type="button" disabled={!file || isExporting} onClick={() => void exportImage(false)}
                className={`${shareAvailable ? outlineButtonClass : primaryButtonClass} grow`}>
                <Download aria-hidden="true" className="size-4" /> Unduh PNG
              </button>
            </div>
            {encodeFailed && (
              <div className="flex flex-wrap items-center gap-2">
                <p role="alert" className="text-xs font-medium text-rose-700 dark:text-rose-300">Gambar gagal disiapkan.</p>
                <button type="button" className={outlineButtonClass} onClick={() => {
                  setPrepared(null);
                  setEncodeAttempt((value) => value + 1);
                }}>Coba Lagi</button>
              </div>
            )}
            {exportError?.draft === draft && <p role="alert" className="text-xs font-medium text-rose-700 dark:text-rose-300">{exportError.message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
