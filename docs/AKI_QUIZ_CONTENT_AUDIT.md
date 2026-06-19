# AKI Advanced Quiz Content Audit

**Date:** 2026-06-19  
**Status:** Investigation Complete — No Issues Found  
**Scope:** AKI Advanced (aki-ii) course quiz content verification + Intubation Essentials status check

---

## Executive Summary

Investigation of reported issues in the AKI Advanced fellowship micro-course found **no evidence of wrong content** (anaemia questions, ACLS/PALS/BLS content) in the current codebase. All quiz questions are clinically appropriate and AKI-specific. Intubation Essentials exists as a sample (non-pillar) course with no seed content defined.

---

## 1. AKI Advanced (aki-ii) Course Content Audit

### 1.1 Course Definition Location
- **File:** `server/data/micro-courses-metabolic-ii.ts`
- **Course ID:** `acute-kidney-injury-ii`
- **Catalog Slug:** `aki-ii`
- **Level:** Advanced
- **Prerequisite:** `aki-i`
- **Duration:** 60 minutes
- **Price:** 1200

### 1.2 Module Quizzes (Formative)

#### Module 1: Fluid Balance & Daily Prescription (3 questions)
1. **Q:** "A child with oliguric AKI and pulmonary crackles should receive:"
   - **Options:** 20 mL/kg bolus | Fluid restriction to insensible + urine output | Free water only | High-dose NSAIDs
   - **Correct:** Fluid restriction (option 1)
   - **Topic:** AKI-specific ✅

2. **Q:** "Which drug should be held or dose-adjusted first in AKI?"
   - **Options:** Paracetamol | NSAIDs | Vitamin C | Oxygen
   - **Correct:** NSAIDs (option 1)
   - **Topic:** AKI nephrotoxin avoidance ✅

3. **Q:** "Daily fluid prescription in euvolemic oliguric AKI is best based on:"
   - **Options:** Maintenance × 2 | Insensible losses + measured urine output | Ad lib fluids | Only oral intake
   - **Correct:** Insensible + urine output (option 1)
   - **Topic:** AKI-specific ✅

#### Module 2: Potassium, Phosphate & Acid–Base (3 questions)
1. **Q:** "First intervention for K⁺ 7.2 mmol/L with widened QRS in AKI:"
   - **Options:** KCl IV push | Calcium gluconate IV | Oral potassium | Large fluid bolus
   - **Correct:** Calcium gluconate (option 1)
   - **Topic:** AKI hyperkalaemia emergency ✅

2. **Q:** "Hyperphosphataemia in AKI is especially concerning because it:"
   - **Options:** Lowers potassium | Binds calcium and worsens arrhythmia risk | Causes hypernatraemia | Improves urine output
   - **Correct:** Binds calcium (option 1)
   - **Topic:** AKI electrolyte complications ✅

3. **Q:** "Hyponatraemia in oliguric AKI is usually managed by:"
   - **Options:** 3% saline bolus | Hypertonic fluids freely | Fluid restriction — avoid hypotonic fluids | High sodium diet only
   - **Correct:** Fluid restriction (option 2)
   - **Topic:** AKI-specific ✅

#### Module 3: RRT Indications & LMIC Pathways (3 questions)
1. **Q:** "AEIOU for dialysis includes all EXCEPT:"
   - **Options:** Acidosis refractory | Electrolyte emergency (K⁺) | Overload unresponsive | Normal urine output
   - **Correct:** Normal urine output (option 3)
   - **Topic:** AKI RRT indications ✅

2. **Q:** "Peritoneal dialysis in paediatric AKI is best described as:"
   - **Options:** Always first-line over HD | LMIC option when HD unavailable | Contraindicated in children | Replaces fluid resuscitation
   - **Correct:** LMIC option (option 1)
   - **Topic:** AKI RRT modality ✅

3. **Q:** "A child with 12% weight gain, oliguria, and crackles needs:"
   - **Options:** More crystalloid boluses | RRT or urgent diuresis discussion | High potassium fluids | NSAIDs
   - **Correct:** RRT/diuresis discussion (option 1)
   - **Topic:** AKI fluid overload management ✅

**Module formative total:** 9 questions, all AKI-specific ✅

### 1.3 Summative Quiz (10 questions)

1. **Q:** "KDIGO Stage 3 AKI includes:"
   - **Topic:** AKI classification ✅

2. **Q:** "In hypervolemic AKI the priority is:"
   - **Topic:** AKI fluid management ✅

3. **Q:** "K⁺ 6.8 mmol/L with peaked T waves — after calcium, next step:"
   - **Topic:** AKI hyperkalaemia management ✅

4. **Q:** "Nephrotoxic drugs to avoid in AKI include:"
   - **Topic:** AKI nephrotoxin avoidance ✅

5. **Q:** "Peritoneal dialysis is taught as:"
   - **Topic:** AKI RRT modality ✅

6. **Q:** "Hyperphosphataemia management includes:"
   - **Topic:** AKI electrolyte management ✅

7. **Q:** "Prerenal AKI usually improves with:"
   - **Topic:** AKI pathophysiology ✅

8. **Q:** "RRT indication — refractory metabolic acidosis means pH:"
   - **Topic:** AKI RRT indications ✅

