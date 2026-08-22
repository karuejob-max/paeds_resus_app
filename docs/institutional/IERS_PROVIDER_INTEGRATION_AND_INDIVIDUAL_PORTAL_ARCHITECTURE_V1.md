# IERS Provider Integration and Individual Portal Architecture V1

**Status:** Architecture contract and pre-pilot design gate  
**Date:** 2026-08-22  
**Author:** Manus AI  
**Scope:** Provider-facing IERS operations, individual provider portal restructuring, institution/provider boundaries, QR participation, debriefing, and pilot safety

## 1. Executive position

The Institutional Emergency Readiness System (IERS) should operate as a **decentralized provider-driven emergency-readiness system**. Institutions own governance, service configuration, formal authorization, contracts, subscriptions, evidence review, and aggregate learning. Linked providers own the reality of the current shift: they accept or decline assigned responsibilities, confirm readiness, respond to activations, record movement and arrival, contribute evidence, and progress assigned improvement work.

This is not a new product separate from the individual provider experience. It is a connected operating model with two surfaces:

| Surface | Primary job | Truth it owns |
| --- | --- | --- |
| Individual provider portal | Make the correct action obvious to the provider at the moment it is needed | Provider acceptance, response, arrival, assigned work, factual observations, and personal learning/professional records |
| Institutional workspace | Coordinate, review, govern, and improve the facility system | Roster policy, membership, institutional evidence, reviewed debriefs, canonical action queue, readiness scorecard, and executive reporting |

The existing application already has meaningful foundations: institution-provider membership, responsibility roles, facility poles and departments, weekly ERTL rotation, shift UTL rosters, provider shift sign-off, provider activation acknowledgement and movement, evidence/action workflows, and a canonical IERS timeline. The gap is not the absence of all functionality. The gap is that **assignment, acceptance, presence, response role, witnessed arrival, and independent review are not yet one explicit provider-centred operating contract**.

The first pilot must not start until the provider can see their institutional relationship and current responsibility, accept or decline the duty, respond to a labelled drill activation, participate in a linked debrief, and leave a verifiable improvement record without entering patient identifiers. The existing IERS pilot guide already makes the provider platform a first-class surface: providers trigger, acknowledge, respond, sign off shifts, submit evidence, progress actions, and join drills.[^1]

## 2. Current-state audit

| Area | Present implementation | Assessment | Required direction |
| --- | --- | --- | --- |
| Provider–institution relationship | `institutionMemberships`, staff links, pending invitation acceptance, responsibility roles | **Present and usable** | Add richer acceptance history and time-bound assignment state; keep membership as standing affiliation, not proof of current duty |
| Facility organization | Facility poles, departments, weekly ERTL department rotation, date/shift UTL roster | **Present but institution-admin centred** | Delegate recommendations to Unit Incharges; require ERCo/approved review before activation |
| Provider shift readiness | Assigned provider can confirm readiness and create workforce evidence | **Present but narrow** | Add explicit duty acceptance/decline, backup proposal, acceptance deadline, and exception queue |
| Provider activation response | Assigned provider sees activation, acknowledges/declines, marks responding/at scene | **Present and clinically important** | Add named response-role acceptance, witnessed arrival, escalation state, and provider task inbox |
| ERTL | Rotation designates the on-duty UTL as ERTL/scene commander | **Present as designation** | Add explicit availability/acceptance and replacement workflow; do not treat rotation output as attendance |
| ERT member allocation | Responder assignments exist, but named operational roles are not a complete provider workflow | **Partial** | Add activation-level role allocation, accept/decline, reason, alternative role, and conflict checks |
| Arrival acknowledgement | Provider can mark their own arrival | **Partial** | Allow permitted ERTL/onscene leader to record witnessed arrival for another member with actor/time/source |
| QR/team joining | CPR session router supports public short-code joining and guest members | **Adjacent, not integrated** | Bind signed expiring participation tokens to one IERS activation/drill; keep standalone CPR sessions separate |
| Debrief | IERS drill/debrief and CPR session debrief primitives exist | **Partial** | Create one activation-linked provider-led debrief with ERTL lead, scribe, participant observations, and independent review |
| Evidence and actions | Provider evidence/gap submission and owned action progress exist; institutional review/closure exists | **Present with governance** | Ensure debrief outputs link into the same canonical evidence/action records; prevent duplicate action creation |
| Provider navigation | `/home` combines IERS cards, Fellowship, AHA, certificates, Care Signal, and other content | **Overloaded** | Restructure into Emergency now, On duty, Learn and improve, and Account and affiliations |
| Provider account | Profile/security and basic institution responsibility card exist | **Incomplete** | Add affiliations, role history, duty preferences, notification controls, privacy/export, and support |
| Notifications | Header bell merges learning/certificate/Care Signal notifications | **Insufficient for urgent response** | Add a separate high-salience IERS response surface and durable delivery/acknowledgement state |
| Provider metrics | Some private counts are governed, but older generic performance metrics include unsupported outcomes and peer comparisons | **Risky** | Require source, scope, denominator, freshness, and limitations; demote unsupported fields from operational decisions |

