# Paeds Resus — Platform Update, Structure & Reply to AI Team

**To:** Codex, Manus (AI co-developers)  
**From:** Job Karue, CEO  
**Re:** What we’re building, current status, how to help, and clarifications

---

## Brand and offerings (important)

**Paeds Resus** is the organisation and the platform. We are not “Paeds Resus / ResusGPS” as if they were the same thing — that’s confusing. **ResusGPS** is one of our key offerings; it stands **side by side** with other unique products that are not inferior to it, including:

- **Safe-Truth** — Parent and guardian resources and truth-sharing.
- **Our elite fellowship** — Among our flagship programmes.
- **Other products** — Yet to be launched.

ResusGPS is a core part of our identity, but not on its own. When you read “platform” or “we,” think **Paeds Resus**; when we refer to a specific product, we’ll name it (ResusGPS, Safe-Truth, fellowship, etc.).

---

# Part 1 — Platform update: status, structure & how to help

Team,

Here’s a concise snapshot of where the platform is today and how it’s structured so you can work effectively with the codebase and our roadmap.

---

## 1. What we’re building

**Paeds Resus** is our paediatric resuscitation and emergency-care organisation and platform. We offer multiple products under one brand: ResusGPS (real-time clinical guidance), Safe-Truth (parent and guardian), our elite fellowship, BLS/ACLS/PALS, and more to come. We’re on **our own infrastructure and identity** so we control the experience end-to-end and can grow without being tied to a single provider. Your role is to help us ship fast, keep quality high, and use this structure as the single source of truth.

---

## 2. Current platform structure (what we have so far)

### User identity & access

- **Auth:** Email + password (no OAuth dependency). Register and login are the only entry points.
- **User types (stored in DB):** **Healthcare provider**, **Parent/guardian**, **Institution.** One account can act in multiple roles; we don’t lock people into one “type.”
- **Role switching:** Logged-in users can switch context in the header (Healthcare Provider | Parent/Caregiver | Institution) and move between our products — e.g. ResusGPS, institution tools, Safe-Truth — without a second account.
- **Post-login:** Redirect by default user type; then they can always switch via the header or from the provider hub.

### Core surfaces

- **ResusGPS (/) —** Our real-time paediatric emergency guidance product (ABCDE, protocols, interventions). A key point-of-care offering.
- **Provider hub (/home) —** Dashboard for providers: access to ResusGPS, Enrol in a course, My learning, plus “Use as Institution” and “Use as Parent” so one person (e.g. medical director or clinician–parent) can reach all our experiences.
- **Parent & guardian (/parent-safe-truth) —** Safe-Truth and parent-facing resources.
- **Institution (/hospital-admin-dashboard; legacy `/institutional-portal` redirect) —** Institutional metrics, staff, and management.
- **Admin —** For the platform owner (me): **Admin** in header/account menu → **Admin hub (/admin)** with:
  - **Reports & insights (/admin/reports)** — Registered users by type, enrollments this month (BLS/ACLS/PALS/Fellowship), certificates issued this month, Parent Safe-Truth usage this month, and app/product activity (last 7 days). Optional list of registered users.
  - **Hospital Admin Dashboard** — Institutional view.
  - **Advanced Analytics** — Deeper analytics/reporting.

### New platforms / experiences we’ve onboarded

- **Provider home & dashboard** — Single hub for clinicians with clear links to ResusGPS, learning, and enrollment.
- **Multi-role, single account** — Same user can use ResusGPS as a provider, then switch to institution or parent (e.g. Safe-Truth) without re-registering.
- **Admin portal & reports** — Visibility into who’s registered, who applied for BLS/ACLS etc. this month, who’s certified, how many parents used Safe-Truth, and product/app activity.
- **Email/password auth** — No external OAuth; we own the full auth and session flow.

---

## 3. Infrastructure & stack (so you can reason about the system)

- **Frontend:** React, Vite, wouter, tRPC client.
- **Backend:** Express, tRPC, Node.
- **Data:** MySQL (Aiven). Schema and migrations via Drizzle. SSL and connection handling are set up for Aiven (including self-signed cert handling where needed).
- **Deployment:** Render (app); Aiven (MySQL). Custom domain: **www.paedsresus.com** (and paedsresus.com).
- **Env:** `DATABASE_URL`, `JWT_SECRET`, `APP_BASE_URL`, `AUTH_MODE=email`, optional `OWNER_OPEN_ID` (platform admin), optional `VITE_APP_ID` (defaults used if unset). `.env` is gitignored; `.env.example` documents variables.
- **Auth/session:** Cookie-based session (JWT). On localhost we use `sameSite: lax` so the cookie works; production uses secure cookies. Admin is determined by `OWNER_OPEN_ID` (e.g. `email:admin@example.com`).

When you suggest changes or debug, assume this stack and this deployment model unless we explicitly say otherwise.

