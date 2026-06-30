**PAEDS RESUS LIMITED**

*AHA Aligned Training Site — ID: TS70875*

**THE OBSERVATION ARCHITECTURE**

*Version 1.1 — June 2026*

*How Paeds Resus Observes, Learns, and Changes Itself*

Classification: Internal — Constitutional Document

*Supersedes: Observation Architecture v1.0*

*Read alongside: North Star Document, Platform Source of Truth (PSoT)*

***The quality of every insight this platform will ever produce is limited by the quality of the observations collected today. This document defines what is observed, by whom, in what form, and what is preserved permanently — and how those observations become knowledge that changes practice.***

***v1.1 adds to v1.0: role-at-time-of-event; global geographic hierarchy; optional collaborative event model; temporal interval capture; Learning Cohort evaluation framework; bidirectional Knowledge Base (Failure and Success Patterns); Intervention and Implementation objects; multidimensional confidence; Learning Governance chapter including the three-truth framework, four evidence sources, evidence ladders, concept drift management, and Knowledge Stewardship.***

# PREAMBLE: THE CONSTITUTIONAL HIERARCHY

The Paeds Resus platform has three constitutional documents. Together they define what the organisation is, what it builds, and how it becomes better over time.

| Document | Question it answers |
|---|---|
| North Star Document | Why does Paeds Resus exist? What is the problem, the mission, and the theory of change? |
| Platform Source of Truth (PSoT) | What does Paeds Resus build, for whom, and how? Binding technical and product decisions. |
| This document — Observation Architecture v1.1 | How does Paeds Resus learn? How do observations become knowledge, and how does knowledge change practice? |

Version 1.1 introduces a material expansion of scope. The document now covers not only how reality is observed and preserved, but how observations become trusted knowledge, how that knowledge updates the platform, and who governs those updates. This makes it the first document that explicitly defines how Paeds Resus changes itself.