## 3. How IERS works with an individual provider

### 3.1 Before the shift

The institution configures poles, departments, eligibility, responsibility roles, escalation contacts, and the applicable rotation rule. A Unit Incharge recommends a monthly or dated UTL roster for their unit. The recommendation is not yet an active duty. The Emergency Response Coordinator (ERCo) checks staffing, skills mix, known leave or redeployment, backup coverage, and the ERTL rule. An authorized institution operator approves or returns the recommendation.

The provider then receives a **time-bound responsibility assignment** in the individual portal. The provider sees the institution, pole, department, date, shift, role, backup path, and acceptance deadline. They choose **Accept**, **Decline with reason**, or **Suggest alternative**. A decline does not delete the history or punish the provider; it creates a visible coverage exception for ERCo. A proposed assignment cannot create a positive readiness state until it is approved and accepted.

### 3.2 At the start of the shift

The assigned UTL/ERTL confirms the people, equipment, escalation route, and handover they actually checked. A positive readiness sign-off is an attestation of the checked state, not a statement that the facility is perfect. If a critical item is missing, the safe action is to record the gap and create or link an owned action. The existing shift sign-off contract follows this principle: only active assigned shifts can be signed off, and the sign-off creates workforce evidence.[^1]

The institutional workspace sees coverage, acceptance, sign-off, missing roles, and exceptions. It does not need a second provider-authored copy of the sign-off; it reads the canonical IERS record.

### 3.3 When an activation occurs

The emergency flow remains stable: **open the app → enter findings or trigger the activation → receive priority next actions → reassess and record the response**. IERS adds the operational team layer around that flow.

1. A linked provider triggers the activation from the provider or institutional IERS surface. The server records institution, pole/department/location, urgency, activation type, source, actor, and time.
2. The server resolves the current eligible roster and creates durable responder assignments. Each assignment is tied to one institution and activation, with a notification lifecycle.
3. The individual portal presents an urgent activation task directly. The provider can accept/respond, decline with reason, or request backup. The provider must not search an ordinary notification list to find an urgent activation.
4. The ERTL or another authorized leader allocates operational response roles such as team lead, airway, compressions, medications/IV, recorder/scribe, runner, or observer. Assignment to an activation role is distinct from the provider’s standing membership role and from shift UTL/ERTL designation.
5. Each provider records their own movement and arrival. A permitted leader can record a **witnessed arrival** for another member, with actor, time, source, and reason. Delivery of an alert is never equivalent to arrival, and one provider’s arrival is never automatically treated as the whole team’s arrival.
6. The activation moves through the existing lifecycle: `notifying` → `acknowledged` → `responding` → `at_scene` → `stabilized` → `debrief_pending` → `closed`. Active IERS activations remain operable during renewal failure or expiry under the current continuity contract.[^2]

