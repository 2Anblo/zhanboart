import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import matter from 'gray-matter';
const require = createRequire(import.meta.url);

test('activity images preserve ownership, reject limits and roll back uploads', async () => {
  let saved = '', existing = '', failWrite = false;
  const deleted = [], uploaded = [];
  class PutObjectCommand { constructor(input) { this.input = input; } }
  class DeleteObjectCommand { constructor(input) { this.input = input; } }
  class S3Client { async send(command) { (command instanceof PutObjectCommand ? uploaded : deleted).push(command.input.Key); } }
  const env = { GITHUB_OWNER: 'test', GITHUB_REPO: 'test', GITHUB_TOKEN: 'mock', CLOUDFLARE_ACCOUNT_ID: 'mock', CLOUDFLARE_R2_BUCKET: 'mock', CLOUDFLARE_R2_PUBLIC_URL: 'https://media.example.com', CLOUDFLARE_R2_ACCESS_KEY_ID: 'mock', CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'mock' };
  let model;
  function load(file) {
    const exports = {};
    const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(code, { exports, Buffer, File, FormData, URL, Date, process: { env }, require: (name) => name === '@/lib/content-model' ? model : name === '@aws-sdk/client-s3' ? { S3Client, PutObjectCommand, DeleteObjectCommand } : require(name), fetch: async (url, init) => {
      if (init.method === 'PUT') { if (failWrite) return new Response('failed', { status: 500 }); saved = Buffer.from(JSON.parse(init.body).content, 'base64').toString(); return Response.json({}); }
      if (init.method === 'DELETE') return Response.json({});
      return Response.json(url.includes('.md') ? { name: 'test.md', content: Buffer.from(existing).toString('base64'), sha: 'mock' } : []);
    } });
    return exports;
  }
  model = load('../src/lib/content-model.ts');
  const lib = load('../src/lib/online-photo-admin.ts');
  function form(count = 0, retained = []) {
    const data = new FormData(); data.set('type', 'notes'); data.set('slug', 'test'); data.set('body', 'hello'); data.set('retainedImages', JSON.stringify(retained));
    for (let i = 0; i < count; i++) data.append('imageFiles', new File(['image'], `${i}.png`, { type: 'image/png' }));
    return data;
  }
  await lib.saveRemoteContent(form(3));
  const original = matter(saved).data;
  assert.equal(original.images.length, 3); assert.equal(original.image, original.images[0]); assert.equal(original.imageR2Keys.length, 3);
  existing = saved;
  await lib.saveRemoteContent(form(1, [original.images[1]]), { type: 'notes', slug: 'test' });
  const edited = matter(saved).data;
  assert.equal(edited.images.length, 2); assert.equal(edited.images[0], original.images[1]);
  assert.deepEqual(deleted.sort(), [original.imageR2Keys[0], original.imageR2Keys[2]].sort());
  assert.equal(edited.date, original.date);
  await assert.rejects(lib.saveRemoteContent(form(10)), /9/);
  await assert.rejects(lib.saveRemoteContent(form(0, ['https://unowned.example/x.png'])), /无效/);
  const oversized = form(); oversized.append('imageFiles', new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }));
  await assert.rejects(lib.saveRemoteContent(oversized), /4 MB/);
  const before = deleted.length; failWrite = true;
  await assert.rejects(lib.saveRemoteContent(form(2)), /GitHub API/);
  assert.equal(deleted.length, before + 2);
  failWrite = false; existing = saved; deleted.length = 0;
  await lib.deleteRemoteContent('notes', 'test');
  assert.deepEqual(deleted.sort(), edited.imageR2Keys.sort());
  existing = matter.stringify('legacy', { image: 'https://media.example.com/old.png', imageR2Key: 'old-key', date: '2026-01-01' });
  await lib.saveRemoteContent(form(0, ['https://media.example.com/old.png']), { type: 'notes', slug: 'test' });
  assert.deepEqual(matter(saved).data.images, ['https://media.example.com/old.png']);
});
