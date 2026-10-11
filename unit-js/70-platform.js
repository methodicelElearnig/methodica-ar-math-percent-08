'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-ar-math-percent-08 — platform glue: xAPI reporting + resume on the 720-core engine.

   The platform files (10-identity / 20-xapi / 40-resume / 50-loader) come from
   methodica-math-ratio-01 (35648a6). That unit owns its screens in 70-screens.js; this one runs on
   the vendored 720-core (engine.js / quiz-engine.js / unit.js), so everything the platform layer
   expects from "the part" is provided HERE, once, for all four components. The pattern follows
   methodica-math-ratio-06's 70-platform.js (same engine), re-derived for this unit: several
   questions per item, per-slot / per-row reporting, the guided screens, the map hub, the
   statement grid, report-only pass marks and YouTube reporting.

   quizState / QUESTIONS / GUIDED / guidedState / TOTAL_SCREENS are top-level const in the shared
   global lexical scope, so this shared file reaches them directly (they are not window properties,
   but they ARE global). Definition-only, like the rest of unit-js/ except 90-boot.js.

   Seams it reads (each component's script.js):
     PART_CONFIG            {start, end, next, prev} — the component's global screen range
     SCREEN_TO_SUBCONTENT   screen -> [item suffix, page-in-item] | null
     XAPI_QMAP              screen -> [item, qKey | [qKeys], split?]  — which declared question(s)
                            a screen answers; split 'slots' / 'rows' = one question per value box /
                            per statement row, each with its own verdict
     XAPI_EVAL_ITEMS        items graded in code (the score denominator)
     XAPI_GUIDED_ITEMS      items answered on the guided screens — provisional fictive result
     PART_PASS              report-only pass mark: {need, sets: [[key, …], …]} | null
     XAPI_HUB_SCREENS       read by 20-xapi.js (the hub exception to O-1)

   Seams it provides:
     PART_FIRST / PART_LAST / PART_PREV   this component's range (from PART_CONFIG)
     lastScreenButton()         the button whose click ends this component (D-8)
     partExit(dir)              engine.js goTo() walking off either end of the component
     partResult()               the component result sent with 'completed'
     capturePartPayload / applyResumeVars / applyResumeDom / restoreScreenUI   the resume hooks
     applyExecutionState(st, n) the restore replay (50-loader.js phase B)
     repaintScreen(n)           engine.js goTo(), after resetScreenState — every navigation (§8.4a)
     onQuizAnswered / onQuizCommitted / onQuizHint / onGuidedAnswered   engine call sites
     keyboardForward / keyboardBack   engine.js arrow keys (production: the screen's own buttons)
     ytWirePlayers / ytLeave    YouTube played/paused (screens 3, 8)
     partBoot()                 90-boot.js — builds the screens and lands the part
   Design: Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md; unit notes in README.md.
   ═══════════════════════════════════════════════════════════════════ */

var PART_FIRST = (window.PART_CONFIG && typeof window.PART_CONFIG.start === 'number') ? window.PART_CONFIG.start : 0;
var PART_LAST  = (window.PART_CONFIG && typeof window.PART_CONFIG.end === 'number') ? window.PART_CONFIG.end : TOTAL_SCREENS - 1;
var PART_PREV  = (window.PART_CONFIG && window.PART_CONFIG.prev) || null;

/* No field ids to watch (the answer boxes are generated without ids) — initQuizFieldSaves()
   covers typing and picking instead. Declared so 40-resume.js's O-2 hook finds an empty list. */
var RESUME_INPUT_IDS = [];
var RESUME_TEXT_IDS  = [];

function _pq(n) { return QUESTIONS.find(function (x) { return x.screen === n; }) || null; }
function _partQuestions() { return QUESTIONS.filter(function (q) { return inPart(q.screen); }); }
function _itemFor(n) {
  var m = (typeof SCREEN_TO_SUBCONTENT !== 'undefined') ? SCREEN_TO_SUBCONTENT[n] : null;
  return m ? m[0] : null;
}
function _guidedCfg(n) {
  return (typeof GUIDED !== 'undefined') ? (GUIDED.find(function (g) { return g.screen === n; }) || null) : null;
}

/* The declared question keys a screen answers: ['q1'], or several for a split screen. */
function _qKeysFor(n) {
  var m = (typeof XAPI_QMAP !== 'undefined') ? XAPI_QMAP[n] : null;
  if (!m) return [];
  return Array.isArray(m[1]) ? m[1].slice() : [m[1]];
}

/* Every '<item>/<qKey>' this component answers, optionally only for the graded items. */
function _partQKeys(evalOnly) {
  var out = [];
  var map = (typeof XAPI_QMAP !== 'undefined') ? XAPI_QMAP : {};
  Object.keys(map).forEach(function (s) {
    var item = map[s][0];
    if (evalOnly && !_xapiIsEval(item)) return;
    _qKeysFor(Number(s)).forEach(function (k) { out.push(item + '/' + k); });
  });
  return out;
}

/* ═══════════════════ Reporting call sites (quiz-engine.js / unit.js) ═══════════════════ */

/* What the learner answered, as they see it. Choice: the option's own text (zoom buttons stripped
   by xapiAnswerText), else an image's alt, else the option id. Value input: the boxes in data-slot
   order. Statements: one נכון / לא נכון per row. */
function quizAnswerText(screen, q, st) {
  try {
    if (q.type === 'single' || q.type === 'multi') {
      var ids = q.type === 'multi' ? (st.selectedSet || []) : [st.selected];
      return ids.map(function (id) {
        var o = document.querySelector('#q' + screen + ' .scq-opt[data-id="' + id + '"]');
        if (!o) return String(id);
        var t = xapiAnswerText(o.querySelector('.scq-opt-text') || o);
        var img = t ? null : o.querySelector('img');
        return t || (img && img.getAttribute('alt')) || String(id);
      }).join(', ');
    }
    if (q.type === 'value-input') return (st.selectedSet || []).join(' | ');
    if (q.type === 'statement') return (st.selectedSet || []).map(_stmtLabel).join(' | ');
    return JSON.stringify(st.selectedSet || st.selected || '');
  } catch (e) { return ''; }
}
function _stmtLabel(v) { return v === 'true' ? 'صحيح' : (v === 'false' ? 'غير صحيح' : '—'); }

/* Per-slot verdicts for a value-input screen, exactly as the engine's own per-slot marking judges
   them: against the accepted answer set (correctInputs or one of altInputs) that matches best. */
function _slotVerdicts(q, st) {
  var sets = [q.correctInputs].concat(q.altInputs || []);
  var hit = function (arr, i) { return quizNum((st.selectedSet || [])[i] || '') === quizNum(arr[i]); };
  var score = function (arr) { return arr.filter(function (v, i) { return hit(arr, i); }).length; };
  var best = sets.reduce(function (a, b) { return score(b) > score(a) ? b : a; }, q.correctInputs);
  return best.map(function (v, i) { return hit(best, i); });
}

/* Called from quizCheck() after the verdict is known and BEFORE any marking — every submit, all
   three branches. isLast is the family idiom: correct || attempts exhausted; the Retry gate
   (quiz-engine.js) makes attempt 2 a real second attempt, so answered.last counts are honest.
   A split screen reports each of its declared questions with its OWN verdict (guide §6.3: when
   the code knows each row's correctness) and one shared isLast from the whole screen. */
function onQuizAnswered(screen, q, st, correct) {
  var m = (typeof XAPI_QMAP !== 'undefined') ? XAPI_QMAP[screen] : null;
  if (!m) return;
  var item = m[0], keys = _qKeysFor(screen), split = m[2];
  var isLast = correct || st.attempts >= q.maxAttempts;
  if (keys.length === 1 || !split) {
    /* One verdict covers every key (none today): all reported with it, none left silent (D-9). */
    keys.forEach(function (k) { xapiAnswered(item, k, correct, isLast, quizAnswerText(screen, q, st)); });
    return;
  }
  if (split === 'slots') {
    var ok = _slotVerdicts(q, st);
    keys.forEach(function (k, i) {
      xapiAnswered(item, k, !!ok[i], isLast, String((st.selectedSet || [])[i] == null ? '' : st.selectedSet[i]));
    });
  } else if (split === 'rows') {
    keys.forEach(function (k, i) {
      var v = (st.selectedSet || [])[i];
      xapiAnswered(item, k, v === String(q.statements[i].correct), isLast, _stmtLabel(v));
    });
  }
}

/* Called at the very tail of quizCheck(), after the last commitment (done / lw / verdict) on every
   path — the flush-after-last-commitment contract (§8.3, D-13). */
function onQuizCommitted(screen) { flushResumeSave(); }

/* Called from quizOpenHint() after its done-guard, immediately before the overlay opens. The hint
   belongs to the screen, so it is reported against the screen's first declared question; the
   hints ledger reports it once per attempt, across re-opens and reloads (D-7). */
function onQuizHint(screen) {
  var item = _itemFor(screen);
  var keys = _qKeysFor(screen);
  if (item && keys.length) xapiRequestedHint(item, keys[0]);
}

/* The guided screens 5-7 (item 01-002, declared q1-q3). One click reveals the answer — no
   attempts, no grading — so the UI decides nothing. ⚠️ PROVISIONAL (decision 28.09.26, may
   change): the pick is reported as answered.last with a FICTIVE result success:true /
   scaled:1, so no declared question stays silent. The item is not in XAPI_EVAL_ITEMS, so it
   never enters the component score. Called by guidedAnswer (unit.js) after its state write;
   flushes synchronously (the commitment). */
function onGuidedAnswered(screen, el) {
  var m = (typeof XAPI_QMAP !== 'undefined') ? XAPI_QMAP[screen] : null;
  if (m) {
    var text = '';
    try { text = xapiAnswerText(el); } catch (e) {}
    _qKeysFor(screen).forEach(function (k) { xapiAnswered(m[0], k, true, true, text); });
  }
  flushResumeSave();
}

/* An explicit result for every graded item's 'completed' (read by xapiItemResult, 20-xapi.js), from
   XAPI_Q_RESULTS — the ratio-01 pattern: without it the item result would be the library's own
   per-page-load aggregate, which knows nothing about answers restored by a resume. An item's
   questions are the keys XAPI_QMAP gives it; success = all correct, scaled = correct / count. */
var XAPI_ITEM_RESULT = {};
Object.keys((typeof XAPI_EVAL_ITEMS !== 'undefined') ? XAPI_EVAL_ITEMS : {}).forEach(function (item) {
  XAPI_ITEM_RESULT[item] = function () {
    var keys = _partQKeys(true).filter(function (k) { return k.split('/')[0] === item; });
    var n = keys.filter(function (k) { return !!XAPI_Q_RESULTS[k]; }).length;
    return { success: keys.length > 0 && n === keys.length, score: { scaled: keys.length ? n / keys.length : 0 } };
  };
});

/* ═══════════════════ The end of the component ═══════════════════ */

/* The button whose click ends this component: the last question's "שנמשיך?" (03: s39), or the
   static last screen's continue button (01: s9, 02: s27, 04: s48). */
function lastScreenButton() {
  if (_pq(PART_LAST)) return document.getElementById('q' + PART_LAST + '-check');
  return document.querySelector('#s' + PART_LAST + ' .btn-continue');
}

/* The component result, from XAPI_Q_RESULTS — the same truth the 'answered' statements carried,
   so the component score cannot disagree with them. Unanswered questions count as not correct.
     scaled  = correct graded questions / all graded questions of the component (XAPI_EVAL_ITEMS)
     success = REPORT-ONLY pass mark (decision 28.09.26, docs-and-tools/PASS-MARKS.md): PART_PASS
               counts the "sets" the screen promised — each set passes when all its questions are
               correct — against `need`. Nothing ever blocks the learner on it; below the mark the
               component still ends, reports success:false, and the platform routes on
               recommendedAfterFail. No PART_PASS (component 01) → success:true.
   ⚠️ The gate is not the score: two learners can share `scaled` with opposite `success` (§6.4). */
function partResult() {
  var keys = _partQKeys(true);
  var n = keys.filter(function (k) { return !!XAPI_Q_RESULTS[k]; }).length;
  var scaled = keys.length ? n / keys.length : 0;
  var pass = (typeof PART_PASS !== 'undefined') ? PART_PASS : null;
  var success = true;
  if (pass && pass.sets) {
    var passed = pass.sets.filter(function (set) {
      return set.every(function (k) { return !!XAPI_Q_RESULTS[k]; });
    }).length;
    success = passed >= pass.need;
  }
  return { success: success, score: { scaled: scaled } };
}

/* ── A mid-component stop (XAPI_STOP in script.js; only 03 declares one) ──
   Ported from ratio-04 (892a535), sized to this unit's PART_PASS sets: {at, need, sets}. A HARD stop:
   no message, no retry — the answers are already revealed when the questions resolve. The component
   reports 'completed' (success false, from partResult) and ENDS on the stop screen; the platform
   routes on that statement (recommendedAfterFail -> 02).
   ⚠️ FAILS OPEN: it closes only on evidence. Every question of every set must have a recorded result
   before the verdict counts — a resume whose results came back empty must not trap a learner. */
function _stop() { return (typeof XAPI_STOP !== 'undefined' && XAPI_STOP) ? XAPI_STOP : null; }
function _stopFailed() {
  var s = _stop();
  if (!s || !s.sets) return false;
  var complete = s.sets.every(function (set) {
    return set.every(function (k) { return typeof XAPI_Q_RESULTS[k] === 'boolean'; });
  });
  if (!complete) return false;
  var passed = s.sets.filter(function (set) { return set.every(function (k) { return XAPI_Q_RESULTS[k] === true; }); }).length;
  return passed < s.need;
}
function stopBlocks(n) { var s = _stop(); return !!s && n === s.at && inPart(n) && _stopFailed(); }
function stopButton() { var s = _stop(); return s ? document.getElementById('q' + s.at + '-check') : null; }

/* End the component HERE, on the stop screen. Not partExit(): that acts only on PART_LAST and, under
   DEV_NAV, hops to the next component — the one place a stopped learner must not go. Idempotent
   (sendCompletedOnce is ledger-guarded). Navigates NOWHERE, DEV_NAV included. */
function endComponentAtStop() {
  var res = partResult();
  try { xapiEndComponent(res, stopButton()); } catch (e) { console.error('[xAPI] end at stop', e); }
  try { setUnitResult(partResultKey(), 'fail'); } catch (e) { console.error('[resume] result', e); }
  flushResumeSave();
}

function partResultKey() { return 'percent08_c' + currentPartSlug().slice(-2) + '_result'; }

/* engine.js goTo() calls this instead of hopping when n leaves [PART_FIRST, PART_LAST].
   Forward off the last screen = the learner's last click: report the component, disable the
   button, record the verdict, flush — and navigate NOWHERE (the platform owns routing, §8.12).
   Only a DEV_NAV walkthrough (?dev=1 without ?registration) goes on to the next component.
   Backward off the first screen only exists under DEV_NAV too. */
function partExit(dir) {
  if (_restoring) return;
  if (dir < 0) {
    if (DEV_NAV) goToPrevPart();
    return;
  }
  if (currentScreen !== PART_LAST) return;
  /* The last question must be answered before its "שנמשיך?" ends anything. A static last screen
     has nothing to answer. */
  var lq = _pq(PART_LAST);
  if (lq && !(quizState[PART_LAST] && quizState[PART_LAST].done)) return;
  var res = partResult();
  try { xapiEndComponent(res, lastScreenButton()); } catch (e) { console.error('[xAPI] end component', e); }
  try { setUnitResult(partResultKey(), res.success ? 'pass' : 'fail'); } catch (e) { console.error('[resume] result', e); }
  flushResumeSave();
  if (DEV_NAV && window.PART_CONFIG && window.PART_CONFIG.next) {
    var dest = String(window.PART_CONFIG.next).replace(/\/index\.html$/, '').replace(/\/+$/, '').split('/').pop();
    writeForwardState(dest, '#screen=' + PART_LAST);
    goToNextPart();
  }
}

/* ═══════════════════ Keyboard ═══════════════════
   The engine's arrows used to be raw goTo(n±1): ArrowLeft walked past unanswered questions, through
   the hub's locked המשך, and off the last screen into the component 'completed'. In production an
   arrow now presses the screen's OWN control — the forward button only when it is enabled (a quiz
   screen only once answered: its "שנמשיך?" then honours q.next), the back button only when it is
   shown. Under DEV_NAV the raw walk stays, for the producer harness. */
function _activeScreen() { return document.querySelector('.screen.active'); }
function _visible(b) { return b && !b.hidden && b.style.display !== 'none' && b.style.visibility !== 'hidden'; }
function keyboardForward() {
  if (DEV_NAV) { goTo(currentScreen + 1); return; }
  var sc = _activeScreen(); if (!sc) return;
  var q = _pq(currentScreen);
  var b = q ? document.getElementById('q' + currentScreen + '-check') : sc.querySelector('.btn-continue');
  if (q && !(quizState[currentScreen] && quizState[currentScreen].done)) return;
  if (b && !b.disabled && _visible(b)) b.click();
}
function keyboardBack() {
  if (DEV_NAV) { goTo(currentScreen - 1); return; }
  var sc = _activeScreen(); if (!sc) return;
  var b = sc.querySelector('.quiz-back, .btn-back');
  if (b && !b.disabled && _visible(b)) b.click();
}

/* ═══════════════════ Resume hooks ═══════════════════ */

var RESUME_Q_FIELDS = ['attempts', 'done', 'wasCorrect', 'hintUsed', 'selected', 'selectedSet', 'lw', 'tgl'];

/* This component's payload: where the learner is, the per-question verdicts, every question's
   state — submitted AND pending (a pick or typed value not yet checked; §8.8 rule 4) — and the
   guided screens. userInputs / answerKey / slotOk are NOT stored: the painter re-derives them from
   selectedSet through quizMarkOutcome, the same function that computed them live. */
function capturePartPayload() {
  var qs = {};
  _partQuestions().forEach(function (q) {
    var st = quizState[q.screen];
    if (!st) return;
    var o = {};
    RESUME_Q_FIELDS.forEach(function (k) {
      if (st[k] === undefined) return;
      o[k] = Array.isArray(st[k]) ? st[k].slice() : st[k];
    });
    qs[q.screen] = o;
  });
  var gs = {};
  if (typeof guidedState !== 'undefined') {
    Object.keys(guidedState).forEach(function (k) {
      var g = guidedState[k];
      if (g) gs[k] = { done: !!g.done, selected: g.selected == null ? null : g.selected };
    });
  }
  return {
    currentScreen: currentScreen,
    qResults: JSON.parse(JSON.stringify(XAPI_Q_RESULTS)),
    q: qs,
    g: gs
  };
}

/* Restores the variables. Idempotent — applyExecutionState runs it twice. XAPI_Q_RESULTS is
   refilled in place (a shared var other files hold). Only this part's screens. */
function applyResumeVars(st) {
  if (!st) return;
  if (st.qResults && typeof st.qResults === 'object') {
    Object.keys(XAPI_Q_RESULTS).forEach(function (k) { delete XAPI_Q_RESULTS[k]; });
    Object.keys(st.qResults).forEach(function (k) { XAPI_Q_RESULTS[k] = !!st.qResults[k]; });
  }
  var qs = st.q || {};
  Object.keys(qs).forEach(function (key) {
    var n = Number(key);
    if (!inPart(n) || !quizState[n]) return;
    var src = qs[key] || {};
    RESUME_Q_FIELDS.forEach(function (k) {
      if (src[k] === undefined) return;
      quizState[n][k] = Array.isArray(src[k]) ? src[k].slice() : src[k];
    });
  });
  var gs = st.g || {};
  if (typeof guidedState !== 'undefined') {
    Object.keys(gs).forEach(function (key) {
      if (!guidedState[key]) return;
      guidedState[key].done = !!gs[key].done;
      guidedState[key].selected = gs[key].selected == null ? null : Number(gs[key].selected);
    });
  }
}

/* Nothing here lives only in the DOM: typed values are mirrored into quizState[n].selectedSet on
   every keystroke (quizInputChange) and written back by the painter, which runs after this. */
function applyResumeDom(st) { /* intentionally empty — see restoreScreenUI */ }

/* The dispatch — a branch for every stateful screen type (§8.8 rule 11; asserted by
   _test/verify-report.js "painter dispatch"). One painter per interaction type, config-driven.
   Every painter:
   - repaints from state, never resets it; never reports; mutates no score state
   - is idempotent and safe on a clean screen ("clean" = nothing picked or typed, never attempts===0)
   - re-derives the check button through the live predicate (quizCheckBlocked — the Retry gate)
   - draws the wrong-attempt look only while the answer is still the submitted one (D-15)
   Static screens (story, transition, video) have no state and no painter. */
function restoreScreenUI(n) {
  if (!inPart(n)) return;
  if (n === 11 && typeof mapRefresh === 'function') { mapRefresh(); return; }   // hub gate (rule 11)
  if (_guidedCfg(n)) { paintGuided(n); return; }
  var q = _pq(n);
  if (!q) return;
  var st = quizState[n];
  if (!st || !document.getElementById('q' + n)) return;
  if (q.type === 'single' || q.type === 'multi') paintChoice(n, q, st);
  else if (q.type === 'value-input') paintValue(n, q, st);
  else if (q.type === 'statement') paintStatement(n, q, st);
  try { quizStepperUpdate(n); } catch (e) {}
}

function _hintBtn(n) { return document.getElementById('q' + n + '-hint'); }

/* The finished look: exactly what live play leaves (quizCheck's correct / final-wrong branches). */
function _paintDone(n, q, st) {
  var hb = _hintBtn(n);
  if (hb) hb.style.display = 'none';
  if (st.wasCorrect) {
    quizShowFeedback(n, 'correct', q.fb.correct);
  } else {
    var fb = Object.assign({}, q.fb.wrong);
    if (q.type === 'value-input' && st.slotOk && st.slotOk.some(Boolean)) fb.title = 'تقريبًا! بعض الإجابات صحيحة';
    quizShowFeedback(n, 'wrong', fb);
    if (q.type === 'value-input') {
      /* §8.10 — the displayed values, the learner's own answer (selectedSet → userInputs) and which
         of the two is on screen (tgl) travel together. The toggle starts on the correct answer,
         exactly as live; 'mine' is re-applied by pressing it once. */
      var mode = st.tgl;
      quizAnswerToggleAdd(n, q);
      var tb = document.querySelector('#q' + n + '-feedbox .fb-answer-toggle');
      if (mode === 'mine' && tb) tb.click();
    }
  }
  quizFinish(n);   // DOM: stepper, locked options, "שנמשיך?"; st.done is already true
}

function paintChoice(n, q, st) {
  var opts = document.querySelectorAll('#q' + n + ' .scq-opt');
  var picked = q.type === 'multi' ? (st.selectedSet || []) : (st.selected ? [st.selected] : []);
  var hasPick = picked.length > 0;
  if (!st.done && !st.attempts && !hasPick) return;              // clean screen — leave untouched
  opts.forEach(function (o) {
    o.classList.remove('selected', 'correct', 'wrong', 'locked');
    var on = picked.indexOf(o.dataset.id) !== -1;
    if (on) o.classList.add('selected');
    o.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  var check = document.getElementById('q' + n + '-check');
  if (st.done) {
    quizMarkOutcome(n, q, !!st.wasCorrect);
    _paintDone(n, q, st);
    return;
  }
  check.textContent = 'هل إجابتي صحيحة؟';
  quizHideFeedback(n);
  if (st.attempts > 0) {
    var hb = _hintBtn(n);
    if (hb) hb.style.visibility = 'visible';
    /* Still what the learner saw when they left (D-15): the rejected picks marked wrong and the
       retry prompt. Live, a single choice clears its pick on a retry; a multi-select keeps the
       right picks and marks the wrong ones. Any change since then shows a plain selection. */
    if (st.lw) {
      if (q.type === 'single' && !hasPick) {
        var w = document.querySelector('#q' + n + ' .scq-opt[data-id="' + st.lw + '"]');
        if (w) w.classList.add('wrong');
        quizShowFeedback(n, 'wrong', { title: q.fb.retry, body: '' });
      } else if (q.type === 'multi') {
        var lwSet = String(st.lw).split('|').filter(Boolean);
        var kept = lwSet.filter(function (id) { return (q.correctSet || []).indexOf(id) !== -1; });
        var same = kept.length === picked.length && kept.every(function (id) { return picked.indexOf(id) !== -1; });
        if (same) {
          lwSet.forEach(function (id) {
            if (kept.indexOf(id) !== -1) return;
            var o = document.querySelector('#q' + n + ' .scq-opt[data-id="' + id + '"]');
            if (o) o.classList.add('wrong');
          });
          quizShowFeedback(n, 'wrong', { title: q.fb.retry, body: '' });
        }
      }
    }
  }
  check.disabled = quizCheckBlocked(q, st, hasPick);
}

function paintValue(n, q, st) {
  var slots = quizSlots(n);
  var vals = st.selectedSet || [];
  var typed = vals.some(function (v) { return v !== '' && v != null; });
  if (!st.done && !st.attempts && !typed) return;                 // clean screen — leave untouched
  slots.forEach(function (inp, i) {
    inp.value = vals[i] == null ? '' : vals[i];
    inp.classList.remove('wrong', 'correct', 'mark-ok', 'mark-bad');
    inp.disabled = false;
  });
  var check = document.getElementById('q' + n + '-check');
  if (st.done) {
    quizMarkOutcome(n, q, !!st.wasCorrect);   // recomputes slotOk / answerKey from the same selectedSet
    _paintDone(n, q, st);
    return;
  }
  check.textContent = 'هل إجابتي صحيحة؟';
  quizHideFeedback(n);
  var ready = slots.length > 0 && vals.length === slots.length && !vals.some(function (v) { return !v; });
  if (st.attempts > 0) {
    var hb = _hintBtn(n);
    if (hb) hb.style.visibility = 'visible';
    if (st.lw && quizSig(q, st) === st.lw) {        // still the rejected answer: its marks + prompt
      quizMarkRetry(n, q);
      quizShowFeedback(n, 'wrong', { title: q.fb.retry, body: '' });
    }
  }
  check.disabled = quizCheckBlocked(q, st, ready);
}

/* The statement grid (s47, progressive): one pill per row, rows revealed once the row before
   carries an answer — exactly as quizStatementPick leaves them. */
function paintStatement(n, q, st) {
  var rows = Array.prototype.slice.call(document.querySelectorAll('#q' + n + ' .stmt-row'));
  var vals = st.selectedSet || [];
  var picked = vals.some(Boolean);
  if (!st.done && !st.attempts && !picked) return;                // clean screen — leave untouched
  rows.forEach(function (r, i) {
    r.classList.remove('wrong');
    r.querySelectorAll('.stmt-pill').forEach(function (p) {
      p.classList.remove('selected', 'correct', 'wrong');
      p.disabled = false;
      if (vals[i] && p.dataset.val === vals[i]) p.classList.add('selected');
    });
    if (q.progressive) {
      var show = i === 0 || vals.slice(0, i).every(Boolean);
      r.classList.toggle('is-hidden', !show && !st.done);
    }
  });
  var check = document.getElementById('q' + n + '-check');
  if (st.done) {
    rows.forEach(function (r) { r.classList.remove('is-hidden'); });
    quizMarkOutcome(n, q, !!st.wasCorrect);
    _paintDone(n, q, st);
    return;
  }
  check.textContent = 'هل إجابتي صحيحة؟';
  quizHideFeedback(n);
  var ready = vals.length === rows.length && !vals.some(function (v) { return !v; });
  if (st.attempts > 0 && st.lw && quizSig(q, st) === st.lw) {
    quizMarkRetry(n, q);
    quizShowFeedback(n, 'wrong', { title: q.fb.retry, body: '' });
  }
  check.disabled = quizCheckBlocked(q, st, ready);
}

/* The guided callouts (s5-s7): the reveal look guidedAnswer leaves — the correct option marked,
   the learner's own pick washed (.chosen), options locked, "שנמשיך?" enabled. s4 has no question. */
function paintGuided(n) {
  var cfg = _guidedCfg(n);
  var g = (typeof guidedState !== 'undefined') ? guidedState[n] : null;
  if (!cfg || !cfg.q || !g || !g.done) return;                    // clean screen — leave untouched
  document.querySelectorAll('#g' + n + ' .gc-opt').forEach(function (o) {
    var idx = Number(o.dataset.idx);
    o.classList.remove('selected', 'correct', 'chosen');
    o.classList.add('locked');
    o.setAttribute('aria-checked', idx === g.selected ? 'true' : 'false');
    if (idx === cfg.q.correct) o.classList.add('correct');
    else if (idx === g.selected) o.classList.add('chosen');
  });
  var b = document.getElementById('g' + n + '-check');
  if (b) b.disabled = false;
}

/* Every navigation repaints the target screen from state (engine.js goTo, after resetScreenState):
   the §8.4a hard-lock is "variables say answered, DOM says blank". Skipped while restoring —
   applyExecutionState paints explicitly after its second applyResumeVars. Never an empty catch. */
function repaintScreen(n) {
  if (_restoring) return;
  beginRepaint();
  try {
    restoreScreenUI(n);
    restoreEndedButton();   // D-8: the painter just re-enabled a finished component's button
  } catch (e) { console.error('[resume] repaintScreen', e); }
  finally { endRepaint(); }
}

/* Replay a saved payload onto this component (ratio-01 30-nav.js, adapted). Two passes of
   applyResumeVars around goTo(); the sender is stubbed across the whole replay so nothing is
   re-reported; then the library is told about the restored answers (B-1 / seed) and the item
   latch is cleared. The landing item's 'initialized' is sent by the loader, AFTER the component
   'initialized' (50-loader.js header) — not here.
   screenOverride (#screen=N) chooses the SCREEN only, never skips the restore (§8.4b). Both it and
   the saved screen are range-checked against THIS component: engine.js goTo() treats a screen
   outside [PART_FIRST, PART_LAST] as a request to leave the component. */
function applyExecutionState(st, screenOverride) {
  if (!st) return;
  _restoring = true;
  var _origSend = window.sendStatement720;
  window.sendStatement720 = function () {};
  var _inRange = function (v) {
    return typeof v === 'number' && v >= PART_FIRST && v <= PART_LAST &&
      !!document.querySelector('.screen[data-screen="' + v + '"]');
  };
  try {
    applyResumeVars(st);
    var _n = _inRange(screenOverride) ? screenOverride
           : (_inRange(st.currentScreen) ? st.currentScreen : PART_FIRST);
    goTo(_n);
    applyResumeVars(st);
    applyResumeDom(st);
    restoreScreenUI(currentScreen);
    restoreEndedButton();
  } catch (e) {
    console.error('[resume] apply', e);
  } finally {
    window.sendStatement720 = _origSend;
    _restoring = false;
  }
  try { xapiSeedAnsweredFromResume(); } catch (e) {}
  xapiCurrentItem = null;
}

/* Pending answers are saved as they are made, not only on the next screen change (O-2 for this
   engine): a pick or a keystroke arms the debounced save. Bubble phase on document, so the
   element's own inline handler has already updated quizState. */
function initQuizFieldSaves() {
  var arm = function (e) {
    var t = e && e.target;
    if (t && t.closest && t.closest('.quiz-screen')) scheduleResumeSave();
  };
  document.addEventListener('input', arm);
  document.addEventListener('change', arm);
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('.scq-opt, .stmt-pill')) scheduleResumeSave();
  });
}

/* ═══════════════════ YouTube (screens 3 and 8, component 01) ═══════════════════
   The two iframes are static markup: src = youtube-nocookie.com/embed/<id>?enablejsapi=1&…, nothing
   derived from location.href (QA D-1 — the launch URL carries the reporting token). YT.Player is
   attached to the FINISHED element with no videoId / playerVars, so the API never builds an iframe
   and never appends `forigin`. data-yt-item names the catalogue item the video belongs to.

   engine.js goTo() used to stop a video by blanking its src (about:blank) and restoring it on
   entry. That would sever the API binding, so a wired player is stopped through the API instead
   (ytLeave): an open 'played' is closed with its 'paused' first — the learner left, which is a real
   pause (§6.9.2) — then stopVideo() rewinds it, as the blanking did. If the API never loaded the
   player is absent and ytLeave returns false, and the old blanking stays the fallback. */
var YT_API_SRC = 'https://www.youtube.com/iframe_api';
function ytWirePlayers() {
  var frames = document.querySelectorAll('iframe[data-yt-item]');
  if (!frames.length) return;
  var attach = function () {
    frames.forEach(function (f) {
      if (f.__ytPlayer || !window.YT || !YT.Player) return;
      var item = f.getAttribute('data-yt-item');
      /* The boot's goTo() parked every iframe on about:blank before the API arrived; a player is
         only meaningful on the real embed, and from now on ytLeave stops it without blanking. */
      if (f.dataset.src && f.getAttribute('src') === 'about:blank') f.setAttribute('src', f.dataset.src);
      /* The API overwrites the iframe's title with "YouTube video player" (seen live 28.09.26);
         the Hebrew title is the accessible name — put it back once the player is ready. */
      var title = f.getAttribute('title');
      try {
        f.__ytPlayer = new YT.Player(f, { events: {
          onReady: function () { try { if (title) f.setAttribute('title', title); } catch (_) {} },
          onStateChange: function (e) {
            try { xapiYouTubeState(e, item); } catch (_) {}
            try { if (title && f.getAttribute('title') !== title) f.setAttribute('title', title); } catch (_) {}
          } } });
      } catch (e) { console.error('[youtube] attach', e); }
    });
  };
  if (window.YT && YT.Player) { attach(); return; }
  var prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function () {
    if (typeof prev === 'function') { try { prev(); } catch (e) {} }
    attach();
  };
  if (!document.querySelector('script[src="' + YT_API_SRC + '"]')) {
    var s = document.createElement('script');
    s.src = YT_API_SRC;
    s.onerror = function () { console.warn('[youtube] iframe API unavailable — videos play, not reported'); };
    document.head.appendChild(s);
  }
}
/* Stop a WIRED player on leaving its screen. Returns true for every wired iframe (one that has a
   __ytPlayer), ready or not, so goTo() never blanks it.

   QA B-4 (2026-10-04, seen live): a real player has no methods until its embed has loaded and
   handshaken — seconds after ytWirePlayers() attached it. This used to answer false in that window;
   goTo() then parked the iframe on about:blank, a player bound to a blanked page can never become
   ready, and the restore on entry skipped it (it has a __ytPlayer) — both videos stayed black for
   the rest of the page load, with no played/paused. A not-yet-ready player cannot have been started
   through the API, but the learner may have pressed play inside the embed, so it is paused through
   the embed's own message channel (enablejsapi=1) instead of being torn down. */
function ytLeave(f) {
  var p = f && f.__ytPlayer;
  if (!p) return false;
  if (typeof p.stopVideo !== 'function') {
    try {
      if (f.contentWindow) f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), 'https://www.youtube-nocookie.com');
    } catch (e) {}
    return true;
  }
  try {
    if (p.__xapiPlaying && window.YT && YT.PlayerState) xapiYouTubeState({ target: p, data: YT.PlayerState.PAUSED }, f.getAttribute('data-yt-item'));
    p.__xapiPlaying = false;
    p.stopVideo();
  } catch (e) { console.error('[youtube] leave', e); }
  return true;
}

