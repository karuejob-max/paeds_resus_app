# IERP / NERP Program — v2.0 Specification (2026-07-31)

**Status: this is the canonical, current design for the subsidised BLS/ACLS/PALS/NRP
cohort training program. It supersedes conflicting sections of
`COHORT_ACLS_PROGRAM_GUIDE.md` and `COHORT_ACLS_PROGRAM_INTEGRATION.md`
(both predate this respec and are being updated to point here, not rewritten
line-by-line — where they still disagree with this document, this document
wins). Source: CEO (Job Karue), verbal/written respec, 2026-07-31 — recorded
here in full so it isn't lost.**

---

## 0. Naming

- **IERP** = **Interns Emergency Readiness Program** (existing name, intern-cadre track).
- **NERP** = **Nurses Emergency Readiness Program** (new name, replacing "Nurse Cohort
  Program" everywhere, for naming parity with IERP).
- This whole BLS/ACLS/PALS/NRP training program — the thing this document
  describes — is **one phase** of a much larger, not-yet-designed
  **Institutional Emergency Readiness Program**, which will eventually cover
  whole-hospital, cross-cadre readiness (see §7, Coordinators, below).

  **⚠️ Naming collision, flagged, not resolved:** the intern track is called
  "**I**nterns **E**mergency **R**eadiness **P**rogram" (IERP) — and the future
  umbrella is "**I**nstitutional **E**mergency **R**eadiness **P**rogram," which
  collides on the same acronym, IERP. These are different things at different
  scopes (one cadre-specific track vs. the whole-hospital umbrella it will sit
  inside). Worth deciding a disambiguating name for one of them before the
  umbrella program gets built out — not resolved here, flagging so it isn't
  forgotten.

- Do not confuse this program's Phase 2 team roles (§3) with the existing,
  unrelated `cprTeamMembers` table's `role` enum (`team_leader`,
  `compressions`, `airway`, `iv_access`, `medications`, `recorder`,
  `observer`) — that table backs the ad-hoc, unscheduled, self-organised
  collaborative practice-session feature (`CollaborativeSession.tsx` /
  `JoinSession.tsx`), a different, older feature. This program's Phase 2
  roles (§3) are new and distinct, even though the underlying idea (name a
  role, track it) is similar.

---

## 1. Who this applies to, and what's explicitly deferred

- Applies identically to both tracks — IERP (interns) and NERP (nurses).
  Same training, same language, same knowledge; the tracks differ only in
  payment terms (§5) and marketing framing, not in curriculum or Phase 2/3
  mechanics.
- **Coordinators / institutional administration: parked, not designed here.**
  The program right now runs **without institutionalisation** — colleagues
  share it with colleagues at other hospitals, self-service, no facility
  admin gatekeeping anything (see §2). Coordinator-mediated workflows
  (facility-level rosters, institutional dashboards, coordinator approval
  steps) will be revisited when the broader Institutional Emergency
  Readiness Program is designed. This is deliberate, not an oversight —
  recorded here specifically so it isn't lost in the meantime.

---

## 2. Self-service enrollment (no coordinator gate, any phase)

A learner can enroll and progress through **all three phases** without any
coordinator/facility-admin action, whether or not their facility exists in
the platform's facility registry. This applies uniformly to Phase 1, 2, and 3.

This is a **change** from the current implementation, which auto-creates a
`pending` staff-facility link on profile save and waits on
`approveStaffFacilityLink` before certain things unlock — that coordinator
approval step should not be a hard gate for this program going forward.

---

## 3. Phase 1 — Cognitive Foundation

1. Learner completes the **platform's own cognitive modules** for the course
   they're doing. **BLS is a hard prerequisite** for starting the cognitive
   work of ACLS, PALS, or NRP — no exceptions, this ordering doesn't change.
2. Only after finishing the *platform's* cognitive work for a given course
   should the learner be directed to **elearning.heart.org** to create an
   account (or sign in) and complete that course's official AHA **Video
   Prework** and **Precourse Self-Assessment**.
3. The learner then uploads two documents for verification:
   - **Video Prework Completion Certificate** (elearning.heart.org)
   - **Precourse Self-Assessment Certificate**, showing a **passed score**
4. **Hard gate, both directions:**
   - The system **must not** allow anyone who has **not** completed the
     platform's own BLS **and** ACLS/PALS/NRP cognitive modules to upload
     elearning.heart.org certificates at all — redirect them back to finish
     the platform cognitive work first, don't just silently reject the
     upload.
   - Conversely, once a learner **has** completed the platform cognitive
     work for a specific course, they should be actively directed to
     elearning.heart.org for that specific course's prework, not left to
     find it themselves.
5. This upload-and-verify step replaces the current `phase1ProofUrl` /
   `approvePhase1Proof` coordinator-review flow with something that doesn't
   require a coordinator (see §2) — verification mechanism (auto vs.
   admin-reviewed queue) is an implementation decision for the build phase,
   not specified here.

