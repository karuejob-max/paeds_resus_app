# Paeds Resus Platform Offline Contract v1

**Status:** Implemented in code; supervised synthetic/device validation still required.  
**Primary release:** PR [#662](https://github.com/karuejob-max/paeds_resus_app/pull/662), merge `e92b0e23`.

## Purpose

The platform is **offline-capable, not offline-unrestricted**. Offline mode exists to preserve safe access to approved information and to capture bounded work when connectivity is absent. It must never claim that an institution, emergency team, server, or certification system has received or accepted an action before the server confirms it.

## Offline access levels

| Level | Meaning | Examples |
|---|---|---|
| A — offline read | Versioned approved content or snapshot can be read | Cached coursework modules; last-synced UTL/ERT team; readiness assignment |
| B — local draft | A bounded record can be saved locally but is not submitted | Crash-cart check; targeted ERT role report; future debrief draft |
| C — delayed intent | Only an explicitly designed, expiring intent may be queued for later server review | Future CPD attendance or duty response; not enabled by default |
| D — online only | Requires current authority, server validation, or immediate delivery | ERT activation; role assignment; notification; arrival confirmation; official CPD verification; certification; payment; staffing changes |

## Domain rules

### ResusGPS

Non-arrest ResusGPS may continue to capture local clinical events and replay them through the canonical idempotent event timeline. CPR-GPS remains a separate clinical path and must not be rewritten into the generic platform queue. Offline activation must never be described as an ERT notification; the interface must show the manual call/radio fallback and pending server state.

### Coursework

Cached module content and local reading/resume are permitted. Offline mode cannot award a pass, completion, CPD credit, certificate, or official attendance. Content is versioned; stale content must be labelled and refreshed when online.

### UTL/ERT and IERS

The provider may read the last-synced team, duty, pole, role, and readiness snapshot offline. Snapshots are stale/read-only. Role acceptance, decline, reassignment, staffing, ERTL projection, activation, notification, arrival, and resource claims require current server authority.

### Crash-cart readiness

An assigned UTL/ERTL may complete a bounded local draft. The draft is not an institutional audit, does not notify the ERCo, and does not change readiness status until a live submission passes server validation. Provider submissions must be bound to the caller’s active dated UTL/ERTL roster.

### Targeted role reports and debrief

A role report or debrief may be drafted locally when it contains no patient identifiers and is linked to the intended team/activation context. Final submission requires live activation/team/role authorization and server acknowledgement.

### CPD and administration

Official CPD attendance, verification, credit, certificates, payment, subscriptions, enrolment, staffing, institutional role changes, and account administration remain online-only until a dedicated conflict-reviewed intent contract is approved.

## Sync and conflict rules

Every local command must have a stable local ID, aggregate type, aggregate ID, actor/tenant scope where available, client timestamp, retry state, and audit-safe payload. Replays must be idempotent. A `conflict`, `rejected`, or `requires_review` state is visible to the user and is never silently resolved with last-write-wins.

Background Sync may wake an open client, but it is not treated as a guaranteed closed-app authenticated worker. The safe promise is replay when the app is open or reopened. Official state must be based on server acknowledgement, not local queue state.

## Privacy and shared-device rules

Offline browser storage is not a secure patient-record vault. New offline adapters must minimize identifiers, prohibit patient free text unless separately governed, scope records by actor and tenant, and define logout/account-switch behavior. The global clear control removes platform snapshots and drafts after confirmation. ResusGPS and CPR-GPS recovery data remain in their separate stores and require their own lifecycle policy.

## Release gates

Before unsupervised operational use, run labelled synthetic/manikin tests on at least two Android devices covering offline/online transitions, stale snapshots, duplicate replay, server rejection, conflict review, low storage, account switch, screen lock, backgrounding, process termination, muted audio, denied notifications, and poor connectivity. Confirm that every offline screen uses truthful language and that no local record is mistaken for a server-confirmed record.

## Source of truth

The typed platform store is `client/src/lib/offline/platformOfflineStore.ts`. Domain adapters own the decision about what is safe to cache or queue. The generic legacy mutation queue is not a blanket offline solution. Server-authoritative routers, the canonical ResusGPS event timeline, IERS activation records, CPD records, and learning/certification records remain the sources of truth for official state.
