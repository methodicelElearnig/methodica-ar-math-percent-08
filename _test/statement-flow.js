/* ═══════════════════ behavioural statement-flow oracle — methodica-math-percent-08 ═══════════════════
   NOT DEPLOYED. Dev tooling only.

   verify-report.js asserts STRUCTURE. This asserts BEHAVIOUR: which statements actually leave the
   lomda when a learner does something, in what order, carrying what result — and which do NOT
   leave when the same screen is reached again by a reload or the back button.

   Every scenario boots the real page through _test/harness.js (the real loader, the stub library
   through ?xapiLib=, metadata from disk) and drives the real handlers (quizSelect / quizCheck /
   guidedAnswer / the buttons). A "reload" is a second boot carrying the first one's
   sessionStorage, which is where the stub keeps the state document and the statement log.

   Run:  NODE_PATH=/tmp/lomda-test-p08/node_modules node _test/statement-flow.js
*/
'use strict';

const H = require('./harness');
const R = H.makeReporter('statement-flow');
const { ok, eq } = R;

const since = (b, n) => b.stmts().slice(n);
const answer = {
  single: (n, id) => `quizSelect(${n}, document.querySelector('#q${n} .scq-opt[data-id="${id}"]')); quizCheck(${n});`,
  pick: (n, id) => `quizSelect(${n}, document.querySelector('#q${n} .scq-opt[data-id="${id}"]'));`,
  values: (n, vals) => `(function(){ var s = quizSlots(${n}); ${JSON.stringify(vals)}.forEach(function(v,i){ if (s[i]) s[i].value = v; }); quizInputChange(${n}); })(); quizCheck(${n});`,
  typeOnly: (n, vals) => `(function(){ var s = quizSlots(${n}); ${JSON.stringify(vals)}.forEach(function(v,i){ if (s[i]) s[i].value = v; }); quizInputChange(${n}); })();`,
  rows: (n, vals) => `(function(){ var rows = document.querySelectorAll('#q${n} .stmt-row'); ${JSON.stringify(vals)}.forEach(function(v,i){ var p = rows[i].querySelector('.stmt-pill[data-val="'+v+'"]'); quizStatementPick(${n}, i, p); }); })(); quizCheck(${n});`,
  guided: (n, idx) => `guidedAnswer(${n}, document.querySelector('#g${n} .gc-opt[data-idx="${idx}"]'));`,
};
const QS = H.loadQuestions();
const Q = n => QS.find(q => q.screen === n);
const wrongOf = n => Q(n).options.map(o => o.id).find(id => id !== Q(n).correct);

async function reload(b, opts) {
  const s = b.session();
  b.close();
  const b2 = H.boot(opts.c, Object.assign({ session: s }, opts));
  await b2.ready;
  return b2;
}

/* ══════════════ 1. A fresh load, and the item boundaries ══════════════ */
async function freshLoad() {
  const b = H.boot('01');
  await b.ready;
  eq('fresh', 'a fresh load of 01 (landing s0 = no item) emits only the component initialized', b.verbs(), ['initialized']);
  ok('fresh', 'it is component-scoped', b.stmts()[0].objectType === 'onlinelesson', JSON.stringify(b.stmts()[0]));
  ok('fresh', 'the boot cover is gone', !b.w.document.getElementById('boot-cover'));
  ok('fresh', 'the stub library was loaded through ?xapiLib= (the CDN was not)', !b.w.__cdnLibFetched && b.val('typeof sendStatement720') === 'function');
  ok('fresh', 'the loader ran the ID check with no mismatch', !b.errors.some(e => /ID MISMATCH/.test(e)), b.errors.join(' | '));

  let n = b.stmts().length;
  b.exec('goTo(1);');
  const s1 = since(b, n);
  eq('fresh', 'goTo(1) → exactly one statement: initialized on item 001', s1.map(s => s.verb), ['initialized']);
  ok('fresh', 'it names the item and flags it evaluated',
     s1[0] && /methodica-math-percent-08-01-001\/$/.test(s1[0].objectId) && s1[0].opts.isEvaluationItem === true, JSON.stringify(s1[0]));

  n = b.stmts().length;
  b.exec('goTo(2);');
  eq('fresh', 'paging inside one item (s1 → s2, both 001) → zero statements', since(b, n).length, 0);

  b.exec(answer.single(1, Q(1).correct));   // answer on the way back is not needed — s1 correct now
  n = b.stmts().length;
  b.exec('goTo(3);');
  const s3 = since(b, n);
  eq('fresh', 'crossing into item 002 → completed(001) then initialized(002)', s3.map(s => s.verb + ':' + (s.objectId || '').slice(-4)), ['completed:001/', 'initialized:002/']);
  ok('fresh', 'no console.error during the walk', b.errors.length === 0, b.errors.join(' | '));
  b.close();
}

