import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  resolve: { alias: { '@': `${process.cwd()}/src` } },
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
});

const { ChatMessageContent } = await server.ssrLoadModule(
  '/src/features/chatbot/components/ChatMessageContent.tsx'
);

after(() => server.close());

test('renders markdown table with styled thead and rows', () => {
  const content = `
| Umur | Nilai | Keterangan |
|---|---|---|
| 0–6 | 4 | baik sekali |
| 19–24 | 1 | penghasilan sedikit (saat ini) |
| 43–48 | 7 | hidup mewah |
`;
  const html = renderToStaticMarkup(React.createElement(ChatMessageContent, { content }));
  assert.match(html, /<table/);
  assert.match(html, /<thead/);
  assert.match(html, /Umur/);
  assert.match(html, /Nilai/);
  assert.match(html, /Keterangan/);
  assert.match(html, /0–6/);
  // Score badge check: 4 should have teal badge, 1 rose badge, 7 emerald badge
  assert.match(html, /bg-teal-100/);
  assert.match(html, /bg-rose-100/);
  assert.match(html, /bg-emerald-100/);
  // Active row highlight check
  assert.match(html, /border-l-teal-600/);
});

test('renders headings, lists, bold and blockquote', () => {
  const content = `
### Ringkasan Data
- Umur: 21 tahun
- Urip: 8

> Catatan penting dari wariga

**Teks tebal** dan biasa.
`;
  const html = renderToStaticMarkup(React.createElement(ChatMessageContent, { content }));
  assert.match(html, /Ringkasan Data/);
  assert.match(html, /<ul/);
  assert.match(html, /<li/);
  assert.match(html, /<blockquote/);
  assert.match(html, /<strong/);
  assert.match(html, /Teks tebal/);
});

test('handles raw text without markdown gracefully', () => {
  const content = 'Halo, apa kabar?';
  const html = renderToStaticMarkup(React.createElement(ChatMessageContent, { content }));
  assert.match(html, /Halo, apa kabar\?/);
});
