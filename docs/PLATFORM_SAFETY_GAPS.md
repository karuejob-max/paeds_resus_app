# Platform safety gaps — engineering vs CEO

**Last updated:** 2026-05-31 (global pass)  
**Scope:** All course types (AHA, fellowship micro-courses, ResusGPS), certificates, content governance.

---

## Fixed in engineering (B1–B14 + Part A naming) — **global**

| ID | Item | Implementation |
|----|------|----------------|
| A | Foundational / Advanced naming | `shared/micro-course-display.ts`, catalog, CourseCatalog, MicroCoursesLanding, EnrollmentModal |
| B1 | Content version on player | `ClinicalContentSafetyFooter` — fellowship player, AHA player, ResusGPS (idle) |
| B2 | Certificate ≠ competence | PDF footer disclaimer on **all** program types (`certificate-pdf.ts`) |
| B3 | LMIC “if you only have X” callouts | `lmicsResourceCalloutHtml` — fellowship P0 slugs only (not BLS/AHA) |
| B4 | Report unsafe content | `contentSafetyReports` (0047), shared footer component, all surfaces |
| B5 | Clinical CI lint | `pnpm run lint:clinical` — fellowship + AHA seed scripts + ResusGPS + `courseContent.ts` |
| B6 | Prerequisites enforced | Advanced micro-courses only; AHA separate track |
| B7 | ResusGPS ↔ fellowship | `seriously_ill_child`; footer + pillar banner |
| B8 | Course depth labels | Foundational / Advanced badges on catalog + enrollment |
| B9 | AHA / Fellowship separation | Banners on players, TrainingCourseLanding, MicroCoursesLanding |
| B10 | Ward actions checklist | P0 slugs + septic-shock-i, malaria-i, anaphylaxis-i, meningitis-i |
| B11 | Gap docs | `docs/GLOBAL_SAFETY_AUDIT.md`, this file |
| B12 | Seriously ill child + intubation | Catalog copy; intubation sample labeled non-pillar |
| B13 | Analytics | `content_version_viewed`, `unsafe_content_reported` with `surface` on all footers |
| B14 | Production seed | `run-fellowship-auto-seed.mjs` on deploy |
| — | Admin ops | `contentSafety.listReports` in Admin Reports → Maturity |

---

## CEO-only (post-deploy / non-engineering)

| Item | Owner | Notes |
|------|-------|-------|
| Live click-test sign-off | CEO | `docs/MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md` checklist |
| Clinical content approval per module | CEO | Engineering ships; CEO approves copy |
| `fellowTitleEnabled` | CEO | Remains **false** until §11 fellowship launch checklist passes |
| Counsel / MOU / legal sign-off | CEO | ~95% engineering baseline per WORK_STATUS |
| Ops email on every content safety report | Optional | Admin UI shipped; wire SES alert in follow-up if needed |
| Full AHA 2025 clinical audit | CEO/clinical | Separate from fellowship CST |

---

## Deploy checklist (engineering)

1. Merge PR to `main`; note merge hash in WORK_STATUS.
2. Render deploy runs fellowship auto-seed (or manual `pnpm run seed:fellowship-content:all`).
3. `pnpm run db:apply-0047` on production once.
4. `pnpm exec tsx scripts/verify-fellowship-seed.ts` → expect 29/0, `levelTitle=false` on all rows.

---

## Document control

See `docs/GLOBAL_SAFETY_AUDIT.md` for item-by-item audit. Clinical depth backlog remains in `docs/FELLOWSHIP_WHAT_IS_MISSING.md` and `docs/AGENT_DISCOVERED_GAPS.md`.
