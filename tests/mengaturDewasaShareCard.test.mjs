import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ configFile: false, resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { middlewareMode: true, ws: false }, appType: 'custom' });
after(() => server.close());
const { buildMengaturDewasaShareCard } = await server.ssrLoadModule('/src/features/mengatur-dewasa/utils/mengaturDewasaShareCard.ts');
const { formatCardText } = await server.ssrLoadModule('/src/features/share-card/utils/shareCardDraft.ts');

// Respons contoh hanya digunakan untuk menguji pemetaan hasil Go.
const result = { tanggal: '2026-11-18', status: 'eligible', eligible: true,
  matched_recommended: [{ name: 'Kriteria A' }], matched_avoid: [],
  calendar: { wewaran: { saptawara: { nama: 'Buda' }, pancawara: { nama: 'Wage' }, wuku: { nama: 'Ukir' }, eka_jala_rsi: { nama: 'Guru' } },
    sasih: { nama_sasih: 'Kaenam' }, pengalantaka: { pengalantaka: 'Penanggal', penanggal_1: 3, penanggal_2: 4 },
    padewasan: [{ nama: 'Padewasan A' }] } };

test('kartu memakai kegiatan, tanggal, wewaran, fase dan alasan dari hasil aktif', () => {
  const card = buildMengaturDewasaShareCard(result, 'Kegiatan A');
  assert.equal(card.content.result, 'Buda Wage Ukir');
  assert.ok(card.content.facts.includes('Sasih & Fase: Penanggal 3 / 4 Sasih Kaenam'));
  assert.ok(card.content.facts.includes('Kegiatan: Kegiatan A'));
  assert.equal(card.fileName, 'mengatur-dewasa-2026-11-18.png');
  const text = formatCardText({ content: card.content, style: card.initialStyle, message: '', sender: '' });
  assert.match(text, /Kriteria A/);
  assert.match(text, /Padewasan A/);
  assert.doesNotMatch(text, /activity_id|tanggal_mulai/);
});

test('hasil tanpa kalender dan alasan tetap dapat dibagikan', () => {
  const card = buildMengaturDewasaShareCard({ ...result, calendar: undefined, matched_recommended: [] }, 'Kriteria Sendiri');
  assert.equal(card.content.result, 'Memenuhi kriteria');
  assert.deepEqual(card.content.facts, ['Kegiatan: Kriteria Sendiri']);
  assert.deepEqual(card.content.textDetails, []);
});
