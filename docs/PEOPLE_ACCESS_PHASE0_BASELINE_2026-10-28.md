# People & Access Redesign — Phase 0 Baseline

**Date:** 2026-10-28  
**Baseline:** `origin/main` at `2b6b9556` (`ACLS case-definition framework, generated adversarial harness, ordering and poor-choice scoring`)  
**Scope:** Repository-only baseline and contract verification. No application, schema, or production-data changes.

## Findings reproduced on current main

- Hand-written `adminTab=` / `peopleTab=` URL construction still exists in server and client code; the shared location resolver and drift guard are not yet the single enforced path.
- `InstitutionPeopleRolesPanel.tsx` already contains assignment selection state (`assignmentDepartmentId` and `selectedAssignmentStaff`), so Phase 2 must preserve and test the split state rather than recreate it.
- `PEOPLE_JOURNEY_STEPS` exists in `InstitutionAdministrationPanel.tsx`; Phase 3 should consolidate the journey contract rather than introduce a competing constant.
- `listDepartmentHeads` exists in the server accountability router and is consumed by the accountability and People & Roles surfaces.
- `BulkStaffImport`, `StaffList`, `AddStaffForm`, and `RoleManagement` exist as components. Their reachability must be proven before deletion or relocation; they are not safe to label dead code from filename search alone.
- `getStaffMembers` returns the institution roster without server-side pagination. The roadmap's server-pagination item remains deferred and explicitly out of scope for this redesign unless separately approved.

## Governance semantic decision

The data model distinguishes three ERCo-related concepts:

1. **ERCo** — the standing department governance champion.
2. **Deputy ERCo** — the official optional secondary governance appointment, with its own user, acceptance/decline state, and lifecycle fields.
3. **Assistant ERCo** — a legacy backup field and historical compatibility surface. It must remain readable for old records but must not be presented as a new third overlapping appointment.

The redesign will therefore expose **ERCo + optional Deputy ERCo** as the official People & Access role model and preserve **Assistant ERCo** only as a clearly labelled legacy/history state.

Departmental Head and Institutional CPD Coordinator assignments also support explicit `primary` and `deputy` assignment roles. Assignment and end semantics must be verified in their dedicated procedures before the Role Register phase is merged.

## Validation boundary

- `git status`: clean protected-main checkout; local backup branch retained for the preceding department command-centre work.
- `pnpm run check`: blocked before execution by Corepack attempting to download pnpm 10.4.1; network access failed with Windows `EACCES`. This is an environment/tooling failure, not a code result.
- `pnpm run test:unit`: same Corepack/network block.
- `pnpm run build`: same Corepack/network block.
- Local-binary equivalents completed: `node node_modules/typescript/bin/tsc --noEmit` — PASS (177.6s); direct Vitest — BLOCKED by Windows/esbuild `Cannot read directory "../..": Access is denied` while resolving `vitest.unit.config.ts`; direct Vite build — BLOCKED by the same Windows/esbuild path-permission error while resolving `vite.config.ts`.

## Phase 0 acceptance

Phase 0 is complete as a baseline only when this record, `docs/institutional/PEOPLE_ACCESS_REDESIGN_EXECUTION_PLAN.md`, the backlog rows, and the current-state/deep-audit references are merged. It does not claim the redesign is implemented. Unit/build execution remains a documented Windows environment blocker and must be rerun in protected CI or a clean local environment before implementation PRs are treated as fully validated.

**CEO sign-off:** pending.
