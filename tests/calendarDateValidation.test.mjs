import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false, resolve: { alias: { '@': `${process.cwd()}/src` } },
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, ws: false }, appType: 'custom',
});
after(() => server.close());
const { isValidISODate, getTodayWITA } = await server.ssrLoadModule('/src/features/kalender/utils/calendarUtils.ts');
const { default: CalendarPage } = await server.ssrLoadModule('/src/features/kalender/pages/CalendarPage.tsx');

test('tanggal tidak ada, tahun nonkabisat, dan format URL yang keliru ditolak', () => {
  for (const date of [
    '2026-02-30', '2026-02-29', '1900-02-29', '2100-02-29',
    '2026-04-31', '2026-06-31', '2026-09-31', '2026-11-31', '2026-01-32',
    '2026-00-01', '2026-13-01', '2026-01-00', '0000-01-01',
    '', '2026-2-03', '2026-02-3', '30/02/2026', '2026-02-28T00:00:00Z', ' 2026-02-28', '2026-02-28\n',
  ]) assert.equal(isValidISODate(date), false, date);
  for (const date of ['2026-02-28', '2024-02-29', '2000-02-29', '2026-04-30', '2026-12-31']) {
    assert.equal(isValidISODate(date), true, date);
  }
});

test('validasi sipil cocok dengan kalender Gregorian pada seluruh tahun API 1800–2200', () => {
  for (let year = 1800; year <= 2200; year++) {
    for (let month = 1; month <= 12; month++) {
      for (let day = 0; day <= 32; day++) {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const expected = new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === date;
        assert.equal(isValidISODate(date), expected, date);
      }
    }
  }
});

test('URL tanggal tidak valid berhenti sebelum hook data dan panel kalender dijalankan', () => {
  for (const date of ['2026-02-30', '2026-02-29', '2100-02-29', '2026-13-01', '2026-04-31', '', 'invalid']) {
    // Deliberately no QueryClientProvider: mounting calendar data hooks here
    // would throw instead of rendering the input validation state.
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, {
      initialEntries: [`/kalender?date=${encodeURIComponent(date)}`],
    }, React.createElement(CalendarPage)));
    assert.match(html, /Tanggal kalender tidak valid/);
    assert.match(html, /Buka kalender hari ini/);
    assert.doesNotMatch(html, /30 Februari|Detail tanggal|Unduh \.ics|Piodalan hari ini/);
  }
});

test('tanggal valid, tahun kabisat, dan URL tanpa parameter tetap membuka kalender', () => {
  for (const date of ['2026-02-28', '2024-02-29', '2000-02-29', null]) {
    const selected = date ?? getTodayWITA();
    const year = Number(selected.slice(0, 4));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: Infinity } } });
    client.setQueryData(['kalender', year], []);
    client.setQueryData(['piodalan', 'puras', 'all'], []);
    try {
      const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(MemoryRouter, {
        initialEntries: [date ? `/kalender?date=${date}` : '/kalender'],
      }, React.createElement(CalendarPage))));
      assert.doesNotMatch(html, /Tanggal kalender tidak valid/);
      assert.match(html, /Detail tanggal/);
      assert.match(html, /Unduh \.ics/);
      assert.ok(html.includes(`>${Number(selected.slice(8, 10))}</span>`), selected);
    } finally { client.clear(); }
  }
});
