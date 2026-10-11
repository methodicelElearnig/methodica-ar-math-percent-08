/* ═══════════════════ structural oracle — methodica-math-percent-08 ═══════════════════
   NOT DEPLOYED. Dev tooling only.

   Asserts the CONTRACTS the reporting / resume layer depends on — the silent failures from
   Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md §10.2 — plus three sweeps over
   every question of the unit that the behavioural suite samples only:
     - the Retry gate on every two-attempt question (D-14), live and after a reload
     - "paint only submitted state" after change-leave-return (D-15)
     - every painter, every screen: never throws, and an answered screen comes back SHOWING the
       answer after a reload (rules 7 and 8)

   Run:  NODE_PATH=/tmp/lomda-test-p08/node_modules node _test/verify-report.js
*/
'use strict';

const fs = require('fs');
const path = require('path');
const H = require('./harness');
const R = H.makeReporter('verify-report');
const { ok, eq } = R;
const { BASE, UNIT, COMPONENTS, PART_DIR, RANGE } = H;

const read = p => H.readText(path.join(BASE, p));
const QS = H.loadQuestions();
const Q = n => QS.find(q => q.screen === n);
const SHARED = ['10-identity', '20-xapi', '40-resume', '50-loader', 'motion', 'quiz-engine', 'questions',
                'report-modal', 'unit', 'engine', '70-platform', '90-boot'];
const ORDER = ['../unit-js/10-identity.js', '../unit-js/20-xapi.js', '../unit-js/40-resume.js', '../unit-js/50-loader.js',
               'script.js', '../unit-js/motion.js', '../unit-js/quiz-engine.js', '../unit-js/questions.js',
               '../unit-js/report-modal.js', '../unit-js/unit.js', '../unit-js/engine.js',
               '../unit-js/70-platform.js', '../unit-js/90-boot.js'];

/* A literal object block `var NAME = { … \n};` from source, parsed. */
function literal(src, name) {
  const m = new RegExp('var ' + name + '\\s*=\\s*(\\{[^\\n]*\\});').exec(src) ||
            new RegExp('var ' + name + '\\s*=\\s*(\\{[\\s\\S]*?\\n\\});').exec(src);
  if (!m) return null;
  try { return Function('"use strict"; return (' + m[1] + ');')(); } catch (e) { return null; }
}
/* Brace-matched body of `function NAME(` in src. */
function fnBody(src, name) {
  const i = src.search(new RegExp('function ' + name + '\\s*\\('));
  if (i < 0) return null;
  const open = src.indexOf('{', i);
  let d = 0;
  for (let j = open; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}') { d--; if (d === 0) return src.slice(open, j + 1); }
  }
  return null;
}
/* Top-level declared names (function / var / let / const at column 0). */
function topNames(src) {
  const out = new Set();
  const re = /^(?:function\s+([A-Za-z_$][\w$]*)|(?:var|let|const)\s+([A-Za-z_$][\w$]*))/gm;
  let m;
  while ((m = re.exec(src))) out.add(m[1] || m[2]);
  return out;
}
/* Case-exact existence (Windows fs is case-insensitive; the CDN is not — guide §15.3). */
function resolveExact(abs) {
  const rel = path.relative(BASE, abs);
  if (rel.startsWith('..')) return fs.existsSync(abs);
  let cur = BASE;
  for (const seg of rel.split(path.sep)) {
    if (!fs.existsSync(cur) || !fs.readdirSync(cur).includes(seg)) return false;
    cur = path.join(cur, seg);
  }
  return true;
}

