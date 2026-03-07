# Paeds Resus — Platform Source of Truth

Last updated: 2026-03-07
Owner: Job Karue (CEO) + engineering team

This document is the canonical orientation for Codex, Manus, Cursor, and human developers.

## 1) Brand and Product Model

- **Platform/organisation name:** Paeds Resus.
- **Product offerings under Paeds Resus:**
  - ResusGPS
  - Safe-Truth
  - Elite fellowship
  - BLS / ACLS / PALS
  - Additional future offerings

### Non-negotiable naming rule

Do not present Paeds Resus and ResusGPS as equivalent terms. ResusGPS is a key offering within Paeds Resus.

## 2) Current User Identity & Access Model

- Authentication: **Email + password** (no external OAuth dependency).
- Sessions: **JWT cookie sessions**.
- DB stores one default `userType` currently.
- UI supports context switching between:
  - Healthcare Provider
  - Parent/Caregiver
  - Institution

### Multi-role interim rule

- A logged-in user can switch to any of the three contexts in UI.
- DB `userType` is used as default landing context after login.
- A dedicated multi-role mapping table is deferred until a concrete permissions/billing/compliance need exists.

## 3) Admin Authorization (Definitive)

- Canonical admin check: `role === 'admin'` in DB.
- Admin provisioning mechanism: `openId === OWNER_OPEN_ID` during auth/upsert path.
- No alternative role-elevation path is currently approved.

## 4) Routing and Core Surfaces

- `/` → ResusGPS (point-of-care emergency guidance product)
- `/home` → Provider hub
- `/parent-safe-truth` → Parent/caregiver Safe-Truth experience
- `/institutional-portal`, `/hospital-admin-dashboard` → Institutional surfaces
- `/admin`, `/admin/reports` → Admin surfaces

### Post-login redirect rule

- Redirect by default DB `userType` only:
  - individual → `/home`
  - parent → `/parent-safe-truth`
  - institutional → `/institutional-portal`
- Last-used context override is not enabled today.

## 5) Reporting Definitions (Definitive)

- **“This month”** uses **EAT (UTC+3)** calendar month boundaries.
- **“Last 7 days”** uses rolling 7×24 hours from “now”.

### Current KPI source definitions

- Parent Safe-Truth usage (this month): rows in `parentSafeTruthSubmissions` in EAT month window.
- Product/app activity (last 7 days): rows in `analyticsEvents` in rolling 7-day window.

## 6) Course Funnel Definition (Current)

- Applied/enrolled metrics derive from `enrollments` (`createdAt`, `programType`, `paymentStatus`).
- Certified metrics derive from `certificates` (`issueDate`, `programType`).
- Strict state-machine workflow is not yet enforced; counts are date-based.

## 7) Infra and Deployment Baseline

- Frontend: React + Vite + wouter + tRPC client.
- Backend: Express + Node + tRPC.
- Data: MySQL (Aiven) + Drizzle.
- Hosting: Render (app), Aiven (DB).
- Current environment topology: production only (no dedicated staging yet).

### Approved direction

Adopt staging with branch-based deploy policy:

- `develop` → staging
- `main` → production
- All PRs verified on staging before production.

## 8) Security Baseline (Current + Next)

### Current

- Password minimum length: 8.
- Long-lived cookie session.
- No session-refresh/sliding-expiry policy yet.

### Next (planned)

- Password complexity policy.
- Session duration/refresh policy.
- Admin/audit logging policy.
- Retention policy for security and analytics logs.
- PHI handling/compliance baseline documentation.

## 9) Domain Canonicalization

Preferred canonical rule:

- `paedsresus.com` → 301 redirect to `www.paedsresus.com`

This must be implemented and documented consistently at edge/app config.

## 10) Prioritization (Locked Current Order)

1. Analytics instrumentation (ResusGPS + other products) so reports reflect real usage.
2. Staging environment setup and branch deploy flow.
3. Security baseline hardening.
4. ResusGPS v4 clinical upgrades (undo, medication dedup, multi-diagnosis, structured age, countdown timers, dose rationale).
5. Provider hub integration enhancements.

## 11) Working Rules for AI + Developers

- Review existing repo surfaces before proposing large changes.
- Extend existing routes/components/schemas where possible; avoid duplication.
- Prefer targeted, conservative changes that preserve credits/time.
- Explicitly call out wasteful or redundant work patterns when noticed.

---

If platform structure or infra changes materially, this file must be updated in the same PR.
