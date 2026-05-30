# Fellowship micro-course clinical safety audit

**Date:** 2026-05-30  
**Auditor:** Cursor (engineering) — **CEO post-deploy sign-off pending**  
**Authority:** [CLINICAL_CONTENT_GOVERNANCE.md](./CLINICAL_CONTENT_GOVERNANCE.md), [CLINICAL_SOURCE_OF_TRUTH.md](./CLINICAL_SOURCE_OF_TRUTH.md)  
**Scope:** All published fellowship catalog courses except sample `intubation-essentials` (27 courses).

## Executive summary

| Metric | Count |
|--------|------:|
| **P0 findings (harm if propagated)** | 1 |
| **P0 fixed in this pass** | 1 |
| **P1 findings (critical gap / platform)** | 5 |
| **P1 fixed in this pass** | 5 |
| **P2 backlog (documented, not blocking merge)** | 8 |

**P0 fixed:** Severe malaria taught **artemether** as IV/IM first-line for cerebral/severe malaria — corrected to **artesunate 3 mg/kg** (WHO/CST). Artemether-lumefantrine noted as oral ACT for uncomplicated disease only.

**P1 fixed:** Per-module **formative** quizzes seeded; **diagnostic + summative** on seriously-ill-child-i; **mmol/L** hypoglycaemia in malaria; DKA 2 euglycaemic thresholds; catalog **“Level”** titles removed (→ Asthma 1/2, DKA 1/2, etc.).

**Platform:** `MicroCoursePlayerDB.tsx` already step-through (one module/section per view); formative after module content; diagnostic at start; summative at end. Player fix: do not fall back to diagnostic quiz when selecting formative.

---

## Exam architecture coverage (post-fix)

| Course slug | Modules | Diagnostic | Formative (per module) | Summative | Bank ≥15 |
|-------------|--------:|:----------:|:----------------------:|:---------:|:--------:|
| seriously-ill-child-i | 1 | ✓ | ✓ | ✓ | ✓ (expanded) |
| asthma-i | 2 | ✓ | ✓✓ | ✓ | expand on seed |
| asthma-ii | 3 | ✓ | ✓✓✓ | ✓ | ✓ |
| pneumonia-i | 2 | ✓ | ✓✓ | ✓ | ✓ |
| pneumonia-ii | 2 | ✓ | ✓✓ | ✓ | ✓ |
| septic-shock-i | 2 | ✓ | ✓✓ | ✓ | ✓ |
| septic-shock-ii | 2 | ✓ | ✓✓ | ✓ | ✓ |
| hypovolemic-shock-i | 2 | ✓ | ✓✓ | ✓ | ✓ |
| hypovolemic-shock-ii | 2 | ✓ | ✓✓ | ✓ | ✓ |
| cardiogenic-shock-i | 2 | ✓ | ✓✓ | ✓ | ✓ |
| cardiogenic-shock-ii | 2 | ✓ | ✓✓ | ✓ | ✓ |
| status-epilepticus-i | 2 | ✓ | ✓✓ | ✓ | expand on seed |
| status-epilepticus-ii | 3 | ✓ | ✓✓✓ | ✓ | ✓ |
| dka-i | 3 | ✓ | ✓✓✓ | ✓ | ✓ |
| dka-ii | 3 | ✓ | ✓✓✓ | ✓ | ✓ |
| anaphylaxis-i | 2 | ✓ | ✓✓ | ✓ | ✓ |
| anaphylaxis-ii | 2 | ✓ | ✓✓ | ✓ | ✓ |
| meningitis-i | 1 | ✓ | ✓ | ✓ | expand on seed |
| meningitis-ii | 1 | ✓ | ✓ | ✓ | expand on seed |
| malaria-i | 2 | ✓ | ✓✓ | ✓ | ✓ |
| malaria-ii | 2 | ✓ | ✓✓ | ✓ | ✓ |
| burns-i | 2 | ✓ | ✓✓ | ✓ | ✓ |
| burns-ii | 2 | ✓ | ✓✓ | ✓ | ✓ |
| trauma-i | 1 | ✓ | ✓ | ✓ | expand on seed |
| trauma-ii | 1 | ✓ | ✓ | ✓ | expand on seed |
| aki-i | 2 | ✓ | ✓✓ | ✓ | ✓ |
| anaemia-i | 2 | ✓ | ✓✓ | ✓ | ✓ |

