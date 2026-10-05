/* =====================================================================
   Unit content — question configs consumed by 720-core/quiz-engine.js.
   Source: methodica-math-percent-08 (goal 4.8), text verbatim from the
   script; layout per each slide's production notes.
   ===================================================================== */

'use strict';

/* Figma bubble shapes (551:12741 / 551:12742) — vendored verbatim from the
   approved proportion-2-1 build (maven-skills §8i). */
function bubblePathBottom(w, h) {
  const r = 10, i = 1, cx = w / 2, td = 15.3, tw = 17;
  return `M ${i + r} ${i} H ${w - i - r} A ${r} ${r} 0 0 1 ${w - i} ${i + r}` +
    ` V ${h - i - r} A ${r} ${r} 0 0 1 ${w - i - r} ${h - i}` +
    ` H ${cx + tw} L ${cx} ${h - i + td} L ${cx - tw} ${h - i}` +
    ` H ${i + r} A ${r} ${r} 0 0 1 ${i} ${h - i - r}` +
    ` V ${i + r} A ${r} ${r} 0 0 1 ${i + r} ${i} Z`;
}
function bubblePathSideLeft(w, h) {
  const r = 8.5, i = 1, cy = h / 2, td = 17.6, th = 11.3;
  return `M ${i + r} ${i} H ${w - i - r} A ${r} ${r} 0 0 1 ${w - i} ${i + r}` +
    ` V ${h - i - r} A ${r} ${r} 0 0 1 ${w - i - r} ${h - i}` +
    ` H ${i + r} A ${r} ${r} 0 0 1 ${i} ${h - i - r}` +
    ` V ${cy + th} L ${i - td} ${cy} L ${i} ${cy - th}` +
    ` V ${i + r} A ${r} ${r} 0 0 1 ${i + r} ${i} Z`;
}
/* 09.09 — the shell used to be drawn ONCE and never redrawn, so a bubble that
   changed size after first paint (a video sibling settling, a webfont landing)
   kept a stale shell: dev slide 35's 171x51 bubble was wearing a shell from a
   different layout pass and read as an empty purple arc. Redraw on a size key,
   watch for resizes, and redraw once fonts are ready. */
/* mirror of bubblePathSideLeft: notch on the RIGHT edge, so the bubble can sit
   to the LEFT of the character and point at it (producer 14.09.26). */
function bubblePathSideRight(w, h) {
  const r = 8.5, i = 1, cy = h / 2, td = 17.6, th = 11.3;
  return `M ${i + r} ${i} H ${w - i - r} A ${r} ${r} 0 0 1 ${w - i} ${i + r}` +
    ` V ${cy - th} L ${w - i + td} ${cy} L ${w - i} ${cy + th}` +
    ` V ${h - i - r} A ${r} ${r} 0 0 1 ${w - i - r} ${h - i}` +
    ` H ${i + r} A ${r} ${r} 0 0 1 ${i} ${h - i - r}` +
    ` V ${i + r} A ${r} ${r} 0 0 1 ${i + r} ${i} Z`;
}

