/* =====================================================================
   methodica-math-percent-08 — unit logic (screens 0-48 = deck slides 4-60).
   Runs on the shared 720-core (engine.js / quiz-engine.js).
   ===================================================================== */

'use strict';

const TOTAL_SCREENS = 49;

function resetScreenState(n) {
  if (n === 11 && typeof mapRefresh === 'function') mapRefresh();
  if (typeof quizStepperUpdate === 'function') quizStepperUpdate(n);
}

/* The DEV harness bridge (DEV_GOTO / DEV_READY / DEV_SCREEN) lives in engine.js alone. A second
   copy stood here until 28.09.26: every DEV_GOTO ran goTo() twice, and DEV_READY / DEV_SCREEN were
   posted twice — with reporting on, that is two item boundaries per harness click. */

/* ═══ Followers applet (deck slide 5) ═════════════════════════════════
   The widget is the producer's own `assets/applets/followers-widget.html`,
   embedded in the standard applet iframe — layout, copy and icons exactly as
   supplied.

   Its STAGING RULE now lives inside the widget itself (17.09.26). It used to
   be driven from here: the parent watched for `followers-widget:state` and
   reloaded the iframe with new URL params to re-base it. That round-trip
   flashed the applet on every lock and fought the widget's own lock, which
   only froze the stepper. The widget now commits the baseline in place, so
   there is nothing for the unit to do.                                      */

/* The one thing the unit still does: keep the frame at least as tall as the
   widget says it is. The widget posts its own height with every state change;
   a frame shorter than that content is what produced the client's Y scroll. */
const FA_MAX_H = 600;                      /* clears the bottom bar on s1 */
window.addEventListener('message', (e) => {
  const d = e.data;
  if (!d || d.type !== 'followers-widget:state' || !d.height) return;
  document.querySelectorAll('.applet-embed iframe[src*="followers-widget"]').forEach((frame) => {
    if (e.source !== frame.contentWindow) return;
    const box = frame.closest('.applet-embed');
    if (!box) return;
    const want = Math.min(Math.ceil(d.height) + 4, FA_MAX_H);
    if (want > box.getBoundingClientRect().height) box.style.height = want + 'px';
  });
});

/* =====================================================================
   Screens 4-7 — deck slides 12-15 · Guided Math Practice Screen
   Template: template-library/GuidedInstructionFlow (source proportion-02-01
   screen 13, QA closed 07.09.26). Structure/class names are the approved
   component; only the content is swapped.

   All four slides share one frame: the centred title, the bold instruction
   line and the outlined exercise box on the right are byte-identical in the
   deck. Only the purple step card on the left changes, so it is the only
   thing the config carries.

   Deck slips carried through, NOT silently fixed (see docs/OPEN-QUESTIONS.md):
   - the purple panel's left inset drifts 0.2 / 15.6 / 23.2 / 23.2 px across
     the four slides, and slide 12 breaks the 25px margin rule outright —
     normalised here to one inset.
   - slide 15's two pills are 122.5px and 98.6px wide (a leftover from slide
     14's three-pill row) — equalised here.
   - the proportion table is authored at 12pt = 16px, under the 18px floor —
     raised here.
   ===================================================================== */

const G_TITLE = 'التغيُّر في النسبة المئوية مقابل التغيُّر في الكميات';
const G_INTRO = 'تأملوا في التمرين التالي. لا تحلوه، فقط انظروا إلى المعطيات وفكروا فيها.';

/* the outlined exercise box — identical copy on slides 12, 13, 14 and 15.
   Deck slides 12/13 draw it at x 523.4 w 664.3 and slides 14/15 at x 472.6
   w 715.1 with the same text; one box is used here. */
const G_EXERCISE = `
  <p>من التقرير نعرف المعطيات التالية‎:</p>
  <p>تم وضع 15,000 بيضة‎.</p>
  <p>في العاصفة الأولى تفرّقت نسبة %12 من البيض‎.</p>
  <p>في العاصفة الثانية تفرّقت نسبة %10 إضافية‎.</p>
  <p class="g-claim">يدّعي المذيع وائل أن %22 من البيض قد تفرّق‎.</p>`;
const G_ASK = 'هل هو على صواب؟';

