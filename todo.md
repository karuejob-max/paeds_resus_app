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

## PSoT Priority Order (Locked) - PIVOTING NOW

### Priority 1: Analytics Instrumentation
- [x] ResusGPS sessions emit to analyticsEvents
- [x] Care Signal submissions tracked
- [x] Admin reports show real product activity

### Priority 2: Security Baseline (COMPLETED)
- [x] Implement password complexity rules (8+ chars, mix of case/numbers/symbols)
- [x] Configure session max age (sliding expiry, refresh token logic)
- [x] Build admin audit logging system (track admin actions, timestamps, user)
- [x] Implement data retention policies
- [x] Add PHI handling compliance checks
- [x] Security testing and validation

### Phase 1: Integrate Security Utilities into tRPC (COMPLETE ✅)
- [x] Wire password validator into auth.changePassword procedure
- [x] Integrate session manager into auth.login procedure (sessionMaxAgeMs)
- [x] Add audit logger to auth.login, auth.logout, auth.resetPassword, auth.changePassword
- [x] Create audit log query procedures (auditLogs.list, auditLogs.getByUser)
- [x] Build succeeds locally
- [x] Push to GitHub
- [ ] Write comprehensive tRPC integration tests
- [ ] Validate end-to-end security flow in browser

### Phase 2: Build ResusGPS v4 Clinical Features (COMPLETE ✅)

### Phase 2 Integration: Wire v4 Features into ResusGPS Component (COMPLETE ✅)

#### Phase 2 Integration - 2a: Undo Functionality Integration ✅
- [x] Import useUndo() hook into ResusGPS.tsx
- [x] Add undo button to TopBar component (already existed)
- [x] Wire undo button to handleUndo() function
- [x] Add Cmd+Z and Cmd+Shift+Z keyboard shortcuts
- [x] Add toast feedback for undo/redo actions
- [x] Disable undo button when no undo stack available
- [x] Build succeeds locally
- [x] Push to GitHub
- [ ] Test Cmd+Z keyboard shortcut in ResusGPS flow
- [ ] Verify undo doesn't break clinical state machine
- [ ] Test full resuscitation with undo (enter findings → undo → verify state reverts)

#### Phase 2 Integration - 2b: Medication Deduplication Integration ✅
- [ ] Import checkMedicationDuplicate() into ResusGPS.tsx
- [ ] Import DuplicateWarningDialog component
- [ ] Call checkMedicationDuplicate() in startIntervention handler
- [ ] Show DuplicateWarningDialog when duplicate detected
- [ ] Allow provider to override or cancel duplicate intervention
- [ ] Log override events to analytics
- [ ] Test with epinephrine (IV + IO), fluids (bolus + repeat), diazepam
- [ ] Verify deduplication doesn't block legitimate repeated boluses
- [ ] Test different routes (IV vs IO) are allowed

#### Phase 2 Integration - 2c: Countdown Timers Integration ✅
- [ ] Import useCountdownTimer() hook into ResusGPS.tsx
- [ ] Import TimerCard component
- [ ] Create timer when startIntervention() is called
- [ ] Display TimerCard in intervention panel
- [ ] Trigger reassessment prompt when timer expires
- [ ] Show audio alert when timer reaches critical (30s remaining)
- [ ] Allow pause/resume/reset of timers
- [ ] Persist timer state to localStorage
- [ ] Test CPR timer (2min), medication timer (3min), intervention timer (5min)

#### Phase 2 Integration - 2d: Structured Age Input Integration ✅
- [ ] Import AgeInput component into ResusGPS.tsx
- [ ] Replace age input in patient info dialog with AgeInput
- [ ] Auto-calculate weight when age changes
- [ ] Update all dose calculations to use structured age
- [ ] Show age category badge in patient info
- [ ] Add age-based drug restrictions to safety alerts
- [ ] Show age-specific dosing notes in DoseRationaleCard
- [ ] Test neonatal dosing (epinephrine 0.01mg/kg)
- [ ] Test pediatric dosing (epinephrine 0.01mg/kg)
- [ ] Test adolescent dosing (standard adult doses)

