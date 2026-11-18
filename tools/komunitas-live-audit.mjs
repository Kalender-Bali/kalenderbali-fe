/** Audit HTTP nyata memakai modul API FE dan akun development yang sudah ada.
 * Tidak melakukan seed, mengubah role, membaca JWT secret, atau mengirim email.
 * Seluruh perubahan dibatasi ke profil berpenanda unik yang dibuat audit ini.
 */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const base = process.env.KOMUNITAS_AUDIT_BASE || 'http://127.0.0.1:8080/api/v1';
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname)) throw new Error('Audit tulis hanya diizinkan ke backend loopback lokal.');
const reportFlag = process.argv.indexOf('--report');
const output = reportFlag >= 0 ? process.argv[reportFlag + 1] : process.env.KOMUNITAS_AUDIT_REPORT || '/tmp/komunitas-live-audit.json';
const execute = process.argv.includes('--execute');
const publicOnly = process.argv.includes('--public');
const cleanupAccountsProfiles = process.argv.includes('--cleanup-accounts-profiles');
const seed = await readFile(new URL('../../backend-go/kalenderbali-be/internal/infrastructure/seed/users.go', import.meta.url), 'utf8');
const credentialsFlag = process.argv.indexOf('--credentials-file');
// Kredensial tambahan hanya dibaca dari file sementara pilihan pengguna, tidak dicatat dalam laporan.
const fixtures = credentialsFlag >= 0 ? JSON.parse(await readFile(process.argv[credentialsFlag + 1], 'utf8')) :
  [...seed.matchAll(/Email:\s*"([^"]+)"\s*,\s*Password:\s*"([^"]+)"/g)].map(match => ({ email: match[1], password: match[2] }));
const report = { at: new Date().toISOString(), backend: base, mode: execute ? 'live-crud' : publicOnly ? 'read-only' : cleanupAccountsProfiles ? 'cleanup-dummy-profiles' : 'credential-probe', checks: [], created: [], cleanup: [], error: null };
const sessions = [];
const owned = new Set();
let server;
let administrator;
let apiClient;
let store;

