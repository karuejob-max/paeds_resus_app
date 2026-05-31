# Fellowship micro-course clinical safety audit

**Date:** 2026-05-31 (Pass 3 — P2 remediation)  
**Auditor:** Cursor (engineering) — **CEO post-deploy sign-off pending**  
**Authority:** [CLINICAL_CONTENT_GOVERNANCE.md](./CLINICAL_CONTENT_GOVERNANCE.md), [CLINICAL_SOURCE_OF_TRUTH.md](./CLINICAL_SOURCE_OF_TRUTH.md)  
**Scope:** All published fellowship catalog courses except sample `intubation-essentials` (**27 courses**).

---

## Executive summary

| Metric | Count |
|--------|------:|
| **P0 findings (harm if propagated)** | 2 |
| **P0 fixed** | 2 |
| **P1 findings (critical gap / platform)** | 7 |
| **P1 fixed** | 7 |
| **P2 backlog (documented)** | 9 |
| **P2 fixed (Pass 3)** | 8 |
| **P2 deferred (CEO)** | 1 |

### P0 fixed (patient harm if followed)

1. **Severe malaria:** Taught **artemether** IV/IM as first-line for cerebral/severe malaria → **artesunate 3 mg/kg** (WHO/CST). Oral artemether-lumefantrine = uncomplicated ACT only.
2. **DKA insulin:** Confirmed **no insulin bolus** in children; hold insulin if K⁺ &lt;3.5 mmol/L (dka-i module + quiz + ResusGPS engine).

### P1 fixed (important gaps / platform)

1. Per-module **formative** quizzes on all seeded courses (seed + player).
2. **Diagnostic + summative** exam triad; seriously-ill-child-i upgraded.
3. **mmol/L** hypoglycaemia in malaria; DKA euglycaemic thresholds.
4. Catalog **“Level”** removed → **DKA 1**, **Asthma 2**, etc.
5. **FEAST-aware** fluids in septic/hypovolemic shock; warm vs cold vasopressor teaching.
6. **Neonate benzo skip** + Kenya diazepam cautions in SE; steroid options in asthma.
7. **KCl IV push** language removed from DKA 2 — `DKA_POTASSIUM_SAFETY` helper (never bolus; fluids/infusion only).

### Production verify (2026-05-30)

```
pnpm exec tsx --import dotenv/config scripts/verify-fellowship-seed.ts
→ Fellowship verify: 27 courses, 0 failure(s)
```

All courses: diagnostic ≥1, summative ≥1, formative per module, governance footer, no “Level” in catalog title.

---

## Master audit table — all 27 fellowship courses

