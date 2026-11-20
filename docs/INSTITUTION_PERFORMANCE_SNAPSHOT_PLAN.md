# Institutional Performance Snapshot — Implementation Plan

## Goal

Give authorised institution users a trusted, actionable snap view across departments, learning, CPD, credentials, readiness, quality improvement, and data quality without replacing the existing IERS, CPD Portal, or Administration workflows.

## Scope and phased outcomes

### Phase 1 — trusted read-only vertical slice

- Add a performance snapshot to the canonical `/institution` Home lane.
- Reuse authoritative institution-scoped procedures where possible.
- Show transparent domain cards for roster, department coverage, Life Support course progress, credential renewal risk, CPD attendance versus presenting, readiness/QI attention, and data quality.
- Keep each domain independently loadable so one unavailable source does not blank the entire institutional home.
- Exclude removed roster rows and label evidence/data availability separately from competence, licensure, accreditation, or clinical performance.

### Phase 2 — department and action operating layer

- Add department comparison with denominators and period filters.
- Link attention items to existing IERS, QI, learning, credential, and administration workflows.
- Reuse existing owners, due dates, action records, and implementation plans; do not add duplicate action tables.

### Phase 3 — reporting and longitudinal governance

- Add EAT/calendar-period executive report output using existing CSV/print conventions.
- Add trend snapshots and source freshness disclosures.
- Improve identity, canonical department, renewal-history, staffing-establishment, equipment-uptime, and outcome linkage where the schema supports them.

## Canonical metric definitions

- **Active roster:** institutional staff rows for the selected institution where `removedAt IS NULL`; roster-only people remain in the denominator when the metric is roster-based.
- **Department coverage:** active roster rows with a canonical `facilityDepartmentId`; free-text-only departments are shown as unassigned/data-quality gaps.
- **Life Support coverage:** staff with current or expiring evidence records for the selected programme; completion is learning/evidence state, not proof of competence or dispatch authority.
- **Credential renewal risk:** verified regulatory/licence or certificate projection classified as current, expiring within 90 days, expired, missing, or another explicit workflow state.
- **CPD attendance:** verified attendance records only, with identity and event provenance disclosed where available.
- **CPD presenting:** lead presenter and co-presenter records are counted separately; presenting is not substituted for attendance.
- **Readiness/QI attention:** open or overdue records from existing IERS/QI sources; no clinical outcome or causal claims are inferred.
- **Data quality:** missing identity links, unassigned departments, unresolved attendance identity, and source freshness/availability are reported explicitly.
- **Period semantics:** calendar periods use EAT and existing procedure period conventions; no new reporting clock is introduced.

## Product and data boundaries

- Paeds Resus is the platform; ResusGPS remains the bedside guidance product.
- IERS owns readiness, competency, and operations; CPD Portal owns CPD; Administration owns people, billing, and exports.
- All data remains tenant-scoped and entitlement/role-scoped server-side.
- Evidence states are never labelled as proof of competence, licensure, accreditation, or clinical performance.
- Existing emergency/readiness flows and routes remain intact.

## Planned modules and files

- `client/src/components/InstitutionPerformanceSnapshot.tsx`: read-only, section-isolated overview UI.
- `client/src/components/InstitutionHomePanel.tsx`: compose the snapshot above existing institutional attention lanes.
- Existing accountability, learning, CPD, IERS, and QI procedures remain authoritative until a shared backend query layer is justified by repeated logic.
- Later: `server/lib/institution-performance.ts` and a dedicated read-only router once denominator normalization and source-failure semantics are proven by the vertical slice.

## Design direction

Three candidate styles: operational command board (0.06), clinical evidence ledger (0.08), calm institutional cockpit (0.07). Choose **clinical evidence ledger**.

- **Movement:** restrained clinical operations UI: evidence first, action second.
- **Principles:** transparent denominators, calm severity, independent source states, and compact scan paths.
- **Color philosophy:** neutral surfaces for trustworthy baseline data; indigo for institutional context; amber/red only for explicit renewal or overdue risk; green for recorded current states, never “safe hospital” claims.
- **Layout:** a left-to-right scan from population and departments to learning/credentials, then CPD and readiness/QI; existing navigation and panels remain available below.
- **Signature elements:** denominator subtitles, source-state badges, and “what this does not mean” safety notes on sensitive cards.
- **Interaction:** read-only cards link into the authoritative lane; no inline bulk mutations in the snapshot.
- **Animation:** none beyond existing loading states; emergency-adjacent reporting should remain steady under pressure.
- **Typography:** existing application typography and card system; numeric values are prominent, explanatory text is compact.
- **Brand essence:** a transparent institutional operating view for teams improving paediatric emergency readiness; calm, explicit, accountable.

## Rollback strategy

The first slice is additive. Rollback is deleting the snapshot import/render and its component; existing Home, accountability, learning, IERS, QI, and administration routes remain unchanged. No schema migration or data mutation is required for Phase 1.
