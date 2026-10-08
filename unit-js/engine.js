/* =====================================================================
   720-core — screen engine (shared across all units; vendored per unit)
   Per 720-templates references/_global-components.md.

   The unit must define BEFORE this file runs (js/unit.js):
     TOTAL_SCREENS        — number of screens
     resetScreenState(n)  — per-screen restore hook
   Optional: quizBuildScreens() from quiz-engine.js (auto-called if present).
   ===================================================================== */

'use strict';

let currentScreen = 0;


/* ---------- Canvas scaling (1280×710) ---------- */
function scaleApp() {
  const app = document.getElementById('app');
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 710);
  app.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', scaleApp);


/* ---------- Multi-component boundary hops ----------
   Walking off either end loads the neighbour and carries the query string
   across; `?screen=last` tells the neighbour to open on ITS last screen so Back
   lands where the learner actually left.
   Since the platform integration these run ONLY under DEV_NAV (?dev=1 without
   ?registration — 10-identity.js): in production Kata launches each component
   and routes on its 'completed', so goTo() below calls partExit() (70-platform.js)
   instead, which reports and stops. */
function goToNextPart() {
  const p = window.PART_CONFIG;
  if (!p || !p.next) return;
  window.location.replace(p.next + window.location.search);
}
function goToPrevPart() {
  const p = window.PART_CONFIG;
  if (!p || !p.prev) return;
  const q = window.location.search;
  window.location.replace(p.prev + (q ? q + '&' : '?') + 'screen=last');
}
/* The screen this app opens on: its part's first, or its LAST when the next
   component sent the learner back. Plain units open on 0. */
function firstScreen() {
  const p = window.PART_CONFIG;
  if (!p) return 0;
  /* ?screen=last is written only by the DEV_NAV back hop; a platform launch always lands on the
     component's first screen (a resume then moves it to the saved one — 50-loader.js). */
  const devNav = (typeof DEV_NAV !== 'undefined') && DEV_NAV;
  return devNav && new URLSearchParams(window.location.search).get('screen') === 'last' ? p.end : p.start;
}

/* ---------- Navigation ---------- */
function goTo(n) {
  /* Part mode (5-component delivery architecture, per approved units):
     window.PART_CONFIG = { start, end, next | (routeByScore + nextPass/nextFail) }.
     Navigating past the part's last screen routes to the next part app. */
  if (window.PART_CONFIG) {
    /* Leaving the component: the platform layer reports and stops (partExit, 70-platform.js);
       without the layer the old hop is kept. */
    const _exit = (typeof partExit === 'function') ? partExit : null;
    if (n > window.PART_CONFIG.end) { if (_exit) _exit(1); else goToNextPart(); return; }
    if (n < window.PART_CONFIG.start) { if (_exit) _exit(-1); else goToPrevPart(); return; }
  }
  /* A mid-component stop (XAPI_STOP, 70-platform.js): forward off the stop screen with the promised
     questions not passed ends the component there. One hook covers the check button, the arrow key
     and advanceScreen alike. Never while a resume replays the saved screen. */
  if (n === currentScreen + 1 && typeof stopBlocks === 'function' && !(typeof _restoring !== 'undefined' && _restoring) &&
      stopBlocks(currentScreen)) { endComponentAtStop(); return; }
  if (n < 0 || n >= TOTAL_SCREENS) return;
  /* 07.09 — a retired screen number (43, folded into 42) must not blank the
     canvas. The teardown below used to run BEFORE the lookup, so navigating to
     a number with no section left every screen deactivated. Resolve the target
     first, and skip a gap in the direction of travel so the DEV bar's numeric
     stepper walks straight over it. */
  let target = document.querySelector(`.screen[data-screen="${n}"]`);
  if (!target) {
    const step = n >= currentScreen ? 1 : -1;
    for (let i = n + step; i >= 0 && i < TOTAL_SCREENS; i += step) {
      target = document.querySelector(`.screen[data-screen="${i}"]`);
      if (target) { n = i; break; }
    }
    if (!target) return;
  }
  // Close all feedback popups and hint overlays before the screen swap
  document.querySelectorAll('[id$="-popup"], [id$="-hint-overlay"]')
    .forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.applet-embed.is-zoomed').forEach(el => el.classList.remove('is-zoomed'));
  const prev = document.querySelector('.screen.active');
  if (window.Motion && prev) Motion.cancel(prev);
  /* 24.09, client QA: a clip kept playing — and audible — after navigating
     away, because hiding a screen does not pause what is inside it. Stop and
     rewind EVERY player in the unit on each move, then start the ones the
     incoming screen marks `autoplay`. Rewinding matters as much as pausing: a
     news bulletin resumed mid-sentence when the learner came back.

     The two news bulletins are YOUTUBE IFRAMES, not <video> — a hidden iframe
     keeps playing, audio and all, and no DOM property will pause it. Blanking
     the src tears the player down; the original is parked on a data attribute
     and restored when the screen is entered again, so it restarts from 0 like
     the <video> clips do. */
  document.querySelectorAll('video').forEach(v => {
    if (v.pause) { v.pause(); try { v.currentTime = 0; } catch (e) {} }
  });
  document.querySelectorAll('iframe[src], iframe[data-src]').forEach(f => {
    /* A YouTube player wired for reporting is stopped through its API instead (ytLeave,
       70-platform.js: closes an open 'played' with its 'paused', then rewinds) — blanking the src
       would sever the binding. Unwired (API not loaded): the blanking below, as before. */
    if (typeof ytLeave === 'function' && ytLeave(f)) return;
    const live = f.getAttribute('src');
    if (live && !/^about:blank$/.test(live)) {
      if (!f.dataset.src) f.dataset.src = live;
      f.setAttribute('src', 'about:blank');
    }
  });
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  target.classList.add('active');
  target.querySelectorAll('video[autoplay]').forEach(v => {
    const play = v.play();
    if (play && play.catch) play.catch(() => {});
  });
  target.querySelectorAll('iframe[data-src]').forEach(f => {
    /* A wired YouTube iframe is never blanked (ytLeave); if one is found blank anyway, ytHeal
       restores the embed and re-wires it (QA B-4, 2026-10-04). */
    if (f.__ytPlayer) { if (typeof ytHeal === 'function') ytHeal(f); return; }
    if (f.getAttribute('src') !== f.dataset.src) f.setAttribute('src', f.dataset.src);
  });
  if (window.Motion) Motion.reveal(target);
  currentScreen = n;
  resetScreenState(n);
  if (typeof decorateBubbles === 'function') decorateBubbles(target);
  /* Platform layer (70-platform.js / 20-xapi.js / 40-resume.js), in this order (guide §8.4a):
     repaint the screen from state FIRST (capture reads the DOM a save would persist), then the
     item statements, then the debounced save. Each guarded and never with an empty catch: a stale
     cached shared file against a fresh engine.js must be visible in the console. */
  if (typeof repaintScreen === 'function') { try { repaintScreen(n); } catch (e) { console.error('[resume] repaint', e); } }
  if (typeof xapiOnScreen === 'function') { try { xapiOnScreen(n); } catch (e) { console.error('[xAPI] onScreen', e); } }
  if (typeof scheduleResumeSave === 'function') { try { scheduleResumeSave(); } catch (e) { console.error('[resume] schedule', e); } }
  // keep the DEV harness in sync when navigation happens INSIDE the lomda
  // (buttons / keyboard), not only via the DEV bar
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'DEV_SCREEN', screen: n }, '*');
  }
}

