# IERS New-User Orientation Guide

**Status:** Operational orientation guide
**Audience:** New institution administrators, Emergency Response Coordinators, Unit Incharges, UTLs, ERTL, linked providers, reviewers, and implementation partners
**Product:** Paeds Resus Institutional Emergency Readiness System (IERS)
**Author:** Manus AI
**Updated:** 2026-08-22

## 1. Start here: what IERS is

The **Institutional Emergency Readiness System (IERS)** is the Paeds Resus operating system for making emergency response more reliable at facility level. It connects institutional governance with the providers who must act during a shift. The institution controls authorization, roster policy, evidence review, action governance, and aggregate reporting. The linked provider owns the truth of their current duty: they accept or decline the assignment, confirm the readiness they actually checked, respond to an activation, contribute factual observations, and progress assigned improvement work.[1]

IERS is not the same as the CPD Portal. The CPD Portal manages professional-development activity such as events, attendance, certificates, and workforce learning records. IERS manages emergency-readiness operations: people, responsibilities, response, readiness, evidence, drills, debriefs, and improvement actions. A course completion or attendance record may support readiness work, but it is not by itself proof that a provider accepted a dated duty or that a team was ready for a specific shift.

> **The bedside flow does not change:** open the app → enter findings or trigger the activation → receive priority next actions → reassess and record the response.

IERS adds the team and institutional layer around that flow. It must make the correct next action obvious without turning an ordinary notification bell into a claimed emergency-dispatch system.

## 2. Where each person goes

### 2.1 Institution workspace

Institution leaders use **`/institution`** as the institutional entry point. Choose the IERS product, or open the IERS deep link **`/institution?section=iers`**. The workforce view is available at **`/institution?section=iers&iersTab=workforce`**.

The institution workspace is the place for governance and review. It shows the canonical records that providers create or accept; it should not create a parallel institutional copy of the provider’s readiness statement.

| Institutional area | Who uses it | What happens there | Why it matters |
| --- | --- | --- | --- |
| **Command centre** | ERCo, IERS coordinator, authorized institution leaders | View the current readiness picture and operate the IERS activation surface | Gives the institution a governed operational view without hiding active response work |
| **Evidence & actions** | ERCo, IERS reviewer, governance lead | Review submitted evidence, assign work, follow action status, and verify closure | Separates provider submission from independent institutional verification |
| **Drills & debriefs** | ERTL, ERCo, providers, independent reviewer | Schedule and review labelled drills, capture debrief facts, and preserve the timeline | Turns practice into measurable institutional learning without creating patient records |
| **Competency & training** | IERS coordinator, education lead, reviewers | Schedule or review readiness-related training and competency records | Links learning to readiness while keeping training completion distinct from operational readiness |
| **ERT & equipment** | ERCo, IERS coordinator, Unit Incharge, roster approver | Govern departments, ERCo assignments, ERTL rotations, UTL shift rosters, and equipment gaps | Makes coverage, acceptance, and missing resources visible before an emergency |
| **Implementation plan** | ERCo, governance lead, institution leadership | Track milestones, owners, risks, and accepted evidence | Makes improvement work auditable rather than aspirational |
| **Executive snapshot** | ERC, senior leadership, permitted reviewers | Review aggregate readiness, evidence, action, and trend information | Supports decisions without exposing unsupported or out-of-scope individual metrics |
| **Administration** | Institution admins | Manage people, memberships, roles, subscriptions, billing, renewal, and account controls | Keeps authorization and commercial administration separate from clinical event facts |

### 2.2 Individual provider portal

Providers use **`/home`** as the canonical individual entry point. The current release surfaces IERS work through prominent provider cards. The intended operating model groups those cards into four simple questions:[1]

| Provider lane | The question it answers | What the provider does |
| --- | --- | --- |
| **Emergency now** | “Is there something I must respond to now?” | Open an urgent activation, acknowledge or decline, respond, record movement/arrival where permitted, and use ResusGPS when appropriate |
| **On duty** | “What responsibility do I own today or this month?” | Review institution, department, role, date, and shift; accept or decline; confirm readiness after acceptance; see gaps and handover information |
| **Learn and improve** | “What should I learn, document, or improve next?” | Complete learning, add factual debrief observations, submit evidence, and progress assigned improvement work |
| **Account and affiliations** | “Who am I and where am I linked?” | Review profile, institution memberships, standing role, dated-duty history, support, privacy, and account settings |

