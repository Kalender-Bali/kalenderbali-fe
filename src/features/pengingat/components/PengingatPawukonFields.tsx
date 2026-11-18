import { useMasterWewaranOptions } from '@/features/otonan/hooks/useOtonan';
import { buildPawukonDays, getFilteredOptions } from '@/features/otonan/utils/pawukonFilter';
import { PengingatField, PengingatSelect, PengingatSourceFeedback } from './PengingatFormControls';
import { EMPTY_PAWUKON } from '../data/pengingatData';

export interface PengingatPawukonValue { saptawaraId: string; pancawaraId: string; wukuId: string }

export function PengingatPawukonFields({ value, onChange }: { value: PengingatPawukonValue; onChange: (value: PengingatPawukonValue) => void }) {
  const master = useMasterWewaranOptions();
  const { saptawaraList, pancawaraList, wukuList } = master;
  const available = getFilteredOptions({ ...value, saptawaraList, pancawaraList, wukuList, pawukonDays: buildPawukonDays(saptawaraList, pancawaraList, wukuList) });
  return <div className="space-y-2">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {([
        ['saptawaraId', 'Saptawara', available.availableSaptawaras],
        ['pancawaraId', 'Pancawara', available.availablePancawaras],
        ['wukuId', 'Wuku', available.availableWukus],
      ] as const).map(([field, label, options]) => <PengingatField key={field} label={label}><PengingatSelect disabled={master.isLoading || master.isError} value={value[field]} onChange={id => onChange({ ...value, [field]: id })}><option value="">Pilih {label.toLowerCase()}</option>{options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</PengingatSelect></PengingatField>)}
    </div>
    <button type="button" onClick={() => onChange(EMPTY_PAWUKON)} className="min-h-11 text-xs font-semibold text-teal-700 dark:text-teal-300 cursor-pointer">Atur ulang wewaran</button>
    <PengingatSourceFeedback loading={master.isLoading} error={master.isError ? master.error : null} onRetry={() => void master.refetch()} />
  </div>;
}
