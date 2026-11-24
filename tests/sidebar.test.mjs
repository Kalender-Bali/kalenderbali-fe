import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});
after(() => server.close());

const { default: Sidebar } = await server.ssrLoadModule('/src/components/layout/Sidebar.tsx');
const { useAuthStore } = await server.ssrLoadModule('/src/stores/useAuthStore.ts');
const { useSidebarStore } = await server.ssrLoadModule('/src/stores/useSidebarStore.ts');

const commonLabels = [
  'Dashboard', 'Kalender Bali', 'Layanan', 'Pengingat', 'Asisten Pintar',
  'Kelola Pura', 'Komunitas', 'Warta Budaya', 'Keterangan',
];

for (const [tier, role] of [['Anonim', null], ['Free', 'Guest'], ['Premium', 'Guest'], ['Admin', 'Admin']]) {
  test(`urutan sidebar untuk ${tier}`, t => {
    const auth = useAuthStore.getInitialState();
    const sidebar = useSidebarStore.getInitialState();
    const savedAuth = { ...auth };
    const savedSidebar = { ...sidebar };
    t.after(() => { Object.assign(auth, savedAuth); Object.assign(sidebar, savedSidebar); });

    Object.assign(auth, { isAuthenticated: role !== null, user: role ? { role, tier } : null });
    sidebar.openMenus = { 'Manajemen User': true };

    const html = renderToStaticMarkup(React.createElement(MemoryRouter, null,
      React.createElement(Sidebar, { sidebarRef: React.createRef() })));
    const nav = html.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/)[1];
    const labels = [...nav.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/g)]
      .filter(([, tag, content]) => tag === 'button' || content.includes('<span'))
      .map(([, , content]) => content.replace(/<[^>]*>/g, ''));

    if (tier === 'Admin') {
      assert.deepEqual(labels, [...commonLabels, 'Administrasi']);
      assert.doesNotMatch(nav, /<hr\b/, 'Menu Administrasi langsung mengikuti Keterangan');
      const adminSection = nav.split('</button>').at(-1);
      assert.doesNotMatch(adminSection, /\binert=""/, 'Preferensi submenu yang tersimpan tetap dipakai');
      const links = [...adminSection.matchAll(/href="(\/admin\/[^"]+)"[^>]*>([^<]+)<\/a>/g)]
        .map(([, href, label]) => [href, label]);
      assert.deepEqual(links, [
        ['/admin/users', 'Pengguna'],
        ['/admin/transaksi', 'Transaksi User'],
        ['/admin/kontribusi', 'Pengajuan Kontribusi'],
        ['/admin/chatbot', 'Pengelolaan Chatbot'],
      ]);
    } else {
      assert.deepEqual(labels, commonLabels);
      assert.doesNotMatch(nav, /href="\/admin\//);
    }
  });
}
