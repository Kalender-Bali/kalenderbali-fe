import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Check, ChevronDown, ImagePlus, RotateCcw } from 'lucide-react';
import { backgroundPresets, backgroundUrl } from '../utils/kartuUcapanDraft';
import type { CardBackground, CardStyle } from '../utils/kartuUcapanDraft';

const colorFields = [
  { key: 'topColor', label: 'Gradasi atas' },
  { key: 'bottomColor', label: 'Gradasi bawah' },
  { key: 'textColor', label: 'Warna teks' },
] as const;
const backgroundChoices = [{ id: null, label: 'Tanpa Latar' }, ...backgroundPresets] as const;
const maxPhotoBytes = 20 * 1024 * 1024;

interface Props {
  style: CardStyle;
  onChange: (patch: Partial<CardStyle>) => void;
  onReset: () => void;
  onPhotoPending: (pending: boolean) => void;
}

export function KartuUcapanStylePanel({ style, onChange, onReset, onPhotoPending }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const photoRequest = useRef(0);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const gradient = `linear-gradient(${style.layout === 'ucapan' ? '180deg' : '135deg'}, ${style.topColor}, ${style.bottomColor})`;

  // Abaikan hasil unggahan yang sudah diganti atau selesai setelah halaman ditutup.
  useEffect(() => () => { photoRequest.current += 1; }, []);

  function finishPhotoSelection() {
    photoRequest.current += 1;
    setIsReadingPhoto(false);
    onPhotoPending(false);
    setPhotoError('');
  }

  function chooseBackground(background: CardBackground) {
    finishPhotoSelection();
    onChange({ background });
  }

  async function readPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    finishPhotoSelection();
    if (file.size > maxPhotoBytes) {
      setPhotoError('Ukuran foto melebihi 20 MB. Pilih foto yang lebih kecil.');
      return;
    }

    const request = photoRequest.current;
    setIsReadingPhoto(true);
    onPhotoPending(true);

    // Foto galeri hanya dibaca di browser dan URL sementaranya dilepas setelah pemuatan.
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (!image.naturalWidth || !image.naturalHeight) throw new Error('Foto tidak valid.');
      if (photoRequest.current === request) onChange({ background: { kind: 'photo', image } });
    } catch {
      if (photoRequest.current === request) setPhotoError('Foto gagal dibaca. Silakan pilih kembali.');
    } finally {
      URL.revokeObjectURL(url);
      if (photoRequest.current === request) {
        setIsReadingPhoto(false);
        onPhotoPending(false);
      }
    }
  }

  return (
    <details className="group rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-lg font-extrabold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:px-7 dark:text-slate-100 [&::-webkit-details-marker]:hidden [touch-action:manipulation]">
        Gaya Kartu
        <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-teal-700 group-open:rotate-180 dark:text-teal-300" />
      </summary>
      <div className="space-y-5 border-t border-slate-100 p-5 sm:p-7 dark:border-slate-800">
        {/* Kontrol gaya mengirim perubahan ke draft yang dikelola halaman. */}
        <div>
          <label htmlFor="kartu-layout" className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400">Tata letak</label>
          <div className="relative">
            <select id="kartu-layout" value={style.layout}
              onChange={(event) => onChange({ layout: event.target.value === 'standar' ? 'standar' : 'ucapan' })}
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
              <option value="ucapan">Ucapan</option>
              <option value="standar">Standar</option>
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {colorFields.map(({ key, label }) => (
            <label key={key} className="relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-teal-600 sm:text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              <span aria-hidden="true" className="size-6 shrink-0 rounded-md border border-slate-300 dark:border-slate-600" style={{ backgroundColor: style[key] }} />
              {label}
              <input type="color" value={style[key]} onChange={(event) => onChange({ [key]: event.target.value })}
                className="absolute inset-0 size-full cursor-pointer opacity-0" />
            </label>
          ))}
        </div>
        <div>
          <h3 id="kartu-latar-title" className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">Latar belakang</h3>
          <div role="group" aria-labelledby="kartu-latar-title" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {backgroundChoices.map(({ id, label }) => {
              const selected = id === null ? style.background.kind === 'none'
                : style.background.kind === 'preset' && style.background.id === id;
              return (
                <BackgroundTile key={label} label={label} selected={selected} gradient={gradient}
                  onClick={() => chooseBackground(id === null ? { kind: 'none' } : { kind: 'preset', id })}>
                  {id !== null && <img src={backgroundUrl(id, true)} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover opacity-20" />}
                </BackgroundTile>
              );
            })}
            <BackgroundTile label="Unggah Foto" selected={style.background.kind === 'photo'} gradient={gradient}
              onClick={() => fileInput.current?.click()}>
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid size-9 place-items-center rounded-full bg-white text-slate-800">
                  <ImagePlus aria-hidden="true" className="size-5" />
                </span>
              </span>
            </BackgroundTile>
          </div>
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={readPhoto} />
          {isReadingPhoto && <p role="status" className="mt-2 text-xs text-slate-500 dark:text-slate-400">Membaca foto…</p>}
          {photoError && <p role="alert" className="mt-2 text-xs font-medium text-rose-700 dark:text-rose-300">{photoError}</p>}
        </div>
        <button type="button"
          onClick={() => { finishPhotoSelection(); onReset(); }}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-teal-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 [touch-action:manipulation]">
          <RotateCcw aria-hidden="true" className="size-4" /> Reset Gaya
        </button>
      </div>
    </details>
  );
}

function BackgroundTile({ children, gradient, label, selected, onClick }: {
  children?: ReactNode;
  gradient: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick}
      className={`min-h-11 min-w-0 cursor-pointer rounded-xl border p-1.5 text-left text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 [touch-action:manipulation] ${selected ? 'border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200' : 'border-slate-200 text-slate-700 hover:border-teal-500/40 dark:border-slate-700 dark:text-slate-300'}`}>
      <span aria-hidden="true" className="relative block aspect-[4/5] overflow-hidden rounded-lg" style={{ backgroundImage: gradient }}>
        {children}
        {selected && <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-teal-700 text-white"><Check className="size-3.5" /></span>}
      </span>
      <span className="mt-1 block break-words leading-tight">{label}</span>
    </button>
  );
}
