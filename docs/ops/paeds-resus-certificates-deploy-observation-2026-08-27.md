## Post-merge deployment observation

Render Events showed the protected certificate PR #629 merged as commit `42e314c` and auto-deploy started at 11:25 on 2026-08-27. At the first two polls, the deployment remained active and was not marked failed or live. Production migration 0134 has not been run. No production learner, certificate, payment, or institutional record has been created by this deployment check.

The current branch cleanup remains separate from production migration: code is merged through protected review, and the migration still requires explicit owner confirmation immediately before execution in the Render Web Shell.
## Live deployment confirmed

Render marked commit `42e314c` live at 11:27 on 2026-08-27 for PR #629 (`feat: issue universal Paeds Resus completion certificates`). The application code is now live. Migration 0134 remains unapplied and must be executed separately only after explicit owner confirmation. No production certificate or learner record was created by the deployment check, and no email delivery was triggered.
## Production migration and certificate verification

After explicit owner confirmation, the Render Web Shell connectivity check passed. `pnpm run db:apply-0134` completed successfully and reported the additive certificate fields and unique source-key index ready. The read-only `pnpm run db:verify-0134` then passed all checks: `certificates.recipientName`, `certificates.readinessPathway`, `certificates.sourceKey`, source-key uniqueness, universal certificate program-type values, and professional-credential type values. The verifier explicitly reported that no write was performed. The only warning was the existing non-fatal Node TLS ServerName deprecation warning.

The required read-only IERS verification is the remaining production check. No promotional email, learner record, certificate issuance, payment record, or institutional/IERS operational mutation was triggered.
## IERS verification observation

The live `pnpm run db:verify-iers` read-only check executed after migration 0134. The visible transcript reported `[ok]` for the existing institutional membership, activation, evidence, drills, competency, training schedule, product/subscription, entitlement, account-scope, audit, and data-lifecycle tables. A direct keyword search for the exact historical final phrase `IERS verification PASSED` did not find that phrase in the currently rendered transcript, so the lower shell output is being inspected rather than assuming the phrase was present.
## IERS verification passed

The live read-only `pnpm run db:verify-iers` completed successfully. Its final transcript states: `IERS verification PASSED — IERS operational objects and institutional product-entitlement objects are present.` No additional write was performed by this verification.

Production status is therefore: certificate application commit `42e314c` live; migration 0134 applied successfully; certificate schema verifier passed; IERS operational verification passed; no promotional email sent and no learner/certificate/payment/institutional record created during rollout verification.
