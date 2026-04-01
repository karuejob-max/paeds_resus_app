# Institutional platform audit

**Purpose:** Single view of the institutional (B2B / hospital) experience—what exists, what’s weak, and what to do next.  
**Date:** 2026-02-25  
**Scope:** Routes, UI, tRPC/APIs, data model, and alignment between them.

---

## 1. Executive summary

The institutional side has a **strong public-facing layer** (`/institutional`: value prop, course grid, institutional pricing/ROI, quote via WhatsApp) and a **solid backend skeleton** (`institution` router: accounts, staff, quotations, contracts, aggregated stats from `institutionalStaffMembers`).

The **largest gaps** are:

1. **No reliable link between the logged-in institutional user and their `institutionalAccounts.id`** — registration uses `userId: 0` placeholder; `HospitalAdminDashboard` hardcodes `institutionId = 1`.
2. **Two parallel “portals”** — `InstitutionalPortal` is mostly **static placeholders** (zeros, non-functional buttons); `HospitalAdminDashboard` is the one that actually calls APIs but still uses the wrong institution id.
3. **Onboarding does not persist data** — `InstitutionalOnboarding` simulates an API delay only; it does not call `institution.register`, `institutionalInquiries`, or create/link an account.
4. **Leads are not stored** — `InstitutionalLeadForm` opens WhatsApp only; `institutionalInquiries` exists in DB (`server/db.ts` helpers) but **no tRPC surface** for the client.
5. **Bulk enrollment service is orphaned** — `server/institutional-enrollment.ts` (`processBulkEnrollment`) is **not exposed** on any router.
6. **Institutional notifications** — router mostly **logs / LLM-generated copy**; real email/SMS delivery is not end-to-end for institutions.

Until (1) and (2)/(3) are fixed, **institutional admins cannot trust metrics or staff data** in the product UI.

---

## 2. What exists today (inventory)

| Area | Location | Notes |
|------|----------|--------|
| Marketing + pricing | `client/src/pages/Institutional.tsx` | Courses, `getInstitutionalPrice` / `pricing.ts`, ROI helper, links to dashboards |
| Quote / lead | `client/src/components/InstitutionalLeadForm.tsx` | **WhatsApp-only**; no DB |
| Onboarding UX | `client/src/pages/InstitutionalOnboarding.tsx` | **Mock submit** (`setTimeout`); sets `sessionStorage` welcome flag → portal |
| “Portal” (static) | `client/src/pages/InstitutionalPortal.tsx` | KPIs hardcoded `0`; staff/quotation/training/incidents tabs are UI shells |
| Admin dashboard (API-backed) | `client/src/pages/HospitalAdminDashboard.tsx` | Uses `institution.getStats`, `getStaffMembers`; **`institutionId` hardcoded to `1`** |
| Staff CSV | `client/src/components/StaffBulkImport.tsx` | Uses `institution.bulkImportStaff` (needs real `institutionId`) |
| API | `server/routers/institution.ts` | `register`, `getDetails`, `updateDetails`, staff CRUD, `bulkImportStaff`, `getQuotations`, `getContracts`, `getStats`, `verify` |
| Notifications | `server/routers/institutional-notifications.ts` | Procedures exist; delivery is not production-complete |
| Bulk enrollment logic | `server/institutional-enrollment.ts` | **Not wired** to HTTP/tRPC |
| Schema | `drizzle/schema.ts` | `institutionalAccounts`, `institutionalStaffMembers`, `institutionalInquiries`, `quotations`, `contracts`, `institutionalAnalytics`, incidents-related tables, etc. |

**Routes (from `App.tsx`):** `/institutional`, `/institutional-portal`, `/institutional-onboarding` (alias: `/institution-onboarding` → redirect), `/hospital-admin-dashboard` (redirect from `/institutional-dashboard`).

---

## 3. Key gaps (detailed)

### G1 — User ↔ institution binding (critical)

- `institution.register` inserts `userId: 0` with a comment “placeholder”.
- No documented flow sets `institutionalAccounts.userId` to the real admin user.
- **Impact:** Wrong tenant data, security risk if ids are guessed, all downstream features broken for real customers.

### G2 — `InstitutionalPortal` vs `HospitalAdminDashboard` (critical product/UX)

- Duplicate concepts; portal looks “done” but isn’t wired.
- **Impact:** Confusion for team and users; wasted maintenance.

