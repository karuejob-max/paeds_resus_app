# CPD Portal Remediation Contract

**Status:** Implementation in progress  
**Owner:** Manus  
**Branch:** `feat/cpd-portal-remediation`  
**Migration reservation:** `0142` (`migration-reserved-0142`); 0140 was already claimed by concurrent ResusGPS work.  
**Date:** 27 August 2026

## Product boundary

The CPD Portal records continuous professional development activity. It does not prove emergency readiness, bedside competence, IERS duty acceptance, or patient-care performance. CPD, IERS, NERP, IERP, AHA, Fellowship, Care Signal, and ResusGPS metrics remain separate products and sovereign data streams.

## Canonical CPD lifecycle

Every new institutional CPD session follows:

> **Draft → Scheduled → Open → Attendance review → Closed → Certificates issued → Archived**

A session may be cancelled before attendance is verified. A session with registrations, check-ins, attendance decisions, or certificates must never be hard-deleted. A void action is exceptional, requires a reason, preserves the record, and is auditable.

Multiple sessions may coexist. Registration and QR links always identify one exact event; opening one session must not close an unrelated department’s session. Check-in codes are event-specific and may be rotated only while the event remains active; code changes are audited.

## Attendance source of truth

Registration is not attendance. New and migrated attendance records use an explicit state: `registered`, `checked_in`, `attendance_verified`, `excused`, or `cancelled`. CPD points, certificate issuance, participation rates, and target progress count only `attendance_verified` records. A manual correction requires a reason and append-only audit event. Review transitions are forward-only after `attendance_verified`, `excused`, or `cancelled`; the same-status update is idempotent, but a terminal decision cannot be silently reversed.

Existing records remain readable. During migration, historical rows receive a compatibility state only where the existing record is sufficiently clear; uncertain legacy rows are flagged for review rather than silently upgraded to verified attendance.

## Identity and participant rules

Institutional presenters, co-presenters, and audience selections use active institution members. The UI provides a searchable combobox and each result includes full name, department, cadre, and email for disambiguation. The server accepts selected member IDs and re-resolves identity, cadre, email, and department from the canonical member directory.

Guest presenters are an explicit exception with organization and verification notes. A guest is never silently represented as an institutional member. Historical presenter text remains readable but is not a trusted identity source for new or edited records.

## Audience eligibility

Sessions store structured audience scope: facility-wide, department, cadre, or explicit member invitation. The selected scope is enforced server-side at registration/check-in. A session’s descriptive label never overrides its eligibility rule.

## Targets and reporting

Targets are revisioned and uniquely active for the same institution, scope, subject, metric, period, course, and phase. Institution administrators manage target definitions. Department coordinators view and act within assigned departments. Reports show the period, denominator, source, data-quality flags, current value, target, gap, percentage, trend, and status.

Reports and exports use stable `userId` identity where available, fall back to exact normalized email only for historical records, and never merge ambiguous people by name alone. Contact-inclusive exports require the appropriate permission and are audited.

## Privacy and authorization

Department coordinators see only assigned departments. Institution administrators may see institution-wide details under existing institutional authorization. CPD activity does not grant IERS permissions or emergency duties. Analytics must use the same active institution-member directory used by People & targets and session participant selection.

## Certificate and export rules

Certificates are issued only from `attendance_verified` records after the session is closed. Issuance is idempotent. Changing points, approving council, audience, or presenter after verified attendance requires a revision reason and preserves the previous version. CSV/ZIP exports record actor, institution, period/event scope, row count, and timestamp.

## No-send and clinical safety rules

This remediation does not send promotional email. Existing campaign governance remains preview/paused only. No clinical bedside flow is changed. No CPD record may be presented as emergency competence or IERS readiness evidence.

## Definition of done

- The contract is implemented by one canonical Learning/CPD write path; legacy routes are compatibility adapters only.
- Attendance, certificate, lifecycle, identity, scope, target, report, correction, export, and code-rotation contracts are enforced server-side.
- Searchable presenter selection shows department/cadre/email disambiguation and does not require free-text identity.
- Existing NERP, IERP, IERS, AHA, Fellowship, and historical CPD behavior remains compatible unless explicitly covered by this contract.
- Focused tests, unit tests, build, migration syntax/idempotence checks, and protected CI pass.
- Production migration is applied only after explicit user confirmation and is followed by read-only verification.
- `docs/WORK_STATUS.md` records the merge commit, production verification output, and CEO sign-off status.
