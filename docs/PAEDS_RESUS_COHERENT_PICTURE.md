# Paeds Resus — The Coherent Picture
**Read this document first. It is the mandatory entry point for every agent, developer, or collaborator working in this codebase.**

**Type:** Constitutional synthesis — not a summary, not a brief. A document written precisely so that reading it first makes every other document immediately coherent.  
**Version:** 1.0 — July 2026  
**Status:** Active. Update this file whenever a constitutional document changes.  
**Written from:** North Star v2.0 · Observation Architecture v1.1 · Platform Source of Truth · Strategic Foundation v1.1 · Institutional ERS Narrative · Care Signal World-Changing Potential · Financial Strategy v1.0

---

## ⚠️ Stop. Read this before touching any code or document.

The README documentation map sends agents to `PLATFORM_SOURCE_OF_TRUTH.md` first.
That document answers *What we build*. **You need to understand *Why* and *How we learn* before *What* makes any sense.**

Read in this order:

| Step | Document | Question it answers |
|------|----------|---------------------|
| **1. This document** | `docs/PAEDS_RESUS_COHERENT_PICTURE.md` | Who Paeds Resus actually is, as a whole |
| **2. North Star v2.0** | [`docs/NORTH_STAR_V2.md`](./NORTH_STAR_V2.md) | *Why* we exist — mission, theory of change, institutional identity, financial strategy |
| **3. Observation Architecture v1.1** | [`docs/OBSERVATION_ARCHITECTURE_V1_1.md`](./OBSERVATION_ARCHITECTURE_V1_1.md) | *How* we learn — observation model, transformation pipeline, learning governance |
| **4. Platform Source of Truth** | [`docs/PLATFORM_SOURCE_OF_TRUTH.md`](./PLATFORM_SOURCE_OF_TRUTH.md) | *What* we build — binding technical and product decisions, priority order |

**Conflict resolution:** Technical implementation questions → PSoT wins. Strategic direction → North Star wins. Data architecture and learning governance → Observation Architecture wins. Update the losing document. Never silently diverge.

---

## 1. What Paeds Resus Actually Is

## 2. Who Paeds Resus Is — The Core Identity

Paeds Resus is an **Adaptive Learning System** — a paediatric survival infrastructure platform for low- and middle-income countries (LMICs).

It is **not** a training company. It is **not** a hospital management system. It is **not** a ResusGPS app. Those are components. The identity is the **closed learning loop** that connects them.

### The Child at Both Ends of the Loop

Everything Paeds Resus builds begins and ends with the child:

> **On one end** is the child who died (*The Book of the Unforgotten* — capturing system failures, honoring lost lives, recording failure patterns).  
> **On the other end** is the child who lives because the system learned.

This cycle can never stop. Eliminating preventable childhood deaths is an ongoing commitment; we can never comfortably claim all preventable deaths have been eliminated. Therefore, the system must continuously observe, adapt, and learn—ensuring the readiness infrastructure is always prepared for the next child or patient who needs it.

In African referral health systems without isolated paediatric hospitals, paediatric care occurs within general facilities where paediatric wards experience high Patient:Nurse ratios. The **Institutional Emergency Readiness Management System™ (IERMS™)** mobilizes the hospital's entire 24/7 emergency infrastructure (nurse-led ERT) to protect paediatric patients and all acute care populations.

The closest institutional analogue is **aviation safety**. Every near-miss reported makes the whole system safer. The incident database is not the product. Fewer children dying from the same preventable failure is the product.

Anyone who reduces Paeds Resus to "a training company," "a ResusGPS app," or "a BLS/ACLS provider" has misunderstood the architecture. All three are components. None is the identity.

**Reference:** [`docs/NORTH_STAR_V2.md`](./NORTH_STAR_V2.md) §2.2–2.3

---

## 2. The Single Problem

**The Know-Do Gap.** Children mostly die not because the right treatment is unknown, but because it does not reach them in time, in the right sequence.

The oxygen was present and not administered. The antibiotic was on the shelf and not given within the hour. Shock was visible six hours before death and not recognised as shock. This is an **execution problem**, not a knowledge problem.

