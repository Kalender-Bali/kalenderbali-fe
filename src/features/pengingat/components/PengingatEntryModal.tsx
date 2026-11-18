import type { PengingatAddProps, PengingatKind } from '../types/pengingat.types';
import { PengingatOtonanForm } from './PengingatOtonanForm';
import { PengingatPiodalanForm } from './PengingatPiodalanForm';
import { PengingatHariRayaForm } from './PengingatHariRayaForm';
import { PengingatDewasaForm } from './PengingatDewasaForm';

/** Jenis formulir ditentukan oleh kartu asal dan tidak dapat diganti di dialog. */
export function PengingatEntryModal({ kind, ...props }: PengingatAddProps & { kind: PengingatKind }) {
  switch (kind) {
    case 'otonan': return <PengingatOtonanForm {...props} />;
    case 'piodalan': return <PengingatPiodalanForm {...props} />;
    case 'hari-raya': return <PengingatHariRayaForm {...props} />;
    case 'mengatur-dewasa': return <PengingatDewasaForm {...props} />;
  }
}
