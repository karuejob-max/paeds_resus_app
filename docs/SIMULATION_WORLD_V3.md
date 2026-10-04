# Simulation World V3 — Authoritative Session and Evidence Boundary

## Delivered slice

- A learner starts a server-issued Simulation World session bound to their own enrollment, scenario, role, and engine versions.
- Every command is accepted only with the session nonce and the next sequence number. The server records a receipt hash and server elapsed time.
- Completion is stored as **review required** evidence. It does not grant IERP/NERP Phase 2 or Phase 3 completion and does not issue an AHA credential.
- The existing deterministic replay remains the authority for the generic practice attempt score. The new evidence ledger is a review queue, not an accreditation decision.

## Safety boundary

This is supplemental Life Support training infrastructure. It is not ResusGPS, live-care guidance, an automatic AHA assessment, or an IERP/NERP gate. A named clinical reviewer and labelled synthetic/manikin validation remain required before any evidence is used in a formal pathway.

## Migration reservation

Migration **0174** is reserved for the three additive tables used by this slice:

- `simulationWorldSessions`
- `simulationWorldCommandReceipts`
- `simulationWorldEvidence`

The migration is idempotent. Production application and verification remain a post-merge operational gate.