| Failure category | Paeds Resus response |
|---|---|
| **Structural constraint** (oxygen cylinder empty, one nurse for forty patients) | Identifies through Care Signal and Safe-Truth. Does not pretend software fixes this. |
| **Execution failure** (oxygen present, not given; antibiotic stocked, not prescribed within the hour) | Direct impact: ResusGPS guidance, fellowship competency, feedback loops, institutional systems. |

**Reference:** [`docs/NORTH_STAR_V2.md`](./NORTH_STAR_V2.md) §1, [`docs/STRATEGIC_FOUNDATION.md`](./STRATEGIC_FOUNDATION.md) §2

---

## 3. The Mission

> Contribute to a world where no child dies a preventable death, by building a sustainable, scalable organisation that improves paediatric resuscitation and emergency care in resource-limited settings.

- **Sustainable and scalable** — financial sustainability is not a distraction from mission. It is the precondition for mission at the scale of the problem.
- **Resource-limited settings** — LMIC realism is a design constraint, not an afterthought.
- **Emergency care** — the specific domain. Not all child health. Where the execution gap is most acute and most amenable to structured intervention.

**Reference:** [`docs/NORTH_STAR_V2.md`](./NORTH_STAR_V2.md) §2.1

---

## 4. The Five Products (and How They Connect)

| Product | Role in the system | Deep-dive |
|---|---|---|
| **ResusGPS** | Bedside navigation — structured ABCDE flows, weight-based dosing, CPR-GPS cardiac arrest workflow. Not a substitute for judgment; a GPS for someone who can already drive. | [`docs/PLATFORM_SOURCE_OF_TRUTH.md`](./PLATFORM_SOURCE_OF_TRUTH.md) §3, §13.1 |
| **Education** (AHA + Fellowship + Micro-courses) | BLS (6h) · ACLS (16h) · PALS (16h) · NRP · Heartsaver · Instructor Course · Micro-courses · Paeds Resus Fellowship. Credentialing that changes behaviour — not certificates for their own sake. | [`docs/COURSE_PORTFOLIO_AND_ADF_STRATEGY.md`](./COURSE_PORTFOLIO_AND_ADF_STRATEGY.md) · [`docs/NORTH_STAR_V2.md`](./NORTH_STAR_V2.md) §5.2 |
| **Care Signal** | Provider-facing QI reporting. Currently: incident reporting for Fellowship Pillar C and facility QI. Target: the first real-time, provider-sourced epidemiological surveillance network for paediatric emergency system failures in LMICs. **This network does not exist anywhere else.** | [`docs/CARE_SIGNAL_STRATEGY_AND_ROADMAP.md`](./CARE_SIGNAL_STRATEGY_AND_ROADMAP.md) · [`docs/CARE_SIGNAL_WORLD_CHANGING_POTENTIAL.md`](./CARE_SIGNAL_WORLD_CHANGING_POTENTIAL.md) |
| **Safe-Truth** | Caregiver-facing channel — accessible without any login. Captures the journey before the ward: pre-hospital delays, facilities that turned families away, advice that falsely reassured. **Never conflate with Care Signal.** | [`docs/OBSERVATION_ARCHITECTURE_V1_1.md`](./OBSERVATION_ARCHITECTURE_V1_1.md) §3.3 |
| **Hospital ERS / IERMS™** | Institutional Emergency Readiness Management System™ — hospital-wide nurse-led ERT 24/7, ResusGPS and Care Signal deployed across the facility, readiness audits (100-point scorecard), institutional dashboard. System readiness, not seat count. | [`docs/institutional/IERMS_STANDARD_V1.md`](./institutional/IERMS_STANDARD_V1.md) · [`docs/INSTITUTIONAL_ERS_NARRATIVE.md`](./INSTITUTIONAL_ERS_NARRATIVE.md) |

**Non-negotiable naming rule:** ResusGPS is one product. Paeds Resus is the organisation and platform. Never interchangeable. Safe-Truth and Care Signal are different products with different audiences, different data tables, and different purposes.