/* Self-heal on entry (B-4): a wired iframe found on about:blank has lost its player for good. Put
   the real embed back, drop the dead binding and wire a fresh player. Returns true when it acted. */
function ytHeal(f) {
  if (!f || !f.__ytPlayer || f.getAttribute('src') !== 'about:blank' || !f.dataset.src) return false;
  f.setAttribute('src', f.dataset.src);
  try { delete f.__ytPlayer; } catch (e) { f.__ytPlayer = undefined; }
  try { ytWirePlayers(); } catch (e) { console.error('[youtube] heal', e); }
  return true;
}

/* origin= on every reported embed (ratio-04, 07.10.26). Inside Kata the page is itself framed; naming
   our origin lets the embed address its player events to this page explicitly instead of inferring
   it. http(s) only: file:// has origin "null", which YouTube rejects. Runs before the first goTo, so
   the parked/restored src (dataset.src) carries it too. */
function ytApplyOrigin() {
  if (!/^https?:$/.test(window.location.protocol)) return;
  var o = 'origin=' + encodeURIComponent(window.location.origin);
  document.querySelectorAll('iframe[data-yt-item]').forEach(function (f) {
    var s = f.getAttribute('src');
    if (!s || /[?&]origin=/.test(s) || !/youtube-nocookie\.com\/embed\//.test(s)) return;
    f.setAttribute('src', s + (s.indexOf('?') < 0 ? '?' : '&') + o);
  });
}

/* The part's own boot, called once from 90-boot.js (was engine.js's DOMContentLoaded block):
   build the question screens, scale, land. The guided and map screens are built by unit.js's own
   DOMContentLoaded listeners, which run before this one (90-boot.js registers last). */
function partBoot() {
  if (typeof quizBuildScreens === 'function') quizBuildScreens();
  scaleApp();
  try { ytApplyOrigin(); } catch (e) { console.error('[boot] ytApplyOrigin', e); }
  /* NOT a hard goTo(0): goTo() treats n < PART_FIRST as leaving the component. */
  goTo(firstScreen());
  try { ytWirePlayers(); } catch (e) { console.error('[boot] ytWirePlayers', e); }
}
