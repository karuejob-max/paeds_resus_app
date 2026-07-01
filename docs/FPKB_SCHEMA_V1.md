**PAEDS RESUS LIMITED**

*AHA Aligned Training Site — ID: TS70875*

**FAILURE PATTERN KNOWLEDGE BASE**

*Schema Specification v1.0*

*The Engineering Specification for How Paeds Resus Stores What It Has Learned*

Version 1.0 — June 2026

Classification: Engineering — Confidential Internal

*Implements: Observation Architecture v1.1 Sections 6, 7, and 9*

***This document specifies the database schema for the Failure Pattern Knowledge Base — the persistent store of what the Adaptive Learning System has learned from observations. Without this schema, Care Signal, Safe-Truth, and ResusGPS telemetry are parallel databases that never produce system intelligence. With it, they become the input to a learning system that changes clinical practice.***

## EXECUTIVE SUMMARY — READ THIS FIRST

**If you read nothing else in this document, read this section.**

**The core claim:** This document is the database blueprint for the Failure Pattern Knowledge Base (FPKB) — 11 tables, prefixed `kb_`, that sit in a separate schema from the operational observation tables. It is **not** a description of something that already exists in production. As of June 2026, this schema has not yet been migrated. It becomes the next engineering priority after Care Signal v3 ships.

**The single most important rule in this document:** The FPKB references observations; observations never reference the FPKB. Never add a `pattern_id` or `recommendation_id` as a foreign key on `careSignalEvents`, `parentSafeTruthSubmissions`, or `resusGPSCases`. The relationship is one-directional. Violating this destroys observation immutability — the foundational principle of the entire learning system.

**What the 11 tables do, in plain language:**

| Table group | What it stores |
|---|---|
| `kb_failure_modes`, `kb_success_factors` | The atomic taxonomy — what specifically went wrong or right in a single observation |
| `kb_patterns` | Recurring combinations of failure modes or success factors across many observations — the primary unit of learning |
| `kb_pattern_modes`, `kb_pattern_observations` | The evidence base — which specific observations support each pattern |
| `kb_content_versions` | Every ResusGPS pathway or curriculum change, with a reference to the pattern that motivated it — the adaptive loop |
| `kb_recommendations`, `kb_interventions`, `kb_implementations` | The action pipeline — what was suggested, what was committed to, and what actually happened |
| `kb_review_schedule`, `kb_governance_audit`, `kb_evidence_links` | Governance — automated review scheduling, an append-only audit trail, and external evidence linkage |

**The migration sequence matters:** Run migrations A through L in the exact order in Section 5.3. Dependencies between tables make out-of-order migration fail.

**The seed data is ready:** Section 6 contains 28 failure modes and 10 success factors to insert immediately after migrations complete. These are not placeholders — they are the version 1.0 taxonomy, agreed and clinically reviewed.

**Common misreading to avoid:** The FPKB is **not** a replacement for Care Signal. Care Signal is the observation tool that collects data from providers. The FPKB is the knowledge store that aggregates those observations into confirmed patterns. They are different layers. One is a form; the other is a database of what the forms have collectively taught the system. Do not conflate them.

**One governance rule that can never be automated:** The `outcome_label` field on `kb_implementations` (whether an intervention actually improved outcomes) must always be assigned by a human Knowledge Stewardship reviewer. The system may flag an implementation as ready for review, but it may never self-assign this label. This is a hard constraint, not a preference.

# SECTION 1: PURPOSE AND POSITION

### 1.1  What This Document Is

This document specifies the complete database schema for the Failure Pattern Knowledge Base (FPKB). It is a concrete engineering specification derived from the Observation Architecture v1.1, Sections 6 (Transformation Pipeline), 7 (Learning Governance), and 9 (Engineering Requirements). It does not repeat the conceptual justification for these design choices — that justification is in the Observation Architecture. This document specifies exactly what to build.

The schema is organised into three groups:

- Core knowledge tables — the patterns, the evidence ladder, and the content version history
- Action tables — recommendations, interventions, and implementations
- Junction and audit tables — observation-to-pattern links, governance audit trail, and review scheduling

### 1.2  Relationship to Existing Schema

The FPKB is a new database schema separate from the existing operational tables (careSignalEvents, resusGPSCases, analyticsEvents, users, etc.). It reads from those tables but does not modify them. The existing tables are observation stores. The FPKB is a knowledge store. They are different things and must remain separate.

| Existing tables (observation store) | FPKB tables (knowledge store) |
|---|---|
| careSignalEvents | failure_patterns, success_patterns |
| parentSafeTruthSubmissions | failure_modes, success_factors |
| resusGPSCases | recommendations |
| analyticsEvents | interventions |
| fellowshipProgress (assessment records) | implementations |
| institutionalReadinessAudits (to be built) | pattern_observations (join table) |

***Never embed pattern_id or recommendation_id as foreign keys in the observation tables (careSignalEvents, parentSafeTruthSubmissions, resusGPSCases). The relationship is one-directional: the FPKB references observations; observations do not reference the FPKB. This preserves the immutability of the observation record.***

### 1.3  Schema Naming Convention

