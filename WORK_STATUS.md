
## 2026-11-17 — PR 3: deterministic executive findings

Added a pure `buildExecutiveFindings` engine over stored snapshot-v2 department numbers. It emits traceable headline, needs-support, doing-well, decision, and safe-comparison findings with rule IDs and numerator/denominator metadata. Small groups are excluded from strongest-department calls; ties are preserved; no composite rank or score is generated. The report detail response now exposes the server-owned findings and the institution report renders the executive blocks with rule IDs. Validation: 15 focused tests, TypeScript, and diff checks passed.
