# ResusGPS Deep-Dive Audit and Repair Record

**Date:** 26 August 2026  
**Scope:** Canonical `/resus` bedside flow, clinical safety boundaries, mobile/desktop usability, 3am reliability, analytics/adaptive-learning integration, IERS activation linkage, and legacy clinical surfaces.  
**Work boundary:** Changes were made on an isolated feature branch created from freshly synchronized `origin/main`. No production clinical records, patient identifiers, activations, QR tokens, or staffing test records were created.

## Executive finding

ResusGPS has a strong bedside foundation: a canonical gated `/resus` entry point, an offline-capable ABCDE/XABCDE engine, structured intervention and reassessment tracking, a CPR Clock, condition protocols, safety alerts, resource-unavailable capture, session persistence, and Care Signal/Fellowship bridges. It was not yet a complete 3am-safe product because several paths silently tolerated unsafe or ambiguous patient context, a new case could inherit prior demographics, analytics could attach a post-event loop to the browser tab rather than the clinical case, the definitive-care surfaces could construct dose-bearing content with a fabricated 10 kg fallback, and a stale generic clinical API exposed hard-coded duplicate guidance.

The first repair slice addresses those high-impact hazards without rewriting the emergency sequence. Missing or invalid weight is now treated as unknown; calculated definitive-care content fails closed until weight is verified; new cases clear prior demographics and receive a new analytics identity; Care Signal post-event events use the exact ResusGPS case ID; adult scope is explicit; the active top bar can scroll horizontally on narrow screens; and the stale generic clinical decision-support router now fails closed and directs callers to canonical ResusGPS.

## What is present and working

| Area | Evidence-based finding | Assessment |
|---|---|---|
| Canonical route | `/resus` reaches `ResusGated` and then the live `ResusGPS` page. | Good single provider-facing entry point. |
| Bedside sequence | Idle → quick assessment → XABCDE/ABCDE → interventions → reassessment → definitive care/export. | Clinically coherent base flow. |
| Emergency modes | Trauma mode supports XABCDE; non-trauma mode supports ABCDE; cardiac arrest opens the unified CPR Clock. | Strong high-acuity coverage. |
| CPR | CPR Clock has shared timer state, compression cycles, rhythm windows, shock/medication tracking, ROSC path, haptic and speech cues, and event logging. | Valuable but still requires device and human-factors validation. |
| Condition protocols | The canonical condition catalog includes septic shock, status epilepticus, DKA, NRP, anaphylaxis, severe asthma, and extended condition pathways such as pneumonia, meningitis, malaria, burns, trauma, anaemia, and AKI. | Broad paediatric/neonatal condition coverage. |
| Reassessment | Interventions expose reassessment prompts and fluid tracking includes volume-per-kg and refractory-state flags. | Good adaptive-loop foundation. |
| Resource gaps | Unavailable interventions/resources can be captured and sent through analytics/Care Signal pathways. | Directly supports institutional learning. |
| Persistence | ResusGPS sessions are saved through fellowship persistence endpoints and use idempotent session IDs. | Good audit and recovery foundation. |
| Offline analytics | The analytics hook queues failed events in IndexedDB and drains on reconnect. | Strong resilience, but clinical case linkage must be preserved. |
| IERS linkage | Activation deep links can open ResusGPS case context with location, resources, responder status, QR/witnessed arrival, and targeted role reporting. | Product integration is structurally present. |
| Notification layer | Foreground visual/audio after consent, best-effort Web Push, persistent service-worker notification, receipt/response actions, and fallback polling are implemented. | Operationally useful, not a guaranteed alarm system. |

## What was missing or unsafe before repair

### Patient-context safety

The context parser accepted negative, zero, non-finite, and implausibly large weights. Several definitive-care surfaces used `session.patientWeight ?? 10` or `weight || 10`, which could present calculated doses as though the patient weighed 10 kg. The normal intervention formatter correctly showed per-kg instructions when weight was missing, but the definitive-care protocol builders did not fail closed.