/* deck slide 14's proportion table. `a:tblPr` carries no rtl, so grid col 0 is
   the LEFTMOST (אחוז) and col 1 the rightmost (המספר) — and in an RTL HTML
   table the FIRST cell renders rightmost, so the columns are emitted reversed. */
const G_PROP_TABLE = `
<table class="data-table gc-table">
  <thead><tr><th>العدد</th><th>النسبة المئوية</th></tr></thead>
  <tbody>
    <tr><td>11,880</td><td><span class="eq-ltr">x</span></td></tr>
    <tr><td>15,000</td><td>100%</td></tr>
  </tbody>
</table>`;

/* `frac` is declared in questions.js, which loads first. */

const GUIDED = [
  {
    /* deck slide 12 — read the data. No question; המשך is already enabled
       per the note ("כפתור המשך יהיה זמין ללחיצה", with no אחרי בחירה). */
    screen: 4,
    card: `<p><strong>نحسب الكميات</strong></p>
           <p>علينا حساب كمية البيض التي تفرّقت في العاصفتين معًا‎.</p>
           <p>يمكن إجراء الحساب لكل عاصفة على حدة‎:</p>
           <p>أولًا نحسب عدد البيض الذي بقي بعد العاصفة الأولى، ثم نحسب عدد البيض المتبقي من الكمية الجديدة‎.</p>
           <p><strong>أو</strong></p>
           <p>يمكننا حساب الكمية بسرعة في عملية واحدة‎.</p>`,
  },
  {
    /* deck slide 13 — compute the quantity. Key = לא (BadgeTick overlaps the
       לא pill by 30.6px and does not reach כן; 15,000 → 11,880 leaves 3,120
       scattered = 20.8%, not Dan's 22%).
       Pills in the deck run כן (right) then לא (left); in an RTL row the first
       child renders rightmost, so the array order is the visual order. */
    screen: 5,
    card: `<p><strong>نحسب كمية البيض التي بقيت بعد العاصفتين‎:</strong></p>
           <p>نحوّل إلى كسر عشري. تذكّروا أنه بما أن الحديث عن تقليل الكمية، سيكون الكسر العشري أصغر من ‎1.</p>
           <!-- NOT .eq-ltr: the producer wants these two read right-to-left,
                i.e. the percent FIRST (10.09.26). Each number keeps its own
                LTR run; only their order flips. -->
           <p class="gc-conv">12% = 0.88</p>
           <p class="gc-conv">10% = 0.9</p>
           <p class="gc-eq"><span class="eq-ltr">15,000 · 0.88 · 0.9 = 11,880</span></p>`,
    cardQ: 'هل يكفي ذلك لتأييد ادعاء وائل؟',
    q: { opts: ['نعم', 'لا'], correct: 1 },
  },
  {
    /* deck slide 14 — the proportion table. Key = 79.2% (BadgeTick overlaps the
       middle pill by 42.5px; 11,880 / 15,000 = 0.792). Pills run 79.5% (right),
       79.2%, 78.5% (left). */
    screen: 6,
    card: `<p><strong>تنقصنا مرحلة قبل أن نعرف إذا كان وائل على صواب أم مخطئًا‎.</strong></p>
           <p>نحسب نسبة التغيّر في كمية البيض بعد العاصفتين بواسطة جدول التناسب‎.</p>
           ${G_PROP_TABLE}`,
    cardQ: 'أي نسبة مئوية بقيت من البيض؟',
    q: { opts: ['79.5%', '79.2%', '78.5%'], correct: 1 },
  },
  {
    /* deck slide 15 — solve the proportion. Key = לא, matching slide 13.
       Four real m:oMath equations on the panel; the first is a stacked pair. */
    screen: 7,
    card: `<p><strong>صحيح، بقي 79.2 بالمئة من البيض وفقًا لمعادلة التناسب‎:</strong></p>
           <p class="gc-eq"><span class="fracpair">${frac('x', '100')}<span class="eq-op">=</span>${frac('11,880', '15,000')}</span></p>
           <p class="gc-eq"><span class="eq-ltr">150x = 11,880</span></p>
           <p class="gc-eq"><span class="eq-ltr">x = 79.2%</span></p>
           <p>إذا بقي %79.2 من البيض، فهذا يعني أن %20.8 منه قد تفرّق‎:</p>
           <p class="gc-eq"><span class="eq-ltr">100 − 79.2 = 20.8%</span></p>`,
    cardQ: 'هل كان وائل على صواب؟',
    q: { opts: ['نعم', 'لا'], correct: 1 },
  },
];

