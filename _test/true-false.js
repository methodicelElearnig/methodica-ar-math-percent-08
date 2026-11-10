/* ═══════════════════ true/false responses — methodica-ar-math-percent-08 ═══════════════════
   NOT DEPLOYED. Dev tooling only.

   Guide Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md §6.3b (2026-11-04): a
   true-false question reports result.response 'true' / 'false', never the label on the button.
   Kata compares result.response with correctXapiResponsesPattern, which for a true-false question
   is the boolean (the Hebrew twin's 04-001 q5-q8: ["false"] / ["false"] / ["true"] / ["true"]; this
   unit's Arabic items still hold صحيح and an empty pattern in Kata on 10.11.26, a Kata-side
   correction); "صحيح" / "غير صحيح" never match. The live library
   uses student_answer as result.response when no response is given, so student_answer is what is
   checked here.

   The true-false questions graded in code: 04-001 q5-q8 (s47, four statement rows). 01-002 q1/q3
   (guided s5/s7, نعم / لا) are left out: a one-click reveal with a fictive result, and Kata declares
   no question on that item (read 10.11.26).

   For s47 answered all right, wrong twice (the second attempt differs — the Retry gate — and is .last), and mixed, every row
   reports 'true' / 'false', the value equals the metadata's correct answer exactly when success,
   and success is as walked. Every answer through the real handlers (quizStatementPick / quizCheck).

   Run:  NODE_PATH=$LOCALAPPDATA/Temp/lomda-test/node_modules node _test/true-false.js
*/
'use strict';

const H = require('./harness');
const R = H.makeReporter('true-false');
const { ok, eq } = R;

/* the metadata's true/false questions on 04, keyed qKey, correct answer as 'true' / 'false'; this
   repo's metadata may still hold the on-screen word (صحيح → true) */
const TRUE_WORDS = ['true', 'נכון', 'כן', 'صحيح', 'نعم'];
const TF = {};
for (const it of H.metadata('04').subContent) for (const q of it.questions || []) {
  if (q.questionType !== 'true-false') continue;
  TF[q.questionId.replace(/\/+$/, '').split('/').pop()] = TRUE_WORDS.indexOf(String(q.correctAnswers[0]).trim()) !== -1 ? 'true' : 'false';
}
const S47 = H.loadQuestions().find(q => q.screen === 47);
const KEY = S47.statements.map(s => String(s.correct));
const flip = v => (v === 'true' ? 'false' : 'true');
const rows = vals => `(function(){ var rows = document.querySelectorAll('#q47 .stmt-row'); ${JSON.stringify(vals)}.forEach(function(v,i){ var p = rows[i].querySelector('.stmt-pill[data-val="'+v+'"]'); quizStatementPick(47, i, p); }); })(); quizCheck(47);`;

async function walk(tag, attempts) {
  const b = H.boot('04');
  await b.ready;
  b.exec('goTo(41); goTo(42); goTo(43); goTo(44); goTo(45); goTo(46); goTo(47);');
  const n = b.stmts().length;
  attempts.forEach(vals => b.exec(rows(vals)));
  const a = b.stmts().slice(n).filter(s => /^answered/.test(s.verb));
  eq(tag, 'one answered per row per attempt', a.length, 4 * attempts.length);
  a.forEach((s, j) => {
    const k = s.opts.questionId.replace(/\/+$/, '').split('/').pop();
    const want = attempts[Math.floor(j / 4)][j % 4];
    const sent = ((s.result.extensions || {}).student_answer || []).join(' | ');
    const r = s.result.response != null ? String(s.result.response) : sent;
    ok(tag, k + ' (' + s.verb + '): reports "true" / "false"', r === 'true' || r === 'false', JSON.stringify(r));
    ok(tag, k + ': reports the pick', r === want, 'sent ' + r + ', picked ' + want);
    ok(tag, k + ': the value matches the correct answer exactly when success', (r === TF[k]) === (s.result.success === true),
       'sent ' + r + ', correct ' + TF[k] + ', success ' + s.result.success);
  });
  ok(tag, 'no console.error', b.errors.length === 0, b.errors.join(' | '));
  b.close();
}

(async () => {
  eq('meta', 'the metadata declares q5-q8 of 04-001 as true-false', Object.keys(TF), ['q5', 'q6', 'q7', 'q8']);
  eq('meta', 'questions.js s47 agrees with the metadata', KEY, ['q5', 'q6', 'q7', 'q8'].map(k => TF[k]));
  await walk('right', [KEY]);
  await walk('wrong', [KEY.map(flip), KEY.map((v, i) => (i < 3 ? flip(v) : v))]);   /* the Retry gate refuses the same answer twice */
  await walk('mixed', [KEY.map((v, i) => (i % 2 ? flip(v) : v))]);
  R.done();
})().catch(e => { console.error(e); process.exitCode = 2; });