### 3.4 After stabilization

The ERTL leads the debrief. A scribe captures structured facts from the timeline, while participants may add factual observations. The provider portal should make this a task in the individual’s **Learn and improve** lane; the institution sees the same canonical activation-linked record in the command centre and review queue.

The debrief produces evidence and actions, but not automatic certification. Providers can submit evidence and progress owned actions. An institution leader or designated reviewer accepts evidence and verifies action closure. A person cannot silently create, perform, and independently verify their own closure. The current operating contract already states that providers may progress or escalate work but cannot self-close it.[^1]

## 4. Responsibility and authority model

| Actor | Responsibility | Allowed provider/institution actions | Explicit boundary |
| --- | --- | --- | --- |
| Unit Incharge (UI) | Daily/monthly unit staffing recommendation and local readiness | Recommend UTLs, propose ERT members, report unit gaps, accept/decline own duties, submit evidence | Cannot activate institution-wide roster policy, approve own evidence, or close own actions |
| Unit Team Leader (UTL) | Department/shift readiness and first-line coordination | Accept/decline duty, sign off checked readiness, lead unit response, recommend backup, submit evidence, progress owned work | Cannot independently verify own evidence/action closure |
| Emergency Response Team Leader (ERTL) | Whole-facility response performance for the rostered period | Lead activation/drill, allocate response roles, initiate escalation, record permitted witnessed arrival, lead debrief | Cannot erase history or independently approve their own evidence/actions |
| Emergency Response Coordinator (ERCo) | Evidence, action, drill, and roster coordination | Review UI recommendations, approve roster, schedule drills, review evidence, coordinate action queue | Must not become the sole operational dependency; backup coordinator required |
| Emergency Response Committee (ERC) | Institutional policy and governance | Approve policy, review trends, resolve escalations, approve readiness decisions | Does not replace event-level evidence review |
| Institution Admin | Identity, access, contract, subscription, and formal decisions | Link/suspend providers, assign responsibility/product roles, manage billing and governance, verify closure | Cannot rewrite clinical event facts or remove provenance |
| Linked provider | Point-of-care truth and assigned action | Trigger/acknowledge/respond, record arrival, join drills, submit evidence, progress actions, contribute debrief | Sees only authorized institutions and assignments |
| Paeds Resus reviewer | Programme oversight and human certification review | Review evidence packs and issue the Paeds Resus Institutional Competency Certificate if supported | Must not present it as an official AHA credential or regulatory accreditation |

Standing membership roles are not the same as time-bound assignments. A provider may be a UTL by standing designation but not be the UTL on a particular shift. The database and UI must retain both facts.

## 5. Proposed individual provider portal

### 5.1 Four operating lanes

| Lane | Question answered | Contents |
| --- | --- | --- |
| **Emergency now** | “Is there something I must respond to now?” | IERS activation inbox, urgent response banner, accept/decline, responding, at-scene, backup/escalation state, direct ResusGPS entry |
| **On duty** | “What responsibility do I own today or this month?” | UI/UTL/ERTL/ERCo designations, shift/month assignments, acceptance, readiness sign-off, backup suggestion, gaps, and handover |
| **Learn and improve** | “What should I learn, document, or improve next?” | Fellowship, AHA courses, CPD personal records, IERS evidence/actions, debrief tasks, Care Signal, and Code Signal with explicit boundaries |
| **Account and affiliations** | “Who am I and where am I linked?” | Profile/security, institution memberships, standing responsibility role, assignment history, notification preferences, privacy/export requests, and support |

The provider home should be a short task list, not a card wall. The first screen should show active urgent response, pending role acceptance, today’s readiness, and one next learning or improvement task. Historical metrics and certificates belong below the operational work.

### 5.2 Route contract

