import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import { createServer } from 'vite';
const server = await createServer({ configFile: false, resolve: { alias: { '@': `${process.cwd()}/src` } }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
const { chatApi, sendChat } = await server.ssrLoadModule('/src/features/chatbot/api/chatApi.ts');
const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');
const { useAuthStore } = await server.ssrLoadModule('/src/stores/useAuthStore.ts');
const original = globalThis.fetch;
afterEach(() => { globalThis.fetch = original; useAuthStore.getState().logout(); });
after(() => server.close());
test('sendChat sends the current token and operation once', async () => {
  useAuthStore.getState().login({ id:'1', name:'A', email:'a@b.c', role:'admin' }, 'access');
  let count = 0; globalThis.fetch = async (url, options) => { count++; assert.match(String(url), /\/chat$/); assert.equal(options.headers.Authorization, 'Bearer access'); assert.deepEqual(JSON.parse(options.body), { room_id: 4, operation_id: 'operation-1', message:'Halo' }); return new Response('event: answer\ndata: {"answer":"Halo"}\n\n', { headers: { 'Content-Type':'text/event-stream' } }); };
  const result = await sendChat(4, 'operation-1', 'Halo', new AbortController().signal, () => {});
  assert.equal(result.answer, 'Halo'); assert.equal(count, 1);
});
test('sendChat surfaces premium and quota errors', async () => {
  useAuthStore.getState().login({ id:'1', name:'A', email:'a@b.c', role:'user' }, 'access');
  globalThis.fetch = async () => new Response(JSON.stringify({ code:'PREMIUM_REQUIRED', error:'Premium diperlukan' }), { status:403, headers:{'Content-Type':'application/json'} });
  await assert.rejects(sendChat(1, 'operation-1', 'Halo', new AbortController().signal, () => {}), error => error.code === 'PREMIUM_REQUIRED' && error.message === 'Premium diperlukan');
});
test('network failure is explained in Indonesian', async () => {
  useAuthStore.getState().login({ id:'1', name:'A', email:'a@b.c', role:'user' }, 'access');
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(sendChat(1, 'operation-1', 'Halo', new AbortController().signal, () => {}), /Koneksi/);
});

test('dev chat skips its deadline but still honors cancellation', async () => {
  useAuthStore.getState().login({ id:'1', name:'A', email:'a@b.c', role:'admin' }, 'access');
  const abort = new AbortController();
  const previousSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (callback, delay, ...args) => {
    assert.notEqual(delay, 55000);
    return previousSetTimeout(callback, delay, ...args);
  };
  globalThis.fetch = async (_url, { signal }) => {
    abort.abort();
    assert.equal(signal.aborted, true);
    throw signal.reason;
  };
  try {
    await assert.rejects(sendChat(1, 'operation-dev', 'Halo', abort.signal, () => {}, true), { name: 'AbortError' });
  } finally {
    globalThis.setTimeout = previousSetTimeout;
  }
});

test('renameRoom sends PUT to /chat/rooms/:id with trimmed title', async () => {
  let captured;
  const previousAdapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = async config => {
    captured = config;
    return { data: { data: { id: 7, title: 'Topik Baru', created_at: '2026-11-24T00:00:00Z', expires_at: null } }, status: 200, statusText: 'OK', headers: {}, config };
  };
  try {
    const updated = await chatApi.renameRoom(7, 'Topik Baru');
    assert.equal(captured.method, 'put');
    assert.equal(captured.url, '/chat/rooms/7');
    assert.deepEqual(JSON.parse(captured.data), { title: 'Topik Baru' });
    assert.equal(updated.title, 'Topik Baru');
  } finally {
    apiClient.defaults.adapter = previousAdapter;
  }
});
