# unit-js — methodica-ar-math-percent-08

The shared layer, ONE copy for every component. Two groups:

| File | Group | Role |
|---|---|---|
| `10-identity.js` | platform | ids (`XAPI_ID_PREFIX`, `XAPI_UNIT_ID` = bare slug), `RESUME_ENABLED`, `DEV_NAV` |
| `20-xapi.js` | platform | item scope, `xapiAnswered` / `xapiRequestedHint` / `xapiEndComponent`, B-1 guard, hub exception to O-1, video + YouTube state machines |
| `40-resume.js` | platform | the per-component state document (v6), ledgers, verdicts, boot cover, saves, `?resetState` |
| `50-loader.js` | platform | `bootXAPI()`: library (`xapi-720-k.js`, `?xapiLib=` on localhost), metadata, resume phases A/B, component `initialized` |
| `motion.js` | 720-core | reveal animations |
| `quiz-engine.js` | 720-core | question screens; + Retry gate (`quizSig` / `quizCheckBlocked`) and the platform hooks |
| `questions.js` | 720-core | the unit's question content |
| `report-modal.js` | 720-core | "מצאתם בעיה?" dialog; identity from `window.METADATA` |
| `unit.js` | 720-core | guided screens, map hub, followers applet |
| `engine.js` | 720-core | `goTo`, scaling, keys, dev bridge; + the platform hooks |
| `70-platform.js` | platform | the glue: reporting call sites, `partExit`, `partResult`, resume hooks and painters, keyboard, YouTube players, `partBoot` |
| `90-boot.js` | platform | the ONLY file with top-level side effects; LAST script tag |

## Load order (every component's `index.html`, identical `?v=`)

`10-identity → 20-xapi → 40-resume → 50-loader → script.js → motion →
quiz-engine → questions → report-modal → unit → engine → 70-platform → 90-boot`

- Every file except `90-boot.js` is definition-only (the 720-core files register
  listeners at load, as they always did); the shared code reads per-component
  seams at CALL time, so `script.js` may load after the platform files.
- `90-boot.js` runs at `DOMContentLoaded`, after the 720-core's own listeners
  (guided and map screens are built first), and keeps its own tag: a top-level
  throw elsewhere cannot reach it.
- Each component's `script.js` is configuration only (`var`): `PART_CONFIG`,
  `XAPI_COMP_SLUG` / `XAPI_COMP_ID` / `XAPI_METADATA_FILE`,
  `SCREEN_TO_SUBCONTENT`, `XAPI_QMAP`, `XAPI_EVAL_ITEMS`, `PART_PASS` (+
  `XAPI_HUB_SCREENS` in 02, `XAPI_GUIDED_ITEMS` in 01).
- No top-level identifier may exist in two files — the collision is silent and
  last-wins. Asserted by `_test/verify-report.js`.
- Bump every `?v=` together, in all four `index.html`, in the same commit as any
  change here.