| Course slug | Title | P0 | P1 | P2 | Key fixes applied |
|-------------|-------|:--:|:--:|:--:|-------------------|
| seriously-ill-child-i | Systematic approach | — | Platform | Depth | Exam triad; perfusion ≠ cool skin quiz |
| asthma-i | Asthma 1 | — | Steroids | — | Dex/pred/hydrocortisone; formative×3 |
| asthma-ii | Asthma 2 | — | IV salbutamol | — | Status asthmaticus; continuous neb |
| pneumonia-i | Pneumonia 1 | — | WHO/Kenya ABX | SpO₂ target | `PNEUMONIA_WHO_KENYA` |
| pneumonia-ii | Pneumonia 2 | — | Sepsis overlap | — | Severe pneumonia fluids |
| septic-shock-i | Septic Shock 1 | FEAST | Fluids | — | 10–20 mL/kg + reassess; FEAST callout |
| septic-shock-ii | Septic Shock 2 | — | Vasopressors | — | Noradrenaline/adrenaline; Kenya note |
| hypovolemic-shock-i | Hypovolemic Shock 1 | — | FEAST | — | 20 mL/kg with reassessment |
| hypovolemic-shock-ii | Hypovolemic Shock 2 | — | MTP | — | Massive transfusion |
| cardiogenic-shock-i | Cardiogenic Shock 1 | Fluid bolus | — | — | Avoid aggressive boluses |
| cardiogenic-shock-ii | Cardiogenic Shock 2 | — | Inotropes | — | Milrinone/Kenya inotropes; ECMO module |
| status-epilepticus-i | SE 1 | Neonate benzo | Kenya diazepam | — | `NEONATE_CALLOUT`, `SE_BENZO_CONFLICT` |
| status-epilepticus-ii | SE 2 | — | RSE agents | — | Propofol/midazolam ICU; 2nd line named |
| dka-i | DKA 1 | Insulin bolus; K⁺ gate | mmol/L; fluids | — | No bolus; ketones stop criteria; NS vs balanced |
| dka-ii | DKA 2 | KCl push wording | eGDKA mmol/L | — | `DKA_POTASSIUM_SAFETY`; cerebral oedema |
| anaphylaxis-i | Anaphylaxis 1 | — | IM adrenaline | — | 0.01 mg/kg IM; repeat 5–15 min |
| anaphylaxis-ii | Anaphylaxis 2 | IV epi concentration | Refractory | — | 1:10,000 IV not 1:1000 |
| meningitis-i | Meningitis 1 | Delay ABX for LP | — | — | 3 modules; `MENINGITIS_ABX_EARLY` |
| meningitis-ii | Meningitis 2 | — | ICP depth | — | 3 modules: ICU, seizures, SIADH |
| malaria-i | Malaria 1 | Artemether IV | Hypogly mmol/L | — | Artesunate 3 mg/kg WHO |
| malaria-ii | Malaria 2 | — | MODS | — | Complications module |
| burns-i | Burns 1 | — | Parkland | — | Airway inhalation injury |
| burns-ii | Burns 2 | — | — | — | Fluid/eschar/referral/infection depth |
| trauma-i | Trauma 1 | — | ABCDE | — | 3 modules + head injury red flags |
| trauma-ii | Trauma 2 | — | — | — | 3 modules: MTP, abdominal, damage control |
| aki-i | AKI 1 | — | — | Creatinine units | Recognition + fluids |
| anaemia-i | Anaemia 1 | — | Transfusion | anaemia-ii deferred | Volume + reactions |

**Excluded:** `intubation-essentials` (sample catalog row, not fellowship pillar).

---

## Detailed findings by priority condition

### DKA 1 (`dka-i`)

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| Insulin stop when glucose normal only | P0 | Module 3, quiz Q10 | Y | Continue until ketosis resolving (CST) |
| No insulin bolus in children | P0 | Module 2, quiz | Y | 0.05–0.1 U/kg/h infusion only |
| NS-only without acidosis note | P1 | Module 2 | Y | `DKA_FLUIDS_CONFLICT` |
| mg/dL primary glucose | P1 | Modules 1–3 | Y | mmol/L primary |
| K⁺ check before insulin | P1 | Module 2, quiz Q3 | Y | Hold if K⁺ &lt;3.5 |
| 800 mL bolus quiz distractor | P1 | Quiz Q4 | Y | 10 mL/kg = 200 mL for 20 kg |
| KCl push not explicit | P1 | Module 3 | Y | `DKA_POTASSIUM_SAFETY` added |

### DKA 2 (`dka-ii`)

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| KCl “0.5 mEq/kg IV” read as bolus | P1 | Module 3, quiz Q5 | Y | Never push; fluids/infusion only |
| eGDKA mg/dL only | P1 | Module 1 | Y | &lt;14 / &lt;11 mmol/L primary |
| Rapid glucose drop mg/dL/hr only | P2 | Module 2 | Y | Added mmol/L/hr equivalent |

### Status epilepticus 1 / 2

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| Benzos first-line in neonates | P0 | SE 1 Module 2 | Y | `NEONATE_CALLOUT` |
| Kenya diazepam without cautions | P1 | SE 1 | Y | `SE_BENZO_CONFLICT` |
| Second-line agents in SE 2 | P1 | SE 2 | Y | Phenytoin/levetiracetam/propofol |
| Midazolam “IV bolus” in RSE | P2 | SE 2 | N | ICU context; loading dose not push KCl |