---

## 5. The Adaptive Learning System — How It Works

```
┌────────────────────────────────────────────────────────────┐
│                   OPERATIONAL PLATFORM                      │
│  ResusGPS cases · Courses · Fellowship · Care Signal ·     │
│  Safe-Truth submissions · ERS readiness audits             │
└────────────────────┬───────────────────────────────────────┘
                     │ generates
                     ▼
          ┌──────────────────────┐
          │   OBSERVATION LAYER  │
          │   Structured, coded, │
          │   schema-versioned,  │
          │   immutable raw data │
          └──────────┬───────────┘
                     │ aggregates into
                     ▼
        ┌────────────────────────────┐
        │   ADAPTIVE LEARNING SYSTEM │
        │   Signal → Failure Mode    │
        │   → Pattern Detection      │
        └──────────┬─────────────────┘
                   │ confirmed patterns enter
                   ▼
    ┌──────────────────────────────────────┐
    │   FAILURE PATTERN KNOWLEDGE BASE     │
    │   (FPKB — not yet built; P5 after    │
    │   Care Signal v3 ships)              │
    └──────────┬───────────────────────────┘
               │ updates (via Knowledge Stewardship sign-off)
               ▼
    ResusGPS pathways · Fellowship curriculum
    Care Signal recommendations · Institutional advice
               │
               ▼
        The next provider. The next child.
```

**This is an Adaptive Learning System, not a Learning Engine.** The platform changes itself based on what it learns. ResusGPS pathways and Fellowship curriculum are updated by confirmed knowledge — not by instinct or commercial pressure.

**Reference:** [`docs/OBSERVATION_ARCHITECTURE_V1_1.md`](./OBSERVATION_ARCHITECTURE_V1_1.md) §1.1, [`docs/NORTH_STAR_V2.md`](./NORTH_STAR_V2.md) §4

---

## 6. The Three Types of Truth (Binding — Never Violate)

| Level | Definition | Governance rule |
|---|---|---|
| **Operational Truth** | What was actually observed. Immutable. Never revised. | Stored forever. Cannot be overwritten or reclassified in place. |
| **Analytical Truth** | A pattern the system has detected. Versioned, revisable. | **Never shown to providers as a recommendation.** Not actionable until promoted. |
| **Actionable Truth** | What Paeds Resus is currently willing to teach, recommend, or embed in guidance. | Requires **Knowledge Stewardship approval** before deployment. The only level that changes ResusGPS, curriculum, or Care Signal advice. |

Presenting Analytical Truth to providers as though it were Actionable Truth damages trust and may cause harm. Never do this.

**Reference:** [`docs/OBSERVATION_ARCHITECTURE_V1_1.md`](./OBSERVATION_ARCHITECTURE_V1_1.md) §8, [`docs/NORTH_STAR_V2.md`](./NORTH_STAR_V2.md) §4.2

---

## 7. The Four Businesses — Strict Sequencing

| Business | What it does | Horizon |
|---|---|---|
| **1. Education** | AHA certifications, micro-courses, Fellowship fees. The near-term cash engine. Produces observations that feed the Learning System. | **Now** |
| **2. Quality Improvement** | Productised Hospital ERS packages, institutional readiness audits, premium analytics. Generates institutional relationships and implementation data. | **2027–28** |
| **3. Learning Network** | Intelligence licensing to ministries, global health funders, research institutions. Peer-learning between institutions. | **2029+** — requires data density: 3+ countries, 1,000+ observations, mature FPKB |
| **4. Decision Support** | ResusGPS pathways updated by confirmed knowledge, procured by governments as clinical decision support. | **Long-term** |

**Business 1 funds 2. Business 2 generates the implementation evidence 3 needs. Business 3 feeds 4's credibility.**

### The Constitutional Revenue Principle (Non-Negotiable)

> Individual provider access to Care Signal, ResusGPS, and core courses is **never gated by ability to pay** in any setting where Paeds Resus operates. Revenue comes from institutions, governments, and funders who benefit from the intelligence the platform produces.

