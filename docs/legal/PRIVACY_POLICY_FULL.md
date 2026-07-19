# Privacy Policy

**Document:** PRIVACY_POLICY_FULL.md  
**Version:** 1.1.0  
**Effective date:** 27 May 2026  
**Last updated:** 19 July 2026  
**Status:** Counsel review draft — not legal advice  
**Data controller:** Paeds Resus Limited, Nairobi, Kenya  

---

## Important notice

This Privacy Policy describes how **Paeds Resus Limited** (“**Paeds Resus**”, “**we**”, “**us**”) processes personal data when you use the Paeds Resus platform and related products. It is drafted for alignment with the **Kenya Data Protection Act, 2019** (“**DPA 2019**”) and the **Data Protection (General) Regulations, 2021**. It must be reviewed and approved by qualified Kenya counsel before publication as a binding policy. Until counsel sign-off, treat this document as an internal draft.

**Contact:** privacy@paeds-resus.com | support@paeds-resus.com | legal@paeds-resus.com  

**ODPC registration:** [ODPC registration number — counsel to insert before publication]

---

## 1. Who we are

| Item | Detail |
|------|--------|
| Legal entity | Paeds Resus Limited |
| Trade / platform brand | Paeds Resus |
| Registered address | Nairobi, Kenya |
| Website / application | paeds-resus.com and related subdomains |
| Data Protection Officer (contact) | privacy@paeds-resus.com |

Paeds Resus Limited is the **data controller** for personal data described in this policy, except where we process data on behalf of an institutional customer under a signed B2B agreement (see Section 14).

---

## 2. Scope — all products and audiences

This policy applies to personal data processed through:

| Product / service | Description | Primary users |
|-------------------|-------------|---------------|
| **Paeds Resus platform** | Account, authentication, role switching, support | Providers, parents, institutions |
| **ResusGPS** | Bedside paediatric emergency reference support (`/resus`) | Healthcare providers |
| **Care Signal** | Provider quality-improvement (QI) incident and near-miss reporting (`/care-signal`) | Healthcare providers |
| **Parent Safe-Truth** | Guardian/family journey feedback (`/parent-safe-truth`) | Parents and guardians |
| **Paeds Resus Fellowship** | Micro-courses, ResusGPS cases, Care Signal streak pathway | Healthcare providers |
| **AHA-aligned training** | BLS, ACLS, PALS, Heartsaver and related courses issued by Paeds Resus Limited | Providers and institutions |
| **Instructor training** | Paeds Resus instructor pathways | Approved instructors |
| **Institutional portal** | Hospital admin dashboards, staff roster, facility Care Signal aggregates | Institutions and authorised admins |
| **Certificate verification** | Public verification of course completion (`/verify-certificate`) | Public and employers |
| **Payments** | M-Pesa STK, manual Lipa na M-Pesa references, reconciliation | Enrolling users |
| **Analytics & security** | Product analytics, audit logs, fraud prevention | All users |

**Brand clarity:** “ResusGPS” is a product name, not the company. Training certificates and invoices are issued by **Paeds Resus Limited**. “Paeds Resus Fellow” is a **platform credential**, not an AHA, MOH, or government specialist credential unless explicitly stated on a specific certificate.

---

## 3. Categories of personal data we collect

### 3.1 Account and identity

- Full name, email address, phone number (where provided)
- Password hash (we do not store plaintext passwords)
- User type: provider, parent, or institutional
- Role and permissions (provider, institution, admin, etc.)
- Login method and session metadata

### 3.2 Professional profile (providers)

- Provider type, facility affiliation, county/region
- Instructor number and credentials where applicable
- Fellowship progress, streak status, grace usage

### 3.3 ResusGPS

- **Client-side session context:** age band, weight (or weight band), pathway state — stored in browser `sessionStorage` and cleared when the tab closes (see DATA_RETENTION_SCHEDULE.md)
- **Optional saved cases** for Fellowship: condition, pathway steps, timestamps — **no patient names** in saved cases
- Acknowledgement of clinical disclaimer (version and timestamp)

