# Platform source of truth

**Purpose:** Single canonical reference for **who Paeds Resus is**, **what we build**, **for whom**, **why**, and **how we decide** implementation details (auth, roles, reports, deployment, priorities). Any developer should be able to onboard from this file and the codebase without a separate sit-down—though clarifying questions are always welcome.

**Audience:** All developers (including Codex, Manus, Cursor), contractors, and anyone shipping code or product decisions.

**Strategic foundation (read second):** [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md) — **one holistic problem** (preventable childhood death and harm in low-resource settings), **theory of change** (why ResusGPS + training + institutions + analytics + Safe-Truth), **clinical origin narrative**, **institutional and community patterns**, **Book of the Unforgotten** (ethical frame), and **honest success criteria**. It does **not** override technical decisions in this file; it explains **why** the platform is multi-product. **Long-range aspirational** scenarios (e.g. multi-year hospital/revenue targets) live under [docs/archive/](./archive/) and are **not** near-term execution commitments.

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
| **Courses** | Professional training paths such as **BLS (6 hours), ACLS (16 hours), PALS (16 hours)**, the **Instructor Course** (train-the-trainer), **short condition-focused modules** (micro-courses, often under a **clinical learning journey** umbrella—see [§15.5](#155-clinical-learning-journey-and-ward-excellence-adf-alignment)) aligned with ResusGPS, and related enrollment and certification flows tied to the `enrollments` / `certificates` model. **Go-to-market emphasis** for individuals: see [§15](#15-business-strategy-market-context-and-revenue-focus-leadership). |
| **Elite fellowship** | **Narrative and progression umbrella** for advanced ward-focused learning (micro-courses ladder + optional legacy certifications); **not** a separate paywall for “fellowship” in the digital-first path—learners pay per course/SKU. Programme type `fellowship` in data remains where used; naming in UI may evolve with leadership. |
| **Safe-Truth** | **Parent and guardian** resources and truth-sharing flows (distinct audience and tone from ResusGPS). **Not** the staff monthly reporting channel for fellowship — see **Care Signal**. |
| **Care Signal** | **Provider-facing** incident and near-miss reporting (QI culture); **distinct product name from Safe-Truth** in all user-facing copy. Drives **automated** fellowship **monthly discipline** pillar alongside courses and ResusGPS — see [§17](#17-fellowship-qualification-provider-profile-and-internal-operational-intelligence-non-public). |
| **Institutional** | **Hospitals and training organisations**: staff, schedules, metrics, and management surfaces (e.g. institutional portal, hospital admin). |
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

**User model (summary):** One **email + password** account can **switch context** in the UI (Provider vs Parent vs Institution). The database stores a **single** `userType` per user (`individual` \| `parent` \| `institutional`) for **default post-login routing**; the header switch is **UI/session** behaviour, not a second `userType` in the DB. **Do not** reintroduce a hard single-role lock that prevents switching.

---

## 5. How the product is organised (surfaces)

High-level map (routes may evolve; check the codebase if in doubt):

| Surface | Purpose |
|---------|---------|
| **ResusGPS** | Core provider emergency guidance (e.g. `/` and related flows). |
| **Provider hub** | `/home` — dashboard: ResusGPS, enroll in courses, learning, links to act as institution or parent. |
| **Instructor portal** | `/instructor-portal` — instructor journey status, **My assignments** (B2B sessions), resources placeholder; gated on certification + platform approval for full teaching access. |
| **Parent / guardian** | `/parent-safe-truth` — Safe-Truth and parent-facing resources. |
| **Institution** | e.g. `/institutional-portal`, hospital admin dashboards — institutional metrics and management. |
| **Admin** | `/admin` — reports, insights, advanced tools; **admin** access is governed by [§7](#7-auth-and-roles). |

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
| **User types (DB)** | `individual` \| `parent` \| `institutional`. **One** `userType` per user row. There is **no** separate multi-role table yet. |
| **UI switch** | Any logged-in user may choose **Provider / Parent / Institution** in the UI. That choice is **not** persisted as a second `userType` in the DB; only **default** `userType` is stored for **post-login redirect**. |
| **Admin** | `role === 'admin'` in the DB. Admin is **granted** when `openId === OWNER_OPEN_ID` at auth/upsert; **authorisation checks** use `ctx.user.role === 'admin'`. No admin by ad-hoc DB edits. |
| **Post-login redirect** | By **default `userType` only:** `individual` → `/home`, `parent` → `/parent-safe-truth`, `institutional` → `/institutional-portal`. **No** “last-used role” persisted in DB yet. |

---

## 8. Admin reports (definitions)

These definitions are **locked** for implementation and reporting UI. Use **EAT** for calendar-month boundaries.

| Term | Definition |
|------|------------|
| **This month** | **Calendar month** in **EAT (East Africa Time, UTC+3).** Month start/end for reports are computed in EAT. |
| **Last 7 days** | **Rolling** 7×24 hours from “now” (not calendar week). |
| **Safe-Truth usage (this month)** | Count of rows in **`parentSafeTruthSubmissions`** with `createdAt` in the report month (EAT). **One row = one submission.** |
| **Product / app activity (last 7 days)** | Count of rows in **`analyticsEvents`** with `createdAt` in the last 7 days. **One row = one event.** Instrumentation must go through the **standard** analytics path—no parallel ad-hoc tables for the same KPI. |

---

## 9. Course funnel (data meaning)

- **Applied / enrolled:** A row in **`enrollments`** = one application. Authoritative fields include `createdAt`, `programType` (`bls` \| `acls` \| `pals` \| `fellowship` \| `instructor`), `paymentStatus`, etc. There is **no** strict enforced state machine in code yet; metrics are **counts by date** unless we add a formal funnel later.
- **Certified:** A row in **`certificates`** = one certificate. Authoritative fields include `issueDate`, `programType`.
- **Instructor journey:** Completing the **Instructor Course** (`programType` = `instructor`) issues a certificate and sets **`users.instructorNumber`** + **`users.instructorCertifiedAt`**. **B2B teaching** on institutional schedules still requires **`users.instructorApprovedAt`** (platform admin under Admin → Reports) so hospitals only assign certified, approved instructors.

---

## 10. Deployment and infrastructure

| Topic | Decision |
|-------|----------|
| **Current** | **Single production** environment (e.g. Render + Aiven). **No staging** yet. |
| **When staging exists** | **Branch-based:** changes land on `develop` → **staging**; `main` → **production**. PRs should be verified on **staging** before production. |
| **Domain** | **`paedsresus.com`** → **301 redirect** to **`www.paedsresus.com`** (canonical). |

---

## 11. Security (current and target)

| Topic | Status |
|-------|--------|
| **Password** | Minimum **8 characters** (enforced). Further complexity rules **TBD**. |
| **Session** | Long-lived cookie (~**1 year**); sliding expiry / refresh **TBD**. |
| **Audit** | Admin audit logging is part of the **security baseline** direction; scope **TBD** beyond current implementation. |
| **Compliance** | Data retention, PHI handling, and full compliance posture **not** fully defined; ship **minimal** baseline as agreed and document here when locked. |

---

## 12. Priority order (locked)

Work should generally align with this **sequenced** priority unless the CEO explicitly reprioritises and updates this file:

1. **Analytics instrumentation:** ResusGPS and other products emit events to **`analyticsEvents`**; admin reports show **real** product activity (not zeros).
2. **Staging:** `develop` → staging, `main` → production; PR verification on staging before production.
3. **Security baseline:** Password complexity, session max age, audit logging for admin (as specified when locked).
4. **ResusGPS v4:** Undo, medication dedup, multi-diagnosis, structured age, countdown timers, dose rationale.

---

## 13. How developers should work (guardrails)

- **Extend, don’t replace:** New features should plug into existing **routes**, **tRPC** procedures, **admin reports**, and **event tracking** unless there is a deliberate architectural decision.
- **Preserve the user model:** No **single-role lock**; preserve **multi-context switching** in the UI.
- **Preserve report definitions:** **This month** = EAT calendar month; **last 7 days** = rolling; **Safe-Truth** and **analyticsEvents** meanings as in [§8](#8-admin-reports-definitions).
- **Secrets:** No hardcoded credentials; use env vars and document in `.env.example` when adding new ones.

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
| **Institutions** | **Systems and capability**, not only “sell PALS seats” | Near-term value: **paediatric emergency readiness**, response teams, **consultancy**, **monitoring, evaluation, and learning**—helping hospitals **improve systems**. Teaching staff may be **one** lever, not the whole proposition. |
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

**Fellowship requirement (§17):** Learners must complete **all 26 ADF micro-courses** to qualify for Fellow status. The 26-course catalog spans 12 clinical domains (ABCDE + toxicology, burns, infectious) with foundational (I) and advanced (II) tiers for major topics.

**Course structure:**
- **Pattern:** For major topics (e.g. paediatric septic shock, asthma, convulsive status epilepticus, anaphylaxis, burns, toxicology), we plan **two course tiers** on the same theme:
  - **Course I** — foundational recognition, first-hour actions, safe escalation, and **when to refer** (reasons such as need for vasoactive drugs, advanced monitoring, refractory shock, refractory seizures, etc., without turning the course into a tertiary-only manual).
  - **Course II** — deeper management (e.g. fluid-refractory / catecholamine-refractory shock, second-line therapies, advanced airway, mechanical support where applicable). **Do not** label tiers in the UI as "primary vs tertiary"; describe them as **progression** ("after completing … I, optional … II for …").
- **Prerequisite:** Enrolment in **Course II** requires **Course I completed and passed** (quiz threshold met) for that topic. Same pattern for future pairs (e.g. refractory vs super-refractory status).
- **Pipeline:** Additional tiers (e.g. **Course III** for mechanical circulatory support or ultra-specialised rescue therapies) are **aspirational** until explicitly scheduled; document here when launched.

**26-course catalog (required for fellowship):**

| Domain | Courses | Tier I | Tier II | Notes |
|--------|---------|--------|---------|-------|
| **Cross-cutting** | 2 | Systematic approach to seriously ill child | Paediatric cardiac arrest | ABCDE framework foundation + post-ROSC |
| **A · Airway** | 4 | Asthma, Croup | Asthma II, Upper airway obstruction | Escalation triggers, advanced airway principles |
| **B · Respiratory** | 2 | Pneumonia, Bronchiolitis | Pneumonia II | Non-invasive support (HFNC/CPAP) referenced in I |
| **C · Circulatory** | 8 | Septic shock, Hypovolemic shock (diarrhea), Anaphylaxis, Neurogenic shock | Septic shock II, Hypovolemic shock II | Cardiogenic shock (arrhythmias, DCM), PE, tamponade, Tet spells |
| **D · Neurological** | 2 | Status epilepticus, Febrile seizure | Status epilepticus II | Altered consciousness (meningitis, encephalitis) |
| **E · Metabolic** | 4 | Hypoglycemia, DKA, Electrolyte disorders, AKI | DKA II | Acute kidney injury in shock contexts |
| **F · Trauma** | 2 | Trauma primary survey | Traumatic brain injury + massive hemorrhage | ABCDE + cervical spine + TXA awareness |
| **G · Toxicology** | 2 | Poisoning, Overdose | Caustic ingestion | Common LMIC presentations |
| **H · Burns** | 2 | Burns recognition & resuscitation | Burns advanced management | TBSA, Parkland, compartment syndrome |
| **I · Infectious** | 2 | Meningitis, Malaria | (Tier II as needed) | Rapid recognition, antimicrobial timing |
| **TOTAL** | **26** | **14 foundational** | **12 advanced** | All required for Fellow status |

**Clinical governance:** All 26 courses reviewed and approved by clinical faculty before launch. References: WHO, AHA ECC, CDC, FEAST, AHA PALS/BLS guidelines. Aligned with ResusGPS pathways.

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

## 17. Fellowship qualification, provider profile, and internal operational intelligence (non-public)

**PSoT short title:** *Fellowship rules, Care Signal, cumulative progress, and governance.*  
**Canonical detail (automation-only, grace rules, launch checklist, accredited facilities policy):** [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md).

**Fellowship requirement (updated):** Learners must complete **all 26 ADF micro-courses** (not 24) to satisfy pillar A. The 26-course catalog includes toxicology, burns, and infectious disease domains in addition to the original ABCDE + cross-cutting structure. This reflects the breadth of paediatric emergencies in LMIC settings and ensures comprehensive clinical readiness.

### 17.1 Principles

- **Fellow** is **100% automated** from platform data — **no** manual conferral in v1. If automation is incomplete, **do not** ship Fellow UI.
- **No fellowship surcharge** — pay **per course/micro-course**; fellowship is **earned** through courses, **ResusGPS**, **Care Signal**, and **course feedback** (instrumented).
- **Parent Safe-Truth** and **Care Signal** are **different products** — never use “Safe-Truth” for **staff** flows in user-facing copy ([§3](#3-what-we-do-offerings)).

### 17.2 Three pillars (all required)

1. **Courses:** **BLS, ACLS, PALS**, plus **every** active ADF micro-course — completion from **DB** (`certificates` / completion rules).
2. **ResusGPS:** **≥3** attributable cases **per taught condition**, with **server-side** depth rules (anti-gaming).
3. **Care Signal:** **24 consecutive qualifying months** of monthly reporting (EAT), with **grace / catch-up / reset** per linked doc §7 — **not** parent Safe-Truth submissions.

### 17.3 Grace (automated)

- **≤2 grace periods per calendar year** (EAT). After a **0-event month** using a grace, the **next month** must have **≥3** eligible staff events. **≤1 additional grace** in the same year after a successful catch-up (total **≤2**/year). **Third** failure mode per linked doc → **pillar C streak resets to zero**; pillars A and B **do not** reset.

### 17.4 Cumulative UX

- **One** learner-facing view of **distance to Fellow** (courses %, ResusGPS checklist, staff streak).

### 17.5 Profile and contact

- **Required** for fellowship-path enroll: cadre, facility, department, country, region, town.
- **Email / mobile** for **optional** future programmes (e.g. small groups) — **separate consent** per purpose.

### 17.6 Public facilities

- **No public performance rankings** of facilities until governance approves methodology.
- **Future:** **Paeds Resus accredited facilities** list (readiness-based, **binary** accreditation — trust signal, not ordinal league table); disclaimers required.

### 17.7 Launch gate

- Ship **Fellow** / fellowship progress **only** after [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md) **§11** checklist passes (automation, UX, legal, security).

### 17.8 Builders

- Implement **Care Signal** as first-class data model + APIs; wire **analyticsEvents** / admin as needed; **never** mix parent `parentSafeTruthSubmissions` KPIs with staff fellowship metrics.

---

**Last structural update:** 2026-04-04 — Care Signal routes + `careSignalEvents` tRPC; §17; [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md).
