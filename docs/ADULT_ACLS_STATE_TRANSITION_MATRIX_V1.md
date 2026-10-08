# Adult ACLS State-Transition Matrix V1

**Status:** Clinical review required. **Training approval:** not granted. **Assessment:** prohibited.

The engine may transition only when the stated preconditions are true. A learner action alone never guarantees a transition.

| Current state | Required clinical conditions | Permitted transition | Evidence/observation required |
|---|---|---|---|
| Stable | Adequate perfusion, acceptable pressure, alert or baseline mental status | Stable, unstable | BP/perfusion/mental status trend |
| Stable | Deteriorating pressure, perfusion, mental status, or respiratory state | Unstable | Observable deterioration |
| Unstable | Ongoing shock, worsening mental status, respiratory failure, or peri-arrest signs | Peri-arrest | Reassessment confirms worsening |
| Peri-arrest | Severe instability with pulse present | Cardiac arrest | Loss of pulse/unresponsiveness or engine-defined arrest threshold |
| Cardiac arrest + VF | Pulseless, unresponsive, shockable rhythm | Persistent VF, organised rhythm, or ROSC | Defibrillation followed by rhythm and pulse reassessment |
| Cardiac arrest + pulseless VT | Pulseless, unresponsive, shockable rhythm | Persistent pVT, organised rhythm, or ROSC | Defibrillation followed by reassessment |
| Cardiac arrest + PEA | Organised electrical activity with absent pulse | PEA persists, ROSC, or deterioration | Pulse assessment; shock is not therapeutic |
| Cardiac arrest + asystole | True non-shockable rhythm with absent pulse | Asystole persists, ROSC, or deterioration | Rhythm and pulse confirmation |
| Cardiac arrest | CPR, perfusion support, cause treatment, and reassessment are adequate | ROSC | Pulse, pressure, rhythm, and observable perfusion |
| ROSC | Pulse returns but pressure, ventilation, oxygenation, or rhythm remains unstable | Post-ROSC persistent shock, respiratory failure, recurrent arrhythmia, or stable post-ROSC | Repeated observations; ROSC is not completion |
| Post-ROSC persistent shock | Pulse present with inadequate pressure/perfusion | Stable post-ROSC, recurrent arrhythmia, or re-arrest | BP/perfusion trend and reassessment |
| Post-ROSC respiratory failure | Pulse present with inadequate ventilation/oxygenation | Stable post-ROSC, recurrent arrhythmia, or re-arrest | Respiratory pattern, SpO₂, CO₂ trend |
| Post-ROSC recurrent arrhythmia | Pulse/rhythm deteriorates after ROSC | Stable post-ROSC or re-arrest | Rhythm and pulse reassessment |
| Post-ROSC | Persistent untreated cause or worsening physiology | Re-arrest | Loss of pulse and observable deterioration |
| Any ended state | Session completed or terminal safety condition | No clinical transition | Evidence remains training-only |

## Non-permitted transitions

- PEA → therapeutic defibrillation success.
- Asystole → therapeutic defibrillation success.
- Oxygen → adequate ventilation without a ventilation intervention.
- Defibrillation → automatic ROSC.
- ROSC → automatic stable post-arrest physiology.
- Electrical pacing capture → automatic mechanical capture.
- Medication click → automatic rhythm conversion.
- Scenario completion → competence or credential.

## Determinism requirement

For a fixed scenario version, initial state, action sequence, and action timing, the resulting state and event ledger must be reproducible. Production variability may be added only after deterministic safety tests exist.
