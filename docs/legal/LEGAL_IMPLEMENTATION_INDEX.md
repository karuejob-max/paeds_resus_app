# Legal Implementation Index

**Document:** LEGAL_IMPLEMENTATION_INDEX.md  
**Version:** 1.0.0  
**Effective date:** 27 May 2026  
**Last updated:** 27 May 2026  
**Purpose:** Map counsel-ready `docs/legal/` documents to engineering surfaces, API routes, and UI paths  

**Canonical versions:** `shared/legal-versions.ts` (v1.0.0, date 2026-05-27)

---

## 1. Document registry

| # | Counsel document (`docs/legal/`) | Version key | Public / internal |
|---|----------------------------------|-------------|-------------------|
| 1 | PRIVACY_POLICY_FULL.md | `privacyPolicy` | Public → `/privacy` |
| 2 | TERMS_OF_USE_FULL.md | `termsOfUse` | Public → `/terms` |
| 3 | CARE_SIGNAL_DATA_PROCESSING_NOTICE.md | `careSignalNotice` | Public → `/legal/care-signal` |
| 4 | INSTITUTIONAL_B2B_ADDENDUM.md | `institutionalB2bAddendum` | B2B + onboarding reference |
| 5 | CLINICAL_INTENDED_USE_STATEMENT.md | `clinicalIntendedUse` | Public → `/legal/clinical-use` |
| 6 | COOKIE_AND_ANALYTICS_NOTICE.md | `cookieNotice` | Public → `/legal/cookies` |
| 7 | DATA_RETENTION_SCHEDULE.md | — | Internal + Privacy link |
| 8 | INCIDENT_RESPONSE_AND_BREACH_PLAYBOOK.md | — | Internal ops |
| 9 | DSAR_PROCEDURE.md | — | Internal + `/legal/data-request` |
| 10 | EAC_EXPANSION_LEGAL_CHECKLIST.md | — | Internal CEO/counsel |
| 11 | LEGAL_IMPLEMENTATION_INDEX.md | — | Internal engineering |

---

## 2. Shared configuration

| File | Role |
|------|------|
| `shared/legal-versions.ts` | `LEGAL_DOCUMENT_VERSIONS`, `LEGAL_LAST_UPDATED`, `LEGAL_CONTACT`, `odpcRegistrationPlaceholder` |
| `shared/legal-consent.test.ts` | Consent staleness unit tests |
| `drizzle/0044_legal_consent.sql` | DB columns for consent versions |
| `scripts/apply-0044-legal-consent.mjs` | Migration apply script |

**Sync rule:** When counsel updates `docs/legal/*.md`, bump matching key in `LEGAL_DOCUMENT_VERSIONS` and `LEGAL_LAST_UPDATED`, then sync client TS modules below.

---

## 3. Client legal content modules (`client/src/legal/`)

| Module | Source markdown | Consumed by |
|--------|-----------------|-------------|
| `client/src/legal/privacy-policy.ts` | PRIVACY_POLICY_FULL.md (sections) | `PrivacyPolicy.tsx` |
| `client/src/legal/terms-of-use.ts` | TERMS_OF_USE_FULL.md | `TermsOfUse.tsx` |
| `client/src/legal/cookie-notice.ts` | COOKIE_AND_ANALYTICS_NOTICE.md + subprocessors | `CookieNotice.tsx`, `Subprocessors.tsx` |
| `client/src/legal/types.ts` | `LegalDocumentMeta` shape | `LegalDocumentLayout.tsx` |

**Gap (post-counsel):** Add TS modules for Care Signal notice, clinical intended use, institutional addendum summary — or link to static markdown renderer.

---

## 4. UI pages and routes (`client/src/App.tsx`)

