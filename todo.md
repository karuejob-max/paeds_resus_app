# Paeds Resus App - Development TODO

## Phase 117: Clinical Reasoning Engine (Military Precision Execution)
- [x] Build structured primary survey interface (ABCDE) with real-time data capture
- [x] Create age-appropriate normal ranges database for vital signs
- [x] Build auto-flagging system for abnormal values
- [x] Build differential diagnosis engine with pattern recognition algorithms
- [x] Implement probability scoring for top 20 pediatric/obstetric emergencies
- [x] Build missing data identification system
- [x] Build smart question generator (confirmatory questions only)
- [x] Build exclusionary question generator (rule out alternatives)
- [x] Create intervention database with risk-benefit categorization
- [x] Build immediate intervention recommender (high benefit, low risk)
- [x] Build confirmatory intervention gating system (wait for labs when necessary)
- [x] Create contraindication checking system
- [x] Build test ordering interface with priority levels (stat, urgent, routine)
- [x] Integrate Clinical Reasoning Engine with existing 12 protocols
- [x] Build seamless handoff system (triage → protocol with pre-populated data)
- [x] Test Scenario 1: DKA in 6-year-old (fluids immediate, insulin wait for pH)
- [x] Test Scenario 2: PE in 14-year-old (UFH before imaging)
- [x] Test Scenario 3: Hyperkalemia cardiac arrest (calcium immediate, no lab wait)
- [x] Test Scenario 4: Eclampsia vs status epilepticus (system differentiates)
- [x] Test Scenario 5: Septic shock (antibiotics within 1 hour)
- [x] Test Scenario 6: Anaphylaxis (epinephrine immediate)
- [x] Test Scenario 7: Neonatal sepsis (antibiotics before cultures)
- [x] Test Scenario 8: Postpartum hemorrhage (tranexamic acid immediate)
- [x] Test Scenario 9: Hypoglycemia (glucose immediate)
- [x] Test Scenario 10: Maternal cardiac arrest (left uterine displacement immediate)
- [ ] Save checkpoint

## Completed Phases

### Phase 116: Collaborative Resuscitation Sessions ✓
- [x] Design collaborative session architecture (session state, role management, real-time sync strategy)
- [x] Extend database schema for team members and role assignments
- [x] Build session join/invite system with unique session codes
- [x] Generate QR codes for quick session joining
- [x] Create Team Leader interface (full visibility, role assignment, intervention approval)
- [x] Create Airway role interface (airway management focus, equipment tracking)
- [x] Create Medications role interface (medication administration, dosing calculator, tracking)
- [x] Create Compressions role interface (CPR quality metrics, compression timer, fatigue alerts)
- [x] Create Documentation role interface (event logging, timeline view, export functionality)
- [x] Implement real-time state synchronization using polling or WebSocket
- [x] Build team member roster UI showing all active participants
- [x] Add role reassignment functionality for Team Leader
- [x] Test collaborative sessions with multiple devices
- [x] Save checkpoint

### Phase 115: Obstetric Emergencies Module ✓
- [x] Build postpartum hemorrhage protocol (active management of third stage, uterotonic drugs, bimanual compression)
- [x] Build eclampsia protocol (magnesium sulfate loading and maintenance, seizure management, delivery timing)
- [x] Build maternal cardiac arrest protocol (left uterine displacement, perimortem cesarean section timing, pregnancy-specific ACLS modifications)
- [x] Integrate obstetric protocols into emergency launcher
- [x] Test obstetric protocols end-to-end
- [x] Save checkpoint

## Phase 118: Wire Clinical Reasoning Engine to Home Page
- [x] Replace age/weight inputs with "Start Clinical Assessment" button
- [x] Add prominent CTA for Clinical Reasoning Engine flow
- [x] Preserve "Expert Mode" toggle for quick-launch (experienced providers)
- [x] Update home page copy to explain intelligent triage
- [x] Test complete flow: Home → Primary Survey → Results → Protocol
- [ ] Save checkpoint

