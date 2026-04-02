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
| **Courses** | Professional training paths such as **BLS, ACLS, PALS**, the **Instructor Course** (train-the-trainer), **short condition-focused modules** (e.g. shock, DKA) aligned with ResusGPS, and related enrollment and certification flows tied to the `enrollments` / `certificates` model. **Go-to-market emphasis** for individuals: see [§15](#15-business-strategy-market-context-and-revenue-focus-leadership). |
| **Elite fellowship** | Flagship advanced programme (same platform; programme type in data where applicable). |
| **Safe-Truth** | **Parent and guardian** resources and truth-sharing flows (distinct audience and tone from ResusGPS). |
| **Institutional** | **Hospitals and training organisations**: staff, schedules, metrics, and management surfaces (e.g. institutional portal, hospital admin). |
| **Admin** | **Platform owner** visibility: users, enrollments, certificates, Safe-Truth usage, analytics, operational tools—see [§8](#8-admin-reports-definitions). |

**Future products** may be added; they should follow the same pattern: named explicitly, integrated into auth and analytics—not bolted on as unnamed “other.”

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

---

**Last structural update:** 2026-04-01 — added [§15](#15-business-strategy-market-context-and-revenue-focus-leadership) business strategy and market context (leadership).
