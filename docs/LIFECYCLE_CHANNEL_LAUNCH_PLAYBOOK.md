# Lifecycle Channel Launch Playbook

Purpose: Run first-week lifecycle channel operations safely for provider conversion nudges (in-app, SMS, email) with clear escalation and rollback triggers.

Owner: Platform admin on-call
Window: First 7 days after launch cutover
Primary panel: `AdminReports` -> Lifecycle nudge batch dispatch

## 1) Daily operator cadence

Run this cycle at least 3 times per day (morning, midday, evening):

1. Open lifecycle dispatch summary and confirm run recency (last 7 days).
2. Check channel outcomes (sent/failed/skipped) for in-app, SMS, email.
3. Check delivery trend (7d vs 30d) and failure diagnostics.
4. Check operational channel health alerts and fallback activations.
5. Execute dry-run then live send only if safeguards pass.
6. Capture canary evidence snapshot from `AdminReports` and append to handoff.
7. Export current run CSV and append to daily handoff notes.

## 2) Alert thresholds and actions

## Warning (delivery rate < 85%)

- Keep live sends active.
- Review top failure reasons and compare with provider credentials/env health.
- Reduce live batch size by 30-50% for the next run.
- Re-run dry-run, then live send with typed confirmation.

## Critical (delivery rate < 70%)

- Pause live sends for affected external channel if fallback is not already active.
- Keep in-app channel active.
- Trigger incident response and notify engineering owner.
- Validate provider config and credentials (SMS/email), then run controlled canary.

## Fallback activation detected

- If SMS or email fallback activations are increasing, do not force-enable channel.
- Continue in-app sends so lifecycle conversion journey is not blocked.
- Only resume full external sends after two consecutive healthy checks.

## 3) Incident escalation SOP

Severity definitions:

- SEV-2: One external channel degraded for > 4 hours.
- SEV-1: Both external channels degraded, or delivery rate < 50% for any channel.

Escalation path:

1. Open incident with timestamp, affected channel, delivery rate, and top failure reason.
2. Assign owner for provider remediation (SMS or email).
3. Post status update every 60 minutes until mitigated.
4. Close only after two healthy monitoring windows.

## 4) Canary resume criteria

Before resuming full volume on a degraded channel:

- Minimum 20 attempted sends in canary sample.
- Delivery rate >= 85% in two consecutive checks.
- No new critical alerts in the last 2 hours.

Then:

1. Resume at 25% batch size.
2. Monitor one cycle.
3. Increase to 50%, then 100% if healthy.

Admin UI canary gate:

- Before first live cycle ramp, operators must verify SMS and email canary status in `AdminReports` and type `CANARY PASS`.
- Gate logic is explicit in the panel: for each external channel, pass if either (a) attempted >= 20 and delivery >= 85% or (b) fallback activations observed while channel is intentionally degraded.
- Live send requires a fresh canary evidence snapshot captured in the previous 30 minutes.

## 5) Rollback triggers

Rollback to in-app only mode if any trigger is true:

- External channel delivery < 50% for two consecutive checks.
- Top failure reason indicates auth/credential provider failure.
- Operator cannot complete canary resume criteria in 6 hours.

Admin UI safety gate:

- Before any live lifecycle send, operators must type `ACK ROLLBACK` in the live send safety checks panel to confirm rollback trigger review.

## 6) Daily handoff template

Copy into ops notes:

- Date/time:
- Runs completed:
- Live sends:
- Channel delivery rates (in-app/SMS/email):
- Top failure reasons:
- Fallback activations (SMS/email):
- Active alerts:
- Canary evidence snapshot timestamp:
- Actions taken:
- Next watch items:

## 7) End-of-week closeout

At day 7, produce a short review:

- Total nudges processed/sent/skipped.
- Channel-level reliability summary and incident count.
- Conversion impact notes from provider funnel checkpoints.
- Recommended threshold or runbook updates for week 2.

