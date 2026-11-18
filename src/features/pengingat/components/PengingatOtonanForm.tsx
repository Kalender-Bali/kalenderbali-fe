import { useState } from 'react';
import { useReadQuery } from '@/lib/useReadQuery';
import { authQueryScope, useAuthStore } from '@/stores/useAuthStore';
import { searchOtonan } from '@/features/otonan/api/otonanApi';
import type { OtonanSearchParams, OtonanSearchType } from '@/features/otonan/types/otonan.types';
import type { PengingatAddProps } from '../types/pengingat.types';
import { otonanCandidates } from '../utils/pengingatSources';
import { PengingatAddDialog } from './PengingatAddDialog';
import { PENGINGAT_INPUT, PengingatField, PengingatSearchButton, PengingatSelect, PengingatSourceFeedback } from './PengingatFormControls';
import { PengingatPawukonFields } from './PengingatPawukonFields';
import { EMPTY_PAWUKON } from '../data/pengingatData';
import { PengingatResultPicker } from './PengingatResultPicker';

export function PengingatOtonanForm(props: PengingatAddProps) {
  const { today } = props;
  const scope = useAuthStore(authQueryScope);
  const [mode, setMode] = useState<OtonanSearchType>('tanggal_lahir');
  const [birthDate, setBirthDate] = useState('');
  const [beforeSix, setBeforeSix] = useState(false);
  const [year, setYear] = useState(today.slice(0, 4));
  const [pawukon, setPawukon] = useState(EMPTY_PAWUKON);
  const [submitted, setSubmitted] = useState<OtonanSearchParams | null>(null);
  const [selectedKey, setSelectedKey] = useState('');
  const invalidate = () => { setSubmitted(null); setSelectedKey(''); };
  const query = useReadQuery({ queryKey: ['pengingat-source', scope, 'otonan', submitted], queryFn: () => searchOtonan(submitted!), enabled: Boolean(submitted), meta: { authScoped: true }, gcTime: 0, staleTime: 30 * 60 * 1000 });
  const candidates = submitted && query.data && !query.isLoading && !query.isError ? otonanCandidates(submitted, query.data, today) : [];
  const selected = candidates.find(item => item.key === selectedKey) ?? candidates[0] ?? null;

  return <PengingatAddDialog {...props} title="Tambah pengingat Otonan" description="Hitung jadwal dari tanggal lahir atau wewaran, lalu pilih otonan yang ingin diingatkan." nameLabel="Nama anggota keluarga / catatan otonan" namePlaceholder="Contoh: Otonan Ibu" requireName candidate={selected}>
    <form className="space-y-4" onSubmit={event => {
      event.preventDefault();
      setSelectedKey('');
      setSubmitted(mode === 'tanggal_lahir' ? { tipe_pencarian: mode, tanggal_lahir: birthDate, sebelum_jam_6: beforeSix, tahun_target: Number(year) }
        : { tipe_pencarian: mode, saptawara_id: pawukon.saptawaraId, pancawara_id: pawukon.pancawaraId, wuku_id: pawukon.wukuId, tahun_target: Number(year) });
    }}>
      <PengingatField label="Dasar perhitungan otonan"><PengingatSelect value={mode} onChange={value => { setMode(value as OtonanSearchType); invalidate(); }}><option value="tanggal_lahir">Tanggal lahir</option><option value="elemen_kalender">Wewaran manual</option></PengingatSelect></PengingatField>
      {mode === 'tanggal_lahir' ? <>
        <PengingatField label="Tanggal lahir"><input required type="date" min="1800-01-01" max={today} value={birthDate} onChange={event => { setBirthDate(event.target.value); invalidate(); }} className={PENGINGAT_INPUT} /></PengingatField>
        <label className="min-h-11 flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300 cursor-pointer"><input type="checkbox" checked={beforeSix} onChange={event => { setBeforeSix(event.target.checked); invalidate(); }} className="w-4 h-4 accent-teal-600" /><span>Lahir sebelum <span className="tabular-nums">06.00 WITA</span></span></label>
      </> : <PengingatPawukonFields value={pawukon} onChange={value => { setPawukon(value); invalidate(); }} />}
      <PengingatField label="Tahun pencarian"><input type="number" required min="1800" max="2200" value={year} onChange={event => { setYear(event.target.value); invalidate(); }} className={PENGINGAT_INPUT} /></PengingatField>
      <PengingatSearchButton loading={Boolean(submitted && query.isLoading)}>Hitung jadwal Otonan</PengingatSearchButton>
    </form>
    <PengingatSourceFeedback loading={Boolean(submitted && query.isLoading)} error={submitted && query.isError ? query.error : null} empty={Boolean(submitted && query.isSuccess && !query.isLoading && !candidates.length)} onRetry={() => void query.refetch()} />
    <PengingatResultPicker candidates={candidates} selected={selected} today={today} onSelect={setSelectedKey} />
  </PengingatAddDialog>;
}
