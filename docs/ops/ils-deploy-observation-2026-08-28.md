# ILS production deployment observation — 2026-08-28

## Scope

This record documents the production schema rollout for the Institutional Life Support operational-readiness release. It covers the additive/idempotent migration `0141` and its read-only verifier only. No institution, provider, learner, payment, certificate, cohort, or clinical test record was created.

## Code and deployment

The operational-readiness implementation was squash-merged through protected PR [#664](https://github.com/karuejob-max/paeds_resus_app/pull/664) as `62419c301a67a45ee44bddae54d00e7f5506f9b5`. The separate WORK_STATUS handoff was merged through PR [#666](https://github.com/karuejob-max/paeds_resus_app/pull/666) as `f4cd704859c833fabd3178327f99573b7ad5dca9`. During rollout, the first migration attempt correctly stopped before changing the database because `ilsPracticalAssessments` was absent and the original script attempted to alter it before creating the operational tables. Corrective PR [#670](https://github.com/karuejob-max/paeds_resus_app/pull/670) moved the existing `CREATE TABLE IF NOT EXISTS` block before all dependent `ALTER TABLE` operations and squash-merged to `origin/main`. Render then reported the corrective deployment live for commit `2a1356f`.

## Authorized production commands

The following commands were entered in the authorized Render Web Shell for the `paeds_resus_app` production service:

```text
pnpm run db:test-connection
pnpm run db:apply-0141
pnpm run db:verify-0141
```

## Results

`pnpm run db:test-connection` returned:

```text
OK — database accepts this DATABASE_URL.
```

`pnpm run db:apply-0141` returned:

```text
[0141] Applying ILS operational controls...
[0141] institutionLearningTargets.courseProgramType includes paeds_resus_ils.
[0141] ILS operational controls ready.
```

`pnpm run db:verify-0141` returned 24 read-only passes:

```text
[0141 verify] PASS — enrollments.activatedAt
[0141 verify] PASS — enrollments.lastActivityAt
[0141 verify] PASS — enrollments.cognitiveModulesCompletedAt
[0141 verify] PASS — institutionalTrainingOrders.orderStatus
[0141 verify] PASS — institutionalTrainingOrders.deliverySessionId
[0141 verify] PASS — institutionalTrainingOrders.capacityConfirmed
[0141 verify] PASS — institutionalTrainingOrders.practicalDateConfirmed
[0141 verify] PASS — institutionalTrainingOrders.paymentReceiptReference
[0141 verify] PASS — institutionalTrainingOrders.rosterConfirmed
[0141 verify] PASS — ilsReminderEvents.status includes sending
[0141 verify] PASS — institutionalTrainingOrderProviders.assignmentStatus
[0141 verify] PASS — institutionalTrainingOrderProviders.replacedAt
[0141 verify] PASS — institutionLearningTargets.courseProgramType includes paeds_resus_ils
[0141 verify] PASS — ilsOperationalCases.slaDueAt
[0141 verify] PASS — ilsOperationalCases.firstResponseAt
[0141 verify] PASS — ilsPracticalAssessments.checklistVersion
[0141 verify] PASS — ilsPracticalAssessments.assessorCalibrationConfirmed
[0141 verify] PASS — ilsPracticalAssessments.secondAssessorUserId
[0141 verify] PASS — ilsDeliverySessions table
[0141 verify] PASS — ilsPracticalAssessments table
[0141 verify] PASS — ilsReminderEvents table
[0141 verify] PASS — ilsOperationalCases table
[0141 verify] PASS — ilsPilotCohorts table
[0141 verify] PASS — ilsPilotMetrics table
[0141 verify] All operational-schema checks passed; 24 checks; no write was performed.
```

The Node `DEP0123` TLS ServerName warning appeared during the commands and was non-blocking. An earlier `pnpm rub db:verify-0146` line in the operator paste was a typo and failed with `Command "rub" not found`; it was unrelated to ILS and was followed by successful read-only verification of migrations 0146 and 0136.

## Post-rollout boundary

Migration `0141` is now production-applied and verified. This does not constitute clinical-effectiveness evidence, regulatory approval, or AHA credential issuance. The named clinical and operations owners must still review the ILS governance and pilot runbook, and any pilot must use the encoded capacity, assessment, support, and two-cohort acceptance gates. No authenticated smoke test that creates a cohort, payment, learner, certificate, or operational record was performed.
