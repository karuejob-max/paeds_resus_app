# Individual-to-Registered-Facility Linking

**Owner:** Manus
**Branch:** `feat/account-facility-linking-e2e`
**Migration reservation:** `0124`
**Status:** In progress
**Execution tracking:** Update `docs/INDIVIDUAL_FACILITY_LINKING_EXECUTION_PLAN.md` when a task is started or completed.

## Goal

Allow an authenticated individual provider to link their account to a facility that is already registered to an institutional account, without creating a second user type, bypassing institution approval, or granting IERS duties automatically.

The complete workflow is:

> **Provider selects an institution-owned facility → submits an explicit link request → institution administrator reviews → approval atomically activates general institutional membership and the institution-scoped staff link → provider sees the decision and can continue through separate duty/role acceptance flows.**

## Non-goals

This initiative does not create a new user/account type, automatically assign IERS product roles, appoint an ERCo, assign UTL/ERTL/ERT members, publish an ERT, sign readiness, or infer employment from a Care Signal facility selection. It does not replace the existing invitation-acceptance path or the CPD-derived facility relationship path.

## Existing contracts to preserve

- `users` remains the identity table. Individual users can hold institution memberships without being converted into institutional accounts.
- `careFacilities.institutionalAccountId` is the authoritative ownership link for institution-owned facilities.
- `institutionMemberships` is the access contract. A provider is operationally institution-linked only when the membership is `active`.
- `institutionalStaffMembers` remains the institution’s operational roster and retains the `facilityLinkStatus` lifecycle.
- IERS access remains separately gated by product role, account scope, canonical department/pole, dated assignment, and provider acceptance.
- Institution administrators are authorized through the existing institution access helper and multi-admin table.
- Rejected, suspended, ended, and removed relationships remain fail-closed. Approval must not silently restore a removed relationship.
- The emergency bedside path is not changed.

## Proposed data contract

Use an additive `facilityMembershipRequests` table rather than overloading provider profile fields or treating a staff row as a complete request record. The request stores:

- the requesting `userId` and normalized email/name snapshot;
- the exact `careFacilityId` and `institutionalAccountId` selected by the provider;
- optional canonical `facilityDepartmentId` and historical department label;
- request relationship (`permanent_staff` or `locum_outreach`);
- lifecycle status (`pending`, `approved`, `rejected`, `withdrawn`);
- review actor, timestamp, and reason;
- linked `staffMemberId` and `membershipId` when materialized.

A database uniqueness rule prevents more than one pending request for the same user and institution. The approval transaction must validate that the facility still belongs to the institution before writing any access row.

## Required server behavior

1. **Provider request:** authenticate the user, load the canonical facility, require `careFacilities.institutionalAccountId`, reject system/community facilities, reject inactive/removed/suspended/ended relationships, and upsert one pending request.
2. **Provider status:** return only the requesting user’s requests, joined to facility and institution display data, plus active/pending memberships needed by the provider UI.
3. **Provider withdrawal:** permit only the request owner to withdraw a still-pending request.
4. **Admin queue:** return only requests for institutions the signed-in user administers.
5. **Admin approval:** in one transaction, revalidate facility ownership, create or activate one general membership, create or update one institution staff row, mark the request approved, write an existing institution action-log record, and create an in-app notification. Do not create IERS roles or duties.
6. **Admin rejection:** mark the request rejected with a required reason, leave active access unchanged, write an audit record, and notify the provider.
7. **Compatibility repair:** update the existing self-registered `approveStaffFacilityLink` path so that when it approves a provider-backed pending row it also materializes the corresponding general membership atomically. Existing invited and CPD paths must remain compatible.

## Required UI behavior

- Provider-owned surface: add a clear **Facility relationships** card to `/records` or the provider profile. It must distinguish profile facility selection from an institutional link request, show `Pending`, `Active`, `Rejected`, and `Withdrawn`, and provide explicit request/withdraw controls.
- Facility picker: expose whether a search result is institution-owned. Selecting a facility still updates the profile for care-delivery context, but must not silently submit an institutional membership request.
- Institution surface: keep review inside the canonical `/institution` Administration → Access & links tab. The queue must show facility, institution, provider identity, department, relationship, and current status, with reason-required rejection.
- Provider feedback: show approval/rejection notifications with a reachable link back to `/records`.
- Copy must state that general facility membership does not create an IERS duty.

## Acceptance criteria

- A provider can request a link to an institution-owned facility without an existing CPD record or administrator invitation.
- A provider cannot request a link to a community or system facility.
- A provider cannot see another provider’s requests or another institution’s queue.
- Duplicate clicks produce one pending request.
- Approval is idempotent and leaves exactly one active general membership for the institution/email identity.
- A provider whose request is approved becomes eligible for downstream institution membership checks, but not for IERS duty assignment until the existing role, scope, department, assignment, and acceptance rules are satisfied.
- Rejection requires a reason and does not create membership.
- Withdrawal is available only while pending and does not alter unrelated active memberships.
- Admin approval of the legacy pending staff-link queue no longer leaves the provider in the false state `facilityLinkStatus=linked` with no active membership.
- All new database writes are transactional, auditable, and covered by focused tests.
- The final PR is created from freshly synchronized `main`, passes CI, includes the production migration command, and records the handoff in `WORK_STATUS.md`.

## Collision boundaries

High-collision files are `drizzle/schema.ts`, `package.json`, `docs/WORK_STATUS.md`, and `AGENTS.md`. This initiative reserves migration `0124`, keeps the implementation in a new router/service/test/component set where possible, and will re-fetch `origin/main` before PR creation and again before merge. Any changes landed by other agents on shared files will be reviewed and reapplied deliberately rather than trusting a conflict-free merge.
