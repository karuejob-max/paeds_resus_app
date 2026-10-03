# Simulation Hub Strategy

## Product promise

Simulation Hub is a video-game-style rehearsal room for emergency decisions. It is **not** a game about winning points or competing with colleagues. It is a safe place to practise recognition, prioritisation, action, communication, reassessment, and recovery until those behaviours become more reliable under pressure.

## Psychological design

1. **Progressive exposure** — start with a clear first-minutes mission, then introduce deterioration, uncertainty, and team pressure.
2. **Safe failure** — errors produce understandable patient consequences and coaching, never shame or a public ranking.
3. **Specific stakes** — every mission has one clinical objective, one realism rule, and a visible expected time.
4. **Desirable difficulty** — incomplete information and interruptions are introduced only after the learner has a stable foundation.
5. **Mastery language** — learners see `Needs another rehearsal`, `Safe with coaching`, or `Reliable under pressure`, not a judgemental score table.
6. **Immediate debrief** — existing simulation engines show event logs and remediation after each attempt.
7. **Spaced repetition** — server-recorded attempts and existing booster logic make returning later meaningful.
8. **Identity and agency** — the learner chooses a mission and is briefed on the objective before entering the room; nothing is hidden to create artificial frustration.

## Current playable vertical slice

- **The first minutes** — Cardiac Arrest track.
- **Deteriorating child** — ABCDE track.
- **Rhythm under uncertainty** — Rhythm Recognition track.
- **The full deterioration arc** — PALS capstone: ABCDE → shock recognition → deterioration → CPR → ROSC → post-resuscitation care. This mission uses an explicit 80% Sim-Ready threshold.
- **Resus room** — AI roleplay track, unlocked after the first-minutes rehearsal.

The Hub reuses the existing, tested Practice Lab engines and server attempt recording. This avoids duplicating clinical scoring logic or creating a second source of truth.

Every debrief now produces a five-domain performance map: recognition, prioritisation, technical action, communication, and reassessment. The weakest evidenced domain becomes the next rehearsal recommendation. The AI resus room also supports optional browser voice dictation with typed input as the fallback.

## Guardrails

- Training simulation only; no AHA credential is issued.
- Not for live patient care; use ResusGPS and local protocols in real emergencies.
- No public leaderboard, peer ranking, streak pressure, or monetised lives.
- Clinical content, scoring, and consequence rules remain owned by the existing simulation engines and must receive clinical-owner review before expansion.
- A new mission must have an objective, supported program scope, failure explanation, and debrief before release.

## Remaining governed stages

1. Add mission-specific scenario packs and richer consequence state transitions after clinical-owner approval.
2. Add optional role assignment and closed-loop communication tasks.
3. Add audio/visual sensory cues only after accessibility and device testing.
4. Add cohort-level analytics for educators without exposing individual public rankings.
5. Validate with labelled synthetic/manikin sessions on at least two mobile devices and clinical-owner review. This is a release gate, not a software-only task.