/* ══════════════ 2. Answering, the Retry gate ══════════════ */
async function answering() {
  const b = H.boot('01');
  await b.ready;
  b.exec('goTo(1);');
  let n = b.stmts().length;
  const w = wrongOf(1);
  b.exec(answer.single(1, w));
  const a1 = since(b, n);
  eq('answer', 'a non-final wrong attempt → one plain answered', a1.map(s => s.verb), ['answered']);
  const r1 = a1[0] && a1[0].result;
  ok('answer', 'success false, scaled 0', r1 && r1.success === false && r1.score.scaled === 0, JSON.stringify(r1));
  ok('answer', 'student_answer is an array of one non-empty string',
     r1 && Array.isArray(r1.extensions.student_answer) && r1.extensions.student_answer.length === 1 && r1.extensions.student_answer[0].length > 0, JSON.stringify(r1 && r1.extensions));
  const md = H.metadata('01');
  const qid = md.subContent[0].questions[0].questionId;
  ok('answer', 'questionId is the catalogue\'s own, byte for byte', a1[0] && a1[0].opts.questionId === qid, a1[0] && a1[0].opts.questionId);
  ok('answer', 'parentId is the item', a1[0] && a1[0].opts.parentId === md.subContent[0].id, a1[0] && a1[0].opts.parentId);

  /* Retry gate (D-14): the same wrong answer cannot be submitted again. */
  b.exec(answer.pick(1, w));
  ok('retry', 're-picking the rejected answer leaves צדקתי? disabled', b.val(`document.getElementById('q1-check').disabled`) === true);
  b.exec(answer.pick(1, Q(1).correct));
  ok('retry', 'a different pick enables it', b.val(`document.getElementById('q1-check').disabled`) === false);
  b.exec(answer.pick(1, w));
  ok('retry', 'back to the rejected pick disables it again', b.val(`document.getElementById('q1-check').disabled`) === true);
  b.close();

  const c = H.boot('01');
  await c.ready;
  c.exec('goTo(1);');
  c.exec(answer.single(1, wrongOf(1)));
  n = c.stmts().length;
  c.exec(answer.single(1, Q(1).correct));
  const a2 = since(c, n);
  eq('answer', 'the resolving correct attempt → answered.last', a2.map(s => s.verb), ['answered.last']);
  ok('answer', 'success true, scaled 1', a2[0] && a2[0].result.success === true && a2[0].result.score.scaled === 1, JSON.stringify(a2[0] && a2[0].result));
  c.close();

  /* A final wrong answer (attempts exhausted) is answered.last, success false. */
  const d = H.boot('03');
  await d.ready;
  d.exec('goTo(38);');
  n = d.stmts().length;
  d.exec(answer.single(38, wrongOf(38)));     // maxAttempts 1
  const a3 = since(d, n).filter(s => /^answered/.test(s.verb));
  eq('answer', 's38 (one attempt) wrong → answered.last, success false', a3.map(s => s.verb + ':' + s.result.success), ['answered.last:false']);
  d.close();
}

/* ══════════════ 3. Hints: once per question, across a reload (D-7) ══════════════ */
async function hints() {
  const b = H.boot('02');
  await b.ready;
  b.exec('goTo(11); goTo(12); goTo(13);');
  b.exec(answer.single(13, wrongOf(13)));                  // hintPolicy after-wrong: now visible
  let n = b.stmts().length;
  b.exec('quizOpenHint(13); quizCloseHint(); quizOpenHint(13); quizCloseHint();');
  const h = since(b, n);
  eq('hint', 'opening the hint twice → one requested.1', h.map(s => s.verb), ['requested.1']);
  ok('hint', 'against the screen\'s declared question', h[0] && /methodica-math-percent-08-02-002\/q1$/.test(h[0].opts.questionId), h[0] && h[0].opts.questionId);
  const b2 = await reload(b, { c: '02' });
  b2.exec('goTo(13);');
  n = b2.stmts().length;
  b2.exec('quizOpenHint(13); quizCloseHint();');
  eq('hint', 'after a reload the same hint reports nothing (hints ledger in the document)', since(b2, n).filter(s => s.verb === 'requested.1').length, 0);
  b2.close();

  const c = H.boot('03');
  await c.ready;
  c.exec('goTo(29);');                                     // hintPolicy always
  n = c.stmts().length;
  c.exec('quizOpenHint(29);');
  eq('hint', "an 'always' hint reports on its first open, before any attempt", since(c, n).map(s => s.verb), ['requested.1']);
  c.close();
}