The new shared `patientDemographics` guard accepts 0.3–300 kg, rejects malformed/out-of-range values, and treats blank input as unknown. The ABCDE engine, definitive-care resolver, central protocol builder, condition-protocol sheet, definitive-care panel, and patient-demographics context now use this boundary. Missing weight is never replaced with a fabricated patient weight in the live ResusGPS save payload.

### New-case contamination

The shared demographics context persisted age and weight across the session. Before the repair, a provider starting a new case could encounter the previous case’s patient context. The New case action now clears the shared demographic store and creates a fresh empty session. The provider can still start the ABCDE assessment immediately, but the UI clearly states that actual weight must be verified before using a calculated medication dose.

### Case-scoped adaptive learning

The ResusGPS analytics hook originally reused one tab-level session ID. A new clinical case could therefore be mixed with previous case events, and the Care Signal post-event prompt generated a separate local analytics identity. The hook now exposes an explicit per-case reset method, ResusGPS resets it on start/resume/New case, and the Care Signal prompt receives the exact ResusGPS session ID.

### Conflicting clinical API

`clinicalDecisionSupportRouter` contained hard-coded diagnostic probabilities, treatment protocols, dosing, interactions, severity, and outcome-style responses. It was not used by the live `/resus` route, but it remained an unsafe parallel API surface. All of its endpoints now fail closed with a clear instruction to use canonical ResusGPS. Its direct tests were changed to prove this contract.

### Scope clarity

The product is a paediatric/neonatal bedside reference tool, not an adult resuscitation system. The disclaimer now states that adult pathways are not currently supported and that providers must use their approved adult emergency protocol rather than apply paediatric doses to adults. This is a scope guard, not an adult clinical implementation.

### Mobile usability

The active top bar contained timer, patient context, threats, arrest, undo/redo, protocol, documents, log, save, and New case controls in a single flex row without a narrow-screen overflow strategy. The bar now uses a horizontal scroll container with a minimum-width control row, keeping controls reachable instead of allowing overlap or clipping. This is a bounded layout repair; it still needs real-phone validation.

## 3am test assessment

| 3am question | Result after repair | Remaining work |
|---|---|---|
| Can a provider reach one canonical tool? | Yes: `/resus` is the canonical route. | Verify all bookmarks/deep links and remove or redirect confusing legacy links where appropriate. |
| Can the provider start immediate assessment? | Yes; start remains available without waiting for weight. | Human-factors test whether the demographic card distracts from emergency entry. |
| Can invalid weight produce a calculated dose? | No; invalid values are rejected and dose-bearing definitive-care content fails closed. | Test malformed persisted sessions and device autofill on real browsers. |
| Can a new case inherit the last patient? | The shared demographics are cleared on New case and analytics identity is reset. | Test reload/resume/new-case sequences on two mobile browsers. |
| Can the provider distinguish a paediatric tool from an adult protocol? | Yes; scope copy explicitly excludes adult use. | Governance decision required before any adult expansion. |
| Can a CPR timer be used hands-free? | Speech/haptic/metronome support exists after user/device permission and interaction. | Verify iOS/Android background, volume, lock-screen, battery saver, and permission behavior. |
| Can the provider work without network? | Core clinical engine is offline-safe and analytics queues failed events. | Test service-worker cache freshness, offline entry, reconnect, and duplicate event drain. |
| Does the event feed adaptive learning? | Structured events, resource gaps, case persistence, Fellowship, Care Signal, and IERS targeted reporting are connected. | Add institutional dashboards that consume normalized ResusGPS case/resource/reassessment signals consistently. |
| Can users be overloaded by old parallel guidance? | The stale generic clinical API now fails closed. | Audit links/bookmarks and remove unused legacy UI surfaces in a separate small change. |

## Population and condition assessment

