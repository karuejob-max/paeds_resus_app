# CPR-GPS multimodal rebuild contract

**Date:** 2026-08-27  
**Status:** Implementation design; clinical source-owner review required before clinical sign-off  
**Scope:** CPR-GPS arrest-support surface, its ResusGPS handoff, and generic CPR team collaboration

## Objective

Make CPR-GPS usable under pressure by borrowing proven patterns from CPR feedback devices, official algorithm apps, team documentation tools, and offline references, while preserving the boundary that a software-only phone cannot measure compression quality, rhythm, ETCO₂, perfusion, or defibrillator state.

## Non-negotiable clinical contract

1. A verified actual weight is required before dose-bearing or energy-bearing content. Age-based estimated weight must not silently populate the dose context.
2. Delivery-room/newborn context explicitly selected as `delivery_room` routes to the dedicated NRP flow. A hospital or prehospital infant routes to PALS; age alone never routes to NRP.
3. Post-pubertal or age ≥12 years routes to the adult ACLS presentation only when adult support is explicitly enabled by the current governed content bundle. If adult content is not enabled, fail closed with an explicit approved-protocol handoff rather than displaying paediatric dosing.
4. The generic CPR engine accepts PALS or ACLS only. NRP remains a separate delivery-room workflow.
5. CPR starts with compressions, pads/rhythm work is surfaced immediately, and rhythm/shock actions require deliberate documentation. The interruption window is ten seconds.
6. Defibrillator pre-charge is prompted fifteen seconds before the two-minute reassessment window. The UI does not assert that charging or rhythm has actually occurred until the provider documents it.
7. Alerts are one prioritized current action plus one next critical action. Lower-priority information is available behind tools, never competing with the primary action.
8. Audio, haptics, screen salience, and text are redundant channels. None is the sole safety channel. Unsupported or blocked browser APIs must fail silently to a visible text fallback.
9. Audio requires an explicit user gesture to unlock on mobile browsers. Speech is cancelable, deduplicated for render-driven alerts, and never repeats the same alert on every render.
10. Offline mode may continue the local guidance/timer/event log, but synchronization is best-effort and visibly pending. No offline event is treated as server-confirmed until acknowledged by the backend.
11. Team/IERS linkage is additive. Existing generic CPR sessions must not silently become an emergency dispatch or staffing system. Production clinical activations, patient identifiers, and real test records are prohibited in validation.

## User-experience contract

The first viewport contains the CPR-GPS identity, verified weight and pack, arrest elapsed time, one current action, one cycle/rhythm countdown, one next-critical action, and compact shock/epinephrine counters. The tools drawer contains reversible causes, airway, summary, team, QR, voice, audio, haptics, and settings. Critical buttons are full-width, touch-safe, high contrast, and accessible with keyboard and screen-reader labels.

The console starts in `ready` or `syncing` state and never creates a server session on passive render without a deliberate CPR start or a parent-owned active case. The current parent flow may auto-start only when ResusGPS has already recognized cardiac arrest. ROSC always requires a confirmation dialog and hands back to post-cardiac-arrest care.

## Multimodal feedback contract

- **Metronome:** optional 100 beats/minute baseline; label it as a timing aid, not compression-quality feedback.
- **Speech:** current action and critical alerts only; cancel the previous utterance before a new one; provide stop/toggle controls.
- **Haptics:** critical, warning, and success patterns, feature-detected, with a settings toggle and no claim that vibration represents compression quality.
- **Screen:** `aria-live` current action, high-contrast state text, critical visual salience, and no safety dependence on animation.
- **Voice input:** optional progressive enhancement; all high-risk operations still require a visible deliberate confirmation.
- **Device feedback:** future validated device/AED integrations must be adapters with explicit provenance, capability checks, consent, privacy, and regulatory review. No simulated sensor values.

## Implemented slices in this branch

### A. Clinical contract and routing

The CPR entry path no longer silently fills dose-bearing weight from age. Pack results now expose age band and content-reference metadata. The resolver rejects invalid ages, keeps NRP behind explicit delivery-room context, and preserves hospital infant/child PALS versus adult ACLS routing. The generic CPR engine uses T-15 pre-charge timing, describes later PALS shock escalation instead of presenting an unjustified fixed value, and adds a clinician-controlled defibrillator-delay alert.

### B. Command console

The shipped first viewport keeps one current action, one countdown, one next critical cue, compact counters, prioritized alerts, a deliberate ROSC action, and the event log. A shockable rhythm now follows an explicit charge → ready → clear/shock path. The shock control is disabled until the provider documents the defibrillator as charged and available. Non-shockable rhythms require a no-shock reason before compressions resume.

### C. Feedback

A reusable feedback controller provides speech cancellation and keyed deduplication, explicit mobile audio unlock, safe fallback when speech synthesis is absent, feature-detected haptics, and visible audio/haptic support status. The metronome is a timing aid only and is gated by the audio unlock state. The legacy team CPR view uses the same safe speech controller.

### D. Recovery

A separate `PaedsResusCPRGPS` IndexedDB database stores a case-scoped local snapshot and event outbox. It preserves the CPR phase, elapsed time, cycle, rhythm, shock/epinephrine counts, airway and defibrillator state, and local event history. The UI shows offline and server-sync-pending status. The parent ResusGPS resume action hydrates the parent timer from the local CPR snapshot when available.

### E. Team collaboration boundary

The parent-provided case key scopes local recovery without creating a second patient identifier. The CPR session creator’s member ID is returned for attribution. Public joiners cannot self-assign Team Leader. The server allows another member’s role to be changed only by the session creator or current Team Leader, and prevents multiple active Team Leaders. The collaborative route derives the displayed role from the server-assigned member record rather than trusting a URL role hint. Team Leader view now exposes assignment controls for non-leader roles.

## Deferred release gates

Validated manikin/device compression feedback, AED/defibrillator telemetry, ETCO₂/rhythm integration, clinical source-owner signoff, formal usability study, hospital deployment/pilot, and adult ACLS content expansion remain release gates rather than assumptions. Existing IERS activation/case-link migration work remains the canonical path for emergency activation, resource claims, responder receipts, arrivals, team snapshots, and targeted role reports; this CPR slice does not create a parallel dispatch model.

## Validation contract

Use labelled synthetic simulations only. Minimum checks are: each NRP/PALS/ACLS routing branch; verified-weight and invalid-age failure states; PALS first and subsequent shock labels; T-15 pre-charge cue; shock disabled until charge confirmation; no-shock reason requirement; unsupported audio/haptics; IndexedDB snapshot/outbox round-trip; server-sync pending behavior; public join cannot self-assign Team Leader; and Team Leader role assignment authorization.