#### Phase 2 Integration - 2e: Multi-Diagnosis Support Integration ✅
- [ ] Import DiagnosisCard component into ResusGPS.tsx
- [ ] Update ResusSession type to support diagnosis array
- [ ] Modify getSuggestedDiagnoses() to return all matches
- [ ] Display all diagnosis cards in Secondary Survey
- [ ] Allow provider to mark diagnosis as definite/likely/consider
- [ ] Show targeted interventions per diagnosis
- [ ] Update reassessment flow for each diagnosis
- [ ] Test concurrent diagnoses (sepsis + DKA)
- [ ] Test diagnosis resolution (mark as resolved)
- [ ] Test adding new diagnosis mid-case

#### Phase 2 Integration - 2f: Dose Rationale Display Integration ✅
- [ ] Import DoseRationaleCard component into ResusGPS.tsx
- [ ] Call getDoseRationale() when calcDose() is called
- [ ] Display DoseRationaleCard in intervention panel (expandable)
- [ ] Show AHA 2020 PALS reference in rationale
- [ ] Allow export of dose rationale to clinical notes
- [ ] Add more drugs to getDoseRationale() (lidocaine, calcium, magnesium)
- [ ] Create printable dose reference card from all rationales
- [ ] Test rationale for all common drugs (epi, amiodarone, glucose, diazepam, fluids)
- [ ] Verify rationale updates when age/weight changes

### Phase 3: Set Up Staging Environment (COMPLETE ✅)
- [x] Created develop branch for staging (develop to staging, main to production)
- [x] Configured develop→staging, main→production branch strategy
- [x] Documented PR verification checklist
- [x] Created DEPLOYMENT.md with complete procedures
- [x] Tested branch strategy and deployment flow

## Sprint 5: ResusGPS Auto-Launch, Admin Notifications, Facility Benchmarking (PAUSED - Deprioritized)

### Phase 5.1: ResusGPS Auto-Launch Integration
- [ ] Create ResusGPS launch handler that accepts pathway parameter
- [ ] Integrate recommendation AI getAutoLaunchPathway into ResusGPS.tsx
- [ ] Auto-populate patient demographics from learner profile when launching
- [ ] Show "Recommended: [Condition]" banner at start
- [ ] Track recommendation acceptance in analytics
- [ ] Test auto-launch with all 13 pathways
- [ ] Verify recommendation updates after each session

### Phase 5.2: Admin Notification Dashboard
- [ ] Create AdminNotificationDashboard.tsx component
- [ ] Build real-time alerts: streak milestones, training gaps, engagement drops
- [ ] Create notification preferences (email, in-app, SMS)
- [ ] Build notification history with filtering
- [ ] Add facility-level aggregation (top performers, critical gaps)
- [ ] Create notification API endpoints
- [ ] Write tests for notification logic
- [ ] Wire to /admin/notifications route

### Phase 5.3: Facility Comparison Benchmarking
- [ ] Create facility benchmarking algorithm (match by size, region, practice patterns)
- [ ] Build anonymized comparison data (no facility names, only metrics)
- [ ] Create FacilityBenchmark.tsx component
- [ ] Show peer comparison: sessions/week, engagement %, critical gaps
- [ ] Add facility ranking (top 10% performers)
- [ ] Create benchmarking API endpoints
- [ ] Write comprehensive tests
- [ ] Integrate into FacilityTrainingGaps dashboard

### Phase 5.4: Production Testing & Validation
- [ ] Write integration tests for all 3 features
- [ ] Performance test: auto-launch <500ms, dashboard load <1s
- [ ] Security audit: no PII exposure in benchmarks
- [ ] Timezone validation: EAT consistency across all features
- [ ] Load test: 100+ concurrent users
- [ ] Edge case testing: new facilities, single staff, no practice data
- [ ] Run full test suite (vitest)

### Phase 5.5: Production Deployment
- [ ] Commit all changes to Git
- [ ] Update documentation
- [ ] Create deployment checklist
- [ ] Ready for production rollout

## Future Features
- [ ] SAMPLE history input in Secondary Survey
- [ ] DKA definitive care protocol (insulin infusion, electrolyte monitoring)
- [ ] Sepsis bundle definitive care protocol
- [ ] Clinical notes generation from event log
- [ ] Post-resuscitation ML feedback
- [ ] Voice command integration
- [ ] Freemium credits model
- [ ] Payment integration (Stripe)

