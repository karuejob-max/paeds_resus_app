# Global safety audit — B1–B14 (full mandate)

**Last verified:** 2026-06-02  
**Baseline:** PR #128 (`25c219d`) fellowship-first safety  
**Global pass:** PR #129 (`02d463d`) + retry PR (ward/LMIC extension, ResusGPS footer always-on)

---

## Audit checklist

| # | Item | Global? | Fix needed? | Implementation / notes |
|---|------|---------|-------------|------------------------|
| A | Foundational / Advanced naming (no Level 1/2, no bare Course 1/2 in UI) | Yes | No | `shared/micro-course-display.ts`; catalog API; CourseCatalog, MicroCoursesLanding, EnrollmentModal, FellowshipDashboard, player badge |
| B1 | Clinical content version footer | Yes | No | `ClinicalContentSafetyFooter` + `courses.getClinicalContentVersion` on fellowship player, AHA player (`MicroCoursePlayerDB`), ResusGPS (idle + active case) |
| B2 | Certificate ≠ competence disclaimer | Yes | No | `CERTIFICATE_COMPETENCE_DISCLAIMER` on **all** PDF types in `server/certificate-pdf.ts`; unit test |
| B3 | LMIC “if you only have X” callouts | Partial (fellowship high-risk) | Done (retry) | `LMIC_CALLOUTS_BY_SLUG` — dka, SE, shock (i/ii), malaria (i/ii), trauma-i, pneumonia-i; **not** BLS/AHA (by design) |
| B4 | Report unsafe content | Yes | No | `contentSafety.reportUnsafeContent` + shared footer; surfaces: `fellowship_player`, `aha_player`, `resus_gps` |
| B5 | Clinical CI lint (P0 phrases) | Yes | No | `scripts/lint-clinical-content.ts` — `server/data`, AHA seed scripts, ResusGPS engines, `courseContent.ts`; `pnpm run check` |
| B6 | Prerequisites (advanced after foundational) | Yes (micro only) | No | Server `enrollWithPayment` + player + catalog; AHA has separate track (documented) |
| B7 | ResusGPS ↔ fellowship alignment | Yes | No | Pillar banner + seriously-ill-child catalog; shared safety footer |
| B8 | Foundational / Advanced badges (enrollment + catalog) | Yes | No | All microcourse enrollment surfaces |
| B9 | AHA / Fellowship separation banners | Yes | No | `MicroCoursePlayerDB` (both directions), TrainingCourseLanding, MicroCoursesLanding, Enroll copy |
| B10 | Ward actions checklists | Yes (P0 high-risk) | Done (retry) | `WARD_ACTIONS_BY_SLUG` — dka, SE, asthma, septic-shock, malaria, anaphylaxis, meningitis, hypovolemic-shock, pneumonia, trauma, burns, cardiogenic-shock (foundational i-slugs) |
| B11 | `PLATFORM_SAFETY_GAPS.md` | Yes | No | Updated global scope |
| B12 | Seriously ill child + intubation sample | Yes | No | Catalog copy; intubation non-pillar |
| B13 | Analytics (`content_version_viewed`, `unsafe_content_reported`) | Yes | No | All footer surfaces with `surface` in eventData |
| B14 | Production seed / auto-seed | Yes | Ops | `run-fellowship-auto-seed.mjs` on deploy; re-seed after content helper changes |
| — | Admin content safety reports | Yes | No | Admin Reports → Maturity tab → `contentSafety.listReports` |
| — | Migration 0047 | Yes | Ops | `pnpm run db:apply-0047` — run on prod once per environment |
| — | `fellowTitleEnabled` | N/A | CEO | Stays `false` |
| — | Mobile layout (footer dialog) | Yes | No | Responsive `DialogContent`; compact ResusGPS variant |

---

## Surfaces verified (code)

| Surface | Version footer | Report unsafe | AHA/Fellowship banner |
|---------|--------------|---------------|------------------------|
| Fellowship player (`/micro-course/*`) | Yes | Yes | Yes (both directions) |
| AHA player (`/course/bls`, `/course/pals`, etc.) | Yes | Yes | Yes |
| ResusGPS (`/resus`) | Yes | Yes | Clinical disclaimer + fellowship pillar banner |
| CourseCatalog / MicroCoursesLanding | N/A | N/A | Track badges + separation alert |
| TrainingCourseLanding | N/A | N/A | AHA separation alert |
| EnrollmentModal (free + M-Pesa path via landing) | Track label | N/A | Via landing |

---

## CEO-only remainder

| Item | Owner |
|------|-------|
| Live click-test sign-off | CEO |
| Clinical approval per module | CEO |
| `fellowTitleEnabled` | CEO |
| Counsel / MOU | CEO |
| SES alert on each content safety report | Optional engineering follow-up |
| Full AHA 2025 clinical audit | CEO/clinical |

---

## Deploy checklist

1. Merge PR; record hash in `docs/WORK_STATUS.md`.
2. `pnpm run db:apply-0047` on production (if not already applied).
3. Render deploy → fellowship auto-seed applies ward/LMIC HTML updates.
4. `pnpm exec tsx scripts/verify-fellowship-seed.ts` → **29 courses, 0 failure(s)**, `levelTitle=false`.

---

## Document control

See `docs/PLATFORM_SAFETY_GAPS.md`, `docs/AGENT_DISCOVERED_GAPS.md`.
