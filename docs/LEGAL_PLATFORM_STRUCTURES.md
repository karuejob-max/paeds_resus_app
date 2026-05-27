# Legal platform structures — counsel engagement brief

**Disclaimer:** This document is an **informational analysis** to support counsel engagement and internal governance. It is **not** a substitute for licensed legal advice in Kenya or any other jurisdiction. Job Karue (CEO) should retain qualified counsel before relying on any policy, contract, or regulatory position described here.

**Version:** 1.0  
**Date:** 2026-05-27  
**Prepared for:** Job Karue, CEO — Paeds Resus  
**Aligns with:** [LEGAL_COMPLIANCE_BASELINE.md](./LEGAL_COMPLIANCE_BASELINE.md), PSOT §11, [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md) §11, [CLINICAL_OUTCOMES_PILOT.md](./CLINICAL_OUTCOMES_PILOT.md)

---

## 1. Executive summary

Paeds Resus operates as an integrated **health-education and clinical-decision-support platform** aimed at paediatric emergency care in low- and middle-income settings (Kenya-first). The platform collects **account, training, payment, QI reporting, and analytics data** across distinct products (ResusGPS, Care Signal, Safe-Truth, Fellowship, Institutional Portal). **Legal posture today is early-stage:** published Privacy Policy and Terms exist but are **minimal stubs**; Care Signal has a **first-submission consent gate** (engineering shipped); retention targets are **drafted** in [SECURITY_BASELINE.md](./SECURITY_BASELINE.md) but not yet counsel-reviewed or linked from Privacy; **no B2B MSA**, **no appeals process**, and **no Kenya Data Protection Act (2019) alignment memo** are published.

**Highest legal risk areas (ranked):**

1. **Clinical / medical-device characterisation** — ResusGPS delivers bedside paediatric emergency guidance with drug dosing; without clear disclaimers and regulatory classification, there is exposure under Kenya Pharmacy and Poisons Board, SAHPRA-adjacent norms, and general consumer-protection / professional-negligence theories if users treat output as definitive care instructions.
2. **Credentialing and Fellow title** — "Paeds Resus Fellow" is **not** an AHA credential, **not** a MOH licence, and **not** a medical specialty board certification. Engineering gates the title (`fellowTitleEnabled = false`), but marketing, certificates, and verification pages must stay aligned to avoid misrepresentation.
3. **Care Signal + national aggregate use** — Provider QI data flows to facility dashboards and (aspirationally) MOH/WHO surveillance. Without published consent scope, retention, anonymisation rules, and institutional agreements, liability for **defamation, employment action, or regulatory misuse** of reports is unmanaged.

**Overall posture:** Suitable for **controlled pilot and counsel review**; **not** yet suitable for public outcome claims, accredited-facility directories, or unconstrained MOH data-sharing without signed governance.

---

## 2. Entity & brand structure

| Term | Legal / operational role | Where it appears |
|------|--------------------------|------------------|
| **Paeds Resus** | Trade name for the **organisation and software platform** (multi-product). | User-facing copy, website, institutional references, copyright. |
| **Paeds Resus Limited** | **Registered legal entity** — AHA-Aligned Training Provider; issues invoices, certificates, BLS/ACLS/PALS training. | Training sign-up, WhatsApp about courses, certificate footers, M-Pesa receipts context. |
| **ResusGPS** | **Product name only** — bedside clinical decision support (`/resus`). Not the company name. | ResusGPS routes, CPR Clock, ABCDE flows, drug calculators. |
| **Care Signal** | **Product** — provider incident/near-miss QI reporting (`/care-signal`). | Fellowship Pillar C, facility/national aggregates. |
| **Parent Safe-Truth** | **Product** — parent/guardian journey feedback (`/parent-safe-truth`). Separate audience and KPI spine. | Parent lane; must never merge KPIs with Care Signal (PSOT non-negotiable). |
| **Paeds Resus Fellowship** | **Pathway brand** — three pillars (micro-courses, ResusGPS cases, Care Signal streak). Title: **Paeds Resus Fellow**. | Fellowship dashboard; distinct from AHA PALS/BLS/ACLS certificates. |

**Counsel note:** Ensure contracts, invoices, and certificate issuers consistently use **Paeds Resus Limited** where a legal entity is required; use **Paeds Resus** for platform UX; never conflate **ResusGPS** with the whole platform in binding documents.