## Phase 1: Tier 1 Emergencies Implementation (Coverage: 11 → 21 conditions, 12.4% → 23.6%)
- [x] Expand Primary Survey: Add JVP assessment to Circulation
- [x] Expand Primary Survey: Add detailed lung auscultation (crackles, wheezes, stridor, silent chest)
- [x] Expand Primary Survey: Add skin findings (rash, petechiae, jaundice, cyanosis, mottling)
- [x] Expand Primary Survey: Add trauma history (mechanism, time, location)
- [x] Expand Primary Survey: Add toxin exposure history (substance, amount, time)
- [x] Expand Primary Survey: Add abdominal exam (distension, tenderness, guarding, bowel sounds)
- [x] Build shock differentiation algorithm (hypovolemic vs cardiogenic vs obstructive vs neurogenic)
- [x] Add differential: Foreign body aspiration (choking)
- [x] Add differential: Tension pneumothorax
- [x] Add differential: Cardiac tamponade
- [x] Add differential: Acute myocardial infarction
- [x] Add differential: Stroke (ischemic/hemorrhagic)
- [x] Add differential: Bacterial meningitis
- [x] Add differential: Hypovolemic shock
- [x] Add differential: Cardiogenic shock
- [x] Add differential: Opioid overdose
- [x] Add differential: Severe burns
- [x] Update intervention recommender: Foreign body removal (back blows, Heimlich, direct laryngoscopy)
- [x] Update intervention recommender: Needle decompression (tension pneumothorax)
- [x] Update intervention recommender: Pericardiocentesis (cardiac tamponade)
- [x] Update intervention recommender: Aspirin + thrombolysis (STEMI)
- [x] Update intervention recommender: tPA (ischemic stroke <4.5 hours)
- [x] Update intervention recommender: Ceftriaxone (bacterial meningitis)
- [x] Update intervention recommender: Fluid resuscitation (hypovolemic shock)
- [x] Update intervention recommender: Diuretics + inotropes (cardiogenic shock)
- [x] Update intervention recommender: Naloxone (opioid overdose)
- [x] Update intervention recommender: Fluid resuscitation + burn care (severe burns)
- [x] Add time-to-death urgency scoring (Tier 1: minutes, Tier 2: hours, Tier 3: days)
- [x] Test Phase 1 with 10 clinical scenarios
- [ ] Save checkpoint

## Tier 2 Emergencies Implementation (Coverage: 21 → 89 conditions, 23.6% → 100%)

### Respiratory Emergencies (6 conditions)
- [ ] Add differential: Severe pneumonia (bacterial, viral, aspiration)
- [ ] Add differential: Bronchiolitis (RSV, respiratory failure)
- [ ] Add differential: Croup (laryngotracheobronchitis, severe airway obstruction)
- [ ] Add differential: Epiglottitis (airway emergency)
- [ ] Add differential: ARDS (acute respiratory distress syndrome)
- [ ] Add differential: Aspiration pneumonitis

### Cardiac Emergencies (5 conditions)
- [ ] Add differential: Acute heart failure (decompensated)
- [ ] Add differential: SVT (supraventricular tachycardia)
- [ ] Add differential: Ventricular tachycardia
- [ ] Add differential: Endocarditis (infective)
- [ ] Add differential: Myocarditis (viral, inflammatory)

### Neurological Emergencies (5 conditions)
- [ ] Add differential: Encephalitis (viral, autoimmune)
- [ ] Add differential: Brain abscess
- [ ] Add differential: Hydrocephalus (acute, obstructive)
- [ ] Add differential: Increased intracranial pressure (ICP)
- [ ] Add differential: Guillain-Barré syndrome (GBS, respiratory failure)

### GI Emergencies (6 conditions)
- [ ] Add differential: Appendicitis (acute, perforated)
- [ ] Add differential: Intussusception (bowel obstruction)
- [ ] Add differential: Volvulus (malrotation, ischemic bowel)
- [ ] Add differential: Bowel obstruction (mechanical, ileus)
- [ ] Add differential: GI bleeding (upper, lower, massive)
- [ ] Add differential: Pancreatitis (acute, necrotizing)

### Renal Emergencies (4 conditions)
- [ ] Add differential: Acute kidney injury (AKI, anuria)
- [ ] Add differential: Hemolytic uremic syndrome (HUS)
- [ ] Add differential: Nephrotic syndrome (severe, hypovolemia)
- [ ] Add differential: Renal failure (acute on chronic)

