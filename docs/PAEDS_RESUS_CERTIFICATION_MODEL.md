# Paeds Resus Universal Certification Model

**Status:** Active engineering contract  
**Scope:** IERP, NERP, and Paeds Resus Open Enrolment Pathway  
**Owner:** Paeds Resus

## Purpose

Paeds Resus issues two universal completion credentials from authoritative training records. The credentials are the same regardless of whether a learner entered through the Intern Emergency Readiness Program (IERP), the Nurses Emergency Readiness Program (NERP), or the self-funded, non-cohort **Paeds Resus Open Enrolment Pathway**.

These credentials are Paeds Resus completion credentials. They do not replace or impersonate official AHA certificates. Official AHA certificates remain separately stored and downloadable through the existing AHA certificate flow.

## Certificate types

| Completion point | Certificate title | Issuance condition | Validity |
|---|---|---|---|
| Phase 2 | **Paeds Resus Phase 2 — Online Simulations** | All required named simulation roles are confirmed by an instructor or approved through the existing retrospective-claim review, or NERP Phase 2 external evidence is verified. | Milestone record; no expiry |
| Phase 3 | **Paeds Resus Certified BLS Provider**, **Paeds Resus Certified ACLS Provider**, **Paeds Resus Certified PALS Provider**, or **Paeds Resus Certified NRP Provider** | The corresponding provider pathway has completed its existing cognitive and practical sign-off gates, or the NERP Phase 2 and Phase 3 external verification pair is approved. | Two years, using the existing certificate expiry policy |

## Authoritative evidence

Phase 2 completion is calculated from the existing confirmed named-role source: three confirmed team-leader sessions and one confirmed session in each of the six named team-member roles. A booking alone does not count. Generic legacy `team_member` rows do not satisfy the named-role rule.

Phase 3 provider certificates are additive projections. They are issued only after the existing AHA enrollment completion source is complete, or after both NERP external phases have been verified. Certificate issuance cannot bypass payment, cognitive, practical, instructor, or external-review requirements.

## Entry paths

| Internal key | User-facing name | Meaning |
|---|---|---|
| `ierp` | **IERP — Intern Emergency Readiness Program** | Intern-designation, subsidized programme path |
| `nerp` | **NERP — Nurses Emergency Readiness Program** | Nurse-specific programme path |
| `open_enrolment` | **Paeds Resus Open Enrolment Pathway** | Individual, self-funded, non-cohort pathway; not a subsidized programme |

The pathway is audit metadata on the shared certificate record. It does not grant institutional membership, IERS roles, responder permissions, or facility access.

## Storage, verification, and privacy

Universal certificates use the existing `certificates` ledger and existing authenticated owner-only PDF download route. `sourceKey` is a stable unique idempotency key, preventing duplicate certificates when completion triggers are retried or a learner opens a dashboard after completion. The public verification route requires the certificate number and recipient name; private evidence files are not exposed by certificate verification.

`professionalCredentials` receives read-only derived credential rows for profile and institution compliance views. It must never be treated as a substitute for the authoritative completion records.

## Operational safeguards

Certificate generation is additive and fail-safe. A failure to render the additional Paeds Resus certificate must not undo an existing authoritative AHA completion or NERP verification. The learner dashboard provides an idempotent synchronization action so an eligible certificate can be recovered without creating a duplicate.

No promotional email is part of certificate issuance. Promotional campaign infrastructure remains paused and send-disabled.
