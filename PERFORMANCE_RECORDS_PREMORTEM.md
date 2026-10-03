# Paeds Resus Performance, Progress, and Records
## Deep Premortem and Blind-Spot Audit

**Date:** 3 October 2026  
**Scope:** My Performance, My Progress, My Records, Professional Progress, certificates, CPD, Fellowship, Life Support, NERP, IERP, Care Signal, Code Signal, goals, verification, and future institutional use.  
**Method:** Source-code audit, route/data-flow inspection, calculation review, permission review, test-surface review, stale-version comparison, and live authenticated-path verification of the current NERP/IERP continuation work.

---

## Executive judgement

The platform has the beginnings of a valuable professional evidence system, but it is currently **too fragmented and semantically unsafe to be trusted as an appraisal-grade record without qualification**.

The biggest risk is not that users dislike the design. The biggest risk is that users see a polished progress number that is:

- calculated from a different source than another page;
- labelled as monthly, quarterly, or annual while much of the data is all-time;
- silently reconstructed through fallbacks when the primary records query fails;
- not actionable enough to help the user improve;
- not yet an authoritative institutional record;
- publicly verifiable in a way that exposes more personal information than necessary.

If released unchanged, the likely outcome is not one catastrophic failure. It is a slow trust collapse:

1. a user sees `0%` or a contradictory figure;
2. they cannot understand why;
3. they find the same activity represented differently elsewhere;
4. they stop checking the feature;
5. institutions continue using spreadsheets and WhatsApp for the real decisions;
6. the platform accumulates attractive but non-authoritative dashboards.

**Hard conclusion:** We should stop adding more scorecards until the platform has one canonical record model, explicit data-quality states, period-correct aggregation, actionable next steps, and a defined boundary between a learner-owned record and an institutional performance record.

---

# 1. What exists today

## 1.1 Four overlapping surfaces

The platform currently has at least four related surfaces:

| Surface | Route / location | Primary purpose | Current risk |
|---|---|---|---|
| Provider-home scorecard | `MyPerformanceScorecard` on Provider Dashboard | Short 90-day summary | A separate data model and period from the other surfaces |
| My Progress | `/performance-dashboard` | Period-over-period personal comparison | Uses a comparison API plus a separate annual progress query |
| Detailed Professional Progress | `/my-progress` | Period report, goals, pathways, certificates, verification | Presents itself as unified but has period and source gaps |
| My Records | `/records` | Certificates, CPD, Fellowship, downloads | Uses several independent queries plus fallbacks |

There are also adjacent surfaces:

- `/my-cpd-certificates`
- `/fellowship/progress`
- `/care-signal`
- `/code-signal`
- course pages and course players
- NERP and IERP pathway pages
- institutional analytics and staff-roster surfaces

A user does not experience these as an architecture. They experience them as several places that all appear to answer the question: **“How am I doing?”**

That is already an adoption risk.

## 1.2 The naming is not resolved

The product currently uses all of these terms:

- My Performance
- My Progress
- My Professional Progress
- My Records
- Learning records and evidence
- Performance summary
- Professional growth

These are not interchangeable:

- **Performance** implies evaluation, judgement, and possibly employment consequences.
- **Progress** implies learning movement and next steps.
- **Records** implies evidence and retrieval.

The current product mixes them instead of giving each a clear job.

### Recommended product model

Use one parent area with three explicit modes:

1. **Continue learning** — what to do next.
2. **My record** — what has been completed and verified.
3. **My goals** — what the user intends to achieve.

Keep **Performance** only for a clearly defined comparison view, and explain that it is not a clinical competence score or an employer evaluation unless formally adopted by an institution.

---

# 2. Critical data-truth findings

## 2.1 Period labels are currently misleading — P0

`professional-progress.ts` accepts `monthly`, `quarterly`, `annual`, and `custom` periods. However, the period filter is materially applied only to CPD rows.

The following are queried without period filtering:

- Life Support enrollments
- NERP pathway records
- IERP pathway records
- external completion records
- certificates
- Fellowship progress
- micro-course enrollments

Therefore, a report labelled **Monthly** can contain:

- all historical certificates;
- current pathway state rather than activity during that month;
- all-time Fellowship progress;
- all external completion evidence;
- all Life Support course state.

This may be acceptable for a **current status report**, but it is not acceptable for a period activity report unless the UI says so explicitly.

### Why this will break trust