const guidedState = {};

/* the plain-bulb icon the approved step card carries in its top corner */
const GC_BULB = `<svg class="gc-bulb" viewBox="0 0 20.997 27.9988" fill="none" aria-hidden="true">
  <path d="M17.4818 2.65764C15.2512 0.668476 12.2563 -0.275357 9.25683 0.0699765C4.59833 0.60431 0.748334 4.35748 0.103168 8.99148C-0.387999 12.5078 0.894168 16.0031 3.532 18.34C4.99267 19.6338 5.83033 21.5191 5.83033 23.5095V23.9155C5.83033 26.1671 7.662 27.9988 9.91367 27.9988H11.0803C13.332 27.9988 15.1637 26.1671 15.1637 23.9155V23.5095C15.1637 21.5308 16.0072 19.6321 17.4877 18.3143C19.6108 16.4243 20.9968 13.6885 20.9968 10.6666C20.9968 7.51914 19.6435 4.58398 17.4818 2.65764ZM13.9968 23.9155C13.9968 25.5236 12.6885 26.8319 11.0803 26.8319H9.91367C8.3055 26.8319 6.99717 25.5236 6.99717 23.9155V23.6666H13.9968V23.9155ZM16.7117 17.4441C15.1252 18.8546 14.1655 20.7801 13.9968 22.4996H12.2503V15.4996C12.2503 15.1776 11.9888 14.9161 11.6668 14.9161C11.3448 14.9161 11.0833 15.1776 11.0833 15.4996V22.4996H9.91367V15.4996C9.91367 15.1776 9.65217 14.9161 9.33017 14.9161C9.00817 14.9161 8.74667 15.1776 8.74667 15.4996V22.4996H6.99717C6.83433 20.7906 5.87233 18.8686 4.30667 17.4791C1.97967 15.4166 0.850168 12.3373 1.28217 9.15181C1.85183 4.95064 5.32617 1.68881 9.34733 1.23231C11.9958 0.928476 14.6432 1.76381 16.6118 3.51864C18.5233 5.22314 19.8298 7.81948 19.8298 10.6666C19.8298 13.3348 18.5967 15.7626 16.7117 17.4441Z" fill="currentColor"/>
</svg>`;

