# ResusGPS Safety and Persistence Slice — 2026-10-02

## Scope

This slice implements the first safe subset of the remediation review. It is intentionally **client-only** and contains no schema, migration, server-authority, IERS, QI, payment, telemedicine, course-certificate, or production-data changes.

## Implemented

- Actor-scoped offline snapshots and command outbox.
- Cross-account protection for offline reads, updates, deletes, and replay.
- Logout cleanup of private snapshots while preserving owner-bound unacknowledged commands.
- Visible local-storage and pending-event failure states; no local queue is described as server-confirmed.
- ResusGPS active-session persistence and SAMPLE-history ownership checks.
- Persisted medication/reassessment deadlines instead of deriving durations from action text.
- Explicit reassessment reminder behavior that does not imply automatic treatment or repeat dosing.
- Dose-context snapshots and a visible dose-review gate before subsequent dose actions.
- Structured unavailable-resource disposition capture with unresolved critical/urgent gaps remaining visible.
- Regression coverage for timer rendering, account isolation, session persistence, engine safety, and synthetic hardening behavior.

## Deliberately excluded

The following were not included because they require separate governed work:

1. Database schema changes or unreserved migrations.
2. CPR server-authority and idempotency changes.
3. IERS receipt, acknowledgement, arrival, and closure changes.
4. QI/synthetic-data provenance changes.
5. Care Signal v3 and Safe-Truth schema/trigger work.
6. Retirement of payment, telemedicine, or legacy course endpoints.
7. Any production migration, seed, patient, activation, staff, Care Signal, or smoke-test record.

## Validation evidence

| Check | Result |
|---|---|
| `pnpm exec tsc --noEmit` | PASS |
| Focused clinical suite: engine safety, synthetic hardening, session store | PASS — 3 files / 22 tests |
| Direct component/persistence suite: timer, offline store, session store | PASS — 3 files / 18 tests |
| Standard `pnpm run test:unit` | PASS — 198 files / 991 tests |
| `pnpm run build` | PASS; expected bundle-size warning remains |
| `git diff --check` | PASS |
| Scope check | PASS — no `server/`, `drizzle/`, migration, CI, or package changes |

## Human gates still required

This record is **not** clinical validation, regulatory clearance, device integration, pilot approval, or authority for unsupervised offline use.

Before release claims or supervised pilot use:

- Assign a named clinical owner and complete [`RESUSGPS_CLINICAL_OWNER_REVIEW_PACKET_2026-09-21.md`](./RESUSGPS_CLINICAL_OWNER_REVIEW_PACKET_2026-09-21.md).
- Run [`RESUSGPS_LABELLED_SYNTHETIC_USABILITY_PROTOCOL_V1.md`](./RESUSGPS_LABELLED_SYNTHETIC_USABILITY_PROTOCOL_V1.md) on at least two labelled mobile devices using synthetic/manikin data only.
- Specifically test valid, incomplete, and out-of-range paired readings; dose review; pending/offline wording; storage failure; timers after reload; keyboard/glove operation; high contrast; and no premature progression.
- Record device, browser, network, observer, scenario, taps, errors, and stop-condition results.

## Next governed slices

1. **Server authority:** CPR session membership, terminal-state, idempotency, and conflict handling with server tests.
2. **IERS semantics:** separate receipt, acknowledgement, response, witnessed arrival, and closure; add real-router tests.
3. **Data provenance:** reserve and verify migrations before Care Signal/Safe-Truth schema or trigger changes.
4. **Legacy endpoint retirement:** remove fabricated success responses only after client call-site inventory and replacement states.
5. **Device evidence:** resolve owner and usability findings before any supervised pilot claim.
