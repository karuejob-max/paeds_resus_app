# Legal & compliance baseline (draft)

**Document type:** Working governance draft — not legal advice  
**Version:** 0.1 (Phase 1)  
**Date:** 2026-05-27  
**Status:** Draft for counsel review — **do not treat as signed policy**  
**Owner:** Job Karue (CEO)  
**Aligns with:** [MATURITY_ROADMAP.md](./MATURITY_ROADMAP.md) Issue #8, PSOT §11, [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md) §10, [CARE_SIGNAL_STRATEGY_AND_ROADMAP.md](./CARE_SIGNAL_STRATEGY_AND_ROADMAP.md) §11

---

## Purpose

Record minimum legal/compliance expectations before public outcome claims, Fellow credentials, or institutional data-sharing expand. Engineering implements **consent flows and data minimisation**; counsel reviews **published policies**.

---

## 1. Scope of platform data

| Product | Data collected | PHI / identifiers |
|---------|----------------|-------------------|
| **ResusGPS** | Session state (client-side); optional case save for fellowship | No patient identifiers in saved cases; sessionStorage per [SECURITY_BASELINE.md](./SECURITY_BASELINE.md) |
| **Care Signal** | Provider QI reports (facility, delays, gaps) | **No patient identifiers** in free text — form guidance required |
| **Safe-Truth** | Parent/guardian submissions | Separate product; never combined with Care Signal KPIs |
| **Fellowship** | Progress, certificates, streaks | Provider identity only; automation-only Fellow title |
| **Institutional** | Staff roster, enrollments, facility aggregates | B2B contract governs employer access |

---

## 2. Policies requiring counsel review

| Policy | Current state | Phase 1 action | Owner |
|--------|---------------|----------------|-------|
| Privacy policy | Existing `/privacy` | Scope Care Signal + Fellowship streak data | Counsel + CEO |
| Terms of service | Existing `/terms` | Grace/catch-up/reset rules; no manual Fellow conferral | Counsel + CEO |
| Care Signal consent | Partial (form disclaimers) | First-submission explicit consent UI (Phase 3) | Engineering + counsel |
| Data retention schedule | [SECURITY_BASELINE.md](./SECURITY_BASELINE.md) §4 draft | Per-table retention doc linked from Privacy | CEO |
| Appeals process (streak errors) | Not published | Document operator path for system errors only | CEO |
| B2B MSA template | Not published | Phase 5 institutional pilot | CEO |

---

## 3. Care Signal — minimum controls (implemented / planned)

- [x] No patient identifiers in schema design (PSOT + Fellowship doc)
- [x] Provider-only route; facility aggregates for institutional admin
- [ ] Explicit consent at first submission (Phase 3)
- [ ] Retention schedule published (Phase 1–3)
- [ ] Appeals process documented (Phase 3)

---

## 4. Fellowship — minimum controls

- [x] **No manual Fellow conferral** (PSOT §17; `FELLOWSHIP_LAUNCH_READINESS.fellowTitleEnabled = false`)
- [x] Fellow UI gated until §11 checklist passes
- [ ] Privacy/ToS updated for 24-month Pillar C rules (counsel)
- [ ] Accredited facilities list **not** published until §11.4 criteria exist

---

## 5. Clinical claims governance

Per [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md) §12:

- **Permitted now:** Product activity metrics, process-oriented pilot metrics with governance sign-off
- **Not permitted without external review:** Mortality reduction claims, hospital league tables, accreditation rankings

Public claims register (Phase 6): map website copy → evaluation evidence.

---

## 6. CEO sign-off gate

| Item | Signed | Date |
|------|--------|------|
| Counsel engaged for Privacy/ToS Care Signal scope | ☐ | |
| Retention draft acceptable for internal use | ☐ | |
| Appeals outline acceptable | ☐ | |
| No public Fellow credentials until §11 green | ☑ (engineering gate shipped) | 2026-05-27 |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-27 | v0.1 — Phase 1 draft baseline for counsel review |
