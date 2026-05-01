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
| **Paeds Resus Fellowship** | The canonical name for the **narrative and progression umbrella** for advanced ward-focused learning (micro-courses ladder + optional legacy certifications); **not** a separate paywall—learners pay per course/SKU. Completion of the three pillars (Courses, ResusGPS, Care Signal) earns the title **Paeds Resus Fellow**. |
| **Safe-Truth** | **Parent and guardian** resources and truth-sharing flows (distinct audience and tone from ResusGPS). **Not** the staff monthly reporting channel for the **Paeds Resus Fellowship** — see **Care Signal**. |
| **Care Signal** | **Provider-facing** incident and near-miss reporting (QI culture); **distinct product name from Safe-Truth** in all user-facing copy. Drives the **automated** **Paeds Resus Fellowship** **monthly discipline** pillar alongside courses and ResusGPS — see [§17](#17-fellowship-qualification-provider-profile-and-internal-operational-intelligence-non-public). |},{find:
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
| **Institution** | Hospital admin institutional dashboards (canonical route: `/hospital-admin-dashboard`; legacy `/institutional-portal` may redirect) — institutional metrics and management. |
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
| **Post-login redirect** | By **default `userType` only:** `individual` → `/home`, `parent` → `/parent-safe-truth`, `institutional` → `/hospital-admin-dashboard` (legacy `/institutional-portal` may redirect). **No** “last-used role” persisted in DB yet. |

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
- **Certification Strategy (Incentives):** To maintain high learner motivation and clinical rigor, certificates are issued for **every** successfully completed micro-course, every AHA course (BLS, ACLS, PALS), and finally the **Fellowship Diploma** upon graduation. Certificates must be verifiable and downloadable on-demand from the provider dashboard.
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
| **Institutional systems** | Workflow, triage, procurement, accountability | Institutional OS |
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

#### Safe-Truth (Parent / Guardian)
- **Feeds:** Community voice layer, upstream gap detection, institutional accountability signal
- **Receives from:** None (input-only product for parents/guardians)
- **Integration note:** Safe-Truth data is **never** combined with provider-facing KPIs. Separate audience, separate data table, separate analytics stream. The only integration point is the admin report (§8), where Safe-Truth usage is reported separately from all provider metrics.
- **Canonical doc:** [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md) §9

#### Institutional OS
- **Feeds:** Facility-level analytics, MOH reporting, procurement intelligence
- **Receives from:** Care Signal (facility gap data), ResusGPS (case load by facility), Course completions (staff training status)
- **Integration gap (current):** Facility-level Care Signal dashboard not yet built; institutional admin sees only enrollment/payment data
- **Canonical doc:** [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md)

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
| [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md) | Active | Mission, theory of change, LMIC context — read before any product decision |
| [CARE_SIGNAL_STRATEGY_AND_ROADMAP.md](./CARE_SIGNAL_STRATEGY_AND_ROADMAP.md) | Active | Canonical Care Signal implementation detail — expands §17 and §19 |
| [CARE_SIGNAL_WORLD_CHANGING_POTENTIAL.md](./CARE_SIGNAL_WORLD_CHANGING_POTENTIAL.md) | Active | Strategic analysis of Care Signal's global potential — informs §20 |
| [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md) | Active | Canonical Fellowship rules — expands §17 |
| [COURSE_PORTFOLIO_AND_ADF_STRATEGY.md](./COURSE_PORTFOLIO_AND_ADF_STRATEGY.md) | Active | Course catalog and ADF strategy — expands §3 |
| [MICRO_COURSE_CATALOG_BACKLOG.md](./MICRO_COURSE_CATALOG_BACKLOG.md) | Active | 24-slot micro-course backlog — expands §3 |
| [CONVERSION_90_DAY_EXECUTION_PLAN.md](./CONVERSION_90_DAY_EXECUTION_PLAN.md) | Active | Growth execution plan — expands §18 |

### 21.2 Technical and Operational Documents

| Document | Status | Relationship to PSOT |
|----------|--------|---------------------|
| [RESUS_GPS_V4_FEATURES.md](./RESUS_GPS_V4_FEATURES.md) | Active | ResusGPS feature spec — expands §5 |
| [SECURITY_BASELINE.md](./SECURITY_BASELINE.md) | Active | Security requirements — expands §6 |
| [SECURITY_BASELINE_IMPLEMENTATION.md](./SECURITY_BASELINE_IMPLEMENTATION.md) | Active | Security implementation evidence |
| [PLATFORM_RELIABILITY_PLAN.md](./PLATFORM_RELIABILITY_PLAN.md) | Active | Reliability and uptime requirements |
| [RENDER_PREDEPLOY_LOCKED.md](./RENDER_PREDEPLOY_LOCKED.md) | Active | Deployment configuration — locked |
| [STAGING_DEPLOYMENT.md](./STAGING_DEPLOYMENT.md) | Active | Staging environment setup |
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
| New institutional or government partnership | Update §20.4 (MOH partnership pathway) |
| New migration applied to live database | Log in WORK_STATUS.md with migration number, date, and what changed |

### 22.3 What You Must Never Do

- **Never combine** Care Signal KPIs with Safe-Truth KPIs in any metric or report
- **Never combine** Fellowship pillar data across pillars in a single metric
- **Never add** patient identifiers to any Care Signal submission schema
- **Never grant** employer-visible individual Care Signal data without explicit provider consent
- **Never treat** AHA courses (BLS/ACLS/PALS) as part of the Fellowship pathway
- **Never create** a new canonical document without linking it in §21
- **Never make** a canonical decision in WORK_STATUS.md — that file is for execution updates only

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
2. **Read §20** (global surveillance vision) to understand the long-range architecture your product must support
3. **Read §21** (document registry) to find the canonical docs for your product
4. **Update §21** when you create a new strategic document
5. **Update §19** when you add a new integration point between products
6. **Update WORK_STATUS.md** when you apply a migration or make a significant change

The PSOT is a living document. It is only as useful as the discipline of the agents who maintain it.

---

**Last structural update:** 2026-05-01 — Added §19 (holistic ecosystem map), §20 (global surveillance vision), §21 (document registry), §22 (all-agents mandate). DB migrations 0037 (AHA completion gates) and 0038 (Care Signal facility/review) applied to live database.
