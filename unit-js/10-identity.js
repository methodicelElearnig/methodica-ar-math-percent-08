'use strict';
/* ═══════════════════ xAPI (720) — identity ═══════════════════
   Shared by all four components of methodica-math-percent-08. Loaded first; see unit-js/README.md.
   Ported from methodica-math-ratio-01 (35648a6).

   Canonical id prefix for this unit. Every id the lomda reports is built from it and must match
   metadata/*.json byte-for-byte, INCLUDING the trailing slashes that convention carries. */
var XAPI_ID_PREFIX = 'https://lomdot.education.gov.il/metodica/720active/math/percent/08/';

/* The unit id is the BARE SLUG — MOE v2.5 §2.7 dropped the IRI requirement for the content unit
   only (components and items stay IRIs). It must equal metadata/methodica-math-percent-08_unit.json
   `id` exactly. Kata's State API never sees it; it keys the library's localStorage fallback. */
window.XAPI_UNIT_ID = 'methodica-math-percent-08';

/* Last path segment of a canonical id — the short slug the bug-report form records. */
function shortId(u){ return String(u || '').replace(/\/+$/, '').split('/').pop(); }

/* Resume (KATA State API) — ACTIVE.
   True also switches the loader to xapi-720-k.js, which carries the State transport that -i lacks
   plus diagnostics on the state layer (stateLastResult720). So this flag changes reporting too,
   not only restore — see 50-loader.js. Full design: Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md.

   What is implemented: one state document PER COMPONENT (unit-js/40-resume.js, v6), addressed by
   ?registration alone; the part's payload, the completed / hints ledgers and the part's own
   verdicts — which live in the document and therefore survive tab closure. */
var RESUME_ENABLED = true;

/* ── The platform owns routing (2026-09-16; README.md "The platform owns routing",
   Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md) ──
   Kata launches each component on its own URL with its own ?registration, and routes on our
   'completed' statements. The unit therefore no longer moves between components by itself: the
   last-screen buttons report and stop, the first-screen "חזרה" is hidden, and the loader's resume
   hop is gone. The navigation code is kept for local walkthroughs behind this flag — and ONLY when
   the page was not launched by the platform: every Kata launch URL carries ?registration, and a hop
   in a real session would report the next component under this component's registration. So the
   flag is refused outright whenever ?registration is present, whatever else the URL says. */
var DEV_NAV = false;
try {
  var _devQ = new URLSearchParams(location.search);
  DEV_NAV = _devQ.get('dev') === '1' && !_devQ.has('registration');
} catch (e) {}
