# Clinical outcomes pilot — process metrics framework

**Document type:** Evaluation design (Phase 1 scaffold)  
**Version:** 0.1  
**Date:** 2026-05-27  
**Status:** Draft — requires clinical governance sign-off before pilot start  
**Owner:** Job Karue (CEO / clinical lead)  
**Aligns with:** [MATURITY_ROADMAP.md](./MATURITY_ROADMAP.md) Issue #3, [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md) §12, PSOT §16.7 (one hospital, septic shock)

---

## Purpose

Define how Paeds Resus will measure **provable process change** — not unsupported mortality claims — in a single-facility pilot before scaling the holistic loop.

---

## Pilot design (Phase 4 target)

| Parameter | Value |
|-----------|--------|
| **Facility** | One partner county referral hospital (Kenya or similar LMIC) |
| **Condition** | Paediatric septic shock |
| **Duration** | 90-day intervention after baseline month |
| **Closed loop** | ResusGPS case → Care Signal report → gap-linked micro-course → institutional gap visibility |

---

## Process outcome set (honest metrics)

These metrics are **process and system** indicators — not mortality claims.

| Metric | Source | Baseline | 90-day target (pilot) |
|--------|--------|----------|------------------------|
| **ResusGPS sessions (septic shock)** | `analyticsEvents` / `resusGPSSessions` | TBD | Trend ↑ |
| **ResusGPS → Care Signal within 7 days** | `holistic_loop/*` analytics + `careSignalEvents` | TBD | ≥30% |
| **Care Signal reporting rate** | Distinct reporters / active providers at facility | TBD | ≥10 providers × ≥1/month × 3 months |
| **Gap → learning click-through** | Analytics on micro-course links from Care Signal | TBD | ≥15% |
| **Time to first fluid (self-reported)** | Care Signal v2 structured delay fields | TBD | ↓ vs baseline (if data quality sufficient) |
| **Time to first antibiotic (self-reported)** | Care Signal v2 structured delay fields | TBD | ↓ vs baseline |
| **Institutional actions logged** | Spreadsheet → product later | 0 | ≥3 documented system changes linked to gaps |

---

## Evaluation methodology

1. **Baseline month** — collect platform exports + optional manual ward audit (pre-intervention)
2. **Intervention** — deploy closed loop with champion nurse; monthly QI review cadence
3. **Analysis** — internal QI report (clinical governance approved for internal use only)
4. **Optional validation** — academic partner (KEMRI, Aga Khan, etc.) in Phase 5–6

**Design options:** Before/after process metrics or stepped-wedge by unit — final choice requires governance approval.

---

## What we will NOT claim

- Mortality reduction without peer-reviewed evaluation
- National representativeness from n=1 hospital
- Care Signal KPIs combined with Safe-Truth parent metrics
- Fellowship completion as a proxy for clinical outcomes

---

## Data exports required

- Admin reports: ResusGPS rollup, Care Signal facility dashboard
- CSV: Care Signal submissions (aggregated gaps, no provider identification in institutional view)
- Fellowship progress **not** used as outcome metric

---

## Governance sign-off (required before pilot)

| Role | Name | Sign-off | Date |
|------|------|----------|------|
| CEO / clinical lead | Job Karue | ☐ | |
| Facility medical leadership | TBD | ☐ | |
| Data/privacy review | TBD | ☐ | |

---

## Next steps (roadmap)

| Phase | Action |
|-------|--------|
| **Phase 1** (now) | This scaffold + engineering loop instrumentation |
| **Phase 4** | Partner MOU, baseline collection, 90-day run |
| **Phase 5** | Internal evaluation report + second hospital LOI |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-27 | v0.1 — Phase 1 pilot framework scaffold |
