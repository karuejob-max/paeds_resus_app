# Institutional member removal and scalable multi-pole ERT — implementation evidence

**Date:** 2026-08-23  
**Status:** Code and schema prepared; production migration and deployment pending protected PR review.  
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

## Production handoff

The feature branch still requires the normal protected PR and Render deployment. Because migration 0117 changes production schema, production execution requires a fresh explicit confirmation immediately before running `pnpm run db:apply-iers` in Render Web Shell. Follow with `pnpm run db:verify-iers`. Do not remove a real member, reorder production poles, or run a pilot drill as a smoke test.