- All FPKB tables use snake_case following the existing Drizzle ORM convention
- All FPKB tables are prefixed with kb_ to distinguish them from operational tables at a glance
- UUID primary keys throughout — no auto-increment integers in the FPKB (patterns and recommendations must be referenceable across environments without collision)
- All timestamps in UTC stored as DATETIME(3); displayed in EAT (UTC+3) at the application layer
- JSON columns use the MySQL JSON type with documented schema in comments

# SECTION 2: CORE KNOWLEDGE TABLES

### 2.1  kb_failure_modes

A failure mode is the atomic unit of what went wrong in a single observation. It is more specific than a failure domain. Failure modes are the lowest level of clinical specificity in the learning system and are the primary unit of comparison when detecting recurrence.

Failure modes are not captured directly by the Care Signal form v2 — the current form captures failure domains (Recognition, Escalation, etc.). Care Signal v3 must add failure mode capture. Until then, failure modes are inferred analytically from domain + event type combinations. The kb_failure_modes table stores the canonical taxonomy.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | VARCHAR(36) | NO | uuid() | Primary key. UUID v4. |
| failure_mode_code | VARCHAR(64) | NO |  | Stable machine-readable code e.g. RECOG_SHOCK_DELAYED. Never changed after first use. |
| failure_domain | ENUM | NO |  | One of: RECOGNITION, ESCALATION, VASCULAR_ACCESS, TREATMENT, REFERRAL, MONITORING, COMMUNICATION, RESOURCE_AVAILABILITY |
| failure_mode_name | VARCHAR(255) | NO |  | Human-readable short name: "Delayed shock recognition despite tachycardia" |
| description | TEXT | NO |  | Full clinical description of the failure mode including typical presentation context |
| condition_categories | JSON | YES | NULL | Array of condition_category ENUM values where this failure mode is most commonly observed. Nullable if cross-condition. |
| taxonomy_version | VARCHAR(16) | NO |  | Version of failure domain taxonomy active when this mode was defined e.g. "1.0" |
| is_active | BOOLEAN | NO | 1 | False if retired from active taxonomy. Historical observations retain reference. |
| created_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) |  |
| updated_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) | ON UPDATE CURRENT_TIMESTAMP(3) |
| retired_at | DATETIME(3) | YES | NULL | Set when is_active becomes false. Null if still active. |
| retired_reason | TEXT | YES | NULL | Why this failure mode was retired. Null if still active. |

### 2.2  kb_success_factors

A success factor is the positive analogue of a failure mode: a specific, named action, decision, or system feature that contributed to a good outcome or prevented deterioration. Success factors feed into the Success Pattern track of the Knowledge Base.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | VARCHAR(36) | NO | uuid() | Primary key. UUID v4. |
| success_factor_code | VARCHAR(64) | NO |  | Stable machine-readable code e.g. RECOG_SEPSIS_CHECKLIST_NURSE_LED |
| success_domain | ENUM | NO |  | Same domains as failure_domain: RECOGNITION, ESCALATION, VASCULAR_ACCESS, TREATMENT, REFERRAL, MONITORING, COMMUNICATION, RESOURCE_AVAILABILITY |
| success_factor_name | VARCHAR(255) | NO |  | Human-readable short name: "Nurse-led sepsis checklist initiated within 10 minutes" |
| description | TEXT | NO |  | Full description including what was done, by whom, and in what context |
| condition_categories | JSON | YES | NULL | Array of condition_category values where this factor is most relevant |
| taxonomy_version | VARCHAR(16) | NO |  |  |
| is_active | BOOLEAN | NO | 1 |  |
| created_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) |  |
| updated_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) | ON UPDATE CURRENT_TIMESTAMP(3) |
| retired_at | DATETIME(3) | YES | NULL |  |
| retired_reason | TEXT | YES | NULL |  |

### 2.3  kb_patterns

