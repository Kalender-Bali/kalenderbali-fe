import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ configFile: false, resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { middlewareMode: true, ws: false }, appType: 'custom' });
after(() => server.close());
const { buildAlaAyuningShareCard } = await server.ssrLoadModule('/src/features/ala-ayuning-dewasa/utils/alaAyuningShareCard.ts');

const item = { id: '1', nama: 'Agni Agung Doyan Basmi', keterangan: 'Keterangan dari Go' };
const tanggal = '2026-03-17';
const pawukon = { tanggal, saptawara: 'Anggara', pancawara: 'Pon', wuku: 'Klawu', sasih: 'Kasanga', pengalantaka: 'Pangelong', penanggal1: 14, penanggal2: 15 };
const reason = id => ({ calendar_value_id: id });

// Verifikasi tanggal, identitas unsur, dan prioritas pantangan dalam data Go.
test('kartu memakai penanggalan tanggal pilihan dan mempertahankan dua angka lunar', () => {
  const card = buildAlaAyuningShareCard(item, tanggal, pawukon, []);
  assert.equal(card.content.context, 'Selasa, 17 Maret 2026');
  assert.deepEqual(card.content.facts, ['Anggara Pon · Wuku Klawu', 'Pangelong 14 / 15 · Sasih Kasanga']);
  assert.equal(card.fileName, 'agni-agung-doyan-basmi-2026-03-17.png');
  assert.deepEqual(buildAlaAyuningShareCard(item, '2026-03-18', pawukon, []).content.facts, []);
});

test('kegiatan cocok dengan ID unsur dan anjuran dikecualikan jika tanggal memiliki pantangan', () => {
  const guidance = [
    { activity_name: 'Membangun rumah', status: 'conflict', matched_recommended: [reason('1')], matched_avoid: [reason('2')] },
    { activity_name: 'Membuat gerabah', status: 'eligible', matched_recommended: [reason('1')], matched_avoid: [] },
    { activity_name: 'Pindah rumah', status: 'conflict', matched_recommended: [], matched_avoid: [reason('1')] },
  ];
  const result = buildAlaAyuningShareCard(item, tanggal, pawukon, guidance).content.textDetails;
  assert.deepEqual(result, ['Keterangan: Keterangan dari Go', 'Dianjurkan: Membuat gerabah', 'Dihindari: Pindah rumah']);
  const other = buildAlaAyuningShareCard({ ...item, id: '2' }, tanggal, pawukon, guidance).content.textDetails;
  assert.ok(other.includes('Dihindari: Membangun rumah'));
});
