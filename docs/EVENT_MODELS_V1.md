**PAEDS RESUS LIMITED**

*AHA Aligned Training Site — ID: TS70875*

**EVENT MODELS**

*Per-Observer-Class Observation Specification v1.0*

*The Field-by-Field Specification for What Each Observer Class Must Capture*

Version 1.0 — June 2026

Classification: Engineering — Confidential Internal

*Implements: Observation Architecture v1.1 Sections 3, 4, and 5*

***This document specifies exactly what each observer class must capture. It is the bridge between the Observation Architecture's principles and the engineering team's form designs and database schemas. Every field listed here has a documented learning hypothesis. Every required field survives the 3am test.***

## EXECUTIVE SUMMARY — READ THIS FIRST

**If you read nothing else in this document, read this section.**

**The core claim:** This document is the authoritative field-by-field specification for four observation forms. It tells engineers exactly what to build, in what order, with what validation logic. If the form implementation diverges from this document, the document wins — update the document first, then update the implementation.

**What this document specifies (four observer classes):**

| Observer class | Form | Current status | Top priority change |
|---|---|---|---|
| Provider | **Care Signal v3** | v2 live, v3 not started | Add failure mode picker, temporal intervals, global classifiers, explicit facility selection, post-submission feedback loop |
| Caregiver | **Safe-Truth v1** | Behind authentication — P0 gap | Remove authentication entirely; redesign from retrospective questionnaire to four journey stages |
| ResusGPS | **Session Record** | Partial telemetry emitted | Add full session telemetry schema per Section 3 |
| Fellowship | **Competency Record** | Partial | Add Learning Cohort anchors and topic-level performance JSON per Section 4 |

**The single most important field in Care Signal v3:** `facility_id` — the UUID of the facility where the event actually occurred, **explicitly selected by the provider at submission, never inferred from their profile.** Providers who do locum shifts at multiple facilities will otherwise poison the dataset by attributing events to the wrong location. This is irreversible data corruption if not caught at the form level.

**The single most important change in Safe-Truth v1:** Remove the login requirement. Safe-Truth must be accessible via direct URL or QR code with no account, no registration, and no redirect to a sign-in screen. This is a P0 engineering gap in the current implementation and a non-negotiable privacy and participation design decision.

**The shared classifier rule:** Five ENUM fields (`condition_category`, `child_age_band`, `outcome_category`, `failure_domain`, `facility_level`) must use **identical values** across Care Signal, Safe-Truth, and ResusGPS. Section 5 contains the canonical values. Any divergence between products makes pattern triangulation across the three data streams permanently impossible.

**Common misreading to avoid:** "Required" in this document means the server rejects the submission without this field — not that the UI blocks the user with a popup. Temporal interval fields (time-to-recognition, time-to-antibiotic, etc.) are marked "REC" (recommended), not "YES" (required). They are placed in an expandable section and prompted but not blocking — because making them required would reduce completion rates, which degrades the observation quality they are designed to improve.

**What this document does not do:** It does not specify how the FPKB processes the observations these forms collect (see FPKB Schema v1.0). It does not specify the ResusGPS clinical pathway logic (see Clinical Source of Truth). It specifies only what each observer class captures and how.

# PREAMBLE: HOW TO READ THIS DOCUMENT

This document contains four event models, one per active human observer class:

- Care Signal v3 — the provider observation form
- Safe-Truth v1 — the caregiver observation form (redesigned from retrospective to journey-stage)
- ResusGPS Session Record — the automated telemetry emitted by each clinical session
- Fellowship Competency Record — the assessment telemetry emitted by course and simulation completions

Each model is presented as a field specification table with five columns:

| Column | Meaning |
|---|---|
| Field Name | The database column name in snake_case, matching the Drizzle schema |
| Type | Data type: ENUM, VARCHAR(n), TEXT, INT, BOOLEAN, DATETIME(3), JSON |
| Required | YES = server rejects submission without this field; REC = recommended, form prompts but does not block; AUTO = server-assigned, never from client; PROFILE = loaded from provider profile, not re-asked |
| Source | Where the value comes from: FORM (provider/caregiver input), AUTO (server-assigned), PROFILE (loaded from account), TELEMETRY (automatic from product behaviour) |
| Notes | Learning hypothesis, UX guidance, or engineering constraint |

***The field specification tables in this document are the authoritative source for form design, validation logic, and database column definitions. Any divergence between the form implementation and this document must be resolved by updating this document first, then updating the implementation. The document leads; the implementation follows.***

# SECTION 1: CARE SIGNAL V3 — PROVIDER OBSERVATION FORM

### 1.1  What Changed from v2

Care Signal v2 captures failure domains (Recognition, Escalation, etc.) and basic event metadata. v3 adds:

- Failure mode capture within each domain — the specific sub-classification required by the FPKB
- Temporal interval fields — time-to-recognition, time-to-first-intervention, time-to-vascular-access, time-to-escalation
- Role-at-time-of-event — distinct from provider profile cadre
- Facility explicit selection — never inferred from profile; always confirmed by provider
- Global geographic classifier fields — country and admin_level_1 replacing county
- Success factor reporting path — a parallel track for reporting what went well
- Optional event_id — for collaborative observation linking
- Schema version field — server-assigned, never from client

The single canonical form component rule remains absolute: one Care Signal form component used everywhere. No parallel implementations with different field sets. v3 replaces v2 entirely.

### 1.2  The 3am Test for Care Signal v3

A diploma-level nurse, after a difficult shift, on a mobile device with intermittent connectivity, should be able to complete a Care Signal v3 report in under 5 minutes. The required fields listed below are genuinely minimal. All optional depth fields are skip-able. The form must never present all optional fields by default. Progressive disclosure: required fields first, optional sections behind an expandable "Add more detail" control.