| Route | Meaning | Compatibility rule |
| --- | --- | --- |
| `/home` | Canonical provider workspace entry | Preserve the existing route and role behaviour; default to Emergency now when active work exists, otherwise On duty |
| `/home?section=emergency` | Provider IERS urgent inbox | Alias for future `/provider/emergency` |
| `/home?section=on-duty` | Provider roster and readiness lane | Alias for future `/provider/on-duty` |
| `/home?section=improve` | Provider IERS evidence/actions/debrief and QI | Alias for future `/provider/improve` |
| `/home?section=learn` | Fellowship/AHA/CPD/certificates | Preserve existing learning routes and credential semantics |
| `/home?section=account` | Profile and affiliations | `/account` and `/provider-profile` remain deep-link aliases |
| `/provider/emergency` | Future canonical urgent provider IERS route | Must preserve activation ID and institution context |
| `/provider/on-duty` | Future canonical duty route | Must preserve institution, assignment, and shift context |
| `/provider/improve` | Future canonical improvement route | Must preserve evidence/action/debrief source context |
| `/institution` | Institutional workspace | Providers must not be redirected here unless they intentionally switch context and have authorized access |
| `/safe-truth` | Accountless parent/caregiver story | Must never be labelled or routed as provider QI |

For mobile, the bottom navigation should expose **Emergency**, **On duty**, **Learn**, and **More**. `ResusGPS` remains directly reachable. An active IERS activation produces a persistent urgent state with a direct response action; it is not represented by a normal bell row only.

### 5.3 Provider account and affiliation controls

The account lane should include current and historical institution memberships, pending invitations, standing role, accepted/declined duties, preferred contact channels, availability/leave declarations where policy permits, notification consent, privacy/export requests, and a clear explanation of what the institution can see. A provider switching between institutions must choose context explicitly; local role preference is not an authorization decision.

## 6. QR and CPR session integration

The current CPR session code is useful for rapid team participation but is not enough to establish institutional identity. The safe design is an additive participation-token contract:

| Field | Requirement |
| --- | --- |
| Token | Cryptographically random, signed or hashed at rest, single-purpose, rate-limited |
| Scope | One institution plus one activation or drill; no global institution access |
| Expiry | Short-lived for live activation; longer but bounded for labelled drill |
| Identity | Linked provider account and active membership when available |
| Guest handling | Allowed only under explicit simulation/institution policy; no institutional authority, no certification credit |
| Role | Requested response role; role acceptance is still required |
| Deduplication | Unique activation/drill/member/source key; retries do not create duplicate responders or evidence |
| Privacy | No patient identifier, diagnosis, or family narrative in the token or QR payload |

A CPR session linked to an IERS activation/drill becomes an event-capture source for that canonical record. A standalone CPR session remains standalone ResusGPS data and must not automatically increase institutional readiness or create a second action item.

## 7. Data and source-of-truth contract

| Record | Canonical owner | Institution view | Provider view |
| --- | --- | --- | --- |
| Membership | `institutionMemberships` and staff record | Full authorized roster | Own affiliations and standing responsibilities |
| Shift/role assignment | Dated assignment record built on the current roster model or an additive assignment table | Coverage, approvals, exceptions | Own acceptance, decline, backup, readiness |
| Activation | `iersActivationEvents` | Command centre and full timeline | Assigned urgent inbox and own response state |
| Responder assignment | `iersActivationResponders` | Team state and escalation | Own assignment and role acceptance |
| Timeline | `iersActivationTimeline` | Immutable event history | Relevant event history and permitted factual contributions |
| Debrief | Activation-linked debrief record | Review and institutional learning | Lead/scribe/participant tasks |
| Evidence | `iersEvidenceRecords` | Review and scorecard | Submission history and feedback |
| Action | `iersActionItems` | Ownership, verification, reporting | Own work, progress, blockers |
| CPD attendance | CPD tables | Staff development and certificates | Own attendance, points, and certificates |
| Safe Truth | Accountless Safe Truth records | Governed aggregate signal only | No default join to provider identity or institution |

