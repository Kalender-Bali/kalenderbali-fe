import { ChevronLeft, ChevronRight } from 'lucide-react';

export function PengingatNotificationPagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / 20));
  // A deletion in another tab can empty this page. Keep a route back to existing notifications.
  if (pages === 1 && page === 1) return null;
  return <div className="px-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs tabular-nums">
    <button type="button" disabled={page === 1} onClick={() => onChange(Math.min(page - 1, pages))} aria-label="Notifikasi sebelumnya" className="min-w-11 min-h-11 flex items-center justify-center cursor-pointer disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
    <span>{page <= pages ? `${page} / ${pages}` : 'Halaman tidak tersedia'}</span>
    <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Notifikasi berikutnya" className="min-w-11 min-h-11 flex items-center justify-center cursor-pointer disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
  </div>;
}
