# Platform source of truth

**Purpose:** Single canonical reference for **who Paeds Resus is**, **what we build**, **for whom**, **why**, and **how we decide** implementation details (auth, roles, reports, deployment, priorities). Any developer should be able to onboard from this file and the codebase without a separate sit-down—though clarifying questions are always welcome.

**Audience:** All developers (including Codex, Manus, Cursor), contractors, and anyone shipping code or product decisions.

**Constitutional hierarchy (read in this order):**

| Document | Question it answers |
|----------|-------------------|
| [NORTH_STAR_V2.md](./NORTH_STAR_V2.md) | **Why** does Paeds Resus exist? Mission, theory of change, institutional identity, financial strategy summary, account model. |
| [OBSERVATION_ARCHITECTURE_V1_1.md](./OBSERVATION_ARCHITECTURE_V1_1.md) | **How** does Paeds Resus learn? Observation model, shared classifiers, transformation pipeline, learning governance, Knowledge Stewardship. |
| **This file — PLATFORM_SOURCE_OF_TRUTH.md** | **What** does Paeds Resus build, for whom, and how? Binding technical and product decisions. |

**Conflict resolution:** Technical implementation questions → this file wins. Strategic direction questions → North Star v2.0 wins. Data architecture and learning governance → Observation Architecture v1.1 wins. Update the losing document to align; never silently diverge.

**Supporting engineering specifications (read for the relevant product):**

| Document | What it specifies |
|----------|------------------|
| [FPKB_SCHEMA_V1.md](./FPKB_SCHEMA_V1.md) | Complete database schema for the Failure Pattern Knowledge Base — 11 tables, indexes, migration sequence, seed data. |
| [EVENT_MODELS_V1.md](./EVENT_MODELS_V1.md) | Field-by-field observation specification for Care Signal v3, Safe-Truth v1, ResusGPS session record, and Fellowship competency record. |
| [FINANCIAL_STRATEGY_V1.md](./FINANCIAL_STRATEGY_V1.md) | Four-business revenue model, constitutional revenue principle, pricing, sequencing. |

**Strategic foundation (additional context):** [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md) — clinical origin narrative, LMIC context, Book of the Unforgotten. Does **not** override technical decisions in this file. **Long-range aspirational** scenarios live under [docs/archive/](./archive/) and are **not** near-term commitments.

**Operational CEO narrative:** [CEO_Platform_Update_And_Reply_To_AI_Team.md](./CEO_Platform_Update_And_Reply_To_AI_Team.md). If this file and the CEO brief ever conflict on **product or technical** decisions, **update this file to match the CEO’s stated decision**, then align the brief or note the change in [WORK_STATUS.md](./WORK_STATUS.md).

---

## 1. Who we are

| Term | Meaning |
|------|---------|
| **Paeds Resus** | The **organisation** and the **software platform** (one brand, multiple products). |
| **ResusGPS** | **One product** on the platform: real-time paediatric emergency **clinical guidance** (e.g. structured flows, protocols). It is **not** the name of the whole company or platform. |

**Non-negotiable naming rule:** Do **not** treat “Paeds Resus” and “ResusGPS” as the same thing. In code, docs, and UI: say **Paeds Resus** when you mean the organisation or the whole platform; say **ResusGPS** only when you mean that specific product.

---

## 2. Why we exist (mission)

**Mission (from leadership):** Contribute to a world where **no child dies from a preventable death**, by building a **sustainable, scalable** organisation that improves **paediatric resuscitation and emergency care**.

**Single problem, many levers:** The organisation exists to reduce **preventable childhood mortality and serious harm** in **resource-limited** settings **as efficiently and effectively as reality allows**. That requires **holistic** work—bedside tools, training, **institutional** process and capability, **measurement**, and **community-facing** insight—not a single product in isolation. Full framing: [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md).

**What that means for engineering:**

- We build **tools and training** that improve **readiness**, **decision-making**, and **access**—for **healthcare providers**, **institutions**, and **parents/guardians**—under one platform so capabilities are **connected**, not fragmented.
- We **support** clinical and educational judgment; we do **not** replace professional responsibility, local protocols, or licensing requirements. Features should be designed with **appropriate scope** (clear UX, disclaimers where product requires them, no overstated claims). **Clinical outcome claims** belong in **governed** evaluation—not in speculative marketing copy; see STRATEGIC_FOUNDATION §12.

---

## 3. What we do (offerings)

These are **first-class** parts of Paeds Resus. None of them should be implied to be “just an add-on” compared to ResusGPS.