Institutional dashboards aggregate canonical provider actions; they must not create a parallel “institutional copy” of the same response. Provider queries must scope by authenticated user, membership, institution, activation, and assignment. Cache keys must include institution and activation identifiers.

## 8. Premortem and measures

The detailed premortem is included in this contract because operational failure is more likely to come from ambiguity, missed alerts, false readiness, poor connectivity, or unsafe authority than from a missing dashboard card.[^3]

| Failure | Measure required before pilot |
| --- | --- |
| Activation not seen or acknowledged | Separate urgent surface, durable delivery/read/ack state, verified contacts, escalation ladder, downtime fallback |
| Rostered provider counted as ready without accepting | Proposed/approved/accepted/declined/expired states; acceptance deadline; uncovered-role exception |
| ERTL unavailable | Rotation creates proposal; eligibility/backup check; explicit acceptance; ERCo replacement workflow |
| UI recommendation treated as authorization | Server approval state and authority matrix; UI cannot self-activate or self-review |
| Arrival identity unclear | Verified account linking, signed activation token, witnessed-arrival permission, idempotency |
| “All clear” while roles absent | Role coverage check before clear/debrief; documented exception path |
| Debrief becomes blame exercise | Structured factual prompts, just-culture copy, private participant observations, separated reviewer |
| Self-review or self-closure | Server conflict-of-interest check and second reviewer/exception record |
| CPR and IERS double-count | One canonical activation/drill link; source IDs; no score credit from unlinked sessions |
| Cross-tenant leak | Negative tests for every provider read/write and QR entrypoint; institution-scoped cache invalidation |
| Subscription expiry blocks response | Explicit continuity assertion for every in-flight mutation |
| False readiness score | Accepted-evidence-only score; critical-criteria gate; source/freshness/denominator labels |
| Care Signal/Safe Truth/IERS confusion | Persistent route labels and privacy explanations with distinct action language |
| Weak connection loses response | Idempotency key, sync state, last-known task, safe retry and reconciliation |
| Provider portal buries urgent work | Four lanes; active emergency first; maximum two taps to response |
| Unsupported metrics damage trust | Demote legacy performance outcomes; show only governed counts by default |

## 9. Release gates

The provider-integrated IERS architecture is not pilot-ready until the following are true:

1. A linked provider sees the correct institution, department, standing role, and current dated assignment.
2. Unit Incharge recommendation, ERCo approval, provider acceptance, and backup coverage are distinct records and states.
3. A provider can decline a duty with a reason without losing the original audit history.
4. ERTL availability and acceptance are explicit; an unavailable ERTL can be replaced without rewriting history.
5. A labelled drill requires the explicit non-emergency and no-patient-identifiers attestations.
6. A provider can trigger or join the activation/drill, accept a response role, acknowledge/respond/arrive, and see the resulting timeline.
7. A permitted leader can record witnessed arrival for another provider, with actor and source.
8. The alert cannot be considered cleared solely because delivery occurred.
9. The ERTL can lead a structured debrief, a scribe can capture facts, participants can add observations, and an independent reviewer can verify the outcome.
10. Evidence is accepted only by a permitted reviewer; action closure requires documented evidence and independent authority.
11. QR/short-code retries are idempotent and cannot create cross-tenant access or duplicate readiness credit.
12. All provider and institution queries pass negative tenant/product-role tests.
13. Offline/reconnect or duplicate-submit behaviour preserves ordering and does not create duplicate events.
14. Every operational metric shown to a provider or institution has source, scope, period, denominator, freshness, and limitations.
15. No screen encourages or stores patient identifiers in IERS drill, evidence, action, QR, or export fields.
16. The institution can operate during renewal failure without blocking an active response.

## 10. Implementation sequence

