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

## Post-migration UI walkthrough checkpoint

After migration and verification, the live Administration tab was opened as the institution account context for Consolata Hospital Mathari. The shared People & profile surface loaded with the institution ID, People & roles, read-only IERS duty assignments, product permissions, and shared institution scopes. At the first sampled render, the department reconciliation query was still loading; no mutation control was used.

The subsequent live render completed the Administration People & profile data load. At the sampled viewport, the institution details card, People & roles controls, product-role selectors, shared-scope controls, and mobile-wrapped controls were visible; the page reported 28,800 pixels below the viewport, confirming a long scroll surface rather than a blank/error state. No data-changing control was activated.

The live page was scrolled through the long provider roster. At the sampled viewport, the roster remained readable as stacked rows with department and IERS responsibility controls fitting within the viewport; no horizontal-overlap defect was observed at this browser width. The reconciliation card was not yet visible, so further targeted navigation is needed rather than repeated broad scrolling.

## Reconciliation panel walkthrough

A read-only DOM jump positioned the live Administration page on the Department reconciliation card. The card rendered with the explicit distinction that a department may be valid for CPD reporting without needing an IERS pole, and that Pharmacy-style CPD-only departments should stay unassigned unless an account administrator explicitly marks them operational for IERS. The live summary showed 35 labels needing review, 294 currently unlinked attendance rows, and 0 eligible departments without a pole. The first visible label displayed an exact shared-catalog suggestion and stated that manual confirmation is still required. No mapping, backfill, defer, dismiss, reopen, eligibility toggle, or pole allocation was performed.

## IERS setup walkthrough

The live IERS → ERT & equipment surface loaded after deployment. It showed `0 department(s) need a pole`, explicitly separated CPD reporting from IERS pole decisions, instructed administrators to use the shared profile/CPD preset catalog, and stated that only confirmed departments marked IERS operational are available for pole assignment and ERTL/UTL rotation. The ERT roster showed no eligible departments assigned to the selected pole, without offering arbitrary department creation. No activation, pole allocation, eligibility toggle, rota generation, or equipment audit mutation was performed.

## Final operational status

Production code and migration are deployed and strictly verified. The non-destructive UI walkthrough passed for the Administration reconciliation card and IERS setup surface. A real mapping/backfill or eligibility-toggle test was intentionally not performed against production because it would mutate institutional records; the disposable MariaDB real-router matrix remains the evidence for those mutation paths.
