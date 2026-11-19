import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ configFile: false, resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { middlewareMode: true, ws: false }, appType: 'custom' });
after(() => server.close());
const { buildGarisHidupShareCard, currentPeriodIndex } = await server.ssrLoadModule('/src/features/garis-hidup/utils/garisHidupShareCard.ts');
const { formatCardText } = await server.ssrLoadModule('/src/features/share-card/utils/shareCardDraft.ts');

// Contoh respons hanya dipakai dalam pengujian, bukan dalam kartu produksi.
const periods = [
  { min_umur: 0, max_umur: 6, nilai: 3, keterangan: 'penghasilan sedang' },
  { min_umur: 103, max_umur: 108, nilai: 7, keterangan: 'baik sekali' },
];
const profile = { nama: 'Anda', tanggal_lahir: '1900-01-01', saptawara: 'Buda', pancawara: 'Wage', urip: 11,
  seluruh_periode: periods, periode_saat_ini: periods[1], melewati_batas_tabel: true };

test('memilih periode aktif berdasarkan batas yang dikirim Go', () => {
  assert.equal(currentPeriodIndex(profile), 1);
  assert.equal(currentPeriodIndex({ ...profile, periode_saat_ini: periods[0] }), 0);
});

test('isi dan teks kartu mengikuti profil dan periode pilihan tanpa tanggal lahir', () => {
  const content = buildGarisHidupShareCard(profile, periods[0]);
  assert.equal(content.result, 'Penghasilan sedang');
  assert.deepEqual(content.facts, ['Rentang umur: 0–6 tahun', 'Wewaran kelahiran: Buda Wage', 'Total urip: 11']);
  assert.equal(buildGarisHidupShareCard(profile, periods[1]).result, 'Baik sekali');
  const text = formatCardText({ content, style: {}, message: '', sender: '' });
  assert.doesNotMatch(text, /1900-01-01|tanggal lahir|\?p1_/i);
  assert.equal(buildGarisHidupShareCard({ ...profile, nama: 'Profil lain', urip: 15 }, periods[1]).context, 'Profil lain');
});
