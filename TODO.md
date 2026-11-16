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

- [ ] A monthly/quarterly executive report uses existing EAT period definitions and supports printable/CSV output.
- [ ] Reports disclose source availability, freshness, denominator limitations, and data-quality exceptions.
- [ ] No report claims lives saved, mortality improvement, accreditation, or competence from current data alone.
