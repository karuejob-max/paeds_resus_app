# Security & Environment Decisions (Living Document)

Last updated: 2026-03-07
Owner: Paeds Resus (CEO + engineering)

This document is the operational source of truth for security and environment decisions across Paeds Resus products (ResusGPS, Safe-Truth, fellowship, and future offerings).

## 1) Platform and Product Scope

- **Platform brand:** Paeds Resus.
- **Products under platform:** ResusGPS, Safe-Truth, fellowship, and additional offerings.
- **Engineering principle:** Changes should preserve multi-offering architecture and avoid product-specific lock-in.

## 2) Identity and Access

### Current decision (implemented)

- Authentication is **email + password**.
- Sessions are **JWT-based cookies** (HTTP-only).
- User context supports **Provider / Parent-Caregiver / Institution** switching in UI.
- Current DB stores one default `userType` while context switching is session/UI-managed.

### Rule for contributions

- Do not reintroduce external OAuth as a required login path.
- Do not reintroduce single-role lock-in behavior.

## 3) Admin Authorization

### Current decision

- Authorization check for admin features is based on DB role (`role = 'admin'`).
- `OWNER_OPEN_ID` is used as provisioning mechanism for owner admin identity in current flow.

### Rule for contributions

- Keep admin checks centralized and explicit in server procedures/routes.

## 4) Data and Reporting Definitions

### Current decision

- “This month” reports use **UTC calendar month** boundaries.
- “Last 7 days” reports use a **rolling 7-day window**.
- Metrics are only as reliable as event instrumentation.

### Rule for contributions

- Any new KPI must define:
  1. Source table/event,
  2. Time window behavior,
  3. Counting unit (row, unique user, session, etc.).

## 5) Environment and Deployment

### Current decision

- Runtime stack: React + Vite + wouter + tRPC client, Express + tRPC + Node backend.
- Data: MySQL (Aiven) with Drizzle schema/migrations.
- Hosting: Render (app) + Aiven (DB).
- Current mode: production-focused; staging standardization is a planned next step.

### Required env variables

- `DATABASE_URL`
- `JWT_SECRET`
- `APP_BASE_URL`
- `AUTH_MODE=email`

### Optional env variables

- `OWNER_OPEN_ID`
- `VITE_APP_ID`

## 6) Security Baseline

### Current minimum baseline

- Password minimum length: 8 characters.
- HTTP-only auth cookie.
- Secure-cookie behavior depends on environment.

### Next baseline upgrades (recommended)

1. Add explicit password policy (length + composition + breached-password guidance).
2. Define session lifetime + optional sliding refresh strategy.
3. Add admin/audit logging policy (especially for admin/reporting actions).
4. Define retention policy for security logs and analytics events.

## 7) Domain Canonicalization

### Current state

- Domains in use: `www.paedsresus.com` and `paedsresus.com`.
- Canonical redirect policy must be fixed and enforced consistently.

### Action to complete

- Choose canonical host (recommended: `www.paedsresus.com`) and enforce 301 redirect from the non-canonical host.

## 8) Change Control Checklist

For every PR that affects auth, env, security, or reporting:

- [ ] Confirms compatibility with Paeds Resus multi-offering model.
- [ ] Confirms compatibility with email/password auth.
- [ ] Confirms no regression in role-switching UX.
- [ ] Documents KPI window/source changes if analytics/reporting changed.
- [ ] Documents env variable additions/changes.
- [ ] Includes tests/checks run and known limitations.

---

This file is intentionally a living document. Update it when infrastructure, auth, security policy, reporting logic, or domain strategy changes.