function buildGuidedScreens() {
  const app = document.getElementById('app');
  const backRef = document.getElementById('quiz-hint-overlay');
  GUIDED.forEach((cfg) => {
    if (!inPart(cfg.screen)) return;
    guidedState[cfg.screen] = { done: false, selected: null };
    const sec = document.createElement('section');
    sec.className = 'screen g-screen';
    sec.dataset.screen = cfg.screen;
    sec.id = `g${cfg.screen}`;

    const opts = cfg.q ? `<div class="gc-opts" role="radiogroup" aria-label="خيارات الإجابة">
      ${cfg.q.opts.map((o, i) => `
        <div class="gc-opt" role="radio" aria-checked="false" tabindex="0" data-idx="${i}"
             onclick="guidedAnswer(${cfg.screen}, this)"
             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();guidedAnswer(${cfg.screen}, this);}">${o}</div>`).join('')}
    </div>` : '';

    /* The title, the intro line and the framed exercise are IDENTICAL on all
       four guided screens (deck slides 12-15 repeat them verbatim) — only the
       callout advances. So only the FIRST guided screen reveals them; on 5-7
       they are simply present, and the callout is the only thing that animates
       in. Advancing 4→7 then reads as one screen whose callout changes
       (producer, 10.09.26) instead of the whole layout re-appearing. */
    const first = cfg.screen === GUIDED[0].screen;
    const rv = (n) => (first ? ` data-reveal="${n}"` : '');

    sec.innerHTML = `
      <h1 class="g-title g-title--center"${rv(1)}>${G_TITLE}</h1>
      <p class="g-intro"${rv(1)}>${G_INTRO}</p>
      <div class="g-layout g-layout--low">
        <div class="g-right"${rv(2)}>
          <div class="g-frame">
            <div class="g-story">${G_EXERCISE}</div>
            <div class="g-qline">${G_ASK}</div>
          </div>
        </div>
        <aside class="g-callout" data-reveal="${first ? 3 : 1}" aria-label="تعليمات المرحلة">
          ${GC_BULB}
          <div class="gc-text">${cfg.card}</div>
          ${cfg.cardQ ? `<div class="gc-q">${cfg.cardQ}</div>` : ''}
          ${opts}
        </aside>
      </div>
      ${cfg.q
        ? `<button class="btn-continue" id="g${cfg.screen}-check" disabled onclick="goTo(${cfg.screen + 1})">متابعة</button>`
        : `<button class="btn-continue" onclick="goTo(${cfg.screen + 1})">متابعة</button>`}
      <button class="btn-back" onclick="goTo(${cfg.screen - 1})">عودة</button>`;
    app.insertBefore(sec, backRef);
  });
}

/* How this callout works (producer, 10.09.26 — this REPLACES the two-step
   flow the approved proportion-02-01 screen uses): the answer reveals on the
   click itself, there is no צדקתי step, and a wrong pick gets NO ✗ — only the
   correct option is marked. The learner's own pick keeps the lavender wash
   (.chosen) so they can still see what they answered, and the bar button
   unlocks as שנמשיך?. */
function guidedAnswer(screen, el) {
  const st = guidedState[screen];
  if (st.done) return;
  st.done = true;
  st.selected = Number(el.dataset.idx);
  const cfg = GUIDED.find(g => g.screen === screen);
  document.querySelectorAll(`#g${screen} .gc-opt`).forEach(o => {
    const idx = Number(o.dataset.idx);
    o.classList.add('locked');
    o.classList.remove('selected');
    o.setAttribute('aria-checked', o === el ? 'true' : 'false');
    if (idx === cfg.q.correct) o.classList.add('correct');
    else if (idx === st.selected) o.classList.add('chosen');
  });
  document.getElementById(`g${screen}-check`).disabled = false;
  /* Platform layer (70-platform.js): report the pick (provisional fictive result) and persist it
     — after the last commitment above. Guarded: the screens run without the layer. */
  if (typeof onGuidedAnswered === 'function') {
    try { onGuidedAnswered(screen, el); } catch (e) { console.error('[xAPI] onGuidedAnswered', e); }
  }
}

document.addEventListener('DOMContentLoaded', buildGuidedScreens);

/* =====================================================================
   Screen 11 — deck slide 21 · the city-map hub
   The note defines the behaviour: המשך unlocks only once every question in
   every zone is answered; finishing a zone returns you to the map; hovering a
   marker raises a short bubble; each marker needs its own hover state.

   Routing is the note's, cross-checked against the numbers printed on the
   artwork itself: marker 4 = יוצרי התוכן → Q1, marker 3 = בית הספר → Q2/Q3/Q4,
   marker 2 = ההורים → Q5, marker 1 = ערב להקות צעירות → Q6.
   FLAG-PRODUCER: the slide's ALT TEXT numbers these the other way round
   (it calls the studio "1"); the artwork and the routing note agree with each
   other, so the alt text is the odd one out.
   ===================================================================== */

const MAP_ZONES = [
  { id: 4, entry: 12, screens: [13],             x: 22.84, y: 13.38, side: 'left-up',
    text: `لسمر وعماد عدد كبير من المتابعين.<br> وهما يخططان لدعوة مئات المتابعات والمتابعين للمساعدة في عمليات البحث‎.` },
  { id: 3, entry: 14, screens: [15, 16, 17, 18], x: 44.62, y: 36.77, side: 'left-down',
    text: `سوسن، معلمة الرياضيات ومركّزة المتطوعين، منشغلة الآن بإعداد المهمة التالية.<br>ستتفرغ فورًا لمساعدتكم في إيجاد متطوعات ومتطوعين‎.` },
  { id: 2, entry: 19, screens: [20, 21, 22],     x: 66.20, y: 28.28, side: 'down',
    text: `والداكم يرتبان المصروفات.<br>ساعدوهما لكي يتفرغا وينضما إلينا‎.` },
  { id: 1, entry: 23, screens: [24, 25, 26],     x: 95.88, y: 28.15, side: 'down-left',
    text: `يجب على مجلس الشبيبة الانتهاء من إعداد قائمة الفِرق الغنائية.<br>عندها فقط، سيتمكن أعضاء الفِرق من الانضمام إلى عملية الإنقاذ‎.` },
];

