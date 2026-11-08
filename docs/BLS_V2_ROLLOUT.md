# BLS Updated Curriculum (v2) — rollout notes

## What changed

- **New course version, not an edit.** The original BLS curriculum (`server/lib/bls-modules-data.ts`, 6 modules) is frozen.
  The updated curriculum lives in `bls-modules-v2-data.ts` (8 modules, 25 sections, 24 knowledge-check questions) with its own
  25-question exam (`bls-summative-bank-v2.ts`). Every exam item records the module/section that teaches it, enforced by tests.
- **No schema migration.** v2 is identified by its exact course title (`BLS_V2_COURSE_TITLE`). Enrollments already store `courseId`.
- **Readers now honour the enrollment's own course** (`server/lib/resolve-enrollment-course.ts`):
  - `learning.getCourseDetails` (new optional `enrollmentId` input; the player passes the one in the URL),
  - cognitive-completion checks in `certificates.ts` (previously judged against *all* BLS rows together, which would have
    made v1 learners unable to complete once v2 existed),
  - progress percentage for enrollments whose `courseId` is unset.
- **New BLS enrollments** are created against v2 (provisioned on demand, single-flight).
- **The seeder only maintains v2.** It never updates the original course row. It also no longer deletes surplus modules that
  have `userProgress` rows (applies to ACLS too).

## What existing learners experience

| Learner | Result |
|---|---|
| Completed BLS (any enrollment) | Unchanged. Completion flag and certificates are persisted; review opens the course they completed, read-only. |
| In progress on the original course | Continues on the original modules, progress and exam. Completion is judged against their own course. |
| Enrollment with `courseId` unset or pointing at an unusable row | Course inferred from their progress rows; if they have started or finished, they stay on the original curriculum, never moved to v2. |
| New enrollment / not started | Updated curriculum (v2). |

## Deploy order and verification

1. Deploy the code. No migration to run.
2. v2 is created automatically on the first of: a new BLS enrollment, a BLS course load (background), or `pnpm seed`
   (`server/seed.ts` now also runs `ensureBlsCatalog`). Until v2 is fully seeded (8 modules) it is never served.
3. Verify in production (read-only checks first):
   - `SELECT id, title, isActive FROM courses WHERE programType='bls';` — expect the original row(s) plus one row titled
     "BLS Provider Course — Updated Curriculum (AHA 2025)" with 8 modules.
   - Open a completed learner's review URL (`/micro-course/bls?review=true&programType=bls&enrollmentId=<id>`): the original
     Module 1 title must still be shown and completion unchanged.
   - Create a test BLS enrollment: it should show the updated Module 1 and have `enrollments.courseId` = the v2 row id.
4. Rollback: set the v2 row `isActive = 0`. The resolver then serves the original rows again; no learner data is touched.

## Known limitations / decisions still needed

- **Clinical sign-off required.** v2 text was written from AHA 2025 interim materials and published algorithms; a clinical reviewer
  must verify it against the current AHA BLS Provider Manual before release (especially pad placement wording, infant technique
  wording, naloxone guidance and the choking/pregnancy adaptations).
- **The original exam keeps its known issues** (items on lone-rescuer pediatric timing, "preferred" two-thumb wording, and the CCF
  stem). It is frozen by design; fixing it needs a separate, explicit one-off repair of the existing exam rows.
- **In-progress learners are not offered an upgrade.** They finish on the original course. An opt-in upgrade is a follow-up.
- **No router-level automated test for `getCourseDetails`.** The existing router tests need a database; pin behaviour is covered
  by unit tests of the resolver and a fake-database test, so please smoke-test the review URL above after deploy.
- Local emergency numbers and naloxone availability are generic in the text ("your local emergency number"; "know your local rules").
- AHA course/card naming and branding: confirm how the "AHA 2025" positioning should read.
