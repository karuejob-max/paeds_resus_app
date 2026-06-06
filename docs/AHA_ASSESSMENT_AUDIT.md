# AHA assessment audit

**Generated:** 2026-06-06 · **Scope:** BLS, ACLS, PALS, NRP, Heartsaver

## Executive summary

| Metric | Count |
|--------|------:|
| Courses audited | 5 |
| NEEDS_FIX | 0 |
| Diagnostic↔summative overlaps | 0 |
| Summative↔formative overlaps | 0 |
| Within-quiz duplicate stems | 0 |
| expandQuestionBank padding dupes | 0 |
| Answer-in-stem leaks | 0 |
| Prod DB queried | yes |

## Governance checks (fellowship parity)

| Check | Expected | Notes |
|-------|----------|-------|
| Diagnostic vs summative | Disjoint (PR #164) | Separate `aha-diagnostic-banks.ts` + course summative |
| Within-quiz dupes | 0 | Per quiz bank |
| Summative vs module formative | 0 overlap when summative exists | PALS has course summative; BLS/ACLS/NRP/HS use module KC only |
| expandQuestionBank padding | 0 dupes | Unique stems only (PR #171) |
| Client/server grading | Server grades summative | `recordQuizAttempt` + `getSummativeExamQuestions` (PR #158/#160) |

## Per-course status

| Course | Status | Diag | Summ | Form | Diag↔Sum | Sum↔Form | Dups | Expand | Leaks | Source | Issues |
|--------|--------|-----:|-----:|-----:|---------:|---------:|-----:|-------:|------:|--------|--------|
| BLS | OK | 12 | 0 | 16 | 0 (0%) | 0 | 0 | 0 | 0 | static+db id=32 | — |
| ACLS | OK | 12 | 0 | 38 | 0 (0%) | 0 | 0 | 0 | 0 | static+db id=2 | — |
| PALS | OK | 12 | 25 | 26 | 0 (0%) | 0 | 0 | 0 | 0 | static+db id=40 | — |
| NRP | OK | 12 | 0 | 12 | 0 (0%) | 0 | 0 | 0 | 0 | static+db id=42 | — |
| HEARTSAVER | OK | 12 | 0 | 27 | 0 (0%) | 0 | 0 | 0 | 0 | static+db id=30 | — |

## Detail by course

### BLS — OK

- All checks passed.

_No course-level summative quiz in seed — certification uses module knowledge checks + diagnostic baseline._

### ACLS — OK

- All checks passed.

_No course-level summative quiz in seed — certification uses module knowledge checks + diagnostic baseline._

### PALS — OK

- All checks passed.

### NRP — OK

- All checks passed.

_No course-level summative quiz in seed — certification uses module knowledge checks + diagnostic baseline._

### HEARTSAVER — OK

- All checks passed.

_No course-level summative quiz in seed — certification uses module knowledge checks + diagnostic baseline._

## Prod verify (anchor course IDs)

| Course | courseId | diagnostic | summative | module formatives |
|--------|--------:|-----------:|----------:|------------------:|
| BLS | 32 | 12 | 0 | 16 |
| ACLS | 2 | 12 | 0 | 38 |
| PALS | 40 | 12 | 25 | 26 |
| NRP | 42 | 12 | 0 | 12 |
| HEARTSAVER | 30 | 12 | 0 | 27 |

PALS summative bank verified post PR #158/#160: 25 unique stems, PAT Q14 no answer leak, no duplicate Q2/Q19.

## Client/server grading (code audit)

- Summative delivery: `learning.getSummativeExamQuestions` shuffles and strips answers.
- Summative scoring: `learning.recordQuizAttempt` server-grades via `gradeSummativeAttempt`.
- Diagnostic: one-time baseline, no pass mark; not retakable.
