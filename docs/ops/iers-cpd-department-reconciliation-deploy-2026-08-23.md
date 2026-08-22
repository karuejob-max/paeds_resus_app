# IERS / CPD Department Reconciliation Production Verification — 2026-08-23

## Release

Protected PR #514, `feat: reconcile CPD departments and gate IERS poles`, was squash-merged to `main` as `c0234f4109f13f55aff736d28da734936f99deb6`. Render deployed the merged service and the public institution workspace was reachable at `https://www.paedsresus.com/institution`.

## Approved production migration

The account owner explicitly confirmed the guarded production migration. From the Render production Web Shell, `pnpm run db:apply-iers` completed the full 24-step sequence. Migration 0115 added `facility_departments.requires_pole`, its operational lookup index, `institution_department_reconciliations`, and `institution_department_audit_events`.

The same guarded run completed `pnpm run db:verify-iers`. The strict verifier passed all IERS, institutional product, account-scope, department, roster, reconciliation, and audit checks, ending with: `IERS verification PASSED` and `All migrations applied and the production schema verification passed.`

## Non-destructive verification observations

The live institution workspace loaded the Administration → People & profile surface. It displayed the shared People & roles area, the read-only IERS duty assignments section, and the deployed department reconciliation loader/card. The page remained reachable after migration. No production attendance row was changed, no smoke record was created, and no pilot drill was run.

## Remaining walkthrough boundary

A phone-only functional walkthrough still needs a real authorized user to exercise an actual mapping, optional canonical-identity-only backfill, explicit `requiresPole` decision, IERS Lead missing-pole alert, and pole allocation. This should use a clearly labelled non-clinical fixture or an existing safe department where the institution owner approves the test; it must not rewrite historical department text or create unapproved production records.
