# Remaining maturity priorities

**Date:** 2026-05-27  
**Audience:** Job Karue (CEO), engineering, ops  
**Sources:** [MATURITY_ROADMAP.md](./MATURITY_ROADMAP.md), [WORK_STATUS.md](./WORK_STATUS.md), [LEGAL_PLATFORM_STRUCTURES.md](./LEGAL_PLATFORM_STRUCTURES.md)

Ranked by impact on delivering a **mature, mandate-fulfilling product** (one closed vertical slice + governed scale).

---

## Top 10 priorities

| Rank | Priority | Owner | Impact |
|------|----------|-------|--------|
| **1** | **Live staging** (`develop` → staging URL, separate Aiven DB) | CEO / ops | Blocks safe QA of payments, migrations, E2E before production |
| **2** | **Counsel engagement + Privacy/ToS rewrite** (all products, Kenya DPA) | CEO + counsel | Blocks public claims, Fellow title, institutional data-sharing |
| **3** | **Institutional pilot MOU** (one hospital, septic shock, 90-day process metrics) | CEO | Blocks provable theory-of-change proof ([CLINICAL_OUTCOMES_PILOT.md](./CLINICAL_OUTCOMES_PILOT.md)) |
| **4** | **Holistic loop proof** — manual staging smoke: ResusGPS save → Care Signal → action log | CEO + champion nurse | Closes Blocker #1 (critical) |
| **5** | **Keep `fellowTitleEnabled = false`** until §11 + counsel green | CEO (flag only) | Prevents credential misrepresentation |
| **6** | **Full E2E provider creds in CI/staging** (`E2E_PROVIDER_*`, optional GitHub secrets) | Engineering | Automates regression on authenticated loop entry |
| **7** | **Published retention + appeals** (Care Signal streak errors) | Counsel + CEO | Closes governance Blocker #8 |
| **8** | **ResusGPS clinical governance memo** (SaMD-style intended use, LMIC fluid strategy) | CEO + counsel | Reduces bedside liability exposure |
| **9** | **Care Signal intelligence maturity** (gap → institutional action workflow in product, not spreadsheet) | Engineering | Closes Blocker #6 |
| **10** | **Mission-aligned institutional GTM** (readiness systems, not seat bundles) | CEO / sales | Closes Blocker #5 and #10 |

---

## Engineering backlog (after CEO blockers)

- ResusGPS v4 completion (undo, dedup, multi-diagnosis — largely shipped; polish remaining)
- Expand Playwright to full save-path when stable test hooks exist
- `db:migrate` SSL path verified on staging ([STAGING_GO_LIVE_CHECKLIST.md](./STAGING_GO_LIVE_CHECKLIST.md))
- Safe-Truth guardian consent UI (parity with Care Signal)
- Second hospital LOI after first pilot evaluation (Phase 5)

---

## Operational

- ODPC registration assessment
- M-Pesa refund policy publication
- B2B MSA template (Phase 5)
- Public SEO / narrative coherence (Bronze/Silver/Gold removed — maintain discipline)

---

## Do not do without explicit CEO flag

- Set `FELLOWSHIP_LAUNCH_READINESS.fellowTitleEnabled = true`
- Enable `CLINICAL_OUTCOMES_PILOT_ENABLED` in production without governance sign-off
- Publish mortality or national league-table claims
- Publish accredited-facility directory before §11.4 criteria
