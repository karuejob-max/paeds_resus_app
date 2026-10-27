# Institutional Staff 360 — Access Matrix V1

**Status:** Implemented read-only V1 · **Scope:** Administration → People & Roles

Institutional Staff 360 is not Platform Admin User 360. It is an institution-scoped operational record assembled at read time from existing authoritative membership, roster, training and CPD tables.

## Access rules

| Actor | Scope | Access |
|---|---|---|
| Platform admin | Selected institution | Institution-wide read; access is logged |
| Institution owner/admin | Their institution | Institution-wide read; other institutions are never returned |
| Active IERS chair, governance, coordinator, reviewer or viewer | Their institution | Institution-wide read |
| Active CPD coordinator, reviewer, reporter or viewer | Their institution | Institution-wide read |
| Departmental Head or active deputy | Appointed department(s) only | Read only; canonical department match required |
| Active ERCo/deputy or Department Education Coordinator/deputy | Appointed department(s) only | Read only; canonical department match required |
| Provider/member without one of the above authorities | None | Denied |

## Returned fields

- Identity needed for institutional operations: name, institution email, phone, cadre/provider type.
- Current institutional roster: staff role, designation, governance role, department, link status, training and institutional certification states.
- Institution membership: status, responsibility role, invitation/acceptance/end dates.
- Institution product roles assigned to the person.
- CPD attendance belonging to the selected institution only.
- Open administrative/training follow-up signals.

## Excluded fields

Other institution relationships, platform payment history, passwords, login metadata, private clinical narratives, platform risk/support notes, and unsupported competence/licensure claims are not returned.

## Safety contract

A course, attendance record, certificate, roster assignment, or accepted duty remains a separate evidence state. Staff 360 never produces a composite readiness score, competence judgement, licensure decision, dispatch authority, or clinical performance rating. Access is server-authorized and logged through the existing sanitized admin audit stream.

## V1 boundary

The page is read-only. Mutations remain in their existing governed workflows. A future field-level review/mutation phase must preserve tenant isolation, department scope, reason-required changes, staff notification where appropriate, and append-only audit evidence.
