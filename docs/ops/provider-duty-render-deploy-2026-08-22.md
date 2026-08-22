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

## Production UI smoke-test readiness

- The live app loaded at `https://www.paedsresus.com` in an authenticated institution session for Consolata Hospital Mathari.
- The institution workspace shows IERS and CPD Portal active, with separate IERS, CPD Portal, Administration, and Connected Services lanes.
- The IERS workforce panel renders the department ERCo governance notice and explicitly states that each department has exactly one standing ERCo with optional backup, dated assignment, and named-provider acceptance.
- The current production institution has no ERT roster departments in the selected North Pole, so there is no existing department row on which to verify ERCo replacement/history or named ERTL/UTL assignment acceptance. The equipment panel shows two existing ward alerts, but no patient data is involved.
- Adding test departments and assignments would create production records and requires explicit confirmation before proceeding. No production smoke-test write has been made.

## Smoke-test data creation

- User explicitly confirmed creation of clearly labelled, non-clinical smoke-test records in production.
- `SMOKE TEST - Department Alpha` was created successfully in the selected North Pole and appears in the department ERCo governance table and active ERT roster.
- `SMOKE TEST - Department Bravo` has been entered into the add-department form; after the save action, the page still shows the form while the request settles. No claim is made yet that Bravo was created.
- No provider duty, activation, drill, patient identifier, or real-emergency record has been created.

## Alpha ERCo configuration

- The live ERCo configuration panel explicitly states that saving replaces the current assignment for the department and does not create a second ERCo row.
- The provider selector exposes linked active providers with names and product-role labels. `Job Karue (nurse)` is selected for `SMOKE TEST - Department Alpha`; the effective-from date is today, with no end date and no backup selected.
- The assignment has not yet been saved, so Alpha still correctly displays `Not assigned` in the summary table. No provider acceptance event exists yet.

## Provider-owned Alpha acceptance

- The provider dashboard surfaced `SMOKE TEST - Department Alpha` in the individual Hospital ERS area, explicitly marked `Response required`, with `Accept ERCo duty` and `Decline` controls.
- The provider accepted the duty from the individual portal. After the request settled, the card changed to `ERCo active`, confirming that membership alone did not create operational coverage and that provider acceptance is recorded separately.
- No backup was recorded for Alpha. No activation, drill, patient identifier, or real-emergency event was created.

## Cross-portal verification checkpoint

- The provider-facing portal surfaced Alpha as a response-required ERCo duty and, after acceptance, displayed `ERCo active` for the named provider.
- The role switch back to Institution succeeded, but the IERS workspace is still reloading in the current browser session; no institution-side active-row or history claim is recorded from this latest reload yet.
- The smoke-test departments remain non-clinical and clearly labelled. No activation or drill has been started.

## Institution-side Alpha verification

- The institution workspace now shows `SMOKE TEST - Department Alpha` assigned to `Job Karue` with status `Accepted and active`.
- `SMOKE TEST - Department Bravo` remains `Not assigned`, providing an unconfigured comparison department for replacement/coverage checks.
- The live IERS workforce view continues to render the one-standing-ERCo-per-department rule and the ERT roster rows for both smoke-test departments.

## Alpha replacement prepared

- The Alpha ERCo configuration panel shows two history entries: `assigned · Job Karue` and `accepted · Job Karue`, with the summary status `Accepted and active`.
- `JOYCE GAKII NJUE (nurse)` is now selected in the replacement form. The current assignment has not changed yet because the replacement form has not been saved.
- The UI continues to state that saving replaces the current assignment for this department rather than creating a second ERCo row.

## ERCo history refresh deployment

- Protected PR #495 merged as commit `0277388` after the full CI gate passed.
- Render auto-deploy for `0277388` built successfully at 11:07:33 and began the production service at 11:07:59. The deploy detail still showed `in progress` at the last observation; no failure was visible.
- The fix invalidates the selected department’s ERCo event-history query after assignment or replacement, so the UI should display the server-persisted `reassigned` event immediately after save.

## ERCo history refresh live

