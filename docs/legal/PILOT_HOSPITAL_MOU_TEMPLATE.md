# Pilot Hospital Memorandum of Understanding (Template)

**Document:** PILOT_HOSPITAL_MOU_TEMPLATE.md  
**Version:** 1.0.0  
**Effective date:** [DATE]  
**Status:** Counsel review draft — template for execution (not binding until signed)  
**Platform operator:** Paeds Resus Limited, Nairobi, Kenya  
**Related:** [CLINICAL_OUTCOMES_PILOT.md](../CLINICAL_OUTCOMES_PILOT.md), [INSTITUTIONAL_B2B_ADDENDUM.md](./INSTITUTIONAL_B2B_ADDENDUM.md)

---

## Instructions for counsel and CEO

Complete bracketed fields. Attach **Schedule A** (baseline metrics protocol) and **Schedule B** (sub-processors / data processing reference). Obtain signatures before enabling `CLINICAL_OUTCOMES_PILOT_ENABLED` on staging or production.

This MOU governs a **90-day quality-improvement (QI) pilot** only. It does **not** authorise mortality claims, national league tables, or public outcome comparisons.

---

## Memorandum of Understanding

### Between Paeds Resus Limited and [Hospital Legal Name]

**MOU reference:** PR-PILOT-[YYYY]-[NNN]  
**Effective date:** [DATE]  
**Pilot go-live date:** [DATE] (baseline collection may begin up to 30 days earlier per Schedule A)  
**Pilot duration:** 90 calendar days from go-live  
**Governing law:** Laws of the Republic of Kenya; courts of Nairobi, Kenya  
**Regional note:** Parties acknowledge intent to expand East African Community (EAC) partnerships under separate agreements; this MOU is facility-specific.

---

### 1. Parties

| Party | Details |
|-------|---------|
| **Paeds Resus Limited** | Nairobi, Kenya; AHA-Aligned Training Provider; platform operator for ResusGPS, Care Signal, and institutional training tools |
| **[Hospital Name]** | [Physical address]; [Registration number, if any] |
| **Paeds Resus pilot contact** | [Name], [Title], legal@paeds-resus.com / support@paeds-resus.com |
| **Hospital medical director (signatory)** | [Name], [Title] |
| **Hospital champion nurse** | [Name], [Department] |
| **Hospital data / privacy liaison** | [Name], [Title] |

---

### 2. Purpose

The parties wish to pilot a **closed vertical slice** of the Paeds Resus platform at [Hospital Name] to measure **process and system readiness metrics** for paediatric **septic shock** care pathways — without claiming patient-level clinical outcomes or mortality reduction.

The pilot tests: **ResusGPS** reference support → **Care Signal** QI reporting → **institutional action log** follow-up (see [CLINICAL_OUTCOMES_PILOT.md](../CLINICAL_OUTCOMES_PILOT.md)).

---

### 3. Scope

| Element | In scope | Notes |
|---------|----------|-------|
| Condition focus | Paediatric septic shock | Other presentations out of scope unless written amendment |
| ResusGPS bedside use | Yes | Decision support only; not a substitute for local protocol |
| Care Signal facility reporting | Yes | Good-faith QI; non-retaliation per hospital HR policy recommended |
| Institutional action logs | Yes | Document system changes linked to reported gaps |
| Training roster / micro-courses | Optional | [Specify courses] |
| Mortality or outcome superiority claims | **No** | Unless separate governance and external review |
| Patient identifiers in platform exports | **No** | Facility-level aggregation only |

**Process metrics (examples — final targets in Schedule A):**

- Care Signal submission rate (distinct reporters per month at facility)
- ResusGPS session count (septic shock pathway)
- ResusGPS → Care Signal within 7 days (where session linkage exists)
- Institutional action log **closure rate** (open → completed within pilot window)
- Gap → learning resource click-through (where enabled)

These are **not** outcome efficacy claims.

---

### 4. Roles and responsibilities

**Paeds Resus Limited** will:

- Provide onboarding for champion nurse and medical director ([DATE])
- Enable pilot configuration on agreed environment (staging first, then production if approved)
- Supply weekly aggregate exports and Admin Maturity KPI CSV guidance
- Maintain platform security per Privacy Policy; notify breaches per INSTITUTIONAL_B2B_ADDENDUM Part B

**[Hospital Name]** will:

- Appoint a **champion nurse** for ResusGPS + Care Signal workflow coaching
- Ensure **medical director** oversight of bedside care and local protocol supremacy
- Conduct **monthly QI review** (minimum) using facility aggregates — no public naming of individual reporters without HR/legal process
- Complete baseline data collection per Schedule A before counting intervention metrics
- Not use pilot data for punitive single-source discipline without fair process

---

### 5. Data characterisation

