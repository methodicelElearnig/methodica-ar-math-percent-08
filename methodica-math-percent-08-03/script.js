'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-math-percent-08-03 — component 03 of 4 · screens 28-39 · deck slides 39-50
   תרגול בסיסי ותרגול סטנדרטי ב'

   CONFIGURATION ONLY — data, read at CALL time by the shared layer in ../unit-js/.
   The split follows the deck's own "רכיב N" separator slides.
   `var`, never const/let: the shared layer reads these through typeof guards, and no top-level
   name here may also be declared in ../unit-js/ (the collision is silent and last-wins).
   ═══════════════════════════════════════════════════════════════════ */
/* next / prev name index.html explicitly: the MOE CDN serves nothing for a folder URL. */
window.PART_CONFIG = { start: 28, end: 39, next: "../methodica-math-percent-08-04/index.html", prev: "../methodica-math-percent-08-02/index.html" };

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════ */

var XAPI_COMP_SLUG     = 'methodica-math-percent-08-03';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';     // must equal metadata `id`
var XAPI_METADATA_FILE = '../metadata/methodica-math-percent-08-03.json';

/* screen -> [item suffix, page within the item]; null = no catalogue item.
   ⚠️ Exactly this component's screens, as numeric keys (global numbering); a missing key is a
   screen that silently never reports. _test/verify-report.js reads this block by regex. */
var SCREEN_TO_SUBCONTENT = {
  28: null,
  29: ['001', 1],
  30: ['002', 1],
  31: ['003', 1],
  32: ['004', 1],
  33: ['005', 1],
  34: ['005', 2],
  35: null,             // transition into the coupons block
  36: ['006', 1],
  37: ['006', 2],
  38: ['006', 3],
  39: ['007', 1]
};

var XAPI_QMAP = {
  29: ['001', 'q1'],
  30: ['002', 'q1'],    // value box + dropdown slot, one declared question, one verdict
  31: ['003', 'q1'],
  32: ['004', 'q1'],
  33: ['005', 'q1'],
  34: ['005', 'q2'],
  36: ['006', 'q1'],
  37: ['006', 'q2'],
  38: ['006', 'q3'],
  39: ['007', 'q1']
};

var XAPI_EVAL_ITEMS = { '001': 1, '002': 1, '003': 1, '004': 1, '005': 1, '006': 1, '007': 1 };

/* s28: "5 שאלות … ענו נכון על 4 שאלות ומעלה כדי להתקדם". REPORT-ONLY (decision 28.09.26): read as
   the five stations of the "basic" stepper (s29-s34 = items 001-005; station 5 spans s33+s34 and
   counts when both are correct, as the stepper itself shows it). 006/007 are scored but outside
   the promised set. success:false here is what the platform's recommendedAfterFail (→ 02) acts on.
   See docs-and-tools/PASS-MARKS.md. */
var PART_PASS = { need: 4, sets: [
  ['001/q1'],
  ['002/q1'],
  ['003/q1'],
  ['004/q1'],
  ['005/q1', '005/q2']
] };

/* The stop (MOE 05.10 + 06.10: "בהתחלה רשום לענות על 4 שאלות מתוך 5 כדי להתקדם אבל זה מאפשר להתקדם
   גם אם עניתי שגוי על כל 5 השאלות"; נמרוד: "צריך לתקן שיהיה צריך 4 תשובות נכונות כדי להתקדם. כמובן
   לא משנה באיזה סדר"). The pass mark above is no longer report-only: forward off s34 (the last basic
   screen) with fewer than 4 of the 5 stations correct ends the component there — success:false, the
   button disabled — instead of moving on to "יופי של עבודה" (s35). Same pattern as ratio-04 03. */
var XAPI_STOP = { at: 34, need: PART_PASS.need, sets: PART_PASS.sets };
