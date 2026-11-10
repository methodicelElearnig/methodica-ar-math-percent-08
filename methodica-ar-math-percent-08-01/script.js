'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-ar-math-percent-08-01 — component 01 of 4 · screens 0-9 · deck slides 4-18
   הקנייה ותרגול סטנדרטי

   CONFIGURATION ONLY — data, read at CALL time by the shared layer in ../unit-js/.
   The split follows the deck's own "רכיב N" separator slides.
   `var`, never const/let: the shared layer reads these through typeof guards, and no top-level
   name here may also be declared in ../unit-js/ (the collision is silent and last-wins).
   ═══════════════════════════════════════════════════════════════════ */
/* next / prev name index.html explicitly: the MOE CDN serves nothing for a folder URL. */
window.PART_CONFIG = { start: 0, end: 9, next: "../methodica-ar-math-percent-08-02/index.html", prev: null };

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════ */

var XAPI_COMP_SLUG     = 'methodica-ar-math-percent-08-01';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';     // must equal metadata `id`
var XAPI_METADATA_FILE = '../metadata/methodica-ar-math-percent-08-01.json';

/* screen -> [item suffix, page within the item]; null = no catalogue item.
   ⚠️ Exactly this component's screens, as numeric keys (global numbering); a missing key is a
   screen that silently never reports. _test/verify-report.js reads this block by regex. */
var SCREEN_TO_SUBCONTENT = {
  0: null,
  1: ['001', 1],
  2: ['001', 2],
  3: ['002', 1],
  4: ['002', 2],
  5: ['002', 3],
  6: ['002', 4],
  7: ['002', 5],
  8: ['003', 1],
  9: ['003', 2]
};

/* Which declared question each answering screen reports (metadata questions[]). */
var XAPI_QMAP = {
  1: ['001', 'q1']
};

/* Graded in code: only the s1 question. 002 is the guided walk-through (one-click reveal, no
   grading, never scored). Its three picks (s5-s7) are saved for the resume but report nothing
   since 2026-11-10: Kata declares no question on item 002, and the 'answered' to q1-q3 that the
   PROVISIONAL decision of 28.09.26 sent were the MOE runbook's unknown-id finding (class H; as
   ratio-05 01-004, QA/2026-11-10-guided-items/GUIDED-ITEMS-REPORT.md §5). 003 (video + think
   table) asks nothing. */
var XAPI_EVAL_ITEMS   = { '001': 1 };
var XAPI_GUIDED_ITEMS = { '002': 1 };

/* No pass mark in this component (nothing promised on screen): success:true on finishing. */
var PART_PASS = null;
