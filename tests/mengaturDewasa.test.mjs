import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

// Muat modul TypeScript melalui Vite yang sama tanpa membuka server jaringan.
const server = await createServer({
  configFile: false,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});
after(async () => server.close());

const { buildCustomRules, buildCustomSearchRequest, readDewasaUrlContext, restoreCustomDraft, summarizeSearchCriteria } = await server.ssrLoadModule('/src/features/mengatur-dewasa/utils/mengaturDewasaUtils.ts');
const { MengaturDewasaResults } = await server.ssrLoadModule('/src/features/mengatur-dewasa/components/MengaturDewasaResults.tsx');
const { getTodayWITA } = await server.ssrLoadModule('/src/features/kalender/utils/calendarUtils.ts');

const fields = [
  { field: 'ekawara', label: 'Ekawara', value_kind: 'reference_value', reference_type_code: 'ekawara' },
  { field: 'neptu', label: 'Neptu', value_kind: 'integer', min: 7, max: 18 },
  { field: 'lunar_event', label: 'Purnama/Tilem', value_kind: 'enum', allowed_values: ['Purnama', 'Tilem', '-'] },
];
const values = { ekawara: [{ id: '9007199254740993', name: 'Luang' }] };
const item = (id, field, value) => ({ id, field, value });
const draft = {
  recommended: [
    { id: 'a', items: [item('1', 'ekawara', '9007199254740993'), item('2', 'neptu', '07')] },
    { id: 'b', items: [item('3', 'lunar_event', 'Purnama')] },
  ],
  avoid: [{ id: 'c', items: [item('4', 'lunar_event', 'Tilem')] }],
};

test('kelompok AND/OR dan avoid-only memakai kontrak backend', () => {
  const expected = {
    recommended_any: [
      { all: [{ field: 'ekawara', value_id: '9007199254740993' }, { field: 'neptu', value: 7 }] },
      { all: [{ field: 'lunar_event', value: 'Purnama' }] },
    ],
    avoid_any: [{ all: [{ field: 'lunar_event', value: 'Tilem' }] }],
  };
  assert.deepEqual(buildCustomRules(draft, fields, values).rules, expected);
  assert.deepEqual(buildCustomRules({ recommended: [], avoid: draft.avoid }, fields, values).rules, {
    recommended_any: [], avoid_any: expected.avoid_any,
  });
  assert.deepEqual(buildCustomSearchRequest(expected, 2, 2028), {
    mode: 'custom', custom: expected, tanggal_mulai: '2028-02-01', tanggal_selesai: '2028-02-29',
    include_rejected: true, include_calendar: true,
  });
});

test('nilai tanpa sumber resmi, duplikasi dan input di luar batas ditolak', () => {
  const invalid = (items) => ({ recommended: [{ id: 'g', items }], avoid: [] });
  assert.equal(buildCustomRules({ recommended: [], avoid: [] }, fields, values).rules, null);
  assert.equal(buildCustomRules(invalid([item('1', 'ekawara', '1')]), fields, values).rules, null);
  assert.equal(buildCustomRules(invalid([item('1', 'ekawara', '9007199254740993')]), fields, {}).rules, null);
  assert.equal(buildCustomRules(invalid([item('1', 'neptu', '7'), item('2', 'neptu', '07')]), fields, values).rules, null);
  assert.equal(buildCustomRules(invalid([item('1', 'neptu', '19')]), fields, values).rules, null);
  assert.equal(buildCustomRules(invalid([item('1', 'lunar_event', 'palsu')]), fields, values).rules, null);
  assert.equal(buildCustomSearchRequest({ recommended_any: [], avoid_any: [] }, 13, 2026), null);
});

test('draft login dipulihkan dengan validasi bentuk dan batas kelompok', () => {
  const restored = restoreCustomDraft(draft);
  assert.deepEqual(buildCustomRules(restored, fields, values).rules, buildCustomRules(draft, fields, values).rules);
  assert.equal(restoreCustomDraft({ recommended: [{ items: [] }], avoid: [] }), null);
  assert.equal(restoreCustomDraft({ recommended: Array.from({ length: 21 }, () => ({ items: [item('1', 'neptu', '7')] })), avoid: [] }), null);
});

test('URL mempertahankan konteks yang valid tanpa membulatkan ID template', () => {
  const id = '9007199254740993';
  assert.deepEqual(readDewasaUrlContext(new URLSearchParams(`mode=activity&month=2&year=2028&activity=${id}`), '2026-11-06'), {
    mode: 'activity', month: 2, year: '2028', activityId: id,
  });
  assert.deepEqual(readDewasaUrlContext(new URLSearchParams('mode=custom&month=13&year=9999&activity=invalid'), '2026-11-06'), {
    mode: 'custom', month: 11, year: '2026', activityId: '',
  });
});