- Render deploy for protected merge commit `0277388` transitioned to `live`.
- The production service started successfully, connected its database pool, initialized scheduled tasks, and reported `Your service is live` at `https://www.paedsresus.com`.
- No migration or database write was required for this UI-only fix.
- Next verification is a fresh production institution-page load followed by a replacement-history observation. The labelled smoke-test records remain non-clinical and do not represent a pilot drill.

## Fresh production load after the UI fix

A fresh authenticated load of `https://www.paedsresus.com/institution?section=iers` succeeded on the deployed bundle. The institutional workspace opened the IERS product and showed the activation command center with no active activation. No activation was triggered; the next read-only check is the ERT and equipment sub-tab where the labelled smoke-test departments and Alpha history can be verified.

## Post-fix smoke-test state

After the `0277388` deployment became live, a fresh authenticated institution load succeeded. The workforce panel lists exactly one current ERCo row for each labelled department: Alpha is assigned to JOYCE GAKII NJUE and is awaiting provider acceptance; Bravo remains unassigned. No activation was triggered. The Alpha configuration panel must be opened to inspect the refreshed append-only history.

## Reassignment-history smoke test passed

On the live `0277388` bundle, opening the Alpha configuration after the replacement now shows the append-only history immediately: `reassigned · Job Karue` at 10:59:56, followed by the earlier `accepted · Job Karue` and `assigned · Job Karue` events. The summary still contains exactly one current Alpha ERCo row, now assigned to JOYCE GAKII NJUE and awaiting her acceptance. This verifies both the server event and the UI refresh behavior.

## ERTL provider-acceptance smoke test

The labelled Alpha department was selected as the week 34 North Pole ERTL department. The institution roster assigned the named ERTL provider to Job Karue; the provider dashboard displayed `ERTL · SMOKE TEST - Department Alpha` as `Response required`, and after the provider action it displayed `active`. No activation was triggered. The institutional side is being reopened to confirm the same accepted state.

## ERTL acceptance verified institution-side

The institution workforce view now shows `SMOKE TEST - Department Alpha` with named provider `Job Karue (nurse)` and `ERTL accepted`. The provider dashboard simultaneously showed the same ERTL duty as `active`. This confirms provider-owned acceptance is visible in both portals and remains distinct from Alpha’s separate ERCo assignment to JOYCE GAKII NJUE, which is still awaiting Joyce’s response.

## UTL smoke-test setup

The supported deep link `?section=iers&iersTab=workforce` opens the workforce panel reliably. The panel confirms Alpha’s week 34 ERTL is assigned to Job Karue and accepted. The active shift is the 2026-08-22 morning shift in North Pole; the labelled Alpha and Bravo departments remain present, and both currently show no assigned shift UTL. No activation has been triggered.

## Alpha UTL assignment prepared

The labelled Alpha morning-shift UTL selector now shows `Job Karue (nurse)` as the assigned provider. The roster row remains in `Pending Check-in` with no readiness sign-off yet, which is the intended pre-acceptance state. Bravo remains unassigned. No activation was triggered and no patient identifiers were entered.

## Alpha UTL assignment visible institution-side

After assigning Job Karue to the labelled Alpha morning shift, the institution workforce view shows `0/1 Signed Off`, the Alpha ERT billboard names Job Karue with `Pending Check In`, and the shift table shows Job Karue as the assigned UTL. The provider-side acceptance/readiness sequence remains incomplete; no readiness sign-off or activation has occurred.

## P0 finding: readiness ownership and provider-card refresh

Source review found two institution-side `Check In` controls (`ErtRosterPanel` and `ErtBillboardWidget`) calling `institution.signOffShiftReadiness`. That server procedure currently checks only institution access and writes `readinessSignOffAt`; it does not require the assigned provider identity, IERS operation capability, active membership, accepted assignment, or provider evidence. This bypasses the provider-owned readiness contract and must be removed or fail closed before pilot.

The provider-owned `iers.signOffShiftReadiness` path already has the correct guards and writes workforce evidence. The live read-only endpoint returned one accepted active Alpha shift for Job Karue, but the provider readiness card was absent after in-session duty acceptance, indicating its query cache is not invalidated by the duty-response mutation. This will be fixed alongside the institution-side bypass.

## Provider-readiness safety fix rollout

