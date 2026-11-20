import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCardExportQuota } from './useCardExportQuota';
import { canShareCard, canShareText, copyShareText, createCardPng, downloadCard } from '../utils/exportShareCard';
import type { CardDraft } from '../utils/shareCardDraft';

type Action = 'share-image' | 'download' | 'share-text' | 'copy';
type ApprovedImage = { file: File; token: string; expiresAt: number };

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
  const exportRequest = useRef<AbortController | null>(null);
  const approvedImage = useRef<ApprovedImage | null>(null);
  const quota = useCardExportQuota();
  const current = enabled && !photoPending && prepared?.draft === draft;
  const file = current ? prepared.file : null;
  const shareImageAvailable = prepared?.file ? canShareCard(prepared.file) : supportsFileShare;
  const shareTextAvailable = Boolean(text && !preferCopy && canShareText(text));

  // Buang izin yang belum dipakai saat kartu, sesi, atau editor berganti.
  useEffect(() => () => {
    exportRequest.current?.abort();
    approvedImage.current = null;
  }, [file, quota.scope]);

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
    const image = action === 'share-image' || action === 'download';
    if (image && (!file || !quota.signedIn)) return;
    if ((action === 'share-text' || action === 'copy') && !text) return;
    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    let openedNativeShare = false;
    try {
      if (image && file) {
        const token = useAuthStore.getState().token;
        if (!token) return;
        const approval = approvedImage.current;
        if (approval?.file !== file || approval.token !== token || approval.expiresAt <= Date.now()) {
          approvedImage.current = null;
          const controller = new AbortController();
          exportRequest.current = controller;
          try {
            const result = await quota.authorize(file, controller.signal);
            if (!result.allowed) {
              setNotice({ draft, message: 'Kuota kartu gambar hari ini sudah habis.', error: true });
              return;
            }
            approvedImage.current = { file, token, expiresAt: Date.parse(result.quota.resets_at) };
          } catch (error) {
            if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
            setNotice({ draft, message: 'Izin ekspor gagal diperiksa. Silakan coba lagi.', error: true });
            return;
          } finally {
            if (exportRequest.current === controller) exportRequest.current = null;
          }
        }
        // Browser dapat kehilangan aktivasi selama pemeriksaan kuota. Klik berikutnya memakai izin yang sama.
        if (action === 'share-image' && navigator.userActivation?.isActive === false) {
          setNotice({ draft, message: 'Kartu siap. Tekan Bagikan Gambar lagi untuk membuka menu berbagi.', error: false });
          return;
        }
      }
      switch (action) {
        case 'share-image':
          openedNativeShare = true;
          if (file) await navigator.share({ files: [file] });
          approvedImage.current = null;
          break;
        case 'download':
          if (file) downloadCard(file);
          approvedImage.current = null;
          break;
        case 'share-text':
          openedNativeShare = true;
          await navigator.share({ text });
          break;
        case 'copy':
          if (text) await copyShareText(text);
          setNotice({ draft, message: 'Teks disalin.', error: false });
          break;
      }
    } catch (error) {
      if (openedNativeShare && error instanceof DOMException && error.name === 'AbortError') {
        if (image) approvedImage.current = null;
        return;
      }
      const messages = {
        'share-image': 'Gagal membagikan gambar. Coba unduh PNG.',
        download: 'Gagal mengunduh gambar. Silakan coba lagi.',
        'share-text': 'Gagal membagikan teks. Coba salin teks.',
        copy: 'Teks gagal disalin. Silakan coba lagi.',
      };
      if (action === 'share-text') setPreferCopy(true);
      setNotice({ draft, message: messages[action], error: true });
    } finally {
      if (openedNativeShare) nativeShareEndedAt.current = performance.now();
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
      imageQuota: { signedIn: quota.signedIn, status: quota.status, loading: quota.loading, error: quota.error, refetch: quota.refetch },
      encodeFailed: Boolean(current && !file),
      notice: notice?.draft === draft ? notice : null,
      run,
      retry: () => { setPrepared(null); setAttempt((count) => count + 1); },
    },
  };
}
