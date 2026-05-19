# Care Signal: Strategic Document and Implementation Roadmap

**Document type:** Canonical strategy and engineering roadmap
**Status:** Active — supersedes any prior informal Care Signal notes
**Date:** 2026-04-23
**Audience:** Leadership, engineering, product, clinical governance, institutional partners
**Relationship to other docs:**

| Document | Role |
|----------|------|
| [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) §3, §8, §17 | Binding product/technical decisions; this document expands on them |
| [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md) | Canonical grace/catch-up/streak rules and launch checklist |
| [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md) | Mission, theory of change, and LMIC context |
| [WORK_STATUS.md](./WORK_STATUS.md) | Weekly execution updates |

---

## Table of Contents

1. [Why Care Signal Exists](#1-why-care-signal-exists)
2. [What Care Signal Is — and Is Not](#2-what-care-signal-is--and-is-not)
3. [The Three Jobs of Care Signal](#3-the-three-jobs-of-care-signal)
4. [Clinical and Operational Design Intent](#4-clinical-and-operational-design-intent)
5. [Current Implementation Reality — Honest Audit](#5-current-implementation-reality--honest-audit)
6. [Root Cause Analysis](#6-root-cause-analysis)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [Data Model Requirements](#8-data-model-requirements)
9. [Fellowship Pillar C — Rules and Automation Requirements](#9-fellowship-pillar-c--rules-and-automation-requirements)
10. [Analytics and Intelligence Requirements](#10-analytics-and-intelligence-requirements)
11. [Legal, Privacy, and Governance](#11-legal-privacy-and-governance)
12. [Launch Gate Checklist](#12-launch-gate-checklist)
13. [Success Metrics](#13-success-metrics)

---

## 1. Why Care Signal Exists

Paeds Resus exists to reduce preventable childhood mortality in resource-limited settings. The platform's theory of change (STRATEGIC_FOUNDATION §3) is explicit: no single intervention is sufficient. Bedside guidance (ResusGPS), training (courses), and **feedback loops** must work together. Without feedback loops, providers and institutions cannot learn from what goes wrong.

Care Signal is that feedback loop.

In most low- and middle-income clinical environments, paediatric emergency events are either not documented at all, or documented in paper registers that are never aggregated, never analysed, and never acted upon. The nurse who watched a child deteriorate because the defibrillator pads were adult-sized has no formal channel to report that gap. The doctor who arrived four minutes late because the emergency trolley was locked has no mechanism to flag the system failure. The pattern repeats. Children continue to die from the same preventable causes.

Care Signal is designed to break that cycle by giving providers a **confidential, structured, low-friction channel** to report what went wrong — and by aggregating those reports into actionable intelligence that changes procurement decisions, training priorities, and institutional protocols.

This is not a compliance tool. It is a **culture-building tool** that rewards consistent engagement through the Fellowship qualification pathway, creating a self-reinforcing cycle: providers who report regularly become better practitioners, and their reports make the system better for every child.

---

## 2. What Care Signal Is — and Is Not

The PSOT (§3) is unambiguous on this distinction. It must be enforced in every user-facing surface, every analytics query, and every data model decision.

| Dimension | Care Signal | Safe-Truth |
|-----------|-------------|------------|
| **Audience** | Healthcare providers (clinical staff) | Parents and guardians |
| **Purpose** | Incident and near-miss reporting; QI culture; Fellowship discipline | Guardian experience, timelines, community voice |
| **Data table** | `careSignalEvents` | `parentSafeTruthSubmissions` |
| **Route** | `/care-signal`, `/care-signal-analytics` | `/parent-safe-truth` |
| **Fellowship role** | Drives Pillar C (monthly discipline) | No fellowship role |
| **Admin view** | Care Signal metrics (when instrumented) | Safe-Truth usage (this month) |
| **Naming in UI** | Always "Care Signal" | Always "Safe-Truth" |

**Non-negotiable rule:** The KPIs from these two products must never be combined, compared, or displayed together in any analytics surface. A provider's Care Signal streak is not influenced by Safe-Truth submissions, and vice versa.

---

## 3. The Three Jobs of Care Signal

Care Signal has three distinct, non-negotiable jobs. All three must be delivered for the product to be considered functional.

### Job 1: Provider-Facing QI Reporting

A healthcare provider who witnesses a paediatric emergency — whether it ends in survival, death, or near-miss — must be able to log the event in under five minutes. The report must capture:

- **What happened:** event type, patient age, date and time
- **How the team responded:** chain of survival steps (recognition, activation, CPR, defibrillation, advanced care, post-resuscitation)
- **What got in the way:** system gaps (knowledge, resources, leadership, communication, protocol, equipment, training, staffing, infrastructure)
- **What the outcome was:** survival, neurological status

The provider must then be able to **see their own history**, understand their **personal gap patterns**, and receive **actionable recommendations** tied to the specific gaps they reported. Without this feedback loop, there is no reason to keep reporting.

### Job 2: Fellowship Discipline (Pillar C)

Care Signal is the third pillar of the Fellowship qualification pathway. A provider earns Pillar C progress by submitting at least one eligible Care Signal event per calendar month (EAT) for 24 consecutive months. The full grace, catch-up, and streak reset rules are defined in FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md §7 and summarised in §9 of this document.

This pillar is intentionally demanding. Twenty-four months of consistent reporting is not a bureaucratic requirement — it is proof that a provider has internalised the discipline of reflective practice. A Fellow who has reported every month for two years has built a habit that will outlast the platform.

### Job 3: Internal Operational Intelligence

Aggregated, anonymised Care Signal data is the most honest signal the platform has about what is actually failing in paediatric emergency care at the facility level. This intelligence must flow to:

- **Institutional admins:** to see their facility's gap patterns and benchmark against anonymised peers
- **Platform admin:** to understand which gap categories are most prevalent across the network, informing training content priorities
- **Future research and policy:** to provide evidence for procurement decisions, staffing models, and protocol updates at county and national level

This is the long-range value of Care Signal. It transforms individual acts of reflection into a **national paediatric emergency intelligence network**.

---

## 4. Clinical and Operational Design Intent

### 4.1 The Reporting Form

The Care Signal form must be designed for use **after a shift**, not during a resuscitation. It is a reflective tool, not a real-time documentation system. The design principles are:

- **Low friction:** A provider who is exhausted after a difficult shift must be able to complete a report in under five minutes. Mandatory fields should be minimal; optional depth is available for those who want it.
- **Structured, not free-text:** Unstructured narratives cannot be aggregated. Gap categories, chain of survival steps, and outcome fields must be selectable from defined options. Free text is permitted for context but must not be the primary data capture mechanism.
- **Confidential by default:** Anonymous submission must be available. Providers in hierarchical clinical environments may fear retribution. The system must make it safe to report.
- **No patient identifiers:** The PSOT (§11) and the Fellowship doc (§10) are explicit: no patient identifiers in free text where avoidable. The form must guide providers away from including names, MRN numbers, or other identifying information.

### 4.2 The Two Form Components Problem

The codebase currently contains two parallel form implementations:

- **`CareSignalForm.tsx`:** A 5-step numeric stepper used on the main `/care-signal` page. Uses the structured `SafeTruthAgeBand` helper for age capture.
- **`CareSignalLogger.tsx`:** A 4-step named stepper used elsewhere. Uses a raw numeric age input in months. Has a different event type list (includes "Severe Sepsis", "Trauma", "Drowning", "Choking"; excludes "Tachyarrhythmia", "Bradycardia").

Both call the same `logEvent` mutation, meaning the database contains inconsistently structured data depending on which form was used. This must be resolved by **consolidating to a single canonical form component** with a unified field set.

### 4.3 The Feedback Loop

The most important design principle for Care Signal is that **every submission must produce a visible response**. A provider who submits a report and sees nothing change will not submit again. The feedback loop must include:

1. **Immediate confirmation:** A clear success message with a summary of what was submitted.
2. **History view:** The provider's past submissions, accessible from their dashboard.
3. **Personal gap analysis:** A visual breakdown of the gap categories they have reported most frequently.
4. **Actionable recommendations:** Specific, context-aware suggestions tied to the gaps they reported (e.g., if "Equipment Gap" is reported repeatedly, the recommendation should link to the relevant ResusGPS resource gap data and suggest a specific course).
5. **Fellowship progress update:** After each submission, the provider's Pillar C streak should update visibly.

---

## 5. Current Implementation Reality — Honest Audit

This section documents the gap between what Care Signal is designed to deliver and what the code currently provides. This is a brutally honest assessment, not a criticism of any individual contributor. The gaps exist because Care Signal was scaffolded as a UI shell before the backend was built. The scaffolding is now the problem.

### 5.1 What Works

| Component | Status | Notes |
|-----------|--------|-------|
| `logEvent` mutation | **Working** | Correctly inserts rows into `careSignalEvents` and fires `care_signal_submission_created` analytics event |
| Fellowship streak engine | **Working (with caveats)** | `computeCareSignalStreak` in `fellowship-care-signal-streak.ts` correctly implements grace/catch-up/reset logic |
| Provider access control | **Working** | Correctly gates on `ctx.user.providerType` or `admin` role |
| Anonymous submission | **Working** | `userId` is correctly set to `null` for anonymous submissions |

### 5.2 What is Broken or Incomplete

| Component | Status | Impact |
|-----------|--------|--------|
| `getEventHistory` | **Stubbed — returns empty array always** | Providers cannot see their own submissions. No feedback loop. |
| `getEventStats` | **Stubbed — returns zeros always** | No personal statistics. Dashboard is meaningless. |
| `getGapAnalysis` | **Stubbed — returns zero counts and empty recommendations always** | Gap analysis is non-functional. |
| `submitForReview` | **Stubbed — writes nothing to DB** | Institutional review workflow does not exist. |
| `getRecommendations` | **Three static strings, no personalisation** | Recommendations are generic and not tied to actual reported gaps. |
| `CareSignalAnalytics.tsx` | **100% mock data — no tRPC queries** | The analytics page is entirely fictional. Hard-coded incidents, stats, and gap percentages. |
| Fellowship UTC bug | **Bug — uses UTC instead of EAT** | `calculateCareSignalPillar` groups events by UTC month. Events submitted in the first three hours of a new EAT calendar month are credited to the wrong month. |
| Fellowship UI copy error | **Bug — wrong threshold displayed** | `FellowshipProgress.tsx` states "≥3 events per month" as a blanket rule. The correct baseline is ≥1. The ≥3 threshold applies only to catch-up months after a grace is consumed. |
| Duplicate form components | **Architectural debt** | `CareSignalForm.tsx` and `CareSignalLogger.tsx` both exist with different field sets, producing inconsistent data in the database. |
| `ResourceGapWidget` on Care Signal page | **Misleading** | This widget queries `resus_resource_gap` analytics events from ResusGPS, not Care Signal submissions. The Care Signal page presents ResusGPS data as if it were Care Signal intelligence. |
| `MultiFacilityBenchmarkWidget` on Care Signal page | **Misleading** | Same issue — powered by ResusGPS `resus_resource_gap` events, not Care Signal incident reports. |
| `facilityId` missing from schema | **Schema gap** | The `careSignalEvents` table has no facility identifier. Institutional analytics and facility-level benchmarking are impossible without a migration. |

### 5.3 The "Borrowed Intelligence" Problem

The Care Signal page currently presents two widgets — Resource Gap Trends and Multi-Facility Benchmark — that appear to be powered by Care Signal data. They are not. Both widgets query `analyticsEvents` of type `resus_resource_gap`, which are emitted automatically when a provider taps "Not Available" inside ResusGPS.

This creates a false impression of Care Signal's analytical capability. The widgets have real value, but they belong on the ResusGPS analytics surface, not on the Care Signal page. Their presence on the Care Signal page masks the fact that Care Signal's own data pipeline produces no downstream analytical output.

The fix is not to remove these widgets — the data they surface is genuinely useful. The fix is to:
1. Clearly label them as "ResusGPS Resource Gap Data" rather than "Care Signal Insights"
2. Build real Care Signal analytics to sit alongside them
3. Eventually create a unified "Facility Intelligence" view that combines both streams with clear provenance labels

---

## 6. Root Cause Analysis

The gaps documented in §5 share a common root cause: **Care Signal was built front-to-back instead of back-to-front**. The UI was scaffolded first, the form was built, and the submission mutation was wired. The analytics, history, and intelligence layers were left as stubs with the intention of completing them later. That later has not yet arrived.

The consequence is a product that looks complete from the outside but delivers nothing beyond form submission. Providers who submit reports receive no feedback. Institutions see no data. The Fellowship pillar has a correctness bug. The analytics page is fiction.

This is not a small gap. It is the difference between a product that changes behaviour and a product that collects data into a void. The roadmap in §7 addresses this systematically.

---

## 7. Implementation Roadmap

The roadmap is organised into three phases. Each phase must be completed before the next begins. Phase 1 is the minimum viable Care Signal — the point at which the product begins to deliver its core value. Phases 2 and 3 build the intelligence and institutional layers.

### Phase 1: Close the Feedback Loop (Priority: Immediate)

*Goal: Every provider who submits a report must be able to see it reflected back to them.*

**P1.1 — Fix `getEventHistory`**
Replace the stub with a real database query. Return the authenticated user's submissions from `careSignalEvents`, ordered by `createdAt` descending. Include pagination. For anonymous submissions, return only the user's non-anonymous history (anonymous submissions have `userId = null` and cannot be attributed).

**P1.2 — Fix `getEventStats`**
Replace the stub with real aggregation. Compute: total events submitted, most common event type, most common system gap, outcome distribution (survived / died / transferred), and date of most recent submission.

**P1.3 — Fix the Fellowship UTC Bug**
In `fellowship.ts`, replace `getUTCFullYear()` / `getUTCMonth()` with EAT-aware equivalents. EAT is UTC+3. The correct approach is to offset the timestamp by 3 hours before extracting year and month:

```typescript
// Correct EAT bucketing
const eatOffset = 3 * 60 * 60 * 1000; // 3 hours in ms
const eatDate = new Date(event.createdAt.getTime() + eatOffset);
const year = eatDate.getUTCFullYear();
const month = eatDate.getUTCMonth() + 1;
```

**P1.4 — Fix the Fellowship UI Copy**
In `FellowshipProgress.tsx`, correct the Pillar 3 requirements list. The correct text is:
- ≥1 eligible Care Signal event per month (normal month)
- ≥3 eligible events required in the month immediately following a grace month (catch-up)
- 2 grace periods available per calendar year (EAT)

**P1.5 — Consolidate Form Components**
Deprecate `CareSignalLogger.tsx`. Ensure `CareSignalForm.tsx` is the single canonical form used everywhere. Align the event type list with the PSOT-defined algorithm categories (Cardiac Arrest, Tachyarrhythmia, Bradycardia, Respiratory Failure, Shock, Other). Add "Near Miss" as a distinct event type to encourage reporting of events that did not result in harm.

**P1.6 — Submission Confirmation with Fellowship Update**
After a successful submission, show the provider:
- A confirmation summary of what was submitted
- Their updated Care Signal streak (current month count, streak length, grace status)
- A CTA to view their full submission history

### Phase 2: Build the Analytics Reality (Priority: High)

*Goal: Replace all mock data with live queries. Make the analytics page truthful.*

**P2.1 — Schema Migration: Add `facilityId`**
Add a nullable `facilityId` column to `careSignalEvents`. Populate it from `ctx.user.facilityId` (or equivalent profile field) at submission time. This is the prerequisite for all facility-level analytics.

**P2.2 — Implement `getGapAnalysis`**
Parse the `systemGaps` JSON array from the user's submissions. Aggregate by gap category across the requested timeframe. Return counts and percentages. This is the data that powers the gap analysis charts.

**P2.3 — Implement Dynamic Recommendations**
Build a rules engine that maps gap categories to specific, actionable recommendations. The rules must be:
- **Context-aware:** A "Knowledge Gap" recommendation for a nurse should differ from one for a doctor
- **Platform-linked:** Recommendations should link to specific ResusGPS pathways or micro-courses where relevant
- **Prioritised:** Gaps reported multiple times should generate higher-priority recommendations

**P2.4 — Replace Mock Data in `CareSignalAnalytics.tsx`**
Remove all hard-coded constants. Wire the page to the newly implemented tRPC queries. The page should display:
- Real KPI cards (total submissions, most common gap, outcome distribution)
- Real gap analysis chart (from `getGapAnalysis`)
- Real submission history table (from `getEventHistory`)
- Real recommendations (from `getRecommendations`)

**P2.5 — Clarify Widget Provenance**
Rename the `ResourceGapWidget` and `MultiFacilityBenchmarkWidget` on the Care Signal page to make their data source explicit. Add a label: "Data source: ResusGPS resource gap reports." Add explanatory copy that distinguishes this stream from deliberate Care Signal incident reports.

### Phase 3: Institutional Intelligence (Priority: Medium)

*Goal: Deliver facility-level analytics to institutional admins and platform admin.*

**P3.1 — Implement `submitForReview`**
Update the mutation to change the event `status` field in the database from `submitted` to `under_review`. Notify the relevant institutional admin (via the existing notification infrastructure or a new admin alert).

**P3.2 — Institutional Admin View**
Create a view for institutional admins that shows their facility's Care Signal data:
- Total submissions this month and this quarter
- Gap category breakdown for their facility
- Anonymised comparison against platform-wide averages (using the existing `getMultiFacilityBenchmark` pattern)
- Events flagged for review

**P3.3 — Admin Intelligence Dashboard**
Extend the platform admin view to include Care Signal metrics:
- Total Care Signal submissions platform-wide (this month, last 7 days — per PSOT §8 definitions)
- Top gap categories across the network
- Facilities with the highest reporting rates (proxy for QI culture)
- Facilities with zero submissions (intervention targets)

**P3.4 — MOH Export Enhancement**
The existing `getMOHExportData` endpoint aggregates ResusGPS resource gap data. Extend it to include a separate Care Signal section: total incident reports by event type, gap category distribution, and outcome distribution. This is the foundation for county and national reporting.

---

## 8. Data Model Requirements

The current `careSignalEvents` table is insufficient for the product's intended scope. The following changes are required.

### 8.1 Current Schema

```sql
careSignalEvents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,                          -- nullable for anonymous
  eventDate TIMESTAMP NOT NULL,
  childAge INT NOT NULL,
  eventType VARCHAR(255) NOT NULL,
  presentation TEXT NOT NULL,
  isAnonymous BOOLEAN NOT NULL DEFAULT FALSE,
  chainOfSurvival TEXT NOT NULL,       -- JSON blob
  systemGaps TEXT NOT NULL,            -- JSON blob
  gapDetails TEXT NOT NULL,            -- JSON blob
  outcome VARCHAR(512) NOT NULL,
  neurologicalStatus VARCHAR(512) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'submitted',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW()
)
```

### 8.2 Required Additions

| Column | Type | Purpose |
|--------|------|---------|
| `facilityId` | INT, nullable | Links submission to a facility for institutional analytics |
| `reviewerId` | INT, nullable | Admin or institutional user who reviewed the event |
| `reviewedAt` | TIMESTAMP, nullable | When the review occurred |
| `reviewNotes` | TEXT, nullable | Reviewer's notes |
| `eligibleForFellowship` | BOOLEAN, default TRUE | Server-side flag; set to FALSE if submission fails validation rules |
| `submissionVersion` | VARCHAR(10), default '2' | Tracks which form version was used; enables future schema evolution |

### 8.3 Migration Strategy

Add all new columns as nullable with defaults. No existing rows need updating. The `facilityId` should be populated from the user's profile at submission time. If the user has no facility set, `facilityId` remains null and the submission is still valid (it simply cannot be attributed to a facility in institutional analytics).

---

## 9. Fellowship Pillar C — Rules and Automation Requirements

This section summarises the Care Signal fellowship rules as defined in FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md §7. All automation must implement these rules exactly.

### 9.1 Monthly Qualification Rules

| Scenario | Rule | Outcome |
|----------|------|---------|
| Normal month | ≥1 eligible submission in the EAT calendar month | Month qualifies; streak increments |
| Grace month | 0 eligible submissions; grace budget available (≤2 used in EAT year) | Month counts as grace; streak increments; next month is catch-up |
| Catch-up month | Month following a grace month | Must have ≥3 eligible submissions; if achieved, streak increments; if failed, streak resets to 0 |
| Third failure | 0 eligible submissions; grace budget exhausted | Pillar C streak resets to 0; Pillars A and B are unaffected |

### 9.2 Grace Budget

- Maximum 2 grace periods per EAT calendar year (January–December EAT)
- After a successful catch-up (≥3 events in the month following a grace), the provider may use at most 1 additional grace in the same year (total ≤2)
- Grace budget resets at the start of each EAT calendar year

### 9.3 Eligibility

A submission is eligible for fellowship purposes if:
- `status = 'submitted'` (not draft)
- `eligibleForFellowship = TRUE` (passes server-side validation)
- `userId` is not null (anonymous submissions do not count toward fellowship)
- The submission was created in the relevant EAT calendar month

### 9.4 UI Requirements

The Fellowship progress dashboard must display, for Pillar C:
- Current streak (number of consecutive qualifying months)
- Months remaining to 24
- Grace periods used this year / 2 total
- Whether the current month is a catch-up month (and if so, how many events have been submitted vs the 3 required)
- Clear messaging when a streak reset occurs: "Your Care Signal streak has reset. You can start again this month."

### 9.5 Anti-Gaming

- Rate limiting: no more than 5 submissions per user per day count toward fellowship eligibility
- Duplicate detection: submissions with identical `eventDate`, `eventType`, and `childAge` within 10 minutes of each other are flagged for review
- Minimum field completion: `eventType`, `outcome`, and at least one `systemGaps` entry must be present for a submission to be eligible

---

## 10. Analytics and Intelligence Requirements

### 10.1 Provider-Level Analytics (Personal)

Every provider must be able to see:

| Metric | Definition |
|--------|------------|
| Total submissions | Count of all their `careSignalEvents` rows |
| Submissions this month | Count in the current EAT calendar month |
| Most common event type | Mode of `eventType` across all their submissions |
| Most common gap | Mode of the most frequently selected item in `systemGaps` across all their submissions |
| Outcome distribution | Count of each `outcome` value |
| Care Signal streak | Current Pillar C streak (from fellowship calculation) |
| Grace status | Graces used this year, catch-up pending flag |

### 10.2 Facility-Level Analytics (Institutional)

Institutional admins must be able to see, for their facility:

| Metric | Definition |
|--------|------------|
| Total submissions this month | Count of `careSignalEvents` with matching `facilityId` in EAT calendar month |
| Gap category breakdown | Aggregated frequency of each gap category across all facility submissions |
| Reporting rate | Percentage of registered providers at the facility who have submitted at least one event this month |
| Outcome distribution | Count of each `outcome` value for the facility |
| Benchmark comparison | Anonymised comparison of gap categories against platform-wide averages |

### 10.3 Platform-Level Analytics (Admin)

The platform admin must be able to see:

| Metric | Definition |
|--------|------------|
| Total Care Signal submissions (this month) | Count of all `careSignalEvents` in EAT calendar month |
| Total Care Signal submissions (last 7 days) | Rolling 7×24 hour count |
| Top gap categories (platform-wide) | Aggregated gap frequency across all submissions |
| Active reporters | Count of distinct `userId` values with at least one submission in the last 30 days |
| Facilities with zero submissions | Facilities with registered providers but no Care Signal submissions in the last 30 days |

---

## 11. Legal, Privacy, and Governance

All Care Signal implementation must comply with the requirements in FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md §10. The key requirements are:

**Data minimisation:** The form must guide providers away from including patient identifiers. Free text fields should include placeholder text that explicitly discourages names, MRN numbers, or other identifying information.

**Consent:** Providers must explicitly consent to Care Signal data being used for QI and fellowship purposes at the point of account creation or first Care Signal submission. Consent must be purpose-specific and withdrawable.

**Retention:** A documented retention policy must exist for `careSignalEvents`. Anonymous submissions have no `userId` and cannot be deleted on account closure; they should be retained as aggregate data. Non-anonymous submissions should be deletable on account closure unless a legal or regulatory hold applies.

**Access control:** Facility-level Care Signal data must only be accessible to the institutional admin for that facility and to platform admin. Providers can only see their own submissions. No public API for identifiable staff-facility joins.

**Accuracy:** Fellowship progress must be computed from server-side data only. Client-side counts are never authoritative. An appeals process must be documented for cases where a system error incorrectly reset a streak.

---

## 12. Launch Gate Checklist

Care Signal is not considered launched until all items in this checklist pass. This checklist extends FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md §11.

### 12.1 Data and Automation

- [ ] `getEventHistory` returns real data from `careSignalEvents`
- [ ] `getEventStats` returns real aggregated statistics
- [ ] `getGapAnalysis` returns real gap counts from submitted data
- [ ] `getRecommendations` returns context-aware, gap-specific recommendations
- [ ] `submitForReview` writes status change to database
- [ ] EAT month bucketing implemented and tested in `calculateCareSignalPillar`
- [ ] `facilityId` column added to `careSignalEvents` and populated at submission
- [ ] `eligibleForFellowship` flag implemented and enforced
- [ ] Anonymous submissions correctly excluded from fellowship streak calculation
- [ ] Rate limiting and duplicate detection implemented

### 12.2 UX and Form

- [ ] Single canonical form component (`CareSignalForm.tsx`) used everywhere
- [ ] `CareSignalLogger.tsx` deprecated and removed from all routes
- [ ] Submission confirmation shows streak update and fellowship progress
- [ ] History view accessible from provider dashboard
- [ ] Personal gap analysis chart displays real data
- [ ] Fellowship progress UI shows correct ≥1 normal / ≥3 catch-up thresholds
- [ ] Grace status, catch-up pending, and streak reset messaging implemented
- [ ] Widget provenance labels clarify ResusGPS vs Care Signal data sources

### 12.3 Analytics

- [ ] `CareSignalAnalytics.tsx` contains no hard-coded mock data
- [ ] All analytics queries connected to real database
- [ ] Facility-level view available to institutional admins
- [ ] Platform admin view includes Care Signal metrics

### 12.4 Legal and Policy

- [ ] Privacy policy updated to cover Care Signal data
- [ ] Consent flow implemented at first Care Signal submission
- [ ] Retention policy documented
- [ ] Appeals process documented for streak reset errors

---

## 13. Success Metrics

Care Signal's success is measured across three dimensions, aligned with the platform's mission and the Fellowship qualification framework.

### 13.1 Engagement Metrics

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| Monthly active reporters | ≥30% of registered providers |
| Average submissions per active reporter per month | ≥1.5 |
| Providers with active Care Signal streak (≥3 months) | ≥20% of registered providers |
| Submission completion rate (form started → submitted) | ≥70% |

### 13.2 Quality Metrics

| Metric | Target |
|--------|--------|
| Submissions with at least one gap category selected | ≥90% |
| Submissions with outcome recorded | ≥95% |
| Anonymous submission rate | ≤40% (high anonymity suggests low psychological safety; target is to reduce over time as trust builds) |

### 13.3 Impact Metrics

| Metric | Target |
|--------|--------|
| Gap categories reported → linked to course enrollment | Measurable correlation within 6 months |
| Facilities with ≥5 active reporters | ≥10 facilities within 12 months |
| Care Signal data cited in institutional QI reports | ≥3 partner institutions within 12 months |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-23 | Initial document created. Full strategic analysis, audit of current implementation, and three-phase roadmap. Linked from PSOT §19. |
