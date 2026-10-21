# ILSP hostile audit — 2026-10-21

## Verdict

The ILSP sponsored-course code path is materially safer after this audit, but it is **not yet a complete production-proven institutional training campaign**. Unit-level authorization and entitlement tests pass. A live authenticated production redemption, rate-limit evidence, and the broader campaign/approval/payment model remain outstanding.

## Scope reviewed

- `server/routers/institutional-life-support.ts`
- `server/lib/global-entitlements.ts`
- `drizzle/schema.ts`
- migration scripts `0184` and `0185`
- ILSP authority and entitlement tests
- the ILSP architecture and MVP prioritization documents
- stale-platform audit findings concerning migration parity, authorization, auditability, and delivery truth

## Findings and dispositions

### P0/P1 findings fixed in this change

1. **Cross-institution department misbinding.** A caller with institution-wide authority could submit a department ID belonging to another institution. The code would be created but could not be redeemed by the intended staff, and the input was not being validated against the institution boundary. Issuance now requires the selected department to be an active row owned by the selected institution.

2. **Seat burn before enrollment success.** Redemption previously consumed the entitlement and wrote the immutable redemption record before inserting or unlocking the canonical course enrollment. A failed enrollment insert could therefore permanently consume a seat without granting access. Redemption now performs the seat claim, redemption ledger write, and enrollment create/unlock in one transaction.

3. **Repeated redemption consumed additional cohort seats.** A learner with an already-completed active enrollment could submit the same or another institutional code and consume a second seat. The route now returns idempotently when the learner already has active completed access and does not consume another entitlement.

4. **Race-safe capacity claim.** The existing conditional update remains the final capacity gate inside the transaction, so concurrent redemptions cannot exceed `maxRedemptions` when the database reports the affected-row count correctly.

### Confirmed controls already present

- Access codes are hashed at rest; plaintext is returned only at issuance.
- Codes are programme-specific and support expiry, revocation, bounded redemption, and department scope.
- Preview and redemption re-check current institution membership and department membership.
- Departmental Heads/Deputies are resolved from active appointment rows rather than client-supplied roles.
- Institution and department reads are filtered server-side.
- Redemption writes an immutable `globalEntitlementRedemptions` record.
- ILSP sponsored access points to canonical BLS/ACLS/PALS/NRP enrollments rather than creating shadow course progress.
- The ILSP certificate boundary remains separate from AHA/NRP evidence and certification.

## Remaining gaps — do not call these green

1. **No demonstrated abuse-rate control.** The preview and redemption procedures do not yet show an explicit per-account/IP/device rate limit or lockout policy. A leaked code is bounded by capacity and expiry, but an attacker can still probe codes or create avoidable database load. Add a privacy-safe rate limiter and monitoring before broad public launch.

2. **Not the full target campaign model.** The current MVP implements institution-issued access codes for canonical courses. It does not yet implement the architecture's complete campaign/order/seat workflow with coordinator approval, commercial approval, funding state, target completion date, learner `pending_approval`, and campaign-linked reporting.

3. **Department membership is a live prerequisite, not a durable assignment snapshot.** A learner who is moved or removed after preview can be blocked at redemption, which is safe, but the system does not yet record a campaign seat or explicit reason for the failed assignment. This needs a campaign/seat model rather than more code fields.

4. **No browser-to-MySQL production proof in this audit.** The authenticated QA redemption flow has not been executed from this sandbox. Production acceptance still requires a fresh BLS code, preview/consent, redemption, canonical enrollment check, repeat-redemption check, wrong-department denial, revocation denial, expiry denial, and cleanup.

5. **Migration parity is not proven here.** The inherited context says `0184` and `0185` were run in a Render shell. This audit did not connect to or independently verify the production schema, deployed build SHA, or migration checksum. The release manifest must contain that evidence.

6. **Audit trail lacks a first-class code lifecycle event stream.** Creation, preview attempts, redemption denial reasons, successful redemption, and revocation are inferable from current entitlement/redemption state, but there is no dedicated append-only access-code event table. This is adequate for the narrow MVP but insufficient for disputes, support, and institutional reporting at scale.

7. **No manager-approval mode.** The architecture calls for optional `pending_approval`; the current code activates canonical course access immediately after authenticated membership and code acceptance. This must be made explicit in product policy and added before institution-wide self-enrollment is marketed.

## Validation performed

- TypeScript: `pnpm exec tsc --noEmit` — passed.
- Targeted tests: `pnpm exec vitest run server/lib/global-entitlements.test.ts server/lib/ils-authority.test.ts server/routers/institutional-life-support.test.ts` — 3 files, 12 tests passed.
- Formatting and whitespace: Prettier plus `git diff --check` — passed.

## Release recommendation

Merge the integrity fixes as a narrow hardening release. Do not describe ILSP as fully production-ready until the authenticated production smoke test, deployed schema/build evidence, rate limiting, and an explicit decision on immediate activation versus manager approval are recorded.

## Next highest-impact action

Run the controlled production QA redemption matrix on the deployed commit, then add a rate-limited access-code attempt ledger and campaign/seat approval state before widening code issuance beyond the QA institution.