The central table of the FPKB. A pattern is a recurring combination of failure modes (or success factors) observed across multiple independent observations. This single table handles both Failure Patterns and Success Patterns via the pattern_track column.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | VARCHAR(36) | NO | uuid() | Primary key. UUID v4. Never reused. |
| pattern_track | ENUM | NO |  | FAILURE or SUCCESS. Determines which confidence ladder applies. |
| pattern_code | VARCHAR(64) | NO |  | Stable machine-readable code e.g. FP_SHOCK_RECOG_FEBRILE_INFANT_L4 |
| pattern_name | VARCHAR(512) | NO |  | Human-readable: "Delayed shock recognition in febrile infants at Level 4 facilities" |
| primary_domain | ENUM | NO |  | Primary failure or success domain |
| description | TEXT | NO |  | Full clinical description of the pattern, its typical context, and why it matters |
| confidence_level | ENUM | NO |  | Failure track: SIGNAL \| CANDIDATE \| CONFIRMED \| ESTABLISHED. Success track: CANDIDATE_SUCCESS \| EMERGING_SUCCESS \| VALIDATED_SUCCESS \| STANDARD_PRACTICE |
| confidence_dimensions | JSON | NO |  | JSON object: {clinical: 0-1, statistical: 0-1, external_evidence: 0-1, platform_replication: 0-1, geographic_diversity: 0-1, recency: 0-1}. Never a single scalar. |
| supporting_observation_count | INT | NO | 0 | Count of distinct observations linked via kb_pattern_observations. Updated by trigger or scheduled job. |
| first_detected_at | DATETIME(3) | YES | NULL | Timestamp of first qualifying observation. Set when pattern is first created. |
| last_confirmed_at | DATETIME(3) | YES | NULL | Timestamp of most recent qualifying observation. Updated when new supporting observation is linked. |
| trend_direction | ENUM | YES | NULL | INCREASING \| DECREASING \| STABLE \| INSUFFICIENT_DATA |
| geographic_scope | JSON | YES | NULL | Array of country codes where this pattern has been detected |
| admin_scope | JSON | YES | NULL | Array of admin_level_1 values where this pattern is prevalent |
| condition_scope | JSON | YES | NULL | Array of condition_category values where this pattern appears |
| facility_level_scope | JSON | YES | NULL | Array of facility_level values most associated with this pattern |
| cadre_scope | JSON | YES | NULL | Array of provider cadres most associated with this pattern |
| preventability_distribution | JSON | YES | NULL | Failure track only. JSON: {L0: count, L1: count, L2: count, L3: count, L4: count, L5: count} |
| taxonomy_version | VARCHAR(16) | NO |  | Schema version active when this pattern was classified |
| knowledge_status | ENUM | NO | ACTIVE | ACTIVE \| UNDER_REVIEW \| RETIRED |
| review_due_at | DATETIME(3) | YES | NULL | Auto-set by application: 12 months from last_confirmed_at for CONFIRMED/ESTABLISHED; 6 months for SIGNAL/CANDIDATE |
| retired_at | DATETIME(3) | YES | NULL | Set when knowledge_status becomes RETIRED |
| retired_reason | TEXT | YES | NULL | Why this pattern was retired |
| created_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) |  |
| updated_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) | ON UPDATE CURRENT_TIMESTAMP(3) |
| created_by | VARCHAR(36) | NO |  | userId or "system" for automated detection |

### 2.4  kb_pattern_modes (junction: pattern ←→ failure modes / success factors)

Links patterns to the specific failure modes or success factors that constitute them. One pattern may involve multiple modes. One mode may appear in multiple patterns.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | VARCHAR(36) | NO | uuid() | Primary key |
| pattern_id | VARCHAR(36) | NO |  | FK → kb_patterns.id |
| mode_id | VARCHAR(36) | NO |  | FK → kb_failure_modes.id OR kb_success_factors.id. Application enforces correct track. |
| mode_track | ENUM | NO |  | FAILURE or SUCCESS. Must match parent pattern_track. |
| is_primary | BOOLEAN | NO | 0 | Whether this is the primary mode for this pattern (the most salient failure/success) |
| sequence_position | TINYINT | YES | NULL | Position in causal sequence if the pattern involves a chain of failures (1=first, 2=second, etc.) |
| created_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) |  |

### 2.5  kb_pattern_observations (junction: pattern ←→ observations)

Links confirmed patterns to the specific observations that support them. This table is the evidence base for every confidence score. Without it, pattern confidence cannot be traced to source data.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | VARCHAR(36) | NO | uuid() | Primary key |
| pattern_id | VARCHAR(36) | NO |  | FK → kb_patterns.id |
| observation_source | ENUM | NO |  | CARE_SIGNAL \| SAFE_TRUTH \| RESUSGPS \| ASSESSMENT \| INSTITUTIONAL_AUDIT |
| observation_id | VARCHAR(36) | NO |  | ID of the source observation row in the relevant operational table |
| observation_table | VARCHAR(64) | NO |  | Canonical table name: careSignalEvents \| parentSafeTruthSubmissions \| resusGPSCases \| etc. |
| country | VARCHAR(2) | NO |  | ISO 3166-1 alpha-2. Copied from observation at link time for geographic aggregation. |
| admin_level_1 | VARCHAR(128) | YES | NULL | Copied from observation at link time |
| facility_level | VARCHAR(32) | YES | NULL | Copied from observation at link time |
| condition_category | VARCHAR(64) | YES | NULL | Copied from observation at link time |
| observation_period | VARCHAR(7) | NO |  | EAT calendar month: YYYY-MM. Derived from observation timestamp at link time. |
| linked_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) | When this observation was linked to this pattern |
| linked_by | VARCHAR(36) | NO |  | userId or "system" |
| taxonomy_version_at_link | VARCHAR(16) | NO |  | Schema version active when the link was made |

### 2.6  kb_content_versions

