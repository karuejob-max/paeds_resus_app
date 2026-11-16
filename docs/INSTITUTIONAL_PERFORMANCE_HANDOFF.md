# Institutional Performance Strategy — Future-Agent Handoff

**Project:** Paeds Resus  
**Scope:** Institutional performance snapshot and governed executive reporting  
**Last verified:** 2026-11-16 (EAT)  
**Canonical product route:** `/institution`

## Mission and operating boundary

This work gives authorised institution users a transparent operating view across roster, departments, Life Support evidence, credential renewal, CPD attendance versus presenting, readiness, QI, and data quality. It does not replace IERS, CPD Portal, Administration, or ResusGPS workflows.

Never present these records as proof of competence, licensure, accreditation, dispatch authority, or clinical performance. Do not infer mortality improvement, lives saved, or causal clinical outcomes from the current data.

## Delivered state

Phase 1–3 is implemented and deployed:

- Institution Home performance snapshot with independently disclosed source states.
- Department comparison with canonical-department denominators and unassigned staff disclosure.
- CPD attendance, lead presenting, and co-presenting shown as separate measures.
- Life Support and credential evidence/renewal states.
- Readiness/QI signals and actionable attention queue linked to existing workflows.
- Monthly and quarterly executive reports using EAT calendar periods.
- Immutable, institution-scoped historical report snapshots.
- Printable report detail and CSV export.
- Source availability, capture-time freshness, denominator limitations, and data-quality disclosures.
- Safe trends only for contiguous, same-period-type, same-report-version captured reports.
- Department-scoped CPD and QI report/action filtering; unscopable records are excluded rather than leaked.
- Concurrent report generation is idempotent through the unique institution/period key.

## Production evidence

- Implementation PR: #1258, merged to `main` at `ea6e3928`.
- Closure documentation PR: #1259, merged to `main` at `1cf46ba1`.
- Required `CI/gate` passed for both PRs.
- Render deployed `ea6e3928` to the production `paeds_resus_app` service.
- Render Web Shell migration completed successfully:

```bash
pnpm db:apply-0193
```

Render output:

```text
[0193] Institutional performance report snapshots are ready.
```

- The production `/institution` workspace loaded for the authenticated QA account and preserved institution-scoped access.
- That QA account did not have `canViewAccountability`, so the executive-report panel was correctly hidden. Do not record this as a report-generation UI smoke-test pass.

## Where to find the functionality in the UI

1. Open the production app and go to **Institution** / `/institution`.
2. Select the correct facility in the institution workspace. The header should show **FACILITY WORKSPACE** and the selected institution.
3. On **Home**, authorised users see **Institution performance snapshot** below the institutional action centre. This contains:
   - Active roster.
   - Licence evidence.
   - Life Support evidence.
   - CPD verified attendance.
   - Department comparison.
   - Attention queue.
   - Data-quality and source-state badges.
4. Still on **Home**, scroll to **Executive reporting**. This contains:
   - Monthly/quarterly selector.
   - **Generate report**.
   - Preserved report history.
   - Safe trend text.
   - Report detail.
   - **Print report**.
   - **CSV report**.
   - Source capture times and limitations.
5. The executive-report panel is intentionally rendered only when the server says the user has accountability-report access (`canViewAccountability === true`). If **Accountability** is absent from the workspace navigation, the user is not authorised for this panel.
6. Open **Accountability** for the authoritative staff-level detail and evidence workflow. It includes credential/learning accountability, reporting period selection, licence dates, Life Support states, CPD sessions held/presented, and departments needing support.
7. Open **Readiness** for IERS operational detail:
   - Command centre.
   - Evidence & actions.
   - Drills & debriefs.
   - Team & shift setup.
   - Equipment.
   - Implementation plan.
   - IERS Executive snapshot.
8. Open **Learning** for:
   - Learning overview.
   - Cohorts & competency.
   - CPD sessions.
   - Reports & insights.
   - People & targets.
   - Institutional Life Support.
9. Institution administrators use **Administration** for:
   - Overview.
   - People & access.
   - Products & billing.
   - Programme operations.
   - Data & support.

The performance snapshot is an overview and governance layer. Use the linked authoritative lane to take action; do not create duplicate actions from the snapshot.

## Metric semantics

- **Active roster:** active institutional staff rows where `removedAt IS NULL`.
- **Department coverage:** active roster rows with a canonical `facilityDepartmentId`; unassigned/free-text rows remain visible as data-quality exceptions.
- **Life Support coverage:** evidence state only; not competence or emergency authorisation.
- **Credential renewal risk:** recorded verified credential state: current, expiring, expired, or missing.
- **CPD attendance:** verified attendance records in the selected EAT period.
- **CPD presenting:** lead and co-presenter records counted separately from attendance.
- **Roster and credentials in an executive report:** state as of report generation.
- **QI backlog:** current/all-time operational backlog captured at report generation, not a historical outcome measure.
- **Freshness:** source queried/captured at report generation; the underlying tables do not expose one uniform last-modified field.

## Remaining work

### Immediate operational item

Complete one smoke test with an institution administrator or accountability-authorised user:

1. Open `/institution`.
2. Generate one monthly report.
3. Generate one quarterly report.
4. Open report history and detail.
5. Print the report.
6. Download the CSV.
7. Confirm source freshness and limitations are visible.
8. Generate the same period twice and confirm the immutable snapshot is returned.

### Next engineering priorities

1. Canonical identity and department reconciliation.
2. CPD identity matching and duplicate detection.
3. Credential and Life Support renewal history.
4. Governed staffing establishment and vacancy data.
5. Equipment/readiness source model and uptime evidence.
6. Multi-institution pilot governance, report ownership, retention, export, and audit cadence.

Do not prioritise predictive hospital scoring, hospital rankings, competence scoring, mortality/lives-saved claims, automated accreditation claims, or cross-hospital benchmarking until denominators and source completeness are governed.

## Future-agent execution rules

- Re-read `docs/PLATFORM_SOURCE_OF_TRUTH.md` and `docs/INSTITUTION_PERFORMANCE_SNAPSHOT_PLAN.md` before changing this area.
- Preserve `/institution` as the canonical institution route.
- Keep IERS, CPD Portal, Administration, and ResusGPS ownership boundaries intact.
- Enforce institution, role, product, and department scope server-side.
- Treat empty and unavailable sources differently from zero performance.
- Use EAT calendar periods; do not introduce a second reporting clock.
- Preserve report immutability and the unique `(institutionalAccountId, periodType, periodStart)` contract.
- Keep unsupported clinical/outcome claims out of reports and UI copy.
- Use protected GitHub workflow: feature branch, PR, required `CI/gate`, merge, branch deletion, and clean local `main`.
- If the schema changes, run the applicable Render migration through the approved deployment workflow and record the output here.

## Key files

- `server/routers/institution-performance.ts` — server-owned snapshot, report generation, scope enforcement, disclosures, history/detail procedures.
- `client/src/components/InstitutionPerformanceSnapshot.tsx` — snapshot, executive reporting, history, trends, print, CSV.
- `client/src/components/InstitutionHomePanel.tsx` — permission-gated composition on Institution Home.
- `client/src/pages/InstitutionWorkspace.tsx` — canonical institutional navigation and section gating.
- `drizzle/schema.ts` — `institutionalPerformanceReports` schema.
- `scripts/apply-0193-institution-performance-reports.mjs` — idempotent production migration.
- `server/routers/institution-performance-phase3.test.ts` — focused EAT/protected-procedure tests.
- `TODO.md` — completion checklist and production evidence.
