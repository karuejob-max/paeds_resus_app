# Adult ACLS Simulation World V1

## Status and safety boundary

- **Package:** `ADULT_ACLS_SIMULATION_WORLD`
- **Programme:** Adult ACLS
- **Population:** Adult
- **World:** `adult_acls`
- **Version:** `1.0`
- **Clinical status:** `clinical_review`
- **Approved for training:** No
- **Approved for assessment:** No
- **Credential authority:** None

This is a synthetic training simulation. It does not provide bedside clinical advice, replace local protocols, replace an instructor or manikin session, establish competence, or issue ACLS certification.

## Architectural boundary

Adult ACLS is a separate clinical universe from PALS and NRP. It does not reuse the paediatric PALS physiology reducer. The server must validate programme, population, world, scenario, and session before execution.

## V1 scenario families

1. Unstable bradycardia
2. Stable narrow-complex tachycardia
3. Unstable tachycardia
4. VF/pulseless VT
5. PEA
6. Asystole
7. ROSC and post-arrest deterioration
8. ACS progressing to VF arrest
9. Hypoxia progressing to arrest
10. Reversible-cause arrest

## Clinical dimensions

The adult engine keeps these dimensions distinct:

- Rhythm
- Pulse/perfusion
- Blood pressure and trend
- Oxygenation
- Ventilation and CO₂ clearance
- Mental status
- Circulating volume
- Vascular tone
- Metabolic state
- Oxygen debt and metabolic debt
- Coronary and cerebral perfusion
- Trajectory

Hidden causal values are not automatically shown to the learner. The learner receives observations such as rhythm, ECG, blood pressure, pulse quality, respiratory pattern, SpO₂, mental status, skin findings, and response to intervention.

## Evidence boundary

`simulation participation` ≠ `learning completion` ≠ `assessment` ≠ `competence` ≠ `credential`.

Simulation attempts may create structured training evidence and instructor-review records. They must never automatically promote a learner to ACLS competent, ACLS certified, or a Phase 2/3 completion state.

## Release gates

Before training approval, the package requires named clinical-owner review, documented guideline version, independent scenario review, medication/action review, negative safety tests, authenticated production smoke testing, and labelled synthetic/manikin/device validation.

Until those gates are recorded, the package remains `clinical_review` and must not be exposed as approved ACLS training or formal assessment.
