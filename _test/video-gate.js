/* ═══════════════════ video gate — methodica-ar-math-percent-08, component 01 ═══════════════════
   NOT DEPLOYED. Dev tooling only.

   MOE runbook check 10.11.26 (QA/2026-11-10_moe-runbook-checks/REPORT.md): "percent-08-01 has no
   video gate" — s3 and s8 let the learner continue before the clip was watched; the deck draws both
   המשך buttons disabled. Fix (percent-05's s6 mechanism): disabled until the player reports ENDED;
   any player error, or an IFrame API that never loads, opens it (a blocked YouTube must never strand
   the learner); the flag is saved with the part, so a reload keeps המשך open.

   Every check here fails on the code before the fix (s3/s8 continue enabled from the start).

   Run:  NODE_PATH=/tmp/lomda-test-p08/node_modules node _test/video-gate.js
*/
'use strict';

const H = require('./harness');
const R = H.makeReporter('video-gate');
const { ok, eq } = R;

const dis = (b, n) => b.val(`document.getElementById('s${n}-continue').disabled`);
const P = it => `window.__ytPlayers.filter(function(p){ return p.el.getAttribute('data-yt-item') === '${it}'; })[0]`;

(async () => {
  /* 1. the gate, then ENDED opens it */
  const b = H.boot('01');
  await b.ready;
  await H.waitFor(() => b.val('(window.__ytPlayers||[]).length') === 2, 2000);
  eq('gate', 's3 continue is disabled in the markup', /id="s3-continue" disabled/.test(H.readText(require('path').join(H.BASE, H.PART_DIR('01'), 'index.html'))), true);
  eq('gate', 's8 continue is disabled in the markup', /id="s8-continue" disabled/.test(H.readText(require('path').join(H.BASE, H.PART_DIR('01'), 'index.html'))), true);
  b.exec('goTo(1); goTo(2); goTo(3);');
  eq('gate', 's3: continue disabled before the video ends', dis(b, 3), true);
  b.exec(`${P('002')}.fire(1); ${P('002')}.fire(2);`);
  eq('gate', 's3: playing and pausing does not open it', dis(b, 3), true);
  b.exec('keyboardForward();');
  eq('gate', 's3: the arrow key cannot pass the gate', b.val('currentScreen'), 3);
  b.exec(`${P('002')}.fire(1); ${P('002')}.fire(0);`);
  eq('gate', 's3: ENDED opens continue', dis(b, 3), false);
  b.exec('goTo(4); goTo(3);');
  eq('gate', 's3: back on s3 later, continue stays open (no forced re-watch)', dis(b, 3), false);
  b.exec('for (var i = 4; i <= 8; i++) goTo(i);');
  eq('gate', 's8: its own gate, still closed after s3 was watched', dis(b, 8), true);
  b.exec(`${P('003')}.fire(1); ${P('003')}.fire(0);`);
  eq('gate', 's8: ENDED opens continue', dis(b, 8), false);
  b.exec('flushResumeSave();');
  ok('gate', 'no console.error', b.errors.length === 0, b.errors.join(' | '));

  /* 2. resume: the flags travel in the part payload */
  const b2 = H.boot('01', { session: b.session() });
  b.close();
  await b2.ready;
  b2.exec('goTo(3);');
  eq('resume', 's3: after a reload continue is open (watched before)', dis(b2, 3), false);
  b2.exec('goTo(8);');
  eq('resume', 's8: after a reload continue is open (watched before)', dis(b2, 8), false);
  b2.close();

  /* a reload with only s3 watched keeps s8 closed */
  const c = H.boot('01');
  await c.ready;
  await H.waitFor(() => c.val('(window.__ytPlayers||[]).length') === 2, 2000);
  c.exec(`goTo(1); goTo(2); goTo(3); ${P('002')}.fire(1); ${P('002')}.fire(0); flushResumeSave();`);
  const c2 = H.boot('01', { session: c.session(), hash: '#screen=8' });
  c.close();
  await c2.ready;
  c2.exec('goTo(8);');
  eq('resume', 's8: a reload with only s3 watched keeps s8 closed', dis(c2, 8), true);
  c2.exec('goTo(3);');
  eq('resume', 's3: and s3 open', dis(c2, 3), false);
  c2.close();

  /* 3. a player error opens only its own screen */
  const e = H.boot('01');
  await e.ready;
  await H.waitFor(() => e.val('(window.__ytPlayers||[]).length') === 2, 2000);
  e.exec(`goTo(3); (function(){ var p = ${P('002')}; p.cfg.events.onError({ target: p, data: 150 }); })();`);
  eq('error', 'a player error on s3 opens s3 continue', dis(e, 3), false);
  e.exec('goTo(8);');
  eq('error', '… and leaves s8 closed', dis(e, 8), true);
  e.close();

  /* 4. the IFrame API never loads: both open */
  const n = H.boot('01', { noYouTube: true, beforeParse(w) {
    /* the API script fails the way a blocked network does: its onerror fires */
    w.document.addEventListener('DOMContentLoaded', () => {
      new w.MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(s => {
        if (s.tagName === 'SCRIPT' && /youtube\.com\/iframe_api/.test(s.src || '')) setTimeout(() => s.onerror && s.onerror(new w.Event('error')), 0);
      }))).observe(w.document.head, { childList: true });
    });
  } });
  await n.ready;
  await H.sleep(50);
  n.exec('goTo(3);');
  eq('no-api', 'API unavailable: s3 continue open', dis(n, 3), false);
  n.exec('goTo(8);');
  eq('no-api', 'API unavailable: s8 continue open', dis(n, 8), false);
  n.close();

  R.done();
})().catch(e => { console.error(e); process.exitCode = 2; });
