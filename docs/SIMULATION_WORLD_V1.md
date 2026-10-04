# Simulation World V1

## Product boundary

Simulation World is the team-based rehearsal room inside the Life Support Simulation Hub. It is designed to make Phase 2 practice more realistic and evidence-oriented without pretending that software output is automatically an AHA accreditation decision.

**Phase 3 remains instructor-led hands-on assessment.** Local programme owners must confirm whether and how this evidence can be used for their delivery model before it is treated as an official Phase 2 completion mechanism.

## What is now implemented

- One deterministic `SimulationWorldState` owns patient, team, environment, phase, event log, safety events, and competency vector.
- Three scenario variants: predictable, ambiguous, and chaotic.
- Seven learner roles: team leader, airway and ventilation, compressor 1, compressor 2, monitor/defib/CPR coach, IV/IO and medications, and scribe.
- Structured commands for assessment, delegation, closed-loop acknowledgement, CPR, monitoring, oxygen, medication, defibrillation, reporting, and reassessment.
- Natural-language command parsing is only an interface. It cannot invent physiology, ROSC, rhythm changes, or treatment effects.
- NPC teammates have named identities, role, competence, latency, task, and status.
- Deterministic consequences include deterioration, arrest, shockability checks, unsafe medication/defibrillation failures, and improvement after oxygen/ventilation support.
- Replay timeline showing what happened and when.
- Competency vector covering recognition, prioritisation, leadership, delegation, closed-loop communication, technical action, reassessment, team dynamics, time-critical action, and safety.
- Critical safety failures override the aggregate score and make evidence ineligible.
- Evidence-ready role attempts are saved through the existing authenticated Practice Lab attempt contract, with role and scenario metadata in the event log.
- A learner-facing role-evidence matrix is visible in the Simulation Hub.

## Validation

- `pnpm exec vitest run shared/simulation-world.test.ts shared/simulation-hub.test.ts shared/simulation-hub-mastery.test.ts`
- `pnpm exec tsc --noEmit`
- `pnpm run check`
- `pnpm run lint:clinical`
- `pnpm run build`
- `git diff --check`

## Deliberate non-goals in V1

- No LLM-controlled physiology.
- No automatic claim that a digital attempt is an accredited AHA Phase 2 completion.
- No replacement of hands-on Phase 3 assessment.
- No hidden broad score suppression; critical failures are explicit, logged, and remediable.
- No migration is required for this first release because the existing attempt event log is used for backward-compatible evidence metadata.

## Next expansion gates

1. Named clinical-owner review of scenario rules and medication/defibrillation safety conditions.
2. Synthetic/manikin testing on at least two mobile devices.
3. Add server-side immutable world-transition validation before using evidence for any formal gate.
4. Add instructor audit views for critical failures and anomalous attempts.
5. Add audio/TTS and equipment/resource failure layers only after deterministic state and replay remain stable.
