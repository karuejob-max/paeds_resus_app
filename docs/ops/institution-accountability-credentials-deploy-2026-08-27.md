# Institution Accountability and Credential Lifecycle — Production Deployment Record

**Date:** 2026-08-27

**Service:** `paeds_resus_app` on Render production service `srv-d6lknpdm5p6s73evain0`

**Release:** Protected PR #609, merged to `main` as `3b551a25`; subsequent `main` activity was retained during the closeout branch creation.

## Scope

Migration `0127` adds the structured professional credential ledger, private evidence metadata, staged credential reminder events, and auditable Departmental Head appointments. The release also adds server-authorized institutional accountability projections, derived Paeds Resus Life Support credential synchronization, least-privilege learning analytics, and Departmental Head scope.

The migration is schema-only. It does not create provider accounts, institutional memberships, CPD attendance, performance records, duties, IERS roles, readiness records, patient records, or emergency activations.

## Approval and commands

The repository owner explicitly confirmed the production migration through the authenticated Render Web Shell.

```text
pnpm run db:apply-0127
pnpm run db:verify-iers
```

The commands were entered manually in the refreshed Render Web Shell on replacement instance `4sqsq` after the earlier shell instance became unavailable.

## Verification result

The read-only verifier completed and returned:

```text
IERS verification PASSED — IERS operational objects and institutional product-entitlement objects are present.
```

The user confirmed that both the migration and verifier commands ran. The verifier includes the migration-0127 credential, reminder, and Departmental Head table checks in the deployed code path.

## Safety notes

No production application or clinical records were intentionally created or modified during this deployment. Credential evidence remains private and is not returned as a public storage URL. Institutional accountability projections remain server-authorized and scope-limited; general members do not receive roster contacts, individual CPD history, individual performance data, or private credential evidence.

The Render Shell displayed the pre-existing MySQL2 TLS warning concerning an IP-address ServerName. It did not prevent the migration or verifier from completing and should be handled as a separate infrastructure maintenance item.

## Handoff

The implementation branch and migration reservation branch were deleted after protected merge. The shared `WORK_STATUS.md` entry is updated to Done with this deployment record. A controlled pilot using one registered facility, one institution administrator, one credential/compliance manager, and a small provider cohort remains the recommended operational follow-up; no test duties or patient data should be created for that walkthrough.