A user may select “Monthly,” print the report for an appraisal, and reasonably believe every figure describes that month. An assessor may believe the same thing. The report is therefore vulnerable to misinterpretation even if every underlying row is genuine.

### Required fix

Split report semantics into two separate concepts:

- **Current status as at date**
- **Activity during period**

Never use one `periodType` field to imply both.

Every metric must carry:

- `scope`: `point_in_time` or `activity_in_period`;
- `asOfDate` or `periodStart`/`periodEnd`;
- `sourceCount`;
- `lastUpdatedAt`;
- `dataQuality`.

## 2.2 There is no single canonical progress calculation

Life Support progress is calculated through several paths:

- `professional-progress.ts`
- `professional-progress-calculation.ts`
- provider performance comparison logic
- certificate status logic
- completion-record logic
- pathway-specific NERP and IERP state machines
- records-hub fallback logic

The helpers use different concepts:

- tracked `progressPercentage`;
- cognitive completion flags;
- AHA evidence completion;
- practical sign-off;
- certificates;
- pathway phase state;
- external completion evidence.

The system tries to deduplicate by selecting the “best” enrollment per `programType`, but this is a heuristic. It is not an authoritative enrollment identity model.

### Failure examples

- Two active BLS enrollments can be collapsed based on progress and `updatedAt`, even if they belong to different programmes or cohorts.
- A cancelled or stale record can still influence a pathway if it is linked through a separate NERP table.
- A certificate can imply 100% while the enrollment’s current state is incomplete or revoked.
- An external completion can be shown at 100% but is intentionally excluded from the core average, which users may experience as “the system does not count my certificate.”

### Required fix

Create one canonical `learningEvidenceLedger` or equivalent domain service with:

- learner;
- course;
- programme/pathway;
- source;
- enrollment identity;
- evidence type;
- state;
- phase;
- percentage;
- effective date;
- verified date;
- expiry date;
- revocation state;
- source precedence;
- explanation.

All surfaces must read the same resolved record, not recalculate independently.

## 2.3 The headline average is too simplistic

The performance dashboard computes a simple arithmetic average of current Life Support course percentages.

That creates problems:

- BLS, ACLS, PALS, and NRP are treated as equal-weight records even when the user only needs one programme.
- A user with BLS at 100% and ACLS at 0% sees 50%, but that may not describe their active learning journey.
- A user with one completed course and three irrelevant empty course rows may be diluted.
- The average does not distinguish “not started,” “not applicable,” “not enrolled,” “blocked,” and “not recorded.”

Averages are psychologically powerful and clinically weak unless the denominator is explicit.

### Better model

Show:

- `BLS: Complete`
- `ACLS: 40% — Phase 1 cognitive`
- `PALS: Not enrolled`
- `NRP: No record`

Then show a pathway-specific summary only where a pathway exists.

Do not lead with a single average unless the user explicitly chooses a defined bundle.

## 2.4 Coarse percentages create false precision

Current pathway percentages include values such as:

- 0%
- 25%
- 50%
- 75%
- 100%

The UI presents these as precise progress values. A user may interpret 50% as half of all work, while the underlying state may simply mean “cognitive courses complete” or “Phase 2 evidence verified.”

Use named states first and percentages second:

> **Phase 2 evidence pending** — approximately 50% of the pathway state model.

## 2.5 NERP and IERP are represented as pathways, but their state meanings differ

NERP progress is driven by BLS/ACLS coursework, payment, and external verification evidence. IERP progress is driven by intern profile evidence, cognitive state, payment, simulation state, and Phase 3 state.

The current UI puts both into comparable percentage cards. This invites comparison even though:

- they have different eligibility rules;
- different evidence types;
- different payment gates;
- different programme structures;
- different user populations.

The cards need a visible **programme-specific explanation**, not just a percentage.

---

# 3. User adoption premortem

## 3.1 “I already know where my certificates are”

Users will not adopt a new progress area if it feels like an extra dashboard that duplicates `/records`, `/my-cpd-certificates`, and `/fellowship/progress`.

The system currently asks users to learn several routes:

- progress for percentages;
- records for certificates;
- CPD page for CPD details;
- Fellowship page for Fellowship details;
- course pages to continue learning.

The links help, but the mental model remains fragmented.

### Mitigation

Make `/records` the evidence hub and `/my-progress` a learning-and-goals view. Every card should deep-link to the exact relevant record or action. Do not reproduce long lists in multiple places.