### 1.3  Care Signal v3: Shared Classifier Fields (Required for all submissions)

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| observation_timestamp | DATETIME(3) | AUTO | AUTO | Server-assigned EAT timestamp at submission. Never from client. |
| schema_version | VARCHAR(16) | AUTO | AUTO | Active taxonomy version at submission time. Server-assigned. |
| observer_class | ENUM | AUTO | AUTO | Always PROVIDER for Care Signal. Server-assigned. |
| country | VARCHAR(2) | YES | PROFILE | ISO 3166-1 alpha-2. Loaded from provider profile. Shown to provider as confirmation, not as a re-entry field. |
| admin_level_1 | VARCHAR(128) | YES | FORM | The administrative division of the facility where the event occurred. Pre-filled from profile primary facility but editable. Required because locum shifts change this. |
| facility_id | UUID | YES | FORM | UUID of facility where event occurred. Pre-filled from profile primary facility but always editable with a facility search field. Never auto-confirmed without visible display to provider. |
| facility_level | ENUM | AUTO | AUTO | Loaded from facility reference table using facility_id. Never manually entered. |
| facility_ownership | ENUM | AUTO | AUTO | Loaded from facility reference table using facility_id. |
| child_age_band | ENUM | YES | FORM | NEONATAL \| INFANT \| TODDLER \| PRESCHOOL \| SCHOOL \| ADOLESCENT. Selector, not free text. |
| condition_category | ENUM | YES | FORM | RESPIRATORY \| CARDIOVASCULAR \| NEUROLOGICAL \| INFECTIOUS_BACTERIAL \| INFECTIOUS_VIRAL \| METABOLIC \| TRAUMA \| NEONATAL \| POISONING \| OTHER. Selector. |
| outcome_category | ENUM | YES | FORM | SURVIVED_WELL \| SURVIVED_MORBIDITY \| DIED_IN_FACILITY \| DIED_IN_TRANSIT \| NEAR_MISS \| TRANSFERRED_UNKNOWN \| UNKNOWN |
| observation_period | VARCHAR(7) | AUTO | AUTO | EAT calendar month YYYY-MM. Derived from observation_timestamp server-side. |
| is_anonymous | BOOLEAN | YES | FORM | Default: false. Toggle visible to provider. If true, userId not stored. If pseudonymous Fellowship, token stored instead. |
| fellowship_token | UUID | AUTO | AUTO | Populated server-side from pseudonymous Fellowship session if is_anonymous=true and provider has an active token. Null if fully anonymous or named. |
| event_id | UUID | REC | FORM | Optional. Provider may enter a code shared by the team lead to link observations to the same collaborative event. Nullable. |
| hours_since_event | INT | REC | FORM | Hours between event and submission. Selector: <1h \| 1-6h \| 6-24h \| 1-3 days \| >3 days. Used to weight temporal interval quality. |

### 1.4  Care Signal v3: Event Details

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| event_type | ENUM | YES | FORM | CARDIAC_ARREST \| RESPIRATORY_FAILURE \| SHOCK \| TACHYARRHYTHMIA \| BRADYCARDIA \| NEAR_MISS \| OTHER |
| event_date_approx | DATE | YES | FORM | Approximate date of event. Date picker. If exact date unknown, month and year are sufficient. |
| provider_cadre | ENUM | PROFILE | PROFILE | Loaded from provider profile. Not re-asked. Used for cadre-stratified pattern analysis. |
| role_at_time_of_event | ENUM | YES | FORM | TEAM_LEADER \| PRIMARY_CLINICIAN \| SUPPORT_CLINICIAN \| OBSERVING_TRAINEE \| LOCUM. Not the same as profile cadre. |
| is_team_lead_reporter | BOOLEAN | AUTO | AUTO | True if this provider generated the event_id. False if they linked to an existing event_id. Null if no event_id. |
| team_size_approx | ENUM | REC | FORM | SOLO \| 2-3 \| 4-6 \| 7+. Optional. Enables team-size stratified analysis. |

### 1.5  Care Signal v3: Reporting Track

v3 introduces a track selector at the start of the form. The default is Failure Track. Success Track is available for reporting what went well. The failure mode and success factor fields below are shown conditionally based on track selection.

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| report_track | ENUM | YES | FORM | FAILURE \| SUCCESS. Default: FAILURE. Determines which downstream fields are shown. |

### 1.6  Care Signal v3: Failure Track Fields

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| failure_domains | JSON | YES | FORM | Array of failure domain ENUMs selected by provider: RECOGNITION \| ESCALATION \| VASCULAR_ACCESS \| TREATMENT \| REFERRAL \| MONITORING \| COMMUNICATION \| RESOURCE_AVAILABILITY. Multi-select. At least one required on Failure Track. |
| failure_mode_codes | JSON | REC | FORM | Array of failure_mode_code values from kb_failure_modes. Multi-select within each selected domain. Optional but strongly encouraged. Shown as a secondary selector after domain selection: "Can you be more specific about what went wrong in Recognition?" Dropdown populated from kb_failure_modes filtered by selected domains. |
| chain_of_survival_gaps | JSON | REC | FORM | Array of chain-of-survival step codes where gaps occurred: RECOGNITION \| ACTIVATION \| CPR \| DEFIBRILLATION \| ALS \| POST_RESUS_CARE. Optional. |
| preventability_level | ENUM | REC | FORM | L0_UNAVOIDABLE \| L1_ADVANCED_RESOURCES \| L2_TERTIARY \| L3_DISTRICT \| L4_AVAILABLE_RESOURCES \| L5_EARLIER_ACTION. Optional but high value for FPKB classification. |
| raw_narrative | TEXT | YES | FORM | Free text: "What happened? In your own words, describe the event and what you observed." Minimum 20 characters enforced. Immutable after submission. Placeholder actively discourages patient identifiers: "Describe the clinical situation. Do not include patient names, MRN numbers, or other identifying information." |
| contributing_factors_notes | TEXT | REC | FORM | Free text: "Were there any contributing factors (staffing, equipment, environment)?" Optional. Stored alongside raw_narrative but as a separate column. |

