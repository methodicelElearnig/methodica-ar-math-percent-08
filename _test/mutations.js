/* ═══════════════════ negative tests — methodica-ar-math-percent-08 ═══════════════════
   NOT DEPLOYED. Dev tooling only. Guide §10.4: an assertion that cannot fail is worse than none.

   Each mutation breaks ONE thing in the real source, runs both suites, and requires that they
   FAIL with at least one failure tagged as expected. The anchor must occur exactly once (a
   mutation that silently did not apply "passes" — seen twice in this project family), the
   mutated file must differ from the original, and the original bytes are restored and compared
   afterwards, whatever happens.

   Run:  NODE_PATH=/tmp/lomda-test-p08/node_modules node _test/mutations.js
*/
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const BASE = path.join(__dirname, '..');

const M = [
  { name: 'Retry gate off', file: 'unit-js/quiz-engine.js',
    from: "return !!(st && st.lw && q && quizSig(q, st) === st.lw);", to: 'return false;', expect: /\[retry\]/ },
  { name: 'hub exception dropped (O-1 leaves zone items open)', file: 'unit-js/20-xapi.js',
    from: "if (typeof XAPI_HUB_SCREENS !== 'undefined' && XAPI_HUB_SCREENS && XAPI_HUB_SCREENS[toScreen]) return false;", to: '', expect: /\[hub\]/ },
  { name: 'B-2: direction by item again (Back onto a null screen closes the item)', file: 'unit-js/20-xapi.js',
    from: '  if (fromScreen != null && toScreen != null) return Number(toScreen) < Number(fromScreen);\n', to: '', expect: /\[b2\]/ },
  { name: 'B-1 guard dropped', file: 'unit-js/20-xapi.js',
    from: 'function _xapiCloseItem(item) {\n  if (_xapiLibWouldDrop(item)) return;', to: 'function _xapiCloseItem(item) {', expect: /\[(b1|ledger)\]/ },
  { name: 'D-8: repaint no longer re-disables the ended button', file: 'unit-js/70-platform.js',
    from: '    restoreEndedButton();   // D-8: the painter just re-enabled a finished component\'s button', to: '', expect: /\[d8\]/ },
  { name: 'flush moved before the commitment', file: 'unit-js/quiz-engine.js',
    from: "    st.lw = quizSig(q, st);                 // Retry gate — BEFORE quizMarkRetry clears the pick",
    to: "    if (typeof onQuizCommitted === 'function') onQuizCommitted(screen);\n    st.lw = quizSig(q, st);", expect: /\[flush\]/ },
  { name: 'first-screen back not hidden', file: 'unit-js/90-boot.js',
    from: "  try { hideCrossPartBack(); }       catch (e) { console.error('[boot] hideCrossPartBack', e); }\n", to: '', expect: /\[route\]/ },
  { name: 'YouTube iframe blanked again (API binding severed)', file: 'unit-js/engine.js',
    from: "    if (typeof ytLeave === 'function' && ytLeave(f)) return;\n", to: '', expect: /\[yt\]/ },
  { name: 'B-4: a not-yet-ready player is blanked again', file: 'unit-js/70-platform.js',
    from: "  if (!p) return false;\n  if (typeof p.stopVideo !== 'function') {", to: "  if (!p || typeof p.stopVideo !== 'function') return false;\n  if (false) {", expect: /\[yt\]/ },
  { name: 'B-4: self-heal on entry dropped', file: 'unit-js/engine.js',
    from: "    if (f.__ytPlayer) { if (typeof ytHeal === 'function') ytHeal(f); return; }", to: '    if (f.__ytPlayer) return;', expect: /\[yt\]/ },
  { name: 'painter paints too little on a done choice (rule 8)', file: 'unit-js/70-platform.js',
    from: '  if (st.done) {\n    quizMarkOutcome(n, q, !!st.wasCorrect);\n    _paintDone(n, q, st);\n    return;\n  }\n  check.textContent = \'هل إجابتي صحيحة؟\';\n  quizHideFeedback(n);\n  if (st.attempts > 0) {\n    var hb = _hintBtn(n);\n    if (hb) hb.style.visibility = \'visible\';\n    /* Still',
    to: '  if (st.done) {\n    _paintDone(n, q, st);\n    return;\n  }\n  check.textContent = \'هل إجابتي صحيحة؟\';\n  quizHideFeedback(n);\n  if (st.attempts > 0) {\n    var hb = _hintBtn(n);\n    if (hb) hb.style.visibility = \'visible\';\n    /* Still', expect: /\[paint\]/ },
  { name: 'report posts the folder-regex slug again', file: 'unit-js/report-modal.js',
    from: "  if (m && m.id) return _reportShort(m.id);", to: "  return 'methodica-ar-math-percent-08-xx';", expect: /\[report\]/ },
  { name: 'resume emits no landing item (loader skips xapiOnScreen after a restore)', file: 'unit-js/50-loader.js',
    from: '            try { xapiOnScreen(currentScreen); } catch (e) {}', to: '            if (!_resumed) { try { xapiOnScreen(currentScreen); } catch (e) {} }', expect: /\[resume\]/ },
  { name: 'split screen reported as one verdict', file: 'unit-js/70-platform.js',
    from: '  if (keys.length === 1 || !split) {', to: '  if (true) {', expect: /\[split\]/ },
  { name: 'guided item leaks into the component score', file: 'methodica-ar-math-percent-08-01/script.js',
    from: "var XAPI_EVAL_ITEMS   = { '001': 1 };", to: "var XAPI_EVAL_ITEMS   = { '001': 1, '002': 1 };", expect: /\[(guided|eval)\]/ },
  { name: 'a declared question left silent (D-9)', file: 'methodica-ar-math-percent-08-04/script.js',
    from: "  47: ['001', ['q5', 'q6', 'q7', 'q8'], 'rows']", to: "  47: ['001', ['q5', 'q6', 'q7'], 'rows']", expect: /\[qmap\]/ },
  { name: 'a screen missing from the map', file: 'methodica-ar-math-percent-08-03/script.js',
    from: "  35: null,             // transition into the coupons block\n", to: '', expect: /\[map\]/ },
  { name: '?v= mismatch between components', file: 'methodica-ar-math-percent-08-02/index.html',
    from: '<script src="../unit-js/20-xapi.js?v=21"></script>', to: '<script src="../unit-js/20-xapi.js?v=99"></script>', expect: /\[v\]/ },
  { name: 'pass mark counted over the wrong set', file: 'methodica-ar-math-percent-08-03/script.js',
    from: "  ['005/q1', '005/q2']\n] };", to: "  ['005/q1', '005/q2'],\n  ['006/q1']\n] };", expect: /\[pass\]/ },
];

