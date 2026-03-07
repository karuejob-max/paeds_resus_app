# Paeds Resus — Engineering Acceptance Checklist

Use this checklist for every feature/refactor PR.

## A) Platform Alignment

- [ ] Uses Paeds Resus platform framing (not “ResusGPS = whole platform”).
- [ ] Preserves multi-offering structure (ResusGPS, Safe-Truth, fellowship, etc.).
- [ ] Preserves one-account, multi-context user flow.

## B) Auth, Roles, and Access

- [ ] Uses email/password auth model (no external OAuth dependency introduced).
- [ ] Preserves JWT cookie session behavior.
- [ ] Does not break role-context switching in UI.
- [ ] Admin authorization still relies on DB `role === 'admin'`.

## C) Reporting & Data Definitions

- [ ] “This month” calculations use EAT boundaries where applicable.
- [ ] “Last 7 days” metrics use rolling 7-day windows.
- [ ] Any new KPI includes source table/events and counting unit in PR notes.

## D) Infra & Deployment

- [ ] Env vars added/changed are documented (`.env.example` and relevant docs).
- [ ] Change is compatible with Render + Aiven model.
- [ ] If staging flow is touched, follows `develop`→staging and `main`→production policy.

## E) Security Baseline

- [ ] No sensitive fields are leaked in API responses.
- [ ] Password/session behavior remains compliant with current baseline.
- [ ] Security-relevant changes include notes on auditability and retention impact.

## F) Reuse and Scope Control

- [ ] Existing routes/components/tables were evaluated before adding new ones.
- [ ] No duplicate implementation of an existing capability.
- [ ] Scope is incremental and conservative (no speculative rewrites).

## G) Validation and Delivery

- [ ] Formatting/lint/type checks run and outcomes documented.
- [ ] Frontend changes include screenshot when applicable.
- [ ] Commit message clearly states intent.
- [ ] PR summary includes behavior change + risk notes.
