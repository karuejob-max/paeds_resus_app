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

## PR B — admin-added staff become invitations

`addStaffMember`, `bulkImportStaff` and `addDepartmentNurseCandidate` previously called
`ensureProviderMembershipForStaff`, which set the membership to `active` (with `acceptedAt`)
and linked the roster row whenever the email matched an existing account. An institution
admin could therefore attach any registered user to their institution without consent.

Now:
- The helper always creates or refreshes an `invited` membership (`general_staff` only) and
  writes an `institution_membership_events` row (`invited` / `reinvited`) naming the admin.
- The roster row is created with `facilityLinkStatus = "pending"` and is linked only by
  `acceptMembershipInvite`.
- An existing `active` membership is left untouched.
- The in-app notification and email are sent; a delivery failure does not undo the invite.
- A missing `insertId` now fails loudly instead of falling back to id `1`, which could have
  attached a membership to the wrong roster row.

Behaviour change for admins: a newly added registered nurse is not assignable to rotas until
they accept. Existing active memberships are unaffected; no data migration.

## PR F — choosing a facility no longer creates roster rows

`syncProviderProfileFacility` (called when a provider saves a facility on their profile, and
when a **named** Care Signal event is submitted with a facility) used to call
`reconcileInstitutionalStaffMember`, which inserted an `institutionalStaffMembers` row —
name, email, phone — into the chosen institution's roster as `pending`, with no request and
no consent. Reporting a clinical event could therefore put someone on a roster.

Now `reconcileInstitutionalStaffMember` takes `createIfMissing` (default `true`, so the explicit
CPD facility-relationship flow is unchanged). The profile/Care Signal sync passes `false`:
- An existing roster row is refreshed (department etc.); a retired row is never revived.
- A person with an **active** membership keeps their row maintained.
- Anyone else gets no row. Joining a facility goes through the explicit facility-link request
  (`facility-linking`), which the institution admin approves.

Behaviour change: institution admins no longer see providers in "pending" merely because those
providers picked their facility. No data migration; existing rows are left as they are.

## PR G — CPD attendance raises a request; it never activates membership

`applyCpdFacilityRelationship` (CPD registration, `confirmPermanentFacilityFromCpd`, and the
background `autoLinkCpdFacilitiesForUser` / `autoLinkCpdFacilitiesForInstitution`) used to set the
membership to `active` — creating it, or converting an `invited` membership to `active` on the
person's behalf — and mark the roster row `linked`. Showing up to an event therefore granted
institutional access, and could accept an administrator's invitation for the invitee.

Now:
- An existing **active** membership is kept; its roster row is refreshed, and a permanent
  relationship still updates the provider's primary facility. Locum/outreach never changes it.
- Everyone else gets a **pending facility-link request** (same queue and approve/reject path as
  `facility-linking.requestFacilityMembership`; deduped by the pending-request key) and the
  institution's owner and admins get an in-app notification. An `invited` membership stays
  invited until the person accepts.
- Suspended, ended, rejected or removed relationships still need the administrator. An institution
  with no facility record falls back to administrator review.
- New result status `request_pending`; the CPD registration page and "My CPD certificates" explain
  that approval is pending.
- Background reconciliation on login/profile save creates at most one request per person and
  institution; a rejected or withdrawn request marks the roster row `rejected`, so it is not
  re-raised.

**Not in this PR:** decision 3 also allows an institution to opt in to auto-link. That needs a
setting on the institution (migration) and is left for a later change; until then every institution
uses the request path. Existing active memberships created by the old path are unchanged — the
membership-origin query is how we decide what to do about those.

## PR C — administrator grants are invitations (migration 0198)

Two paths made someone an institution administrator the moment an admin named them, with no
acceptance and no record beyond `addedByUserId`: `institutionAdmins.invite` (any existing account
picked from the directory) and the **second administrator at registration**
(`completeOnboarding`). Decision 2: grants require the invitee's acceptance, notify existing
admins, and are audited.

Now both create a pending `institutionalAdminInvites` row (deduped per institution + email) and
**no** `institutionalAccountAdmins` row. The invitee is notified in-app and sees the existing
post-login banner, which now has **Accept** and **Decline**. Other administrators are notified when
an invitation is sent, accepted or declined. A pending invite can be cancelled with
`institutionAdmins.revokeInvite`. Every step (invited, accepted, declined, revoked, removed,
owner_transferred) is written to the append-only `institutionalAdminEvents` table. The recovery
approval path is unchanged in behaviour (acceptance already required) but is now audited as
`owner_transferred`; PR D reworks recovery itself.

**Migration 0198** (`pnpm run db:apply-0198`, idempotent, additive):
- creates `institutionalAdminEvents`;
- adds `'declined'` to `institutionalAdminInvites.status`;
- backfills one `accepted` event per existing administrator (no access is changed).

Behaviour change: a newly registered institution has one administrator until the named second
administrator accepts; the second administrator is listed under pending invites meanwhile.
Order of deployment: run the migration before or immediately after deploying the code. If the code
is live first, inviting an admin fails on the missing audit table until 0198 runs.


## PR I: provider leave, and unlink no longer resets to pending

- New `institution.leaveInstitution` (provider): ends the caller's own active membership, roles, scopes, coordinator seats and future rotations/shifts. Writes a `removed` membership event (actor = the provider), and notifies the owner and administrators.
- Owners and administrators cannot leave until they hand over the administrator role.
- Shared cleanup lives in `server/lib/institution-membership-exit.ts` (`endMembershipAccess`); admin unlink uses it too.
- Unlink and leave set the roster row to `rejected` (was `pending`), so a person who has left is not put back in the approval queue. Coming back needs a new invitation or an admin-approved request.
- Unlink now also writes a membership audit event.
- "Pause" is not included: there is no status for it and no owner decision yet.
- No migration.


## PR D: recovery is a cooling-off grant

Approving a recovery request used to set the institution owner to `0` and delete every administrator at once (or, if the claimant already had an account, hand over ownership immediately). A mistaken or fraudulent approval locked the real administrators out.

Now:
- Approval creates a pending `recovery_approval` grant for the claimant. Owner and administrators are untouched.
- Every current administrator is notified and can revoke the grant under Administrators. The approval and the notification are in the admin audit table.
- The claimant can accept only after `RECOVERY_COOLING_OFF_DAYS` (7). A grant with no creation time fails closed.
- On acceptance, ownership moves to the claimant and the former administrators are removed, with a `removed` audit event and a notice to each.
- `submit`: evidence link must be https; at most 3 pending requests per email; email is lower-cased.
- Not done: evidence upload (still a link), and a per-IP limit on the public form.
- No migration.
