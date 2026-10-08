/* MOE monday items of 05-06.10 + KNOWN-ISSUES §1 — real Chrome (puppeteer-core).
 *
 *   1. 08-03 — the stop after the basic questions: "ענו נכון על 4 שאלות ומעלה כדי להתקדם" (5 stations,
 *      station 5 = s33+s34, both needed; any order). Through the real options, fields and check
 *      buttons: under 4 -> "שנמשיך?" on s34 ends the component there (one completed, success:false,
 *      button disabled); 4 or 5 -> s35 ("יופי של עבודה").
 *   2. 08-01 — both videos carry origin= (the handshake inside Kata's frame) and report played/paused
 *      on their items (002, 003) when played and paused through the player.
 *   3. 08-03-002 "הסימון עולה על התשובה" — the inline dropdowns are drawn by us (appearance:none), so the
 *      ✓/✗ padding holds in Safari too.
 *   4. The canvas stays inside the window at eight window sizes (all four components).
 *
 *   NODE_PATH=/tmp/lomda-test/node_modules node _test/monday-2026-10-08.js [baseUrl]
 */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const puppeteer = require('puppeteer-core');
const ROOT = path.resolve(__dirname, '..');
const BASE_ARG = process.argv[2];
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const P = 'methodica-math-percent-08-';
let pass = 0; const failures = [];
const ok = (scope, name, cond, detail) => { if (cond) pass++; else failures.push('  [' + scope + '] ' + name + (detail ? '\n      -> ' + detail : '')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.webp': 'image/webp', '.gif': 'image/gif' };
const server = BASE_ARG ? null : http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });

const RECORDER = () => {
  window.__log = []; window.XAPI_USING_G = true;
  window.sendStatement720 = function (v, t, r, c) { window.__log.push({ v: v, id: (c && (c.objectId || c.questionId)) || null, r: r || null }); };
};

async function open(browser, url) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.__errors = [];
  page.on('pageerror', (e) => page.__errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle0' });
  await sleep(500);
  await page.evaluate(RECORDER);
  page.__ctx = ctx;
  return page;
}

/* Answer one question screen right or wrong (wrong = two different wrong answers), through its own
   controls, from what questions.js declares as correct. */
