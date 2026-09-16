# Kiirua Client Briefing

**Prepared for:** Job Karue, Paeds Resus  
**Client:** St. Theresa Mission Hospital – Kiirua  
**Purpose:** Prepare a truthful, compelling, and decision-oriented conversation about what Paeds Resus offers, what Kiirua would receive, what is ready now, and what must be confirmed before contracting.

## Executive position

Paeds Resus should not present itself to Kiirua as a provider of bulk BLS/ACLS certificates. The stronger and more accurate proposition is:

> **Paeds Resus helps a hospital build a working, measurable paediatric emergency-readiness system, supported by role-based training, bedside guidance, quality-improvement reporting, and institutional visibility.**

The offer has three connected components: **Institutional Emergency Readiness**, **competency training**, and the **CPD Portal**. Each component should remain separately defined in the proposal and statement of work. The client should understand how they reinforce one another without being confused into thinking that one product automatically includes every other service.

The Kiirua planning model must use the approved **ILSP rate of KES 7,000 per staff member**, the verified facility-level IERS price, and the verified ICPD staff tier. For approximately 200 ILSP providers and 500 total staff, the planning total is **KES 2,000,000 at Level 4, approximately KES 2,150,000 at Level 5, or approximately KES 2,400,000 at Level 6**, before separately scoped travel, venue, official AHA fees, or other additions. It is a planning proposal, not a final invoice.

## What Paeds Resus offers Kiirua

| Offer | What Kiirua would be buying | Practical client outcome |
|---|---|---|
| **Institutional Emergency Readiness System (IERS/ERS)** | Hospital-wide emergency-response design, defined roles, emergency team/roster model, readiness baseline, equipment/process review, activation workflow, dashboards, and review cadence. | The hospital has a clearer and more measurable response system instead of isolated staff training. |
| **ResusGPS** | Structured paediatric emergency guidance for time-critical bedside decision-making, including emergency flows and reassessment support. | Providers have a consistent support tool during paediatric emergencies, within appropriate professional and local-protocol boundaries. |
| **Competency training** | Role- and gap-based BLS, ACLS, PALS, NRP, and related training pathways where contracted. | A defined cohort receives learning, facilitated training, assessment, skills validation, remediation where required, and credential records. |
| **Paeds Resus Institutional Life Support Training** | Paeds Resus competency-based institutional training at the agreed provider/cycle price, without implying an official AHA card. | Kiirua can train providers through a Paeds Resus pathway and track completion and competency evidence. |
| **Official AHA pathway** | AHA-aligned or official AHA training only where the exact course, provider requirements, official fees, and credential pathway are expressly contracted. | Kiirua receives the specific AHA credential only when that pathway has been separately confirmed and delivered under the applicable rules. |
| **Care Signal and structured QI** | Safety Event and Improvement Project reporting, review workflow, action ownership, effectiveness review, and institutional learning. | Near misses and system gaps become auditable improvement work rather than blame-focused incident paperwork. |
| **CPD Portal** | Hospital-wide attendance, participation, targets, evidence capture, staff visibility, and leadership reporting for existing CPD activity. | Kiirua can see participation and CPD accountability across departments without treating the portal as a full content-creation LMS. |
| **Institutional administration** | Staff/facility setup, role-based access, governance responsibilities, report review, pricing/invoice visibility, and operational dashboards. | Named Kiirua leaders can operate the programme instead of depending on Paeds Resus for every routine update. |

## The Kiirua Year-One planning proposal

The current internal commercial reference uses this planning model:

| Component | Planning assumption | Year-One planning price |
|---|---:|---:|
| ILSP for approximately 200 staff at KES 7,000 per staff member | Approved automatic institutional rate | **KES 1,400,000** |
| IERS/ERS institutional activation | Facility-level price: Level 4 KES 200,000; Level 5 KES 350,000; Level 6 KES 600,000 | **To be confirmed by verified facility level** |
| ICPD for approximately 500 total staff at KES 800 per staff/year | 301–500 staff tier | **KES 400,000** |
| **Total Year One** | Subject to verified headcount, facility level, and final scope | **From KES 2,000,000** |

The CPD Portal price is based on **total facility staff**, not only the clinical training cohort. The current tier is KES 800 per staff/year for 301–500 staff. If Kiirua has more than 500 total staff, the price becomes individually negotiated rather than automatically remaining at KES 800.

The preferred milestone structure remains appropriate, but the amounts must be recalculated after Kiirua confirms the staff list, facility level, training pathway, and final scope:



| Milestone | Trigger | Amount |
|---|---|---:|
| Mobilisation | Signed agreement, verified headcount and facility level, named Kiirua leads, and account-provisioning readiness | **To be recalculated from final scope** |
| Cohort activation | First training cohort activated, calendar agreed, and IERS role map approved | **To be recalculated from final scope** |
| Completion and first report | Training/assessment report, IERS activation review, and first ICPD leadership report | **To be recalculated from final scope** |
| **Total** | Subject to final statement of work | **To be recalculated from final scope** |