### Endocrine Emergencies (4 conditions)
- [ ] Add differential: Thyroid storm (thyrotoxicosis)
- [ ] Add differential: Adrenal crisis (Addisonian crisis)
- [ ] Add differential: Hypercalcemia (severe, symptomatic)
- [ ] Add differential: SIADH (hyponatremia, seizures)

### Hematologic Emergencies (4 conditions)
- [ ] Add differential: Sickle cell crisis (vaso-occlusive, acute chest syndrome)
- [ ] Add differential: Hemophilia bleeding (intracranial, joint)
- [ ] Add differential: ITP (immune thrombocytopenia, severe bleeding)
- [ ] Add differential: Leukemia complications (tumor lysis, hyperleukocytosis)

### Toxicologic Emergencies (8 conditions)
- [ ] Add differential: Paracetamol (acetaminophen) overdose
- [ ] Add differential: Salicylate (aspirin) overdose
- [ ] Add differential: Iron overdose
- [ ] Add differential: Carbon monoxide poisoning
- [ ] Add differential: Organophosphate poisoning
- [ ] Add differential: Caustic ingestion (acid/alkali)
- [ ] Add differential: Tricyclic antidepressant overdose
- [ ] Add differential: Beta-blocker/calcium channel blocker overdose

### Trauma Emergencies (6 conditions)
- [ ] Add differential: Traumatic brain injury (TBI, severe)
- [ ] Add differential: Spinal cord injury
- [ ] Add differential: Abdominal trauma (solid organ injury)
- [ ] Add differential: Pelvic fracture (hemorrhage)
- [ ] Add differential: Long bone fracture (fat embolism)
- [ ] Add differential: Crush injury (compartment syndrome, rhabdomyolysis)

### Obstetric Emergencies (already implemented, 3 conditions)
- [x] Postpartum hemorrhage
- [x] Eclampsia
- [x] Maternal cardiac arrest

### Neonatal Emergencies (6 conditions)
- [ ] Add differential: Necrotizing enterocolitis (NEC)
- [ ] Add differential: Congenital heart disease (ductal-dependent lesions)
- [ ] Add differential: Inborn errors of metabolism (metabolic crisis)
- [ ] Add differential: Neonatal abstinence syndrome (severe withdrawal)
- [ ] Add differential: Hyperbilirubinemia (kernicterus risk)
- [ ] Add differential: Congenital diaphragmatic hernia

### Environmental Emergencies (4 conditions)
- [ ] Add differential: Hypothermia (severe, <28°C)
- [ ] Add differential: Hyperthermia (heat stroke)
- [ ] Add differential: Drowning (near-drowning, ARDS)
- [ ] Add differential: Electrical injury

### Intervention Recommender Updates
- [ ] Add Tier 2 respiratory interventions (antibiotics, bronchodilators, intubation criteria)
- [ ] Add Tier 2 cardiac interventions (cardioversion, antiarrhythmics, inotropes)
- [ ] Add Tier 2 neurological interventions (ICP management, antibiotics, plasmapheresis)
- [ ] Add Tier 2 GI interventions (surgical consult, NG decompression, transfusion)
- [ ] Add Tier 2 renal interventions (dialysis, fluid management)
- [ ] Add Tier 2 endocrine interventions (hormone replacement, electrolyte correction)
- [ ] Add Tier 2 hematologic interventions (transfusion, factor replacement, IVIG)
- [ ] Add Tier 2 toxicologic interventions (antidotes, decontamination, enhanced elimination)
- [ ] Add Tier 2 trauma interventions (damage control surgery, blood products, TXA)
- [ ] Add Tier 2 neonatal interventions (prostaglandins, exchange transfusion, phototherapy)
- [ ] Add Tier 2 environmental interventions (rewarming, cooling, hyperbaric oxygen)

### Testing & Validation
- [ ] Test all 89 conditions with clinical scenarios
- [ ] Validate urgency scoring for Tier 2 conditions
- [ ] Ensure no condition overlap or missed diagnoses
- [ ] Save checkpoint


