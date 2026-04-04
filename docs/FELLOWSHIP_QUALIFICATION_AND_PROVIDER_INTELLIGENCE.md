# Fellowship qualification, provider profile, and internal operational intelligence

**Status:** Canonical strategy — complements [COURSE_PORTFOLIO_AND_ADF_STRATEGY.md](./COURSE_PORTFOLIO_AND_ADF_STRATEGY.md), [MICRO_COURSE_CATALOG_BACKLOG.md](./MICRO_COURSE_CATALOG_BACKLOG.md), and [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md).  
**Version:** 1.0 · **Date:** 2026-03-31  
**Audience:** Leadership, clinical governance, product, data protection counsel, research leads.

---

## 1. Purpose

This document locks:

1. **What “ADF Fellow” (or equivalent fellow title in UI)** means in terms of **completed learning** and **demonstrated practice** on the platform.
2. **What profile data** providers must supply to **participate in fellowship-path courses** (enrollment gate).
3. **Why we collect that data** and **how we use it** — **internal intelligence and improvement only**, not public disclosure of identifiable facilities or individuals.

Full-cycle intent: connect **provider learning and bedside behaviour** (ResusGPS), **institutional and geographic context** (profile), **honest incident and near-miss signal** (Safe-Truth–compatible flows), and **parent/community** programmes — so Paeds Resus can support **policy-relevant insight**, **targeted health education**, and **facility-specific recommendations** without pretending every linkage is automated on day one.

---

## 2. Fellowship qualification (ADF Fellow)

To **qualify as a fellow** (title and credential rules as shown in-product when implemented), a provider must meet **all** of the following:

| Criterion | Rule (leadership-locked) |
|-----------|---------------------------|
| **Complete the full individual-provider course set** | Complete **every course** in the agreed **MECE portfolio** for the fellowship path — including **BLS, ACLS, PALS** (blended credential courses) and **every ADF micro-course** in the active catalog (see [MICRO_COURSE_CATALOG_BACKLOG.md](./MICRO_COURSE_CATALOG_BACKLOG.md); list may expand with governance — “complete” = passed / certified per product rules). |
| **ResusGPS practice volume** | For **each clinical condition** taught in that portfolio, **manage at least three (3) real cases** using **ResusGPS** in a way the platform can **attribute** to the learner (see §5 on verification). “Manage” means **used ResusGPS to guide assessment or treatment decisions** for that encounter, within scope of practice. |
| **Safe-Truth / safety signal (monthly, two years)** | Log **at least one (1) Safe-Truth–eligible event per calendar month**, **consistently for twenty-four (24) consecutive months**. **Near misses and non-sentinel events count**; the goal is **routine safety culture**, not only catastrophic reporting. |

**Dependencies:** Until the product **records** course completion, ResusGPS case counts per condition, and monthly Safe-Truth (or provider safety) submissions with **auditable timestamps**, fellowship status remains **policy-defined** and may be **tracked manually** or **partially automated**. Update [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) when automation ships.

---

## 3. Enrollment in fellowship-path courses (profile gate)

To **enroll in fellowship-path offerings** (any course that sits under the **fellowship / ADF** narrative — i.e. participation in our **individual provider course catalogue** tied to that journey), the learner must **complete their provider profile** with at least:

| Field | Intent |
|-------|--------|
| **Cadre** | Role / professional category (for scope-appropriate messaging and aggregate workforce analytics). |
| **Place of work — facility** | Organisation name (and identifiers as implemented). |
| **Place of work — department / unit** | Ward, ED, HDU, etc. |
| **Country** | Jurisdiction and macro geography. |
| **Region** | Subnational region (state, county, province — per country taxonomy in product). |
| **Town / locality** | Finer geographic anchor for clustering (outbreak signals, access issues). |

**Product direction:** Block “Enroll” (or equivalent) until required fields validate; allow **save draft** where UX permits. Exact field names and enums live in **schema + UI**; this document defines **minimum intent**.

---

## 4. Internal use of profile and activity data (non-public)

Profile and usage data listed above exist primarily to support **Paeds Resus internal** and **partner-governed** uses such as:

- **Regional patterns** — e.g. unusual clustering of **diarrhoeal illness**, **respiratory outbreaks**, or other signals that may warrant **public health attention** or **targeted education** (outputs are **aggregated**; no public maps of named facilities without explicit governance).
- **Facility-level insight** — **not** published as league tables by default: internal use for **quality improvement**, **recommendations**, and **dialogue** with institutions that opt in or contract for insight.
- **Research and policy** — resource gaps (e.g. oxygen, staffing), **cadre-specific** training needs, and **evidence** for **policy change recommendations** where ethics and law allow.
- **Closing the loop** — connect **provider behaviour** (courses, ResusGPS), **institutional context**, **parent-facing** content (Safe-Truth, health education), and **mission metrics** without conflating audiences in UX.

**Default rule:** **Do not** expose **identifiable facility or individual provider** data **publicly** or to **unauthorised third parties**. Aggregates, de-identified research extracts, and **explicit consent** for any broader sharing must be **documented** when those programmes exist.

---

## 5. Suggested additions (governance and product)

Leadership and counsel should decide when to lock each item; builders should not invent legal claims.

| Topic | Why it matters |
|-------|----------------|
| **Privacy notice and consent** | Clear copy at profile completion and enrollment: **what** we collect, **why**, **retention**, **who may access**, and **rights** (access, correction, deletion where applicable). |
| **Defining “3 cases per condition”** | Tie to **ResusGPS pathway or session IDs**, **date range**, and **anti-gaming** rules (e.g. minimum interaction depth — product-defined). |
| **Attestation vs automated proof** | If automated logging is incomplete, interim **structured attestation** with audit risk accepted by governance. |
| **Safe-Truth scope for providers** | Confirm which **submission types** satisfy the **monthly** requirement (parent Safe-Truth vs provider incident channel — must align with actual product and ethics). |
| **“Consistent 24 months”** | Define handling of **one missed month** (grace period vs reset) — product and fairness. |
| **Data minimisation** | Collect only what is needed for stated uses; **avoid** collecting **patient identifiers** in free text where possible; use **structured fields**. |
| **Retention and deletion** | How long profile and logs are kept; **deletion** on account closure vs **legal hold** for research. |
| **Research ethics** | For **publication** or **external sharing**: IRB / ethics board alignment, **de-identification** standards, **opt-in** where required. |
| **Security** | Align with [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) §11; access control for **admin** analytics that combine geography + facility. |
| **Institutional alignment** | Where a provider works under an **institutional** contract, **data use** may be governed by **B2B agreements** in addition to individual consent. |

---

## 6. Relationship to other docs

- **Portfolio and MECE:** [COURSE_PORTFOLIO_AND_ADF_STRATEGY.md](./COURSE_PORTFOLIO_AND_ADF_STRATEGY.md)  
- **24 micro-course slots:** [MICRO_COURSE_CATALOG_BACKLOG.md](./MICRO_COURSE_CATALOG_BACKLOG.md)  
- **Mission and theory of change:** [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md)  
- **Technical and report definitions:** [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) (especially §8, §11)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-31 | Initial publication: fellow criteria (courses + ResusGPS cases + Safe-Truth cadence), profile gate, internal intelligence uses, suggested governance additions. |
