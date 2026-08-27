# NERP verification and Learning/CPD deployment observation

## 2026-08-27

Render Events shows the merged PR #637 deployment started for commit `3004293143cef0aea6685aa144cd83e07cce3dc0` (`3004293`), titled “Add external NERP verification and simplify Learning CPD portal.” The deployment is not yet confirmed live. The deployment description records that production migration 0136 remains a separate explicit-confirmation step and no campaign email is sent.

The previous live deployment remains commit `2511c038` (CPR reassessment countdown fix).
Render Events now marks commit `3004293143cef0aea6685aa144cd83e07cce3dc0` (`3004293`) live at 1:46 PM on 2026-08-27. The release is protected-CI approved and contains the external NERP verification, exact audited suppression controls, department-scoped CPD access, and consolidated Learning portal. Migration 0136 has not yet been applied.
## Production database execution

After explicit confirmation, the Render Web Shell on instance `kzbv4` completed:

- `pnpm run db:test-connection` — passed; the database accepted `DATABASE_URL`. The existing Node `DEP0123` TLS ServerName warning was non-fatal.
- `pnpm run db:apply-0136` — completed successfully: `[0136] NERP external verification and campaign controls are ready.`
- `pnpm run db:verify-0136` — passed all checks: five required tables, all four precise suppressions (`thrsmwaniki@yahoo.co.uk`, exact name `esther wairimu mwangi`, exact name `annet muthoni kingori`, exact name `emma githaka`), no email-send call, and idempotence. The verifier reported no write.
- `pnpm run db:verify-iers` — completed read-only checks for the existing IERS schema. The transcript showed the full expected `[ok]` table/column checks, including memberships, activation, evidence, actions, drills, competency, training schedules, institutional products/entitlements, renewal controls, connected services, and related IERS operational tables. No IERS write was performed.

No campaign email was sent.
