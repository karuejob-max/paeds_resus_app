# NERP Verification and Learning/CPD Simplification Audit

## Scope

This audit covers the existing NERP external-completion verification and suppression preview, plus the institutional Learning/CPD workspace surfaces. Promotional email delivery remains disabled; all campaign work is preview-only and paused.

## NERP findings

The current admin NERP screen verifies Phase 2 and Phase 3 only through a `nerp_offer_enrollments` ledger. This means an administrator cannot create a verified external-completion case for a person who completed training outside the NERP offer pathway or who has not registered. The existing verification table is correctly phase-specific, but it is structurally tied to the offer ledger.

The current campaign preview derives suppression ad hoc from four conditions: a completed NERP offer, two verified external phases on a NERP offer, verified external BLS and ACLS credentials, or a hard-coded name set. The name set is too blunt and not durable: it cannot distinguish exact identity variants safely, cannot represent an unregistered person, and does not produce a persistent audit record. The requested named exclusions must therefore be stored as precise, normalized suppression records and applied by email first, with exact-name matching only when explicitly recorded by an administrator.

The requested records are handled as follows: `thrsmwaniki@yahoo.co.uk` is an email-keyed suppression; `Esther Wairimu Mwangi` is a precise name suppression and must not match `Esther Mwangi`; `Annet Muthoni Kingori` is an explicit suppression; and `emma githaka` is a name-keyed suppression that remains effective even when no platform account exists. No email is sent as part of this work.

## Learning/CPD findings

The institutional Learning workspace already has four high-level tabs: Learning overview, Cohorts & competency, CPD Portal, Intelligence & reports, and Coordinators & targets. The CPD Portal then introduces a second navigation layer with Overview & Analytics, Sessions & Check-In, Staff Development, Certificates & Exports, Open New Session, and Coordinator & Settings.

There are two competing CPD session creation flows. `InstitutionLearningGovernancePanel` uses the newer `institutionLearning.createSession` procedure with audience classification, department IDs, co-presenters, and department-aware authorization. `CpdPanel` uses the older `cpd.openEvent` procedure under `Open New Session`, which is institution-scoped and does not carry the same department-scoped creation contract. The newer flow is the safer canonical session-creation path.

Coordinator authorization is already department-aware in the backend: `listDepartments`, `listEducationCoordinators`, session creation, session people, targets, and dashboards use assigned department IDs for education coordinators and department heads. The UI defect is in `InstitutionLearningGovernancePanel`, which loads all linked institutional staff and presents them as candidates regardless of the selected department. The candidate list must be filtered to the selected department before assignment; the backend must also validate that the selected user belongs to that department.

Staff Development and Intelligence & reports are related but distinct. Staff Development is an appraisal follow-up view; Intelligence & reports is aggregate analysis and export. They should not be presented as competing CPD creation areas. Staff Development belongs under a protected `People and follow-up` area, while reporting belongs under `Reports and insights`. Individual names/contact details must remain restricted by the existing role and department-scope rules.

## Simplified portal information architecture

The institutional Learning workspace should use one coherent navigation model:

1. **Overview** — learning status, active work, and clear links to the next operational action.
2. **Readiness and cohorts** — IERS institutional competency, cohort enrolment, readiness evidence, and review. This remains separate from CPD.
3. **CPD sessions** — one canonical session-creation flow, open-session QR/check-in, session list, attendance, and certificates/exports.
4. **People and targets** — department-scoped coordinators, learning targets, and protected staff-development follow-up.
5. **Reports and insights** — aggregate intelligence, department comparisons, target progress, and report export.

The legacy `Open New Session` tab should no longer be an independent creation route. It should redirect to or be replaced by the canonical department-aware session form. The institution-level CPD signature setting should remain accessible under CPD administration but should not compete with coordinator assignment.

## Implementation boundary

The NERP change will add a separate external-completion case model and durable suppression model, leaving offer payment rules unchanged. The CPD change will first correct department-scoped candidate selection and backend validation, then consolidate the UI around the existing modern session procedure. IERS competency and NERP programme rules will not be changed except for the additive external verification and suppression controls explicitly requested here.
