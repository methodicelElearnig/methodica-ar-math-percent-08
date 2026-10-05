/* ═══════════════════ shared jsdom harness for methodica-math-percent-08 ═══════════════════
   NOT DEPLOYED. Dev tooling only. Used by verify-report.js, statement-flow.js and retry-gate.js.

   Unlike the ratio-01 harness (which executed the page scripts by hand and then REPLAYED the
   loader's post-metadata sequence), this one runs the REAL boot: a jsdom ResourceLoader serves
   every script tag from disk in document order, bootXAPI()'s two CDN loads are answered with an
   empty wrapper and the _test/xapi-720-k.js stub (exactly what ?xapiLib= does on localhost), the
   metadata is fetched from disk, and the loader's own poll → phase B → 'initialized' runs. So the
   statement ORDER on a resume, the boot cover and the DOMContentLoaded sequencing are under test
   too — the part of the loader a replay would have skipped.

   The YouTube IFrame API is served as a fake (window.YT with a recording Player), so the D-1
   canary and the played/paused state machine run in the headless run.

   Run from the unit root:
     NODE_PATH=/tmp/lomda-test/node_modules node _test/<suite>.js
*/
'use strict';

const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const BASE = process.argv[2] || path.join(__dirname, '..');
const UNIT = 'methodica-math-percent-08';
const COMPONENTS = ['01', '02', '03', '04'];
const PART_DIR = c => UNIT + '-' + c;
const RANGE = { '01': [0, 9], '02': [10, 27], '03': [28, 39], '04': [40, 48] };
const ORIGIN = 'http://localhost:8777';

/* The fake YouTube IFrame API. Records every Player; each exposes fire(state) to drive
   onStateChange the way the real API would.

   A REAL player has no methods (stopVideo, getCurrentTime…) until its embed has loaded and
   handshaken, which takes seconds. The default fake is ready at once, which is how QA B-4
   (2026-10-04) slipped through: a screen change during that window parked the iframe on
   about:blank and the player never came back. ytSlow serves a fake that stays method-less until
   window.__ytMakeReady() is called, so the race is reproducible headless. */
const FAKE_YT_TPL = (slow) => `
  window.YT = { PlayerState: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } };
  window.__ytPlayers = [];
  window.YT.Player = function (el, cfg) {
    var self = this; this.el = el; this.cfg = cfg || {}; this.t = 0; this.stopped = 0;
    window.__ytPlayers.push(this);
    /* the real API renames the iframe (seen live 28.09.26), then fires onReady */
    el.setAttribute('title', 'YouTube video player');
    this.fire = function (state) {
      if (self.cfg.events && self.cfg.events.onStateChange) self.cfg.events.onStateChange({ target: self, data: state });
    };
    this.__ready = function () {
      if (self.getCurrentTime) return;
      self.getCurrentTime = function () { return self.t; };
      self.stopVideo = function () { self.stopped++; };
      self.pauseVideo = function () { self.fire(2); };
      if (self.cfg.events && self.cfg.events.onReady) self.cfg.events.onReady({ target: self });
    };
    ${slow ? '' : 'setTimeout(function () { self.__ready(); }, 0);'}
  };
  window.__ytMakeReady = function () { window.__ytPlayers.forEach(function (p) { p.__ready(); }); };
  if (typeof window.onYouTubeIframeAPIReady === 'function') window.onYouTubeIframeAPIReady();
`;
const FAKE_YT = FAKE_YT_TPL(false);
const FAKE_YT_SLOW = FAKE_YT_TPL(true);

function readText(p) { return fs.readFileSync(p, 'utf8').replace(/^﻿/, ''); }