Every ResusGPS pathway update, micro-course content change, Care Signal recommendation rule change, or Fellowship curriculum update that is motivated by Knowledge Base findings must be recorded here. This is the mechanism that makes the Adaptive Learning System traceable: which version of the guidance was associated with which outcomes.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | VARCHAR(36) | NO | uuid() | Primary key |
| content_type | ENUM | NO |  | RESUSGPS_PATHWAY \| MICROCOURSE_CONTENT \| CARE_SIGNAL_RULE \| FELLOWSHIP_CURRICULUM \| ERS_STANDARD \| OTHER |
| content_identifier | VARCHAR(255) | NO |  | Machine-readable identifier: e.g. "resusgps/septic-shock/v3.2" or "microcourse/septic-shock-1/v2.1" |
| content_version | VARCHAR(32) | NO |  | Semantic version string: "3.2.0". Incremented at every content change. |
| change_description | TEXT | NO |  | Human-readable description of what changed and why |
| source_pattern_ids | JSON | YES | NULL | Array of kb_patterns.id values that motivated this change. Null if change was motivated by external guideline. |
| source_recommendation_ids | JSON | YES | NULL | Array of kb_recommendations.id values that motivated this change |
| external_guideline_reference | TEXT | YES | NULL | Citation if change was motivated by WHO/AHA/other guideline update |
| knowledge_stewardship_approved_by | VARCHAR(36) | NO |  | userId of Knowledge Stewardship approver |
| knowledge_stewardship_approved_at | DATETIME(3) | NO |  | Timestamp of approval. No content version is deployed without this. |
| deployed_at | DATETIME(3) | YES | NULL | When this version went live in production. Null if not yet deployed. |
| deprecated_at | DATETIME(3) | YES | NULL | When this version was superseded. Null if current. |
| deprecated_by_version_id | VARCHAR(36) | YES | NULL | FK → kb_content_versions.id of the version that superseded this one |
| created_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) |  |

# SECTION 3: ACTION TABLES

Action tables track the pipeline from confirmed knowledge to real-world change. Without these tables, the Adaptive Learning System cannot evaluate whether its own recommendations work.

### 3.1  kb_recommendations

A recommendation is a system-generated or expert-generated suggestion derived from a confirmed pattern. It is Analytical Truth that has been approved for communication to institutions or providers. It is not yet an Intervention (what an institution commits to do) or an Implementation (what actually happened).

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | VARCHAR(36) | NO | uuid() | Primary key |
| source_pattern_id | VARCHAR(36) | NO |  | FK → kb_patterns.id. The pattern this recommendation addresses. |
| recommendation_code | VARCHAR(64) | NO |  | Stable machine-readable code |
| recommendation_type | ENUM | NO |  | TRAINING \| PROCUREMENT \| PROTOCOL \| STAFFING \| RESUSGPS_UPDATE \| CURRICULUM_UPDATE \| CARE_SIGNAL_RULE \| INSTITUTIONAL_PROCESS \| OTHER |
| recommendation_text | TEXT | NO |  | Clear, actionable statement: "Introduce a nurse-led sepsis checklist at the point of triage for all febrile children under 5 presenting with altered activity" |
| target_audience | ENUM | NO |  | INDIVIDUAL_PROVIDER \| FACILITY \| NETWORK \| MINISTRY \| CURRICULUM_TEAM \| RESUSGPS_TEAM |
| confidence_level_at_generation | VARCHAR(64) | NO |  | Confidence level of source pattern at time recommendation was generated |
| evidence_basis | JSON | NO |  | JSON: {observational_count: n, experimental_references: [], expert_references: [], adaptive_evidence: []} |
| governance_status | ENUM | NO | PENDING | PENDING \| APPROVED \| REJECTED \| SUPERSEDED |
| governance_approved_by | VARCHAR(36) | YES | NULL | userId of Knowledge Stewardship approver. Null until approved. |
| governance_approved_at | DATETIME(3) | YES | NULL | Null until approved. |
| governance_notes | TEXT | YES | NULL | Reasoning for approval, rejection, or supersession |
| superseded_by_id | VARCHAR(36) | YES | NULL | FK → kb_recommendations.id if superseded |
| valid_from | DATETIME(3) | YES | NULL | When this recommendation became active. Set at governance approval. |
| valid_until | DATETIME(3) | YES | NULL | When this recommendation expired or was superseded. Null if current. |
| created_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) |  |
| created_by | VARCHAR(36) | NO |  | userId or "system" |

### 3.2  kb_interventions

An intervention is a structured commitment by a specific facility or network to act on a recommendation. It exists conceptually: what was decided, by whom, with what scope, and with what outcome measure. Not what actually happened — that is the Implementation.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | VARCHAR(36) | NO | uuid() | Primary key |
| recommendation_id | VARCHAR(36) | NO |  | FK → kb_recommendations.id |
| committing_entity_type | ENUM | NO |  | FACILITY \| NETWORK \| MINISTRY \| TRAINING_INSTITUTION \| OTHER |
| committing_entity_id | VARCHAR(36) | NO |  | facility_id (UUID) or other entity identifier. Never a facility name. |
| intervention_scope | ENUM | NO |  | ED_ONLY \| WARD \| HOSPITAL_WIDE \| NETWORK \| NATIONAL |
| intervention_description | TEXT | NO |  | What specifically will be done: "Introduce IO drill as monthly ward competency check for all nurses" |
| planned_implementation_date | DATE | YES | NULL | Target date for implementation to begin |
| defined_outcome_measure | TEXT | NO |  | How improvement will be measured: "Time from recognition to IO access in resuscitation scenarios, measured via Care Signal reports" |
| evaluation_window_months | TINYINT | NO | 6 | How many months after implementation before outcome is evaluated |
| intervention_status | ENUM | NO | PLANNED | PLANNED \| IN_PROGRESS \| COMPLETED \| ABANDONED |
| status_updated_at | DATETIME(3) | YES | NULL | When status last changed |
| abandonment_reason | TEXT | YES | NULL | Why the intervention was abandoned. Null if not abandoned. |
| created_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) |  |
| created_by | VARCHAR(36) | NO |  | userId who committed the intervention |
| updated_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) | ON UPDATE CURRENT_TIMESTAMP(3) |

