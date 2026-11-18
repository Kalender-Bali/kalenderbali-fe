import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { backgroundUrl, characters } from '../utils/kartuUcapanDraft';
import type { CardDraft } from '../utils/kartuUcapanDraft';

const width = 360;
const height = 450;
const scale = 3;
const inset = 26;
const textWidth = width - inset * 2;
const placeholder = 'Tulis ucapan Anda di sini';
const logoUrl = `${import.meta.env.BASE_URL}assets/images/icon/logo-kalenderbali.svg`;

interface Props {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  draft: CardDraft;
  renderedDraft: CardDraft | null;
  onRendered: (draft: CardDraft) => void;
}

export function KartuUcapanPreview({ canvasRef, draft, renderedDraft, onRendered }: Props) {
  const images = useRef(new Map<string, Promise<HTMLImageElement>>());
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<{ draft: CardDraft; attempt: number } | null>(null);
  const failed = failure?.draft === draft && failure.attempt === attempt;

  // Hanya draft terbaru boleh menggambar setelah pemuatan gambar selesai.
  useEffect(() => {
    let current = true;
    const background = draft.style.background;
    const cache = images.current;
    const image = background.kind === 'preset' ? loadImage(cache, backgroundUrl(background.id))
      : background.kind === 'photo' ? background.image : null;

    Promise.all([loadImage(cache, logoUrl), image]).then(([logo, backgroundImage]) => {
      const canvas = canvasRef.current;
      if (!current || !canvas) return;
      drawCard(canvas, draft, logo, backgroundImage);
      onRendered(draft);
    }).catch(() => {
      if (current) setFailure({ draft, attempt });
    });

    return () => { current = false; };
  }, [attempt, canvasRef, draft, onRendered]);

  return (
    <div>
      <div className="relative mx-auto aspect-[4/5] w-full max-w-72 bg-slate-100 sm:max-w-[22rem] dark:bg-slate-800">
        <canvas ref={canvasRef} width={width * scale} height={height * scale} role="img"
          aria-label="Gambar pratinjau Kartu Ucapan" className="block size-full" />
        {!renderedDraft && !failed && (
          <div role="status" className="absolute inset-0 grid place-items-center px-4 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
            Menyiapkan pratinjau…
          </div>
        )}
      </div>
      {failed && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p role="alert" className="text-xs font-medium text-rose-700 dark:text-rose-300">Pratinjau gagal dimuat.</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-teal-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Coba Lagi
          </button>
        </div>
      )}
    </div>
  );
}

// Simpan logo dan dua latar terakhir yang dimuat agar mengetik tidak memuat ulang aset.
function loadImage(cache: Map<string, Promise<HTMLImageElement>>, src: string) {
  const cached = cache.get(src);
  if (cached) return cached;

  const image = new Image();
  image.src = src;
  const loading = image.decode().then(() => image).catch((error: unknown) => {
    if (cache.get(src) === loading) cache.delete(src);
    throw error;
  });
  cache.set(src, loading);
  if (cache.size > 3) {
    const oldestBackground = [...cache.keys()].find((key) => key !== logoUrl);
    if (oldestBackground) cache.delete(oldestBackground);
  }
  return loading;
}

