import { useEffect, useRef, useState } from 'react';
import { canShareCard, canShareText, copyShareText, createCardPng, downloadCard } from '../utils/exportShareCard';
import type { CardDraft } from '../utils/shareCardDraft';

type Action = 'share-image' | 'download' | 'share-text' | 'copy';

export function useShareCardExport({ draft, fileName, enabled = true, photoPending, text }: {
  draft: CardDraft;
  fileName: string;
  enabled?: boolean;
  photoPending: boolean;
  text?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderedDraft, setRenderedDraft] = useState<CardDraft | null>(null);
  const [prepared, setPrepared] = useState<{ draft: CardDraft; file: File | null } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState<{ draft: CardDraft; message: string; error: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [preferCopy, setPreferCopy] = useState(false);
  const [supportsFileShare] = useState(() => canShareCard());
  const busyRef = useRef(false);
  const nativeShareEndedAt = useRef(-Infinity);
  const current = enabled && !photoPending && prepared?.draft === draft;
  const file = current ? prepared.file : null;
  const shareImageAvailable = prepared?.file ? canShareCard(prepared.file) : supportsFileShare;
  const shareTextAvailable = Boolean(text && !preferCopy && canShareText(text));

  // Siapkan PNG dari render terbaru agar klik Bagikan tetap bisa membuka dialog native.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || photoPending || renderedDraft !== draft || !canvas) return;
    let active = true;
    const timer = window.setTimeout(() => {
      createCardPng(canvas, fileName).then((png) => {
        if (active) setPrepared({ draft, file: png });
      }).catch(() => {
        if (active) setPrepared({ draft, file: null });
      });
    }, 220);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [attempt, draft, enabled, fileName, photoPending, renderedDraft]);

  // Satu kunci mencegah panggilan tumpang tindih dari semua tombol berbagi.
  async function run(action: Action) {
    if (busyRef.current || !enabled) return;
    if ((action === 'share-image' || action === 'download') && !file) return;
    if ((action === 'share-text' || action === 'copy') && !text) return;
    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    const nativeShare = action === 'share-image' || action === 'share-text';
    try {
      switch (action) {
        case 'share-image':
          if (file) await navigator.share({ files: [file] });
          break;
        case 'download':
          if (file) downloadCard(file);
          break;
        case 'share-text':
          await navigator.share({ text });
          break;
        case 'copy':
          if (text) await copyShareText(text);
          setNotice({ draft, message: 'Teks disalin.', error: false });
          break;
      }
    } catch (error) {
      if (nativeShare && error instanceof DOMException && error.name === 'AbortError') return;
      const messages = {
        'share-image': 'Gagal membagikan gambar. Coba unduh PNG.',
        download: 'Gagal mengunduh gambar. Silakan coba lagi.',
        'share-text': 'Gagal membagikan teks. Coba salin teks.',
        copy: 'Teks gagal disalin. Silakan coba lagi.',
      };
      if (action === 'share-text') setPreferCopy(true);
      setNotice({ draft, message: messages[action], error: true });
    } finally {
      if (nativeShare) nativeShareEndedAt.current = performance.now();
      busyRef.current = false;
      setBusy(false);
    }
  }

  return {
    preview: { canvasRef, draft, renderedDraft, onRendered: setRenderedDraft },
    // Beberapa browser meneruskan Escape panel native sesaat setelah promise selesai.
    canDismissOnEscape: () => !busyRef.current && performance.now() - nativeShareEndedAt.current > 250,
    actions: {
      busy, fileReady: Boolean(file), shareImageAvailable, shareTextAvailable, hasText: Boolean(text),
      encodeFailed: Boolean(current && !file),
      notice: notice?.draft === draft ? notice : null,
      run,
      retry: () => { setPrepared(null); setAttempt((count) => count + 1); },
    },
  };
}
