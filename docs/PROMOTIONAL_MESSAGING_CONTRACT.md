# Paeds Resus Promotional Messaging Contract

## Purpose

Paeds Resus may send optional programme and product information through a governed in-app workflow. This contract keeps promotional communication separate from mandatory security, clinical, account, payment, certificate, and IERS operational notices.

## User preference

Users receive a soft, professional account-level control titled **Optional Paeds Resus programme updates**. The copy explains that the messages may include learning opportunities, programme changes, and relevant offers; participation is optional; changing the setting does not affect account access, clinical tools, institutional access, certificates, or emergency workflows. Users may opt in or opt out at any time from **Account → Notification preferences**. The preference is global to promotional messages and is not derived from cadre, department, institution, or IERP/NERP status.

A public one-click unsubscribe link is included in every governed promotional message. It records an auditable opt-out against the recipient’s account where available and against the normalized email address for delivery safety. A later opt-in from the account settings page is explicit and does not silently remove a hard-bounce suppression.

## Initial NERP campaign

The current NERP ACLS campaign is an explicitly approved one-time exception using the existing opt-out basis requested by the programme owner: the technically eligible nurse audience may receive the message unless they have an active opt-out, hard-bounce, or campaign-specific suppression. The final send always rechecks these exclusions. The campaign must not be sent until the corrected BLS-first message, recipient snapshot, provider readiness, and final confirmation are reviewed.

Future promotional campaigns default to **opt-in required**. A Global Admin may not silently change this default. Any campaign using the initial NERP opt-out policy must identify that policy in the immutable campaign record and in the review screen.

## Global Admin bulk messaging

Only a platform Global Admin may create, approve, and send a bulk promotional campaign. The sender uses controlled audience filters rather than arbitrary email lists. Supported filters include provider cadre and an explicit **Intern** segment derived from the IERP intern profile record. The preview shows the number and identity context of matching accounts, missing-email exclusions, opt-out exclusions, hard-bounce exclusions, and duplicates removed. It never exposes one institution’s private staff data to another institution administrator.

Every campaign freezes an immutable recipient snapshot before sending. At delivery time, each recipient is checked again against the current promotional preference and suppression records. Delivery is batched sequentially, each result is audited, and failed recipients are not silently marked as sent. Automatic schedules and background promotional jobs are out of scope for this release.

## Required controls

A campaign must have a named subject, reviewed body, valid destination links, a provider-ready transport, a visible consent policy, a recipient snapshot, and an exact approval phrase. Sending requires a second exact confirmation phrase. The server rejects stale drafts, missing unsubscribe signing configuration, unsupported providers, non-Global-Admin callers, and any recipient that becomes opted out or suppressed after approval.

IERP, NERP learning progress, IERS permissions, institutional audience privacy, clinical guidance, payment records, and certificate eligibility remain separate from promotional messaging. No campaign action may mutate those domains.