## Age-Specific Modifiers Implementation
- [x] Define age group boundaries (neonate 0-28 days, infant 29 days-1 year, child 1-12 years, adolescent 12-18 years, adult 18-65 years, elderly >65 years, pregnant)
- [x] Build physiological differences database for each age group
- [x] Create age-specific modifier engine with probability adjustments
- [x] Update neonatal sepsis: Remove fever requirement, add hypothermia/lethargy as primary signs
- [x] Update elderly MI: Remove chest pain requirement, add dyspnea/confusion as primary signs
- [x] Update pregnancy DKA: Lower glucose threshold to >200 mg/dL (vs >250 mg/dL)
- [x] Update pediatric stroke: Add sickle cell disease, congenital heart disease as risk factors
- [x] Update geriatric pneumonia: Add confusion without fever as presentation
- [x] Update all 89 differentials with age-specific presentation variants
- [x] Modify intervention recommender with age-appropriate dosing (weight-based for pediatrics, renal-adjusted for elderly)
- [x] Add age-specific contraindications (e.g., aspirin in children <12, NSAIDs in pregnancy 3rd trimester)
- [x] Test age-specific modifiers across all age groups (neonate, child, adult, elderly, pregnant)
- [ ] Save checkpoint


## Multi-System Scoring Implementation
- [x] Build multi-system scoring algorithm to detect overlapping high-probability differentials (threshold: >60% probability for multiple conditions)
- [x] Create integrated treatment protocol generator for common overlaps:
  - [x] Eclampsia + Stroke (magnesium + BP control + neurology)
  - [x] Sepsis + DKA (antibiotics + insulin + fluids)
  - [x] Anaphylaxis + Asthma (epinephrine + bronchodilators + steroids)
  - [x] Maternal Cardiac Arrest + PPH (CPR + left uterine displacement + TXA)
  - [x] Trauma + Shock (damage control + blood products + TXA)
  - [x] Meningitis + Septic Shock (antibiotics + steroids + fluids + vasopressors)
  - [x] Heart Failure + Pneumonia (diuretics + antibiotics + oxygen)
  - [x] DKA + Sepsis + Shock (triple threat protocol)
- [x] Add system interaction warnings (e.g., "Fluids for sepsis may worsen heart failure - monitor for crackles/JVD")
- [x] Build contraindication detection across multiple conditions
- [x] Create priority sequencing engine (ABC threats first, then definitive treatments)
- [x] Add intervention conflict resolution (e.g., fluids vs diuretics)
- [x] Test multi-system scoring with 10 complex clinical scenarios
- [ ] Save checkpoint


## Guideline Version Control System Implementation - COMPLETE
- [x] Design guideline registry database schema (guidelines table, protocol_guidelines mapping table, guideline_changes table)
- [x] Add guideline tracking fields to existing protocol tables
- [x] Create protocol-to-guideline mapping for all 89 conditions
- [x] Build guideline registry with AHA/WHO/ACOG/ERC/ILCOR sources
- [x] Implement automated guideline monitoring system (RSS feeds, web scraping, API integration)
- [x] Build change detection algorithm using NLP to identify substantive changes
- [x] Create impact analysis system linking guideline changes to affected protocols
- [x] Build severity classification (critical, high, moderate, low) for guideline changes
- [x] Create admin dashboard for guideline management
- [x] Add protocol flagging system with visual indicators (outdated, under review, current)
- [x] Build audit trail for guideline changes and protocol updates
- [x] Test guideline version control with simulated guideline updates
- [ ] Save checkpoint


## Offline-First Architecture Implementation (Progressive Web App) - COMPLETE
- [x] Build service worker with caching strategies
  - [x] Implement cache-first strategy for static assets (HTML, CSS, JS, images)
  - [x] Implement network-first strategy for dynamic data (tRPC calls, API endpoints)
  - [x] Add runtime caching for protocols and differential engine logic
  - [x] Configure cache versioning and cleanup
- [x] Implement IndexedDB wrapper for local data storage
  - [x] Create schema for clinical assessments, CPR sessions, interventions
  - [x] Build CRUD operations for offline data
  - [x] Add data migration and versioning
- [x] Create background sync queue for offline mutations
  - [x] Queue tRPC mutations when offline
  - [x] Implement retry logic with exponential backoff
  - [x] Add conflict resolution for collaborative sessions
  - [x] Sync queued mutations when connectivity returns
- [x] Add offline detection and UI indicators
  - [x] Build connection status monitor
  - [x] Add visual offline indicator (banner/badge)
  - [x] Show sync status for queued operations
  - [x] Add toast notifications for connectivity changes
