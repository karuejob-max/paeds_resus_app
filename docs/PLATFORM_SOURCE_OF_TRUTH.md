# Platform source of truth

**Purpose:** Single canonical reference for **who Paeds Resus is**, **what we build**, **for whom**, **why**, and **how we decide** implementation details (auth, roles, reports, deployment, priorities). Any developer should be able to onboard from this file and the codebase without a separate sit-down—though clarifying questions are always welcome.

**Audience:** All developers (including Codex, Manus, Cursor), contractors, and anyone shipping code or product decisions.

**Strategic foundation (read second):** [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md) — **one holistic problem** (preventable childhood death and harm in low-resource settings), **theory of change** (why ResusGPS + training + institutions + analytics + Safe-Truth), **clinical origin narrative**, **institutional and community patterns**, **Book of the Unforgotten** (ethical frame), and **honest success criteria**. It does **not** override technical decisions in this file; it explains **why** the platform is multi-product.

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
| **Courses** | Professional training paths such as **BLS, ACLS, PALS**, and related enrollment and certification flows tied to the `enrollments` / `certificates` model. |
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

- **Applied / enrolled:** A row in **`enrollments`** = one application. Authoritative fields include `createdAt`, `programType` (`bls` \| `acls` \| `pals` \| `fellowship`), `paymentStatus`, etc. There is **no** strict enforced state machine in code yet; metrics are **counts by date** unless we add a formal funnel later.
- **Certified:** A row in **`certificates`** = one certificate. Authoritative fields include `issueDate`, `programType`.

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
- After substantive edits, note the change in [WORK_STATUS.md](./WORK_STATUS.md) (who, what, date, commit).

---

**Last structural update:** 2026-03-31 — linked [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md) for holistic mission and theory of change.
