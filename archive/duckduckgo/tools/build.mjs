import assert from 'node:assert/strict';
import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import * as sass from 'sass';

const root = fileURLToPath(new URL('../', import.meta.url));
const watching = process.argv.includes('--watch');
const duckduckgo = root;
const output = path.join(root, 'build');

async function copyAssets() {
  const metadata = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(duckduckgo, 'public/manifest.json'), 'utf8'));
  assert.equal(manifest.version, metadata.version, 'DuckDuckGo manifest and package versions must match');
  await mkdir(output, { recursive: true });
  await Promise.all([
    ...['manifest.json', 'index.html'].map(file => copyFile(path.join(duckduckgo, 'public', file), path.join(output, file))),
  ]);
}

const options = {
  absWorkingDir: root,
  entryPoints: {
    main: 'src/index.tsx',
    background: 'src/background.ts',
    'ddg-search': 'src/content.ts',
    'ddg-search-style': 'src/content.sass',
  },
  outdir: path.join(output, 'static/js'),
  bundle: true,
  splitting: false,
  format: 'iife',
  target: ['chrome120', 'edge120'],
  jsx: 'automatic',
  minify: !watching,
  sourcemap: watching ? 'linked' : false,
  define: { 'process.env.NODE_ENV': JSON.stringify(watching ? 'development' : 'production') },
  logLevel: 'info',
  plugins: [
    {
      name: 'sass',
      setup(build) {
        build.onLoad({ filter: /\.sass$/ }, async args => {
          const result = await sass.compileAsync(args.path, { style: 'compressed' });
          return {
            contents: result.css,
            loader: 'css',
            resolveDir: path.dirname(args.path),
            watchFiles: result.loadedUrls.filter(url => url.protocol === 'file:').map(fileURLToPath),
          };
        });
      },
    },
    {
      name: 'extension-assets',
      setup(build) {
        build.onEnd(async result => {
          if (result.errors.length === 0) await copyAssets();
        });
      },
    },
  ],
};

if (watching) {
  const context = await esbuild.context(options);
  await context.watch();
  const watchers = [path.join(duckduckgo, 'public')].map(directory =>
    watch(directory, (_event, filename) => {
      if (filename && ['manifest.json', 'index.html'].includes(String(filename))) {
        void copyAssets().catch(console.error);
      }
    }));
  const stop = async () => {
    watchers.forEach(watcher => watcher.close());
    await context.dispose();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  console.log('Watching extension sources; reload the extension and page after changes');
} else {
  const directory = path.join(output, 'static/js');
  for (const filename of ['main.js', 'main.css', 'background.js', 'ddg-search.js', 'ddg-search-style.css']) {
    const sourcemap = path.resolve(directory, `${filename}.map`);
    assert.equal(path.dirname(sourcemap), directory);
    await rm(sourcemap, { force: true });
  }
  await esbuild.build(options);
}
