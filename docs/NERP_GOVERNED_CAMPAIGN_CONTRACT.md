# Governed NERP Campaign Contract

## Goal

Provide a controlled in-app workflow for the NERP nurse promotion. The workflow may send only to the current suppression-aware eligible audience after an immutable recipient snapshot, a visible admin approval step, and a separate final send confirmation.

## Audience boundary

The source audience is active institutional staff in institution `3` whose `staffRole` is `nurse` and whose institutional record has not been removed. Existing eligibility remains authoritative: a valid email is required; completed NERP offers, both externally verified NERP phases, verified external AHA BLS plus ACLS credentials, and active exact email/name suppressions are excluded. Non-nurse outside-pathway verification cases never enter this campaign.

The current technical preview is 98 nurse records, 90 draft-eligible, 8 suppressed, 0 needing review, 3 name-excluded, and 1 suppression-only. The sendable list must be recomputed at snapshot approval and rechecked immediately before each delivery attempt.

## Opt-out and suppression

The existing institution-scoped `nerp_campaign_suppressions` table remains the single suppression source. Email opt-outs are stored as an active normalized email suppression with reason `unsubscribe`; hard bounces and manual exclusions use their own reason codes. Exact-name suppressions remain available for records without an account. Every suppression mutation creates an append-only audit event.

Each delivered message contains a signed, recipient-specific public unsubscribe URL. The public endpoint verifies the token against the campaign recipient snapshot before recording the email suppression. It must not reveal account details and must not require login. Send-time checks re-read active suppressions, so an opt-out recorded after snapshot approval prevents delivery.

## Campaign lifecycle

A campaign progresses through `draft → approved → sending → sent` or `failed`. Approval creates an immutable recipient snapshot containing staff ID, stable user ID when present, normalized email, display name, and department. The send endpoint accepts only the approved campaign and an exact confirmation phrase. There is no scheduler, automatic retry, or background promotional job in this release.

## Delivery and audit

Delivery reuses the existing server email transport and fails closed when no provider is configured. Each recipient is sent individually to avoid provider-specific bulk behavior and is recorded as `sent`, `failed`, or `skipped`. Provider message IDs and errors are retained. Campaign and recipient events are written to an append-only audit table. A failed campaign can be retried only through the admin UI after review; already-sent rows are never resent by the same attempt.

## No-send boundaries

Preview, download, approval, and opt-out operations never send email. The generic placeholder email-campaign router is not used. No IERP campaign, IERS operation, clinical record, learner record, payment record, or institutional membership is modified by this feature.

## Required operational gates

The code change must pass focused unit tests, TypeScript/build checks, protected CI, and a read-only production verifier. The migration is additive and idempotent and requires explicit owner confirmation immediately before production execution. A separate explicit confirmation is required immediately before the first real send, after the final audience count, provider readiness, subject/body, unsubscribe URL, and suppression results are reviewed.
