# Simulation Hub UI/UX Audit — 15 October 2026

## Executive judgement

The Simulation Hub already has a strong **clinical engine** and a credible learning philosophy. It is not yet a state-of-the-art product because the learner experience still feels like a collection of powerful internal tools joined by cards, selectors, and status labels.

The opportunity is not to add more gamification. The opportunity is to create a single, calm, unmistakable **mission operating system**:

> **Choose one mission → understand the patient and objective → act → see consequences → reassess → debrief → know exactly what to do next.**

The product should feel like a premium emergency-response simulator, not a dashboard containing several simulation components.

## Important live finding

During the connected authenticated-browser audit, opening `/simulation-hub` redirected to `/institution` and remained on:

> “Loading institutional dashboard… Checking your access and preparing your facility workspace.”

This may be account-specific, but it is a **P0 trust and routing risk**. A learner must never click Simulation Hub and land in the wrong workspace or on an indefinite loading state. The route must either open the learner Simulation Hub or show a clear, actionable access explanation.

## What is already strong

### Clinical and learning foundations

- Server-authoritative simulation attempts and evidence boundaries.
- Deterministic scenario transitions and explicit physiology work.
- Course-scoped progress, avoiding cross-course contamination.
- Scenario selection persisted through route and room handoffs.
- Safe failure and coaching language rather than public ranking.
- Immediate debrief and weak-domain feedback.
- CPR-GPS save-before-exit hardening.
- Explicit training boundary: simulation is not credential issuance or live-care decision support.
- Five visible course lanes: BLS, ACLS, PALS, NRP, Heartsaver.

### Useful patterns recovered from earlier versions

The current product should preserve and strengthen these older good decisions:

1. **ResusGPS “one what-now line”** — the earlier UX audit correctly identified that the operator needs a single current next action rather than multiple competing panels.
2. **Reassessment nudges** — after a major intervention, the interface should actively surface “Re-check now” instead of leaving reassessment buried in a panel.
3. **ABCDE grouping** — organising threats by Airway, Breathing, Circulation, Drugs, and reassessment is more clinically legible than a flat action list.
4. **Always-visible Save / evidence state** — trust is built when the learner can see whether an action is local, pending, or server-recorded.
5. **Mobile sticky primary action** — the earlier mobile ergonomics work improved touch targets and kept the primary mission CTA visible. This pattern should become a system rule, not a one-off.
6. **Selected mission identity** — prior trust-signal work correctly made the actual course and scenario visible in the room. This must be elevated into a persistent “mission identity bar”.
7. **No public leaderboard** — the prior strategy is correct: compare the learner to their former self, not to colleagues.

## Current UX diagnosis

### 1. Entry and orientation — too much choice, too little direction

The Hub currently presents:

- Five pathway cards.
- A Mission HUD.
- Four summary metrics.
- A mission list.
- A recommendation card.
- Role evidence for some pathways.
- A scenario selector.
- Training-boundary copy.

This is comprehensive but not yet focused. A new learner must answer several questions at once:

- Am I in the right course?
- What should I do first?
- Is this practice or assessed evidence?
- Which mission is required?
- Which scenario should I choose?
- What does “completed” mean?

**Recommendation:** replace the initial dashboard with one dominant “Continue your next mission” hero and progressively disclose the rest.

### 2. Course selection — technically correct, emotionally weak

The course cards are colour-coded, but the colours currently function mostly as decoration. They do not communicate:

- Current readiness.
- Next required action.
- Time to complete.
- Why this mission matters.
- Whether the course is enrolled, locked, or merely available.

“Available” and “Not enrolled” are useful system states, but they are not enough for a learner making a time-pressured decision.

**Recommendation:** each course lane should show a compact state tuple:

`Course · next action · progress · estimated time · access state`

Example:

> **PALS** — Continue First Minutes · 2 of 4 missions · 8 min · Enrolled

### 3. Mission map — it behaves like a list, not a world

The Mission Director concept is good, but the visual experience remains a vertical card list. The learner does not feel that they are moving through a coherent operational journey.

**Recommendation:** use a horizontal or vertical mission route with four stable stages:

1. **Recognise**
2. **Stabilise**
3. **Escalate**
4. **Recover and hand over**

Each mission should show:

- Patient state.
- Clinical objective.
- One realism rule.
- Estimated time.
- Current mastery state.
- Why it is next.
- One primary action.

Do not show every metric by default.

### 4. Briefing — good information, wrong density

