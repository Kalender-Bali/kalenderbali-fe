import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ configFile: false, resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { middlewareMode: true, ws: false }, appType: 'custom' });
after(() => server.close());
const { ramalanSifatOptions, buildRamalanSifatShareCard } = await server.ssrLoadModule('/src/features/ramalan-sifat/utils/ramalanSifatShareCard.ts');
const { formatCardText } = await server.ssrLoadModule('/src/features/share-card/utils/shareCardDraft.ts');

// Data contoh ini hanya digunakan untuk menguji respons pilar dari Go.
const karakter = {
  saptawara: { nama: 'Buda', penjelasan: 'Uraian lengkap Saptawara' },
  pancawara: { nama: 'Wage', penjelasan: 'Uraian Pancawara' },
  wuku: { nama: 'Ukir', penjelasan: 'Uraian Wuku' },
  zodiak: { nama: 'Aries', penjelasan: 'Uraian Zodiak' },
};

test('pilihan mengikuti urutan Flutter dan mengabaikan uraian yang tidak tersedia', () => {
  assert.deepEqual(ramalanSifatOptions(karakter).map((item) => item.key), ['saptawara', 'pancawara', 'wuku', 'zodiak']);
  const incomplete = { ...karakter, saptawara: { ...karakter.saptawara, penjelasan: ' - ' },
    pancawara: { ...karakter.pancawara, penjelasan: '' } };
  assert.deepEqual(ramalanSifatOptions(incomplete).map((item) => item.key), ['wuku', 'zodiak']);
  assert.equal(ramalanSifatOptions(Object.fromEntries(Object.keys(karakter).map((key) => [key, { nama: '', penjelasan: '-' }]))).length, 0);
});

test('konten dan teks ekspor mengikuti pilar pilihan tanpa data tanggal lahir', () => {
  const options = ramalanSifatOptions(karakter);
  const content = buildRamalanSifatShareCard(options[0]);
  assert.equal(content.result, karakter.saptawara.penjelasan);
  assert.deepEqual(content.facts, ['Saptawara: Buda']);
  assert.equal(buildRamalanSifatShareCard(options[1]).result, karakter.pancawara.penjelasan);
  const text = formatCardText({ content, style: {}, message: 'Salam', sender: '' });
  assert.match(text, /Uraian lengkap Saptawara/);
  assert.doesNotMatch(text, /tanggal lahir|birth_date|before_06/i);
});