/* url path → file on disk, or null. */
function diskPath(u) {
  const url = new URL(u);
  if (url.origin !== ORIGIN) return null;
  let p = decodeURIComponent(url.pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(BASE, p);
  return fs.existsSync(f) ? f : null;
}

/* Every subresource is answered here; nothing ever reaches the network (jsdom 29:
   resources.interceptors + requestInterceptor). */
function diskInterceptor(opts, requested) {
  const js = (body) => new Response(body, { headers: { 'Content-Type': 'application/javascript' } });
  return jsdom.requestInterceptor((request, ctx) => {
    const u = request.url;
    requested.push(u);
    const tag = ctx && ctx.element ? ctx.element.localName : '';
    if (tag === 'iframe' || tag === 'frame') return new Response('<!DOCTYPE html><html><body></body></html>', { headers: { 'Content-Type': 'text/html' } });
    if (/xapiwrapper\.min\.js$/.test(u)) return js('/* wrapper stub */');
    if (/\/common\/xapi-720-[a-z]\.js$/.test(u)) {
      /* The real CDN library is never fetched: the suites load the stub through ?xapiLib=. If a
         run gets here, the loader ignored the override. */
      return js('window.__cdnLibFetched = ' + JSON.stringify(u) + ';');
    }
    if (/youtube\.com\/iframe_api/.test(u)) return js(opts.noYouTube ? '' : opts.ytSlow ? FAKE_YT_SLOW : FAKE_YT);
    const f = diskPath(u);
    if (!f) return new Response('', { status: 404 });
    const type = /\.js$/.test(f) ? 'application/javascript' : /\.css$/.test(f) ? 'text/css' : /\.html$/.test(f) ? 'text/html' : 'application/octet-stream';
    return new Response(fs.readFileSync(f), { headers: { 'Content-Type': type } });
  });
}

/* Boot one component. opts:
     search    query string (default: a platform-like launch with the stub library)
     hash      '#screen=N'
     session   a sessionStorage snapshot to carry over (a "reload": the stub keeps its state and
               statement log in sessionStorage)
     local     a localStorage snapshot to carry over
     noYouTube serve an empty iframe_api
     ytSlow    the fake players stay not-ready (no methods) until window.__ytMakeReady()
   Returns helpers; `ready` resolves once the loader has sent the component 'initialized' (or
   after `timeout` ms). */
function boot(c, opts) {
  opts = opts || {};
  const dir = PART_DIR(c);
  const search = opts.search != null ? opts.search
    : '?slxapi=1&registration=REG-' + c + '&xapiLib=../_test/xapi-720-k.js';
  const url = ORIGIN + '/' + dir + '/index.html' + search + (opts.hash || '');
  const errors = [], warns = [], logs = [];
  const loader = { requested: [] };
  const dom = new JSDOM(readText(path.join(BASE, dir, 'index.html')), {
    url,
    runScripts: 'dangerously',
    resources: { interceptors: [diskInterceptor(opts, loader.requested)] },
    pretendToBeVisual: true,
    beforeParse(w) {
      const fmt = a => a.map(x => (x && x.stack) ? x.stack : (typeof x === 'object' ? safeJSON(x) : String(x))).join(' ');
      w.console.error = (...a) => errors.push(fmt(a));
      w.console.warn = (...a) => warns.push(fmt(a));
      w.console.log = (...a) => logs.push(fmt(a));
      w.console.info = w.console.debug = () => {};
      w.HTMLMediaElement.prototype.load = function () {};
      w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
      w.HTMLMediaElement.prototype.pause = function () {};
      w.scrollTo = () => {};
      w.__fetches = [];
      w.fetch = (u, init) => {
        w.__fetches.push({ url: String(u), init: init || null });
        if (opts.fetchReject) return Promise.reject(new Error('offline'));
        let target;
        try { target = new URL(String(u), w.location.href).href; } catch (e) { target = String(u); }
        const f = diskPath(target);
        if (!f) return Promise.resolve({ ok: /docs\.google\.com/.test(target), status: 0, json: () => Promise.resolve({}) });
        const body = readText(f);
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(body)), text: () => Promise.resolve(body) });
      };
      if (opts.session) Object.keys(opts.session).forEach(k => w.sessionStorage.setItem(k, opts.session[k]));
      if (opts.local) Object.keys(opts.local).forEach(k => w.localStorage.setItem(k, opts.local[k]));
      if (opts.beforeParse) opts.beforeParse(w);
    },
  });
  const w = dom.window;
  const exec = (code) => {
    const s = w.document.createElement('script');
    s.textContent = code;
    w.document.head.appendChild(s);
    s.remove();
  };
  const val = (expr) => {
    exec('window.__v = (function(){ try { return (' + expr + '); } catch (e) { return "__throw:" + e.message; } })();');
    return w.__v;
  };
  const json = (expr) => { const v = val('JSON.stringify(' + expr + ')'); try { return JSON.parse(v); } catch (e) { return v; } };
  const stmts = () => json('window.__stmts ? window.__stmts() : []') || [];
  const verbs = () => stmts().map(s => s.verb);
  const state = () => json('window.__state ? window.__state() : null');
  const session = () => { const o = {}; for (let i = 0; i < w.sessionStorage.length; i++) { const k = w.sessionStorage.key(i); o[k] = w.sessionStorage.getItem(k); } return o; };
  const local = () => { const o = {}; for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); o[k] = w.localStorage.getItem(k); } return o; };
  /* Ready = the loader has sent THIS load's component 'initialized'. Counted against the log the
     boot started with, because a "reload" carries the previous load's log along. */
  const countInits = (raw) => {
    try { return (JSON.parse(raw || '[]') || []).filter(s => s.verb === 'initialized' && s.objectType === 'onlinelesson').length; }
    catch (e) { return 0; }
  };
  const initsBefore = countInits(opts.session && opts.session.__test_statements);
  const ready = waitFor(() => countInits(w.sessionStorage.getItem('__test_statements')) > initsBefore,
    opts.timeout || 8000).then(() => sleep(30));
  const logStart = () => {
    try { return (JSON.parse((opts.session && opts.session.__test_statements) || '[]') || []).length; } catch (e) { return 0; }
  };
  /* The statements of THIS load only. */
  const loadStmts = () => stmts().slice(logStart());
  return { dom, w, exec, val, json, stmts, loadStmts, verbs, state, session, local, errors, warns, logs, ready, loader,
           close: () => { try { w.close(); } catch (e) {} } };
}

