# Phase 2 Simulation Smoke Audit — 2026-10-13

## Environment
- Production: https://www.paedsresus.com
- Authenticated session: My Browser learner account
- Release under test: main commit `775bc9d8` / PR #1015

## Initial BLS result
- Simulation Hub loaded successfully.
- BLS, ACLS, PALS, NRP, and Heartsaver pathway cards were visible.
- BLS mission map and six cardiac-arrest scenarios were visible.
- Existing rehearsal metrics loaded.
- **Finding under investigation:** the new “Phase 2 automated mastery” card was not visible in the initial hydrated page, despite the release containing the card. This may be deployment propagation or a query/runtime issue and must be resolved before release sign-off.

## Confirmed BLS defect
The BLS URL displayed BLS as the current pathway and showed BLS-looking mission metrics, but the pathway card itself reported **Not enrolled** and the Phase 2 automated mastery card was absent. The previous selection logic silently fell back to a different enrolled pathway when the requested pathway had no enrollment. That could mislead a learner into believing another course’s progress belonged to BLS.

## Fix applied
The Simulation Hub now requires an enrollment matching the explicitly selected pathway. It no longer falls back to another course. If the pathway is not enrolled, the learner sees an explicit course-options action and cannot see or enter misleading mission controls.

## PALS result
PALS loaded successfully and showed the Phase 2 automated mastery card with 0/3 requirements, three course-specific requirements, targets, and the governance boundary. Its mission catalog and scenario lanes were visible.

## ACLS result
ACLS loaded successfully and showed the Phase 2 automated mastery card with 0/3 requirements. Adult ACLS command room, rhythm recognition, and the ten Adult ACLS scenarios were visible.

## NRP result
NRP loaded successfully and showed the Phase 2 automated mastery card with 0/2 requirements. The four newborn scenarios were visible and the NRP mission was discoverable.

## Heartsaver result
Heartsaver loaded successfully and showed the Phase 2 automated mastery card with 0/2 requirements. The cardiac-arrest mission and six scenarios were visible.