function decorateBubbles(scope) {
  (scope || document).querySelectorAll('.speech-bubble').forEach(b => {
    const w = b.offsetWidth, h = b.offsetHeight;
    if (!w || !h) return;
    const key = w + 'x' + h;
    if (b.dataset.bubbleSize === key) return;
    b.dataset.bubbleSize = key;
    const stale = b.querySelector('.bubble-shape');
    if (stale) stale.remove();
    if (!b.dataset.bubbleWatched) {
      b.dataset.bubbleWatched = '1';
      if (window.ResizeObserver) {
        new ResizeObserver(() => decorateBubbles(b.parentElement || b)).observe(b);
      }
    }
    let svg;
    if (b.classList.contains('side-bubble--right')) {
      const td = 18;
      svg = `<svg class="bubble-shape" style="left:0;top:0;width:${w + td}px;height:${h}px" ` +
        `viewBox="0 0 ${w + td} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
        `<path d="${bubblePathSideRight(w, h)}" fill="white" stroke-width="2" stroke-linejoin="round"/></svg>`;
    } else if (b.classList.contains('side-bubble')) {
      const td = 18;
      svg = `<svg class="bubble-shape" style="left:${-td}px;top:0;width:${w + td}px;height:${h}px" ` +
        `viewBox="${-td} 0 ${w + td} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
        `<path d="${bubblePathSideLeft(w, h)}" fill="white" stroke-width="2" stroke-linejoin="round"/></svg>`;
    } else {
      const td = 17;
      svg = `<svg class="bubble-shape" style="left:0;top:0;width:${w}px;height:${h + td}px" ` +
        `viewBox="0 0 ${w} ${h + td}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
        `<path d="${bubblePathBottom(w, h)}" fill="white" stroke-width="2" stroke-linejoin="round"/></svg>`;
    }
    b.insertAdjacentHTML('afterbegin', svg);
  });
}

/* Deck slide 5's applet. The producer supplied it as a finished standalone
   page on 15.09.26 (followers-widget.html) — it is embedded AS GIVEN through
   the unit's own applet iframe, and driven through the widget's own API
   (?followers= / ?stage= / ?step=, and the `followers-widget:state` message it
   posts back). The hand-built .fa-card that used to live here is gone. */
const FOLLOWERS_APPLET = appletEmbed(
  'assets/applets/followers-widget.html?followers=10000&step=5',
  'تطبيق المتابعين — قناة "لحظة مشارَكة"');

/* The approved feedback titles. Deck slide 5 carries NO feedback shapes at all;
   producer standing rule — "we use the template we have and its feedbacks" — so
   these are the titles the approved units ship, and the body is left empty
   rather than invented. FLAG-PRODUCER if wording is wanted. */
const FB_WRONG_TITLE = 'هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب"';
const FB_STD = {
  correct: { title: 'صحيح جدًا‎!', body: '' },
  wrong:   { title: FB_WRONG_TITLE, body: '' },
  retry:   'الإجابة غير دقيقة، هل نحاول مرة أخرى؟',
};

const QUESTIONS = [
  {
    screen: 1,
    type: 'single',
    label: '',
    stem: `لقناة عماد 10,000 متابع.<br> في شهر يناير نشر فيديو عن التطوع في دار للمسنين، فارتفع عدد المتابعين بنسبة %20!<br> في الشهر التالي انخفض عدد المتابعين بنسبة %20.<br> <span class="q-ask">ماذا يمكن القول عن عدد المتابعين في نهاية الشهر الثاني، مقارنةً مع الـ 10,000 الأصليين؟</span>
      <div class="fa-steps">افحصوا فرضيتكم:<br> <strong>زيدوا عدد المتابعين بنسبة %20 واضغطوا على القفل لتثبيت عدد المتابعين الجديد.<br> الآن قلِّلوا عدد المتابعين بنسبة %20.<br> ما الإجابة؟</strong>
      </div>`,
    content: FOLLOWERS_APPLET,
    options: [
      { id: 'a', html: 'عاد العدد إلى 10,000 بالضبط' },
      { id: 'b', html: 'يوجد أقل من ‎10,000' },
      { id: 'c', html: 'يوجد أكثر من ‎10,000' },
    ],
    correct: 'b',
    maxAttempts: 2,
    fb: FB_STD,
  },
];

/* ── shared bits for component 02 ─────────────────────────────────────── */
const eq = (t) => `<span class="eq-ltr">${t}</span>`;
const eqc = (t) => `<p class="fb-eq">${eq(t)}</p>`;

/* the proportion table the deck embeds inside several feedback panels.
   `a:tblPr` carries no rtl, so grid col 0 is the LEFTMOST (אחוז); an RTL HTML
   table renders its FIRST cell rightmost, so the columns are emitted reversed. */
const propTable = (num, whole) => `
<table class="data-table fb-table">
  <thead><tr><th>العدد</th><th>النسبة المئوية</th></tr></thead>
  <tbody>
    <tr><td>${num}</td><td>${eq('x')}</td></tr>
    <tr><td>${whole}</td><td>100%</td></tr>
  </tbody>
</table>`;

/* stacked fraction. Defined here (questions.js loads first) so unit.js can
   reuse it — two `const frac` in classic scripts would collide. */
const frac = (top, bottom) =>
  `<span class="fraction"><span class="frac-top">${top}</span><span class="frac-bottom">${bottom}</span></span>`;

/* ── feedback bodies, verbatim from the deck's own panels ───────────────
   Both the green and the red panel carry the SAME body in this deck; only
   the title differs, and the red title is the approved one, not the deck's. */

const S13_BODY = `
<p>عماد مخطئ.</p>
<p>نسبة الـ %15 لشهر يونيو تُحسَب من الـ 1,200 متابع الذين كانوا لديهم في نهاية مايو  (${eq('1,000 · 1.20')})، وليس من الـ 1,000 الأصليين. لذلك: ${eq('1,000 · 1.20 · 1.15 = <span class="eq-unit" dir="rtl">1,380 متابع</span>')}.</p>
<p>مايو: 1,200 متابع (ارتفاع بنسبة %20)</p>
<p>يونيو: 1,380 متابعًا (ارتفاع إضافي بنسبة %15)</p>
<p><strong>الاستنتاج: الارتفاع الإجمالي هو%38، وليس ‎%35!</strong></p>`;

/* FLAG-PRODUCER: the deck's own equation here reads 50 + 150 = 250, but the
   sentence above it says 100 + 150 and the arithmetic needs 100. Built as
   100 + 150 = 250 (docs/OPEN-QUESTIONS.md §B). */
const S15_BODY = `
<p>الإضافتان (100 شيكل ثم 150 شيكل) هما مبلغان ثابتان غير مرتبطين بالمبلغ الحالي، ولذلك يمكن جمعهما‎:</p>
${eqc('100 + 150 = 250')}
<p>لذلك‎:</p>
${eqc('500 + 250 = 750')}
<p>المبلغ النهائي (750 شيكل) يشكّل %150 من 500 شيكل.</p>
${eqc('100% + 50% = 150%')}`;

/* FLAG-PRODUCER: the deck's proportion equation ends on a dangling `=`
   (605/500 = x/100% =). Dropped here. */
const S16_BODY = `
<p>أولًا نحسب المبلغ الجديد‎:</p>
${eqc('500 · 1.1 · 1.1 = 605')}
<p>نبني معادلة تناسُب لمعرفة النسبة التي يشكلها 605 من ‎500:</p>
${propTable('605', '500')}
<p class="fb-eq"><span class="fracpair">${frac('x', '100%')}<span class="eq-op">=</span>${frac('605', '500')}</span></p>
${eqc('5x = 605')}
${eqc('x = 121')}
<p>المبلغ الجديد يشكّل %121 من ‎500.</p>`;

const S17_BODY = `
<p>نريد حساب المبلغ بعد الخصمَين‎:</p>
<p>القسيمة الأولى تمنح خصمًا بنسبة %10، ولذلك نضرب بـ ‎0.9.</p>
<p>القسيمة الثانية تمنح خصمًا بنسبة %20، ولذلك نضرب بـ ‎0.8.</p>
<p>ترتيب الضرب لا يهمّ، ولذلك‎:</p>
${eqc('200 · 0.8 · 0.9 = 144')}
<p>أو</p>
${eqc('200 · 0.9 · 0.8 = 144')}
<p><strong>الاستنتاج: </strong>السعر النهائي هو 144 شيكل.</p>`;

const S18_BODY = `
<p>من المفضل ترتيب كل المعلومات في جدول‎:</p>
<p><strong>يمكن أن نرى في الجدول أن ارتفاع النبتة ب ازداد أكثر بالسنتيمترات</strong>: 12.9 سم مقابل 12 سم‎.</p>
<table class="data-table fb-table fb-table--wide">
  <thead><tr><th></th><th>الارتفاع الابتدائي بالسم</th><th>الارتفاع النهائي بالسم</th><th>التغيُّر في الارتفاع بالسم</th></tr></thead>
  <tbody>
    <tr><td>النبتة أ</td><td>40 سم</td><td>52 ‎سم<br><span class="fb-note">ازداد بـ %30 دفعة واحدة‎.</span></td><td>${eq('52 − 40 = 12')}</td></tr>
    <tr><td>النبتة ب</td><td>40 سم</td><td>52.9 ‎سم<br><span class="fb-note">ازداد بـ %15 ثم %15 إضافية (على مرحلتين)‎.</span></td><td>${eq('52.9 − 40 = 12.9')}</td></tr>
  </tbody>
</table>`;

QUESTIONS.push(
  {
    /* deck slide 23 — Q1. Key = לא (green radio + the feedback's own
       "גיא טועה"; 1,000 · 1.20 · 1.15 = 1,380, i.e. +38%, not +35%). */
    screen: 13,
    type: 'single',
    label: '',
    stem: `ينشر عماد وسمر مقاطع فيديو قصيرة على شبكة تواصل اجتماعي.<br> عدد متابعيهما كان 1,000.<br> في شهر مايو ارتفع عدد المتابعين بنسبة %20، ثم ارتفع في شهر يونيو بنسبة %15 إضافية‎.
      <p>يقول عماد لسمر: "هذا يعني أن عدد متابعينا ارتفع بالمجمل بنسبة %35!"</p>
      <span class="q-ask">هل عماد على صواب؟</span>`,
    content: `
<table class="data-table q-table">
  <thead><tr><th>الشهر</th><th>عد المتابعين الإجمالي</th><th>الإضافة بعدد المتابعين</th><th>نسبة الارتفاع</th></tr></thead>
  <tbody>
    <tr><td>مايو</td><td>1,200</td><td>200</td><td>20%</td></tr>
    <tr><td>يونيو</td><td>1,380</td><td>180</td><td>15%</td></tr>
  </tbody>
</table>`,
    options: [
      { id: 'a', html: 'نعم' },
      { id: 'b', html: 'لا' },
      { id: 'c', html: 'لا يمكن المعرفة' },
    ],
    correct: 'b',
    maxAttempts: 2,
    hint: 'أمعنوا النظر في الجدول واستنتجوا الإجابة عن السؤال.',
    fb: {
      correct: { title: 'صحيح!', body: S13_BODY },
      wrong:   { title: FB_WRONG_TITLE, body: S13_BODY },
      retry:   'الإجابة غير دقيقة، هل نحاول مرة أخرى؟',
    },
  },
  {
    /* deck slide 25 — Q2 part א. Key = 750 and 150, typed into the slide
       (in black, not the usual green — flagged). */
    screen: 15,
    type: 'value-input',
    label: '',
    stem: `مبلغ 500 شيكل في التوفير ازداد بـ 100 شيكل، ثم بـ 150 شيكل إضافية. <span class="q-ask">أ. أكملوا‎:</span>`,
    slotLines: ['ازداد المبلغ إلى {} شيكل‎.', 'المبلغ الجديد يشكّل {%} ‎من الـ 500 ‎شيكل‎.'],
    slotLabel: 'الإجابة',
    correctInputs: ['750', '150'],
    content: `<img class="q-character" data-no-zoom src="assets/img/teacher.png" alt="">`,
    maxAttempts: 2,
    hint: 'ماذا يحدث عندما نجمع زيادتين ثابتتين بالشيكل؟',
    fb: {
      correct: { title: 'صحيح!', body: S15_BODY },
      wrong:   { title: FB_WRONG_TITLE, body: S15_BODY },
      retry:   'الإجابة غير دقيقة، هل نحاول مرة أخرى؟',
    },
  },
  {
    /* deck slide 26 — Q2 part ב. Key = 605 and 121. */
    screen: 16,
    type: 'value-input',
    label: '',
    stem: `مبلغ 500 شيكل في التوفير ازداد بنسبة %10، ثم بنسبة %10 إضافية. <span class="q-ask">ب. أكملوا‎:</span>`,
    slotLines: ['ازداد المبلغ إلى {} شيكل‎.', 'المبلغ الجديد يشكّل {%} ‎من الـ 500 ‎شيكل‎.'],
    slotLabel: 'الإجابة',
    correctInputs: ['605', '121'],
    content: `<img class="q-character" data-no-zoom src="assets/img/teacher.png" alt="">`,
    maxAttempts: 2,
    hint: 'كيف نعبّر عن الزيادة بنسبة %10 بواسطة عملية ضرب؟',
    fb: {
      correct: { title: 'صحيح!', body: S16_BODY },
      wrong:   { title: FB_WRONG_TITLE, body: S16_BODY },
      retry:   'الإجابة غير دقيقة، هل نحاول مرة أخرى؟',
    },
  },
  {
    /* deck slide 27 — Q3. Key = 144 ₪ (200 · 0.9 · 0.8). */
    screen: 17,
    type: 'single',
    label: '',
    stem: `يعرض متجر معيّن قسيمتَيّ خصم يمكن استخدامهما واحدةً تلو الأخرى عند شراء منتج سعره 200 شيكل.<br> القسيمة أ - خصم بنسبة %10.<br> القسيمة ب - خصم إضافي بنسبة %20 من المبلغ المتبقي بعد استخدام القسيمة أ. <span class="q-ask">ما هو السعر النهائي للمنتج؟</span>`,
    content: `<div class="character-widget cw-side">
        <div class="speech-bubble side-bubble side-bubble--right">هل الترتيب يؤثّر في هذه الحالة؟</div>
        <img src="assets/img/woman-shrug.png" alt="">
      </div>`,
    options: [
      { id: 'a', html: '162 ₪' },
      { id: 'b', html: '144 ₪' },
      { id: 'c', html: '190 ₪' },
      { id: 'd', html: '150 ₪' },
    ],
    correct: 'b',
    maxAttempts: 2,
    hint: 'احسبوا مقدار الإضافات إلى المبلغ الأصلي.<br> هل يؤثر ترتيب عملية الضرب؟',
    fb: {
      correct: { title: 'صحيح!', body: S17_BODY },
      wrong:   { title: FB_WRONG_TITLE, body: S17_BODY },
      retry:   'الإجابة غير دقيقة، هل نحاول مرة أخرى؟',
    },
  },
  {
    /* deck slide 28 — Q4. Key = צמח ב' (40·1.15·1.15 = 52.9 vs 40·1.3 = 52). */
    screen: 18,
    type: 'single',
    label: '',
    stem: `تم قياس تأثير سماد جديد على وتيرة نمو نبتتين بدأتا بالنمو من نفس الارتفاع: 40 سم.<br> <strong>النبتة أ</strong> ارتفعت بنسبة %30 دفعة واحدة.<br> <strong>النبتة ب</strong> ارتفعت بنسبة %15، ثم بنسبة %15 إضافية.<br> تمّ ريّ النبتتين بنفس السماد، وبعد أسبوعين تم قياس التغيّر في ارتفاعهما: <span class="q-ask">أيّ نبتة ازداد ارتفاعها أكثر (بالسنتيمترات)؟</span>`,
    content: `<img class="q-character" data-no-zoom src="assets/img/woman-ivy.png" alt="">`,
    options: [
      { id: 'a', html: `ارتفاع النبتة أ ازداد أكثر، لأن %30 دفعة واحدة أكبر من %15% ثم %15 إضافية، حيث تنقسم الزيادة إلى مرحلتين أصغر‎.` },
      { id: 'b', html: `ارتفاع النبتة ب ازداد أكثر، لأن الـ %15 الثانية تُحسب من ارتفاع محدَّث وأكبر، ولذلك تكون الزيادة في المرحلتين معًا أكبر من %30.` },
      { id: 'c', html: `ارتفاع النبتتين ازداد بنفس مقدار السنتيمترات بالضبط، لأن ${eq('15% + 15% = 30%')}.` },
    ],
    correct: 'b',
    maxAttempts: 2,
    hint: `انتبهوا!<br>كيف تحسبون الزيادة الواحدة؟<br>كيف تحسبون زيادة إضافية؟<br>ربما يساعدكم الجدول في ترتيب المعطيات قليلًا؟`,
    fb: {
      correct: { title: 'صحيح جدًا‎!', body: S18_BODY },
      wrong:   { title: FB_WRONG_TITLE, body: S18_BODY },
      retry:   'الإجابة غير دقيقة، هل نحاول مرة أخرى؟',
    },
  },
);

/* ── the bands data table (deck slides 34-36). Grid col 0 is the LEFTMOST
   (מספר הלהקות שנפסלו); an RTL HTML table renders its FIRST cell rightmost,
   so the columns are emitted reversed. Slides 35/36 show it completed and
   read-only — the deck pins it across all three parts. */
const BANDS_TABLE = (r1c0, r2c2, r2c0) => `
<table class="data-table q-table q-table--bands">
  <thead><tr><th>الجولة</th><th>عدد الفِرق في بداية الجولة</th><th>النسبة التي استُبعِدت في كل جولة</th><th>عدد الفِرق التي استُبعِدت</th></tr></thead>
  <tbody>
    <tr><td>الجولة ‎1</td><td>100</td><td>20%</td><td>${r1c0}</td></tr>
    <tr><td>الجولة ‎2</td><td>${r2c2}</td><td>25%</td><td>${r2c0}</td></tr>
  </tbody>
</table>`;

const S20_BODY = `
<p>إذا استخدمنا القسيمة أ أولًا‎:</p>
${eqc('(300 − 50) · 0.9 = 225')}
<p>سعر الشروة النهائي سيكون 225 شيكل.</p>
<p>إذا استخدمنا القسيمة ب أولًا‎:</p>
${eqc('(300 · 0.9) − 50 = 220')}
<p>سعر الشروة النهائي سيكون 220 شيكل.</p>
<p><strong>الاستنتاج: من الأفضل استخدام القسيمة ب أولًا‎.</strong></p>`;

const S21_BODY = `
<p>سعر الثلاجة هو 4,000 شيكل.</p>
<p>أولًا القسيمة أ ثم القسيمة ب‎:</p>
${eqc('(4,000 − 50) · 0.9 = 3,555')}
<p>أولًا القسيمة ب ثم القسيمة أ‎:</p>
${eqc('(4,000 · 0.9) − 50 = 3,550')}`;

const S22_BODY = `
<p>الـ %10 هذه تساوي %10 من 50 شيكل، أي 5 شيكل إضافية‎.</p>
<p>هذا الفارق (5 شيكل) ثابت، ولا يرتبط بسعر الغرض - 300 شيكل أو 4,000 شيكل، يبقى الفارق 5 شيكل.</p>`;

/* FLAG-PRODUCER: the deck's own equations here are wrong twice —
   `100·0.8=20` (100·0.8 is 80; the number rejected is 100·0.2) and
   `80·0.75=60` labelled as the number REJECTED in round 2 (60 is what
   remained; rejected is 80·0.25=20, which is what the answer key says).
   Built corrected — docs/OPEN-QUESTIONS.md §B. */
const S24_BODY = `
<p>نحسب عدد الفِرق التي استُبعِدت في الجولة الأولى بواسطة كسر عشري‎:</p>
${eqc('100 · 0.2 = 20')}
<p>بعد الجولة الأولى بقيت 80 فرقة‎:</p>
${eqc('100 − 20 = 80')}
<p>عدد الفِرق التي استُبعِدت في الجولة الثانية:</p>
${eqc('80 · 0.25 = 20')}
<p><strong>الاستنتاج: بقيت 60 فرقة بعد جولتَيّ التصفية‎.</strong></p>`;

const S25_BODY = `
<p>حنان على صواب.</p>
<p>بقيت 60 فرقة، وهي تشكّل %60 من أصل 100 فرقة حاولت القبول‎.</p>
<p>أي: %40 من الفِرق استُبعِدت‎.</p>`;

const S26_BODY = `
<p>لا، الادّعاء خاطئ‎.</p>
<p>عند ضرب 3 أعداد يمكن تبديل ترتيبها‎.</p>
<p>تعالوا نفحص:</p>
<p>بالترتيب الأصلي‎:</p>
${eqc('100 · 0.8 · 0.75 = 60')}
<p>بالترتيب العكسي‎:</p>
${eqc('100 · 0.75 · 0.8 = 60')}
<p>نفس النتيجة بالضبط‎!</p>`;

QUESTIONS.push(
  {
    /* deck slide 30 — Q5 part א. Key = "קודם קופון ב' ואז את קופון א'"
       (220 < 225). Returns to the map only after part ג. */
    screen: 20, type: 'single', label: '',
    stem: `يوجد للمتجر قسيمتا خصم يمكن استخدامهما واحدةً تلو الأخرى، بحيث تؤثران على مبلغ الشروة النهائي.<br> القسيمة أ - خصم ثابت بقيمة 50 شيكل.<br> القسيمة ب - خصم بنسبة %10.
      <p>يُعِدّ الوالدان قائمة مشتريات بمبلغ 300 شيكل بالمجمل.</p>
      <span class="q-ask">أ. بأي ترتيب من الأوفر لهما استخدام القسيمتين، وكم سيدفعان؟</span>`,
    content: `<img class="q-photo" src="assets/img/coupons-overhead_AR.png" alt="">`,
    options: [
      { id: 'a', html: `أولًا القسيمة أ ثم القسيمة ب‎.` },
      { id: 'b', html: `أولًا القسيمة ب ثم القسيمة أ‎.` },
      { id: 'c', html: `لا يهمّ، السعر النهائي سيكون متساويًا‎.` },
    ],
    correct: 'b', maxAttempts: 2, next: 21,
    hint: 'احسبوا: متى نستخدم خصم الـ 10% على المبلغ الأكبر؟',
    fb: { correct: { title: 'صحيح!', body: S20_BODY }, wrong: { title: FB_WRONG_TITLE, body: S20_BODY }, retry: 'الإجابة غير دقيقة، هل نحاول مرة أخرى؟' },
  },
  {
    /* deck slide 31 — Q5 part ב. Keys 3555 / 3550.
       FLAG-PRODUCER: the note says "שימו לב שאין רמז" but the slide carries a
       full hint button, bulb and popup. The deck's own asset wins; built. */
    screen: 21, type: 'value-input', label: '',
    stem: `هناك قسيمتان يمكن استخدامهما واحدةً تلو الأخرى، بالترتيب الذي نريده:<br> القسيمة أ - خصم ثابت بقيمة 50 شيكل.<br> القسيمة ب - خصم بنسبة %10.
      <p>تقول الوالدة إن هذه فرصة جيدة لاستبدال الثلاجة.<br> سعر الثلاجة في المتجر هو 4,000 شيكل.</p>
      <span class="q-ask">ب. كم سيكون السعر النهائي في كل ترتيب من الاستخدامَين؟</span>`,
    slotLines: [`المسار 1 (أ ثم ب)‎: {}`, `المسار 2 (ب ثم أ)‎: {}`],
    slotLabel: 'السعر النهائي',
    correctInputs: ['3,555', '3,550'],
    altInputs: [['3,555', '3,550']],
    content: `<img class="q-photo" data-no-zoom src="assets/img/fridge-door_AR.jpg" alt="">`,
    maxAttempts: 2, next: 22, prev: 20,
    hint: 'احسبوا: أي قسيمة ستكون قيمتها أكبر بالشيكل عندما يكون السعر مرتفعًا؟',
    fb: { correct: { title: 'صحيح!', body: S21_BODY }, wrong: { title: FB_WRONG_TITLE, body: S21_BODY }, retry: 'الإجابة غير دقيقة، هل نحاول مرة أخرى؟' },
  },
  {
    /* deck slide 32 — Q5 part ג. Key = option 4. Last part of the zone, so it
       routes back to the map hub. */
    screen: 22, type: 'single', label: '',
    stem: `معلوم لنا أن:<br> القسيمة أ - خصم ثابت بقيمة 50 شيكل.<br> القسيمة ب - خصم بنسبة ‎10%.
      <p>القيمة الإجمالية لقائمة المشتريات هي 300 شيكل، وسعر الثلاجة 4,000 شيكل.</p>
      <span class="q-ask">ت. لماذا يكون من الأوفر في الحالتين (300 شيكل و-4,000 شيكل) استخدام القسيمة ب أولًا (%10) ثم القسيمة أ (50 شيكل)؟</span>`,
    /* zoom ON for this one (producer 10.09.26) — the coupons' small print is
       the point of the question. Screens 20/21 stay opted out. */
    content: `<img class="q-photo" src="assets/img/coupons-overhead_AR.png" alt="">`,
    options: [
      { id: 'a', html: 'لأن الخصم بالنسبة المئوية يكون دائمًا أوفر من الخصم بمبلغ ثابت، بغض النظر عن الترتيب‎.' },
      { id: 'b', html: 'لأن الفرق بين الترتيبين يزداد كلما ارتفع السعر‎.' },
      { id: 'c', html: 'لأن 50 شيكل هي مبلغ صغير نسبيًا، ولذلك من الأفضل إبقاؤه للنهاية‎.' },
      { id: 'd', html: 'لأن نسبة الـ %10 تُحسب أولًا من المبلغ الأكبر‎.' },
    ],
    correct: 'd', maxAttempts: 2, next: 11, prev: 21,
    hint: 'هل %10 من 300 شيكل أكبر أم أصغر من %10 من 4,000 شيكل؟ ماذا يعني ذلك بالنسبة لترتيب استخدام القسيمتين؟',
    fb: { correct: { title: 'صحيح!', body: S22_BODY }, wrong: { title: FB_WRONG_TITLE, body: S22_BODY }, retry: 'الإجابة غير دقيقة، هل نحاول مرة أخرى؟' },
  },
  {
    /* deck slide 34 — Q6 part א. Keys 20 / 80 / 20, filled into the table.
       The table stays pinned across parts א/ב/ג, which is what the note's
       "טבלת הנתונים צפה לאורך הסעיפים" asks for without any scrolling. */
    screen: 24, type: 'value-input', label: '',
    stem: `اختار مجلس الطلاب فِرقًا موسيقية لتقديم عرض في جولتَيّ تصفية متتاليتين، من بين 100 فرقة تقدمت للمشاركة‎.
      <p>في الجولة الأولى استُبعدت %20 من الفِرق. وفي الجولة الثانية استُبعدت %25 إضافية من الفِرق المتبقية‎.</p>
      <span class="q-ask">أ. أكملوا الجدول:<br>كم فرقة استُبعِدت في كل جولة، وكم فرقة بقيت في النهاية؟</span>`,
    /* the corrected deck adds a fourth answer UNDER the table — how many
       bands are left at the end (producer, 10.09.26: 100 → 80 → 60). */
    slotHtml: BANDS_TABLE('{}', '{}', '{}') +
      `<p class="q-table-tail">بقيت في النهاية {} فرقة‎.</p>`,
    correctInputs: ['20', '80', '20', '60'],
    slotLabel: 'الإجابة',
    maxAttempts: 2, next: 25,
    hint: 'استعينوا بالضرب بالكسور العشرية لحساب عدد الفِرق التي استُبعِدت‎.',
    fb: { correct: { title: 'صحيح!', body: S24_BODY }, wrong: { title: FB_WRONG_TITLE, body: S24_BODY }, retry: 'الإجابة غير دقيقة، هل نحاول مرة أخرى؟' },
  },
  {
    /* deck slide 35 — Q6 part ב.
       FLAG-PRODUCER — HIGHEST SEVERITY: the deck's green marker sits on
       "יוני צודק: נפסלו בדיוק 40%", but its own feedback panel says
       "חן צודקת" and the maths agrees with Chen (100→80→60 = 40% rejected vs
       Yoni's claimed 45%). Option 3 also credits Yoni with a number he never
       said. Built with the self-consistent reading — Chen — per the standing
       rule for a self-contradicting slide. docs/OPEN-QUESTIONS.md §A1. */
    screen: 25, type: 'single', label: '',
    stem: `قال ماهر من مجلس الطلاب‎:
      <p>‎"‎في الجولة الأولى استُبعِدت %20 من الفِرق، وفي الجولة الثانية استُبعِدت %25 إضافية - بالمجمل استُبعِدت %45 من الفِرق‎!".</p>
      <p>حنان لم توافقه الرأي وقالت: "هذا غير دقيق، فقد استُبعِدت أقل من %45،<br>لأن الجولة الثانية تُحسب من عدد الفِرق التي بقيت‎".</p>
      <span class="q-ask">ب. أيّهما كان على صواب؟</span>`,
    content: BANDS_TABLE('20', '80', '20'),
    options: [
      { id: 'a', html: 'لا يمكن المعرفة دون حساب كل جولة على حدة‎.' },
      { id: 'b', html: 'حنان على صواب: استُبعِدت أقل من %45، لأن الجولة الثانية حُسبت من كمية أصغر‎.' },
      { id: 'c', html: 'ماهر على صواب: استُبعِدت %40 بالضبط‎.' },
      { id: 'd', html: 'كلاهما مخطئان: استُبعِدت أكثر من %45، لأن كل جولة تضيف فِرقًا أخرى إلى الفِرق المستبعدة‎.' },
    ],
    correct: 'b', maxAttempts: 2, next: 26, prev: 24,
    hint: 'استعينوا بمعطيات الجدول الذي أكملتموه في البند السابق‎.',
    fb: { correct: { title: 'صحيح!', body: S25_BODY }, wrong: { title: FB_WRONG_TITLE, body: S25_BODY }, retry: 'الإجابة غير دقيقة، هل نحاول مرة أخرى؟' },
  },
  {
    /* deck slide 36 — Q6 part ג. Key = "לא" (0.8·0.75 = 0.75·0.8).
       Last part of the zone, so it routes back to the map hub. */
    screen: 26, type: 'single', label: '',
    stem: `ادّعى أحد أعضاء المجلس‎ ما يلي:
      <p>‎"‎إذا عكسنا ترتيب جولتَيّ الاستبعاد (أي نستبعد أولًا %25 ثم %20)، ستكون النتيجة مختلفة بالتأكيد، وستبقى أقل من 60 فرقة‎".</p>
      <span class="q-ask">ت. هل الادّعاء صحيح؟</span>`,
    content: BANDS_TABLE('20', '80', '20'),
    options: [
      { id: 'a', html: 'نعم، ستكون النتيجة مختلفة: الترتيب يؤثر دائمًا على النتيجة النهائية‎.' },
      { id: 'b', html: 'لا، ستبقى النتيجة كما هي، ويمكن تبديل ترتيب عمليات الضرب‎.' },
      { id: 'c', html: 'نعم، لأنه في الترتيب المعكوس، يتم استبعاد فِرق أكثر في الجولة الأولى.' },
      { id: 'd', html: 'لا يمكن المعرفة بدون حساب كل ترتيب على حدة.' },
    ],
    correct: 'b', maxAttempts: 2, next: 11, prev: 25,
    hint: 'هل يهمّ ترتيب عمليات الضرب في هذه الحالة؟<br> إذا كان الجواب نعم، لماذا؟',
    fb: { correct: { title: 'صحيح!', body: S26_BODY }, wrong: { title: FB_WRONG_TITLE, body: S26_BODY }, retry: 'الإجابة غير دقيقة، هل نحاول مرة أخرى؟' },
  },
);

/* zone routing — Q1 and Q4 are the last question of their zone */
QUESTIONS.find(q => q.screen === 13).next = 11;
QUESTIONS.find(q => q.screen === 18).next = 11;

/* ══ Component 03 (cont.) + component 04 — deck slides 40-60 ══════════════ */

/* the hatchery results table. Grid col 0 is the LEFTMOST (כמות הבקיעות);
   an RTL HTML table renders its FIRST cell rightmost, so columns are reversed.
   Deck slides 54 (fillable), 56 and 59 (completed, read-only). */
const HATCH_TABLE = (r1, r2) => `
<table class="data-table q-table q-table--hatch">
  <thead><tr><th>مزرعة التفريخ</th><th>عدد البيض الذي نُقل</th><th>نسبة الفقس الناجح</th><th>عدد حالات الفقس الناجح</th></tr></thead>
  <tbody>
    <tr><td>المزرعة أ</td><td>300</td><td>82%</td><td>${r1}</td></tr>
    <tr><td>المزرعة ب</td><td>250</td><td>86%</td><td>${r2}</td></tr>
  </tbody>
</table>`;

/* deck slide 47's two-row completion table; the ₪ lives inside the cell and the
   input sits to its left, so the cell is built as `[input] ₪`. */
const COUPON_TABLE = (r1, r2) => `
<table class="data-table q-table q-table--coupon">
  <thead><tr><th>القسيمة</th><th>سعر الشروة النهائي</th></tr></thead>
  <tbody>
    <tr><td>القسيمة أ أولًا</td><td>${r1} ₪</td></tr>
    <tr><td>القسيمة ب أولًا</td><td>${r2} ₪</td></tr>
  </tbody>
</table>`;

const S29_BODY = `
<p>البند أ - ارتفاع بكمية ثابتة‎:</p>
${eqc('50 + 5 + 5 = 60')}
<p>البند ب - ارتفاع بنسبة مئوية‎:</p>
${eqc('50 · 1.1 · 1.1 = 60.5')}
<p>في هذه الحالة، أدى <strong>الارتفاع بالنسبة المئوية</strong> إلى غلاء أكبر في سعر اللعبة‎.</p>`;

/* FLAG-PRODUCER: the deck's equation reads `300·1.2·0.8=240` on a 250 ₪ share
   (300·1.2·0.8 = 288). 250 is what the stem and the key both require. */
const S30_BODY = `
<p>لحساب الارتفاع بنسبة %20 نضرب بـ ‎1.2.</p>
<p>لحساب الانخفاض بنسبة %20 نضرب بـ ‎0.8.</p>
${eqc('250 · 1.2 · 0.8 = 240')}
<p><strong>الاستنتاج: لم يعد السهم إلى قيمته الأصلية 250 شيكل.</strong></p>
<p><strong>بما أن الانخفاض كان من مبلغ أكبر من الأصلي، فإن مقدار الانخفاض أيضًا كان أكبر من الارتفاع الأصلي‎.</strong></p>
<p><strong>لذلك يكون المبلغ النهائي أقل‎.</strong></p>`;

const S31_BODY = `
<p>نحسب المبلغ الذي حصل عليه ساهر بعد الزيادتَين:</p>
${eqc('60 · 1.2 · 1.05 = 75.6')}
<p>يتلقى ساهر 75.6 شيكل مصروفًا شهريًا‎.</p>
<p>نحسب نسبة التغيُّر مقارنةً بالمبلغ الأصلي بواسطة جدول التناسب‎:</p>
${propTable('75.6', '60')}
<p class="fb-eq"><span class="fracpair">${frac('x', '100')}<span class="eq-op">=</span>${frac('75.6', '60')}</span></p>
${eqc('6x = 756')}
${eqc('x = 126')}
<p>المبلغ الجديد يشكّل %126 من المبلغ الأصلي، أي زيادة بنسبة %26 وليس %25.</p>`;

const ITAI_TABLE = (a, b) => `
<table class="data-table q-table">
  <thead><tr><th>اللاعب</th><th>عدد المباريات التي لعبها</th><th>نسبة الفوز</th><th>عدد مباريات الفوز</th></tr></thead>
  <tbody>
    <tr><td>أمجد</td><td>10</td><td>60%</td><td>${a}</td></tr>
    <tr><td>علاء</td><td>100</td><td>40%</td><td>${b}</td></tr>
  </tbody>
</table>`;

const S32_BODY = `
<p>للإجابة عن السؤال، يمكن ترتيب المعطيات في جدول‎:</p>
${ITAI_TABLE('6', '40')}
<p>يمكن أن نستنتج من الجدول أن أمجد مخطئ، فعلى الرغم من أن نسبة فوزه مرتفعة (%60)، إلا أن عدد المباريات التي لعبها ("الكل") أصغر - 10 مباريات فقط‎.</p>
<p>في المقابل، نسبة فوز علاء أقل فعلًا (%40)، لكنه لعب عددًا أكبر من المباريات (100 مباراة)‎.</p>
<p><strong>الاستنتاج: فاز علاء في عدد أكبر من المباريات - 40 مقابل ‎6.</strong></p>`;

const S33_BODY = `
<p>إذا أخرجنا %10 من 300 بنّورة، يبقى %90، وإذا أخرجنا %10 مرة أخرى، يبقى %90 من الكمية الجديدة. لذلك‎:</p>
${eqc('300 · 0.9 · 0.9 = 243')}
<p>بقيت 243 بنّورة بعد الإخراج‎ مرتَين.</p>
<p><strong>حساب النسبة الناقصة‎:</strong></p>
<p>نستخدم جدول التناسب لحساب النسبة المتبقية من الـ ‎300:</p>
${propTable('243', '300')}
<p class="fb-eq"><span class="fracpair">${frac('x', '100')}<span class="eq-op">=</span>${frac('243', '300')}</span></p>
${eqc('3x = 243')}
${eqc('x = 81')}
<p>بقي %81 من أصل 300 بنّورة‎.</p>`;

const S34_BODY = `
<p>نفحص إخراج %10 مرتين متتاليتين من كمية نرمز إليها بـ a.</p>
<p class="fb-eq">نحصل على &nbsp;${eq('0.9 · 0.9 · a = 0.81a')}</p>
<p>ولذلك، الكمية الجديدة تشكّل %81 من الكمية الأصلية (وليس %80 من الكمية الأصلية).</p>`;

/* 24.09, client QA: this body is their wording, replacing the two worked
   calculations that used to stand here. FLAG-PRODUCER: the line is about the
   commutativity of multiplication, which reads closer to screen 38's question
   ("does the order matter at any price?") than to this one, which asks for the
   two final prices. Applied as instructed; say the word to restore the
   calculations or move the line to 38. */
const S36_BODY = `
<p>عند ضرب 3 أعداد يمكن تبديل ترتيبها‎.</p>`;

const S37_BODY = `
<p><strong>اقتراح نسرين أوفر:</strong></p>
<p><strong>السعر النهائي 290 شيكل، مقابل 297.5 شيكل بحسب اقتراح تامر.</strong></p>
<p>نسبة الـ %15 لدى نسرين تُحسَب من المبلغ الكامل (400 شيكل) قبل خصم مبلغ الـ 50 شيكل الثابت‎.</p>
<p>وهذا يؤدي إلى خصم أولي بقيمة 60 شيكل.</p>
<p>في حالة تامر، يسري الخصم بنسبة %15 على 350 شيكل، أي إن قيمة التخفيض هي 52.5 شيكل فقط.</p>`;

const S38_BODY = `
<p>اقتراح نسرين (ب ثم أ) أوفر دائمًا، مهما كان السعر، لأن نسبة الـ %15 لديها تُحسَب دائمًا من المبلغ الأكبر، قبل خصم الـ‎50 ‎شيكل‎.</p>
<p>مع ذلك، سنحسب للتوضيح‎:</p>
<p><strong>القسيمة أ</strong> أولًا‎:</p>
${eqc('(5,000 − 50) · 0.85 = 4,207.5')}
<p><strong>القسيمة ب</strong> أولًا‎:</p>
${eqc('(5,000 · 0.85) − 50 = 4,200')}
<p>يبقى الفارق 7.5 شيكل بالضبط، كما كان عند السعر الابتدائي ‎400 شيكل.</p>`;

const S39_BODY = `
<p>تعالوا نحسب ونرى‎:</p>
${eqc('6,000 · 1.2 · 1.2 = 8,640')}
<p>إذا فصلنا بين السنتَين، نرى أن الارتفاع في السنة الثانية لم يُحسب من الـ 6,000 زائر الأصليين، بل من 7,200 زائر‎.</p>
<p>بما أن العدد الإجمالي ارتفع، فقد ازدادت أيضًا قيمة الارتفاع الإضافي بنسبة %20.</p>
<p>لحساب نسبة الارتفاع نستخدم جدول التناسب‎:</p>
${propTable('8,640', '6,000')}
<p class="fb-eq"><span class="fracpair">${frac('x', '100')}<span class="eq-op">=</span>${frac('8,640', '6,000')}</span></p>
${eqc('60x = 8,640')}
${eqc('x = 144')}
<p>المجموع الجديد يشكّل %144 من العدد الأصلي، أي ارتفاع بنسبة %44 خلال سنتين‎.</p>`;

const S42_BODY = `
<p>المزرعة أ – نحسب كم تساوي %82 من ‎300:</p>
${eqc('0.82 · 300 = 246')}
<p>المزرعة ب – نحسب كم تساوي %86 من ‎250:</p>
${eqc('0.86 · 250 = 215')}`;

const S44_BODY = `
<p><strong>نسبة الفقس كانت أعلى في المزرعة ب، ولذلك فهي أكثر أمانًا للتفريخ‎.</strong></p>
<p>المزرعة أ - %82</p>
<p>المزرعة ب - %86</p>
<p>هذا يعني أنه كلما ارتفع عدد البيض الذي يتم تفريخه، كان عدد حالات الفقس الناجح في المزرعة ب أعلى من المزرعة أ‎.</p>
<p>على سبيل المثال: إذا قمنا بتفريخ 1,000 بيضة، ستفقس في المزرعة ب 860 منها، بينما ستفقس في المزرعة أ 820 فقط‎.</p>`;

const S45_BODY = `
<p>أولًا، نحسب مخزون البيض الجديد في المزرعة ب‎:</p>
${eqc('1,200 · 1.2 · 1.1 = 1,584')}
<p>الآن نحسب نسبة التغيُّر مقارنةً بالكمية الأصلية بواسطة جدول التناسب‎.</p>
${propTable('1,584', '1,200')}
<p class="fb-eq"><span class="fracpair">${frac('x', '100')}<span class="eq-op">=</span>${frac('1,584', '1,200')}</span></p>
${eqc('12x = 1,584')}
${eqc('x = 132')}
<p>الكمية الجديدة هي %132 من الكمية الأصلية، أي ارتفاع بنسبة %32 في بيض السلاحف مقارنةً بالشحنة الأولى‎.</p>`;

const S47_BODY = `
<p><strong>الادّعاء 1 - غير صحيح: </strong>المرحلتان هما ضرب بنسب مئوية، ولذلك الترتيب لا يهمّ.</p>
<p><strong>الادعاء 2 - غير صحيح: </strong>نسبة الفقس الناجح في المزرعة ب هي %86. لا علاقة لذلك بعدد البيض والشحنات التي وصلت إليها‎.</p>
<p><strong>الادعاء 3 - صحيح: </strong>نفس كمية البيض، لكن المزرعة أ (%82) تنتج حالات فقس أقل من المزرعة ب (%86) - وهذا عمليًا سبب اختيار نقل البيض إلى المزرعة ب‎.</p>
<p><strong>الادعاء 4 - صحيح: </strong>الانخفاض بنسبة %32 يُحسَب من الأساس الأكبر (1,584)، وليس من 1,200، ولذلك تكون النتيجة أقل من الـ 1,200 الأصلية‎.</p>`;

const FB = (title, body) => ({
  correct: { title, body },
  wrong:   { title: FB_WRONG_TITLE, body },
  retry:   'الإجابة غير دقيقة، هل نحاول مرة أخرى؟',
});

QUESTIONS.push(
  { /* deck slide 40 — toy price: +5₪+5₪ vs +10%+10%. Keys 60 / 60.5.
       Slide 39's copy and this slide's note both say the hint shows from the
       start in basic practice, which is the engine's default. */
    step: { group: 'basic', index: 1, total: 5 },
    hintPolicy: 'always',
    screen: 29, type: 'value-input', label: '',
    stem: `سعر لعبة هو 50 شيكل. <span class="q-ask">احسبوا السعر النهائي في كل بند وفقًا للعمليات الواردة فيه‎.</span>`,
    slotLines: ['أ. زيدوا السعر بـ 5 شيكل، ثم بـ 5 شيكل إضافية‎: {}', 'ب. زيدوا السعر بنسبة %10، ثم بنسبة %10 إضافية‎: {}'],
    slotLabel: 'السعر النهائي',
    correctInputs: ['60', '60.5'],
    maxAttempts: 2, next: 30, prev: 28,
    hint: 'تذكّروا: %10 من السعر المحدَّث تختلف عن 10% من السعر الأصلي‎.',
    fb: FB('صحيح!', S29_BODY),
  },
  { /* deck slide 41 — ValueInputQuestion combined with a dropdown.
       Keys: 240 and לא (250 · 1.2 · 0.8 = 240 ≠ 250).
       FLAG-PRODUCER: the deck paints the SCENARIO purple-bold and leaves the
       questions black — the reverse of every sibling slide. Built as the deck. */
    step: { group: 'basic', index: 2, total: 5 },
    screen: 30, type: 'value-input', label: '',
    stem: `<span class="q-ask">تمّ تداوُل سهم في البورصة بسعر 250 شيكل للسهم.<br>أكملوا‎:</span>
      <p>يوم الثلاثاء ارتفع سعر السهم بنسبة %20.<br>يوم الأربعاء انخفض بنسبة %20.</p>`,
    slotLines: ['ما قيمة السهم الجديدة؟ {}', 'هل عاد السهم إلى قيمته الأصلية 250 شيكل؟ {?نعم|لا}'],
    slotLabel: 'القيمة الجديدة',
    correctInputs: ['240', 'لا'],
    maxAttempts: 2, next: 31, prev: 29,
    hintPolicy: 'always',   /* producer 15.09.26 — hint from the start */
    hint: 'عند حساب الارتفاع، يجب الضرب بكسر عشري أكبر من %100، وعند حساب الانخفاض يجب الضرب بكسر عشري أصغر من %100.',
    fb: FB('صحيح!', S30_BODY),
  },
  { /* deck slide 42 — pocket money +20% then +5%. Key = option 4 (+26%). */
    step: { group: 'basic', index: 3, total: 5 },
    screen: 31, type: 'single', label: '',
    stem: `يتلقى ساهر 60 شيكل مصروفًا شهريًا.<br> زادَ له والداه المصروف بنسبة %20 في بداية الصف السابع، ثم بنسبة %5 إضافية في بداية الصف الثامن.<br> ما قيمة المصروف الشهري الذي يتلقاه ساهر في الصف الثامن؟ <span class="q-ask">هل حصل بالمجمل على زيادة بنسبة %25؟</span>`,
    content: `<img class="q-photo" src="assets/img/siblings-savings_AR.jpg" alt="">`,
    options: [
      { id: 'a', html: 'نعم، %25 بالضبط (%20+%5).' },
      { id: 'b', html: 'يتعلّق ذلك بالمدة التي مرّت بين الزيادتين‎.' },
      { id: 'c', html: 'لا، أقل من %25. لأن مبلغ الزيادة يصغر في كل مرة مقارنةً بالمبلغ الأصلي‎.' },
      { id: 'd', html: 'لا، لأن نسبة الـ %5 الثانية تُحسب من مبلغ أكبر، وليس من المبلغ الأصلي‎.' },
    ],
    correct: 'd', maxAttempts: 2, next: 32, prev: 30,
    hintPolicy: 'always',   /* producer 15.09.26 — hint from the start */
    hint: 'تذكّروا، عندما نتحدث عن زيادة، نضرب بأكثر من %100.',
    fb: FB('صحيح!', S31_BODY),
  },
  { /* deck slide 43 — Itai vs Tzvi. Key = option 2 (60% of 10 = 6 < 40% of 100 = 40).
       The deck puts a BLANK version of the table inside the hint and asks the
       learner to fill it in, with no inputs anywhere — flagged; the hint here
       shows the empty table as a printed prompt, not an input grid. */
    step: { group: 'basic', index: 4, total: 5 },
    screen: 32, type: 'single', label: '',
    stem: `يلعب أمجد وعلاء في لعبة جماعية عبر الإنترنت.<br> قارنا نِسب فوزهما خلال هذا الأسبوع:<br> لعب <strong>أمجد</strong> 10 مباريات بالمجمل وفاز في %60 منها.<br> لعب <strong>علاء</strong> 100 مباراة بالمجمل وفاز في %40 منها.<br> قال أمجد لعلاء: "لقد حققتُ هذا الأسبوع عددًا أكبر الفوز لفريقنا لأن نسبة نجاحي هائلة!". <span class="q-ask">هل أمجد على صواب؟ اختاروا الإجابة الصحيحة‎:</span>`,
    options: [
      { id: 'a', html: 'أمجد على صواب - %60 هي نسبة أكبر من %40، ولذلك فاز بعدد أكبر من المباريات‎.' },
      { id: 'b', html: 'أمجد مخطئ - فاز علاء في 40 مباراة، وهذا أكثر من عدد المباريات التي فاز فيها أمجد.' },
      { id: 'c', html: 'أمجد مخطئ - فاز كلاهما بنفس عدد المباريات: 10 لكل منهما‎.' },
      { id: 'd', html: 'لا يمكن المعرفة - فقد لعبا عددًا مختلفًا من المباريات، ولذلك لا توجد طريقة للمقارنة بينهما‎.' },
    ],
    correct: 'b', maxAttempts: 2, next: 33, prev: 31,
    hintPolicy: 'always',   /* producer 15.09.26 — hint from the start */
    hint: `رتّبوا المعطيات في الجدول التالي واستنتجوا النتيجة المناسبة‎:
<table class="data-table hint-table">
  <thead><tr><th>اللاعب</th><th>عدد المباريات التي لعبها</th><th>نسبة الفوز</th><th>عدد مباريات الفوز</th></tr></thead>
  <tbody>
    <tr><td>أمجد</td><td></td><td></td><td></td></tr>
    <tr><td>علاء</td><td></td><td></td><td></td></tr>
  </tbody>
</table>`,
    fb: FB('صحيح!', S32_BODY),
  },
  { /* deck slide 44 — marbles part א. Keys 90 / 270 / 81 / 243 / 270.
       FLAG-PRODUCER: the note says "the dropdown options are to the left of the
       table", but the slide has no dropdown and nothing left of the table.
       Built as five plain value inputs. */
    step: { group: 'basic', index: 5, total: 5 },
    screen: 33, type: 'value-input', label: '',
    stem: `يوجد في صندوق 300 بنّورة. أُخرجوا من الصندوق %10 من البنانير، ثم %10 إضافية من البنانير المتبقية. <span class="q-ask">أ. املؤوا الجدول التالي‎:</span>`,
    slotHtml: `
<table class="data-table q-table q-table--marbles">
  <thead><tr><th>المرحلة</th><th>الكمية قبل الإخراج</th><th>الكمية بعد الإخراج</th><th>النسبة المتبقية من الكمية الأصلية</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>300</td><td>{}</td><td><span class="slot-pct" dir="ltr">{}<span class="vb-unit vb-pct">%</span></span></td></tr>
    <tr><td>2</td><td>{}</td><td>{}</td><td><span class="slot-pct" dir="ltr">{}<span class="vb-unit vb-pct">%</span></span></td></tr>
  </tbody>
</table>`,
    slotLabel: 'الإجابة',
    correctInputs: ['270', '90', '270', '243', '81'],
    maxAttempts: 2, next: 34, prev: 32,
    hint: 'احسبوا كم بنّورة تشكّل %10 من الكمية الموجودة في الصندوق في كل مرحلة، وأي نسبة مئوية تبقى من الكمية الأصلية (300).<br>يمكن الاستعانة أيضًا بجدول التناسب‎.',
    fbScroll: true,   /* 24.09 client QA: this body overruns the box */
    fb: FB('صحيح!', S33_BODY),
  },
  { /* deck slide 45 — marbles part ב. Key = option 3. The note says אין רמז
       and the slide indeed carries no hint button, so none is configured. */
    step: { group: 'basic', index: 5, total: 5 },
    screen: 34, type: 'single', label: '',
    stem: `<span class="q-ask">ب. حدّدوا ما إذا كانت الفرضية التالية صحيحة‎:</span>
      <p>‎"‎إخراج %10 مرتين متتاليتين يعادل إخراج %20 دفعة واحدة‎".</p>`,
    content: `
<table class="data-table q-table q-table--marbles">
  <thead><tr><th>المرحلة</th><th>الكمية قبل المرحلة</th><th>الكمية بعد المرحلة</th><th>النسبة المتبقية من الكمية الأصلية</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>300</td><td>270</td><td>90%</td></tr>
    <tr><td>2</td><td>270</td><td>243</td><td>81%</td></tr>
  </tbody>
</table>`,
    options: [
      { id: 'a', html: 'دائمًا، لأن %10 + %10 تساوي %20 بالضبط، بغض النظر عن الكمية‎.' },
      { id: 'b', html: 'أحيانًا، يتعلق ذلك بعدد البنانير الموجودة في الصندوق في البداية‎.' },
      { id: 'c', html: 'أبدًا، لأن نسبة الـ %10 الثانية تُحسب من الكمية المتبقية وليس من الكمية الأصلية، ولذلك تكون الكمية الإجمالية التي تم إخراجها أقل من ‎%20 دائمًا.' },
      { id: 'd', html: 'أبدًا، لأن مجموع النسب المئوية الأكبر هو عدد أصغر‎.' },
    ],
    correct: 'c', maxAttempts: 2, next: 35, prev: 33,
    /* Deck slide 45's note says אין רמז and the slide carries no hint panel.
       This is part ב of the SAME marbles question as screen 33, so part א's
       hint — the deck's own words — is carried over here (producer asked for a
       hint on this screen, 15.09.26). Flagged, not invented. */
    hintPolicy: 'always',
    hint: 'احسبوا كم بنّورة تشكّل %10 من الكمية الموجودة في الصندوق في كل مرحلة، وأي نسبة مئوية تبقى من الكمية الأصلية (300).<br>يمكن الاستعانة أيضًا بجدول التناسب‎.',
    fb: FB('صحيح!', S34_BODY),
  },
  { /* deck slide 47 — camp coupons part א. Keys 297.5 / 290, typed into the
       table's left column beside the ₪ that lives inside the cell. */
    step: { group: 'coupons', index: 1, total: 2 },
    screen: 36, type: 'value-input', label: '',
    stem: `استعدادًا للمخيم الصيفي لحركة الشبيبة، يخرج تامر ونسرين لشراء أغراض تكلفتها 400 شيكل.<br> لديهما قسيمتا خصم يمكن استخدامهما واحدةً تلو الأخرى، بأي ترتيب يريدانه:<br> القسيمة أ - خصم ثابت بقيمة 50 شيكل.<br> القسيمة ب - خصم بنسبة %15.<br> يقترح تامر استخدام القسيمة أ أولًا، وتقترح نسرين استخدام القسيمة ب أولًا. <span class="q-ask">أ. كم سيكون السعر النهائي وفقًا لاقتراح كل منهما؟</span>`,
    slotHtml: COUPON_TABLE('{}', '{}'),
    slotLabel: 'السعر النهائي',
    correctInputs: ['297.5', '290'],
    maxAttempts: 2, next: 37, prev: 35,
    /* the deck's OWN hint panel on slide 47, verbatim — we had invented one */
    hint: 'عليكم حساب السعر بعد كل خصم على حدة‎.',
    fb: FB('صحيح!', S36_BODY),
  },
  { /* deck slide 48 — camp coupons part ב. Key = option 3. No hint button on
       this slide in the deck, so none is configured. */
    step: { group: 'coupons', index: 2, total: 2 },
    screen: 37, type: 'single', label: '',
    stem: `<span class="q-ask">ب. من على صواب؟<br>أي الاقتراحين أوفر:<br>اقتراح تامر (أ ثم ب) أم اقتراح نسرين (ب ثم أ)؟</span>`,
    content: COUPON_TABLE('297.5', '290'),
    options: [
      { id: 'a', html: `تامر على صواب، لأننا نخصم أولًا المبلغ الثابت.<br>وهذا يعني أن النسبة المئوية تُخصم من مبلغ أصغر‎.` },
      { id: 'b', html: 'كلاهما على صواب بنفس الدرجة: الفارق بين الحسابين ضئيل في هذه الحالة ولا يؤخذ بالحسبان‎.' },
      /* an amount and its ₪, and a number and its %, stay on one line */
      { id: 'c', html: `نسرين على صواب: لأن نسبة الـ <span class="nowrap">%15</span> تُحسب من المبلغ الكامل (<span class="nowrap">400 شيكل</span>) قبل خصم مبلغ الـ <span class="nowrap">50 شيكل</span> الثابت‎.` },
      { id: 'd', html: 'نسرين على صواب، فالخصم بالنسبة المئوية سيكون دائمًا أكبر من خصم مبلغ ثابت‎.' },
    ],
    correct: 'c', maxAttempts: 2, next: 38, prev: 36,
    fb: FB('صحيح!', S37_BODY),
  },
  { /* deck slide 49 — camp coupons part ג. Key = שני. */
    hintPolicy: 'always',
    screen: 38, type: 'single', label: '',
    stem: `<span class="q-ask">ت. دون حساب، لنفترض أن سعر الغرض كان 5,000 شيكل بدلًا من 400 شيكل.<br>أي اقتراح يبقى أوفر؟</span>
      <p>تامر - أولًا خصم بقيمة 50 شيكل ثم خصم بنسبة %15؟<br>نسرين - أولًا خصم بنسبة %15 ثم خصم بقيمة 50 شيكل.</p>`,
    options: [
      { id: 'a', html: 'اقتراح تامر' },
      { id: 'b', html: 'اقتراح نسرين' },
    ],
    correct: 'b', maxAttempts: 1, next: 39, prev: 37,
    /* the deck's OWN hint panel on slide 47, verbatim — we had invented one */
    hint: 'عليكم حساب السعر بعد كل خصم على حدة‎.',
    fb: FB('صحيح!', S38_BODY),
  },
  { /* deck slide 50 — MULTI-select, two correct (options 2 and 4).
       FLAG-PRODUCER — BLOCKING: the table's year-2 "added visitors" cell reads
       1,200 where the maths gives 1,440. As printed the total is 8,400 (+40%),
       which makes the commenter's 44% claim FALSE and inverts the answer key.
       Built with 1,440 so the screen is self-consistent; see
       docs/OPEN-QUESTIONS.md §A2. */
    screen: 39, type: 'multi', label: '',
    stem: `نشرت سلطة الحدائق منشورًا يحتوي على جدول معطيات الزوار في وادي عيمك بوكر خلال العامين الأخيرين‎.
      <p>كتبت إحدى المعلّقات على المنشور:<br> "ارتفع عدد الزوار بنسبة %20 في السنة الأولى، ثم بنسبة %20 إضافية في السنة الثانية. وهذا يعني أنه ارتفع بالمجمل بنسبة ‎44%".</p>
      <span class="q-ask">بناءً على معطيات الجدول، هل الادّعاء صحيح؟</span><p class="q-ask-plain">اختاروا <strong>جميع</strong> الإجابات الصحيحة‎.</p>`,
    content: `
<table class="data-table q-table">
  <thead><tr><th>السنة</th><th>عدد الزوار</th><th>الارتفاع في عدد الزوار</th><th>نسبة الارتفاع</th></tr></thead>
  <tbody>
    <tr><td>السنة ‎1</td><td>6,000</td><td>1,200</td><td>20%</td></tr>
    <tr><td>السنة ‎2</td><td>7,200</td><td>1,440</td><td>20%</td></tr>
  </tbody>
</table>`,
    options: [
      { id: 'a', html: 'الادّعاء خاطئ، يجب جمع النسب المئوية معًا. وهكذا يصبح الارتفاع الإجمالي ‎40%.' },
      { id: 'b', html: 'الادّعاء صحيح، الارتفاع في السنة الثانية يُحسَب من الارتفاع الذي طرأ في السنة الأولى‎.' },
      { id: 'c', html: 'الادّعاء صحيح، بما أن الحديث عن ارتفاعَين، النسبة النهائية ستكون أقل من مجموع النسبتَين‎.' },
      { id: 'd', html: 'الادّعاء صحيح، لأنه عند ضرب الكسر العشري %20 مرتَين، سنحصل على ‎44%.' },
    ],
    correctSet: ['b', 'd'], maxAttempts: 2, next: 40, prev: 38,
    hint: 'ما هو المجمل الذي يُحسَب منه الارتفاع في عدد الزوار في كل سنة؟',
    fb: FB('صحيح!', S39_BODY),
  },
  { /* deck slide 54 — peak question part א. Keys 246 / 215.
       The deck's absolutely-positioned input boxes land on the header row once
       its three-word cells wrap; the inputs are placed INSIDE the row cells here. */
    screen: 42, type: 'value-input', label: '',
    stem: `في السنة الماضية أيضًا، نُقل بيض إلى مزارع تفريخ، وجُمعت المعطيات التالية حول نسب الفقس الناجح لبيض السلاحف البحرية:<br> نُقلت إلى مزرعة التفريخ أ 300 بيضة بالمجمل، وسُجّلت منها نسبة فقس ناجح %82<br>. في مزرعة التفريخ ب، نُقلت بالمجمل 250 بيضة، وسُجّلت منها نسبة فقس ناجح %86. <span class="q-ask">أ. أكملوا الجدول‎:</span>`,
    slotHtml: HATCH_TABLE('{}', '{}'),
    slotLabel: 'عدد حالات الفقس',
    correctInputs: ['246', '215'],
    maxAttempts: 2, next: 43, prev: 41,
    hint: 'احسبوا عدد حالات الفقس الناجح من خلال التحويل إلى كسر بسيط/عشري‎.',
    fb: FB('صحيح!', S42_BODY),
  },
  { /* deck slide 56 — peak question part ב. Key = option 1 (86% > 82%).
       The deck stores option 2 before option 1; paired by geometry, built in
       visual order. */
    screen: 44, type: 'single', label: '',
    stem: `انظروا إلى الجدول وحدّدوا: <span class="q-ask">ب. في أي مزرعة يكون تفريخ البيض أكثر أمانًا؟</span>`,
    content: HATCH_TABLE('246', '215'),
    options: [
      { id: 'a', html: `في المزرعة ب - نسبة النجاح أعلى، وكلما زادت كمية البيض الذي يتم تفريخه، سيفقس عدد أكبر من السلاحف‎.` },
      { id: 'b', html: `في المزرعة أ - كان فيها عدد حالات فقس ناجح أكبر في السنة الماضية. فقست 31 سلحفاة أكثر‎!` },
      { id: 'c', html: 'لا يمكن تحديد ذلك بسبب نقص المعطيات مثل حالة الطقس ومدى خطر الحيوانات المفترسة في المحمية التي أُقيمت فيها المزرعتان‎.' },
      { id: 'd', html: 'عدد السلاحف البحرية التي فقست في كل واحدة من المزرعتين متساوٍ، لأن نسبة الفقس في كلتيهما كانت أعلى من %80.' },
    ],
    correct: 'a', maxAttempts: 2, next: 45, prev: 43,
    hint: 'افحصوا كل ادّعاء مقارنةً بالمعلومات الواردة في الجدول‎.',
    fb: FB('صحيح!', S44_BODY),
  },
  { /* deck slide 57 — peak question parts ג AND ד on one screen. Keys 1584 / 32.
       FLAG-PRODUCER — BLOCKING: the stem says shipment 3 was 20% OF shipment 2,
       which gives 2,784; the key and feedback compute 1,584 (one quantity raised
       twice), and the hint says "two shipments" where the stem says three.
       Built to the key so the screen marks consistently — docs §A3. */
    screen: 45, type: 'value-input', label: '',
    stem: `نظرًا إلى كمية البيض التي تفرّقت، تقرَّرَ نقل جزء كبير منها إلى المزرعة ب.<br> احتوت الشحنة الأولى على 1,200 بيضة.<br> واحتوت الشحنة الثانية على %10 أكثر من الشحنة الأولى، فيما احتوت الشحنة الثالثة على %20 من الشحنة الثانية‎.`,
    slotLines: [`<span class="q-ask">ت. كم بيضة ستكون في المزرعة ب في نهاية العملية؟</span> {} بيضة`,
                `<span class="q-ask">ث. ما هي نسبة الزيادة مقارنةً بالكمية الأصلية البالغة 1,200 بيضة؟‎</span> {%}`],
    slotLabel: 'الإجابة',
    correctInputs: ['1,584', '32'],
    altInputs: [['1,584', '32']],
    content: `
<table class="data-table q-table">
  <thead><tr><th>مزرعة التفريخ</th><th>نسبة الفقس الناجح</th></tr></thead>
  <tbody>
    <tr><td>المزرعة أ</td><td>82%</td></tr>
    <tr><td>المزرعة ب</td><td>86%</td></tr>
  </tbody>
</table>`,
    maxAttempts: 2, next: 46, prev: 44,
    hint: 'احسبوا عدد البيض الموجود في المزرعة بعد الشحنتين المتتاليتين‎.',
    fb: FB('صحيح!', S45_BODY),
  },
  { /* deck slide 59 — peak question part ה · StatementAssessmentQuestion.
       The note is the only real behavioural spec in the range:
       "טיעונים עולים הדרגתית. משוב עולה אחרי מענה על הכל." — statements reveal
       one at a time, feedback only once all four are answered.
       Keys, paired by chip geometry: לא נכון / לא נכון / נכון / נכון. */
    screen: 47, type: 'statement', label: '', progressive: true,
    stem: `خلال النقاشات في مكاتب السلطة طُرِحت ادعاءات مختلفة. <span class="q-ask">جـ. ساعدوا إدارة السلطة وحددوا ما إذا كان كل ادعاء صحيحًا أم لا‎:</span>`,
    content: HATCH_TABLE('246', '215'),
    statements: [
      { text: `"لو أجرينا شحنتَيّ الزيادة بترتيب عكسي <span class="nb">(%20 أولًا، ثم %10)</span>، لكانت النتيجة النهائية مختلفة‎".`, correct: false },
      { text: `"بما أن هناك 1,584 بيضة إضافية تراكمت في المزرعة ب بالإضافة إلى الـ 1,200 بيضة الأصلية، ستكون نسبة الفقس الإجمالية في المزرعة أكبر من %86".`, correct: false },
      { text: `"لو نقلنا الشحنات الثلاث <span class="nb">(1,584 بيضة)</span><br>إلى المزرعة أ بدلًا من المزرعة ب، لفقس عدد أقل من السلاحف مقارنةً بعدد السلاحف التي ستفقس <br>في المزرعة ب‎".`, correct: true },
      { text: `"إذا فقدنا بسبب مرض وراثي %32 من كمية البيض الحالية في المزرعة ب <span class="nb">(1,584)</span>، سيبقى أقل من 1,200 بيضة‎".`, correct: true },
    ],
    maxAttempts: 2, next: 48, prev: 46,
    fb: FB('صحيح!', S47_BODY),
  },
);

/* a webfont landing changes every bubble's metrics — redraw once it has */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => decorateBubbles(document));
}
