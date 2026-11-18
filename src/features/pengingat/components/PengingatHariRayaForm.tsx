import type { PengingatAddProps } from '../types/pengingat.types';
import { PengingatCalendarForm } from './PengingatCalendarForm';

export function PengingatHariRayaForm(props: PengingatAddProps) {
  return <PengingatCalendarForm {...props} kind="hari-raya" />;
}
