# ResusGPS Nuclear Rebuild TODO

## Architecture
- [x] Design unified state machine architecture (NUCLEAR_REBUILD_ARCHITECTURE.md)
- [x] Build state machine engine (stateMachine.ts)
- [x] Build weight estimation utility (weightEstimation.ts)

## Pathways (8 total)
- [x] Cardiac Arrest pathway
- [x] Breathing pathway (bronchospasm, croup, general)
- [x] Shock pathway (septic, hypovolemic, cardiogenic)
- [x] Seizure pathway (active seizure, post-ictal)
- [x] Metabolic/DKA pathway (DKA, hypoglycemia)
- [x] Allergic/Anaphylaxis pathway
- [x] Trauma pathway (hemorrhagic, head injury)
- [x] Newborn pathway (apnea, meconium, prematurity)
- [x] Pathway registry (index.ts)

## UI
- [x] Build unified ResusGPS page (single component, single state machine)
- [x] Replace App.tsx routes (ONE entry point)
- [x] Patient info input (age + weight)
- [x] Giant START button
- [x] Quick launch shortcuts (8 pathways)

## Tests
- [x] 32 tests passing (all clinical scenarios validated)
- [x] Cardiac arrest in 1-2 answers
- [x] Bronchospasm in 6 answers
- [x] Septic shock in 6 answers
- [x] DKA in 5 answers
- [x] Anaphylaxis in 4 answers
- [x] Status epilepticus in 5 answers
- [x] Step progression and reassess flow
- [x] Weight estimation and dose calculation
- [x] Pathway registry completeness

## Remaining
- [ ] Validate UI flow end-to-end in browser
- [ ] PWA install button integration
- [ ] Offline capability verification
