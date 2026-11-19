import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ShareCardDialog from '@/features/share-card/components/ShareCardDialog';
import type { CardStyle } from '@/features/share-card/utils/shareCardDraft';
import { buildRamalanSifatShareCard, type RamalanSifatOption } from '../utils/ramalanSifatShareCard';

const initialStyle: CardStyle = {
  layout: 'standar', topColor: '#ffffff', bottomColor: '#fffbeb',
  textColor: '#0f172a', background: { kind: 'none' },
};

export default function RamalanSifatShareCardDialog({ options, trigger, onClose }: {
  options: RamalanSifatOption[];
  trigger: HTMLButtonElement;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const selected = options[index];
  // Mengganti pilar memperbarui konten tanpa menghapus pesan dan gaya editor.
  const content = useMemo(() => buildRamalanSifatShareCard(selected), [selected]);
  const selector = options.length > 1 && (
    <div>
      <label htmlFor="ramalan-sifat-pilar" className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Pilih pilar</label>
      <div className="relative">
        <select id="ramalan-sifat-pilar" value={index} onChange={(event) => setIndex(Number(event.target.value))}
          className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
          {options.map((option, i) => <option key={option.key} value={i}>{option.label}</option>)}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
  return <ShareCardDialog title="Bagikan Ramalan Sifat" description="Bagikan hasil pilar karakter pilihan Anda."
    content={content} initialStyle={initialStyle} fileName={`ramalan-sifat-${selected.key}.png`}
    trigger={trigger} onClose={onClose} beforePreview={selector} />;
}