## 3.2 “The system says zero, so the system is broken”

A zero can currently mean several things:

- no enrollment;
- not started;
- no linked record;
- data not synchronized;
- wrong email match;
- query failed and fallback returned empty;
- the user has external evidence that is stored elsewhere;
- the programme is not applicable.

The user sees a number, not the reason.

### Required state taxonomy

Every zero must be one of:

- **Not enrolled**
- **Not started**
- **In progress**
- **Blocked — action required**
- **Completed**
- **No record found — check profile**
- **Data still syncing**
- **Not applicable**

A zero without a reason is a defect.

## 3.3 “This feels like surveillance”

The provider-home scorecard says activity may be visible to authorized institution administrators. The personal progress page says it is private. The distinction is not sufficiently prominent or operationally specific.

Users will worry that:

- CPD attendance is being used as a disciplinary score;
- Care Signal and Code Signal reports are being interpreted as performance failures;
- low progress affects employment;
- external certificates are judged differently from platform certificates;
- a manager can see personal learning goals without consent.

This is especially serious for clinical incident and quality-improvement data.

### Required privacy contract

At the moment each metric is shown, display:

- who can see it;
- whether it is self-only, institution-visible, or nationally aggregated;
- whether it affects employment or certification;
- how corrections and appeals work;
- whether the record is learning evidence or performance evaluation.

Institutional visibility must be permissioned by field and purpose, not only by page.

## 3.4 “The report looks official, but I cannot rely on it”

The report has language such as “verified snapshot” and is intended for interviews and appraisals. That raises the standard substantially.

A user will lose trust if:

- the certificate is listed but cannot download;
- the report has no issuer or organizational signature;
- the data has no freshness indicator;
- the report changes depending on which page generated it;
- the report says “annual” but contains all-time records;
- a correction cannot invalidate an old snapshot;
- an external reviewer cannot understand what was verified.

The current snapshot is cryptographically hashed, but a hash proves integrity of the stored snapshot. It does not prove that the underlying data was correct, complete, current, or institutionally authorized.

## 3.5 “The next action is not obvious”

The platform has improved continuation links, but users still have to interpret labels such as:

- “Phase 1 evidence”;
- “Phase 2 verification pending”;
- “AHA eLearning proof”;
- “programme payment”;
- “cognitive prerequisite.”

A progress card should answer three questions immediately:

1. What have I completed?
2. What is blocking me?
3. What exact action should I take now?

The current cards often answer only question 1 and partially answer question 3.

## 3.6 “I set a goal, but the system does not help me achieve it”

Goals currently have a title, target value, unit, and period. However:

- the UI uses a hardcoded `cpd_sessions` metric key;
- the goal is not visibly linked to actual progress;
- achievement is not automatically calculated;
- there is no edit, archive, pause, or delete flow;
- there is no reminder or check-in;
- overlapping goals are allowed;
- arbitrary targets and periods can be created;
- the report does not clearly show `actual / target`.

This produces a goal-entry form, not a goal system.

### Minimum viable goal loop

> Set goal → show baseline → recommend next action → record activity → show progress → prompt review → mark achieved or revise.

Without this loop, the feature will have low repeat use.

---

# 4. Records hub premortem

## 4.1 The records hub is not yet a complete record system

The records page currently has three main tabs:

- Life Support
- CPD
- Fellowship

But users also expect records for:

- Micro-courses;
- NERP and IERP pathway evidence;
- Care Signal learning evidence;
- Code Signal learning evidence;
- professional licence and external life-support credentials;
- institutional appointments and service roles;
- goals and appraisal reports;
- verification history and corrections.

The page description promises a broad record system, but the tabs do not yet represent the whole professional record.

## 4.2 Fallback data can appear as a certificate record without download capability

`ProviderRecords` uses the professional progress report as a fallback when the primary certificate query is empty. This improves resilience but creates a semantic problem:

- the fallback rows may not contain a real certificate ID;
- they may not contain a certificate URL;
- they may not be downloadable;
- they may not contain expiry data;
- they may be snapshots rather than authoritative certificate rows.

A user can therefore see a certificate-like item that cannot be retrieved.

### Required fix

Label fallback evidence clearly:

- **Certificate issued — download available**
- **Completion evidence recorded — certificate projection pending**
- **External evidence verified — original document available**
- **Record synchronization issue — request correction**

Never silently render a fallback record as equivalent to an issued certificate.

