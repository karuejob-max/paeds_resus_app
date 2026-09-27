# Notification System Audit

**Date:** 2026-09-27  
**Scope:** Global notification panel, notification storage, delivery channels, user preferences, institutional role notifications, IERS urgent alerts, and UI entry points.  
**Repository:** `karuejob-max/paeds_resus_app`  
**Audit basis:** Current working tree aligned with the merged role-acceptance implementation and `origin/main`.

## Executive conclusion

The platform currently has **four overlapping notification paths**, not one unified notification system:

1. **Header `NotificationBell`** — the visible production bell. It computes course-progress and certificate alerts in the browser and reads Care Signal notifications.
2. **`NotificationCenter`** — a second, older notification UI backed by an in-memory notification service plus some durable notifications. It is not mounted anywhere in the current client.
3. **Durable `inAppNotifications`** — database-backed user notifications written by role assignment, Care Signal, IERP, renewal, IERS, and scheduler flows. The visible Header bell does not read this table directly.
4. **IERS urgent push** — a separate browser permission, sound, service-worker, Web Push subscription, and delivery-log system for urgent activation alerts.

This creates a reliability problem: **a notification can be successfully written to the database and still be absent from the user's primary notification bell.** This affects the newly implemented Departmental Head, Departmental CPD Coordinator, ERCo, and Assistant ERCo notifications in particular.

The highest-impact fix is to make the Header bell consume one server-owned notification feed that includes durable in-app notifications and clearly labelled computed reminders. Do not add another panel or another notification table.

## What is visible today

### Primary visible entry point

`client/src/components/Header.tsx` mounts:

```tsx
{isAuthenticated && <NotificationBell />}
```

`client/src/components/NotificationBell.tsx` is therefore the production-facing panel.

### Dead/unused duplicate panel

`client/src/components/NotificationCenter.tsx` is not mounted anywhere in `client/src`. It contains a second bell/dropdown, a different API contract, a different notification model, and destructive actions such as `Clear All`.

It should not receive further features. It should either be removed after a reference check or retained only temporarily as historical code during consolidation.

## Current data and delivery paths

| Path | Source/storage | Visible in primary Header bell? | Read state | Main use |
|---|---|---:|---|---|
| Course progress | Computed from `courses.getUserEnrollments` and `courses.getMyAhaEnrollments` | Yes | No durable read state | Resume/start/overflow learning prompts |
| Certificate expiry | Computed from `certificates.getMyCertificates` | Yes | No durable read state | Expiry reminder |
| Care Signal | `inAppNotifications` through `careSignalReview.*` | Yes | Durable | Review responses |
| Institutional roles | `inAppNotifications` | **No** | Durable | Department Head, CPD Coordinator, ERCo, Assistant ERCo |
| IERP decisions/evidence | Mostly `inAppNotifications` plus email in some flows | **No** | Durable | Verification decisions and evidence updates |
| IERP payment deadlines | `inAppNotifications` | **No** | Durable | Payment deadline reminders |
| Institutional renewals | `institutionRenewalNotifications` plus `inAppNotifications` for in-app delivery | **No** | Durable/delivery ledger | Renewal and subscription expiry |
| IERS urgent activation | `iers_push_subscriptions` and `iers_push_delivery_log`; foreground alert fallback | No normal bell feed | Delivery status, not inbox read state | Time-critical activation alerts |
| Generic recommendations/achievements/alerts | `server/services/notification.service.ts` | No reliable user inbox | In-memory only via `server/notifications.ts` in some routes | Legacy/general notification helpers |

## Critical findings

### P0 — Role notifications are not visible in the primary bell

PR #878 writes role assignments to `inAppNotifications` with an action URL such as `/my-shift?tab=team`.

However, the production Header `NotificationBell` reads:

- Care Signal notifications via `careSignalReview.getMyNotifications`.
- Computed course progress alerts.
- Computed certificate expiry alerts.

It does **not** call `notifications.getNotifications` and does not query durable role notifications. The role notification can exist in the database but remain absent from the bell. The role card in My Shift remains a second discovery path, but the requirement that a user receives a notification and clicks directly to the role is not fully satisfied until the Header bell consumes the durable feed.

**Action:** Make one canonical durable notification query the source for the bell, including role notifications.

### P0 — The visible unread badge is not a trustworthy global count

`NotificationBell` calculates:

```ts
const totalUnread = localNotifications.length + remoteUnread;
```

Every computed course-progress and certificate item is treated as unread on every render. There is no user-level acknowledgement or durable dismissal for those computed alerts. The count can therefore repeatedly return after refresh and can materially overstate unread work.

Separately, `notifications.getUnreadCount` counts the in-memory legacy store plus durable `inAppNotifications`, while the visible Header bell counts Care Signal plus computed local items. Different UI surfaces can show different numbers.

**Action:** Define one count contract. Prefer:

