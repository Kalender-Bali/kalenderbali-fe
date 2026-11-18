import type { PengingatAddProps } from '../types/pengingat.types';
import { PengingatCalendarForm } from './PengingatCalendarForm';

export function PengingatPiodalanForm(props: PengingatAddProps) {
  return <PengingatCalendarForm {...props} kind="piodalan" />;
}
