import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import { createServer } from 'vite';

const storage = new Map();
const oldStorage = globalThis.localStorage;
const oldWindow = globalThis.window;
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
globalThis.window = { localStorage: globalThis.localStorage };
const server = await createServer({
  configFile: false,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, ws: false }, appType: 'custom',
});
const { authService, ProfileLoadError } = await server.ssrLoadModule('/src/features/auth/services/authService.ts');
const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');
const { useAuthStore } = await server.ssrLoadModule('/src/stores/useAuthStore.ts');
const adapter = apiClient.defaults.adapter;
afterEach(() => { apiClient.defaults.adapter = adapter; useAuthStore.getState().logout(); });
after(async () => {
  await server.close();
  if (oldStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = oldStorage;
  if (oldWindow === undefined) delete globalThis.window;
  else globalThis.window = oldWindow;
});

const credentials = { email: 'profil@example.test', password: 'test-only-password' };
const tokens = { access_token: 'new-access-token', refresh_token: 'new-refresh-token', expires_in: 900 };
const profile = { id: 42, name: 'Profil Resmi', email: credentials.email, role: 'Guest', is_verified: false, is_premium: false };
function response(config, data) { return { data, status: 200, statusText: 'OK', headers: {}, config }; }
function failure(config, status, code) {
  return Object.assign(new Error('HTTP failure'), { config, response: { status, data: { code, message: 'Layanan sementara gagal' } } });
}
// Kontrak pemanggil: sesi hanya disimpan setelah seluruh alur login berhasil.
async function signIn() {
  const result = await authService.loginAndFetchProfile(credentials);
  useAuthStore.getState().login(result.user, result.token, result.refreshToken);
  return result;
}
function assertLoggedOut() {
  const state = useAuthStore.getState();
  assert.equal(state.isAuthenticated, false);
  assert.equal(state.user, null);
  assert.equal(state.token, null);
  assert.equal(state.refreshToken, null);
  const persisted = JSON.parse(storage.get('kalenderbali_auth') ?? '{"state":{}}').state;
  assert.ok(!persisted.isAuthenticated);
  assert.ok(!persisted.user);
  assert.ok(!persisted.token);
}

test('login berhasil tetapi profil 503: tolak sesi, lalu percobaan berikutnya memakai identitas resmi', async () => {
  let profileAvailable = false;
  let logins = 0;
  apiClient.defaults.adapter = async config => {
    if (config.url === '/login') { logins++; return response(config, tokens); }
    assert.equal(config.headers.Authorization, 'Bearer new-access-token');
    if (config.url === '/users/profile') {
      if (!profileAvailable) throw failure(config, 503);
      return response(config, { data: profile });
    }
    return response(config, { data: { is_premium: false } });
  };
  await assert.rejects(signIn(), error => {
    assert.ok(error instanceof ProfileLoadError);
    assert.equal(error.code, 'PROFILE_UNAVAILABLE');
    assert.equal(error.cause.status, 503);
    assert.match(error.message, /Profil akun.*coba login kembali/);
    return true;
  });
  assertLoggedOut();
  profileAvailable = true;
  const result = await signIn();
  assert.equal(logins, 2);
  assert.equal(result.user.id, '42');
  assert.equal(result.user.name, 'Profil Resmi');
  assert.equal(result.user.role, 'Guest');
  assert.equal(result.user.isVerified, false);
  assert.equal(useAuthStore.getState().token, tokens.access_token);
  assert.equal(useAuthStore.getState().refreshToken, tokens.refresh_token);
  assert.equal(useAuthStore.getState().isAuthenticated, true);
  const persisted = JSON.parse(storage.get('kalenderbali_auth')).state;
  assert.equal(persisted.user.id, '42');
  assert.equal(persisted.user.role, 'Guest');
  assert.equal(persisted.user.isVerified, false);
  assert.equal(persisted.token, tokens.access_token);
});

test('profil masih dimuat: token dan status login belum disimpan', async () => {
  let deliverProfile;
  let profileRequested;
  const requested = new Promise(resolve => { profileRequested = resolve; });
  apiClient.defaults.adapter = async config => {
    if (config.url === '/login') return response(config, tokens);
    if (config.url === '/users/profile') {
      profileRequested();
      return new Promise(resolve => { deliverProfile = () => resolve(response(config, { data: profile })); });
    }
    return response(config, { data: { is_premium: false } });
  };
  const pending = signIn();
  await requested;
  assertLoggedOut();
  deliverProfile();
  await pending;
  assert.equal(useAuthStore.getState().user.id, '42');
});

test('profil kosong atau identitas parsial ditolak walaupun HTTP 200', async () => {
  for (const invalid of [
    null, {}, { ...profile, id: undefined }, { ...profile, id: 0 }, { ...profile, id: 'undefined' },
    { ...profile, name: '' }, { ...profile, email: '' }, { ...profile, role: '' }, { ...profile, is_verified: undefined },
  ]) {
    apiClient.defaults.adapter = async config => response(config,
      config.url === '/login' ? tokens : config.url === '/users/profile' ? { data: invalid } : { data: { is_premium: false } });
    await assert.rejects(signIn(), ProfileLoadError);
    assertLoggedOut();
  }
});

test('profil resmi dengan ID string tetap didukung ketika layanan langganan gagal', async () => {
  apiClient.defaults.adapter = async config => {
    if (config.url === '/login') return response(config, tokens);
    if (config.url === '/users/profile') return response(config, { data: { ...profile, id: '42' } });
    throw failure(config, 503);
  };
  const result = await signIn();
  assert.equal(result.user.id, '42');
  assert.equal(result.user.role, 'Guest');
  assert.equal(result.user.isVerified, false);
  assert.equal(result.user.tier, 'Free');
  assert.equal(result.user.subscriptionUnavailable, true);
});

test('sinkronisasi langganan gagal mempertahankan data terakhir dan menandai status belum diperiksa', async () => {
  const user = { id: '42', role: 'Guest', isPremium: true, premiumExpiresAt: '2199-01-01T00:00:00Z', tier: 'Premium' };
  useAuthStore.getState().login(user, tokens.access_token, tokens.refresh_token);
  apiClient.defaults.adapter = async config => { throw failure(config, 503); };
  await assert.rejects(authService.syncUserSubscription());
  assert.equal(useAuthStore.getState().user.subscriptionUnavailable, true);
  assert.equal(useAuthStore.getState().user.isPremium, true);
  apiClient.defaults.adapter = async config => response(config, { data: { is_premium: false, active_until: null } });
  await authService.syncUserSubscription();
  assert.equal(useAuthStore.getState().user.subscriptionUnavailable, false);
  assert.equal(useAuthStore.getState().user.isPremium, false);
});

test('hasil sinkronisasi akun lama tidak mengubah akun yang sudah berganti', async () => {
  for (const fails of [false, true]) {
    useAuthStore.getState().login({ id: '42', role: 'Guest' }, 'old-token', 'old-refresh');
    let settle;
    let requested;
    const started = new Promise(resolve => { requested = resolve; });
    apiClient.defaults.adapter = config => new Promise((resolve, reject) => {
      settle = () => fails ? reject(failure(config, 503)) : resolve(response(config, { data: { is_premium: true, active_until: '2199-01-01T00:00:00Z' } }));
      requested();
    });
    const pending = authService.syncUserSubscription();
    await started;
    useAuthStore.getState().login({ id: '99', role: 'Guest', isPremium: false }, 'new-token', 'new-refresh');
    settle();
    if (fails) await assert.rejects(pending);
    else await pending;
    assert.equal(useAuthStore.getState().user.id, '99');
    assert.equal(useAuthStore.getState().user.isPremium, false);
    assert.equal(useAuthStore.getState().user.subscriptionUnavailable, undefined);
  }
});

test('kesalahan kredensial dan verifikasi email tetap diteruskan tanpa meminta profil', async () => {
  for (const [status, code] of [[401, 'INVALID_CREDENTIALS'], [403, 'EMAIL_NOT_VERIFIED']]) {
    const urls = [];
    apiClient.defaults.adapter = async config => {
      urls.push(config.url);
      throw failure(config, status, code);
    };
    await assert.rejects(signIn(), error => error.code === code && error.status === status);
    assert.deepEqual(urls, ['/login']);
    assertLoggedOut();
  }
});
