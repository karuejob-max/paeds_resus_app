# Facility-linking production deployment — 2026-08-26

## Release

Protected PR [#593](https://github.com/karuejob-max/paeds_resus_app/pull/593) squash-merged into `main` as commit `96ffc01f`. The live Render service `srv-d6lknpdm5p6s73evain0` deployed the subsequent documentation closeout commit `ddbffae6`, which contains the same merged application code and records the completed handoff.

## Approved production migration

The account owner explicitly confirmed execution in the authenticated Render Web Shell for the live `paeds_resus_app` service.

The command submitted was:

```text
pnpm run db:apply-0124
```

The migration completed successfully:

```text
[0124] Preparing facility membership request schema...
[0124] Facility membership request schema is ready.
```

The command is idempotent. It was submitted again while stabilizing the terminal input; each visible execution completed successfully and did not create application records.

## Read-only verification

The read-only command:

```text
pnpm run db:verify-iers
```

completed with:

```text
IERS verification PASSED — IERS operational objects and institutional product-entitlement objects are present.
```

A direct read-only MySQL check also returned:

```text
facilityMembershipRequests: present
```

The verification emitted a pre-existing MySQL2 warning about the `ssl-mode` connection option. It did not affect the migration or verification result.

## Data-safety statement

No user account, facility membership, facility-link request, institutional role, dated duty, readiness record, activation, responder, report, drill, patient record, or other clinical/application data was created or changed by this deployment. The migration created only the durable request table and its supporting indexes.

## Post-deployment status

- Provider request → institution review → atomic general membership/staff-link workflow: live.
- Migration 0124 schema: applied and verified.
- Protected CI for the feature and closeout documentation: passed.
- Feature branch and migration-reservation branch: deleted after merge.
- Remaining operational work: perform the normal authenticated provider and institution walkthrough using real non-destructive records only; do not create a production test request or emergency record unless separately approved.
