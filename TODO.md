# Paeds Resus Institutional Performance Outcomes

## 1. Institution Home provides a trusted performance snap view

- [x] The canonical `/institution` workspace gives authorised users a concise institutional view of performance across departments, CPD attendance versus presenting, Life Support course progress, licences/certificates and renewals, readiness, QI, and data quality.
- [x] Existing institutional Home, IERS, CPD Portal, learning, accountability, administration, and connected-services lanes remain available and are not replaced.
- [x] The snapshot uses existing institution style and links users to authoritative workflows for detail and action.

## 2. Metrics are transparent and safe

- [x] Active roster denominators exclude removed roster rows.
- [x] Department metrics disclose canonical department linkage and unassigned/free-text data quality gaps.
- [x] Life Support and credential states are labelled as evidence, coverage, completion, or renewal states and are not presented as proof of competence, licensure, accreditation, dispatch authority, or clinical performance.
- [x] CPD verified attendance is distinct from lead presenting and co-presenting.
- [x] Readiness and QI signals use existing records and do not infer causal clinical outcome claims.
- [x] Calendar periods use the existing EAT reporting semantics.

## 3. Failure isolation and tenant safety are preserved

- [x] A failure or unavailable source domain does not make unrelated snapshot domains unavailable in the server-owned source contract; unavailable and empty states are disclosed separately.
- [x] Institution, role, product, and department scope enforcement remains server-side through existing procedures.
- [x] Empty institutions render an explicit empty state rather than misleading zero-performance claims.

## 4. Department and action workflows become operational

- [x] Department comparison shows denominators, status, and data quality context.
- [x] Attention items link to existing credential, learning, CPD, IERS, QI, or administration workflows.
- [x] Owners and due dates reuse existing action entities; no duplicate action table is introduced.

## 5. Executive reporting is reproducible

- [x] A monthly/quarterly/annual executive report uses existing EAT calendar-period definitions and supports printable/CSV output from the canonical institutional workspace; annual periods run 1 January–31 December.
- [x] Generated reports are institution-scoped, access-controlled, versioned, and preserved as historical snapshots rather than silently changing when live source rows change.
- [x] Reports disclose source availability, report generation time/freshness, denominator limitations, and data-quality exceptions for each reporting period.
- [x] Report history supports safe trend comparison only between captured reports with the same metric and period semantics; insufficient history is stated explicitly.
- [x] No report claims lives saved, mortality improvement, accreditation, competence, licensure, or clinical performance from current data alone.

## 6. Reports & Insights is the canonical shareable nursing report centre

- [x] Authorised institutional users have one clear Reports & Insights destination from `/institution`; the Home snapshot remains a concise overview rather than the only report location.
- [x] Users can select monthly, quarterly, or annual EAT periods and whole-institution or an authorised canonical department scope.
- [x] Scope is enforced server-side, department-scoped records with no matching department are excluded, and immutable snapshot identity includes scope.
- [x] The nursing-team one-pager shows what is going well, needs attention, aggregate key measures with values/denominators/statuses, actions-to-close guidance, data limitations, source availability, print, and CSV output.
- [x] Names are excluded by default and copy avoids unsupported ranking, competence, accreditation, mortality, lives-saved, causal-outcome, or hospital-score claims.
- [x] Report history is scope-specific and explicitly states insufficient/no comparable history when safe contiguous same-version comparison is not available.

### Reports & Insights release evidence

- Annual support merged in PR #1274 at commit `b2c5c65e`; scheduled generation merged in PR #1275 at commit `e1ce1848`; required `CI/gate` passed for both.
- Migration `0194` was applied successfully in Render Web Shell with `pnpm db:apply-0194`; Render returned `[0194] Institutional performance report scopes are ready.` A Node TLS ServerName deprecation warning was also displayed and did not prevent successful completion.
- Migrations `0195` and `0196` remain to be applied and verified in Render Web Shell.
- Authorised institution-admin smoke test remains required for whole-institution monthly, department monthly, quarterly, annual, print, CSV, and repeat-generation immutability.

### Production release evidence

- Phase 3 merged to `main` in PR #1258 at commit `ea6e3928`; required `CI/gate` passed.
- Render production deployed commit `ea6e3928` successfully.
- Migration `pnpm db:apply-0193` ran successfully in Render Web Shell on 2026-11-16; Render returned `[0193] Institutional performance report snapshots are ready.`
- The production canonical `/institution` workspace loaded successfully for the authenticated QA account and preserved scoped access. The executive-report panel was correctly withheld because that account does not hold the accountability-report permission; an authorized institution-admin smoke test remains the appropriate next operational check before using reports with leadership data.
