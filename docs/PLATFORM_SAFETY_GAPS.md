# Platform safety gaps — engineering vs CEO

**Last updated:** 2026-05-31  
**Scope:** Fellowship micro-courses, ResusGPS alignment, certificates, content governance.

---

## Fixed in engineering (B1–B14 + Part A naming)

| ID | Item | Implementation |
|----|------|----------------|
| A | Foundational / Advanced naming | `shared/micro-course-display.ts`, `server/lib/micro-course-catalog.ts` titles (`DKA: Foundational`, etc.); slugs unchanged |
| B1 | Content version on player | Footer + `courses.getClinicalContentVersion`; env `CLINICAL_CONTENT_VERSION` |
| B2 | Certificate ≠ competence | PDF footer disclaimer + track line on fellowship certs |
| B3 | LMIC “if you only have X” callouts | `lmicsResourceCalloutHtml` + `enhanceFellowshipModuleContent` on seed for dka, SE, shock, malaria |
| B4 | Report unsafe content | `contentSafetyReports` table (0047), `contentSafety.reportUnsafeContent`, player dialog |
| B5 | Clinical CI lint | `pnpm run lint:clinical` in `pnpm run check` |
| B6 | Prerequisites enforced | Server `enrollWithPayment` + player + catalog UI block |
| B7 | ResusGPS ↔ fellowship | `seriously_ill_child` condition; player fellowship / AHA separation banners |
| B8 | Course depth labels | `tier` on catalog rows; Foundational / Advanced badges on cards |
| B9 | AHA / Fellowship separation | Banners on AHA player + fellowship player |
| B10 | Ward actions checklist | `wardActionsChecklistHtml` on P0 last modules (DKA, SE, asthma) |
| B11 | This document | — |
| B12 | Seriously ill child + intubation | Catalog copy; intubation sample labeled non-pillar |
| B13 | Analytics | `content_version_viewed`, `unsafe_content_reported` via `trackEvent` |
| B14 | Production seed | Existing `run-fellowship-auto-seed.mjs` on deploy picks up content after merge |

---

## CEO-only (post-deploy / non-engineering)

| Item | Owner | Notes |
|------|-------|-------|
| Live click-test sign-off | CEO | `docs/MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md` checklist |
| Clinical content approval per module | CEO | Engineering ships; CEO approves copy |
| `fellowTitleEnabled` | CEO | Remains **false** until §11 fellowship launch checklist passes |
| Counsel / MOU / legal sign-off | CEO | ~95% engineering baseline per WORK_STATUS |
| Ops email on every content safety report | Optional | Admin `contentSafety.listReports`; wire SES alert in follow-up if needed |

---

## Deploy checklist (engineering)

1. Merge PR to `main`; note merge hash in WORK_STATUS.
2. Render deploy runs fellowship auto-seed (or manual `pnpm run seed:fellowship-content:all`).
3. `pnpm run db:apply-0047` on production once.
4. `pnpm exec tsx scripts/verify-fellowship-seed.ts` → expect 29/0, `levelTitle=false` on all rows.

---

## Document control

Supersedes informal gap notes for **platform safety** only. Clinical depth backlog remains in `docs/FELLOWSHIP_WHAT_IS_MISSING.md` and `docs/AGENT_DISCOVERED_GAPS.md`.
