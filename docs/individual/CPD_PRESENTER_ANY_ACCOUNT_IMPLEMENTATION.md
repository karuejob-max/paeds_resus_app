# CPD Presenter Any-Account Implementation

## Status

Implemented in the CPD presenter and institutional Learning flows. The change is additive and does not require a database migration because the existing event and co-presenter tables already support user IDs, nullable participant membership, guest participant types, and presenter attendance roles.

## Behavior

Institution-wide CPD authorities can search Paeds Resus accounts by name or email. Active institution members are returned first and are labelled as institution members. A valid account outside the active institution is labelled as a platform account that is not an institution member.

Department-scoped CPD coordinators remain restricted to the active institution-member directory for their assigned department(s). They cannot use the wider platform-account search to bypass department scope.

A platform account may be selected as the lead presenter or co-presenter. The server resolves the account identity from the users table and stores the event display snapshot. It does not copy the event's department or cadre into the platform account profile. Existing institution-member behavior remains compatible.

## Data and attendance integrity

Institution-member presenters retain the existing member participant type and account-profile synchronization behavior where the legacy CPD path performs that synchronization. Non-member co-presenters are stored with `participantType = guest`. The platform account remains outside the institution membership directory.

When a presenter or co-presenter registers for their own session, the attendee row is assigned `roleInEvent = presenter` or `roleInEvent = co_presenter`. Other registrants remain ordinary attendees. Facility relationship, department validation, audience eligibility, duplicate registration protection, and signed-in self-email protection remain unchanged.

## Authorization boundaries

The presenter search continues to require the CPD product capability and an institutional CPD responsibility. Institution-wide search is available only when the resolved authority is institution-wide. Department-scoped roles receive only their permitted member results. Session creation and co-presenter changes continue to pass through the existing Learning access and session-operation gates.

## Backward compatibility

The existing `institutionLearning.createSession`, `institutionLearning.addCoPresenter`, legacy `cpd.openEvent`, and `cpd.updateEventPresenter` procedures continue to accept institution-member presenters. Legacy display fields remain input-compatible but are not trusted when a resolvable platform account exists. Existing single-presenter sessions and blank co-presenter lists remain valid.

## Validation

- Focused presenter and institutional Learning tests: passed.
- Presenter attendance-role regression tests: passed.
- `pnpm run check`: passed, including TypeScript, clinical lint, and strict audits.
- `pnpm run test:unit`: passed.
- `pnpm run build`: passed, including prerender and server bundle.
- `git diff --check`: passed.

## Rollout and recovery

After deployment, perform a read-only-safe or disposable-data smoke check using an institution administrator or institution-wide CPD Coordinator. Search for an active member and an account outside the institution, confirm the labels, create a disposable single-presenter session, add a platform-account co-presenter, verify the event and co-presenter records, and confirm no profile fields were changed on the non-member account. If the smoke check fails, revert the application release; no schema rollback is required.

## Explicit non-goals

This release does not create institution membership automatically, grant institutional roles to platform accounts, alter individual professional identity data for non-members, change attendance verification policy, add guest email invitations without accounts, or expose platform-wide account search to department-scoped coordinators.
