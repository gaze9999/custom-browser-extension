import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));

test('archived DuckDuckGo build contains manifest resources without signing artifacts', async () => {
  const directory = path.join(root, 'build');
  const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
  const files = manifest.content_scripts.flatMap(script => [...(script.js || []), ...(script.css || [])]);
  files.push(manifest.background.service_worker, manifest.action.default_popup, 'static/js/main.js', 'static/js/main.css');
  for (const file of files) {
    assert.ok(!path.isAbsolute(file) && !file.includes('..'));
    assert.ok((await readFile(path.join(directory, file))).length > 0, file);
  }
  for (const file of await readdir(directory, { recursive: true })) {
    assert.ok(!/\.(pem|crx|map)$|node_modules|tests[\\/]/.test(file), file);
  }
});
