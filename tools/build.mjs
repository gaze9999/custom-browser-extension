import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'extensions/threads-login-remover');
const output = path.join(root, 'build/threads-login-remover');
const files = ['manifest.json', 'content.js'];

async function build() {
  const manifest = JSON.parse(await readFile(path.join(source, 'manifest.json'), 'utf8'));
  await mkdir(output, { recursive: true });
  await Promise.all(files.map(file => copyFile(path.join(source, file), path.join(output, file))));
  console.log(`Built Threads login remover ${manifest.version}: build/threads-login-remover`);
}

await build();
if (process.argv.includes('--watch')) {
  let pending = Promise.resolve();
  const watcher = watch(source, (_event, filename) => {
    if (!files.includes(String(filename))) return;
    pending = pending.then(build).catch(error => { console.error(error); process.exitCode = 1; });
  });
  const stop = async () => { watcher.close(); await pending; };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  console.log('Watching Threads sources; reload the extension and page after changes');
}
