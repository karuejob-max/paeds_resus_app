# Agent-discovered gaps (independent audit)

**Date:** 2026-05-31  
**Auditor:** Cursor (holistic codebase review — not a restatement of prior gap docs)  
**Scope:** Fellowship catalog/seed/DB, MicroCoursePlayer, ResusGPS, clinical content samples, ops, tests, CEO handoff

---

## Phase 1 — DISCOVER (findings by severity)

### P0 — Patient harm / learner trust (engineering-fixable)

| # | Gap | Evidence | Recommended fix |
|---|-----|----------|---------------|
| 1 | **Summative exam not shuffled; answers leaked** | UI copy promises shuffle (`MicroCoursePlayerDB.tsx`); player loaded summative via `getModuleContent` in fixed order with `correctAnswer` in payload. `getSummativeExamQuestions` existed but was **never called**. Client also sent self-reported scores. | **Fixed this session:** wire `getSummativeExamQuestions`, strip summative `correctAnswer` from `getModuleContent`, server-grade summative in `recordQuizAttempt`. |
| 2 | **Fresh-deploy catalog drift (`initialize.ts`)** | Legacy `COURSES` array: wrong prices (800/1200 KES vs 200 KES), stale titles, **septic-shock-i "20 mL/kg bolus"** (FEAST-unaware), malaria "artemisinin", missing `seriously-ill-child-i` / MECE v2 slugs. Runs only on empty DB but poisons new environments before `ensureMicroCoursesCatalog`. | **Fixed:** `initializeDatabase` delegates to `ensureMicroCoursesCatalog()` + `MICRO_COURSE_CATALOG`. |

### P1 — Operational reliability / fellowship completeness

