import { useEffect, useEffectEvent, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface AppDialogProps {
  title: string;
  description: string;
  eyebrow?: string;
  closeLabel?: string;
  focusField?: boolean;
  returnFocus?: HTMLElement;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  onEscape?: () => void;
}

export function AppDialog({
  title, description, eyebrow, closeLabel = 'Tutup dialog', focusField = false,
  returnFocus, children, footer, onClose, onEscape,
}: AppDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const dismiss = useEffectEvent(() => (onEscape ?? onClose)());

  // Kelola fokus dan scroll selama dialog terbuka, termasuk saat isi atau footer berubah.
  useEffect(() => {
    const trigger = returnFocus ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const controls = () => Array.from(dialog?.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, summary, [tabindex]',
    ) ?? []).filter((node) => !node.matches(':disabled') && node.tabIndex >= 0 && node.getClientRects().length > 0);
    const field = focusField ? controls().find((node) => node.matches('input, select, textarea')) : undefined;
    (field ?? dialog)?.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        dismiss();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = controls();
      const first = focusable[0];
      const last = focusable.at(-1);
      const active = document.activeElement;
      if (!first || !last) {
        event.preventDefault();
        dialog?.focus();
      } else if (
        !dialog?.contains(active) || active === dialog ||
        (event.shiftKey ? active === first : active === last)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKeyDown);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [focusField, returnFocus]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1}
        className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none sm:max-w-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/60 via-slate-50/40 to-emerald-50/30 p-6 sm:p-7 dark:border-slate-800 dark:from-teal-950/40 dark:via-slate-900 dark:to-slate-900">
          <div>
            {eyebrow && <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488] dark:text-teal-400">{eyebrow}</p>}
            <h2 id={titleId} className="text-base font-extrabold tracking-tight text-[#0f172a] sm:text-lg dark:text-slate-100">{title}</h2>
            <p id={descriptionId} className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={closeLabel}
            className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-600 dark:text-slate-300 dark:hover:bg-slate-800 [touch-action:manipulation]">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        {/* Hanya isi yang bergulir, supaya aksi di footer tetap mudah dijangkau. */}
        <div className="min-h-0 overflow-y-auto overscroll-contain p-6 sm:p-7">{children}</div>
        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-white p-4 sm:px-7 dark:border-slate-800 dark:bg-slate-900">
            {footer}
          </div>
        )}
      </div>
    </div>, document.body,
  );
}
