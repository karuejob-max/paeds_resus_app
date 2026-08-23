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