/* ══════════════ 1. Static: files, script order, ?v=, library letter ══════════════ */
function staticChecks() {
  const vs = {};
  COMPONENTS.forEach(c => {
    const html = read(PART_DIR(c) + '/index.html');
    const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
    eq('order', c + ': script tags in the load-bearing order', scripts.map(s => s.split('?')[0]), ORDER);
    [...html.matchAll(/<(?:script src|link rel="stylesheet" href)="([^"]+)"/g)].forEach(m => {
      const u = m[1];
      if (/^https?:/.test(u)) return;
      ok('v', c + ': ?v= on ' + u, /\?v=\d+/.test(u));
      const base = u.split('?')[0];
      (vs[base] = vs[base] || new Set()).add((/\?v=(\d+)/.exec(u) || [])[1]);
      ok('assets', c + ': ' + base + ' exists with exact case', resolveExact(path.join(BASE, PART_DIR(c), base)));
    });
    /* Media and other local references in the markup exist with exact case. */
    [...html.matchAll(/\s(?:src|poster)="([^"#:]+)"/g)].forEach(m => {
      const u = m[1].split('?')[0];
      if (!u || /^\/\//.test(u) || /\.js$/.test(u)) return;
      ok('assets', c + ': ' + u + ' exists with exact case', resolveExact(path.join(BASE, PART_DIR(c), u)));
    });
    ok('cover', c + ': #boot-cover in the markup, inline-styled', /<div id="boot-cover" style="position:fixed;inset:0;z-index:9999;background:#ffffff"><\/div>/.test(html));
    ok('cover', c + ': the cover sits before #stage (a sibling, not inside the scaled canvas)', html.indexOf('id="boot-cover"') < html.indexOf('<div id="stage">'));
    ok('cover', c + ': a dependency-free failsafe with the 800ms / 11s ceilings', /setTimeout\(tick, 800\)/.test(html) && /11000/.test(html));
    ok('html', c + ': no stray closing tags after the scripts', /<script src="\.\.\/unit-js\/90-boot\.js\?v=\d+"><\/script>\s*<\/body>/.test(html));
  });
  Object.keys(vs).forEach(k => ok('v', '?v= identical across components: ' + k, vs[k].size === 1, [...vs[k]].join(',')));

  const loader = read('unit-js/50-loader.js');
  ok('letter', 'the loader names xapi-720-k.js with resume on', /RESUME_ENABLED \? 'xapi-720-k\.js' : 'xapi-720-i\.js'/.test(loader));
  ok('letter', 'the XAPI_USING_G regex accepts k (and the stub filename)', /\/xapi-720-\[ghijk\]\\\.js\//.test(loader) && /xapi-720-[ghijk]\.js/.test('_test/xapi-720-k.js'));
  ok('letter', 'the ?xapiLib= override is localhost-only and same-origin', /localhost\|127\\\.0\\\.0\\\.1/.test(loader) && /\^\(\\\.\\\.\?\\\/\|\\\/\)\[\^:\]\*\$/.test(loader));
  ok('letter', 'no library copy is shipped outside _test/', !fs.readdirSync(path.join(BASE, 'unit-js')).some(f => /^xapi-720/.test(f)));

  /* No identifier declared in two layers (guide §3.3): a var/function collision is a silent
     last-wins overwrite. */
  const shared = {};
  SHARED.forEach(f => topNames(read('unit-js/' + f + '.js')).forEach(n => { (shared[n] = shared[n] || []).push(f); }));
  Object.keys(shared).forEach(n => ok('names', 'declared once across unit-js/: ' + n, shared[n].length === 1, shared[n].join(', ')));
  COMPONENTS.forEach(c => {
    const names = topNames(read(PART_DIR(c) + '/script.js'));
    names.forEach(n => ok('names', c + ': script.js name not also in unit-js/: ' + n, !shared[n], shared[n] && shared[n].join(',')));
    ok('names', c + ': script.js is configuration only (no functions)', !/^function\s/m.test(read(PART_DIR(c) + '/script.js')));
    ok('names', c + ': script.js declares with var only', !/^(?:let|const)\s/m.test(read(PART_DIR(c) + '/script.js')));
  });

  /* Lowercase slugs everywhere (guide §4.5). */
  const files = ['index.html', ...COMPONENTS.flatMap(c => [PART_DIR(c) + '/index.html', PART_DIR(c) + '/script.js']),
                 ...SHARED.map(f => 'unit-js/' + f + '.js')];
  files.forEach(f => ok('case', 'no capitalised unit slug in ' + f, !/methodica-math-percent-08/i.test(read(f).replace(/methodica-math-percent-08/g, ''))));
  const root = read('index.html');
  ok('root', 'root index.html redirects to component 01 index.html carrying location.search',
     /location\.replace\('\.\/methodica-math-percent-08-01\/index\.html' \+ (window\.)?location\.search\)/.test(root), root.match(/location\.replace\([^)]*\)/));
  ok('root', 'the package ships no root files — platforms launch components by their own links (rule 28.09.26)',
     /^\$RootFiles = @\(\)/m.test(read('docs-and-tools/package-allowlist.ps1')));
  /* The MOE CDN answers a folder URL with 200 and 0 bytes (live, 28.09.26): every navigation
     target names its file. */
  COMPONENTS.forEach(c => {
    const pc = /window\.PART_CONFIG = (\{[^\n]*\});/.exec(read(PART_DIR(c) + '/script.js'));
    const cfg = pc ? Function('return ' + pc[1])() : {};
    ['next', 'prev'].forEach(k => { if (cfg[k]) ok('root', c + ': PART_CONFIG.' + k + ' names index.html', /\/index\.html$/.test(cfg[k]), cfg[k]); });
  });

  /* Routing (§8.12): no unit-level statement, every navigation dev-only. */
  const all = SHARED.map(f => read('unit-js/' + f + '.js')).join('\n');
  ok('route', 'no xapiCompleteUnit call anywhere', !/xapiCompleteUnit\s*\(/.test(all.replace(/\/\*[\s\S]*?\*\//g, '')));
  const pexit = fnBody(read('unit-js/70-platform.js'), 'partExit');
  ok('route', 'partExit hops only under DEV_NAV', /if \(dir < 0\) \{\s*if \(DEV_NAV\) goToPrevPart\(\);/.test(pexit) && /if \(DEV_NAV && window\.PART_CONFIG && window\.PART_CONFIG\.next\)/.test(pexit));
  ok('route', 'partExit reports before any hop', pexit.indexOf('xapiEndComponent') < pexit.indexOf('goToNextPart'));
  const goto = fnBody(read('unit-js/engine.js'), 'goTo');
  ok('route', 'goTo leaves the component only through partExit when the layer is present', /if \(_exit\) _exit\(1\); else goToNextPart\(\);/.test(goto) && /if \(_exit\) _exit\(-1\); else goToPrevPart\(\);/.test(goto));
  ok('route', 'goBackToPreviousPart is DEV_NAV-gated', /function goBackToPreviousPart[^{]*\{\s*if \(!DEV_NAV\) return;/.test(read('unit-js/40-resume.js')));
  ok('route', 'firstScreen honours ?screen=last only under DEV_NAV', /devNav && new URLSearchParams/.test(fnBody(read('unit-js/engine.js'), 'firstScreen')));
  ok('route', 'DEV_NAV needs ?dev=1 AND no ?registration', /DEV_NAV = _devQ\.get\('dev'\) === '1' && !_devQ\.has\('registration'\);/.test(read('unit-js/10-identity.js')));
  ok('route', '90-boot calls hideCrossPartBack after partBoot, bootXAPI last',
     (() => { const s = read('unit-js/90-boot.js'); const a = s.indexOf('partBoot();'), b = s.indexOf('hideCrossPartBack();'), d = s.lastIndexOf('bootXAPI();'); return a > 0 && b > a && d > b; })());

  /* Engine hook order in goTo (§8.4a): after resetScreenState: repaint → item → save. */
  const iR = goto.indexOf('resetScreenState(n)'), iP = goto.indexOf('repaintScreen(n)'), iX = goto.indexOf('xapiOnScreen(n)'), iS = goto.indexOf('scheduleResumeSave()');
  ok('goto', 'goTo: resetScreenState → repaintScreen → xapiOnScreen → scheduleResumeSave', iR > 0 && iP > iR && iX > iP && iS > iX);
  ok('goto', 'goTo: no empty catch on the platform hooks', !/catch \(e\) \{\s*\}/.test(goto.slice(iP, iS + 80)));

  /* The ledger (§8.2). */
  const once = fnBody(read('unit-js/40-resume.js'), 'sendStatementOnce');
  const i1 = once.indexOf('if (_restoring) return false;'), i2 = once.indexOf('alreadySent('), i3 = once.indexOf('sendStatement720('), i4 = once.indexOf('markSent(');
  ok('ledger', 'sendStatementOnce: restoring guard first, then check, send, mark', i1 > 0 && i2 > i1 && i3 > i2 && i4 > i3);
  ok('ledger', 'every completed goes through sendCompletedOnce (no raw completed send)', !/sendStatement720\('completed'/.test(all));
  ok('ledger', 'item close guarded (B-1): _xapiCloseItem asks _xapiLibWouldDrop first', /function _xapiCloseItem\(item\) \{\s*if \(_xapiLibWouldDrop\(item\)\) return;/.test(read('unit-js/20-xapi.js')));
  ok('ledger', 'xapiAnswered writes XAPI_Q_RESULTS on its first line, outside the try', /function xapiAnswered\([^)]*\)\{\s*XAPI_Q_RESULTS\[item \+ '\/' \+ qKey\] = !!correct;\s*if \(!window\.XAPI_USING_G/.test(read('unit-js/20-xapi.js')));
  ok('ledger', 'the state document is v6 with the hints and picks ledgers', /var RESUME_STATE_VERSION = 6;/.test(read('unit-js/40-resume.js')) && /hints: \{\},/.test(read('unit-js/40-resume.js')) && /picks: \{\},/.test(read('unit-js/40-resume.js')));

  /* Flush after the LAST commitment, exactly once per committing path (D-13). */
  const qc = fnBody(read('unit-js/quiz-engine.js'), 'quizCheck');
  const lastCommit = Math.max(qc.lastIndexOf('st.lw = '), qc.lastIndexOf('quizFinish(screen)'), qc.lastIndexOf('st.wasCorrect = '));
  ok('flush', 'quizCheck: onQuizCommitted after the last commitment', qc.lastIndexOf('onQuizCommitted(screen)') > lastCommit);
  ok('flush', 'quizCheck: onQuizCommitted exactly once', (qc.match(/onQuizCommitted\(screen\)/g) || []).length === 1);
  const afterFlush = qc.slice(qc.indexOf('onQuizCommitted(screen)'));
  ok('flush', 'quizCheck: no return between the commitment and the flush (only the done-branch goTo returns, before any commitment)',
     (qc.slice(qc.indexOf('st.attempts += 1'), qc.indexOf('onQuizCommitted')).match(/\breturn\b/g) || []).length === 0);
  ok('flush', 'quizCheck: onQuizAnswered BEFORE any marking', qc.indexOf('onQuizAnswered(') > 0 && qc.indexOf('onQuizAnswered(') < qc.indexOf('quizMarkOutcome') && qc.indexOf('onQuizAnswered(') < qc.indexOf('quizMarkRetry'));
  ok('flush', 'quizCheck: lw is recorded before quizMarkRetry clears the pick', qc.indexOf('st.lw = quizSig') < qc.indexOf('quizMarkRetry(screen, q)'));
  const ga = fnBody(read('unit-js/unit.js'), 'guidedAnswer');
  ok('flush', 'guidedAnswer: the platform hook after the state writes', ga.indexOf('onGuidedAnswered') > ga.lastIndexOf('st.selected ='));
  ok('flush', 'onGuidedAnswered flushes', /flushResumeSave\(\)/.test(fnBody(read('unit-js/70-platform.js'), 'onGuidedAnswered')));
  const oh = fnBody(read('unit-js/quiz-engine.js'), 'quizOpenHint');
  ok('hint', 'quizOpenHint: requested.1 after the done-guard, before the overlay opens', oh.indexOf('if (st.done) return;') < oh.indexOf('onQuizHint(') && oh.indexOf('onQuizHint(') < oh.indexOf("overlay.classList.remove('hidden')"));

  /* Verdicts only through the document (D-12). */
  ok('verdict', 'no raw localStorage verdict write in the unit layer', !/localStorage\.setItem\([^)]*'pass'/.test(all));
  ok('verdict', 'partExit records the verdict through setUnitResult', /setUnitResult\(partResultKey\(\)/.test(pexit));

  /* Keys (D-6, the stub). */
  const resume = read('unit-js/40-resume.js');
  ok('keys', 'UI_CHARACTER_KEY namespaced per unit', /var UI_CHARACTER_KEY = 'methodica_math_percent_08_selectedCharacter';/.test(resume));
  ok('keys', 'NAV_EDGE_KEY names this unit', /var NAV_EDGE_KEY = 'lomda_nav_edges::methodica-math-percent-08';/.test(resume));
  const rk = (/var RESULT_KEYS\s*=\s*(\[[^\]]*\])/.exec(resume) || [])[1];
  const RK = rk ? Function('return ' + rk)() : [];
  eq('keys', 'RESULT_KEYS = one per component, the partResultKey pattern', RK, COMPONENTS.map(c => 'percent08_c' + c + '_result'));
  const stub = read('_test/xapi-720-k.js');
  ok('keys', 'the stub __reset clears exactly RESULT_KEYS', RK.every(k => stub.includes("'" + k + "'")) && !/ratio01_|mass/.test(stub));

  /* Report form: the shared 720 form, keys untouched (§7.2). */
  const rep = read('unit-js/report-modal.js');
  ok('report', 'the shared 720 Google Form endpoint', rep.includes("var REPORT_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSfFq5XFtH1pPpLgV5RWT4m3NanYPW5GKremqTvkp6zKjEGqcw/formResponse';"));
  ['entry.301404029_year', 'entry.301404029_month', 'entry.301404029_day', 'entry.2066097581_hour', 'entry.2066097581_minute',
   'entry.1933069481', 'entry.2070680092', 'entry.1555704258', 'entry.1671046914', 'entry.1179822443', 'entry.806447525']
    .forEach(k => ok('report', 'form key present: ' + k, rep.includes("'" + k + "'")));
  ok('report', 'no-cors + URLSearchParams + thank-you on the synchronous path', /mode: 'no-cors'/.test(rep) && /new URLSearchParams\(\)/.test(rep) && /\.catch\([^)]*\)[\s\S]{0,80}showReportThanks\(\);/.test(rep));
  ok('report', 'flag wired by delegation', /document\.addEventListener\('click', function \(e\) \{\s*if \(e\.target && e\.target\.closest && e\.target\.closest\('\.flag-btn'\)\) openReportModal\(\);/.test(rep));
  ok('report', 'the report CSS hides a [hidden] overlay (display:flex would win otherwise)',
     COMPONENTS.every(c => /\.report-modal-overlay\[hidden\]\s*\{[^}]*display:\s*none/.test(read(PART_DIR(c) + '/styles.css'))));
  COMPONENTS.forEach(c => {
    const html = read(PART_DIR(c) + '/index.html');
    ok('report', c + ': both dialogs ship hidden', /id="report-modal"[^>]*\shidden/.test(html) && /id="report-confirm-modal"[^>]*\shidden/.test(html));
    ok('report', c + ': the three problem types', /value="technical"/.test(html) && /value="unclear"/.test(html) && /value="other"/.test(html));
  });

  /* YouTube (D-1): static embeds only, nothing derived from the URL. */
  const h1 = read(PART_DIR('01') + '/index.html');
  const yt = [...h1.matchAll(/<iframe src="([^"]+)"\s+data-yt-item="(\d{3})"/g)];
  eq('d1', '01: two YouTube iframes carry data-yt-item', yt.map(m => m[2]), ['002', '003']);
  ok('d1', '01: nocookie + enablejsapi, no forigin / widget_referrer', yt.every(m => /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]+\?enablejsapi=1/.test(m[1]) && !/forigin|widget_referrer/.test(m[1])));
  ok('d1', 'no code builds a player with a videoId or reads location.href into a src', !/videoId\s*:/.test(all) && !/widget_referrer/.test(all));
  ok('video', 'no <video> opted into reporting (every clip is a decorative loop)', COMPONENTS.every(c => !/data-xapi-report/.test(read(PART_DIR(c) + '/index.html'))));
  ok('video', 'xapiWireVideos is the state machine, not the pausedOnce latch', !/var pausedOnce/.test(read('unit-js/20-xapi.js')));
}

/* ══════════════ 2. Maps and metadata, per component ══════════════ */
function mapsAndMetadata() {
  const um = H.unitMetadata();
  const idSrc = read('unit-js/10-identity.js');
  const prefix = (/var XAPI_ID_PREFIX = '([^']+)'/.exec(idSrc) || [])[1];
  const unitId = (/window\.XAPI_UNIT_ID = '([^']+)'/.exec(idSrc) || [])[1];
  eq('meta', 'XAPI_UNIT_ID equals the unit JSON id', unitId, um.id);
  const declaredAll = {};
  COMPONENTS.forEach(c => {
    const src = read(PART_DIR(c) + '/script.js');
    const md = H.metadata(c);
    const slug = (/var XAPI_COMP_SLUG\s*=\s*'([^']+)'/.exec(src) || [])[1];
    eq('meta', c + ': XAPI_COMP_SLUG is the folder', slug, PART_DIR(c));
    eq('meta', c + ': XAPI_COMP_ID (prefix + slug + /) equals metadata id', prefix + slug + '/', md.id);
    eq('meta', c + ': learningUnitId is the unit id', md.learningUnitId, um.id);
    ok('meta', c + ': XAPI_METADATA_FILE names an existing <slug>.json', src.includes("'../metadata/" + slug + ".json'") && fs.existsSync(path.join(BASE, 'metadata', slug + '.json')));

    const map = literal(src, 'SCREEN_TO_SUBCONTENT');
    ok('map', c + ': SCREEN_TO_SUBCONTENT parses as a literal', !!map);
    if (!map) return;
    const [a, b] = RANGE[c];
    const want = []; for (let i = a; i <= b; i++) want.push(String(i));
    eq('map', c + ': the map holds exactly this component\'s screens', Object.keys(map).sort((x, y) => x - y), want);
    ok('map', c + ': every value is null or [3-digit suffix, page]', Object.values(map).every(v => v === null || (Array.isArray(v) && /^\d{3}$/.test(v[0]) && typeof v[1] === 'number')));
    const mapped = new Set(Object.values(map).filter(Boolean).map(v => v[0]));
    const items = md.subContent.map(s => s.id);
    const suffixes = new Set(items.map(id => /-(\d{3})\/$/.exec(id)[1]));
    eq('map', c + ': mapped items = catalogue items (both directions)', [...mapped].sort(), [...suffixes].sort());
    items.forEach(id => ok('meta', c + ': item id is <comp id><slug>-NNN/: ' + id.slice(-12), id === md.id + slug + '-' + /-(\d{3})\/$/.exec(id)[1] + '/'));
    md.subContent.forEach(sc => (sc.questions || []).forEach(q => {
      ok('meta', c + ': questionId absolute under its item: ' + q.questionId.slice(-14), q.questionId.indexOf(sc.id) === 0 && /^https:\/\//.test(q.questionId));
    }));

    /* The question map: every declared question reported by some screen; every reported key a
       declared question; each screen's item is the one the screen map gives it. */
    const qmap = literal(src, 'XAPI_QMAP') || {};
    const reported = new Set();
    Object.keys(qmap).forEach(s => {
      const [item, keys] = qmap[s];
      eq('qmap', c + ': s' + s + ' reports the item its screen belongs to', item, map[s] && map[s][0]);
      [].concat(keys).forEach(k => {
        const sc = md.subContent.find(x => x.id.endsWith('-' + item + '/'));
        const hit = sc && (sc.questions || []).find(q => q.questionId === sc.id + k);
        ok('qmap', c + ': s' + s + ' ' + item + '/' + k + ' is a declared questionId', !!hit);
        ok('qmap', c + ': ' + item + '/' + k + ' claimed by one screen only', !reported.has(item + '/' + k));
        reported.add(item + '/' + k);
      });
      const q = Q(Number(s));
      if (Array.isArray(keys) && qmap[s][2] === 'slots') ok('qmap', c + ': s' + s + ' slots = its answer boxes', q && q.correctInputs.length === keys.length);
      if (Array.isArray(keys) && qmap[s][2] === 'rows') ok('qmap', c + ': s' + s + ' rows = its statements', q && q.statements.length === keys.length);
    });
    md.subContent.forEach(sc => (sc.questions || []).forEach(q => {
      const key = /-(\d{3})\/$/.exec(sc.id)[1] + '/' + q.questionId.slice(sc.id.length);
      ok('qmap', c + ': declared question ' + key + ' is reported by a screen (no silent question, D-9)', reported.has(key));
      declaredAll[c + ':' + key] = 1;
    }));

    /* Every graded screen of the component reports; every graded item has questions. */
    QS.filter(q => q.screen >= a && q.screen <= b).forEach(q => ok('qmap', c + ': quiz screen s' + q.screen + ' is in XAPI_QMAP', !!qmap[q.screen]));
    const evals = literal(src, 'XAPI_EVAL_ITEMS') || {};
    Object.keys(evals).forEach(it => {
      const sc = md.subContent.find(x => x.id.endsWith('-' + it + '/'));
      ok('eval', c + ': evaluated item ' + it + ' exists and declares questions', sc && (sc.questions || []).length > 0);
    });
    Object.keys(qmap).forEach(s => {
      const it = qmap[s][0];
      const guided = literal(src, 'XAPI_GUIDED_ITEMS') || {};
      ok('eval', c + ': s' + s + ' item ' + it + ' is either graded or declared guided', !!evals[it] || !!guided[it]);
    });
    /* The report-only pass mark names graded, reported questions only. */
    const pass = /var PART_PASS = null;/.test(src) ? null : Function('return ' + (/var PART_PASS = (\{[\s\S]*?\});/.exec(src) || [])[1])();
    if (pass) {
      ok('pass', c + ': PART_PASS.need ≤ number of sets', pass.need <= pass.sets.length);
      pass.sets.flat().forEach(k => ok('pass', c + ': pass-mark key ' + k + ' is a reported, graded question', reported.has(k) && !!evals[k.split('/')[0]]));
    }
  });
  ok('pass', 'the teammate note on the report-only pass marks exists', fs.existsSync(path.join(BASE, 'docs-and-tools', 'PASS-MARKS.md')));
}

/* ══════════════ 3. Live boots: DOM, surface, painters, Retry gate, D-15 ══════════════ */
const SURFACE = ['xapiOnScreen', 'xapiAnswered', 'xapiRequestedHint', 'xapiEndComponent', 'xapiCompleteComponent', 'restoreEndedButton',
  'xapiYouTubeState', 'xapiWireVideos', 'sendStatementOnce', 'sendCompletedOnce', 'alreadySent', 'markSent', 'readUnitState',
  'flushResumeSave', 'scheduleResumeSave', 'setUnitResult', 'getUnitResult', 'dropBootCover', 'bootXAPI', 'hideCrossPartBack',
  'capturePartPayload', 'applyResumeVars', 'applyResumeDom', 'restoreScreenUI', 'repaintScreen', 'applyExecutionState',
  'partExit', 'partResult', 'lastScreenButton', 'onQuizAnswered', 'onQuizCommitted', 'onQuizHint', 'onGuidedAnswered',
  'quizSig', 'quizCheckBlocked', 'keyboardForward', 'keyboardBack', 'ytWirePlayers', 'ytLeave', 'partBoot', 'openReportModal', 'submitReport'];

const correctAnswer = (q) => {
  if (q.type === 'single') return `quizSelect(${q.screen}, document.querySelector('#q${q.screen} .scq-opt[data-id="${q.correct}"]')); quizCheck(${q.screen});`;
  /* multi-select picks toggle: clear whatever is picked (a restored pending set) first */
  if (q.type === 'multi') return `Array.prototype.slice.call(document.querySelectorAll('#q${q.screen} .scq-opt.selected')).forEach(function(el){ quizSelect(${q.screen}, el); });` + q.correctSet.map(id => `quizSelect(${q.screen}, document.querySelector('#q${q.screen} .scq-opt[data-id="${id}"]'));`).join('') + `quizCheck(${q.screen});`;
  if (q.type === 'value-input') return `(function(){ var s = quizSlots(${q.screen}); ${JSON.stringify(q.correctInputs)}.forEach(function(v,i){ if (s[i]) s[i].value = v; }); quizInputChange(${q.screen}); })(); quizCheck(${q.screen});`;
  if (q.type === 'statement') return `(function(){ var rows = document.querySelectorAll('#q${q.screen} .stmt-row'); ${JSON.stringify(q.statements.map(s => String(s.correct)))}.forEach(function(v,i){ quizStatementPick(${q.screen}, i, rows[i].querySelector('.stmt-pill[data-val="'+v+'"]')); }); })(); quizCheck(${q.screen});`;
  return '';
};
/* A wrong answer, and a DIFFERENT wrong answer, per type. */
const wrongAnswer = (q, alt) => {
  const n = q.screen;
  if (q.type === 'single') {
    const ids = q.options.map(o => o.id).filter(id => id !== q.correct);
    const id = ids[alt ? 1 % ids.length : 0];
    return { pick: `quizSelect(${n}, document.querySelector('#q${n} .scq-opt[data-id="${id}"]'));` };
  }
  if (q.type === 'multi') {
    const wrongIds = q.options.map(o => o.id).filter(id => !q.correctSet.includes(id));
    const set = alt ? [wrongIds[0], q.correctSet[0]] : [wrongIds[0]];
    return { pick: set.map(id => `quizSelect(${n}, document.querySelector('#q${n} .scq-opt[data-id="${id}"]'));`).join('') };
  }
  if (q.type === 'value-input') {
    const vals = q.correctInputs.map((v, i) => /^\d/.test(String(v)) ? String(alt ? 111 + i : 999 + i) : v);
    return { pick: `(function(){ var s = quizSlots(${n}); ${JSON.stringify(vals)}.forEach(function(v,i){ if (s[i]) s[i].value = v; }); quizInputChange(${n}); })();` };
  }
  if (q.type === 'statement') {
    const vals = q.statements.map(s => String(s.correct));
    vals[alt ? 1 : 0] = vals[alt ? 1 : 0] === 'true' ? 'false' : 'true';
    return { pick: `(function(){ var rows = document.querySelectorAll('#q${n} .stmt-row'); ${JSON.stringify(vals)}.forEach(function(v,i){ quizStatementPick(${n}, i, rows[i].querySelector('.stmt-pill[data-val="'+v+'"]')); }); })();` };
  }
  return { pick: '' };
};
const checkDisabled = (b, n) => b.val(`document.getElementById('q${n}-check').disabled`);

async function liveChecks() {
  for (const c of COMPONENTS) {
    const [a, z] = RANGE[c];
    const b = H.boot(c);
    await b.ready;
    SURFACE.forEach(f => ok('surface', c + ': ' + f + ' exists', b.val('typeof ' + f) === 'function'));
    const dom = b.json(`Array.prototype.map.call(document.querySelectorAll('.screen[data-screen]'), function(s){ return Number(s.dataset.screen); }).sort(function(x,y){return x-y;})`);
    const want = []; for (let i = a; i <= z; i++) want.push(i);
    eq('dom', c + ': the DOM holds exactly this component\'s screens', dom, want);
    eq('dom', c + ': it opens on its first screen', b.val('currentScreen'), a);
    ok('dom', c + ': the report dialogs sit in #app, outside every screen', b.val(`document.querySelector('#app > #report-modal') !== null && document.querySelectorAll('.screen #report-modal').length === 0`) === true);
    ok('dom', c + ': one flag button, outside every screen', b.val(`document.querySelectorAll('.flag-btn').length === 1 && !document.querySelector('.screen .flag-btn')`) === true);
    ok('boot', c + ': the boot cover is gone after boot', !b.w.document.getElementById('boot-cover'));
    ok('boot', c + ': PART_FIRST/PART_LAST from PART_CONFIG', b.val('PART_FIRST') === a && b.val('PART_LAST') === z);
    ok('boot', c + ': no console.error on a clean boot', b.errors.length === 0, b.errors.join(' | '));
    /* a goTo sweep over every screen, tracking currentScreen */
    const sweep = b.json(`(function(){ var out = []; for (var i = ${a}; i <= ${z}; i++) { goTo(i); out.push(currentScreen); } return out; })()`);
    eq('dom', c + ': goTo sweep lands on every screen', sweep, want);
    b.close();

    /* Painters never throw, and the answered look comes back after a reload (rules 7 + 8). */
    const qs = QS.filter(q => q.screen >= a && q.screen <= z);
    const p = H.boot(c);
    await p.ready;
    p.exec(`goTo(${a});`);
    qs.forEach(q => p.exec(`goTo(${q.screen});` + correctAnswer(q)));
    if (c === '01') [5, 6, 7].forEach(n => p.exec(`goTo(${n}); guidedAnswer(${n}, document.querySelector('#g${n} .gc-opt[data-idx="1"]'));`));
    p.exec(`goTo(${a});`);
    const errs0 = p.errors.length;
    const p2 = H.boot(c, { session: p.session() });
    p.close();
    await p2.ready;
    p2.exec(`for (var i = ${a}; i <= ${z}; i++) goTo(i);`);
    ok('paint', c + ': no painter error walking every screen after a full restore', p2.errors.filter(e => /\[resume\]/.test(e)).length === 0 && errs0 === 0, p2.errors.join(' | '));
    qs.forEach(q => {
      const n = q.screen;
      p2.exec(`goTo(${n});`);
      const look = p2.json(`(function(){ var s = document.getElementById('q${n}'); return {
        btn: document.getElementById('q${n}-check').textContent,
        fb: document.getElementById('q${n}-feedbox').className,
        correct: s.querySelectorAll('.correct').length,
        locked: s.querySelectorAll('.scq-opt.locked').length,
        disabledInputs: Array.prototype.filter.call(s.querySelectorAll('.vi-input, .slot-select'), function(i){ return i.disabled; }).length,
        disabledPills: s.querySelectorAll('.stmt-pill:disabled').length }; })()`);
      ok('paint', c + ': s' + n + ' (' + q.type + ') restored as answered: "שנמשיך?" + correct feedback', look.btn === 'متابعة' && /is-correct/.test(look.fb), JSON.stringify(look));
      ok('paint', c + ': s' + n + ' shows the answer (correct marks on screen)', look.correct > 0, JSON.stringify(look));
      if (q.type === 'single' || q.type === 'multi') ok('paint', c + ': s' + n + ' options locked', look.locked === q.options.length, JSON.stringify(look));
      if (q.type === 'value-input') ok('paint', c + ': s' + n + ' boxes disabled and holding the answer', look.disabledInputs === q.correctInputs.length && p2.val(`quizSlots(${n}).map(function(i){return i.value;}).join('|')`) === q.correctInputs.join('|'), JSON.stringify(look));
      if (q.type === 'statement') ok('paint', c + ': s' + n + ' pills disabled', look.disabledPills === q.statements.length * 2, JSON.stringify(look));
    });
    if (c === '01') [5, 6, 7].forEach(n => {
      p2.exec(`goTo(${n});`);
      ok('paint', '01: guided s' + n + ' restored: correct marked, locked, שנמשיך? enabled',
         p2.val(`document.querySelector('#g${n} .gc-opt.correct') !== null && document.querySelectorAll('#g${n} .gc-opt.locked').length > 0 && document.getElementById('g${n}-check').disabled === false`) === true);
    });
    if (c === '02') {
      p2.exec('goTo(11);');
      ok('paint', '02: the hub after a full restore: all four zones done, המשך open', p2.val(`document.querySelectorAll('.map-pin.is-done').length === 4 && document.getElementById('s11-continue').disabled === false`) === true);
    }
    /* Painter dispatch (rule 11): every stateful screen type has a branch. */
    const disp = fnBody(read('unit-js/70-platform.js'), 'restoreScreenUI');
    ['single', 'multi', 'value-input', 'statement'].forEach(t => {
      if (qs.some(q => q.type === t)) ok('dispatch', c + ': restoreScreenUI dispatches ' + t, disp.includes("'" + t + "'"));
    });
    ok('dispatch', 'restoreScreenUI dispatches the guided screens and the hub', /_guidedCfg\(n\)/.test(disp) && /n === 11/.test(disp));
    ok('dispatch', c + ': no unsupported question type in this component', qs.every(q => ['single', 'multi', 'value-input', 'statement'].includes(q.type)), qs.map(q => q.type).join(','));
    p2.close();

    /* The Retry gate on every two-attempt question (D-14), and D-15. */
    for (const q of qs.filter(x => x.maxAttempts >= 2)) {
      const n = q.screen;
      const g = H.boot(c);
      await g.ready;
      g.exec(`goTo(${n});`);
      const w1 = wrongAnswer(q, false), w2 = wrongAnswer(q, true);
      g.exec(w1.pick + `quizCheck(${n});`);
      const wasRetry = g.val(`quizState[${n}].attempts === 1 && !quizState[${n}].done`);
      ok('retry', c + ': s' + n + ' a first wrong attempt is a retry', wasRetry === true);
      if (!wasRetry) { g.close(); continue; }
      ok('retry', c + ': s' + n + ' lw recorded', !!g.val(`quizState[${n}].lw`));
      /* A multi-select retry drops the wrong picks, so re-applying the same picks re-selects them. */
      g.exec(w1.pick);
      ok('retry', c + ': s' + n + ' the same wrong answer again → צדקתי? disabled', checkDisabled(g, n) === true);
      g.exec(w2.pick);
      const w2Blocked = checkDisabled(g, n);
      ok('retry', c + ': s' + n + ' a different answer → enabled', w2Blocked === false, 'sig ' + g.val(`quizSig(QUESTIONS.find(function(x){return x.screen===${n};}), quizState[${n}])`) + ' lw ' + g.val(`quizState[${n}].lw`));
      /* D-15: after changing the answer, leave and return — no wrong-attempt look on the new answer */
      g.exec(`goTo(${n === a ? n + 1 : n - 1}); goTo(${n});`);
      const d15 = g.json(`(function(){ var s = document.getElementById('q${n}'); return { wrong: s.querySelectorAll('.wrong').length, fb: document.getElementById('q${n}-feedbox').className }; })()`);
      ok('d15', c + ': s' + n + ' changed answer after leave/return: no ✗ and no retry prompt on it', d15.wrong === 0 && !/is-wrong/.test(d15.fb), JSON.stringify(d15));
      /* back to the rejected answer: blocked again, then across a reload */
      if (q.type !== 'multi') {
        g.exec(w1.pick);
        ok('retry', c + ': s' + n + ' back to the rejected answer → disabled', checkDisabled(g, n) === true);
      }
      /* The picks above call the handlers directly (no click event, so no debounced save armed);
         flush as the pending-answer save would 800ms after a real click. */
      g.exec('flushResumeSave();');
      const g2 = H.boot(c, { session: g.session() });
      g.close();
      await g2.ready;
      g2.exec(`goTo(${n});`);
      if (q.type !== 'multi') ok('retry', c + ': s' + n + ' after a reload the rejected answer is still blocked', checkDisabled(g2, n) === true, 'lw ' + g2.val(`quizState[${n}].lw`));
      ok('retry', c + ': s' + n + ' lw survived the reload', !!g2.val(`quizState[${n}].lw`));
      g2.exec(correctAnswer(q));
      ok('retry', c + ': s' + n + ' the correct answer then finishes it', g2.val(`quizState[${n}].done && quizState[${n}].wasCorrect`) === true);
      ok('retry', c + ': s' + n + ' no console.error', g2.errors.length === 0, g2.errors.join(' | '));
      g2.close();
    }
  }
}

(async function main() {
  try { staticChecks(); } catch (e) { R.failures.push('[static] threw: ' + e.stack); }
  try { mapsAndMetadata(); } catch (e) { R.failures.push('[maps] threw: ' + e.stack); }
  try { await liveChecks(); } catch (e) { R.failures.push('[live] threw: ' + e.stack); }
  R.done();
})();
