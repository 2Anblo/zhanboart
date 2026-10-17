import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

test('quick publishing keeps every request below the proxy limit for a 31 MB photo', async () => {
  const source = readFileSync('app/admin/page.tsx', 'utf8');
  const start = source.indexOf('  async function publishQuickJournal(');
  const end = source.indexOf('\n  async function handleAssetUpload', start);
  const requests = [];
  const fetch = async (url, options) => {
    const body = options.body;
    const bytes = body instanceof FormData
      ? [...body.values()].reduce((n, v) => n + (typeof v === 'string' ? v.length : v.size), 0)
      : typeof body === 'string' ? body.length : body?.size || 0;
    requests.push({ url, bytes });
    if (bytes > 4.5 * 1024 * 1024) return new Response('Request Entity Too Large', { status: 413 });
    if (url === '/api/admin/content') {
      assert.equal(body.getAll('imageFiles').length, 0);
      assert.equal(body.getAll('uploadedImages').length, 1);
      return Response.json({});
    }
    return Response.json({ token: 'session', receipt: 'receipt' });
  };
  let helpers = {};
  try {
    const code = ts.transpileModule(readFileSync('src/lib/activity-upload-client.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(code, { exports: helpers, fetch, FormData, File, Blob, Response });
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const code = ts.transpileModule(source.slice(start, end) + '\nexports.publish = publishQuickJournal;', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, ...helpers, fetch, FormData, File, setLoading() {}, setMessage() {}, setError() {}, setEntries() {} });
  const form = new FormData(); form.set('type', 'notes');
  form.append('imageFiles', new File([new Uint8Array(31 * 1024 * 1024)], 'large.png', { type: 'image/png' }));
  await exports.publish(form);
  assert.ok(requests.length > 2);
  assert.ok(requests.every(r => r.bytes < 4.5 * 1024 * 1024));
});

function loadClient(fetch) {
  const exports = {};
  const code = ts.transpileModule(readFileSync('src/lib/activity-upload-client.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, fetch, FormData, File, Blob, Response });
  return exports;
}

test('proxy errors become readable messages instead of JSON parser failures', async () => {
  const { readAdminResponse } = loadClient();
  await assert.rejects(readAdminResponse(new Response('Request Entity Too Large', { status: 413 })), /上传请求过大/);
  await assert.rejects(readAdminResponse(new Response('<html>Bad Gateway</html>', { status: 502 })), /HTTP 502/);
  await assert.rejects(readAdminResponse(Response.json({ error: '请先登录' }, { status: 401 })), /请先登录/);
});

test('editing preserves retained images and stages multiple new files without mutating the form', async () => {
  let saved, starts = 0;
  const { saveAdminContent } = loadClient(async (url, options) => {
    if (url === '/api/admin/content/notes/test') { assert.equal(options.method, 'PUT'); saved = options.body; return Response.json({}); }
    if (options.method === 'POST') return Response.json({ token: `token-${++starts}` });
    return Response.json({});
  });
  const form = new FormData(); form.set('type', 'notes'); form.set('retainedImages', '["https://media.example/old.png"]');
  for (let i = 0; i < 2; i++) form.append('imageFiles', new File(['image'], `${i}.png`, { type: 'image/png' }));
  await saveAdminContent('/api/admin/content/notes/test', 'PUT', form);
  assert.equal(saved.get('retainedImages'), form.get('retainedImages'));
  assert.deepEqual(saved.getAll('uploadedImages'), ['token-1', 'token-2']);
  assert.equal(saved.getAll('imageFiles').length, 0);
  assert.equal(form.getAll('imageFiles').length, 2);
});

test('failed chunks are cleaned up and content is never submitted', async () => {
  const methods = [];
  const { saveAdminContent } = loadClient(async (url, options) => {
    assert.equal(url, '/api/admin/activity-uploads'); methods.push(options.method);
    if (options.method === 'POST') return Response.json({ token: 'token' });
    if (options.method === 'PUT') return new Response('Bad Gateway', { status: 502 });
    return Response.json({});
  });
  const form = new FormData(); form.set('type', 'notes'); form.append('imageFiles', new File(['x'], 'x.png', { type: 'image/png' }));
  await assert.rejects(saveAdminContent('/api/admin/content', 'POST', form), /HTTP 502/);
  assert.deepEqual(methods, ['POST', 'PUT', 'DELETE']);
});

test('plain text notes do not create an upload session', async () => {
  let requests = 0;
  const { saveAdminContent } = loadClient(async (url, options) => {
    requests++; assert.equal(url, '/api/admin/content'); assert.equal(options.body.get('body'), 'hello');
    return Response.json({});
  });
  const form = new FormData(); form.set('type', 'notes'); form.set('body', 'hello');
  await saveAdminContent('/api/admin/content', 'POST', form);
  assert.equal(requests, 1);
});
