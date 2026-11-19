import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

// Render modal asli di SSR dengan portal pengganti karena Node tidak memiliki DOM.
const server = await createServer({
  configFile: false,
  cacheDir: `/tmp/hari-raya-share-test-${process.pid}`,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  optimizeDeps: { noDiscovery: true, include: [] },
  ssr: { noExternal: ['react-dom'] },
  plugins: [{
    name: 'hari-raya-test-portal', enforce: 'pre',
    resolveId(source) { if (source === 'react-dom') return '\0hari-raya-test-portal'; },
    load(id) { if (id === '\0hari-raya-test-portal') return 'export const createPortal = (node) => node;'; },
  }],
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});
const previousDocument = globalThis.document;
globalThis.document = { body: {} };
after(async () => {
  await server.close();
  if (previousDocument === undefined) delete globalThis.document;
  else globalThis.document = previousDocument;
});

const { extractHariRayaCards } = await server.ssrLoadModule('/src/features/hari-raya/utils/hariRayaUtils.ts');
const { buildHariRayaShareCard } = await server.ssrLoadModule('/src/features/hari-raya/utils/hariRayaShareCard.ts');
const { formatCardText } = await server.ssrLoadModule('/src/features/share-card/utils/shareCardDraft.ts');
const { HariRayaDetailModal } = await server.ssrLoadModule('/src/features/hari-raya/components/HariRayaDetailModal.tsx');

const budaCemeng = { id: '1', nama: 'Buda Cemeng Ukir', jenis: 'rerainan' };
const bhatara = { id: '2', nama: 'Hari Bhatara Rambut Sedana', jenis: 'hari_raya' };
const master = { ...budaCemeng, keterangan: 'Keterangan resmi perayaan.\nParagraf kedua.' };
const november = {
  tanggal: '2026-11-18',
  hari_raya: [budaCemeng, bhatara],
  wewaran: { saptawara: { nama: 'buda' }, triwara: { nama: 'kajeng' }, pancawara: { nama: 'wage' }, wuku: { nama: 'ukir' } },
  sasih: { nama_sasih: 'kaenam', tahun_saka: 1948 },
};
const june = {
  ...november,
  tanggal: '2027-06-16',
  hari_raya: [budaCemeng],
  wewaran: { ...november.wewaran, triwara: { nama: 'pasah' } },
  sasih: { nama_sasih: 'sadha', tahun_saka: 1949 },
};

test('perayaan pada hari yang sama dan perayaan berulang mempertahankan identitas dan tanggalnya', () => {
  const cards = extractHariRayaCards([november, june], new Map([[master.id, master]]));
  assert.deepEqual(cards.map(({ id }) => id), ['2026-11-18-1', '2026-11-18-2', '2027-06-16-1']);
  const [first, sameDate, later] = cards.map((card) => buildHariRayaShareCard(card));
  assert.equal(first.content.context, 'Buda Cemeng Ukir');
  assert.equal(sameDate.content.context, 'Hari Bhatara Rambut Sedana');
  assert.equal(sameDate.content.result, first.content.result);
  assert.notEqual(sameDate.fileName, first.fileName);
  assert.equal(later.fileName, 'buda-cemeng-ukir-2027-06-16.png');
  assert.equal(later.content.result, 'Rabu, 16 Juni 2027');
  assert.deepEqual(later.content.facts, ['Wewaran: Buda, Pasah, Wage, Ukir', 'Sasih: Sadha', 'Tahun Saka: 1949']);
});

test('kartu mengambil urutan Wewaran dan keterangan resmi dari payload Kalender serta katalog', () => {
  const [card] = extractHariRayaCards([november], new Map([[master.id, master]]));
  const { content, initialStyle, fileName } = buildHariRayaShareCard(card);
  assert.equal(content.title, 'Hari Raya');
  assert.equal(content.result, 'Rabu, 18 November 2026');
  assert.equal(fileName, 'buda-cemeng-ukir-2026-11-18.png');
  assert.deepEqual(content.facts, ['Wewaran: Buda, Kajeng, Wage, Ukir', 'Sasih: Kaenam', 'Tahun Saka: 1948']);
  assert.deepEqual(content.textDetails, ['Jenis: rerainan', `Keterangan: ${master.keterangan}`]);
  const text = formatCardText({ content, style: initialStyle, message: 'Rahajeng', sender: 'Made' });
  assert.ok(text.includes(master.keterangan));
  assert.match(text, /Rahajeng\n\nDari: Made\n\nKalender Bali Lengkap$/);
});

test('kartu melewati rincian kosong dan hanya memakai keterangan cadangan yang resmi', () => {
  const [card] = extractHariRayaCards([{
    ...november, wewaran: { triwara: { nama: '-' }, pancawara: { nama: 'wage' } }, sasih: { tahun_saka: 0 },
  }]);
  assert.deepEqual(buildHariRayaShareCard(card).content.facts, ['Wewaran: Wage']);
  assert.deepEqual(buildHariRayaShareCard(card).content.textDetails, ['Jenis: rerainan']);
  assert.deepEqual(buildHariRayaShareCard(card, master).content.textDetails,
    ['Jenis: rerainan', `Keterangan: ${master.keterangan}`]);
});

test('modal detail menampilkan tombol berbagi untuk perayaan bertanggal sah', () => {
  const [card] = extractHariRayaCards([november]);
  const render = (cardItem) => renderToStaticMarkup(React.createElement(HariRayaDetailModal, {
    isOpen: true, onClose() {}, cardItem,
  }));
  const detail = render(card);
  assert.match(detail, /aria-haspopup="dialog"[^>]*>.*Bagikan Kartu/);
  assert.match(detail, /Unduh pengingat kalender/);
  assert.doesNotMatch(detail, /Bagikan Hari Raya/);
  assert.doesNotMatch(render({ ...card, tanggal: '2026-02-30' }), /Bagikan Kartu/);
});
