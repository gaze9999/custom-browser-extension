import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const profile = await mkdtemp(path.join(os.tmpdir(), 'duckduckgo-extension-'));
const fixture = `<!doctype html><html class="set-wide"><head><title>DuckDuckGo fixture</title></head><body>
  <div id="header_wrapper"><div id="header"><div class="header__search-wrap">Search</div>
  <div class="header--aside"><div class="header--aside__item">Share</div></div></div></div>
  <div id="links_wrapper"><main class="results--main">Synthetic search result</main>
  <aside class="results--sidebar">Sidebar</aside></div><button id="keep">Keep</button>
  </body></html>`;
let context;
let session;
let passed = 0;

async function check(name, run) {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
}

try {
  context = await chromium.launchPersistentContext(profile, {
    headless: true,
    channel: 'chromium',
    executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: ['--enable-unsafe-extension-debugging'],
    viewport: { width: 1280, height: 720 },
  });
  session = await context.browser().newBrowserCDPSession();
  const { id } = await session.send('Extensions.loadUnpacked', { path: path.join(root, 'build') });
  assert.ok(id);
  const extensionURL = `chrome-extension://${id}/`;
  await context.route('https://duckduckgo.com/**', route =>
    route.fulfill({ contentType: 'text/html', body: fixture }));
  await context.route('https://example.com/**', route =>
    route.fulfill({ contentType: 'text/html', body: fixture }));
  const page = context.pages()[0];
  const errors = [];
  context.on('weberror', error => errors.push(error.error().message));
  await page.goto('https://duckduckgo.com/?q=fixture');

  await check('content script removes existing and renewed header items', async () => {
    await page.waitForFunction(() => document.querySelectorAll('.header--aside__item').length === 0);
    await page.locator('.header--aside').evaluate(element => {
      element.innerHTML = '<div class="header--aside__item">Renewed share</div>';
    });
    await page.waitForFunction(() => document.querySelectorAll('.header--aside__item').length === 0);
    assert.equal(await page.locator('#keep').isVisible(), true);
  });

  await check('manifest CSS applies the existing wide search layout', async () => {
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.results--main')).maxWidth === '896px');
    assert.equal(await page.locator('#links_wrapper').evaluate(element => getComputedStyle(element).display), 'flex');
  });

  let popup;
  await check('built React popup page and background worker load as extension resources', async () => {
    popup = await context.newPage();
    await popup.goto(`${extensionURL}index.html`);
    await popup.getByRole('button', { name: 'click me', exact: true }).waitFor();
    assert.equal(await popup.locator('header').innerText(), 'G Custom Extension Pack');
    assert.equal(await popup.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(40, 34, 40)');
    assert.equal(await popup.evaluate(() => chrome.action.getBadgeText({})), 'LOL');
    await mkdir(path.join(root, 'test-results'), { recursive: true });
    await popup.screenshot({ path: path.join(root, 'test-results/duckduckgo-popup.png') });
  });

  await check('popup keyboard action receives background and tab responses exactly once', async () => {
    const logs = [];
    popup.on('console', message => logs.push({ type: message.type(), text: message.text() }));
    const tabResponse = popup.waitForEvent('console', { predicate: message => message.text().startsWith('tab ') });
    await page.bringToFront();
    await popup.getByRole('button', { name: 'click me' }).focus();
    await popup.keyboard.press('Enter');
    await tabResponse;
    assert.equal(logs.filter(log => log.text.startsWith('background ')).length, 1);
    assert.equal(logs.filter(log => log.text.startsWith('tab ')).length, 1);
    assert.equal(logs.filter(log => log.type === 'error').length, 0);
  });

  await check('unsupported messages receive no successful response', async () => {
    const result = await popup.evaluate(async () => {
      try { return await chrome.runtime.sendMessage({ type: 'GET_DOM', from: 'popup runtime' }); }
      catch { return undefined; }
    });
    assert.equal(result, undefined);
  });
  await popup.close();

  await check('another host retains its header and receives no page changes', async () => {
    await page.goto('https://example.com/');
    assert.equal(await page.locator('.header--aside__item').count(), 1);
    assert.notEqual(await page.locator('#links_wrapper').evaluate(element => getComputedStyle(element).display), 'flex');
  });

  assert.deepEqual(errors, []);
  console.log(`${passed} DuckDuckGo browser checks passed; Chromium ${context.browser().version()}`);
} finally {
  if (session) await session.detach();
  if (context) await context.close();
  assert.equal(path.dirname(path.resolve(profile)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(profile).startsWith('duckduckgo-extension-'));
  await rm(profile, { recursive: true, force: true });
}
