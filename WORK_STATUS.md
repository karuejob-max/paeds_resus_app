# Work status

## 2026-11-17 — Executive report PR 1

Implemented the first small delivery slice from `InstitutionalExecutiveReportImplementationSpecification.md`:

- Neutral institutional report naming replaces the nursing-only page title and CSV filename.
- The printed report includes a Paeds Resus letterhead, institution, scope, period, and EAT label.
- Workspace header, institution switcher, navigation, and shell chrome are hidden when printing the Reports & Insights report.
- Added A4 print margins and print-only report styling while preserving the interactive workspace.
- Added an explicit administrative-signals disclaimer to the report footer.

Validation and release evidence will be recorded after local checks and protected PR merge.

## 2026-11-17 — PR 2: institution snapshot v2 department array

- Added a pure server-side department aggregation helper for institution-scope snapshots.
- Persisted canonical department rows with active staff, Life Support evidence, credential renewal/expiry evidence, CPD activity, QI backlog, source states, and small-group caution flags.
- Excluded unassigned or unmappable staff and records from department rows; existing roster limitations continue to disclose the unassigned count.
- Added department scorecard rendering and CSV export without individual names, composite ranks, or competence claims.
- Added focused unit tests for no departments, one department, tiny/zero-staff groups, unavailable sources, and unassigned staff.
- Validation: Vitest (9 tests), TypeScript, production build, and `git diff --check` passed. Build retains pre-existing large-chunk warnings.