/* ══════════════ 4. The map hub (component 02): zone items close on the return ══════════════ */
async function hub() {
  const b = H.boot('02');
  await b.ready;
  b.exec('goTo(11); goTo(12);');
  let n = b.stmts().length;
  b.exec(answer.single(13, Q(13).correct).replace(/^/, 'goTo(13);'));
  b.exec(`document.getElementById('q13-check').click();`);   // "שנמשיך?" → q.next = 11
  eq('hub', 'the zone question routes back to the hub', b.val('currentScreen'), 11);
  const s = since(b, n);
  const seq = s.map(x => x.verb + (x.objectId ? ':' + x.objectId.slice(-4) : ''));
  ok('hub', 'returning to the hub closes the zone item 002', seq.indexOf('completed:002/') !== -1, seq.join(','));
  ok('hub', '…before the hub item is opened again', seq.indexOf('completed:002/') < seq.lastIndexOf('initialized:001/'), seq.join(','));
  ok('hub', 'the hub marks zone 4 done', b.val(`document.getElementById('map-pin-4').classList.contains('is-done')`) === true);

  /* Leaving a zone through its Back button before answering: the unanswered evaluated item is
     NOT closed (B-1 — the library would drop it and the ledger must not mark it). */
  b.exec('goTo(14); goTo(15);');
  n = b.stmts().length;
  b.exec('goTo(14); goTo(11);');
  ok('b1', 'backing out of zone 3 unanswered sends no completed for item 003',
     !since(b, n).some(x => x.verb === 'completed' && /-003\/$/.test(x.objectId || '')), JSON.stringify(since(b, n).map(x => x.verb + ':' + x.objectId)));
  ok('b1', 'and does not mark it in the ledger', b.val(`alreadySent('doneItems', itemLedgerKey('003'))`) === false);
  /* …and when it is answered later, its real completed goes out. */
  b.exec('goTo(14); goTo(15);');
  b.exec(answer.values(15, Q(15).correctInputs));
  b.exec(`document.getElementById('q15-check').click();`);
  b.exec(answer.values(16, Q(16).correctInputs));
  b.exec(`document.getElementById('q16-check').click();`);   // → 17 (item 004)
  const done003 = b.stmts().filter(x => x.verb === 'completed' && /-003\/$/.test(x.objectId || ''));
  eq('b1', 'item 003 reports exactly one completed once answered', done003.length, 1);
  ok('b1', 'with its explicit result (2/2 correct)', done003[0] && done003[0].result && done003[0].result.success === true && done003[0].result.score.scaled === 1, JSON.stringify(done003[0] && done003[0].result));
  ok('hub', 'no duplicate completed anywhere', b.json('window.__dupes()').length === 0, JSON.stringify(b.json('window.__dupes()')));
  ok('hub', 'no console.error', b.errors.length === 0, b.errors.join(' | '));
  b.close();
}

/* ══════════════ 5. Split screens: one statement per declared question (04) ══════════════ */
async function splits() {
  const b = H.boot('04');
  await b.ready;
  b.exec('goTo(45);');
  let n = b.stmts().length;
  const ci = Q(45).correctInputs;
  b.exec(answer.values(45, [ci[0], '999999']));
  const a = since(b, n).filter(s => /^answered/.test(s.verb));
  eq('split', 's45 (two boxes) → two answered, one per declared question', a.map(s => s.opts.questionId.split('/').pop()), ['q3', 'q4']);
  eq('split', 'each with its own verdict (right box, wrong box)', a.map(s => s.result.success), [true, false]);
  ok('split', 'sharing one isLast (a first wrong attempt → plain answered)', a.every(s => s.verb === 'answered'), a.map(s => s.verb).join(','));

  b.exec('goTo(47);');
  n = b.stmts().length;
  const key = Q(47).statements.map(s => String(s.correct));
  const vals = key.slice(); vals[0] = vals[0] === 'true' ? 'false' : 'true';
  b.exec(answer.rows(47, vals));
  const r = since(b, n).filter(s => /^answered/.test(s.verb));
  eq('split', 's47 (four statements) → four answered with distinct questionIds', r.map(s => s.opts.questionId.split('/').pop()), ['q5', 'q6', 'q7', 'q8']);
  eq('split', 'row verdicts: only the first wrong', r.map(s => s.result.success), [false, true, true, true]);
  ok('split', 'the answer text is the Hebrew label', r[1] && /صحيح/.test(r[1].result.extensions.student_answer[0]), r[1] && r[1].result.extensions.student_answer[0]);
  b.close();
}

/* ══════════════ 5b. Back onto a screen with no item (QA 2026-10-02 B-2) ══════════════
   Live: 04 s42 answered → Back s41 → Back s40 (null) closed item 001 with q1 only (0.125); the real
   close after 8/8 was then swallowed by the ledger. Direction is the SCREEN's, not the item's. */
