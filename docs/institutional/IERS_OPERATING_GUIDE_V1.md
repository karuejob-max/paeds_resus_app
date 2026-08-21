# IERS Operating Guide v1

## Purpose

The Institutional Emergency Readiness System (IERS) is the operational layer that turns Paeds Resus clinical capability into a measurable, institution-owned readiness programme. It is not a replacement for clinical judgement, local policy, emergency services, or a formal regulator. It records what was present, what was tested, who was responsible, what failed, and whether the corrective action was verified.

## The operating loop

1. **Prepare.** An institution defines its Emergency Response Team (ERT), links providers to named responsibility roles, signs off shifts, and records equipment, policy, device, and training evidence.
2. **Activate.** Any active linked provider or institutional operator can trigger an IERS activation. The platform records the trigger, location, urgency, source, and the responsible responders to notify.
3. **Respond.** Assigned providers acknowledge, begin response, and record arrival through the provider platform. The institution command centre sees the same event, status, and immutable timeline.
4. **Recover and debrief.** The activation cannot be closed without a debrief note. Response timestamps are retained, and completion creates activation evidence for later review.
5. **Improve.** Providers report gaps and create owned actions. Institution leaders review evidence, assign responsibility, monitor due dates, and verify closure. Providers may progress or escalate their work but cannot self-close it.
6. **Prove.** Readiness points come from accepted criterion-level evidence. A high total cannot bypass the critical-criteria gate. Certification language is reserved for human review; a self-scored slider is not an accreditation.

## Responsibility model

| Role | Core responsibility | Platform actions |
|---|---|---|
| Provider | Report real conditions and act on assigned work | Trigger/acknowledge/respond to activations; sign off assigned shifts; submit evidence; report gaps; progress owned actions; join drills |
| Unit Team Leader | Own local shift readiness and escalation | Sign off unit readiness; respond as primary/backup; lead local gap correction |
| ERTL | Own whole-hospital response performance | Lead activations and drills; review response timelines; escalate staffing gaps |
| ER Coordinator | Own readiness evidence and action follow-through | Schedule audits/drills; review evidence; coordinate action queue and reports |
| Institution Admin | Own governance, membership, and formal institutional decision | Invite/link providers; assign responsibility roles; review evidence; verify action closure; manage implementation plan |
| Paeds Resus / reviewer | Provide programme oversight and human certification review | Review the evidence pack and issue only the credential that the reviewed evidence supports |

The institution admin is not the only operator. The provider platform is a first-class IERS surface because providers are the people who see the bedside state and execute the response.

## Safety states

| Object | Safe lifecycle |
|---|---|
| Activation | `notifying` → `acknowledged` → `responding` → `at_scene` → `stabilized` → `debrief_pending` → `closed` |
| Failed escalation | `failed_escalation` may return to `notifying` after a retry; it must not be silently treated as covered |
| Shift readiness | `active` shift → provider sign-off; missing critical equipment must be recorded as a gap, not hidden by a positive attestation |
| Evidence | `submitted` → leader review → `accepted` or `rejected`; accepted evidence can support scorecard points |
| Action | `open` → `in_progress` / `blocked` → `awaiting_verification` → leader-verified `closed` |
| Drill | `planned` → `in_progress` → debriefed `completed`; incomplete drills do not count as activation evidence |
| Downtime | downtime activation is reconciled as `downtime_pending_sync`; it remains visibly distinct from a live online activation |

## Evidence and scorecard rules

The evidence-derived scorecard is calculated from accepted evidence, not from user-selected points. The current criteria are `LG-01`, `WF-01`, `WF-02`, `ACT-01`, `ACT-02`, `EQ-01`, `CG-01`, `QI-01`, `RG-01`, and `TR-01`, together totalling 100 points. Critical criteria must all be accepted before the institution is eligible for human certification review. The score is an internal readiness measure; it is not, by itself, a regulatory accreditation.

Do not attach patient identifiers to IERS evidence descriptions, drill records, action notes, or exports. Real patient records must remain in the approved clinical record system. IERS is for readiness, response operations, and system improvement.

## Production migration order

Apply migrations in order, with a database backup and a read-only readiness check before and after application:

```bash
pnpm run db:apply-0094
pnpm run db:apply-0095
pnpm run db:apply-0096
pnpm run db:apply-0097
pnpm run db:apply-0098
pnpm run db:apply-0099
```

Migration 0094 links existing institutional staff to provider memberships. Migrations 0095–0099 add the activation, shift sign-off, evidence/action, drill/debrief, and implementation-plan data spines. Each script is idempotent but must still be run against the intended production database by an authorised operator.

## Pilot acceptance test

A facility pilot is not complete until an authorised reviewer can demonstrate all of the following without using patient identifiers:

- A linked provider can see the institution relationship and responsibility role.
- A provider can trigger an activation; assigned responders receive durable notification records.
- A responder can acknowledge, respond, and mark arrival; the institution sees the same timeline.
- An institution operator can retry a failed escalation and record a downtime activation.
- An assigned provider can sign off a shift and record a readiness gap.
- A provider can submit evidence and create/progress an action; an institution leader can review evidence and verify closure.
- A drill can be scheduled, started, joined, debriefed, and converted into activation evidence.
- The scorecard changes only when evidence is accepted and never grants certification solely from a high total.
- The executive snapshot exports recorded values and displays “not recorded” when timing data is absent.
- The deployment has no visible placeholder reports or claims of unmeasured response performance.
