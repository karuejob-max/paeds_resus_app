# ACLS Phase 2 qualifying smoke audit — 2026-10-13

## Scenario under test
- Pathway: ACLS
- Intended qualifying family: Adult rhythm and stability decisions
- Intended scenario selected in the Hub: Adult stable narrow-complex tachycardia

## Confirmed blocker
1. The Hub scenario selector accepted **Adult stable narrow-complex tachycardia**.
2. After opening the mission and entering the authoritative room, the room displayed **Adult unstable bradycardia** and entered a PEA/cardiac-arrest state.
3. The room's own scenario selector was not shown before the session was already active, so the learner could not verify or correct the scenario before the rehearsal began.
4. Attempting **Exit without saving** opened the abandonment confirmation, but the subsequent room state remained visible and the next entry resumed the old PEA session at ~58–79 seconds rather than starting the selected stable tachycardia scenario.

## Consequence
- A learner can unknowingly complete the wrong ACLS Phase 2 scenario family.
- Server-authoritative Phase 2 evidence could be misclassified or the learner may abandon after seeing a contradiction.
- The smoke test is not counted as a qualifying ACLS rehearsal.

## Required remediation
- Pass the selected scenario ID from the Hub through briefing into the server start-session command.
- On room entry, display the active scenario identity before any action and ensure it matches the selected mission.
- Ensure abandon closes/invalidates the active session so a later entry cannot resume an abandoned session.
- Add regression tests for Hub-to-room scenario identity and abandoned-session non-resumption. Implemented with the pure resume policy tests: wait for authoritative refetch, resume only on matching scenario, and restart safely on mismatch.