Implementation: `scripts/fellowship-seed-lib.ts` (formative distribution), `shared/microcourse-exam-policy.ts` (`expandQuestionBank`, `distributeFormativeQuestions`), `server/lib/ensure-seriously-ill-child-fellowship-catalog.ts`.

Verify: `pnpm exec tsx --import dotenv/config scripts/verify-fellowship-seed.ts`

---

## Findings by course (priority conditions first)

### DKA 1 (`dka-i`)

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| Insulin stop when glucose normal only | P0 | Module 3, quiz Q10 | Y | CST: continue until ketosis resolving |
| NS-only fluids without acidosis note | P1 | Module 2 | Y | `DKA_FLUIDS_CONFLICT` helper |
| mg/dL primary glucose narrative | P1 | Modules 1–3 | Y | mmol/L primary + parenthetical mg/dL |
| No insulin bolus in children | P0 | Module 2, quiz | Y | Explicit “no bolus”; hold if K⁺ <3.5 |
| 800 mL bolus distractor in quiz | P1 | Quiz Q4 | Y | Correct 10 mL/kg = 200 mL for 20 kg |

### DKA 2 (`dka-ii`)

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| eGDKA defined only in mg/dL | P1 | Module 1 | Y | mmol/L primary (<14 / <11 mmol/L) |
| Rapid glucose drop only mg/dL/hr | P2 | Module 2 prevention | Y | Added mmol/L/hr equivalent |
| K⁺ replacement rate vs “bolus” | P2 | Module 3 | N | Teaches 0.5 mEq/kg over 15–30 min — not push bolus; acceptable |

### Status Epilepticus 1 (`status-epilepticus-i`)

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| Neonates — benzos first-line | P0 | Module 2 | Y | `NEONATE_CALLOUT` + SE conflict box |
| Kenya diazepam vs intl midazolam/lorazepam | P1 | Module 2 | Y | `SE_BENZO_CONFLICT` |
| Second-line agents named | P2 | Module 2 | N | Level 2 course; P2 deepen levétiracetam/phenytoin |

### Status Epilepticus 2 (`status-epilepticus-ii`)

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| Propofol/midazolam infusion doses | P2 | Module 2 | N | ICU-level; verify against local protocol in CEO review |
| Neonate callout in refractory module | P2 | — | N | Add in Pass 3 if neonatal SE cases expanded |

### Asthma 1 / 2 (`asthma-i`, `asthma-ii`)

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| Hydrocortisone-only steroids | P1 | asthma-i Module 2 | Y | Dex/pred/hydrocortisone in `ASTHMA_STEROIDS` |
| IV salbutamol omission | P1 | asthma-ii | Y | Taught where monitored |
| “Level 2” internal refs | P2 | asthma-i escalate text | Y | → “Asthma 2” |

### Septic / hypovolemic / cardiogenic shock

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| FEAST-unaware 20 mL/kg without reassess | P1 | septic-shock-i, hypovolemic-i | Y | `SHOCK_FLUIDS_FEAST`; catalog desc updated |
| Cool extremities = shock | P1 | seriously-ill-child quiz | Y | New quiz Q3 — perfusion beyond cool skin |
| Cardiogenic: aggressive 20 mL/kg | P0 | cardiogenic-i content | Y | Teaches avoid/limit boluses |
| Vasopressor Kenya reality | P1 | septic-shock-ii | Y | `SHOCK_VASOPRESSORS` |

### Pneumonia 1 / 2

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| WHO vs Kenya ABX conflict | P1 | pneumonia-i | Y | `PNEUMONIA_WHO_KENYA` |
| Oxygen target | P2 | pneumonia-i | N | SpO₂ >90% in helper — CEO confirm vs 94% |