**References:** `AGENTS.md` §6; PSOT §1; [BRAND_UPDATE_PAEDS_RESUS.md](./BRAND_UPDATE_PAEDS_RESUS.md).

---

## 3. User relationships

### 3.1 Terms acceptance

| Touchpoint | Mechanism | Gap |
|------------|-----------|-----|
| **Register** | Email/password account creation (`server/routers.ts` → `createUserWithPassword`) | **No explicit ToS checkbox** on register — acceptance implied by use only. |
| **Enroll / payment** | Checkbox + link to `/terms` (`client/src/pages/Enroll.tsx`) | Covers checkout; not full platform scope (Care Signal, Safe-Truth, Fellowship streak rules). |
| **Institutional onboarding** | Terms checkbox (`InstitutionalOnboarding.tsx`) | B2B terms are UI copy, not a published MSA template. |
| **Care Signal** | First-submission **consent dialog** (`CareSignalConsentGate.tsx`) | Consent references Privacy Policy but Privacy does not yet describe Care Signal purposes in detail. |
| **Browse / ResusGPS** | `/terms` and `/privacy` linked from footer, Help, Start | Passive availability; no click-wrap on first ResusGPS use (clinical disclaimer is separate — `ClinicalUseDisclaimer.tsx`). |

### 3.2 Account types

| `userType` | Primary surfaces | Legal implication |
|------------|------------------|-------------------|
| **individual** (provider) | ResusGPS, Fellowship, Care Signal, AHA/micro-course enrollment | Professional user; clinical disclaimer + training ToS apply. |
| **parent** | Safe-Truth, parent home | Guardian/family data; child-related narratives — heightened sensitivity under Kenya DPA "special categories" analysis needed. |
| **institutional** | Hospital Admin, staff roster, facility Care Signal review | Employer–platform–employee triangle; B2B contract should govern admin access to staff progress and QI data. |

### 3.3 Role switching

The UI preserves **multi-context switching** (provider / parent / institution) without account lock (`AGENTS.md` §9). **Legal implication:** a single login may act in three capacities; audit logs and consent must be **purpose-specific** (e.g. Care Signal consent does not cover Safe-Truth guardian submissions). Role boundaries are enforced in API (`RoleGate`, `role-boundary-provider-api.test.ts`) but Terms do not explain switching obligations.

---

## 4. Healthcare / clinical disclaimers

### 4.1 What exists in product copy

| Surface | Disclaimer substance | File |
|---------|---------------------|------|
| **Terms of Use** | "Not medical advice"; education only; does not replace clinical judgment | `client/src/pages/TermsOfUse.tsx` |
| **ResusGPS bedside** | "Reference support"; not substitute for local protocols or senior review | `client/src/components/ClinicalUseDisclaimer.tsx` |
| **Care Signal form** | No patient identifiers; follow local protocol | `CareSignalConsentGate.tsx`, form guidance |
| **Micro-courses** | "Evidence-informed training; follow your facility's protocols" | e.g. `CoursePaediatricSepticShock.tsx` |
| **Safe-Truth** | Non-blame, family voice framing | `client/src/pages/ParentSafeTruth.tsx` |

### 4.2 Gaps vs medical device / regulatory risk

**Kenya context (inferable):**

- Kenya does not have a mature **SaMD (Software as a Medical Device)** framework identical to FDA/MDR, but **Pharmacy and Poisons Board** oversight applies to medicinal product claims; **Kenya Bureau of Standards** and **consumer protection** apply to digital services; **MOH** may scrutinise tools used in public facilities.
- ResusGPS performs **weight-based drug dosing**, timers, and pathway escalation — behaviour closer to **clinical decision support** than passive education. Without classification, treat as **high vigilance**: maintain "reference support" positioning, document clinical sources ([CLINICAL_SAFETY_REGISTER.md](./CLINICAL_SAFETY_REGISTER.md)), and avoid diagnostic or outcome guarantees.

**LMIC general:**

- FEAST trial and fluid-caution content exists in septic shock teaching (`ensure-paediatric-septic-shock-catalog.ts`, `conditionProtocols.ts`) — good for honesty; counsel should review whether **pathway defaults** (e.g. 20 mL/kg NS bolus in `pathways/shock.ts`) need jurisdiction-specific variants for public-hospital deployment.

**Missing:**

