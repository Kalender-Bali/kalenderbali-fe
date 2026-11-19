import { useMemo, useState } from 'react';
import ShareCardDialog from '@/features/share-card/components/ShareCardDialog';
import type { CardStyle } from '@/features/share-card/utils/shareCardDraft';
import type { OtonanHasilItem, OtonanNormalizedInput } from '../types/otonan.types';
import { buildOtonanShareContent, hasOtonanBirthDetails } from '../utils/otonanShareCard';

const otonanStyle: CardStyle = {
  layout: 'standar',
  topColor: '#ffffff',
  bottomColor: '#ede9fe',
  textColor: '#0f172a',
  background: { kind: 'none' },
};

export function OtonanShareCardDialog({ item, input, trigger, onClose }: {
  item: OtonanHasilItem;
  input: OtonanNormalizedInput | undefined;
  trigger: HTMLButtonElement;
  onClose: () => void;
}) {
  const [includeBirth, setIncludeBirth] = useState(false);

  // Pilihan detail lahir hanya berlaku pada isi kartu Otonan.
  const content = useMemo(() => buildOtonanShareContent(item, input, includeBirth), [item, input, includeBirth]);

  return (
    <ShareCardDialog title="Bagikan Otonan" description="Bagikan tanggal perayaan Otonan yang dipilih."
      trigger={trigger} onClose={onClose} content={content} initialStyle={otonanStyle} fileName={`otonan-${item.tanggal}.png`}>
      {hasOtonanBirthDetails(input) && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 [touch-action:manipulation]">
          <input type="checkbox" checked={includeBirth} onChange={(event) => setIncludeBirth(event.target.checked)}
            className="size-4 shrink-0 accent-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600" />
          Sertakan detail kelahiran
        </label>
      )}
    </ShareCardDialog>
  );
}
