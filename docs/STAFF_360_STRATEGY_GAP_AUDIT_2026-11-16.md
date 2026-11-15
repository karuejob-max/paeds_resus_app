
## 5. Follow-up implementation in progress

The next implementation slice adds an additive `responsibilities` read model to the Staff 360 profile. It now projects, within the existing server authorization boundary:

- Departmental Head and deputy appointments;
- Departmental ERCo and deputy ERCo appointments;
- Departmental CPD coordinator and deputy appointments;
- institution-wide coordinator appointments represented by canonical product roles;
- bounded current/recent ERTL and UTL dated duties;
- lifecycle status, assignment dates, acceptance dates, department labels, and source identifiers.

The Staff 360 UI presents these as three separate sections—standing appointments, product permissions, and dated IERS duties—so they cannot be mistaken for one composite competence or readiness score. The directory also reports when the 500-record operating cap is reached instead of silently presenting an incomplete institution roster.

Validation added in this slice includes a pure responsibility-normalization unit suite, strict TypeScript, focused People & Access/provider regression tests, diff checks, and a production build.

## 6. Follow-up implementation completed — scale, source truth, and QI signals

The subsequent protected releases close three previously open gaps:

- Staff 360 now uses deterministic server-side pagination (50 records per page), a total count, and explicit previous/next controls. The old silent 500-record cap has been removed.
- Optional professional-credential and CPD-presentation reads are isolated. If those source tables are temporarily unavailable, Staff 360 says so explicitly rather than presenting an empty record as a fact.
- Staff 360 now projects institution-scoped Care Signal/Code Signal-linked QI reports and owned institutional QI actions from the canonical `institutionalQiReports` and `institutionalQiActions` workflow. It exposes counts and operational follow-up only; it does not expose private narratives or create a clinical-performance score.

Protected PRs #1229 and #1230 merged to `main` as `facae66d` and `6463ae37`. Validation passed for both slices: strict TypeScript, focused tests, production build, and diff checks; protected CI passed on each PR.

PR #1233 (`ce86817d`) closes the field-level review-request gap. An authorised Staff 360 viewer can now declare the affected area and submit a reasoned correction request; authoritative records remain unchanged until the owning governed workflow resolves it. Open requests are deduplicated and audited.

Professional goals/target achievement remain intentionally private by default. This is a resolved privacy decision for the current release, not an omitted feature: exposing learner-owned goals institution-wide without explicit consent would violate least privilege and could turn a development target into an employment-performance score.

The remaining operational item is authenticated role-matrix evidence across all listed role personas and cross-tenant cases. The role manifest exists and the server scope helper is fail-closed, but the full disposable-database real-router run still needs to be executed and recorded before claiming that acceptance gate closed.