Every section follows a four-part structure: Problem (what goes wrong without this), Principle (the governing commitment), Engineering Requirement (what must be built), and Future Evolution (what today's decision preserves for tomorrow). This structure ensures the document is immediately actionable, not merely philosophical.

***Every engineer, product designer, clinical advisor, and researcher who works on any Paeds Resus product must read this document before making decisions that affect data collection, storage, transformation, or clinical content. Decisions made without this framework will produce incompatible data streams, unverifiable patterns, and recommendations without accountability.***

# SECTION 1: PURPOSE AND THE ADAPTIVE LEARNING SYSTEM

### 1.1  The Governing Frame: The Learning Cycle

Paeds Resus is built around a learning cycle. The cycle is the strategic asset. The dataset is a means to maintain it. The platform generates value not by accumulating data but by continuously converting observations into better care.

| Stage | What happens |
|---|---|
| 1. Operational Platform | Providers use ResusGPS. Courses are completed. Fellowship milestones are reached. Caregivers submit Safe-Truth experiences. Institutions audit readiness. All interactions generate observations. |
| 2. Observation Collection | Structured observations are captured: clinical decisions, gap classifications, caregiver journey stages, competency assessments, resource availability, temporal intervals. |
| 3. Adaptive Learning System | Observations are aggregated. Signals emerge. Failure modes and success factors are identified. Patterns are detected across sites and time. Confidence is built. |
| 4. Knowledge Base | Confirmed Failure Patterns and Success Patterns are recorded with multidimensional confidence, supporting evidence, temporal trends, and intervention records. |
| 5. Platform Updates | Knowledge feeds back into ResusGPS pathways (versioned), micro-course content, Care Signal recommendations, and institutional advice. Every update carries a reference to the knowledge that motivated it. |
| 6. Outcome Evaluation | Interventions based on knowledge are tracked. Outcomes are evaluated. The Knowledge Base is updated. The Adaptive Learning System learns which of its own recommendations work. |
| 7. Operational Platform | The updated platform reaches the next provider, in the next emergency. The cycle closes. |

This is an Adaptive Learning System, not a Learning Engine. The distinction is architectural: the platform itself changes based on what it learns. ResusGPS v3.2 may be informed by Failure Pattern 18 and Success Pattern 7 at confidence 0.92. Ten years from now it will be possible to ask: which version of ResusGPS reduced mortality the most?

***The dataset is valuable because it continuously improves care. A dataset collected for its own sake is mission drift. Every observation must have a plausible path to improving the care of a future child.***

### 1.2  The Four Businesses

Paeds Resus contains four mutually reinforcing businesses. Understanding their relationships is essential to understanding why the Observation Architecture matters.

| Business | What it does and how it feeds the others |
|---|---|
| 1. Education | AHA certifications, micro-courses, Fellowship. Generates cash flow, builds the provider workforce, and produces the observations that feed the Learning System. |
| 2. Quality Improvement | Productised ERS packages, institutional readiness audits, gap closure consulting. Generates institutional relationships and implementation data that enables outcome evaluation. |
| 3. Learning Network | Failure and Success Pattern intelligence, benchmarking, peer learning between institutions, policy recommendations. The moat. Made possible by Education observations and Quality Improvement implementation records. |
| 4. Decision Support | ResusGPS pathways updated by confirmed knowledge. Clinical decision support at the point of care. The highest direct impact per interaction. Makes Education more effective and generates more observations. |

Business 3 (Learning Network) makes all others better. Business 1 (Education) generates the observations Business 3 needs. Business 2 (Quality Improvement) generates the implementation evidence Business 3 needs to evaluate its own recommendations. Business 4 (Decision Support) delivers what Business 3 has learned back to the bedside.

# SECTION 2: DESIGN PRINCIPLES

These principles govern every decision about what to observe, how to store it, and how to use it. They are constraints. Deviations require explicit CEO sign-off and a documented exception in WORK_STATUS.md.

**Principle 1: Every Field Must Have a Plausible Path to Improving a Future Child's Care**

### Problem

Data hoarding is a failure mode of learning systems. Collecting fields that have no plausible connection to clinical improvement creates form friction, reduces completion quality, and obscures the signals that matter.

### Principle

Before any field is added to any observation form, the team must articulate how that field could eventually improve a clinical decision, a training priority, a procurement choice, or a policy recommendation. If no plausible path exists, the field is not collected.

### Engineering Requirement

- Every new form field requires a documented learning hypothesis before implementation: "We collect this because it may reveal X, which would allow us to do Y, which would improve Z for future children."
- Fields without documented hypotheses are candidates for removal at the next form review.
- This rule applies to all observer classes: Care Signal, Safe-Truth, ResusGPS, Fellowship, Institutional Readiness.

### Future Evolution

As the Knowledge Base matures, the platform will develop evidence about which fields are most predictive. Fields that have contributed to no confirmed pattern after three years of collection should be reviewed for removal or redesign.

### Principle 2: Preserve the Raw Observation

### Problem

Every transformation of information destroys information. Premature classification locks the system into today's understanding and makes it impossible to discover things the founders did not anticipate.

### Principle

Every observation must retain a raw layer — free text or structured narrative — that is never overwritten, never discarded, and never replaced by its derived classification. The classification is derived from the observation. The observation is not derived from the classification.

### Engineering Requirement

- Raw narrative fields (TEXT) are immutable after submission — never truncated, overwritten, or deleted except by legal requirement with explicit audit trail.
- On account deletion, userId is set to null (anonymisation). The raw narrative remains in the aggregate dataset.
- Classification fields carry a schema_version column. When taxonomy changes, reclassification adds new columns alongside originals — never drops the original.

### Future Evolution

Future AI analysis will operate on raw narratives to extract signals the current taxonomy cannot yet classify. The quality of that future analysis depends entirely on the quality of preservation today.

### Principle 3: Delay Irreversible Transformations and Abstractions

### Problem

Premature commitment to an interpretive framework — whether a schema design or a conceptual model — makes the system unable to learn beyond its initial assumptions. This applies to data transformations and to architectural abstractions.

### Principle

Store observations and their classifications separately. Classifications are versioned and recomputable. No classification is treated as authoritative that cannot be traced to the observations that generated it. Architectural abstractions are introduced when the evidence demands them, not before.

### Engineering Requirement

- Observations and derived signals exist in separate tables. Signals carry a derivation_version.
- Failure Pattern records exist in a separate Knowledge Base, never embedded in observation rows.
- The taxonomy is versioned. Every observation row carries schema_version.
- Reclassification jobs are idempotent and rerunnable from source observations.

### Future Evolution

As the Adaptive Learning System matures, some transformations will become fast enough to be near-real-time. The principle does not prohibit speed — it prohibits irreversibility.

### Principle 4: Observer Uniqueness

### Problem

Observation forms designed to produce a complete account of an event fail both the observer and the system. They ask observers to report things they did not actually see, producing unreliable data in exactly the fields the system most needs to trust.

### Principle

Each observer class captures only what it uniquely sees. The design question for every form is: what can only this observer reveal that no other observer can? Not: what is a complete account of the event?

### Engineering Requirement

- Care Signal captures the provider's clinical reasoning, decisions, and perceived gaps. It does not ask about pre-hospital events.
- Safe-Truth captures the caregiver's journey, barriers, and experience. It does not ask caregivers to classify clinical failure modes.
- ResusGPS telemetry captures navigation behaviour and timing. It does not ask providers to self-report their performance.

### Future Evolution

The observer uniqueness principle will become the basis for triangulation algorithms: disagreement between observer classes on the same event segment is itself a signal, not noise.

### Principle 5: Pattern Triangulation Over Case Matching

### Problem

Mandatory case-level linkage between Safe-Truth and Care Signal would require caregivers to identify themselves relative to a clinical record, creating privacy exposure, reducing Safe-Truth reporting volume, and generating provider defensiveness that suppresses Care Signal reporting.

### Principle

The primary learning mechanism is ecological correlation across patterns, not reconstruction of individual cases. Safe-Truth and Care Signal need to be comparable at the pattern level. The minimum shared classifier set (Section 5) makes this possible without any case-level linkage.

### Engineering Requirement

- All observation tables implement the shared classifier set (Section 5). Enumeration values are identical across products.
- Analytics queries use shared classifiers for ecological correlation across observation streams.
- Case-level linkage (Section 5.3) is optional, consent-based, and never the primary mechanism.

### Future Evolution

As the Knowledge Base grows, probabilistic triangulation — inferring likely connections between observation streams based on classifier co-occurrence — will become possible without any individual case identification.

### Principle 6: The 3am Test

### Problem

An observation form that is too complex to complete honestly under real conditions produces dishonest data. Dishonest data produces false patterns. False patterns produce wrong training content and wrong clinical recommendations.

### Principle

Every observation form must be completable by a diploma-level nurse in a district hospital after a difficult shift, under poor connectivity, on a mobile device, in under five minutes. This is not a UX aspiration. It is a data quality requirement.

### Engineering Requirement

- Mandatory fields are genuinely minimal — only the shared classifiers and one free-text field are unconditional.
- Optional depth is always available for providers who choose it.
- Every additional mandatory field must justify itself against the risk of reducing completion quality.

### Future Evolution

As the platform's reputation grows and provider trust deepens, completion quality will improve. Mandatory fields may expand as evidence accumulates that providers complete them honestly.

### Principle 7: Absence of Evidence Is Not Evidence of Absence

### Problem

A failure pattern not observed may be absent, or it may be undetected. Conflating these produces false confidence in negative findings — a specific failure mode of under-resourced surveillance systems.

### Principle

Every pattern confidence assessment must distinguish: (a) pattern not observed due to low reporting volume; (b) pattern not observed due to no observer coverage in that setting; (c) pattern not observed despite adequate coverage — genuine absence.

### Engineering Requirement

- Pattern records carry: supporting_observation_count, observer_coverage_notes, reporting_volume_context.
- Analytics surfaces never display a pattern confidence score without the observation count and coverage context.
- A pattern rated "not detected" without coverage context is inadmissible in the Knowledge Base.

### Future Evolution

Observer coverage mapping — tracking which facility types, geographies, and cadres are actively contributing observations — will eventually become a standalone intelligence product for ministries of health.

# SECTION 3: OBSERVER CLASSES

Paeds Resus has five active observer classes and one anticipated future class. Understanding each class's unique vantage point, systematic biases, and limitations is prerequisite to designing any observation form or data model.

### 3.1  New in v1.1: Role-at-Time-of-Event

Every observation must distinguish between the observer's profile (who they are generally) and their role during the specific event. These are different and must never be conflated.

| Field | Definition and importance |
|---|---|
| Provider profile cadre | The provider's general qualification and role: Community Health Worker / Enrolled Nurse / Registered Nurse / Clinical Officer / Medical Officer / Paediatrician / Other Specialist / Nursing Student / Medical Student / Other Trainee. Captured once at profile creation. Used for Learning Cohort analysis. |
| Role at time of event | What role the provider held during this specific event: Team Leader / Primary Clinician / Support Clinician / Observing Trainee / Locum (specify cadre) / Simulation Instructor. Captured at each Care Signal submission and ResusGPS session. |
| Team position | Whether the provider was directly managing the patient, leading the team, or in a supporting role. Critical for interpreting why a decision was or was not made. |
| Facility at time of event | The facility where the event occurred — separate from the provider's primary registered facility. Always explicitly asked; never inferred from profile. |

Why this matters: a Fellowship-level PICU nurse doing a locum shift as a general ward nurse is not performing in a PICU context. A student nurse observing a resuscitation is not the decision-maker. Recording only the profile misattributes performance and corrupts the pattern analysis. The role-at-time-of-event field enables the platform to ask: do MOIs escalate inotropic support later than medical officers? Do student nurses document wheeze less frequently? These are curriculum and staffing insights, not individual performance judgements.

***The facility at time of event must always be explicitly selected by the provider at submission. It must never be auto-populated from the provider profile without a visible confirmation step. Poisoning the dataset by attributing locum events to the wrong facility is irreversible.***

### 3.2  Provider Observer Class (Care Signal)

| Dimension | Detail |
|---|---|
| Unique observations | Clinical reasoning during the event; differential diagnosis process; resource constraints during care; team dynamics; specific treatment decisions and their timing; real-time recognition of failure; temporal intervals (time-to-recognition, time-to-antibiotic, time-to-access) |
| Cannot observe | Symptom evolution before arrival; caregiver beliefs; pre-hospital delays and barriers; what happened after discharge; physiological trends before the provider noticed them |
| Systematic biases | Hindsight bias; self-protective reporting; recency bias; hierarchical bias (junior providers underreport in punitive cultures); attribution bias (blaming most visible failure, not root cause) |
| Observation timing | Retrospective — after the event. hours_since_event field required to weight observation quality. |
| Data quality risk | Reports are memory reconstructions. The gap between event and report must be captured. Reports submitted >48 hours after the event carry lower signal quality for temporal interval fields. |

### 3.3  Caregiver Observer Class (Safe-Truth)

| Dimension | Detail |
|---|---|
| Unique observations | Symptom onset and evolution; the decision to seek care; advice received before arrival; all pre-hospital delays and causes; experience at each facility contacted; trust, communication, and information quality at each contact; financial and transport barriers; community and cultural influences; what happened after discharge |
| Cannot observe | Clinical reasoning inside the facility; internal team dynamics; resource constraints invisible to patients; treatment decision rationale |
| Systematic biases | Recall bias (especially in grief); attribution bias; communication barriers (literacy, language); trust barriers; social desirability bias |
| Observation timing | Ideally longitudinal — captured at multiple points along the care-seeking journey. Currently retrospective by default. Future Safe-Truth should enable prospective capture at key journey stages (symptom onset, decision to seek care, each facility contact). |
| Data quality risk | Caregiver reports are experience accounts, not clinical records. They capture what was perceived, not necessarily what occurred. Never treat Safe-Truth as clinical ground truth. Facility identification by caregivers uses free-text name matching by analytics layer, not by the caregiver. |
| Access model | No platform account required. Submission accessible via direct URL or QR code. This is a non-negotiable privacy and participation design. |

### 3.4  ResusGPS Automated Telemetry

| Dimension | Detail |
|---|---|
| Unique observations | Clinical navigation pathway in real time; time spent in each phase; fields marked Not Available vs populated; diagnostic evidence gathered before diagnosis; definitive care completion; weight-based dose calculations generated; CPR timing and rhythm decisions; which guideline version was active during the session |
| Cannot observe | Why the provider made each decision; whether guidance was followed or ignored; outcomes; what happened after session ended |
| Systematic biases | Data reflects ResusGPS usage, not clinical practice. Non-users generate no data. |
| Observation timing | Concurrent — highest fidelity temporal observation in the system. |
| Data quality risk | Usage data conflates capability with adoption. Low usage may indicate low emergency volume or low product adoption. Never interpret ResusGPS non-usage as clinical incapacity. |

### 3.5  Fellowship and Course Assessment (Competency Telemetry)

| Dimension | Detail |
|---|---|
| Unique observations | Demonstrated knowledge at assessment; simulation performance; learning trajectory over the Fellowship timeline; specific knowledge gaps from diagnostic quiz performance; whether competence improves with Fellowship milestones |
| Cannot observe | Whether assessed knowledge translates to bedside behaviour; performance under real stress vs simulation stress |
| Systematic biases | Single assessments are poor proxies for durable behaviour change. Assessment performance reflects that day, not stable competence. |
| Learning Cohort value | The Fellowship timeline — timestamped milestones from account creation through certification through Fellowship completion — enables within-provider longitudinal analysis. A provider's Care Signal quality, ResusGPS navigation behaviour, and simulation performance before and after Fellowship milestones are measurable without any external control group. |
| Data quality risk | Certificate issuance is not evidence of changed clinical practice. Never treat Fellowship completion as a behaviour change outcome without corroborating Care Signal or ResusGPS data. |

### 3.6  Institutional Readiness Audit

| Dimension | Detail |
|---|---|
| Unique observations | Physical resource availability; structural capability (staffing models, escalation pathways, triage protocols); governance structures; training coverage across the facility; emergency trolley readiness; ERT activation protocols |
| Cannot observe | Whether documented protocols are followed in practice; provider competence beyond training records; caregiver experience; outcome data |
| Systematic biases | Audit data reflects documentation and presence at audit time. Facilities prepare for audits. |
| Data quality risk | A facility that passes a readiness audit may still have systematic execution failures. Readiness and execution are distinct dimensions. |

### 3.7  Physiological Telemetry (Anticipated)

Not currently implemented. The schema must reserve a slot for this class. Point-of-care diagnostic devices (pulse oximetry, continuous temperature, glucose monitoring) are becoming more prevalent in LMIC settings. When available, physiological telemetry represents the highest-fidelity record of deterioration timeline and enables validation of provider recognition timing against objective deterioration onset. Integration must be possible without breaking schema changes.

# SECTION 4: THE OBSERVATION MODEL

This section defines the canonical structure of an observation and the new temporal interval and collaborative event model introduced in v1.1.

### 4.1  The Four Layers of Every Observation

| Layer | Definition, permanence, engineering requirement |
|---|---|
| Layer 0: Raw Observation | What the observer saw, heard, or experienced, in their own words. Free text. Immutable. Preserved permanently. Never replaced by its classification. On account deletion: userId set null, narrative retained. Engineering: TEXT column, immutable after submission. |
| Layer 1: Structured Observation | What the observer selected from defined options. Schema-versioned. If taxonomy changes, historical rows retain original classification in original columns; reclassification adds new columns alongside. Engineering: typed columns with schema_version FK, reclassification columns added by migration, never dropped. |
| Layer 2: Derived Signal | What the system infers from one or more observations. Always derived from Layers 0/1. Always recomputable. Stored as a cache with derivation_version. Engineering: separate analytics table, recomputable from source rows. |
| Layer 3: Pattern | A recurring combination across multiple independent observations. Never stored in observation rows. Exists in the Knowledge Base with references to supporting observations. Engineering: separate knowledge base table; observations link to patterns via join table, not reverse. |

### 4.2  New in v1.1: Temporal Interval Capture

Time is not merely a timestamp on an observation. Temporal intervals are first-class clinical signals. Antibiotics given at 45 minutes and antibiotics given at 4 hours are categorically different clinical events. The current observation model captures timestamps but not intervals. v1.1 makes temporal intervals a mandatory section of the observation model.

| Interval field | Definition and clinical significance |
|---|---|
| time_to_recognition_mins | Minutes from presentation (or reported symptom onset if pre-hospital) to the provider identifying the primary diagnosis or emergency condition. The most important single interval in the dataset. |
| time_to_first_intervention_mins | Minutes from recognition to the first definitive intervention (first fluid bolus, first antibiotic dose, first oxygen application). Measures execution speed after recognition. |
| time_to_vascular_access_mins | Minutes from decision to obtain vascular access to successful access. Reveals execution gaps separate from recognition. |
| time_to_escalation_mins | Minutes from recognition of deterioration to escalation call or senior review. Measures authority barriers and team communication. |
| time_from_event_to_report_hours | Hours between the clinical event and the Care Signal submission. Used to weight observation quality for temporal interval fields. |

***Temporal interval fields are self-reported estimates, not objective measurements. They must never be used as precise clinical timings without corroboration from ResusGPS telemetry or facility records. Their value is in aggregate trends, not individual precision.***

### 4.3  New in v1.1: The Collaborative Event Model (Optional)

Every Care Signal submission may optionally carry an event_id linking it to a shared clinical event. Multiple providers can independently submit observations on the same event. Each submission is independent — the observer reports only what they saw from their vantage point. No merging, no averaging, no team consensus report.

Why: disagreement between observations on the same event is itself a signal. If a nurse reports "shock recognised immediately" and the medical officer reports "shock recognised after fluids failed," both are valid observations from different positions in the team. That disagreement reveals communication failure, perception gaps, or hierarchical dynamics that a single team report would mask.

| Field | Definition |
|---|---|
| event_id | Optional. A system-generated one-time code produced by the first provider to report the event. Shared with team members who choose to link their observations. Never mandatory. Never required for Fellowship credit. |
| is_lead_reporter | Boolean. Whether this provider generated the event_id (true) or linked to an existing one (false). Used to identify the primary account of the event in cases of disagreement. |
| team_role_at_event | The provider's role during this specific event: Team Leader / Primary Clinician / Support Clinician / Observing Trainee. Independent of profile cadre. |

*Implementation approach: initially, most event_ids have one observation. The collaborative layer grows into the structure without requiring a schema rebuild. event_id is nullable in v1. Multiple observations sharing an event_id become possible in v2 without any schema change.*

### 4.4  Minimum Required Fields for All Human Observer Submissions

| Field | Type | Required? | Purpose |
|---|---|---|---|
| observer_class | ENUM | Server-assigned | Provider / Caregiver / Institutional |
| observation_timestamp | TIMESTAMP | Server-assigned EAT | When the observation was submitted |
| event_timestamp_approx | TIMESTAMP | Yes (nullable) | Approximate time of clinical event |
| country | VARCHAR | Yes | ISO 3166-1 alpha-2. Primary geographic classifier. |
| admin_level_1 | VARCHAR | Yes | Country-specific first administrative division (county, state, province, district) |
| admin_level_2 | VARCHAR | Optional | Country-specific second division where applicable |
| facility_id | UUID | Yes for providers | Internal facility identifier. Never exposed publicly. Resolved by authorised personnel only. |
| facility_level | ENUM | Yes | Country-specific level mapped to WHO taxonomy crosswalk |
| facility_ownership | ENUM | Yes | Government / Faith-Based / Private for-profit / Private not-for-profit / Military / Other |
| child_age_band | ENUM | Yes | Neonatal / Infant / Toddler / Preschool / School / Adolescent |
| condition_category | ENUM | Yes | Respiratory / Cardiovascular / Neurological / Infectious-Bacterial / Infectious-Viral / Metabolic / Trauma / Neonatal / Poisoning / Other |
| outcome_category | ENUM | Yes | Survived-well / Survived-morbidity / Died-in-facility / Died-in-transit / Near-Miss / Transferred-unknown / Unknown |
| provider_cadre | ENUM | From profile | Loaded from provider profile. Not re-asked at submission. |
| role_at_time_of_event | ENUM | Yes for providers | Team Leader / Primary Clinician / Support Clinician / Observing Trainee / Locum |
| schema_version | VARCHAR | Server-assigned | Active taxonomy version at submission time |
| raw_narrative | TEXT | Yes for humans | Free text. Immutable. Never auto-populated. |
| is_anonymous | BOOLEAN | Yes | Affects Fellowship eligibility and provider visibility. Never affects aggregate analysis. |
| event_id | UUID | Optional | Links to collaborative event. Nullable. |
| hours_since_event | INTEGER | Recommended | Used to weight temporal interval field quality |

# SECTION 5: THE SHARED CLASSIFIER SET

Pattern triangulation across all observation streams requires a minimum shared classifier set with identical enumeration values across all products. This section defines that set and makes it binding.

### 5.1  Global Geographic Hierarchy (Updated in v1.1)

The v1.0 document used facility_county as the primary geographic classifier, which was Kenya-specific. v1.1 replaces this with a globally portable hierarchy.

| Level | Definition and implementation |
|---|---|
| country | ISO 3166-1 alpha-2 code. Two-letter country code. Universal. Never free text. Primary geographic unit for cross-country pattern analysis. |
| admin_level_1 | The country's first administrative division. For Kenya: county (47 values from KNBS). For Uganda: district. For India: state. For USA: state. Loaded from a reference table keyed by country code. Never hardcoded in the application schema. |
| admin_level_2 | The country's second administrative division where applicable and available. Optional. For Kenya: sub-county. Enables more precise geographic correlation where data density supports it. |
| facility_id | Internal UUID. Publicly anonymous. Resolved only by authorised personnel. Never exposed in any analytics surface, benchmark, or report without facility consent. The facility name is stored in a separate reference table linked only by facility_id. |
| facility_level | Country-specific level classification loaded from the reference table, crosswalked to the WHO facility level taxonomy (Level 1–6 equivalent) for cross-country analysis. |
| facility_ownership | Government / Faith-Based / Private for-profit / Private not-for-profit / Military / Other. Global applicability. Enables ownership-stratified pattern analysis. |

***The reference table mapping country codes to administrative division lists must be maintained as a separate database table, not hardcoded in the application schema or client code. Adding a new country requires only adding rows to the reference table, not a schema migration.***

### 5.2  Facility Identity: Publicly Anonymous, Internally Traceable

Facility identity is essential for learning which institutions improve faster and why. It is also sensitive. The resolution is structural anonymity with authorised traceability.

- Every facility is identified internally by a UUID (facility_id). The facility name is stored in a reference table accessible only to authorised platform personnel.
- No analytics surface, benchmark report, or public output ever displays a facility name without that facility's explicit consent.
- Facility-level performance data is used internally to: identify high-performing facilities as potential learning exemplars (with their consent), target ERS support to facilities with persistent failure patterns, and enable the peer-learning model (Hospital B solved X — here is how).
- The peer-learning model requires the sharing facility to explicitly consent to being identified as a learning source. Consent is purpose-specific and revocable.
- Future accreditation lists publish only binary accreditation status (accredited / not yet accredited) — never ordinal rankings.

### 5.3  Provider Locum Attribution

Providers who work at multiple facilities via locum are common. Incorrectly attributing their observations to their primary registered facility poisons the dataset. The resolution:

- The provider profile records their primary registered facility.
- Every Care Signal submission and ResusGPS session asks: "Which facility did this event occur at?" The primary facility is pre-filled as the default but is always editable before submission.
- The submitted facility_id is the authoritative source for pattern analysis — never the profile facility_id unless explicitly confirmed.
- Locum status at time of event is captured in the role_at_time_of_event field.

### 5.4  Account Model: Individual Actor and Organisation Actor

Products are permissions, not account types. Two actor types exist. Neither is a product tier.

| Actor type | Access and permissions |
|---|---|
| Individual Actor | Providers, students, instructors, trainees. Access: ResusGPS, AHA Hub (all certifications including HeartSaver), micro-courses, Fellowship, Care Signal, personal analytics dashboard, personal gap analysis. Profile captures: cadre, primary facility, country, admin_level_1, Fellowship status, certification history. |
| Organisation Actor | Hospitals, schools, NGOs, ministries, ambulance services. Access: Institutional dashboard, ERS audit tools, staff training management, facility-level Care Signal analytics, Safe-Truth facility reports, MOU management, readiness audit. Profile captures: facility name (internal), facility_id (UUID, never shared), facility level, ownership type, country, admin levels, primary admin contact, backup admin contact. |

Institutional continuity: the Organisation Actor account belongs to the institution, not the individual who created it. A minimum of two named admin contacts must always be registered. Account recovery requires institutional identity verification (facility letterhead, MoH registration number), not personal credential reset. If both admin contacts are lost, recovery is via institutional verification only.

Safe-Truth: accessible without any account. No Individual or Organisation Actor account is required for caregiver submission. This is non-negotiable.

### 5.5  Fellowship Anonymity and Pseudonymous Consent

A provider may wish to contribute to Care Signal anonymously while still receiving Fellowship credit. These two needs are in tension. The resolution is a two-layer consent model:

- Layer 1 — Anonymous QI Reporting: submission with no userId. Contributes to aggregate pattern analysis. No Fellowship credit awarded. No personal gap analysis generated.
- Layer 2 — Pseudonymous Fellowship Reporting: submission linked to a system-generated persistent token stored only on the provider's device and in the Fellowship engine. The platform knows "token X submitted this month" without knowing who X is. Streak maintained. Personal gap analysis stored against the token. Fellowship credit awarded.
- If the provider later links their token to their identity (to display the Fellow title on their profile), that is a separate, explicit, revocable consent action.

The token must be generated at first Care Signal submission (not at account creation) and must be exportable by the provider in case of device change. This requires a modest but non-trivial engineering change to the current Care Signal implementation.

# SECTION 6: THE TRANSFORMATION PIPELINE

This section defines how observations become system intelligence. Stages 1–7 define the forward pipeline. Stage 8 (new in v1.1) defines the feedback loop by which the system evaluates its own recommendations.

### 6.1  Stage 1: The Event

An event is a real-world occurrence involving a child in a health-related situation. Events are not stored directly. The system has access only to observations of the event, each filtered through the observer's unique vantage point and systematic biases. Multiple observations of the same event may appear to contradict each other without either being wrong. Both are preserved.

An event may carry an event_id if the collaborative event model is in use. The event_id links independent observations without merging them.

### 6.2  Stage 2: The Observation

An observation is created once and never modified. Amendments create a new observation with an amendment_of reference to the original. Both records are preserved. The amendment does not overwrite the original.

### 6.3  Stage 3: The Signal

A signal is a structured interpretation of one or more observations, derived by defined rules, stored in a separate analytics layer with derivation_version. Signals are recomputed when derivation rules change. Examples: "this observation contains a recognition failure mode"; "this provider's time-to-antibiotic has decreased by 40% over 12 months of Fellowship"; "three observations from the same facility this month share the same equipment gap."

### 6.4  Stage 4: The Failure Mode and Success Factor

New in v1.1: the transformation pipeline is bidirectional. Observations enter either the Failure Mode track or the Success Factor track.

| Track | Definition and examples |
|---|---|
| Failure Mode | A specific, named instance of what went wrong in a single observation. More granular than failure domains. Examples: "shock not recognised despite tachycardia and prolonged CRT present for 4 hours"; "antibiotic not administered within 60 minutes of sepsis recognition"; "IO not attempted after two failed peripheral attempts." |
| Success Factor | A specific, named instance of what went right — an action, decision, or system feature that contributed to a good outcome or prevented deterioration. Examples: "nurse-led sepsis checklist initiated within 10 minutes of presentation"; "IO kit stored in triage enabled access within 5 minutes"; "structured handover prevented recognition failure at shift change." |

### 6.5  Stage 5: Failure Domains and Success Domains

| Domain | Failure mode examples / Success factor examples |
|---|---|
| Recognition | Failure: missed danger signs, delayed shock identification. Success: danger sign recognition by triage nurse before physician review. |
| Escalation | Failure: delay in senior review. Success: structured escalation protocol reduced time-to-senior from 45 to 8 minutes. |
| Vascular Access | Failure: IO not attempted. Success: IO drill reduced access time by 60%. |
| Treatment | Failure: antibiotic delayed. Success: weight-based dose pre-calculation eliminated dosing errors. |
| Referral | Failure: transfer without stabilisation. Success: receiving facility notification protocol reduced handover gaps. |
| Monitoring | Failure: vital signs not repeated. Success: observation chart redesign prompted reassessment at 15-minute intervals. |
| Communication | Failure: closed-loop failure. Success: SBAR handover reduced information loss at shift change. |
| Resource Availability | Failure: oxygen not available. Success: oxygen cylinder checklist prevented stock-outs for 6 consecutive months. |

***This taxonomy is version 1.0. It is not final. New domains will be added as evidence accumulates. Every observation carries schema_version so historical observations remain reclassifiable.***

### 6.6  Stage 6: The Failure Pattern and Success Pattern

A pattern is a recurring combination of failure modes or success factors observed across multiple independent observations in similar contexts over time. Patterns are the primary unit of learning in the Knowledge Base.

### Failure Pattern: Confirmation Thresholds

| Confidence level | Threshold and meaning |
|---|---|
| Signal | 5–19 independent observations sharing the pattern. Warrants monitoring. Not yet actionable for curriculum change. |
| Candidate | 20–49 observations across ≥2 facilities or ≥2 observation periods. Warrants deeper investigation. |
| Confirmed | 50+ observations. Actionable for institutional recommendations and Care Signal alerts. |
| Established | 100+ observations with temporal trend data. Actionable for ResusGPS and curriculum updates. |

### Success Pattern: Higher Confirmation Thresholds (Asymmetric by Design)

Spreading an unvalidated success pattern is spreading folklore. Success patterns require a higher bar because the cost of a false positive (spreading an ineffective practice) exceeds the cost of a false negative (being slow to spread a real improvement).

| Confidence level | Threshold and meaning |
|---|---|
| Candidate Success | Observed once at one facility. Documented for investigation. Not shareable. |
| Emerging Success | Observed across ≥3 independent facilities with similar characteristics. Shareable as "observed practice" with explicit uncertainty labelling. |
| Validated Success | Associated with measurable improvement after implementation at ≥2 additional facilities. Actionable for institutional recommendations. |
| Standard Practice | Repeatedly validated across ≥5 geographically diverse contexts. Actionable for ResusGPS and Fellowship curriculum. |

### Pattern Record: Minimum Fields (Both Tracks)

| Field | Definition |
|---|---|
| pattern_id | Unique identifier. Never reused or reassigned. |
| pattern_track | ENUM: Failure / Success |
| pattern_name | Short human-readable name: "Delayed shock recognition in febrile infants at Level 4 facilities" |
| failure_mode_ids / success_factor_ids | References to specific modes or factors that constitute this pattern |
| failure_domain / success_domain | Primary domain classification |
| supporting_observation_count | Number of independent observations supporting this pattern |
| confidence_level | Current level: Signal / Candidate / Confirmed / Established (Failure) or Candidate / Emerging / Validated / Standard (Success) |
| confidence_dimensions | JSON: {clinical: 0–1, statistical: 0–1, external_evidence: 0–1, platform_replication: 0–1, geographic_diversity: 0–1, recency: 0–1}. Never a single scalar. |
| first_detected | EAT date of first qualifying observation |
| last_confirmed | EAT date of most recent qualifying observation |
| trend_direction | Increasing / Decreasing / Stable / Insufficient data |
| geographic_scope | Countries and admin regions where this pattern has been detected |
| condition_scope | Condition categories in which this pattern appears |
| facility_level_scope | Facility levels where this pattern is most prevalent |
| cadre_scope | Provider cadres most associated with this pattern (for failure) or this practice (for success) |
| preventability_distribution | Distribution of preventability levels across supporting observations (failure track only) |
| review_schedule | Date of next mandatory review. Auto-set to 12 months from last_confirmed for Confirmed and Established. 6 months for Signal and Candidate. |
| knowledge_status | Active / Under Review / Retired |
| schema_version | Taxonomy version used to classify supporting observations |

### 6.7  Stage 7: Recommendation, Intervention, and Implementation

Three distinct objects exist between a confirmed pattern and a changed outcome. Conflating them is one of the most common failures in implementation science.

| Object | Definition and minimum fields |
|---|---|
| Recommendation | A system-generated or expert-generated suggestion derived from a confirmed pattern. Fields: recommendation_id, source_pattern_id, recommendation_text, recommendation_type (Training / Procurement / Protocol / Staffing / ResusGPS update / Curriculum update), confidence_level_at_generation, generated_date, governance_status (Pending / Approved / Rejected / Superseded). |
| Intervention | A structured commitment to act on a recommendation, made by a specific facility or network. Fields: intervention_id, recommendation_id, committing_entity_id, intervention_scope (ED only / ward / hospital-wide / network), planned_implementation_date, defined_outcome_measure, evaluation_window_months, intervention_status (Planned / In Progress / Completed / Abandoned). |
| Implementation | What actually happened when the intervention was executed. Fields: implementation_id, intervention_id, actual_implementation_date, actual_scope (may differ from planned), modifications_from_plan (free text), implementation_fidelity (High / Partial / Low / Not implemented), outcome_label (Improved / No improvement / Worsened / Evaluation pending), outcome_evidence_notes, outcome_recorded_date. |

***Without the Implementation object, the feedback loop is broken. The system cannot distinguish "the intervention did not work" from "the intervention was never actually done." Both produce the same absence of improvement signal. Only the Implementation record resolves the ambiguity.***

### 6.8  Stage 8: Knowledge Base Self-Evaluation

The Adaptive Learning System must evaluate its own recommendations. When an Implementation record is completed, the system triggers a pattern confidence update:

- If outcome_label = Improved: the source pattern's confidence_dimensions.platform_replication score increases. If the pattern is a Success Pattern, its confidence level may be promoted.
- If outcome_label = No improvement: the intervention is flagged for expert review. The recommendation's confidence is not automatically reduced — a single negative implementation may reflect implementation failure rather than pattern invalidity. After three independent implementations with No improvement outcomes, the pattern confidence is automatically reviewed.
- If outcome_label = Worsened: immediate expert review triggered. The recommendation is suspended pending Knowledge Stewardship review.

This self-evaluation mechanism is how the Adaptive Learning System learns which of its own interventions work. Without it, the platform becomes an oracle that produces recommendations with no accountability for outcomes.

# SECTION 7: LEARNING GOVERNANCE

Learning Governance defines when observations become trusted enough to change practice. This is the most critical safeguard in the platform. Without it, the Adaptive Learning System produces recommendations without accountability and the platform drifts from evidence toward advocacy.

### 7.1  The Three Types of Truth

These three levels are distinct data states in the platform. Movement from one level to the next requires explicit governance action. Skipping a level is never permitted.

| Truth level | Definition and governance requirement |
|---|---|
| Operational Truth | What was observed. Captured by the observation model. Immutable. Never revised. The raw record of what was seen. No governance approval required to capture. Governed by the Observation Architecture principles. |
| Analytical Truth | What patterns appear to exist. Generated by the Adaptive Learning System from aggregated observations. Versioned. Subject to revision as evidence accumulates. Never surfaced to providers as a recommendation without passing to Actionable Truth. Governed by the evidence ladders (Section 7.2) and confidence model (Section 6.6). |
| Actionable Truth | What Paeds Resus is currently willing to recommend, teach, or embed in clinical guidance. The only level that feeds ResusGPS pathways, curriculum updates, Care Signal recommendation rules, and institutional advice. Requires Knowledge Stewardship sign-off (Section 7.5) before deployment. Carries a version number and a reference to the Analytical Truth that motivated it. |

***Never surface Analytical Truth to providers as though it were Actionable Truth. An interesting pattern that has not passed governance review is not a recommendation. Presenting it as one damages trust and may cause harm.***

### 7.2  The Four Evidence Sources

Paeds Resus generates and receives evidence from four distinct sources. They must be explicitly represented and never silently mixed.

| Evidence source | Definition and how it is weighted |
|---|---|
| Observational Evidence | Generated by Care Signal, Safe-Truth, ResusGPS, and Institutional Readiness Audit. The primary source for Analytical Truth. Weighted by observation count, observer coverage, geographic diversity, and recency. |
| Experimental Evidence | Published RCTs, implementation studies, and systematic reviews. Weighted by study quality, LMIC applicability, and recency. External evidence alone is insufficient for Actionable Truth in Paeds Resus — it must be corroborated by or plausibly connected to platform observational evidence. |
| Expert Evidence | Guidelines from WHO, AHA, national clinical societies, and the Paeds Resus clinical team. Weighted by guideline quality, LMIC relevance, and currency. Expert consensus alone is insufficient for Actionable Truth without platform corroboration, except in cases where patient safety requires immediate action. |
| Adaptive Evidence | Generated by the platform itself: "We recommended X. 20 facilities implemented it. Failure pattern frequency fell 63%." This is evidence no external body can produce. It carries unique weight for platform-specific recommendations. It is also the evidence type most vulnerable to confirmation bias — it must be evaluated with the same rigour as external evidence. |

### 7.3  Concept Drift Management

What predicts deterioration today may not predict it in ten years. Antimicrobial resistance, new pathogens, vaccination coverage, demographic changes, and healthcare system evolution all change the clinical landscape. Every knowledge item must have a review schedule and an expiry mechanism.

- Every Confirmed or Established pattern has a mandatory review date: 12 months from last_confirmed for active patterns.
- A pattern not reconfirmed within its review window is automatically downgraded one confidence level.
- A pattern at Signal level not reconfirmed within 6 months is moved to knowledge_status = Under Review.
- A pattern with knowledge_status = Under Review that is not reconfirmed within a further 6 months is moved to Retired.
- Retired patterns are preserved in the historical record with their full observation count and evidence base. They are removed from the active recommendation engine.
- The review schedule is automated: the system flags patterns for review and creates Knowledge Stewardship tasks. Reviews do not depend on human memory.
- ResusGPS pathways and curriculum content linked to Retired patterns are reviewed for update within 30 days of retirement.

### 7.4  Knowledge Versioning

Every component of the Adaptive Learning System that is updated by new knowledge must carry a version number and a reference to the knowledge that motivated the update.

| Component | Versioning requirement |
|---|---|
| ResusGPS clinical pathways | Every pathway version carries: version_number, release_date, knowledge_source_ids (array of pattern_ids and recommendation_ids that motivated the change), deprecation_date of the previous version. |
| Micro-course and Fellowship curriculum | Every content version carries: version_number, last_updated, knowledge_source_ids, clinical_reviewer_id (the person who approved the change), review_date. |
| Care Signal recommendation rules | Every rule version carries: version_number, rule_description, source_pattern_id, confidence_at_deployment, deployment_date, retirement_date. |
| Failure and Success Pattern confidence scores | Every confidence change is logged: previous_level, new_level, reason, supporting_evidence, changed_by (human reviewer or automated system), changed_date. |

*This versioning commitment enables the most important long-term research question Paeds Resus can answer: which version of the guidance produced the best outcomes? Without versioned content linked to versioned knowledge, that question is unanswerable.*

### 7.5  Knowledge Stewardship

The Adaptive Learning System produces recommendations. A human body must own the decision to act on them, retire outdated ones, and be accountable when they fail. That body is the Knowledge Stewardship function.

Knowledge Stewardship is not a product feature or a database role. It is a governance responsibility. In the current stage of the platform, it is exercised by the CEO with clinical sign-off authority. As the platform scales, it will become a multidisciplinary committee including clinical experts, implementation scientists, and external advisors.

### Knowledge Stewardship Responsibilities

- Approving the promotion of Analytical Truth to Actionable Truth — the gate that prevents unverified patterns becoming clinical recommendations
- Approving all changes to ResusGPS clinical pathways, micro-course content, and Care Signal recommendation rules
- Retiring outdated knowledge and ensuring linked platform content is updated within 30 days
- Resolving conflicting evidence: when platform observational evidence and published experimental evidence point in different directions, Knowledge Stewardship determines which takes precedence and documents the rationale
- Overseeing external guideline integration: when WHO, AHA, or national guidelines are updated, Knowledge Stewardship determines whether and how platform content should change
- Auditing Learning Engine performance: quarterly review of the recommendation outcome labels. If a class of recommendations consistently produces No improvement outcomes, the underlying patterns are reviewed
- Publishing an annual knowledge report: what the platform has learned, what has changed in practice as a result, and what remains unresolved

### The Evidence Threshold for Actionable Truth

The minimum evidence required before Knowledge Stewardship may approve a promotion to Actionable Truth:

| Recommendation type | Minimum evidence threshold |
|---|---|
| Care Signal recommendation rule (personal feedback) | Confirmed Failure Pattern (50+ observations) OR strong Expert Evidence corroborated by ≥10 platform observations |
| Institutional recommendation (ERS, procurement) | Confirmed Failure Pattern with facility_level_scope matching the target institution type |
| Curriculum update (micro-course content) | Established Failure Pattern (100+) OR Validated Success Pattern OR published guideline change with ≥20 corroborating platform observations |
| ResusGPS pathway update | Established Failure or Success Pattern (100+) AND Knowledge Stewardship clinical review AND CEO sign-off |
| Emergency safety update (immediate patient safety risk) | Expert Evidence alone is sufficient. Knowledge Stewardship may approve with retrospective platform corroboration within 90 days. |

# SECTION 8: EVOLUTION RULES

These rules govern how the architecture evolves without destroying historical data integrity or future comparability.

- Rule 1: New observer classes may be added without invalidating historical observations. They must implement the minimum shared classifier set and four observation layers.
- Rule 2: The failure domain and success domain taxonomy may be extended. Existing domains may not be removed. Historical observations remain queryable under their original classification.
- Rule 3: Historical observations must remain reclassifiable under new taxonomy versions. Reclassification adds columns alongside originals — never overwrites.
- Rule 4: Derived signals must always be recomputable from preserved observations. If derivation rules change, signals are recomputed, not mutated.
- Rule 5: The platform must support multiple concurrent classification versions. Analytics must never silently mix observations from different schema versions.
- Rule 6: Absence of evidence must be distinguishable from evidence of absence. Every pattern confidence assessment must carry observation count and observer coverage context.
- Rule 7: Confidence in patterns is explicit, multidimensional, and revisable. No pattern is ever treated as permanent. Review schedules are automated.
- Rule 8: Knowledge items expire unless reaffirmed. Every pattern has a mandatory review date. Patterns not reconfirmed within their review window are automatically downgraded.
- Rule 9: Every platform content update is traceable to the knowledge that motivated it. No ResusGPS pathway, curriculum change, or recommendation rule is deployed without knowledge_source_ids.
- Rule 10: Delay irreversible abstractions. New abstraction layers (new pattern types, new evidence source categories) are introduced when evidence demands them, documented through accumulated decisions, not through speculative design.

# SECTION 9: GOVERNANCE

Governance maintains the trust required for high-volume, honest reporting. Without trust, reporting volumes fall. Without volume, pattern detection fails. The governance requirements are non-negotiable.

### 9.1  Privacy by Design (Global)

- No patient names, MRN numbers, dates of birth, or direct identifiers in any observation form
- No provider names in anonymous observations
- Geographic granularity limited to admin_level_1 for cross-product pattern analysis; admin_level_2 only for facility-specific analysis by authorised personnel
- Age captured as age band for all cross-product analysis; exact age may be captured in product-specific fields but not used in aggregate pattern analysis
- Facility names never exposed in cross-facility benchmarking without facility consent
- Safe-Truth accessible without any account — no identity required
- Global data sovereignty: data collected in each country is stored in compliance with that country's data protection law. For Kenya: ODPC (Data Protection Act 2019). For EU providers: GDPR. Storage architecture must support country-specific data residency as the platform scales.

### 9.2  Consent Architecture

- Care Signal — QI consent at first submission: purpose-specific (QI / Fellowship / research), withdrawable. Withdrawal removes Fellowship eligibility going forward; anonymous historical data is retained.
- Fellowship pseudonymous consent: separate consent layer at first Fellowship-linked submission. Token-based. Independent of QI consent.
- Safe-Truth: no account required. Aggregate analysis consent is implicit in submission. No PII collected in the default path.
- Case linkage: separate, explicit, time-limited, purpose-specific consent for each linkage. Never bundled.
- Facility peer-learning consent: explicit facility-level consent before any facility is identified as a learning exemplar or their practice is shared with other institutions.
- Research use: any use beyond QI and Fellowship requires separate ethics review and explicit participant consent.

### 9.3  Data Retention

| Data type | Retention policy |
|---|---|
| Raw observations (Layer 0) | Permanent. Anonymised on account deletion (userId null). Never truncated. |
| Structured observations (Layer 1) | Permanent. Schema version preserved. Reclassification adds columns, never drops originals. |
| Derived signals (Layer 2) | 5 years from derivation date. Recomputable from Layer 0/1 at any time. |
| Pattern records | Permanent. Retired patterns preserved with full history. |
| Intervention and Implementation records | Permanent. Essential for outcome evaluation. |
| Provider personal data | Deleted on account closure. All linked observations anonymised. |
| Safe-Truth submissions | Permanent in anonymous form. |
| Assessment records | 7 years from assessment date for Fellowship audit. |
| ResusGPS session logs | Permanent. Anonymised on account closure. |
| Knowledge Stewardship decisions | Permanent audit record. Every governance decision is logged. |

# SECTION 10: ENGINEERING REQUIREMENTS

These are binding constraints. Deviations require CEO sign-off and a documented exception in WORK_STATUS.md.

### 10.1  Schema Rules

- All observation tables implement the minimum shared classifier set from Section 4.4
- country and facility_ownership columns added to all observation tables via migration
- admin_level_1 replaces facility_county in all observation tables via migration with data backfill where possible
- facility_id replaces any direct facility name storage in observation tables
- role_at_time_of_event column added to careSignalEvents and resusGPSCases
- event_id nullable UUID column added to careSignalEvents (collaborative event model)
- Temporal interval columns added to careSignalEvents: time_to_recognition_mins, time_to_first_intervention_mins, time_to_vascular_access_mins, time_to_escalation_mins, hours_since_event
- schema_version column added to all observation tables
- Raw narrative fields marked immutable in schema (no UPDATE permitted on raw_narrative after INSERT)
- Separate knowledge_base schema with tables: failure_patterns, success_patterns, recommendations, interventions, implementations, pattern_observations (join), content_versions
- Geographic reference table: country_admin_divisions (country_code, level, division_name, parent_id)
- Facility reference table: facilities (facility_id UUID, internal_name, country_code, admin_level_1, admin_level_2, facility_level, facility_ownership). Accessible only to authorised roles.
- Fellowship pseudonymous token table: fellowship_tokens (token_id UUID, hashed_device_key, created_at, linked_user_id nullable)

### 10.2  Implementation Status (Version 1.1)

This table records the current state of implementation against v1.1 requirements as of June 2026. Must be updated in WORK_STATUS.md whenever status changes.

| Requirement | Status | Priority |
|---|---|---|
| country and admin_level_1 on all observation tables | Not started — migration required | P0 — blocks global expansion |
| facility_ownership on observation tables | Not started | P1 |
| role_at_time_of_event on careSignalEvents and resusGPSCases | Not started | P0 — blocks cadre analysis |
| facility_id on all observation tables (migration 0038 partial) | Partial — careSignalEvents done; others pending | P0 |
| event_id (collaborative model) on careSignalEvents | Not started — nullable, low friction to add | P2 |
| Temporal interval fields on careSignalEvents | Not started | P1 |
| schema_version on all observation tables | Not started | P1 |
| Raw narrative immutability constraint | Not started — currently no DB-level constraint | P1 |
| Geographic reference table | Not started | P0 — blocks global expansion |
| Facility reference table (decoupled from observation rows) | Not started — facility name currently inline | P0 |
| Knowledge Base schema (patterns, recommendations, interventions, implementations) | Not started — conceptual only | P1 |
| Fellowship pseudonymous token model | Not started | P1 |
| Care Signal feedback loop: gap analysis and recommendations | Partial — getGapAnalysis and getRecommendations stubbed | P0 — core adoption mechanism |
| Pattern triangulation analytics layer | Not started | P2 |
| Knowledge Stewardship governance workflow | Not started — CEO sign-off currently informal | P2 |
| Concept drift automated review scheduling | Not started | P3 |
| Intervention and Implementation tracking | Not started | P2 |

# CLOSING: THE COMMITMENT THIS DOCUMENT MAKES

The Observation Architecture v1.1 makes three commitments simultaneously: to collect observations in a form that preserves future learning; to transform observations into knowledge only when the evidence threshold has been met; and to change clinical practice only when the knowledge has passed governance review.

The deepest commitment is the one that is hardest to honour: the system must be capable of producing findings that challenge the founders' own assumptions. The evidence thresholds, the Knowledge Stewardship function, the concept drift management rules, and the recommendation outcome evaluation mechanism all exist to enforce this commitment structurally rather than relying on intellectual honesty alone.

The platform now needs to begin teaching you. The observation cycle it is designed to produce in clinical settings must also operate on itself: observe what the platform produces, learn whether it is correct, adapt where it is not. That has been the philosophy of Paeds Resus from the beginning. It is now written into the architecture.

***The day Care Signal, Safe-Truth, ResusGPS, and the Knowledge Base together tell Paeds Resus something it did not already believe — that is the day the Observation Architecture has succeeded. Everything before that is building the instrument.***

## Document Classification and Review

*This document supersedes Observation Architecture v1.0. Conflicts between v1.1 and the PSoT on data architecture questions are resolved by updating the PSoT to align with v1.1 after CEO and engineering review. Review triggers: new observer class proposed; shared classifier set changes; evidence thresholds revised; Knowledge Stewardship function changes; global expansion to a new country requiring geographic reference table updates.*