- No standalone **ResusGPS intended-use statement** on `/resus` landing (only dismissible banner).
- Terms do not address **off-label use**, **telemedicine**, or **emergency reliance** on mobile connectivity.
- No documented **clinical governance charter** for pathway changes (flagged in PSOT §13 → CLINICAL_SAFETY_REGISTER).

---

## 5. Data protection

### 5.1 Data collected (by product)

| Product | Categories | Identifiers | Storage |
|---------|------------|-------------|---------|
| **Accounts** | Name, email, phone, password hash, role, userType | Direct identifiers | `users` table — Aiven MySQL |
| **ResusGPS session** | Age/weight in **sessionStorage**; optional case save for Fellowship | No patient names in saved cases (PSOT rule) | Client + `resusGPSSessions` / `resusGPSCases` |
| **Care Signal v2** | Facility, delays, equipment gaps, outcome, preventability | Provider user id; **no patient identifiers in schema** | `careSignalEvents` |
| **Safe-Truth** | Child age band, timeline, facility journey, optional named guardian | Parent user id; child age/outcome narrative | Parent Safe-Truth tables |
| **Fellowship** | Progress, certificates, streaks, grace usage | Provider id | `fellowshipProgress`, related |
| **Analytics** | Event taxonomy, page URLs, session ids | Pseudonymous session + user id when logged in | `analyticsEvents` |
| **M-Pesa** | STK requests, checkout ids, webhook payloads | Phone, payment amounts | `payments`, `mpesaWebhookLog` |
| **Certificates** | Issuance, verification codes | Name on certificate | `certificates` — public verify at `/verify-certificate` |
| **Institutional** | Staff roster, schedules, action logs | Employer + employee linkage | `institutionalAccounts`, `institutionalActionLogs`, etc. |

### 5.2 Retention (draft — not counsel-final)

From [SECURITY_BASELINE.md](./SECURITY_BASELINE.md) §4:

| Table / data | Target retention | Status |
|--------------|------------------|--------|
| `adminAuditLog` | 90 days online | Draft |
| `analyticsEvents` | 13 months (aggregate earlier) | Draft |
| Care Signal / Safe-Truth | "Per institutional policy" — **TBD** | **Not published** |
| Account deletion | Manual workflow TBD | **Not automated** |

### 5.3 Consent

- **Care Signal:** Explicit first-submission consent (`CareSignalConsentGate.tsx`); stored in localStorage + analytics event `care_signal_consent_granted`.
- **Safe-Truth:** Form-level journey; **no equivalent first-use consent dialog** comparable to Care Signal — counsel should review guardian narrative data.
- **Analytics:** No cookie/consent banner documented for Kenya DPA lawful basis (likely legitimate interest / contract — needs memo).

### 5.4 Cross-border / hosting

- **Database:** Aiven cloud MySQL (`*.aivencloud.com`) — SSL required (`server/db.ts`, `scripts/test-db-connection.mjs`). Data may reside **outside Kenya** depending on Aiven region selection.
- **Assets:** Cloudflare R2 (`assets.paedsresus.com`).
- **Email:** AWS SES / SendGrid (configurable).
- **Gap:** Privacy Policy does **not** disclose sub-processors, transfer mechanisms, or DPA registration status with **ODPC (Kenya)**.

---

## 6. Care Signal / QI data

### 6.1 Flow

1. Provider submits v2 report (`CareSignalFormV2.tsx` → `careSignalEvents` router).
2. Rate limits: 5/day EAT, 10-min duplicate guard (`server/lib/care-signal-rate-limit.ts`).
3. Facility aggregates → Hospital Admin / platform admin dashboards.
4. National Aggregate Signal (admin) — MOH/WHO surveillance **aspiration** (PSOT §19).
5. Fellowship Pillar C: EAT month bucketing, grace/catch-up rules ([FELLOWSHIP doc](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md)).

### 6.2 Liability & anonymisation

| Topic | Current state | Risk |
|-------|---------------|------|
| **Patient identifiers** | Schema + form guidance prohibit; not NLP-enforced | Free-text could contain PHI — needs moderation policy + counsel review |
| **Provider identification** | Reports tied to user id; institutional views show facility-level aggregates | Employer may infer reporter; Terms silent on whistleblower protection |
| **"Anonymous" marketing copy** | Post-case prompt historically said "anonymous" — **misleading** vs provider-linked records | Copy should say **de-identified from patients**, not anonymous to platform |
| **MOH use** | Strategic docs reference national aggregate; **no MOU** | Unauthorised official use of data could create regulatory backlash |
| **Defamation** | Preventability and system-gap fields | Institutional reputational harm if reports shared without governance |

