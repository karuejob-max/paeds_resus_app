# Global safety audit — B1–B14 scope

**Date:** 2026-05-31  
**Baseline:** PR #128 (`25c219d`) — fellowship-first B1–B14  
**This pass:** Make safety global across AHA, ResusGPS, certificates, admin, lint.

---

## Audit checklist

| Item | Global before? | Fix in this PR? | Notes |
|------|----------------|-----------------|-------|
| **A — Foundational/Advanced naming** | Partial | Yes | Catalog/API already global; enrollment modal + MicroCoursesLanding filters/badges aligned |
| **B1 — Clinical content version footer** | Fellowship player only | Yes | `ClinicalContentSafetyFooter` on fellowship + AHA player + ResusGPS (idle) |
| **B2 — Certificate ≠ competence disclaimer** | Fellowship PDFs only | Yes | All program types (BLS/ACLS/PALS/cognitive/fellowship/instructor) |
| **B3 — LMIC callouts** | Fellowship seed P0 slugs | N/A (by design) | Not forced on BLS/AHA; clinically relevant fellowship slugs only |
| **B4 — Report unsafe content** | Fellowship player only | Yes | Shared component; `surface` analytics on all surfaces |
| **B5 — Clinical CI lint** | `server/data` + ResusGPS | Yes | Extended to AHA seed/update scripts + `courseContent.ts` |
| **B6 — Prerequisites** | Fellowship microcourses | Documented | Advanced-only gating; AHA separate track (no cross-prereq) |
| **B7 — ResusGPS ↔ fellowship** | Partial | Yes | Footer + existing pillar banner; seriously-ill-child in catalog |
| **B8 — Depth badges** | Catalog + dashboard | Yes | CourseCatalog, MicroCoursesLanding, EnrollmentModal |
| **B9 — AHA/Fellowship separation banners** | Player only | Yes | + TrainingCourseLanding, MicroCoursesLanding |
| **B10 — Ward actions checklists** | dka, SE, asthma P0 | Yes | + septic-shock-i, malaria-i, anaphylaxis-i, meningitis-i (seed on deploy) |
| **B11 — PLATFORM_SAFETY_GAPS.md** | Fellowship-scoped | Yes | Updated global status |
| **B12 — Seriously ill child + intubation** | Catalog | Already global | No change |
| **B13 — Analytics** | Fellowship player | Yes | `content_version_viewed` + `unsafe_content_reported` with `surface` on all footers |
| **B14 — Production seed** | Auto-seed on deploy | Yes | Ward checklist content ships via fellowship auto-seed |
| **Admin — content safety list** | Missing UI | Yes | Admin Reports → Maturity tab |
| **Migration 0047** | Code only | Ops | Run `pnpm run db:apply-0047` on prod when `DATABASE_URL` set |
| **fellowTitleEnabled** | false | N/A | Intentionally CEO-gated; no Fellow leaks added |
| **Mobile layout — new footer** | Untested | Yes | Responsive dialog + compact ResusGPS variant |

---

## CEO-only remainder (not engineering)

| Item | Owner |
|------|-------|
| Live click-test sign-off | CEO |
| Clinical content approval per module | CEO |
| `fellowTitleEnabled` flip | CEO |
| Counsel / MOU | CEO |
| Ops email on every content safety report | Optional follow-up |
| Full AHA 2025 clinical audit | CEO/clinical — out of fellowship CST scope |

---

## Deploy checklist

1. Merge PR; note hash in WORK_STATUS.
2. `pnpm run db:apply-0047` on production (once).
3. Render deploy → fellowship auto-seed picks up ward checklist additions.
4. `pnpm exec tsx scripts/verify-fellowship-seed.ts` → 29/0, `levelTitle=false`.

---

## Document control

Supersedes informal “fellowship-only safety” notes. See also `docs/PLATFORM_SAFETY_GAPS.md`, `docs/AGENT_DISCOVERED_GAPS.md`.