If an urgent IERS task exists, it must take priority over historical metrics, certificates, or general learning content. Existing routes remain valid while the four-lane provider experience is progressively refined. A provider should not be redirected to the institution workspace unless they intentionally switch context and have authorized access.

## 3. The people model: who owns what

The most important orientation rule is that **standing membership is not the same as a dated duty**. A provider may have a standing role such as UTL or ERTL and still not be the person assigned to today’s shift. A provider must also explicitly accept the dated assignment before the platform can treat it as accepted duty.[1]

| Person or role | Goes mainly to | Owns | Does not own |
| --- | --- | --- | --- |
| **Institution Admin** | Institution → Administration and IERS | Identity, memberships, subscriptions, product roles, formal institution decisions, and account governance | Rewriting clinical facts or signing a provider’s readiness on the provider’s behalf |
| **Emergency Response Coordinator (ERCo)** | Institution → IERS → ERT & equipment; Evidence & actions; Drills & debriefs | Department-level coordination, roster review, evidence/action coordination, drill governance, and coverage exceptions | Becoming the only operational dependency or silently treating an assignment as accepted |
| **ERCo backup** | Provider `/home`; institution workforce view | Accepting the dated backup responsibility and being visible as cover | Replacing the primary coordinator without an explicit dated change and audit event |
| **Unit Incharge (UI)** | Institution → IERS → ERT & equipment; provider `/home` for own duties | Recommending local UTL/ERT coverage, reporting gaps, and accepting or declining own duties | Approving their own evidence, changing institution-wide policy, or closing their own action independently |
| **Unit Team Leader (UTL)** | Provider `/home` for own dated shift; institution workforce view for coverage | Accepting or declining the shift, checking the unit, recording provider-owned readiness, leading unit response, and reporting gaps | Treating notification delivery or attendance as readiness, or independently verifying their own evidence/action closure |
| **Emergency Response Team Leader (ERTL)** | Provider `/home`; Institution → IERS → Drills & debriefs and ERT & equipment | Accepting the dated ERTL rotation, leading the response or drill, allocating response roles where supported, escalating, and leading the debrief | Erasing history or independently approving their own evidence or action closure |
| **Linked provider** | Provider `/home` | Point-of-care truth, duty acceptance, response state, arrival/movement record, evidence submission, debrief facts, and assigned-work progress | Seeing unrelated institutions or accepting a duty without the required active relationship |
| **ERC / governance lead** | Institution → IERS → Implementation plan and Executive snapshot | Policy, governance decisions, trend review, and escalation resolution | Replacing event-level evidence review or treating a score as proof without accepted evidence |
| **IERS reviewer** | Institution → IERS → Evidence & actions | Independent evidence review and action-closure verification | Approving their own submission or allowing a provider to silently self-close an action |
| **Paeds Resus reviewer** | Programme review surfaces | Programme oversight and, where supported, the Paeds Resus Institutional Competency Certificate | Presenting that certificate as an official AHA credential, government licence, or regulatory accreditation |

## 4. How a new institution starts

### Step 1: Confirm the institution and products

The institution admin opens **`/institution`**, confirms the correct institution name, and checks the product status. IERS and CPD Portal access are independently gated. If IERS is not active, the product can remain visible with history preserved, but new IERS operations are blocked until access is restored. Active IERS response continuity must not be interrupted by an ordinary renewal problem.[1]

### Step 2: Set up people and access

The institution admin links providers, confirms their identity, and assigns the appropriate IERS product role. Membership answers **“is this provider linked to the institution?”** The product role answers **“what IERS workspace may this user operate or review?”** A dated duty answers **“is this provider responsible for this department or shift now?”** These three questions must not be collapsed into one permission or one roster row.

Before a provider can operate, confirm that the provider is an active institution member. If a provider leaves, is suspended, or loses the relevant IERS role, the server must revalidate the relationship at read and response time. A previously visible assignment is not a permanent authorization.

### Step 3: Configure the facility structure

The institution sets up facility poles and departments. Each department must have **one current ERCo assignment**, with an optional backup. The rule is one coordinator per department, not one coordinator per pole and not one coordinator per shift. The assignment includes an effective date, optional end date, provider acceptance state, and append-only history.

The ERCo is not inferred from membership. The institution must name the provider, and the provider must accept the dated responsibility. Replacing an ERCo changes the current assignment and records a reassignment event; it must not erase the previous history.

### Step 4: Configure the duty calendar

The institution selects a named provider for the dated ERTL rotation and names the UTL for a dated shift roster. The platform should show one of these states clearly:

| State | Meaning | Safe interpretation |
| --- | --- | --- |
| **Unassigned** | No provider has been named | The role is uncovered |
| **Pending acceptance** | A provider was assigned but has not responded | Coverage is proposed, not accepted |
| **Active** | The assigned provider explicitly accepted | The provider owns the dated duty, subject to date/status and membership checks |
| **Declined** | The provider declined with a reason | The institution must arrange cover; the history remains |
| **Ended** | The dated duty has ended or was closed | It cannot be accepted or used to create current readiness |

### Step 5: Provider accepts or declines

The provider opens `/home`, reviews the institution, pole, department, role, date, and shift, and chooses **Accept** or **Decline with reason**. A decline is operational information, not a disciplinary event. It allows the ERCo and institution to arrange cover. The response is identity-bound to the assigned provider; a different provider cannot accept someone else’s duty.

### Step 6: Confirm start-of-shift readiness

After accepting an active shift duty, the assigned provider opens the provider-owned readiness card and confirms what they actually checked. A positive sign-off is an attestation of the checked state; it is not a claim that the facility is perfect. If equipment, people, or escalation routes are missing, the safe action is to record the gap and link or create an owned action. The institution reads the canonical provider sign-off; it should not create a second administrative sign-off for the same provider.

## 5. How IERS works during a labelled drill

A labelled drill is not a real emergency. It must be explicitly marked **“NOT A REAL EMERGENCY”** and confirm that no patient identifiers are being used. Do not use a patient name, hospital number, phone number, diagnosis narrative, image, or family story in the drill, QR code, evidence, action, or export.

The safe drill sequence is:

1. An authorized institution leader or permitted provider schedules a labelled drill with a scenario, location, date, and safety attestation.
2. The institution confirms active linked providers, the current dated roles, the ERCo, the ERTL, the UTL, and the independent reviewer.
3. The provider sees the drill or activation task in the IERS surface rather than relying only on the ordinary notification bell.
4. The provider accepts or declines their own response role. The system records the identity, institution, activation/drill, role, and time.
5. The ERTL leads the response or drill. Providers record their own movement and arrival. A permitted leader may record a witnessed arrival for another provider only with actor, time, source, and reason.
6. The team works through the existing lifecycle and records the timeline. Alert delivery is not the same as acknowledgement; acknowledgement is not the same as response; response is not the same as arrival.
7. After stabilization, the ERTL leads a structured debrief. A scribe records factual timeline information, and participants add factual observations without blame language or patient identifiers.
8. Providers submit evidence and progress their assigned actions. An independent reviewer accepts evidence and verifies closure. A provider must not silently create, perform, and independently verify their own closure.

A standalone CPR session may remain useful for skills practice, but it does not automatically increase institutional readiness. When a session is linked to an IERS activation or drill, it must use one canonical activation/drill link and must be idempotent so retries do not create duplicate responders, evidence, or readiness credit.[1]

## 6. What each person should do on their first day

### For an institution admin or ERCo

Open the institution workspace and confirm that the correct institution and IERS subscription are visible. Review the institution’s people and roles. Confirm that each provider who will operate IERS has an active membership and the appropriate product role. Open **ERT & equipment**, create or verify departments, and assign exactly one ERCo per department with an optional backup. Then create one dated ERTL rotation and one dated UTL shift only after the relevant providers are linked.

Ask each named provider to switch to the Individual portal and accept or decline their own duty. Return to the institution workspace and confirm that the institution sees the same acceptance state. Review the readiness record only after acceptance. Finally, open Evidence & actions and Drills & debriefs to identify the independent reviewer and the action-closure path before scheduling any labelled drill.

### For a provider

Open `/home` and confirm your name and institution affiliations. Open the IERS duty card and read the institution, department, date, shift, and responsibility before responding. Accept only a duty you can actually own. If you cannot cover it, decline with a truthful operational reason so the institution can arrange cover.

After accepting, check the provider readiness card at the start of the shift. Record missing resources rather than silently working around them. During a labelled drill or real response, use the urgent IERS surface and the bedside clinical flow. After the event, add factual observations, submit evidence when requested, and progress your assigned improvement work. Do not enter patient identifiers into drill or IERS improvement records.

### For an independent reviewer

Open **Evidence & actions** and confirm that the evidence source, scope, date, submitter, and review state are clear. Review the evidence independently. Do not approve your own evidence or silently allow a provider to close their own action. If evidence is incomplete, return it with a specific reason. If closure is accepted, preserve the reviewer identity, time, decision, and supporting evidence.