## 4.3 Phase display is not sufficiently evidence-oriented

The record page needs to show, per course:

- Phase 1 cognitive status;
- Phase 2 simulation status;
- Phase 3 hands-on status;
- evidence submitted / verified / rejected;
- dates;
- certificate number;
- expiry;
- renewal action;
- source pathway;
- correction or appeal status.

A simple “complete / not recorded” badge is not enough for a high-stakes certification record.

## 4.4 Certificate mandate is not fully proven by the records UI

The platform mandate is to issue downloadable certificates for:

- every completed micro-course;
- overall Fellowship completion;
- all AHA courses.

The code contains issuance helpers, but this audit did not find a single end-to-end invariant guaranteeing:

> completion event → certificate issued exactly once → certificate downloadable → certificate visible in Records → public verification works.

That invariant must be tested for every course family.

## 4.5 No visible correction workflow

A record can be wrong because:

- the provider used another email at a CPD session;
- the institution entered the wrong name or cadre;
- duplicate enrollments exist;
- a certificate has the wrong date;
- external evidence is attached to the wrong user;
- a provider changes institutions;
- a certificate is revoked or superseded.

The current experience does not provide a strong, record-specific “This is wrong” action with status tracking.

A feedback dialog for certificate download is not the same as a correction workflow.

---

# 5. Verification and privacy premortem

## 5.1 Public verification exposes too much

The public verification endpoint returns:

- subject name;
- cadre;
- period;
- snapshot hash;
- the full snapshot payload.

The snapshot itself includes the subject email and detailed learning records. A bearer verification code is effectively a shareable access token. Anyone who receives the link may see more than an interviewer needs.

### Required fix

Create two report modes:

1. **Private owner report** — full details.
2. **Public verification view** — minimum necessary disclosure:
   - name or masked name chosen by user;
   - credential/report type;
   - verified status;
   - issue/generated date;
   - reporting period;
   - selected achievements;
   - no email by default;
   - no sensitive incident detail;
   - no raw pathway/payment detail unless explicitly included.

Add:

- revocation;
- expiration or review date;
- regeneration;
- access logging;
- owner-visible share history;
- correction status.

## 5.2 “Verified” is not defined

Verified can mean:

- platform database row exists;
- attendance was verified;
- an administrator reviewed evidence;
- a certificate was cryptographically signed;
- a report was approved by an institution;
- a snapshot has not been altered.

These are different claims. The current language risks collapsing them into one.

Every verified item should state:

> Verified by whom, using what evidence, at what time, under what policy?

## 5.3 Immutable snapshots can preserve known errors

An immutable report is useful for integrity, but once a wrong record is discovered, the system needs:

- superseded status;
- correction reason;
- replacement report relationship;
- old report retained for audit but clearly marked invalid or superseded.

Otherwise the platform may continue presenting a wrong report as valid simply because it was “immutable.”

---

# 6. Institutional transfer premortem

## 6.1 Personal progress and institutional performance are not yet one governed model

The personal professional progress router is owner-scoped. Institutional analytics appears to use separate roster, CPD, and facility data paths. I found no evidence that institutional leaders consume the learner’s immutable professional progress snapshots as the canonical staff record.

This creates a likely split:

- learner sees one record;
- institution sees a roster or CPD-derived record;
- administrator cannot explain the difference;
- learner disputes the institutional view;
- staff appraisal becomes a reconciliation exercise.

## 6.2 Email matching remains a structural weakness

CPD attendance is matched using account email in several paths. Email matching is fragile because:

- names change;
- emails are mistyped;
- personal and work emails differ;
- attendees use shared institutional addresses;
- one person can have duplicate accounts;
- email can be reassigned;
- privacy policies may prevent broad matching.

The platform should use a stable platform identity where possible, with email as a controlled fallback and an explicit match-review queue.

## 6.3 Staff visibility needs field-level design

Institutional leaders may need:

- licence active/expired;
- life-support active/expired;
- pathway phase;
- CPD target progress;
- support needs;
- department trends.

They should not automatically receive:

- private goals;
- raw clinical incident details;
- personal contact information beyond operational necessity;
- sensitive external evidence documents;
- a punitive-looking composite score.

The institutional view should be designed as **support and readiness management**, not a leaderboard.

## 6.4 No clear “support colleague” workflow

The vision includes identifying people who can support others. A percentage dashboard does not provide that safely.

A useful system needs:

- opt-in peer support status;
- competence scope;
- current validity;
- department and shift context;
- workload limits;
- supervisor approval;
- no public ranking.

---

# 7. Clinical and professional safety risks

## 7.1 A progress score is not competence

The interface contains disclaimers, but the visual prominence of percentages can overpower them. A provider may interpret course completion as current clinical competence.

The system must distinguish:

- learning exposure;
- cognitive completion;
- simulation participation;
- instructor-assessed practical competence;
- current certification validity;
- observed workplace performance;
- patient outcome data.

These are not interchangeable.

## 7.2 Care Signal and Code Signal are not ordinary performance metrics

Counting named reports as “QI reports” can accidentally reward quantity over quality or discourage reporting. It can also make a provider fear that reporting safety issues harms their appraisal.

The scorecard should not present report count as inherently good or bad. It should show participation context and explicitly state that reporting is protected learning and safety activity, not a productivity contest.

## 7.3 Crash-cart audits need context

A count of audits does not indicate whether the audit was valid, whether deficiencies were corrected, or whether the audit was assigned to the person. A higher number may reflect assignment volume, not performance.

Show:

- assigned;
- completed;
- findings identified;
- findings closed;
- overdue actions;
- role and department context.

## 7.4 Certificate expiry is not the same as readiness

The provider-home scorecard documentation itself acknowledges limitations around assumed Life Support expiry windows. Any assumed validity period must never be shown as authoritative certification status.

Use the actual certificate expiry and source, or show **expiry unknown**.

---

# 8. UX, accessibility, and cognitive load

## 8.1 Too much information, too little hierarchy

The detailed progress page contains:

- four headline metrics;
- continuation cards for BLS, ACLS, PALS, NRP;
- CPD;
- Fellowship;
- Care Signal;
- Code Signal;
- Life Support records;
- external completions;
- pathway records;
- goals;
- certificates;
- print and verification actions.

That is a large amount of content for a user who may only want to know: **“What do I do next?”**

Recommended default order:

1. Current next action.
2. What is blocking it.
3. Current course/pathway state.
4. Evidence and certificates.
5. Goals.
6. Historical analytics.

## 8.2 Empty states are not operational enough

“No records yet” is not enough. Each empty state must offer:

- what the system expected;
- why it is empty;
- what the user can do;
- where to correct identity or submit evidence;
- whether the issue is normal or technical.

## 8.3 Action links can be unsafe when state is stale

Continuation destinations are now phase-aware, but a user may click from an old page after their state changes. Every destination must re-check server authorization and return a clear reason if the state changed. The page must not assume that the client’s displayed percentage is current.

## 8.4 Print is not a report product

`window.print()` is useful but insufficient for an appraisal-grade professional record. It does not guarantee:

- stable branding;
- page headers and footers;
- controlled disclosure;
- document version;
- issuer identity;
- inclusion of evidence links;
- predictable pagination;
- accessibility of the exported file.

The user asked for a PDF summary that can be used in interviews, recommendations, and appraisals. That needs a real report template, not only browser print.

## 8.5 Mobile needs priority testing

The target users include busy clinicians using mobile devices. The current pages contain dense grids, long cards, multiple buttons, and small explanatory text. Test with:

- one-handed use;
- poor network;
- small screens;
- large text settings;
- screen readers;
- low-light conditions;
- a user interrupted halfway through a task.

---

# 9. Technical reliability and operational risks

## 9.1 Silent fallbacks can hide real failures

The records hub falls back to professional progress data when certificate or CPD queries are empty. This is resilient from a user-interface perspective but dangerous operationally if it masks:

- schema drift;
- query failures;
- migration gaps;
- permission errors;
- partial deployment;
- stale cache.

A fallback must show a visible data-quality status and log a structured event for operations.

## 9.2 No visible freshness model

Users need to know:

- last synchronized;
- last verified;
- data source;
- pending updates;
- whether the report is live or a snapshot.

Without this, users cannot distinguish a real zero from a stale page.

## 9.3 Date and timezone risk

CPD and report windows use date strings, timestamps, and server comparisons. Kenya-facing users need explicit EAT period boundaries. A session near midnight can fall into the wrong reporting period if the backend and UI interpret dates differently.

Define and test:

- inclusive start;
- exclusive end;
- timezone;
- event date versus submitted date;
- certificate issue date versus completion date;
- period-to-date behavior.

## 9.4 Test coverage is not aligned with the highest-risk claims

