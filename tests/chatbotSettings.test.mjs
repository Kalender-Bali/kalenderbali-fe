import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
const server = await createServer({ configFile:false, server:{ middlewareMode:true, ws:false }, appType:'custom' });
const { parseSettings } = await server.ssrLoadModule('/src/features/admin/chatSettings.ts');
after(() => server.close());
const valid = { premium_daily_tokens:'24000', admin_daily_tokens:'36000' };
test('settings parser sends only daily account quotas and maintenance', () => {
  assert.deepEqual(parseSettings(valid, true), { maintenance:true, premium_daily_tokens:24000, admin_daily_tokens:36000 });
});
test('rejects missing, zero, negative, noninteger or overflow limits', () => {
  for (const value of ['', '0', '-1', '1.2', '2147483648']) assert.throws(() => parseSettings({ ...valid, admin_daily_tokens:value }, false));
});