Protected PR #496 passed the full CI gate and was squash-merged as `cce131c`. Render auto-deploy for `cce131c` is visible as started at 11:34 AM; the previous `0277388` deployment remains the last confirmed live version until Render reports the new service live. No additional database migration is required for this code-only fix.

Render verification: deployment `cce131c` is now marked **live** on August 22, 2026 at 11:34 AM. This code-only deployment contains the provider-owned readiness safety fix; no additional migration is required.

Post-deploy provider-page check: the first navigation to `/home` returned the authenticated provider shell, but the subsequent browser render transiently reset to `about:blank`. No application failure is being claimed from that browser rendering artifact; the live Render deployment remains confirmed separately.

Post-cce131c provider smoke test: `/home` loads as authenticated Job Karue and the dashboard shell renders. The first settled view shows the performance summary still loading and does not yet include the IERS duty/readiness cards in extracted content; no failure is claimed until the provider queries and lower dashboard sections are inspected. The existing labelled Alpha UTL assignment remains accepted from the earlier smoke test.

Post-cce131c provider smoke test succeeded after scrolling to the IERS section: the accepted Alpha dated shift duty is visible in **My Shift Readiness**, with the provider-owned `Confirm shift readiness` action. The duty card also shows the accepted ERTL and shift ERTL assignments. This confirms the cache-refresh fix and provider portal discoverability; no institution-side Check In was used.

Provider-owned readiness smoke test succeeded on live `cce131c`: Job Karue used the Individual portal’s `Confirm shift readiness` action; the UI reported `Shift readiness sign-off recorded` and the Alpha shift changed to `Signed off`. This verifies the accepted-duty gate, provider identity-bound sign-off, and readiness evidence path without triggering an activation.

Post-cce131c institution smoke test: role switching back to Institution succeeds, the workspace loads, and the IERS/CPD/Administration product split is visible. The IERS workforce detail remains the next read-only check; no new production data has been created during this step.

Post-cce131c institution workforce navigation: the supported `/institution?section=iers&iersTab=workforce` deep link opens the IERS lane and shows the ERT & equipment tab. The department ERCo, ERT roster, and equipment queries were still loading in the first settled render; no status is claimed until they finish.

Final institution-side smoke test on live `cce131c`: the ERT & equipment view shows exactly one current Alpha department row, Job Karue assigned, `Provider sign-off complete`, and the billboard reports `1/1 Signed Off` with `Ready`. The institution UI no longer exposes a direct `Check In`/`Sign` readiness action. Bravo remains unassigned, as expected for the labelled smoke-test control case. Alpha ERCo currently shows Joyce Gakii Njue with `Awaiting ERCo acceptance`, demonstrating that coordinator acceptance remains separate from shift readiness.

Render deployment checkpoint for PR #498: commit `e8121ca` is building from protected main. The deployment log shows frontend assets built successfully (`built in 9.95s`), server bundle completed, and the build is uploading; the service is not yet confirmed live at this checkpoint. No database migration is required for this code-only change.

Render deployment checkpoint: `e8121ca` completed build/upload and started the production server at 12:14:54 PM. The service reported `Server running on http://localhost:10000/`, scheduler initialization complete, and database connection initialization; the visible TLS message is the known warning, not a failure. Awaiting the final Render `live` state before production smoke verification.

Final Render rollout result: commit `e8121ca` is **live**. The service started successfully, initialized its scheduler and database pool, completed its normal startup migrations, and reported the primary URL available at 12:15:01 PM. This code-only release requires no database migration.

Post-e8121ca provider-page check: the first navigation returned the authenticated Institution shell, but the following browser render transiently reset to `about:blank`. This is treated as a browser rendering/session artifact rather than an application failure; production remains confirmed live independently in Render. No data operation occurred.

Post-e8121ca routing check: opening `/home` while the browser session remains in the Institution role routes back to `/institution` after the loading state. This is expected role-based routing, not a deployment failure. Provider smoke verification will use the visible role switcher; no data change occurred.

Post-e8121ca role-switch checkpoint: the authenticated session successfully changed from Institution to Individual provider mode and opened `/home`. The provider dashboard is still in its loading state; no production data was changed during this verification.