This should be presented as a **planning anchor**. Before issuing a final quote, confirm total staff, clinical cohort size, training mix, whether official AHA credentials are required, travel/venue needs, and the exact IERS activation scope.

## What is ready in the platform now

The software foundation is materially stronger than a simple brochure or training catalogue. The institutional workspace supports the following capabilities:

| Capability | Current status for demonstration |
|---|---|
| Institutional workspace | Available as the central institutional surface. |
| CPD Portal | Available for staff/attendance/targets/evidence/reporting workflows; presenter search and session creation improvements are already released. |
| Structured QI | Available for Safety Event and Improvement Project reports, with draft, submission, triage, actions, effectiveness review, and closure controls. |
| QI participation logic | Available with facility-scaled quarterly thresholds and a 30-day cure period; commercial status does not change retroactively. |
| Pricing | Available with standard, Founding Partner, private-mode, KES invoice, USD reference FX snapshot, and auditable pricing inputs. |
| Institutional billing | Available for annual invoices, payment-method selection, payment intents, and provider-neutral payment actions. |
| Payment operations | Available with signed webhook handling, idempotency, mismatch protection, payment attempts, reconciliation states, refunds, overdue-invoice review, and finance controls. |
| QI governance | Available with institution-only and aggregate-only export scopes and auditable retention-policy controls. |
| Mobile operations | Institutional QI and billing surfaces are designed for mobile and desktop use. |
| Release assurance | The relevant release passed protected CI, production build/unit checks, and migrations 0156 and 0157 were applied and verified in the production environment. |

## What is not yet ready to promise as fully operational

These are not reasons to hide the offer. They are the gates that must be completed before making a specific promise to Kiirua about live revenue collection or a fully proven operational pilot.

| Gap | Why Kiirua should care | What must happen |
|---|---|---|
| Payment-provider activation | The software can create provider-neutral payment actions, but live collection depends on merchant credentials and provider configuration. | Select Pesapal, direct M-Pesa, or another approved route; configure credentials, webhook secret, callback policy, settlement account, refunds, and reconciliation access. |
| Authenticated end-to-end smoke test | Separate unit tests and migrations do not prove that the complete Kiirua journey works in production. | Run a disposable test covering QI report, invoice, payment intent, signed callback, replay, mismatch, reconciliation, refund, export, and retention behavior. |
| Finance operating rhythm | A callback is not the same as bank settlement. | Assign a finance owner, review issued/overdue/unreconciled/refunded payments, and define correction and refund approvals. |
| Governance sign-off | Consent, retention, tax/eTIMS, renewal, refund, and just-culture wording have legal and operational implications. | Complete Kenyan counsel/accounting review before external publication or live institutional collection. |
| Kiirua-specific baseline | The platform is ready for configuration, but Kiirua’s real staffing, unit, equipment, response-time, and training baseline is not yet confirmed. | Conduct the readiness discovery and baseline audit before finalising scope and KPIs. |
| Outcome evidence | Paeds Resus must not promise reduced mortality before governed evaluation. | Use process metrics first: activation count, time to first responder, paediatric activations, equipment fixes closed, training coverage, QI closure, and documented ROSC where available. |

## What you should say—and what you should avoid

### Say this

> “We are not proposing certificates in isolation. We are proposing a hospital emergency-readiness programme: we map the response system, define roles, train the people who need the competencies, give teams bedside support, capture improvement signals, and give hospital leadership measurable visibility.”

> “The first step is not to sell the maximum number of seats. It is to confirm your staffing reality, existing emergency-response process, current training coverage, equipment readiness, and the departments where paediatric emergencies create the greatest risk.”

> “The platform is ready to support the institutional workflow. We will configure the final payment and governance controls with you before live collection and before the first formal reporting cycle.”

### Avoid this

Do not say that Paeds Resus guarantees lower mortality, replaces clinical judgement, provides legal immunity, or makes every provider an AHA-certified provider. Do not call the CPD Portal a full LMS unless additional content-authoring and curriculum functionality is explicitly included. Do not quote KES 800 per staff beyond 500 total staff without a negotiated decision. Do not imply that the Paeds Resus Institutional Life Support Certificate is an official AHA provider card.

## The recommended Kiirua meeting flow

### 1. Start with Kiirua’s problem, not the product catalogue

Ask how Kiirua currently responds when a child deteriorates or arrests outside a high-dependency area. Clarify who activates, who responds, who remains to cover the home department, how paediatric equipment is checked, how response times are measured, and what happens after a near miss or failed resuscitation.

### 2. Establish the baseline

Request the total staff register, clinical staff numbers, unit/department list, current emergency-response roster, existing BLS/ACLS/PALS/NRP coverage, training expiry dates, equipment/readiness checklist, CPD process, and current incident/near-miss review process.