| Offering | Role |
|----------|------|
| **ResusGPS** | Point-of-care **paediatric emergency guidance** (e.g. ABCDE-style flows, protocols, interventions). |
| **Courses** | Professional training paths such as **BLS (6 hours), ACLS (16 hours), PALS (16 hours), Heartsaver, NRP**, the **Instructor Course** (train-the-trainer), **short condition-focused modules** (micro-courses, often under a **clinical learning journey** umbrella—see [§15.5](#155-clinical-learning-journey-and-ward-excellence-adf-alignment)) aligned with ResusGPS, and related enrollment and certification flows tied to the `enrollments` / `certificates` model. **Go-to-market emphasis** for individuals: see [§15](#15-business-strategy-market-context-and-revenue-focus-leadership). |
| **Paeds Resus Fellowship** | The canonical name for the **narrative and progression umbrella** for advanced ward-focused learning (micro-courses ladder + optional legacy certifications); **not** a separate paywall—learners pay per course/SKU. Completion of the three pillars (Courses, ResusGPS, Care Signal) earns the title **Paeds Resus Fellow**. |
| **Safe-Truth** | **Parent and guardian** resources and truth-sharing flows (distinct audience and tone from ResusGPS). **Not** the staff monthly reporting channel for the **Paeds Resus Fellowship** — see **Care Signal**. **Requires no account or login** — accessible via direct URL or QR code; this is non-negotiable per [OBSERVATION_ARCHITECTURE_V1_1.md](./OBSERVATION_ARCHITECTURE_V1_1.md) §3.3 and §5.4. **Current implementation gap (P0):** Safe-Truth is currently behind authentication and must be migrated to accountless submission. Redesigned journey-stage form (vs retrospective questionnaire) specified in [EVENT_MODELS_V1.md](./EVENT_MODELS_V1.md) §2. |
| **Care Signal** | **Provider-facing** incident and near-miss reporting (QI culture); **distinct product name from Safe-Truth** in all user-facing copy. Drives the **automated** **Paeds Resus Fellowship** **monthly discipline** pillar alongside courses and ResusGPS — see [§17](#17-fellowship-qualification-provider-profile-and-internal-operational-intelligence-non-public). |
| **Institutional (Hospital ERS)** | **Hospital Emergency Readiness System (ERS)** with **paediatric priority** — hospital-wide nurse-led ERT 24/7, ResusGPS, Care Signal QI, institutional dashboard, readiness audits, and AHA-aligned training mesh. **Not** generic bulk certification. Canonical definition: [§24](#24-institutional-emergency-readiness-ers). |
| **Admin** | **Platform owner** visibility: users, enrollments, certificates, Safe-Truth (parent) usage, **Care Signal** metrics when instrumented, analytics, operational tools—see [§8](#8-admin-reports-definitions). |

**Future products** may be added; they should follow the same pattern: named explicitly, integrated into auth and analytics—not bolted on as unnamed “other.”

**Course portfolio & ADF strategy (BLS/ACLS/PALS, micro-courses, fellowship vision, MECE map):** [COURSE_PORTFOLIO_AND_ADF_STRATEGY.md](./COURSE_PORTFOLIO_AND_ADF_STRATEGY.md). **24-slot ADF micro-course catalog backlog (named placeholders):** [MICRO_COURSE_CATALOG_BACKLOG.md](./MICRO_COURSE_CATALOG_BACKLOG.md). **Fellowship qualification, provider profile gate, internal intelligence (non-public):** [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md) — canonical detail in **[§17](#17-fellowship-qualification-provider-profile-and-internal-operational-intelligence-non-public)**.

---

## 4. To whom we deliver (audiences and jobs-to-be-done)

| Audience | Primary need from Paeds Resus |
|----------|--------------------------------|
| **Healthcare providers (individual)** | Fast, credible **bedside** support (ResusGPS) and **professional learning** (courses, fellowship) from one account. |
| **Parents / guardians** | Trustworthy **non-clinical** or **appropriately scoped** guidance and participation (Safe-Truth)—**not** the same UX as ResusGPS unless we explicitly design a bridge. |
| **Institutions** | **Deploy** training, see **adoption** and **cohorts**, manage **staff** and **schedules** where the product supports it. |
| **Platform admin (owner)** | **Truthful reports**, auditability, and tools to run the business without metric drift. |

**User model (summary — v2.0, migration required):** Two actor types replace the previous three-way `userType` ENUM. **Individual Actor** (providers, students, instructors, trainees) and **Organisation Actor** (hospitals, schools, NGOs, ministries). Safe-Truth requires **no account** — accessible via direct URL or QR code without any login. See [EVENT_MODELS_V1.md](./EVENT_MODELS_V1.md) §2.2 and [OBSERVATION_ARCHITECTURE_V1_1.md](./OBSERVATION_ARCHITECTURE_V1_1.md) §5.4 for the full specification.

**Migration required:** The current `userType` ENUM (`individual` | `parent` | `institutional`) must be migrated to the new model. The `parent` type is retired — Safe-Truth submissions require no account. This is a P0 schema change. Log in WORK_STATUS.md when applied. Until migration is complete, existing routing behaviour is preserved; do **not** reintroduce a hard single-role lock.

---

## 5. How the product is organised (surfaces)

High-level map (routes may evolve; check the codebase if in doubt):

| Surface | Purpose |
|---------|---------|
| **ResusGPS** | Core provider emergency guidance (e.g. `/` and related flows). |
| **Provider hub** | `/home` — dashboard: ResusGPS, enroll in courses, learning, links to act as institution or parent. |
| **Instructor portal** | `/instructor-portal` — instructor journey status, **My assignments** (B2B sessions), resources placeholder; gated on certification + platform approval for full teaching access. |
| **Parent / guardian** | `/parent-safe-truth` — Safe-Truth and parent-facing resources. |
| **Institution** | Hospital admin institutional dashboards (canonical route: `/hospital-admin-dashboard`; legacy `/institutional-portal` may redirect) — institutional metrics and management. |
| **Admin** | `/admin` — reports, insights, advanced tools; **admin** access is governed by [§7](#7-auth-and-roles). |

### Admin (platform owner)

**Who:** Users with **`role === 'admin'`** in the database — typically granted when **`openId`** matches **`OWNER_OPEN_ID`** at auth/upsert ([§7](#7-auth-and-roles)). This is **Paeds Resus platform** administration, **not** the same persona as **institutional / hospital** staff (who use **`/hospital-admin-dashboard`** for their facility).

**Primary entry:** **`/admin`** (Admin hub). Typical destinations include **`/admin/reports`** (canonical definitions [§8](#8-admin-reports-definitions)), M-Pesa reconciliation, Care Signal review queue, national signal, capstone grading, course administration, and advanced analytics surfaces linked from the hub.

**Internal KPI (optional ops view):** **`/kaizen-dashboard`** — DB-backed daily/weekly registration, enrollment, revenue, and certificate metrics vs internal targets (**admin-only** route). It supports **founder/ops** visibility; it is **not** a clinical product and must remain **gated** to platform admins.

**Instrumentation:** Admin “last 7 days” / product activity counts rely on **`analyticsEvents`** ([§8](#8-admin-reports-definitions)). Product teams must emit events through the **standard** **`events.trackEvent`** path—no duplicate KPI tables for the same metric.

**Audit & accountability:** As the **security baseline** matures ([§11](#11-security-current-and-target)), sensitive admin actions should be **traceable** (e.g. **`adminAuditLog`** + structured procedure identifiers). Scope expands as leadership locks requirements.

---

## 6. Technical stack and deployment (facts)

- **Frontend:** React, Vite, tRPC client, routing (e.g. wouter).
- **Backend:** Node, Express, tRPC.
- **Database:** MySQL (e.g. Aiven); schema and migrations via **Drizzle**.
- **Deployment:** e.g. Render (app) + managed MySQL; env vars per `.env.example` (secrets not committed).
- **Auth:** Cookie-based session with JWT; email/password only ([§7](#7-auth-and-roles)).

When you propose changes, assume this stack unless leadership explicitly changes it.

---

## 7. Auth and roles

| Topic | Decision |
|-------|----------|
| **Auth** | **Email + password only.** No OAuth. |
| **User types (DB) — migration pending** | Current: `individual` \| `parent` \| `institutional`. **Target (P0 migration):** `individual_actor` \| `organisation_actor`. The `parent` type is being retired — Safe-Truth requires no account. Do not build new features against the `parent` userType. See [OBSERVATION_ARCHITECTURE_V1_1.md](./OBSERVATION_ARCHITECTURE_V1_1.md) §5.4. |
| **UI switch** | Any logged-in user may choose **Provider / Institution** in the UI post-migration. That choice is **not** persisted as a second `userType`; only **default** `userType` is stored for **post-login redirect**. |
| **Admin** | `role === 'admin'` in the DB. Admin is **granted** when `openId === OWNER_OPEN_ID` at auth/upsert; **authorisation checks** use `ctx.user.role === 'admin'`. No admin by ad-hoc DB edits. |
| **Post-login redirect** | By **default `userType` only:** `individual` → `/home`, `parent` → `/parent-safe-truth`, `institutional` → `/hospital-admin-dashboard` (legacy `/institutional-portal` may redirect). **No** "last-used role" persisted in DB yet. |
| **Institutional continuity** | Organisation Actor accounts belong to the institution, not the creating individual. **Minimum two named admin contacts required.** Recovery via institutional identity verification (facility letterhead, MoH registration number) — **not** personal credential reset. See [OBSERVATION_ARCHITECTURE_V1_1.md](./OBSERVATION_ARCHITECTURE_V1_1.md) §5.4. Not yet implemented — **P1**. |
| **Provider cadre** | Mandatory profile field on individual accounts: Community Health Worker \| Enrolled Nurse \| Registered Nurse \| Clinical Officer (Diploma) \| Clinical Officer (Degree) \| Medical Officer \| Paediatrician \| Other Specialist \| Nursing Student \| Medical Student \| Other Trainee. Full list: [EVENT_MODELS_V1.md](./EVENT_MODELS_V1.md) §1.3. Not yet implemented — **P1**. |
| **Fellowship pseudonymous token** | A provider may submit Care Signal anonymously while retaining Fellowship credit via a device-bound pseudonymous token, separate from named identity. See [OBSERVATION_ARCHITECTURE_V1_1.md](./OBSERVATION_ARCHITECTURE_V1_1.md) §5.5. Not yet implemented — **P1**. |

---

## 8. Admin reports (definitions)

These definitions are **locked** for implementation and reporting UI. Use **EAT** for calendar-month boundaries.

| Term | Definition |
|------|------------|
| **This month** | **Calendar month** in **EAT (East Africa Time, UTC+3).** Month start/end for reports are computed in EAT. |
| **Last 7 days** | **Rolling** 7×24 hours from “now” (not calendar week). |
| **Safe-Truth usage (this month)** | Count of rows in **`parentSafeTruthSubmissions`** with `createdAt` in the report month (EAT). **One row = one submission.** |
| **Product / app activity (last 7 days)** | Count of rows in **`analyticsEvents`** with `createdAt` in the last 7 days. **One row = one event.** Instrumentation must go through the **standard** analytics path—no parallel ad-hoc tables for the same KPI. |
| **`active_paying_providers_30d`** | Count of **distinct** `users.id` where `userType = individual` and the user has at least one **completed** payment in the rolling last **30×24 hours** — union of `payments.status = completed` and `microCourseEnrollments.paymentStatus = completed`. **Growth KPI only** — never combine with Care Signal or Safe-Truth metrics ([§18.3](#183-locked-growth-kpi-model-provider-lane)). |

### 8.1 Global shared classifiers (binding across all observation tables)

Per [OBSERVATION_ARCHITECTURE_V1_1.md](./OBSERVATION_ARCHITECTURE_V1_1.md) §5.1 and [EVENT_MODELS_V1.md](./EVENT_MODELS_V1.md) §5, the following fields and ENUM values are **binding identically** across `careSignalEvents`, `parentSafeTruthSubmissions`, `resusGPSCases`, and any future observation table. Divergent enumeration values between tables make pattern triangulation impossible — this is a P0 schema discipline rule, not a style preference.

| Classifier | Replaces | Migration status |
|------------|---------|------------------|
| `country` (ISO 3166-1 alpha-2) | N/A — new field | **Not started.** Required for global expansion. |
| `admin_level_1` | `facility_county` (Kenya-only) | **Not started.** Country-specific division loaded from a reference table, never hardcoded. |
| `facility_id` (UUID, internal, never public) | Inline facility name strings | **Partial** — `facilityId` added via migration 0038 (applied 2026-05-01) to `careSignalEvents` only. Not yet on `parentSafeTruthSubmissions` or `resusGPSCases`. |
| `facility_level`, `facility_ownership` | N/A — new fields | **Not started.** |
| `child_age_band`, `condition_category`, `outcome_category` | Ad-hoc free text / partial ENUMs | **Not started.** Canonical ENUM values: [EVENT_MODELS_V1.md](./EVENT_MODELS_V1.md) §5. |
| `schema_version` | N/A — new field | **Not started.** Required before any FPKB pattern linkage is possible. |
| `role_at_time_of_event` | N/A — new field, distinct from `provider_cadre` profile field | **Not started.** |

**Non-negotiable rule:** Never embed a `pattern_id` or `recommendation_id` as a foreign key on these observation tables. The Failure Pattern Knowledge Base ([FPKB_SCHEMA_V1.md](./FPKB_SCHEMA_V1.md)) references observations; observations never reference the FPKB. This preserves observation immutability.

---

## 9. Course funnel (data meaning)

- **Applied / enrolled:** A row in **`enrollments`** = one application. Authoritative fields include `createdAt`, `programType` (`bls` \| `acls` \| `pals` \| `fellowship` \| `instructor`), `paymentStatus`, etc. There is **no** strict enforced state machine in code yet; metrics are **counts by date** unless we add a formal funnel later.
- **Certified:** A row in **`certificates`** = one certificate. Authoritative fields include `issueDate`, `programType`.
- **Certification Strategy (Incentives):** To maintain high learner motivation and clinical rigor, certificates are issued for **every** successfully completed micro-course, every AHA course (BLS, ACLS, PALS), and finally the **Fellowship Diploma** upon graduation. Certificates must be verifiable and downloadable on-demand from the provider dashboard.
- **Instructor journey:** Completing the **Instructor Course** (`programType` = `instructor`) issues a certificate and sets **`users.instructorNumber`** + **`users.instructorCertifiedAt`**. **B2B teaching** on institutional schedules still requires **`users.instructorApprovedAt`** (platform admin under Admin → Reports) so hospitals only assign certified, approved instructors.

---

## 10. Deployment and infrastructure

| Topic | Decision |
|-------|----------|
| **Current** | **Single production** environment (e.g. Render + Aiven). **Target:** branch-based staging before production — see [STAGING_BRANCH_SETUP.md](./STAGING_BRANCH_SETUP.md), [STAGING_VERIFICATION_CHECKLIST.md](./STAGING_VERIFICATION_CHECKLIST.md), [STAGING_DEPLOYMENT.md](./STAGING_DEPLOYMENT.md). Until a dedicated staging URL is live, use the checklist discipline on pre-production verification. |
| **When staging is live** | **Branch-based:** changes land on `develop` → **staging**; `main` → **production**. PRs verified on **staging** before production. |
| **Domain** | **`paedsresus.com`** → **301 redirect** to **`www.paedsresus.com`** (canonical). Render/DNS may also enforce this at the edge; Express middleware in `server/_core/canonical-domain.ts` redirects apex host requests when traffic reaches the app (requires `TRUST_PROXY=true` behind a reverse proxy). |

---

## 11. Security (current and target)

| Topic | Status |
|-------|--------|
| **Password** | Minimum **8 characters** (enforced). Further complexity rules **TBD**. |
| **Session** | Configurable via **`SESSION_MAX_AGE_MS`** (`.env.example` recommends **30 minutes** for new production). If unset, legacy default ~**1 year**; sliding expiry / refresh **TBD**. |
| **Audit** | Admin audit logging is part of the **security baseline** direction; scope **TBD** beyond current implementation. |
| **Compliance** | **Legal suite v1.0.0** shipped (`docs/legal/`, consent flows, `/privacy`, `/terms`, DSAR). Kenya DPA alignment draft — **counsel sign-off pending** (ODPC registration placeholder). See [LEGAL_IMPLEMENTATION_INDEX.md](./legal/LEGAL_IMPLEMENTATION_INDEX.md), [LEGAL_PLATFORM_STRUCTURES.md](./LEGAL_PLATFORM_STRUCTURES.md). |

---

## 12. Priority order (locked)

Work should generally align with this **sequenced** priority unless the CEO explicitly reprioritises and updates this file:

0. **Care Signal v3 + Safe-Truth accountless migration (current focus, per [WORK_STATUS.md](./WORK_STATUS.md)):** Full field specification in [EVENT_MODELS_V1.md](./EVENT_MODELS_V1.md) §1–2. This is the instrument that makes the Adaptive Learning System real — see [OBSERVATION_ARCHITECTURE_V1_1.md](./OBSERVATION_ARCHITECTURE_V1_1.md). Care Signal v3 is not shipped until the post-submission feedback loop (gap analysis + dynamic recommendations) is live, not stubbed.
1. **Analytics instrumentation:** ResusGPS and other products emit events to **`analyticsEvents`**; admin reports show **real** product activity (not zeros).
2. **Staging:** `develop` → staging, `main` → production; PR verification on staging before production.
3. **Security baseline:** Password complexity, session max age, audit logging for admin (as specified when locked).
4. **ResusGPS v4:** Undo, medication dedup, multi-diagnosis, structured age, countdown timers, dose rationale.
5. **Failure Pattern Knowledge Base (FPKB) migrations:** Per [FPKB_SCHEMA_V1.md](./FPKB_SCHEMA_V1.md) — 12-migration sequence, taxonomy seed data (28 failure modes, 10 success factors). Sequenced after Care Signal v3 ships so there is real data to populate it.
6. **Failure Pattern Atlas (minimal UI):** Public-facing view of FPKB patterns with observation count, country count, confidence level, status. Starts empty; fills as Care Signal v3 data arrives.

**Maturity sequencing:** Platform-wide gap closure (staging, fellowship §11 gate, holistic loop, institutional systems) is tracked in [MATURITY_ROADMAP.md](./MATURITY_ROADMAP.md) — six phases over 15–18 months; Phase 1 engineering/governance foundation runs in parallel with §12 items above where safe.

**Institutional lane (parallel, CEO-led):** Hospital **ERS** pilots, MOU signing, and institutional GTM are **not** blocked on §12 item 4 but must align with [§24](#24-institutional-emergency-readiness-ers) — readiness systems first, not bulk PALS seats. Engineering surfaces (institutional dashboard, facility QI) follow [MATURITY_ROADMAP.md](./MATURITY_ROADMAP.md) Phase 4–5.

**Deliberately postponed (do not pursue until prerequisites are met):** Accreditation (requires mature FPKB and credible audit methodology — see [FINANCIAL_STRATEGY_V1.md](./FINANCIAL_STRATEGY_V1.md) §7.2); Learning Network intelligence licensing (requires data density — 3+ countries, 1,000+ observations); Adaptive AI / automated pattern detection (requires demonstrated human observation quality first). Pursuing these early produces unsubstantiated claims and erodes trust.

---

## 13. How developers should work (guardrails)

### 13.1 ResusGPS zero-ambiguity clinical UX (locked)

**ResusGPS** bedside flows must eliminate ambiguous bulk actions. **Lives depend on structured capture**; LMIC **Not available** per field is policy data, not a shortcut.

| Phase | Gating |
|-------|--------|
| Primary survey (XABCDE) | Objective vitals with **abnormal highlighting during input** (HR, RR, BP, SpO₂, temp, glucose mmol/L) |
| Secondary survey | **SAMPLE + structured symptoms** — each field/value or Not available — **before** differential diagnosis |
| Diagnostic evidence | Condition-specific labs (e.g. DKA: ketones, pH, HCO₃, HbA1c) — each value or Not available — **before** definitive care |
| Fluid bolus reassessment | Overload signs and perfusion parameters — **each submitted individually** after bolus |
| Definitive care | Step-by-step confirmation; **no bulk skip** on management checklists |

Implementation: `shared/clinical-evidence.ts`, `shared/fellowship-clinical-rigor.ts`, `shared/secondary-survey-gating.ts`. **DKA** is the gold template; all **15 fellowship ResusGPS conditions** use the same rigor pattern.

- **Extend, don’t replace:** New features should plug into existing **routes**, **tRPC** procedures, **admin reports**, and **event tracking** unless there is a deliberate architectural decision.
- **Preserve the user model:** No **single-role lock**; preserve **multi-context switching** in the UI.
- **Preserve report definitions:** **This month** = EAT calendar month; **last 7 days** = rolling; **Safe-Truth** and **analyticsEvents** meanings as in [§8](#8-admin-reports-definitions).
- **Secrets:** No hardcoded credentials; use env vars and document in `.env.example` when adding new ones.
- **Clinical pathways:** Track bedside-critical logic in [CLINICAL_SAFETY_REGISTER.md](./CLINICAL_SAFETY_REGISTER.md) (owners, sources, test pointers).
- **Clinical teaching content (micro-courses, ResusGPS spine):** Follow [CLINICAL_CONTENT_GOVERNANCE.md](./CLINICAL_CONTENT_GOVERNANCE.md) — authority, conflict presentation, pedagogy, summative exam model; CEO sign-off before material teaching changes.
- **Execution sequencing:** Ship work in the order of [§12](#12-priority-order-locked). Phased tasks, exit criteria, and any **staged trade-offs** (e.g. session length vs default cookie behaviour) are expanded in [FIVE_PILLAR_EXECUTION_ROADMAP.md](./FIVE_PILLAR_EXECUTION_ROADMAP.md). Operational staging checklist (while [§10](#10-deployment-and-infrastructure) still reflects single production): [STAGING_BRANCH_SETUP.md](./STAGING_BRANCH_SETUP.md). Session max age and staging/release notes for operators: [DEPLOYMENT_SESSION_AND_STAGING.md](./DEPLOYMENT_SESSION_AND_STAGING.md). Engineering discipline until fully locked in [§11](#11-security-current-and-target): [ENGINEERING_GOVERNANCE_CHECKLIST.md](./ENGINEERING_GOVERNANCE_CHECKLIST.md).

---

## 14. Changing this document

- Any change to **canonical decisions** (auth, metrics definitions, priorities, brand rules) belongs **here** first.
- Updates to **[§15](#15-business-strategy-market-context-and-revenue-focus-leadership)** (business strategy and market framing) should be **leadership-driven** and noted in [WORK_STATUS.md](./WORK_STATUS.md).
- After substantive edits, note the change in [WORK_STATUS.md](./WORK_STATUS.md) (who, what, date, commit).

---

## 15. Business strategy, market context, and revenue focus (leadership)

This section records **why** product and pricing choices lean the way they do. It does **not** replace [§12](#12-priority-order-locked) engineering priorities until leadership explicitly updates that list; it **aligns** product meaning (ResusGPS, courses, institutions) with mission and market reality. Deeper narrative: [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md).

### 15.1 Market reality (Kenya and similar LMIC contexts)

- **Individual BLS/ACLS/PALS demand** is often tied to **job search** and gatekeeping for employment. Once a provider is hired, **renewal motivation** can fall unless employers or regulators require it.
- **Hospitals** may not prioritize certifying all staff when **no accrediting or regulatory body** mandates BLS/ACLS for every role. That weakens both **direct-to-learner** course marketing and **institutional bulk certification** as the primary growth engine.
- **Traditional long programmes** (e.g. full PALS in many hours) are **expensive** and cognitively heavy; many who pass remain **under-prepared for real emergencies** they meet on shift.

These constraints are **environmental**, not a failure of clinical education—they shape what Paeds Resus optimises for.

### 15.2 Core product thesis (what we double down on)

- **ResusGPS** is the differentiated bedside product: **structured guidance** from first contact (triage / primary survey) through assessment, problem identification, interventions, reassessment, and **cardiac arrest**—so children receive **more standardised** care regardless of who is on shift.
- **Training** should reinforce the **same mental model** (e.g. ABCDE) and connect emotionally to **cases providers actually see**. **Short, condition-focused modules** (e.g. shock, DKA, asthma escalation)—paired with ResusGPS—can deliver **tangible impact** faster than only selling long generic certifications.
- **Low price points at scale** (marginal cost of delivery is low: no halls, no per-head meals) are intentional: **volume + accessibility** advance the mission; **unit economics** must still be tracked in admin and analytics.

### 15.3 Offerings and revenue emphasis (near-term)

| Lane | Role | Notes |
|------|------|--------|
| **ResusGPS + micro-courses** | **Primary scale path for individuals** | Condition-focused courses as SKUs; ResusGPS as the ongoing tool. Pricing and catalog evolve; `programType` / course metadata in data should distinguish **short modules** from legacy **BLS/ACLS/PALS** where needed. |
| **Legacy professional courses** (BLS, ACLS, PALS, Instructor, fellowship) | **Retained** | Still first-class; not deprecated. They serve employers, careers, and pathways that require them. |
| **Institutions (Hospital ERS)** | **Readiness systems first** — not bulk PALS seats | Hospitals buy **ERS design**, ERT workflows, ResusGPS + Care Signal deployment, readiness audits, and institutional dashboard — with **AHA-aligned training mesh** as a **supporting layer**. Staff may still buy individual courses for employment; the **hospital** must receive **system value**, not only portable certs. Full framing: [§24](#24-institutional-emergency-readiness-ers). |
| **Long-range institutional signal** | **Aspirational, governed** | A credible **readiness or quality signal** (for parents, insurers, partners) requires **governance**, methodology, and honest metrics—not marketing claims. Document as future when criteria exist. |

### 15.4 What this implies for builders

- **Analytics:** Course and ResusGPS journeys must remain measurable ([§8](#8-admin-reports-definitions), [§9](#9-course-funnel-data-meaning)) so leadership can see **which SKUs and flows** drive impact and revenue.
- **Clinical and ethical guardrails unchanged:** [§2](#2-why-we-exist-mission); no overstated outcome claims in product copy; evaluation where claims are made.
- **Naming:** ResusGPS remains **one product** ([§1](#1-who-we-are)); “Paeds Resus” remains the organisation/platform.

### 15.5 Clinical learning journey and ward excellence (ADF alignment)

This locks **how** we integrate the **Advanced Deterioration Fellowship (ADF)** *ideas* into Paeds Resus **without** importing operational baggage that conflicts with a **digital-first, low-friction** product.

**Keep from ADF (clinical and educational intent):**

- **Narrow ward-level focus:** early recognition of deterioration, **first-hour** safe actions, structured **escalation**, honest **scope** (not ICU substitution).
- **Delay-reduction mindset:** abnormal sign → recognition → intervention → escalation, with lightweight documentation where the product supports it (ResusGPS, logs, future dashboards).
- **LMIC-realistic framing:** oxygen, staffing, and senior review constraints; teach **safe action despite scarcity**.

**Do not ship as mandatory in v1 (unless leadership explicitly reintroduces):**

- Application fees, selective admissions interviews, large upfront “fellowship fees,” or required face-to-face blocks for the **default** individual journey.
- Claims of “fellow” or tier titles **until** **fully automated** checks exist per **[§17](#17-fellowship-qualification-provider-profile-and-internal-operational-intelligence-non-public)** — **no** manual conferral; see [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md) §11 launch gate.

**Product shape:**

- **Micro-courses** (e.g. Paediatric Septic Shock I) sit **inside** a **progressive journey** narrative—optional naming: clinical journey, track, or fellowship pathway; **SKU pricing remains per course**, not a bundled fellowship price by default.
- **Legacy BLS / ACLS / PALS** hours (**6 / 16 / 16**) remain first-class certifications alongside the journey.
- **Future:** optional Level 2/3 labels (stabilisation, systems) only when curriculum and governance exist; align with [§16.3](#163-tiered-courses-per-clinical-topic-naming-and-gating).

---

## 16. Learning products: UX, certificates, tiered courses, pedagogy, and ResusGPS alignment

This section locks **product behaviour and editorial intent** for **condition-focused micro-courses**, **certificates**, and **ResusGPS** so implementations stay consistent across releases.

### 16.1 Theme and visual consistency

- **Brand:** Paeds Resus UI and downloadable certificates use the same **teal** (`#1B3D3D` / primary) and **orange** (`#F37021` / accent) language as the rest of the platform—see global CSS tokens and shared components (`Button` `variant="cta"`, `brand-surface`, etc.).
- **Courses / learning surfaces** should not introduce a separate visual system: reuse cards, borders, typography, and spacing patterns from high-traffic pages (e.g. learner dashboard, enroll, payment success).
- **Certificates (PDF):** Landscape layout, teal/orange framing, **brand mark** (`client/public/paeds-resus-certificate-logo.png` preferred, then `paeds-resus-logo-brand.png` or `paeds-resus-logo.png`) embedded when the file is available at runtime. **Header tagline** under “PAEDS RESUS” is **neutral** (clinical training / paediatric emergency care)—not fellowship- or Safe-Truth–specific. PNGs that **already have alpha** are embedded **without** knock-out processing; otherwise near-black pixels are made transparent so legacy raster marks blend on cream paper. When **`courseDisplayName`** is set on the enrolment/certificate payload (e.g. micro-course title), the **body completion sentence** uses that name instead of the generic PALS/BLS paragraph for the same `programType`. A **QR code** appears bottom-right, encoding **`https://www.paedsresus.com/verify?code={verificationCode}`** (canonical domain per [§10](#10-deployment-and-infrastructure)); the public **`/verify`** page confirms authenticity via `certificates.verifyByCode`. Printed copy also includes the verification URL in text. **Issuance** (`saveCertificate` / DB row creation) and **on-demand download** must both use this **same branded** PDF generator so stored files match what learners download.

### 16.2 Course learning UX (linear flow)

For each enrolment, the learner should experience a **clear linear path**:

1. **Module content** → **Module quiz** → **Immediate score** (numeric % and pass threshold).
2. **On pass:** Primary CTA **Continue to next module** (next module in course order). **Do not** force “back to module list” as the only path forward.
3. **On fail:** Clear retry path; module not marked complete until pass (or policy-defined completion—currently tied to quiz pass in learning router).
4. **After the final module is passed:** A **primary CTA toward the certificate** (e.g. link to learner dashboard **My Certificates** section with anchor `#my-certificates`), comparable in clarity to the post–M-Pesa “what happens next” flow.

### 16.3 Tiered courses per clinical topic (naming and gating)

- **Pattern:** For major topics (e.g. paediatric septic shock, asthma, convulsive status epilepticus, anaphylaxis), we plan **two course tiers** on the same theme:
  - **Course I** — foundational recognition, first-hour actions, safe escalation, and **when to refer** (reasons such as need for vasoactive drugs, advanced monitoring, refractory shock, refractory seizures, etc., without turning the course into a tertiary-only manual).
  - **Course II** — deeper management (e.g. fluid-refractory / catecholamine-refractory shock, second-line therapies, advanced airway, mechanical support where applicable). **Do not** label tiers in the UI as “primary vs tertiary”; describe them as **progression** (“after completing … I, optional … II for …”).
- **Prerequisite:** Enrolment in **Course II** requires **Course I completed and passed** (quiz threshold met) for that topic. Same pattern for future pairs (e.g. refractory vs super-refractory status).
- **Pipeline:** Additional tiers (e.g. **Course III** for mechanical circulatory support or ultra-specialised rescue therapies) are **aspirational** until explicitly scheduled; document here when launched.

### 16.4 Pricing rule for tier pairs

- **Course II** list price = **1.5 × Course I** (50% more) for the **same topic line**, unless leadership documents an exception in this file.
- **Implementation:** Express via catalog / `pricingSku` / metadata—not ad-hoc UI-only numbers.

### 16.5 Editorial and pedagogy (LMIC-safe, policy-first)

- **Local policy first:** Every clinical module must remind learners to follow **facility protocol**, senior decision-making, and formulary. Paeds Resus teaches **principles** and **structured thinking**, not a substitute for hospital policy.
- **International guidelines as orientation:** Where evidence and consensus exist, be **specific enough to be useful** (e.g. preference for **balanced crystalloids** over normal saline in many resuscitation contexts; **saline remains acceptable** where that is all that is available; avoid over-emphasising **colloids** as first-line plasma expanders). Name common pragmatic choices (e.g. **Ringer’s lactate** where affordable and stocked vs balanced solutions with different brand names).
- **Regional evidence:** Where landmark trials from similar settings exist (e.g. **FEAST**-informed caution on fluid strategy in certain presentations), relate them to **actionable bedside steps** (small boluses, reassess, stop if overload, escalate)—including **plain-language explanations for nurses** (what “shock” means in observable terms: perfusion, pulse, CRT, breathing, responsiveness).
- **Small facilities:** Acknowledge **dispensary / clinic / health centre** contexts where one clinician may combine roles; avoid assuming a separate resuscitation team or full ICU infrastructure.
- **ResusGPS:** Learners who have **completed the relevant course** should be guided to use ResusGPS **with tighter alignment** to the course mental model than naive first-time users. Product direction: **in-course orientation** (how to open the right pathway, use dose tools, and reassessment prompts) and, over time, **differentiated prompts or badges** tied to completion (implementation may evolve; the intent is captured here).

### 16.6 Certificates dashboard behaviour

- **Download:** Only the **row being downloaded** shows a loading state; other certificate rows remain idle.

### 16.7 Current execution focus (rolling)

- **Now:** **Paediatric Septic Shock I** (micro-course content quality, flow, certificate CTA, ResusGPS orientation copy).
- **Pipeline (not blocking I):** Paediatric Septic Shock II, tier pairs for asthma, CSE, anaphylaxis, etc., per §16.3–16.4.

---

### 17. The Paeds Resus Fellowship — automated qualification, discipline, and QI culture (non-public)

**PSoT short title:** *Paeds Resus Fellowship rules, Care Signal, cumulative progress, and governance.*  
**Canonical detail (automation-only, grace rules, launch checklist, accredited facilities policy):** [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md).

### 17.1 Principles

- **Paeds Resus Fellow** status is **100% automated** from platform data — **no** manual conferral in v1. If automation is incomplete, **do not** ship Fellow UI.
- **No fellowship surcharge** — pay **per course/micro-course**; the **Paeds Resus Fellowship** is **earned** through courses, **ResusGPS**, **Care Signal**, and **course feedback** (instrumented).
- **Parent Safe-Truth** and **Care Signal** are **different products** — never use “Safe-Truth” for **staff** flows in user-facing copy ([§3](#3-what-we-do-offerings)).

### 17.2 Three pillars (all required)

1. **Courses:** **Every** active ADF micro-course — completion from **DB** (`certificates` / completion rules). **Note:** BLS, ACLS, PALS are **optional, standalone** offerings (see [§3](#3-what-we-do-offerings)); they are **not** required for Fellowship qualification.
2. **ResusGPS:** **≥3** attributable cases **per taught condition**, with **server-side** depth rules (anti-gaming).
3. **Care Signal:** **24 consecutive qualifying months** of monthly reporting (EAT), with **grace / catch-up / reset** per linked doc §7 — **not** parent Safe-Truth submissions. Completion of all three pillars earns the title **Paeds Resus Fellow**.

### 17.3 Grace (automated)

- **Normal month requirement:** **≥1** eligible Care Signal event (ensures engagement without excessive burden).
- **Grace periods:** **≤2 per calendar year** (EAT). After a **0-event month** using a grace, the **next month** must have **≥3** eligible staff events (catch-up enforcement). **≤1 additional grace** in the same year after a successful catch-up (total **≤2**/year). **Third** failure mode per linked doc → **pillar C streak resets to zero**; pillars A and B **do not** reset.
- **Rationale:** ≥1 event/month ensures commitment; ≥3 for catch-up ensures accountability after grace is used.

### 17.4 Cumulative UX

- **One** learner-facing view of **distance to Paeds Resus Fellow** (courses %, ResusGPS checklist, staff streak).

### 17.5 Profile and contact

- **Required** for Paeds Resus Fellowship enrollment: cadre, facility, department, country, region, town.
- **Email / mobile** for **optional** future programmes (e.g. small groups) — **separate consent** per purpose.

### 17.6 Public facilities

- **No public performance rankings** of facilities until governance approves methodology.
- **Future:** **Paeds Resus accredited facilities** list (readiness-based, **binary** accreditation — trust signal, not ordinal league table); disclaimers required.

### 17.7 Launch gate

- Ship **Paeds Resus Fellow** title and fellowship progress **only** after [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md) **§11** checklist passes (automation, UX, legal, security).

### 17.8 Builders

- Implement **Care Signal** as first-class data model + APIs; wire **analyticsEvents** / admin as needed; **never** mix parent `parentSafeTruthSubmissions` KPIs with staff fellowship metrics.

---

## 18. Conversion and recurring revenue execution model (provider)

This section defines how growth execution integrates with PSoT without diluting canonical decisions.

### 18.1 Scope and companion plan

- **Canonical execution plan:** [CONVERSION_90_DAY_EXECUTION_PLAN.md](./CONVERSION_90_DAY_EXECUTION_PLAN.md).
- The companion plan is **execution-time** (owners, experiments, weekly tasks, expected uplift), not a replacement for platform definitions in this file.

### 18.2 Governance and precedence

- If the companion plan conflicts with this file on **identity, auth, role model, KPI definitions, report windows, or priorities**, **this file wins**.
- Any experiment that changes canonical definitions must first update this file and be logged in [WORK_STATUS.md](./WORK_STATUS.md).
- Weekly execution updates belong in [WORK_STATUS.md](./WORK_STATUS.md), not in this file.

### 18.3 Locked growth KPI model (provider lane)

- **North-star:** `active_paying_providers_30d`.
- **Retention:** renewal rate (30/60/90-day cohorts) and second-purchase rate (within 30 days).
- **Conversion funnel (minimum):** visitor -> signup -> provider selection -> enroll click -> payment initiation -> payment completion -> first course start -> first course completion -> second purchase.
- These KPIs are additive to [§8](#8-admin-reports-definitions) and [§9](#9-course-funnel-data-meaning); they do not override those definitions.

### 18.4 Non-negotiable execution constraints

- **Payment trust first:** no growth work should ship while known P0 payment dead-ends remain (stuck pending, false enrolled blocks, missing recovery path).
- **Single provider payment journey:** avoid fragmented enrollment/payment variants that diverge in behavior.
- **State-based CTA discipline:** each provider state should have one primary next action (start, resume payment, continue learning, next purchase).
- **Qualified growth over vanity traffic:** optimize channels and experiments for payment completion and recurrent behavior, not clicks alone.

---

## 19. The Holistic Product Ecosystem — How Everything Connects

This section is the **canonical integration map** for the entire platform. Every product, every data stream, and every audience must be understood in relation to every other. Agents, engineers, designers, and partners working on any single product must read this section first.

### 19.1 The Platform Is One System, Not a Collection of Apps

Paeds Resus is not a bundle of separate tools that happen to share a login. It is a **single, integrated system** designed to reduce preventable childhood mortality by operating simultaneously at five levels:

| Level | What it addresses | Primary product |
|-------|------------------|-----------------|
| **Bedside cognition** | Wrong sequence, missed steps, dosing errors under stress | ResusGPS |
| **Professional competence** | Knowledge gaps, certification, behaviour change | Fellowship + AHA Courses + Micro-courses |
| **Continuous learning from real cases** | Gap between classroom mastery and ward behaviour | Care Signal → linked learning |
| **Institutional systems** | Workflow, triage, procurement, accountability | Institutional OS (Hospital ERS) |
| **Community and guardian voice** | Late presentation, family experience, upstream failures | Safe-Truth |

No level replaces the others. Engineering decisions must **prefer integration** — shared identity, shared analytics, linked data flows — over siloed tools.

### 19.2 The Shared Data Spine

All products write to and read from a **shared data spine** that enables the platform's intelligence layer:

```
Provider identity (users + providerProfiles)
    │
    ├── ResusGPS cases (resusGPSCases)
    │       └── feeds Fellowship Pillar B + clinical analytics
    │
    ├── Care Signal events (careSignalEvents)
    │       └── feeds Fellowship Pillar C + QI intelligence + MOH surveillance
    │
    ├── Course completions (enrollments + certificates)
    │       └── feeds Fellowship Pillar A + institutional reporting
    │
    ├── Analytics events (analyticsEvents)
    │       └── feeds admin reports + engagement metrics
    │
    └── Safe-Truth submissions (parentSafeTruthSubmissions)
            └── feeds community voice layer + upstream gap detection
```

**Non-negotiable rule:** KPIs from different products must never be combined in the same metric. Care Signal streaks are not influenced by Safe-Truth submissions. ResusGPS case counts are not influenced by course completions. Each product's data is sovereign within the shared spine.

### 19.3 The Fellowship as the Integration Layer

The Fellowship is not merely a qualification pathway. It is the **mechanism that binds all products together** into a continuous professional development engine:

| Fellowship Pillar | Source product | What it measures |
|-------------------|---------------|------------------|
| **Pillar A — Courses** | AHA + Micro-courses | Knowledge acquisition and certification |
| **Pillar B — ResusGPS** | ResusGPS | Applied bedside guidance (≥3 cases per taught condition) |
| **Pillar C — Care Signal** | Care Signal | Reflective practice and QI culture (monthly reporting discipline) |

A provider who completes all three pillars over 24 months has demonstrated that they **use** the platform in real emergencies, **reflect** on what goes wrong, and **keep learning** from real cases. That is a fundamentally different credential from a one-day certification course.

### 19.4 Product-by-Product Integration Requirements

#### ResusGPS
- **Feeds:** Fellowship Pillar B, clinical analytics, post-event learning triggers
- **Receives from:** Micro-courses (condition-specific knowledge), Care Signal (gap patterns that should update guidance)
- **Integration gap (current):** ResusGPS cases do not yet trigger Care Signal prompts post-event — Phase 2 priority
- **Canonical doc:** [RESUS_GPS_V4_FEATURES.md](./RESUS_GPS_V4_FEATURES.md)

#### Care Signal
- **Feeds:** Fellowship Pillar C, QI intelligence, institutional admin, MOH surveillance layer
- **Receives from:** ResusGPS (post-event prompt), Fellowship (streak feedback), Institutional OS (facility context)
- **Integration gap (current):** Reports do not yet trigger linked micro-course recommendations; closed-loop accountability not yet built
- **Canonical docs:** [CARE_SIGNAL_STRATEGY_AND_ROADMAP.md](./CARE_SIGNAL_STRATEGY_AND_ROADMAP.md), [CARE_SIGNAL_WORLD_CHANGING_POTENTIAL.md](./CARE_SIGNAL_WORLD_CHANGING_POTENTIAL.md)

#### Fellowship + Micro-courses
- **Feeds:** Provider credential, institutional reporting, platform revenue
- **Receives from:** All three pillars (ResusGPS, Care Signal, course completions)
- **Integration gap (current):** Micro-course recommendations are not yet dynamically triggered by Care Signal gap reports or ResusGPS case patterns
- **Canonical docs:** [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md), [COURSE_PORTFOLIO_AND_ADF_STRATEGY.md](./COURSE_PORTFOLIO_AND_ADF_STRATEGY.md), [MICRO_COURSE_CATALOG_BACKLOG.md](./MICRO_COURSE_CATALOG_BACKLOG.md)

#### AHA Courses (BLS / ACLS / PALS)
- **Feeds:** Provider certification (standalone), institutional compliance reporting
- **Receives from:** None (standalone track — not part of Fellowship pathway)
- **Integration note:** AHA courses share the same platform identity and enrollment infrastructure but do **not** contribute to Fellowship pillars. This separation is **non-negotiable**.
- **Canonical doc:** [COURSE_PORTFOLIO_AND_ADF_STRATEGY.md](./COURSE_PORTFOLIO_AND_ADF_STRATEGY.md)
#### AHA Practice Lab (supplemental simulation)
- **Product:** Enrollment-gated skills practice for **Paeds Resus Limited** AHA course learners (BLS, ACLS, PALS, Heartsaver, NRP). Supplemental simulation and debrief � **not** Fellowship credit and **not** ResusGPS clinical bedside mode (/resus).
- **Route:** /aha-courses/practice (linked from AHA hub for enrolled providers)
- **Feeds:** haPracticeLabAttempts (per-track scores, event logs), admin Practice Lab rollup on /admin/reports
- **Receives from:** AHA enrollments (access gate), shared CPR simulation engine (practiceLabMode � no Fellowship case save)
- **Integration note:** Standalone under the AHA training track (same non-Fellowship rule as certificated courses). Reuses simulation UI patterns but must never be marketed or logged as ResusGPS clinical guidance.
- **Schema:** drizzle/0049_aha_practice_lab_attempts.sql; apply via pnpm run db:apply-0049 post-deploy

#### Safe-Truth (Parent / Guardian)
- **Feeds:** Community voice layer, upstream gap detection, institutional accountability signal
- **Receives from:** None (input-only product for parents/guardians)
- **Integration note:** Safe-Truth data is **never** combined with provider-facing KPIs. Separate audience, separate data table, separate analytics stream. The only integration point is the admin report (§8), where Safe-Truth usage is reported separately from all provider metrics.
- **Canonical doc:** [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md) §9

#### Institutional OS (Hospital ERS)
- **Canonical definition:** [§24](#24-institutional-emergency-readiness-ers) — **Hospital Emergency Readiness System (ERS)** with **paediatric priority**; nurse-led hospital-wide ERT 24/7; ResusGPS, Care Signal, training mesh, readiness audits, institutional dashboard. **Not** bulk AHA seat bundles.
- **Feeds:** Facility-level analytics, MOH reporting, procurement intelligence, ERT activation metrics
- **Receives from:** Care Signal (facility gap data), ResusGPS (case load by facility), Course completions (staff training status)
- **Integration gap (current):** Facility-level Care Signal dashboard not yet built; institutional admin sees only enrollment/payment data
- **CEO narrative (sales-ready detail):** [INSTITUTIONAL_ERS_NARRATIVE.md](./INSTITUTIONAL_ERS_NARRATIVE.md)
- **Legal templates:** [PILOT_HOSPITAL_MOU_TEMPLATE](./legal/PILOT_HOSPITAL_MOU_TEMPLATE.md), [INSTITUTIONAL_B2B_ADDENDUM](./legal/INSTITUTIONAL_B2B_ADDENDUM.md)

---

## 20. Global Surveillance Vision — The Public Health Infrastructure Layer

This section defines the **long-range strategic architecture** that transforms Paeds Resus from a provider tool into a global public health infrastructure asset. It is binding for all product decisions that affect data architecture, institutional partnerships, and external reporting.

### 20.1 The Gap Nobody Else Is Filling

No organisation — not WHO, not UNICEF, not CDC, not any academic institution — has a **real-time, provider-sourced epidemiological surveillance network for paediatric emergency system failures in LMICs**. Ministries of Health receive aggregate mortality statistics. Researchers publish retrospective audits from individual hospitals, years after the fact. The signal that tells a government *why* children are dying and *where in the system* the failure occurs does not exist.

Care Signal, at scale, is that signal. The platform's architecture must be designed to support this from day one.

### 20.2 The Three-Layer Intelligence Architecture

| Layer | Product | Primary audience | Data source |
|-------|---------|-----------------|-------------|
| **Provider intelligence** | Personal analytics, Fellowship feedback | Individual providers | Own submissions |
| **Facility intelligence** | Admin review queue, facility dashboard | Hospital/clinic admin | All submissions from facility |
| **National surveillance** | Aggregate MOH dashboard | Ministry of Health | Anonymised, aggregated, country-level |

Each layer is a distinct product with distinct governance requirements. Provider data is visible only to the provider and their institutional admin (with consent). Facility data is aggregated with no individual provider identification. National data is fully anonymised with no facility identification without explicit accreditation consent.

### 20.3 Data Governance Non-Negotiables

1. **No patient identifiers** in any Care Signal submission — enforced at form level and schema level
2. **Provider anonymity option** — providers may submit anonymously; anonymous submissions are still eligible for Fellowship Pillar C
3. **Facility data requires consent** — a facility's data is only visible in the national layer if the facility has explicitly opted into the accreditation programme
4. **No employer-visible individual data** — an institutional admin cannot see which specific provider submitted a report; they see only aggregated facility data
5. **Research access requires a signed data sharing agreement** — anonymised datasets are not freely available

### 20.4 The MOH Partnership Pathway

The path to WHO, Harvard, and CDC recognition runs through **Ministry of Health partnerships**, not through marketing:

1. **Kenya pilot** — Make Care Signal the official reporting instrument for paediatric emergency events in a defined set of county hospitals (formal MOU with Ministry of Health)
2. **Published findings** — Partner with KEMRI, Aga Khan University, or a UK/US global health programme to validate data quality and publish the first national-level findings
3. **Regional expansion** — Uganda, Tanzania, Ethiopia, Rwanda (each requires a local MOU and clinical governance partner)
4. **WHO recognition** — Present aggregate findings at WHO technical working groups; position Paeds Resus as the methodology for paediatric emergency surveillance in LMICs

### 20.5 The Benchmarking Network

The anonymised peer benchmarking network is the feature that makes Care Signal a **network product** — one whose value grows with every new provider who joins:

- Providers see how their facility's outcomes compare to similar facilities (anonymised, case-mix adjusted)
- High-performing facilities are identified as learning exemplars (with consent)
- Gap patterns at the bottom quartile are surfaced as priority training targets
- **Network effect threshold:** approximately 50 active providers per country for the aggregate signal to be statistically meaningful

**Implementation prerequisite:** The `facilityId` column (migration 0038, applied to live database 2026-05-01) is the foundation for all facility-level and benchmarking analytics.

### 20.6 Business Model Layers

| Layer | Product | Customer | Nature |
|-------|---------|----------|--------|
| Collection | Provider Care Signal | Individual providers | Fellowship feature |
| Facility intelligence | Admin review + dashboard | Hospital admin | Institutional subscription |
| National surveillance | Aggregate MOH dashboard | Ministry of Health | Government contract |
| Research access | Anonymised dataset | Academic institutions, WHO | Data licensing |
| Benchmarking | Peer comparison network | Institutional networks | Premium tier |

The government contract and data licensing layers are where the valuation step-change lives. A platform with 10,000 active providers across 15 countries generating real-time paediatric emergency surveillance data is valued as **public health infrastructure**, not as a SaaS subscription business.

---

## 21. Document Registry — All Strategic Docs Linked to PSOT

Every strategic and operational document in this repository is listed here with its relationship to PSOT. All agents working on any product must check this registry before creating new documents to avoid duplication.

### 21.1 Canonical Strategy Documents

| Document | Status | Relationship to PSOT |
|----------|--------|---------------------|
| [NORTH_STAR_V2.md](./NORTH_STAR_V2.md) | **Active — Constitutional** | Supersedes North Star v1.0. Mission, theory of change, institutional identity (aviation safety analogy), Adaptive Learning System framing, account model, financial strategy summary, named threshold, ten-year test — **read first**, before STRATEGIC_FOUNDATION.md |
| [OBSERVATION_ARCHITECTURE_V1_1.md](./OBSERVATION_ARCHITECTURE_V1_1.md) | **Active — Constitutional** | Supersedes v1.0. Full specification for how Paeds Resus learns: observer classes, observation model, shared classifiers, transformation pipeline, Learning Governance (three types of truth, evidence ladders, Knowledge Stewardship), evolution rules — expands §19, §20, and new §25 |
| [FPKB_SCHEMA_V1.md](./FPKB_SCHEMA_V1.md) | **Active — Engineering** | Complete database schema for the Failure Pattern Knowledge Base — 11 `kb_` tables, indexes, 12-migration sequence, taxonomy seed data (28 failure modes, 10 success factors) — expands §25 |
| [EVENT_MODELS_V1.md](./EVENT_MODELS_V1.md) | **Active — Engineering** | Field-by-field specification for Care Signal v3, Safe-Truth v1 (redesigned), ResusGPS session record, Fellowship competency record — expands §3, §7, §17, §19 |
| [FINANCIAL_STRATEGY_V1.md](./FINANCIAL_STRATEGY_V1.md) | **Active — Confidential Internal** | Four-business revenue model, constitutional revenue principle (individual access never gated by ability to pay), pricing, accreditation prerequisites — expands §15 |
| [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md) | Active | Mission, theory of change, LMIC context — read before any product decision |
| [CARE_SIGNAL_STRATEGY_AND_ROADMAP.md](./CARE_SIGNAL_STRATEGY_AND_ROADMAP.md) | Active | Canonical Care Signal implementation detail — expands §17 and §19 |
| [CARE_SIGNAL_WORLD_CHANGING_POTENTIAL.md](./CARE_SIGNAL_WORLD_CHANGING_POTENTIAL.md) | Active | Strategic analysis of Care Signal's global potential — informs §20 |
| [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md) | Active | Canonical Fellowship rules — expands §17 |
| [COURSE_PORTFOLIO_AND_ADF_STRATEGY.md](./COURSE_PORTFOLIO_AND_ADF_STRATEGY.md) | Active | Course catalog and ADF strategy — expands §3 |
| [MICRO_COURSE_CATALOG_BACKLOG.md](./MICRO_COURSE_CATALOG_BACKLOG.md) | Active | 24-slot micro-course backlog — expands §3 |
| [CLINICAL_CONTENT_GOVERNANCE.md](./CLINICAL_CONTENT_GOVERNANCE.md) | Active | CEO clinical content rules — micro-courses, ResusGPS spine, conflict templates, Pass 1/2 scope — expands §3 and §13 |
| [CLINICAL_SOURCE_OF_TRUTH.md](./CLINICAL_SOURCE_OF_TRUTH.md) | Active (CEO post-deploy review pending) | Per-condition clinical spine + citations — DKA, SE, asthma, shock; exam model; ResusGPS alignment |
| [MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md](./MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md) | Active | CEO click-test checklist after deploy; course touch list; known backlog |
| [CONVERSION_90_DAY_EXECUTION_PLAN.md](./CONVERSION_90_DAY_EXECUTION_PLAN.md) | Active | Growth execution plan — expands §18 |
| [MATURITY_ROADMAP.md](./MATURITY_ROADMAP.md) | Active | CEO-ready 6-phase platform maturity plan — closes 10 objective-gap blockers; aligns with §12 and STRATEGIC_FOUNDATION |
| [PUBLIC_VISIBILITY_AND_SEO.md](./PUBLIC_VISIBILITY_AND_SEO.md) | Active | Operator guide for Search Console, GBP, keyword targets — expands §23 |
| [INSTITUTIONAL_ERS_NARRATIVE.md](./INSTITUTIONAL_ERS_NARRATIVE.md) | Active | CEO-ready Hospital ERS narrative — paediatric priority, nurse-led ERT, ERS-first strategy, 90-day metrics — expands [§24](#24-institutional-emergency-readiness-ers) |
| [GBP_PROFILE_COPY.md](./GBP_PROFILE_COPY.md) | Active | Paste-ready Google Business Profile description (no URLs in body) — expands §23 |
| [legal/PILOT_HOSPITAL_MOU_TEMPLATE.md](./legal/PILOT_HOSPITAL_MOU_TEMPLATE.md) | Active | Pilot hospital MOU + 90-day QI metrics schedule — expands [§24.7](#247-partnership-and-pilot-governance) |
| [legal/INSTITUTIONAL_B2B_ADDENDUM.md](./legal/INSTITUTIONAL_B2B_ADDENDUM.md) | Active | B2B institutional contract addendum — expands [§24.7](#247-partnership-and-pilot-governance) |

### 21.2 Technical and Operational Documents

| Document | Status | Relationship to PSOT |
|----------|--------|---------------------|
| [RESUS_GPS_V4_FEATURES.md](./RESUS_GPS_V4_FEATURES.md) | Active | ResusGPS feature spec — expands §5 |
| [SECURITY_BASELINE.md](./SECURITY_BASELINE.md) | Active | Security requirements — expands §6 |
| [SECURITY_BASELINE_IMPLEMENTATION.md](./SECURITY_BASELINE_IMPLEMENTATION.md) | Active | Security implementation evidence |
| [PLATFORM_RELIABILITY_PLAN.md](./PLATFORM_RELIABILITY_PLAN.md) | Active | Reliability and uptime requirements |
| [RENDER_PREDEPLOY_LOCKED.md](./RENDER_PREDEPLOY_LOCKED.md) | Active | Deployment configuration — locked |
| [STAGING_DEPLOYMENT.md](./STAGING_DEPLOYMENT.md) | Active | Staging environment setup |
| [STAGING_GO_LIVE_CHECKLIST.md](./STAGING_GO_LIVE_CHECKLIST.md) | Active | Operator go-live checklist for live staging (MATURITY_ROADMAP Phase 1) |
| [LEGAL_COMPLIANCE_BASELINE.md](./LEGAL_COMPLIANCE_BASELINE.md) | Draft | Legal/compliance baseline for counsel review (MATURITY_ROADMAP Issue #8) |
| [legal/LEGAL_IMPLEMENTATION_INDEX.md](./legal/LEGAL_IMPLEMENTATION_INDEX.md) | v1.0.0 | Counsel-ready legal docs + engineering map (Privacy, Terms, consent, DSAR) |
| [CLINICAL_OUTCOMES_PILOT.md](./CLINICAL_OUTCOMES_PILOT.md) | Draft | Process-outcomes pilot framework (MATURITY_ROADMAP Issue #3) |
| [MPESA_CONFIG_REFERENCE.md](./MPESA_CONFIG_REFERENCE.md) | Active | M-Pesa configuration reference |
| [MPESA_CREDENTIALS_REFERENCE.md](./MPESA_CREDENTIALS_REFERENCE.md) | Active | M-Pesa credentials (do not commit secrets) |
| [PR-DC_V1.0_Drug_Compendium.md](./PR-DC_V1.0_Drug_Compendium.md) | Active | Paediatric drug compendium — clinical reference |

### 21.3 Audit and Status Documents

| Document | Status | Relationship to PSOT |
|----------|--------|---------------------|
| [WORK_STATUS.md](./WORK_STATUS.md) | Active | Weekly execution updates — do not put canonical decisions here |
| [PLATFORM_AUDIT_WHAT_IS_MISSING.md](./PLATFORM_AUDIT_WHAT_IS_MISSING.md) | Active | Gap audit — informs roadmap priorities |
| [UNIFIED_PLATFORM_AUDIT_MANUS_AND_CURSOR.md](./UNIFIED_PLATFORM_AUDIT_MANUS_AND_CURSOR.md) | Active | Cross-agent audit |
| [PRODUCT_BACKLOG_PRIORITIZED.md](./PRODUCT_BACKLOG_PRIORITIZED.md) | Active | Prioritised backlog — expands §14 |
| [PROBLEM_SOLVING_FRAMEWORK.md](./PROBLEM_SOLVING_FRAMEWORK.md) | Active | Decision framework for agents |
| [TEAMWORK_TASK_FORMAT.md](./TEAMWORK_TASK_FORMAT.md) | Active | Task format for multi-agent work |
| [AGENTS.md](../AGENTS.md) | Active | **All-agents mandate** — read before any work in this repo |
| [AGENT_OPERATIONS_PLAYBOOK.md](./AGENT_OPERATIONS_PLAYBOOK.md) | Active v1 | **Operational runbooks** — protected-branch shipping (`gh`), prod DB seed/verify/chunking, ETIMEDOUT/Render Shell, multitask honesty; complements AGENT_AUTONOMY |
| [AGENT_AUTONOMY.md](./AGENT_AUTONOMY.md) | Active v2 | **Multi-agent Definition of Done** — Distance = `origin/main`, Kolb cycle, forbidden Done |
| [CRITICAL_FIX_PLAYBOOK.md](./CRITICAL_FIX_PLAYBOOK.md) | Active | **All critical fixes** — content, env, legal, payments, SEO, clinical pathways |
| [CONTENT_HOTFIX_PLAYBOOK.md](./CONTENT_HOTFIX_PLAYBOOK.md) | Active | Quiz/content appendix — DB vs seed, verify scripts, PR checklist |
| [MANUS_AGENT_RULES.md](./MANUS_AGENT_RULES.md) | Active | **Manus-specific** — Handoff vs Done, sandbox ≠ production |
| [AI_TEAM_WORKFLOW.md](./AI_TEAM_WORKFLOW.md) | Active | Commit/push/PR/merge for Manus, Codex, Cursor |

### 21.4 Archive (Historical — Do Not Treat as Current)

| Document | Note |
|----------|------|
| [archive/STRATEGIC_VISION_2031.md](./archive/STRATEGIC_VISION_2031.md) | Aspirational long-range material — direction only, not committed figures |
| [archive/REPOSITORY_ALIGNMENT_AUDIT_STALE.md](./archive/REPOSITORY_ALIGNMENT_AUDIT_STALE.md) | Stale audit — superseded by UNIFIED_PLATFORM_AUDIT |

---

## 22. All-Agents Mandate — How Every Agent Must Treat PSOT

This section is **binding for every AI agent, developer, designer, and contributor** working in this repository, regardless of which product or feature they are assigned to.

### 22.1 PSOT Is the Single Source of Truth

- **Before starting any task**, read the relevant sections of this document and the linked canonical docs for the product you are working on
- **If you discover a conflict** between this document and any other document, this document wins — update the other document, not this one, unless you have explicit leadership approval to change a canonical decision
- **If you make a decision** that affects platform architecture, data models, KPI definitions, auth, roles, or product boundaries, you must update this document before closing your task

### 22.2 When You Must Update PSOT

| Trigger | Required action |
|---------|----------------|
| New product or major feature added | Add a section or subsection to §19 (ecosystem map) |
| New data table or significant schema change | Update §19.2 (shared data spine) and log in WORK_STATUS.md |
| New strategic document created | Add it to §21 (document registry) |
| KPI definition changed | Update §8 (admin reports) and log in WORK_STATUS.md |
| New institutional or government partnership | Update [§24](#24-institutional-emergency-readiness-ers) and §20.4 (MOH partnership pathway) |
| Institutional ERS scope, geography, or marketing rule changed | Update [§24](#24-institutional-emergency-readiness-ers); cross-check §15.3, §23 |
| New migration applied to live database | Log in WORK_STATUS.md with migration number, date, and what changed |
| New failure mode, success factor, or FPKB taxonomy change | Update [FPKB_SCHEMA_V1.md](./FPKB_SCHEMA_V1.md) §6 and log in WORK_STATUS.md |
| A pattern promoted from Analytical Truth to Actionable Truth | Log in `kb_governance_audit` (per [§25](#25-the-failure-pattern-knowledge-base-and-learning-governance)) and note in WORK_STATUS.md |
| Shared classifier ENUM values change | Update [§8.1](#81-global-shared-classifiers-binding-across-all-observation-tables) and [EVENT_MODELS_V1.md](./EVENT_MODELS_V1.md) §5 simultaneously — never let them diverge |

### 22.3 What You Must Never Do

- **Never combine** Care Signal KPIs with Safe-Truth KPIs in any metric or report
- **Never combine** Fellowship pillar data across pillars in a single metric
- **Never add** patient identifiers to any Care Signal submission schema
- **Never grant** employer-visible individual Care Signal data without explicit provider consent
- **Never treat** AHA courses (BLS/ACLS/PALS/Heartsaver/NRP) as part of the Fellowship pathway
- **Never create** a new canonical document without linking it in §21
- **Never make** a canonical decision in WORK_STATUS.md — that file is for execution updates only
- **Never say** “one paediatric nurse covers all wards” — departments run with **~2 nurses per shift**; during Code Blue one responds while a colleague holds the department ([§24.3](#243-staffing-reality-during-code-blue))
- **Never lead** institutional GTM with bulk PALS/ACLS seat bundles — lead with **Hospital ERS** readiness ([§24.2](#242-canonical-name-and-scope))
- **Never name** pilot hospitals in public copy without **CEO approval** — pilot sites are confidential until MOU ([§24.6](#246-geography-and-pilot-confidentiality))
- **Never claim** mortality reduction or “Paeds Resus replaces AHA” in public marketing — AHA-aligned training **supports** ERS; outcome claims require governed evaluation ([§24.5](#245-aha-relationship-and-public-marketing-rules))
- **Never allow skipping steps** in AHA courses — learners must follow the journey: Diagnostic → Modules → Capstone Simulation → Summative Exam.
- **Never use 80% pass mark for Capstone Simulations** — the threshold is fixed at **50% (Supportive)** to focus on systematic approach appreciation.
- **Never overlook 2025 PCAC updates** — Post-Cardiac Arrest Care must prioritize **fever prevention (>37.5°C) for 36-72 hours** as the primary neuro-protective strategy.
- **Never gate** individual provider access to Care Signal, ResusGPS, or core courses by ability to pay, in any setting — this is the constitutional revenue principle; see [FINANCIAL_STRATEGY_V1.md](./FINANCIAL_STRATEGY_V1.md) §1.1
- **Never present** an unconfirmed Analytical Truth pattern to providers or institutions as though it were an approved Actionable Truth recommendation — see [§25.2](#252-the-three-types-of-truth-binding-rule)
- **Never auto-assign** an outcome label on a Knowledge Base implementation record — requires human Knowledge Stewardship review; see [§25.6](#256-what-developers-must-never-do-extends-223)
- **Never diverge** shared classifier ENUM values (country, admin_level_1, facility_level, child_age_band, condition_category, outcome_category) between Care Signal, Safe-Truth, and ResusGPS — see [§8.1](#81-global-shared-classifiers-binding-across-all-observation-tables)
- **Never build** new Safe-Truth features assuming authentication is required — accountless submission is the binding target; see [§3](#3-what-we-do-offerings)

### 22.4 The Global Ambition Mandate

Every product decision must be evaluated against the platform's global ambition:

> **Paeds Resus is building toward recognition as the global benchmark for paediatric resuscitation science in LMICs — by WHO, Harvard, CDC, and Ministries of Health across Sub-Saharan Africa and beyond.**

This is not marketing language. It is an architectural constraint. Every data model decision, every analytics design, every institutional partnership, and every product feature must be evaluated against the question: **Does this make us more or less credible as a global public health infrastructure asset?**

The path to that recognition runs through:
1. **Data quality and integrity** — every metric must be honest, every KPI definition must be locked, every report must be reproducible
2. **Provider trust** — providers must believe their reports are confidential, useful, and acted upon
3. **Institutional partnerships** — MOH relationships, academic validation, published findings
4. **Clinical rigour** — all guidance must be evidence-based, guideline-aligned, and auditable

### 22.5 For Agents Working on Other Products

If you are an agent assigned to ResusGPS, Fellowship, Safe-Truth, AHA Courses, Institutional OS, or any other product:

1. **Read §19** (ecosystem map) to understand how your product connects to all others
2. **Read §24** (Institutional ERS) if working on institutional copy, sales, partnerships, or hospital admin — **before** drafting new narrative
3. **Read §20** (global surveillance vision) to understand the long-range architecture your product must support
3. **Read §21** (document registry) to find the canonical docs for your product
4. **Update §21** when you create a new strategic document
5. **Update §19** when you add a new integration point between products
6. **Update WORK_STATUS.md** when you apply a migration or make a significant change

The PSOT is a living document. It is only as useful as the discipline of the agents who maintain it.

---

## 23. Public visibility & discovery

**Mandate:** The platform must be **discoverable** by all stakeholders — healthcare providers, trainees, parents/guardians, and institutions — via **search engines**, **LLM-assisted discovery**, and **direct navigation**. Anonymous visitors must land on a **compound marketing home** (`/`) that explains the full Paeds Resus platform; they must **not** be dropped into ResusGPS-only experiences by default.

**Operator guide:** [PUBLIC_VISIBILITY_AND_SEO.md](./PUBLIC_VISIBILITY_AND_SEO.md)

### 23.1 Canonical public routes

| Route | Purpose |
|-------|---------|
| `/` | **Public compound home** — all stakeholders, hero + section CTAs |
| `/start` | **Alias → `/`** (301-style client redirect; canonical is `/`) |
| `/training` | Training hub (BLS, ACLS, PALS, NRP, micro-courses mention) |
| `/training/bls`, `/training/acls`, `/training/pals`, `/training/nrp` | **Course-intent SEO** landing pages |
| `/aha-courses` | Public AHA overview; authenticated providers see enrollment hub |
| `/for-providers`, `/for-institutions`, `/for-parents` | Stakeholder discovery pages |
| `/institutional`, `/parent-safe-truth`, `/verify`, `/about`, `/help` | Existing public surfaces |
| `/login`, `/register` | Auth entry (indexed for brand discovery) |
| `/payment/success` | **Paid conversion thank-you** (Google Ads; `noindex`; auth + `paymentStatus=completed` required) |
| Legal: `/privacy`, `/terms`, `/legal/*` | Compliance pages |

**Sitemap:** `client/public/sitemap.xml` — must list all routes above when public.

### 23.2 Brand vs course-intent SEO rules

| Search intent | Page brand | Copy rules |
|---------------|------------|------------|
| **Organisation / platform** (“Paeds Resus”, “paediatric emergency Kenya”) | **Paeds Resus** on `/`, `/about`, `/for-*` | One integrated platform; list all products |
| **Course certification** (“PALS training Kenya”, “ACLS course Nairobi”) | **Paeds Resus Limited** on `/training/*` | AHA-**aligned** language only — never overclaim “AHA-certified” without counsel-approved wording |
| **Bedside tool** (“paediatric resuscitation app”) | **ResusGPS** on provider pages | ResusGPS is one product, not the company |
| **Families** | **Parent Safe-Truth** on `/for-parents`, `/parent-safe-truth` | Non-clinical tone; never mix with Care Signal |

**Structured data:** `Organization` + `WebSite` on compound home; `Course` + `Organization` on training landings. Implemented via `client/src/lib/seo-schema.ts` and `usePageMeta`.

### 23.3 Stakeholder entry points

| Stakeholder | Primary public entry | Sign-in / register CTA target |
|-------------|---------------------|-------------------------------|
| Healthcare provider | `/for-providers`, `/` §providers | `/register` or `/login?next=/resus` |
| Trainee / cert seeker | `/training/*`, `/aha-courses` | `/login?next=/enroll` |
| Parent / caregiver | `/for-parents`, `/parent-safe-truth` | `/register` (parent account) |
| Hospital / institution | `/for-institutions`, `/institutional` | `/register` + institutional quote |
| Employer verifying cert | `/verify` | N/A (public tool) |

### 23.4 Auth routing (unchanged)

Logged-in users hitting `/` are redirected by **`userType`** to `/home`, `/parent-safe-truth`, or `/hospital-admin-dashboard` — **no change** to [§7](#7-auth-and-roles). Public SEO pages remain accessible when logged out; product workspaces remain gated.

### 23.5 EAC expansion note

Localized discovery pages (e.g. country-specific training landings, Swahili meta descriptions) may be added later as **separate canonical routes** under `/training` or `/eac/{country}` — register each in §23.1 and sitemap when shipped. Do not duplicate content without `hreflang` or canonical discipline.

### 23.6 Institutional / ERS SEO keywords

| Priority | Keywords (examples) | Canonical pages |
|----------|---------------------|-----------------|
| **P2** | hospital emergency response system Kenya, paediatric emergency readiness Nyeri, hospital ERT Kenya | `/institutional`, `/for-institutions` |
| **P2** | paediatric resuscitation training hospital, nurse-led emergency response Kenya | `/institutional`, `/for-institutions` |
| **P3** | paediatric emergency micro-courses, ResusGPS bedside guidance | `/for-providers`, `/training` |

**Copy rules for institutional SEO:** Lead with **Hospital Emergency Readiness System (ERS)** and **paediatric priority** — not “bulk PALS seats” or “ACLS vendor.” Use **AHA-aligned training plus institutional readiness** language ([§24.5](#245-aha-relationship-and-public-marketing-rules)). Paste-ready GBP copy: [GBP_PROFILE_COPY.md](./GBP_PROFILE_COPY.md). Operator checklist: [PUBLIC_VISIBILITY_AND_SEO.md](./PUBLIC_VISIBILITY_AND_SEO.md).

---

## 24. Institutional Emergency Readiness (ERS)

**PSoT short title:** *Hospital ERS — canonical name, scope, geography, buyer split, and contributor guardrails.*

**Purpose:** Contributors working on institutional copy, sales materials, engineering, or partnerships must **not** need the full CEO narrative retold. This section is the **single canonical place** for institutional platform decisions. CEO-ready sales detail: [INSTITUTIONAL_ERS_NARRATIVE.md](./INSTITUTIONAL_ERS_NARRATIVE.md). Ecosystem integration map: [§19](#19-the-holistic-product-ecosystem--how-everything-connects) Institutional OS.

### 24.1 Mission link

Paeds Resus exists to reduce **preventable paediatric death and harm** in **LMIC** settings — especially Kenya's public and faith-based hospitals where staffing and equipment constraints are real. Institutional work is not a separate business line; it is how the platform improves **hospital-wide systems** so children receive standardised emergency care regardless of who is on shift. Mission framing: [§2](#2-why-we-exist-mission), [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md).

### 24.2 Canonical name and scope

| Term | Meaning |
|------|---------|
| **Hospital Emergency Readiness System (ERS)** | The **canonical institutional offering** — hospital-wide emergency readiness infrastructure with **paediatric priority framing** |
| **ERT (Emergency Response Team)** | Nurse-led, **24/7**, hospital-wide coordination model — teams across units (adult, paediatric, neonatal literacy via training mesh) respond together |
| **Training mesh** | AHA-aligned BLS, ACLS, PALS, NRP cohorts mapped to role and identified gaps — delivered by **Paeds Resus Limited** as a **supporting layer**, not the product headline |

**ERS components (what hospitals get):**

1. **ERT structure and workflows** — roster, activation pathways, hospital-wide coordination
2. **ResusGPS** — bedside structured guidance (ABCDE, dosing, CPR Clock)
3. **Care Signal** — facility-level QI, near-miss reporting, action logs
4. **Institutional dashboard** — activations, training coverage, equipment readiness, improvement actions
5. **Readiness / equipment audits** — oxygen, defibrillator pads, paediatric sizes, crash cart, activation pathways
6. **Training mesh** — AHA-aligned courses mapped to gaps (adult, paediatric, neonatal literacy)
7. **Paediatric emergency micro-courses** — condition-focused modules aligned with ResusGPS

**What ERS is NOT:** Generic bulk AHA certification, seat bundles, or an ACLS vendor catalogue. Contrast: working **Emergency Response Systems** plus training that **supports** the system.

### 24.3 Staffing reality during Code Blue

**Honest baseline:** Many departments run with **roughly two nurses per shift** — enough to keep the ward running, **not** enough for one responder to leave every bedside unattended during a code. **Do not exaggerate** to “one nurse covers all wards.”

**During Code Blue (canonical model):**

1. **One nurse responds** to the arrest/decompensation
2. **Colleague holds the department** — continuous ward coverage
3. **Second responder activates hospital-wide coordination** — e.g. notify other departments of Code Blue in Ward X so ERT members from other units can respond

ERS coordinates **teams across units** rather than implying a single nurse can abandon an entire hospital's coverage.

### 24.4 What hospitals buy vs what staff buy

| Buyer | Value proposition | Risk if mis-sold |
|-------|-------------------|------------------|
| **Hospital / institution** | **Readiness systems** — ERS design, ERT workflows, ResusGPS + Care Signal deployment, audits, dashboard, institutional engagement | Hospital pays for certs; staff leave with portable credentials and **no lasting system improvement** |
| **Individual staff** | **Courses and certifications** for employment and professional development — different lane ([§15.3](#153-offerings-and-revenue-emphasis-near-term)) | Treating institutional sales as “sell PALS seats to everyone” |

**Non-negotiable:** Institutional contracts must deliver **ERS value** — activation metrics, QI culture, equipment fixes, training mapped to gaps — not only certificate volume.

### 24.5 AHA relationship and public marketing rules

| Rule | Detail |
|------|--------|
| **AHA as ally (public)** | Ride on the AHA name: “**AHA-aligned training plus** institutional ERS/readiness.” Training supports the system |
| **Do not attack AHA** | No public criticism of AHA or cert-mill framing in marketing |
| **Do not claim replacement** | Never say publicly that Paeds Resus **replaces** AHA |
| **Do not claim ERS without AHA** | Public copy must not present ERS as standalone without acknowledging AHA-aligned training layer |
| **Outcome claims** | Process metrics only (activations, time to response, ROSC where documented) until **governed evaluation** — no mortality reduction claims |

### 24.6 Geography and pilot confidentiality

| Topic | Decision |
|-------|----------|
| **Base** | Nyeri |
| **Service region** | Nyeri, Embu, Murang'a, Kerugoya, Nyahururu, Karatina, Naromoru, Nanyuki, Meru, Nkubu, Chuka, Isiolo, Marsabit — and surrounding referral facilities |
| **Pilot sites** | **Confidential until MOU signed and CEO approves public naming** — do **not** name specific pilot hospitals (e.g. Mathari) in public PSOT copy, marketing pages, or GBP |

### 24.7 Partnership and pilot governance

1. **Readiness conversation** — scope, staffing reality, current ERT (if any)
2. **Pilot or phased MOU** — 90-day QI framework; process metrics only
3. **Implementation** — ERT roster, ResusGPS + Care Signal rollout, training mesh
4. **Review** — dashboard metrics, equipment fixes, next-phase scope

**Legal templates:** [PILOT_HOSPITAL_MOU_TEMPLATE](./legal/PILOT_HOSPITAL_MOU_TEMPLATE.md) · [INSTITUTIONAL_B2B_ADDENDUM](./legal/INSTITUTIONAL_B2B_ADDENDUM.md)

**90-day metrics (process, not mortality):** ERT activation count, time to first responder, paediatric activations, Care Signal submissions, equipment/readiness fixes closed, ROSC where documented.

### 24.8 Internal long-term vision (docs-only tone)

**For contributors and leadership docs only — not public marketing copy:**

- Shift the institutional landscape from **cert-mill** to **ERS-first** — readiness assessment and ERT scope lead sales; training follows identified gaps
- **eCard / eBook costs** and AHA partnership economics are **strategic** considerations for leadership — document in internal narrative and MOU discussions, not in public SEO or GBP copy

Full internal strategy framing: [INSTITUTIONAL_ERS_NARRATIVE.md](./INSTITUTIONAL_ERS_NARRATIVE.md) § Strategy.

### 24.9 Contributor anti-patterns (quick reference)

Cross-reference: [§22.3](#223-what-you-must-never-do).

| Anti-pattern | Instead |
|--------------|---------|
| “One paediatric nurse covers all wards” | ~2 nurses/dept/shift; one responds, colleague holds department |
| Lead with bulk PALS/ACLS seats | Lead with Hospital ERS readiness + training mesh |
| Name pilot hospitals without CEO approval | Confidential until MOU; no site names in public copy |
| Claim mortality reduction | Governed evaluation only; process metrics in pilots |
| “Paeds Resus replaces AHA” | AHA-aligned training **plus** institutional ERS |

---

**Last structural update:** 2026-06-30 — Integrated the five constitutional/engineering documents from the North Star v2.0 cycle: [NORTH_STAR_V2.md](./NORTH_STAR_V2.md), [OBSERVATION_ARCHITECTURE_V1_1.md](./OBSERVATION_ARCHITECTURE_V1_1.md), [FPKB_SCHEMA_V1.md](./FPKB_SCHEMA_V1.md), [EVENT_MODELS_V1.md](./EVENT_MODELS_V1.md), [FINANCIAL_STRATEGY_V1.md](./FINANCIAL_STRATEGY_V1.md). Added new §25 (FPKB and Learning Governance), §8.1 (global shared classifiers), updated §7 (actor model migration), §12 (Care Signal v3 as top priority, FPKB migration sequencing, deliberate postponements), §3 (Safe-Truth accountless requirement), §21 (document registry), §22.3 (new anti-patterns). Prior: 2026-05-30 — Added [AGENT_OPERATIONS_PLAYBOOK.md](./AGENT_OPERATIONS_PLAYBOOK.md) to §21 (shipping + prod DB runbooks). Prior: 2026-05-29 — [CLINICAL_CONTENT_GOVERNANCE.md](./CLINICAL_CONTENT_GOVERNANCE.md). Prior: §24 (Institutional ERS). Prior: 2026-05-28 — Institutional ERS narrative. Prior: 2026-05-27 — §23. Prior: 2026-05-01 — §19–§22.
