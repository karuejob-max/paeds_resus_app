# Fellowship assessment audit

**Generated:** 2026-06-06 · **Scope:** 29 fellowship pillar micro-courses

## Duplicate-repeat confirmation (Phase 1)

| Claim | Verdict | Evidence |
|-------|---------|----------|
| Same stem twice in one module formative | **FALSE** (post-fix seed) | Seed audit `within-quiz duplicate stems: 0`; prod `verify-fellowship-seed.ts` → `withinQuizDups=0` all 29 courses |
| Diagnostic vs summative 100% overlap | **TRUE** (pre-fix prod) | Prod query 2026-06-06: 29/29 courses, 431 overlapping stems (identical `bankQuestions` seeded to both) |
| Formative module A vs B same stem | **FALSE** | Static audit `cross-module formative duplicates: 0` |
| `expandQuestionBank` pads duplicates | **TRUE** (legacy prod DB) | Pre-reseed: meningitis-i/ii summative had 1 within-quiz dup each (old cycling); seed source now `allowDuplicates=false` |
| `padModuleFormativeQuestions` cycles dupes | **TRUE** (code path, not active content) | Removed cycling — returns `uniqueFormativeQuestions` only |
| Player retake without shuffle | **Partial** | Summative shuffles via `getSummativeExamQuestions`; formative/diagnostic fixed DB order (by design); server+client now dedupe by stem |
| Legacy orphan summative rows | **TRUE** (asthma-i pre-prune) | Prod had `summ=2` on some courses; `pruneOrphanExamQuizzes` on re-seed |

**Root cause layer:** **Seed + stale DB** (diagnostic/summative shared bank; legacy expand padding) with **code safety net** (player/server stem dedupe).

**Post-fix prod verify:** `29 courses, 0 failure(s)` · `withinQuizDups=0` · diagnostic↔summative overlap **5** per 15-stem bank (was 15).

## Executive summary (after remediation)

| Metric | Count |
|--------|------:|
| Courses audited | 29 |
| HIGH/CRITICAL severity | 22 |
| Bank-fallback courses | 0 |
| expandQuestionBank duplicate stems | 0 |
| Diagnostic↔summative overlaps (seed split) | 136 |
| Summative→formative overlaps | 17 |
| Cross-module formative duplicates | 0 |

## Per-course table

| Course | Mods | Diag | Form/mod | Sum auth | Sum uniq | Expand dup | Sum→Form | X-mod | Severity | Notes |
|--------|-----:|-----:|---------|--------:|---------:|-----------:|---------:|------:|----------|-------|
| aki-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| aki-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| anaemia-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| anaemia-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| anaphylaxis-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 1 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| anaphylaxis-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| burns-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| burns-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 6 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| cardiogenic-shock-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| cardiogenic-shock-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 5 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| hypovolemic-shock-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | 3 diagnostic↔summative stem overlap (seed split) |
| hypovolemic-shock-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 1 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| malaria-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| malaria-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 1 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| meningitis-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 1 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| meningitis-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| pneumonia-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| pneumonia-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 2 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| septic-shock-i | 3 | 8 | 3/3/3 | 8 | 8 | 0 | 0 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| septic-shock-ii | 3 | 8 | 3/3/3 | 8 | 8 | 0 | 0 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| trauma-i | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | 3 diagnostic↔summative stem overlap (seed split) |
| trauma-ii | 3 | 10 | 3/3/3 | 10 | 10 | 0 | 0 | 0 | HIGH | 5 diagnostic↔summative stem overlap (seed split) |
| asthma-i | 2 | 15 | 3/3 | 15 | 15 | 0 | 0 | 0 | LOW | 5 diagnostic↔summative stem overlap (seed split) |
| asthma-ii | 3 | 15 | 3/3/3 | 15 | 15 | 0 | 0 | 0 | LOW | 5 diagnostic↔summative stem overlap (seed split) |
| dka-i | 3 | 15 | 3/3/3 | 15 | 15 | 0 | 0 | 0 | LOW | 5 diagnostic↔summative stem overlap (seed split) |
| dka-ii | 3 | 15 | 3/3/3 | 15 | 15 | 0 | 0 | 0 | LOW | 5 diagnostic↔summative stem overlap (seed split) |
| status-epilepticus-i | 2 | 15 | 3/3 | 15 | 15 | 0 | 0 | 0 | LOW | 5 diagnostic↔summative stem overlap (seed split) |
| status-epilepticus-ii | 3 | 15 | 3/3/3 | 15 | 15 | 0 | 0 | 0 | LOW | 5 diagnostic↔summative stem overlap (seed split) |
| seriously-ill-child-i | 7 | 21 | 3/3/3/3/3/3/3 | 21 | 21 | 0 | 0 | 0 | OK | Separate seed — native formatives per module |