| Priority | Slice | Outcome |
| --- | --- | --- |
| P0 | Provider duty assignment/acceptance model and urgent activation surface | A provider knows and accepts their responsibility before the drill; urgent response is impossible to miss |
| P0 | Activation-linked debrief/scribe and witnessed-arrival events | One complete, auditable activation-to-learning loop |
| P0 | QR token scope and idempotency | Fast participation without identity or tenant leakage |
| P0 | Provider account/affiliation lane | Current responsibilities and notification controls are visible |
| P1 | UI monthly schedule recommendation and ERCo approval | Decentralized staffing with institutional governance |
| P1 | ERTL/ERT role availability, alternatives, and backup | Reduced single-point failure and fewer uncovered shifts |
| P1 | Offline-safe action outbox and reconciliation | Usable in low-resource connectivity conditions |
| P1 | Provider metric contract and demotion of unsupported claims | Honest learning and performance feedback |
| P2 | CPR session link adapter and debrief source consolidation | No duplicate readiness evidence |
| P2 | Notification delivery analytics and escalation policy tuning | Measurable alert reliability without alert fatigue |
| P2 | Usage and improvement analytics | Commercial and mission impact measured from truthful operational data |

The first implementation should not rewrite ResusGPS or the existing IERS activation state machine. It should add typed assignment/event records and provider-side task surfaces, then progressively move current cards into the four lanes. Existing routes remain aliases until the new navigation is validated in a real facility.

## 11. Success measures

The pilot should measure time to durable notification, time to first acknowledgement, time to first response, time to at-scene, assignment acceptance/decline rate, uncovered-role rate, backup activation rate, debrief completion, evidence acceptance, action verification time, and provider-reported confusion. These measures are operational signals, not a provider leaderboard. They should be shown with denominators and limitations.

The platform should not display or use “lives saved”, survival, peer rank, or earnings as IERS readiness evidence unless each value comes from a separately governed and validated source. A high readiness score cannot bypass the critical-criteria gate, and an institutional competency certificate remains a Paeds Resus programme credential distinct from official AHA certification.

## 12. Decisions required before code implementation

The following product decisions must be confirmed in the implementation contract, although they do not block this design:

- Whether the canonical provider route is `/home?section=...` for minimal migration risk or a new `/provider/...` namespace with `/home` as an alias.
- Whether ERCo is a standing institution membership role, an institution-scoped product role, or both. The recommended model is a standing responsibility designation plus dated operational assignments.
- Whether guest QR participants are permitted for live institutional activations. The recommended default is no; allow them only for labelled drills or explicit institution policy.
- The maximum response and acknowledgement windows for each priority level. These should be configured by institution policy but remain within safe platform defaults.
- Which approved outbound providers, consent records, and retention rules will enable SMS/email emergency fallback. The platform must not claim that a message was delivered while those prerequisites are absent.

## References

[^1]: [IERS Operating Guide V1](https://github.com/karuejob-max/paeds_resus_app/blob/main/docs/institutional/IERS_OPERATING_GUIDE_V1.md)
[^2]: [Institutional Portal Architecture V1](https://github.com/karuejob-max/paeds_resus_app/blob/main/docs/institutional/INSTITUTIONAL_PORTAL_ARCHITECTURE_V1.md)
[^3]: [Institutional Portal Gap Audit and Integration Plan V2](https://github.com/karuejob-max/paeds_resus_app/blob/main/docs/institutional/INSTITUTIONAL_PORTAL_GAP_AUDIT_AND_INTEGRATION_PLAN_V2.md)
[^4]: [Provider dashboard implementation](https://github.com/karuejob-max/paeds_resus_app/blob/main/client/src/pages/ProviderDashboard.tsx)
[^5]: [IERS router implementation](https://github.com/karuejob-max/paeds_resus_app/blob/main/server/routers/iers.ts)
[^6]: [Institution router implementation](https://github.com/karuejob-max/paeds_resus_app/blob/main/server/routers/institution.ts)
[^7]: [CPR session router implementation](https://github.com/karuejob-max/paeds_resus_app/blob/main/server/routers/cpr-session.ts)

