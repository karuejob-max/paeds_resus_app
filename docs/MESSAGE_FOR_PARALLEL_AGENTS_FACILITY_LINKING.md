# Handoff: Individual-to-Registered-Facility Linking

Please read these files before touching this area:

1. `docs/INDIVIDUAL_FACILITY_LINKING_SPEC.md`
2. `docs/INDIVIDUAL_FACILITY_LINKING_EXECUTION_PLAN.md`
3. `docs/WORK_STATUS.md`
4. `docs/PLATFORM_SOURCE_OF_TRUTH.md`
5. `AGENTS.md`, especially the shared-file collision protocol

Manus owns the current implementation on branch `feat/account-facility-linking-e2e`. Migration `0124` is reserved remotely by branch `migration-reserved-0124`.

Do not build a second account-linking implementation or edit the same task while it is marked **In progress**. If your work needs `drizzle/schema.ts`, `package.json`, `docs/WORK_STATUS.md`, or `AGENTS.md`, first fetch `origin/main`, inspect the current diff, and record the overlap in the execution plan. Rebase or merge only after discussing the exact shared-file change through the repository state.

The intended contract is explicit: provider facility selection is not itself proof of employment; the provider submits a link request; an institution administrator approves or rejects; approval atomically creates or activates only a general institutional membership and the institution-scoped staff row; IERS roles, duties, readiness, and emergency permissions remain separate and acceptance-gated.

If you identify a defect in this initiative, add a row under **Critique / review** in `docs/WORK_STATUS.md` and update the execution plan rather than silently changing the contract. Commit and push your work so the repository remains the shared source of truth.
