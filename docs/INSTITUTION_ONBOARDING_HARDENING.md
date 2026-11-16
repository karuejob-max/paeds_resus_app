# Institution onboarding hardening

Source: institutional onboarding audit (see the audit document). This file tracks the fix plan and the decisions taken.

## Decisions (owner-approved)

1. Institutions must be verified before they can receive provider link requests or see provider profiles (evidence: uploaded letterhead, facility-domain email, or platform-admin verification). One claim per KMHFL facility id, with a dispute route.
2. Admin grants (including the second admin at registration) require the invitee's acceptance, notify existing admins, and are recorded in an audit table.
3. Attending a CPD event no longer auto-activates institution membership; it creates a request unless the institution opted into auto-link.

## PR A (this change) — no migration

- `institution.runResusGpsAudit` and `institution.importResusGpsAuditAction` now require `assertInstitutionAccess` (institution admin or platform admin). Previously any signed-in user could read another institution's audit (and trigger LLM spend) or write items into its action log. Import text is now length-bounded and always records the actor.
- The audit only reads cases of staff whose roster row is `linked` and not removed (it previously included pending, rejected and removed rows).
- `institution.searchPlatformAccounts`: per-user rate limit (40/minute, 400/day, in-memory like the Safe-Truth limiter) and emails are masked unless the caller typed the complete address. This reduces harvesting; it does not stop someone with many accounts. The permanent fix is PR C (invite by exact email, with acceptance).
- Removed `institution.verify` (public; confirmed institution ids exist and are active; no callers in the repo).

## Remaining plan

| PR | Change | Migration |
|---|---|---|
| B | `addStaffMember`/`bulkImportStaff` create invitations (never active), lower-case, dedupe, cap, one transaction, events + notification; never revive declined/suspended/ended memberships | no |
| C | Admin grants pending until accepted; notify admins; admin events table; transactional minimum-admin check | yes |
| D | Recovery: notify current admins, cooling-off, never set owner 0, keep admins until claimant accepts, evidence by upload | maybe |
| E | Stop name-based facility seeding on search; one claim per KMHFL id; dispute workflow; institution verification | yes |
| F | Facility selection (profile, Care Signal, Code Signal) no longer creates roster rows | no |
| G | CPD relationship creates a request unless institution opted in; write events | maybe |
| H | Single `isActiveMember()` used by ILS, audit, staff 360, counts | no |
| I | Provider leave/pause; unlink stops resetting to pending | no |
| J | Invitation expiry and single-use tokens | yes |
| K | Delete `directHospitalOnboarding` and retired `register`; remove legacy approval path | no |