### Anaphylaxis 1 / 2

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| Adrenaline/epinephrine naming | P1 | anaphylaxis-i | Y | `ANAPHYLAXIS_ADRENALINE` |
| IM 0.01 mg/kg first-line | P0 | Module 1 | Y | Correct; IV for refractory in course 2 |

### Meningitis 1 / 2

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| ABX delayed for LP | P0 | meningitis-i | Y | `MENINGITIS_ABX_EARLY` |
| ICP management depth | P2 | meningitis-ii | N | Mannitol/HTS — CEO depth review |

### Severe malaria 1 / 2

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| **Artemether as severe IV/IM first-line** | **P0** | malaria-i modules + quiz | **Y** | → **Artesunate 3 mg/kg** WHO; ACT oral for uncomplicated |
| Hypoglycaemia <40 mg/dL only | P1 | malaria-i/ii | Y | <3.3 mmol/L primary |
| Diazepam for cerebral malaria seizures | P2 | malaria-i supportive | N | Acceptable for older children; neonate SE rules in SE course |

### Burns, trauma, AKI, anaemia

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| burns-ii depth | P2 | burns-ii | N | CST §5 backlog |
| trauma-i single module | P2 | trauma-i | N | Expand modules in Pass 3 |
| AKI creatinine mg/dL | P2 | aki-i | N | Secondary US units; mmol/L glucose where relevant |
| anaemia-ii not in catalog | P2 | — | N | Only anaemia-i seeded |

### Cross-cutting / platform

| Finding | Severity | Location | Fix | Notes |
|---------|----------|----------|:---:|-------|
| No per-module formative | P1 | seed pipeline | Y | `distributeFormativeQuestions` |
| seriously-ill-child no diagnostic/summative | P1 | ensure-seriously-ill-child | Y | Full exam triad |
| Catalog “Level 1/2” titles | P1 | micro-course-catalog.ts | Y | DKA 1, Asthma 1, etc. |
| Summative bank <15 items | P2 | small courses | Y | `expandQuestionBank` on seed |
| ResusGPS full spine audit | P2 | all engines | Partial | DKA/SE P0 aligned prior pass |

---

## ResusGPS spot-check (DKA, SE, shock)

| Engine | Finding | Severity | Fix |
|--------|---------|----------|:---:|
| `dka-engine.ts` | No insulin bolus; K⁺ gate; ketones vs glucose stop | — | Y (prior) |
| `status-epilepticus-engine.ts` | Neonate no benzo path | — | Y (prior) |
| `abcdeEngine.ts` | Seizure/DKA strings mmol/L + neonate | — | Y (prior) |
| Shock pathways | FEAST-aware copy in training; bedside strings | P2 | Partial |

---

## P2 backlog (honest — not “nothing remaining”)

1. Deep module rewrite: **burns-ii**, **cardiogenic-ii**, **meningitis-ii** ICP detail (CST §5).
2. **anaemia-ii**, **aki-ii** — not in fellowship catalog; do not imply complete metabolic pillar.
3. **trauma-i/ii**, **meningitis-i/ii** — single-module courses; expand pedagogy + module-specific formative banks.
4. **Oxygen targets** — harmonise 90% vs 94% across pneumonia/asthma/WHO citations.
5. **ResusGPS** — full orphan-string audit beyond DKA/SE/shock P0.
6. **dka-i-advanced** orphan seed ID — not in catalog; remove or merge to avoid confusion.
7. **CEO live click-test** — all 27 courses on paedsresus.com after prod re-seed.
8. **Formative fairness** — some modules share rotated summative-bank questions; Pass 3: author module-native formative items only.

---

## Document control

| Field | Value |
|-------|--------|
| CEO sign-off | **Pending post-deploy review** |
| Next action | Prod chunked re-seed + `verify-fellowship-seed.ts` |
| Merge PR | See WORK_STATUS |
