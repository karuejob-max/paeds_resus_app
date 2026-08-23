# Department governance and IERS rota semantics V2 — production evidence

**Date:** 2026-08-23

## Release

Protected PR #523 (`feat: align department governance and IERS rota semantics`) was squash-merged to `origin/main` as `181acfa`. Render deployed the merged application before the production schema step.

## Production schema

After explicit administrator confirmation, the guarded Render Web Shell command `pnpm run db:apply-iers` was run once. The sequence completed all 25 guarded steps. Migration 0116 completed successfully and reported:

- `facility_poles.rotation_anchor_date` added.
- `facility_departments.pole_sequence` added.
- `institution_cpd_department_resolutions` ready.
- Existing pole-department sequence values backfilled where absent.
- Existing pole rotation anchors backfilled where departments already existed.
- Department governance V2 schema ready.

The same guarded run executed `pnpm run db:verify-iers`. Strict verification passed and confirmed the CPD Other-resolution table and target/status columns, facility-department pole sequence, facility-pole rotation anchor, department ERCo governance fields, CPD/IERS identity links, UTL/ERTL assignment fields, and all existing IERS/product-control-plane objects.

Final non-secret verifier result:

> IERS verification PASSED — IERS operational objects and institutional product-entitlement objects are present.
>
> [IERS] All migrations applied and the production schema verification passed.

## Deployed behavior confirmed by HTTP asset inspection

The live institution workspace bundle contains the corrected governance copy and navigation strings, including `Assistant ERCo`, `People & profile`, and `Shift staffing`. The old `Autopopulate monthly UTL` wording is absent from the published institution workspace bundle.

The release is intended to provide:

1. Per-attendee Other resolution, allowing different users to resolve to different canonical departments without merging unrelated submissions and without overwriting the original CPD label.
2. A separate Administration → People & profile compact navigation strip.
3. ERCo wording that describes a standing governance champion appointment with optional Assistant ERCo support, separate from dated UTL/ERTL duty acceptance.
4. Explicit ERCo-owned UTL staffing from department nurse candidates, with no assumption that a monthly source provider works every shift.
5. Deterministic ERTL department selection from persisted department order within each pole, cycling from the pole’s rotation anchor. Named ERTL provider nomination and provider acceptance remain separate.
6. Refresh of future unaccepted ERTL rows and derived shift flags when pole membership/order changes, without overwriting accepted provider duty history.

## Safety boundaries

No production CPD attendance text, patient data, emergency activation, pole assignment, UTL assignment, ERTL provider nomination, or pilot drill was created or changed during this deployment. No autonomous scheduler was introduced. Operational staffing remains user-initiated and provider acceptance remains required for dated duties.

## Walkthrough status

The browser session became unavailable during the post-migration visual walkthrough, so the final UI check was completed by HTTP inspection of the published institution workspace asset. A physical-phone visual check remains advisable before operational use, especially for the new People & profile compact navigation and Step 3 staffing controls.

## Next operational check

On the phone, open Administration → People & profile and verify the compact tabs. Then open the IERS direct workforce link, review the pole-order ERTL explanation, confirm that the ERCo configuration reads as governance-only, and inspect one department’s Shift staffing card without saving a real duty. Use only labelled non-clinical test data if a write-path test is needed.

No pilot drill has been run.
