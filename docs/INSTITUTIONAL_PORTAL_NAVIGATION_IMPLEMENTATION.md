# Institutional Portal Navigation Redesign

## Goal

Reduce repeated institutional headers and long scrolling by making one collapsible vertical navigation the authoritative way to move between institutional workspaces and their operational children.

## Navigation authority

The authenticated `/institution` workspace now uses one left-side navigation with these prioritized areas:

| Area | Responsibility | Child navigation |
|---|---|---|
| Home | Attention items, roster metrics, completion summary, and next competency session | Guides remain discoverable as Home children |
| Readiness | IERS operations | Command centre, evidence, drills, team setup, equipment, plan, executive snapshot |
| Learning | Institutional learning operations | Learning overview, cohorts and competency, CPD sessions, reports and insights, people and targets, Institutional Life Support |
| Accountability | Shared responsibility and evidence | Dedicated accountability view |
| Administration | People, products, programmes, and support | Overview, People & access, Products & billing, Programme operations, Data & support |
| Connected services | Connected-system governance | Dedicated connected-services view |

The active section and child state remain URL-addressable through the existing query parameters. Existing access checks, product locks, institution selection, and redirects are preserved.

## Removed duplication

The workspace no longer renders the repeated top action row for IERS guide, Learning guide, Institutional Life Support, and Administration. Those destinations remain available as navigation children. The three large product-launcher cards are removed from the workspace top, and the Home panel no longer repeats Readiness, ILS, Learning, and Administration as a second operating-lane menu. Learning and Administration no longer render their top-level tab strips when controlled by the shared shell. The Administration overview no longer repeats its four lane-launcher cards.

The content panels remain responsible for task-specific forms, tables, reports, and safeguards. This is an information-architecture change, not a rewrite of IERS, CPD, payment, staff, certificate, or clinical logic.

## Mandatory DoD audit

This work also updates `AGENTS.md` so that a task cannot be treated as done without all of the following:

1. A requirement-to-implementation audit after coding.
2. A check that previously working behavior was not regressed.
3. Authenticated account verification for changed learner or institutional workflows, or an explicit documented blocker when that cannot be performed.
4. A second re-audit after account verification and before opening or merging the protected PR.
5. The remaining gaps, assumptions, and account-verification evidence recorded in `WORK_STATUS.md`.

## Pre-merge audit checklist

| Requirement | Evidence / status |
|---|---|
| One collapsible vertical institutional navigation | Implemented in `InstitutionWorkspace.tsx`; type-check and build passed |
| No duplicate top action row | Implemented and checked in diff |
| No duplicate product launcher grid | Implemented and checked in diff |
| Home is task-focused | Duplicate operating-lane cards removed; attention and metrics retained |
| Learning child destinations remain reachable | Vertical navigation retains all existing learning destinations |
| Administration child destinations remain reachable | Vertical navigation controls the existing administration tabs |
| URL state remains addressable | Existing `section`, `iersTab`, `learningTab`, and `adminTab` contracts preserved |
| Institution authorization remains enforced | Existing server-backed workspace access and role checks unchanged |
| Payment and clinical safeguards remain unchanged | No server, schema, payment, or clinical files changed |
| Authenticated account verification | Required before protected merge; route and result to be recorded in `WORK_STATUS.md` |
| Final post-account re-audit | Required before protected merge |

## Validation completed so far

- `pnpm exec tsc --noEmit` — passed.
- `pnpm run build` — passed.
- `pnpm run check` — passed.
- Unit suite — passed, 194 files and 978 tests.
- `git diff --check` — passed.

The generated audit-date files from repository checks were reverted and are not part of this feature.

## Remaining before merge

The authenticated user account must be used to verify the affected institutional route and authorization state before merge. The final requirement-to-code audit must then be repeated, with the account result and any limitation recorded in `docs/WORK_STATUS.md` before protected review is merged.

Author: Manus AI
Date: 2026-09-16

## References

No external references were required; this document records repository-local design and validation evidence.