/* `const quizState` at a classic script's top level is a global LEXICAL binding,
   not a property of window — `window.quizState` is undefined, so guarding on it
   made every zone read as unfinished and the hub's המשך could never open. */
const zoneDone = (z) =>
  typeof quizState !== 'undefined' && z.screens.every(n => quizState[n] && quizState[n].done);

function buildMapScreen() {
  if (!inPart(11)) return;
  const sec = document.createElement('section');
  sec.className = 'screen map-screen';
  sec.dataset.screen = '11';
  sec.id = 's11';
  sec.innerHTML = `
    <h1 class="map-title" data-reveal="1">قصتنا مستمرة... هل سنتمكن من إنقاذ جزء من بيض السلاحف؟</h1>
    <div class="map-intro" data-reveal="1">
      <p>من المؤكد أننا سنتمكن من العثور على جزء من البيض الذي تفرّق، لكننا نحتاج إلى متطوعات ومتطوعين للقيام بذلك‎.</p>
      <p>لكن... يبدو أن الجميع منشغلون بشيء ما‎.</p>
      <p><strong>اضغطوا على الأرقام للتنقل بين جميع المواقع. ساعدوا الأشخاص في حل المشكلة ليتمكنوا من التطوع معنا لإنقاذ بيض السلاحف‎!</strong></p>
    </div>
    <div class="map-wrap" data-reveal="2">
      <img class="map-img" src="assets/img/map-main_AR.jpg"
           alt="خريطة مدينة مرسومة من لقطة جوية، تظهر فيها أربعة مواقع مرقمة من 1 إلى 4: صانعو المحتوى، المدرسة، الوالدان وأمسية فِرق شبيبة‎.">
      ${MAP_ZONES.map(z => `
        <button class="map-pin map-pin--${z.side}" type="button" id="map-pin-${z.id}"
                style="right: ${100 - z.x}%; top: ${z.y}%;"
                aria-label="الموقع ${z.id}" aria-expanded="false" onclick="mapEnter(${z.id})">
          <span class="map-pin-dot" aria-hidden="true"></span>
          <span class="map-bubble">${z.text}</span>
        </button>`).join('')}
    </div>
    <button class="btn-continue" id="s11-continue" disabled onclick="goTo(27)">متابعة</button>
    <button class="btn-back" onclick="goTo(10)">عودة</button>`;
  document.getElementById('app').insertBefore(sec, document.getElementById('quiz-hint-overlay'));
}

/* A SINGLE click enters the zone (producer, 10.09.26). The bubble is a
   hover/focus affordance only — it used to need a first click to open and a
   second to enter, which read as a dead click. Touch devices still get the
   bubble on the tap's synthetic hover before the navigation. */
function mapEnter(id) {
  const z = MAP_ZONES.find(v => v.id === id);
  if (!z) return;
  mapCloseBubbles();
  goTo(z.entry);
}

function mapCloseBubbles() {
  document.querySelectorAll('.map-pin.is-open').forEach(p => {
    p.classList.remove('is-open');
    p.setAttribute('aria-expanded', 'false');
  });
}

/* clicking the map itself (or pressing Escape) dismisses an open bubble */
document.addEventListener('click', (e) => {
  if (!e.target.closest('.map-pin')) mapCloseBubbles();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') mapCloseBubbles();
});

/* repaint the hub every time it is shown — zones the learner has finished are
   marked done, and המשך opens only when all four are */
function mapRefresh() {
  mapCloseBubbles();
  let all = true;
  MAP_ZONES.forEach(z => {
    const done = zoneDone(z);
    if (!done) all = false;
    const pin = document.getElementById(`map-pin-${z.id}`);
    if (pin) {
      pin.classList.toggle('is-done', done);
      pin.setAttribute('aria-label', `الموقع ${z.id}${done ? ' — مكتمل' : ''}`);
    }
  });
  const btn = document.getElementById('s11-continue');
  if (btn) btn.disabled = !all;
}

document.addEventListener('DOMContentLoaded', buildMapScreen);
