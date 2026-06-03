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

## Fellowship-only (not applied to AHA)

See `EXAM_POLICY_AHA_GAPS` in `shared/exam-policy-learner-content.ts`:

- Diagnostic baseline (no pass mark, no retake)
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

## Admin reset (out of band)

No self-serve “reset attempts” in v1. Support may clear or adjust `userProgress` for the summative quiz after verifying identity and attempt history.

---

## Document control

| Field | Value |
|-------|--------|
| CEO sign-off | Pending |
| Last updated | 2026-06-03 |
