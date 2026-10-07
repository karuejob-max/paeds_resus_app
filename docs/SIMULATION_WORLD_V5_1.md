# Simulation World V5.1 — Scenario Physiology Profiles

## Delivered

Each Simulation World scenario now has an explicit, versioned physiology profile:

| Scenario | Clinical training shape | Respiratory failure boundary | Arrest boundary |
|---|---|---:|---:|
| Septic shock arrest | Predictable shock with progressive respiratory compromise | 18 seconds | 42 seconds |
| Respiratory bradycardia | Faster respiratory deterioration with limited myocardial reserve | 12 seconds | 36 seconds |
| Postoperative equipment | Chaotic, resource-pressure deterioration | 10 seconds | 30 seconds |

Profiles own the initial hidden physiology, deterioration rates, metabolic debt, volume loss, and transition thresholds. The reducer no longer uses one global deterioration curve for every scenario.

## Validated transitions

Automated tests verify that:

- Each scenario has a distinct deterioration and arrest profile.
- Septic shock remains non-pulseless at 41 seconds and becomes pulseless at 43 seconds.
- Respiratory bradycardia remains non-pulseless at 35 seconds and becomes pulseless at 37 seconds.
- The postoperative scenario remains non-pulseless at 29 seconds and becomes pulseless at 31 seconds.
- Scenario-specific rates are applied to the hidden causal physiology.

The scenario contract is now `1.1.0`, so replay metadata can distinguish this transition model from earlier runs.

## Safety boundary

These are deterministic educational transitions, not validated patient-specific predictions. They remain labelled rehearsal infrastructure and must not be used as live-care guidance, AHA credentialing evidence, or an automatic Phase 2/3 decision. Clinical-owner review and synthetic/manikin comparison remain required before any formal assessment use.
