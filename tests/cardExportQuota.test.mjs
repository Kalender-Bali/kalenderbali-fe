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

const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');
const { fetchCardExportQuota, authorizeCardExport } = await server.ssrLoadModule('/src/features/share-card/api/cardExportQuota.ts');
const { pendingCardExport } = await server.ssrLoadModule('/src/features/share-card/utils/cardExportOperation.ts');
const { ShareCardActions } = await server.ssrLoadModule('/src/features/share-card/components/ShareCardActions.tsx');

const quota = { date: '2026-11-19', timezone: 'Asia/Makassar', used: 2, limit: 2, remaining: 0, resets_at: '2026-11-20T00:00:00+08:00', is_unlimited: false };
const operationId = '00000000-0000-4000-8000-000000000001';

test('kuota kartu memakai kontrak Go dan mengenali penolakan 409', async (t) => {
  const adapter = apiClient.defaults.adapter;
  t.after(() => { apiClient.defaults.adapter = adapter; });
  const signal = new AbortController().signal;
  const requests = [];
  apiClient.defaults.adapter = async (config) => {
    requests.push([config.method, config.url, config.data && JSON.parse(config.data)]);
    assert.equal(config.signal, signal);
    assert.equal(config.headers.Authorization, 'Bearer sesi-uji');
    const status = config.method === 'post' ? 409 : 200;
    assert.equal(config.validateStatus(status), true);
    return { config, status, statusText: '', headers: {}, data: { data: quota, code: 'daily_card_limit_reached' } };
  };
  assert.deepEqual(await fetchCardExportQuota('sesi-uji', signal), quota);
  assert.deepEqual(await authorizeCardExport('sesi-uji', operationId, signal), { allowed: false, quota });
  assert.deepEqual(requests, [
    ['get', '/users/card-export-quota', undefined],
    ['post', '/users/card-exports', { operation_id: operationId }],
  ]);
});

test('retry PNG yang sama mempertahankan ID operasi sampai izin dikonfirmasi', async () => {
  const file = new File(['PNG sintetis'], 'uji.png', { type: 'image/png' });
  const pending = await pendingCardExport(file, 'akun-a');
  assert.match(pending.id, /^[0-9a-f-]{36}$/i);
  assert.equal((await pendingCardExport(file, 'akun-a')).id, pending.id);
  assert.notEqual((await pendingCardExport(file, 'akun-b')).id, pending.id);
  pending.clear();
  assert.notEqual((await pendingCardExport(file, 'akun-a')).id, pending.id);
});

function renderActions(imageQuota) {
  const actions = {
    busy: false, fileReady: true, shareImageAvailable: true, shareTextAvailable: false,
    hasText: true, encodeFailed: false, notice: null, run() {}, retry() {},
    imageQuota: { loading: false, error: false, refetch() {}, ...imageQuota },
  };
  return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/rubrik-dewasa/21'] }, React.createElement(ShareCardActions, { actions })));
}

test('pengunjung tetap dapat menyalin teks sedangkan ekspor gambar meminta login', () => {
  const html = renderActions({ signedIn: false });
  assert.match(html, /href="\/login"[^>]*>Masuk untuk mengekspor kartu gambar/);
  const buttons = html.match(/<button[\s\S]*?<\/button>/g);
  assert.match(buttons.find((button) => button.includes('Unduh PNG')), /disabled=""/);
  assert.match(buttons.find((button) => button.includes('Bagikan Gambar')), /disabled=""/);
  assert.doesNotMatch(buttons.find((button) => button.includes('Salin Teks')), /disabled=""/);
});

test('editor menampilkan sisa serta status tanpa batas sesuai respons Go', () => {
  assert.match(renderActions({ signedIn: true, status: quota }), /Sisa kartu hari ini 0 dari 2/);
  assert.match(renderActions({ signedIn: true, status: { ...quota, is_unlimited: true } }), /Ekspor gambar tanpa batas/);
});
