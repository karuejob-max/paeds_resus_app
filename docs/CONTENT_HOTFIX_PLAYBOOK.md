# Content hotfix playbook — quiz and micro-course fixes

> **Parent doc:** [CRITICAL_FIX_PLAYBOOK.md](./CRITICAL_FIX_PLAYBOOK.md) — universal triage for all critical fixes.  
> This file is **Appendix A** (quiz/content detail only).

Use when a learner reports a wrong quiz key, typo in a knowledge check, or mismatched correct answer.

**Answer contract:** [shared/quiz-answer-contract.ts](../shared/quiz-answer-contract.ts) — store **option text** (value-based), not option index.

**Definition of Done:** merged on `origin/main` + `quiz:verify-answer` shows `evaluatorMatch: true` + WORK_STATUS entry ([AGENT_AUTONOMY.md](./AGENT_AUTONOMY.md) §2).

---

## Step 1 — Verify runtime source (DB vs seed file)

Micro-courses and fellowship content usually run from **MySQL** (`quizQuestions`), not from TypeScript at request time.

| Check | How |
|-------|-----|
| Player path | `MicroCoursePlayerDB` loads quizzes via tRPC `learning` / enrollment APIs → `quizQuestions` rows |
| Seed sources | `server/data/micro-courses-batch-*.ts`, `scripts/seed-interactive-content.ts`, `scripts/seed-fellowship-content.ts` |
| Catalog metadata | `server/lib/micro-course-catalog.ts`, `MICRO_COURSE_CATALOG` |

**Read-only CLI:**

```bash
pnpm run quiz:verify-answer -- --questionText "Initial fluid bolus for DKA"
# or
pnpm run quiz:verify-answer -- --quizId 123
```

Interpretation:

- **storedRaw** — column value as in DB  
- **storedResolved** — text used after JSON parse  
- **evaluatorMatch** — whether that value equals an option string (required for grading)

---

## Step 2 — Patch runtime (DB) first

For production learner impact, fix the live row **before** relying on a redeploy-only seed change.

Example (DKA fluid bolus):

```bash
pnpm run quiz:fix-dka-fluid-bolus
```

Rules:

- Idempotent scripts only (safe to re-run).
- Use [scripts/db-connection-config.mjs](../scripts/db-connection-config.mjs) for Aiven SSL on Windows.
- Match **exact option text** (e.g. `"200 mL"`), stored as `JSON.stringify("200 mL")` in `correctAnswer`.

Re-verify with `pnpm run quiz:verify-answer`.

---

## Step 3 — Patch seed / source files

Update the canonical source so future seeds/migrations do not regress:

- `server/data/micro-courses-batch-1-5.ts` (and related batch files) — `correct` index must point at the right option; seed scripts map index → option text via `encodeQuizCorrectAnswerForStorage`.
- Re-run or document seed path if operators refresh content (`scripts/seed-interactive-content.ts`, `seed-fellowship-content.ts`).

---

## Step 4 — PR, merge, verify on `main`

1. Branch → `pnpm run check` → `pnpm run test:unit` → `pnpm run build` (and `test:clinical` if clinical).
2. Open PR with `gh pr create`; wait for **CI** green.
3. Merge to `main`.
4. On production DB: run hotfix script if not already applied; run `quiz:verify-answer` again.
5. Log in [WORK_STATUS.md](./WORK_STATUS.md) with PR link + merge commit.

---

## PR checklist (content hotfix)

- [ ] Runtime source confirmed (DB row id + question text)
- [ ] `quiz:verify-answer` shows **evaluatorMatch: true** for correct option
- [ ] DB script applied (or row already correct) — idempotent log captured
- [ ] Seed/source file updated for long-term consistency
- [ ] Unit test added/updated if contract-related (`shared/quiz-answer-contract.test.ts`)
- [ ] `pnpm run check` + `pnpm run test:unit` + `pnpm run build` pass
- [ ] PR merged; post-merge DB spot-check on production DB
- [ ] WORK_STATUS entry with date and PR link

---

## Admin / script verification

Prefer CLI first (no new API surface):

- `scripts/verify-quiz-answer.mjs` — read-only inspection (`pnpm run quiz:verify-answer`)

Add gated admin tRPC only if CLI is insufficient for routine ops.

---

## Cache after hotfix

Learners may still see old quiz state until refresh:

- Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R).
- If a module quiz was cached in session state, re-open the course from Training Hub.
- No separate CDN cache for quiz JSON today; authority is DB per request.

---

## Related

- [CRITICAL_FIX_PLAYBOOK.md](./CRITICAL_FIX_PLAYBOOK.md) — all critical fix categories  
- [AGENT_AUTONOMY.md](./AGENT_AUTONOMY.md) — autonomous agent loop, Kolb cycle  
- [MANUS_AGENT_RULES.md](./MANUS_AGENT_RULES.md) — sandbox / Handoff rules  
- [AGENTS.md](../AGENTS.md) — clinical content needs CEO approval before merge
