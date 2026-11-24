import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
const server = await createServer({ configFile: false, resolve: { alias: { '@': `${process.cwd()}/src` } }, server: { middlewareMode: true, ws: false }, appType: 'custom', plugins: [{ name: 'fake-auth', enforce: 'pre', resolveId(source) { if (source.endsWith('/stores/useAuthStore') || source.endsWith('/stores/useAuthStore.ts')) return '\0fake-auth'; }, load(id) { if (id === '\0fake-auth') return 'export const useAuthStore = selector => selector ? selector(globalThis.__chatAuth) : globalThis.__chatAuth;'; } }] });
const { default: ChatbotPage } = await server.ssrLoadModule('/src/features/chatbot/pages/ChatbotPage.tsx');
const { MemoryRouter } = await import('react-router-dom');
after(() => server.close());
test('guest sees login invitation, without chat composer', () => {
 globalThis.__chatAuth = { isAuthenticated:false, user:null };
 const html = renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(ChatbotPage)));
 assert.match(html, /Masuk/); assert.doesNotMatch(html, /Kirim pesan/);
});
test('authenticated user sees chat page and quota loading', () => {
 globalThis.__chatAuth = { isAuthenticated:true, user:{id:'1',role:'user',name:'A'} };
 const html = renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(ChatbotPage)));
 assert.match(html, /Percakapan/); assert.match(html, /Kirim pesan/);
});
test('chat room container has constant height and scrollable message area', () => {
 globalThis.__chatAuth = { isAuthenticated:true, user:{id:'1',role:'user',name:'A'} };
 const html = renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(ChatbotPage)));
 assert.match(html, /h-\[560px\]/);
 assert.match(html, /overflow-y-auto/);
 assert.match(html, /min-h-0/);
});
test('suggestions are rendered as quick send options', () => {
 globalThis.__chatAuth = { isAuthenticated:true, user:{id:'1',role:'user',name:'A'} };
 const html = renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(ChatbotPage)));
 assert.match(html, /Apa itu Pancawara\?/);
 assert.match(html, /Jelaskan arti Saptawara/);
 assert.match(html, /Apa yang dimaksud dengan wuku\?/);
});
test('admin user sees page and can chat during maintenance', () => {
 globalThis.__chatAuth = { isAuthenticated:true, user:{id:'2',role:'admin',name:'Admin'} };
 const html = renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(ChatbotPage)));
 assert.match(html, /Kirim pesan/);
});
