**PAEDS RESUS LIMITED**

*AHA Aligned Training Site — ID: TS70875*

**THE NORTH STAR DOCUMENT**

*Version 2.0 — June 2026*

*A Comprehensive Foundation for Everyone Who Builds, Joins, or Partners With Paeds Resus*

Classification: Internal — Platform Source of Truth

*Supersedes: North Star Document v1.0*

*Read alongside: Observation Architecture v1.1, Platform Source of Truth (PSoT)*

***Children continue to die from problems that humanity already knows how to solve. The greatest opportunity in global child health is no longer discovering what works, but ensuring that what works actually happens — and that when it does not happen, the system learns why.***

*v2.0 adds to v1.0: the Adaptive Learning System framing; the aviation safety institutional identity; the three types of truth; the four-business model; positive deviance in the theory of change; the peer-learning model; the account model (Individual Actor and Organisation Actor); Safe-Truth no-login principle; the constitutional revenue principle; Knowledge Stewardship as a named commitment; honest holistic loop implementation status; concept drift as a named risk; updated ten-year test; updated Book of the Unforgotten.*

## EXECUTIVE SUMMARY — READ THIS FIRST

**If you read nothing else in this document, read this section. It is written to be impossible to compress further without losing accuracy.**

**The core claim:** Children mostly die from preventable causes not because the right treatment is unknown, but because it doesn't reach them in time, in the right sequence. This is an execution problem, not a knowledge problem — the "know-do gap." Paeds Resus exists to close that gap.

**What Paeds Resus is — and is not:** Paeds Resus is **not** a training company that happens to offer extra tools. It is an **Adaptive Learning System**. Every product — ResusGPS (bedside guidance), Education (courses, Fellowship), Care Signal (provider QI reporting), Safe-Truth (caregiver experience), Hospital ERS (institutional readiness) — exists to feed and be improved by one closed learning loop. The institutional identity is closest to **aviation safety**: every near-miss reported makes the whole system safer for the next provider, not just the one who reported it.

**The constitutional hierarchy (binding):** Three documents govern the platform, each answering a different question, with explicit conflict-resolution rules:
- **This document (North Star)** — *Why* does Paeds Resus exist?
- **Observation Architecture v1.1** — *How* does Paeds Resus learn?
- **Platform Source of Truth (PSoT)** — *What* does Paeds Resus build, and how, technically?

**What changed in v2.0 (five things that matter most):**

1. The platform is explicitly named an Adaptive Learning System, not a Learning Engine — it changes its own behaviour (ResusGPS pathways, curriculum) based on confirmed evidence, not just detects patterns.
2. The theory of change is now bidirectional — it identifies and spreads success patterns (positive deviance), not only eliminates failure patterns.
3. The constitutional revenue principle is now explicit and binding: individual provider access to Care Signal, ResusGPS, and core courses is never gated by ability to pay, in any setting, ever.
4. The holistic loop's implementation status is stated honestly — most of it is not yet built. Stages 3–6 (personal feedback, learning links, institutional action, system intelligence) are explicitly named as the current engineering priority, not claimed as complete.
5. Knowledge Stewardship is established as a named governance role: no ResusGPS, curriculum, or Care Signal recommendation change ships without its sign-off.

**Common misreading to avoid:** "Providers get everything free; institutions pay for everything" is **not** what this document says. Individual providers still pay for Fellowship enrolment and most AHA certifications (Education, Business 1 — the near-term cash engine). The constitutional revenue principle protects only Care Signal, ResusGPS, and core course access from paywalling. The institutional/intelligence revenue model (Business 3) is explicitly a 3–5 year horizon, not the platform's current sustainability mechanism. See Part VI and the Financial Strategy v1.0 document for the precise, sequenced model — Education funds Quality Improvement funds Learning Network, in that order, not all four at once.

**What this document does not do:** It does not specify database schemas (see Observation Architecture v1.1 and FPKB Schema v1.0), and it does not override binding technical decisions in the PSoT.

# THE CONSTITUTIONAL HIERARCHY

Paeds Resus is governed by three constitutional documents. Each answers a different question. No document overrides another in its own domain.

| Document | Question it answers |
|---|---|
| North Star Document (this document) | Why does Paeds Resus exist? What is the problem, the mission, the theory of change, and the institutional identity? |
| Observation Architecture v1.1 | How does Paeds Resus learn? How are observations collected, how do they become knowledge, and how does knowledge change practice? |
| Platform Source of Truth (PSoT) | What does Paeds Resus build, for whom, and how? Binding technical and product decisions. |

Conflicts between documents are resolved as follows: technical implementation questions are resolved by the PSoT; strategic direction questions are resolved by updating this document after leadership review; data architecture and learning governance questions are resolved by the Observation Architecture v1.1.

# PART I: THE PROBLEM WE EXIST TO SOLVE

### 1.1  The Prevailing Narrative Is Incomplete

The standard story told about child mortality in low- and middle-income countries is one of absence: absent technology, absent specialists, absent infrastructure, absent research. That story is not false. But it is dangerously incomplete.

A large and largely uncounted proportion of preventable child deaths occur not because the solution does not exist, but because a known, affordable, and available solution failed to reach the child in the correct way, at the correct time, in the correct sequence. The oxygen was present but not administered. The antibiotic was on the shelf but not prescribed promptly. The signs of shock were visible six hours before death but were not recognised as shock.

This is not a knowledge problem. It is an execution problem. The global health system has historically invested heavily in generating knowledge while dramatically underinvesting in understanding why that knowledge fails to become action.

### 1.2  The Evidence

The 2022 Kenya Demographic and Health Survey found that only approximately 27% of children with diarrhoea received the complete recommended package: oral rehydration solution, zinc, and continued feeding. The scientific solution has existed for decades. The implementation system does not consistently deliver it. This pattern repeats across sepsis, respiratory distress, severe malnutrition, and neonatal emergencies.

