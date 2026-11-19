import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});
after(async () => server.close());

const { OtonanResultSection } = await server.ssrLoadModule('/src/features/otonan/components/OtonanResultSection.tsx');
const { downloadOtonanICS } = await server.ssrLoadModule('/src/features/otonan/utils/otonanUtils.ts');
const { buildOtonanShareContent, hasOtonanBirthDetails } = await server.ssrLoadModule('/src/features/otonan/utils/otonanShareCard.ts');
const { formatCardText } = await server.ssrLoadModule('/src/features/share-card/utils/shareCardDraft.ts');

const elements = { saptawara: 'Redite', pancawara: 'Paing', wuku: 'Sinta' };
function renderResults(mode, cycles, dates = ['2023-05-21', '2023-12-17']) {
  return renderToStaticMarkup(React.createElement(OtonanResultSection, {
    data: {
      input_dinormalisasi: { tipe_pencarian: mode, elemen: elements, sebelum_jam_6: false },
      hasil: dates.map((tanggal, i) => ({ tanggal, perayaan_ke: cycles[i], detail_elemen: elements })),
      penjelasan: '',
    },
    onOpenDetailModal: () => {},
    onAddReminder: () => {},
    onShareCard: () => {},
  }));
}

test('mode elemen menampilkan kedua tanggal tanpa mengklaim nomor siklus sejak lahir', () => {
  for (const cycles of [[null, null], [40, 41], [-2, -1]]) {
    const html = renderResults('elemen_kalender', cycles);
    assert.match(html, /21 Mei 2023/);
    assert.match(html, /17 Desember 2023/);
    assert.doesNotMatch(html, /SIKLUS KE|sejak tanggal lahir/);
  }
});

function findButtons(node, label) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap((child) => findButtons(child, label));
  const matches = node.type === 'button' && node.props['aria-label']?.startsWith(label);
  return [...(matches ? [node] : []), ...findButtons(node.props?.children, label)];
}

test('aksi setiap hasil membuka pengingat untuk tanggal yang tepat tanpa mengunduh kalender', () => {
  const dates = ['2099-01-01', '2099-07-30'];
  let selected;
  const element = OtonanResultSection({
    data: { input_dinormalisasi: { tipe_pencarian: 'elemen_kalender', elemen: elements, sebelum_jam_6: false }, hasil: dates.map(tanggal => ({ tanggal, perayaan_ke: null, detail_elemen: elements })), penjelasan: '' },
    onOpenDetailModal() {}, onAddReminder(date) { selected = date; }, onShareCard() {},
  });
  const html = renderToStaticMarkup(element);
  assert.doesNotMatch(html, /Tambahkan ke kalender/);
  assert.equal((html.match(/>Tambah pengingat<\/span>/g) ?? []).length, 2);
  const actions = findButtons(element, 'Tambah pengingat Otonan');
  for (let i = 0; i < dates.length; i++) {
    assert.equal(actions[i].props.disabled, false);
    actions[i].props.onClick();
    assert.equal(selected, dates[i]);
  }
  assert.match(renderResults('tanggal_lahir', [37]), /disabled=""/);
});

test('share card memilih hasil kedua dan tetap tersedia untuk tanggal lampau', () => {
  const input = { tipe_pencarian: 'tanggal_lahir', elemen: elements, sebelum_jam_6: false };
  const results = [
    { tanggal: '2023-05-21', perayaan_ke: 36, detail_elemen: elements },
    { tanggal: '2023-12-17', perayaan_ke: 37, detail_elemen: elements },
  ];
  const trigger = {};
  let selection;
  const element = OtonanResultSection({
    data: { input_dinormalisasi: input, hasil: results, penjelasan: '' },
    onOpenDetailModal() {},
    onAddReminder() {},
    onShareCard(item, button) { selection = { item, button }; },
  });
  const buttons = findButtons(element, 'Bagikan Kartu Otonan');
  assert.equal(buttons.length, 2);
  assert.ok(!buttons[1].props.disabled);
  buttons[1].props.onClick({ currentTarget: trigger });
  assert.deepEqual(selection, { item: results[1], button: trigger });
  const content = buildOtonanShareContent(selection.item, input);
  assert.match(content.context, /17 Desember 2023/);
  assert.match(formatCardText({ content, message: 'Selamat Otonan', sender: 'Wayan' }), /17 Desember 2023[\s\S]*Otonan ke-37[\s\S]*Dari: Wayan/);
  assert.doesNotMatch(content.context, /21 Mei/);
});

