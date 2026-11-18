import { useState } from 'react';
import { useReadQuery } from '@/lib/useReadQuery';
import { authQueryScope, useAuthStore } from '@/stores/useAuthStore';
import { fetchMasterHariRaya, searchHariRayaSpesifik } from '@/features/hari-raya/api/hariRayaApi';
import { fetchPuraList, searchPiodalan } from '@/features/piodalan/api/piodalanApi';
import type { PiodalanSearchParams, PuraBackendItem } from '@/features/piodalan/types/piodalan.types';
import { searchOtonan } from '@/features/otonan/api/otonanApi';
import type { OtonanSearchParams } from '@/features/otonan/types/otonan.types';
import { fetchKalenderTahun } from '@/features/kalender/api/kalenderApi';
import { normalizeCalendarString } from '@/features/kalender/utils/calendarUtils';
import type { PengingatAddProps, PengingatCondition } from '../types/pengingat.types';
import { hariRayaCandidates, piodalanCandidates, privateCalendarCandidates } from '../utils/pengingatSources';
import { PengingatAddDialog } from './PengingatAddDialog';
import { PENGINGAT_INPUT, PengingatField, PengingatSearchButton, PengingatSelect, PengingatSourceFeedback } from './PengingatFormControls';
import { PengingatPawukonFields } from './PengingatPawukonFields';
import { EMPTY_PAWUKON } from '../data/pengingatData';
import { PengingatResultPicker } from './PengingatResultPicker';

type CalendarLookup =
  | { mode: 'hari-raya'; request: { nama: string; year: number } }
  | { mode: 'pura'; request: PiodalanSearchParams; pura: PuraBackendItem }
  | { mode: 'pawukon'; request: OtonanSearchParams }
  | { mode: 'sasih'; year: number; condition: Extract<PengingatCondition, { basis: 'sasih' }> };

