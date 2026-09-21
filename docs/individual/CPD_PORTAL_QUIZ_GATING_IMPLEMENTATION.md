# CPD Portal Quiz-Gated Attendance Implementation

## Scope

This release fixes the confirmed locum/outreach profile-overwrite bug and adds optional quiz-gated CPD attendance. Sessions without a quiz remain unchanged. A required session quiz is an additional precondition before attendance can move to `attendance_verified`; it does not replace human attendance review.

## Bug fix

`cpd.submitRegistration` now updates `providerProfiles.department` only when the registrant selects `permanent_facility`. A `locum_outreach` registration continues to create or update the facility-history relationship through the existing facility registry service, but cannot overwrite the user’s permanent profile department.

## Quiz model

Three additive tables are used:

- `cpdEventQuizzes`: one quiz configuration per CPD event, with a default 80% passing score and an `isRequired` flag.
- `cpdEventQuizQuestions`: multiple-choice or true/false questions, stored options, correct answer, and display order.
- `cpdAttendeeQuizAttempts`: immutable attempt history with server-computed score, pass state, and submitted answers.

The migration is `0150`; it is idempotent and has a matching verification script.

## Admin flow

Institutional CPD authorities can enable **Session quiz (optional)** while creating a CPD session. The builder supports one or more multiple-choice or true/false questions, configurable passing score, answer options, and exact correct-answer entry. The default passing score is 80%. The session is created first and the quiz is attached immediately through the new CPD router mutation.

The server validates every question, requires at least two choices for multiple-choice questions, forces true/false options to `true` and `false`, and requires the declared answer to be one of the available choices. Quiz authoring remains tenant-scoped and respects department-scoped CPD authority.

## Attendee flow

The registration page exposes no new step when a session has no quiz. For a quiz-gated session, the attendee registers first and then receives a required quiz step. Answers are sent to the server; correct answers are never sent to the client. A failed attempt shows the score and a retry action. Attempts are not limited to one.

A passing attempt unlocks the existing check-in action. The attendee may still be required to check in and remains subject to the existing coordinator review process.

## Attendance and certificates

`reviewAttendance` refuses the transition to `attendance_verified` until a passing attempt exists for a required quiz. The best passing attempt is sufficient. Existing terminal-state and department-scope checks remain unchanged.

CPD points, certificate issuance, analytics, and event closure continue to use the existing `attendance_verified` contract. No separate certificate or points path was introduced.

## Rollout

1. Deploy the application code.
2. Run `pnpm run db:apply-0150` against the target database.
3. Run `pnpm run db:verify-0150` and retain the output with deployment evidence.
4. Run a disposable session smoke test with no quiz and a second disposable session with a two-question required quiz.
5. Confirm a failed attempt can retry, a passing attempt unlocks check-in, and coordinator verification is rejected before a pass.
6. Confirm a locum/outreach registration leaves the provider’s permanent department unchanged.

## Rollback

The UI can stop creating new quiz-gated sessions without affecting existing sessions. The attendance gate should not be bypassed by a blanket code change; if rollback is necessary, revert the application release through the protected workflow and preserve the quiz tables and attempts for auditability. Existing quiz-free sessions remain compatible.

## Validation evidence

The release must include focused quiz-scoring and presenter/attendance regression tests, `pnpm run check`, the standard unit suite, the production build, `git diff --check`, protected CI evidence, and migration verification output. Holistic E2E remains subject to the repository’s existing workflow configuration.
