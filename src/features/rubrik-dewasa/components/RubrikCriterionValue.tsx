import { useId } from 'react';
import { useDewasaCriteriaValues } from '@/features/mengatur-dewasa/hooks/useMengaturDewasaQueries';
import type { DewasaCriteriaField } from '@/features/mengatur-dewasa/types/mengaturDewasa.types';
import { rubrikInput, rubrikLabel } from './rubrikStyles';

interface Props {
  field?: DewasaCriteriaField;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  required?: boolean;
}

export function RubrikCriterionValue({ field, value, onChange, options, required }: Props) {
  const id = useId();
  const catalog = useDewasaCriteriaValues(field?.value_kind === 'reference_value' ? field.field : null);
  const values = options ?? (field?.value_kind === 'reference_value'
    ? catalog.data?.map((item) => item.name) ?? []
    : field?.value_kind === 'enum'
      ? field.allowed_values
      : field?.value_kind === 'integer'
        ? Array.from({ length: field.max - field.min + 1 }, (_, index) => String(field.min + index))
        : []);
  // Opsi tersimpan yang lebih lama tetap bisa dibaca dan diedit.
  const visible = value && !values.includes(value) ? [value, ...values] : values;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className={rubrikLabel}>Nilai</label>
      <select id={id} className={`${rubrikInput} h-11`} value={value}
        required={required} disabled={!field || (catalog.isLoading && !value) || (catalog.isError && !value)}
        onChange={(event) => onChange(event.target.value)}>
        <option value="">{catalog.isLoading ? 'Memuat nilai…' : 'Pilih nilai'}</option>
        {visible.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {catalog.isError && <button type="button" onClick={() => void catalog.refetch()}
        className="mt-1 min-h-11 text-xs font-bold text-rose-700 underline dark:text-rose-300">Muat ulang nilai</button>}
    </div>
  );
}