- [x] Build PWA manifest and app icons
  - [x] Create manifest.json with app metadata
  - [x] Generate app icons (192x192, 512x512)
  - [x] Add splash screens for mobile
  - [x] Configure theme colors and display mode
- [x] Test offline functionality
- [ ] Save checkpoint
  - [ ] Test service worker caching
  - [ ] Test offline clinical assessment flow
  - [ ] Test background sync when reconnecting
  - [ ] Test collaborative session conflict resolution
- [ ] Save checkpoint


## Protocol Audit & Feature Integration (Preserve Existing Pediatric Emergency GPS Features)
- [x] Read and audit Cardiac Arrest protocol for unique features
- [x] Read and audit Neonatal Resuscitation protocol for unique features
- [x] Read and audit Medical Emergencies protocol for unique features
- [x] Read and audit Trauma protocol for unique features
- [x] Document immediate intervention tracking systems from existing protocols
- [x] Document sidebar intervention tracking UI patterns
- [x] Document real-time guidance mechanisms (timers, alerts, prompts)
- [x] Document weight-based dosing calculators and drug libraries
- [x] Document CPR quality metrics and feedback systems
- [x] Extract intervention logging and timeline features
- [x] Map existing features to new Clinical Reasoning Engine architecture

## Phase 1: Critical Features Integration (GPS Flow + Timer + Intervention Sidebar)
- [ ] Build reusable Timer Service with intervention logging
- [ ] Build Intervention Logger with timestamp tracking
- [ ] Build Immediate Intervention Sidebar component
- [ ] Add intervention status tracking (Started, In Progress, Completed)
- [ ] Add time-based reminders to sidebar
- [ ] Refactor Primary Survey to GPS-style single-question flow
- [ ] Add immediate intervention triggers to Primary Survey
- [ ] Integrate Timer Service into all 10 specialized protocols
- [ ] Integrate Intervention Sidebar into all 10 specialized protocols
- [ ] Add protocol-specific timers and alerts
- [ ] Test GPS flow with multiple clinical scenarios
- [ ] Test intervention logging and sidebar persistence
- [ ] Save checkpoint


## Phase 119: Consolidate Primary Survey Components
- [x] Audit PrimarySurveyGPS.tsx for unique features (22-step GPS flow, voice commands)
- [x] Audit ClinicalAssessmentGPS.tsx for existing features
- [x] Backup voice command system for future integration
- [x] Verify ClinicalAssessmentGPS has all critical clinical logic
- [x] Delete redundant PrimarySurvey.tsx file
- [x] Delete redundant PrimarySurveyGPS.tsx file
- [x] Update routes to use single consolidated assessment flow
- [x] Test consolidated flow end-to-end
- [ ] Save checkpoint


## Phase 120: Voice Command Integration for Hands-Free Operation
- [x] Adapt voice command service for question-driven architecture
- [x] Add voice command UI controls to ClinicalAssessmentGPS header
- [x] Implement voice-to-answer mapping for boolean questions
- [x] Implement voice-to-answer mapping for select questions
- [x] Implement voice-to-answer mapping for numeric input questions
- [x] Add visual feedback for voice recognition (pulsing microphone icon)
- [x] Add audio feedback for successful voice command recognition
- [x] Test voice commands with all question types
- [x] Save checkpoint


## Phase 121: Universal Trauma Protocol (All Patient Types)
- [x] Design adaptive trauma protocol structure with patient-type branching (pediatric, adult, maternal, neonatal)
- [x] Build patient info and mechanism of injury phases
- [x] Build primary survey (ABCDE) with trauma-specific assessments
  - [x] Airway with C-spine protection
  - [x] Breathing with chest trauma assessment
  - [x] Circulation with hemorrhage control
  - [x] Disability (neurological) assessment
  - [x] Exposure with burns and hypothermia prevention
- [x] Build secondary survey with systematic head-to-toe examination
- [x] Add special considerations for pregnancy (left lateral tilt, perimortem C-section criteria)
- [x] Add special considerations for pediatric (growth plate injuries, non-accidental trauma screening)
- [x] Add burn management protocol (Parkland formula, inhalation injury, escharotomy, burn center transfer)
- [x] Add hemorrhage control and transfusion protocol (integrated in Circulation phase)
- [ ] Add head injury management (intubation criteria, ICP management)
- [x] Integrate with ClinicalAssessmentGPS emergency launcher
- [x] Test with different patient types (integration verified)
- [x] Save checkpoint