ResusGPS is currently appropriate for **neonatal and paediatric** emergency reference support when used by trained providers under local policy and senior review. The condition catalogue is broad for paediatric emergencies, and trauma/XABCDE and neonatal resuscitation are represented. The platform is not yet an adult resuscitation product. Adult support should not be implied by generic age labels or by reuse of paediatric calculators. A future adult mode would require a separate governed clinical content set, adult age/weight boundaries, adult-specific shock/airway/CPR rules, medication maximums, user-interface scope separation, and independent clinical review.

The presence of a protocol in the catalogue is not equivalent to clinical completeness. Local formulary, dilution, concentration, route, equipment, escalation, referral, and senior-review requirements still need facility configuration or explicit display. High-risk pathways requiring dedicated validation include neonatal resuscitation, status epilepticus, DKA, severe asthma, shock/fluids, trauma, burns, and all medication calculators.

## Integration with the Paeds Resus platform

### Individual utilization

ResusGPS is reachable from the individual provider platform and can be opened from IERS activation context. Providers can see activation location and needed resources, respond, record arrival, use QR/witnessed arrival, and submit targeted role reports through the IERS-linked case context. A provider can also submit a separate Care Signal report; the systems must remain distinct while sharing only the minimum case linkage needed for learning and audit.

### Institutional utilization

IERS supplies the operational context: dated UTL/ERTL/ERT roles, responders, activation event, missing resources, arrivals, and timeline. ResusGPS supplies bedside structured assessment, intervention, reassessment, CPR, and condition-protocol observations. The institution should consume aggregated readiness signals, not patient identifiers or unreviewed clinical conclusions.

### Adaptive learning

The repaired case-scoped analytics identity makes it possible to distinguish one ResusGPS case from another and to attach post-event Care Signal and Fellowship interactions to the correct case. Resource-unavailable events, reassessment completion, intervention delays, role-linked targeted reports, and activation response/arrival data form a useful adaptive-learning spine. The remaining product work is to normalize these signals into an institution-facing improvement loop: recurring resource gaps → action item → owner → evidence → recheck → readiness trend.

## Remaining gaps and mitigations

| Gap | Risk | Mitigation |
|---|---|---|
| No adult pathway | Adult user may apply paediatric advice. | Explicit disclaimer now shipped; keep adult route out of scope until separately governed. |
| Device behavior untested | Audio, push, haptics, camera, and offline behavior may fail on specific phones. | Run labelled two-device simulations on supported Android/iOS/browser combinations. |
| Browser audio permission | Sound may be blocked until user gesture or by OS settings. | Pre-duty notification and CPR-audio setup with explicit permission status; retain visual fallback. |
| Push is best effort | Push acceptance is not proof of display or sound. | Require responder receipt/response as authoritative operational evidence. |
| Clinical content governance | A mathematically correct dose can still be wrong for local concentration/route/context. | Version clinical content, show source/date, require local protocol review, and maintain senior override documentation. |
| Stale legacy surfaces | Users may enter an older flow through a bookmark or hidden route. | Keep canonical route prominent; perform a separate route/link audit and redirect or label legacy surfaces. |
| Adaptive-learning normalization | Data may remain fragmented across analytics, IERS, Care Signal, and Fellowship. | Define a shared case-event key and institution-facing rollup contracts without patient identifiers. |
| Storage corruption | Old persisted sessions may contain invalid values. | Context parser now sanitizes; add explicit stale-session migration/expiry and device tests. |

## Validation completed on this branch

- Focused ResusGPS safety tests: passed.
- Definitive-care tests: passed.
- ResusGPS UX helper tests: passed.
- Advanced-systems router tests: passed, including stale clinical endpoint fail-closed assertions.
- Repository unit suite before final branch gate: passed (761 tests across 141 files).
- Production build after the latest page and router changes: passed.
- Clinical-content lint: passed.
- `git diff --check`: passed after normalization.

Full TypeScript and protected CI remain required before merge. No claim of production clinical sign-off is made by this record.