### 1.7  Care Signal v3: Success Track Fields

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| success_domains | JSON | YES | FORM | Array of success domain ENUMs. Same list as failure_domains. At least one required on Success Track. |
| success_factor_codes | JSON | REC | FORM | Array of success_factor_code values from kb_success_factors. Multi-select within each selected domain. Optional but strongly encouraged. |
| success_narrative | TEXT | YES | FORM | Free text: "What went well? Describe the action or decision that made a positive difference." Minimum 20 characters. Immutable after submission. Placeholder discourages patient identifiers. |
| outcome_attribution | TEXT | REC | FORM | Free text: "Why do you think this made a difference?" Optional. Stored for qualitative analysis. |

### 1.8  Care Signal v3: Temporal Interval Fields (Optional depth)

Temporal interval fields are presented in an expandable "Add timing details" section. They are not required because enforcing them would reduce completion rates. They are prompted because they are the highest-value fields for clinical quality measurement.

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| time_to_recognition_mins | INT | REC | FORM | Minutes from presentation to provider identifying the primary emergency condition. UX: "Approximately how many minutes after the child arrived did the team recognise the emergency?" Number field, nullable. |
| time_to_first_intervention_mins | INT | REC | FORM | Minutes from recognition to first definitive intervention (first fluid bolus, first antibiotic, first oxygen application). UX: "How many minutes after recognition was the first treatment given?" |
| time_to_vascular_access_mins | INT | REC | FORM | Minutes from decision to obtain vascular access to successful access. UX: "How many minutes did it take to establish IV or IO access?" Null if access was not attempted or not needed. |
| time_to_escalation_mins | INT | REC | FORM | Minutes from recognition of deterioration to escalation call or senior review. UX: "How many minutes before a senior was called or the escalation pathway was activated?" Null if no escalation was required. |

***These fields are self-reported estimates, not objective measurements. They must never be surfaced as precise clinical timings in provider-facing analytics. They are used in aggregate trends only, with appropriate uncertainty labelling.***

### 1.9  Care Signal v3: Post-Submission Behaviour

Immediately after successful submission, the server must return and the UI must display:

- Submission confirmation with a submission reference code (not the internal UUID — a short human-readable code like CS-2026-0847)
- Updated Care Signal streak: current month count, total submissions, Fellowship Pillar C status if applicable
- Personal gap analysis: top three failure domains reported across provider's submission history, with trend direction
- Dynamic recommendations: one to three specific recommendations based on the failure domains in this submission, linking to specific ResusGPS pathways or micro-courses. Rules-based, not AI-generated until Knowledge Base is mature.
- Fellowship Pillar C credit confirmation if this submission is eligible and provider has an active Fellowship or pseudonymous token

***A provider who submits and sees nothing will not report again. The post-submission feedback is not a UX nicety. It is the primary adoption mechanism. It must be live — not stubbed, not mocked — before Care Signal v3 is considered shipped.***

# SECTION 2: SAFE-TRUTH V1 — CAREGIVER OBSERVATION FORM

### 2.1  The Redesign from Current State

The current Safe-Truth implementation requires authentication and captures a retrospective account of the event. v1 (as defined in this document) makes three fundamental changes:

- No account required. Safe-Truth is accessible via direct URL or QR code. No registration, no login, no password. This is a non-negotiable privacy and participation design decision that is currently unimplemented and must be treated as a P0 engineering change.
- Journey-stage structure replaces retrospective questionnaire. Instead of asking "what happened?" the form guides caregivers through the stages of the care-seeking journey: symptom onset, decision to seek care, each facility contact, and what happened after. This captures the decision points that matter, not a summary of the episode.
- Distinct UX from Care Signal. Different visual tone (warmer, less clinical), different language (plain language, not clinical terminology), different length (shorter mandatory section, optional depth per stage).

### 2.2  Access and Identity Model

Safe-Truth submissions carry no userId. The submission is permanently anonymous unless the caregiver explicitly opts into case linkage. The caregiver is never asked to identify themselves.

Access URL structure: a single public URL (e.g. paedsresus.com/safe-truth) plus a QR code available at partner facilities. No login prompt, no account creation flow, no redirect to sign-in. The form loads immediately.

Facility attribution: the facility where the experience occurred is captured via a structured selector (country → admin_level_1 → facility name search), not inferred from the caregiver's device or location. The caregiver types or selects the facility name; the analytics layer probabilistically matches to facility_id using fuzzy name matching. The caregiver is never expected to know the facility's official registration name.