- Durable unread count for actionable messages.
- Computed reminders either excluded from the badge or assigned stable reminder keys and explicit dismiss/snooze state.

### P0 — Two notification APIs expose the same durable table with different semantics

`careSignalReview.getMyNotifications`, `careSignalReview.getUnreadCount`, `markRead`, and `markAllRead` operate on the general `inAppNotifications` table despite being named for Care Signal.

`notifications.getNotifications` was recently extended to read the same table, but the Header does not consume it. This creates duplicate ownership and makes it unclear which router owns notification behavior.

**Action:** Move durable inbox reads and mutations to a canonical `notifications` router. Keep Care Signal responsible only for creating its review notification, or provide a thin compatibility wrapper during migration.

### P1 — `NotificationCenter` is dead duplicate code

`NotificationCenter.tsx` is not mounted, but it remains a competing implementation with:

- A separate `notifications.*` API model.
- Different icons and layout.
- Different deletion and clear-all behavior.
- In-memory notification assumptions.

Keeping it increases the chance that future fixes land in the wrong panel.

**Action:** Deprecate it immediately, add a comment pointing to `NotificationBell`, then delete it after confirming no external import or route depends on it.

### P1 — The generic notification service does not actually persist user notifications

`server/services/notification.service.ts` logs notifications and sends high-priority messages to the platform owner through `notifyOwner`. It does not insert into `inAppNotifications`, send user email/SMS, or publish to the visible bell.

The service name and return value imply delivery, but for most notification types it only logs and returns `true`.

**Action:** Replace or refactor this service to call a canonical notification creation service that:

1. Inserts a durable inbox record.
2. Applies user preferences.
3. Optionally queues email/SMS/push delivery.
4. Returns a delivery/audit result rather than a generic boolean.

### P1 — Durable role notifications have weak metadata for filtering and routing

`inAppNotifications` stores only:

- `type`
- `title`
- `body`
- `actionUrl`
- `relatedId`
- `read`
- timestamps

`relatedId` is ambiguous across notification types. The role notifications do not store an explicit `institutionId`, `departmentId`, `roleKey`, or action verb in structured fields. This makes filtering, deduplication, analytics, and safe routing harder.

**Action:** Add structured metadata, preferably a JSON `data` field or normalized nullable columns, containing:

```json
{
  "institutionId": 3,
  "departmentId": 12,
  "roleKey": "department_head",
  "assignmentId": 44,
  "action": "accept_or_decline"
}
```

Do not rely on parsing notification body text.

### P1 — No canonical notification taxonomy

Notification types currently include strings such as:

- `care_signal_review`
- `institution_role_assignment`
- `institutional_renewal`
- `ierp_payment_deadline`
- `iers_shift_team`
- `iers_department_mismatch`
- generic types from the in-memory service such as `system`, `achievement`, and `update`

There is no central registry defining severity, audience, expiry, dedupe key, action type, or whether the message is clinical/operational/administrative.

**Action:** Define a shared notification taxonomy with at least:

- `domain`: `clinical`, `role`, `learning`, `finance`, `system`
- `kind`: stable machine-readable event name
- `severity`: `info`, `action_required`, `urgent`
- `requiresAction`: boolean
- `dedupeKey`
- `actionUrl`
- `expiresAt` or `dismissedAt` where appropriate

### P1 — Read semantics are inconsistent

Current behavior differs by source:

- Computed Header alerts have no read state.
- Care Signal marks read when clicked.
- Durable `notifications` mutations identify durable records with an `inapp-` string prefix.
- The old in-memory service uses generated string IDs and process-local state.
- IERS push delivery tracks sent/failed/expired, not user acknowledgement.

The same user can see a role notification in one surface, a Care Signal count in another, and a different global count in the badge.

**Action:** Make all inbox items use one stable ID namespace and one read/acknowledge contract. Delivery status and user read state should remain separate concepts.

### P1 — In-memory notifications are unsafe in production

`server/notifications.ts` stores notifications in a process-local `Map`. This means notifications can disappear on:

- process restart,
- deployment,
- horizontal scaling to another instance,
- requests routed to a different worker.

This is unsuitable for role assignment, clinical operations, or any user-facing notification expected to persist.

**Action:** Stop using the in-memory store for user notifications. Use the database as the source of truth. If real-time updates are later needed, add an event/pub-sub layer without changing inbox storage.

### P2 — Query load is higher than necessary

After first paint, `NotificationBell` independently queries:

- Care Signal unread count.
- Care Signal notification list when opened.
- micro-course enrollments.
- AHA enrollments.
- certificates.

Several queries poll every 60–120 seconds. The header is global and mounted across authenticated pages, so this can create avoidable background traffic for users who do not need all notification categories.

**Action:** Add one lightweight `notifications.summary` query for the badge and one `notifications.inbox` query when opened. Compute learning reminders server-side or behind a dedicated opt-in query. Avoid polling full enrollment/certificate datasets from the global header.

### P2 — Mobile interaction needs a task-oriented structure

