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
- evidence type and strength;
- verification method and actor where applicable;
- completion, issue, and expiry dates;
- visibility and correction/supersession links.

## Privacy defaults

Evidence is private by default. Shareable evidence is limited to the minimum required record. Public verification must not expose email, payment, private reflections, or unrelated learning history.

The public verifier uses an explicit allowlist projection. It never returns the signed internal snapshot.

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
```

Run them in that order on production after the code merge. The verifiers are read-only; the sync only writes the ledger projection.

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
- CPD attendees without a stable account link remain explicitly unresolved and are not counted as canonical professional evidence.
- `getProfessionalTruthAudit` is read-only. An administrator must explicitly invoke `persistProfessionalTruthAudit` to write conflicts and a reconciliation-run snapshot.
- `db:verify-0173` checks required columns, indexes, provenance completeness, canonical-key uniqueness, adapter source-versus-ledger coverage, and read-only operation.

All interpretation metadata uses the authoritative ontology version `0173-v1`. Migration numbers identify schema rollout; they are not independently valid ontology versions.

Migration: `pnpm run db:apply-0173` then `pnpm run db:verify-0173`.

The 0169 sync now also backfills source facts and interpretation metadata. Re-run `pnpm run db:sync-0169` after 0173 so existing ledger rows can be audited for provenance completeness.
