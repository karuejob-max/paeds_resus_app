# North Star v2.2 — Addendum: The Paeds Resus Instructor Journey

**Status: ADOPTED. Signed off by leadership (CEO) 2026-07-29.**

Unlike the v2.1 Fellowship addendum, this one does not specify new policy —
it documents a system that is **already built and live** (schema shipped in
migration 0075, dated 2026-07-21) but has no corresponding entry in North
Star. The gap this closes: the Instructor Journey currently exists only as
code and inline comments, which means it's tribal knowledge, not
constitution. This addendum brings it into the document leadership actually
reviews, and gives it one clear owner-approved definition rather than
whatever the code happens to do.

Nothing here requires new engineering. If adopted as-is, the only follow-up
work is a pointer added to `NORTH_STAR_V2.md`, the same pattern used for
v2.1.

---

## 1. Two separate things, often confused: tier and per-course qualification

The system tracks two independent attributes per instructor, and conflating
them is the most likely source of future confusion, so it's worth stating
plainly up front:

- **`instructorTier`** (`provisional` → `qualified` → `lead_instructor`) —
  *how far along their own mentorship journey* this instructor is. Global,
  not tied to any one course.
- **Per-course qualification** (`instructorQualifications` table) — *which
  specific courses* (BLS, ACLS, PALS, etc.) this instructor is actually
  qualified to teach. Auto-granted the moment both conditions are true:
  they're instructor-certified, **and** they've personally completed that
  provider course themselves. An instructor's tier says nothing about which
  courses they can teach; qualification says nothing about their mentorship
  standing. Both gates apply independently — a `lead_instructor` still can't
  teach a course they haven't personally completed themselves.

## 2. The three tiers

**Before any tier exists.** A user has no `instructorTier` value at all
(`null`) until they've completed the Instructor Course (`instructorNumber`
issued, `instructorCertifiedAt` set) *and* been separately approved by an
admin as an assignable session instructor (`instructorApprovedAt` set — this
approval step explicitly requires the number and certification to already
exist; it cannot be granted first). This pre-tier period is the "instructor
in training" phase — not a stored value, just the default state before both
gates are cleared.

**`provisional`.** The tier a newly-approved instructor starts at. One named
mentor is assigned for their whole provisional period — not a different
mentor per group, one person accountable for the whole stretch. Progression
out of `provisional` is **deliberately not automatic** and not computed from
attendance data: each time the mentor judges that the mentee independently
led a group well, the mentor manually confirms it (`instructorMentorshipGroups`).
This is treated as a real credentialing judgment call, not a metric to be
gamed — "was this genuinely independent and well-run" is not something
attendance logs can answer on their own.

**`qualified`.** Reached after **3 confirmed independently-led groups**
under the same mentor.

**`lead_instructor`.** Reached by the *mentor*, not the mentee — once a
mentor has personally shepherded **10 distinct mentees** through to
`qualified`, that mentor is promoted. This bar is intentionally demanding:
its purpose is not merely to confirm the person can teach well (that's
already proven by `qualified`), but to confirm they can develop *other*
instructors — mentoring 10 people to independence is evidence of leadership,
not just competence, and the tier should not be reachable by teaching skill
alone.

## 3. Founder-era bootstrap override

A small number of instructors were trained and approved directly, before
this mentorship system existed, and have no real mentor to log a mentorship
under. For them, and only as an admin-only direct action
(`setInstructorTierOverride`), a platform admin can assign a tier without
going through the mentorship-confirmation path. This is a narrow escape
hatch for people who predate the system, not a general bypass — the normal
path (mentor-confirmed groups, mentor's own mentee count) is the only route
for anyone certified going forward.

## 4. Relationship to Fellow Instructor (v2.1) — two independent tracks

Worth being explicit, since the two systems share the word "instructor" and
sit in adjacent parts of the platform: **Lead Instructor (this addendum) and
Fellow Instructor (§5 of the v2.1 Fellowship addendum) are unrelated,
independently-earned credentials.** Lead Instructor is reached by mentoring
other *instructors* through their provisional period. Fellow Instructor is
reached by completing the Fellowship (BLS+ACLS+PALS+NRP, CPD, ResusGPS,
Care Signal) and then the Instructor Course. A person can hold either, both,
or neither — completing one confers nothing toward the other. This mirrors
the same care already taken to keep the Cohort Program's own instructor
progression (`provisional`/`qualified`/`lead_instructor` — the same enum,
reused for the Cohort Program's B2B teaching pipeline) distinct from
Fellowship-specific credentials, after an earlier naming collision (a
prior working name, "Faculty," was flagged as too close to
"Fellowship"-family language and renamed before this addendum).

---

## What this addendum does NOT resolve

- Whether a `lead_instructor` continuing to mentor beyond their 10th mentee
  should have any further recognition — not specified, not currently
  tracked as a milestone.
- Any database schema, UI copy, or verification logic — everything
  described here is already built; this addendum is a documentation
  exercise, not a specification for new work.

## Review trigger

Per the Document Classification and Review section of NORTH_STAR_V2.md,
this documents an existing operational system into the constitution and
requires leadership review before adoption — the same bar the document sets
for itself.
