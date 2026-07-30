# North Star v2.1 — Addendum: Fellowship Pillar A/C, Practice, and Instructor Sequencing

**Status: ADOPTED. Signed off by leadership (CEO) 2026-07-27. Supersedes the
corresponding parts of NORTH_STAR_V2.md's Fellowship section (previously
under-specified — Pillar A committed to a certification requirement that was
never implemented; this addendum specifies it). Engineering against this
spec may now begin.**

This addendum amends §5.2 (Courses and the Paeds Resus Fellowship), §6.2 (Provider
Cadre Classification, informationally — no change to the table itself), and the
Instructor Course description. It closes a gap between §5.2 as written and what
`fellowship-progress.service.ts` currently enforces: the document already commits
Pillar A to "defined certification **and** micro-course requirements," but no
certification requirement has ever been implemented — Pillar A today checks only
the 29 micro-courses. This addendum specifies what that certification requirement
actually is, and extends the model in two ways leadership has not yet ratified:
CPD inclusion in Pillar C, and a Fellow-status prerequisite for a new instructor
tier.

---

## Pillar A and Pillar C, in full — nothing removed, two things added

To be explicit, since this addendum only ever amends by addition: **neither
Pillar A nor Pillar C loses anything it already had.**

Pillar A is one-time completion requirements — things proven once, not proven
monthly. The pre-existing 29-microcourse requirement
(`getFellowshipMicroCourseRequiredCount()`) is untouched. §1 below adds the
certification requirement §5.2 always committed to but never implemented.

| Pillar A component | Status |
|---|---|
| 29 fellowship micro-courses | **Unchanged** — already implemented, already enforced |
| BLS + ACLS + PALS + NRP certification | **New** — specified in §1, not yet implemented |

Pillar C is ongoing monthly discipline — things proven every month, with the
same grace mechanism applying to both. CPD joins Care Signal here, not Pillar
A, because it is monthly-recurring like Care Signal, not a one-time
completion like a certification or a course.

| Pillar C component | Status |
|---|---|
| Care Signal, ≥1 eligible submission/month, 24 consecutive months | **Unchanged** — already implemented, already enforced |
| CPD, 1 qualifying session/month | **New** — specified in §3, not yet implemented, shares Care Signal's existing grace mechanism |

## 1. Pillar A certification floor: BLS + ACLS + PALS + NRP

The Fellow title certifies that a provider will not be stranded regardless of who
arrives in front of them — the mother who collapses beside her child's bed, the
15-year-old in heart block, the newborn who does not breathe at delivery. No
single AHA certification covers that range. Pillar A's certification requirement
is therefore all four:

| Certification | What it covers |
|---|---|
| BLS | Foundational life support, any age |
| ACLS | Adult cardiac arrest and peri-arrest management |
| PALS | Paediatric emergency and critical care |
| NRP | Neonatal resuscitation |

This is deliberately **not** cadre-scoped. §6.2's cadre table differentiates
target audience by course (e.g. ACLS is scoped to "doctors and senior nurses" as
a *course-marketing* target), but the Fellow title itself certifies one thing —
readiness for whatever walks in — and that does not vary by the Fellow's cadre.
A Fellow who is a Clinical Officer and a Fellow who is a Paediatrician hold the
same floor.

## 2. Fellowship eligibility: all healthcare personnel and healthcare students,
   not general enrollment