### 1.3  Children Rarely Die Because Nobody Knew What To Do

More commonly, children die because:

- Deterioration was not recognised early enough
- Escalation was delayed or did not occur
- The sequence of interventions was incorrect
- Simple treatments were omitted or given too late
- Teams lacked confidence to act without explicit instruction
- Knowledge held by individuals failed to translate into team action
- The same failure had occurred before and the system had not learned from it

### Septic Shock

The barrier is usually not lack of access to vasopressors. The barrier is failure to recognise shock, failure to establish IV access promptly, failure to administer antibiotics within the hour, and failure to escalate deterioration. The child dies upstream. The advanced intervention that might have helped becomes irrelevant.

### Severe Dehydration

The barrier is not a missing breakthrough therapy. The barrier is failure to deliver ORS, zinc, and continued feeding. Three interventions. All available. All known. All too frequently omitted.

### Respiratory Distress

The barrier is often not the absence of ventilators. The barrier is failure to identify severity early, failure to administer oxygen, failure to give bronchodilators and steroids, and failure to escalate when necessary.

### 1.4  The Know-Do Gap

***The know-do gap is the space between clinical knowledge and clinical action. Paeds Resus exists to close that gap — systematically, measurably, and at scale. Not by generating more knowledge. By ensuring the knowledge humanity already has reaches the child who needs it.***

### 1.5  The Structural Constraint vs Execution Failure Distinction

| Category | Description and Paeds Resus response |
|---|---|
| Structural Constraint | The oxygen cylinder is empty. The antibiotic is not stocked. There is one nurse for forty patients. These are resource failures. Paeds Resus does not pretend to solve them through software or training alone. We contribute by identifying them through Care Signal and Safe-Truth data, and by building institutional partnerships that advocate for the right minimum resource bundle. |
| Execution Failure | The oxygen cylinder is present and not administered. The antibiotic is stocked and not prescribed within the hour. Recognition was delayed despite adequate staffing. These are execution failures. This is where Paeds Resus's direct impact lies: structured guidance, competency development, feedback loops, and institutional learning systems. |

Paeds Resus does not assume execution is always the problem — that assumption would be its own form of bias. The platform is designed to discover the relative contribution of each failure mode in each setting. Care Signal and Safe-Truth exist precisely to make that discovery possible, and to challenge the platform's own assumptions when the evidence demands it.

# PART II: WHAT PAEDS RESUS IS

### 2.1  The Mission

***Contribute to a world where no child dies a preventable death, by building a sustainable, scalable organisation that improves paediatric resuscitation and emergency care in resource-limited settings.***

- No child dies a preventable death — this is the ultimate destination, not a claim about current capability. Paeds Resus does not claim to have achieved it. It commits to working toward it.
- Sustainable and scalable organisation — financial sustainability is not a distraction from mission. It is the precondition for mission at the scale of the problem.
- Improve paediatric resuscitation and emergency care — the specific domain. Not all child health. Not adult care. Emergency care is where the execution gap is most acute, most visible, and most amenable to structured intervention.

### 2.2  The Institutional Identity: Aviation Safety

The closest institutional analogue to what Paeds Resus is building is not a training company, a health technology startup, or an NGO. It is aviation safety.

Every incident, every near-miss, and every accident in aviation feeds a learning system. Pilots report because the system becomes safer for everyone. Manufacturers learn. Airlines learn. Regulators learn. Passengers benefit. Nobody thinks the incident database is the product. The safer aviation system is the product.

That is exactly what Paeds Resus aspires to build for paediatric emergency care. Providers report because the system becomes better for the next child. The Failure Pattern Knowledge Base is not the product. Fewer children dying from the same preventable failures is the product.

The aviation analogy also explains the reporting culture Paeds Resus must cultivate: mandatory near-miss reporting in aviation works because institutional amnesty is guaranteed and the learning goes to everyone simultaneously. No operator benefits from concealing a near-miss. Care Signal is structurally equivalent: anonymity is protected, the learning is shared across all participating facilities, and no facility benefits from suppressing a failure pattern.

### 2.3  The One-Sentence Definition

Paeds Resus is a paediatric survival infrastructure platform and Adaptive Learning System — a system of interconnected tools, training pathways, feedback loops, and institutional partnerships designed to convert existing clinical knowledge into reliable life-saving action, and to continuously improve that conversion based on what it learns from real clinical events.

It is not a training company, though it trains. It is not a certification provider, though it certifies. It is not an app company, though it builds software. Anyone who reduces Paeds Resus to any of these descriptions has misunderstood the architecture.

### 2.4  What Paeds Resus Is Not

| It is often called... | Why that is incomplete |
|---|---|
| A training company | Training is one layer. Without bedside guidance, feedback loops, and institutional systems, training produces informed providers who revert to previous behaviour under stress. |
| A certification provider | A certificate that does not change behaviour at the bedside is a placebo therapy. The goal is changed behaviour, not the certificate. |
| A BLS/ACLS platform | BLS and ACLS are two of the foundation certifications. The platform's scope includes all five intervention layers. Reducing it to certification misses the architecture. |
| A health tech startup | Technology is the delivery mechanism. The mission is child survival. Technology that does not reduce preventable death or harm is not mission-aligned, regardless of its sophistication. |
| An NGO | Paeds Resus is a commercial entity with a mission. Financial sustainability is not compromise; it is the mechanism by which the mission scales. Charity models cannot reach the scale of the problem. |
| A Learning Engine | The platform does not merely learn. It changes itself based on what it learns. ResusGPS pathways, curriculum content, and Care Signal recommendation rules are all updated by confirmed knowledge. That is an Adaptive Learning System, not a Learning Engine. |

# PART III: THE THEORY OF CHANGE

### 3.1  Why Single Interventions Fail