| Route | Component | Primary legal doc |
|-------|-----------|-------------------|
| `/privacy` | `pages/PrivacyPolicy.tsx` | PRIVACY_POLICY_FULL.md |
| `/terms` | `pages/TermsOfUse.tsx` | TERMS_OF_USE_FULL.md |
| `/terms#payments` | Terms anchor | TERMS_OF_USE_FULL.md §6 |
| `/legal/cookies` | `pages/legal/CookieNotice.tsx` | COOKIE_AND_ANALYTICS_NOTICE.md |
| `/legal/care-signal` | `pages/legal/CareSignalNotice.tsx` | CARE_SIGNAL_DATA_PROCESSING_NOTICE.md |
| `/legal/clinical-use` | `pages/legal/ClinicalIntendedUse.tsx` | CLINICAL_INTENDED_USE_STATEMENT.md |
| `/legal/subprocessors` | `pages/legal/Subprocessors.tsx` | Privacy §8 + cookie-notice subprocessors |
| `/legal/data-request` | `pages/legal/DataRequest.tsx` | DSAR_PROCEDURE.md + Privacy §13 |
| `/care-signal/appeal` | `pages/legal/CareSignalAppeal.tsx` | TERMS §5.2 / Fellowship §11.3 |
| `/verify-certificate` | `pages/VerifyCertificate.tsx` | TERMS §5.8 |
| `/register` | `pages/Register.tsx` | Terms + Privacy links |
| `/enroll` | `pages/Enroll.tsx` | Terms + Privacy + payments anchor |
| `/payment` | `pages/Payment.tsx` | Terms §6 M-Pesa |
| `/resus` | ResusGPS pages | CLINICAL_INTENDED_USE_STATEMENT.md |
| `/care-signal` | Care Signal pages | CARE_SIGNAL_DATA_PROCESSING_NOTICE.md |
| `/parent-safe-truth` | `ParentSafeTruth.tsx` | Privacy §10 Safe-Truth |
| `/hospital-admin-dashboard` | Institutional admin | INSTITUTIONAL_B2B_ADDENDUM.md |

**Suggested future routes:**

| Route | Doc |
|-------|-----|
| `/legal/retention` | DATA_RETENTION_SCHEDULE.md (summary public) |

---

## 5. Consent gates and components

| Component | Path | API mutation | Version key |
|-----------|------|--------------|-------------|
| `LegalReconsentGate.tsx` | App shell | `legal.acceptTermsAndPrivacy` | `termsOfUse`, `privacyPolicy` |
| `CareSignalConsentGate.tsx` | Wraps Care Signal | `legal.acceptCareSignalConsent` | `careSignalNotice` |
| `ClinicalUseDisclaimer.tsx` | ResusGPS | `legal.acceptResusGpsDisclaimer` | `resusGpsDisclaimer` |
| `SafeTruthGuardianGate.tsx` | Safe-Truth | `legal.acceptSafeTruthGuardian` | `safeTruthGuardian` |
| `InstitutionalOnboarding.tsx` | Institution signup | `legal.acceptInstitutionalB2b` | `institutionalB2bAddendum` |
| `Footer.tsx` | Global links | — | `/privacy`, `/terms`, `/legal/*` |

**Register.tsx:** Links to Terms/Privacy + server consent via `recordRegistrationConsent` on `auth.register`.

---

## 6. Server API (`server/routers/legal.ts`)

| Procedure | Type | Purpose | Doc |
|-----------|------|---------|-----|
| `getDocumentVersions` | public query | Version manifest for UI | All public docs |
| `getMyConsentStatus` | protected query | Staleness check | `isTermsConsentStale` |
| `acceptTermsAndPrivacy` | protected mutation | Re-consent | TERMS + PRIVACY |
| `acceptCareSignalConsent` | protected mutation | Care Signal | CARE_SIGNAL notice |
| `acceptResusGpsDisclaimer` | protected mutation | Bedside ack | CLINICAL_INTENDED_USE |
| `acceptInstitutionalB2b` | protected mutation | Hospital | B2B ADDENDUM |
| `acceptSafeTruthGuardian` | protected mutation | Parent gate | Privacy §10 |
| `submitDataRequest` | public mutation | DSAR intake | DSAR_PROCEDURE |
| `listDataRequests` | admin query | DSAR ops queue | DSAR_PROCEDURE |
| `previewDeletion` | admin query | Deletion checklist dry-run | DSAR_PROCEDURE §6 |
| `processDeletionRequest` | admin mutation | Execute approved erasure | DSAR_PROCEDURE §6 |
| `previewRetentionCleanup` | admin query | Retention dry-run summary | DATA_RETENTION_SCHEDULE |