## Critical Fixes (User Feedback - Feb 10)
- [x] FIX: Clinical consistency — single source of truth for dosing (10ml/kg for ALL initial boluses)
- [x] FIX: Drug name always shown with dose (calcDose always prefixes drug name)
- [x] FIX: Remove "Pediatric Assessment Triangle" — Quick Assessment is universal for ALL ages
- [x] FIX: Objective vital signs input (actual numbers: HR, RR, SpO2, BP, Temp, Glucose with interpretation)
- [x] FIX: Mid-case patient info entry — updatePatientInfo() + Edit dialog accessible from top bar
- [x] BUILD: Intervention Tracking Side Panel (swipeable/collapsible)
  - [x] Tracks live intervention status (pending/in_progress/completed)
  - [x] Reassessment prompts after each intervention
  - [x] Reassess for complications (crackles, hepatomegaly, JVP, respiratory distress)
  - [x] Reassess for therapeutic endpoints (HR, CRT, mental status, urine output)
  - [x] Clinical recommendation based on reassessment (repeat bolus, stop + furosemide, start epi)
  - [x] Dose + rationale on every recommendation
  - [x] Thorough assessment guides shock type recognition (cold vs warm shock differentiation)

## Clinical Architecture Upgrade (Feb 11 - Kolb Cycle)
### Airway Restructure
- [x] Add CHOKING pathway to X/A assessment
- [x] Move AVPU to Airway (A) — AVPU ≤ P = airway at risk
- [x] Age-appropriate head positioning (neutral for infants, sniffing for older children/adults)
- [x] Airway adjuncts: OPA if AVPU @ U, NPA if AVPU @ P
- [x] Consider advanced airways (supraglottic/ETT) as escalation option

### Breathing Restructure
- [x] Move "Deep laboured breathing" from auscultation to inspection (next to RR)
- [x] Deep laboured breathing = compensatory sign of METABOLIC ACIDOSIS (not DKA-specific)
- [x] Remove DKA tunnel vision — present differential: DKA, sepsis with starvation ketones, lactic acidosis, renal failure, poisoning

