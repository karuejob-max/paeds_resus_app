# Simulation World V2 — Behaviourally Valid Autonomous Team Simulation

## Delivered

Simulation World now has a separation between true patient state and learner observations. Rhythm, oxygen saturation, heart rate, blood pressure, airway, breathing, and circulation remain undisclosed until an assessment or reassessment action reveals them. The trajectory is not shown as a patient truth before the relevant observation.

The engine now advances independently of button presses. The room clock runs in the renderer at 250 ms intervals and calls a pure deterministic engine timestep. Patient deterioration, arrest risk, and NPC transitions therefore continue while the learner hesitates.

The patient pathway is coupled to interventions. Respiratory failure can deteriorate to arrest; safe CPR, access, medication, and reassessment can produce ROSC; unsafe rhythm or medication sequences create explicit critical failures. The assessment requires ROSC, safe behaviour, and role-relevant domains rather than a click count.

Roles now constrain the action console. A scribe cannot administer oxygen, an airway role cannot shock, and a monitor role receives monitor/defibrillation controls. Repeated identical assessments no longer award repeated competency credit.

NPC teammates now move through a state machine: waiting → acknowledged → working/completed or needs clarification. Delegation, acknowledgement, task execution, and closed-loop confirmation are separate events.

Every engine event carries sequence, actor, role, action, target, consequence, competency signals, and a chained hash. Attempts include engine, scenario, and assessment versions. The server replays Simulation World command events, verifies the chain and versions, and stores the server-derived score/pass status rather than trusting browser claims.

The Simulation Hub also recommends the next missing role experience. Team-member roles require evidence-ready performance, while leadership requires three distinct evidence-ready scenarios before the controller considers the leadership set complete.

## Safety boundary

This remains **Autonomous Phase 2 Rehearsal**, not an automatic AHA Phase 2 completion mechanism. The server replay creates trustworthy training evidence and an exception-review foundation; it does not bypass applicable instructor-led or approved hands-on delivery requirements. Phase 3 remains instructor-led hands-on assessment.

## Validation

- Simulation World V2 suite: 9 tests passed.
- Combined Simulation Hub and AI safety suite: 17 tests passed.
- TypeScript: passed.
- Full repository `pnpm run check`: passed.
- Clinical lint: passed.
- Production build: passed.
- Diff and migration-scope audit: passed; no migration was introduced.

## Remaining governed work

Clinical-owner review, labelled synthetic/manikin testing on two mobile devices, production deployment propagation, and instructor exception views remain required before formal programme owners decide whether any evidence can contribute to a Phase 2 workflow. No automatic Phase 2 gate connection was added.
