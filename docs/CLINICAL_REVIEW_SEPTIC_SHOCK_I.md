# Clinical review — Paediatric Septic Shock I

**Document type:** Clinical governance checklist (conservative review)  
**Version:** 1.0  
**Date:** 2026-05-27  
**Clinical owner:** Job Karue (CEO / PICU Nurse / ERT Chair)  
**Reviewer (engineering):** Cursor agent (copy/link/disclaimer pass only — no pathway logic changes)

**Scope:** Septic Shock I micro-course, Seriously Ill Child fellowship catalog, ResusGPS septic shock pathway, holistic loop cross-links (`/resus`, Care Signal, post-case prompt).

**Out of scope (CEO approval required before merge):** Drug dose changes, bolus volume defaults, antibiotic choice, FEAST interpretation changes, new clinical claims.

---

## 1. Content sources reviewed

| Asset | Location | Notes |
|-------|----------|-------|
| Micro-course catalog | `server/lib/micro-course-catalog.ts` — `septic-shock-i` | Published; 45 min foundational |
| Septic shock HTML seed | `server/lib/ensure-paediatric-septic-shock-catalog.ts` | FEAST caution language present |
| Seriously ill child course | `server/lib/ensure-seriously-ill-child-fellowship-catalog.ts` | Prerequisite context for systematic approach |
| ResusGPS shock pathway | `client/src/lib/resus/pathways/shock.ts` | Fever → septic_shock sub-pathway |
| ResusGPS condition protocol | `client/src/lib/resus/conditionProtocols.ts` — `buildSepticShockProtocol` | Phased steps, FEAST in references |
| Septic shock engine | `client/src/lib/resus/septic-shock-engine.ts` | Severity assessment helpers |
| Clinical protocol doc | `docs/clinical-protocols/paediatric-septic-shock.md` (registry reference in shock.ts) | Keep in sync per RESUSGPS_REGISTRY |
| Course player page | `client/src/pages/CoursePaediatricSepticShock.tsx` | `/resus` cross-links |
| Post-case loop | `client/src/components/CareSignalPostEventPrompt.tsx` | Septic Shock I link after save |
| Care Signal prefill | `client/src/components/CareSignalFormV2.tsx` | `septic_shock` mapping |

---

## 2. Disclaimer alignment (PSOT / ClinicalUseDisclaimer)

| Surface | Expected language | Status |
|---------|-------------------|--------|
| ResusGPS bedside | Reference support; not substitute for local protocols | ✅ `ClinicalUseDisclaimer.tsx` |
| Terms | Not medical advice | ✅ `TermsOfUse.tsx` |
| Septic Shock course | Follow facility protocols; ResusGPS = live support | ✅ `CoursePaediatricSepticShock.tsx` |
| Care Signal post-prompt | De-identified from **patients**; aggregated QI (not "anonymous to platform") | ✅ Updated 2026-05-27 |
| Care Signal consent | QI + fellowship + aggregated surveillance | ✅ `CareSignalConsentGate.tsx` |

---

## 3. Cross-link checklist

| Link | From | To | Status |
|------|------|-----|--------|
| Course → ResusGPS | Septic Shock course header | `/resus` | ✅ Present |
| ResusGPS → course | Post-case prompt (septic cases) | `/micro-course/septic-shock-i` | ✅ Present |
| ResusGPS → Care Signal | Post-case prompt | `/care-signal?prefill_*` | ✅ Present |
| Fellowship dashboard | Micro-course routes | `septic-shock-i` catalog id | ✅ Catalog-driven |
| PALS legacy SKU | `pals_septic` vs `septic-shock-i` | Two enrollment paths — document for learners | ⚠️ CEO note: consider UX consolidation later |

---

## 4. Copy / consistency findings

### Safe (addressed in this review)