Decades of single-intervention programmes — equipment donations, training days, guideline distributions, app installations — have produced measurable impact in controlled settings and disappointingly limited impact at population scale. The reason is systems failure. A clinician who has been trained but receives no support at the bedside reverts to previous behaviour under stress. A facility that has equipment but no workflow for using it produces no improvement. A team that has protocols but no feedback mechanism repeats the same failures. Each intervention in isolation becomes what Paeds Resus calls a placebo therapy: present in the system, absent in its impact.

### 3.2  The Five Intervention Layers

| Layer | What goes wrong without it / What Paeds Resus contributes |
|---|---|
| Point-of-Care Guidance (ResusGPS) | Without it: providers know the algorithm in class and lose the sequence under stress at 3am. With it: structured prompts, correct ordering, real-time dosing support, and explicit reassessment rhythms that survive the cognitive narrowing of a real emergency. |
| Competency Development (Courses + Fellowship) | Without it: knowledge is held informally, varies by individual, and degrades. With it: structured certification pathways (BLS, ACLS, PALS, NRP, Heartsaver), condition-specific micro-courses, and the Paeds Resus Fellowship — a 24-month discipline that makes reflective practice a professional habit. |
| Feedback Loops (Care Signal) | Without it: the same failures repeat. The nurse who missed shock last Tuesday will miss it again next month unless the system learns. With it: structured incident reporting, gap analysis, actionable recommendations, and aggregated intelligence that changes training priorities and procurement decisions. |
| Community Voice (Safe-Truth) | Without it: the clinical picture of a child's death is incomplete. Families see what clinicians do not: the facility that turned them away, the two-day delay before seeking care, the advice that reassured when it should have alarmed. With it: the full journey becomes visible, and the earliest recoverable moment in each death can be identified. |
| Institutional Systems (Hospital ERS) | Without it: individual competence is swallowed by system dysfunction. A trained nurse cannot override a workflow that delays triage pending payment. With it: Emergency Readiness Systems that embed ResusGPS, Care Signal, and training into hospital workflow — changing the system, not just the individual. |

### 3.3  New in v2.0: The Theory of Change Is Bidirectional

The v1.0 theory of change described a platform that eliminates failure. That is half the picture. The complete theory of change includes positive deviance: the systematic identification, validation, and spread of recurring excellence.

In implementation science, studying why some teams consistently outperform comparable peers often yields more actionable insights than studying failure alone. A rural Level 4 hospital that reduced septic shock mortality by introducing a nurse-led sepsis checklist has produced a success pattern. Another facility that halved IO access delays by storing IO kits in triage has produced a success pattern. These are not anecdotes. When validated across multiple independent facilities, they become the platform's most valuable and most shareable knowledge.

The Observation Architecture v1.1 defines a bidirectional Knowledge Base with parallel Failure Pattern and Success Pattern tracks, asymmetric confidence thresholds (success patterns require a higher bar because spreading unvalidated practice is spreading folklore), and a peer-learning model where validated success patterns are shared between facilities with explicit consent.

***Paeds Resus does not only eliminate recurring failure. It also systematically identifies, validates, and spreads recurring excellence. Contributors know the platform recognises what works, not only what goes wrong.***

### 3.4  The Unit of Change: The Failure Pattern

Most healthcare improvement programmes implicitly define a unit of change. AHA's unit is the individual provider. WHO's unit is the health system. Universities' unit is the graduate. Governments' unit is the facility.

Paeds Resus's unit of change is the failure pattern: a recurring sequence of clinical and system events that leads to preventable harm. A failure pattern occurs in Nyeri, in Kampala, in Juba. The children differ. The hospitals differ. The countries differ. The failure pattern persists.

This matters because a failure pattern, unlike a provider or a facility, is observable across institutions. It can be tracked. It can be quantified. Its frequency can be reduced. And reducing it saves children regardless of which institution or which provider it occurs in.

***The question Paeds Resus asks is not "how do we train more providers?" or "how do we build more capacity?" The question is: what are the most common recurring failure patterns responsible for preventable paediatric mortality, and how do we systematically reduce their frequency while spreading the practices of those who have already solved the same problems?***

# PART IV: THE ADAPTIVE LEARNING SYSTEM

This section explains the architecture that distinguishes Paeds Resus from every other paediatric emergency platform. Understanding it is mandatory for anyone making product, engineering, or strategic decisions. The complete specification is in the Observation Architecture v1.1.

### 4.1  The Learning Cycle

| Stage | What happens |
|---|---|
| 1. Operational Platform | Providers use ResusGPS. Courses are completed. Fellowship milestones are reached. Caregivers submit Safe-Truth experiences. Institutions audit readiness. All interactions generate observations. |
| 2. Observation Collection | Structured observations are captured: clinical decisions, gap classifications, caregiver journey stages, competency assessments, temporal intervals, resource availability. |
| 3. Adaptive Learning System | Observations are aggregated. Signals emerge. Failure modes and success factors are identified. Patterns are detected across sites and time. Confidence builds. |
| 4. Knowledge Base | Confirmed Failure Patterns and Success Patterns are recorded with multidimensional confidence, supporting evidence, temporal trends, and intervention records. |
| 5. Platform Updates | Knowledge feeds back into ResusGPS pathways (versioned), micro-course content, Care Signal recommendations, and institutional advice. Every update carries a reference to the knowledge that motivated it. |
| 6. Outcome Evaluation | Interventions based on knowledge are tracked. Outcomes are evaluated. The Knowledge Base is updated. The Adaptive Learning System learns which of its own recommendations work. |
| 7. Operational Platform | The updated platform reaches the next provider, in the next emergency. The cycle closes. |

This is an Adaptive Learning System, not a Learning Engine. The distinction is architectural: the platform itself changes based on what it learns. ResusGPS v3.2 may be informed by Failure Pattern 18 and Success Pattern 7 at confidence 0.92. Ten years from now it will be possible to ask: which version of ResusGPS was associated with the best outcomes? That question is only answerable if the versioning commitment in the Observation Architecture is honoured from day one.