### 2.3  Safe-Truth v1: Shared Classifier Fields

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| observation_timestamp | DATETIME(3) | AUTO | AUTO | Server-assigned EAT timestamp. Never from client. |
| schema_version | VARCHAR(16) | AUTO | AUTO | Active taxonomy version. Server-assigned. |
| observer_class | ENUM | AUTO | AUTO | Always CAREGIVER for Safe-Truth. |
| country | VARCHAR(2) | YES | FORM | Selected by caregiver from a short list of countries where the platform operates. Plain language country names, not ISO codes in UI. |
| admin_level_1 | VARCHAR(128) | YES | FORM | Selected from country-specific list after country selection. Label changes by country: "County" in Kenya, "District" in Uganda, "State" in India. |
| facility_name_raw | TEXT | YES | FORM | What the caregiver calls the facility. Free text with autocomplete suggestions from the facility reference table. Never forced to match exactly. Stored as raw input for probabilistic matching. |
| facility_id_matched | UUID | YES | AUTO | Set by analytics matching job after submission, not in real time. Null until matched. Never shown to caregiver. |
| facility_level | ENUM | REC | FORM | Plain language options: "Community clinic / dispensary" \| "Health centre" \| "Sub-county hospital" \| "County hospital" \| "National hospital" \| "Private clinic" \| "Not sure". Mapped to facility level ENUM by analytics layer. |
| child_age_band | ENUM | YES | FORM | Plain language: "Newborn (under 1 month)" \| "Baby (1–12 months)" \| "Toddler (1–3 years)" \| "Young child (3–5 years)" \| "Older child (5–12 years)" \| "Teenager (12–18 years)" |
| condition_category | ENUM | YES | FORM | Plain language: "Breathing problem" \| "Heart problem" \| "Fit or seizure" \| "Infection / fever" \| "Diarrhoea and dehydration" \| "Injury or accident" \| "Newborn emergency" \| "Other or not sure". Mapped to condition_category ENUM. |
| outcome_category | ENUM | YES | FORM | Plain language: "Child recovered and went home" \| "Child recovered but has ongoing problems" \| "Child passed away at the facility" \| "Child passed away on the way to the facility" \| "Child was close to danger but recovered (near miss)" \| "Child was transferred to another facility" \| "Other" |
| is_case_linkage_consented | BOOLEAN | AUTO | AUTO | Default false. Set true only if caregiver actively enters an event code in the optional linkage section. |
| event_code_entered | VARCHAR(16) | REC | FORM | Optional. A short code shared by a provider who submitted a Care Signal report for the same event. Used for consent-based case linkage. Nullable. |

### 2.4  Safe-Truth v1: Journey Stage 1 — Before Seeking Care

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| symptom_onset_days_ago | ENUM | YES | FORM | Plain language: "Today" \| "1–2 days ago" \| "3–7 days ago" \| "More than a week ago" \| "Not sure". Maps to integer range for analysis. |
| first_symptom_noticed | TEXT | REC | FORM | Free text: "What was the first sign that something was wrong with your child?" Optional. High qualitative value for Safe-Truth pattern analysis. |
| danger_signs_present | JSON | REC | FORM | Multi-select in plain language: "Could not feed or drink" \| "Unusually sleepy or hard to wake" \| "Fast or difficult breathing" \| "Very hot or very cold" \| "Fit or shaking" \| "Pale or blue lips/tongue" \| "Swollen belly" \| "Not sure". Maps to WHO danger sign taxonomy. |
| advice_received_before_facility | ENUM | YES | FORM | Plain language: "No, I did not speak to anyone" \| "Yes, a community health worker" \| "Yes, a pharmacist or chemist" \| "Yes, a family member or friend with medical knowledge" \| "Yes, a traditional healer" \| "Yes, other (please describe)". Multi-select. |
| advice_content_raw | TEXT | REC | FORM | Free text: "What were you told?" Optional. Only shown if advice_received_before_facility is not NONE. |
| reassured_despite_danger | BOOLEAN | REC | FORM | Boolean toggle: "Were you told the child was fine / not serious?" Only shown if advice_received_before_facility is not NONE. Key field for the "reassurance despite danger signs" failure pattern. |
| decision_to_seek_care_trigger | TEXT | REC | FORM | Free text: "What made you decide to go to the hospital or clinic?" Optional. High qualitative value. |

### 2.5  Safe-Truth v1: Journey Stage 2 — Getting to Care

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| transport_used | ENUM | YES | FORM | Plain language: "We walked" \| "Private car or matatu" \| "Ambulance" \| "Boda-boda / motorcycle" \| "Other". Multi-select for multi-leg journeys. |
| transport_delay_occurred | BOOLEAN | YES | FORM | Toggle: "Was there a delay in getting transport?" Yes/No. |
| transport_delay_reason | TEXT | REC | FORM | Free text: "What caused the delay?" Only shown if transport_delay_occurred = true. |
| travel_time_to_first_facility | ENUM | YES | FORM | Plain language: "Less than 30 minutes" \| "30 minutes to 1 hour" \| "1–2 hours" \| "More than 2 hours" \| "Not sure" |
| cost_barrier_occurred | BOOLEAN | YES | FORM | Toggle: "Did the cost of care or transport cause a delay in getting help?" Yes/No. |
| cost_barrier_details | TEXT | REC | FORM | Free text: "Can you tell us more about the cost barrier?" Only shown if cost_barrier_occurred = true. |
| facilities_visited_count | ENUM | YES | FORM | Plain language: "This was the first place we went" \| "We went to one other place first" \| "We went to two other places first" \| "We went to three or more other places first" |

### 2.6  Safe-Truth v1: Journey Stage 3 — At Each Facility (Repeatable)

This stage is repeatable: if the caregiver visited multiple facilities, they can add an account for each. The form shows "Add another facility visit" after each completed stage. Each repetition creates a separate facility_visit record linked to the parent Safe-Truth submission.

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| visit_sequence | TINYINT | AUTO | AUTO | 1 for first facility visited, 2 for second, etc. Server-assigned based on submission order. |
| visit_facility_name_raw | TEXT | YES | FORM | What the caregiver calls this facility. Same autocomplete as the primary facility_name_raw. |
| visit_facility_id_matched | UUID | YES | AUTO | Matched by analytics job post-submission. Null until matched. |
| visit_facility_is_final | BOOLEAN | AUTO | AUTO | True if this is the facility where the child's episode ended (survived/died/discharged). Set by application based on journey completion. |
| was_seen_promptly | ENUM | YES | FORM | Plain language: "Yes, within minutes" \| "Within 1 hour" \| "1–3 hours wait" \| "More than 3 hours wait" \| "We were turned away" \| "Not sure" |
| turned_away | BOOLEAN | AUTO | AUTO | Set true if was_seen_promptly = "We were turned away" |
| turned_away_reason | TEXT | REC | FORM | Free text: "Why were you turned away?" Only shown if turned_away = true. |
| information_received | ENUM | REC | FORM | Plain language: "We were told clearly what was wrong" \| "We were given some information but not clearly" \| "We were told very little" \| "Nobody explained anything" \| "Not sure". Maps to COMMUNICATION domain. |
| family_involvement | ENUM | REC | FORM | Plain language: "We were kept informed and involved in decisions" \| "We were informed but not involved" \| "We were not informed" \| "Not sure" |
| visit_experience_raw | TEXT | REC | FORM | Free text: "Is there anything else about your experience at this facility you would like to share?" Optional. High qualitative value. |
| danger_sign_advice_at_discharge | BOOLEAN | REC | FORM | Boolean: "Before leaving, were you told what signs to watch for and when to come back?" Only shown if visit_facility_is_final = true and outcome is not death. |

