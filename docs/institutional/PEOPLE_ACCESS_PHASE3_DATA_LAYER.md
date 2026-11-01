# People & access Phase 3 data layer

This phase is additive and has no schema or migration changes.

## Source decisions

- Department Head appointments use the new read-only `institutionAccountability.listDepartmentHeadAppointments` procedure. It deliberately keeps the existing `listDepartmentHeads` output unchanged, uses the same `getCredentialAccess` gate and department scope, and includes pending/active/declined rows by default; ended rows require `includeEnded: true`.
- ERCo register data uses `institution.getInstitutionIersDutyAssignments`. That existing read procedure returns institution-scoped department IDs, holders, names/emails, status, acceptance/decline fields, and both primary `erco` and official `deputy_erco` rows. `assistant_erco` is a legacy backup assignment and is not treated as the Deputy ERCo slot. The role register therefore leaves legacy assistant rows out of the nine canonical slots.
- `institutionLearning.listEducationCoordinators` was verified to return all institution rows, including `pending_acceptance` and `declined` primary/deputy statuses. It was not changed; its existing output remains the source for the two CPD department slots.

The pure register composer ignores ended rows, gives an active row precedence over a pending row while preserving lower-priority holders in `others`, and marks dependent slots `unavailable` when their query source is unavailable. Department labels are produced by the existing shared canonical hierarchy helper.