### 4.2  The Three Types of Truth

These three levels are distinct data states. Movement from one to the next requires explicit governance action. Skipping a level is never permitted.

| Level | Definition |
|---|---|
| Operational Truth | What was observed. Captured by the observation model. Immutable. Never revised. The raw record of what was seen. |
| Analytical Truth | What patterns appear to exist. Generated by the Adaptive Learning System. Versioned. Subject to revision. Never surfaced to providers as a recommendation without passing to Actionable Truth. |
| Actionable Truth | What Paeds Resus is currently willing to recommend, teach, or embed in clinical guidance. The only level that feeds ResusGPS, curriculum updates, and institutional advice. Requires Knowledge Stewardship approval before deployment. |

***Never present Analytical Truth to providers as though it were Actionable Truth. An interesting pattern that has not passed governance review is not a recommendation. Presenting it as one damages trust and may cause harm.***

### 4.3  The Five Levels of Learning

| Level | Description |
|---|---|
| Level 1: Individual | A nurse experiences a failure and never repeats it. Learning is local and mortal. When the nurse retires, the learning disappears. |
| Level 2: Team | A ward or department learns. Still fragile: when staff rotate, the learning leaks away. |
| Level 3: Institutional | Learning survives people. Protocols change. Checklists change. The institution remembers. Most quality improvement efforts stop here. |
| Level 4: Network | A child dies in Nyeri. The lesson reaches Kisumu, Mbarara, Kigali, and Juba before another child dies from the same failure. Learning is no longer local. |
| Level 5: System | A failure pattern becomes visible across thousands of events. Training content changes. Procurement decisions change. Policy recommendations change. The second child receives different care because the first child died. |

### 4.4  The Holistic Loop: Honest Implementation Status

The holistic loop is the closed learning cycle that connects the platform's products. It is the most important engineering commitment in the platform. The following table states its current implementation status honestly. Describing the loop as fully implemented when it is not would mislead every developer who joins.

| Stage | Current status (June 2026) |
|---|---|
| Stage 1: Clinical Event → ResusGPS guidance | Implemented. ResusGPS guides structured response and records session data. |
| Stage 2: ResusGPS → Care Signal pre-population | Partial. Post-case prompt exists. Pre-population of Care Signal from ResusGPS session data is partially implemented. |
| Stage 3: Care Signal → Personal feedback | Partial. Submission confirmation exists. getGapAnalysis and getRecommendations are stubbed. Personal gap analysis and dynamic recommendations are not yet fully delivered. |
| Stage 4: Care Signal → Learning (micro-course link) | Partial. The recommendation link exists as a concept. Click-through measurement and verified learning connection are not implemented. |
| Stage 5: Care Signal → Institutional action | Not yet operational. Requires facilityId migration (partially done) and institutional dashboard fully built for gap-driven decision-making. |
| Stage 6: System intelligence → Knowledge Base | Not started. The Failure Pattern Knowledge Base schema has not been built. Pattern detection algorithms do not exist. |

***The holistic loop is the product. All six stages must be operational before Paeds Resus can claim to be a learning system rather than a training platform with analytics aspirations. Stages 3, 4, 5, and 6 are the immediate engineering priority.***

### 4.5  Knowledge Stewardship

The Adaptive Learning System produces recommendations. A human body must own the decision to act on them, retire outdated ones, and be accountable when they fail. That body is Knowledge Stewardship.

In the current stage of the platform, Knowledge Stewardship is exercised by the CEO with clinical sign-off authority. As the platform scales, it will become a multidisciplinary committee. Its responsibilities: approving promotion of Analytical Truth to Actionable Truth; approving all ResusGPS pathway and curriculum changes; retiring outdated knowledge; resolving conflicting evidence; overseeing external guideline integration; auditing Learning Engine performance; publishing an annual knowledge report.

No clinical content change — to ResusGPS, micro-courses, or Care Signal recommendation rules — is deployed without Knowledge Stewardship approval. This is non-negotiable and applies to AI-generated suggestions as much as to human-generated ones.

### 4.6  Concept Drift: A Named Risk

What predicts deterioration today may not predict it in ten years. Antimicrobial resistance, new pathogens, vaccination coverage, demographic changes, and healthcare system evolution all change the clinical landscape. A platform that does not actively manage concept drift will, over time, be teaching yesterday's patterns as though they are current truth.

The Observation Architecture v1.1 requires automated review scheduling for all confirmed patterns: mandatory review at 12-month intervals, automatic confidence downgrade if not reconfirmed, and retirement if not confirmed across three consecutive review windows. This is a scientific discipline enforced by the system, not dependent on human memory.

# PART V: THE PRODUCTS

Non-negotiable naming rule: ResusGPS is one product on the platform. Paeds Resus is the organisation and the platform. These must never be used interchangeably. Care Signal is one product. Safe-Truth is one product. The Paeds Resus Fellowship is one pathway. These names are not interchangeable.

### 5.1  ResusGPS — Point-of-Care Guidance

ResusGPS is the clinical guidance product. It is designed for use at the bedside during a paediatric emergency, by a trained provider who needs structured support to navigate a high-stakes clinical pathway under stress. The GPS metaphor is precise: a GPS does not replace the driver's ability to drive. It provides navigation when the driver is in an unfamiliar setting under pressure.

- Guides the provider through a structured Primary Survey (XABCDE) with real-time abnormal finding detection
- Structures the Secondary Survey (SAMPLE) with systematic symptom capture
- Surfaces condition-specific diagnostic evidence requirements before allowing differential diagnosis
- Delivers step-by-step definitive care protocols aligned with AHA, WHO, ISPAD, and BTS guidelines
- Calculates weight-based drug doses and fluid volumes in real time
- Provides CPR-GPS cardiac arrest workflow with compression timing, drug interval alerts, and rhythm guidance
- Records every clinical decision for post-case review and Care Signal pre-population
- Fellowship Pillar B credit automatically recorded when definitive care is completed for a fellowship condition

