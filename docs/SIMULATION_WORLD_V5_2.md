# Simulation World V5.2 — Intervention–Physiology Coupling

## Delivered

The Simulation World now couples learner interventions to the hidden causal physiology and lets those changes alter subsequent observations and transition outcomes.

Oxygen support modifies oxygenation, ventilation, and metabolic debt using the selected scenario profile. The environment records oxygen support, and subsequent ticks only sustain respiratory recovery when supported ventilation and oxygenation are adequate. Fluid support modifies circulating volume and metabolic debt, then recalculates perfusion and observable circulation. A fluid intervention does not repair an untreated respiratory mechanism.

The tick/reducer loop now derives observable breathing and circulation from physiology and environment state. It can expose improving, stable, or deteriorating trajectories rather than using a single deterioration-to-arrest path.

## Validated learner-dependent branches

- Untreated respiratory deterioration crosses into pulselessness.
- Timely oxygen support prevents that arrest in the respiratory-bradycardia scenario and produces an improving trajectory.
- Fluid support improves circulating volume but does not prevent respiratory failure when the respiratory mechanism remains untreated.
- Existing role restrictions, hidden physiology, server-authoritative execution, replay validation, and ROSC tests remain intact.

The scenario contract is now `1.2.0` so replay metadata distinguishes the intervention-coupling model.

## Safety boundary

This remains deterministic educational rehearsal infrastructure. It is not live-care decision support, AHA credentialing evidence, or an automatic Phase 2/3 decision. Intervention coefficients require named clinical-owner review and synthetic/manikin comparison before any formal assessment use.
