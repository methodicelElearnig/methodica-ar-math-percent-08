'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-math-percent-08-02 — component 02 of 4 · screens 10-27 · deck slides 20-37
   תרגול סטנדרטי

   CONFIGURATION ONLY — data, read at CALL time by the shared layer in ../unit-js/.
   The split follows the deck's own "רכיב N" separator slides.
   `var`, never const/let: the shared layer reads these through typeof guards, and no top-level
   name here may also be declared in ../unit-js/ (the collision is silent and last-wins).
   ═══════════════════════════════════════════════════════════════════ */
/* next / prev name index.html explicitly: the MOE CDN serves nothing for a folder URL. */
window.PART_CONFIG = { start: 10, end: 27, next: "../methodica-math-percent-08-03/index.html", prev: "../methodica-math-percent-08-01/index.html" };

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════ */

var XAPI_COMP_SLUG     = 'methodica-math-percent-08-02';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';     // must equal metadata `id`
var XAPI_METADATA_FILE = '../metadata/methodica-math-percent-08-02.json';

/* screen -> [item suffix, page within the item]; null = no catalogue item.
   ⚠️ Exactly this component's screens, as numeric keys (global numbering); a missing key is a
   screen that silently never reports. _test/verify-report.js reads this block by regex. */
var SCREEN_TO_SUBCONTENT = {
  10: null,
  11: ['001', 1],       // the map hub — returned to after every zone (XAPI_HUB_SCREENS)
  12: ['002', 1],
  13: ['002', 2],
  14: ['003', 1],
  15: ['003', 2],
  16: ['003', 3],
  17: ['004', 1],
  18: ['005', 1],
  19: ['006', 1],
  20: ['006', 2],
  21: ['006', 3],
  22: ['006', 4],
  23: ['007', 1],
  24: ['007', 2],
  25: ['007', 3],
  26: ['007', 4],
  27: ['008', 1]
};

/* Every zone's last question routes back to s11 (q.next = 11): entering the hub closes the zone
   item even though its number is lower (20-xapi.js, the hub exception to O-1). */
var XAPI_HUB_SCREENS = { 11: 1 };

var XAPI_QMAP = {
  13: ['002', 'q1'],
  15: ['003', 'q1'],
  16: ['003', 'q2'],
  17: ['004', 'q1'],
  18: ['005', 'q1'],
  20: ['006', 'q1'],
  21: ['006', 'q2'],
  22: ['006', 'q3'],
  24: ['007', 'q1'],    // four boxes, one declared question, one verdict
  25: ['007', 'q2'],
  26: ['007', 'q3']
};

/* 001 (hub) and 008 (closing story) ask nothing. */
var XAPI_EVAL_ITEMS = { '002': 1, '003': 1, '004': 1, '005': 1, '006': 1, '007': 1 };

/* s10: "6 שאלות — צריך לענות נכון על 4 שאלות לפחות". REPORT-ONLY (decision 28.09.26): read as the
   six catalogue items 002-007, an item counting when all its questions are correct; nothing
   blocks the learner. See docs-and-tools/PASS-MARKS.md before changing. */
var PART_PASS = { need: 4, sets: [
  ['002/q1'],
  ['003/q1', '003/q2'],
  ['004/q1'],
  ['005/q1'],
  ['006/q1', '006/q2', '006/q3'],
  ['007/q1', '007/q2', '007/q3']
] };
