# methodica-ar-math-percent-08 — שינוי באחוזים מול שינוי בכמות (יעד 4.8)

The 49-screen unit in the client's multi-component structure. Same shape as
`units/methodica-math-percent-07-main` and `…ratio-01-02-main`, which the client
approved: global screen numbering preserved, each component bounded by
`window.PART_CONFIG`, one shared `unit-js/` layer.

## Where the split comes from

**The deck itself.** `pptx/methodica-ar-math-percent-08.pptx` carries a hidden
"רכיב" separator slide before each component, each printing the folder name to
use. Those four slides — **3, 19, 38 and 51** — are the boundaries, and every
one of them falls exactly between two built screens.

| | screens | deck slides | |
|---|---|---|---|
| 01 | 0–9   | 4–18  | הקנייה ותרגול סטנדרטי |
| 02 | 10–27 | 20–37 | תרגול סטנדרטי |
| 03 | 28–39 | 39–50 | תרגול בסיסי ותרגול סטנדרטי ב' |
| 04 | 40–48 | 52–60 | שאלת שיא (מועד א') |

The deck is 60 slides with **7 hidden** (3, 8, 9, 10, 19, 38, 51). Twelve slides
are not learner screens: the cover, the production sheet, the four component
dividers, three video storyboard stills and two video script sheets.

## Layout

- `index.html` — local-browsing convenience only: redirects to component 01's
  `index.html`, carrying the query string. **Not deployed** — platforms launch each
  component by its own `…/<component>/index.html` link (rule, 28.09.26).
- `methodica-ar-math-percent-08-01 … -04/` — four component apps (`index.html` +
  `script.js` + `styles.css` + `assets/` + their own `index_dev.html`, dev only).
- `unit-js/` — the shared layer, ONE copy (see `unit-js/README.md`):
  - the vendored 720-core: `motion.js`, `quiz-engine.js`, `questions.js`,
    `report-modal.js`, `unit.js`, `engine.js`;
  - the platform layer: `10-identity.js`, `20-xapi.js`, `40-resume.js`,
    `50-loader.js`, `70-platform.js`, `90-boot.js`.
- `metadata/` — unit + per-component JSONs, v2.5 (unit id = bare slug).
- `_test/` — headless harness (jsdom) + the local stand-in for the CDN library.
  Never deployed. See `_test/README.md`.
- `docs-and-tools/` — packaging (allowlist, build, verify), catalogue tools
  (send / retrieve metadata) and `PASS-MARKS.md`. Never deployed.

`script.js` is configuration only — `PART_CONFIG` plus the xAPI configuration
(declared with `var`). Every behaviour lives in `unit-js/`. No top-level
identifier may exist in both; the collision is silent and last-wins (asserted
by `_test/verify-report.js`).

## Screen numbering and boundaries

Screens keep their **global 0–48 numbering**; `PART_CONFIG = {start, end, next,
prev}` bounds each component. Walking off either end is now handled by the
platform layer — see *The platform owns routing* below. Only a local `?dev=1`
walkthrough still loads the neighbouring component (`?screen=last` on the way
back, so Back lands on the screen the learner actually left from).

Assets are distributed, not duplicated: each component carries only the files
its own screens reference. The whole repo is ~25 MB, the same as the
single-folder build.

## Changes made to the unit during conversion

All are in the single-folder unit too, so the two stay in step. These are the
same four the percent-07 conversion needed — see
`720-folder-structure-change` in the project memory:

1. **Screen builders bounded by `PART_CONFIG`** (`quizBuildScreens`,
   `buildGuidedScreens`, `buildMapScreen`); without it every component ships the
   whole unit. Question *state* is still registered for every question.
2. **`goToNextPart` / `goToPrevPart` implemented** — `goTo()` already called the
   first, but nothing defined it.
3. **Boot opens on `firstScreen()`**, not a hard `goTo(0)` — once `goTo()` hops
   backwards for `n < start`, that call walks every component back to 01.
4. The map hub on screen 11 lives in component 02 along with all six zones it
   routes to, so its gating is unaffected by the split.

## Verified

- All four components build exactly their own screens: 10 / 18 / 12 / 9 = 49,
  nothing outside range, each opening on its own first screen.
- No uncaught errors in any component.
- Forward hop (component 02 → 03) confirmed over HTTP; `?screen=last` opens
  component 02 on screen 27, and no parameter opens it on screen 10.

**file:// caveat:** cross-component hops need an explicit `index.html` in the
URL and only behave over HTTP (`python3 -m http.server`).

## xAPI reporting, issue reporting and resume (28.09.26)

Added per `2026/Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md`
(current through 2026-09-24: D-1 … D-15, B-1). The shared platform files are
methodica-math-ratio-01's (`35648a6`); the glue onto this unit's 720-core engine
(`unit-js/70-platform.js`) follows methodica-math-ratio-06, which runs the same
engine. Nothing in any other unit was changed.

- **Reporting.** Component `initialized` on load; item `initialized` / `completed`
  pairs driven by `SCREEN_TO_SUBCONTENT` from `goTo`; `answered` / `answered.last`
  from `quizCheck` (one statement per declared question — s45's two boxes and
  s47's four statements each carry their own verdict); `requested.1` once per
  question (hints ledger); YouTube `played` / `paused` on s3 / s8 (item = object);
  the component `completed` on the component's last click. No unit-level
  statement. Library: `xapi-720-k.js` from the MOE CDN.
- **Pass marks — report-only.** s10 / s28 / s40 promise "4 of 6 / 4 of 5 / 4 of
  5". `success` is computed from them and sent with the component `completed`;
  nothing blocks the learner. Read `docs-and-tools/PASS-MARKS.md` before changing
  anything — it lists the counted sets and the open questions.
- **Guided screens s5–s7 — provisional.** Each pick is reported as
  `answered.last` with a fictive `success:true, scaled:1`; never scored.
- **Issue reporting.** The existing dialog now takes the unit / component slugs
  from `window.METADATA` (it used to post `…-xx` when the path did not match) and
  fills the item and page fields from `SCREEN_TO_SUBCONTENT`. One shared 720
  Google Form; its keys are unchanged.
- **Resume.** One state document per component (v6), addressed by
  `?registration`: the payload (every question's state, submitted and pending,
  the guided picks, the verdicts), the `done` / `doneItems` / `hints` ledgers and
  the component's verdict. A painter per interaction type repaints every screen
  on every navigation; the Retry gate (same wrong answer cannot be resubmitted)
  survives a reload. A boot cover hides the first screen until the restore
  decision.

### The platform owns routing

Kata launches each component on its own URL with its own `?registration` and
routes on our `completed` (v2.7 p.23). So in production:

- the last click of a component (01 s9, 02 s27, 03 s39 "שנמשיך?", 04 s48) reports
  the component `completed`, disables the button, and **navigates nowhere**;
- the first screen's "חזרה" (s10, s28, s40) is hidden;
- the arrow keys press the screen's own buttons (never past an unanswered
  question or the hub's locked המשך).

`?dev=1` **without** `?registration` (`DEV_NAV`, `unit-js/10-identity.js`)
restores the old walk between components for local walkthroughs.

### Local testing in a browser

Serve the repo root over HTTP on localhost, then open a component with the stub
library:

```
http://localhost:<port>/methodica-ar-math-percent-08-01/?slxapi=1&registration=TEST-01&xapiLib=../_test/xapi-720-k.js
```

In the console: `__stmts()`, `__state()`, `__dupes()`, `__reset()`. Add
`&resetState` to start the component's document from scratch. Add `&dev=1`
(and drop `registration`) to walk across components.

## Open — needs the מפתחת

The unit's content questions were tracked in the producer's
`docs/OPEN-QUESTIONS.md` (not in this repo). The two that still matter most at
delivery:

1. **No score gate anywhere — now reported, still not enforced.** Three screens
   announce a pass mark (4 of 6, 4 of 5, 4 of 5 סעיפים). Since 28.09.26 the
   marks feed the component `success`, report-only; the open questions on what
   exactly they count are in `docs-and-tools/PASS-MARKS.md`. Screen 48's `המשך`
   is now the component's last click (it reports 04 `completed`).
2. **Deck slide 58's image is not approved** — the producer's own yellow note on
   the slide demands retouching and sign-off.

Metadata is a draft: `subTopic` / `learningObjective` are written by analogy with
the ratio codes, and `informationToBot`, difficulty, timings and every
`questions: []` array are placeholders.

## Status — 15.09.26

**QA rounds closed. The one open item is the applet on screen 1**, which we are
waiting on from the client.

The producer's `followers-widget.html` (received 15.09.26) is in and working, so
the screen is complete as it stands. When the client's final version arrives,
swapping it is a one-file drop — nothing else has to change:

1. Replace `methodica-ar-math-percent-08-01/assets/applets/followers-widget.html`.
2. If it still ships its thumbnail as an inline base64 image, write the image
   out to `assets/img/` and point the page at it (the version we received was
   3MB inline; extracted it is 14KB of HTML + a 103KB cached jpg).
3. Check its natural height and, if it differs, adjust the one scoped rule
   `.applet-embed:has(iframe[src*="followers-widget"]) { height: … }`.

**The contract the unit relies on** — keep these and no unit code changes:
- URL options `?followers=` `?stage=` `?step=` `?change=`
- a `postMessage` of `{ type: 'followers-widget:state', followers, baseFollowers,
  percent, stage, locked }` to the parent

The unit uses that message for the deck's two-stage flow: **נעילה** re-bases the
widget (10,000 → +20% → 12,000 at שלב 2) so the learner can then drop 20% and see
they do not land back on 10,000; **איפוס** returns the experiment to 10,000.
The handler lives in `unit-js/unit.js` under "Followers applet (deck slide 5)".

Everything else in the unit is verified: `check_structure.py` reports 0 issues on
all four components, and no screen scrolls horizontally.
