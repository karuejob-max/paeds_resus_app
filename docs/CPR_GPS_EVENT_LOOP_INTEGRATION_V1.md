# CPR-GPS Event-Loop Integration V1

**Status:** Implemented in protected PR #617; migration application and labelled end-to-end simulation remain release operations.

**Purpose:** Define one auditable, privacy-preserving event loop from an IERS activation through ResusGPS, CPR-GPS, terminal outcome, PCAC, debrief, Care Signal, institutional QI, and adaptive-learning observation.

## 1. Non-negotiable boundaries

CPR-GPS remains a clinical cognitive aid. It is not a defibrillator, compression-feedback device, diagnostic device, rhythm monitor, ETCO₂ monitor, or substitute for a trained resuscitation team and local protocol. The platform must not infer rhythm, pulse, compression quality, perfusion, drug administration, or defibrillator state from browser, network, timer, or user-interface signals.

NRP is selected only for an explicitly selected delivery-room newborn context. Hospital infants and children route to PALS; adults route to the governed ACLS bundle. Age alone must never silently select NRP. Clinical content requires source-owner and local governance approval before clinical sign-off.

The event-loop bridge stores operational identifiers only. It must not store patient names, medical-record numbers, phone numbers, free-text patient identifiers, or other direct patient identifiers in bridge records.

## 2. Canonical lifecycle

```text
IERS activation
  -> assigned responder acknowledgement
  -> ResusGPS opens with opaque activation context
  -> CPR-GPS session created and linked once
  -> activation, arrival, resource, rhythm, medication, airway, and outcome events
  -> ROSC / pCOSCA / mortality / transferred / unknown / ongoing
  -> PCAC checklist and targets when applicable
  -> ERTL or authorized team-leader debrief
  -> named Care Signal prompt (optional)
  -> Care Signal report linked to the same CPR event (optional)
  -> institutional QI evidence/action item
  -> adaptive-learning observation and recheck
```

There is one activation-to-CPR-session link. Multiple provider Care Signal observations may refer to the same CPR session, but each Care Signal row is linked at most once. Standalone CPR sessions remain valid and do not receive institutional IERS credit unless a governed activation link exists.

## 3. Implemented data bridges

| Bridge | Table | Key rules |
|---|---|---|
| IERS activation ↔ CPR-GPS | `cprEventLinks` | One activation to one CPR session; unique on both IDs; pathway and content-version provenance; lifecycle status. |
| CPR-GPS ↔ Care Signal | `cprCareSignalLinks` | One Care Signal row linked at most once; one CPR session may have multiple provider reports; no patient identifiers. |
| IERS timeline | `iersActivationTimeline` | Link, outcome, debrief, and Care Signal association append operational timeline events. |
| Existing CPR session | `cprSessions` | Terminal outcomes include `ROSC`, `pCOSCA`, `mortality`, `transferred`, `ongoing`, and `unknown`. |

Migrations are intentionally additive and idempotent:

| Migration | Purpose | Production status |
|---|---|---|
| `0129` | Creates `cprEventLinks`. | Must be applied through the guarded production migration process. |
| `0130` | Adds `transferred` and `unknown` to the CPR outcome enum. | Must be applied after 0129. |
| `0132` | Creates `cprCareSignalLinks`. | Must be applied after 0130 and after any reserved 0131 workstream. |

`0131` is reserved by the IERP programme workstream and is not altered by CPR-GPS.

## 4. Authorization contract

The server is authoritative. Clients may carry an opaque activation ID, but cannot grant themselves access.

| Operation | Required authorization |
|---|---|
| Link CPR session to IERS activation | Active institutional membership, assigned active IERS responder, and access to the CPR session. |
| Record linked activation outcome | CPR-session access plus active access to the linked activation. |
| Submit linked debrief | Existing CPR creator/team-leader authorization, or the governed ERTL assigned to the linked IERS activation. |
| Link Care Signal | The submitting user must own a named Care Signal row and have access to the CPR session. Optional activation context must match the canonical CPR↔IERS link. |
| Read activation link | Active assigned responder access. |