---

## 4. Phase 2 — Online Simulations (role-based booking)

**No "hybrid" training type.** Only two kinds of scheduled session exist:
**Phase 2 (online simulation)** and **Phase 3 (hands-on)**. The current
`trainingType` enum's third value, `hybrid`, does not correspond to
anything in this program and should be treated as deprecated for cohort-
program purposes going forward (see §8 for the migration note).

### 4.1 Booking model
- Learners see a **calendar of available sessions** and can hold **one
  session booking at a time**.
- Sessions are **instructor-declared**, not coordinator-scheduled (see §4.4).
- Booking is **cross-program** — a single session can (and normally will)
  have participants from IERP, NERP, *and* the standard (non-subsidised)
  program together. The knowledge, language, and training are identical
  across all three; there is no reason to segregate sessions by track.

### 4.2 Roles, per session
A session has exactly these role slots:

| Role | Slots |
|---|---|
| Team Leader | 1 |
| Team Member — Airway and Ventilation | 1 |
| Team Member — Compressor 1 | 1 |
| Team Member — Compressor 2 | 1 |
| Team Member — Monitor/Defib/CPR Coach | 1 |
| Team Member — IV/IO Access and Meds | 1 |
| Team Member — Scribe | 1 |
| Observer | up to 7 |

That's 1 team leader + 6 named team-member roles + up to 7 observers per
session. A learner **must pick a specific role** when booking — no
unassigned/"whatever's left" booking — specifically so nobody freezes when
the simulation starts not knowing what they're meant to be doing. If a role
is already taken, the learner must pick a different one (or the observer
pool, if that's not full either).

### 4.3 Completion requirement — **changed, update everywhere**
To complete Phase 2, a learner must have:
- Served as **Team Leader** in at least **3** sessions.
- Served as **Team Member** in at least **6** sessions total, with **at
  least 1 session in each of the 6 named team-member roles**.

**This replaces the old "3 team member / 3 team leader" rule.** The team
*leader* minimum stays at 3; the team *member* minimum has been raised from
3 to **6** (one per named role, not just any 6). Every existing document
that still says "3 simulations as a team member" is wrong and needs
correcting — see §8 for the list found and fixed in this pass.

### 4.4 Instructor availability and session ordering
- Instructors declare their own availability from the instructor portal —
  the target slot is **1 hour, in the evening, ideally 8:30–9:30pm**, but
  the mechanism itself should just let an instructor declare a slot, not
  hard-code that specific window.
- **Ordering rule:** whichever instructor declares their availability
  *first* has their session(s) open for booking first, and that
  declaration order is the order sessions become bookable in generally —
  first-declared, first-open.
- Learners are not restricted to a single instructor's queue: once an
  instructor's session fills up (team leader + all 6 team-member roles
  taken, then observers), a learner can move to the **next** available
  session — from that instructor or any other instructor — whichever suits
  when the learner is actually free. The only hard constraint is that a
  **fully-booked session** (in the order team leader → team members →
  observers) cannot take more bookings.

### 4.5 Post-session qualification (role only counts once confirmed)
- A session role only counts toward the Phase 2 completion totals (§4.3)
  **after the instructor running that session confirms** the learner
  actually filled that role competently. Booking a slot and not showing up,
  or booking a slot and not really participating, must not silently count.
- **Retrospective fill-in:** sometimes the person who booked a role doesn't
  show, and someone else present (often an observer) steps in and actually
  performs that role instead. That person should be able to **submit,
  after the fact, a claim** that they filled a specific role on a specific
  date — and the **instructor who ran that session** must approve that
  claim before it counts.
- **Admin override:** an admin can override any of the above mechanisms —
  role assignment, qualification, retrospective-claim approval — for any
  session, at any time.

---

## 5. Phase 3 — Hands-on

- Unlocks only after Phase 2 is fully complete (§4.3's 3-leader/6-member
  requirement met and confirmed).