function drawCard(canvas: HTMLCanvasElement, draft: CardDraft, logo: HTMLImageElement, image: HTMLImageElement | null) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Kanvas tidak tersedia.');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const { style } = draft;
  const centered = style.layout === 'ucapan';

  // Lapisan kartu mengikuti contoh Android: gradasi, motif, aksen, lalu isi.
  const gradient = centered ? ctx.createLinearGradient(0, 0, 0, height)
    : ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, style.topColor);
  gradient.addColorStop(1, style.bottomColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  if (image) {
    const zoom = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const imageWidth = image.naturalWidth * zoom;
    const imageHeight = image.naturalHeight * zoom;
    ctx.globalAlpha = 0.2;
    ctx.drawImage(image, (width - imageWidth) / 2, (height - imageHeight) / 2, imageWidth, imageHeight);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#ed7f21';
  ctx.fillRect(0, 0, width, 6);
  ctx.fillStyle = style.textColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = centered ? 'center' : 'left';
  const x = centered ? width / 2 : inset;

  // Ruang pesan, pengirim, dan merek dicadangkan sebelum ucapan dipenggal.
  const details = [
    { text: draft.message.trim(), size: 14, weight: 400, lineHeight: 18, maxLines: 5 },
    { text: draft.sender.trim() ? `Dari: ${draft.sender.trim()}` : '', size: 14, weight: 600, lineHeight: 18, maxLines: 2 },
  ].filter(({ text }) => text).map((detail) => {
    ctx.font = cardFont(detail.size, detail.weight);
    return { ...detail, lines: fitText(ctx, detail.text, detail.maxLines).lines };
  });
  const detailsGap = 7;
  const detailsHeight = details.reduce((total, detail, index) =>
    total + detail.lines.length * detail.lineHeight + (index ? detailsGap : 0), 0);
  const brandY = height - 33;
  let detailY = brandY - 21 - detailsHeight;
  const textTop = 24;
  const textBottom = detailY - (details.length ? 12 : 0);
  const greeting = draft.greeting.trim() || placeholder;
  const isShort = greeting.length <= 160 && characters(greeting).length <= 80;
  const size = isShort ? 24 : 18;
  const lineHeight = isShort ? 31 : 24;
  const excerptHeight = 18;
  ctx.font = cardFont(size, isShort ? 600 : 400);
  const fitting = fitText(ctx, greeting, Math.floor((textBottom - textTop) / lineHeight));
  const lines = fitting.excerpt
    ? fitText(ctx, greeting, Math.floor((textBottom - textTop - excerptHeight) / lineHeight)).lines
    : fitting.lines;
  const greetingHeight = lines.length * lineHeight + (fitting.excerpt ? excerptHeight : 0);
  const greetingY = textTop + (textBottom - textTop - greetingHeight) / 2;
  paintLines(ctx, lines, x, greetingY, lineHeight);
  if (fitting.excerpt) {
    ctx.font = cardFont(11, 600);
    ctx.fillText('Kutipan', x, greetingY + lines.length * lineHeight + excerptHeight / 2);
  }

  for (const detail of details) {
    ctx.font = cardFont(detail.size, detail.weight);
    paintLines(ctx, detail.lines, x, detailY, detail.lineHeight);
    detailY += detail.lines.length * detail.lineHeight + detailsGap;
  }
  ctx.textAlign = 'left';
  ctx.font = cardFont(11, 600);
  ctx.drawImage(logo, inset, brandY - 9, 18, 18);
  ctx.fillText('Kalender Bali Lengkap', inset + 25, brandY);
}

function cardFont(size: number, weight: number) {
  return `${weight} ${size}px system-ui, sans-serif`;
}

function paintLines(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, lineHeight: number) {
  lines.forEach((line, index) => ctx.fillText(line, x, y + (index + 0.5) * lineHeight, textWidth));
}

// Ukur dengan font kanvas yang benar dan potong kata panjang di batas karakter.
function fitText(ctx: CanvasRenderingContext2D, text: string, maxLines: number) {
  const lines: string[] = [];
  const limit = Math.max(1, maxLines);
  paragraphs: for (const paragraph of text.split(/\r\n?|\n/)) {
    let line = '';
    for (const word of paragraph.trim().split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= textWidth) {
        line = next;
        continue;
      }
      if (line) {
        lines.push(line);
        if (lines.length >= limit) { lines.push(word); break paragraphs; }
        line = '';
      }
      if (ctx.measureText(word).width <= textWidth) {
        line = word;
        continue;
      }
      for (const character of characters(word)) {
        if (line && ctx.measureText(line + character).width > textWidth) {
          lines.push(line);
          if (lines.length >= limit) { lines.push(character); break paragraphs; }
          line = '';
        }
        line += character;
      }
    }
    lines.push(line);
    if (lines.length > limit) break;
  }
  const excerpt = lines.length > limit;
  const visible = lines.slice(0, limit);
  if (excerpt) {
    const last = characters(visible[visible.length - 1].trimEnd());
    while (last.length && ctx.measureText(`${last.join('')}…`).width > textWidth) last.pop();
    visible[visible.length - 1] = `${last.join('')}…`;
  }
  return { lines: visible, excerpt };
}