**Precise scope:** Individual providers still pay for Fellowship enrolment and AHA certifications (Business 1). The principle protects Care Signal, ResusGPS, and core course *access* only.

**Reference:** [`docs/NORTH_STAR_V2.md`](./NORTH_STAR_V2.md) §6.4, [`docs/FINANCIAL_STRATEGY_V1.md`](./FINANCIAL_STRATEGY_V1.md)

---

## 8. Account Model (Migration Required)

Two actor types. Products are permissions, not account types.

| Actor type | Who | Access |
|---|---|---|
| **Individual Actor** | Providers, students, instructors, trainees | ResusGPS · Full AHA Hub · Micro-courses · Fellowship · Care Signal · Personal analytics |
| **Organisation Actor** | Hospitals, schools, NGOs, ministries, ambulance services | Institutional dashboard · ERS audit tools · Staff management · Facility-level analytics · MOU management |

**Safe-Truth sits outside both** — accessible via direct URL or QR code, no account required. Non-negotiable.

**P0 migration required:** Current `userType` ENUM (`individual | parent | institutional`) → `individual_actor | organisation_actor`. The `parent` type is retired. Do not build new features against it.

**Reference:** [`docs/PLATFORM_SOURCE_OF_TRUTH.md`](./PLATFORM_SOURCE_OF_TRUTH.md) §4, §7, [`docs/OBSERVATION_ARCHITECTURE_V1_1.md`](./OBSERVATION_ARCHITECTURE_V1_1.md) §5.4

---

## 9. The Paeds Resus Fellowship — Three Pillars, Fully Automated

A 24-month discipline. Not a title that can be purchased. All three pillars are required. All three are verified automatically — no manual conferral under any circumstances.

| Pillar | Requirement |
|---|---|
| **A — Courses** | All active ADF micro-courses completed and passed |
| **B — ResusGPS** | ≥3 attributable cases per taught fellowship condition, server-side verified |
| **C — Care Signal** | 24 consecutive qualifying months of monthly reporting (EAT). ≤2 grace periods/year. Not Safe-Truth submissions. |

If automation is incomplete, the Fellow title UI does not ship.

**Reference:** [`docs/NORTH_STAR_V2.md`](./NORTH_STAR_V2.md) §5.2, [`docs/FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md`](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md)

---

## 10. The Holistic Loop — Honest Implementation Status (June 2026)

| Stage | Status |
|---|---|
| Stage 1: Clinical Event → ResusGPS guidance | ✅ Implemented |
| Stage 2: ResusGPS → Care Signal pre-population | ⚠️ Partial |
| Stage 3: Care Signal → Personal feedback (gap analysis, recommendations) | ⚠️ Stubbed — not yet fully delivered |
| Stage 4: Care Signal → Learning link (micro-course recommendation, click-through verified) | ⚠️ Concept exists, not implemented |
| Stage 5: Care Signal → Institutional action (gap-driven decisions via dashboard) | ❌ Not operational |
| Stage 6: System intelligence → Knowledge Base (FPKB, pattern detection) | ❌ Not started |

> The holistic loop is the product. All six stages must be operational before Paeds Resus can claim to be a learning system rather than a training platform with analytics aspirations. Stages 3–6 are the immediate engineering priority.

**Reference:** [`docs/NORTH_STAR_V2.md`](./NORTH_STAR_V2.md) §4.4, [`docs/OBSERVATION_ARCHITECTURE_V1_1.md`](./OBSERVATION_ARCHITECTURE_V1_1.md) §6

---

## 11. Priority Order (Locked — Per PSoT §12)

| Priority | Work item |
|---|---|
| **P0** | Care Signal v3 + Safe-Truth accountless migration. The instrument that makes the Adaptive Learning System real. Does not ship until post-submission feedback loop is live (not stubbed). |
| **P1** | Analytics instrumentation — products emit events; admin reports show real activity, not zeros. |
| **P2** | Staging environment — develop → staging; main → production. |
| **P3** | Security baseline — password complexity, session max age, admin audit logging. |
| **P4** | ResusGPS v4 — undo, medication dedup, multi-diagnosis, structured age, countdown timers, dose rationale. |
| **P5** | FPKB migrations — after Care Signal v3 ships. 12-migration sequence, taxonomy seed data. |
| **P6** | Failure Pattern Atlas (minimal public UI) — starts empty; fills as Care Signal v3 data arrives. |

