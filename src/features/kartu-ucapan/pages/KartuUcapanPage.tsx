import { useEffect, useState } from 'react';
import { ShareCardActions } from '@/features/share-card/components/ShareCardActions';
import { ShareCardFields } from '@/features/share-card/components/ShareCardFields';
import { ShareCardPreview } from '@/features/share-card/components/ShareCardPreview';
import { ShareCardStylePanel } from '@/features/share-card/components/ShareCardStylePanel';
import { useShareCardExport } from '@/features/share-card/hooks/useShareCardExport';
import type { CardDraft, CardStyle } from '@/features/share-card/utils/shareCardDraft';

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder:font-medium placeholder:text-slate-400 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500';
const labelClass = 'mb-1.5 block text-[11px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400';
const panelClass = 'min-w-0 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7 dark:border-slate-800 dark:bg-slate-900';

// Gaya bawaan khusus Kartu Ucapan, termasuk saat pengguna memilih Reset Gaya.
const greetingStyle: CardStyle = {
  layout: 'ucapan',
  topColor: '#3f82f6',
  bottomColor: '#08978d',
  textColor: '#ffffff',
  background: { kind: 'preset', id: 'natural_pattern' },
};

export default function KartuUcapanPage() {
  // Draft lokal menjadi sumber yang sama untuk form, pratinjau, dan ekspor.
  const [draft, setDraft] = useState<CardDraft & { content: { kind: 'greeting'; text: string } }>({
    content: { kind: 'greeting', text: '' },
    message: '',
    sender: '',
    style: greetingStyle,
  });
  const hasGreeting = draft.content.text.trim().length > 0;
  const [photoPending, setPhotoPending] = useState(false);
  const { preview, actions } = useShareCardExport({
    draft, fileName: 'kartu-ucapan-kalender-bali.png', enabled: hasGreeting, photoPending,
  });

  useEffect(() => {
    const previous = document.title;
    document.title = 'Kartu Ucapan | Kalender Bali';
    return () => { document.title = previous; };
  }, []);

  function updateStyle(patch: Partial<CardStyle>) {
    setDraft((current) => ({ ...current, style: { ...current.style, ...patch } }));
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
                <textarea id="kartu-isi" required rows={3} value={draft.content.text}
                  placeholder="Tuliskan ucapan Anda" aria-describedby={hasGreeting ? undefined : 'kartu-isi-help'}
                  className={`${fieldClass} min-h-24 resize-y`}
                  onChange={(event) => {
                    const text = event.target.value;
                    setDraft((current) => ({ ...current, content: { kind: 'greeting', text } }));
                  }} />
                {!hasGreeting && <p id="kartu-isi-help" className="mt-1 text-xs text-slate-500 dark:text-slate-400">Isi teks ucapan untuk mulai berbagi.</p>}
              </div>
              <ShareCardFields message={draft.message} sender={draft.sender}
                onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))} />
            </div>
          </section>
          <ShareCardStylePanel style={draft.style} onChange={updateStyle}
            onReset={() => updateStyle(greetingStyle)} onPhotoPending={setPhotoPending} />
        </div>

        {/* Aksi pindah ke bawah editor di ponsel dan tetap bersama pratinjau di desktop. */}
        <div className="contents lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:block lg:space-y-4">
          <section className={`${panelClass} row-start-1`} aria-labelledby="kartu-ucapan-preview-title">
            <h2 id="kartu-ucapan-preview-title" className="mb-4 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">Pratinjau</h2>
            <ShareCardPreview {...preview} />
          </section>
          <div className={`${panelClass} row-start-3`}>
            <ShareCardActions actions={actions} />
          </div>
        </div>
      </div>
    </div>
  );
}