async function backToNull() {
  const b = H.boot('04');
  await b.ready;
  b.exec('goTo(41); goTo(42);' + answer.values(42, Q(42).correctInputs));
  let n = b.stmts().length;
  b.exec('goTo(41); goTo(40);');
  ok('b2', '04: Back s42 → s41 → s40 (no item) sends no completed for item 001',
     !since(b, n).some(s => s.verb === 'completed'), since(b, n).map(s => s.verb + ':' + s.objectId).join(','));
  ok('b2', '04: and does not mark it in the ledger', b.val(`alreadySent('doneItems', itemLedgerKey('001'))`) === false);
  b.exec('goTo(41); goTo(42); goTo(43); goTo(44);' + answer.single(44, Q(44).correct));
  b.exec('goTo(45);' + answer.values(45, Q(45).correctInputs));
  b.exec('goTo(46); goTo(47);' + answer.rows(47, Q(47).statements.map(s => String(s.correct))));
  b.exec('goTo(48); xapiFinishItems();');
  const done = b.stmts().filter(s => s.verb === 'completed' && /-04-001\/$/.test(s.objectId || ''));
  eq('b2', '04: item 001 reports exactly one completed', done.length, 1);
  ok('b2', '04: with the full result (8/8), not the partial one', done[0] && done[0].result && done[0].result.success === true && done[0].result.score.scaled === 1, JSON.stringify(done[0] && done[0].result));
  ok('b2', 'no console.error', b.errors.length === 0, b.errors.join(' | '));
  b.close();

  /* 03: the same rule on a mid-component null screen — and the control that FORWARD onto it
     still closes the item left behind. */
  const c = H.boot('03');
  await c.ready;
  c.exec('goTo(33);' + answer.values(33, Q(33).correctInputs) + 'goTo(34);' + answer.single(34, Q(34).correct));
  n = c.stmts().length;
  c.exec('goTo(35);');
  ok('b2', '03: forward s34 → s35 (no item) still closes item 005',
     since(c, n).some(s => s.verb === 'completed' && /-005\/$/.test(s.objectId || '')), since(c, n).map(s => s.verb + ':' + s.objectId).join(','));
  c.exec('goTo(36);' + answer.values(36, Q(36).correctInputs));
  n = c.stmts().length;
  c.exec('goTo(35);');
  ok('b2', '03: Back s36 → s35 (no item) leaves item 006 open',
     !since(c, n).some(s => s.verb === 'completed'), since(c, n).map(s => s.verb + ':' + s.objectId).join(','));
  ok('b2', '03: no duplicate completed', c.json('window.__dupes()').length === 0, JSON.stringify(c.json('window.__dupes()')));
  c.close();
}

/* ══════════════ 6. Guided screens: provisional fictive result, never scored ══════════════ */
async function guided() {
  const b = H.boot('01');
  await b.ready;
  b.exec('goTo(1);' + answer.single(1, wrongOf(1)) + answer.single(1, wrongOf(1) === 'a' ? 'c' : 'a'));
  b.exec('goTo(3); goTo(4); goTo(5);');
  let n = b.stmts().length;
  b.exec(answer.guided(5, 0));                               // the WRONG pill (key is index 1)
  const g = since(b, n);
  eq('guided', 'a guided pick → one answered.last', g.map(s => s.verb), ['answered.last']);
  ok('guided', 'with the fictive result success:true / scaled:1, whatever was picked', g[0] && g[0].result.success === true && g[0].result.score.scaled === 1, JSON.stringify(g[0] && g[0].result));
  ok('guided', 'against 002/q1', g[0] && /-01-002\/q1$/.test(g[0].opts.questionId), g[0] && g[0].opts.questionId);
  ok('guided', "the learner's pick is the answer text", g[0] && g[0].result.extensions.student_answer[0] === 'نعم', g[0] && g[0].result.extensions.student_answer[0]);
  const res = b.json('partResult()');
  ok('guided', 'the guided item never enters the component score (only s1 counts)', res && res.score && (res.score.scaled === 0 || res.score.scaled === 1), JSON.stringify(res));
  ok('guided', 'item 002 is not an evaluation item', b.val(`_xapiIsEval('002')`) === false);
  b.close();
}

