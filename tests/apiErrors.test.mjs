import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

// Exercise the real API layer/interceptor and components; replace only query state and DOM portals.
const server = await createServer({
  configFile: false,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  ssr: { noExternal: ['@tanstack/react-query', 'react-router-dom', 'react-dom'] },
  plugins: [{
    name: 'api-error-fixtures', enforce: 'pre',
    resolveId(source) {
      if (source === '@tanstack/react-query') return '\0error-query';
      if (source === 'react-dom') return '\0error-portal';
      if (source === 'react-router-dom') return '\0error-router';
    },
    load(id) {
      if (id === '\0error-portal') return 'export const createPortal = node => node;';
      if (id === '\0error-router') return 'export const useNavigate = () => () => {}; export const useSearchParams = () => [new URLSearchParams(), () => {}];';
      if (id === '\0error-query') return `
        export function useQuery(config) {
          globalThis.__errorQueries?.push(config);
          return { data: undefined, isLoading: false, isError: false, error: null, refetch: async () => {}, ...globalThis.__errorQueryState };
        }
        export const useQueryClient = () => ({ invalidateQueries() {} });
        export const useMutation = () => ({ mutateAsync() {}, isPending: false });
      `;
    },
  }],
  server: { middlewareMode: true, ws: false }, appType: 'custom',
});
const load = path => server.ssrLoadModule(`/src/features/${path}`);
const kelola = await load('kelola-pura/api/kelolaPuraApi.ts');
const piodalan = await load('piodalan/api/piodalanApi.ts');
const otonan = await load('otonan/api/otonanApi.ts');
const ala = await load('ala-ayuning-dewasa/api/alaAyuningApi.ts');
const wariga = await load('wariga-personal/api/warigaPersonalApi.ts');
const { premiumApi } = await load('premium/api/premiumApi.ts');
const warta = await load('warta/api/wartaApi.ts');
const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');
const adapter = apiClient.defaults.adapter;
const oldDocument = globalThis.document;
globalThis.document = { body: {} };
afterEach(() => { apiClient.defaults.adapter = adapter; delete globalThis.__errorQueryState; delete globalThis.__errorQueries; });
after(async () => {
  await server.close();
  if (oldDocument === undefined) delete globalThis.document;
  else globalThis.document = oldDocument;
});
const date = '2026-11-12';
const calls = [
  ['katalog pura', () => kelola.fetchPuraList()],
  ['detail pura', () => kelola.fetchPuraDetail(1)],
  ['piodalan pura', () => kelola.fetchPuraPiodalans(1)],
  ['piodalan per tanggal', () => kelola.fetchPuraPiodalanByDate(1, date)],
  ['acara pura', () => kelola.fetchPuraAcaras(1)],
  ['acara piodalan', () => kelola.fetchPiodalanAcaras(1)],
  ['kategori kas', () => kelola.fetchFinanceCategories()],
  ['mutasi kas', () => kelola.fetchPuraFinance(1)],
  ['saldo kas', () => kelola.fetchPuraFinanceSummary(1)],
  ['pura pencarian', () => piodalan.fetchPuraList()],
  ['detail pura pencarian', () => piodalan.fetchPuraDetail(1)],
  ['master pencarian', () => piodalan.fetchMasterDropdown('wuku')],
  ['tanggal piodalan', () => piodalan.fetchPiodalanDates('1', '1', '1', 2026)],
  ['wariga piodalan', () => piodalan.fetchDayWariga(date)],
  ['riwayat piodalan', () => piodalan.fetchPuraPiodalans(1)],
  ['susunan acara', () => piodalan.fetchPiodalanAcaras(1)],
  ['penjelasan piodalan', () => piodalan.fetchWarigaElementExplanation('wuku', 'Sinta')],
  ['hasil pencarian', () => piodalan.searchPiodalan({ mode: 'bulan', bulan: 11, tahun: 2026 })],
  ['master otonan', () => otonan.fetchMasterWewaran('wuku')],
  ['sasih otonan', () => otonan.fetchOtonanDaySasih(date)],
  ['wariga otonan', () => otonan.fetchDayWariga(date)],
  ['penjelasan otonan', () => otonan.fetchKeteranganValueByName('wuku', 'Sinta')],
  ['padewasan harian', () => ala.fetchPadewasanHarian(date)],
  ['master padewasan', () => ala.fetchMasterPadewasan()],
  ['ringkasan hari ini', () => ala.fetchDewasaAyuToday()],
  ['pawukon', () => ala.fetchDayPawukon(date)],
  ['dewasa kelahiran', () => wariga.fetchDewasaKelahiran(date)],
  ['produk premium', () => premiumApi.getSubscriptionProducts()],
  ['langganan aktif', () => premiumApi.getMyActiveSubscription()],
  ['riwayat pembayaran', () => premiumApi.getMyPurchases()],
  ['artikel sendiri', () => warta.fetchMyArticles()],
];
function success(data) {
  apiClient.defaults.adapter = async config => ({ config, data, status: 200, statusText: 'OK', headers: {} });
}
for (const status of [401, 403, 503, 'network']) {
  test(`request ${status}: seluruh pembaca data menolak, bukan mengembalikan kosong`, async () => {
    apiClient.defaults.adapter = async config => { throw Object.assign(new Error('Request failed'), {
      config, code: status === 'network' ? 'ERR_NETWORK' : undefined,
      response: status === 'network' ? undefined : { status, data: { message: 'Layanan sedang terganggu' } },
    }); };
    for (const [label, call] of calls) await assert.rejects(call, /terganggu|jaringan/, label);
  });
}
test('HTTP 200 dengan daftar kosong tetap merupakan hasil kosong yang sah', async () => {
  success({ data: [] });
  for (const call of [kelola.fetchPuraList, kelola.fetchFinanceCategories, premiumApi.getMyPurchases,
    () => kelola.fetchPuraPiodalans(1), () => kelola.fetchPuraAcaras(1), () => kelola.fetchPuraFinance(1),
    () => ala.fetchPadewasanHarian(date), () => wariga.fetchDewasaKelahiran(date)]) {
    assert.deepEqual(await call(), []);
  }
  success({ data: { schedules: [] } });
  assert.deepEqual((await piodalan.searchPiodalan({ mode: 'bulan', bulan: 11, tahun: 2026 })).schedules, []);
  success({ data: { total_debit: 0, total_kredit: 0, saldo: 0 } });
  assert.equal((await kelola.fetchPuraFinanceSummary(1)).saldo, 0);
  success({ data: { is_premium: false, active_until: null, active_product: null } });
  assert.equal((await premiumApi.getMyActiveSubscription()).is_premium, false);
});
test('HTTP 200 tanpa payload wajib tidak diubah menjadi data kosong atau saldo nol', async () => {
  for (const invalid of [{}, { data: null }, { data: {} }]) {
    success(invalid);
    for (const call of [kelola.fetchPuraList, () => kelola.fetchPuraFinanceSummary(1), premiumApi.getMyPurchases,
      premiumApi.getMyActiveSubscription, () => piodalan.searchPiodalan({ mode: 'bulan', bulan: 11, tahun: 2026 }),
      () => ala.fetchPadewasanHarian(date), () => otonan.fetchDayWariga(date)]) {
      await assert.rejects(call);
    }
  }
});
test('alias keterangan hanya dicoba untuk kategori 404; gangguan 503 tidak memicu fallback', async () => {
  for (const call of [piodalan.fetchWarigaElementExplanation, otonan.fetchKeteranganValueByName]) {
    const urls = [];
    apiClient.defaults.adapter = async config => {
      urls.push(config.url);
      if (config.url.includes('/types/')) throw Object.assign(new Error('Missing category'), { config, response: { status: 404, data: {} } });
      return { config, data: { data: [] }, status: 200, headers: {} };
    };
    assert.equal(await call('legacy-code', 'Sinta'), null);
    assert.equal(urls.length, 2);
  }
});