Post-e8121ca provider regression check: the Individual provider portal loads successfully after role switching. Job Karue’s accepted Alpha ERTL and shift ERTL duties remain visible as active, and My Shift Readiness remains `Signed off`; the provider-owned IERS lane is present without an institution-side sign-off control. The active-membership revalidation release therefore did not remove valid duty visibility.

Documentation rollout checkpoint: protected merge `7588915` is building on Render. The documentation-only bundle completed successfully and was uploading at 12:22:26 PM; no deployment failure is shown. The prior code deployment `e8121ca` remains live while this documentation deploy completes.

Documentation deployment checkpoint: commit `7588915` completed its build and upload successfully and entered Render service deployment at 12:22:37 PM. No failure is shown; the deployment remains pending final live confirmation.

Final documentation-deploy check: the first Render overview navigation returned a transient `about:blank` view on the following refresh. No deployment failure is inferred; the deployment will be re-opened read-only to verify the final `live` marker.

Final documentation deploy observation from Render service URL `https://dashboard.render.com/web/srv-d6lknpdm5p6s73evain0`: after a transient blank page, the overview briefly showed `Build not found` while loading. This is not treated as a deployment failure because the prior deployment detail had already reached `Your service is live` for `7588915`; the overview will be rechecked read-only before final status is reported.

Final documentation rollout result: Render now shows deployment `af95295` (`docs(ops): finalize provider duty rollout evidence`) as **live** at 12:28 PM. The complete protected-branch code, documentation, and non-secret rollout evidence are now on live production. No migration, activation, or pilot drill was performed in this documentation deploy.

Final protected documentation deployment checkpoint: Render started auto-deploy for merge commit `48ee62c` at 12:33 PM. At this observation it was still deploying; `af95295` remained the last confirmed live commit. No application or database operation was performed.

Render final-deploy checkpoint: the service overview still shows auto-deploy `48ee62c` as started at 12:33 PM and not yet marked live at the latest refresh. No error is shown; the previous `af95295` deployment remains live and healthy. No production data or deployment control was changed.

Final documentation deploy status: Render still displays `48ee62c` as deploying at the latest read-only refresh. There is no failure marker; the service continues to show the prior `af95295` deploy as live. The documentation-only deploy does not affect the already-live provider-duty code path.

Final final rollout result: Render deployment `48ee62c` is confirmed **live** at 12:33 PM. This completes the protected code, documentation, production migration, verification, smoke-test, and rollout-evidence sequence for the provider-integrated IERS duty slice. No additional production database write was required for PRs #498–#501.

Final documentation deployment observation: after opening the service overview for merge `8d32ba5`, the subsequent browser refresh returned a transient `about:blank`. The overview had already shown the auto-deploy starting; no deployment control or production data was changed. A read-only retry is required before final reporting.

Final deployment confirmation: Render shows `8d32ba5` (`docs(ops): confirm final provider rollout`, PR #502) **live** at 12:40 PM. The protected rollout chain is complete: implementation, guarded migrations, strict verification, labelled smoke-test evidence, membership revalidation, and documentation are all on protected main and deployed.


## Authorization fixture and mobile orientation deployment

Render deployment `dep-da4raf0jo6nc73ehgpmg` for merged commit `e3708f1` (`feat(iers): add authorization matrix and mobile orientation`, PR #503) is confirmed **live** at `https://www.paedsresus.com` on 2026-08-22 at approximately 14:43. The deployment added no production migration and no production data mutation.


## Final documentation deployment

Render deployment `dep-da4rd2favr4c73bd7lk0` for protected documentation merge `1d6d83e` (PR #504) is confirmed **live** at approximately 14:49 on 2026-08-22. This completes the protected delivery and documentation synchronization for the authorization fixture, mobile IERS header fix, and new-user orientation guide.


## Final protected documentation deployment checkpoint

After PR #505 merged as `7c24615`, Render started deployment `dep-da4rg8navr4c73bdaggg` at approximately 14:54 on 2026-08-22. The prior `1d6d83e` deployment remains live while the final documentation-only deployment is in progress; no failure is shown and no production data operation is involved.


## Final evidence deployment live

Render deployment `dep-da4rg8navr4c73bdaggg` for protected commit `7c24615` (PR #505) is confirmed **live** at approximately 14:56 on 2026-08-22. The production service is healthy; this documentation-only deployment required no migration and no production data write.
