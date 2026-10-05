'use strict';
/* ═══════════════════ BOOT ═══════════════════
   The LAST script tag on every page. Its own tag, never lines appended to another file: a
   top-level throw elsewhere cannot reach it (ADDING-REPORTING-AND-RESUME.md §3.2).

   The order is load-bearing:
     0. initResumeResetHatch() first — it strips ?resetState from the URL and raises the reset
        flag before anything reads the query or touches the state document.
     1. the leave handlers and the pending-answer saves.
     2. partBoot() (70-platform.js) — build the question screens, scale, land on the component's
        first screen, attach the YouTube players. Before bootXAPI(), so a restore replays onto
        built screens.
     3. hideCrossPartBack() — the first screen's "חזרה" (production only; §8.12).
     4. bootXAPI() last — the library, the metadata, the resume read and restore, the component
        'initialized'.
   Each of 0-3 is individually wrapped, so one failure cannot suppress the others.

   Runs at DOMContentLoaded (as methodica-math-ratio-06, the same engine): the 720-core files
   register their own DOMContentLoaded work (motion.js, quiz-engine.js's image-zoom pass, unit.js's
   guided and map screens), and this listener — registered last — keeps the vendored order: theirs
   first, then the boot that used to be engine.js's. */
function _bootUnit() {
  try { initResumeResetHatch(); }    catch (e) { console.error('[boot] initResumeResetHatch', e); }
  try { initResumeLeaveHandlers(); } catch (e) { console.error('[boot] initResumeLeaveHandlers', e); }
  try { initResumeFieldSaves(); }    catch (e) { console.error('[boot] initResumeFieldSaves', e); }
  try { initQuizFieldSaves(); }      catch (e) { console.error('[boot] initQuizFieldSaves', e); }
  try { partBoot(); }                catch (e) { console.error('[boot] partBoot', e); }
  try { hideCrossPartBack(); }       catch (e) { console.error('[boot] hideCrossPartBack', e); }
  bootXAPI();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _bootUnit);
else _bootUnit();
