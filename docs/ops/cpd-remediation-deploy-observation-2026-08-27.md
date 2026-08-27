# CPD remediation deployment observation

Release date: 2026-08-27  
Production closeout verification: 2026-08-28

## Current release

Protected PR #659 merged normally. Render deployed merge commit `b8610cd09749271a9caf53b76692d9c7448d1ea1` with message `feat: remediate CPD attendance and session operations (#659)`. The release was observed live in the Render production service.

Source: https://dashboard.render.com/web/srv-d6lknpdm5p6s73evain0/events

## Production connectivity

After explicit owner confirmation immediately before the production schema operation, the authenticated Render Web Shell on instance `k5g76` ran:

```text
pnpm run db:test-connection
```

Result:

```text
OK — database accepts this DATABASE_URL.
```

The Node `DEP0123` TLS ServerName deprecation warning appeared, but it was non-fatal and the connection succeeded.

## Production migration 0142

The authorized production command was run exactly once from the Render shell:

```text
pnpm run db:apply-0142
```

Result:

```text
[0142] Preparing CPD Portal remediation...
[0142] CPD Portal remediation is ready.
```

This is the additive CPD Portal remediation migration covering lifecycle, attendance, stable attendee identity, audit, export, and target-revision schema. No email delivery, learner creation, clinical record, IERS operational mutation, or campaign operation was performed.

## Read-only CPD verification

The post-migration verifier was run:

```text
pnpm run db:verify-0142
```

Both required read-only assertions passed:

```text
[0142-verify] PASS: CPD lifecycle, stable attendee identity, verified-attendance, audit, export, and target-revision schema is present.
[0142-verify] PASS: verifier performed read-only checks only; no email delivery or IERS mutation is implemented here.
```

## Read-only IERS verification

The existing IERS readiness verifier was run without any IERS mutation:

```text
pnpm run db:verify-iers
```

It reported all expected institutional, CPD, professional-credential, department, staffing, readiness, activation, notification, and product-entitlement objects as present, ending with:

```text
IERS verification PASSED — IERS operational objects and institutional product-entitlement objects are present.
```

The same non-fatal Node `DEP0123` TLS warning appeared during this read-only check.

## Safety confirmation

No promotional or campaign email was sent. No learner, attendance, certificate, payment, staff, membership, clinical, IERS activation, readiness, duty, or patient record was created for testing. The production commands were limited to the authorized additive migration and read-only verification scripts. IERS permissions and operational boundaries were not broadened.

## Closeout status

Production migration 0142 and both read-only verifiers succeeded. The CPD remediation release is eligible for documentation closeout, protected CI review, and normal squash merge of the docs-only closeout branch.