Fellowship enrollment is open to all healthcare-personnel cadres in the existing
§6.2 table (Community Health Worker through Other Specialist) and to healthcare
students specifically (Nursing Student, Medical Student, Other Trainee) — not to
non-healthcare-personnel individual accounts. This does not change who can hold
an Individual Actor account or take individual courses (Heartsaver remains open
to lay rescuers per §5.2's existing table); it scopes who can pursue the Fellow
title itself. Decided over the alternative of restricting Fellowship to nurses
only, on the grounds that eligibility and community identity are different
levers — Fellowship's content and culture can stay nursing-forward, where the
platform's roots are, without narrowing who is allowed to earn the title.

## 3. CPD joins Pillar C: monthly cadence, mirroring the Care Signal grace
   model

Pillar C's Care Signal requirement is joined by CPD participation, at a rate
of **one qualifying CPD session per month across the 24-month pathway** —
structurally parallel to Care Signal's existing monthly objective, so a
Fellow is proving two forms of monthly discipline side by side, not one. CPD
joins Pillar C rather than Pillar A because it is a recurring monthly
requirement like Care Signal, not a one-time completion like a course or
certification.

CPD follows the **same grace model already implemented for Care Signal**
(`fellowship-care-signal-streak.ts`): up to 2 grace months per calendar year
where a missed month does not break the streak, each followed by a mandatory
catch-up month. No new grace policy is introduced — CPD inherits Care Signal's
existing rules rather than defining a second, divergent one.

**Reminder notification:** both the Care Signal and CPD components of Pillar C
send a notification **one week before the current month closes** if that
month's objective is not yet met, giving the Fellow a chance to submit before
a grace gets consumed. This extends the existing lifecycle-nudge system
(`notifications.getLifecycleNudges`) rather than introducing a separate
notification channel.

## 4. Naming: "Practice," not "Learning"

The Adaptive Learning System is the whole platform's loop — course, ResusGPS,
Care Signal, Safe-Truth feeding back into each other. An individual's own path
through Pillar A/B/C is not that loop; it is their personal discipline within it.
§5.2 already calls Fellowship "a 24-month discipline pathway" — this addendum
proposes **Practice** as the UI/nav label for this grouping (Fellowship, AHA
certifications, CPD, and eventually Instructor progression), on the grounds that
it is the word clinicians already use for their own clinical practice, and does
not overload "Learning," which the constitution reserves for the system-level
loop.

## 5. Instructor sequencing: two tiers, not a hard gate

A hard gate — Fellow status required before any Instructor eligibility — was
considered and rejected in this draft. The earliest possible new Instructor
under a hard gate is 24 months after signup, even for an experienced physician
walking in today. That directly works against §6.4's Instructor Course role in
Business 1 ("enables B2B teaching on institutional schedules") at exactly the
moment instructor supply needs to scale.

Proposed instead — two tiers, each with a distinct functional role, not just a
prestige label stacked on a prerequisite:

- **Instructor** (unchanged): today's standalone Instructor Course remains open
  to any qualified applicant, exactly as it works now. No new prerequisite.
  Scope stays as defined in §5.2 — teaches discrete AHA courses (BLS, ACLS,
  PALS, NRP) on institutional schedules.

- **Fellow Instructor** (new, higher designation): requires Fellow status
  completed first, then the Instructor Course. Two functional privileges a
  regular Instructor does not have:

  1. **Mentors Fellowship candidates.** Reviews borderline Pillar B (ResusGPS)
     case submissions, reviews Pillar C (Care Signal) QI submissions, and can
     be assigned as a candidate's point of contact for their 24-month pathway.
     This is the credential's actual justification: having completed the
     Fellowship is what qualifies someone to guide someone else through it — a
     regular Instructor who never did Fellowship has no particular standing to
     mentor a Fellowship candidate, even if they can teach the courses inside
     it.
  2. **Eligible to lead institutional Hospital ERS deployments** (§6.2 /
     Business 3). ERS work is a standing, multi-department institutional
     commitment, not a discrete course — it calls for the broader competence
     (all four certifications, plus proven QI discipline) a Fellow has
     demonstrated, not just teaching ability in one course.

  Deliberately **not** given: authority to train new Instructors themselves
  (a "train the trainer of trainers" tier was considered and rejected — it
  would recreate the exact instructor-supply bottleneck this two-tier model
  exists to avoid, one level up).

  **Upgrade path:** an existing Instructor who subsequently completes
  Fellowship is upgraded to Fellow Instructor automatically — no separate
  requalification or reapplication required. Fellowship completion is itself
  the qualifying event.

## 6. Grandfathering: credit past months as met

Any provider currently mid-Pillar-A or mid-Pillar-C when this ships is credited
for all past months as though each month's objective (CPD session, Care Signal
report) was met — no retroactive penalty, no re-proving history. This applies
uniformly to the existing Pillar C streak and the newly added CPD requirement:
a Fellow's clock does not reset, and no one is asked to backfill evidence for
months that already passed under the pre-addendum rules. Only compliance from
the ship date forward is newly enforced.

---

## What this addendum does NOT resolve

- Any database schema, UI copy, or verification logic. This is a policy
  document only.
- Note: Fellowship content/culture staying nursing-forward while eligibility
  is open to all healthcare personnel is a deliberate choice, not an open
  question — see §2.

**Resolved since first draft:** a qualifying month's CPD requirement is met by
the Fellow's *first* CPD session that month — if more than one is attended in
the same month, only the first counts toward that month's objective (§3).

## Review trigger

Per the Document Classification and Review section of NORTH_STAR_V2.md itself,
this qualifies as a change to "the product architecture" and "the strategic
direction" and requires leadership review before adoption — the same bar the
document sets for itself.