- Data processed in the pilot is **QI and operational**, not a statutory medical records repository replacement.
- Care Signal submissions may contain clinical narrative; hospital remains controller for employment context; processing terms in **Schedule B** and INSTITUTIONAL_B2B_ADDENDUM Part B apply when institutional onboarding is completed.
- **No patient names, national IDs, or MRNs** shall be entered into free-text fields where avoidable; facility dashboards use aggregation.
- Primary database hosting: Aiven EU (see Schedule B).

---

### 6. Duration, extension, and termination

- **Baseline period:** up to 30 days before go-live (Schedule A).
- **Intervention period:** 90 days from go-live.
- **Extension:** by written amendment signed by both parties.
- **Termination:** either party may terminate with **14 days** written notice. Upon termination: export window per DATA_RETENTION_SCHEDULE; Paeds Resus disables pilot flags for this facility within **7 business days** of notice.

---

### 7. Confidentiality

Each party shall keep non-public pilot metrics, draft QI reports, and security incidents confidential except: (a) as required by law; (b) to professional advisers under duty of confidence; (c) with prior written consent. Aggregated learnings may be used internally by Paeds Resus for product improvement without identifying the facility in marketing unless jointly approved.

---

### 8. Fees

[Pilot gratuitous / discounted institutional access — specify]. M-Pesa or invoice terms per separate quote if applicable.

---

### 9. Liability and clinical responsibility

Subject to Master Terms: ResusGPS and Care Signal are support tools. **[Hospital Name]** retains full responsibility for patient care. Limitation of liability per TERMS_OF_USE_FULL.md unless MOU specifies insured pilot cap: [AMOUNT / N/A].

---

### 10. Signatures

| For Paeds Resus Limited | For [Hospital Name] |
|-------------------------|---------------------|
| Name: Job Karue (or authorised signatory) | Name: __________________________ |
| Title: Chief Executive Officer | Title: __________________________ |
| Date: __________________________ | Date: __________________________ |

| Hospital champion nurse (acknowledgement) | Hospital data/privacy liaison (acknowledgement) |
|-------------------------------------------|--------------------------------------------------|
| Name: __________________________ | Name: __________________________ |
| Date: __________________________ | Date: __________________________ |

---

## Schedule A — Baseline metrics collection protocol

1. **Baseline month (pre-intervention):** Collect from platform exports and optional ward audit checklist:
   - Count of ResusGPS sessions tagged or clinically aligned to septic shock (platform analytics)
   - Care Signal submissions count and distinct reporters (facility-scoped)
   - Open institutional action logs count (expect 0 at start)
   - Optional: manual audit sample of time-to-fluid / time-to-antibiotic documentation quality (not entered as patient-identifiable rows in Paeds Resus)

2. **Data sources:** Admin Reports → Maturity KPIs CSV; facility Care Signal dashboard; institutional action log tab.

3. **Cadence:** Baseline frozen at end of baseline month; intervention metrics measured weekly internally, summarised monthly with medical director.

4. **Acceptance criteria for baseline completeness:** [CEO / medical director sign-off line]

| Metric | Baseline value | Collection method | Owner |
|--------|----------------|-------------------|-------|
| Care Signal submissions / month | TBD | Platform export | Champion nurse |
| Distinct Care Signal reporters | TBD | Platform export | Champion nurse |
| ResusGPS septic shock sessions | TBD | Analytics rollup | Paeds Resus support |
| Action logs opened / closed | TBD | Institutional dashboard | Medical director |
| ResusGPS → Care Signal ≤7 days | TBD | Holistic loop analytics | Paeds Resus support |

---

## Schedule B — Sub-processors and data processing reference

1. **Incorporation by reference:** INSTITUTIONAL_B2B_ADDENDUM.md Part B (Data Processing Terms) applies when institutional onboarding acceptance is recorded or this MOU is signed, whichever the parties designate in writing.

2. **Sub-processors (material):**

| Sub-processor | Purpose | Region |
|---------------|---------|--------|
| Aiven Oy | Managed MySQL database | EU |
| Cloudflare, Inc. | CDN / edge security | Global |
| [Email provider] | Transactional email | [Region] |
| [Hosting — e.g. Render] | Application hosting | [Region] |

Current list maintained at `/legal/subprocessors` on the production site.

3. **Pilot-specific instructions:** Paeds Resus processes staff account data, Care Signal events, ResusGPS usage analytics, and institutional action logs solely to deliver QI dashboards to authorised institution users.

4. **Cross-border transfers:** Institution acknowledges EU hosting and safeguards described in PRIVACY_POLICY_FULL.md.

5. **DSAR:** Staff may use `/legal/data-request`; hospital HR handles employment-linked requests with Paeds Resus assistance per DSAR_PROCEDURE.md.

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-05-27 | Initial counsel-ready pilot MOU template |

---

*© 2026 Paeds Resus Limited. Template only — not executed until signed.*