### 5.2  Courses and the Paeds Resus Fellowship

| Course | Target cadre |
|---|---|
| Basic Life Support (BLS) — 6 hours | All clinical cadres; foundational emergency response |
| Advanced Cardiac Life Support (ACLS) — 16 hours | Doctors and senior nurses; adult cardiac arrest and peri-arrest management |
| Paediatric Advanced Life Support (PALS) — 16 hours | Paediatric emergency and critical care providers |
| Neonatal Resuscitation Programme (NRP) | Providers managing neonatal emergencies |
| Heartsaver | Lay rescuer and allied health; foundational BLS for non-clinical roles |
| Instructor Course | Train-the-trainer; issues Instructor Number; enables B2B teaching on institutional schedules |

The Paeds Resus Fellowship is a 24-month discipline pathway. It is not a fast track. It is not a title that can be purchased. Its three pillars: Pillar A (Courses — defined certification and micro-course requirements); Pillar B (ResusGPS — documented use across 15 fellowship conditions with definitive care completed); Pillar C (Care Signal — at least one eligible submission per calendar month for 24 consecutive months). The Fellow title is issued only after automated verification of all three pillars. No manual conferral. No exceptions.

### 5.3  Care Signal — The Provider Feedback Loop

Care Signal is the product that transforms individual clinical events into collective institutional learning. It has three jobs: provider-facing QI reporting (confidential, structured, low-friction); Fellowship discipline (Pillar C, the mechanism of consistent reflective practice); and operational intelligence (aggregated, anonymised data that reveals what is actually failing in paediatric emergency care at the facility and network level).

The adoption theory: providers contribute when they receive value, not when they create value. Every submission must return: confirmation, updated streak, personal gap analysis, and specific recommendations linked to ResusGPS pathways and micro-courses. A provider who submits and receives nothing will not report again.

Care Signal classifies failures across eight domains: Recognition, Escalation, Vascular Access, Treatment, Referral, Monitoring, Communication, Resource Availability. The taxonomy is version-controlled and will evolve as evidence accumulates.

### 5.4  Safe-Truth — Community Voice

Safe-Truth is the parent and guardian-facing product. It captures what clinicians cannot see from inside the ward: the journey, not just the event. A clinician's account begins at the moment the child arrives. Safe-Truth begins earlier: the facility that refused admission, the two-day delay at home, the advice from the community health worker that falsely reassured, the transport that was not available.

Safe-Truth is accessible without any platform account. No registration, no login, no identity required for submission. This is non-negotiable and is a current engineering gap: the codebase currently has Safe-Truth behind authentication and must be updated to match this requirement.

Safe-Truth and Care Signal are never combined in analytics, never labelled identically in the UI, and never compared in any KPI display. They are different products with different audiences, different data tables, and different purposes. The distinction is non-negotiable.

The triangulation architecture: the same clinical event viewed through the provider lens (Care Signal), the caregiver lens (Safe-Truth), and the outcome lens (analytics). When all three align, learning is richest. Pattern triangulation — detecting co-occurrence of caregiver patterns and provider patterns across the same geography and time period — is more powerful and more privacy-preserving than case-level matching.

### 5.5  Hospital Emergency Readiness System (ERS)

Individual competence is necessary but insufficient. A trained provider working in a system with no emergency trolley, no escalation protocol, and no authority to act without a doctor present cannot convert their competence into improved outcomes. The Hospital ERS addresses the institutional layer: hospital-wide nurse-led Emergency Response Team availability 24/7, ResusGPS deployed across the facility, Care Signal embedded in ward culture, readiness audits with gap closure plans.

The institutional value proposition is system readiness, not seat count. A hospital that purchases 50 PALS seats without changing its triage workflow, escalation protocol, or emergency trolley stocking has purchased a placebo therapy. The Institutional Portal is the Command Centre for hospital leadership: a real-time view of Care Signal reporting rates, ResusGPS adoption, training coverage, and gap closure progress — not a registration management tool.

# PART VI: ACCOUNTS, ACCESS, AND REVENUE

### 6.1  Account Model: Individual Actor and Organisation Actor

Products are permissions, not account types. Two actor types exist. The current codebase userType ENUM (individual / parent / institutional) must be migrated to align with this model.

| Actor type | Who and what they access |
|---|---|
| Individual Actor | Providers, students, instructors, and trainees. Access: ResusGPS, the full AHA Hub (all certifications including Heartsaver), micro-courses, Paeds Resus Fellowship, Care Signal, and personal analytics. Profile captures: provider cadre, primary facility, country, first administrative division, Fellowship status, certification history. |
| Organisation Actor | Hospitals, schools, NGOs, ministries, and ambulance services. Access: institutional dashboard, ERS audit tools, staff training management, facility-level Care Signal analytics, Safe-Truth facility reports, MOU management, and readiness audit. Profile captures: facility name (internal, never publicly displayed), facility UUID, facility level, ownership type, country, administrative divisions, primary admin contact, backup admin contact. |

Safe-Truth sits outside both account types. It is accessible without any account. Caregivers submit through a direct URL or QR code with no registration required.

Institutional continuity: the Organisation Actor account belongs to the institution, not the person who created it. A minimum of two named admin contacts must always be registered. Account recovery requires institutional identity verification — facility letterhead, MoH registration number — not personal credential reset. If both admin contacts are unreachable, recovery is via institutional verification only. This is a solved problem in enterprise software and must not be left to individual email accounts.

### 6.2  Provider Cadre Classification

Provider cadre is a mandatory profile field and a mandatory event-level classifier. It enables the platform to detect whether training gaps are cadre-specific. The canonical cadre list:

| Cadre | Notes |
|---|---|
| Community Health Worker | Lay community-level responder |
| Enrolled Nurse | Certificate-level nursing qualification |
| Registered Nurse | Diploma or degree-level nursing |
| Clinical Officer (Diploma) | Diploma-level clinical officer |
| Clinical Officer (Degree / Advanced) | Degree-level clinical officer |
| Medical Officer | MBChB or equivalent; pre-specialisation |
| Paediatrician | Specialist paediatric qualification |
| Other Specialist | Named specialty; captured in supplementary field |
| Nursing Student | Pre-qualification trainee |
| Medical Student | Pre-qualification trainee |
| Other Trainee | Named training pathway; captured in supplementary field |

### 6.3  Fellowship Anonymity and Pseudonymous Consent

A provider may submit Care Signal anonymously while still receiving Fellowship credit. The two-layer consent model:

- Anonymous QI Reporting: submission with no userId. Contributes to aggregate pattern analysis. No Fellowship credit. No personal gap analysis.
- Pseudonymous Fellowship Reporting: submission linked to a system-generated persistent token stored on the provider's device and in the Fellowship engine only. The platform knows "token X submitted this month" without knowing who X is. Streak maintained. Gap analysis stored against the token. Fellowship credit awarded.
- If the provider later chooses to link their token to their named identity (to display the Fellow title on their profile), that is a separate, explicit, revocable consent action.

This requires an engineering change to the current Care Signal implementation. The token is generated at first Care Signal submission, not at account creation, and must be exportable by the provider in case of device change.

### 6.4  The Financial Strategy

Paeds Resus operates four mutually reinforcing businesses. Each generates revenue while feeding the others.

| Business | Revenue model and strategic role |
|---|---|
| 1. Education | AHA certifications (BLS, ACLS, PALS, NRP, Heartsaver, Instructor), micro-course certifications, Paeds Resus Fellowship fees. Individual provider payments. Low friction, immediate value. Generates cash flow now and produces the observations that feed the Learning System. |
| 2. Quality Improvement | Productised ERS packages with annual recurring review fees. Fixed scope, not bespoke consulting. Institutional readiness audits. Premium analytics for institutional subscribers: facility-level gap analysis, benchmark comparisons, board-level readiness reports. Generates institutional relationships and implementation data. |
| 3. Learning Network | Intelligence licensing to ministries, global health funders, and research institutions. Peer-learning facilitation between institutions (validated success pattern sharing with facility consent). Annual knowledge reports. Policy consultation. Becomes the platform's deepest revenue source as the Knowledge Base matures — three-to-five year horizon. |
| 4. Decision Support | ResusGPS pathways updated by confirmed knowledge delivered at the point of care. In markets where clinical decision support can be reimbursed by insurers or procured by governments, this is a distinct revenue stream with the highest direct impact per interaction. |

Long-term accreditation revenue: Paeds Resus Emergency Readiness Accreditation, renewable annually, linked to insurance contracting and government procurement. The model: Paeds Resus certifies that a hospital has met a defined emergency readiness standard. Insurers and governments use that certification as one input into contracting decisions. Paeds Resus never makes the contracting decision. It provides the readiness evidence. This requires significant trust-building and a mature Knowledge Base before it is credible. It is a five-to-ten year horizon.

***CONSTITUTIONAL REVENUE PRINCIPLE: Individual provider access to Care Signal, ResusGPS, and core courses is never gated by ability to pay in any setting where Paeds Resus operates. Revenue comes from institutions, governments, and funders who benefit from the intelligence the platform produces. Providers who contribute observations are not charged for the contribution. This principle is non-negotiable and may not be overridden by commercial pressure.***

What Paeds Resus will not do: publicly rank hospitals by emergency readiness for patient or family use. The ethical exposure is unresolvable, the incentive alignment is wrong (hospitals would game rankings rather than improve care), and the liability in the event of harm is catastrophic. Facility-level data is used internally to help facilities improve and to identify learning exemplars — never to publicly compare or rank.

# PART VII: THE LMIC CONTEXT

### 7.1  What Realistic Means

- A diploma-level nurse managing a paediatric ward alone at 3am, with one functional pulse oximeter, no SpO2 alarm, and a senior doctor available by phone
- A facility where oxygen is available on some days and not others, where IV sets run out mid-shift, and where the emergency trolley has not been restocked since the last cardiac arrest
- A clinical environment where escalation requires waiting for a doctor, ward rounds happen once a day, and a child can deteriorate from compensated to decompensated shock between observations
- A training environment where staff cannot afford a three-day course, certification costs represent a significant personal financial burden, and employer support for continuing education is inconsistent
- A technology environment where mobile data is intermittent, devices are shared, and a complex UI is abandoned for the paper register

Every product decision must survive this environment. A feature that works in a simulation centre and fails at 3am in a district hospital is not a feature. It is a liability.

### 7.2  The Four Design Tests

- Does it reduce preventable death or harm? (Mission alignment)
- Is it realistic for an LMIC nurse at 3am? (Context fitness)
- Does it integrate with the rest of the Paeds Resus ecosystem? (Systems thinking)
- Does it measure something that matters? (Accountability)

If the answer to any of these is no, it is a distraction. Not necessarily a bad idea — but not the right next move for this organisation.

### 7.3  Global from Day One

Kenya is the proving ground, not the market. The problem exists globally. The platform is already globally accessible. The geographic hierarchy in the Observation Architecture v1.1 is designed for global use from day one: Country → Administrative Level 1 → Administrative Level 2 → Facility, with country-specific enumeration loaded from a reference table.

The expansion strategy is not Kenya → Uganda → Tanzania. It is Proof → Replication. Geography is secondary to demonstrated, measurable improvement in clinical process outcomes at the facility level. The search for the next context is problem-centred, not geography-centred: where are people experiencing recurring preventable child deaths and actively searching for better ways to respond?

# PART VIII: WHAT NEEDS TO BE BUILT

This section is written as though nothing has been built. It describes the complete platform that must exist for Paeds Resus to fulfil its mandate. Anyone assessing what still needs to be done should measure the distance between this section and the current codebase. The Observation Architecture v1.1 Section 10.2 provides the detailed engineering implementation status.