**Institutional lane (parallel, CEO-led):** Hospital ERS pilots are not blocked on P4 but must lead with readiness systems, not bulk seat count.

**Reference:** [`docs/PLATFORM_SOURCE_OF_TRUTH.md`](./PLATFORM_SOURCE_OF_TRUTH.md) §12

---

## 12. LMIC Design Constraint — The 3am Test

Every product decision must survive this environment:
- Diploma-level nurse, paediatric ward, alone at 3am, one functional pulse oximeter, senior doctor by phone only.
- Facility where oxygen is available some days but not others. IV sets run out mid-shift.
- Mobile data intermittent. Devices shared. Complex UI abandoned for the paper register.

**A feature that works in a simulation centre and fails at 3am in a district hospital is not a feature. It is a liability.**

The four tests for every feature:
1. Does it reduce preventable death or harm?
2. Is it realistic for an LMIC nurse at 3am?
3. Does it integrate with the rest of the ecosystem?
4. Does it measure something that matters?

**Reference:** [`docs/NORTH_STAR_V2.md`](./NORTH_STAR_V2.md) §7, [`docs/STRATEGIC_FOUNDATION.md`](./STRATEGIC_FOUNDATION.md) §4

---

## 13. What Paeds Resus Can and Cannot Currently Claim

### Can claim
- Clinical usefulness at the bedside (ResusGPS)
- Reliability under pressure in low-connectivity environments
- AHA alignment: formally recognised Training Site (ID: TS70875)
- Accessible pricing for LMIC providers

### Cannot claim
- Mortality reduction — no published clinical outcome data exists yet
- Behaviour change at scale — no controlled evaluation pre/post platform use
- System-level learning — the holistic loop is partially implemented
- Pattern detection — the FPKB does not yet exist

**Reference:** [`docs/NORTH_STAR_V2.md`](./NORTH_STAR_V2.md) §9.1

---

## 14. Deliberate Boundaries — What We Will Not Do

| Boundary | Why |
|---|---|
| No public hospital performance rankings | Ethical exposure unresolvable. Hospitals would game rankings. Catastrophic liability. |
| No accreditation before FPKB is mature | Requires credible audit methodology. Five-to-ten year horizon. |
| No Learning Network intelligence licensing before data density | Requires 3+ countries, 1,000+ observations. Premature licensing erodes credibility. |
| No automated AI pattern detection before human observation quality is demonstrated | AI on poor data produces confident wrong answers. |
| No manual Fellow title conferral | If automation is incomplete, the UI does not ship. No exceptions. |

---

## 15. Care Signal — The World-Changing Version

Care Signal is currently conceived as an incident reporting tool. That framing is correct but dangerously incomplete.

The deeper idea — the one that changes the world — is:

> **Care Signal is the first real-time, provider-sourced epidemiological surveillance network for paediatric emergency system failures in LMICs. No such network exists. Not at WHO. Not at UNICEF. Not at CDC.**

Five missed dimensions that must be designed from the start:
1. **Epidemiological signal** — aggregate cross-facility, cross-country pattern detection in near real-time
2. **Closed learning loop** — submission triggers linked micro-course and ResusGPS recommendation, not a generic message
3. **Ministry of Health relationship** — national paediatric emergency surveillance instrument governments subscribe to
4. **Closed-loop accountability** — gap reported → corrective action assigned → tracked → escalated if not closed → provider notified when resolved
5. **Anonymised peer benchmarking** — facilities see how they compare to similar facilities and what high performers do differently

The data moat is not built by having the best algorithm. It is built by **earning the trust of frontline providers** and giving them a reason to keep reporting.

**Reference:** [`docs/CARE_SIGNAL_WORLD_CHANGING_POTENTIAL.md`](./CARE_SIGNAL_WORLD_CHANGING_POTENTIAL.md)