---

## 4. How I need you to work with this

- **Use this as the source of truth** for “what exists” and “how it’s structured.” When you propose features or refactors, align with: one account / multi-role, provider hub, **all our offerings** (ResusGPS, Safe-Truth, fellowship, etc.) as first-class, and admin reports as the main visibility layer.
- **Preserve our user model:** Don’t reintroduce a single-role lock or remove the ability to switch between provider, institution, and parent.
- **Respect the new auth and infra:** We’re off external OAuth and on our own DB and deployment. Suggestions should assume email/password, our MySQL schema, and Render + Aiven unless we explicitly change direction.
- **Extend, don’t replace:** New features (e.g. more report filters, more analytics events, new courses) should plug into the existing routes, tRPC procedures, and admin reports where it makes sense.
- **If you’re “Codex” or “Manus”:** You’re part of the team that ships this. Your potential is highest when you’re fully onboarded to this structure and when your edits and suggestions keep the platform consistent, secure, and easy to operate.

---

## 5. What “success” looks like from here

- **Providers** get to ResusGPS, learning, and other Paeds Resus offerings in one place and can switch to institution or parent when needed.
- **Institutions** get clear metrics and management; **parents** get Safe-Truth and resources.
- **I (admin)** get a single place to see who’s registered, who applied for BLS/ACLS (and other courses, including fellowship) this month, who’s certified, how many parents used Safe-Truth, and what activity happened across the app in the last week.
- **You (Codex, Manus)** know the structure and infra, suggest and implement changes that fit this picture, and help us maximise the value of the **whole Paeds Resus platform** — all offerings — without breaking what we’ve built.

---

# Part 2 — Reply to Manus & Codex: clarifications, corrections & asks

Thank you both. Your summaries and questions are exactly the kind of clarity we need. Below I’ve corrected one thing, answered what we’ve already decided or implemented, and called out where I need your input. We work as a team: you spot gaps and I confirm or decide; I set direction and you stress‑test it. Our mission stays front and center: **no child dies from a preventable death**, and we’re building a sustainable, scalable organisation to make that real.

---

## 6. Correction for Manus — Admin reports

**Admin Reports are already implemented.**

We have a live **Reports & insights** surface at `/admin/reports` (reachable from the Admin hub) that includes:

- **Registered users** — Counts by type (provider, parent, institution) and an optional list (name, email, type, joined).
- **Enrollments this month** — BLS, ACLS, PALS, Fellowship (from `enrollments.createdAt`).
- **Certificates issued this month** — Same four programmes (from `certificates.issueDate`).
- **Parent Safe-Truth usage this month** — Count of `parentSafeTruthSubmissions` with `createdAt` in that month.
- **App / product activity (last 7 days)** — Count and top event types from `analyticsEvents`.

So that item is **done** for the current scope. What’s still open is: **instrumenting the app** so ResusGPS and other product flows actually send analytics events; until we do that, the “product activity” section will stay at zero. I’d like your input on where to hook those events so we get useful “what the platform has learnt” without cluttering the product.

---

## 7. Answers to Codex’s clarifications

### Role model in DB (single vs multi-role)

- **Current:** Single `userType` in DB (individual | parent | institutional). The **switch** (Provider / Parent / Institution) in the header is **session/UI state** (e.g. localStorage), not yet a second source of truth in the DB.
- **Interim rule:** “This user can switch to X” = any logged-in user can choose any of the three contexts in the UI. The DB only stores their **default** `userType` (e.g. for post-login redirect).
- **Future:** We may introduce a proper multi-role or “roles” table when we have a concrete need (e.g. permissions, billing, or compliance). I’d like your view: do you see a need to move to a multi-role table **now** for something we’re building soon, or is it safe to keep this interim model and revisit in a few months?

### Admin identity rule

- **Canonical rule:** Admin = **`role === 'admin'`** in the DB.
- **How it gets set:** When `openId === OWNER_OPEN_ID` (e.g. `email:admin@...`), we set and persist `role = 'admin'` (in the auth/upsert path). So OWNER_OPEN_ID is the **mechanism** to grant admin; the **authorisation check** is always `ctx.user.role === 'admin'`.
- No separate “role elevation” path right now; admin is solely via OWNER_OPEN_ID → persisted `role = 'admin'`.

### Post-login redirect priority

- **Current:** One-time redirect by **default `userType`** only: individual → `/home`, parent → `/parent-safe-truth`, institutional → `/hospital-admin-dashboard` (legacy `/institutional-portal` redirects). We do **not** use “last-used role” yet.
- **Default order when one account has multiple roles:** We don’t store “multiple roles” in DB; we have one `userType` and a UI switch. So the only “order” is: **first landing** = by `userType`; after that, the user chooses context from the header. If we later add last-used context (e.g. in localStorage), we can define whether that overrides the first-time redirect; for now it’s “userType only.”