test('modal, dashboard, dan kas menampilkan error dengan retry tanpa klaim kosong', async () => {
  const failure = new Error('Layanan sedang terganggu');
  globalThis.__errorQueryState = { isError: true, error: failure };
  const cases = [
    ['premium/components/PremiumHistoryModal.tsx', 'PremiumHistoryModal', { purchases: [], isLoading: false, error: failure, onRetry() {} }, /Belum Ada Riwayat/],
    ['wariga-personal/components/DewasaTanggalLahirModal.tsx', 'DewasaTanggalLahirModal', { birthDate: date, calendarBirthDate: date, items: [], isLoading: false, error: failure, onRetry() {} }, /Tidak Ada Unsur/],
    ['wariga-personal/components/WarigaTanggalLahirModal.tsx', 'WarigaTanggalLahirModal', { birthDate: date, calendarBirthDate: date }, /Urip.*>0</],
    ['dashboard/components/DashboardDewasaAyu.tsx', 'DashboardDewasaAyu', { error: failure, onRetry() {} }, /Tidak ada padewasan/],
    ['kelola-pura/components/PuraKeuanganView.tsx', 'PuraKeuanganView', { puraId: 1, pura: null }, /Rp\s*0|Belum Ada Transaksi/],
    ['kalender/components/CalendarInspector.tsx', 'CalendarInspector', { selectedDate: date }, /Tidak ada perayaan piodalan|0 lokasi/],
  ];
  for (const [path, name, props, emptyPattern] of cases) {
    const module = await load(path);
    const html = renderToStaticMarkup(React.createElement(module[name], { isOpen: true, onClose() {}, ...props }));
    assert.match(html, /role="alert"/, name);
    assert.match(html, /Layanan sedang terganggu/, name);
    assert.match(html, /Coba Lagi/, name);
    assert.doesNotMatch(html, emptyPattern, name);
  }
});
test('kas yang sedang dimuat tidak tampil nol; riwayat kosong yang sukses tetap ditampilkan', async () => {
  const { PuraKeuanganView } = await load('kelola-pura/components/PuraKeuanganView.tsx');
  globalThis.__errorQueryState = { isLoading: true };
  const loading = renderToStaticMarkup(React.createElement(PuraKeuanganView, { puraId: 1, pura: null }));
  assert.match(loading, /aria-busy="true"/);
  assert.doesNotMatch(loading, /Rp\s*0|Belum Ada Transaksi/);
  const { PremiumHistoryModal } = await load('premium/components/PremiumHistoryModal.tsx');
  const empty = renderToStaticMarkup(React.createElement(PremiumHistoryModal, { isOpen: true, onClose() {}, purchases: [], isLoading: false }));
  assert.match(empty, /Belum Ada Riwayat Transaksi/);
  assert.doesNotMatch(empty, /role="alert"/);
});
test('langganan belum diperiksa ditampilkan terpisah dari akun gratis dan data premium lama', async () => {
  const { PremiumHero } = await load('premium/components/PremiumHero.tsx');
  for (const isPremium of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(PremiumHero, {
      user: { id: '42', name: 'Uji', isPremium, premiumExpiresAt: '2199-01-01T00:00:00Z', subscriptionUnavailable: true },
      onOpenHistory() {},
    }));
    assert.match(html, /BELUM DAPAT DIPERIKSA/);
    assert.doesNotMatch(html, /AKUN STANDAR \(GRATIS\)|MEMBER PREMIUM|2199/);
  }
});
test('ringkasan piodalan menghitung respons backend meski master pura belum tersedia', async () => {
  const { useMonthlyPiodalan, useDayPiodalan } = await load('kalender/hooks/useKalender.ts');
  globalThis.__errorQueries = [];
  function Probe() { useMonthlyPiodalan(2026, 11, undefined, date); useDayPiodalan(date); return null; }
  renderToStaticMarkup(React.createElement(Probe));
  const month = globalThis.__errorQueries.find(q => q.queryKey[2] === 'month');
  const day = globalThis.__errorQueries.find(q => q.queryKey[2] === 'day');
  success({ data: { schedules: [{ tanggal: date, wewaran: 'Wraspati', puras: [{ id: 1, nama: 'Pura Uji' }] }] } });
  const summary = await month.queryFn();
  assert.equal(summary.totalPuras, 1);
  assert.equal(summary.upcomingItems.length, 1);
  assert.equal((await day.queryFn()).totalCount, 1);
  apiClient.defaults.adapter = async config => { throw Object.assign(new Error(), { config, response: { status: 503, data: { message: 'Layanan sedang terganggu' } } }); };
  await assert.rejects(month.queryFn, /terganggu/);
  await assert.rejects(day.queryFn, /terganggu/);
});
