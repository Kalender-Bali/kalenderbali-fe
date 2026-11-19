import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ configFile: false, resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { middlewareMode: true, ws: false }, appType: 'custom' });
after(() => server.close());
const { buildWarigaPersonalShareCard } = await server.ssrLoadModule('/src/features/wariga-personal/utils/warigaPersonalShareCard.ts');
const { formatCardText } = await server.ssrLoadModule('/src/features/share-card/utils/shareCardDraft.ts');

// Respons contoh mencakup keempat kategori, termasuk sisa nol pada Pati.
for (const [wariga, status, modulo, angka] of [['Guru', 'baik', 1, 1], ['Ratu', 'baik', 2, 2], ['Lara', 'buruk', 3, 3], ['Pati', 'buruk', 0, 4]]) {
  test(`kartu ${wariga} memakai nilai dan keterangan hasil tanggal`, () => {
    const item = { tanggal: '2026-11-01', wariga, status_hari: status, modulo, angka_perwakilan: angka,
      total_urip_hari: 14, total_urip_kumulatif: 25, keterangan: 'Keterangan dari Go' };
    const { content, initialStyle, fileName } = buildWarigaPersonalShareCard(item, 11);
    assert.equal(content.context, 'Minggu, 1 November 2026');
    assert.equal(content.result, `${wariga} · ${status === 'baik' ? 'Baik' : 'Buruk'}`);
    assert.deepEqual(content.facts, ['Urip kelahiran: 11', 'Urip tanggal: 14']);
    assert.equal(fileName, 'wariga-personal-2026-11-01.png');
    const text = formatCardText({ content, style: initialStyle, message: 'Rahajeng', sender: 'Made' });
    assert.ok(text.includes(`25 % 4 = ${modulo}`));
    assert.equal(text.includes('Angka perwakilan: 4'), wariga === 'Pati');
    assert.ok(text.includes('Keterangan dari Go'));
    assert.doesNotMatch(text, /tanggal lahir|2000-01-01/i);
  });
}
