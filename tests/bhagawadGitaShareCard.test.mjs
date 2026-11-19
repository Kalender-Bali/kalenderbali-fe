import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  cacheDir: `/tmp/bhagawadgita-share-test-${process.pid}`,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});
after(() => server.close());

const { VerseCard } = await server.ssrLoadModule('/src/features/bhagawad-gita/components/VerseCard.tsx');
const { buildBhagawadGitaShareCard, bhagawadGitaShareStyle } = await server.ssrLoadModule('/src/features/bhagawad-gita/utils/bhagawadGitaShareCard.ts');
const { formatCardText } = await server.ssrLoadModule('/src/features/share-card/utils/shareCardDraft.ts');

const verse = {
  chapter_number: 1, verse_number: 1, sloka: 'dharmakṣetre kurukṣetre',
  translation: 'Di dataran nan suci ini.\nTanah kebenaran, tanahnya para Kuru.',
  narrative: 'Pembahasan dari respons Go.', topic_id: 'fixture',
};

function toText(content) {
  return formatCardText({ content, style: bhagawadGitaShareStyle, message: '  Renungan hari ini  ', sender: '  Wayan  ' });
}

test('bab dan nomor sloka membedakan pemicu, sumber, teks, dan nama berkas', () => {
  for (const chapter of [1, 2]) {
    const selected = { ...verse, chapter_number: chapter, translation: `Terjemahan bab ${chapter}` };
    const html = renderToStaticMarkup(React.createElement(VerseCard, { verse: selected, showChapterNumber: true }));
    const { content, fileName } = buildBhagawadGitaShareCard(selected);
    assert.match(html, new RegExp(`Bagikan Kartu Bhagawadgita Bab ${chapter}, Sloka 1`));
    assert.match(html, /Salin teks sloka/);
    assert.equal(content.source, `Bhagawadgita · Bab ${chapter}, Sloka 1`);
    assert.equal(content.result, selected.translation);
    assert.equal(fileName, `bhagawadgita-bab-${chapter}-sloka-1.png`);
    assert.ok(toText(content).includes(content.source));
  }
});

test('teks berbagi menjaga terjemahan panjang, paragraf, dan diakritik', () => {
  const translation = `  ${verse.translation.repeat(30)}  `;
  const { content } = buildBhagawadGitaShareCard({ ...verse, translation });
  assert.equal(content.result, translation.trim());
  assert.deepEqual(content.facts, []);
  const text = toText(content);
  assert.ok(text.includes(translation.trim()));
  assert.ok(text.includes('Sloka: dharmakṣetre kurukṣetre'));
  assert.ok(text.includes('Pembahasan: Pembahasan dari respons Go.'));
  assert.ok(text.includes('Renungan hari ini\n\nDari: Wayan\n\nKalender Bali Lengkap'));
});

test('pembahasan kosong dihilangkan dan kartu tanpa terjemahan tetap bisa disalin', () => {
  const { content } = buildBhagawadGitaShareCard({ ...verse, narrative: '  ' });
  assert.deepEqual(content.textDetails, ['Sloka: dharmakṣetre kurukṣetre']);
  assert.doesNotMatch(toText(content), /Pembahasan:/);

  const html = renderToStaticMarkup(React.createElement(VerseCard, { verse: { ...verse, translation: ' ' } }));
  assert.doesNotMatch(html, /Bagikan Kartu/);
  assert.match(html, /Salin teks sloka/);
});