/* ══════════════ 7. The component end, the ledger, the ended button (D-8) ══════════════ */
async function componentEnd() {
  const b = H.boot('01');
  await b.ready;
  b.exec('goTo(1);' + answer.single(1, Q(1).correct));
  b.exec('for (var i = 2; i <= 9; i++) goTo(i);');
  const path0 = b.val('location.pathname');
  let n = b.stmts().length;
  b.exec(`document.getElementById('s9-continue').click();`);
  const e = since(b, n);
  const comp = e.filter(s => s.verb === 'completed' && s.objectType === 'onlinelesson');
  eq('end', 'the last click → one component completed', comp.length, 1);
  ok('end', 'it closes the open item first', e.findIndex(s => s.verb === 'completed' && /-003\/$/.test(s.objectId || '')) < e.indexOf(comp[0]), e.map(s => s.verb + ':' + s.objectId).join(','));
  ok('end', 'component 01 (no pass mark) → success:true, scaled = s1', comp[0] && comp[0].result.success === true && comp[0].result.score.scaled === 1, JSON.stringify(comp[0] && comp[0].result));
  ok('end', 'the button is disabled', b.val(`document.getElementById('s9-continue').disabled`) === true);
  eq('end', 'the page did not navigate (the platform routes)', b.val('location.pathname'), path0);
  eq('end', 'the verdict is recorded through setUnitResult', b.val(`getUnitResult('percent08_c01_result')`), 'pass');
  n = b.stmts().length;
  b.exec(`goTo(10);`);                                        // the same exit, again (keyboard / a second click)
  eq('end', 'a second exit → zero statements (ledger)', since(b, n).length, 0);
  ok('end', 'no statement ever names the unit', !b.stmts().some(s => s.objectId === 'methodica-math-percent-08'));

  const b2 = await reload(b, { c: '01' });
  eq('end', 'a reload lands back on the finished screen', b2.val('currentScreen'), 9);
  ok('d8', 'and its button stays disabled (ledger says done)', b2.val(`document.getElementById('s9-continue').disabled`) === true);
  b2.exec('goTo(8); goTo(9);');
  ok('d8', 'also after stepping back and forward', b2.val(`document.getElementById('s9-continue').disabled`) === true);
  b2.close();

  /* The case that matters: a QUIZ last screen (03 s39), whose painter re-enables "שנמשיך?". */
  const q = H.boot('03');
  await q.ready;
  q.exec('goTo(39);' + answer.single(39, 'b').replace('quizCheck(39);', '') + answer.pick(39, 'd') + 'quizCheck(39);');
  q.exec(`document.getElementById('q39-check').click();`);
  ok('d8', '03: the last click disables s39\'s "שנמשיך?"', q.val(`document.getElementById('q39-check').disabled`) === true);
  q.exec('goTo(38); goTo(39);');
  ok('d8', '03: stepping back and forward keeps it disabled (the painter re-enabled it; the ledger wins)', q.val(`document.getElementById('q39-check').disabled`) === true);
  const q2 = await reload(q, { c: '03' });
  q2.exec('goTo(38); goTo(39);');
  ok('d8', '03: and after a reload', q2.val('currentScreen') === 39 && q2.val(`document.getElementById('q39-check').disabled`) === true);
  q2.close();

  /* Control: answered but never clicked → the button stays live after a reload. */
  const c = H.boot('03');
  await c.ready;
  c.exec('goTo(39);' + answer.single(39, 'b').replace(`quizCheck(39);`, '') + answer.pick(39, 'd') + 'quizCheck(39);');
  const c2 = await reload(c, { c: '03' });
  ok('d8', 'control: s39 answered, not clicked → after a reload "שנמשיך?" is live', c2.val('currentScreen') === 39 && c2.val(`document.getElementById('q39-check').disabled`) === false,
     'screen ' + c2.val('currentScreen') + ' disabled ' + c2.val(`document.getElementById('q39-check').disabled`));
  c2.close();
}

/* ══════════════ 8. Report-only pass marks ══════════════ */
async function passMarks() {
  const b = H.boot('03');
  await b.ready;
  const set = (m) => b.exec('Object.keys(XAPI_Q_RESULTS).forEach(function(k){ delete XAPI_Q_RESULTS[k]; });' +
    Object.keys(m).map(k => `XAPI_Q_RESULTS['${k}'] = ${m[k]};`).join(''));
  set({ '001/q1': true, '002/q1': true, '003/q1': true, '004/q1': true, '005/q1': false, '005/q2': true });
  let r = b.json('partResult()');
  ok('pass', '03: 4 of 5 basic stations → success:true', r.success === true, JSON.stringify(r));
  set({ '001/q1': true, '002/q1': true, '003/q1': true, '004/q1': false, '005/q1': false, '005/q2': true, '006/q1': true, '006/q2': true, '006/q3': true, '007/q1': true });
  r = b.json('partResult()');
  ok('pass', '03: 3 of 5 basic → success:false, whatever 006/007 say', r.success === false, JSON.stringify(r));
  ok('pass', '03: scaled counts every graded question (8/10)', Math.abs(r.score.scaled - 0.8) < 1e-9, JSON.stringify(r));
  b.close();

  const c = H.boot('04');
  await c.ready;
  c.exec(`XAPI_Q_RESULTS['001/q1']=true; XAPI_Q_RESULTS['001/q2']=true; XAPI_Q_RESULTS['001/q3']=true; XAPI_Q_RESULTS['001/q4']=false;` +
    ['q5', 'q6', 'q7', 'q8'].map(k => `XAPI_Q_RESULTS['001/${k}']=true;`).join(''));
  r = c.json('partResult()');
  ok('pass', '04: 4 of 5 sections (statement grid all right) → success:true', r.success === true && Math.abs(r.score.scaled - 7 / 8) < 1e-9, JSON.stringify(r));
  c.exec(`XAPI_Q_RESULTS['001/q8']=false;`);
  r = c.json('partResult()');
  ok('pass', '04: one wrong statement fails that section → 3 of 5 → success:false', r.success === false, JSON.stringify(r));
  c.close();

  const d = H.boot('02');
  await d.ready;
  d.exec(`XAPI_Q_RESULTS['002/q1']=true; XAPI_Q_RESULTS['003/q1']=true; XAPI_Q_RESULTS['003/q2']=true; XAPI_Q_RESULTS['004/q1']=true; XAPI_Q_RESULTS['005/q1']=true; XAPI_Q_RESULTS['006/q1']=false;`);
  r = d.json('partResult()');
  ok('pass', '02: 4 of 6 zone items → success:true; scaled 5/11', r.success === true && Math.abs(r.score.scaled - 5 / 11) < 1e-9, JSON.stringify(r));
  d.close();
}