document.addEventListener('keydown', (e) => {
  /* A key typed into an answer box or the report form is not navigation. */
  const t = e.target;
  if (t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
  /* With the platform layer an arrow presses the screen's own forward / back control
     (keyboardForward / keyboardBack, 70-platform.js) — never past an unanswered question or a
     locked gate. Without it, the raw walk. */
  if (e.key === 'ArrowLeft') { if (typeof keyboardForward === 'function') keyboardForward(); else goTo(currentScreen + 1); }  // RTL: left = forward
  if (e.key === 'ArrowRight') { if (typeof keyboardBack === 'function') keyboardBack(); else goTo(currentScreen - 1); }
  if (e.key === 'Escape' && typeof quizCloseHint === 'function') quizCloseHint();
});

/* Dev bridge for index_dev.html — shared 720 protocol (DEV_GOTO / DEV_READY /
   DEV_SCREEN); 'goto' is kept so any older harness still works. */
window.addEventListener('message', (e) => {
  if (!e.data) return;
  if (e.data.type === 'DEV_GOTO' || e.data.type === 'goto') {
    const n = parseInt(e.data.screen, 10);
    if (!isNaN(n)) goTo(n);
  }
});
if (window.parent !== window) {
  // screens are generated at runtime, so count them once the DOM is built
  const announce = () => {
    const built = document.querySelectorAll('.screen[data-screen]').length;
    window.parent.postMessage({
      type: 'DEV_READY',
      total: Math.max(built, typeof TOTAL_SCREENS === 'number' ? TOTAL_SCREENS : 0),
      part: window.PART_CONFIG || null,
    }, '*');
  };
  if (document.readyState === 'complete') announce();
  else window.addEventListener('load', announce, { once: true });
}

/* ---------- Applet fullscreen zoom (in place — state persists) ---------- */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-applet-toggle]');
  if (!btn) return;
  btn.closest('.applet-embed').classList.toggle('is-zoomed', btn.dataset.appletToggle === 'open');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.applet-embed.is-zoomed').forEach(el => el.classList.remove('is-zoomed'));
  }
});

/* ---------- Init ----------
   With the platform layer the boot is partBoot() (70-platform.js), called from 90-boot.js so the
   resume restore replays onto built screens; this vendored block then stands down. */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof partBoot === 'function') return;
  if (typeof quizBuildScreens === 'function') quizBuildScreens();
  scaleApp();
  /* NOT a hard goTo(0): once goTo() hops to the PREVIOUS component for
     n < PART_CONFIG.start, a boot goTo(0) walks every component back to 01. */
  goTo(firstScreen());
});