---

## 16. Supporting Document Map

After reading the constitutional three (North Star → Observation Architecture → PSoT), use this map for specific topics:

| Topic | Document |
|---|---|
| Financial model, pricing, sequencing | [`docs/FINANCIAL_STRATEGY_V1.md`](./FINANCIAL_STRATEGY_V1.md) |
| FPKB database schema (11 tables) | [`docs/FPKB_SCHEMA_V1.md`](./FPKB_SCHEMA_V1.md) |
| Care Signal + Safe-Truth + ResusGPS field specifications | [`docs/EVENT_MODELS_V1.md`](./EVENT_MODELS_V1.md) |
| Fellowship automation rules, grace periods, launch gate | [`docs/FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md`](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md) |
| Micro-course portfolio, ADF map, tier pricing | [`docs/COURSE_PORTFOLIO_AND_ADF_STRATEGY.md`](./COURSE_PORTFOLIO_AND_ADF_STRATEGY.md) |
| Micro-course SKU catalog (24 named slots) | [`docs/MICRO_COURSE_CATALOG_BACKLOG.md`](./MICRO_COURSE_CATALOG_BACKLOG.md) |
| Hospital ERS / IERMS™ Standard v1.0 | [`docs/institutional/IERMS_STANDARD_V1.md`](./institutional/IERMS_STANDARD_V1.md) |
| IERMS™ 100-Point Audit Scorecard | [`docs/institutional/IERMS_AUDIT_SCORECARD_V1.md`](./institutional/IERMS_AUDIT_SCORECARD_V1.md) |
| IERMS™ 90-Day Implementation Suite | [`docs/institutional/IERMS_IMPLEMENTATION_SUITE.md`](./institutional/IERMS_IMPLEMENTATION_SUITE.md) |
| Hospital ERS institutional narrative | [`docs/INSTITUTIONAL_ERS_NARRATIVE.md`](./INSTITUTIONAL_ERS_NARRATIVE.md) |
| Care Signal strategy and implementation roadmap | [`docs/CARE_SIGNAL_STRATEGY_AND_ROADMAP.md`](./CARE_SIGNAL_STRATEGY_AND_ROADMAP.md) |
| Care Signal world-changing potential | [`docs/CARE_SIGNAL_WORLD_CHANGING_POTENTIAL.md`](./CARE_SIGNAL_WORLD_CHANGING_POTENTIAL.md) |
| Clinical origin narrative, LMIC context | [`docs/STRATEGIC_FOUNDATION.md`](./STRATEGIC_FOUNDATION.md) |
| Clinical protocols and ResusGPS pathway map | [`docs/clinical-protocols/README.md`](./clinical-protocols/README.md) |
| Clinical content governance (sign-off requirements) | [`docs/CLINICAL_CONTENT_GOVERNANCE.md`](./CLINICAL_CONTENT_GOVERNANCE.md) |
| Current work status (done / in-progress / blocked) | [`docs/WORK_STATUS.md`](./WORK_STATUS.md) |
| Maturity roadmap (6 phases, 15–18 months) | [`docs/MATURITY_ROADMAP.md`](./MATURITY_ROADMAP.md) |
| AI team workflow and git sync | [`docs/AI_TEAM_WORKFLOW.md`](./AI_TEAM_WORKFLOW.md) |
| Pre-merge engineering checklist | [`docs/ENGINEERING_ACCEPTANCE_CHECKLIST.md`](./ENGINEERING_ACCEPTANCE_CHECKLIST.md) |
| Legal suite index | [`docs/legal/LEGAL_IMPLEMENTATION_INDEX.md`](./legal/LEGAL_IMPLEMENTATION_INDEX.md) |
| Long-range aspirational material (not near-term commitments) | [`docs/archive/`](./archive/) |

---

*This document does not supersede the constitutional documents. It synthesises them. Conflicts between this synthesis and the constitutional documents are resolved in favour of the constitutional documents. Update this file whenever a constitutional document changes substantially.*
