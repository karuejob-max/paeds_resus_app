# Work status

## 2026-11-17 — PR 1: executive report print and neutral naming

Implemented the first delivery slice from `InstitutionalExecutiveReportImplementationSpecification.md`: neutral institutional report naming replaces the nursing-only page title and CSV filename; the printed report includes a Paeds Resus letterhead, institution, scope, period, and EAT label; workspace header, institution switcher, navigation, and shell chrome are hidden when printing; A4 print margins and print-only report styling were added; and the report footer includes an explicit administrative-signals disclaimer. Merged in PR #1263 at `8a46b1ed` after CI/gate passed.

## 2026-11-17 — PR 2: institution snapshot v2 department array

Added a pure server-side department aggregation helper for institution-scope snapshots. Persisted canonical department rows with active staff, Life Support evidence, credential renewal/expiry evidence, CPD activity, QI backlog, source states, and small-group caution flags. Unassigned or unmappable staff and records are excluded from department rows while the existing roster limitations disclose the unassigned count. The department scorecard is rendered in the report and included in CSV export without individual names, composite ranks, or competence claims. Added focused tests for no departments, one department, tiny/zero-staff groups, unavailable sources, and unassigned staff. Merged in PR #1264 at `d9ec5d22` after CI/gate passed.

## 2026-11-17 — PR 3: deterministic executive findings

Added a pure `buildExecutiveFindings` engine over stored snapshot-v2 department numbers. It emits traceable headline, needs-support, doing-well, decision, and safe-comparison findings with rule IDs and numerator/denominator metadata. Small groups are excluded from strongest-department calls; ties are preserved; no composite rank or score is generated. The report detail response exposes server-owned findings and the institution report renders the executive blocks with rule IDs. Added 15 focused tests covering empty, tiny, zero-staff, unavailable metrics, ties, and missing history. Merged in PR #1265 at `ad63d924` after CI/gate passed.

## 2026-11-20 — PR 4: annual preserved periods

Added annual calendar-year report support across the server period contract, Drizzle enum, Reports & Insights, and the Home executive selector. Annual snapshots use 1 January–31 December EAT bounds, preserve existing immutability and scope identity, and disclose roster/credential point-in-time semantics. Added idempotent migration `0195`. Merged in PR #1274 at `b2c5c65e` after CI/gate passed; focused report boundary tests and TypeScript passed.

## 2026-11-20 — PR 5: scheduled closed-period generation

Added application-native scheduled generation for previous closed monthly, quarterly, and annual whole-institution periods at 06:30 EAT on the first day of each month. Generation reuses the immutable unique key, skips without inserting when required sources are unavailable, and stores automated reports with `generatedByUserId = NULL` rather than attributing them to a human. Added idempotent migration `0196`, deterministic rollover tests, and scheduler registration. Merged in PR #1275 at `e1ce1848` after CI/gate passed. Production migrations and authorised UI smoke testing remain open.