export function PengingatCalendarForm({ kind, ...props }: PengingatAddProps & { kind: 'piodalan' | 'hari-raya' }) {
  const featureName = kind === 'piodalan' ? 'Piodalan' : 'Hari Raya';
  const { today } = props;
  const scope = useAuthStore(authQueryScope);
  const [origin, setOrigin] = useState<'fitur' | 'pribadi'>('fitur');
  const [holidayId, setHolidayId] = useState('');
  const [puraId, setPuraId] = useState('');
  const [puraSearch, setPuraSearch] = useState('');
  const [basis, setBasis] = useState<'pawukon' | 'sasih' | 'tanggal'>('pawukon');
  const [pawukon, setPawukon] = useState(EMPTY_PAWUKON);
  const [sasihId, setSasihId] = useState('');
  const [phase, setPhase] = useState<'Purnama' | 'Tilem'>('Purnama');
  const [date, setDate] = useState('');
  const [year, setYear] = useState(today.slice(0, 4));
  const [submitted, setSubmitted] = useState<CalendarLookup | null>(null);
  const [selectedKey, setSelectedKey] = useState('');
  const puras = useReadQuery({ queryKey: ['piodalan', 'puras', 'all'], queryFn: () => fetchPuraList(), enabled: kind === 'piodalan' && origin === 'fitur', staleTime: 24 * 60 * 60 * 1000 });
  const holidays = useReadQuery({ queryKey: ['hari-raya', 'master'], queryFn: fetchMasterHariRaya, enabled: kind === 'hari-raya' && origin === 'fitur', staleTime: Infinity });
  const validYear = /^\d{4}$/.test(year) && Number(year) >= 1800 && Number(year) <= 2200;
  const sasih = useReadQuery({ queryKey: ['pengingat', 'sasih-calendar', Number(year)], queryFn: () => fetchKalenderTahun(Number(year)), enabled: origin === 'pribadi' && basis === 'sasih' && validYear, staleTime: 30 * 60 * 1000 });
  const sasihOptions = [...new Set((sasih.data ?? []).map(day => day.sasih.nama_sasih))].map(name => ({ id: name, name }));
  const invalidate = () => { setSubmitted(null); setSelectedKey(''); };
  const query = useReadQuery({
    queryKey: ['pengingat-source', scope, kind, submitted], enabled: Boolean(submitted), meta: { authScoped: true }, gcTime: 0, staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!submitted) return [];
      if (submitted.mode === 'hari-raya') return hariRayaCandidates(submitted.request, await searchHariRayaSpesifik(submitted.request.nama, submitted.request.year), today);
      if (submitted.mode === 'pura') {
        const response = await searchPiodalan(submitted.request);
        return response ? piodalanCandidates(submitted.request, response, submitted.pura, today) : [];
      }
      if (submitted.mode === 'pawukon') {
        const response = await searchOtonan(submitted.request);
        return privateCalendarCandidates(kind, { basis: 'pawukon', ...response.input_dinormalisasi.elemen }, response.hasil.map(item => item.tanggal), today);
      }
      const calendar = await fetchKalenderTahun(submitted.year);
      const { condition } = submitted;
      const dates = calendar.filter(day => normalizeCalendarString(day.sasih.nama_sasih) === normalizeCalendarString(condition.sasih) && day.pengalantaka.purnama_tilem === condition.phase).map(day => day.tanggal);
      return privateCalendarCandidates(kind, condition, dates, today);
    },
  });
  const isDated = origin === 'pribadi' && basis === 'tanggal';
  const candidates = isDated && date && date >= today && date <= '2200-12-31' ? privateCalendarCandidates(kind, { basis: 'tanggal', date }, [date], today)
    : submitted && query.data && !query.isLoading && !query.isError ? query.data.filter(item => item.nextDate >= today) : [];
  const selected = candidates.find(item => item.key === selectedKey) ?? candidates[0] ?? null;
  const availablePuras = puras.data?.filter(pura => String(pura.id) === puraId || `${pura.name} ${pura.city ?? ''}`.toLocaleLowerCase('id').includes(puraSearch.trim().toLocaleLowerCase('id')));

  return <PengingatAddDialog {...props} title={`Tambah pengingat ${featureName}`} description="Pilih data yang tersedia atau susun kriteria khusus keluarga."
    showName={origin === 'pribadi'} nameLabel="Sebutan pribadi" namePlaceholder={kind === 'piodalan' ? 'Contoh: Merajan Keluarga' : 'Contoh: Rahina Keluarga'} requireName={origin === 'pribadi'} candidate={selected}
    beforeName={<div role="group" aria-label="Sumber pengingat" className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex gap-1">{([['fitur', 'Dari Katalog'], ['pribadi', 'Kriteria Sendiri']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={origin === value} onClick={() => { setOrigin(value); invalidate(); }} className={`flex-1 min-h-11 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${origin === value ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-200 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>{label}</button>)}</div>}>
    <form className="space-y-4" onSubmit={event => {
      event.preventDefault(); setSelectedKey('');
      if (origin === 'fitur' && kind === 'hari-raya') {
        const holiday = holidays.data?.find(item => String(item.id) === holidayId);
        if (holiday && !holidays.isLoading && !holidays.isError) setSubmitted({ mode: 'hari-raya', request: { nama: holiday.nama, year: Number(year) } });
      } else if (origin === 'fitur') {
        const pura = puras.data?.find(item => String(item.id) === puraId);
        if (pura && !puras.isLoading && !puras.isError) setSubmitted({ mode: 'pura', request: { mode: 'pura', pura_id: puraId, tahun: Number(year) }, pura });
      } else if (basis === 'pawukon') {
        setSubmitted({ mode: 'pawukon', request: { tipe_pencarian: 'elemen_kalender', tahun_target: Number(year), saptawara_id: pawukon.saptawaraId, pancawara_id: pawukon.pancawaraId, wuku_id: pawukon.wukuId } });
      } else if (basis === 'sasih') {
        const value = sasihOptions.find(item => item.id === sasihId);
        if (value && !sasih.isLoading && !sasih.isError) setSubmitted({ mode: 'sasih', year: Number(year), condition: { basis: 'sasih', sasih: value.name, phase } });
      }
    }}>
      {origin === 'fitur' && kind === 'hari-raya' ? <>
        <PengingatField label="Hari raya / rahina"><PengingatSelect disabled={holidays.isLoading || holidays.isError} value={holidayId} onChange={value => { setHolidayId(value); invalidate(); }}><option value="">Pilih hari raya / rahina</option>{holidays.data?.map(item => <option key={item.id} value={String(item.id)}>{item.nama}</option>)}</PengingatSelect></PengingatField>
        <PengingatSourceFeedback loading={holidays.isLoading} error={holidays.isError ? holidays.error : null} onRetry={() => void holidays.refetch()} />
      </> : origin === 'fitur' ? <>
        <PengingatField label="Cari pura atau wilayah"><input type="search" value={puraSearch} onChange={event => setPuraSearch(event.target.value)} placeholder="Ketik nama pura atau wilayah…" className={PENGINGAT_INPUT} /></PengingatField>
        <PengingatField label="Pura"><PengingatSelect disabled={puras.isLoading || puras.isError} value={puraId} onChange={value => { setPuraId(value); invalidate(); }}><option value="">{puras.isLoading ? 'Memuat data pura…' : 'Pilih pura'}</option>{availablePuras?.map(pura => <option key={pura.id} value={String(pura.id)}>{pura.name}{pura.city ? ` · ${pura.city}` : ''}</option>)}</PengingatSelect></PengingatField>
        <PengingatSourceFeedback loading={puras.isLoading} error={puras.isError ? puras.error : null} onRetry={() => void puras.refetch()} />
      </> : <>
        <PengingatField label="Patokan kalender"><PengingatSelect value={basis} onChange={value => { setBasis(value as typeof basis); invalidate(); }}><option value="pawukon">Pawukon: Saptawara, Pancawara, Wuku</option><option value="sasih">Sasih dan Purnama / Tilem</option><option value="tanggal">Tanggal pelaksanaan yang sudah ditentukan</option></PengingatSelect></PengingatField>
        {basis === 'pawukon' && <PengingatPawukonFields value={pawukon} onChange={value => { setPawukon(value); invalidate(); }} />}
        {basis === 'sasih' && <>
          <div className="grid sm:grid-cols-2 gap-3"><PengingatField label="Sasih"><PengingatSelect disabled={sasih.isLoading || sasih.isError} value={sasihId} onChange={value => { setSasihId(value); invalidate(); }}><option value="">Pilih Sasih</option>{sasihOptions.map(item => <option key={item.id} value={String(item.id)}>{item.name}</option>)}</PengingatSelect></PengingatField><PengingatField label="Purnama / Tilem"><PengingatSelect value={phase} onChange={value => { setPhase(value as typeof phase); invalidate(); }}><option>Purnama</option><option>Tilem</option></PengingatSelect></PengingatField></div>
          <PengingatSourceFeedback loading={sasih.isLoading} error={sasih.isError ? sasih.error : null} onRetry={() => void sasih.refetch()} />
        </>}
        {basis === 'tanggal' && <PengingatField label="Tanggal pelaksanaan"><input required type="date" min={today} max="2200-12-31" value={date} onChange={event => { setDate(event.target.value); invalidate(); }} className={PENGINGAT_INPUT} /></PengingatField>}
      </>}
      {!isDated && <><PengingatField label="Tahun pencarian"><input required type="number" min="1800" max="2200" value={year} onChange={event => { setYear(event.target.value); setSasihId(''); invalidate(); }} className={PENGINGAT_INPUT} /></PengingatField><PengingatSearchButton loading={Boolean(submitted && query.isLoading)}>Cari jadwal {featureName}</PengingatSearchButton></>}
    </form>
    {!isDated && <PengingatSourceFeedback loading={Boolean(submitted && query.isLoading)} error={submitted && query.isError ? query.error : null} empty={Boolean(submitted && query.isSuccess && !query.isLoading && !candidates.length)} onRetry={() => void query.refetch()} />}
    <PengingatResultPicker candidates={candidates} selected={selected} today={today} onSelect={setSelectedKey} />
    {origin === 'pribadi' && <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Kriteria sendiri hanya menjadi pengingat pribadi dan tidak menambahkan atau mengubah data katalog publik.</p>}
  </PengingatAddDialog>;
}
