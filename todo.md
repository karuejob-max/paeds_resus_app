# ResusGPS TODO

## Nuclear Rebuild (Phase 126+) — COMPLETE
- [x] Replace fragmented multi-page system with single unified state machine
- [x] Build 8 clinical pathways (cardiac arrest, breathing, shock, seizure, metabolic/DKA, anaphylaxis, trauma, newborn)
- [x] Single ResusGPS page with START button and quick launch shortcuts
- [x] Patient demographics capture (age/weight)
- [x] PWA install button
- [x] 32 tests validating all clinical scenarios

## ABCDE Primary Survey Rebuild — COMPLETE
- [x] Build ABCDE Engine (abcdeEngine.ts) - clinical state machine with XABCDE flow
- [x] Primary Survey questions for all 6 letters (X, A, B, C, D, E)
- [x] Threat detection rules (18 threat types from findings)
- [x] Multi-threat management (accumulate and manage simultaneously)
- [x] Weight-based dose calculations on every intervention
- [x] Safety check rules (insulin without potassium, excessive boluses, bolus in hyperglycemia)
- [x] Diagnosis suggestion engine (DKA, Sepsis, Anaphylaxis, Meningitis, Status Epilepticus, Tension Pneumothorax)
- [x] Structured event logging (every finding, threat, intervention timestamped)
- [x] Event log export as text file
- [x] Build ResusGPS UI (renders all ABCDE engine states)
- [x] IDLE screen with patient info, trauma toggle, START button, cardiac arrest quick launch
- [x] Quick Assessment screen (PAT - Sick/Not Sick)
- [x] Primary Survey screen with ABCDE progress bar, letter-by-letter questions
- [x] Intervention screen with threat cards, dose cards, timer indicators
- [x] Secondary Survey screen with findings summary and diagnosis suggestions
- [x] Cardiac Arrest screen with CPR timer and intervention checklist
- [x] Definitive Care / Ongoing screen with event log and export
- [x] Audio alert system (critical, timer, safety)
- [x] Countdown timer system for time-critical interventions
- [x] Safety alert banner (insulin without potassium, etc.)
- [x] Active threats sidebar
- [x] 43 comprehensive tests passing (including full DKA scenario)
- [x] Update App.tsx routing for new system

## Future Features
- [ ] SAMPLE history input in Secondary Survey
- [ ] DKA definitive care protocol (insulin infusion, electrolyte monitoring)
- [ ] Sepsis bundle definitive care protocol
- [ ] Clinical notes generation from event log
- [ ] Post-resuscitation ML feedback
- [ ] Voice command integration
- [ ] Freemium credits model
- [ ] Payment integration (Stripe)