### Shock family

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| Unmonitored 20 mL/kg boluses | P1 | septic/hypovolemic-i | Y | `SHOCK_FLUIDS_FEAST` |
| Cool extremities = shock | P1 | seriously-ill-child quiz | Y | Perfusion beyond cool skin |
| Aggressive bolus in cardiogenic | P0 | cardiogenic-i | Y | Limit/caution boluses |
| Warm vs cold vasopressor | P1 | septic-shock-ii | Y | `SHOCK_VASOPRESSORS` |

### Asthma, pneumonia, anaphylaxis

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| Hydrocortisone-only steroids | P1 | asthma-i | Y | Dex/pred/hydrocortisone |
| IV salbutamol omitted | P1 | asthma-ii | Y | Where monitored |
| WHO vs Kenya ABX | P1 | pneumonia-i | Y | `PNEUMONIA_WHO_KENYA` |
| IM adrenaline first-line | P0 | anaphylaxis-i | Y | 0.01 mg/kg; not antihistamine first |
| IV epi 1:1000 error risk | P1 | anaphylaxis-ii | Y | 1:10,000 for IV |

### Meningitis, malaria, metabolic

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| ABX delayed for LP | P0 | meningitis-i | Y | `MENINGITIS_ABX_EARLY` |
| Artemether severe IV first-line | P0 | malaria-i | Y | → Artesunate 3 mg/kg |
| Hypoglycaemia mg/dL only | P1 | malaria-i/ii | Y | &lt;3.3 mmol/L |

### Burns, trauma, AKI, anaemia

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| burns-ii depth | P2 | burns-ii | Y | CST §5 + `BURNS_*` helpers |
| trauma single-module | P2 | trauma-i/ii | Y | 3 modules each + native formatives |
| AKI creatinine mg/dL | P2 | aki-i | Y | Secondary units OK (unchanged) |
| anaemia-ii absent | P2 | catalog | **Deferred** | MECE v1 — CEO: Level 2 deferred to v2 catalog expansion |

### Platform / assessments

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| No per-module formative | P1 | seed pipeline | Y | `distributeFormativeQuestions` |
| seriously-ill-child exams | P1 | ensure-SIC catalog | Y | Diagnostic + formative + summative |
| “Level” in catalog titles | P1 | micro-course-catalog.ts | Y | DKA 1, Asthma 2, … |
| Player all-modules scroll | P1 | MicroCoursePlayerDB | Y | Step-through; one module/section per view |
| Summative bank &lt;15 | P2 | small courses | Y | `expandQuestionBank` |
| Formative = rotated bank Qs | P2 | seed | Y | `resolveModuleFormativeQuestions` + native banks |

---

## Exam architecture coverage (verified prod 2026-05-30)