### Circulation & Shock Escalation
- [x] Objective perfusion assessment: ask CRT (seconds), skin temp, pulse character separately — engine determines perfusion state (no anchoring bias from option ordering)
- [x] Balanced crystalloids (Ringer's Lactate) as default fluid, NS only for neonates
- [x] Rationale for RL: no hyperchloremic acidosis, lactate buffered to bicarb by liver, balanced electrolytes
- [x] Fluid tracker as first-class citizen: total mL/kg given, bolus count, running status
- [x] Shock escalation ladder (protocol, not suggestion):
  - [x] Epinephrine first (myocardial dysfunction, vasoplegia, universally available)
  - [x] Norepinephrine (persistent vasoplegia)
  - [x] Hydrocortisone (adrenal insufficiency)
  - [x] Check calcium levels
  - [x] Milrinone (catecholamine-refractory cold/reduced CO shock)
  - [x] Vasopressin (catecholamine-refractory warm/hyperdynamic shock)
- [x] Fluid-refractory shock auto-detection at ≥60mL/kg → trigger vasopressor ladder

### Intervention Lifecycle (System-Wide)
- [x] Intervention states: SUGGESTED → ONGOING (timer) → COMPLETED → REASSESS
- [x] Completed intervention triggers clinical decision point (not just "move on")
- [x] Reassessment outcomes: Problem Resolved / Problem Persists / New Problem / Escalate
- [x] Escalation examples:
  - [x] Shock: Resolved → stop / Still present → next bolus / Fluid overload → furosemide / Fluid-refractory → epi
  - [x] Airway: Patent → continue / Still obstructed → escalate (MgSO4, advanced airway)
  - [x] Seizure: Stopped → continue / Still convulsing → next dose diazepam 0.3mg/kg IV or 0.5mg/kg PR
- [x] Clear visual distinction: suggested vs ongoing vs completed interventions

### Anti-Tunnel-Vision (Differential Thinking)
- [x] Metabolic acidosis differentials (not just DKA): sepsis, starvation ketones, lactic acidosis, renal failure, poisoning
- [x] Stress hyperglycemia awareness (septic child with poor feeding can have ketones + high glucose)
- [x] Engine presents findings and differentials, not premature diagnoses
- [x] Lactate assessment option (added to D letter)


## Sprint 2: Monetization MVP (Passive Revenue Streams)

### Phase 2.1: Micro-Course Monetization Foundation
- [ ] Create micro-course catalog schema updates (distinguish micro-courses from legacy BLS/ACLS/PALS)
- [ ] Define three pilot micro-courses: Shock, DKA, Asthma Escalation
- [ ] Add pricing to each micro-course (500-1,500 KES)
- [ ] Build micro-course checkout flow (M-Pesa integration)
- [ ] Create course completion certificates
- [ ] Wire micro-course enrollment to analyticsEvents (track: course_enrollment, payment_initiation, payment_completion)
- [ ] Add email receipts using email-service.ts (Cursor's new service)
- [ ] Test payment flow end-to-end (M-Pesa STK Push → callback → certificate)

### Phase 2.2: Institutional Readiness Sales Pipeline
- [ ] Define "Hospital Readiness Assessment" package (what's included, pricing)
- [ ] Create institutional inquiry form (company, staff count, specific needs)
- [ ] Build inquiry → sales pipeline (new, contacted, qualified, converted)
- [ ] Create proposal/quote generation UI
- [ ] Add institutional onboarding checklist
- [ ] Build staff training assignment UI (assign micro-courses to staff)
- [ ] Create institutional reporting dashboard (staff completion rates, usage)
- [ ] Wire to analyticsEvents (track: institution_training_schedule_created, staff_course_completion)

### Phase 2.3: Measurement & Analytics
- [ ] Track micro-course → ResusGPS usage correlation (do users who take Shock module use ResusGPS more?)
- [ ] Monitor payment success rate (% of STK Push that complete)
- [ ] Calculate support cost per 1,000 users (track support emails per SKU)
- [ ] Create admin dashboard showing revenue by SKU (micro-courses vs legacy courses vs institutional)
- [ ] Verify analyticsEvents captures all monetization events

### Phase 2.4: Testing & Launch
- [ ] Create test data: 5 micro-course enrollments with M-Pesa payments
- [ ] Verify certificates are generated and emailed
- [ ] Test institutional inquiry → proposal flow
- [ ] Verify all events appear in analyticsEvents
- [ ] Run smoke tests on payment failure scenarios (timeout, user cancels, network error)
- [ ] Document support playbook (FAQ, common issues, escalation)

### Phase 2.5: Staging Environment (Parallel)
- [ ] Set up staging database (separate from production)
- [ ] Configure staging M-Pesa sandbox credentials
- [ ] Create staging deployment checklist
- [ ] Test all monetization flows on staging before production


## Bug Fixes (Active)

### Navigation Bug: Institutional User Cannot Access Healthcare Provider Platform
- [x] Diagnose: Check institutional dropdown menu navigation code
- [x] Fix: Ensure "Healthcare Provider Platform" button routes to correct page (Fixed race condition in Home.tsx redirect logic)
- [x] Test: Verify institutional user can navigate to provider platform
- [x] Verify: Test role switching and navigation flow


## Sprint 3: ResusGPS Analytics & Recommendations (Parallel Backlog)

### Phase 3.1: Staging Verification & Feedback
- [ ] Run staging verification checklist (STAGING_VERIFICATION_CHECKLIST.md)
- [ ] Test ResusGPS session recording end-to-end
- [ ] Test FellowshipProgressCard on mobile/tablet/desktop
- [ ] Test ConditionHeatmap CSV export
- [ ] Verify all analytics events appear in admin reports
- [ ] Document any issues or performance gaps

### Phase 3.2: ResusGPS UI Feedback (Toast Notifications)
- [ ] Wire ResusGPS.tsx recordSession call with feedback
- [ ] Add toast notification: "Session recorded: [Pathway] + [Conditions]"
- [ ] Add success/error handling for recordSession mutations
- [ ] Show validation feedback: "Valid session: Meets depth requirements"
- [ ] Show warning if session doesn't meet depth threshold
- [ ] Test toast notifications on mobile and desktop

### Phase 3.3: Condition Recommendation Engine
- [ ] Build recommendNextCondition() procedure (based on gaps + learner progress)
- [ ] Prioritize: conditions with 0 practice > conditions with 1-2 cases > conditions with 3+ cases
- [ ] Consider facility-level gaps (conditions not practiced in 30 days)
- [ ] Add recommendation card to FellowshipProgressCard
- [ ] Show: "Next recommended: [Condition] (facility gap: 45 days)"
- [ ] Allow learner to click recommendation to jump to ResusGPS pathway
- [ ] Test recommendation logic with various scenarios

### Phase 3.4: Testing & Integration
- [ ] Create integration tests for all 3 features
- [ ] Test recommendation engine with edge cases (new learner, all conditions complete, facility gaps)
- [ ] Verify toast notifications don't interfere with ResusGPS flow
- [ ] Test CSV export with large datasets (100+ sessions)
- [ ] Performance test: recommendation calculation <500ms

### Phase 3.5: Documentation & Deployment
- [ ] Update RESUS_ANALYTICS_INTEGRATION_COMPLETE.md with feedback + recommendations
- [ ] Create RECOMMENDATION_ENGINE.md with algorithm explanation
- [ ] Update STAGING_DEPLOYMENT.md with new verification steps
- [ ] Commit all changes with comprehensive message
- [ ] Ready for production deployment

## Sprint 4: Fellowship Engagement & Institutional Intelligence

### Phase 4.1: Embed Recommendation in FellowshipProgressCard
- [x] Wire ConditionRecommendation component into FellowshipProgressCard
- [x] Show recommended condition prominently in "Next Steps" section
- [x] Add "Practice Now" CTA that launches ResusGPS with recommended pathway
- [x] Display facility gap context ("Not practiced in 45 days at your facility")
- [x] Test recommendation display on all screen sizes
- [x] Verify recommendation updates after each ResusGPS session

### Phase 4.2: Practice Streak Gamification (In Progress - Manus)
- [ ] Create streak tracking schema (condition, consecutive days, current streak count)
- [ ] Build streak calculation logic (daily practice window, EAT timezone)
- [ ] Design streak badges (7-day, 14-day, 30-day milestones)
- [ ] Create StreakBadge component with visual progression
- [ ] Wire streak display into FellowshipProgressCard
- [ ] Add streak notifications ("7-day streak! Keep going")
- [ ] Create streak leaderboard (facility-level, anonymized)
- [ ] Test streak logic across timezone boundaries

### Phase 4.3: Facility Admin Dashboard (In Progress - Manus)
- [ ] Build FacilityTrainingGapsPage component
- [ ] Show conditions not practiced in 30/60/90 days
- [ ] Display staff engagement metrics (avg sessions/week, active learners)
- [ ] Create drill-down: condition → which staff haven't practiced → recommend training
- [ ] Add facility comparison (anonymized: "Your facility vs similar-sized hospitals")
- [ ] Export facility report (PDF with training gaps + recommendations)
- [ ] Wire to admin /admin/institutional-analytics route
- [ ] Test with various facility sizes and practice patterns

### Phase 4.4: ResusGPS Completion Notifications (In Progress - Manus)
- [ ] Wire ResusGPS completion handler to call recordSession
- [ ] Display validation feedback ("Session recorded: Septic Shock + Meningitis")
- [ ] Show next recommended condition in toast
- [ ] Add session summary (duration, interactions, depth score)
- [ ] Test notifications don't interfere with ResusGPS flow
- [ ] Verify notifications appear on all screen sizes

### Phase 4.5: Testing & Integration
- [ ] Create integration tests for streak system
- [ ] Test streak calculation across month boundaries
- [ ] Verify streak notifications don't spam users
- [ ] Test facility dashboard with edge cases (new facility, no practice data)
- [ ] Performance test: facility dashboard load <1s for 100+ staff
- [ ] Test leaderboard anonymization (no PII exposure)

### Phase 4.6: Documentation & Deployment
- [ ] Update FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md with engagement metrics
- [ ] Create GAMIFICATION_STRATEGY.md (streak rules, badge criteria, leaderboard logic)
- [ ] Create FACILITY_ADMIN_GUIDE.md (how to interpret training gaps)
- [ ] Update WORK_STATUS.md with completion notes
- [ ] Commit all changes to Git
- [ ] Ready for production deployment


## Phase 4: Micro-course Development (Following PSOT §15.2-15.5, §16)

### 4.1: Paediatric Septic Shock I (Foundational)
- [ ] Create course content outline (recognition, first-hour actions, safe escalation)
- [ ] Write module 1: Recognition of septic shock (clinical signs, perfusion assessment)
- [ ] Write module 2: First-hour safe actions (IV access, fluids, antibiotics, escalation)
- [ ] Write module 3: When to refer (vasoactive drugs, advanced monitoring, refractory shock)
- [ ] Create module quizzes (pass threshold 80%)
- [ ] Align with ResusGPS ABCDE mental model
- [ ] Add LMIC-safe framing (local policy first, pragmatic drug choices)
- [ ] Create course metadata (programType, pricingSku, courseDisplayName)
- [ ] Generate branded PDF certificate template
- [ ] Test full course flow (enroll → complete modules → pass quiz → download certificate)

### 4.2: Paediatric Septic Shock II (Advanced)
- [ ] Create course content outline (fluid-refractory shock, catecholamine-refractory shock, advanced therapies)
- [ ] Write modules (deeper management, second-line therapies, advanced monitoring)
- [ ] Set prerequisite: Septic Shock I must be completed
- [ ] Price at 1.5× Septic Shock I (per PSOT §16.4)
- [ ] Test prerequisite enforcement

### 4.3: Clinical Learning Journey Integration
- [ ] Create "Paediatric Septic Shock" learning journey (Septic Shock I + II + ResusGPS)
- [ ] Display journey on learner dashboard
- [ ] Show progression (Course I → Course II → ResusGPS)
- [ ] Track completion metrics
- [ ] Update admin reports to show journey enrollment and completion

### 4.4: Additional Micro-courses (Backlog)
- [ ] Asthma escalation (Course I + II)
- [ ] Convulsive status epilepticus (Course I + II)
- [ ] Anaphylaxis (Course I + II)
- [ ] DKA (Course I + II)
- [ ] Refer to MICRO_COURSE_CATALOG_BACKLOG.md for full 24-slot catalog

## Phase 5: Institutional Portal Enhancements (Following PSOT §15.3)

### 5.1: Staff Management
- [ ] Hospital admin can view staff roster
- [ ] Assign staff to courses
- [ ] Track course completion per staff member
- [ ] Generate staff training reports

### 5.2: Institutional Metrics & Readiness Signals
- [ ] Dashboard showing paediatric emergency readiness
- [ ] Staff training completion rates
- [ ] ResusGPS usage metrics
- [ ] Care Signal incident reporting integration

### 5.3: Care Signal Integration
- [ ] Provider incident reporting form
- [ ] Monthly discipline pillar tracking (courses + ResusGPS + Care Signal)
- [ ] QI culture dashboard for institutions


---

## Fellowship Qualification System Implementation (PSOT §16-17)

### Phase 1: Data & Schema (COMPLETE ✅)
- [x] PSOT updated: 26-course requirement (toxicology, burns, infectious)
- [x] Database schema extended: fellowshipProgress, fellowshipGraceUsage, fellowshipStreakResets
- [x] Extended microCourses with isRequired, courseOrder, prerequisite fields
- [x] Extended microCourseEnrollments with startedAt, prerequisiteValidated fields
- [x] Migration: 114 tables processed

### Phase 2: Automation & Procedures (IN PROGRESS)

#### 2.1 Course Prerequisite Enforcement
- [x] Create validatePrerequisite helper function
- [x] Implement prerequisite validation in fellowship qualification router
- [x] Update courses router to check prerequisites before enrollment
- [ ] Write integration test: enroll Course I → fail → cannot enroll Course II → pass → can enroll

#### 2.2 Care Signal Grace/Catch-Up/Streak Logic
- [x] Create getCareSIgnalMonthlyStatus helper (monthly validation)
- [x] Create processCareSIgnalMonthly helper (grace/catch-up/streak logic)
- [x] Implement grace budget tracking (2 per calendar year, EAT)
- [x] Implement catch-up rule (≥3 events in month after grace)
- [x] Implement streak reset on 3rd consecutive miss
- [ ] Write comprehensive tests: normal month, grace month, catch-up success, catch-up fail, streak reset

#### 2.3 Fellowship Qualification System
- [x] Create fellowshipQualificationRouter with 6 procedures
- [x] Implement validateEnrollment (prerequisite check)
- [x] Implement getProgress (all 3 pillars)
- [x] Implement getCoursePillarStatus (pillar A: 26 required courses)
- [x] Implement getCareSIgnalPillarStatus (pillar C: 24 months)
- [ ] Implement getResusGPSPillarStatus (pillar B: condition checklist)
- [x] Implement getFullStatus (all 3 pillars aggregated)
- [x] Implement processMonthly (admin: monthly Care Signal processing)
- [ ] Write integration tests: full journey (courses → ResusGPS → Care Signal → Fellow status)

### Phase 3: UI & Dashboard (NOT STARTED)

#### 3.1 Fellowship Progress Dashboard
- [ ] Create /fellowship/progress page route in App.tsx
- [ ] Build FellowshipProgressDashboard.tsx (main component)
- [ ] Build CoursePillarStatus.tsx (pillar A: required courses, progress bar, link to catalog)
- [ ] Build ResusGPSConditionChecklist.tsx (pillar B: conditions, session counts, link to ResusGPS)
- [ ] Build CareSIgnalMonthlyStatus.tsx (pillar C: monthly grid, streak, grace remaining, catch-up required)
- [ ] Build FellowshipBadge.tsx (Fellow badge with icon for header/profile)
- [ ] Build StreakResetAlert.tsx (alert when streak resets)
- [ ] Add fellowship progress link to learner dashboard

#### 3.2 UI Refinement & Messaging
- [ ] Write grace/catch-up/reset messaging (PSOT: "Discipline in logging is leadership behaviour training")
- [ ] Add tooltips explaining each pillar, grace rules, catch-up rule, streak reset
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Accessibility review (color contrast, keyboard navigation, screen reader support)

### Phase 4: Legal, Testing & Launch (NOT STARTED)

#### 4.1 Legal & Compliance
- [ ] Update privacy policy: Care Signal data collection, grace/streak rules, data retention, user rights
- [ ] Update ToS: fellowship criteria, grace budget, streak reset, no manual overrides, appeals process
- [ ] Document appeals process (system errors only, no subjective appeals)
- [ ] Get legal review and approval

#### 4.2 Testing & Validation
- [ ] Unit tests: all procedures (90%+ coverage)
- [ ] Integration tests: full journey (enroll courses → complete → ResusGPS sessions → Care Signal reporting → Fellow status)
- [ ] E2E tests: real user flow (login → enroll → fail → retry → pass → ResusGPS → Care Signal → progress dashboard)
- [ ] Grace/streak edge case tests: grace → catch-up success → grace → catch-up fail → reset
- [ ] Performance test: 100+ concurrent users checking fellowship progress, target <500ms response
- [ ] Security audit: no PII in public APIs, no privilege escalation, immutable audit trail

#### 4.3 Launch Readiness
- [ ] Data migration: backfill fellowshipProgress table for existing users
- [ ] Seed production data: run courses.seedCourses on production DB
- [ ] Smoke test: critical flows on production (enroll, complete, check progress)
- [ ] Documentation: update README, deployment guide, API docs
- [ ] User announcement: email about fellowship qualification system launch

### Critical Gaps to Close (From Audit)

#### Gap 1: Micro-Course Catalog Misalignment
- [x] PSOT updated to reflect 26-course requirement
- [ ] Create 10 missing courses (Croup, Upper Airway, Advanced Airway, Bronchiolitis, HFNC/CPAP, Anaphylaxis, Neurogenic, Cardiogenic x2, PE, Tamponade, Tet Spells, Systematic Approach, Cardiac Arrest)
- [ ] Reclassify 6 extra courses as "elective" (toxicology, burns, infectious)
- [ ] Set course order 1-26 per PSOT mapping
- [ ] Clinical review: all 26 courses with trusted references (WHO, AHA ECC, CDC, FEAST)

#### Gap 2: Course Prerequisites Not Enforced
- [x] Prerequisite enforcement implemented in router
- [ ] Integration test: verify Course II blocked without Course I completion

#### Gap 3: Care Signal Grace/Catch-Up/Streak Logic Missing
- [x] Grace logic implemented (2 per calendar year, EAT)
- [x] Catch-up rule implemented (≥3 events required)
- [x] Streak reset logic implemented (3rd consecutive miss)
- [ ] Comprehensive edge case tests

#### Gap 4: No Fellowship Qualification System
- [x] Router created with 6 procedures
- [x] Pillar A (courses) implemented
- [x] Pillar C (Care Signal) implemented
- [ ] Pillar B (ResusGPS conditions) implemented
- [ ] Full integration tests

#### Gap 5: No Fellowship Progress Dashboard
- [ ] Dashboard page created
- [ ] All 4 pillar components built
- [ ] Grace/streak messaging added
- [ ] Accessibility reviewed

#### Gap 6: Legal/Consent Flows Missing
- [ ] Privacy policy updated
- [ ] ToS updated
- [ ] Appeals process documented
- [ ] Legal review completed