/* ══════════════ 9. Resume: one item initialized, painted screens, #screen= ══════════════ */
async function resume() {
  const b = H.boot('02');
  await b.ready;
  b.exec('goTo(11); goTo(12); goTo(13);' + answer.single(13, Q(13).correct));
  b.exec('goTo(14); goTo(15);' + answer.values(15, ['1', '2']));   // a rejected attempt: lw set
  const b2 = await reload(b, { c: '02' });
  const lastLoad = b2.loadStmts();
  eq('resume', 'a resumed load emits exactly: component initialized, then the landing item', lastLoad.map(s => s.verb + ':' + s.objectType), ['initialized:onlinelesson', 'initialized:question']);
  eq('resume', 'it lands on the saved screen', b2.val('currentScreen'), 15);
  ok('resume', 'the rejected answer is repainted with its retry look', b2.val(`quizSlots(15).every(function(i){ return i.value !== ''; })`) === true &&
     b2.val(`document.getElementById('q15-feedbox').classList.contains('is-wrong')`) === true, b2.val(`document.getElementById('q15-feedbox').className`));
  ok('resume', 'and the Retry gate still holds after the reload', b2.val(`document.getElementById('q15-check').disabled`) === true);
  b2.exec('goTo(13);');
  ok('resume', 'an answered screen visited after the reload is painted done (correct marked, locked)',
     b2.val(`document.querySelector('#q13 .scq-opt.correct') !== null && document.getElementById('q13-check').textContent === 'متابعة'`) === true);
  ok('resume', 'XAPI_Q_RESULTS came back', b2.val(`XAPI_Q_RESULTS['002/q1']`) === true);
  ok('resume', 'no console.error', b2.errors.length === 0, b2.errors.join(' | '));

  /* #screen=N chooses the screen, never skips the restore (§8.4b) */
  const s = b2.session();
  b2.close();
  const b3 = H.boot('02', { session: s, hash: '#screen=12' });
  await b3.ready;
  eq('hash', '#screen=12 lands on 12', b3.val('currentScreen'), 12);
  ok('hash', 'and the state was still restored', b3.val(`XAPI_Q_RESULTS['002/q1']`) === true && b3.val(`quizState[13].done`) === true);
  b3.close();

  /* ?resetState empties the document and strips itself from the URL. */
  const b4 = H.boot('02', { session: s, search: '?slxapi=1&registration=REG-02&xapiLib=../_test/xapi-720-k.js&resetState' });
  await b4.ready;
  ok('reset', '?resetState lands on the first screen with nothing restored', b4.val('currentScreen') === 10 && b4.val(`quizState[13].done`) === false);
  ok('reset', 'and strips itself from the URL', !/resetState/.test(b4.val('location.search')));
  b4.close();
}

