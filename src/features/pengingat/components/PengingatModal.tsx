import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface PengingatModalProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export function PengingatModal({ title, description, children, footer, onClose }: PengingatModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const getControls = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? [])
      .filter(element => element.getClientRects().length > 0);
    (getControls().find(element => element.tagName !== 'BUTTON') ?? dialog)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const controls = getControls();
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) { event.preventDefault(); dialog?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault(); first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose, title]);

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl sm:max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden outline-none">
        <div className="p-6 sm:p-7 bg-gradient-to-r from-teal-50/60 via-slate-50/40 to-emerald-50/30 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488] dark:text-teal-400 mb-1.5">Pengingat pribadi</p>
            <h2 id={titleId} className="text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-slate-100 tracking-tight">{title}</h2>
            <p id={descriptionId} className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup dialog pengingat" className="min-w-11 min-h-11 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto p-6 sm:p-7 space-y-5">{children}</div>
        {footer && <div className="p-4 sm:px-7 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>, document.body,
  );
}
