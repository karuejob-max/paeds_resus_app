# Provider-duty Render deployment evidence — 2026-08-22

- Protected implementation PR #492 merged to `origin/main` as `69bb13f`.
- Documentation synchronization PR #493 merged to `origin/main` as `15b1eeb`.
- Render production service: `paeds_resus_app` (service ID is intentionally not repeated in this note).
- Render events show commit `69bb13f` deployed live at approximately 09:25 EAT.
- Render then auto-started deployment for `15b1eeb` at approximately 09:30 EAT.
- Build logs for `15b1eeb` show successful Vite/esbuild build and upload; service was still marked `in progress` at the last browser refresh, after the `Deploying...` line.
- No database migration has been run from this session. Migrations `0111` and `0112` remain pending production confirmation and execution.
- No pilot drill has been started.

This file contains no credentials, environment values, or database connection details.

Last updated: 2026-08-22 during provider-duty rollout.

## Shell observation

- The authenticated Render Web Shell opened on instance `9rd4v`.
- The confirmed command `pnpm run db:apply-iers` was submitted once through the terminal input.
- The terminal currently renders no prompt, command output, or xterm rows; the helper textarea is empty after Enter. This does not prove whether the command reached the service.
- No second migration submission has been made. The next action must establish execution state using a non-duplicating method or ask for the user to refresh/reconnect the shell if needed.

## Shell diagnostic update

- The same Render shell page remains open on instance `9rd4v`.
- The terminal element exists and is focused, but its rendered text contains only blank rows; no prompt, migration output, success marker, or failure marker is available.
- The migration command has not been submitted again. Execution state remains indeterminate from the shell UI and needs a safe recovery path.

## Confirmed-shell update

- After the user refreshed the browser, the Render shell showed a normal prompt on instance `9rd4v`.
- The confirmed migration command was submitted once from that visible prompt.
- The immediate shell refresh still shows only the prompt area and no migration output or completion marker. No second submission has been made.

## Post-submit wait

- After allowing additional time, the shell still showed only the prompt area and no migration output.
- DOM diagnostics reported zero non-empty xterm rows, an unfocused empty helper input, and no visible command result.
- The command was not submitted again. The shell session appears to have lost or failed to render its terminal connection, so production state must be checked through a safe read-only path before any further write.

## Reopened-shell observation

- The Render Web Shell was reopened again on instance `9rd4v` for a read-only recovery check.
- After waiting, the terminal remained blank with no visible prompt or output. No verifier or migration command was submitted in this reopened session.
- The previously confirmed migration submission remains the only production-write attempt recorded in this session.

## Retry result

- The user requested another attempt after refreshing the shell.
- A visible prompt was present, and the confirmed `pnpm run db:apply-iers` command was submitted once more through the terminal input.
- The shell immediately returned to a prompt-only rendering with no command output, success marker, or failure marker. This browser terminal cannot currently expose execution output; no additional migration submission will be made from this session.

## Migration progress

- The Render shell finally accepted the command when Enter was pressed on the visibly typed line.
- The guarded runner is actively executing, not duplicated. It has passed migrations `0094` through `0099` and is currently at `8/21`, applying `0100`.
- The visible output is non-secret schema status plus the known TLS deprecation warning. No failure has appeared.
- Continue monitoring the same shell; do not submit another command while this run is active.

## Continued migration progress

- The same guarded runner remains active in the Render shell.
- It has now visibly passed `0097`, `0098`, and `0099`, and is processing `0100` (institutional product architecture tables).
- There is still no failure marker and no prompt indicating completion. No further command has been entered.

## Migration 0100 checkpoint

- The guarded runner completed migration `0100` successfully.
- Render output reports legacy continuity seeded for 4 institutions, with 8 subscription rows and 80 entitlement insert attempts, followed by confirmation that the institutional product architecture is ready.
- The runner remains active and is expected to continue through the remaining steps, including `0111` and `0112`; no new command has been issued.

## Migrations 0101–0103 checkpoint

- The guarded runner passed `0101` (IERS competency record projection) and `0102` (canonical action provenance consolidation).
- Migration `0103` is active and has bootstrapped explicit product roles for active institution members; the visible output reports counts of 55 for product role 1 and 55 for product role 2.
- No failure marker or prompt is visible. The runner remains active and no additional command has been issued.

## Migrations 0104–0107 checkpoint

- The guarded runner passed migrations `0104` (institutional lifecycle controls), `0105` (renewal/payment linkage), and `0106` (Connected Services and Safe Truth governance).
- Visible non-secret counts include 8 lifecycle policies, 1 lifecycle request, 0 payment rows, 8 notification preferences, 4 enabled services, and 1 Safe Truth policy.
- The runner has started migration `0107` and remains active. No further command has been submitted.

## Migrations 0108–0110 checkpoint

- The guarded runner passed migration `0108` with 4 active account-administrator scopes, passed `0109` with the existing structured multi-day session count at 0, and is processing `0110`.
- The current visible output contains no failure marker. The migration runner remains active; no additional command has been submitted.

## Provider-duty schema checkpoint

- Migration `0111` passed and created the one-ERCo-per-department assignment and event tables.
- Migration `0112` passed and added explicit ERTL/UTL assignment identity, status, acceptance timestamps, decline timestamps, and decline reasons; legacy assigned rows remain subject to explicit provider acceptance.
- The guarded runner has reached step `21/21`, `db:verify-iers`, and is reporting required tables as present. Verification output is still streaming; no completion marker is visible yet.
- No further command has been issued.

## Final verifier checkpoint

- The strict production verifier is active after `db:apply-0112` and is reporting `[ok]` for the institutional product, lifecycle, payment, connected-service, Safe Truth, facility, weekly ERTL, shift UTL, and department ERCo schema requirements reached so far.
- The verifier has not yet rendered its final overall `PASSED` line in the current view. No additional command has been issued.

## Production rollout complete

- The guarded `db:apply-iers` runner completed all 21 steps in order.
- Migrations `0111` and `0112` passed in production. The strict `db:verify-iers` check passed all required IERS, institutional product-entitlement, account-scope, lifecycle, payment, connected-service, Safe Truth, facility, ERTL, UTL, and department ERCo checks.
- The shell returned to a normal prompt with the explicit lines `IERS verification PASSED — IERS operational objects and institutional product-entitlement objects are present`, `[IERS] PASSED: db:verify-iers`, and `[IERS] All migrations applied and the production schema verification passed.`
- The production database write is complete. No pilot drill has been started.
