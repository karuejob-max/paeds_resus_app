# P0-1 Performance Profiling Method

**Task:** P0-1  
**Owner:** Manus (execution), Cursor (backend evidence support)  
**Start:** 2026-04-14  
**Target complete:** 2026-04-16

---

## 1) Objective

Produce reliable baseline evidence for the three critical user journeys:

1. Login submit -> authenticated shell ready
2. Provider/Fellowship dashboard route start -> first meaningful content
3. ResusGPS route start -> first usable interaction

---

## 2) Tools and evidence sources

- Browser:
  - Chrome DevTools Network + Performance traces
  - Navigation timing markers from app instrumentation
- Server:
  - API route timing logs (tRPC handlers)
  - Query timing evidence for heavy DB calls
- Output artifacts:
  - Trace summaries (p50/p95/p99) per scenario
  - Top bottleneck table with estimated impact

---

## 3) Test environments

- Primary: production-like deployed environment (`https://www.paedsresus.com`)
- Secondary: local build only for controlled reproduction, not primary SLO proof

Database and cache baseline rules:

- Use realistic production-like data volume baseline (target seed/profile scale: >=1000 users, >=500 enrollments, representative course/catalog rows).
- Baseline run is cold-cache: disable service worker and browser cache.
- Start with single-user latency baseline; concurrent-user/load profiling is tracked as follow-on work item (not a Week 1 blocker).

---

## 4) Sampling methodology

- Sample size:
  - 100 runs per scenario (login/dashboard/ResusGPS)
- Network profiles:
  - Stable broadband/Wi-Fi
  - Constrained mobile profile (4G-equivalent)
- Reporting:
  - p50 / p95 / p99
  - success rate (% completed within SLO)

---

## 5) Required output table

| Scenario | FMC/Ready definition | p50 ms | p95 ms | p99 ms | Success % | Top bottleneck | Proposed fix |
|---|---|---:|---:|---:|---:|---|---|
| Login | Authenticated shell visible |  |  |  |  |  |  |
| Dashboard | Hero + primary CTA card visible |  |  |  |  |  |  |
| ResusGPS | First actionable controls interactive |  |  |  |  |  |  |

---

## 6) Exit criteria

- Evidence captured for both network profiles
- p50/p95/p99 and success rate recorded
- At least top 5 bottlenecks listed by impact
- Hotfix shortlist for Week 1 identified and ranked
- Baseline explicitly annotated as cold-cache single-user measurement
