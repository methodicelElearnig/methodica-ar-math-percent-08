'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-math-percent-08-04 — component 04 of 4 · screens 40-48 · deck slides 52-60
   שאלת שיא (מועד א')

   CONFIGURATION ONLY — data, read at CALL time by the shared layer in ../unit-js/.
   The split follows the deck's own "רכיב N" separator slides.
   `var`, never const/let: the shared layer reads these through typeof guards, and no top-level
   name here may also be declared in ../unit-js/ (the collision is silent and last-wins).
   ═══════════════════════════════════════════════════════════════════ */
/* next / prev name index.html explicitly: the MOE CDN serves nothing for a folder URL. */
window.PART_CONFIG = { start: 40, end: 48, next: null, prev: "../methodica-math-percent-08-03/index.html" };

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════ */

var XAPI_COMP_SLUG     = 'methodica-math-percent-08-04';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';     // must equal metadata `id`
var XAPI_METADATA_FILE = '../metadata/methodica-math-percent-08-04.json';

/* screen -> [item suffix, page within the item]; null = no catalogue item.
   ⚠️ Exactly this component's screens, as numeric keys (global numbering); a missing key is a
   screen that silently never reports. _test/verify-report.js reads this block by regex. */
var SCREEN_TO_SUBCONTENT = {
  40: null,
  41: ['001', 1],
  42: ['001', 2],
  43: ['001', 3],
  44: ['001', 4],
  45: ['001', 5],
  46: ['001', 6],
  47: ['001', 7],
  48: ['001', 8]        // the ending — keeps the item open until the component closes it
};

/* One item, eight declared questions. s45's two boxes and s47's four statements each carry their
   own verdict in code, so each declared question is reported on its own (split 'slots' / 'rows'),
   with one isLast for the screen. */
var XAPI_QMAP = {
  42: ['001', 'q1'],
  44: ['001', 'q2'],
  45: ['001', ['q3', 'q4'], 'slots'],
  47: ['001', ['q5', 'q6', 'q7', 'q8'], 'rows']
};

var XAPI_EVAL_ITEMS = { '001': 1 };

/* s40: "יש בה 5 סעיפים. עליכם להצליח ב-4 לפחות". REPORT-ONLY (decision 28.09.26), provisional
   reading: the five סעיפים are q1 (s42), q2 (s44), q3 and q4 (s45's two boxes) and the statement
   grid q5-q8 (s47) as one. The deck does not letter them — open question in
   docs-and-tools/PASS-MARKS.md. */
var PART_PASS = { need: 4, sets: [
  ['001/q1'],
  ['001/q2'],
  ['001/q3'],
  ['001/q4'],
  ['001/q5', '001/q6', '001/q7', '001/q8']
] };
