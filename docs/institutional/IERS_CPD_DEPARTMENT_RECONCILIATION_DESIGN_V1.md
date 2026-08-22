# IERS–CPD Department Reconciliation and Pole Eligibility Design v1

**Status:** implementation design for migration 0115  
**Owner:** Job Karue, Paeds Resus  
**Date:** 2026-08-23

## Purpose

The Institutional Portal uses one broad preset department catalog for CPD and provider profiles, while IERS uses an institution-confirmed local department registry. These are related but not identical concepts. CPD must be able to record a valid professional-development department even when that department does not operate an IERS response pole. Pharmacy is the expected example: it is valid for CPD reporting, but it must not generate a missing-pole warning unless an authorised administrator explicitly marks it as pole-required.

The workflow therefore has two separate decisions:

1. **CPD label reconciliation:** an account administrator reviews historical CPD labels that are custom, misspelled, or otherwise not linked to a local canonical department. The administrator may map the label to an existing local department or create one from the shared catalog (or explicitly create a genuine custom exception). The raw `cpdAttendees.department` text is never overwritten.
2. **IERS operational eligibility:** an account administrator explicitly marks a confirmed, active local department as `requiresPole=true` when it participates in the IERS operational network. Only such a department can produce a missing-pole alert. IERS Leads allocate poles; they do not decide CPD reconciliation and cannot rewrite CPD records.

## Persistent model

Migration `0115` adds `facility_departments.requires_pole`, defaulting to `false` for all existing and new rows. This fail-closed default prevents historical departments such as Pharmacy from creating false readiness alarms. The current pole assignment is preserved during migration and is not silently removed if a department is later marked as not required; the new flag controls whether a department is eligible for missing-pole alerts and future pole allocation.

A current-state `institution_department_reconciliations` row is maintained per institution and normalized historic CPD label. It records the review status (`open`, `mapped`, `deferred`, or `dismissed`), the selected local department when mapped, the high-confidence catalog suggestion if one exists, attendance count, and first/most-recent use timestamps. The raw label remains stored separately in every CPD attendee row.

An append-only `institution_department_audit_events` table records mapping, defer, dismiss, reopen, backfill, and pole-eligibility decisions with actor, reason, previous/new state, selected department, and the number of CPD rows backfilled. The current decision row may change as a review is reopened or corrected; audit events are never updated or deleted by the application.

## Suggestion safety

The system never auto-writes a fuzzy match. A suggestion is marked high confidence only when the raw label exactly resolves to one shared preset label or exactly matches an unambiguous shared-catalog alias. Ambiguous or token-overlap candidates are displayed as manual review options only. A label with no safe match remains an explicit review item and may be mapped to a genuine custom local department after the administrator provides a reason.

## Manual sync behavior

The account administrator must choose the target local department explicitly. The target must belong to the same institution and be active. A target can be an existing row or a new department created in the same action. New catalog departments are canonicalized through `shared/clinical-departments.ts`; a non-catalog target requires an explicit custom-exception acknowledgement and a reason.

The administrator chooses whether to backfill existing attendance. If selected, the server updates only `cpdAttendees.facilityDepartmentId` for rows in the same institution whose canonical identity is currently null and whose trimmed, case-insensitive raw label belongs to the reviewed label group. It never updates `cpdAttendees.department`, names, emails, dates, certificates, or event ownership. If backfill is not selected, the reviewed decision is still recorded and future registrations can use the selected canonical identity; historical rows remain untouched and visibly unbackfilled.

Defer and dismiss are workflow decisions, not data deletion. Reopen returns a reviewed item to `open` without changing any CPD row. Mapping an item again is permitted only through the same explicit target-and-reason flow and appends another audit event.

## Authorization boundary

All procedures live in a dedicated institution-scoped router and use `protectedProcedure`, never the generic unscoped `adminProcedure` analytics router. Account-admin scope is required for reconciliation reads, manual mapping, backfill, defer/dismiss/reopen, and `requiresPole` changes. The institution ID is checked on every read and mutation.

The IERS missing-pole query requires the IERS product read entitlement and an active `iers_coordinator` (IERS Lead) or `iers_governance` role, with the existing institution-admin bypass. It returns department-level operational state only. An IERS Lead cannot reconcile CPD labels or backfill CPD identity. Pole assignment remains protected by the existing IERS department-governance role check and now only applies to confirmed active departments explicitly marked `requiresPole=true`.

## Alert semantics

The Administration panel shows unresolved custom/mismatched CPD labels with attendance count, latest use, safe suggestions, current review status, and explicit actions. The panel explains that a valid CPD department does not automatically become an IERS pole department.

The IERS setup panel shows a missing-pole alert only for a department satisfying all of the following conditions:

- `facility_departments.is_active = true`;
- `facility_departments.confirmed_at IS NOT NULL`;
- `facility_departments.requires_pole = true`; and
- `facility_departments.pole_id IS NULL`.

The alert disappears when a pole is allocated, the department is deactivated/unconfirmed, or an account administrator turns off `requiresPole`. No CPD attendance volume, provider cadre, catalog membership, or custom-label count can create a pole alert.

## Deployment and compatibility

The feature is delivered through a protected feature branch and PR. The migration is idempotent and registered in the guarded `db:apply-iers` sequence as `0115`; the strict verifier checks the new column and tables. Application reads include a deployment-order fallback where appropriate so a code deploy before the production migration fails closed for new mutations rather than silently rewriting legacy data. Production migration execution remains a separate, explicit Render Web Shell action requiring fresh confirmation; no pilot drill or production smoke data is needed for this feature.
