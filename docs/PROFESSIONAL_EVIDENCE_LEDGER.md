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

## Reconciliation

`pnpm run db:sync-0169` is idempotent and append-safe. It projects existing source rows into the ledger and does not modify source records. Future adapters must preserve source identity, update status on repeat runs, and never merge records solely because names match.

## Operational commands

```bash
pnpm run db:apply-0169
pnpm run db:verify-0169
pnpm run db:sync-0169
```

Run them in that order on production after the code merge. The verifier is read-only; the sync only writes the ledger projection.
