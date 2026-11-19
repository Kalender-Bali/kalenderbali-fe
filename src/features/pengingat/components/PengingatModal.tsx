import type { ReactNode } from 'react';
import { AppDialog } from '@/components/ui/AppDialog';

interface PengingatModalProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export function PengingatModal({ children, ...props }: PengingatModalProps) {
  // Pertahankan identitas dan fokus awal Pengingat pada kerangka dialog bersama.
  return (
    <AppDialog {...props} eyebrow="Pengingat pribadi" closeLabel="Tutup dialog pengingat" focusField>
      <div className="space-y-5">{children}</div>
    </AppDialog>
  );
}