The briefing contains objective, reality rule, simulation room, and what counts. This is clinically useful, but it reads like metadata rather than a mission briefing.

**Recommendation:** transform it into a three-part pre-mission screen:

- **Situation:** one short patient handoff.
- **Your mission:** one observable objective.
- **Rules of the room:** timing, available information, and what will be scored.

Then one dominant CTA:

> **Start mission — approximately 8 minutes**

The selected scenario must appear in the title, not only in a lower selector or room label.

### 5. Active room — strong engine, weak command surface

The CPR-GPS component contains many valuable controls: timer, rhythm, shocks, epinephrine, airway, Hs & Ts, post-ROSC protocol, audio, haptics, and event logging. But this creates a risk: the learner sees the engine instead of the patient problem.

The interface needs a strict hierarchy:

1. **Patient state now**
2. **What changed**
3. **What must be decided next**
4. **Primary action**
5. **Secondary tools**
6. **Evidence and telemetry**

The current room exposes too many controls at once and relies on colour, small labels, and scrolling to explain priority.

**Recommendation:** introduce a “Command Surface” with:

- A single high-contrast patient-state strip.
- A one-line Mission Director instruction.
- One primary action group.
- A collapsible “Team / tools / log” drawer.
- A persistent timer and connectivity/evidence badge.

### 6. Feedback — too much score language, not enough behavioural language

“Best observed score”, “practice points”, and “mastery threshold” are useful internally but are not the best primary learner language.

Use a two-layer model:

- Primary: **Needs another rehearsal / Safe with coaching / Reliable under pressure**.
- Secondary: score, attempt count, threshold, and evidence details.

The learner should immediately know:

- What they did well.
- What caused harm or deterioration in the simulation.
- What single behaviour to practise next.
- Whether the attempt was saved.
- Whether the course Phase 2 card changed.

### 7. Debrief — should be the product’s signature moment

The debrief is currently treated as a result card or component outcome. It should become the most memorable learning moment.

Recommended structure:

1. **Patient outcome:** what happened and why.
2. **Three replay moments:** best decision, costly delay, missed reassessment.
3. **Five-domain map:** recognition, prioritisation, technical action, communication, reassessment.
4. **One coaching sentence:** the highest-value correction.
5. **Repeat only the weak segment:** not the entire mission unless necessary.
6. **Next mission CTA:** explicit and course-scoped.

The learner should never finish a simulation and wonder what to do next.

### 8. Accessibility and sensory design — promising but not yet a system

Audio cues, haptics, and colour themes exist. They need a formal sensory policy:

- No critical state communicated by colour alone.
- Distinct visual patterns for urgent, warning, completed, and pending.
- Audio is optional, short, non-startling, and labelled.
- Haptics never carry the only meaning.
- Respect reduced motion and reduced audio settings.
- Voice and audio controls remain available without entering a hidden settings drawer.
- Touch targets remain at least 44px and glove-friendly.

### 9. Loading, routing, and recovery — the largest trust risk

The live audit observed a redirect from `/simulation-hub` to `/institution` with an indefinite loading state. Even if account-specific, this is unacceptable for a premium training product.

Required behaviour:

- Route opens the correct workspace based on explicit role and entitlement.
- Loading states have a timeout and recovery CTA.
- Access errors name the reason and next action.
- A learner can return to the exact mission and scenario after refresh.
- Offline/pending/server-recorded evidence states are distinct.
- Exiting a room always offers: **Save and debrief**, **Pause**, or **Exit without saving**.
- The app never silently changes pathway or scenario.

## State-of-the-art target experience

### The “Mission OS” model

The portal should have five stable surfaces:

1. **Command Centre**
   - “Continue next mission” hero.
   - Course lane and Phase 2 state.
   - One recommended action.
   - Recent debrief summary.

2. **Mission Route**
   - A visual progression of mission families.
   - Locked states explain exactly why.
   - Completed states show mastery language, not only checkmarks.

3. **Briefing Deck**
   - Situation, objective, realism rule, controls, estimated time.
   - Explicit scenario identity.
   - Start button.

4. **Command Surface**
   - Patient state, next decision, primary action, timer, evidence state.
   - Secondary tools hidden until needed.

5. **Debrief Studio**
   - Replay, weak-domain coaching, repeat-segment CTA, next mission.
   - Phase 2 status refresh and clear boundary from credential issuance.

### Visual direction

Use a restrained “clinical operations centre” aesthetic rather than a generic dark game UI:

