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

## Who sees the updated course: `BLS_V2_AUDIENCE`

Set this environment variable on the server (default `everyone`):

| Value | Behaviour |
|---|---|
| `everyone` (default) | Every learner who opens BLS sees the updated course, including completed learners reviewing. Learners who have **not** completed BLS follow the updated course for progress, exam state and completion. Learners who **have** completed keep their own record for completion and certificate checks (certificate issuance re-checks module progress against the course they completed). |
| `new_learners` | Only enrolments created after the updated course exists get it. Everyone else stays on the course their enrollment points at. |
| `off` | The updated course is never created or served. This is the real rollback: setting the course row inactive does NOT work, because the seeder would create a new copy on the next trigger. |

Consequences of `everyone`:
- **Learners partway through the original course start the updated course from its first module.** Their old progress rows are kept (nothing is deleted or altered) but are not credited against the new modules.
- Completed learners' completion flags and certificates are unchanged.
- Completed learners reviewing the course see updated content with no per-module ticks (review mode unlocks everything).

## Known limitations## Known limitations / decisions still needed

- **Clinical sign-off required.** v2 text was written from AHA 2025 interim materials and published algorithms; a clinical reviewer
  must verify it against the current AHA BLS Provider Manual before release (especially pad placement wording, infant technique
  wording, naloxone guidance and the choking/pregnancy adaptations).
- **The original exam keeps its known issues** (items on lone-rescuer pediatric timing, "preferred" two-thumb wording, and the CCF
  stem). It is frozen by design; fixing it needs a separate, explicit one-off repair of the existing exam rows.
- **No progress credit** carries over from the original modules to the updated ones (module ids differ).
- Learners who finished every original module but never had the completion flag set are treated as not completed.
- **No router-level automated test for `getCourseDetails`.** The existing router tests need a database; pin behaviour is covered
  by unit tests of the resolver and a fake-database test, so please smoke-test the review URL above after deploy.
- Local emergency numbers and naloxone availability are generic in the text ("your local emergency number"; "know your local rules").
- AHA course/card naming and branding: confirm how the "AHA 2025" positioning should read.
