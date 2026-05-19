# Hybrid ResusGPS Execution Checklist

Date: 2026-04-17  
Owner: Cursor (implementation), Manus/Codex review support  
Scope: ResusGPS + CPR Clock + Fellowship data integration

## Objective

Transform ResusGPS into a hybrid clinical platform that combines:

- fast bedside workflow from current implementation,
- strongest safety/guardrail logic from earlier/stale versions,
- unified CPR workflow (clinical + team features),
- reliable, auditable data integration into the Fellowship journey.

## Release Definition ("The Best")

- No critical-path blockers in bedside workflow.
- One canonical CPR experience for all entry paths.
- Structured age and canonical dosing logic at input boundaries.
- Session save is acknowledgement-based and never silent.
- Fellowship reflects real platform usage (courses + ResusGPS + Care Signal).

---

## Phase 0 - Stop-the-Line Safety (48-72h)

### Ticket P0-1 - CPR launch reliability and demographic integrity
- Status: In progress (partial completed)
- Files:
  - `client/src/pages/ResusGPS.tsx`
  - `client/src/components/CPRClockStreamlined.tsx`
- Symbols/components:
  - `parseAgeToMonths()`
  - `CPRClockStreamlined` props (`onPatientInfoUpdate`)
  - `showCPRClock` render branch
- Acceptance:
  - CPR launches even when weight missing.
  - No string-split age bug in CPR path.
  - Editing patient info in CPR immediately updates active dosing + parent session.

### Ticket P0-2 - Fellowship-safe Resus session persistence (ack-based)
- Status: In progress (retryable ack flow + partial-save recovery path added)
- Files:
  - `client/src/pages/ResusGPS.tsx`
  - `server/routers/fellowship.ts`
- Symbols/components:
  - `persistSessionForFellowship()`
  - `trpc.fellowship.recordResusGPSSession`
  - `trpc.fellowship.recordResusGPSCase`
  - `handleSaveSession()`, `handleExport()`, `handleNewCase()`
- Acceptance:
  - No optional/no-op fallback mutation path.
  - Save/export/new-case use explicit mutation ack or show explicit failure.
  - Duplicate local-recording suppressed per session id.

### Ticket P0-3 - Duplicate med override safety observability
- Status: In progress (telemetry + event-stream note emitted on override)
- Files:
  - `client/src/pages/ResusGPS.tsx`
  - `client/src/components/DuplicateWarningDialog.tsx`
  - `client/src/hooks/useResusAnalytics.ts`
- Symbols/components:
  - `handleConfirmDuplicateOverride()`
  - `analytics.trackInterventionStarted(...)`
  - new event key `duplicate_override_confirmed`
- Acceptance:
  - Every override action emits telemetry with intervention identifiers.
  - Override path clearly logged in session event stream.

### Ticket P0-4 - Session save contract clarity in UI
- Status: In progress (explicit state banner + retry CTA + ack/failure paths wired)
- Files:
  - `client/src/pages/ResusGPS.tsx`
  - `client/src/components/TopBar.tsx` (if save state badge added)
- Symbols/components:
  - save/export toast outcomes
  - pending indicator state
- Acceptance:
  - User can always distinguish "saved", "already saved", and "not saved".

---

## Phase 1 - Canonical Engine Foundation (Week 1)

### Ticket P1-1 - Age boundary adapter (structured-first)
- Status: In progress (ResusGPS + ABCDE classifier now on shared parser)
- Files:
  - `client/src/lib/resus/age-calculator.ts`
  - `client/src/lib/resus/abcdeEngine.ts`
  - `client/src/pages/ResusGPS.tsx`
- Symbols/components:
  - `parseAgeString()`, `ageToMonths()`
  - `getAgeCategory()`
- Acceptance:
  - Boundary normalization uses structured age where available.
  - Engine receives normalized age string format consistently.

### Ticket P1-2 - Canonical calculator module alignment
- Status: In progress (CPR dose formulas moved to shared calculation module)
- Files:
  - `client/src/lib/clinicalCalculations.ts`
  - `client/src/lib/resus/abcdeEngine.ts`
  - `client/src/components/CPRClockStreamlined.tsx`
  - `client/src/components/CPRClockTeam.tsx`
  - `client/src/components/CPRClock.tsx`
- Symbols/components:
  - dose/fluid formulas
  - shock energy and epi/antiarrhythmic calculations
- Acceptance:
  - No duplicate formula drift across Resus + CPR.

### Ticket P1-3 - CPR engine extraction scaffold
- Status: In progress (compression-cycle milestones extracted to pure engine module)
- Files:
  - `client/src/lib/resus/cpr-engine.ts` (new)
  - `client/src/components/CPRClockStreamlined.tsx`
- Symbols/components:
  - phase transitions
  - rhythm and medication timing logic
- Acceptance:
  - Core logic moved to pure functions/hooks with component as presentation.

---

## Phase 2 - Unified CPR (Week 2)