### 8.1  ResusGPS — What Must Exist

- Structured Primary Survey (XABCDE) with every vital sign captured individually and abnormal values highlighted in real time during input
- Weight-based dose calculation for all critical drugs and fluid volumes with dose rationale displayed
- Structured Secondary Survey (SAMPLE) with every field captured individually or marked Not Available — no bulk skip
- Condition-specific diagnostic evidence capture before differential diagnosis is permitted
- Step-by-step definitive care protocols with individual step confirmation
- Fluid bolus reassessment after every bolus: overload signs and perfusion parameters each submitted individually
- CPR-GPS cardiac arrest workflow: 2-minute compression cycles, pre-charge alert at T-30s, 10-second rhythm window, drug interval alerts, rhythm feedback
- Automatic pre-population of Care Signal form after ResusGPS session completion
- All 15 fellowship conditions fully implemented with co-diagnosis support
- Offline-capable: clinical decisions cannot wait for a network request

### 8.2  Courses and Fellowship — What Must Exist

- Diagnostic, formative, and summative question banks fully disjoint — zero overlap between any two exam types for any course
- Minimum summative bank of 25 unique, condition-specific stems per course
- Simulation scenarios condition-specific with 4–6 branching decision points
- Linear learning flow: module → quiz → score → continue. Primary CTA on pass is Continue, not Return to List
- All three Fellowship pillar checks automated — no manual conferral under any circumstances
- Pillar C streak calculated in EAT (UTC+3), not UTC
- Fellowship pseudonymous token model implemented (Section 6.3 of this document)
- All certificates verifiable via QR code linking to /verify page

### 8.3  Care Signal — What Must Exist

- Single canonical form component used everywhere — no parallel implementations
- Global shared classifier set: country, admin_level_1, facility_level, facility_ownership, child_age_band, condition_category, outcome_category, schema_version
- Role-at-time-of-event captured at every submission
- Temporal interval fields: time-to-recognition, time-to-first-intervention, time-to-vascular-access, time-to-escalation
- Every submission returns: confirmation, updated streak, personal gap analysis, dynamic recommendations linked to ResusGPS pathways and micro-courses
- Anonymous submission always available; pseudonymous Fellowship submission via token model
- facilityId captured at submission from explicit provider selection — never inferred from profile
- schema_version column on all observation rows

### 8.4  Safe-Truth — What Must Exist

- Accessible without any platform account — direct URL or QR code submission — this is a current engineering gap and a P0 requirement
- Distinct UX from Care Signal — different tone, structure, and purpose
- Captures care-seeking timeline: symptom onset, decision to seek care, each facility contact, barriers at each contact
- Structured enough to aggregate: key journey stages selectable from defined options alongside free text
- Global shared classifier set implemented (same fields as Care Signal)
- Institutional admins can see their facility's Safe-Truth data: what families report about their experience at that facility
- Future design: longitudinal journey capture enabling prospective submission at each stage of the care-seeking journey, not only retrospective

### 8.5  The Failure Pattern Knowledge Base — What Must Exist

- Separate knowledge_base schema with tables: failure_patterns, success_patterns, recommendations, interventions, implementations, pattern_observations (join table), content_versions
- Pattern records with multidimensional confidence (clinical, statistical, external evidence, platform replication, geographic diversity, recency)
- Automated review scheduling: every confirmed pattern flagged for review at 12-month intervals
- Intervention and Implementation objects: tracking what was recommended, what was committed to, and what actually happened
- Self-evaluation mechanism: recommendation outcome labels that update pattern confidence when interventions are evaluated
- Knowledge Stewardship governance workflow: every promotion from Analytical Truth to Actionable Truth requires approval before deployment
- Versioned content: every ResusGPS pathway version, curriculum update, and recommendation rule carries knowledge_source_ids

# PART IX: WHAT SUCCESS LOOKS LIKE

Success is not scale. Scale is a consequence of success, not its definition.

### 9.1  Honest Claims Today

### Paeds Resus can currently claim:

- Clinical usefulness at the bedside: ResusGPS provides structured guidance that experienced providers report finding useful
- Reliability under pressure: the platform functions in low-connectivity environments and produces consistent clinical outputs
- Accessibility: micro-courses and certification programmes are priced and delivered for LMIC providers
- AHA alignment: training delivered through a formally recognised AHA Training Site (ID: TS70875)

### Paeds Resus cannot currently claim:

- Mortality reduction: no published clinical outcome data exists yet
- Behaviour change at scale: no controlled evaluation of provider behaviour pre and post platform use
- System-level learning: the holistic loop is partially implemented and not yet operating across multiple institutions
- Pattern detection: the Failure Pattern Knowledge Base does not yet exist

### 9.2  The 18-Month Mature Platform

- One complete vertical slice: one partner hospital, one clinical condition (Paediatric Septic Shock), one closed loop. ResusGPS case → Care Signal reflection → linked micro-course → institutional gap visibility → documented action. Demonstrated end-to-end. Verified by observation, not by log data alone.
- Fellowship integrity: the Fellow title is issued only after automated verification of all three pillars. No manual conferral has occurred.
- Provable process outcomes: time-to-first-antibiotic, time-to-first-fluid-bolus, Care Signal reporting rate, ResusGPS adoption rate at pilot facility. Process measures, not mortality claims. Defensible.
- Release discipline: staging URL live, every clinical and payment change verified on staging before production, for eight consecutive weeks without exception.
- Safe-Truth unauthenticated: accessible without account. Care Signal analytics show real database data — no mock data, no hardcoded constants.
- Account model migrated: Individual Actor and Organisation Actor in production. userType ENUM updated. Safe-Truth parent account type retired.
- One published process-outcome evaluation with clinical governance sign-off.

### 9.3  The Ten-Year System Learning Test

In ten years, the question is not how many users the platform has. The question is whether the system has learned. The six-question test:

