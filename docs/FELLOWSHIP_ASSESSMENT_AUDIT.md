# Fellowship assessment audit

**Generated:** 2026-06-17 · **Scope:** 29 fellowship pillar micro-courses

## Executive summary (after remediation)

| Metric | Count |
|--------|------:|
| Courses audited | 29 |
| HIGH/CRITICAL severity | 22 |
| Bank-fallback courses | 0 |
| expandQuestionBank duplicate stems | 0 |
| Diagnostic↔summative overlaps (seed split) | 0 |
| Summative→formative overlaps | 0 |
| Cross-module formative duplicates | 0 |
| Forbidden exam meta hints | 0 |

## Remediation (2026-06-06)

Replaced **17** duplicate authored summative stems in `quiz.questions` across 7 courses (anaphylaxis-i, pneumonia-ii, hypovolemic-shock-ii, cardiogenic-shock-ii, malaria-ii, burns-ii, meningitis-i) with course-wide unique stems. CI strict gate now fails on any `summFormOverlap > 0`; `verify-fellowship-seed.ts` asserts `summFormOverlap=0` per course.

## Per-course table

| Course | Mods | Diag | Form/mod | Sum auth | Sum uniq | Expand dup | Sum→Form | X-mod | Severity | Notes |
|--------|-----:|-----:|---------|--------:|---------:|-----------:|---------:|------:|----------|-------|
| aki-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| aki-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| anaemia-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| anaemia-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| anaphylaxis-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| anaphylaxis-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| burns-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| burns-ii | 3 | 12 | 3/3/3 | 12 | 12 | 0 | 0 | 0 | HIGH | Only 12 unique summative stems (need 15) |
| cardiogenic-shock-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| cardiogenic-shock-ii | 3 | 9 | 3/3/3 | 9 | 9 | 0 | 0 | 0 | HIGH | Only 9 unique summative stems (need 15) |
| hypovolemic-shock-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| hypovolemic-shock-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| malaria-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| malaria-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| meningitis-i | 3 | 11 | 3/3/3 | 11 | 11 | 0 | 0 | 0 | HIGH | Only 11 unique summative stems (need 15) |
| meningitis-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| pneumonia-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| pneumonia-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| septic-shock-i | 3 | 8 | 3/3/3 | 8 | 8 | 0 | 0 | 0 | HIGH | Only 8 unique summative stems (need 15) |
| septic-shock-ii | 3 | 8 | 3/3/3 | 8 | 8 | 0 | 0 | 0 | HIGH | Only 8 unique summative stems (need 15) |
| trauma-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| trauma-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| asthma-i | 3 | 16 | 3/3/3 | 16 | 16 | 0 | 0 | 0 | OK | — |
| asthma-ii | 3 | 15 | 3/3/3 | 15 | 15 | 0 | 0 | 0 | OK | — |
| dka-i | 3 | 15 | 3/3/3 | 15 | 15 | 0 | 0 | 0 | OK | — |
| dka-ii | 3 | 15 | 3/3/3 | 15 | 15 | 0 | 0 | 0 | OK | — |
| seriously-ill-child-i | 7 | 21 | 3/3/3/3/3/3/3 | 21 | 21 | 0 | 0 | 0 | OK | Separate seed — native formatives per module |
| status-epilepticus-i | 3 | 15 | 3/3/3 | 15 | 15 | 0 | 0 | 0 | OK | — |
| status-epilepticus-ii | 3 | 15 | 3/3/3 | 15 | 15 | 0 | 0 | 0 | OK | — |