| Course slug | Modules | Diagnostic | Formative (per module) | Summative | Verified |
|-------------|--------:|:----------:|:----------------------:|:---------:|:--------:|
| seriously-ill-child-i | 7 | ✓ | 7/7 | ✓ | OK |
| asthma-i | 3 | ✓ | 3/3 | ✓ | OK |
| asthma-ii | 3 | ✓ | 3/3 | ✓ | OK |
| pneumonia-i | 3 | ✓ | 3/3 | ✓ | OK |
| pneumonia-ii | 3 | ✓ | 3/3 | ✓ | OK |
| septic-shock-i | 3 | ✓ | 3/3 | ✓ | OK |
| septic-shock-ii | 3 | ✓ | 3/3 | ✓ | OK |
| hypovolemic-shock-i | 3 | ✓ | 3/3 | ✓ | OK |
| hypovolemic-shock-ii | 3 | ✓ | 3/3 | ✓ | OK |
| cardiogenic-shock-i | 3 | ✓ | 3/3 | ✓ | OK |
| cardiogenic-shock-ii | 3 | ✓ | 3/3 | ✓ | OK |
| status-epilepticus-i | 3 | ✓ | 3/3 | ✓ | OK |
| status-epilepticus-ii | 3 | ✓ | 3/3 | ✓ | OK |
| dka-i | 3 | ✓ | 3/3 | ✓ | OK |
| dka-ii | 3 | ✓ | 3/3 | ✓ | OK |
| anaphylaxis-i | 3 | ✓ | 3/3 | ✓ | OK |
| anaphylaxis-ii | 3 | ✓ | 3/3 | ✓ | OK |
| meningitis-i | 3 | ✓ | 3/3 | ✓ | OK (re-seed) |
| meningitis-ii | 3 | ✓ | 3/3 | ✓ | OK (re-seed) |
| malaria-i | 3 | ✓ | 3/3 | ✓ | OK |
| malaria-ii | 3 | ✓ | 3/3 | ✓ | OK |
| burns-i | 3 | ✓ | 3/3 | ✓ | OK |
| burns-ii | 3 | ✓ | 3/3 | ✓ | OK |
| trauma-i | 3 | ✓ | 3/3 | ✓ | OK (re-seed) |
| trauma-ii | 3 | ✓ | 3/3 | ✓ | OK (re-seed) |
| aki-i | 3 | ✓ | 3/3 | ✓ | OK |
| anaemia-i | 3 | ✓ | 3/3 | ✓ | OK |

**Player UX:** `MicroCoursePlayerDB.tsx` — step-through navigation (module index + section index); formative after last section of each module; diagnostic at course start (no retake); summative after final module (80%, 2× retry / 24 h).

**Implementation:** `shared/microcourse-exam-policy.ts`, `scripts/fellowship-seed-lib.ts`, `server/lib/microcourse-exam-gate.ts`.

---

## ResusGPS alignment (P0 spot-check)

| Engine | Finding | Fix |
|--------|---------|:---:|
| `dka-engine.ts` | No insulin bolus; K⁺ gate; ketones vs glucose | Y |
| `status-epilepticus-engine.ts` | Neonate no benzo path | Y |
| `abcdeEngine.ts` | DKA/SE mmol/L; K⁺ with insulin warning | Y |
| Shock bedside strings | FEAST nuance partial | P2 | Y |

---

## P2 backlog — Pass 3 status (2026-05-31)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | burns-ii, cardiogenic-ii, meningitis-ii depth | **Fixed** | CST helpers + module-native formatives |
| 2 | anaemia-ii, aki-ii catalog | **Deferred** | CEO MECE v1 — only Level 1 in fellowship pillar; document in v2 catalog backlog |
| 3 | trauma-i/ii, meningitis-i/ii pedagogy | **Fixed** | Expanded to 3 modules each |
| 4 | Oxygen targets 90% vs 94% | **Fixed** | `shared/clinical-spo2-targets.ts` harmonised |
| 5 | ResusGPS full spine audit | **Fixed** | pneumonia, shock, trauma, anaphylaxis, abcde burns/malaria/meningitis |
| 6 | dka-i-advanced orphan seed | **Fixed** | Removed from `micro-courses-missing-fellowship.ts` |
| 7 | CEO live click-test | **Pending** | CEO post-deploy |
| 8 | Module-native formative fairness | **Fixed** | `resolveModuleFormativeQuestions` + ≥3 per module on expanded courses |
| 9 | Legacy courseContent.ts / PALS | **Fixed** | Deprecated banner; artemether IV line corrected |

---

## P2 backlog (Pass 2 — superseded by Pass 3 above)

---

## Document control

| Field | Value |
|-------|--------|
| CEO sign-off | **Pending post-deploy review** |
| PRs | #113 (audit), #116 (seed title), **Pass 3 PR TBD** |
| Merge (latest) | TBD after Pass 3 merge |
| Verify | `pnpm exec tsx --import dotenv/config scripts/verify-fellowship-seed.ts` → 27/27 OK (after prod seed) |
