# Professional Evidence Ledger

## Purpose

The Professional Portfolio is one product with three modes:

1. **Development** — goals, gaps, trajectory, and the next best action.
2. **Evidence** — learning, assessment, credentials, CPD, and verified external records.
3. **Sharing** — a minimum-necessary, time-bounded, verifiable snapshot.

The ledger is the canonical cross-programme identity layer. Existing AHA, NERP, IERP, Fellowship, CPD, certificate, and external-verification tables remain source systems and are not silently rewritten.

## Evidence ladder

The platform must distinguish:

1. Enrolled / started
2. Learning in progress
3. Learning complete
4. Assessment completed
5. Practical or simulation verified
6. Credential issued
7. Observed competence verified
8. Current and valid

A learning percentage must never be presented as clinical competence or current credential validity.

## Provenance requirements

Every ledger row identifies:

- the owner;
- the source system and source table;
- the source record ID and user-scoped idempotency key;
- a persisted evidence-instance key that distinguishes two enrolments, renewals, attendances, or assessments;
- evidence type and strength;
- verification method and actor where applicable;
- completion, issue, and expiry dates;
- visibility and correction/supersession links.

## Privacy defaults

Evidence is private by default. Shareable evidence is limited to the minimum required record. Public verification must not expose email, payment, private reflections, or unrelated learning history.

The public verifier uses an explicit allowlist projection. It never returns the signed internal snapshot.

The **professional report** is a user-approved, potentially comprehensive evidence record. The **public verifier** is a minimum-necessary proof surface and must not become a disguised portfolio endpoint.

## Reports and corrections

Reports are immutable snapshots, not permanent declarations. A material correction involving identity, certificate, status, date, or duplication automatically supersedes active reports for the affected owner. The correction response tells the user to generate a replacement report after the source evidence is corrected.

The PDF states its status (`ACTIVE`, `REVOKED`, or `SUPERSEDED`), public validity, verification URL, verification code, and snapshot hash. It does not present an aggregate life-support percentage.

## Observed competence

Observed competence is a separate evidence object requiring an authorised assessor, competency domain, assessment type, date, method, result, validity, and evidence reference. Course completion and learning percentages cannot create an observed-competence record.

## Reconciliation

`pnpm run db:sync-0169` is idempotent and append-safe. It projects existing source rows into the ledger and does not modify source records. Future adapters must preserve source identity, update status on repeat runs, and never merge records solely because names match.

## Operational commands

```bash
pnpm run db:apply-0169
pnpm run db:verify-0169
pnpm run db:sync-0169
pnpm run db:apply-0170
pnpm run db:verify-0170
pnpm run db:apply-0171
pnpm run db:verify-0171
pnpm run db:apply-0172
pnpm run db:verify-0172
pnpm run db:apply-0173
pnpm run db:verify-0173
pnpm run db:apply-0175
pnpm run db:verify-0175
pnpm run db:apply-0177
pnpm run db:verify-0177
```

Run them in that order on production after the code merge. Migration 0172 is the institutional trust-closure migration; migration 0173 is the professional evidence-integrity migration. The verifiers are read-only; the sync only writes the ledger projection.

## Governance closure (0171)

- A signed report selects ledger evidence by scope: activity reports include evidence dated within the requested period; current-status reports include current evidence regardless of original date.
- Competence validity is calculated from immutable `result` and `validUntil` values at read time. An expired date is displayed as `expired` even if an older administrative status says `current`.
- Observed competence requires an active assessor authority for both the competency domain and assessment method. Platform administrator status alone is not clinical assessor authority.
- Readiness is expressed as one unresolved bottleneck, never as a composite readiness score.
- Goals use a controlled metric registry and persist actual value, progress value, and computed status (`active`, `at_risk`, `achieved`, or `expired`).
- Source facts and platform interpretations are stored separately with an interpretation version.
- IERP-to-AHA relationships are only claimed after an explicit pathway-course attribution exists; otherwise the course remains `Individual / unlinked`.

## Professional Evidence Integrity Layer (0173)

The admin **Professional Truth Audit** is the control room for whether the portfolio can honestly be described as complete. It reports:

- source records, projected ledger records, missing records, and duplicates;
- source adapters that are covered versus explicitly **not projected**;
- conflicting statuses or validity dates that require review rather than silent precedence;
- expired evidence, missing provenance, unverified competence, superseded reports, and active public reports.

Evidence strength is controlled by ontology version `0173-v1`. It is not a free-text synonym for “good”: each strength maps to an authority level and an objective validity rule. When two sources disagree, the system creates a conflict record with `CONFLICT` semantics; it does not silently choose the highest-looking row.

### Phase 2 integrity contract

- Covered adapters project AHA enrollments, certificates, Fellowship micro-courses, external completions, IERP enrollments, NERP enrollments, and linked CPD attendance.
- Each covered source identity is checked in both directions: missing ledger rows, duplicate source rows, duplicate canonical rows, wrong source system/type, and wrong user ownership are review failures.
- Cross-source rows are compared by owner, evidence type, programme/domain, status, and validity date. Material disagreement creates an explicit conflict; authority ranking never silently resolves it.
- Conflict comparison is scoped to the same evidence subject **and evidence instance**. Credential numbers, source record keys, issue dates, assessment dates, and CPD source identities separate legitimate renewals or repeated attendance from contradictory assertions.
- `evidenceInstanceKey` is persisted on every canonical ledger row. Source identity, evidence instance, and professional claim remain separate concepts: the source row is immutable provenance; the instance is what that row represents; the current claim is a read-time interpretation.
- CPD attendees without a stable account link remain explicitly unresolved and are not counted as canonical professional evidence.
- `getProfessionalTruthAudit` is read-only. An administrator must explicitly invoke `persistProfessionalTruthAudit` to write conflicts and a reconciliation-run snapshot.
- `db:verify-0173` checks required columns, index semantics, provenance completeness, canonical-key uniqueness, exact source-identity-to-ledger-identity reconciliation for every covered adapter, and read-only operation.
- `db:apply-0175` adds and backfills persisted evidence-instance identity and an indexed owner/type/instance lookup. `db:verify-0175` rejects incomplete provenance and unknown ontology values.

All interpretation metadata uses the authoritative ontology version `0173-v1`. Migration numbers identify schema rollout; they are not independently valid ontology versions.

Migration: `pnpm run db:apply-0173`, `pnpm run db:verify-0173`, `pnpm run db:apply-0175`, then `pnpm run db:verify-0175`.

The 0169 sync now also backfills source facts and interpretation metadata. Re-run `pnpm run db:sync-0169` after 0173 so existing ledger rows can be audited for provenance completeness.

### Report download and CPD identity boundary

- `getLatestVerifiedReport` is read-only and returns the latest active signed snapshot for the exact report type, scope, and period. Downloading a PDF never creates a new snapshot.
- Snapshot creation is an explicit provider action. After creation, the same signed snapshot can be downloaded repeatedly using its verification code and stable report ID.
- CPD contributes to Professional Progress only when `cpdAttendees.userId` is explicitly linked and attendance is `attendance_verified`.
- Historical CPD rows without stable linkage enter `professionalCpdIdentityResolutionCases`. An administrator must select and verify the owning account, record a review note, and approve the linkage. Name or email similarity never performs automatic linkage.
- Migration `0177` creates the one-case-per-attendee review queue; its verifier is read-only.

Production closure requires the idempotent 0169 sync, exact 0173 source reconciliation, 0175 instance/provenance verification, and an explicitly persisted Professional Truth Audit run. The read-only verifier does not create audit history; persistence is a deliberate administrator action.

### Verified production audit — 2026-10-05

The first production Truth Audit was explicitly persisted under run key `truth-audit:2026-10-05:68389`.

- AHA enrollments: 217/217 reconciled
- Certificates: 220/220 reconciled
- Fellowship micro-courses: 145/145 reconciled
- External completions: 17/17 reconciled
- IERP enrollments: 5/5 reconciled
- NERP enrollments: 5/5 reconciled
- Linked CPD attendees: 147/147 reconciled
- Evidence conflicts: 0
- Ownership failures: 0
- Missing provenance: 0
- Open conflicts: 0

The audit status is `review_required` because 369 historical CPD attendance rows have no stable account link. They remain explicitly **not projected** rather than being guessed into individual records. This is an explained identity-resolution queue, not a silent integrity failure.