### 3.3  kb_implementations

An implementation is what actually happened when an intervention was executed. This is the most important table in the action layer because it closes the feedback loop: without implementation records, the Learning System cannot distinguish "the intervention did not work" from "the intervention was never done."

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | VARCHAR(36) | NO | uuid() | Primary key |
| intervention_id | VARCHAR(36) | NO |  | FK → kb_interventions.id |
| actual_implementation_date | DATE | YES | NULL | When implementation actually began. May differ from planned. |
| actual_scope | ENUM | YES | NULL | What scope was actually implemented. May differ from planned. |
| modifications_from_plan | TEXT | YES | NULL | Free text: how the implementation differed from the intervention plan |
| implementation_fidelity | ENUM | YES | NULL | HIGH \| PARTIAL \| LOW \| NOT_IMPLEMENTED |
| outcome_label | ENUM | YES | NULL | IMPROVED \| NO_IMPROVEMENT \| WORSENED \| EVALUATION_PENDING |
| outcome_evidence_notes | TEXT | YES | NULL | What evidence supports the outcome label: Care Signal trend data, clinical audit results, etc. |
| outcome_observation_ids | JSON | YES | NULL | Array of observation IDs (from operational tables) that provide evidence for the outcome label |
| outcome_recorded_at | DATETIME(3) | YES | NULL | When the outcome label was assigned |
| outcome_recorded_by | VARCHAR(36) | YES | NULL | userId who assigned the outcome label |
| confidence_impact_applied | BOOLEAN | NO | 0 | Whether the outcome has been applied to the source pattern's confidence_dimensions. Prevents double-counting. |
| created_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) |  |
| created_by | VARCHAR(36) | NO |  | userId who created this implementation record |
| updated_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) | ON UPDATE CURRENT_TIMESTAMP(3) |

***The outcome_label field is never auto-populated by the system. It requires a human reviewer — a Knowledge Stewardship decision — to assign the label based on evidence. Automated systems may flag an implementation as ready for review but may never assign the label. This is a governance protection, not an engineering limitation.***

# SECTION 4: GOVERNANCE AND AUDIT TABLES

### 4.1  kb_review_schedule

Every active pattern has a mandatory review date. This table drives the automated review scheduling system: the application queries this table to identify patterns due for review and creates Knowledge Stewardship tasks. Reviews do not depend on human memory.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | VARCHAR(36) | NO | uuid() | Primary key |
| pattern_id | VARCHAR(36) | NO |  | FK → kb_patterns.id |
| review_due_at | DATETIME(3) | NO |  | When this review is due. Auto-set by application. |
| review_type | ENUM | NO |  | SCHEDULED \| TRIGGERED_BY_NEW_EVIDENCE \| TRIGGERED_BY_CONCEPT_DRIFT \| MANUAL |
| review_status | ENUM | NO | PENDING | PENDING \| IN_PROGRESS \| COMPLETED \| DEFERRED |
| reviewed_at | DATETIME(3) | YES | NULL | When review was completed |
| reviewed_by | VARCHAR(36) | YES | NULL | userId of reviewer |
| review_outcome | ENUM | YES | NULL | CONFIDENCE_MAINTAINED \| CONFIDENCE_UPGRADED \| CONFIDENCE_DOWNGRADED \| PATTERN_RETIRED \| PATTERN_SPLIT \| DEFERRED_TO_NEXT_CYCLE |
| review_notes | TEXT | YES | NULL | What was considered and why the outcome was chosen |
| next_review_due_at | DATETIME(3) | YES | NULL | Scheduled next review date, set at completion of this review |
| created_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) |  |

### 4.2  kb_governance_audit

A complete audit trail of all governance decisions in the FPKB. Every confidence change, every approval or rejection of a recommendation, every pattern retirement, every Knowledge Stewardship action is logged here. This table is append-only. No row is ever updated or deleted.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | VARCHAR(36) | NO | uuid() | Primary key |
| actor_user_id | VARCHAR(36) | NO |  | userId of person who took the action. "system" for automated actions. |
| action_type | ENUM | NO |  | PATTERN_CREATED \| PATTERN_CONFIDENCE_CHANGED \| PATTERN_RETIRED \| PATTERN_REINSTATED \| RECOMMENDATION_APPROVED \| RECOMMENDATION_REJECTED \| RECOMMENDATION_SUPERSEDED \| CONTENT_VERSION_APPROVED \| CONTENT_VERSION_DEPLOYED \| IMPLEMENTATION_OUTCOME_LABELLED \| REVIEW_COMPLETED \| OTHER |
| entity_type | ENUM | NO |  | PATTERN \| FAILURE_MODE \| SUCCESS_FACTOR \| RECOMMENDATION \| INTERVENTION \| IMPLEMENTATION \| CONTENT_VERSION \| REVIEW |
| entity_id | VARCHAR(36) | NO |  | ID of the affected entity |
| previous_state | JSON | YES | NULL | Serialised relevant fields before the action. Null for creation actions. |
| new_state | JSON | YES | NULL | Serialised relevant fields after the action. Null for deletion actions. |
| reasoning | TEXT | YES | NULL | Why this action was taken |
| created_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) | Immutable. Never updated. |