### 3.4 Care Signal (QI data — not a medical record)

- Facility, department, event type, delays, equipment gaps, outcome bands, preventability
- Free-text narrative — **must not** contain patient identifiers
- Consent version and timestamp at first submission
- **Submission mode** (added — reflects the platform's current three-way model, replacing an earlier single anonymous checkbox): every Care Signal report is filed as one of three modes, each with a different identity footprint:
  - **Named** — tied to your real provider account (`userId`).
  - **Pseudonymous** — tied to a device-held Fellowship token (a generated ID and a one-time recovery code), never to your real account or `userId`. The token exists to preserve Fellowship credit without storing real identity; we cannot recover a lost token if you did not save its recovery code, by design — there is no plain link stored anywhere for us to look up.
  - **Anonymous** — no identity stored at all, tied to neither an account nor a token.
- Provider user ID or Fellowship token ID (for fellowship integrity and facility aggregates), scoped strictly to whichever submission mode was chosen at the time of filing

**Retention and erasure — anonymise, not delete.** Care Signal reports are never hard-deleted, either at the end of the standard retention window (Section 11) or in response to a data-subject erasure request. Instead, the identity link (`userId`) is removed and the free-text narrative is redacted of structured identifiers (facility names, dates, phone numbers, emails, ID/passport numbers) before the report is retained as de-identified quality-improvement data. This is a deliberate CEO decision to preserve the clinical/QI value of an already-filed report while still honouring an erasure request's practical effect — it remains subject to full counsel review before being treated as final policy (see Section 2 of the internal `LEGAL_SIGNOFF_BACKLOG.md` tracker). Free-text mentions of a person's name in unstructured prose are not reliably caught by this automated redaction and may require manual review on a case-by-case DSAR request.

**Care Signal is quality-improvement data.** It is **not** an electronic health record, hospital medical record, or substitute for employer or regulator mandatory reporting.

### 3.5 Safe-Truth (parent/guardian care-journey reporting)

Two Safe-Truth surfaces currently coexist on the platform:

- **`/parent-safe-truth` (original, account-based flow)** — Guardian account data; child age band, care journey timeline, facility experience narrative; outcome selections (including bereavement-sensitive options); optional named guardian submission.
- **`/safe-truth` (Safe-Truth v1, added — no account, no login at any point)** — A device-local disclaimer acknowledgement only (a standalone record never linked to any submission or identity); a free-text narrative; structured classifiers (country, region/county-equivalent, locality, facility, child age band, condition, outcome, an optional shareable event code); and four stages of care-journey detail (before/getting to/at/after care). No name, account, email, or phone number is collected or requested at any point in this flow. A hidden anti-bot field ("honeypot") and a daily submission-rate limit by IP address apply; the IP address itself is checked in memory against that limit and is **not stored** — this product is deliberately built to make durable IP retention unnecessary for a family reporting on a child's care.
- In both flows: child age band, care journey timeline, facility experience narrative, and outcome selections (including bereavement-sensitive options) are collected. A caregiver may optionally enter a Care Signal event code from a provider's own report of the same clinical event; if a match is found, the two reports are linked internally for pattern analysis — this linkage is never shown to identify one report's submitter to the other.
- Separate lawful basis and consent from Care Signal; **KPIs are never merged** with Care Signal.
- Both flows' data is retained under the same anonymise-not-delete standing decision described in Section 3.4, adapted for Safe-Truth's already-largely-anonymous data model.

### 3.6 Training, Fellowship, and certificates

- Enrollments, course progress, assessment results
- Certificate issuance data, verification codes, PDF metadata
- Name as printed on certificates

### 3.7 Institutional (B2B)

- Institution profile, authorised administrators
- Staff roster links, training assignments, schedules
- Facility-level Care Signal aggregates and action logs
- MOU / contract references where applicable

### 3.8 Payments (M-Pesa and related)

- Safaricom MSISDN used for STK push
- Transaction amounts, checkout request IDs, receipt references
- Webhook payloads and reconciliation audit logs (`mpesaWebhookLog`)
- Manual payment references submitted by users

### 3.9 Analytics and technical logs

- Pseudonymous session identifiers, page views, feature events
- IP address, user agent (for security and abuse detection)
- Admin audit log entries for privileged actions

### 3.10 Communications and DSAR

- Support tickets, email correspondence
- Data subject access requests (DSAR) submitted via `/legal/data-request` or email

We **do not** intentionally collect patient names, national ID numbers, or full medical records through Care Signal or ResusGPS saved cases. Users must not submit patient identifiers in free text.

---

## 4. Lawful bases under Kenya DPA 2019

We rely on one or more of the following lawful bases, as applicable:

| Basis | Typical use |
|-------|-------------|
| **Consent** | Care Signal first submission; Parent Safe-Truth guardian narratives; optional marketing; non-essential cookies where required |
| **Contract** | Account creation, course delivery, Fellowship, certificate issuance, M-Pesa payment processing |
| **Legitimate interests** | Security, fraud prevention, product improvement, aggregated QI analytics — balanced against your rights and expectations |
| **Legal obligation** | Tax records, payment reconciliation, lawful regulatory or court orders |
| **Vital interests** | Rarely, where necessary to protect life from information you voluntarily provide in an emergency contact (we are **not** an emergency service) |

Where we process **children’s data** (see Section 10), we apply heightened safeguards and parental/guardian involvement as required by the DPA 2019 and counsel guidance.

---

## 5. Purposes of processing

We use personal data to:

1. Provide, maintain, and secure the platform and enforce role boundaries
2. Deliver ResusGPS reference support, training, Fellowship, and certificate verification
3. Operate Care Signal for QI, facility dashboards, fellowship Pillar C, and **aggregated** surveillance insights — **not** as patient medical records
4. Operate Parent Safe-Truth separately for family-voice insights
5. Process payments and enrollment; send receipts and course confirmations
6. Enable institutional administrators to view authorised facility data under B2B terms
7. Respond to DSARs, support requests, and legal claims
8. Detect abuse, Care Signal gaming, credential fraud, and security incidents
9. Comply with applicable law and enforce our Terms of Use

We **do not** sell personal data. We do not use Care Signal data for patient-targeted advertising.

---

## 6. Care Signal — data processing summary

| Topic | Position |
|-------|----------|
| Nature of data | Provider-submitted QI and near-miss reports |
| Medical record? | **No** — not a patient chart or EHR |
| Patient identifiers | Prohibited in schema and user guidance; not NLP-enforced — reports may be moderated |
| Provider identification | Reports linked to provider user ID for fellowship, rate limits, and audit |
| “Anonymous” | Reports are **de-identified from patients**, not anonymous to Paeds Resus or authorised facility admins |
| Sharing | Facility aggregates; platform admin review; national aggregate (admin-only) per governance — not public league tables |
| Consent | Explicit first-submission consent (`CareSignalConsentGate`) |
| Full notice | See CARE_SIGNAL_DATA_PROCESSING_NOTICE.md |

---

## 7. Automated decision-making and profiling

- Fellowship streak and grace rules are **automated** from submission timestamps and calendar rules
- **Paeds Resus Fellow** title is **automation-only** when `fellowTitleEnabled` is true (currently **disabled** by CEO gate until counsel and §11 checklist)
- We do not make solely automated decisions with legal or similarly significant effects without human review where required by law
- Facility dashboards show aggregates, not automated employment decisions by Paeds Resus

---

## 8. Sub-processors and infrastructure

We use vetted service providers who process data on our instructions. A current list is maintained at `/legal/subprocessors` and in this policy:

| Sub-processor | Role | Location / notes |
|---------------|------|------------------|
| **Aiven Oy** | Managed MySQL database hosting | **EU region** (primary production) — cross-border transfer |
| **Cloudflare, Inc.** | R2 object storage, CDN, security | Global edge; assets at assets.paedsresus.com |
| **Render Services, Inc.** (or equivalent) | Application hosting | Region per deployment configuration |
| **Amazon Web Services (SES)** or **SendGrid** | Transactional email | Configurable region |
| **Safaricom PLC** | M-Pesa Daraja payment rails | Kenya |
| **Google / analytics provider** (if enabled) | Product analytics | Per cookie notice |

We require sub-processors to implement appropriate technical and organisational measures. **Cross-border transfers** from Kenya to the EU and other jurisdictions are conducted with safeguards appropriate under DPA 2019 (e.g. standard contractual clauses, adequacy, or explicit consent where required — **counsel to confirm**).

---

## 9. International transfers and Kenya hosting posture

- Primary application database: **Aiven cloud MySQL (EU)**
- SSL/TLS required for database connections
- Data may be processed outside Kenya; we document transfers in our ODPC registration and contracts
- Users in the **East African Community (EAC)** and adjacent countries should review EAC_EXPANSION_LEGAL_CHECKLIST.md for local emergency numbers and supplemental requirements before reliance

---

## 10. Children, parents, and guardians

- **Safe-Truth** is directed at parents and guardians; it may involve information about children (age bands, care experiences)
- On `/parent-safe-truth` (the original flow), we process such data based on **guardian consent**, account terms, and legitimate interests in improving family-centred emergency care communication
- On `/safe-truth` (Safe-Truth v1, the no-account flow, added), there is no user account and therefore no account-level consent to obtain; instead, a one-time, device-local disclaimer is shown and acknowledged before the form is shown, confirming the submitter understands this is not an emergency-reporting or medical-advice channel — **counsel to confirm** this device-local acknowledgement is a sufficient and appropriate substitute for account-based consent in this no-login context
- **Bereavement-sensitive** submissions receive heightened internal handling (limited access, no marketing use) on both flows
- Providers using the platform for professional purposes are typically adults; where a minor accesses training, parental consent may be required — **counsel to confirm** age thresholds
- Children's data is not used for Care Signal KPIs or merged with provider QI metrics

---

## 11. Retention — summary

Detailed retention periods are in **DATA_RETENTION_SCHEDULE.md**. Summary:

| Data class | Typical retention |
|------------|-------------------|
| Active account | While account is active + limited period after closure |
| Care Signal events | 7 years, then **anonymised, not deleted** — identity link removed, narrative redacted of structured identifiers (see Section 3.4). The same anonymise-not-delete treatment applies to an erasure request received before the 7-year mark. |
| Safe-Truth events | 7 years with bereavement flag handling; anonymise-not-delete applies here too, though most Safe-Truth v1 data is already unlinked to any account by design |
| Fellowship pseudonymous tokens | Retained as long as the associated Care Signal streak/credit history is retained; revoking a token hides its Fellow-title display only, it does not delete the token or unlink already-earned credit |
| ResusGPS sessionStorage | Until browser tab closes |
| ResusGPS saved cases | Fellowship duration + 24 months |
| Analytics raw events | 13 months |
| Admin audit log | 90 days online; archive before purge if required |
| M-Pesa webhook log | 7 years (financial audit) |
| DSAR records | 3 years after closure |
| Legal consent records | Account lifetime + 6 years |

We may retain longer where required by law, litigation hold, or institutional contract.

---

## 12. Security measures

We implement measures including:

- Password hashing (bcrypt), JWT session management
- TLS in transit; database SSL
- Role-based API access (`RoleGate`, server-side checks)
- Care Signal rate limits (5/day EAT, duplicate guard)
- M-Pesa callback IP allowlisting (configurable)
- Admin audit logging for privileged actions
- No intentional logging of patient identifiers in audit trails

No system is perfectly secure. Report concerns to privacy@paeds-resus.com.

---

## 13. Your rights (Kenya DPA 2019)

Subject to applicable exceptions, you may have the right to:

- **Be informed** of processing (this policy)
- **Access** your personal data
- **Rectification** of inaccurate data
- **Erasure** in limited circumstances
- **Object** to processing based on legitimate interests
- **Restriction** of processing in limited circumstances
- **Data portability** where technically feasible
- **Withdraw consent** where processing is consent-based (without affecting prior lawful processing)
- **Lodge a complaint** with the **Office of the Data Protection Commissioner (ODPC)**, Kenya

**DSAR SLA:** We aim to respond to verified requests within **30 calendar days** (extendable once by 30 days with notice where complex). Procedure: **DSAR_PROCEDURE.md** and `/legal/data-request`.

---

## 14. Institutional customers (B2B)

Where a hospital or institution signs our **Institutional B2B Addendum** or MOU:

- The institution may be a **joint controller** or **processor** for certain staff and facility data — as specified in the agreement
- Facility administrators access only data authorised under the contract
- Care Signal facility views are aggregate and governed by institutional policies
- See INSTITUTIONAL_B2B_ADDENDUM.md

---

## 15. Data breaches

If a personal data breach is likely to result in a risk to your rights, we will notify the **ODPC within 72 hours** where required and affected individuals without undue delay where required by law. Internal response: **INCIDENT_RESPONSE_AND_BREACH_PLAYBOOK.md**.

---

## 16. Marketing and communications

We may send service-related emails (enrollment, receipts, security alerts) based on contract and legitimate interests. Marketing emails, if any, will include opt-out mechanisms. We do not use Care Signal narratives for marketing.

---

## 17. Third-party links

Our platform may link to external sites (AHA resources, payment partners). Their privacy practices are governed by their own policies.

---

## 18. Changes to this policy

We may update this policy. Material changes will be communicated via the platform (e.g. `LegalReconsentGate`) and updated version numbers in `shared/legal-versions.ts`. Continued use after notice may require re-acceptance.

---

## 19. Contact and complaints

| Purpose | Contact |
|---------|---------|
| Privacy / DPO | privacy@paeds-resus.com |
| Support | support@paeds-resus.com |
| Legal | legal@paeds-resus.com |
| ODPC | https://www.odpc.go.ke |

---

## 20. Related documents

| Document | Purpose |
|----------|---------|
| TERMS_OF_USE_FULL.md | Platform terms |
| CARE_SIGNAL_DATA_PROCESSING_NOTICE.md | Care Signal-specific notice |
| COOKIE_AND_ANALYTICS_NOTICE.md | Cookies and analytics |
| DATA_RETENTION_SCHEDULE.md | Retention table |
| DSAR_PROCEDURE.md | Operational DSAR handling |
| INSTITUTIONAL_B2B_ADDENDUM.md | Hospital contracts |
| LEGAL_IMPLEMENTATION_INDEX.md | Engineering mapping |

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-05-27 | Initial counsel-ready full privacy policy draft |
| 1.1.0 | 2026-07-19 | Catch-up revision for engineering shipped since v1.0.0, still pending counsel review: (1) §3.4 rewritten for the three-way Care Signal submission mode (named/pseudonymous/anonymous, replacing the old single anonymous checkbox) and the anonymise-not-delete standing decision; (2) §3.5 and §10 rewritten to describe both coexisting Safe-Truth surfaces — the original account-based `/parent-safe-truth` and the new no-account `/safe-truth` v1; (3) §11 retention table corrected from implying a hard purge to reflecting anonymise-not-delete, and a Fellowship token row added. **CEO decision (2026-07-19): re-consent existing users now** rather than waiting for counsel sign-off — `LEGAL_DOCUMENT_VERSIONS.privacyPolicy` bumped to `1.1.0` in `shared/legal-versions.ts`, so `isPrivacyConsentStale` now returns `true` for every existing user on their next protected action. If counsel later requires further substantive changes, users will be asked to re-consent again at that point — see `LEGAL_SIGNOFF_BACKLOG.md` item 2.1. |

---

*© 2026 Paeds Resus Limited. All rights reserved.*
