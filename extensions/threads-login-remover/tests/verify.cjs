const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const extension = path.resolve(__dirname, '..');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'threads-login-remover-'));
const prompt = `<div id="overlay"><div class="random-backdrop" style="position:fixed;inset:0"></div>
  <div tabindex="-1"><div role="dialog" aria-modal="true" class="random-dialog">
  <span>透過 Threads 暢所欲言</span><p>加入 Threads 即可分享想法</p>
  <div role="button" tabindex="0"><i aria-label="Instagram"></i>
  <span>使用 Instagram 帳號繼續</span><svg aria-label="登入"></svg></div>
  </div></div></div>`;
const fixture = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; } #feed { min-height: 3600px; background: #ddd; }
  #overlay { position: fixed; inset: 0; z-index: 10; }
  [role="dialog"] { background: white; }
  .locked { position: fixed; inset: 0; height: 100vh; overflow: hidden; }
  </style></head><body><div id="app"><div id="feed"><article>
  <a href="/@example/post/fixture">Synthetic public post</a>
  <button id="post-action">Post action</button></article></div></div>
  <div id="portal"></div></body></html>`;
let context;
let passed = 0;

async function check(name, run) {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
}

async function hidden(page) {
  await page.waitForFunction(() => {
    const overlay = document.querySelector('#overlay');
    return overlay && overlay.getClientRects().length === 0;
  }, null, { timeout: 5000 });
}

(async () => {
  try {
    context = await chromium.launchPersistentContext(profile, {
      headless: true,
      channel: 'chromium',
      ignoreDefaultArgs: ['--disable-extensions'],
      executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
      args: ['--enable-unsafe-extension-debugging'],
      viewport: { width: 1280, height: 720 },
    });
    const session = await context.browser().newBrowserCDPSession();
    const loaded = await session.send('Extensions.loadUnpacked', { path: extension });
    assert.ok(loaded.id);
    console.log(`Loaded extension ${loaded.id}`);
    await session.detach();
    const page = context.pages()[0];
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.route('https://www.threads.com/**', route =>
      route.fulfill({ contentType: 'text/html; charset=utf-8', body: fixture }));
    await context.route('https://example.com/**', route =>
      route.fulfill({ contentType: 'text/html; charset=utf-8', body: fixture }));
    await page.goto('https://www.threads.com/@example/post/fixture');

    await check('manifest injects content script; first prompt and backdrop hidden', async () => {
      await page.evaluate(html => { document.querySelector('#portal').innerHTML = html; }, prompt);
      await hidden(page);
      assert.equal(await page.locator('#feed').isVisible(), true);
      await page.mouse.move(640, 360);
      await page.mouse.wheel(0, 400);
      await page.waitForFunction(() => scrollY > 0);
    });

    await check('second prompt unlocks roots and fixed aria-hidden/inert feed', async () => {
      await page.evaluate(html => {
        scrollTo(0, 0);
        document.querySelector('#portal').innerHTML = html;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.cssText = 'overflow:hidden;touch-action:none';
        const feed = document.querySelector('#feed');
        feed.className = 'locked';
        feed.setAttribute('aria-hidden', 'true');
        feed.inert = true;
      }, prompt.replaceAll('random-', 'changed-'));
      await hidden(page);
      await page.waitForFunction(() => getComputedStyle(document.querySelector('#feed')).position === 'relative');
      assert.equal(await page.locator('#feed').getAttribute('aria-hidden'), null);
      assert.equal(await page.locator('#feed').getAttribute('inert'), null);
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY), 'auto');
      await page.mouse.wheel(0, 500);
      await page.waitForFunction(() => scrollY > 0);
      await page.locator('#post-action').click();
    });

    await check('late site relock is released without another prompt insertion', async () => {
      await page.evaluate(() => {
        document.body.style.overflowY = 'hidden';
        const feed = document.querySelector('#feed');
        feed.style.cssText = 'position:fixed;height:100vh;overflow:hidden';
        feed.setAttribute('aria-hidden', 'true');
        feed.inert = true;
      });
      await page.waitForFunction(() => getComputedStyle(document.body).overflowY === 'auto' &&
        getComputedStyle(document.querySelector('#feed')).position === 'relative');
    });

    await check('other modal keeps its lock and remains interactive', async () => {
      await page.evaluate(() => {
        const modal = document.createElement('div');
        modal.id = 'other';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.style.cssText = 'position:fixed;inset:100px;z-index:20';
        modal.innerHTML = '<button id="close-other">Cookie settings</button>';
        document.body.append(modal);
      });
      await page.waitForFunction(() => getComputedStyle(document.body).overflowY === 'hidden');
      assert.equal(await page.locator('#other').isVisible(), true);
      assert.equal(await page.locator('#feed').getAttribute('aria-hidden'), 'true');
      await page.locator('#close-other').click();
      await page.locator('#other').evaluate(element => element.remove());
      await page.waitForFunction(() => getComputedStyle(document.body).overflowY === 'auto');
    });

    await check('a dialog assembled in stages is recognized after text changes', async () => {
      await page.evaluate(html => {
        document.querySelector('#portal').innerHTML = html.replace('透過 Threads 暢所欲言', 'Loading');
      }, prompt);
      await page.locator('#overlay').waitFor({ state: 'visible' });
      await page.locator('#overlay span').first().evaluate(element => {
        element.firstChild.data = '透過 Threads 暢所欲言';
      });
      await hidden(page);
    });

    await check('quoted text without an Instagram login action stays visible', async () => {
      await page.evaluate(() => {
        document.querySelector('#portal').innerHTML = '<div id="quoted" role="dialog" aria-modal="true">' +
          '<span>透過 Threads 暢所欲言</span><article>Instagram login discussion</article></div>';
      });
      await page.waitForTimeout(150);
      assert.equal(await page.locator('#quoted').isVisible(), true);
    });

    await check('English variant and renewed classes are supported', async () => {
      await page.evaluate(html => { document.querySelector('#portal').innerHTML = html; },
        prompt.replace('透過 Threads 暢所欲言', 'Say more with Threads')
          .replace('使用 Instagram 帳號繼續', 'Continue with Instagram').replace('aria-label="登入"', 'aria-label="Log in"'));
      await hidden(page);
    });

    await check('explicit login path is preserved', async () => {
      await page.goto('https://www.threads.com/login');
      await page.evaluate(html => { document.querySelector('#portal').innerHTML = html; }, prompt);
      await page.waitForTimeout(150);
      assert.equal(await page.locator('#overlay').isVisible(), true);
    });

    await check('another host does not receive the extension', async () => {
      await page.goto('https://example.com/');
      await page.evaluate(html => { document.querySelector('#portal').innerHTML = html; }, prompt);
      await page.waitForTimeout(150);
      assert.equal(await page.locator('#overlay').isVisible(), true);
      assert.equal(await page.locator('[data-threads-login-remover]').count(), 0);
    });

    assert.deepEqual(errors, []);
    if (process.argv.includes('--live')) {
      await context.unroute('https://www.threads.com/**');
      await check('live Threads prompt is hidden and wheel scrolling works', async () => {
        await page.goto('https://www.threads.com/@dancingfromheart/post/DeqBwWSDM3n', {
          waitUntil: 'domcontentloaded', timeout: 60000,
        });
        await page.waitForFunction(() => document.querySelector('[data-threads-login-remover="hidden"]') &&
          [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')]
            .every(dialog => !dialog.getClientRects().length), null, { timeout: 20000 });
        await page.mouse.move(640, 360);
        await page.mouse.wheel(0, 600);
        await page.waitForFunction(() => scrollY > 0);
        const result = await page.evaluate(() => ({
          scrollY,
          hiddenOverlays: document.querySelectorAll('[data-threads-login-remover="hidden"]').length,
          fixedHiddenFeeds: [...document.querySelectorAll('[aria-hidden="true"], [inert]')]
            .filter(element => element.querySelector('a[href*="/post/"]') &&
              getComputedStyle(element).position === 'fixed').length,
        }));
        assert.equal(result.fixedHiddenFeeds, 0);
        console.log(JSON.stringify(result));
      });
    }
    console.log(`${passed} browser checks passed; Chromium ${context.browser().version()}`);
  } finally {
    if (context) await context.close();
    // Only this run's mkdtemp-owned profile is removed after its browser closes.
    assert.equal(path.dirname(path.resolve(profile)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(profile).startsWith('threads-login-remover-'));
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
