# NERP external verification and CPD participant deployment observation

Date: 2026-08-27

## Initial post-merge observation

Protected PR #648 merged normally. Render service `srv-d6lknpdm5p6s73evain0` is tracking `main` and has started deployment commit `efc3745` (`feat: verify non-nurse external completions and drive CPD participants from members (#648)`). The deployment was still active at the first observation; no failure was shown.

Production migration `0138` has not yet been applied. It requires an explicit owner confirmation after the code deployment is live. No campaign email is authorized or triggered by this release.
## Polling update

Render still shows deployment `efc3745` as active/building at 15:25. The prior deployment `5b7c8e9` remains the last live entry in the event list; no failure message is shown. Migration `0138` remains unapplied pending live deployment confirmation and explicit owner authorization. No campaign email has been sent.
## Deployment live

Render marked commit `efc3745` live at 15:25 on the production service. This is the merged PR #648 code release. Migration `0138` has not been applied yet and requires explicit owner authorization. No campaign email has been sent or triggered.
## Migration shell attempt

After explicit confirmation to run migration 0138, the Render shell navigation returned `about:blank` on the first load/wait cycle. No command was entered or executed during that cycle. The migration remains pending.
## Shell command-entry update

Render shell instance `g6jb7` is interactive. The confirmed connectivity command `pnpm run db:test-connection` is visible in the terminal transcript, but no output or completed prompt has appeared yet after the first Enter attempt. No migration or write command has been entered or executed at this point.
## Connectivity check completed

The Render shell completed `pnpm run db:test-connection` successfully. It reported `OK — database accepts this DATABASE_URL`; the TLS ServerName deprecation warning was non-fatal.

An attempt to enter `pnpm run db:apply-0138` did not visibly change the terminal prompt and did not execute a migration. No schema write has occurred yet.
## Migration entry retry

The terminal still shows the completed connectivity checks and a blank prompt after the second migration-entry attempt. The visible page text was selected, but `pnpm run db:apply-0138` did not appear in the shell and was not executed. No production schema write has occurred.
## Migration execution state

The confirmed migration command was placed into the terminal textarea programmatically and Enter was issued. The visible transcript now shows a blank prompt after the connectivity checks, but no `db:apply-0138` output is visible yet. I will inspect the terminal transcript without issuing another write command before deciding whether the migration actually ran.
## Partial migration entry

The Render Web Shell accepted only a partial string (`pnpm run db:appl`) during the latest automated entry and did not execute it. The command is still at the prompt; no migration output is present. I will clear the partial input and enter the already-confirmed command using single-character interaction.
## Migration 0138 applied

The delayed Render terminal transcript confirmed that `pnpm run db:apply-0138` executed successfully. It reported:

- `[0138] Preparing non-nurse external verification support...`
- `[0138] Non-nurse external verification support is ready.`

The TLS ServerName warning remained non-fatal. The shell returned to a prompt. No campaign email was sent.
## Verifier command state

The Render shell transcript still confirms migration `0138` completed successfully and returned to a prompt. The read-only verifier command was entered through the terminal control, but its output is not yet visible in the current transcript. No additional write command will be issued; I will inspect the terminal state first.
## 0138 verifier entry

The Render terminal shows a partial `pnpm run db:verify-0138` input at the prompt; it has not executed yet. Migration 0138 remains successfully applied. No additional write operation is planned.
## 0138 verification passed

Production `pnpm run db:verify-0138` completed successfully. It confirmed:

- `candidate_type` and `candidate_cadre` are present with compatibility-safe definitions.
- Verification is read-only and the migration contains no email-delivery operation.
- Non-nurse external cases remain separate from the NERP nurse campaign audience and IERS permissions.

No campaign email was sent. The final read-only IERS verification remains to be run.
## IERS verification passed

The final read-only `pnpm run db:verify-iers` command completed successfully. Existing IERS schema and operational checks remain intact after migration 0138. The Render shell transcript also confirms the 0138 verifier passed and no email-delivery operation was present. No campaign email was sent.