const ANSWER = async (n, right) => {
  const S = (t) => new Promise((r) => setTimeout(r, t));
  const q = QUESTIONS.find((x) => x.screen === n);
  const scr = document.getElementById('q' + n);
  const check = async () => { document.getElementById('q' + n + '-check').click(); await S(200); };
  if (q.type === 'single') {
    const opts = [...scr.querySelectorAll('[onclick^="quizSelect("]')];
    const correct = q.correct || q.answer;
    const good = opts.find((o) => o.dataset.id === correct);
    const bad = opts.filter((o) => o !== good);
    if (right) { good.click(); await check(); } else { bad[0].click(); await check(); bad[1].click(); await check(); }
  } else if (q.type === 'value-input') {
    const fields = [...scr.querySelectorAll('[data-slot]')].sort((a, b) => a.dataset.slot - b.dataset.slot);
    const fill = (k) => fields.forEach((f, i) => {
      const want = q.correctInputs[i];
      let v = want;
      if (!right) {
        if (f.tagName === 'SELECT') { const others = [...f.options].map((o) => o.value).filter((x) => x && x !== want); v = others[k % others.length]; }
        else v = String(900 + k);
      }
      f.value = v; f.dispatchEvent(new Event(f.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    });
    fill(0); await check();
    if (!right) { fill(1); await check(); }
  }
  return { done: !!(quizState[n] && quizState[n].done), ok: !!(quizState[n] && quizState[n].wasCorrect) };
};

(async () => {
  let base = BASE_ARG;
  if (!base) { await new Promise((r) => server.listen(0, '127.0.0.1', r)); base = 'http://127.0.0.1:' + server.address().port + '/'; }
  if (!base.endsWith('/')) base += '/';
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  try {
    /* ── 1. the stop ── letters: s29 s30 s31 s32 s33 s34 (stations 1-4 = s29-s32, station 5 = s33+s34) */
    const CASES = [['WWWWWW', 0], ['RRWWRR', 3], ['RRRWRW', 3], ['RRRRWR', 4], ['WRRRRR', 4], ['RRRRRR', 5]];
    for (const [pat, stations] of CASES) {
      const scope = '03 ' + pat + ' (' + stations + '/5)';
      const page = await open(browser, base + P + '03/index.html');
      await page.evaluate(() => goTo(29)); await sleep(300);
      for (let i = 0; i < 6; i++) {
        const n = 29 + i;
        const r = await page.evaluate(ANSWER, n, pat[i] === 'R');
        ok(scope, 's' + n + ' answered as planned', r.done && r.ok === (pat[i] === 'R'), JSON.stringify(r));
        if (n < 34) { await page.evaluate((n) => document.getElementById('q' + n + '-check').click(), n); await sleep(250); }
      }
      ok(scope, 'on s34', await page.evaluate(() => currentScreen) === 34);
      await page.evaluate(() => document.getElementById('q34-check').click()); await sleep(300);
      const st = await page.evaluate(() => ({ screen: currentScreen, dis: document.getElementById('q34-check').disabled,
        done: window.__log.filter((s) => s.v === 'completed' && /percent-08-03\/$/.test(s.id || '') ) }));
      const comp = await page.evaluate(() => window.__log.filter((s) => s.v === 'completed' && (!s.id || /-03\/$/.test(s.id))));
      if (stations < 4) {
        ok(scope, '"שנמשיך?" stays on s34', st.screen === 34, 'screen=' + st.screen);
        ok(scope, 'component completed, success:false', comp.length === 1 && comp[0].r && comp[0].r.success === false, JSON.stringify(comp));
        ok(scope, 'button disabled', st.dis === true);
        await page.keyboard.press('ArrowLeft'); await sleep(200);
        ok(scope, 'the arrow key does not pass it either', await page.evaluate(() => currentScreen) === 34);
      } else {
        ok(scope, '"שנמשיך?" goes to s35', st.screen === 35, 'screen=' + st.screen);
        ok(scope, 'nothing completed yet', comp.length === 0, JSON.stringify(comp));
      }
      ok(scope, 'no page errors', page.__errors.length === 0, page.__errors.join(' | '));
      await page.__ctx.close();
    }

    /* ── 2. videos ── */
    {
      const page = await open(browser, base + P + '01/index.html');
      for (const [n, item] of [[3, '002'], [8, '003']]) {
        await page.evaluate((n) => goTo(n), n);
        const r = await page.evaluate(async (n) => {
          const S = (t) => new Promise((r) => setTimeout(r, t));
          const f = document.querySelector('#s' + n + ' iframe[data-yt-item]');
          for (let k = 0; k < 40 && !(f.__ytPlayer && typeof f.__ytPlayer.playVideo === 'function'); k++) await S(250);
          const pl = f.__ytPlayer;
          if (!pl || typeof pl.playVideo !== 'function') return { ready: false, src: f.getAttribute('src') };
          window.__log = [];
          pl.mute(); pl.playVideo(); await S(3500); pl.pauseVideo(); await S(1500);
          return { ready: true, src: f.getAttribute('src'), log: window.__log.filter((s) => s.v === 'played' || s.v === 'paused') };
        }, n);
        ok('01 s' + n, 'embed carries origin=', /[?&]origin=https?%3A%2F%2F/.test(r.src || ''), r.src);
        ok('01 s' + n, 'player ready', r.ready, JSON.stringify(r));
        ok('01 s' + n, 'played then paused, on item ' + item, r.log && r.log.length === 2 && r.log[0].v === 'played' && r.log[1].v === 'paused' &&
           r.log.every((s) => new RegExp('-' + item + '/$').test(s.id)), JSON.stringify(r.log));
      }
      await page.__ctx.close();
    }

    /* ── 3. the inline dropdown ── */
    {
      const page = await open(browser, base + P + '03/index.html');
      await page.evaluate(() => goTo(30)); await sleep(300);
      await page.evaluate(ANSWER, 30, true);
      const s = await page.evaluate(() => { const e = document.querySelector('#q30 .slot-select'); const cs = getComputedStyle(e);
        return { cls: e.className, app: cs.appearance, pr: parseFloat(cs.paddingRight), pl: parseFloat(cs.paddingLeft), imgs: cs.backgroundImage.split('url(').length - 1 }; });
      ok('03 s30 select', 'marked', /mark-ok/.test(s.cls), s.cls);
      ok('03 s30 select', 'drawn by us (appearance:none)', s.app === 'none', s.app);
      ok('03 s30 select', 'room for the mark (>= 36px right) and the arrow (left)', s.pr >= 36 && s.pl >= 30 && s.imgs === 2, JSON.stringify(s));
      await page.__ctx.close();
    }

    /* ── 4. the canvas inside the window ── */
    for (const [w, h] of [[1920, 1080], [1366, 640], [1280, 720], [1024, 640], [800, 600], [768, 1024], [375, 812], [1600, 500]]) {
      for (const c of ['01', '02', '03', '04']) {
        const page = await browser.newPage(); await page.setViewport({ width: w, height: h });
        await page.goto(base + P + c + '/index.html', { waitUntil: 'networkidle0' }); await sleep(200);
        const a = await page.evaluate(() => { const r = document.getElementById('app').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round); });
        ok(c + ' ' + w + 'x' + h, 'canvas inside the window', a[0] >= -1 && a[1] >= -1 && a[2] <= w + 1 && a[3] <= h + 1, JSON.stringify(a));
        await page.close();
      }
    }
  } finally {
    await browser.close();
    if (server) server.close();
  }
  console.log(failures.length ? failures.join('\n') + '\n' : '');
  console.log(failures.length ? `=== monday 08.10: ${pass} passed, ${failures.length} failed ===` : `All ${pass} monday-2026-10-08 checks passed.`);
  process.exit(failures.length ? 1 : 0);
})().catch((e) => { console.error(e); if (server) server.close(); process.exit(2); });
