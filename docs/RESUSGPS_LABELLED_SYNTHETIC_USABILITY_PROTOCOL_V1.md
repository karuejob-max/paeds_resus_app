# ResusGPS Labelled Synthetic/Manikin Usability Protocol v1

**Purpose:** Validate bedside interaction reliability only. This protocol is not clinical validation, regulatory clearance, device integration testing, or permission for unsupervised offline use.

## Test boundary

Use a labelled manikin, disposable training materials, synthetic patient context, and test accounts only. Do not enter patient identifiers, real activation records, real care/code signals, or production clinical observations. Record the deployment, account, device, browser, network state, scenario label, and observer initials for every run.

## Devices

Run the same scenarios on at least two mobile devices with different screen sizes or operating systems. One device should represent a smaller Android phone; the second should represent the facility's likely iOS or larger Android phone. Record browser version, viewport, keyboard, glove type, and whether audio/haptics are enabled.

## Scenarios

| ID | Scenario | Required observation | Pass condition |
|---|---|---|---|
| S1 | Valid paired vital readings | Enter values within displayed bounds using touch and keyboard. | One evident valid action; CTA becomes available; no duplicate entry; next step is clear. |
| S2 | Out-of-range readings | Enter below-minimum, above-maximum, non-finite/empty, and partially completed pairs. | Amber invalid state, accessible range alert, explicit `Enter valid readings`, no progression. |
| S3 | Context routing | Test hospital newborn, explicit delivery-room newborn, preterm gestation, hospital child, adult with adult content disabled. | Correct pack or clear block; no silent NRP/adult inference; estimate is visibly labelled. |
| S4 | Offline/pending wording | Toggle network after a synthetic event and reload. | UI distinguishes local pending from server receipt; no false “synced” claim. |
| S5 | Glove/keyboard operation | Use disposable gloves, touch targets, mobile keyboard, and one-handed operation. | No missed primary action in three attempts; controls remain visible and usable. |
| S6 | High-contrast visibility | Test normal and high-contrast/zoomed display. | Invalid, urgent, reassessment, and next-action states remain distinguishable without colour alone. |
| S7 | CPR guard behavior | Synthetic arrest case: attempt close, repeat terminal command, and retry an event. | No accidental exit; repeat is idempotent; failure leaves recoverable state. |
| S8 | IERS delivery semantics | Synthetic activation with notification denied/backgrounded and witnessed arrival. | Receipt, acknowledgement, response, and arrival remain separate; manual fallback is visible. |

## Evidence capture

For each scenario record completion time, number of taps, wrong taps, repeated entries, verbal confusion, keyboard/glove issue, alert audibility/visibility, network state, and whether the participant could state the next action without prompting. Capture screenshots or screen recordings only from synthetic accounts and with no identifiers.

## Stop conditions

Stop the run if the interface implies treatment succeeded, implies server receipt without evidence, permits progression with invalid paired readings, silently chooses NRP or adult ACLS, loses the active case on retry/failure, or mixes witnessed arrival with notification acknowledgement. Escalate the observation to the named clinical owner before further testing.

## Acceptance boundary

A scenario is usable only when the pass condition is met on both devices and no stop condition occurs. Even if all scenarios pass, the outcome may be reported only as **labelled synthetic/manikin usability evidence**. It must not be reported as clinical effectiveness, clinical validation, regulatory approval, device integration, or authority for unsupervised offline use.

## Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Test lead | To be assigned |  |  |
| Clinical owner | To be assigned |  |  |
| Product/safety reviewer | To be assigned |  |  |
