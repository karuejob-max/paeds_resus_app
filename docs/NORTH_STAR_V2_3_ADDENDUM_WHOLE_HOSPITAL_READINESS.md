# North Star v2.3 — Addendum: Whole-Hospital Readiness (Code Signal)

**Status: ADOPTED. Signed off by leadership (CEO) 2026-08-06.**

## 0. What this reconciles

`NORTH_STAR_V2.md` §2.1 states the mission domain plainly: *"Improve
paediatric resuscitation and emergency care — the specific domain. Not all
child health. **Not adult care.**"*

`docs/institutional/IERMS_STANDARD_V1.md` (published 2026-07-31), by
contrast, already describes a whole-hospital Emergency Response Team model
that explicitly includes adult resuscitation (Domain 1.3 "Whole-Hospital
Reciprocity", Domain 2.2's bedside-utilization standard). It asserts
alignment with this document without actually amending it — as of
2026-08-05 that assertion was not true. This addendum is what makes it true:
a deliberate, CEO-confirmed scope decision, not scope creep discovered and
left uncorrected.

## 1. The mission does not change

The mission statement in §2.1 is unchanged: **no child dies a preventable
death.** This is the sentence the platform is judged against, the sentence
on every certificate, and the reason the CEO's paediatric critical care
background gets him invited to speak at conferences most health-tech
founders never reach. Nothing in this addendum touches it.

## 2. What changes: the operating mechanism, not the mission

In the LMIC settings this platform targets, dedicated paediatric hospitals
are rare and paediatric ward staffing is thin — as little as two nurses per
shift, nurse-to-patient ratios of roughly 1:15 to 1:30 even in comparatively
well-staffed facilities. Good resuscitation outcomes depend on a functioning
team responding to the bedside; a paediatric ward alone often cannot field
one.

The mechanism this platform already built to solve that — the IERP,
cross-unit Emergency Response Teams that converge on whichever bed needs
them — only works as *reciprocity*. A team that expects adult-ward nurses to
help at a paediatric code must also send paediatric-ward nurses to an adult
one. That reciprocity is the operating requirement driving this addendum,
not a change of heart about who the platform is for.

Three further reasons this is the right mechanism, not just a tolerable one:

- **The patient population already overlaps.** A mother collapsing at her
  child's bedside, or a staff member arresting on shift, needs adult
  resuscitation skills from the same paediatric-trained responders already
  in the building.
- **Financial.** More learners can complete ACLS than PALS — broadening the
  certification mix strengthens, not dilutes, the four-business revenue
  model (`FINANCIAL_STRATEGY_V1.md`, updated alongside this addendum).
- **Technical leverage.** The Adaptive Learning System (ResusGPS, Care
  Signal's redaction/anonymize pipeline, the FPKB pattern-detection
  approach) is built as domain-agnostic infrastructure with a paediatric
  taxonomy layered on top. The same infrastructure serves an adult taxonomy
  without being rebuilt.

## 3. Brand and dataset boundary — deliberately not merged

This is the part that keeps §1 true in practice, not just on paper: the
paediatric identity survives because the *data* stays separated, not because
of a promise on a page. **Care Signal remains a paediatric-only dataset.**
Adult and whole-hospital incident reporting lives in a separate product,
**Code Signal** (`codeSignalEvents` table, `docs/CARE_SIGNAL_STRATEGY_AND_ROADMAP.md`'s
sibling for adult scope), with its own condition/failure/success taxonomy.
Care Signal's "N paediatric resuscitation events across X countries" remains
a claim that needs no adult-data caveat, ever.

Outward-facing material (About page, conference materials, certificates)
keeps paediatric resuscitation as the headline. Whole-hospital / adult
readiness is framed as *how* paediatric outcomes are achieved in
short-staffed settings — supporting narrative, not a competing one. See the
one-sentence addition to `client/src/pages/About.tsx` made alongside this
addendum for the applied version of that framing.

## 4. What this does NOT do (flagged, not silently assumed)

- Does **not** grant Code Signal events any Fellowship credit. Whether adult
  QI reporting should ever count toward a paediatric-titled Fellowship
  pillar is a real open question this addendum deliberately leaves open.
- Does **not** wire Code Signal into the FPKB pattern-detection engine
  (`kb_pattern_observations.observationSource` enum is untouched).
- Does **not** retire or rename IERP/NERP, which remain the individual
  learner-cohort tracks — unrelated to this institutional/adult-reporting
  scope change beyond sharing the "whole-hospital" theme.

## 5. Pointer

Add to `NORTH_STAR_V2.md` §"Adopted Amendments" (mirrors the v2.1/v2.2
pattern):

*North Star v2.3 (docs/NORTH_STAR_V2_3_ADDENDUM_WHOLE_HOSPITAL_READINESS.md),
adopted 2026-08-06, reconciles IERMS's whole-hospital adult-resuscitation
scope with §2.1's paediatric mission statement: the mission is unchanged,
the operating mechanism now explicitly includes adult resuscitation
readiness via reciprocal Emergency Response Teams, and Code Signal is
established as a structurally separate dataset from Care Signal.*