The current Sheet is a good base for mobile, but it needs:

- category filters: `All`, `Action required`, `Learning`, `Institution`, `Urgent`;
- clear action buttons instead of only a small `View` label;
- stable empty/loading/error states;
- visible unread count and “Mark all read” behavior covering every source;
- safe close/navigation behavior after marking an item read;
- no use of browser `confirm()` for destructive operations in the older panel.

For emergency workflows, urgent IERS alerts should remain visually and behaviorally distinct from ordinary administrative notifications.

### P2 — Preference controls do not cover all notification domains

The visible `NotificationCenter` preferences cover enrollment, payment, certificates, course updates, quiz reminders, and achievements. The durable schema has email/SMS/push preferences, but role notifications, IERS urgent alerts, Care Signal responses, institutional renewals, and clinical alerts do not have a consistent user-facing preference model.

**Action:** Separate preferences into:

- mandatory operational alerts that cannot be disabled;
- role/action-required alerts;
- optional learning and marketing-like updates;
- channel controls per domain.

A user should not be able to disable a safety-critical assignment or urgent activation alert without an explicit warning and institutional policy check.

## Recommended target architecture

### One canonical notification record

Use `inAppNotifications` as the initial canonical inbox table, then extend it additively:

```text
id
userId
domain
kind
severity
title
body
actionUrl
dataJson
dedupeKey
readAt
dismissedAt
expiresAt
createdAt
```

Keep delivery-specific tables such as `iersPushDeliveryLog` and `institutionRenewalNotifications` for channel evidence and scheduling. They should not become separate user inboxes.

### One canonical server API

Recommended procedures:

- `notifications.getSummary()` — unread count, urgent count, action-required count.
- `notifications.list({ cursor, filter })` — paginated durable inbox.
- `notifications.markRead({ id })`.
- `notifications.markAllRead({ filter })`.
- `notifications.dismiss({ id })` — only for dismissible items.
- `notifications.getPreferences()` / `updatePreferences()`.

Existing Care Signal procedures can call shared service functions or remain temporary compatibility aliases.

### One primary UI

Keep `NotificationBell` as the only bell. Extend it to read the canonical feed. Remove or quarantine `NotificationCenter`.

Suggested item priority:

1. Urgent clinical/IERS alerts.
2. Role acceptance and other action-required items.
3. Institution operational alerts.
4. Learning progress reminders.
5. Informational achievements and updates.

Computed learning reminders should be represented as stable server-generated notification candidates, not recreated as perpetually unread browser objects.

## Priority implementation plan

### Phase 1 — Reliability correction

1. Make `NotificationBell` consume `notifications.getNotifications` / a new canonical inbox query.
2. Include durable role, IERP, renewal, Care Signal, and IERS-related inbox records.
3. Use the durable unread count for the badge.
4. Add regression tests proving a role notification appears in the Header bell and routes to My Shift.
5. Add structured role metadata and a dedupe key for new role notifications.

### Phase 2 — Remove split ownership

1. Move Care Signal read/list behavior behind the canonical notification router.
2. Stop writing new user notifications through the in-memory service.
3. Deprecate `NotificationCenter` and remove it after reference verification.
4. Update generic notification helpers to persist durable records.

### Phase 3 — Task-oriented UX

1. Add filters and category labels.
2. Add explicit action buttons: `Accept role`, `Open review`, `Resume course`, `Review renewal`.
3. Add loading/error/retry states.
4. Add expiry and dismissal behavior for non-critical computed reminders.
5. Make the panel accessible with keyboard focus management and mobile-safe widths.

### Phase 4 — Delivery and observability

1. Keep IERS push as a separate urgent delivery channel, but record a linked inbox item.
2. Add delivery/read metrics: created, displayed, opened, read, action completed, expired, failed.
3. Add admin diagnostics for failed push/email/SMS delivery.
4. Add idempotent dedupe keys to prevent duplicate role and renewal notifications.

## Definition of done for notification optimization

- Every user-facing notification appears in one canonical inbox.
- Role assignment notifications are visible in the Header bell and link to the correct My Shift assignment.
- The badge count matches the canonical unread count.
- No user notification depends on process memory.
- Care Signal, role, IERP, renewal, and operational notifications use the same list/read API.
- IERS urgent push remains available without polluting ordinary notification semantics.
- Computed learning reminders do not remain permanently unread after every refresh.
- Duplicate `NotificationCenter` implementation is removed or formally deprecated.
- Tests cover creation, deduplication, listing, badge count, read state, routing, and failure fallback.
- Notification preferences clearly distinguish mandatory operational alerts from optional learning updates.

## Immediate recommendation

Do **not** add more notification types or another panel. The next implementation should be a small, reviewable consolidation PR that first fixes the P0 issue: wire the existing Header `NotificationBell` to the durable notification feed and make its badge authoritative. Then follow with taxonomy, deduplication, and UX improvements.
