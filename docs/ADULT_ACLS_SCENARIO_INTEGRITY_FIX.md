# Adult ACLS Scenario Integrity Fix

## Scope

This is a narrow P0/P1 integrity fix. It does not create competency, credential, Phase 2, or Phase 3 credit.

## Observed failure

Production verification reached the Adult ACLS room successfully, but the selected **Stable narrow-complex tachycardia** scenario loaded as **Unstable bradycardia**. The rehearsal was stopped and treated as an invalid integrity test. No evidence was accepted or used.

## Root cause and failure mode

Before this fix, `startAdultAclsSession` returned only the session identifiers and state. The client trusted the returned state and had no explicit comparison between the selected scenario and the authoritative session scenario. The server did store the requested scenario and created the state from the request, but the API contract did not expose a separate authoritative `scenarioId`, and there was no fail-closed protection if a deployed frontend/backend pair resolved different scenario data.

The exact vulnerable path was:

```text
AdultAclsSimulationRoom.scenarioId
  -> startAdultAclsSession({ scenarioId })
  -> createAdultAclsSimulation(scenarioId)
  -> simulationWorldSessions.authoritativeStateJson
  -> client setState(result.authoritativeState)
```

The missing invariant was:

```text
selectedScenarioId === response.scenarioId === response.authoritativeState.scenarioId
```

The prior tests covered engine initialization and clinical transitions, but did not exercise the launch API response plus client entry guard, nor a selector-to-session-to-room matrix.

## Implemented protections

1. `startAdultAclsSession` now returns the authoritative `scenarioId` and `scenarioVersion` from the created authoritative state.
2. The server rejects a scenario-resolution mismatch before creating a session.
3. The client compares the selected ID with both the returned authoritative ID and returned state ID before entering the room.
4. A mismatch is shown as a safe failure; the room is not entered and the client attempts to invalidate the created session as abandoned/invalidated.
5. Completion verifies `state.scenarioId === session.scenarioId` before creating any attempt or evidence. A mismatch invalidates the session and creates no evidence.
6. Evidence metadata records the authoritative session ID, scenario version, learner, enrollment, and role inside the evidence assessment payload. The evidence row uses the authoritative state scenario ID.
7. The regression matrix covers every currently selectable Adult ACLS scenario and asserts scenario identity plus scenario-specific initial rhythm, pulse, blood pressure, and mental status.

## Safety boundary

Adult ACLS simulation evidence remains synthetic, review-required, and non-credentialing. It does not grant Phase 2/3 completion, issue certificates, or establish competence.

## Validation completed locally

- `pnpm exec vitest run shared/adult-acls-simulation-world.test.ts shared/simulation-hub.test.ts shared/simulation-world.test.ts server/lib/resus-simulation.test.ts` — pass, 32 tests.
- `pnpm exec tsc --noEmit` — pass.
- `pnpm run lint:clinical` — pass.
- `pnpm run build` — pass.
- `pnpm run check` — pending final result at time of writing.

## Production acceptance still required

After protected merge and deployment, authenticated verification must record for every supported scenario:

```text
selected scenario = server response = persisted session = room = physiology = evidence = review queue
```

Do not complete or review a rehearsal until this identity chain is demonstrated in production.

## Post-merge verification

- Protected PR [#967](https://github.com/karuejob-max/paeds_resus_app/pull/967) merged as `049f3e2b3b310a7c074d1e4a3190e0e761a4b44f`.
- Authenticated My Browser production route: `https://www.paedsresus.com/simulation-hub?release=049f3e2b`.
- Production smoke test: selected **Stable narrow-complex tachycardia**, entered the Adult ACLS room, and observed the server-projected findings `supraventricular_tachycardia`, adequate pulse, BP `118/72`, SpO₂ `97%`, adequate breathing, alert mental status, stable phase, time `0s`.
- The rehearsal was exited without taking actions, completing, creating evidence, or testing review governance. This was deliberate: production integrity was verified without generating an artificial reviewed record.

## Scenario matrix

| Scenario ID | Scenario name | Engine identity + initial-finding regression | Production smoke | Evidence/review action |
|---|---|---:|---:|---|
| `unstable-bradycardia` | Unstable bradycardia | Pass | Not run | Not created |
| `stable-narrow-tachycardia` | Stable narrow-complex tachycardia | Pass | Pass | Not created |
| `unstable-tachycardia` | Unstable tachycardia | Pass | Not run | Not created |
| `vf-pulseless-vt` | VF / pulseless VT | Pass | Not run | Not created |
| `pea` | PEA | Pass | Not run | Not created |
| `asystole` | Asystole | Pass | Not run | Not created |
| `rosc-post-arrest` | ROSC and post-arrest deterioration | Pass | Not run | Not created |
| `acs-to-vf` | ACS to VF arrest | Pass | Not run | Not created |
| `hypoxia-to-arrest` | Hypoxia to arrest | Pass | Not run | Not created |
| `reversible-cause-arrest` | Reversible-cause arrest | Pass | Not run | Not created |

The full selector matrix is covered by deterministic tests. Production validation covered the representative stable scenario end-to-end through selection, authoritative session, room, and physiology. No claim is made that every scenario has been manually rehearsed in production.