### G3 — Onboarding not persisted (high)

- No row in `institutionalAccounts` or `institutionalInquiries` from onboarding form.
- **Impact:** Sales/ops can’t follow up from the app; “success” is illusory.

### G4 — Portal KPIs and tabs (high)

- Portal ignores `institution.getStats` and staff APIs.
- **Impact:** “Institutional Portal” undermines trust (everything shows zero).

### G5 — Leads only on WhatsApp (medium–high)

- `institutionalInquiries` + `db` helpers exist but no `trpc` procedure for the form.
- **Impact:** No pipeline in CRM/admin; lost leads if WhatsApp isn’t monitored.

### G6 — `institutionId` always `1` in hospital admin (high, quick fix once G1 exists)

- **Impact:** Every institutional user sees the same (possibly empty) dataset.

### G7 — Bulk enrollment not exposed (medium)

- **Impact:** Can’t operationalize “enroll 50 staff” from the app.

### G8 — Quotations / contracts / training / incidents in UI (medium)

- Backend can read `quotations` / `contracts`; portal tabs don’t call them; training/incidents likely need schema + APIs + UI.

### G9 — Institutional notifications (medium)

- Needs real provider (e.g. SES) + templates + audit; currently weak for production.

### G10 — Authz on `institution.*` (high for production)

- Procedures are `protectedProcedure` but may not verify `ctx.user` owns `input.institutionId`.
- **Impact:** IDOR risk if institution ids are enumerable.

---

## 4. Prioritization: impact vs ease

Legend: **Impact** (1–5), **Ease** (1–5, 5 = easiest). Sort order = **do first**: high impact + easy.

| ID | Gap | Impact | Ease | Rationale |
|----|-----|--------|------|-----------|
| **G1a** | Add `institution.getMyAccount` (or extend session) resolving `institutionalAccounts` by `userId` | 5 | 3 | Unblocks correct id everywhere |
| **G1b** | On `register` / onboarding completion: set real `userId`, or create account then `update` | 5 | 3 | Fixes placeholder `0` |
| **G6** | Replace hardcoded `institutionId` in `HospitalAdminDashboard` with resolved id | 5 | 4 | Tiny UI change after G1a |
| **G4a** | Wire `InstitutionalPortal` KPIs to `getStats` (same id resolution) | 5 | 4 | Reuses existing API |
| **G4b** | Wire Staff tab to `getStaffMembers` + add staff mutation (minimal forms) | 5 | 3 | High value for admins |
| **G3** | Persist onboarding: `trpc` mutation → `institutionalAccounts` + link user | 5 | 3 | Stops fake success |
| **G10** | Enforce institution ownership on `institution.*` inputs | 5 | 3 | Required before real tenants |
| **G2** | Decide: merge portals vs redirect one to the other + deprecate duplicate KPIs | 4 | 2 | Product decision + refactor |
| **G5** | `institution.submitInquiry` + wire `InstitutionalLeadForm` (optional: keep WhatsApp) | 4 | 4 | DB helpers exist |
| **G7** | Expose `processBulkEnrollment` via tRPC + admin UI entry | 4 | 2 | Service exists; needs API + UX |
| **G8** | Hook quotation tab to `getQuotations` / PDF export stub | 3 | 3 | Backend partially there |
| **G9** | Real email path for institutional notifications | 3 | 2 | Infra + templates |

**Suggested first slice (1–2 sprints):** G1a → G1b → G6 → G10 → G4a → G4b → G3 → G5.  
Then G2 (consolidate portals), then G7/G8/G9.

---

## 5. Collaboration: scrum board

Use **`docs/INSTITUTIONAL_BACKLOG_BOARD.md`** as the living board (Backlog | To Do | In Progress | Done | Owner).

Update that file when you:

- Pull an item into **In Progress** (add your name).
- Finish work (move to **Done**, add date).
- Split or reprioritize (keep IDs stable: **INST-*** ).

---

## 6. Relation to main platform backlog

- `docs/BACKLOG_BOARD.md` **DATA-1** (“Wire InstitutionalPortal KPIs”) overlaps with **G4** here — track detail on the institutional board; optionally mark DATA-1 as “see INSTITUTIONAL_BACKLOG_BOARD” when syncing.

---

*Audit by Cursor from repo review. Re-audit after G1/G4/G3 are shipped.*