The current tests cover route helpers, programme state, AHA access, and performance dashboard behavior. They do not yet establish the most important invariants:

- monthly report excludes out-of-period learning records;
- duplicate enrollment resolution is correct across pathway sources;
- fallback records are labelled as fallback evidence;
- public verification redacts sensitive fields;
- report revocation and supersession work;
- every completed course produces a downloadable certificate;
- institution and learner views reconcile;
- user correction changes the right records and audit trail.

## 9.5 Snapshot storage is not relationally queryable

`professionalProgressReports.snapshotJson` is useful for immutable output, but difficult for:

- institutional aggregation;
- correction queries;
- metric trend analysis;
- data-quality monitoring;
- field-level redaction;
- migration to future report versions.

Keep the snapshot for integrity, but also store a normalized report manifest and metric rows.

---

# 10. Premortem scenarios

| Failure scenario | Early warning signal | Root cause | Mitigation |
|---|---|---|---|
| Users stop opening My Progress | Low repeat visits; users ask “where are my certificates?” | Progress and records are separate mental models | Make Records the evidence hub and Progress the action hub |
| Users report contradictory percentages | Same user sees different values across pages | Multiple calculation paths and periods | Canonical evidence ledger and shared resolver |
| Appraisal report is challenged | Reviewer asks why “monthly” includes old certificates | Period semantics are mixed | Separate point-in-time and in-period metrics |
| Users think a 0% means failure | Support tickets about missing progress | Zero conflates no record, not started, and sync failure | Explicit state taxonomy and reason codes |
| Institutions return to spreadsheets | Admins cannot reconcile staff data | Personal and institutional models are separate | Institution-facing read model derived from canonical evidence ledger |
| Users hide safety reports | Care/Code Signal counts feel punitive | QI data is shown as performance quantity | Separate safety participation from performance assessment |
| Public report leaks personal data | Shared verification links expose email or details | Full snapshot returned publicly | Redacted public report, revocation, expiry, access log |
| Certificates are visible but not downloadable | “Certificate pending” complaints | Fallback rows lack certificate identity | Distinguish evidence from issued certificate and repair issuance invariant |
| Users set goals once and abandon them | Goals exist but have no updates | Goal creation without feedback loop | Baseline, actual/target, reminders, review, achievement state |
| Clinical confidence is overstated | Provider treats 100% as current competence | Learning progress shown as competence | Separate learning, certification, observed competence, and outcomes |
| A migration/query failure is hidden | Users see plausible but stale data | Silent fallback behavior | Visible freshness/data-quality banner and structured monitoring |
| Old records are lost in redesign | Users cannot find past CPD or micro-course evidence | New surfaces replaced rather than composed with old ones | Preserve legacy record routes and link into canonical hub |

---

# 11. Highest-priority remediation plan

## P0 — Do before promoting the system as appraisal-ready

### 1. Establish one source of truth

Create a canonical resolved evidence model for:

- Life Support courses;
- NERP;
- IERP;
- external completions;
- CPD;
- Fellowship/micro-courses;
- certificates;
- validity and revocation.

All four surfaces must consume it.

### 2. Correct period semantics

Either:

- apply period filters to every metric; or
- rename the report as “Current status as at [date]” and separate activity metrics.

Do not leave the current labels unchanged.

### 3. Remove ambiguous headline averages

Replace the single Life Support average with course/pathway state cards and explicit denominators.

### 4. Add data-quality and freshness states

Every card needs:

- source;
- last updated;
- verification status;
- reason for missing data;
- correction action.

### 5. Secure public verification

Redact email and sensitive details by default. Add report revocation, supersession, expiry, and access logs.

### 6. Build a real correction workflow

The user must be able to report:

- wrong identity match;
- missing CPD;
- wrong certificate;
- wrong programme;
- wrong expiry;
- duplicate record.

Each correction needs a case ID and status.

## P1 — Do before institutional rollout

### 7. Define the institutional read model

Institutional leaders need a staff-readiness view, not access to private learner dashboards.

Define field-level permissions for:

- licence status;
- life-support status;
- pathway phase;
- CPD target progress;
- support needs;
- certificate validity.

### 8. Reconcile learner and institution views

Create automated reconciliation checks:

- learner-visible course state;
- institution-visible state;
- certificate state;
- source evidence state.

Any mismatch should be visible to authorized support staff.

### 9. Make goals functional

Add:

- baseline;
- target;
- current value;
- percentage to target;
- due date;
- reminders;
- achievement status;
- edit/archive;
- review notes.

### 10. Deliver real professional PDF output

Generate a branded, controlled PDF containing:

- owner and cadre;
- report type;
- period/as-of date;
- data freshness;
- verified achievements;
- source and verification links;
- disclaimer that learning completion is not clinical competence;
- document version;
- supersession status.

## P2 — Do after trust and truth are stable

### 11. Add motivational intelligence

- next-best action;
- streaks only where clinically appropriate;
- milestone recognition;
- support recommendations;
- peer support opt-in;
- renewal reminders;
- appraisal preparation checklist.

### 12. Add institutional support analytics

- department readiness heatmap;
- staff needing support;
- staff able to support colleagues;
- overdue evidence;
- CPD target risk;
- training-to-outcome links.

Do not add rankings until governance, privacy, and denominator definitions are complete.

---

# 12. 30-day practical checklist

## Days 1–5: Truth audit

- [ ] Define the canonical learning/evidence state model.
- [ ] List every metric and its source table.
- [ ] Mark each metric as point-in-time or period activity.
- [ ] Identify every duplicated calculation.
- [ ] Create known test accounts: no record, BLS only, NERP in progress, IERP in progress, external completion, duplicate enrollment, expired certificate.

## Days 6–10: Correctness

- [ ] Fix report period semantics.
- [ ] Add explicit zero/missing/sync states.
- [ ] Add source and freshness metadata.
- [ ] Add tests for dates, duplicates, revocations, and external evidence.
- [ ] Confirm certificate issuance and download invariants for all course families.

## Days 11–15: Product simplification

- [ ] Rename or consolidate My Performance, My Progress, and My Records.
- [ ] Make one canonical entry point.
- [ ] Put next action first.
- [ ] Move historical evidence into Records.
- [ ] Add exact action links for every incomplete state.

## Days 16–20: Trust and privacy

- [ ] Redesign public verification with minimum disclosure.
- [ ] Add revocation and supersession.
- [ ] Add correction cases.
- [ ] Publish visibility rules for learner, institution, and public views.
- [ ] Review Care Signal and Code Signal presentation with a safety-not-surveillance lens.

## Days 21–25: Institutional readiness

- [ ] Define institution read model and permissions.
- [ ] Add department and cadre dimensions.
- [ ] Reconcile institution and learner views.
- [ ] Add support-needed and support-capable states.
- [ ] Pilot with one department rather than the whole institution.

## Days 26–30: User validation

Run task-based testing with at least:

- one intern;
- one permanent nurse;
- one provider with external certification;
- one provider with duplicate records;
- one department head;
- one institutional administrator;
- one user on mobile and poor network.

Ask each person to complete these tasks without coaching:

1. Find their next unfinished Life Support phase.
2. Explain why their percentage has its current value.
3. Find and download a certificate.
4. Report a missing CPD record.
5. Set a goal and understand progress toward it.
6. Generate a report suitable for an appraisal.
7. Explain who can see each item.

Success requires both correct completion and correct explanation.

---

# 13. Definition of Done for the professional-record system

The system is not done when the cards render. It is done when:

- the same user receives the same authoritative state everywhere;
- period labels mean what they say;
- every number has a source, timestamp, and explanation;
- a user can move from any incomplete state to the exact next action;
- every completed course has a retrievable certificate or a visible issuance problem;
- external evidence is visible without being double-counted;
- corrections are possible and auditable;
- public verification discloses only what the owner intended;
- institutional views are permissioned and reconciled;
- QI reporting is not turned into a punitive score;
- the report clearly separates learning, certification, competence, and patient outcomes;
- mobile users can complete the main tasks under poor network conditions;
- the system has tests for missing, duplicate, stale, revoked, and corrected records.

---

# Final recommendation

**Do not build another performance metric yet.**

The highest-impact next move is a **Truth and Trust Sprint**:

1. canonicalize the evidence model;
2. correct period semantics;
3. consolidate the user-facing surfaces;
4. secure verification and privacy;
5. build correction and freshness states;
6. then validate with real users.

The platform already has strong ingredients—phase-aware continuation, certificate verification, CPD verification, Fellowship progress, ResusGPS save behavior, and safety-oriented reporting. The blind spot is that these ingredients are being assembled as dashboards before they have been made into one coherent, governed professional record.

The product should earn the user’s trust before asking the institution to rely on it.
