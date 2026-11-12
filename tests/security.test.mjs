import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import { createServer } from 'vite';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
const server = await createServer({ configFile: false, resolve: { alias: { '@': `${process.cwd()}/src` } }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
after(async () => { await server.close(); delete globalThis.localStorage; });
const { useAuthStore, authQueryScope } = await server.ssrLoadModule('/src/stores/useAuthStore.ts');
const { queryClient } = await server.ssrLoadModule('/src/lib/queryClient.ts');
const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');
const originalAdapter = apiClient.defaults.adapter;
afterEach(() => { apiClient.defaults.adapter = originalAdapter; useAuthStore.getState().logout(); queryClient.clear(); });
const user = (id) => ({ id, name: id, email: `${id}@example.test`, role: 'Member', isPremium: false });

test('logout and account changes destroy private cache and retain public calendar', async () => {
  useAuthStore.getState().login(user('a'), 'token-a');
  const scopeA = authQueryScope(useAuthStore.getState());
  const key = ['subscription', 'my-purchases', scopeA];
  queryClient.setQueryDefaults(['subscription', 'my-purchases'], { meta: { authScoped: true } });
  queryClient.setQueryData(key, [{ id: 'private-order-a' }]);
  queryClient.setQueryData(['kalender', 2026], ['public-calendar']);
  let complete;
  const pending = queryClient.fetchQuery({ queryKey: ['private-in-flight', scopeA], meta: { authScoped: true }, queryFn: () => new Promise((resolve) => { complete = resolve; }) }).catch(() => undefined);
  useAuthStore.getState().logout();
  assert.equal(queryClient.getQueryData(key), undefined);
  assert.deepEqual(queryClient.getQueryData(['kalender', 2026]), ['public-calendar']);
  complete('late-private-data');
  await pending;
  assert.equal(queryClient.getQueryData(['private-in-flight', scopeA]), undefined);
  useAuthStore.getState().login(user('b'), 'token-b');
  assert.notEqual(authQueryScope(useAuthStore.getState()), scopeA);
  assert.equal(queryClient.getQueryData(key), undefined);
});

test('profile updates keep scope stable, role changes evict private data', () => {
  useAuthStore.getState().login(user('a'), 'token-a');
  const before = authQueryScope(useAuthStore.getState());
  queryClient.setQueryDefaults(['bhagawadgita', 'chapter'], { meta: { authScoped: true } });
  const key = ['bhagawadgita', 'chapter', 3, before];
  queryClient.setQueryData(key, { restricted: false });
  useAuthStore.getState().updateUser({ name: 'New display name' });
  assert.equal(authQueryScope(useAuthStore.getState()), before);
  assert.ok(queryClient.getQueryData(key));
  useAuthStore.getState().updateUser({ role: 'Admin' });
  assert.notEqual(authQueryScope(useAuthStore.getState()), before);
  assert.equal(queryClient.getQueryData(key), undefined);
  assert.ok(!authQueryScope(useAuthStore.getState()).includes('token-a'));
});

test('explicit login token is preserved over an older stored token', async () => {
  useAuthStore.getState().login(user('a'), 'older-token');
  let observed;
  apiClient.defaults.adapter = async (config) => { observed = config; return { data: {}, status: 200, statusText: 'OK', headers: {}, config }; };
  await apiClient.get('/users/profile', { headers: { Authorization: 'Bearer newly-issued-token' } });
  assert.equal(observed.headers.Authorization, 'Bearer newly-issued-token');
  await apiClient.get('/users/profile');
  assert.equal(observed.headers.Authorization, 'Bearer older-token');
});
