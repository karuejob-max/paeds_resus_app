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

## PR H: one definition of "active member"

The roster row (`facilityLinkStatus`) and the membership row (`membershipStatus`) were checked separately, so a person whose membership was suspended or ended could still count as a member in some places (audit, course access, payments, IERP, rota and UTL queries) and not in others.

- New `server/lib/institution-active-member.ts`: `isActiveMember(row)` and `activeStaffCondition()` (SQL form).
- Active member = roster row `linked`, not removed, and the membership is not suspended, ended or declined. A linked roster row with no membership row (older data) still counts, so nobody who was never migrated disappears.
- Replaced the bare `facilityLinkStatus = 'linked'` filters in `resusgps-auditor`, `courses`, `payments`, `ierp-program-state`, `iers-shift-team`, `iers-utl-sync` and `institution` (13 sites).
- Not changed: places that already require both a linked roster row and an active membership (rota assignability, staff 360 link action, CPD link check), and the facility-registry reconcile logic, which looks for linked rows on purpose.
- No migration.

## PR J: invitations expire

Pending invitations never lapsed, and acceptance relied only on matching the signed-in email. Invitation emails carry no token (the link is the plain `/workplaces-and-access` page), so there is nothing to make single-use; acceptance already requires being signed in as the invited address.

- Expiry is derived from the send time, so no migration: `institutionMemberships.invitedAt` for institution access, `institutionalAdminInvites.createdAt` for administrator grants. `server/lib/invitation-expiry.ts` holds the rules: 14 days, 30 days for recovery grants (which first wait out the 7-day cooling-off). A missing send time counts as expired.
- Accepting an expired institution-access or administrator invitation is refused. Declining an expired administrator invitation is refused too (it no longer appears).
- Re-sending resets the clock: institution invites already set `invitedAt` again; re-inviting an administrator whose invitation expired retires the old one (audited) and creates a new one.
- Institution-access acceptance is single use: if the invitation was already answered, the second request gets a conflict instead of writing a second audit event.
- UI: expired institution invitations show "Expired" with no Accept button; the Administrators table shows "Expired — invite again"; the post-login admin-invite banner hides expired invitations.
- Existing pending invitations older than 14 days become expired immediately. They can be re-sent.
- Not done: verifying that the invited email address belongs to the signed-in user (depends on how email verification works at sign-up), and an automatic clean-up job. Expired rows simply stay `pending`/`invited` in the database.

## PR K: remove retired onboarding code

- Deleted `server/routers/direct-hospital-onboarding.ts`. It was not mounted in the app router (only a commented-out reference remained) and its `registerHospitalInstant` returned invented ids and API keys without writing anything. Nothing imported it.
- Deleted the `institution.register` procedure. It only threw "retired" and had no callers in the client. Institutions are created through `completeOnboarding` (second administrator required).
- Removed the tests that called `institution.register` (`institution.test.ts`, `e2e-tests.test.ts`) and pointed the E2E flow at a fixture institution; README no longer lists `institution.register` or the removed `institution.verify`.
- The plan also mentioned a "legacy approval path". Searching for institution approve/activate procedures found none (the only approval flows are staff facility links, Phase 1 proof, readiness templates and data lifecycle), so nothing else was removed.
- No migration.

## PR E1: institutions must be verified before providers can send them link requests

**Migration 0199** (`pnpm run db:apply-0199`, run it BEFORE deploying this code):
- `institutionalAccounts` gains `verificationStatus` (`unverified` | `pending_review` | `verified` | `rejected`), `verificationMethod`, evidence url/note, submitted/verified timestamps, `verifiedByUserId` and a review note.
- New `institutionVerificationEvents` audit table.
- Every institution whose `status` is `active` is marked `verified` with method `grandfathered`, so nothing stops working on deploy. They are listed under "Grandfathered" in the platform-admin page for review.
- The script prints (and changes nothing about) KMHFL facilities claimed by more than one institution.

Behaviour:
- Provider link requests: `facilityLinking.requestLink` refuses an unverified institution. A CPD attendee at an unverified institution gets `admin_review_required` and no roster row, request or notification is created. Someone who is already an active member keeps their relationship.
- Institution administrators: new "Institution verification" card (Administrators tab). They submit method + https evidence link + note; status moves to `pending_review`.
- Platform administrators: `/admin/institution-verification` lists institutions awaiting review and grandfathered ones. Verify, reject or revoke each, with a required note. Every decision is an audit event and the institution's administrators are notified.
- One verified claim per KMHFL id: verifying is refused while another institution is verified for the same facility; the reviewer must revoke that claim first. Institution administrators are only told "claimed elsewhere", never which institution.
- Existing invitations (admin-added staff) are unaffected: they already require the provider's acceptance.

Not in E1 (planned for E2): evidence upload (currently a link), automatic evidence from a facility-domain email, a dispute workflow, and stopping name-based facility seeding on search.

## PR L: review of legacy members

128 active memberships (116 at one institution, from a CPD event) existed with no audit event: people who chose a facility or attended CPD before institutions had to approve members. They stay active. This PR gives the institution a way to confirm or clear them.

**Migration 0200** (`pnpm run db:apply-0200`): new `institutionMembershipReviews` table. For every active membership with no audit event it (1) opens a `legacy_pending` review and (2) writes an `accepted` membership event ("Legacy: self-selected before institution approval was required (backfilled)"). Nobody is removed or changed. Safe to re-run.

