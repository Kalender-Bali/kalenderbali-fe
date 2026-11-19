import { useMemo, useState } from 'react';
import ShareCardDialog from '@/features/share-card/components/ShareCardDialog';
import type { CardStyle } from '@/features/share-card/utils/shareCardDraft';
import type { GarisHidupProfileResult } from '../types/garisHidup.types';
import { buildGarisHidupShareCard, currentPeriodIndex } from '../utils/garisHidupShareCard';

const style: CardStyle = { layout: 'standar', topColor: '#ffffff', bottomColor: '#f0f9ff', textColor: '#0f172a', background: { kind: 'none' } };

export default function GarisHidupShareCardDialog({ profile, trigger, onClose }: {
  profile: GarisHidupProfileResult; trigger: HTMLButtonElement; onClose: () => void;
}) {
  const [index, setIndex] = useState(() => currentPeriodIndex(profile));
  const period = profile.seluruh_periode[index];
  // Konten berubah tanpa menghapus pesan dan gaya pada editor bersama.
  const content = useMemo(() => buildGarisHidupShareCard(profile, period), [profile, period]);
  return (
    <ShareCardDialog title="Bagikan Garis Hidup" description={`Pilih periode usia untuk ${profile.nama}.`}
      trigger={trigger} onClose={onClose} content={content} initialStyle={style}
      fileName={`garis-hidup-usia-${period.min_umur}-${period.max_umur}.png`}>
      <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400" htmlFor="garis-hidup-periode">Periode usia</label>
      <select id="garis-hidup-periode" value={index} onChange={event => setIndex(Number(event.target.value))}
        className="w-full min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
        {profile.seluruh_periode.map((item, i) => <option key={`${item.min_umur}-${item.max_umur}`} value={i}>
          {item.min_umur}–{item.max_umur} tahun{profile.melewati_batas_tabel && i === profile.seluruh_periode.length - 1 ? ' (rentang terakhir tersedia)' : ''}
        </option>)}
      </select>
    </ShareCardDialog>
  );
}
