import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { modalContentVariants, modalOverlayVariants } from '@/lib/animations';

interface CalendarModalProps {
  titleId: string;
  width: string;
  onClose: () => void;
  children: ReactNode;
}

export function CalendarModal({ titleId, width, onClose, children }: CalendarModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => { dialog.close(); };
  }, []);

  return createPortal(
    <dialog ref={dialogRef} data-calendar-modal aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}
      className="fixed inset-0 m-0 h-full w-full max-h-none max-w-none overflow-hidden bg-transparent p-0 text-inherit backdrop:bg-transparent">
      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 overscroll-contain">
        <motion.div variants={modalOverlayVariants} initial="hidden" animate="visible" exit="exit"
          onClick={onClose} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
        <motion.div variants={modalContentVariants} initial="hidden" animate="visible" exit="exit"
          className={`relative w-full ${width} bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden z-10 max-h-[88vh] flex flex-col`}>
          {children}
        </motion.div>
      </div>
    </dialog>, document.body,
  );
}
