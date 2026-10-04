# Paeds Resus Professional Portfolio: Second-Order Audit

**Date:** 4 October 2026  
**Scope:** My Professional Portfolio, My Progress, My Records, CPD, Fellowship, AHA courses, NERP/IERP, Care Signal, Code Signal, certificates, reports, professional profile, and institutional transfer.

## Executive verdict

The platform has crossed the threshold from “missing features” to a more dangerous phase: it has enough features to create **false confidence**.

The current portfolio is visually coherent and increasingly functional, but it still risks answering the wrong question. A provider, interviewer, appraiser, or institutional leader may see a percentage and assume competence, readiness, or verified completion when the system may only know that a row exists, a module was opened, an attendance record was matched, or a pathway phase was submitted.

The central redesign principle must be:

> **Never allow activity, progress, competence, credential, and readiness to collapse into one number.**

Every record should answer four separate questions:

1. **What have I started?** — activity and enrolment.
2. **How far have I progressed?** — pathway progress.
3. **What can I prove?** — issued, verified, current credentials and evidence.
4. **What should I do next?** — one actionable next step, with the reason and expected outcome.

## 1. Psychological audit

### 1.1 The portfolio can become a vanity dashboard

Percentages feel objective, but users rarely inspect the denominator. A 75% average across three records does not mean the provider is 75% clinically ready. It may hide one untouched critical course, an unverified practical phase, an expired certificate, or a record with weak data quality.

**Risk:** users optimise the visible score rather than the clinically important gap.

**Correction:** make the primary motivational object the **next meaningful milestone**, not the average. Examples:

- “Complete BLS cognitive assessment — 1 action remains.”
- “Your ACLS practical phase is not yet verified.”
- “You have 14 verified CPD sessions, but no active annual target.”

### 1.2 Shame and comparison are hidden abandonment drivers

A provider who sees multiple zeros may interpret the platform as judging them, especially when the zeros represent “not linked,” “not yet started,” or “not applicable.” This is particularly risky for interns, newly registered nurses, and people whose external training has not yet been verified.

**Correction:** distinguish:

- Not started
- In progress
- Submitted for verification
- Verified
- Expired
- Not applicable
- Not yet linked
- Data unavailable

“0%” should be reserved for a known, applicable course that has genuinely not started.

### 1.3 The system currently rewards accumulation more than reflection

CPD points, certificates, course counts, and progress bars are easy to count. Clinical growth, reflection, transfer to practice, peer support, and improved response quality are harder.

**Risk:** users attend the easiest sessions and collect points without setting goals or translating learning into practice.

**Correction:** add a lightweight learning loop:

> Goal → Activity → Evidence → Reflection → Application → Reassessment

This must remain optional and low-friction, but the platform should make the loop visible.

### 1.4 The next action must be psychologically small

“Continue Fellowship” or “Open Life Support” is too broad. Under pressure, users need a single action with a clear stopping point.

**Design rule:** one primary action per card; secondary actions belong under “More options.”

## 2. Clinical and credentialing audit

### 2.1 Progress is not competence

A completed cognitive module is not a provider certificate. A simulation record is not a practical sign-off. An uploaded external certificate is evidence, not automatically an internally verified competency.

The platform already contains many of the right distinctions, but the portfolio must make them impossible to miss. Every course should show:

- Learning progress
- Phase completion
- Verification state
- Certificate state
- Expiry or renewal state
- Who/what verified the record

### 2.2 Averages are unsafe as the headline readiness signal

The lowest unfinished required phase is more clinically meaningful than the mean across BLS, ACLS, PALS, and NRP.

**Recommended model:**

- **Course progress:** percentage for each standalone course.
- **Pathway progress:** percentage for NERP or IERP.
- **Readiness bottleneck:** the lowest unresolved required phase.
- **Credential status:** current / expired / absent / pending verification.

Do not call any of these “competence” unless the clinical source of truth supports that claim.

### 2.3 Fellowship and AHA must remain separate tracks

The Fellowship is a longitudinal professional learning journey. BLS, ACLS, PALS, and NRP are standalone AHA offerings. A micro-course can start Fellowship progress, but an AHA certificate must not silently become Fellowship completion, and Fellowship progress must not imply AHA certification.

This separation should be repeated in the portfolio, certificates, reports, and institutional views—not only implemented in the backend.

## 3. Engineering and data-model audit

### 3.1 The source attribution model is incomplete

The current AHA enrollment row does not always carry an explicit pathway attribution. NERP has a course-link table; IERP currently has pathway phase state but no equivalent enrollment-to-course link.

**Consequence:** the system may know that a provider has BLS progress and an IERP enrolment, but not prove that the BLS row belongs to IERP. A global label such as “NERP + IERP” is therefore too strong.

**Required change:** introduce an explicit immutable learning-attribution record or pathway-course link:

- user ID
- enrollment ID
- pathway/program ID
- source type
- attribution reason
- created by/system event
- created at

Until then, display “Individual / unlinked” rather than claiming a pathway source.

### 3.2 Activity and current-status scopes must be mechanically separate

An activity report should filter activity, attendance, certificates, and coursework to the selected period. A current-status report should show the current state of credentials, courses, and verified records regardless of when they were issued.

A mixed report is acceptable only when each section is labelled with its own time semantics.

### 3.3 Certificate issuance must be event-safe and repairable

Micro-course completion currently has an idempotent certificate-issuance path, which is good. However, the platform still needs a repair job or admin diagnostic for completed rows with missing certificates.