### 2.7  Safe-Truth v1: Journey Stage 4 — After Care

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| follow_up_instructions_received | BOOLEAN | REC | FORM | Toggle: "Were you given clear instructions for what to do after leaving the hospital?" Yes/No. Only shown if outcome is not death. |
| able_to_follow_instructions | BOOLEAN | REC | FORM | Toggle: "Were you able to follow those instructions?" Only shown if follow_up_instructions_received = true. |
| unable_to_follow_reason | TEXT | REC | FORM | Free text: "What made it difficult to follow the instructions?" Optional. |
| overall_experience_rating | ENUM | REC | FORM | Plain language: "The care was very good" \| "The care was mostly good" \| "The care was mixed" \| "The care was mostly poor" \| "The care was very poor". Ordinal 1–5 stored internally. |
| what_could_have_been_better | TEXT | REC | FORM | Free text: "Is there one thing that could have made the biggest difference to your child's care?" Optional. High qualitative value for peer-learning model. |
| raw_narrative | TEXT | YES | FORM | Free text: "In your own words, please tell us what happened to your child from when you first noticed something was wrong." Presented as the first field on the form, before the journey stages, to capture the caregiver's own account before structured questions shape their thinking. Immutable after submission. |

*raw_narrative is presented first, before any structured questions. This is intentional: the structured fields that follow should supplement the caregiver's own account, not replace or pre-shape it. The caregiver's unstructured narrative often contains the most valuable signals.*

# SECTION 3: RESUSGPS SESSION RECORD — AUTOMATED TELEMETRY

### 3.1  What the Session Record Captures

The ResusGPS session record is generated automatically as the provider navigates the clinical pathway. No provider action is required beyond using the product. It is the highest-fidelity temporal observation in the system because it is concurrent, not retrospective.

The session record serves two purposes: post-case review for the provider (what pathway did I take, what were the calculated doses, what did I miss) and FPKB input for the Learning System (which pathway steps were skipped, what was marked Not Available, how long was spent in each phase, what temporal intervals can be derived).

### 3.2  ResusGPS Session Record: Core Fields

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| id | UUID | AUTO | AUTO | Primary key. Session ID referenced in analyticsEvents and Care Signal pre-population. |
| user_id | VARCHAR(36) | AUTO | AUTO | Provider userId. Anonymised on account deletion. |
| facility_id | UUID | AUTO | PROFILE | Loaded from provider profile at session start. Shown to provider as confirmation with option to change for locum sessions. |
| country | VARCHAR(2) | AUTO | AUTO | Loaded from facility reference table using facility_id. |
| admin_level_1 | VARCHAR(128) | AUTO | AUTO | Loaded from facility reference table. |
| facility_level | ENUM | AUTO | AUTO | Loaded from facility reference table. |
| provider_cadre | ENUM | AUTO | PROFILE | Loaded from provider profile. |
| role_at_time_of_session | ENUM | YES | FORM | Shown at session start: TEAM_LEADER \| PRIMARY_CLINICIAN \| SUPPORT_CLINICIAN \| OBSERVING_TRAINEE. Required before clinical pathway begins. |
| session_started_at | DATETIME(3) | AUTO | AUTO | EAT timestamp when provider opened ResusGPS for this case. |
| session_completed_at | DATETIME(3) | AUTO | AUTO | EAT timestamp when session ended (definitive care completed, CPR-GPS concluded, or session abandoned). |
| session_status | ENUM | AUTO | AUTO | COMPLETED \| ABANDONED \| IN_PROGRESS |
| condition_selected | VARCHAR(64) | AUTO | TELEMETRY | The condition selected at diagnosis step. Maps to condition_category. |
| condition_category | ENUM | AUTO | AUTO | Derived from condition_selected using condition mapping table. |
| child_age_band | ENUM | AUTO | TELEMETRY | Derived from the weight/age input at session start. |
| child_weight_kg | DECIMAL(5,2) | AUTO | TELEMETRY | Actual weight input used for dose calculations. Stored for audit. |
| resusgps_pathway_version | VARCHAR(32) | AUTO | AUTO | Version of the ResusGPS pathway used. Critical for content versioning and the Adaptive Learning System. |
| schema_version | VARCHAR(16) | AUTO | AUTO | Active taxonomy version at session time. |
| is_fellowship_eligible | BOOLEAN | AUTO | AUTO | True if condition_selected is one of the 15 fellowship conditions and definitive care was completed. |
| fellowship_pillar_b_credited | BOOLEAN | AUTO | AUTO | True if Fellowship Pillar B credit was awarded for this session. |
| event_id | UUID | YES | AUTO | Generated at session end. Used for Care Signal pre-population and collaborative event linking. |

