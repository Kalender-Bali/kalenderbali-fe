import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AppDialog } from '@/components/ui/AppDialog';
import { useShareCardExport } from '../hooks/useShareCardExport';
import { formatCardText } from '../utils/shareCardDraft';
import type { CardDraft, CardStyle, StructuredCardContent } from '../utils/shareCardDraft';
import { ShareCardActions } from './ShareCardActions';
import { ShareCardFields } from './ShareCardFields';
import { ShareCardPreview } from './ShareCardPreview';
import { ShareCardStylePanel } from './ShareCardStylePanel';

interface Props {
  title: string;
  description: string;
  content: StructuredCardContent;
  initialStyle: CardStyle;
  fileName: string;
  trigger: HTMLButtonElement;
  onClose: () => void;
  children?: ReactNode;
  beforePreview?: ReactNode;
}

export default function ShareCardDialog({
  title, description, content, initialStyle, fileName, trigger, onClose, children, beforePreview,
}: Props) {
  const [edits, setEdits] = useState({ message: '', sender: '', style: initialStyle });
  const [photoPending, setPhotoPending] = useState(false);

  // Fitur memasok isi; editor memakai draft yang sama untuk pratinjau, PNG, dan teks.
  const draft = useMemo<CardDraft>(() => ({ ...edits, content }), [edits, content]);
  const { preview, actions, canDismissOnEscape } = useShareCardExport({
    draft, fileName, photoPending, text: formatCardText(draft),
  });

  function updateStyle(patch: Partial<CardStyle>) {
    setEdits((current) => ({ ...current, style: { ...current.style, ...patch } }));
  }

  return (
    <AppDialog title={title} description={description}
      returnFocus={trigger} onClose={onClose} onEscape={() => { if (canDismissOnEscape()) onClose(); }}
      footer={<ShareCardActions actions={actions} />}>
      {/* Pilihan sumber tampil sebelum pratinjau pada semua ukuran layar. */}
      {beforePreview && <div className="mb-5">{beforePreview}</div>}
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[minmax(0,4fr)_minmax(0,5fr)]">
        <div className="min-w-0 rounded-xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50">
          <ShareCardPreview {...preview} />
        </div>
        <div className="min-w-0 space-y-4">
          <ShareCardFields message={edits.message} sender={edits.sender}
            onChange={(field, value) => setEdits((current) => ({ ...current, [field]: value }))} />
          {/* Kontrol yang tergantung hasil tetap dimiliki fitur pemanggil. */}
          {children}
          <ShareCardStylePanel style={edits.style} onChange={updateStyle} onPhotoPending={setPhotoPending}
            onReset={() => updateStyle(initialStyle)} />
        </div>
      </div>
    </AppDialog>
  );
}