test('detail kelahiran dikirim hanya ketika dipilih, dengan patokan resmi dari respons', () => {
  const input = { tipe_pencarian: 'tanggal_lahir', elemen: elements, tanggal_lahir_sipil: '2000-01-01', sebelum_jam_6: true, tanggal_lahir_kalender: '1999-12-31' };
  const item = { tanggal: '2023-12-17', perayaan_ke: 42, detail_elemen: elements };
  assert.equal(hasOtonanBirthDetails(input), true);
  const hidden = buildOtonanShareContent(item, input);
  assert.deepEqual(hidden.facts, ['Perayaan: Otonan ke-42']);
  assert.doesNotMatch(formatCardText({ content: hidden, message: '', sender: '' }), /2000|1999|06\.00/);

  const included = buildOtonanShareContent(item, input, true);
  assert.match(included.facts.join('\n'), /Tanggal lahir: Sabtu, 1 Januari 2000[\s\S]*Sebelum 06\.00 WITA/);
  assert.deepEqual(included.textDetails, ['Patokan kalender: Jumat, 31 Desember 1999']);
  assert.match(formatCardText({ content: included, message: '', sender: '' }), /Patokan kalender: Jumat, 31 Desember 1999/);
});

test('kartu mode elemen menghilangkan siklus, tanggal lahir, dan wewaran yang kosong', () => {
  const input = { tipe_pencarian: 'elemen_kalender', tanggal_lahir_sipil: '2000-01-01', sebelum_jam_6: false };
  const item = { tanggal: '2023-12-17', perayaan_ke: null, detail_elemen: { saptawara: ' ', wuku: 'Sinta' } };
  assert.equal(hasOtonanBirthDetails(input), false);
  assert.equal(buildOtonanShareContent(item, input, true).result, 'Wuku Sinta');
  for (const perayaan_ke of [null, 37]) {
    const content = buildOtonanShareContent({ ...item, perayaan_ke }, input, true);
    assert.deepEqual(content.facts, []);
    assert.doesNotMatch(formatCardText({ content, message: '', sender: '' }), /Otonan ke-|Tanggal lahir|undefined/);
  }
});

test('mode tanggal lahir tetap menampilkan nomor siklus yang diketahui', () => {
  const html = renderResults('tanggal_lahir', [37], ['2023-06-09']);
  assert.match(html, /9 Juni 2023/);
  assert.match(html, /SIKLUS KE/);
  assert.match(html, />37<\/span>/);
  assert.match(html, /sejak tanggal lahir/);
  assert.doesNotMatch(renderResults('tanggal_lahir', [null]), /SIKLUS KE|sejak tanggal lahir/);
});

test('ekspor kalender tidak menulis siklus null, dan mempertahankan siklus tanggal lahir', async (t) => {
  let blob;
  t.mock.method(URL, 'createObjectURL', (value) => { blob = value; return 'blob:otonan'; });
  t.mock.method(URL, 'revokeObjectURL', () => {});
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement: () => ({ setAttribute() {}, click() {} }),
    body: { appendChild() {}, removeChild() {} },
  };
  t.after(() => {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  });
  for (const perayaanKe of [null, 37]) {
    downloadOtonanICS({ tanggal: '2023-05-21', perayaanKe, ...elements });
    const content = await blob.text();
    assert.match(content, /DTSTART;VALUE=DATE:20230521/);
    if (perayaanKe === null) {
      assert.match(content, /SUMMARY:Otonan \(Redite Paing Sinta\)/);
      assert.doesNotMatch(content, /Siklus ke-|Otonan ke-|null|undefined/);
    } else {
      assert.match(content, /SUMMARY:Otonan ke-37/);
      assert.match(content, /Siklus ke-37/);
    }
  }
});
