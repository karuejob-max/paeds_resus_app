# CPD Department Reconciliation and IERS Pole Assignment Investigation — 2026-08-23

## Initial diagnosis checkpoint

The current CPD attendance and certificate views render `cpdAttendees.department`, the preserved historical reporting label. Manual reconciliation/backfill only attaches `cpdAttendees.facilityDepartmentId`; it intentionally does not rewrite the raw department text. Therefore a successful reconciliation can appear not to update the CPD department display even though canonical identity is linked.

The current pole assignment contract requires all of the following: the local facility department must exist in the institution registry, be active, be confirmed, and have `requiresPole=true`; the selected pole must already exist in the same institution; and the actor must hold the IERS department-governance role (`iers_coordinator` or `iers_governance`). The batch action assigns only eligible rows with `poleId IS NULL`. Departments absent from the confirmed local registry, omitted during a later department-list confirmation, inactive/unconfirmed, CPD-only (`requiresPole=false`), or accessed by an account administrator without the IERS governance role will not be assignable.

## Live observation before detailed reproduction

The current production institution workspace loaded under the existing authenticated browser session. No data-changing action has been taken during this investigation.

## Live post-user observation

The live Administration → People & profile reconciliation card currently shows **28 labels needing review**, **294 unlinked CPD rows**, and **0 eligible departments without a pole**. The queue has decreased from the earlier 35-label baseline, which indicates that some review decisions were persisted. The unchanged unlinked-row count is consistent with mapping decisions made without selecting the optional **Backfill canonical identity** checkbox. The card continues to state that the original CPD reporting text is preserved.

The current view does not expose the underlying department rows in the sampled viewport, so the pole-assignment cause still requires checking the selected institution’s active confirmed departments, `requiresPole` flags, available pole records, and the signed-in user’s IERS governance role.

## Confirmed causes

1. Reconciliation reduces the review queue and can attach `facilityDepartmentId`, but the CPD Portal previously rendered only `cpdAttendees.department`. That raw field is intentionally preserved for historical reporting, so the canonical synchronization was not visible in the CPD attendance tables, certificates register, drilldowns, heatmap, or staff matrix.
2. The IERS setup panel previously exposed only the batch action `Assign all eligible unassigned`. It did not expose the existing safe per-department `assignDepartmentToPole` procedure, so an administrator could mark departments operational but could not assign or move a specific department from the setup card. Batch assignment also correctly does nothing when there are no eligible unassigned rows.
3. Pole assignment still correctly requires an active confirmed local department, `requiresPole=true`, an existing pole in the same institution, and IERS department-governance authority. Current production data shows five eligible departments already allocated and one CPD-only department intentionally excluded. Historic CPD labels that remain unresolved are not automatically added to the IERS registry; they must first be explicitly mapped or added as a genuine custom exception in Administration.

## Correction implemented on the feature branch

- CPD attendee reads now attach `canonicalDepartmentName` from the reviewed local department identity.
- CPD tables and drilldowns show the canonical department as the main value and the original recorded label as an audit note when they differ.
- CPD CSV exports retain the existing `Department` column and add a separate `Canonical Department` column.
- CPD heatmap and staff-matrix aggregation now group linked attendance by canonical department while retaining raw fallback for unresolved rows.
- IERS setup now exposes individual assign/move controls for every eligible department, keeps the batch action, and explains the no-pole and missing-registry states.
- No historical department text, attendance timestamp, certificate, or clinical record is overwritten.

## Post-deploy walkthrough checkpoint

PR #517 was merged as `1e58e0d`, and the live institution workspace refreshed successfully after deployment. The IERS workforce tab is available for a read-only check of the new individual assignment controls. No production mutation has been performed during this verification.

## Live verification after PR #517

The refreshed production IERS → ERT & equipment page is serving the new build. The department setup card remains `Setup mapped`, shows the existing confirmed department rows, and retains the North Pole selector and batch action. The visible current operational list is the same six local rows as before; five are used in the active pole roster and the CPD-only Cancer Care Centre remains excluded from emergency rotation. The page now needs a direct DOM check for the new `Assign or move departments individually` section, because the current viewport is positioned near the top of the long setup card.

## Deployment verification issue

After PR #517 merge, the live page changed to the new `Paeds Res` shell but currently fails before loading the institution workspace with `TypeError: Failed to fetch dynamically imported module: /assets/InstitutionWorkspace-CmY0HzCK.js`. This is a deployment/static-asset availability issue, not a database or authorization result. Further production verification is paused until Render asset serving is confirmed; no data mutation has been attempted.

## Render status

Render reports the deployment for commit `1e58e0d` as **live** at 00:25. The production page nevertheless fails to fetch `InstitutionWorkspace-CmY0HzCK.js`. This is likely a stale or inconsistent static-asset cache/origin state, or a build asset that was not published with the HTML. No rollback or manual deploy has been triggered; the next step is to inspect the asset response and deployment logs.

## Successful live verification

After reopening a fresh browser session, the production IERS → ERT & equipment page loaded successfully. The new setup surface now renders **Assign or move departments individually**. Each of the five currently eligible departments shows its current pole (`North Pole`) and a `Move department` control, while the CPD-only Cancer Care Centre remains outside the operational list. This confirms the previous inability to assign a department from the setup surface was caused by the missing individual control, not by a failed eligibility write.

## CPD live verification checkpoint

The fresh production CPD Portal → Sessions & Check-In page loads normally after PR #517. The selected event shows 33 attendance rows and the department column renders normally. The sampled event contains mostly already-canonical labels, so no visible `Recorded label:` secondary line appears in this event; a reconciled row from another event or the all-attendance analytics view is needed to demonstrate the new canonical display path.

## Live analytics checkpoint

The deployed CPD Portal → Overview & Analytics page loads and reports 324 registrations and 41 participating departments. This remains consistent with the current 294 unlinked-row count: reconciliation decisions can be recorded without opting into the optional canonical-identity backfill, so the analytics grouping continues to use raw labels for those unresolved/unlinked rows. The new code path is present, but a visible canonical change requires the specific label to be mapped and the backfill option to be selected.
