# Global Admin Entitlements — Production Deployment Observation

**Date:** 2026-08-28
**Release:** Global Admin entitlement system
**Code merge:** PR #677, squash commit `9f2effd2` on `origin/main`
**Migration:** `0147`
**Production service:** Paeds Resus Render service `srv-d6lknpdm5p6s73evain0`

## Authorization and scope

The production database rollout was explicitly authorized. Only the connectivity check, additive/idempotent migration, and read-only verifier were run. No entitlement grant, institution, provider, learner, cohort, payment, certificate, assessment, or other operational test record was created.

## Commands and results

### Database connectivity

```text
pnpm run db:test-connection

> paeds_resus_app@1.0.0 db:test-connection /opt/render/project/src
> node scripts/test-db-connection.mjs

Connecting: user=avnadmin host=public-karuejob-dbmysql-karuejob-paeds-resus.a.aivencloud.com port=10359 db=defaultdb passwordLen=24
(node:221) [DEP0123] DeprecationWarning: Setting the TLS ServerName to an IP address is not permitted by RFC 6066. This will be ignored in a future version.
(Use `node --trace-deprecation ...` to show where the warning was created)
OK — database accepts this DATABASE_URL.
```

**Result:** PASS.

### Migration 0147

```text
pnpm run db:apply-0147

> paeds_resus_app@1.0.0 db:apply-0147 /opt/render/project/src
> node scripts/apply-0147-global-admin-entitlements.mjs

(node:260) [DEP0123] DeprecationWarning: Setting the TLS ServerName to an IP address is not permitted by RFC 6066. This will be ignored in a future version.
(Use `node --trace-deprecation ...` to show where the warning was created)
[0147] Applying Global Admin entitlement controls...
[0147] Added ierpProgramEnrollments.entitlementId
[0147] Added ierpProgramEnrollments.effectiveFeeKes
[0147] Added nerp_offer_enrollments.entitlement_id
[0147] Added nerp_offer_enrollments.original_total_amount_kes
[0147] Added microCourseEnrollments.entitlementId
[0147] Added institutionalTrainingOrders.entitlementId
[0147] Added institutionalTrainingOrders.originalTotalAmountKes
[0147] Added payments.paymentMethod entitlement value
[0147] Global Admin entitlement schema is ready.
```

**Result:** PASS. The migration performed schema changes only. The TLS deprecation warning is emitted by the database client and did not affect the result.

### Read-only verifier

```text
pnpm run db:verify-0147

> paeds_resus_app@1.0.0 db:verify-0147 /opt/render/project/src
> node scripts/verify-0147-global-admin-entitlements.mjs

(node:299) [DEP0123] DeprecationWarning: Setting the TLS ServerName to an IP address is not permitted by RFC 6066. This will be ignored in a future version.
(Use `node --trace-deprecation ...` to show where the warning was created)
[0147 verify] PASS — globalEntitlements table
[0147 verify] PASS — globalEntitlementRedemptions table
[0147 verify] PASS — globalEntitlements entitlement columns
[0147 verify] PASS — globalEntitlementRedemptions entitlement columns
[0147 verify] PASS — ierpProgramEnrollments linkage columns
[0147 verify] PASS — nerp_offer_enrollments linkage columns
[0147 verify] PASS — microCourseEnrollments linkage columns
[0147 verify] PASS — institutionalTrainingOrders linkage columns
[0147 verify] PASS — programme and benefit enums
[0147 verify] PASS — named account/institution scope, redemption limits, price linkage, and audit schema are present; no write was performed.
```

**Result:** PASS. All verifier assertions passed; no write was performed by the verifier.

## Production boundary

The release now provides the schema and deployed application paths for Global Admin named entitlements. The first operational use must still be governed: an administrator should issue only a named, reasoned, time-bounded entitlement, verify the target account or institution, confirm the programme-specific policy, and review the redemption and payment result. Entitlements do not bypass clinical eligibility, IERP/NERP evidence review, ILSP roster/readiness/practical controls, self-pay prerequisites, certificate gates, or AHA credentialing rules.

## Read-only live smoke check

After deployment and migration, the live Global Admin Reports route was opened under an authenticated browser session at [`/admin/reports`](https://www.paedsresus.com/admin/reports). The page rendered the existing AHA access-grants panel and the new **Global Admin entitlements** panel. The panel exposed IERP, NERP, ILSP, and self-pay programme choices; named-account targeting; self-pay course scope; full waiver or percentage discount; expiry; maximum redemptions; business reason; creation; and entitlement history.

No target was selected. No grant, entitlement, learner, institution, cohort, payment, certificate, assessment, or other operational record was created during the smoke check.