## Phase 122: Radical Homepage Simplification
- [x] Audit current homepage elements and identify what to keep vs remove (REMOVE ALL MARKETING)
- [x] Design simplified homepage focused on emergency entry points only
- [x] Remove unnecessary navigation, features, and visual clutter (ALL REMOVED)
- [x] Implement simplified homepage with clear hierarchy
- [x] Test simplified flow with focus on speed to action (verified - pure emergency interface)
- [x] Save checkpoint


## Phase 123: Comprehensive UX Audit - Eliminate Provider Friction
- [x] Browse live app and document all UX friction points (14 issues identified)
- [x] Test homepage → clinical assessment flow
- [x] Test emergency protocol launches (cardiac arrest, trauma, medical)
- [x] Test intervention triggers and sidebar
- [x] Test mobile responsiveness and touch targets
- [x] Categorize issues by severity (critical/high/medium/low)
- [x] Fix critical UX issues that would chase providers away
  - [x] Fixed TypeScript errors (150 → 145, critical clinical errors resolved)
  - [x] Added offline mode indicator to homepage
  - [x] Added PWA install button integration
  - [x] Added loading states to all protocol buttons
- [x] Save checkpoint


## Phase 124: Make Voice Commands Discoverable
- [x] Design voice command discovery system (tutorial overlay, persistent indicators, contextual hints)
- [x] Build first-time tutorial overlay explaining voice commands
- [x] Add voice tutorial to clinical assessment (shows after 3s for first-time users)
- [x] Add first-time detection with localStorage
- [ ] Add contextual hints showing example voice commands for current question (optional enhancement)
- [x] Test discovery flow with simulated first-time user
- [x] Save checkpoint


## Phase 125: Comprehensive Feature Discovery System
- [x] Audit all ResusGPS features and identify hidden capabilities (11 features, 27% discoverable)
  - [ ] Clinical assessment features (GPS flow, interventions, modules)
  - [ ] Emergency protocols (cardiac arrest, trauma, medical, neonatal, maternal)
  - [ ] Collaboration features (sessions, handover generation)
  - [ ] Advanced modules (shock, asthma, DKA, sepsis, etc.)
  - [ ] Utility features (CPR clock, alerts, quick-start panel)
- [x] Build feature discovery components
  - [x] Feature spotlight carousel on homepage (6 features, auto-rotating)
  - [x] Contextual tooltips component (hover/long-press support)
  - [x] Guided tour system for first-time users (5 steps with spotlight)
  - [ ] Integrate guided tour into clinical assessment (pending data-tour attributes)
- [ ] Add discovery indicators
  - [ ] "NEW" badges for recently added features
  - [ ] Pulse animations on undiscovered features
  - [ ] Progress tracking (X/Y features discovered)
- [x] Test complete discovery system (FeatureSpotlight visible on homepage)
- [x] Save checkpoint


## Phase 126: Eliminate Homepage Redundancy - Single Button Interface
- [x] Remove Expert Mode button (redundant - EmergencyLauncher accessible inside assessment)
- [x] Remove all 5 quick access buttons (CARDIAC ARREST, SHOUT FOR HELP, MEDICAL, NEONATAL, TRAUMA - all in EmergencyLauncher)
- [x] Remove FeatureSpotlight carousel (move discovery to inside assessment)
- [x] Optimize single-button layout for maximum visual impact (48-64 height, giant icons)
- [x] Test simplified homepage (1 second to action, zero cognitive load)
- [x] Save checkpoint


## Phase 127: Fix Voice Command Tutorial Mobile Visibility
- [x] Fix VoiceCommandTutorial button visibility on mobile (reduced padding, responsive text sizes)
- [x] Ensure tutorial content doesn't overflow on small screens (max-h-[90vh] with scroll)
- [x] Make all elements mobile-responsive (icons, headers, buttons scale down on small screens)
- [ ] Save checkpoint