### 3.3  ResusGPS Session Record: Primary Survey Telemetry

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| xabcde_started_at | DATETIME(3) | AUTO | TELEMETRY | Timestamp when Primary Survey was opened. |
| xabcde_completed_at | DATETIME(3) | AUTO | TELEMETRY | Timestamp when all Primary Survey fields were submitted. |
| xabcde_duration_seconds | INT | AUTO | AUTO | Derived: completed_at minus started_at. Key temporal signal. |
| xabcde_fields_completed | INT | AUTO | TELEMETRY | Count of XABCDE fields submitted with a value (not marked Not Available). |
| xabcde_fields_not_available | INT | AUTO | TELEMETRY | Count of XABCDE fields marked Not Available. High Not Available counts signal resource constraints. |
| abnormal_findings_detected | JSON | AUTO | TELEMETRY | Array of XABCDE field codes where abnormal values were detected and highlighted during input. Enables analysis of which abnormal findings are most commonly missed in subsequent clinical decisions. |
| vitals_snapshot | JSON | AUTO | TELEMETRY | JSON object of all submitted vital signs with values and normal/abnormal flags. Stored for post-case review. No patient identifiers. |

### 3.4  ResusGPS Session Record: Diagnosis and Definitive Care Telemetry

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| diagnosis_step_started_at | DATETIME(3) | AUTO | TELEMETRY | Timestamp when differential diagnosis step was reached. |
| diagnosis_confirmed_at | DATETIME(3) | AUTO | TELEMETRY | Timestamp when primary diagnosis was confirmed. |
| time_to_diagnosis_seconds | INT | AUTO | AUTO | Derived. Includes Primary Survey and Secondary Survey time. |
| primary_diagnosis_code | VARCHAR(64) | AUTO | TELEMETRY | The condition confirmed as primary diagnosis. |
| secondary_diagnosis_codes | JSON | AUTO | TELEMETRY | Array of co-diagnoses confirmed. Enables multi-diagnosis pattern analysis. |
| definitive_care_started_at | DATETIME(3) | AUTO | TELEMETRY | Timestamp when definitive care protocol was opened. |
| definitive_care_completed_at | DATETIME(3) | AUTO | TELEMETRY | Timestamp when all definitive care steps were confirmed or marked not applicable. |
| definitive_care_steps_completed | INT | AUTO | TELEMETRY | Count of care steps confirmed by provider. |
| definitive_care_steps_skipped | INT | AUTO | TELEMETRY | Count of care steps marked not applicable or skipped. High skip counts may indicate resource gaps. |
| fluid_boluses_given | INT | AUTO | TELEMETRY | Count of fluid boluses administered and confirmed in ResusGPS. |
| fluid_bolus_reassessments_completed | INT | AUTO | TELEMETRY | Count of post-bolus reassessments completed (overload signs + perfusion checks). Should equal fluid_boluses_given. |
| antibiotics_administered | BOOLEAN | AUTO | TELEMETRY | Whether antibiotic administration was confirmed in definitive care. |
| time_to_first_antibiotic_minutes | INT | AUTO | AUTO | Derived from session timestamps if antibiotics confirmed. Null if not confirmed or not applicable. |
| resource_gaps_noted | JSON | AUTO | TELEMETRY | Array of resource gap codes noted during the session (equipment Not Available, drug Not Available). Key signal for RESOURCE_AVAILABILITY domain. |
| dose_calculations_generated | INT | AUTO | TELEMETRY | Count of weight-based dose calculations generated. Enables analysis of dosing support usage. |

### 3.5  ResusGPS Session Record: CPR-GPS Telemetry (if cardiac arrest)

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| cprgps_activated | BOOLEAN | AUTO | TELEMETRY | Whether CPR-GPS cardiac arrest workflow was activated during this session. |
| cprgps_started_at | DATETIME(3) | AUTO | TELEMETRY | Timestamp of CPR-GPS activation. |
| compression_cycles_completed | INT | AUTO | TELEMETRY | Count of 2-minute compression cycles completed with timer. |
| shocks_delivered | INT | AUTO | TELEMETRY | Count of defibrillation shocks confirmed. |
| rosc_confirmed | BOOLEAN | AUTO | TELEMETRY | Whether return of spontaneous circulation was confirmed. |
| cprgps_duration_minutes | INT | AUTO | AUTO | Total duration of CPR-GPS session. |
| rhythm_decisions_made | INT | AUTO | TELEMETRY | Count of rhythm check decisions recorded. |

### 3.6  ResusGPS Session Record: Post-Case Integration

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| care_signal_prompted | BOOLEAN | AUTO | AUTO | Whether the post-case Care Signal prompt was displayed. |
| care_signal_submitted | BOOLEAN | AUTO | AUTO | Whether the provider submitted a Care Signal report linked to this session. |
| care_signal_submission_id | UUID | AUTO | AUTO | FK to careSignalEvents if submitted. Null if not submitted. Key metric for holistic loop Stage 2. |
| session_summary_exported | BOOLEAN | AUTO | AUTO | Whether the provider exported the session summary. |

# SECTION 4: FELLOWSHIP COMPETENCY RECORD — ASSESSMENT TELEMETRY

### 4.1  What the Fellowship Competency Record Captures

The Fellowship Competency Record aggregates all assessment telemetry into a per-provider longitudinal competency profile. It is not a single form submission. It is a derived record constructed from course attempt records, simulation completion logs, and Care Signal streak data.

Its primary purpose is the Learning Cohort evaluation framework: enabling within-provider analysis of how competency changes across the Fellowship timeline, without any external control group. Secondary purpose: automated Fellowship pillar verification.

### 4.2  Course Attempt Record (per assessment attempt)

