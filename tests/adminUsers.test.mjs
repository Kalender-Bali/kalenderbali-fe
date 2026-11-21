import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { IsRestoringProvider, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  cacheDir: `/tmp/admin-user-tests-${process.pid}`,
  optimizeDeps: { noDiscovery: true, include: [] },
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});
after(() => server.close());
const { default: AdminUserPage } = await server.ssrLoadModule('/src/features/admin/pages/AdminUserPage.tsx');
const { authQueryScope, useAuthStore } = await server.ssrLoadModule('/src/stores/useAuthStore.ts');

test('daftar admin membatasi halaman pertama dan memberi navigasi serta nama kontrol', (t) => {
  const session = { isAuthenticated: true, user: { id: '1', role: 'Admin' }, token: 'admin-test' };
  const client = new QueryClient();
  client.setQueryData(['admin', 'members', authQueryScope(session)], Array.from({ length: 26 }, (_, index) => ({
    id: String(index + 1), name: `User-${index + 1}`, email: `user-${index + 1}@example.test`, role: 'Member', is_verified: true,
  })));
  // The server snapshot normally starts signed out.
  const snapshot = useAuthStore.getInitialState();
  const initialState = { ...snapshot };
  Object.assign(snapshot, session);
  t.after(() => { Object.assign(snapshot, initialState); client.clear(); });

  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
    React.createElement(IsRestoringProvider, { value: true }, React.createElement(AdminUserPage))));

  assert.equal((html.match(/<tbody[^>]*>(.*?)<\/tbody>/)?.[1].match(/<tr\b/g) ?? []).length, 25);
  assert.match(html, /User-25/);
  assert.doesNotMatch(html, /User-26/);
  assert.match(html, /Menampilkan 1–25 dari 26 pengguna/);
  assert.match(html, /Berikutnya/);
  assert.match(html, /<input[^>]*aria-label="Cari pengguna[^>]*>/);
  assert.match(html, /role="region" aria-label="Tabel pengguna" tabindex="0"/);
});
