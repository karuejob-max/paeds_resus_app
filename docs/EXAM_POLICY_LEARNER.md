# Exam policy — learner-facing (internal mirror)

**Public route:** `/learning/exam-policy` (alias `/courses/how-it-works` → redirect)

**Source of truth for copy:** `shared/exam-policy-learner-content.ts` (rendered by `client/src/pages/ExamPolicy.tsx`)

**Engineering policy:** `shared/microcourse-exam-policy.ts`, `server/lib/microcourse-exam-gate.ts`

**Governance:** [CLINICAL_CONTENT_GOVERNANCE.md](./CLINICAL_CONTENT_GOVERNANCE.md) §3.3–3.4, [CLINICAL_SOURCE_OF_TRUTH.md](./CLINICAL_SOURCE_OF_TRUTH.md) §6

---

## Summative rules (Fellowship + AHA)

| Rule | Value |
|------|--------|
| Pass mark | 80% |
| Max attempts | 3 (first try + 2 retries) |
| Cooldown | 24 hours between summative attempts (after first attempt) |
| Grading | Server-side from stored answers |
| Shuffle | Same bank; item and option order shuffled per attempt |

Enrollment types:

- **Fellowship micro-courses:** `microCourseEnrollments` → `getMicrocourseExamState`
- **AHA (BLS/ACLS/PALS/NRP):** `enrollments` → `getAhaCourseExamState`

Both use `canAttemptSummative` and `recordQuizAttempt` for summative gates.

---

## When can a learner retry?

1. **Cooldown:** If `attempts < 3` and last summative `updatedAt` (or `completedAt`) was less than 24h ago → retry opens at `lastAttemptAt + 24h` (shown in **EAT** in UI).
2. **Max attempts:** If `attempts >= 3` and score &lt; 80% → no further retries until admin resets progress on that quiz row.
3. **Passed:** If score ≥ 80%, summative is complete; retries are not offered.

**Data:** `userProgress.attempts`, `userProgress.updatedAt`, `userProgress.score` for the summative `quizId` on the learner’s enrollment.

---

## Diagnostic (Fellowship + AHA)

- Fixed bank on **module 1** — title `Diagnostic baseline`, `passingScore` 0
- One attempt; `recordQuizAttempt` rejects retake when `completedAt` is set
- Seeded idempotently: `pnpm run seed:aha-diagnostic` (BLS, ACLS, PALS, NRP, Heartsaver)
- Does **not** replace PALS 2025 modules/summative (`ensure-pals-2025-content` unchanged)

## Fellowship-only (not applied to AHA)

See `EXAM_POLICY_AHA_GAPS` in `shared/exam-policy-learner-content.ts`:

- Foundational / Advanced tracks and prerequisites
- Minimum native formative bank per module (seed governance)
- `assertMicrocourseCompletionAllowed` for Fellowship certificate claims
- Pillar A / Paeds Resus Fellow progress

---

## Blocked UI

- `SummativeRetryBlockedBanner` — attempts X of Y, EAT retry time, link to policy
- Server `recordQuizAttempt` FORBIDDEN uses `formatSummativeForbiddenMessage`
- Player: `MicroCoursePlayerDB.tsx` (Fellowship + AHA cognitive)

---

## Admin reset (summative attempts)

**URL:** [https://www.paedsresus.com/admin/reports](https://www.paedsresus.com/admin/reports) → tab **Enrollment ledger** → source **Training / AHA enrollments**

**Steps:**

1. Sign in as platform **admin**.
2. Open **Enrollment ledger**; filter by user (search or User ID) and program (BLS / ACLS / PALS / NRP) if needed.
3. Locate the learner’s **enrollment ID** row.
4. Click **Reset summative** (AHA / fellowship training rows only). Confirm — clears `userProgress.attempts` and score for the summative quiz only; action is logged in **adminAuditLog** via `adminLearning.resetSummativeAttempts`.

No self-serve reset in v1. Fellowship micro-course enrollments use the same procedure with ledger source **ADF micro-courses** when applicable.

---

## Document control

| Field | Value |
|-------|--------|
| CEO sign-off | Pending |
| Last updated | 2026-06-03 |