## 7. Common mistakes to avoid

| Mistake | Why it is unsafe | Correct interpretation |
| --- | --- | --- |
| Treating an institution assignment as accepted duty | The provider may be unavailable, unaware, or unable to cover | Assignment remains pending until the provider accepts |
| Treating a roster row as readiness | A schedule is not a check of people, equipment, escalation, or handover | Only provider-owned accepted-duty readiness can create readiness evidence |
| Treating attendance as competency | Presence does not show that a provider can perform or that evidence was reviewed | Keep training, attendance, operational duty, and reviewed competency distinct |
| Using the normal notification bell as emergency dispatch | Ordinary notifications can be delayed, missed, or mixed with learning content | Use the urgent IERS surface and a verified escalation policy; never claim guaranteed dispatch from a bell alone |
| Letting a provider read another institution’s duty | Cross-tenant leakage undermines safety and trust | Every query must be scoped by authenticated provider, active membership, institution, and assignment |
| Letting a revoked provider respond to an old duty | A prior assignment is not a continuing authorization | Revalidate active membership and role state when reading and responding |
| Allowing an institution user to sign a provider’s readiness | It creates false provider evidence and blurs ownership | The assigned provider confirms their own readiness through the Individual portal |
| Replacing an ERCo by deleting history | It makes coverage and accountability impossible to reconstruct | Update the one current row and append a reassignment event |
| Adding patient details to a labelled drill | It creates avoidable privacy and operational risk | Use fictional, non-identifying scenario information only |
| Treating a Paeds Resus certificate as an AHA credential | The two are different issuers and claims | Use the exact institutional competency language approved by governance |

## 8. A five-minute orientation script for a new team

A facilitator can use the following script:

> “IERS is our emergency-readiness workspace. The institution governs the system, but the provider owns the truth of their current duty. We will first confirm the institution, people, memberships, and IERS roles. Then we will name exactly one ERCo per department, assign the dated ERTL and UTL duties, and ask the named providers to accept or decline in their own Individual portal. A roster assignment is not acceptance, and acceptance is not readiness. At the start of a shift, the provider checks people, equipment, escalation, and handover, then confirms readiness and records gaps. During a labelled drill, we use fictional information, follow the normal emergency response flow, preserve the timeline, and debrief facts without blame. Afterward, providers submit evidence and progress actions; an independent reviewer verifies evidence and closure. If a person is no longer an active member or loses their authorization, the platform must stop them from reading or responding to old duties. When in doubt, protect patient privacy, preserve provenance, and choose the action that makes ownership explicit.”

## 9. Orientation completion checklist

A new team is oriented when each of the following has been demonstrated without using patient identifiers:

- The institution admin can locate `/institution` and open the IERS workspace.
- The team can explain the difference between IERS and the CPD Portal.
- The team can identify the ERCo, optional backup, ERTL, UTL, independent reviewer, and institution admin.
- The institution has exactly one current ERCo per department.
- A named provider can see their own dated duty in `/home`.
- The provider can accept a duty and the institution can see the active acceptance state.
- The provider can decline with a reason and the institution can see the resulting coverage exception.
- A pending or ended duty cannot create provider readiness.
- The assigned provider can sign off accepted active shift readiness; an institution user cannot sign it for them.
- A revoked or cross-tenant provider cannot read or respond to another institution’s duty.
- The team can locate the institution’s command, workforce, evidence/action, drill/debrief, implementation, and reporting areas.
- The team understands that ordinary notifications are not guaranteed emergency dispatch.
- The team can schedule or join only a clearly labelled, non-emergency drill with no patient identifiers.
- The team knows who independently reviews evidence and verifies action closure.

## 10. Boundaries and next release gates

This guide describes the current provider-duty release and the intended operating contract. It does not imply that every later architecture item is already deployed. Activation-bound QR participation, durable urgent acknowledgement/escalation, offline-safe event capture, witnessed-arrival provenance, provider-led factual debrief submission, and the complete four-lane provider navigation remain release gates to be implemented and verified before a real pilot. The labelled pilot drill must therefore remain blocked until those gates are separately evidenced.[1]

## References

[1]: ./IERS_PROVIDER_INTEGRATION_AND_INDIVIDUAL_PORTAL_ARCHITECTURE_V1.md "IERS Provider Integration and Individual Portal Architecture V1"
[2]: ../../AGENTS.md "Repository operating and recovery rules"
[3]: ../WORK_STATUS.md "Paeds Resus work-status log"