**DB layer:** `server/lib/legal-consent.ts` — `recordTermsReconsent`, `recordCareSignalConsent`, `createLegalDataRequest`, etc.

**Router mount:** `server/routers.ts` → `legal: legalRouter`

---

## 7. Document → operational playbook mapping

| Markdown doc | Operations owner | Trigger |
|--------------|------------------|---------|
| INCIDENT_RESPONSE_AND_BREACH_PLAYBOOK.md | CEO + Engineering | Security incident |
| DSAR_PROCEDURE.md | privacy@ | DSAR form/email |
| DATA_RETENTION_SCHEDULE.md | Engineering cron (TBD) | Scheduled purge |
| EAC_EXPANSION_LEGAL_CHECKLIST.md | CEO + Counsel | New country GTM |

---

## 8. Document → product feature mapping

| Feature | Legal docs |
|---------|------------|
| M-Pesa STK + webhooks | TERMS §6, PRIVACY §3.8, RETENTION `mpesaWebhookLog` |
| Fellowship Fellow title | TERMS §5.4, PRIVACY §7, `fellowTitleEnabled` gate |
| Care Signal rate limits | CARE_SIGNAL notice §7, TERMS §5.2 |
| National aggregate admin | CARE_SIGNAL §5, B2B §B.11, EAC checklist |
| Certificate PDF / verify | TERMS §5.5–5.8, RETENTION certificates |
| AHA vs Fellow distinction | TERMS §1, Enroll copy, VerifyCertificate |
| ResusGPS sessionStorage | PRIVACY §3.3, RETENTION §4.3, SECURITY_BASELINE §5 |
| ODPC registration | PRIVACY §1, `LEGAL_CONTACT.odpcRegistrationPlaceholder` |

---

## 9. Engineering backlog (legal parity)

| Priority | Task | Doc |
|----------|------|-----|
| P0 | Sync `privacy-policy.ts` / `terms-of-use.ts` body from counsel-approved FULL markdown | 1, 2 |
| P0 | Insert ODPC number in `legal-versions.ts` after registration | 1 |
| ~~P1~~ | ~~Register click-wrap on `Register.tsx`~~ | **Done** — `recordRegistrationConsent` |
| ~~P1~~ | ~~Public `/legal/care-signal` page~~ | **Done** |
| ~~P1~~ | ~~Public `/legal/clinical-use` page~~ | **Done** |
| P2 | ~~Automated retention cron per DATA_RETENTION_SCHEDULE~~ | **Partial — `retention:cleanup` script + monthly scheduler dry-run; `--execute` = ops after review** | 7 |
| P2 | ~~Account deletion job per DSAR_PROCEDURE §6~~ | **Partial — `dsar:deletion` CLI + `legal.processDeletionRequest` admin mutation** | 9 |
| P3 | Country config for EAC emergency numbers | 10 |

---

## 10. Testing

| Test | Path |
|------|------|
| Consent staleness | `shared/legal-consent.test.ts` |
| Role boundaries | `server/routers/role-boundary-provider-api.test.ts` |
| E2E legal flows | Playwright (TBD) — register, Care Signal consent |

---

## 11. Related internal docs

| Doc | Path |
|-----|------|
| Counsel brief | `docs/LEGAL_PLATFORM_STRUCTURES.md` |
| Compliance baseline | `docs/LEGAL_COMPLIANCE_BASELINE.md` |
| Security retention | `docs/SECURITY_BASELINE.md` |
| PSOT §11 | `docs/PLATFORM_SOURCE_OF_TRUTH.md` |

---

## 12. Publication workflow

1. Counsel approves `docs/legal/*.md`  
2. Bump `shared/legal-versions.ts`  
3. Update `client/src/legal/*.ts` section content  
4. Deploy — `LegalReconsentGate` prompts users with stale versions  
5. CEO sign-off row in LEGAL_COMPLIANCE_BASELINE.md §6  

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-05-27 | Initial implementation index |

---

*© 2026 Paeds Resus Limited.*
