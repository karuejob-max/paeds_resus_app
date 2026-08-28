# Institutional Administration Dashboard — Deployment Observation

**Date:** 2026-08-28
**Release:** Institutional Administration control-plane reorganization
**Code PR:** [#688](https://github.com/karuejob-max/paeds_resus_app/pull/688)
**Merge commit:** `118c0533320ddcebd1507d8d7cdd9cab9562f73d`
**Migration:** None required
**Production data writes:** None performed

## Delivered

The institutional Administration surface was reorganized into five focused lanes: Overview; People & access; Products & billing; Programme operations; and Data & support. The overview now derives actionable attention signals from existing institution, roster, link-request, department, product, and ILS order data. The dashboard no longer presents the platform-global subscription override as an institution self-service action, and the unreachable legacy bulk-enrollment UI and visibility entry were removed. ILS remains a separate institution-paid cohort workflow.

Institution classification is now visible and maintainable from Administration using the existing country-neutral onboarding taxonomy. The server now requires account-administrator scope for profile/classification mutation, validates facility classification values, handles blank/zero updates deliberately, and preserves institution authorization boundaries. Billing and data/support sub-lanes are URL-addressable for precise handoff and review.

## Validation

- Focused regression suite passed: 4 files, 25 tests, including institution-router authorization, Administration attention ordering/grammar/destinations, ILS router contracts, and institutional Learning analytics.
- `pnpm run check` passed: TypeScript, PWA TypeScript, clinical lint, and strict audits.
- Production build passed. Vite compressed-size reporting was disabled only in the local validation configuration to avoid a sandbox gzip-report stall; that temporary setting was removed before commit. The actual Vite bundle and server esbuild completed successfully.
- Scoped Prettier check passed for all new source/tests/documentation files.
- `git diff --check` passed.
- Protected CI gate passed for PR #688 in run [33157158713](https://github.com/karuejob-max/paeds_resus_app/actions/runs/33157158713); repository E2E job was skipped by existing configuration.

## Safety and rollout boundary

This release is UI, workflow, and authorization code only. It adds no database schema and requires no migration or seed. No institution, administrator, staff member, product subscription, cohort, payment, certificate, assessment, support case, or clinical record was created or changed for validation. Existing historical records remain preserved.

## Post-merge verification

The merged markers were verified on `origin/main` at `118c0533`, including the five Administration lanes and the account-administrator authorization guard. A read-only authenticated live smoke check is recorded below after the deployment becomes available.

## Live smoke check

Pending at the time this observation was first written. The check must remain read-only: open the authenticated institution Administration route, confirm the overview and five lanes render, confirm the ILS handoff is separate from Learning/CPD and IERS, and confirm no form is submitted.

## Live smoke check — 2026-08-28

The authenticated institution workspace was opened at `/institution?section=administration` after deployment. The live page rendered the IERS, CPD Portal, and ILS Program peer offerings and the five Administration lanes: Overview, People & access, Products & billing, Programme operations, and Data & support.

The read-only overview rendered real data for institution ID 3, Consolata Hospital Mathari: 3 department reconciliation items, 102 active roster people, 0 product issues, 0 ILS cohort orders, and 10 CPD sessions with 4% roster completion. The ILS copy correctly states that it is an institution-paid provider cohort, not an individual self-pay course or subscription. No form was submitted and no record was created.

The shareable URL `/institution?section=administration&adminTab=billing&billingTab=renewal` was then opened. After loading, Products & billing rendered Access status, Renewal requests, and Contracts & history with Renewal requests selected. Existing renewal controls rendered, and ILS remained outside subscription billing. No payment prompt, reminder setting, or renewal form was submitted.

**Smoke result:** Pass for deployment reachability, product separation, overview data rendering, five-lane Administration IA, and billing deep-link restoration. This did not exercise a write, payment, support submission, roster/classification change, ILS cohort action, or an authorization-matrix scenario.
