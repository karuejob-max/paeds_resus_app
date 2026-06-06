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
| Summative vs module formative | 0 overlap when summative exists | Course summative on last module; module formatives separate |
| Summative bank size | ≥15 (strict target 25) | Static `aha-summative-banks.ts` + prod DB |
| expandQuestionBank padding | 0 dupes | Unique stems only (PR #171) |
| Client/server grading | Server grades summative | `recordQuizAttempt` + `getSummativeExamQuestions` (PR #158/#160) |

## Per-course status

| Course | Status | Diag | Summ | Form | Diag↔Sum | Sum↔Form | Dups | Expand | Leaks | Source | Issues |
|--------|--------|-----:|-----:|-----:|---------:|---------:|-----:|-------:|------:|--------|--------|
| BLS | OK | 12 | 25 | 16 | 0 (0%) | 0 | 0 | 0 | 0 | static+db id=32 | — |
| ACLS | OK | 12 | 25 | 18 | 0 (0%) | 0 | 0 | 0 | 0 | static+db id=2 | — |
| PALS | OK | 12 | 25 | 26 | 0 (0%) | 0 | 0 | 0 | 0 | static+db id=40 | — |
| NRP | OK | 12 | 25 | 12 | 0 (0%) | 0 | 0 | 0 | 0 | static+db id=42 | — |
| HEARTSAVER | OK | 12 | 25 | 12 | 0 (0%) | 0 | 0 | 0 | 0 | static+db id=30 | — |

## Detail by course

### BLS — OK

- All checks passed.

### ACLS — OK

- All checks passed.

### PALS — OK

- All checks passed.

### NRP — OK

- All checks passed.

### HEARTSAVER — OK

- All checks passed.

## Prod verify (anchor course IDs)

| Course | courseId | diagnostic | summative | module formatives |
|--------|--------:|-----------:|----------:|------------------:|
| BLS | 32 | 12 | 25 | 16 |
| ACLS | 2 | 12 | 25 | 18 |
| PALS | 40 | 12 | 25 | 26 |
| NRP | 42 | 12 | 25 | 12 |
| HEARTSAVER | 30 | 12 | 25 | 12 |

PALS summative bank verified post PR #158/#160: 25 unique stems, PAT Q14 no answer leak, no duplicate Q2/Q19.

## Client/server grading (code audit)

- Summative delivery: `learning.getSummativeExamQuestions` shuffles and strips answers.
- Summative scoring: `learning.recordQuizAttempt` server-grades via `gradeSummativeAttempt`.
- Diagnostic: one-time baseline, no pass mark; not retakable.
