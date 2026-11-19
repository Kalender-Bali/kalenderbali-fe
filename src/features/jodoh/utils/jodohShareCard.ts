import type { CardStyle, StructuredCardContent } from '@/features/share-card/utils/shareCardDraft';
import type { JodohData, JodohPersonResult } from '../types/jodoh.types';

const heartPath = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z';

export const jodohShareStyle: CardStyle = {
  layout: 'standar',
  topColor: '#ffffff',
  bottomColor: '#fff1f2',
  textColor: '#0f172a',
  background: { kind: 'none' },
};

// Versi teks menambah detail wewaran dari API tanpa menyertakan tanggal lahir.
function formatPersonDetails({ nama, weton, neptu, sadwara, urip_sadwara }: JodohPersonResult) {
  const sadwaraName = sadwara?.trim();
  const sadwaraValue = Number.isInteger(urip_sadwara) ? ` (${urip_sadwara})` : '';
  const details = [
    weton?.trim(),
    Number.isInteger(neptu) ? `Neptu ${neptu}` : '',
    sadwaraName ? `Sadwara ${sadwaraName}${sadwaraValue}` : '',
  ].filter(Boolean);
  return details.length ? `${nama}: ${details.join('; ')}` : '';
}

export function buildJodohShareCard({ diri, pasangan, tripramana }: JodohData): StructuredCardContent {
  const facts: string[] = [];

  // Tampilkan angka dari respons Go tanpa menghitung ulang total atau hasil petenungan.
  if ([diri.neptu, diri.urip_sadwara, pasangan.neptu, pasangan.urip_sadwara].every(Number.isInteger)) {
    facts.push(`Neptu + Sadwara: (${diri.neptu} + ${diri.urip_sadwara}) + (${pasangan.neptu} + ${pasangan.urip_sadwara})`);
  }

  const { siklus, sisa } = tripramana;
  if (Number.isInteger(siklus) && Number.isInteger(sisa) && siklus > 0 && sisa > 0) {
    // Go mengirim angka siklus sebagai kondisi hasil saat sisa matematisnya nol.
    facts.push(sisa === siklus ? `Sisa 0 → kondisi ${siklus}` : `Sisa pembagian ${siklus}: ${sisa}`);
  }

  return {
    kind: 'structured',
    title: tripramana.nama_tenung,
    accent: '#e11d48',
    iconPath: heartPath,
    context: `${diri.nama} & ${pasangan.nama}`,
    result: tripramana.keterangan.trim(),
    facts,
    textDetails: [formatPersonDetails(diri), formatPersonDetails(pasangan)].filter(Boolean),
  };
}
