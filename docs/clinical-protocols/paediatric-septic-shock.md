# Paediatric septic shock

**Status:** Active  
**Last reviewed:** 2026-04-02  
**Owner:** Clinical + engineering (shared)

## 1. Scope

Infants and children with suspected or proven infection presenting with shock (inadequate tissue perfusion). Typical settings: emergency care, acute wards, retrieval. Focus is the first hours: oxygen, access, fluids, antimicrobials, glucose and calcium checks, escalation when fluid-refractory.

## 2. Evidence basis

We align with themes from (without copying proprietary wording):

- Surviving Sepsis Campaign and related international paediatric sepsis guidance (early recognition, timely antimicrobials, fluid resuscitation with reassessment, vasoactive support when indicated).
- Adult sepsis guidance where paediatric-specific evidence is extrapolated in product copy (bounded in UI).
- Ten steps style improvements for low-resource settings: early recognition, oxygen, access, rational fluids, timely antibiotics, glucose, escalation pathways.

Local formulary, antibiotic choice, and fluid types must follow hospital policy.

## 3. Product surfaces

| Surface | Purpose |
|---------|---------|
| ResusGPS | Shock pathway branch and XABCDE-driven perfusion and escalation |
| Emergency Protocols (`/protocols`) | Legacy septic shock viewer; align messaging when touched |
| LMS | Micro-course Paediatric septic shock (PALS program, SKU `pals_septic`) |

## 4. ResusGPS mapping (must match code)

### Identified pathway

When the user selects Shock / Poor Perfusion and answers fever = YES, the app uses the septic shock subpathway.

| Field | Value |
|--------|--------|
| Pathway ID | `shock` |
| Subpathway ID | `septic_shock` |
| File | `client/src/lib/resus/pathways/shock.ts` |
| Match | `answers.fever === 'yes'` |

Step IDs in implementation (order matters): `ss_o2`, `ss_access`, `ss_bolus1`, `ss_antibiotics`, `ss_glucose`, `ss_calcium`, `ss_vasopressor`, `ss_hydrocortisone`.

### XABCDE engine

When the user runs the primary survey, the engine may generate perfusion-related threats and interventions: fluid boluses, fluid-refractory threshold messaging, cold vs warm shock escalation, lactate and metabolic acidosis context (including sepsis as a differential). This layer must remain clinically coherent with the septic shock pathway.

| File | Responsibility |
|------|----------------|
| `client/src/lib/resus/abcdeEngine.ts` | Phases, threats, interventions, fluid totals, vasopressor ladder, reassessment checks |

Governance: Any change to bolus size, antibiotic timing, or first-line vasopressor choice in either `shock.ts` or `abcdeEngine.ts` must be reflected in this doc in the same PR or a doc PR merged immediately after.

## 5. Step sequence (pathway branch)

Mirrors `septic_shock` steps in `shock.ts`:

1. High-flow oxygen (critical)
2. IV/IO access, two large-bore lines (critical)
3. Fluid bolus 20 mL/kg crystalloid (critical; reassess; repeat per code)
4. Antimicrobials early (critical; empiric choice per local policy)
5. Glucose check and correction (critical if hypoglycaemic)
6. Calcium when indicated per code
7. Vasopressor if fluid-refractory (cold vs warm nuance in UI)
8. Hydrocortisone when catecholamine-refractory or suspected adrenal insufficiency per code

## 6. Out of scope

Definitive source control and ICU ventilation strategy beyond high-level escalation prompts; neonatal-specific rules (use Newborn pathway); full-text reproduction of external guidelines.

## 7. LMS course

Catalog is ensured server-side (`ensurePaediatricSepticShockCatalog`). Training modules must not contradict this doc or ResusGPS.

E2E: [E2E_PAEDIATRIC_SEPTIC_SHOCK_COURSE.md](../E2E_PAEDIATRIC_SEPTIC_SHOCK_COURSE.md).

## 8. Change log

| Date | Change |
|------|--------|
| 2026-04-02 | Initial protocol doc; alignment with `shock.ts` septic_shock and `abcdeEngine.ts`. |