// Jeda menjaga audit dan request browser tetap di bawah batas API; penulisan tidak diulang.
const pause = () => new Promise(resolve => setTimeout(resolve, 650));
async function request(path, { method = 'GET', body, token, expected = [200] } = {}) {
  await pause();
  const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const content = await response.text();
  const data = content ? JSON.parse(content) : null;
  assert.ok(expected.includes(response.status), `${method} ${path}: HTTP ${response.status}; ${JSON.stringify(data?.error || data?.message || '').slice(0, 180)}`);
  return data;
}
async function check(name, action) {
  const started = Date.now();
  try { const result = await action(); report.checks.push({ name, status: 'pass', ms: Date.now() - started }); console.log(`PASS ${name}`); return result; }
  catch (error) { report.checks.push({ name, status: 'fail', error: error.message }); throw error; }
}
async function login(fixture) {
  const session = await request('/login', { method: 'POST', body: { email: fixture.email, password: fixture.password } });
  const user = (await request('/users/profile', { token: session.access_token })).data;
  const result = { ...session, user }; sessions.push(result); return result;
}
function actor(session) {
  store.getState().login({ id: String(session.user.id), name: session.user.name, email: session.user.email, role: session.user.role, isPremium: session.user.is_premium }, session.access_token, session.refresh_token);
}
async function frontend(action) { await pause(); return action(); }
async function removeOwned(id, expectedMarker = marker) {
  assert.ok(owned.has(id), 'Tidak boleh menghapus profil di luar fixture audit.');
  const current = await request(`/puras/${id}`, { token: administrator.access_token });
  assert.ok(current.data.name.startsWith(expectedMarker), 'Penanda profil audit tidak cocok.');
  await request(`/puras/${id}`, { method: 'DELETE', token: administrator.access_token });
  owned.delete(id); report.cleanup.push({ id, deleted: true });
}
const marker = `AUDIT-KOMUNITAS-${Date.now()}`;
report.marker = marker;
try {
  // Probe tidak mengubah data profil/kas dan berhenti jika akun development tidak tersedia.
  for (const fixture of publicOnly ? [] : fixtures) {
    try { await login(fixture); }
    catch (error) { report.checks.push({ name: 'Login fixture development', status: 'unavailable', error: error.message }); }
  }
  administrator = sessions.find(session => session.user.role === 'Admin');
  const members = sessions.filter(session => session.user.role === 'Member');
  console.log(JSON.stringify({ authenticatedRoles: sessions.map(session => session.user.role), hasAdmin: !!administrator, memberCount: members.length }));
  if (publicOnly) {
    server = await createServer({ configFile: false, cacheDir: `/tmp/komunitas-live-read-${process.pid}`, optimizeDeps: { noDiscovery: true, include: [] }, resolve: { alias: { '@': `${process.cwd()}/src` } }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
    const api = await server.ssrLoadModule('/src/features/komunitas/api/komunitasApi.ts');
    ({ apiClient } = await server.ssrLoadModule('/src/lib/axios.ts')); apiClient.defaults.baseURL = base;
    const filters = { search: '', country: '', province: '', city: '' };
    const page = await check('Direktori publik diparse modul API FE tanpa adapter simulasi', () => frontend(() => api.fetchCommunities('semua', filters)));
    await check('Katalog wilayah komunitas diparse modul FE', () => frontend(() => api.fetchCommunityRegions('semua')));
    await check('Pencarian yang tidak cocok menghasilkan kosong yang sah', async () => {
      assert.equal((await frontend(() => api.fetchCommunities('semua', { ...filters, search: marker }))).data.length, 0);
    });
    await check('Master negara tersedia untuk form', async () => { assert.ok((await frontend(() => api.fetchGeoOptions('countries'))).length); });
    const categories = await check('Kategori kas global diparse modul FE', () => frontend(() => api.fetchFinanceCategories()));
    for (const item of page.data.slice(0, 2)) {
      const profile = await check(`Detail profil ${item.id} menggunakan kontrak HTTP nyata`, () => frontend(() => api.fetchCommunity(item.id)));
      await check(`Pencarian dan filter wilayah menemukan profil ${item.id}`, async () => {
        const filtered = await frontend(() => api.fetchCommunities('semua', { search: profile.name, country: profile.country, province: profile.province, city: profile.city }));
        assert.ok(filtered.data.some(row => row.id === item.id));
      });
      const entries = await check(`Mutasi kas ${item.id} diparse dan pemilik sesuai`, () => frontend(() => api.fetchPuraFinance(item.id)));
      await check(`Ringkasan kas ${item.id} cocok dengan transaksi sebenarnya`, async () => {
        const summary = await frontend(() => api.fetchPuraFinanceSummary(item.id));
        const debit = entries.filter(row => row.entry_type === 'debit').reduce((sum, row) => sum + row.amount, 0);
        const credit = entries.filter(row => row.entry_type === 'kredit').reduce((sum, row) => sum + row.amount, 0);
        assert.deepEqual([summary.total_debit, summary.total_kredit, summary.saldo], [debit, credit, debit - credit]);
      });
      if (categories.length) await check(`Filter kategori dan tahun kas ${item.id} diterima backend`, async () => {
        await frontend(() => api.fetchPuraFinance(item.id, 2026, categories[0].id, 'debit'));
        await frontend(() => api.fetchPuraFinanceSummary(item.id, 2026, categories[0].id));
      });
    }
    await check('Tab privat, pengelola, dan katalog Admin menolak tamu', async () => {
      for (const path of ['/puras/my?view=summary&scope=community', '/puras/unpublished?view=summary&scope=community', '/puras/my/regions?scope=community', '/admin/members']) await request(path, { expected: [401] });
    });
    await check('Penulisan profil/kas tanpa login ditolak sebelum menulis', async () => {
      await request('/puras', { method: 'POST', body: {}, expected: [401] });
      if (page.data[0]) await request(`/puras/${page.data[0].id}/finance`, { method: 'POST', body: {}, expected: [401] });
    });
    await check('Scope dan cursor direktori yang tidak valid ditolak', async () => {
      await request('/puras?view=summary&scope=invalid', { expected: [400, 422] });
      await request('/puras?view=summary&scope=community&cursor=invalid', { expected: [400, 422] });
    });
    const kelola = await server.ssrLoadModule('/src/features/kelola-pura/api/kelolaPuraApi.ts');
    const piodalan = await server.ssrLoadModule('/src/features/piodalan/api/piodalanApi.ts');
    await check('Direktori Kelola Pura dan Piodalan tidak mencampur Suka Duka', async () => {
      for (const reader of [kelola.fetchPuraList, piodalan.fetchPuraList]) assert.ok((await frontend(() => reader())).every(row => row.type.trim().toLowerCase() !== 'suka duka'));
    });
  }
  else if (cleanupAccountsProfiles) {
    assert.ok(credentialsFlag >= 0 && administrator && fixtures.every(item => item.email.startsWith('audit-komunitas-') && item.email.endsWith('@example.test')), 'Cleanup memerlukan manifest akun dummy, bukan akun development pengguna.');
    const userIds = new Set(sessions.map(session => session.user.id));
    for (const scope of ['community', 'pura']) for (const tab of ['', '/unpublished']) {
      const page = await request(`/puras${tab}?view=summary&scope=${scope}&limit=100&search=AUDIT-KOMUNITAS-`, { token: administrator.access_token });
      for (const row of page.data) {
        if (!row.name.startsWith('AUDIT-KOMUNITAS-')) continue;
        const profile = (await request(`/puras/${row.id}`, { token: administrator.access_token })).data;
        if (!(profile.manager || []).some(manager => userIds.has(manager.user_id))) continue;
        owned.add(row.id); await removeOwned(row.id, 'AUDIT-KOMUNITAS-');
      }
    }
    console.log('Profil tersisa milik akun dummy sudah dibersihkan.');
  }
  else if (!execute) process.exitCode = administrator && members.length >= 2 ? 0 : 2;
  else {
    assert.ok(administrator && members.length >= 2, 'Diperlukan akun development Admin serta dua Member yang dapat login.');
    const [member, outsider] = members;
    server = await createServer({ configFile: false, cacheDir: `/tmp/komunitas-live-vite-${process.pid}`, optimizeDeps: { noDiscovery: true, include: [] }, resolve: { alias: { '@': `${process.cwd()}/src` } }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
    const api = await server.ssrLoadModule('/src/features/komunitas/api/komunitasApi.ts');
    ({ apiClient } = await server.ssrLoadModule('/src/lib/axios.ts'));
    ({ useAuthStore: store } = await server.ssrLoadModule('/src/stores/useAuthStore.ts'));
    apiClient.defaults.baseURL = base;
    const filters = { search: '', country: '', province: '', city: '' };
    await check('Direktori publik dan katalog wilayah dibaca parser FE', async () => {
      const page = await frontend(() => api.fetchCommunities('semua', filters));
      assert.ok(Array.isArray(page.data)); await frontend(() => api.fetchCommunityRegions('semua'));
    });
    const countries = await frontend(() => api.fetchGeoOptions('countries'));
    const country = countries.find(row => row.name.toLowerCase() === 'indonesia'); assert.ok(country, 'Indonesia tidak ditemukan di master geo.');
    const provinces = await frontend(() => api.fetchGeoOptions('provinces', country.id));
    const province = provinces.find(row => row.name.toLowerCase().includes('bali')) || provinces[0]; assert.ok(province);
    const cities = await frontend(() => api.fetchGeoOptions('cities', province.id)); const city = cities[0]; assert.ok(city);
    const categories = await frontend(() => api.fetchFinanceCategories()); assert.ok(categories.length, 'Master kategori kas kosong.');
    const payload = { name: `${marker} Member`, type: 'Suka Duka', phone: '0800000000', address: `${marker} Lokasi pengujian`, country_id: country.id, province_id: province.id, city_id: city.id, location_url: 'https://maps.google.com/?q=-8.65,115.21', latitude: -8.65, longitude: 115.21 };
    actor(member);
    const created = await check('Member membuat Review dan otomatis menjadi pengelola', async () => {
      const saved = await frontend(() => api.saveCommunity(payload)); owned.add(saved.id); report.created.push({ id: saved.id, type: 'community' });
      assert.equal(saved.status, 'Review'); assert.ok(saved.manager.some(row => row.user_id === member.user.id)); return saved;
    });
    const id = created.id;
    await check('Tab Saya, Pengajuan, dan wilayah privat sesuai mapping', async () => {
      for (const tab of ['saya', 'pengajuan']) {
        const page = await frontend(() => api.fetchCommunities(tab, { ...filters, search: marker })); assert.ok(page.data.some(row => row.id === id));
        await frontend(() => api.fetchCommunityRegions(tab));
      }
    });
    await check('Review tidak muncul pada direktori publik dan detail tamu ditolak', async () => {
      store.getState().logout();
      const page = await frontend(() => api.fetchCommunities('semua', { ...filters, search: marker })); assert.equal(page.data.length, 0);
      await request(`/puras/${id}`, { expected: [404] });
      await request('/puras', { method: 'POST', body: payload, expected: [401] });
    });
    actor(member);
    await check('Pengelola memperbarui profil dan peta tanpa field odalan', async () => {
      const saved = await frontend(() => api.saveCommunity({ ...payload, name: `${marker} Diperbarui`, phone: '0800000001' }, id));
      assert.equal(saved.phone, '0800000001'); assert.equal(saved.location_url, payload.location_url); assert.equal(saved.status, 'Review');
      const raw = await request(`/puras/${id}`, { token: member.access_token }); assert.equal(raw.data.benchmark, undefined);
    });
    await check('Member lain tidak dapat membaca Review atau mengubah profil/kas', async () => {
      actor(outsider);
      await request(`/puras/${id}`, { token: outsider.access_token, expected: [404] });
      await request(`/puras/${id}`, { method: 'PUT', token: outsider.access_token, body: { name: 'PERUBAHAN DITOLAK' }, expected: [403] });
      await request(`/puras/${id}/finance`, { method: 'POST', token: outsider.access_token, body: { category_id: categories[0].id, entry_type: 'debit', amount: 999, transaction_date: '2026-11-18', note: marker }, expected: [403] });
    });
    actor(administrator);
    await check('Admin menolak lalu menerbitkan pengajuan melalui API FE', async () => {
      assert.equal((await frontend(() => api.moderateCommunity(id, 'Rejected'))).status, 'Rejected');
      assert.equal((await frontend(() => api.moderateCommunity(id, 'Published'))).status, 'Published');
    });
    await check('Profil terbit dapat dibaca publik dengan search dan wilayah', async () => {
      store.getState().logout();
      const page = await frontend(() => api.fetchCommunities('semua', { ...filters, search: marker, country: country.name, province: province.name, city: city.name })); assert.equal(page.data.length, 1);
      assert.equal((await frontend(() => api.fetchCommunity(id))).id, id);
    });
    actor(administrator);
    const other = await check('Admin membuat komunitas lain pada lokasi sama, langsung Published', async () => {
      const saved = await frontend(() => api.saveCommunity({ ...payload, name: `${marker} Kedua` })); owned.add(saved.id); report.created.push({ id: saved.id, type: 'community' }); assert.equal(saved.status, 'Published'); return saved;
    });
    const pura = await check('Profil pura pembanding dibuat khusus audit pada lokasi sama', async () => {
      const saved = (await request('/puras', { method: 'POST', token: administrator.access_token, expected: [201], body: { ...payload, type: 'Kawitan', name: `${marker} Pura` } })).data;
      owned.add(saved.id); report.created.push({ id: saved.id, type: 'pura' }); return saved;
    });
    const kelola = await server.ssrLoadModule('/src/features/kelola-pura/api/kelolaPuraApi.ts');
    const piodalan = await server.ssrLoadModule('/src/features/piodalan/api/piodalanApi.ts');
    await check('Daftar Kelola Pura dan Piodalan mengecualikan komunitas', async () => {
      for (const reader of [kelola.fetchPuraList, piodalan.fetchPuraList]) {
        const rows = await frontend(() => reader()); assert.ok(rows.some(row => row.id === pura.id)); assert.ok(!rows.some(row => row.id === id || row.id === other.id));
      }
    });
    const transaction = { pura_id: id, category_id: categories[0].id, entry_type: 'debit', amount: 200000, transaction_date: '2026-11-18', note: `${marker} pemasukan` };
    actor(member);
    const debit = await check('Pengelola mencatat debit melalui fungsi kas FE', () => frontend(() => api.createFinanceEntry(id, transaction)));
    const credit = await check('Pengelola mencatat kredit dan mengedit transaksi', async () => {
      const saved = await frontend(() => api.createFinanceEntry(id, { ...transaction, entry_type: 'kredit', amount: 50000, note: `${marker} pengeluaran` }));
      assert.equal((await frontend(() => api.updateFinanceEntry(debit.id, { amount: 250000, note: `${marker} pemasukan diperbarui` }))).amount, 250000); return saved;
    });
    await check('Tabel/filter dan ringkasan sesuai debit 250000 kredit 50000 saldo 200000', async () => {
      assert.equal((await frontend(() => api.fetchPuraFinance(id, 2026))).length, 2);
      assert.equal((await frontend(() => api.fetchPuraFinance(id, 2026, categories[0].id, 'debit'))).length, 1);
      const summary = await frontend(() => api.fetchPuraFinanceSummary(id, 2026, categories[0].id));
      assert.deepEqual([summary.total_debit, summary.total_kredit, summary.saldo], [250000, 50000, 200000]);
      assert.equal((await frontend(() => api.fetchPuraFinance(id, 2025))).length, 0);
    });
    await check('Member tanpa mapping ditolak pada edit/hapus transaksi serta moderasi/mapping', async () => {
      for (const [method, path, body] of [['PUT', `/finance/${debit.id}`, { amount: 1 }], ['DELETE', `/finance/${credit.id}`], ['PUT', `/puras/${id}/status`, { status: 'Rejected' }], ['POST', `/puras/${id}/managers`, { user_id: outsider.user.id }]]) await request(path, { method, body, token: outsider.access_token, expected: [403] });
    });
    actor(administrator);
    await frontend(() => api.createFinanceEntry(other.id, { ...transaction, pura_id: other.id, amount: 12345 }));
    await frontend(() => api.createFinanceEntry(pura.id, { ...transaction, pura_id: pura.id, amount: 34567 }));
    await check('Kas komunitas dan pura tetap terpisah walaupun alamat sama', async () => {
      for (const [owner, expected] of [[id, 200000], [other.id, 12345], [pura.id, 34567]]) assert.equal((await frontend(() => api.fetchPuraFinanceSummary(owner))).saldo, expected);
    });
    await check('Admin menambahkan pengelola dan hak tersebut langsung berlaku', async () => {
      await frontend(() => api.addCommunityManager(id, outsider.user.id));
      const managers = await frontend(() => api.fetchCommunityManagers(id)); assert.ok(managers.some(row => row.user_id === outsider.user.id));
      actor(outsider);
      assert.equal((await frontend(() => api.saveCommunity({ ...payload, name: `${marker} Oleh Pengelola Kedua` }, id))).name, `${marker} Oleh Pengelola Kedua`);
      await frontend(() => api.updateFinanceEntry(debit.id, { note: `${marker} edit pengelola kedua` }));
    });
    await check('Pencabutan mapping langsung menolak penulisan dengan token lama', async () => {
      actor(administrator); await frontend(() => api.removeCommunityManager(id, outsider.user.id));
      await request(`/finance/${debit.id}`, { method: 'PUT', token: outsider.access_token, body: { amount: 1 }, expected: [403] });
    });
    actor(member);
    await check('Hapus transaksi memperbarui ringkasan dan persisten saat dibaca ulang', async () => {
      await frontend(() => api.deleteFinanceEntry(credit.id));
      assert.equal((await frontend(() => api.fetchPuraFinanceSummary(id))).saldo, 250000);
      assert.equal((await frontend(() => api.fetchPuraFinance(id))).length, 1);
    });
    await check('Member tidak dapat menghapus profil komunitas', async () => { await request(`/puras/${id}`, { method: 'DELETE', token: member.access_token, expected: [403] }); });
    await check('Admin menghapus profil audit dan kas terkait ikut hilang', async () => {
      await removeOwned(id);
      await request(`/puras/${id}`, { expected: [404] });
      const summary = (await request(`/puras/${id}/finance/summary`)).data; assert.equal(summary.saldo, 0);
      assert.equal((await request(`/puras/${id}/finance`)).data.length, 0);
    });
  }
} catch (error) { report.error = error.message; process.exitCode = 1; console.error(`AUDIT FAILED: ${error.message}`); }
finally {
  // Pulihkan juga ID bila server berhasil menulis tetapi pemeriksaan respons terhenti sebelum ID dicatat.
  if (execute && administrator) {
    for (const scope of ['community', 'pura']) for (const tab of ['', '/unpublished']) {
      try {
        const page = await request(`/puras${tab}?view=summary&scope=${scope}&limit=100&search=${encodeURIComponent(marker)}`, { token: administrator.access_token });
        for (const profile of page.data || []) if (profile.name.startsWith(marker)) owned.add(profile.id);
      } catch { report.cleanup.push({ discoveryFailed: true, scope, tab }); }
    }
  }
  // Cleanup hanya ID yang dibuat sesi ini, dengan pemeriksaan penanda sebelum penghapusan.
  for (const id of [...owned]) { try { await removeOwned(id); } catch (error) { report.cleanup.push({ id, deleted: false, error: error.message }); process.exitCode = 1; } }
  for (const session of sessions) {
    try { await request('/logout', { method: 'POST', expected: [204], body: { refresh_token: session.refresh_token } }); }
    catch { report.cleanup.push({ sessionLogout: false }); }
  }
  if (server) await server.close();
  report.totals = { pass: report.checks.filter(row => row.status === 'pass').length, fail: report.checks.filter(row => row.status === 'fail').length, remainingProfiles: owned.size };
  await writeFile(output, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify({ report: output, ...report.totals }));
}