### 6.3 Engineering controls (inventory)

- Consent gate: `client/src/components/CareSignalConsentGate.tsx`
- No patient id columns: `drizzle/schema.ts` (`careSignalEvents`)
- Admin review: `/admin/care-signal-review`
- Facility registry: `careFacilities`, migration 0041

---

## 7. Fellowship & credentials

### 7.1 "Paeds Resus Fellow" title

- **Automated only** when `FELLOWSHIP_LAUNCH_READINESS.fellowTitleEnabled === true` (currently **`false`** — `shared/fellowship-launch-gate.ts`).
- Requirements: all micro-courses + ≥3 ResusGPS cases per condition + 24-month Care Signal streak.
- **Not** AHA Fellow; **not** MOH specialist registration.

**Legal risk:** Misrepresentation as governmental or AHA credential; unfair competition if implied equivalence to PALS instructor status. Certificate PDFs use signatory "Job Karue / Course Director" — ensure distinction from AHA eCards.

### 7.2 Certificate verification

- Public `/verify-certificate` (`client/src/pages/VerifyCertificate.tsx`, `server/routers/certificates.ts`).
- Verification codes on certificates — **acceptable** if Terms state certificates attest **course completion**, not clinical competence or licensure.

### 7.3 AHA alignment vs platform credentials

| Track | Issuer | Legal note |
|-------|--------|------------|
| BLS / ACLS / PALS | Paeds Resus Limited as **AHA-Aligned Training Provider** | Must comply with AHA alignment agreements; separate from Fellowship |
| Fellowship micro-courses | Paeds Resus platform certificates | Platform-owned credentialing |
| Instructor course | `instructorNumber` assignment | B2B assignment requires instructor approval workflow |

**Gap:** Accredited facilities list blocked until §11.4 criteria — **do not publish rankings**.

---

## 8. Institutional / B2B

| Capability | Implementation | Contract gap |
|------------|----------------|--------------|
| Hospital Admin dashboard | `/hospital-admin-dashboard` | No published MSA |
| Staff roster / training | `institutionalAccounts`, bulk import | Employer data processor role undefined |
| Care Signal facility tab | `institution.getCareSignalFacilityDashboard` | Who may view which reports? |
| Action logs | `institutionalActionLogs` (migration 0043) | Evidence for QI — retention & discovery rules TBD |
| ERT / schedules | Institutional OS blueprint | Aspirational modules — contract scope unclear |

**MOU expectations for pilot:** [CLINICAL_OUTCOMES_PILOT.md](./CLINICAL_OUTCOMES_PILOT.md) requires facility medical leadership + data/privacy sign-off before 90-day run.

---

## 9. Payments

### 9.1 M-Pesa (Safaricom Daraja)

- STK push, webhook audit log (`mpesaWebhookLog`, migration 0040), admin reconciliation UI.
- Manual Lipa na M-Pesa fallback + receipt capture (`enrollment.submitManualMpesaReference`).
- Callback IP allowlist configurable (`MPESA_CALLBACK_IP_ALLOWLIST`).

### 9.2 Refunds & consumer protection

| Topic | State |
|-------|-------|
| Refund policy | **Not published** in Terms — only "fees follow terms shown at purchase" |
| Failed STK / reconciliation | Engineering recovery UX; no statutory cooling-off language |
| Pricing display | Enroll page + M-Pesa amounts — Kenya Consumer Protection Act fairness review needed |
| Sandbox vs production | `MPESA_ENVIRONMENT` — staging should use sandbox per `.env.example` |

---

## 10. Children / parents (Safe-Truth)

- **Audience:** Parents/guardians (`userType: parent` or parent lane).
- **Data:** Child age band, outcome (including passed-away), timeline of care journey, optional named submission (`ParentSafeTruthForm.tsx`).
- **Separation:** KPIs must not combine with Care Signal (PSOT §4) — engineering respects separate event types.
- **Gaps:**
  - No parental consent framework for **child-related narrative** beyond account creation.
  - No published policy on **bereavement data** sensitivity.
  - Counsel should assess **best interests of the child** and ODPC requirements for processing children's data.

---

## 11. What EXISTS today (inventory)