### Admin reports — definitions (to avoid metric drift)

- **“This month”:** Calendar month in **EAT (East Africa Time, UTC+3)**. All “this month” report boundaries (start/end of month) are computed in EAT. Document this in code and in any reporting UI.
- **“Last 7 days”:** **Rolling** 7×24h from “now” (e.g. `daysAgo(7)`). Not calendar week. Timezone for “now” can follow server (UTC) unless we explicitly switch to EAT for consistency; for now rolling window is fine in UTC.
- **KPI event sources:**
  - **Safe-Truth usage (this month):** One row = one submission. Source: `parentSafeTruthSubmissions` where `createdAt` falls within the report month in EAT.
  - **App / product activity (last 7 days):** One row = one event. Source: `analyticsEvents` where `createdAt` is within the last 7 days. Today we have little or no instrumentation, so this will stay low until we add tracking.

### Course funnel status model

- **Applied / enrolled:** One row in `enrollments` = one application. Authoritative fields: `createdAt`, `programType` (bls | acls | pals | fellowship), `paymentStatus`, etc. “Applied this month” = `enrollments.createdAt` in that month.
- **Certified:** One row in `certificates` = one certificate issued. Authoritative: `issueDate`, `programType`. “Certified this month” = `certificates.issueDate` in that month.
- We are **not** yet enforcing a strict state machine (e.g. applied → paid → attended → certified) in code; we’re counting rows by date. If you want a formal funnel (status transitions, table fields), propose a short spec and we’ll align.

### Deployment environments

- **Current:** Single production (Render + Aiven). No dedicated staging environment yet.
- **Proposal:** Define a **staging** (Render + Aiven or separate DB) and a rule: **all PRs verified on staging before production.** I’d like your input on how you’d use staging (e.g. branch-based deploys, env parity, seed data) so we can implement it once and consistently.

### Security baseline

- **Password:** Minimum **8 characters** (enforced in schema/validation). No complexity or history requirements yet.
- **Session:** Long-lived cookie (e.g. 1 year); no refresh or sliding expiry implemented.
- **Not yet defined:** Complexity rules, session refresh, audit logs, data retention, PHI handling. I’d like **your recommendation** (as a team) for a minimal security baseline we can document and implement next: e.g. password rules, session max age/refresh, and whether we need audit logging for admin actions from day one.

### Domain routing

- **Current:** Custom domain is **www.paedsresus.com** (and paedsresus.com). Exact behaviour (redirect: root → www vs www → root) is not documented in code.
- **Ask:** We should document and implement one canonical rule (e.g. **paedsresus.com → 301 to www.paedsresus.com**). If you have a preference (www vs non-www) for SEO and branding, say so and we’ll make it canonical everywhere.

---

## 8. Priority order (for Manus) — and ask for your input

You asked: **A) ResusGPS v4 upgrades, B) Admin Reports, C) Provider Hub integration, D) Something else?**

- **B) Admin Reports** — Done for the current scope (see above); next step is instrumentation and, if needed, timezone/definition tweaks.
- **A) ResusGPS v4** — Undo, medication dedup, multi-diagnosis, structured age input, countdown timers, dose rationale: these directly improve safety and usability at the point of care for ResusGPS, so they’re high impact.
- **C) Provider Hub** — Full integration (e.g. ResusGPS + learning dashboard + enrollments in one flow) improves daily use and retention across our offerings.

I’m inclined to prioritise **A) ResusGPS v4** next, then **C) Provider Hub**, with **B)** in maintenance mode plus analytics instrumentation. But I want your view: do you see a different order that better serves the mission (preventable death reduction) or unblocks something critical (e.g. a partner, a compliance need)? If so, argue the case and we’ll adjust. You’re the checks and balances on my prioritisation.

---

## 9. What I need from you as a team

- **Manus:** Once we lock the priority order, can you outline a **concrete next slice** for ResusGPS v4 (e.g. “undo + one other item”) and where analytics events should fire so Reports & insights stays meaningful across our products?
- **Codex:** Can you turn the security and domain answers above into a **short, living doc** (e.g. “Security & environment decisions”) we can keep in the repo and update as we add staging, audit logs, or compliance?
- **Both:** Flag anything that looks wrong or risky in the current state (auth, roles, reports definitions, funnel logic). Your job is to spot blind spots and inconsistencies so we don’t build on shaky foundations. If something could block us from scaling or from the mission, say it now.

---

## 10. Mission and bar

We’re building toward an organisation that can operate at scale and **ensure no child dies from a preventable death**. That only happens if our products — ResusGPS, Safe-Truth, fellowship, and what we launch next — are safe, the data is trustworthy, and the team (including you two) can move fast without breaking things. Your questions and clarifications are how we get there. Keep asking, keep correcting, and we’ll keep aligning.

