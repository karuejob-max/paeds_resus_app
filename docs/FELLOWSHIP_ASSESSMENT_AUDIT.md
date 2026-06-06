# Fellowship assessment audit

**Generated:** 2026-06-06 · **Scope:** 29 fellowship pillar micro-courses

## Post-remediation status (2026-06-06, PR #176)

- **Module-native formatives:** 29/29 pass static audit (`Courses needing formative depth work: 0/29`). Prior NO_NATIVE debt (20 courses) cleared.
- **Prod verify:** `verify-fellowship-seed.ts` → **29 courses, 0 failures**; all `thinFormative=0`; all `summQs≥15` on prod DB (host `public-*.aivencloud.com`).
- **Seed policy:** `bankFallbackCount=0`, `expandQuestionBank` duplicate stems = 0.
- **Summative authored stems:** 22 courses still have &lt;15 unique stems in course source files; `fellowship-summative-expansions.ts` supplies additional unique stems at seed (not bank fallback). **Remaining P2:** fold expansions into authored `quiz.questions` over time.
- **Summative→formative overlap:** 17 stems (acceptable where context differs; no formative bank fallback).

## Executive summary (after remediation)

| Metric | Count |
|--------|------:|
| Courses audited | 29 |
| HIGH/CRITICAL severity | 22 |
| Bank-fallback courses | 0 |
| expandQuestionBank duplicate stems | 0 |
| Summative→formative overlaps | 17 |
| Cross-module formative duplicates | 0 |

## Per-course table

| Course | Mods | Diag | Form/mod | Sum auth | Sum uniq | Expand dup | Sum→Form | X-mod | Severity | Notes |
|--------|-----:|-----:|---------|--------:|---------:|-----------:|---------:|------:|----------|-------|
| aki-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| aki-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| anaemia-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| anaemia-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| anaphylaxis-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 1 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| anaphylaxis-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| burns-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| burns-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 6 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| cardiogenic-shock-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| cardiogenic-shock-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 5 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| hypovolemic-shock-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| hypovolemic-shock-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 1 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| malaria-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| malaria-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 1 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| meningitis-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 1 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| meningitis-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| pneumonia-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| pneumonia-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 2 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| septic-shock-i | 3 | 8 | 3/3/3 | 8 | 8 | 0 | 0 | 0 | HIGH | Only 8 unique summative stems (need 15) |
| septic-shock-ii | 3 | 8 | 3/3/3 | 8 | 8 | 0 | 0 | 0 | HIGH | Only 8 unique summative stems (need 15) |
| trauma-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| trauma-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | Only 10 unique summative stems (need 15) |
| asthma-i | 2 | 15 | 3/3 | 15 | 15 | 0 | 0 | 0 | OK | — |
| asthma-ii | 3 | 15 | 3/3/3 | 15 | 15 | 0 | 0 | 0 | OK | — |
| dka-i | 3 | 15 | 3/3/3 | 15 | 15 | 0 | 0 | 0 | OK | — |
| dka-ii | 3 | 15 | 3/3/3 | 15 | 15 | 0 | 0 | 0 | OK | — |
| seriously-ill-child-i | 7 | 21 | 3/3/3/3/3/3/3 | 21 | 21 | 0 | 0 | 0 | OK | Separate seed — native formatives per module |
| status-epilepticus-i | 2 | 15 | 3/3 | 15 | 15 | 0 | 0 | 0 | OK | — |
| status-epilepticus-ii | 3 | 15 | 3/3/3 | 15 | 15 | 0 | 0 | 0 | OK | — |