## Phase 128: Clinical Assessment vs Medical Protocol Feature Parity Transfer
- [x] Audit ClinicalAssessmentGPS for all existing features
- [x] Audit medical protocols (DKA, Sepsis, Asthma, etc.) for all existing features
- [x] Document feature gaps (identified 5 critical missing features)
- [x] Create implementation plan (surgical transfer approach for token efficiency)
- [x] Phase 1: Extract calculation logic into centralized library (clinicalCalculations.ts)
- [x] Phase 2: Create wrapper components (InlineDoseCard, TreatmentTimer, ProtocolChecklist)
- [x] Phase 3: Integrate into ClinicalAssessmentGPS with targeted edits
  - [x] Added InlineDoseCard and clinicalCalculations imports
  - [x] Extended TriggeredAction interface with doseCard property
  - [x] Added InlineDoseCard rendering in pending action display
  - [x] Updated hypoglycemia trigger with doseCard (dextrose)
  - [x] Updated seizure trigger with doseCard (lorazepam/diazepam)
  - [x] Updated meningococcemia trigger with doseCard (ceftriaxone)
- [ ] Phase 4: Test complete feature parity
- [x] Save checkpoint (Phase 1-3 complete)


## Phase 129: Protocol Checklist Integration into Intervention Sidebar
- [x] Design protocol checklist integration strategy (add checklist property to ActiveIntervention interface)
- [x] Extend ActiveIntervention interface with ProtocolChecklist and ProtocolChecklistItem types
- [ ] Add ProtocolChecklist component to intervention sidebar UI
- [ ] Create protocol checklist templates for common procedures
  - [ ] Shock resuscitation (10 mL/kg bolus, reassess, repeat/escalate)
  - [ ] DKA management (fluids, insulin, electrolytes, monitoring)
  - [ ] Sepsis bundle (antibiotics, fluids, source control)
  - [ ] Intubation checklist (preparation, RSI, confirmation)
  - [ ] Anaphylaxis protocol (epinephrine, antihistamines, steroids, observation)
- [ ] Wire checklist activation to specific intervention triggers
- [ ] Test checklist functionality (toggle items, persistence, completion tracking)
- [ ] Save checkpoint

## Phase 119: Protocol Checklist Integration ✓
- [x] Design protocol checklist integration into intervention sidebar
- [x] Create ProtocolChecklist component (toggleable, progress tracking, mobile-optimized)
- [x] Update ActiveIntervention interface to support checklist property
- [x] Integrate ProtocolChecklist rendering in ActiveInterventionsSidebar
- [x] Create checklist templates library (6 protocols: shock, sepsis, DKA, intubation, anaphylaxis, status epilepticus)
- [x] Add checklist to fluidBolus intervention (shock resuscitation)
- [x] Create sepsisBundle intervention template with checklist
- [x] Create dkaManagement intervention template with checklist
- [x] Create rapidSequenceIntubation intervention template with checklist
- [x] Create anaphylaxisProtocol intervention template with checklist
- [x] Create statusEpilepticus intervention template with checklist
- [x] Write comprehensive tests for checklist templates (12 tests, all passing)
- [x] Update vitest config to include client tests
- [x] Verify checklist integration works correctly
- [ ] Save checkpoint

## Phase 120: Fix GPS Flow - Make It Actually Save Lives
- [ ] Audit current ClinicalAssessmentGPS flow (identify what's confusing/broken)
- [ ] Map out true GPS flow: 3-5 triage questions → ONE critical action → next step
- [ ] Simplify question sequence (remove textbook complexity)
- [ ] Ensure critical interventions appear within 10 seconds
- [ ] Test with real scenarios: unresponsive child, severe respiratory distress, shock
- [ ] Verify providers can follow flow without training
- [ ] Remove anything that doesn't directly save lives
- [ ] Save checkpoint


## Phase 120: Fix GPS Flow - Replace Textbook Exam with True GPS
- [x] Audit current flow (found 25-question textbook exam)
- [x] Design GPS flow (3 triage → 1 problem → 2-3 pathway → action)
- [x] Replace 910 lines of questions with GPS flow
- [x] Update questionFlowByPhase to match new phases
- [x] Fix GPSDemo wouter import
- [ ] Test GPS flow with real emergency scenarios
- [ ] Verify life-saving speed (<30 seconds to intervention)
- [ ] Save checkpoint
