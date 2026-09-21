# Readiness Workspace IA Redesign — Implementation Handoff

**Status:** Implemented in the client workspace; no database migration required.

## Outcome

The Institution Workspace Readiness area now presents the setup workflow in the order an institution operates it. The former nested **ERT & equipment** tab is now **Team & shift setup**, with three anchor-linked sections: **Step 1 — Departments & poles**, **Step 2 — ERCo governance**, and **Step 3 — Shift roster**. This removes unnecessary tab-hopping while preserving the distinction between governance appointments and day-to-day staffing.

Pole creation and ordering now live with department and pole setup. The shift roster retains the Facility Zone selector because its responsibility is choosing which pole roster to view, not managing pole lifecycle. Equipment is a separate Readiness tab with the routine crash-cart audit first and occasional checklist governance second.

The Executive snapshot no longer repeats the full Evidence score card. It retains the four-metric readiness profile and now shows a compact evidence-score reference linking back to Evidence & actions. The Connected Services content is reachable through a new admin-only top-level Connected tab. Non-administrators who open a bookmarked Connected URL are safely returned to Home.

## Deep-link compatibility

Existing URLs using `section=iers&iersTab=workforce&workforceTab=erco`, `roster`, or `equipment` continue to open the merged Team & shift setup tab. The page then scrolls to the corresponding anchor for ERCo governance or the shift roster. The legacy `workforceTab=equipment` value maps to the departments-and-poles anchor because Equipment is now a sibling Readiness tab; users can select Equipment directly from the Readiness navigation.

The new anchors are:

| Purpose | Anchor |
| --- | --- |
| Departments and poles | `#team-setup-departments` |
| ERCo governance | `#team-setup-erco` |
| Shift roster | `#team-setup-roster` |

## Safety and data boundaries

All pole, department, ERCo, roster, and equipment mutations reuse the existing tRPC procedures. No IERS or CPD table, schema, or server procedure was changed. The redesign changes composition, navigation, ownership presentation, and discoverability only. Existing authorization and operational rules therefore remain the enforcement boundary.

The page continues to distinguish **ERCo governance** from **shift staffing**. An ERCo appointment is a standing departmental governance responsibility; the roster remains the operational record of dated duties and provider acceptance. Pole ordering affects navigation and does not change weekly ERTL rotation logic.

## Validation and rollback

The implementation was checked with the repository’s TypeScript, PWA TypeScript, clinical lint, and strict audit commands. The full unit suite and production build passed. The navigation helper has focused regression coverage for the merged tab and legacy workforce URLs.

Rollback is a client-only revert of the Readiness workspace commit. No migration rollback or production data repair is required. If a deployment exposes an issue, restore the prior `InstitutionWorkspace`, `IersDepartmentSetupPanel`, `ErtRosterPanel`, and `IersExecutiveReportPanel` versions, then rerun `pnpm run check`, `pnpm run test:unit`, and `pnpm run build` before redeploying.

## Follow-up

The next recommended pass should audit the Learning and Administration nested tabs using the same workflow-sequence test. Accountability should remain a distinct cross-cutting lane unless the product owner explicitly approves moving it under Administration. The two department maintenance surfaces should remain separate but cross-linked because they solve different problems: readiness confirmation and pole assignment versus CPD label reconciliation.