*This table is append-only. No UPDATE or DELETE permissions are granted to any application role on kb_governance_audit. The application may only INSERT. This is enforced at the database permission level, not only at the application layer.*

### 4.3  kb_evidence_links

Links patterns to external evidence sources (published guidelines, research papers, WHO recommendations). Enables the four-evidence-source model from the Observation Architecture v1.1 Section 7.2: Observational, Experimental, Expert, and Adaptive evidence are all trackable.

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | VARCHAR(36) | NO | uuid() | Primary key |
| pattern_id | VARCHAR(36) | NO |  | FK → kb_patterns.id |
| evidence_source_type | ENUM | NO |  | OBSERVATIONAL \| EXPERIMENTAL \| EXPERT \| ADAPTIVE |
| evidence_description | TEXT | NO |  | What the evidence says and how it supports or challenges the pattern |
| evidence_direction | ENUM | NO |  | SUPPORTS \| CHALLENGES \| NEUTRAL \| SUPERSEDES |
| citation | TEXT | YES | NULL | Full citation for external evidence. Null for observational/adaptive (referenced via pattern_observations). |
| guideline_body | VARCHAR(255) | YES | NULL | e.g. "WHO", "AHA", "ISPAD". Null if not a guideline. |
| guideline_year | SMALLINT | YES | NULL | Year of guideline publication |
| lmic_applicability | ENUM | YES | NULL | HIGH \| MODERATE \| LOW \| NOT_ASSESSED. Whether this evidence was generated in or is applicable to LMIC settings. |
| added_at | DATETIME(3) | NO | CURRENT_TIMESTAMP(3) |  |
| added_by | VARCHAR(36) | NO |  | userId |

# SECTION 5: INDEXES, CONSTRAINTS, AND MIGRATIONS

### 5.1  Required Indexes

The following indexes are required for the analytics queries that drive the Learning System. Without them, pattern detection queries across large observation sets will be unacceptably slow.

```sql
-- kb_patterns
CREATE INDEX idx_kbp_status ON kb_patterns(knowledge_status);
CREATE INDEX idx_kbp_track ON kb_patterns(pattern_track);
CREATE INDEX idx_kbp_domain ON kb_patterns(primary_domain);
CREATE INDEX idx_kbp_confidence ON kb_patterns(confidence_level);
CREATE INDEX idx_kbp_review_due ON kb_patterns(review_due_at);

-- kb_pattern_observations
CREATE INDEX idx_kbpo_pattern ON kb_pattern_observations(pattern_id);
CREATE INDEX idx_kbpo_source ON kb_pattern_observations(observation_source, observation_id);
CREATE INDEX idx_kbpo_period ON kb_pattern_observations(observation_period);
CREATE INDEX idx_kbpo_country ON kb_pattern_observations(country);
CREATE INDEX idx_kbpo_condition ON kb_pattern_observations(condition_category);

-- kb_implementations
CREATE INDEX idx_kbi_intervention ON kb_implementations(intervention_id);
CREATE INDEX idx_kbi_outcome ON kb_implementations(outcome_label);
CREATE INDEX idx_kbi_fidelity ON kb_implementations(implementation_fidelity);

-- kb_review_schedule
CREATE INDEX idx_kbrs_due ON kb_review_schedule(review_due_at, review_status);

-- kb_governance_audit
CREATE INDEX idx_kbga_entity ON kb_governance_audit(entity_type, entity_id);
CREATE INDEX idx_kbga_actor ON kb_governance_audit(actor_user_id);
CREATE INDEX idx_kbga_created ON kb_governance_audit(created_at);
```

### 5.2  Key Constraints

-- Pattern modes must match pattern track
```sql
CHECK (mode_track = (SELECT pattern_track FROM kb_patterns WHERE id = pattern_id))
-- (enforced at application layer in Drizzle; MySQL CHECK is not reliable cross-version)

-- Unique observation links (one observation cannot be linked to the same pattern twice)
UNIQUE KEY uq_kbpo_pattern_obs (pattern_id, observation_source, observation_id)

-- Unique content identifiers per content type
UNIQUE KEY uq_kbcv_identifier_version (content_type, content_identifier, content_version)

-- Unique pattern codes
UNIQUE KEY uq_kbp_code (pattern_code)

-- Unique failure mode codes
UNIQUE KEY uq_kbfm_code (failure_mode_code)

-- Unique success factor codes
UNIQUE KEY uq_kbsf_code (success_factor_code)
```

### 5.3  Migration Sequencing

The FPKB schema must be introduced as a set of Drizzle migrations. The following sequencing is required to respect foreign key dependencies:

- Migration A: Create kb_failure_modes and kb_success_factors (no FK dependencies)
- Migration B: Create kb_patterns (no FK dependencies on other KB tables)
- Migration C: Create kb_pattern_modes (FK to kb_patterns, kb_failure_modes, kb_success_factors)
- Migration D: Create kb_pattern_observations (FK to kb_patterns; observation FKs are soft references to operational tables — not enforced by DB FK constraint to allow cross-schema flexibility)
- Migration E: Create kb_evidence_links (FK to kb_patterns)
- Migration F: Create kb_recommendations (FK to kb_patterns)
- Migration G: Create kb_interventions (FK to kb_recommendations)
- Migration H: Create kb_implementations (FK to kb_interventions)
- Migration I: Create kb_review_schedule (FK to kb_patterns)
- Migration J: Create kb_content_versions (no FK to KB tables; source_pattern_ids stored as JSON array)
- Migration K: Create kb_governance_audit (no FK dependencies — append-only)
- Migration L: Create all indexes

***kb_pattern_observations.observation_id is NOT a database foreign key into the operational tables. It is an application-level soft reference. This is intentional: it allows observations from different tables (careSignalEvents, parentSafeTruthSubmissions, etc.) to be linked to patterns without a shared observation table. The application is responsible for validating that the observation_id exists in the specified observation_table before creating the link.***

# SECTION 6: INITIAL TAXONOMY SEED DATA

The FPKB is empty at migration time. Before pattern detection can begin, the failure mode and success factor taxonomies must be seeded. This section defines the initial seed data for v1.0 of the taxonomy.

### 6.1  Failure Mode Seed Data (v1.0 taxonomy)

The following failure modes constitute the v1.0 taxonomy. All carry taxonomy_version = "1.0". Additional modes will be added as the Knowledge Base matures.

| failure_mode_code | failure_mode_name (domain) |
|---|---|
| RECOG_SHOCK_DELAYED | Shock not recognised despite tachycardia and prolonged CRT (RECOGNITION) |
| RECOG_FEEDING_DIFFICULTY | Feeding difficulty not recognised as emergency indicator (RECOGNITION) |
| RECOG_DANGER_SIGNS_MISSED | WHO danger signs present but not acted upon (RECOGNITION) |
| RECOG_RESP_SEVERITY | Respiratory distress severity not graded correctly (RECOGNITION) |
| RECOG_DECOMPENSATION | Decompensation from compensated state not recognised in time (RECOGNITION) |
| ESCL_SENIOR_DELAY | Delay in calling for senior review despite threshold criteria (ESCALATION) |
| ESCL_NO_PROTOCOL | Escalation pathway not known or not followed (ESCALATION) |
| ESCL_INOTROPE_DELAY | Inotropic support escalation delayed beyond clinical threshold (ESCALATION) |
| ACCESS_IO_NOT_ATTEMPTED | IO access not attempted despite failed peripheral access (VASCULAR_ACCESS) |
| ACCESS_PERIPHERAL_DELAY | Delay in establishing peripheral IV in deteriorating child (VASCULAR_ACCESS) |
| TREAT_ANTIBIOTIC_DELAY | Antibiotic not administered within target time of sepsis recognition (TREATMENT) |
| TREAT_DOSE_ERROR | Wrong weight-based dose calculated or administered (TREATMENT) |
| TREAT_BOLUS_NOT_REASSESSED | Fluid bolus not reassessed after administration (TREATMENT) |
| TREAT_ORS_OMITTED | ORS not administered in dehydration management (TREATMENT) |
| TREAT_ZINC_OMITTED | Zinc not administered in diarrhoea management (TREATMENT) |
| TREAT_OXYGEN_NOT_GIVEN | Oxygen not administered despite availability and clinical indication (TREATMENT) |
| REFER_DECISION_DELAY | Transfer decision delayed beyond clinical threshold (REFERRAL) |
| REFER_UNSTABILISED | Transfer initiated without adequate stabilisation (REFERRAL) |
| REFER_NO_NOTIFICATION | Receiving facility not notified before transfer (REFERRAL) |
| MON_NO_REPEAT_VITALS | Vital signs not repeated after intervention (MONITORING) |
| MON_DETERIORATION_MISSED | Deterioration not detected between observations (MONITORING) |
| COMM_CLOSED_LOOP_FAILURE | Closed-loop communication failure during resuscitation (COMMUNICATION) |
| COMM_HANDOVER_LOSS | Handover information lost or incomplete (COMMUNICATION) |
| COMM_FAMILY_NOT_INFORMED | Family not informed of deterioration (COMMUNICATION) |
| RES_OXYGEN_UNAVAILABLE | Oxygen not available or not functioning (RESOURCE_AVAILABILITY) |
| RES_WRONG_SIZE_EQUIPMENT | Equipment wrong size for paediatric patient (RESOURCE_AVAILABILITY) |
| RES_DRUG_STOCKOUT | Essential drug out of stock (RESOURCE_AVAILABILITY) |
| RES_IO_KIT_UNAVAILABLE | IO needle or kit not available when needed (RESOURCE_AVAILABILITY) |

### 6.2  Success Factor Seed Data (v1.0 taxonomy)

Initial success factors seeded from validated practices identified in the literature and early platform observations. Confidence levels for success patterns built on these factors will be CANDIDATE_SUCCESS until additional observations confirm them.

