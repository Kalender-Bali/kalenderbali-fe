import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});
after(async () => server.close());
const { otonanCandidates, hariRayaCandidates, piodalanCandidates, privatePiodalanCandidates, privateCalendarCandidates, dewasaCandidates } = await server.ssrLoadModule('/src/features/pengingat/utils/pengingatSources.ts');
const today = '2026-11-13';
const elemen = { saptawara: 'Sukra', pancawara: 'Kliwon', wuku: 'Sungsang' };

test('kriteria sendiri Hari Raya menyimpan sumber pribadi dan tetap dalam kartu Hari Raya', () => {
  const condition = { basis: 'pawukon', ...elemen };
  const [candidate] = privateCalendarCandidates('hari-raya', condition, ['2026-11-01', '2026-12-01'], today);
  assert.equal(candidate.kind, 'hari-raya');
  assert.equal(candidate.source.feature, 'hari-raya-pribadi');
  assert.equal(candidate.nextDate, '2026-12-01');
  assert.deepEqual(candidate.source.condition, condition);
  assert.equal(candidate.origin, 'pribadi');
});

test('otonan memakai tanggal hasil dan menyimpan input sipil serta normalisasi sebelum 06.00', () => {
  const request = { tipe_pencarian: 'tanggal_lahir', tanggal_lahir: '2000-01-01', sebelum_jam_6: true, tahun_target: 2027 };
  const normalized = { ...request, tanggal_lahir_sipil: '2000-01-01', tanggal_lahir_kalender: '1999-12-31', elemen };
  const result = { tanggal: '2027-01-08', perayaan_ke: 47, detail_elemen: elemen };
  const rows = otonanCandidates(request, { input_dinormalisasi: normalized, hasil: [{ ...result, tanggal: '2026-06-12' }, result] }, today);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].nextDate, result.tanggal);
  assert.deepEqual(rows[0].condition, { basis: 'kelahiran', birthDate: '2000-01-01', beforeSix: true });
  assert.equal(rows[0].source.normalized.tanggal_lahir_kalender, '1999-12-31');
  assert.equal(rows[0].source.result.perayaan_ke, 47);
  assert.deepEqual(rows[0].source.request, request);
});

test('otonan wewaran mempertahankan ID referensi dan tidak mengarang nomor perayaan', () => {
  const request = { tipe_pencarian: 'elemen_kalender', saptawara_id: '9007199254740993', pancawara_id: '433', wuku_id: '524', tahun_target: 2027 };
  const [candidate] = otonanCandidates(request, { input_dinormalisasi: { elemen, sebelum_jam_6: false }, hasil: [{ tanggal: '2027-01-08', perayaan_ke: null }] }, today);
  assert.equal(candidate.condition.basis, 'pawukon');
  assert.equal(candidate.source.request.saptawara_id, '9007199254740993');
  assert.doesNotMatch(candidate.description, /Otonan ke-/);
});

test('hari raya memakai identitas katalog dan kejadian yang dikembalikan fitur', () => {
  const holiday = { id: '9007199254740993', nama: 'Purnama', jenis: 'rerainan' };
  const kejadian = ['2026-01-03', '2026-11-24'].map(tanggal => ({ tanggal, ...elemen, sasih: { nama_sasih: 'Kanem' } }));
  const [candidate] = hariRayaCandidates({ nama: 'Purnama', year: 2026 }, { hari_raya: holiday, kejadian }, today);
  assert.equal(candidate.nextDate, '2026-11-24');
  assert.equal(candidate.source.holiday.id, holiday.id);
  assert.equal(candidate.source.result.tanggal, candidate.nextDate);
  assert.equal(candidate.condition.name, holiday.nama);
});

test('piodalan hanya mengambil pura pilihan dan mempertahankan catatan pelaksanaan aktual', () => {
  const pura = { id: '21', nama: 'Pura Pilihan', pelaksanaan_aktual: { piodalan_id: '88' } };
  const selectedPura = { id: '21', name: 'Pura Pilihan', benchmark: 'Pawukon', ...elemen };
  const day = { tanggal: '2026-11-20', wewaran: 'Sukra Kliwon', sasih: 'Kanem', puras: [pura, { id: '22', nama: 'Pura Lain' }] };
  const [candidate, ...remaining] = piodalanCandidates({ mode: 'pura', pura_id: '21', tahun: 2026 }, { schedules: [day] }, selectedPura, today);
  assert.equal(remaining.length, 0);
  assert.equal(candidate.source.pura.id, '21');
  assert.equal(candidate.source.pura.pelaksanaan_aktual.piodalan_id, '88');
  assert.equal(candidate.condition.basis, 'pawukon');
  assert.match(candidate.description, /catatan pelaksanaan/);
});

test('tanggal piodalan tanpa aturan perulangan tidak berubah menjadi agenda tahunan', () => {
  const condition = { basis: 'tanggal', date: '2026-11-20' };
  const [candidate] = privatePiodalanCandidates(condition, ['2026-11-12', '2026-11-20'], today);
  assert.equal(candidate.repeatLabel, null);
  assert.equal(candidate.origin, 'pribadi');
  assert.equal(candidate.source.feature, 'piodalan-pribadi');
  assert.deepEqual(candidate.source.condition, condition);
});

test('piodalan Sasih memakai tanggal hasil kalender tanpa mengasumsikan siklus 210 hari', () => {
  const condition = { basis: 'sasih', sasih: 'Kadasa', phase: 'Purnama' };
  const [candidate] = privatePiodalanCandidates(condition, ['2027-03-22'], today);
  assert.equal(candidate.nextDate, '2027-03-22');
  assert.match(candidate.repeatLabel, /Sasih/);
  assert.doesNotMatch(candidate.repeatLabel, /210/);
});

test('dewasa menolak hasil konflik, tidak cocok, serta terlewat dan menyimpan kriteria hasil pilihan', () => {
  const request = { mode: 'custom', tanggal_mulai: '2026-11-01', tanggal_selesai: '2026-11-30', custom: { recommended_any: [{ all: [{ field: 'saptawara', value_id: '11' }] }], avoid_any: [] } };
  const criteria = { mode: 'custom', sections: [{ label: 'Mendukung', groups: [['Saptawara: Sukra']] }] };
  const result = { tanggal: '2026-11-20', eligible: true, status: 'eligible', matched_recommended: [{ name: 'Sukra' }], matched_avoid: [] };
  const response = { meta: { rule_version: 'v2', calendar_rule_version: 'v3', master_data_version: 'v4' }, data: { results: [
    { ...result, tanggal: '2026-11-01' }, { ...result, status: 'conflict' }, { ...result, status: 'no_match', eligible: false }, result,
  ] } };
  const rows = dewasaCandidates(request, response, criteria, today);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].nextDate, '2026-11-20');
  assert.equal(rows[0].repeatLabel, null);
  assert.deepEqual(rows[0].source.request, request);
  assert.deepEqual(rows[0].source.criteria, criteria);
  assert.equal(rows[0].source.meta.rule_version, 'v2');
});
