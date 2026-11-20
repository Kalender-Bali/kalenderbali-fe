import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
const server = await createServer({ configFile: false, server: { middlewareMode: true, ws: false }, appType: 'custom' });
const { readChatStream } = await server.ssrLoadModule('/src/features/chatbot/api/stream.ts');
after(() => server.close());
function body(chunks) { return new ReadableStream({ start(controller) { for (const chunk of chunks) controller.enqueue(chunk); controller.close(); } }); }
const encoder = new TextEncoder();
test('SSE parses fragmented UTF-8, progress and complete answer', async () => {
  const bytes = encoder.encode('event: status\ndata: {"stage":"searching"}\n\nevent: answer\ndata: {"answer":"Purnama 🌕","usage":{"total_tokens":20},"error":null}\n\n');
  const split = bytes.indexOf(240) + 2; const stages = [];
  const result = await readChatStream(body([bytes.slice(0, 11), bytes.slice(11, split), bytes.slice(split)]), item => stages.push(item.stage));
  assert.deepEqual(stages, ['searching']); assert.equal(result.answer, 'Purnama 🌕');
});
test('SSE refuses truncated stream and propagates safe error', async () => {
  await assert.rejects(readChatStream(body([encoder.encode('event: answer\ndata: {"answer":"part')]), () => {}), /terputus/);
  await assert.rejects(readChatStream(body([encoder.encode('event: error\ndata: {"error":{"code":"GO_UNAVAILABLE","message":"Sistem bermasalah"}}\n\n')]), () => {}), /Sistem bermasalah/);
});
