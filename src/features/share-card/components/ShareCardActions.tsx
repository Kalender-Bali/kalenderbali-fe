import { Clipboard, Download, Share2, Type } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { useShareCardExport } from '../hooks/useShareCardExport';

const base = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-50 [touch-action:manipulation]';
const primary = `${base} bg-[#0e9f90] text-white shadow-xs enabled:hover:bg-[#0c8a7d] enabled:active:bg-[#0a756a]`;
const outline = `${base} border border-slate-200 bg-white text-slate-700 enabled:hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:enabled:hover:bg-slate-800`;

export function ShareCardActions({ actions }: { actions: ReturnType<typeof useShareCardExport>['actions'] }) {
  const { busy, fileReady, shareImageAvailable, shareTextAvailable, hasText, encodeFailed, notice, run, retry, imageQuota } = actions;
  const { pathname, search } = useLocation();
  const imageDisabled = !fileReady || busy || !imageQuota.signedIn;
  const quota = imageQuota.status;
  return (
    <div className="w-full space-y-2">
      {!imageQuota.signedIn ? (
        <Link to="/login" state={{ from: { pathname: `${pathname}${search}` } }} className="inline-flex min-h-11 items-center text-sm font-bold text-teal-700 underline dark:text-teal-300">
          Masuk untuk mengekspor kartu gambar
        </Link>
      ) : quota ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p role="status" className="text-xs font-medium text-slate-600 tabular-nums dark:text-slate-300">
            {quota.is_unlimited ? 'Ekspor gambar tanpa batas.' : `Sisa kartu hari ini ${quota.remaining} dari ${quota.limit}. Reset pukul 00.00 WITA.`}
          </p>
          {!quota.is_unlimited && <Link to="/premium" className="inline-flex min-h-11 items-center text-xs font-bold text-teal-700 underline dark:text-teal-300">Status Keanggotaan</Link>}
        </div>
      ) : imageQuota.error ? (
        <p className="text-xs text-rose-700 dark:text-rose-300">Status kuota belum dapat dimuat.{' '}
          <button type="button" onClick={() => void imageQuota.refetch()} className="min-h-11 font-bold underline">Coba lagi</button>
        </p>
      ) : imageQuota.loading && <p role="status" className="text-xs text-slate-500 dark:text-slate-400">Memuat kuota gambar…</p>}
      {/* Gambar dan teks punya fallback yang bisa dipakai tanpa dialog native. */}
      <div className="flex flex-wrap gap-2">
        {shareImageAvailable && (
          <button type="button" disabled={imageDisabled} onClick={() => void run('share-image')}
            className={`${primary} grow`}>
            <Share2 aria-hidden="true" className="size-4" /> Bagikan Gambar
          </button>
        )}
        <button type="button" disabled={imageDisabled} onClick={() => void run('download')}
          className={`${shareImageAvailable ? outline : primary} grow`}>
          <Download aria-hidden="true" className="size-4" /> Unduh PNG
        </button>
        {hasText && (
          <button type="button" disabled={busy} onClick={() => void run(shareTextAvailable ? 'share-text' : 'copy')}
            className={`${outline} grow`}>
            {shareTextAvailable ? <><Type aria-hidden="true" className="size-4" /> Bagikan Teks</>
              : <><Clipboard aria-hidden="true" className="size-4" /> Salin Teks</>}
          </button>
        )}
      </div>
      {encodeFailed && (
        <div className="flex flex-wrap items-center gap-2">
          <p role="alert" className="text-xs font-medium text-rose-700 dark:text-rose-300">Gambar gagal disiapkan.</p>
          <button type="button" className={outline} onClick={retry}>Coba Lagi</button>
        </div>
      )}
      {notice && (
        <p role={notice.error ? 'alert' : 'status'} className={`text-xs font-medium ${notice.error ? 'text-rose-700 dark:text-rose-300' : 'text-teal-700 dark:text-teal-300'}`}>
          {notice.message}
        </p>
      )}
    </div>
  );
}