- Can we identify the ten most common paediatric emergency failure patterns across participating systems?
- Do we know which failure patterns contribute most to preventable mortality in LMIC settings?
- Can we demonstrate that certain failure patterns have become less common over time — and attribute that reduction to specific platform interventions?
- Can a nurse in a Level 4 facility access the accumulated learning from thousands of prior events at the moment of clinical decision?
- Are children receiving different care because previous children died?
- Can we demonstrate that our own recommendations have improved outcomes — not just that we made them?

***The day a child dying in Nyeri saves a child in Juba — not because someone remembered the story, but because the learning is embedded in how care is delivered — that is when the system has learned.***

### 9.4  What the Platform Must Never Become

- A certification mill: a platform that sells certificates without changing behaviour is a placebo therapy with a revenue model
- An advocacy system: Care Signal must be capable of proving the founders wrong on specific hypotheses. The day it cannot is the day it stops being useful
- A mortality claims engine: Paeds Resus does not claim lives saved without peer-reviewed clinical evaluation
- A feature accumulator: every feature must pass the four design tests. A growing feature list that fails to close the holistic loop is a distraction dressed as progress
- An LMIC-in-name product: designed for high-resource environments and marketed to low-resource ones. Every design decision must survive the 3am test
- A stale knowledge base: a platform whose patterns are not reviewed, not retired when superseded, and not updated when evidence changes is teaching yesterday's understanding as though it were current truth. Concept drift management is non-negotiable
- A platform where the revenue model gatekeeps the mission: individual provider access to Care Signal, ResusGPS, and core courses is never restricted by ability to pay

# PART X: FOR EVERYONE WHO JOINS

This section is addressed directly to developers, clinical advisors, engineers, partner institutions, and any person who contributes to Paeds Resus. The conversation that produced this document does not need to happen again. This document is that conversation, written down.

### 10.1  What You Are Building

You are not building a training platform. You are not building an app. You are building a failure-learning network whose purpose is to convert individual clinical events into collective intelligence that prevents the next child from dying from the same cause — and to spread the practices of those who have already found better ways.

Every line of code, every clinical module, every database schema, every API endpoint either advances or impedes that purpose. The question to ask before every decision is: does this make the system better at learning from paediatric failures and spreading paediatric excellence?

### 10.2  Non-Negotiable Principles

- Children's lives depend on clinical accuracy. No clinical content goes live without Knowledge Stewardship approval. No exceptions.
- The holistic loop is the product. Features that exist outside the loop are guests. Features that close the loop are residents.
- Honest data is the foundation. A Care Signal analytics page showing mock data is not a placeholder — it is a lie that erodes the entire intelligence layer. Mock data must be removed before any feature is considered shipped.
- The 3am test applies to everything. If it does not work in a real LMIC clinical environment, it does not work.
- Naming discipline is non-negotiable. Paeds Resus is the organisation and platform. ResusGPS, Care Signal, Safe-Truth, and the Paeds Resus Fellowship are distinct products. These names are not interchangeable.
- The system must be capable of being wrong. If Care Signal data shows that execution failures are not the dominant cause of preventable mortality in a given setting, the platform must surface that finding, not suppress it.
- Individual provider access is never gated by ability to pay. The constitutional revenue principle is a non-negotiable founding constraint, not a policy that can drift under commercial pressure.
- Every field must have a plausible path to improving a future child's care. Data hoarding is a failure mode. If you cannot articulate how a field could eventually improve a clinical decision, a training priority, or a procurement choice, it should not be collected.

### 10.3  The Decision Filter

- Does it reduce preventable death or harm?
- Is it realistic for an LMIC nurse at 3am?
- Does it integrate with the rest of the Paeds Resus ecosystem?
- Does it measure something that matters?

If the answer to any of these is no, it is a distraction. Bring it back when the answer changes.

### 10.4  The Named Threshold

There is a specific moment in the development of Paeds Resus that should be recorded and understood by everyone who joins after it occurred.

The platform began as a question about how to train providers better. Through the process of rigorous architectural thinking, the question changed. It became: how do we build a learning system that becomes progressively better at understanding and reducing recurring paediatric failure patterns — and that spreads the practices of those who have already solved those problems?

That is a fundamentally different engineering problem, a different funding story, a different research partnership story, and a different institutional identity. It is not a branding change. It is an ontological shift: from a platform that trains individuals to a platform that learns from failures and spreads excellence across systems.

Everything built from this point forward should be evaluated against that shift, not against the earlier, narrower question.

### 10.5  The Book of the Unforgotten

Paeds Resus works in memory of those who were lost to preventable failure modes. They are not cases. They are not data points. They are the reason this work exists.

The Book of the Unforgotten is now embedded in the architecture itself. Every failure pattern in the Knowledge Base represents children whose deaths have taught the system something. The Recommendation Outcome evaluation mechanism exists so that their deaths are not only recorded but acted upon, and so that the action is verified to have worked. The concept drift management rules exist so that the learning does not become stale.

Every time mock data is removed and replaced with truth, every time a clinical pathway is made more rigorous, every time a recommendation is evaluated and the evidence followed wherever it leads — that is the Book of the Unforgotten made operational.

***The purpose of Paeds Resus is not merely to teach. Not merely to certify. Not merely to analyse. Its purpose is to ensure that what works actually happens — regardless of geography, institutional prestige, or resource setting. And to make sure that when it does not happen, the system learns why, changes itself, and gives the next child a different story.***

## Document Classification and Review

*This document is the North Star for Paeds Resus Limited. It does not replace the PSoT for binding technical decisions or the Observation Architecture v1.1 for data and learning governance decisions. It provides the strategic, clinical, ethical, and institutional identity foundation that those decisions must serve. Review triggers: changes to the theory of change, the product architecture, the strategic direction, the account model, the revenue strategy, or the institutional identity. It is a living document, not a historical record.*
