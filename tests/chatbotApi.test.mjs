import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import { createServer } from 'vite';
const server = await createServer({ configFile: false, resolve: { alias: { '@': `${process.cwd()}/src` } }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
const { sendChat } = await server.ssrLoadModule('/src/features/chatbot/api/chatApi.ts');
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