- Booking mechanics for Phase 3 sessions otherwise follow the existing
  hands-on session model (see `COHORT_ACLS_PROGRAM_INTEGRATION.md` for the
  as-built mechanics, which don't change here) — same-facility-by-default
  with an admin-approvable cross-facility exception remains appropriate
  for Phase 3 specifically, since it's the physical, in-person phase.

---

## 6. Progress visibility & payments

### 6.1 Progress bar
Learners should see, at all times:
- A **top-level % progress bar** across the whole program.
- A **detail view** breaking that percentage down **by phase** — what's
  done, what's remaining, specifically (e.g. "Phase 2: 2/3 team leader
  sessions confirmed, 4/6 team member roles confirmed — missing:
  Compressor 2, Scribe").

### 6.2 Payment ledger
Learners should see:
- What they've **paid so far**, and what **remains**, in one place.
- A **direct link to pay** — the learner enters their phone number, an
  M-Pesa STK push is sent, they pay. **This is the only payment method for
  now** — no other rails need to be built or supported.

### 6.3 Payment gating rules — **replaces the old rules entirely**
**Cognitive-level (Phase 1) access is never payment-gated, for anyone, on
either track.** Don't lock any cognitive course behind a payment check.

- **Interns (IERP):**
  - Phase 3 access requires the full program fee (KES 15,000) — payment is
    required at the point of "signing up for," i.e. booking, Phase 3.
  - Separately, if **4 months** pass since the intern's enrollment into the
    **BLS cognitive course** with **zero payment recorded**, access locks
    (this is the same 4-month deferred-payment mechanic that already
    exists — it isn't new, just restated here for completeness).
- **Nurses (NERP) — this is a genuine change from the current
  implementation:**
  - **BLS cognitive course is free** — no payment required to access or
    complete it.
  - To access the **ACLS cognitive course** (i.e. moving past BLS), the
    nurse must have paid at least the **starting month's minimum, KES
    2,500**.
  - **Phase 2 access** requires an ongoing **KES 2,500/month** payment pace
    — without it, Phase 2 booking is locked.
  - **Phase 3 access** requires the **full KES 15,000** paid.
  - This replaces the current implementation's rule, which requires nurses
    to pay KES 2,500/month starting from enrollment with no free BLS
    period at all — that "no free BLS, pay from day one" behavior no
    longer matches the intended design and needs to change.

---

## 7. Coordinators — deliberately parked

The program currently runs **without institutionalisation**: it spreads by
word of mouth between colleagues at different hospitals, not through any
per-hospital coordinator or facility-admin structure. Coordinator-mediated
features (approving facility links, reviewing Phase 1 proof, per-institution
cohort dashboards, coordinator-scheduled sessions) are **not being
redesigned right now** and self-service enrollment (§2) explicitly bypasses
them. This will be revisited when the Institutional Emergency Readiness
Program (§0) is designed — recorded here so the existing coordinator
surface area isn't quietly ripped out in the meantime, and so this decision
doesn't get lost between sessions.

---

## 8. What this changes in the current codebase (not yet built — tracked, not implemented in this pass)

This document is the spec; none of the following has been implemented yet
as of 2026-07-31. Recorded here as the gap list the next engineering pass
works from:

1. **Phase 1 upload gate** — `uploadPhase1Proof` currently has no check that
   platform cognitive modules are complete before accepting an upload, and
   the coordinator-review step (§2, §7) needs to come out of the required
   path.
2. **Phase 2 role-based booking** — `bookHandsOnSession` today has no
   concept of roles, capacity per role, or the team-leader/team-member/
   observer structure at all; it's a flat capacity count. This needs a real
   redesign: role enum (8 slots as in §4.2), per-role capacity, booking UI
   that shows which roles are taken, retrospective-claim submission +
   instructor approval, and admin override on all of it.
3. **Instructor availability declarations** — no mechanism exists for an
   instructor to declare their own availability; today only a coordinator
   creates sessions (`createTrainingSchedule`). This whole flow — declare →
   session opens → first-declared-first-open ordering — is new.
4. **Phase 2 completion counting** — `trainingAttendance.simulationRole`
   only distinguishes `team_member`/`team_leader` today (2 values, from the
   original 2026-07-17 design, §2.3 of `COHORT_ACLS_PROGRAM_INTEGRATION.md`)
   — it needs the 6 named team-member sub-roles plus observer, and a
   post-session instructor-confirmation step before a role counts (§4.5).
5. **Payment gating rewrite** — the actual gating logic in
   `bookHandsOnSession`/`payments.ts` implements the *old* rules (nurses
   pay from enrollment, no free BLS period). §6.3 above is a real logic
   change, not a tweak.
6. **Progress bar + payment ledger UI** — doesn't exist today in this form;
   `getPhaseSummary` and the payment-balance procedures in `payments.ts`
   already return most of the underlying numbers, but no UI assembles them
   into the described progress-bar-plus-ledger view.
7. **`hybrid` trainingType** — per §4, this program doesn't use it. Existing
   `hybrid` rows (if any exist in production) need to be identified before
   any code stops handling that value for cohort-program purposes.
8. **Renaming** — "Nurse Cohort Program" → "Nurses Emergency Readiness
   Program (NERP)" throughout code, comments, UI copy, and docs.

Text corrections already made in this same pass (documentation only, no
schema/logic change): the "3 simulations as a team member" wording in
`COHORT_ACLS_PROGRAM_GUIDE.md` and the "Min. 3 Completed" team-member note
in `COHORT_ACLS_PROGRAM_INTEGRATION.md`'s diagram — both corrected to 6,
per §4.3.
