# Institutional member removal and scalable multi-pole ERT — implementation evidence

**Date:** 2026-08-23  
**Release:** Protected PR #525, merged to `origin/main` as `be9ba79`
**Status:** Production migration and strict schema verification passed.
**Migration:** 0117  
**Scope:** Institutional member removal and ordered multi-pole ERT setup.

## Implemented

- Account administrators can remove an institutional member through a reason-required, tenant-scoped mutation.
- Removal ends the institution membership, ends active product roles and account scopes for that institution, revokes future operational participation, and preserves historical attendance, accepted duties, readiness evidence, and audit records.
- Self-removal is blocked, and the minimum administrator coverage safeguard remains enforced.
- Removal writes an append-only membership event. Legacy memberships without `staffMemberId` resolve the matching institutional staff row by user identity or invited email before staff access is marked removed.
- ERT Step 2 supports any number of facility poles. Administrators can create, view, and reorder poles explicitly, allowing North/South, North/South/East/West, or another locally meaningful sequence.
- Pole ordering is for institution navigation and management; each pole retains independent department assignment and accepted historical duties are not rewritten.
- Existing department eligibility, IERS role, institution scope, and pole-assignment safeguards remain active.

## Validation evidence

- `pnpm exec tsc --noEmit --pretty false --incremental false` — passed.
- `pnpm run test:unit` — passed: 132 files, 730 tests.
- Clinical lint, production build, migration/verifier syntax, and `git diff --check` — passed before final fixture corrections.
- Disposable localhost MariaDB real-router matrix — passed: 1 test. It covered existing IERS authorization behavior plus ordered multi-pole reorder, legacy membership-to-staff resolution, reasoned member removal, membership ending, staff removal timestamp/reason, append-only removal event, and zero remaining provider duties.
- The disposable database, user, process, and temporary files were destroyed after the passing run.

## Production migration and verification

After fresh explicit administrator confirmation, the guarded Render Web Shell command `pnpm run db:apply-iers` was run once. The fail-fast sequence completed all 26 steps. Existing migrations were safely rechecked, migration `0117` applied successfully, and the same run completed `pnpm run db:verify-iers`.

Migration `0117` created or confirmed `facility_poles.pole_order`, `institutionalStaffMembers.removedAt`, `removedByUserId`, and `removalReason`, plus the append-only `institution_membership_events` table. Existing poles received stable display order where absent.

The strict verifier passed the membership audit table, staff-removal columns, facility-pole display order, facility-department pole/eligibility/sequence fields, pole rotation anchor, CPD canonical identity, department ERCo, weekly ERTL, monthly UTL, shift UTL, and all existing IERS/product/control-plane checks. The final output included:

> IERS verification PASSED — IERS operational objects and institutional product-entitlement objects are present.
>
> [IERS] PASSED: db:verify-iers
>
> [IERS] All migrations applied and the production schema verification passed.

No production member, pole, department, duty, attendance, patient, activation, or drill record was changed by the migration or verification.

## Operating interpretation

An account administrator removes a person through People & roles using a reason-required, confirmation-gated action. The action ends that person’s institution access and future operational participation without deleting historical CPD, accepted duty, readiness, or audit evidence. Self-removal and removal of the last institutional administrator are blocked.

Step 2 of ERT is no longer limited to North and South. Administrators can create and explicitly order North, South, East, West, or any locally named set of poles. The same order is used by the ERTL rotation logic and can support large facilities with more than two poles.

No pilot drill was run and no real emergency was used.

## Remaining walkthrough

A physical-phone visual walkthrough remains recommended after the code-only deployment. It should confirm People & profile compact navigation, the member-removal control, and Step 2 pole ordering using a non-destructive review; no real member or pole should be changed as part of that check.
