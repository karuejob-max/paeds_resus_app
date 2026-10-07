# Simulation World V5 — Causal Physiology Slice

## Delivered

This slice replaces direct vital-sign edits with a hidden causal physiology layer:

- Oxygenation, ventilation, circulating volume, myocardial function, respiratory drive, metabolic debt, and ongoing loss are stored as hidden state.
- Observed SpO₂, ETCO₂, heart rate, and systolic blood pressure are derived from that state.
- Respiratory failure increases ventilatory failure, hypoxaemia, carbon-dioxide burden, and metabolic debt over time.
- Pulselessness worsens oxygenation and metabolic debt through the same causal path.
- Oxygen support improves oxygenation and ventilation; fluid improves circulating volume and perfusion; shock improves only through the underlying variables.
- ROSC changes myocardial function, circulating volume, and metabolic debt rather than simply assigning a final vital-sign bundle.
- The client copy now states that the server advances time and physiology.

## Boundary

This is the first V5 physiology increment, not a validated patient-specific model. It remains a labelled training rehearsal and evidence-review workflow. It does not replace local protocols, instructor judgement, clinical governance, or AHA assessment, and it does not grant Phase 2/3 completion.

## Next V5 increments

1. Scenario-specific physiology parameters and validated transition tests.
2. Resource and intervention latency effects.
3. Closed-loop NPC task execution coupled to physiology.
4. Clinical-owner review with synthetic/manikin validation before any formal gate use.