Every diagnostic quiz, formative quiz, and summative examination attempt generates a course attempt record. These are the atomic units of competency telemetry.

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| id | UUID | AUTO | AUTO | Primary key |
| user_id | VARCHAR(36) | AUTO | AUTO | Provider userId |
| course_id | VARCHAR(64) | AUTO | AUTO | Course identifier: e.g. "septic-shock-1" or "bls" |
| assessment_type | ENUM | AUTO | AUTO | DIAGNOSTIC \| FORMATIVE \| SUMMATIVE |
| attempt_number | INT | AUTO | AUTO | Attempt count for this course/assessment_type combination. Enables retry analysis. |
| started_at | DATETIME(3) | AUTO | AUTO | EAT timestamp |
| completed_at | DATETIME(3) | AUTO | AUTO | EAT timestamp. Null if abandoned. |
| score_percentage | DECIMAL(5,2) | AUTO | AUTO | Score as percentage. Null if abandoned. |
| passed | BOOLEAN | AUTO | AUTO | Whether the passing threshold was met. Null if abandoned. |
| questions_answered | INT | AUTO | AUTO | Count of questions answered |
| questions_correct | INT | AUTO | AUTO | Count of correct answers |
| topic_performance | JSON | AUTO | AUTO | JSON: {topic_code: {correct: n, total: n}} for each topic area in the assessment. Enables topic-level gap identification. |
| time_taken_seconds | INT | AUTO | AUTO | Duration of the attempt |
| schema_version | VARCHAR(16) | AUTO | AUTO | Active taxonomy version |
| question_bank_version | VARCHAR(16) | AUTO | AUTO | Version of the question bank used. Enables detection of question bank changes affecting score trends. |

### 4.3  Simulation Completion Record (per simulation run)

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| id | UUID | AUTO | AUTO | Primary key |
| user_id | VARCHAR(36) | AUTO | AUTO | Provider userId |
| course_id | VARCHAR(64) | AUTO | AUTO | Parent course identifier |
| simulation_id | VARCHAR(64) | AUTO | AUTO | Specific simulation scenario identifier |
| run_number | INT | AUTO | AUTO | Run count for this simulation. Enables replay analysis. |
| started_at | DATETIME(3) | AUTO | AUTO | EAT timestamp |
| completed_at | DATETIME(3) | AUTO | AUTO | EAT timestamp |
| decision_points_total | INT | AUTO | AUTO | Total branching decision points in this scenario |
| decision_points_correct | INT | AUTO | AUTO | Correct decisions made |
| critical_errors | INT | AUTO | AUTO | Count of decisions classified as critical errors (would have caused harm in clinical context) |
| decision_performance | JSON | AUTO | AUTO | JSON: {decision_point_id: {chosen: code, correct: code, is_critical: bool}} for each decision point. High-value for failure mode identification. |
| scenario_completed | BOOLEAN | AUTO | AUTO | Whether the simulation reached a conclusion (vs abandoned mid-scenario) |
| schema_version | VARCHAR(16) | AUTO | AUTO |  |

### 4.4  Fellowship Progress Record (derived, per provider)

One record per provider. Continuously updated. This is the source of truth for Fellowship pillar status and the provider's longitudinal learning trajectory.

| Field Name | Type | Required | Source | Notes |
|---|---|---|---|---|
| id | UUID | AUTO | AUTO | Primary key |
| user_id | VARCHAR(36) | AUTO | AUTO | Provider userId. One record per provider. |
| fellowship_enrolled_at | DATETIME(3) | AUTO | AUTO | When the provider enrolled in the Fellowship pathway |
| pillar_a_status | ENUM | AUTO | AUTO | NOT_STARTED \| IN_PROGRESS \| COMPLETED. Auto-updated when required courses are completed. |
| pillar_a_completed_at | DATETIME(3) | AUTO | AUTO | Null until completed. |
| pillar_b_status | ENUM | AUTO | AUTO | NOT_STARTED \| IN_PROGRESS \| COMPLETED. Auto-updated when all 15 fellowship conditions have qualifying ResusGPS sessions. |
| pillar_b_completed_at | DATETIME(3) | AUTO | AUTO | Null until completed. |
| pillar_b_conditions_completed | JSON | AUTO | AUTO | JSON: {condition_code: completed_at} for each of the 15 fellowship conditions. Updated when qualifying ResusGPS session detected. |
| pillar_c_current_streak | INT | AUTO | AUTO | Count of consecutive EAT calendar months with at least one eligible Care Signal submission. |
| pillar_c_streak_started_at | DATETIME(3) | AUTO | AUTO | When the current streak began. |
| pillar_c_graces_used | TINYINT | AUTO | AUTO | Count of grace months used in current EAT calendar year. Maximum 2. |
| pillar_c_catch_up_pending | BOOLEAN | AUTO | AUTO | True if provider used a grace and must submit >=3 Care Signal reports in the following month to avoid streak reset. |
| pillar_c_completed_at | DATETIME(3) | AUTO | AUTO | Set when pillar_c_current_streak reaches 24. Null until completed. |
| fellowship_status | ENUM | AUTO | AUTO | NOT_ENROLLED \| ENROLLED \| IN_PROGRESS \| COMPLETED \| LAPSED (streak reset after 3rd failure) |
| fellowship_completed_at | DATETIME(3) | AUTO | AUTO | Set when all three pillars are verified as COMPLETED. Triggers automated Fellow title award. |
| fellow_title_awarded_at | DATETIME(3) | AUTO | AUTO | Timestamp of automated Fellow title award. Never set manually. |
| learning_cohort_entry_month | VARCHAR(7) | AUTO | AUTO | EAT YYYY-MM of first platform activity (first Care Signal, first ResusGPS session, or first course attempt, whichever is earliest). Anchor point for longitudinal analysis. |
| baseline_care_signal_quality_score | DECIMAL(4,3) | AUTO | AUTO | Derived score from first 3 Care Signal submissions (completeness, failure mode specificity, temporal interval completion). Baseline for improvement tracking. Null until 3 submissions exist. |
| latest_care_signal_quality_score | DECIMAL(4,3) | AUTO | AUTO | Same scoring applied to most recent 3 submissions. Enables within-provider improvement detection. |
| top_failure_domains | JSON | AUTO | AUTO | Top 3 failure domains by frequency across provider's Care Signal history. Updated monthly. Used for personalised recommendations. |
| schema_version | VARCHAR(16) | AUTO | AUTO |  |
| updated_at | DATETIME(3) | AUTO | AUTO | ON UPDATE CURRENT_TIMESTAMP(3) |