function run(suite) {
  try {
    const out = execFileSync(process.execPath, [path.join(__dirname, suite)], { cwd: BASE, env: process.env, encoding: 'utf8', timeout: 300000 });
    return { code: 0, out };
  } catch (e) { return { code: e.status, out: String(e.stdout || '') + String(e.stderr || '') }; }
}

let bad = 0;
for (const m of M) {
  const f = path.join(BASE, m.file);
  const orig = fs.readFileSync(f);
  const src = orig.toString('utf8');
  const count = src.split(m.from).length - 1;
  if (count !== 1) { console.log('✗ ' + m.name + ': anchor occurs ' + count + ' times — mutation NOT applied'); bad++; continue; }
  const mutated = src.replace(m.from, m.to);
  try {
    fs.writeFileSync(f, mutated);
    if (fs.readFileSync(f, 'utf8') === src) throw new Error('mutation did not land');
    const a = run('verify-report.js'), b = run('statement-flow.js');
    const out = a.out + '\n' + b.out;
    const fails = out.split('\n').filter(l => /^\s+\[/.test(l));
    const hit = fails.some(l => m.expect.test(l));
    if ((a.code || b.code) && hit) console.log('✓ ' + m.name + ' — caught (' + fails.length + ' failures)');
    else { console.log('✗ ' + m.name + ' — NOT caught (exit ' + a.code + '/' + b.code + ', ' + fails.length + ' failures)'); fails.slice(0, 5).forEach(l => console.log('    ' + l.trim())); bad++; }
  } finally {
    fs.writeFileSync(f, orig);
    if (!fs.readFileSync(f).equals(orig)) { console.log('!! RESTORE FAILED for ' + m.file); process.exit(2); }
  }
}
console.log('\nmutations: ' + (M.length - bad) + ' of ' + M.length + ' caught');
process.exitCode = bad ? 1 : 0;