| success_factor_code | success_factor_name (domain) |
|---|---|
| RECOG_NURSE_SEPSIS_CHECKLIST | Nurse-led sepsis checklist initiated at triage for all febrile children under 5 (RECOGNITION) |
| RECOG_STRUCTURED_TRIAGE | Structured paediatric triage tool used at point of first contact (RECOGNITION) |
| ACCESS_IO_KIT_AT_TRIAGE | IO kit stored at triage enabling access without delay (VASCULAR_ACCESS) |
| ACCESS_IO_DRILL_MONTHLY | Monthly IO drill reduced mean access time in resuscitation scenarios (VASCULAR_ACCESS) |
| TREAT_WEIGHT_CHART_BEDSIDE | Weight-based dosing chart at bedside eliminated calculation errors (TREATMENT) |
| TREAT_ANTIBIOTIC_BUNDLE | Antibiotic bundle protocol reduced time-to-antibiotic in sepsis (TREATMENT) |
| REFER_NOTIFICATION_PROTOCOL | Structured receiving facility notification protocol reduced handover gaps (REFERRAL) |
| MON_OBSERVATION_CHART_REDESIGN | Observation chart redesign prompted reassessment at 15-minute intervals (MONITORING) |
| COMM_SBAR_HANDOVER | SBAR handover structure reduced information loss at shift change (COMMUNICATION) |
| ESCL_STRUCTURED_ESCALATION | Nurse-initiated structured escalation pathway reduced time-to-senior from 45 to 8 minutes (ESCALATION) |

# SECTION 7: APPLICATION LAYER REQUIREMENTS

The schema alone does not constitute the Knowledge Base. The following application-layer behaviours are required for the schema to function as a learning system.

### 7.1  Pattern Confidence Update Rules

When a new observation is linked to a pattern via kb_pattern_observations, the application must:

- Increment supporting_observation_count on kb_patterns
- Update last_confirmed_at to the observation timestamp
- Re-evaluate confidence_level against the threshold ladder (Section 6.6 of Observation Architecture v1.1)
- If confidence_level changes, insert a row into kb_governance_audit with action_type = PATTERN_CONFIDENCE_CHANGED
- Recalculate review_due_at: 12 months from last_confirmed_at for CONFIRMED/ESTABLISHED; 6 months for SIGNAL/CANDIDATE
- Update trend_direction if sufficient temporal data exists (minimum 3 observation_periods required)

### 7.2  Concept Drift Automated Downgrade

A scheduled job (daily, running at 01:00 EAT) must:

- Query kb_review_schedule for all rows where review_due_at < NOW() AND review_status = PENDING
- For each overdue review: create a task for Knowledge Stewardship and set review_status = IN_PROGRESS
- For each pattern where last_confirmed_at is more than review_due_at: check whether the pattern's confidence_level should be downgraded automatically
- Automated downgrade rules: ESTABLISHED → CONFIRMED after 18 months without new observations; CONFIRMED → CANDIDATE after 24 months; CANDIDATE → SIGNAL after 12 months; SIGNAL → knowledge_status = UNDER_REVIEW after 6 months. Log all automated downgrades in kb_governance_audit with actor_user_id = "system".

### 7.3  Implementation Outcome Feedback

When an implementation outcome_label is assigned:

- If outcome_label = IMPROVED and confidence_impact_applied = false: increment confidence_dimensions.platform_replication for the source pattern; set confidence_impact_applied = true; insert into kb_governance_audit
- If outcome_label = WORSENED and confidence_impact_applied = false: create an urgent Knowledge Stewardship review task; suspend the source recommendation (governance_status = PENDING re-review); set confidence_impact_applied = true; insert into kb_governance_audit
- If outcome_label = NO_IMPROVEMENT: increment a no_improvement_count on the recommendation. After three implementations with NO_IMPROVEMENT, create a Knowledge Stewardship review task for the source pattern.
- Do not allow the application to auto-assign outcome_label. The field requires a human reviewer.

### 7.4  Knowledge Stewardship API Requirements

A Knowledge Stewardship interface must be built in the admin surface providing:

- Pattern review queue: all kb_review_schedule rows with status = IN_PROGRESS or PENDING, ordered by review_due_at
- Recommendation approval queue: all kb_recommendations with governance_status = PENDING
- Implementation outcome queue: all kb_implementations with outcome_label = NULL and intervention completion date past evaluation_window_months
- Content version approval queue: all kb_content_versions with knowledge_stewardship_approved_at = NULL
- Pattern confidence history: for any pattern, the full kb_governance_audit trail filtered by entity_type = PATTERN and entity_id = :pattern_id
- Audit export: ability to export kb_governance_audit rows for any date range as CSV for external review

## Document Classification and Review

*This document is the canonical engineering specification for the Failure Pattern Knowledge Base. It implements Observation Architecture v1.1 Sections 6, 7, and 9. Any conflict between this document and the PSoT on schema decisions is resolved by updating the PSoT to reference this document as authoritative for the knowledge_base schema. Review triggers: new failure mode or success factor taxonomy additions; changes to confidence thresholds; new content_type values; new action_type values in governance audit; schema migration applied to production. All changes must be versioned and logged in WORK_STATUS.md.*