### 4.5  The Learning Cohort Evaluation Framework

The Learning Cohort framework enables within-provider longitudinal analysis without any external control group. The mechanism:

- At account creation, learning_cohort_entry_month is set to the EAT calendar month of first platform activity.
- All assessment telemetry (course attempts, simulation runs, Care Signal submissions, ResusGPS sessions) is timestamped relative to learning_cohort_entry_month.
- At Fellowship milestones (Pillar A completion, Pillar B completion, Pillar C month 6, month 12, month 18, month 24), a snapshot of the provider's Care Signal quality score and top failure domains is stored.
- Analytics queries can then ask: how did this provider's Care Signal reporting quality change between month 0-6 and month 18-24? What failure domains decreased in frequency after Pillar A completion? How did ResusGPS navigation efficiency change after Fellowship completion?
- At facility level: when a facility reaches a critical mass of Fellows (to be defined as the platform scales), facility-level Care Signal data is compared before and after reaching that threshold.

*The Learning Cohort framework produces evidence for the most important question the platform will eventually answer: does becoming a Paeds Resus Fellow change patient care? Not through an external comparison group, but through each provider's own trajectory over time.*

# SECTION 5: SHARED ENUM REFERENCE

The following ENUM values must be identical across all observation tables and all products. Any divergence makes pattern triangulation impossible. These are binding across Care Signal, Safe-Truth, ResusGPS, and the FPKB.

### 5.1  condition_category

| ENUM value | Plain language label (for UI) |
|---|---|
| RESPIRATORY | Breathing problem |
| CARDIOVASCULAR | Heart or circulation problem |
| NEUROLOGICAL | Fit, seizure, or brain problem |
| INFECTIOUS_BACTERIAL | Bacterial infection or sepsis |
| INFECTIOUS_VIRAL | Viral infection |
| METABOLIC | Metabolic emergency (DKA, hypoglycaemia, electrolyte) |
| TRAUMA | Injury or accident |
| NEONATAL | Newborn emergency (first 28 days) |
| POISONING | Poisoning or toxic ingestion |
| OTHER | Other or not sure |

### 5.2  child_age_band

| ENUM value | Definition and plain language label |
|---|---|
| NEONATAL | 0–28 days. "Newborn (under 1 month)" |
| INFANT | 29 days – 12 months. "Baby (1–12 months)" |
| TODDLER | 1–3 years. "Toddler (1–3 years)" |
| PRESCHOOL | 3–5 years. "Young child (3–5 years)" |
| SCHOOL | 5–12 years. "Older child (5–12 years)" |
| ADOLESCENT | 12–18 years. "Teenager (12–18 years)" |

### 5.3  outcome_category

| ENUM value | Plain language label |
|---|---|
| SURVIVED_WELL | Child recovered and went home |
| SURVIVED_MORBIDITY | Child recovered but has ongoing problems |
| DIED_IN_FACILITY | Child passed away at the facility |
| DIED_IN_TRANSIT | Child passed away on the way to the facility |
| NEAR_MISS | Child was close to danger but recovered (near miss) |
| TRANSFERRED_UNKNOWN | Child was transferred — outcome unknown |
| UNKNOWN | Outcome not known |

### 5.4  failure_domain / success_domain

| ENUM value | Domain description |
|---|---|
| RECOGNITION | Failure or success in identifying the emergency condition |
| ESCALATION | Failure or success in calling for help or escalating care |
| VASCULAR_ACCESS | Failure or success in obtaining IV or IO access |
| TREATMENT | Failure or success in administering the correct treatment |
| REFERRAL | Failure or success in transferring the child appropriately |
| MONITORING | Failure or success in reassessing the child after intervention |
| COMMUNICATION | Failure or success in team communication or family information |
| RESOURCE_AVAILABILITY | Absence or presence of required equipment or medications |

### 5.5  facility_level (Kenya MoH classification with WHO crosswalk)

| ENUM value | Kenya MoH level / WHO equivalent |
|---|---|
| COMMUNITY | Community / Village Health Post — WHO Primary Level |
| LEVEL_2 | Dispensary / Health Post — WHO Primary Level |
| LEVEL_3 | Health Centre — WHO Primary Level |
| LEVEL_4 | Sub-County Hospital — WHO Secondary Level |
| LEVEL_5 | County Referral Hospital — WHO Secondary/Tertiary Level |
| LEVEL_6 | National Referral / Teaching Hospital — WHO Tertiary Level |
| PRIVATE_CLINIC | Private clinic not in MoH classification |
| OTHER | Other facility type |

Note: When platform expands beyond Kenya, the facility_level ENUM values are supplemented by a country-specific mapping table that translates local facility classifications to the canonical ENUM values above, enabling cross-country analysis on a consistent taxonomy.

## Document Classification and Review

*This document is the canonical specification for what each observer class captures. It implements Observation Architecture v1.1 Sections 3, 4, and 5. Any conflict between this document and the PSoT on form fields, validation rules, or database columns is resolved by updating the PSoT to reference this document as authoritative for observation form specifications. Review triggers: new observer class added; shared ENUM values change; new mandatory field required by FPKB; form redesign for any observer class. All changes must be versioned and logged in WORK_STATUS.md.*