**Who reviews**
- Institution level (see everyone, including unassigned): institution administrators, and active `cpd_coordinator`, `iers_coordinator` or `iers_chair` product roles.
- Department level (see only members of their own department): department heads and deputies, department CPD (education) coordinators and deputies, department emergency-response coordinators, backups and deputies.
- Institution-level deputies are not covered: no such role exists in the data model.

**Actions** (one person at a time; there is no "confirm all")
- Confirm: both levels. Closes the review.
- Not in my department: department level only; requires a note; ends nothing and keeps the person active. The person moves to the institution-level queue, with a "flagged by N" count and the notes visible only to institution-level reviewers.
- Remove: institution level only. Uses the same cleanup as unlink and provider leave (roster row becomes `rejected`), writes a `removed` membership event, closes the review, and notifies the person.
- Assign department: institution level only. Sets the roster department so the person then reaches that department's reviewers.

Unassigned people (typical for CPD-event joiners) are visible only to institution-level reviewers. The panel is shown in the institution people directory and on the provider workspace card, and hides itself for anyone with no review responsibility.

## PR O: archive duplicate or mistaken institutions

A platform administrator can archive an institution from **Institution verification**. Nothing is deleted. Archive needs a reason, is refused while the institution is verified (revoke first), has administrators other than its creator, or has active members, and is recorded in the verification history. An archived institution is hidden from the review queues (see the **Archived** tab), cannot be verified or sent evidence, and can be restored. Run `pnpm run db:apply-0201` before deploying.

## PR E2a: guided verification

An institution administrator verifies in one short form (Administrators tab): pick the facility from the Kenya Master Health Facility List (the MFL code is copied onto the institution), say what kind of institution it is (private/faith-based/community needs a KMPDC licence number; public needs a letter from the Medical Superintendent or county/sub-county health office), and attach a PDF/JPG/PNG up to 5 MB (or a link). Institutions that are not registry facilities, or not listed yet, say so with a reason. Files are stored privately; only platform administrators get a short-lived link.

The platform-admin page shows the linked registry facility (name, MFL code, county, type), whether the names match, the licence number, and the uploaded file. A platform administrator can link or correct the registry facility on any institution. Verifying needs a registry facility unless the institution said it is not one, or the administrator confirms it. Run `pnpm run db:apply-0202` before deploying.

## PR P: registry tooling, facility-link audit, wider CI gate

- The facility list in the database may be the small sample from `scripts/seed-kmhfl-facilities.mjs`, whose codes are placeholders (e.g. `CHM-001`), not official MFL codes. Check with `pnpm run kmhfl:check`. Load the official list with `pnpm run kmhfl:import -- <file.csv> --dry-run`, then again without `--dry-run`. Sample rows with the same name and county are converted to the official code, so existing links keep working.
- Linking a facility is now recorded in the verification history (`facility_linked`). Run `pnpm run db:apply-0203`.
- Placeholder codes are never copied onto an institution's registration number, and the admin page warns when a linked entry has no official code.
- `institution.test.ts` and `e2e-tests.test.ts` are part of the CI unit gate.

### Loading the official list

1. On https://kmhfr.health.go.ke/public/facilities use **Export** (Excel) with no filters, to get every facility with its MFL code.
2. Open it in Excel and **Save As → CSV (UTF-8)**.
3. `pnpm run kmhfl:import -- "C:\path\to\facilities.csv" --dry-run`, check the counts, then run it again without `--dry-run`.
4. `pnpm run kmhfl:import -- "C:\path\to\facilities.csv" --retire-samples` hides leftover sample rows that no institution uses (nothing is deleted).
5. `pnpm run kmhfl:check` should now show thousands of official codes.

## PR E2b: Care Signal and Code Signal facility identity

- Every care facility can carry its official MFL code (`careFacilities.mflCode`). Searching the facility picker also searches the official registry (by name or MFL code) and turns official matches into the single care facility for that code. An older same-name facility without a code is adopted, not duplicated. Placeholder codes are never used.
- The picker shows the MFL code, county and a badge (Verified institution / Registry facility / Not in registry (under review) / Community) so similarly named facilities can be told apart. An unverified institution is no longer shown as a "Registered hospital".
- Facilities are no longer created from institution company names on search. A verified institution linked to an official registry facility is attached to that facility's care record when it is verified.
- A reporter who adds a facility that is in the registry gets the official entry. Otherwise it is saved flagged `needsReview`. Platform administrators resolve these on **Institution verification** (bottom of the page): match to the registry facility (Care Signal and Code Signal reports and profiles move across) or confirm it is genuinely unlisted.
- Merging facilities now also moves Code Signal reports.
- Run `pnpm run db:apply-0204` before deploying. Facilities added by hand before this change are not flagged retroactively.

## PR U: licence onboarding and follow-up

- Migration 0205 adds `licenceDeadlineAt` to `institutionalAccounts`.
- Providers see an "Add your professional licence" card on the dashboard (also asks for their professional role when unset).
- Institution admins, credential managers and department heads see a "Professional licences" panel under People and access > Directory: counts, deadline (admins only), weekly-capped "Remind" button.
- Due date per person = later of the institution deadline and 30 days after joining. Enforcement is visibility plus existing role gates; learning is never blocked.