| Area | Artifact | Path |
|------|----------|------|
| Privacy Policy (stub) | Web page | `client/src/pages/PrivacyPolicy.tsx` |
| Terms of Use (stub) | Web page | `client/src/pages/TermsOfUse.tsx` |
| Legal baseline draft | Internal | `docs/LEGAL_COMPLIANCE_BASELINE.md` |
| Security / retention draft | Internal | `docs/SECURITY_BASELINE.md` |
| Care Signal consent gate | UI + analytics | `client/src/components/CareSignalConsentGate.tsx` |
| Clinical bedside disclaimer | UI | `client/src/components/ClinicalUseDisclaimer.tsx` |
| Fellowship §11 gate | Code flag | `shared/fellowship-launch-gate.ts` |
| Outcomes pilot framework | Internal | `docs/CLINICAL_OUTCOMES_PILOT.md` |
| M-Pesa webhook audit | DB + admin | `drizzle/0040_*`, `/admin/mpesa-webhooks` |
| Certificate verification | Public | `/verify-certificate` |
| Admin audit logging | DB | `adminAuditLog`, `server/_core/trpc.ts` |
| Role API boundaries | Tests | `server/routers/role-boundary-provider-api.test.ts` |
| Staging checklist | Ops | `docs/STAGING_GO_LIVE_CHECKLIST.md` |
| PSOT security §11 | Canonical (TBD fields) | `docs/PLATFORM_SOURCE_OF_TRUTH.md` §11 |

---

## 12. What is MISSING (gaps ranked)

### Critical

1. **Counsel-reviewed Privacy Policy & ToS** covering all products, Kenya DPA lawful bases, subprocessors, cross-border transfer, retention, and Care Signal / Fellowship / Safe-Truth scopes.
2. **Clinical governance & SaMD-style classification memo** for ResusGPS (intended use, limitations, LMIC fluid-strategy disclaimers).
3. **Institutional pilot MOU + B2B MSA template** before facility data-sharing or outcome pilot ([CLINICAL_OUTCOMES_PILOT.md](./CLINICAL_OUTCOMES_PILOT.md)).

### High

4. **Published retention schedule** linked from Privacy (per-table, operational deletion/export).
5. **Care Signal appeals process** (system errors only — Fellowship §11.3).
6. **Refund / cancellation policy** for M-Pesa and course purchases.
7. **Safe-Truth guardian consent & bereavement data policy.**
8. **ODPC registration / DPO appointment** assessment for Kenya operator.

### Medium

9. **Explicit ToS acceptance at registration** (click-wrap parity with Enroll).
10. **Whistleblower / non-retaliation language** for Care Signal in institutional settings.
11. **Accreditation criteria document** before any "accredited facility" list (§11.4).
12. **Cookie / analytics consent** banner if required by ODPC guidance.
13. **Automated account deletion workflow** (SECURITY_BASELINE §4 TBD).

---

## 13. Action plan for counsel & CEO

| Priority | Action | Owner | Target |
|----------|--------|-------|--------|
| P0 | Engage Kenya-qualified counsel; brief with this doc + LEGAL_COMPLIANCE_BASELINE | Job Karue | Week 1–2 |
| P0 | Draft full Privacy Policy & ToS (all products, Aiven/Render/Cloudflare subprocessors) | Counsel + CEO | Week 2–6 |
| P0 | ResusGPS intended-use & regulatory classification memo | Counsel + clinical lead | Week 2–4 |
| P1 | Institutional pilot MOU template (QI data, aggregates, no league tables) | Counsel + CEO | Before Phase 4 pilot |
| P1 | Publish retention schedule + link from Privacy | Engineering + counsel | Phase 1–3 |
| P1 | Care Signal appeals process (system errors) | CEO + ops | Phase 3 |
| P1 | M-Pesa refund/cancellation policy in Terms | Counsel | Phase 1 |
| P2 | Safe-Truth parental/child data addendum | Counsel | Phase 2 |
| P2 | ODPC registration determination | Counsel | Phase 2 |
| P2 | Register click-wrap + registration ToS | Engineering after counsel text | Phase 2 |
| P3 | B2B MSA for hospital contracts | Counsel | Phase 5 |
| **Hold** | Enable `fellowTitleEnabled` or public Fellow credentials | CEO only after §11 checklist + counsel | **Not until signed** |
| **Hold** | Public mortality/outcome claims | CEO + clinical governance | **Not until evaluation** |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-27 | v1.0 — Initial counsel engagement brief (Parts A comprehensive task) |
