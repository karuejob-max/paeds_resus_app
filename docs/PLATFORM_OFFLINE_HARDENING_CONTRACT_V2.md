# Platform Offline Hardening Contract v2

## Objective

Make offline operation truthful, recoverable, and bounded across the Paeds Resus Platform. Offline mode may preserve access and capture drafts, but it must not create false institutional, emergency, learning, or certification state.

## Non-negotiable rules

1. The typed platform store is the only new platform-wide offline foundation. The legacy store and legacy sync path are either migrated, explicitly contained, or marked unsupported; no new feature may use them.
2. Every snapshot has actor/tenant scope where applicable, content/version identity, saved time, server-sync time, freshness policy, and expiry behavior.
3. Every command has a stable client ID, aggregate identity, base version where relevant, bounded retry state, and an explicit terminal state. No silent conflict resolution.
4. Local state is never labelled “confirmed,” “notified,” “accepted,” “verified,” “certified,” or “complete” until the server acknowledges the corresponding operation.
5. Offline emergency operation displays a manual call/radio fallback and explicitly distinguishes local timestamps from server activation/arrival timestamps.
6. Logout/account switch/shared-device handover must clear or quarantine local data according to actor and tenant scope; low-storage and IndexedDB failure must fail visibly and safely.
7. CPD attendance, UTL response acceptance/decline, staffing, activation, notification, arrival, payments, certification, and administration remain online-authoritative in this release.

## Required user-visible states

| State | Meaning | Permitted action |
|---|---|---|
| Cached | A versioned server snapshot exists locally | Read if within policy; show age |
| Stale | Snapshot exceeds normal freshness window | Read only if safety policy permits; show stale warning and refresh |
| Expired | Snapshot must not be used for operational decisions | Require online refresh or manual fallback |
| Local draft | Data is saved on this device only | Edit, review, discard; never claim submission |
| Pending | Client command awaits server acknowledgement | Retry only with same client ID |
| Conflict | Server state differs from local base | Review, correct, or escalate; no silent merge |
| Rejected | Server declined the command | Explain reason; preserve audit-safe record |
| Confirmed | Server acknowledged the exact command ID | Show official result |

## Required operator surfaces

The platform needs a conflict/review inbox, per-domain draft lists, freshness timestamps, refresh actions, stale/expired explanations, storage health, and confirmed local-data clearing. A count-only status bar is insufficient.

## Pilot gate

Before unsupervised use, test with disposable staging tenants and manikin/synthetic records on at least two Android devices: fresh/stale/expired snapshots; duplicate replay; server rejection; changed roster/template; account switch; logout; browser restart; screen lock; process termination; low storage; offline first launch; muted audio; denied notifications; poor connectivity; and emergency manual fallback. Any false-confirmation, lost draft, unauthorized submission, or privacy leak blocks release.