function safeJSON(x) { try { return JSON.stringify(x); } catch (e) { return String(x); } }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function waitFor(pred, timeout) {
  const t0 = Date.now();
  return new Promise((resolve) => {
    (function tick() {
      let v = false; try { v = pred(); } catch (e) {}
      if (v || Date.now() - t0 > timeout) return resolve(!!v);
      setTimeout(tick, 25);
    })();
  });
}

/* Result bookkeeping shared by the suites. */
function makeReporter(name) {
  const failures = [];
  let passes = 0;
  const ok = (tag, what, cond, detail) => {
    if (cond) { passes++; return true; }
    failures.push('[' + tag + '] ' + what + (detail ? '  —  ' + detail : ''));
    return false;
  };
  const eq = (tag, what, actual, expected) => {
    const a = JSON.stringify(actual), e = JSON.stringify(expected);
    return ok(tag, what, a === e, 'got ' + a + ', expected ' + e);
  };
  const done = () => {
    console.log('\n' + name + ': ' + passes + ' passed, ' + failures.length + ' failed');
    if (failures.length) { console.log('\nFAILURES:'); failures.forEach(f => console.log('  ' + f)); }
    process.exitCode = failures.length ? 1 : 0;
    return failures.length;
  };
  return { ok, eq, done, failures, get passes() { return passes; } };
}

/* The questions of the unit, straight from questions.js (evaluated in a sandbox). */
function loadQuestions() {
  const vm = require('vm');
  const ctx = { window: {}, document: { fonts: { ready: { then() {} } }, addEventListener() {} },
                console, setTimeout() {}, appletEmbed: (s) => '[applet ' + s + ']' };
  vm.createContext(ctx);
  vm.runInContext(readText(path.join(BASE, 'unit-js', 'questions.js')) + ';this.__Q = QUESTIONS;', ctx);
  return ctx.__Q;
}

function metadata(c) { return JSON.parse(readText(path.join(BASE, 'metadata', PART_DIR(c) + '.json'))); }
function unitMetadata() { return JSON.parse(readText(path.join(BASE, 'metadata', UNIT + '_unit.json'))); }

module.exports = { BASE, UNIT, COMPONENTS, PART_DIR, RANGE, ORIGIN, boot, sleep, waitFor, makeReporter,
                   loadQuestions, metadata, unitMetadata, readText };