The link procedures are idempotent. A repeated identical link returns the existing link. A different activation or CPR session produces a conflict. Revoked, declined, timed-out, failed, or non-member users are denied.

## 5. Client handoff

`ResusGated` passes the parsed activation identifier into `ResusGPS`. When the CPR server session is created, `ResusGPS` passes the session-ready callback into the solo/team CPR wrappers. The controller calls `cprEventLink.linkSession` once, carrying the opaque ResusGPS session key, routed pathway, and content version.

After CPR completion and debrief, the existing post-event Care Signal prompt carries `cprSessionId` and `activationEventId` to `/care-signal`. The destination page passes them into `CareSignalFormV3`. A named submission returns the stable Care Signal database ID and invokes `cprEventLink.linkCareSignal`. Pseudonymous and fully anonymous reports are not linked by user identity; they remain governed by the existing Care Signal privacy model.

## 6. Terminal outcomes

The user must deliberately choose a terminal or interim state. ROSC is not the only legitimate endpoint. The platform must preserve the distinction between:

- **ROSC:** return of spontaneous circulation, followed by PCAC.
- **pCOSCA:** post-cardiac-arrest care pathway where the existing product uses that label.
- **Mortality:** death outcome documented under applicable local policy.
- **Transferred:** care handed to another facility or team; outcome may remain unknown.
- **Unknown:** outcome not available at time of code closure.
- **Ongoing:** the session is not terminal and must not be presented as completed.

No outcome label independently establishes a clinical fact. The label records the authorized user’s documented event outcome and remains subject to debrief/QI review.

## 7. QI and adaptive-learning requirements

A submitted debrief is an operational record, not a quality judgment. QI processing should:

1. preserve the raw event timeline and its source;
2. distinguish observed facts, reported gaps, interpretation, and recommended action;
3. assign an owner and due date only through the institutional QI workflow;
4. accept closure evidence through an independent review state;
5. recheck the same readiness criterion later; and
6. avoid converting app navigation, alarm acknowledgement, or missing network events into clinical performance scores without corroboration.

The Care Signal pathway may create institutional evidence and action items through its existing server-side follow-up. The CPR bridge identifies provenance; it does not replace Care Signal consent, submission-mode, redaction, Fellowship, or review rules.

## 8. Release gates

The event loop is not ready for clinical sign-off until all gates below are complete:

| Gate | Acceptance evidence |
|---|---|
| Schema | `db:apply-0129`, `db:apply-0130`, and `db:apply-0132` applied idempotently in a non-production environment; `db:verify-cpr-event-loop` passes. |
| Authorization | Disposable-tenant real-router matrix passes success, replay/idempotency, cross-tenant denial, revoked membership denial, inactive responder denial, Care Signal ownership denial, and mismatched activation denial. |
| Multi-device | Two labelled devices reconnect after offline actions; the merged timeline has no duplicate event, drug, shock, arrival, outcome, or Care Signal link. |
| Bedside usability | Low-resource two-device “3am” manikin simulation passes direct entry, timer, audio unlock, haptic fallback, 10-second reassessment, airway/access lanes, terminal outcome, PCAC, and debrief navigation. |
| Clinical content | NRP/PALS/ACLS source owner approves each content bundle, pathway label, dose/energy rule, ventilation instruction, PCAC target, and review date. |
| Privacy | No bridge row contains direct patient identifiers; logs and analytics are reviewed for accidental narrative or URL leakage. |
| Deployment | Protected CI passes; deployment is verified read-only; migration application is separately logged; no production clinical test records are created. |

## 9. Known remaining gaps

The following are deliberately not silently claimed as complete: validated AED/ECG/compression/ETCO₂ adapters; device-level alarm delivery guarantees; true multi-device conflict-free event merging; direct IERS activation-ID linkage on every downstream QI object; full independent debrief review workflow; role-specific recorder/airway/medication projections; and formal clinical sign-off of every age/context bundle.

The next implementation slice should complete the activation-ID propagation into the downstream QI/evidence record and then run the disposable-tenant multi-device simulation. Hardware integration should follow only after capability, provenance, privacy, regulatory, and validation boundaries are approved.
