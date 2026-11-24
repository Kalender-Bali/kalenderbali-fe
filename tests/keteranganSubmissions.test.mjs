import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ configFile: false, cacheDir: `/tmp/keterangan-submission-${process.pid}`, optimizeDeps: { noDiscovery: true, include: [] }, resolve: { alias: { '@': `${process.cwd()}/src` } }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
const api = await server.ssrLoadModule('/src/features/keterangan/api/keteranganSubmissionApi.ts');
const { apiClient } = await server.ssrLoadModule('/src/lib/axios.ts');
const original = apiClient.defaults.adapter;
after(async () => { apiClient.defaults.adapter = original; await server.close(); });

test('pengajuan dan review memakai ID string dan rute hak akses yang tepat', async () => {
  const requests = [];
  apiClient.defaults.adapter = async config => {
    requests.push(config);
    return { config, data: { data: [], total: 0 }, status: 200, statusText: 'OK', headers: {} };
  };
  await api.submitKeterangan('9007199254740993', 'Keterangan baru');
  await api.fetchKeteranganSubmissions(false, 2);
  await api.fetchKeteranganSubmissions(true, 1);
  await api.reviewKeterangan('9007199254740995', false, 'Perlu sumber');
  assert.deepEqual(JSON.parse(requests[0].data), { value_id: '9007199254740993', description: 'Keterangan baru' });
  assert.equal(requests[1].url, '/keterangan/submissions');
  assert.equal(requests[1].params.page, 2);
  assert.equal(requests[2].url, '/admin/keterangan/submissions');
  assert.equal(requests[3].url, '/admin/keterangan/submissions/9007199254740995');
  assert.deepEqual(JSON.parse(requests[3].data), { approve: false, review_note: 'Perlu sumber' });
});
