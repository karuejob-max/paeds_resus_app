# Simulation World V5.3 — Clinical pathway separation

## Goal

Prevent a learner enrolled in adult ACLS or neonatal NRP from entering a paediatric Simulation World scenario, and prevent the simulation from treating oxygen application as assisted ventilation.

## Delivered

- Added a versioned clinical package registry for ACLS, PALS, and NRP.
- Marked the current Simulation World scenarios as **PALS / paediatric / PALS-2025**.
- Removed ACLS and NRP eligibility from paediatric Simulation World, Deteriorating Child, and First Minutes missions.
- Added server-side scenario/program compatibility validation at session creation. UI filtering is not the safety boundary.
- Changed the Recovery Room scenario to begin in sinus tachycardia and transition to VF only when the patient becomes pulseless.
- Split `give_oxygen` from `assist_ventilation`:
  - Oxygen changes oxygenation only.
  - Assisted ventilation changes ventilation and can contribute to adequate breathing.
  - The learner must reassess both domains.
- Added regression coverage for pathway compatibility, initial rhythm safety, and intervention separation.

## Explicit boundary

This is not yet the adult ACLS package. ACLS learners are intentionally prevented from entering paediatric Simulation World content until an adult scenario package has completed clinical review. NRP remains a separate neonatal pathway and is not represented by these paediatric cases.

The package registry currently records `clinical_review`; it is a governance marker, not an accreditation claim. No Simulation World evidence should be used as a substitute for instructor-led skills assessment or local protocols.

## Validation

- `pnpm exec vitest run shared/simulation-world.test.ts shared/simulation-hub.test.ts server/lib/resus-simulation.test.ts`
- `pnpm exec tsc --noEmit`
- `pnpm run lint:clinical`
- `git diff --check`