Definition of complete certificate reliability:

- Every eligible completion creates a certificate.
- Repeating the operation is safe.
- A missing certificate is detectable.
- A failed issuance is visible to the learner and administrators.
- Certificate number, verification code, PDF, and source enrollment remain linked.

### 3.4 Report snapshots need a visible “as-of” boundary

A report can be verified cryptographically while still being misunderstood. The PDF and public verification page should prominently show:

- Generated at
- Data current as of
- Activity period
- Current-status or activity scope
- Data-quality limitations
- Revocation/supersession state

### 3.5 Do not use silent fallbacks for clinical truth

Fallbacks are valuable for rendering continuity, but a fallback record must never appear equivalent to a directly verified record. The UI should show “platform fallback,” “email-matched,” “external evidence,” or “direct platform record” where relevant.

## 4. Product and information architecture audit

### 4.1 The portfolio should be a control centre, not a warehouse

The canonical portfolio should have four top-level modes:

1. **Today** — what deserves attention now.
2. **Progress** — how the learner is advancing.
3. **Evidence** — certificates, CPD, Fellowship records, external evidence.
4. **Share** — create and verify an immutable professional snapshot.

The current overview/progress/records structure is a good transitional shell, but “reports” is overloaded and “records” still mixes proof with navigation to other systems.

### 4.2 Every card needs a purpose, status, and action

A card that only displays a number creates passive consumption. A useful card answers:

- Why does this matter?
- Is the state trustworthy?
- What is the next action?
- What will change if I do it?

### 4.3 Empty states are strategic moments

“No records” should never be a dead end. It should offer:

- Start the relevant track
- Link an external record
- Request correction
- Learn how records are verified

### 4.4 Reports and records are different jobs

- **Progress:** dynamic, actionable, personal.
- **Records:** durable evidence and downloads.
- **Report:** a selected-period or current-status snapshot.
- **Certificate:** proof of a defined completion or credential.

A user should not need to understand the database to find the right one.

## 5. CPD audit

The current CPD surface is useful but overweights attendance and points. The next version should add:

- annual target and progress to target;
- topic distribution and neglected domains;
- reflection/application prompt;
- evidence of peer contribution or presentation;
- verified versus pending attendance;
- facility/department context;
- exportable CPD transcript;
- correction path for missing or duplicated attendance.

Do not create a “CPD score” unless the weighting is transparent and clinically defensible.

## 6. Institutional audit

Institutional leaders need a support system, not a leaderboard.

The institution view should prioritise:

- licenses and expiry risk;
- life-support credential status;
- pathway bottlenecks;
- CPD target risk;
- data-quality and missing-record queue;
- staff who can support peers;
- department-level trends;
- privacy-preserving aggregates.

It should not expose unnecessary personal narratives, contact data, or clinical reporting content to ordinary staff.

The strongest institutional signal is not “who has the highest score.” It is:

> **Which unit has an avoidable readiness gap, and what support action should happen next?**

## 7. Care Signal and Code Signal

These should not be presented as generic “reports” beside professional learning. They are quality-improvement and safety-reporting pathways. The portfolio may show a private activity summary, but it must not imply that submitting reports is equivalent to completing training.

Recommended separation:

- Professional development
- Clinical learning evidence
- Safety and quality contribution

A provider may contribute to Care Signal without being more certified; that contribution is valuable but different.

## 8. Privacy and trust

Professional records are sensitive employment data. Sharing must be deliberate and scoped.

A shareable snapshot should allow the provider to choose:

- selected period;
- selected evidence categories;
- whether to show employer/facility;
- whether to show percentages or only statuses;
- expiry duration;
- revocation.

Institutional dashboards should use role-based minimum necessary access and avoid turning the provider’s personal growth record into a surveillance instrument.

## 9. Priority roadmap

### P0 — Trust and safety

1. Replace misleading CPD percentage language with points, sessions, and target progress.
2. Replace course-average-only messaging with explicit readiness bottleneck messaging.
3. Show record status and data-quality state everywhere a percentage appears.
4. Correct activity versus current-status filtering across CPD, certificates, and coursework.
5. Add a missing-certificate diagnostic and repair path.
6. Add explicit AHA enrollment-to-pathway attribution.

### P1 — Motivation and usefulness

1. Add one “Next best action” card with a specific phase and expected outcome.
2. Add annual CPD goals and progress to target.
3. Add lightweight reflection/application after CPD sessions.
4. Add a personal “support others” signal based on verified strengths, not raw scores.
5. Add a share builder for interviews, appraisals, and recommendations.

### P2 — Institutional leverage

1. Department-level readiness bottleneck dashboard.
2. License and certificate expiry workflow.
3. Staff support recommendations.
4. Privacy-preserving cohort trends.
5. Admin correction queue with source-level evidence.

## 10. What to stop doing

- Stop presenting a single overall percentage as if it were professional readiness.
- Stop using attendance as a proxy for learning impact.
- Stop grouping Fellowship and AHA under a common completion narrative.
- Stop showing pathway attribution when the database cannot prove it.
- Stop adding new portfolio pages before consolidating the user’s mental model.
- Stop treating a generated PDF as the product; the trusted record and its meaning are the product.

## Final design test

Before shipping any portfolio feature, ask:

> If a tired nurse, an interviewer, an institutional administrator, and a clinical educator each saw this screen for 20 seconds, would all four make the correct inference?

If not, the feature is not ready—even if the code is correct.
