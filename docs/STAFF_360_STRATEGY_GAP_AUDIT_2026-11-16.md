
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

Remaining work is narrower and explicitly bounded: complete authenticated role-matrix testing across every institution role, add field-level review/mutation workflows with reason-required audit evidence, and decide whether institution-visible professional goals/target achievement belong in Staff 360 after a privacy review. The current read-only contract does not silently expose learner-owned goals or private clinical narratives.