test('tanggal hari ini mengikuti WITA ketika UTC masih hari sebelumnya', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-11-05T16:30:00Z') });
  assert.equal(getTodayWITA(), '2026-11-06');
});

test('ringkasan merekam kelompok request dan label yang digunakan saat submit', () => {
  const rules = buildCustomRules(draft, fields, values).rules;
  const request = buildCustomSearchRequest(rules, 2, 2028);
  const summary = summarizeSearchCriteria(request, null, fields, values);
  assert.deepEqual(summary.sections, [
    { label: 'Mendukung', groups: [['Ekawara: Luang', 'Neptu: 7'], ['Purnama/Tilem: Purnama']] },
    { label: 'Dihindari', groups: [['Purnama/Tilem: Tilem']] },
  ]);
  const activity = { id: '1', name: 'Kegiatan', rules: [{ name: 'A', recommendation: 'recommended' }, { name: 'B', recommendation: 'avoid' }] };
  const templateSummary = summarizeSearchCriteria({ mode: 'activity', activity_id: '1' }, activity, [], {});
  activity.rules[0].name = 'Diubah';
  assert.deepEqual(templateSummary.sections, [{ label: 'Mendukung', groups: [['A']] }, { label: 'Dihindari', groups: [['B']] }]);
});

test('hasil awal menyajikan tanggal eligible dan status lain sebagai filter', () => {
  const response = {
    data: { mode: 'custom', results: [
      { tanggal: '2026-11-01', status: 'eligible', eligible: true, matched_recommended: [{ source: 'custom_criterion', recommendation: 'recommended', name: 'Luang', field: 'ekawara' }], matched_avoid: [] },
      { tanggal: '2026-11-02', status: 'conflict', eligible: false, matched_recommended: [], matched_avoid: [] },
      { tanggal: '2026-11-03', status: 'no_match', eligible: false, matched_recommended: [], matched_avoid: [] },
    ] },
    meta: { request_id: 'test', timezone: 'Asia/Makassar', rule_version: 'test', calendar_rule_version: 'test', master_data_version: 'test', evaluated_days: 3, eligible_days: 1, conflict_days: 1 },
  };
  const html = renderToString(React.createElement(MengaturDewasaResults, { response, fields })).replaceAll('<!-- -->', '');
  assert.match(html, /Memenuhi kriteria/);
  assert.match(html, /Ada konflik/);
  assert.match(html, /Tidak cocok/);
  assert.match(html, /1 November 2026/);
  assert.match(html, /Ekawara: /);
  assert.match(html, /Luang/);
  assert.doesNotMatch(html, /2 November 2026/);
});

test('401 dari token lama tidak mengeluarkan sesi baru, tetapi token aktif tetap ditangani', async (t) => {
  // State tiruan berada di proses Node; tidak menggunakan penyimpanan browser.
  const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');
  const { useAuthStore } = await server.ssrLoadModule('/src/stores/useAuthStore.ts');
  const previousAdapter = apiClient.defaults.adapter;
  t.after(() => {
    apiClient.defaults.adapter = previousAdapter;
    useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  });
  useAuthStore.setState({ user: { id: 'test', name: 'Uji', role: 'member' }, token: 'token-lama', isAuthenticated: true });
  let rejectRequest;
  let notifyStarted;
  const started = new Promise((resolve) => { notifyStarted = resolve; });
  apiClient.defaults.adapter = (config) => new Promise((_resolve, reject) => {
    rejectRequest = () => reject({ config, response: { status: 401, data: { error: { code: 'UNAUTHORIZED', message: 'Sesi berakhir' } } } });
    notifyStarted();
  });
  const request = apiClient.get('/test-token');
  await started;
  useAuthStore.setState({ token: 'token-baru' });
  rejectRequest();
  await assert.rejects(request, (error) => error.status === 401);
  assert.equal(useAuthStore.getState().token, 'token-baru');
  assert.equal(useAuthStore.getState().isAuthenticated, true);

  apiClient.defaults.adapter = async (config) => {
    throw { config, response: { status: 401, data: { error: { message: 'Sesi berakhir' } } } };
  };
  await assert.rejects(apiClient.get('/test-token'), (error) => error.status === 401);
  assert.equal(useAuthStore.getState().token, null);
  assert.equal(useAuthStore.getState().isAuthenticated, false);
});

test('pembatalan request tetap dikenali sebagai pembatalan Axios', async (t) => {
  const { default: axios } = await import('axios');
  const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');
  const previousAdapter = apiClient.defaults.adapter;
  t.after(() => { apiClient.defaults.adapter = previousAdapter; });
  apiClient.defaults.adapter = async (config) => { throw new axios.CanceledError('Dibatalkan', config); };
  await assert.rejects(apiClient.get('/test-cancel'), (error) => axios.isCancel(error));
});