- Care Signal post-case prompt used "anonymous and confidential" — **corrected** to align with consent gate (no patient identifiers; provider-linked QI records).
- Removed unsupportable claim "no other system in Kenya is collecting" from post-case prompt — replaced with process-oriented QI language.

### Flagged for CEO clinical approval (NOT changed in code)

| # | Finding | Risk | Recommendation |
|---|---------|------|----------------|
| C1 | ResusGPS shock pathway uses **20 mL/kg 0.9% NS** bolus language; course seed emphasises **small boluses + reassessment (FEAST)** | Apparent tension between bedside default and teaching caution | CEO decide: harmonise pathway copy with FEAST-aware reassessment gates |
| C2 | Pathway antibiotic default **Ceftriaxone 80 mg/kg**; local Kenya MOH/WHO empiric regimens may differ | Guideline drift | Add facility-protocol override messaging or link to local AMR guidance |
| C3 | `CoursePaediatricSepticShock.tsx` title "Paediatric septic shock" vs catalog "Paediatric Septic Shock I" | Branding only | Optional rename for consistency |
| C4 | Dual course IDs (`pals_septic` legacy vs `septic-shock-i` fellowship) | Learner confusion | Product decision — not legal/clinical safety blocker |

---

## 5. ResusGPS pathway clinical notes (read-only summary)

**Recognition path:** Shock/poor perfusion → fever YES → `septic_shock` sub-pathway.

**Key bedside steps (pathway):** High-flow O₂ → IV/IO access → 20 mL/kg NS bolus (repeat up to 60 mL/kg/h with reassessment) → antibiotics within 1 hour → glucose → calcium → vasopressor escalation if refractory.

**Protocol builder (`conditionProtocols.ts`):** Adds phased monitoring targets, pitfalls (FEAST, fluid overload, neonatal antibiotics), references (SSC 2020, PALS, WHO ETAT+, FEAST trial).

**Engine tests:** `client/src/lib/resus/resusGPS.test.ts` — septic_shock sub-pathway from fever; `metabolic-neurological.test.ts` imports septic-shock-engine.

---

## 6. Micro-course Septic Shock I (read-only summary)

**Learning objectives (catalog):** Recognize sepsis criteria, 20 mL/kg bolus, perfusion assessment, vasopressor escalation planning.

**HTML content (seed):** Includes FEAST-informed caution on blind bolusing; emphasises reassessment after each bolus.

**Assessment:** Formative/summative quizzes per module structure in seed scripts.

---

## 7. Holistic loop (vertical slice condition)

Per [CLINICAL_OUTCOMES_PILOT.md](./CLINICAL_OUTCOMES_PILOT.md):

- Condition: paediatric septic shock
- Loop: ResusGPS case → Care Signal → Septic Shock I link → institutional action log
- Metrics: process-only (no mortality claims)

Engineering instrumentation: `holistic_loop/*` analytics events in post-case prompt.

---

## 8. Test coverage reference

| Test | Path |
|------|------|
| Septic shock pathway | `client/src/lib/resus/resusGPS.test.ts` |
| Fellowship condition map | `server/lib/fellowship-microcourse-resus-conditions.test.ts` |
| Holistic loop KPI rollup | `server/lib/maturity-kpi-rollups.test.ts` |
| E2E prefill | `e2e/holistic-loop.spec.ts` |

---

## 9. CEO clinical sign-off

| Item | Approved | Initials | Date |
|------|----------|----------|------|
| Disclaimer alignment across course / ResusGPS / Care Signal | ☐ | | |
| Cross-links `/resus` ↔ Septic Shock I ↔ Care Signal acceptable | ☐ | | |
| No substantive pathway changes in this review (copy/link only) | ☐ | | |
| Substantive items C1–C4 scheduled for follow-up | ☐ | | |

**CEO / Clinical lead:** Job Karue  
**Signature:** ___________________________  
**Date:** ___________________________

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-27 | v1.0 — Initial conservative review; copy fixes in CareSignalPostEventPrompt |