### 3. Show the integrated solution

Demonstrate the institutional workspace, the readiness/role model, the CPD session workflow, a structured QI report, the action/effectiveness workflow, and the leadership reporting view. The demo should show one complete journey rather than disconnected feature screens.

### 4. Confirm the commercial path

Present the KES 2.6 million planning anchor only after confirming whether the assumptions are reasonable. Offer two routes: a full 90-day institutional rollout, or a bounded readiness-and-QI pilot that has fewer units/cohorts and a clear conversion decision. Do not reduce the price while leaving the same delivery obligation.

### 5. Agree the decision and next evidence

The meeting should end with named owners, a data handover date, a proposed baseline visit or workshop, the required decision-makers, and a date for the final statement of work—not merely “we will send information.”

## Discovery questions for Kiirua

| Theme | Questions to ask |
|---|---|
| Emergency response | What happens in the first five minutes of a paediatric emergency? Who activates the response? What happens to the patient’s home department while the response team moves? |
| Staffing | How many total staff and clinical staff are active? What is the typical night/weekend staffing pattern? Which departments need cross-cover? |
| Training | Which staff require BLS, ACLS, PALS, NRP, or Paeds Resus competency training? What is current, expired, or undocumented? |
| Equipment | Which units have paediatric airway, oxygen, defibrillation, vascular access, medication, and monitoring gaps? Who checks the equipment and how is closure documented? |
| QI | How are near misses and resuscitation events reported today? Can staff report without fear of individual blame? Who reviews and closes actions? |
| CPD | How are CPD sessions scheduled, attended, evidenced, and reported to leadership? How many total staff require access? |
| Governance | Who will be the institutional sponsor, readiness chair, CPD coordinator, finance owner, clinical lead, and departmental representatives? |
| Procurement | Does Kiirua prefer milestone payment, purchase order, bank transfer, M-Pesa, or card? Are there tax/eTIMS or procurement requirements? |
| Success | After 90 days, what would make the programme clearly worthwhile to Kiirua? Which process measures can the hospital reliably collect? |

## Recommended 90-day rollout

| Period | Paeds Resus and Kiirua activity | Evidence of progress |
|---|---|---|
| Days 0–15 | Mobilisation, agreement, staff and department register, named leads, baseline readiness audit, current training review, and access setup. | Approved baseline, role map, staff register, and first implementation calendar. |
| Days 16–45 | Configure IERS/ERT roles, activate the first training cohort, launch ResusGPS access, configure CPD, and start structured QI reporting. | Active roster, cohort attendance, first QI submissions, equipment/action list, and early response process data. |
| Days 46–75 | Expand to agreed departments, run simulation/drill activities, close priority equipment/process gaps, and review training/CPD participation. | Drill evidence, action closure, training coverage, participation report, and leadership review. |
| Days 76–90 | Conduct the first formal review, assess process KPIs, agree remediation, and decide the next phase. | 90-day report, agreed improvement plan, renewal/scale decision, and governance review. |

## The decision you want from this meeting

The best immediate ask is not necessarily a full purchase order on the spot. It is:

> **Agreement to a Kiirua readiness discovery and baseline workshop, with named Kiirua leads and a date for sharing staff, department, training, and equipment information.**

If Kiirua is already ready to proceed commercially, the decision should be approval to develop a final statement of work using verified headcount and agreed cohort scope, with milestone payment terms and a 90-day implementation plan.

## Your preparation checklist

Before the meeting, have the following ready:

1. A five-minute explanation of Paeds Resus as readiness infrastructure, not certificate sales.
2. A short demonstration path: institutional workspace → CPD/learning → structured QI report → action/effectiveness review → leadership visibility.
3. The KES 2.6 million planning breakdown, clearly labelled as subject to headcount and scope verification.
4. A one-page 90-day rollout plan.
5. A list of Kiirua information requests: staff register, departments, training status, emergency roster, equipment baseline, CPD process, and governance leads.
6. A clear distinction between Paeds Resus competency certificates and official AHA credentials.
7. A transparent explanation that live payment collection and final governance activation require provider configuration and controlled testing.
8. A draft next-step email or meeting note that names owners and dates.

## Final recommendation

Lead with **Kiirua’s emergency-response reliability problem**, demonstrate the connected system, and sell the first 90 days of measurable implementation. Keep training central but subordinate to the institutional readiness objective. Do not overpromise live payments, legal status, or clinical outcomes. Your strongest position is that Paeds Resus is already more than a training vendor, while still being honest that the Kiirua-specific baseline, payment activation, and formal governance sign-off are the remaining steps before full operational launch.

## Internal sources

This briefing is based on the current Paeds Resus platform source of truth, the canonical Kiirua pricing reference, the institutional ERS narrative, the institutional QI/pricing/billing implementation contract, and the revenue-readiness runbook.
