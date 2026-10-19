import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));

test('Threads output includes its manifest resources and only runtime files', async () => {
  const directory = path.join(root, 'build/threads-login-remover');
  const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  const files = manifest.content_scripts.flatMap(script => [...(script.js || []), ...(script.css || [])]);
  for (const file of files) {
    assert.ok(!path.isAbsolute(file) && !file.includes('..'));
    assert.ok((await readFile(path.join(directory, file))).length > 0, file);
  }
  assert.deepEqual((await readdir(directory)).sort(), ['content.js', 'manifest.json']);
  assert.equal(manifest.host_permissions, undefined);
  assert.ok(!JSON.stringify(manifest).includes('<all_urls>'));
});

test('Threads build preserves the directly loadable content script', async () => {
  const source = await readFile(path.join(root, 'extensions/threads-login-remover/content.js'));
  const built = await readFile(path.join(root, 'build/threads-login-remover/content.js'));
  assert.deepEqual(built, source);
});