- Deep neutral background for focus.
- One course accent colour at a time.
- White or very light patient-state panel for readability.
- Strong red reserved for danger or deterioration—not brand decoration.
- Cyan/teal for system guidance and active focus.
- Emerald only for confirmed recovery or saved evidence.
- Amber for uncertainty or pending action.
- Consistent typography scale with fewer tiny uppercase labels.
- Motion used for state change, not decoration.

### Engagement model

Use psychological engagement without manipulation:

- Immediate agency: first meaningful decision within 10 seconds.
- Visible patient response to actions.
- Safe failure with a clear causal explanation.
- Progressive uncertainty.
- Short missions with a clear finish line.
- Repeat only the weak segment.
- Personal mastery trajectory.
- Spaced-repetition reminders based on weak domains.
- No streak anxiety, public ranking, shame, or artificial countdowns that do not represent the scenario.

## Priority roadmap

### P0 — Fix trust and safety before visual polish

1. Diagnose and fix `/simulation-hub` role/workspace redirect and indefinite institutional loading.
2. Add an explicit route-level loading timeout and recovery state.
3. Add a single persistent mission identity bar: course, mission, scenario, evidence mode.
4. Make save state explicit: Local / Saving / Saved / Needs retry.
5. Make every exit path explicit and safe.
6. Ensure the learner always receives a next action after debrief.
7. Add automated route-state tests for direct navigation, refresh, stale session, missing access, and wrong workspace.

### P1 — Rebuild the information hierarchy

1. Replace the current initial card stack with the Command Centre hero.
2. Convert the mission list into a route/progression map.
3. Reduce default visible metrics to progress, next action, time, and Phase 2 state.
4. Move detailed role evidence and practice points behind “View details”.
5. Replace score-first language with mastery language.
6. Make scenario choice part of the mission briefing, not a detached selector.
7. Standardise room headers across ACLS, PALS, NRP, Heartsaver, and BLS.

### P2 — Upgrade the room and debrief

1. Build the Command Surface component shared by all rooms.
2. Create the five-domain debrief studio.
3. Add weak-segment replay.
4. Add patient-state change animation and concise event narration.
5. Add deliberate sound/haptic cue mapping with accessibility preferences.
6. Add structured interruption and team-communication moments only after clinical-owner approval.

### P3 — Premium differentiation

1. Personal mastery timeline against previous self.
2. Adaptive mission sequencing by weak domain.
3. Educator analytics: common failure points, not public learner ranking.
4. Cohort mission packs and instructor review exports.
5. Downloadable replay summaries for learning portfolios.
6. Optional “challenge mode” only after the core safe mode is proven.

## Recommended product metrics

Track product quality, not only completion:

- Time from Hub entry to first meaningful decision.
- Percentage of learners who can identify the next action without prompting.
- Mission abandonment rate by screen.
- Scenario-selection correction rate.
- Save failure and retry rate.
- Wrong-pathway or wrong-workspace incidents.
- Debrief completion rate.
- Repeat-weak-segment uptake.
- Improvement between first and subsequent attempts.
- Mobile missed-tap and accidental-exit rate.
- Percentage of sessions with a clear server-recorded evidence state.

## What not to do

- Do not add a public leaderboard.
- Do not add more points, badges, or streaks before the core loop is clearer.
- Do not put every clinical control on the first screen.
- Do not use red, flashing, or sound to create artificial panic.
- Do not let a simulation completion imply credential issuance.
- Do not hide clinical rules to make the product feel like a game.
- Do not redesign each course separately; create shared interaction primitives with course-specific clinical content.

## Definition of a state-of-the-art release

The Simulation Hub is ready to be called state of the art when a first-time learner can:

1. Enter the correct course lane without confusion.
2. Know the next mission within five seconds.
3. Understand the objective and scenario before starting.
4. Identify the current patient state and next action during play.
5. Recover from an error without losing the session.
6. See whether evidence is saved to the server.
7. Finish with a meaningful debrief and one clear next action.
8. Resume on another device without ambiguity.
9. Use the experience with touch, keyboard, gloves, reduced motion, and muted audio.
10. Understand that the simulation is training evidence—not a credential or live-care replacement.

## Final recommendation

Do not pursue a broad visual rewrite first. The highest-return sequence is:

> **Fix routing and loading trust → establish the Command Centre and Mission Route → standardise the Command Surface → make Debrief Studio exceptional → then add richer sensory and adaptive features.**

This will make the product feel dramatically more advanced while preserving the strongest existing asset: the server-authoritative clinical simulation engine.
