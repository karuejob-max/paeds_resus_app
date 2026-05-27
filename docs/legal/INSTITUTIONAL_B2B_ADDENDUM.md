# Institutional B2B Addendum — MOU Template & Data Processing Terms

**Document:** INSTITUTIONAL_B2B_ADDENDUM.md  
**Version:** 1.0.0  
**Effective date:** 27 May 2026  
**Last updated:** 27 May 2026  
**Status:** Counsel review draft — template for execution  
**Platform operator:** Paeds Resus Limited, Nairobi, Kenya  
**Contact:** legal@paeds-resus.com | privacy@paeds-resus.com  

---

## Part A — Memorandum of Understanding (Pilot Template)

*Instructions: Complete bracketed fields. Obtain signatures from Facility Medical Leadership, Nursing Leadership (where Care Signal is used), and Data/Privacy representative before pilot go-live per CLINICAL_OUTCOMES_PILOT.md.*

---

### MOU BETWEEN PAEDS RESUS LIMITED AND [FACILITY LEGAL NAME]

**MOU Reference:** [PR-MOU-YYYY-NNN]  
**Effective date:** [DATE]  
**Pilot period:** 90 days from go-live (extendable by written amendment)

#### 1. Parties

| Party | Details |
|-------|---------|
| **Paeds Resus Limited** | Nairobi, Kenya; AHA-Aligned Training Provider; platform operator |
| **[Facility]** | [Address]; [Registration if applicable] |
| **Facility contacts** | Medical lead: [NAME, TITLE]; Nursing lead: [NAME]; Data/privacy: [NAME] |

#### 2. Purpose

The parties wish to pilot Paeds Resus platform capabilities — including **ResusGPS** reference support, **Care Signal** QI reporting, institutional dashboards, and training enrolment — to improve **process-oriented** paediatric emergency readiness metrics at [FACILITY], without publishing mortality claims or public league tables during the pilot.

#### 3. Scope of pilot

| Module | In scope (Y/N) | Notes |
|--------|----------------|-------|
| ResusGPS bedside use | [ ] | Champion nurses identified: [NAMES] |
| Care Signal facility tab | [ ] | Max providers: [N] |
| Staff training roster | [ ] | Courses: [BLS/PALS/etc.] |
| Institutional action logs | [ ] | QI follow-up documentation |
| Clinical outcomes claims | **No** | Unless separate governance sign-off |

#### 4. Governance

4.1 **Clinical oversight:** Facility medical leadership retains authority over bedside care; ResusGPS is decision support only (CLINICAL_INTENDED_USE_STATEMENT.md).

4.2 **Data governance committee:** [FACILITY] appoints a liaison for monthly review of Care Signal aggregates — no individual provider naming in public facility communications without HR/legal process.

4.3 **No league tables:** Neither party will publish inter-facility rankings or mortality comparisons from pilot data without written joint approval and external review.

4.4 **National aggregate:** MOH/WHO sharing only under separate written data-sharing agreement.

#### 5. Data protection sign-off

- [ ] Facility data/privacy representative has reviewed PRIVACY_POLICY_FULL.md and this Addendum  
- [ ] ODPC / local equivalent requirements assessed for [FACILITY COUNTRY]  
- [ ] Sub-processor list acknowledged (Aiven EU, Cloudflare, etc.)

#### 6. Training and support

Paeds Resus will provide: onboarding session ([DATE]); support channel support@paeds-resus.com; escalation legal@paeds-resus.com.

#### 7. Fees

[Pilot gratuitous / discounted / per-seat — specify]. M-Pesa institutional invoicing per separate quote.

#### 8. Term and termination

Either party may terminate with **14 days** written notice. Upon termination, data export available per Part B; deletion timelines per DATA_RETENTION_SCHEDULE.md unless legal hold.

#### 9. Liability

Subject to signed Master Terms: limitation of liability and clinical responsibility per TERMS_OF_USE_FULL.md. Facility remains employer of record for staff.

#### 10. Signatures

| For Paeds Resus Limited | For [Facility] |
|-------------------------|----------------|
| Name: Job Karue / authorised signatory | Name: __________________ |
| Title: CEO / _____________ | Title: __________________ |
| Date: ____________________ | Date: ____________________ |

---