9. **Q:** "Daily monitoring in AKI must include:"
   - **Topic:** AKI clinical monitoring ✅

10. **Q:** "HUS with anuria and rising creatinine requires:"
    - **Topic:** AKI in HUS ✅

**Summative total:** 10 questions, all AKI-specific ✅

### 1.4 Summative Expansion Questions (5 questions from `fellowship-summative-expansions.ts`)

1. **Q:** "Indication for RRT in AKI (AEIOU) includes:"
   - **Topic:** AKI RRT criteria ✅

2. **Q:** "Peritoneal dialysis in LMIC may be used when:"
   - **Topic:** AKI RRT LMIC context ✅

3. **Q:** "Hyperkalaemia ECG changes include:"
   - **Topic:** AKI hyperkalaemia ✅

4. **Q:** "HUS after diarrhoeal illness causes AKI by:"
   - **Topic:** AKI in HUS ✅

5. **Q:** "Contrast-induced AKI prevention includes:"
   - **Topic:** AKI prevention ✅

**Expansion total:** 5 questions, all AKI-specific ✅

### 1.5 Diagnostic Quiz

- **Source:** Generated automatically from summative bank via `resolveExamQuestionBanks()` in `shared/microcourse-exam-policy.ts`
- **Mechanism:** First 5 questions from unique summative pool become diagnostic baseline quiz
- **Expected content:** AKI-specific (drawn from summative bank) ✅
- **No separate diagnostic quiz defined** — all questions inherit from summative

### 1.6 Content Verification Summary

| Category | Count | Status | Issues |
|----------|-------|--------|--------|
| Module 1 formatives | 3 | ✅ AKI-specific | None |
| Module 2 formatives | 3 | ✅ AKI-specific | None |
| Module 3 formatives | 3 | ✅ AKI-specific | None |
| Summative quiz | 10 | ✅ AKI-specific | None |
| Summative expansion | 5 | ✅ AKI-specific | None |
| **Total questions** | **24** | **✅ All AKI** | **None found** |

**Anaemia content in AKI-II:** ❌ None detected  
**ACLS/PALS/BLS content in AKI-II:** ❌ None detected

---

## 2. Intubation Essentials Status

### 2.1 Catalog Entry
- **File:** `shared/micro-course-catalog.ts` (lines 75–87)
- **Course ID:** `intubation-essentials`
- **Title:** "Intubation Essentials (Sample): Preparation to Post-Intubation Care"
- **Level:** Advanced
- **Duration:** 60 minutes
- **Order:** 29 (last in catalog)
- **Published:** Yes
- **Sample flag:** `isSample: true`

### 2.2 Fellowship Pillar Status
- **Part of Fellowship Pillar A?** ❌ **No** — marked `isSample: true`
- **Excluded from required 29 courses?** ✅ **Yes** — `isFellowshipPillarMicroCourse()` filters out samples
- **Seed content defined?** ❌ **No** — not found in any `micro-courses-*.ts` file

### 2.3 Purpose & Context
- **Type:** Procedural sample course (not condition-based)
- **Scope:** Preparation, first-pass attempt, tube confirmation, post-intubation stabilization
- **Note:** Intubation is mentioned in multiple courses (asthma, anaphylaxis, meningitis, status epilepticus) as an escalation step, but Intubation Essentials is a standalone procedural sample

### 2.4 Recommendation
**Status:** Course exists as a sample/demo. No action required unless:
1. CEO wants to convert it to a fellowship-required course (requires seed content creation)
2. CEO wants to remove it from the catalog
3. CEO wants to populate it with procedural content

---

## 3. Clinical Governance Alignment

### 3.1 AKI-II Content Governance
- ✅ Aligned with `FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md` §4 (Pillar A completion)
- ✅ Aligned with `AGENTS.md` §8 (Fellowship clinical rigor)
- ✅ Aligned with `shared/fellowship-clinical-rigor.ts` (AKI clinical evidence fields)
- ✅ Aligned with `CLINICAL_CONTENT_GOVERNANCE.md` (no patient identifiers, structured fields)
- ✅ Compliant with AGENTS.md §3.3 (no ACLS/PALS/BLS in fellowship path)

### 3.2 Audit Verification
- ✅ `pnpm run check` passed (all audits green)
- ✅ `audit:fellowship-assessments:strict` — 22 critical items (expected), 0 duplicates, 0 overlaps
- ✅ `audit:microcourse-depth:strict` — 29/29 courses pass depth gate
- ✅ `audit:fellowship-simulations:strict` — 29/29 simulations pass

---

## 4. Conclusion

**Finding:** No issues detected in AKI Advanced quiz content. All 24 questions are clinically appropriate, AKI-specific, and aligned with fellowship governance.

**Intubation Essentials:** Exists as a sample (non-pillar) procedural course with no seed content. Not required for fellowship qualification.

**Recommendation:** 
1. If the CEO's report refers to a specific historical state, confirm whether it has already been resolved.
2. If issues exist in a different course or context, provide the specific course ID and quiz title for targeted investigation.
3. If Intubation Essentials should become a fellowship course, create seed content and remove `isSample: true` flag.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | Initial audit — no issues found in AKI-II; Intubation Essentials confirmed as sample course |