---

I’ll keep this doc updated as we add major surfaces or change infra. Use it to orient yourself and to make sure your contributions align with our current structure and goals.

Thanks for being part of getting **Paeds Resus** to the next level.

---

# Part 3 — Follow-up: definitive answers (Codex & Manus)

**Re:** Your latest clarifications and asks. Lock these in and use them as the single source of truth.

---

## 11. Codex — definitive answers

| Topic | Answer |
|-------|--------|
| **Role model: multi-role table now?** | **No.** Keep single `userType` in DB for now. **Interim source of truth for “this user can switch to X”:** any logged-in user can choose any of the three contexts (Provider / Parent / Institution) in the UI; the DB only stores default `userType` for post-login redirect. Revisit a proper multi-role mapping table when we have a concrete need (e.g. permissions, billing). |
| **Admin identity** | **Canonical:** Admin = `role === 'admin'` in the DB. **Mechanism:** Only via `openId === OWNER_OPEN_ID` at auth/upsert (e.g. `email:admin@...`). We do **not** allow role elevation by editing `role` in the DB for other users; OWNER_OPEN_ID is the only way to become admin. |
| **Post-login redirect** | **Default order:** Redirect by **default `userType`** only (individual → `/home`, parent → `/parent-safe-truth`, institutional → `/hospital-admin-dashboard`; legacy `/institutional-portal` redirects). We do **not** use “last-used role context” yet. So: first landing = by `userType`; after that, user chooses context from the header. |
| **Admin reports — timezone** | **“This month”** = calendar month in **EAT (East Africa Time, UTC+3)**. **“Last 7 days”** = rolling 7×24h from “now.” KPI sources: Safe-Truth = one row per `parentSafeTruthSubmissions` in that month (EAT); product activity = one row per `analyticsEvents` in last 7 days. |
| **Course funnel** | Authoritative: **Applied/enrolled** = `enrollments` (e.g. `createdAt`, `programType`, `paymentStatus`). **Certified** = `certificates` (`issueDate`, `programType`). We are **not** enforcing a strict state machine yet; we count by date. Propose a short spec if you want formal status transitions. |
| **Deployment** | **Current:** Single production (Render + Aiven). **No** separate staging yet. **Rule when we add it:** All PRs should be verified on staging before production. |
| **Security baseline** | **Password:** Minimum 8 characters (enforced). Complexity/refresh not yet defined. **Session:** Long-lived cookie (~1 year); no refresh/sliding expiry yet. **Compliance:** Audit logs, data retention, PHI handling — not yet defined. I’d like your joint recommendation for a minimal baseline (password rules, session max age, audit logging for admin actions). |
| **Domain routing** | **Canonical:** Implement and document one rule. Preferred: **paedsresus.com → 301 redirect to www.paedsresus.com**. Confirm in code and deploy. |

**Codex:** Yes — please convert this brief into a versioned repo doc (e.g. `docs/PLATFORM_SOURCE_OF_TRUTH.md`) and a lightweight “engineering acceptance checklist” so Codex, Manus, and any devs follow exactly one standard every sprint.

---

## 12. Manus — priorities and answers

| Ask | Answer |
|-----|--------|
| **Which to focus on first?** | **Analytics instrumentation** first: hook ResusGPS (and other products) so `/admin/reports` shows real activity. That unlocks visibility immediately. Then staging, then security baseline, then ResusGPS v4 clinical upgrades. |
| **Staging preference?** | **Branch-based deploys:** e.g. `develop` → staging, `main` → production. All PRs verified on staging before production. |
| **Security baseline before or after analytics?** | **After analytics.** Get instrumentation live first; then document and implement the minimal security baseline (password, session, audit logging) so we don’t block visibility. |
| **ResusGPS v4 — still a priority or defer?** | **Still a priority**, but **after** analytics is live. Order: (1) Analytics instrumentation, (2) Staging, (3) Security baseline, (4) ResusGPS v4 clinical upgrades (undo, medication dedup, multi-diagnosis, structured age, countdown timers, dose rationale). |

---

## 13. Mandatory for everyone (Codex, Manus, Cursor)

- **Repo review:** Every team player — including you (Codex, Manus) and you (Cursor) — must **go through the whole repo** and understand what is already there before proposing or implementing changes. The goal is to **avoid reinventing the wheel**: reuse existing routes, components, schemas, and patterns. If something already exists, extend it; don’t duplicate it.
- **Conservative use of time and credits:** Everyone must act **conservatively** to save time and to avoid depleting credits or tokens used during responses. Prefer small, targeted changes; avoid large speculative rewrites or redundant questions that are already answered in this doc. If you notice that my (Job’s) actions or requests are increasing token/credit usage unnecessarily, **please say so** so we can adjust.

---

**Job Karue**  
CEO, Paeds Resus