## Part B — Data Processing Terms (Binding when executed)

When Institution checks acceptance on **Institutional Onboarding** (`InstitutionalOnboarding.tsx`) or signs the MOU above, the following DPA terms apply between **Paeds Resus Limited** (“**Processor/Controller**” as specified) and **Institution** (“**Customer**”).

### B.1 Roles

| Scenario | Paeds Resus role | Institution role |
|----------|------------------|------------------|
| Staff account and roster data | **Processor** on Institution instructions | **Controller** for employment data |
| Care Signal events submitted by staff | **Joint controllers** or Processor per MOU checkbox — **default: Paeds Resus controller** for platform operations; Institution controller for employment actions | |
| Facility aggregate dashboards | Processor providing analytics to Institution | Controller for internal use |
| Training certificates issued by Paeds Resus Limited | **Controller** | Recipient |

*Counsel to finalise joint-controller vs processor split per ODPC guidance.*

### B.2 Institution instructions

Institution instructs Paeds Resus to:

- Host and process staff identifiers linked to institutional accounts
- Display facility-scoped Care Signal aggregates to authorised `institution` role users
- Maintain `institutionalActionLogs` for QI follow-up
- Provide training enrollment and completion reports

Institution shall not instruct processing that violates Privacy Policy or applicable law.

### B.3 Institution warranties

Institution warrants that it has:

- Authority to share staff lists and work emails/phones for training administration
- Notified staff that Care Signal may be used per facility policy
- Obtained any required employer consents or collective agreements
- Appointed an internal owner for data subject requests relating to employment context

### B.4 Security

Paeds Resus implements measures in PRIVACY_POLICY_FULL.md §12. Institution shall:

- Limit admin accounts to authorised personnel
- Not share institutional login credentials
- Report suspected breaches to privacy@paeds-resus.com within **24 hours**

### B.5 Sub-processors

Institution authorises sub-processors listed at `/legal/subprocessors`. Paeds Resus will notify material changes with **30 days** notice; Institution may object on reasonable grounds.

### B.6 Cross-border transfers

Institution acknowledges primary database hosting in **Aiven EU**. Appropriate safeguards per Privacy Policy apply.

### B.7 Data subject rights

- Staff may exercise rights via Paeds Resus (`/legal/data-request`) and Institution HR
- Paeds Resus assists Institution within **30 days** SLA (DSAR_PROCEDURE.md)
- Institution is responsible for employment-related responses

### B.8 Retention and deletion

Per DATA_RETENTION_SCHEDULE.md. Upon contract end:

- Institution may request export of facility aggregates and roster completion CSV within **30 days**
- Paeds Resus will delete or anonymise Institution-scoped data within **90 days** except legal/tax retention

### B.9 Audit

Paeds Resus will provide reasonable security summary on request (no more than **once per year** unless incident-driven).

### B.10 Breach notification

Paeds Resus notifies Institution without undue delay and within **72 hours** of becoming aware of a breach affecting Institution data where required.

### B.11 Care Signal — institutional use

- Institution shall not use aggregates to discipline individual staff without fair process and local labour law
- Institution should adopt **non-retaliation** internal policy for good-faith QI reports (recommended — not statutory by Paeds Resus)
- No public disclosure of facility-identifiable preventable harm statistics without clinical governance approval

### B.12 Non-retaliation (recommended clause for Institution internal policy)

*Paeds Resus recommends Institution adopt:* “Good-faith Care Signal submissions made through Paeds Resus shall not be the sole basis for punitive action without investigation consistent with [Facility] HR policy.”

### B.13 Liability

Cap and exclusions per TERMS_OF_USE_FULL.md §9 unless MOU specifies higher insurance for institutional pilot.

### B.14 Governing law

Laws of Kenya; courts of Nairobi, Kenya.

### B.15 Order of precedence

Signed MOU → this Part B → TERMS_OF_USE_FULL.md → Privacy Policy.

---

## Part C — Engineering acceptance

Recorded via `legal.acceptInstitutionalB2b` with version `LEGAL_DOCUMENT_VERSIONS.institutionalB2bAddendum` on institutional onboarding.

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-05-27 | Initial MOU + DPA template |

---

*© 2026 Paeds Resus Limited. Template only — not executed until signed.*
