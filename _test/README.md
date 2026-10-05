# `_test/` — headless regression oracle (methodica-math-percent-08)

**Not deployed.** Development tooling only. Exclude the whole folder from any release package,
**including the stub library**: `xapi-720-k.js` shares a basename with the real CDN library by
design, because the `XAPI_USING_G` gate reads the filename. In a sibling project the stub was once
pushed under the library's name.

(Until 28.09.26 this folder held methodica-math-ratio-01's harness verbatim. It named another unit
and could not run here. It was replaced.)

## Files

| File | What it does |
|---|---|
| `harness.js` | Shared jsdom boot. Runs the **real** loader (see below). |
| `verify-report.js` | **Structure**, plus the sweeps across every question. ~1,400 assertions. |
| `statement-flow.js` | **Behaviour**: which statements leave, in what order, with what result, and which do **not** leave on a reload or a back step. ~110 assertions. |
| `mutations.js` | **Negative tests.** Breaks one thing at a time in the real source and requires the suites to fail with the expected tag. Restores every file byte for byte. |
| `xapi-720-k.js` | Local stand-in for the CDN library, backed by `sessionStorage`. Taken from ratio-01; only the unit's keys changed. Loaded in the browser through `?xapiLib=` (localhost only). |

### What the harness runs

`harness.js` serves every script tag from disk through a jsdom request interceptor. It answers
`bootXAPI()`'s two CDN loads with an empty wrapper and the stub, which is what `?xapiLib=` does on
localhost. It fetches the metadata from disk. The loader's own poll, phase A, phase B and
`initialized` all really run. So these are all under test:

- the statement order on a resume;
- the boot cover;
- the `DOMContentLoaded` sequencing.

A replay would miss all three.

- **Reload.** A "reload" is a second boot that carries the first one's `sessionStorage`, where the
  stub keeps the state document and the statement log.
- **YouTube.** The IFrame API is served as a fake (`window.YT` with a recording `Player`), so the
  D-1 canary and the played/paused state machine run headless too.

## Running

jsdom is not in the repo and there is no `package.json`. **Do not install it inside the project
folder.** The folder is synced by OneDrive, and jsdom's `node_modules` is about 26 MB that would
sync for nothing. Install it elsewhere, once, in a single command:

```bash
mkdir -p /tmp/lomda-test-p08 && cd /tmp/lomda-test-p08 && npm install jsdom@29
```

Then, from the unit root:

```bash
NODE_PATH=/tmp/lomda-test-p08/node_modules node _test/verify-report.js && NODE_PATH=/tmp/lomda-test-p08/node_modules node _test/statement-flow.js
```

The two suites take about 30 s and 20 s. Exit 0 means everything passed; failures print as a list
at the end. The negative tests (`mutations.js`) take about 12 minutes:

```bash
NODE_PATH=/tmp/lomda-test-p08/node_modules node _test/mutations.js
```

> ⚠️ jsdom 29 has no `ResourceLoader`. The harness uses `resources.interceptors` +
> `requestInterceptor`.
>
> ⚠️ The shared `/tmp/lomda-test` install was found broken on 28.09.26 (`xhr-sync-worker.js`
> missing). Hence the separate folder above.

## What is asserted

`verify-report.js`:

| Group | What |
|---|---|
| `order`, `v`, `assets` | Script tags in the load-bearing order. `?v=` on every code reference, identical across the four components. Every local reference exists with **exact case**. |
| `cover`, `html` | Inline boot cover before `#stage`, the 800 ms / 11 s failsafe, no stray tags. |
| `letter` | `-k` named, the `[ghijk]` gate, a localhost-only same-origin `?xapiLib=`, no library copy outside `_test/`. |
| `names` | No top-level name in two files. `script.js` is configuration only, `var` only. |
| `case`, `root` | Lowercase slugs. The root launcher carries `location.search`. |
| `route` | No unit statement. Every hop sits under `DEV_NAV`. `DEV_NAV` needs `?dev=1` **and** no `?registration`. `hideCrossPartBack` runs after `partBoot`. |
| `goto` | In `goTo`: `resetScreenState → repaintScreen → xapiOnScreen → scheduleResumeSave`, and no empty catch. |
| `ledger` | `sendStatementOnce` ordering. No raw `completed` send. The B-1 guard. The `XAPI_Q_RESULTS` first-line invariant. v6 with the `hints` / `picks` ledgers. |
| `flush`, `hint` | Flush after the **last** commitment, exactly once, with no `return` in between (D-13). `answered` before any marking. `lw` recorded before the retry clears the pick. The hint reported after the guard. |
| `verdict`, `keys` | Verdicts go only through `setUnitResult` (D-12). Per-unit character / nav / result keys, matched by the stub's `__reset`. |
| `report` | The shared form and its eleven keys. `no-cors` + `URLSearchParams` + thank-you. Delegation. `[hidden]` CSS. The dialogs ship hidden. |
| `d1`, `video` | Static nocookie `enablejsapi` embeds, no `forigin`, no `videoId`. No decorative `<video>` opted in. The state machine replaces the latch. |
| `meta`, `map`, `qmap`, `eval`, `pass` | Ids byte for byte against `metadata/`. The map holds exactly each component's screens. Items match both ways. Every declared question is reported by exactly one screen (D-9). Split screens match their boxes / rows. Pass-mark keys are graded, reported questions. |
| `surface`, `dom`, `boot` | Every shared function exists in every component. The DOM holds exactly the component's screens. A `goTo` sweep. No `console.error`. |
| `paint`, `dispatch` | Every question answered, then a reload, then every screen walked: no painter error, and **every answered screen shows its answer** (rules 7 and 8). Guided screens and the hub come back painted. `restoreScreenUI` has a branch for every type in use (rule 11). |
| `retry`, `d15` | For **every** two-attempt question (D-14): wrong, then the same answer is blocked, then a different one is allowed, then leaving and coming back shows no ✗ on the changed answer (D-15), then back to the rejected answer is blocked, then after a reload it is still blocked, then the correct answer finishes it. |

`statement-flow.js` scenarios:

- a fresh load and the item boundaries;
- answering: verb, result, `student_answer`, questionId, parentId, `.last`;
- the Retry gate;
- hints: once per question, across a reload;
- **the map hub**: zone items close on the return, and B-1 on backing out of an unanswered zone;
- split screens (s45 slots, s47 rows);
- guided screens (the provisional fictive result, never scored);
- **the component end**: one `completed`, the button disabled, no navigation, the verdict
  recorded, a second exit silent, the D-8 ended button across a reload, and the "answered but not
  clicked" control;
- the report-only pass marks per component;
- **resume**: exactly component `initialized` then the landing item, the retry look and gate
  restored, answered screens painted, `#screen=N`, `?resetState`;
- **YouTube**: players attached to the existing iframes, the D-1 canary, the state machine, a
  paused on leaving, no blanking, the orphan scan, and the no-API fallback;
- the regression gate with reporting off;
- routing (`DEV_NAV`, the hidden back button, the keyboard);
- the issue report's actual POST body.

## Not covered

- **Appearance.** The suites assert classes, text and disabled flags, not pixels. The painted
  states and the RTL layout still need a browser pass.
- **Delivery.** Stubs prove payload shape, never arrival. Reporting and resume are not verified
  until they have run against Kata with a real `?slxapi` + `?registration` and a test learner
  (guide §12).
- **The real YouTube player.** The fake proves our state machine and the D-1 property of our
  markup. It does not prove the IFrame API's event timing.
- **The page number in `SCREEN_TO_SUBCONTENT`.** Nothing reads it except the issue-report form.
