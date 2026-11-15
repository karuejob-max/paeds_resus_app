
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

This does **not** close the remaining P0/P1 gaps around licence/life-support projections, CPD presentation and target achievement, Care/Code Signal activity, case-management follow-up, field-level source failure isolation, server-side pagination beyond the operating cap, or the complete authenticated role-matrix sign-off. Those remain explicit next work, not hidden assumptions.