### Ticket P2-1 - Team features layered on canonical CPR engine
- Status: In progress (unified CPR entry component introduced in ResusGPS)
- Files:
  - `client/src/components/CPRClockStreamlined.tsx`
  - `client/src/components/CPRClockTeam.tsx`
  - `client/src/components/CPRClockUnified.tsx`
  - `server/routers/cpr-session.ts`
- Symbols/components:
  - session code/QR join
  - role updates
  - shared event logging
- Acceptance:
  - Team mode and solo mode share one timing/clinical engine.

### Ticket P2-2 - CPR data contract unification
- Status: In progress (frontend CPR integrations migrated from `cprClock.*` to `cprSession.*`)
- Files:
  - `server/routers/cprClock.ts`
  - `server/routers/cpr-session.ts`
  - `server/routers.ts`
- Symbols/components:
  - `cprSession.*` as canonical
  - deprecation strategy for `cprClock.*`
- Acceptance:
  - Single production CPR contract path documented and enforced.
  - Client code has no direct `trpc.cprClock.*` dependencies.

### Ticket P2-3 - Debriefing coherence with real event stream
- Files:
  - `client/src/components/CPRDebriefing.tsx`
  - `client/src/components/CPRSimulation.tsx`
  - `client/src/lib/simulationEngine.ts`
- Acceptance:
  - Debrief metrics sourced from real event stream where applicable.

---

## Phase 3 - Hybrid UX and Legacy Strength Recovery (Week 3)

### Ticket P3-1 - Hybrid mode non-blocking + active interventions rail
- Files:
  - `client/src/pages/ResusGPS.tsx`
  - `client/src/components/clinical/ActiveInterventionsSidebar.tsx`
  - `client/src/components/RecommendationBanner.tsx`
- Acceptance:
  - Question progression remains fast while interventions remain persistently actionable.

### Ticket P3-2 - Quick launch and protocol normalization
- Files:
  - `client/src/components/QuickStartPanel.tsx`
  - `client/src/lib/protocolChecklists.ts`
  - `client/src/pages/ClinicalAssessmentGPS.tsx` (reference only)
  - `client/src/pages/ClinicalGPSv2.tsx` (reference only)
- Acceptance:
  - One canonical quick launch mapping path in active ResusGPS.

### Ticket P3-3 - SBAR handover restoration
- Files:
  - `client/src/lib/sbarHandover.ts`
  - `client/src/pages/ResusGPS.tsx`
- Acceptance:
  - Structured handover reflects current session state and can be copied/exported.

---

## Phase 4 - Quality Gates, Observability, and Cutover (Week 4)

### Ticket P4-1 - Clinical regression pack
- Files:
  - `client/src/lib/resus/resusGPS.test.ts`
  - `client/src/__tests__/abcde-engine.test.ts`
  - `server/resus-integration-e2e.test.ts`
- Acceptance:
  - Critical clinical paths covered in CI (assessment, interventions, arrest, save).

### Ticket P4-2 - Fellowship progress truth checks
- Files:
  - `server/routers/fellowship.ts`
  - `client/src/pages/FellowshipDashboard.tsx`
  - `server/resus-analytics-integration.test.ts`
- Acceptance:
  - ResusGPS activity from bedside flow appears in Fellowship pillar metrics predictably.

### Ticket P4-3 - Monitoring and alerts
- Files:
  - `server/routers/admin-stats.ts`
  - `client/src/pages/AdminReports.tsx`
- Acceptance:
  - Save failures and key CPR/Resus reliability events are visible to operators.

---

## Fellowship Data Integration Checklist (Cross-Phase)

- Courses pillar:
  - `server/routers/fellowship.ts::calculateCoursesPillar`
- ResusGPS pillar:
  - `recordResusGPSSession` and `recordResusGPSCase` called from live ResusGPS flow.
  - Condition counts match canonical diagnosis mappings.
- Care Signal pillar:
  - `calculateCareSignalPillar` streak logic remains source-of-truth.
- Provider-facing:
  - `client/src/pages/FellowshipDashboard.tsx` shows up-to-date pillar states.
  - No silent data drop in save/export/new-case actions.

---

## Live Status

- Completed now:
  - P0-1 partially complete in code.
  - P0-2 retryable ack + partial-save recovery path complete in UI flow.
  - P0-3 telemetry + session event-stream override logging complete.
  - P0-4 explicit save-state contract + retry CTA surfaced in UI.
  - P1-1 partial migration complete in engine + UI.
  - P1-2 partial formula alignment complete for CPR clocks.
  - P1-3 expanded with shared post-shock medication decision logic.
  - P2-1 started with single CPR entrypoint wired into ResusGPS.
  - P0-3 expanded with persistence outcome audit notes in session event stream.
  - P2-2 started with canonical `cprSession` APIs replacing frontend `cprClock` calls.
  - P2-1 expanded: unified CPR now supports in-session Solo/Team mode switching.
  - P2-2 expanded: `cprClock` router now emits deprecation warnings on legacy calls.
- Next immediate implementation order:
  1. P1-1 complete in age-calculator boundary paths
  2. P2-2 deprecate or gate `cprClock` router usage further (legacy read-only option)
  3. P1-3 CPR engine extraction scaffold
  4. P2-1 merge team sync features into unified component