| # | Gap | Evidence | Recommended fix |
|---|-----|----------|---------------|
| 3 | **`aki-ii` / `anaemia-ii` code complete, prod DB not** | Catalog + `micro-courses-metabolic-ii.ts` authored on branch; prod verify still **27/0** (2026-05-31). Learners see catalog row but empty/wrong content until `seed:fellowship-content:metabolic`. | **Fixed 2026-05-31:** MECE v2 merged (#121); metabolic + full batch re-seed; prod verify **29/0**, `thinFormative=0` all courses. |
| 4 | **Verify script blind to exam quality** | `verify-fellowship-seed.ts` counted formative quiz rows, not bank size or duplicate formatives. | **Extended:** summative bank ≥15 (`summQs`), `thinFormative` metric; static audit script `scripts/audit-fellowship-seed-static.ts`. |
| 5 | **No summative exam analytics server-side** | Client fired `micro_course` complete event; summative pass/fail attempts not tracked in `analyticsEvents` from server. | **Fixed:** `trackEvent` on summative attempts in `recordQuizAttempt`. |

### P2 — Clinical depth / parity (honest backlog)

| # | Gap | Evidence | Recommended fix |
|---|-----|----------|---------------|
| 6 | **~18 courses use summative-bank formative fallback** | Static audit: `burns-i`, `pneumonia-i`, `asthma-i`, most batch-1 courses have **zero** module-native `questions[]`; seed uses `resolveModuleFormativeQuestions` bank chunks → duplicate/rotated items. | **Fixed:** `materializeModuleNativeFormatives()` in seed pipeline + static audit exits non-zero on `BANK_FALLBACK`; asthma-i/SE-i bank expanded. |
| 7 | **ResusGPS SpO₂ targets inconsistent** | `shared/clinical-spo2-targets.ts` harmonised engines; legacy `pathways/breathing.ts`, `upper-airway-engine.ts` still use ad-hoc 92%/94% strings. | **Fixed:** `breathing.ts`, `shock.ts`, `seizure.ts`, `metabolic.ts`, `upper-airway-engine.ts` use `@shared/clinical-spo2-targets`. |
| 8 | **Title-match fragility fellowship player** | `fellowshipDbCourse` matches `microCourses.title === courses.title`. Any catalog/seed title drift → "Content Not Found". | **Fixed:** `MicroCoursePlayerDB` matches fellowship `courses.order` to catalog `order`, title fallback. |
| 9 | **AHA legacy `courseContent.ts` still in repo** | Deprecated but present; risk of wrong clinical leaking if re-wired. Fellowship uses DB seed — separate path — but grep shows artemether strings in legacy file. | Keep deprecated banner; delete or quarantine in follow-up PR. |

### P3 — Product completeness (not fellowship-blocking)

| # | Gap | Evidence |
|---|-----|----------|
| 10 | **CEO handoff checklist = theater without live click-test** | `MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md` 13 items; WORK_STATUS still "CEO sign-off: pending". DB verify ≠ browser verify. |
| 11 | **`fellowTitleEnabled: false`** | Correct gate; §11 checklist incomplete — intentional. |
| 12 | **Auto-seed on deploy** | **Fixed:** `scripts/start-production.mjs` + `run-fellowship-auto-seed.mjs` on Render prod; verify failure blocks deploy. Staging: `AUTO_SEED_FELLOWSHIP_ON_START=false`. |
| 13 | **M-Pesa / legal counsel** | Engineering baseline shipped; counsel sign-off CEO-only (~95% per WORK_STATUS). |

---

## Phase 2 — DESIGN (this session priorities)

**Ship order (harm × distance):**

1. Summative exam integrity (shuffle + server grade + no answer leak) — **learner trust**
2. MECE v2 merge + prod metabolic seed — **catalog completeness**
3. Initialize/catalog single source — **ops reliability on fresh DB**
4. Verify + static audit extensions — **seed drift detection**

**Deferred (needs content sprint, not one session):**

- Module-native formatives for all bank-fallback courses
- Full ResusGPS pathway SpO₂ harmonisation
- CEO live click-test (CEO-only)

---

## Phase 3 — DELIVER (this session)

| Item | Status |
|------|--------|
| MECE v2 `aki-ii` / `anaemia-ii` seed content | Authored on branch (pre-merge) |
| Summative shuffle + server grading + analytics | **Implemented** |
| `initialize.ts` → catalog ensure | **Implemented** |
| `verify-fellowship-seed.ts` summQs + thinFormative | **Implemented** |
| `scripts/audit-fellowship-seed-static.ts` | **Added** |
| Prod metabolic seed + full re-seed | **Done** — agent env; verify **29 courses, 0 failure(s)**; all `thinFormative=0` |
| `materializeModuleNativeFormatives` + verify depth gate | **Done** |
| SpO₂ pathway harmonisation + player order match | **Done** |
| Summative grading/shuffle unit tests | **Done** — `microcourse-summative-grading.test.ts` |
| CEO click-test | **Still pending** (CEO-only) |

## Platform safety B1–B14 (2026-05-31)

| Item | Status |
|------|--------|
| Foundational / Advanced naming (Part A) | **Fixed** — `shared/micro-course-display.ts`, catalog titles |
| B1 content version footer | **Fixed** |
| B2 certificate competence disclaimer + track | **Fixed** |
| B3 LMIC resource callouts | **Fixed** — seed pipeline |
| B4 report unsafe content | **Fixed** — migration 0047 + tRPC |
| B5 clinical lint in CI | **Fixed** — `lint:clinical` in `check` |
| B6 prerequisite enforcement | **Fixed** — server + UI |
| B7 ResusGPS seriously-ill-child + banners | **Fixed** |
| B8–B10 depth badges, AHA separation, ward checklists | **Fixed** |
| B11 `docs/PLATFORM_SAFETY_GAPS.md` | **Added** |
| B12–B14 catalog copy, analytics, auto-seed | **Fixed** / documented |

---

## Static audit command (no DB)

```bash
pnpm exec tsx scripts/audit-fellowship-seed-static.ts
```

## Prod verify (after seed)

```bash
pnpm exec tsx scripts/verify-fellowship-seed.ts
# Target: Fellowship verify: 29 courses, 0 failure(s)
```

---

## Document control

| Field | Value |
|-------|--------|
| Next update | After MECE v2 merge + prod 29/0 verify + CEO click-test |
| Supersedes | Partial overlap with FELLOWSHIP_WHAT_IS_MISSING.md — this doc adds **independent** engineering findings (exam integrity, initialize drift, static formative audit) |
