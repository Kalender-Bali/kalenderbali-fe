import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
const server = await createServer({ configFile: false, resolve: { alias: { '@': `${process.cwd()}/src` } }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
const { hasActivePremium } = await server.ssrLoadModule('/src/lib/subscription.ts');
const { getUserTier, normalizeUserProfile } = await server.ssrLoadModule('/src/features/auth/services/authService.ts');
const { useAuthStore, authQueryScope } = await server.ssrLoadModule('/src/stores/useAuthStore.ts');
const { queryClient } = await server.ssrLoadModule('/src/lib/queryClient.ts');
const { WarigaPersonalRecommendations } = await server.ssrLoadModule('/src/features/wariga-personal/components/WarigaPersonalRecommendations.tsx');

afterEach(() => { useAuthStore.getState().logout(); queryClient.clear(); });
after(async () => { await server.close(); delete globalThis.localStorage; });

test('paid Guest gets Premium; Member role and stale tier do not grant paid access', () => {
  const future = new Date(Date.now() + 3600000).toISOString();
  const expired = new Date(Date.now() - 1).toISOString();
  const profile = { id: 42, role: 'Guest', name: 'Audit', email: 'audit@example.test', is_verified: true };
  const user = normalizeUserProfile(profile, { is_premium: true, active_until: future });
  assert.equal(user.role, 'Guest');
  assert.equal(user.tier, 'Premium');
  assert.equal(hasActivePremium(user), true);
  assert.equal(getUserTier('Member', false, future), 'Free');
  assert.equal(hasActivePremium({ role: 'Member', tier: 'Premium', isPremium: false, premiumExpiresAt: future }), false);
  assert.equal(getUserTier('Guest', true, expired), 'Free');
  assert.equal(getUserTier('Guest', true, null), 'Free');
  assert.equal(getUserTier('Guest', true, 'invalid'), 'Free');
  assert.equal(getUserTier('Admin', false, null), 'Admin');
});

test('expiry evicts private recommendations with the same user and token', t => {
  const now = Date.UTC(2026, 10, 12);
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now });
  const expires = new Date(now + 1000).toISOString();
  useAuthStore.getState().login({ id: '42', name: 'Audit', email: 'audit@example.test', role: 'Guest', isPremium: true, premiumExpiresAt: expires, tier: 'Premium' }, 'same-token');
  const scope = authQueryScope(useAuthStore.getState());
  const key = ['wariga-personal', scope];
  queryClient.setQueryDefaults(['wariga-personal'], { meta: { authScoped: true } });
  queryClient.setQueryData(key, { recommendations: ['paid-result'] });
  queryClient.setQueryData(['kalender', 2026], ['public-calendar']);
  t.mock.timers.tick(999);
  assert.ok(queryClient.getQueryData(key));
  t.mock.timers.tick(1);
  const current = useAuthStore.getState();
  assert.equal(current.user.isPremium, false);
  assert.equal(current.user.tier, 'Free');
  assert.equal(current.user.role, 'Guest');
  assert.equal(current.token, 'same-token');
  assert.equal(queryClient.getQueryData(key), undefined);
  assert.deepEqual(queryClient.getQueryData(['kalender', 2026]), ['public-calendar']);
  assert.notEqual(authQueryScope(current), scope);
});

test('empty recommendations for an entitled user do not show an upgrade prompt', () => {
  const render = isLimited => renderToStaticMarkup(React.createElement(WarigaPersonalRecommendations, { recommendations: [], isLimited, onSelectDate() {}, onOpenUpgradeModal() {} }));
  assert.match(render(false), /Tidak ada rekomendasi/);
  assert.doesNotMatch(render(false), /Buka Rekomendasi|Khusus Premium/);
  assert.match(render(true), /Khusus Premium/);
});
