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
  class GetObjectCommand { constructor(input) { this.input = input; } }
  class CreateMultipartUploadCommand { constructor(input) { this.input = input; } }
  class UploadPartCommand { constructor(input) { this.input = input; } }
  class CompleteMultipartUploadCommand { constructor(input) { this.input = input; } }
  class AbortMultipartUploadCommand { constructor(input) { this.input = input; } }
  const objects = new Map(), multipart = new Map();
  let aborted = 0;
  class S3Client {
    async send(command) {
      const input = command.input;
      if (command instanceof PutObjectCommand) { uploaded.push(input.Key); objects.set(input.Key, input.Body); return {}; }
      if (command instanceof DeleteObjectCommand) { deleted.push(input.Key); objects.delete(input.Key); return {}; }
      if (command instanceof GetObjectCommand) {
        if (!objects.has(input.Key)) throw new Error('missing chunk');
        return { Body: { transformToByteArray: async () => objects.get(input.Key) } };
      }
      if (command instanceof CreateMultipartUploadCommand) { multipart.set(input.Key, []); return { UploadId: input.Key }; }
      if (command instanceof UploadPartCommand) { multipart.get(input.Key).push(input.Body); return { ETag: `part-${input.PartNumber}` }; }
      if (command instanceof CompleteMultipartUploadCommand) {
        const parts = multipart.get(input.Key);
        assert.ok(parts.slice(0, -1).every(part => part.length >= 5 * 1024 * 1024));
        assert.equal(input.MultipartUpload.Parts.length, parts.length);
        objects.set(input.Key, Buffer.concat(parts)); multipart.delete(input.Key); return {};
      }
      if (command instanceof AbortMultipartUploadCommand) { aborted++; multipart.delete(input.Key); return {}; }
      throw new Error('unexpected R2 command');
    }
  }
  const env = { ADMIN_SESSION_SECRET: 'test-only-secret', GITHUB_OWNER: 'test', GITHUB_REPO: 'test', GITHUB_TOKEN: 'mock', CLOUDFLARE_ACCOUNT_ID: 'mock', CLOUDFLARE_R2_BUCKET: 'mock', CLOUDFLARE_R2_PUBLIC_URL: 'https://media.example.com', CLOUDFLARE_R2_ACCESS_KEY_ID: 'mock', CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'mock' };
  let model;
  function load(file) {
    const exports = {};
    const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(code, { exports, Buffer, File, FormData, URL, Date, process: { env }, require: (name) => name === '@/lib/content-model' ? model : name === '@aws-sdk/client-s3' ? { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } : require(name), fetch: async (url, init) => {
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
  const before = deleted.length; failWrite = true;
  await assert.rejects(lib.saveRemoteContent(form(2)), /GitHub API/);
  assert.equal(deleted.length, before + 2);
  failWrite = false; existing = saved; deleted.length = 0;
  await lib.deleteRemoteContent('notes', 'test');
  assert.deepEqual(deleted.sort(), edited.imageR2Keys.sort());
  existing = matter.stringify('legacy', { image: 'https://media.example.com/old.png', imageR2Key: 'old-key', date: '2026-01-01' });
  await lib.saveRemoteContent(form(0, ['https://media.example.com/old.png']), { type: 'notes', slug: 'test' });
  assert.deepEqual(matter(saved).data.images, ['https://media.example.com/old.png']);
  for (const size of [4 * 1024 * 1024 + 1, 30 * 1024 * 1024 + 1]) {
    const largeImage = form();
    largeImage.append('imageFiles', new File([new Uint8Array(size)], 'large.png', { type: 'image/png' }));
    await lib.saveRemoteContent(largeImage);
    assert.equal(matter(saved).data.images.length, 1);
  }
  const chunkSize = 3 * 1024 * 1024;
  const originalBytes = Buffer.alloc(31 * 1024 * 1024 + 7);
  for (let i = 0; i < originalBytes.length; i++) originalBytes[i] = i % 251;
  const token = lib.startActivityUpload('original.png', 'image/png', originalBytes.length);
  await assert.rejects(lib.writeActivityChunk(`${token}tampered`, 0, new File(['x'], 'chunk')), /凭据/);
  await assert.rejects(lib.writeActivityChunk(token, 0, new File(['x'], 'chunk')), /分块/);
  for (let offset = 0; offset < originalBytes.length; offset += chunkSize) {
    await lib.writeActivityChunk(token, offset / chunkSize, new File([originalBytes.subarray(offset, offset + chunkSize)], 'chunk'));
  }
  const staged = form(); staged.set('body', ''); staged.append('uploadedImages', token);
  await lib.saveRemoteContent(staged);
  const publishedKey = matter(saved).data.imageR2Keys[0];
  assert.deepEqual(objects.get(publishedKey), originalBytes);
  assert.equal([...objects.keys()].filter(key => key.includes('.chunks/')).length, 0);
  const incomplete = lib.startActivityUpload('missing.png', 'image/png', chunkSize + 1);
  await lib.writeActivityChunk(incomplete, 0, new File([Buffer.alloc(chunkSize)], 'chunk'));
  const bad = form(); bad.append('uploadedImages', incomplete);
  await assert.rejects(lib.saveRemoteContent(bad), /missing chunk/);
  assert.equal(aborted, 1);
  assert.equal(multipart.size, 0);
  assert.equal([...objects.keys()].filter(key => key.includes('.chunks/')).length, 0);
  const failed = lib.startActivityUpload('rollback.png', 'image/png', 1);
  await lib.writeActivityChunk(failed, 0, new File(['x'], 'chunk'));
  const failedForm = form(); failedForm.append('uploadedImages', failed);
  const keysBefore = [...objects.keys()].sort(); failWrite = true;
  await assert.rejects(lib.saveRemoteContent(failedForm), /GitHub API/);
  assert.deepEqual([...objects.keys()].sort(), keysBefore.filter(key => !key.includes('.chunks/')));
});
