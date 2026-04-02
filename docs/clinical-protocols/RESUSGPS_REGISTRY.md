# ResusGPS implementation registry

**Purpose:** Single map from **clinical protocol** language to **code**. Keep this file updated when adding pathways, subpathways, or renaming step IDs.

**Canonical registry (code):** `client/src/lib/resus/pathways/index.ts` defines `pathwayRegistry` and `identifyOptions`.

---

## Pathway IDs

All pathway modules live under `client/src/lib/resus/pathways/`.

| Pathway ID | File | User label (IDENTIFY) | Notes |
|------------|------|------------------------|--------|
| `breathing` | `breathing.ts` | Breathing Difficulty | Subpathways: wheezing, stridor, bronchospasm, croup, respiratory distress defaults |
| `shock` | `shock.ts` | Shock / Poor Perfusion | Subpathways: `septic_shock` (fever yes), `hypovolemic_shock` (bleeding yes), else `defaultSteps` undifferentiated shock |
| `seizure` | `seizure.ts` | Seizure / Altered Mental Status | Active vs postictal branches |
| `allergic` | `allergic.ts` | Severe Allergic Reaction | Anaphylaxis-style step list |
| `metabolic` | `metabolic.ts` | DKA / Metabolic Emergency | DKA vs hypoglycemia branches |
| `trauma` | `trauma.ts` | Trauma / Injury | Major bleeding vs primary survey defaults |
| `newborn` | `newborn.ts` | Newborn Emergency | Neonatal resuscitation vs breathing distress |
| `cardiac_arrest` | `cardiacArrest.ts` | *(not in IDENTIFY list)* | CPR / arrest algorithm; used when arrest is declared in session |

`cardiac_arrest` is in `pathwayRegistry` but **not** in `identifyOptions` (arrest is entered from session/engine, not the initial presentation chooser).

---

## XABCDE engine

| Concern | File | What it does |
|---------|------|----------------|
| Phases, threats, interventions, fluid tracker, vasopressor ladder, reassessment | `client/src/lib/resus/abcdeEngine.ts` | Drives PRIMARY_SURVEY and intervention lifecycle from structured assessment answers |

Protocol docs for shock (including septic) must stay consistent with:

- **Pathway** septic steps in `shock.ts` (`septic_shock` subpathway), and  
- **Engine** rules for cold vs warm shock, fluid-refractory thresholds, and escalation copy in `abcdeEngine.ts`.

If these diverge, fix code **and** the clinical protocol doc together.

---

## Tests

Pathway smoke tests: `client/src/lib/resus/resusGPS.test.ts`.
