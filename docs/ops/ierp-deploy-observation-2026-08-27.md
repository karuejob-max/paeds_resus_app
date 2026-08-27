# IERP deployment observation — 2026-08-27

After protected PR #616 merged to `origin/main` as `8bced474a7bad5fd378f807010ba07b0a257db2a`, the Render project `My project` / service `paeds_resus_app` was observed through the authenticated Render dashboard. At 09:32 EAT the Production service status displayed `Deploying`; no migration command was run and no production data was changed. The deployment must be observed until it reaches a stable successful state before requesting explicit confirmation to run `pnpm run db:apply-0131` in the Render Web Shell.

Promotional email sending remains disabled by application contract; no campaign was triggered during this observation.

At 09:33 EAT the service detail showed `paeds_resus_app` on the `main` branch with public URL `www.paedsresus.com`. The project-level service remained `Deploying`; the service overview displayed `Build not found` while the deployment event list was still loading. This is treated as an incomplete deployment observation, not a failure or success claim. No Render settings, deployment controls, shell, or database actions were used.

At 09:33 EAT the Render Events view showed `Deploy live` for commit `8bced474` (PR #616), with a preceding `Deploy started` event for the same commit. The production service is therefore deployed. The IERP schema migration is still a separate operation and has not been run.

After explicit owner confirmation, the authenticated Render Web Shell was opened at 09:37 EAT. The shell panel was still showing `Loading...` after the initial page load and no command had been entered. This is an interaction-readiness observation only; migration execution had not started.

After the shell initialized, `pnpm run db:test-connection` completed successfully against the configured production database and reported `OK — database accepts this DATABASE_URL.` The only output besides connection details was the existing Node TLS ServerName deprecation warning; it did not prevent connectivity. No schema change had yet been applied at this point.

The original shell instance `4k65d` became unavailable and Render automatically connected the session to instance `2dstk`. The first migration command-entry attempt was not accepted as a complete command: the visible prompt retained only a partial `pnpm run db:apply-01` and no migration output appeared. No evidence of migration execution exists; the command will be re-entered carefully in the new instance.

The confirmed command `pnpm run db:apply-0131` completed in Render instance `2dstk` with output `[0131] IERP programme schema is ready.` The shell transcript visually replayed the command/output once during the instance reconnect; the migration is explicitly idempotent, and no destructive statement is present. The same existing TLS ServerName deprecation warning appeared. No promotional email or learner/clinical/IERS operational data was created.

The Render shell transcript and active terminal inspection confirm that the read-only command `pnpm run db:verify-0131` completed successfully with `[0131] verified 8 idempotent IERP tables; no destructive or promotional-send operation found.` The shell UI briefly displayed partial input while repainting, but the command did execute and returned to a prompt. No further migration write is needed.

The Render shell transcript and console inspection confirm `pnpm run db:verify-iers` completed successfully. The verifier returned `[ok]` for the existing institutional scope, subscription, entitlement, lifecycle, connected-services, Safe Truth governance, facility poles/departments, institutional staff roster, CPD attendance, weekly ERTL rotations, and monthly UTL rotations tables. This confirms the IERP migration did not remove or replace existing IERS operational structures. No IERS operational records were created or modified.

A long direct `node -e` table query was entered while the IERS verifier output was repainting and was not executed; the transcript contains garbled partial input only. It caused no write. The prior `db:verify-iers` command remains the authoritative successful read-only verification. A shorter, read-only `SHOW TABLES LIKE 'ierp%'` check is attempted next to avoid terminal input loss.

Direct read-only production check completed successfully with `SHOW TABLES LIKE 'ierp%'`: `ierpProgramEnrollments`, `ierpPhase1Evidence`, `ierpPayments`, `ierpEmailCampaigns`, `ierpEmailPreferences`, `ierpEmailSuppressions`, `ierpEmailAttributions`, and `ierpEmailAuditLog` each returned `ok`. The command emitted only the existing MySQL2 warning about the invalid `ssl-mode` connection option. No write occurred.

The same Render shell transcript confirmed `IERS verification PASSED — IERS operational objects and institutional product-entitlement objects are present.` No campaign, learner, payment, clinical, or IERS operational data was created.

Live route smoke test: `https://www.paedsresus.com/programs/ierp` returned HTTP-rendered content with the Paeds Resus shell, visible `Start IERP` actions, and the public navigation/footer. The route title was `Paeds Resus — Paediatric emergency care platform`; the page loaded without sign-in and no learner or clinical data was created. The browser screenshot upload was unavailable, so validation relied on the extracted live page text and route controls.

Authenticated smoke test of `/home` redirected the signed-in session to `/institution` and loaded the IERS institutional workspace for Consolata Hospital Mathari. The page clearly labeled IERS as Institutional Emergency Readiness System and kept bedside response in the individual portal. No IERP enrolment or learner mutation was initiated; the current session is institution-scoped, so a full individual learner-dashboard smoke test requires a separate individual learner session. Existing IERS workspace data displayed normally.

The authenticated account successfully switched from the institutional workspace to the Individual workspace and loaded `/home`. The live page identifies the current workspace as Individual, welcomes Job, preserves the emergency-first ResusGPS/ERT entry, and presents Learn as a separate training workspace. No IERP enrolment, payment, facility membership, IERS activation, or clinical action was triggered.

The live Individual Learn menu and `/enroll` route loaded successfully. The account is an existing provider/nurse profile; `/enroll` still displays the established separate AHA certification and Fellowship paths and no IERP enrolment was submitted. This confirms the emergency-first Individual shell and legacy AHA route remain available. The dedicated IERP start flow is exposed from the public `/programs/ierp` route and the IERP learner card, while this existing generic enrolment page was not altered or used to create data.
