# Pass marks in methodica-ar-math-percent-08 — report-only (decision 28.09.26)

**For:** the content, QA and development teams.
**Status:** interim decision. The pass marks are **computed and reported, never enforced**.
Revisit this before the unit's first live Kata run and before any change to these screens.

## תקציר בעברית

שלושה מסכי מעבר ביחידה מבטיחים ללומד ציון מעבר. **עד להחלטה אחרת, הציון מחושב ומדווח ל-Kata
בלבד. הוא לא עוצר את הלומד ולא משנה את המסלול שלו בתוך הרכיב.**

- כל לומד עובר את כל המסכים, בדיוק כמו היום.
- בלחיצה האחרונה של הרכיב נשלח `completed` שבו:
  - `success` הוא true או false לפי הסף שהובטח במסך.
  - `score.scaled` הוא היחס בין השאלות הנכונות לכל השאלות שנבדקות ברכיב.
- המסלול הבא נקבע ע"י הפלטפורמה (`recommendedAfterFail`), לא ע"י היחידה. ברכיב 03 מוגדר מעבר
  ל-02 במקרה של כישלון.
- פירוט הקבוצות שנספרות והשאלות הפתוחות מופיע בהמשך המסמך, באנגלית.

## What the screens promise

| Screen | Component | On-screen text | Promise |
|---|---|---|---|
| s10 (deck 20) | 02 | "…נענה על **6 שאלות** — צריך לענות נכון על **4 שאלות לפחות**." | 4 of 6 |
| s28 (deck 39) | 03 | "**5 שאלות** … ענו נכון על **4 שאלות ומעלה** כדי להתקדם." | 4 of 5 |
| s40 (deck 52) | 04 | "שאלת השיא … יש בה **5 סעיפים**. עליכם להצליח ב-**4 לפחות**." | 4 of 5 |

Component 01 promises nothing. It reports `success: true` when finished, and its score is the
s1 question.

Nothing in the deck says what happens below a mark. The README's "No score gate anywhere" was
the state before this change, and it is **still true for the learner**.

## What the code does (report-only)

**Where it lives.** Each component's `script.js` declares
`PART_PASS = { need, sets: [[questionKey, …], …] }`. `partResult()` in `unit-js/70-platform.js`
turns that into the component result.

**What gets counted.**
- A **set** passes when every question in it was answered correctly.
- `success` is true when the number of passed sets is at least `need`.
- `score.scaled` is the number of correct graded questions divided by all graded questions in the
  component. That means every question of every item in `XAPI_EVAL_ITEMS`.

**When it is sent.** At the component's **last click**:

| Component | Last click |
|---|---|
| 01 | s9 המשך |
| 02 | s27 המשך |
| 03 | s39 "שנמשיך?" |
| 04 | s48 המשך |

That click sends `completed` with the result, disables the button, and writes the verdict
(`percent08_c0N_result` = `pass` / `fail`) into the component's state document through
`setUnitResult`. The page then stops. The platform decides what comes next.

**What does not happen.**
- No screen blocks.
- No early end below the mark.
- No in-unit routing.
- A learner who scores 1 of 6 walks through exactly the same screens as one who scores 6 of 6.

### The sets as implemented

The sets are **our reading** of the on-screen text. Please confirm or correct them.

| Component | `need` | Sets counted | Scored but outside the promise |
|---|---|---|---|
| 02 | 4 | Six catalogue items (002 זוג העוקבים s13 · 003 חיסכון s15+s16 · 004 קופונים s17 · 005 צמחים s18 · 006 קופון קבוע s20–s22 · 007 להקות s24–s26). An item counts only if **all** its questions are right. | none |
| 03 | 4 | The five stations of the "basic" stepper: s29 · s30 · s31 · s32 · s33+s34 (station 5 spans two screens; both must be right, as the stepper itself shows). | 006 (s36–s38), 007 (s39) |
| 04 | 4 | q1 (s42) · q2 (s44) · q3 and q4 (s45's two boxes, **as two sections**) · q5–q8 (the s47 statement grid, as **one** section) | none |

**The gate is not the score.** Two learners can report the same `scaled` with opposite
`success` (guide §6.4). Example from component 03:

| Learner | Right answers | Share of graded questions | `success` |
|---|---|---|---|
| A | 3 basic stations + all of 006 and 007 | 8/10 | **false** |
| B | 4 basic stations, wrong on 006 and 007 | 5/10 | **true** |

This follows from counting the promised set (guide §6.4: "the denominator should be what the
learner was promised"). Kata has not said which of the two it reads. See the open questions
below.

## Open questions (need an owner)

1. **Component 02: questions or items?** s10 says "6 שאלות", but the six zones carry **11**
   declared questions. We count the six items, each all-or-nothing. An alternative is "4 of the
   11 questions". Owner: content (מפתחת).
2. **Component 03: does "5 שאלות" mean the stepper's five stations?** The stepper visibly
   numbers exactly five, over s29–s34. The coupons block (s36–s39) has its own stepper (2) and
   one unnumbered question. Owner: content.
3. **Component 04: which are the "5 סעיפים"?** The deck does not letter them. There are 4
   graded screens and 8 declared questions. Our provisional reading is q1 · q2 · q3 · q4 · the
   four statements as one. Owner: content.
4. **Should a mark ever block?** If yes, the guide's rule (§6.4, ratio-02 `SET_GATES`) is:
   - check the gate **last**, in the function every forward path goes through (so the keyboard is
     covered too);
   - below it, `xapiEndComponent(partResult(), btn)` with `success:false`, and navigate nowhere;
   - after a reload, re-disable only when the gate blocks **and** the ledger holds `done`.

   What would change here: a `SET_GATES`-style table per component, a check in `quizCheck`'s done
   branch before `goTo(q.next)`, a painter branch for the gated button, and harness checks. Owner:
   content + development.
5. **How does Kata read the component result?** From `score.scaled`, from the `answered.last`
   statements, or from the declared `questions[]`? This is the open question at the platform
   level (guide §13). Owner: platform team.
6. **Component 03's `recommendedAfterFail` points to 02.** A learner below the mark in 03 is
   therefore sent back by **Kata** (not by the unit) to the standard practice. That is what the
   metadata says today. Confirm it is intended now that nothing blocks inside the unit.

## Related provisional decision: the guided screens (s5–s7)

Item 01-002 declares three questions (true-false, choice, true-false) on the guided walk-through.
The UI reveals the answer on the first click and grades nothing.

Until decided otherwise (28.09.26), each pick is reported as `answered.last` with a **fictive**
result `success: true, score.scaled: 1`, carrying the learner's pick as `student_answer`. The
item is not in `XAPI_EVAL_ITEMS`, so it never enters the component score or any pass mark.

Changing this is a one-line edit in `onGuidedAnswered` (`unit-js/70-platform.js`), or emptying
`questions[]` for 01-002 in the metadata.

## Where to look

- `methodica-ar-math-percent-08-0N/script.js`: `PART_PASS`, `XAPI_EVAL_ITEMS`, `XAPI_QMAP`
- `unit-js/70-platform.js`: `partResult()`, `partExit()`, `onGuidedAnswered()`
- `_test/statement-flow.js` "passMarks", and `_test/verify-report.js` group `pass`: the
  assertions that pin this behaviour
- `2026/Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md` §6.4