/* ══════════════ 10. YouTube (01 s3/s8): played / paused, D-1 ══════════════ */
async function youtube() {
  const b = H.boot('01', { search: '?slxapi=1&registration=DEADBEEF-QA&xapiLib=../_test/xapi-720-k.js&canary=CANARY123' });
  await b.ready;
  await H.waitFor(() => b.val('(window.__ytPlayers||[]).length') === 2, 2000);
  eq('yt', 'both YouTube iframes got a player', b.val('window.__ytPlayers.length'), 2);
  ok('yt', 'the players were attached to the existing iframes (no videoId → the API built nothing)',
     b.val(`window.__ytPlayers.every(function(p){ return p.el.tagName === 'IFRAME' && !p.cfg.videoId && !p.cfg.playerVars; })`) === true);
  await H.sleep(20);
  ok('yt', 'the Hebrew iframe titles survive the API renaming them (accessible name)',
     b.val(`Array.prototype.every.call(document.querySelectorAll('iframe[data-yt-item]'), function(f){ return /[\\u0600-\\u06FF]/.test(f.getAttribute('title')); })`) === true,
     b.json(`Array.prototype.map.call(document.querySelectorAll('iframe[data-yt-item]'), function(f){ return f.getAttribute('title'); })`));
  const srcs = b.json(`Array.prototype.map.call(document.querySelectorAll('iframe[data-yt-item]'), function(f){ return f.getAttribute('src'); })`);
  ok('d1', 'no iframe src carries the launch query (canary / registration / slxapi / forigin / widget_referrer)',
     srcs.every(u => !/CANARY123|DEADBEEF|slxapi|forigin|widget_referrer/.test(u)), srcs.join(' '));
  ok('d1', 'the embeds are nocookie with enablejsapi=1', srcs.every(u => /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]+\?enablejsapi=1/.test(u)), srcs.join(' '));
  b.exec('goTo(1); goTo(2); goTo(3);');
  const P = `window.__ytPlayers.filter(function(p){ return p.el.getAttribute('data-yt-item') === '002'; })[0]`;
  let n = b.stmts().length;
  b.exec(`${P}.fire(1); ${P}.fire(3); ${P}.fire(1); ${P}.fire(2); ${P}.fire(2); ${P}.fire(1); ${P}.fire(0); ${P}.fire(2); ${P}.fire(1);`);
  const v = since(b, n);
  eq('yt', 'start, seek, pause, duplicate pause, resume, ended, pause-after-end, replay → played,paused,played,played',
     v.map(s => s.verb), ['played', 'paused', 'played', 'played']);
  ok('yt', 'objectId is the item (002)', v.every(s => /-01-002\/$/.test(s.objectId || '')), v.map(s => s.objectId).join(','));
  n = b.stmts().length;
  b.exec('goTo(4);');
  const leave = since(b, n);
  ok('yt', 'leaving the screen while playing closes it with a paused, then stops the player',
     leave[0] && leave[0].verb === 'paused' && b.val(`${P}.stopped`) >= 1, leave.map(s => s.verb).join(','));
  ok('yt', 'the wired iframe was NOT blanked (the API binding survives)', b.val(`document.querySelector('iframe[data-yt-item="002"]').getAttribute('src')`) !== 'about:blank');
  const orphans = (() => { const open = {}; let bad = 0; b.stmts().forEach(s => { const k = s.objectId; if (s.verb === 'played') open[k] = 1; if (s.verb === 'paused') { if (!open[k]) bad++; open[k] = 0; } }); return bad; })();
  eq('yt', 'orphan scan: no paused without a played before it', orphans, 0);
  b.close();

  /* API unavailable → the old blanking still stops the video. */
  const c = H.boot('01', { noYouTube: true });
  await c.ready;
  c.exec('goTo(3); goTo(4);');
  eq('yt', 'without the API the iframe is parked on about:blank as before', c.val(`document.querySelector('iframe[data-yt-item="002"]').getAttribute('src')`), 'about:blank');
  c.close();

  /* QA B-4 (2026-10-04, seen live): a screen change while the players are still loading. A real
     player has no stopVideo until its embed has handshaken; ytLeave used to answer false then,
     goTo parked the iframe on about:blank, the player could never become ready, and the restore
     on entry skipped it because __ytPlayer was set — both videos stayed black for good. */
  const d = H.boot('01', { ytSlow: true });
  await d.ready;
  await H.waitFor(() => d.val('(window.__ytPlayers||[]).length') === 2, 2000);
  const src = it => d.val(`document.querySelector('iframe[data-yt-item="${it}"]').getAttribute('src')`);
  d.exec('goTo(1); goTo(2); goTo(3); goTo(4);');
  ok('yt', 'B-4: leaving s3 before its player is ready does NOT park it on about:blank', src('002') !== 'about:blank', src('002'));
  ok('yt', 'B-4: the hidden s8 player (wired long before s8) is not parked either', src('003') !== 'about:blank', src('003'));
  d.exec('window.__ytMakeReady(); goTo(3);');
  ok('yt', 'B-4: back on s3 the iframe still carries the real embed', /^https:\/\/www\.youtube-nocookie\.com\/embed\//.test(src('002')), src('002'));
  const P2 = `window.__ytPlayers.filter(function(p){ return p.el.getAttribute('data-yt-item') === '002'; })[0]`;
  let m = d.stmts().length;
  d.exec(`${P2}.fire(1);`);
  ok('yt', 'B-4: the player that lived through the race still reports played', since(d, m).some(s => s.verb === 'played'), since(d, m).map(s => s.verb).join(','));
  m = d.stmts().length;
  d.exec('goTo(4);');
  ok('yt', 'B-4: once ready, leaving still closes the played and stops through the API',
     since(d, m)[0] && since(d, m)[0].verb === 'paused' && d.val(`${P2}.stopped`) >= 1, since(d, m).map(s => s.verb).join(','));

  /* Self-heal: whatever blanked a wired iframe, entering its screen brings the embed back and
     attaches a fresh player (the old one is bound to a dead page). */
  d.exec(`document.querySelector('iframe[data-yt-item="003"]').setAttribute('src', 'about:blank'); goTo(7); goTo(8);`);
  ok('yt', 'B-4 heal: a wired iframe found on about:blank when its screen is entered is restored', /^https:\/\/www\.youtube-nocookie\.com\/embed\//.test(src('003')), src('003'));
  eq('yt', 'B-4 heal: and re-wired with a fresh player', d.val('window.__ytPlayers.length'), 3);
  const srcs2 = d.json(`Array.prototype.map.call(document.querySelectorAll('iframe[data-yt-item]'), function(f){ return f.getAttribute('src'); })`);
  ok('d1', 'B-4: after the race and the heal no src carries the launch query', srcs2.every(u => !/DEADBEEF|slxapi|forigin|widget_referrer/.test(u)), srcs2.join(' '));
  d.close();
}

/* ══════════════ 11. The regression gate: reporting off ══════════════ */
async function offPlatform() {
  const b = H.boot('01', { search: '' });
  await H.sleep(600);
  ok('off', 'sendStatement720 absent (the CDN library never loaded)', b.val('typeof sendStatement720') === 'undefined');
  ok('off', 'xapiOnScreen is a silent no-op', b.val('(function(){ xapiOnScreen(1); xapiOnScreen(3); return "ok"; })()') === 'ok');
  b.exec('goTo(1);' + answer.single(1, Q(1).correct));
  ok('off', 'scoring survives with reporting off', b.val(`XAPI_Q_RESULTS['001/q1']`) === true);
  ok('off', 'the lomda still navigates', b.val('(goTo(2), currentScreen)') === 2);
  ok('off', 'no statement log exists', !b.w.sessionStorage.getItem('__test_statements'));
  ok('off', 'the boot cover dropped anyway', await H.waitFor(() => !b.w.document.getElementById('boot-cover'), 1500));
  b.close();
}

/* ══════════════ 12. Routing: production vs ?dev=1 ══════════════ */
async function routing() {
  const b = H.boot('02');
  await b.ready;
  ok('route', 'production: DEV_NAV false', b.val('DEV_NAV') === false);
  const back = `document.querySelector('#s10 .btn-back')`;
  ok('route', "the first screen's חזרה is hidden by attribute and inline display", b.val(`${back}.hidden && ${back}.style.display === 'none'`) === true);
  b.exec('goTo(9);');
  eq('route', 'goTo(9) (before the component) goes nowhere', b.val('currentScreen'), 10);
  b.close();
  const d = H.boot('02', { search: '?dev=1&xapiLib=../_test/xapi-720-k.js' });
  await d.ready;
  ok('route', '?dev=1 without registration: DEV_NAV true, back shown', d.val('DEV_NAV') === true && d.val(`${back}.hidden`) === false);
  d.close();
  const e = H.boot('02', { search: '?dev=1&registration=R&xapiLib=../_test/xapi-720-k.js' });
  await e.ready;
  ok('route', '?dev=1 WITH registration stays production', e.val('DEV_NAV') === false);
  e.close();

  /* Keyboard: an arrow never skips an unanswered question. */
  const k = H.boot('01');
  await k.ready;
  k.exec('goTo(1);');
  k.exec(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));`);
  eq('keys', 'ArrowLeft on an unanswered s1 stays on s1', k.val('currentScreen'), 1);
  k.exec(answer.single(1, Q(1).correct));
  k.exec(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));`);
  eq('keys', 'once answered it moves on', k.val('currentScreen'), 2);
  k.exec(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));`);
  eq('keys', 'ArrowRight presses the back button', k.val('currentScreen'), 1);
  k.close();
}

/* ══════════════ 13. Issue report ══════════════ */
async function report() {
  const b = H.boot('02');
  await b.ready;
  b.exec('goTo(11); goTo(12); goTo(13);');
  b.exec(`document.querySelector('.flag-btn .flag-btn-label').click();`);
  ok('report', 'clicking the flag\'s inner label opens the dialog (delegation)', b.val(`!document.getElementById('report-modal').hasAttribute('hidden')`) === true);
  b.exec(`document.getElementById('report-type').value = 'unclear'; document.getElementById('report-text').value = 'בדיקה QA'; submitReport();`);
  const f = b.json('window.__fetches').filter(x => /docs\.google\.com/.test(x.url));
  eq('report', 'exactly one POST to the shared form', f.length, 1);
  const sent = b.json(`(function(){ var f = window.__fetches.filter(function(x){ return /docs\\.google\\.com/.test(x.url); })[0]; var o = {}; f.init.body.forEach(function(v,k){ o[k] = v; }); o.__mode = f.init.mode; o.__isParams = f.init.body instanceof URLSearchParams; return o; })()`);
  ok('report', 'no-cors, URLSearchParams', sent.__mode === 'no-cors' && sent.__isParams === true, JSON.stringify(sent));
  eq('report', 'unit slug from METADATA', sent['entry.1933069481'], 'methodica-math-percent-08');
  eq('report', 'component slug from METADATA (never "-xx")', sent['entry.2070680092'], 'methodica-math-percent-08-02');
  eq('report', 'the item from SCREEN_TO_SUBCONTENT', sent['entry.1555704258'], 'methodica-math-percent-08-02-002');
  eq('report', 'the page within the item', sent['entry.1671046914'], '2');
  eq('report', 'the Hebrew problem-type label', sent['entry.1179822443'], 'شيء غير واضح لي');
  eq('report', 'the free text verbatim', sent['entry.806447525'], 'בדיקה QA');
  ok('report', 'the thank-you shows', b.val(`!document.getElementById('report-thanks').hasAttribute('hidden')`) === true);
  b.close();
}

(async function main() {
  const suites = [freshLoad, answering, hints, hub, splits, backToNull, guided, componentEnd, passMarks, resume, youtube, offPlatform, routing, report];
  for (const s of suites) {
    try { await s(); } catch (e) { R.failures.push('[' + s.name + '] threw: ' + (e && e.stack || e)); }
  }
  R.done();
})();
