# Paeds Resus Platform UI/UX Master Audit

**Date:** 15 October 2026  
**Scope:** Whole platform — public acquisition, authentication, individual provider journeys, institutional workspaces, emergency response, learning, governance, notifications, accessibility, and operational trust.  
**Exclusion:** Simulation Hub implementation is excluded from this audit’s delivery scope, as requested; its surrounding navigation and platform integration are still considered.

## Executive judgement

Paeds Resus already contains the raw material of an exceptional product: a clinically serious emergency flow, an institutional operating model, role-aware Action Centres, durable governance, and a growing learning system. The central UX problem is not lack of features. It is **too much capability without one dominant mental model**.

The platform currently feels like several products sharing a shell:

- ResusGPS for bedside action.
- A provider portal for identity, work, credentials, and learning.
- An institutional operating system for staffing, CPD, accountability, and governance.
- A platform-admin console for verification, safety, revenue, and support.
- Public education and conversion pages.

A great interface can contain all of these. A confusing interface makes the user understand all of them before they can complete one task.

The transformation target is therefore not “make every screen prettier.” It is:

> **Make Paeds Resus feel like a calm, intelligent professional home that always knows who the user is, which institution and department are in scope, what matters now, what is safe to do next, and why.**

## What was actually examined

### Live authenticated evidence

The authenticated production session was inspected at:

- `/home`
- `/institution?institutionId=3`
- `/institution?institutionId=5`

Observed:

- The individual Action Centre clearly surfaced immediate work, credentials, My Shift, ResusGPS, and learning.
- The institutional workspace showed a role-labelled Action Centre and a single left navigation.
- Institution 3 rendered **117** roster staff.
- Institution 5 rendered **11** roster staff and a different institution heading.
- Direct canonical navigation to institution 5 produced matching URL, heading, selector value, and tenant-specific counts.
- A selector interaction through the browser automation layer visually changed the native control without reliably dispatching the application event; this was treated as an automation limitation, not as final proof of a user interaction pass.

### Repository evidence

The repository contains:

- A substantial shared design-token layer in `client/src/index.css`.
- Shared UI primitives based on Radix/shadcn-style components.
- A role-aware `OrientationActionCentre`.
- A consolidated `InstitutionWorkspace` shell with navigation lanes.
- Many existing audit documents identifying discoverability, notification, people/access, and onboarding issues.
- A very large page/component surface, with repeated concepts and multiple historical product generations still visible in the codebase.

## The central design thesis

### The user does not think in modules

A nurse thinks:

- “I need to know what to do now.”
- “Am I on duty?”
- “Can I respond?”
- “Where is my evidence?”
- “What do I need to complete?”

A Departmental Head thinks:

- “Which staff in my department need attention?”
- “Who is safe and ready for the next rota?”
- “Who needs a credential decision?”
- “What can I appoint without asking the administrator?”

An institutional administrator thinks:

- “What threatens readiness, compliance, staffing, or revenue?”
- “Which decisions are waiting for me?”
- “What changed since I last checked?”

A platform administrator thinks:

- “What is pending, anomalous, unsafe, duplicated, or unverified?”

The interface must therefore be organised around **decisions and queues**, not around the database’s product boundaries.

## UX scorecard

| Dimension | Current assessment | Why | Target |
|---|---:|---|---:|
| Emergency action clarity | 7/10 | Strong Action Centre and ResusGPS separation; multiple response surfaces remain | 10/10 |
| Role orientation | 7/10 | Role-specific cards exist; broad institutional sections still appear for privileged users | 10/10 |
| Tenant/context clarity | 6/10 | Canonical route is sound after the switch fix; context needs stronger persistent treatment | 10/10 |
| Information architecture | 5/10 | Many modules, historical names, and deep pages compete | 9/10 |
| Task completion efficiency | 5/10 | Person-first and queue-first workflows are incomplete | 9/10 |
| Feedback and state truthfulness | 6/10 | Several flows improved; notification and async state semantics need consolidation | 10/10 |
| Accessibility | 5/10 | Skip link, focus styles, labels, and touch targets exist; coverage is inconsistent | 9/10 |
| Visual coherence | 6/10 | Tokens and brand foundation are present; product generations still differ | 9/10 |
| Mobile/low-resource resilience | 6/10 | Responsive intent is visible; dense operational surfaces remain challenging | 9/10 |
| Emotional appeal / sense of home | 4/10 | Serious and functional, but not yet habit-forming or personally meaningful | 9/10 |

## The five context promises every screen must keep

Every authenticated screen should make these five answers obvious within three seconds:

1. **Who am I here?** — provider, Departmental Head, ERCo, CPD Coordinator, finance, administrator, platform reviewer.
2. **Where am I?** — individual workspace, institution, department, pole/team, activation, course, or review queue.
3. **What is the time horizon?** — immediate, today, this week, or historical.
4. **What is the next safe action?** — one dominant CTA, not a grid of equal buttons.
5. **What will happen if I act?** — outcome, scope, reviewer, and reversibility.

If any answer is hidden, the screen is not finished.

## Global information architecture

### Recommended top-level model

Use four human-readable operating spaces rather than exposing every product as a peer:

1. **Today** — immediate personal actions, current shift, urgent notifications, reassessment timers, and one next step.
2. **Respond** — ResusGPS, IERS activations, case context, bedside guidance, and recovery/debrief.
3. **Grow** — learning, CPD, IERP, NERP, AHA, credentials, and professional progress.
4. **Lead** — institutional operations, staffing, accountability, readiness, governance, finance, and evidence.

Platform administration remains a separate protected space: **Control Room**.

### Naming recommendations

| Current concept | Recommended user-facing name | Reason |
|---|---|---|
| Provider Today | Today | Human, memorable, time-oriented |
| My Shift | Duty & response | Explains both readiness and action |
| ResusGPS | Respond now | Preserves brand while clarifying purpose |
| Institutional Workspace | Facility workspace | Less abstract for frontline users |
| Accountability | Staff & standards | Explains what the page is for |
| Product roles | Responsibilities | Users assign responsibilities, not database products |
| Product access | Capability access | More understandable than product entitlement |
| IERS guide | Response system | “Guide” sounds educational rather than operational |
| CPD Portal | Learning operations | Includes attendance, progress, and planning |
| Platform admin | Control Room | Signals high-trust operational workspace |

Do not rename clinical terms casually. The emergency clinical vocabulary must remain recognisable and stable.

## Role experience design

### Provider without workplace

**Emotional state:** uncertain, possibly newly registered, needs belonging and a route forward.  
**Primary job:** complete identity and credentials, request a workplace, begin safe learning.  
**Home should show:**

- “You are ready to begin, but not yet linked to a facility.”
- One CTA: **Complete professional profile**.
- Second CTA: **Request workplace access**.
- A short explanation of what workplace linking does not grant automatically.
- A visible beginner learning route that does not imply institutional authority.

### Provider with multiple institutions

**Emotional state:** context-switching risk.  
**Primary job:** act in the correct institution without cross-tenant mistakes.  
**Home should show:**

- Persistent institution chip in every institution-sensitive flow.
- A context confirmation before irreversible or high-impact actions.
- Recent institution history, not just a dropdown.
- “You are acting for…” language on role acceptance, reports, CPD attendance, and IERS actions.

### Departmental Head / Deputy

**Emotional state:** accountable but time-poor.  
**Primary job:** make department-level workforce and readiness decisions.  
**Home should show:**

- Department name and scope in the page title.
- Credential queue.
- Staff needing action, grouped by urgency.
- Team/role appointments.
- CPD and life-support progress by cadre.
- No finance, institution-wide billing, or unrelated administration by default.

### ERCo / Institutional ERCo

**Emotional state:** operational responsibility under uncertainty.  
**Primary job:** publish valid teams, monitor coverage, act on gaps, and manage activations.  
**Home should show:**

- Current dated team status.
- Missing roles and stale assignments.
- “Safe to activate” / “Cannot activate safely” state with reasons.
- Current incident queue.
- Past activation learning loop.

### CPD Coordinator

**Emotional state:** coordination burden and reconciliation anxiety.  
**Primary job:** run sessions, confirm attendance, reconcile multi-department participation, and show value.  
**Home should show:**

- Next session.
- Attendance exceptions.
- Department and cadre progress.
- Presenter and learner reconciliation warnings.
- QR/session state that explicitly supports a shared session across departments.

### Finance / general institutional staff

**Emotional state:** wants confidence without clinical clutter.  
**Primary job:** finance, contracts, or assigned administrative work.  
**Home should not show:** IERS staffing, clinical credential decisions, or operational queues unless explicitly authorised.

### Platform administrator

**Emotional state:** queue triage and risk management.  
**Primary job:** review, verify, resolve, investigate, and preserve an audit trail.  
**Home should show:**

- One universal review inbox.
- SLA/age, risk, institution, owner, and next action.
- Clear distinction between “submitted,” “under review,” “verified,” “rejected,” “delivery failed,” and “needs escalation.”
- Bulk operations only where safe and reversible.

## The Action Centre should become the platform’s operating system

The current Action Centre is the correct direction but remains too card-oriented. The next generation should use a **priority queue**:

### Queue structure

1. **Do now** — safety-critical or deadline-critical.
2. **Do today** — important but not immediately dangerous.
3. **Waiting for someone else** — shows owner and expected next event.
4. **Keep improving** — learning and non-urgent progress.

Every item should expose:

- Source domain.
- Scope.
- Age.
- Consequence of delay.
- One action.
- One secondary “why?” link.

### Do not use equal-weight launcher grids as the primary navigation

The current four-card launchers are useful orientation aids but compete with the actual next action. Keep them as secondary shortcuts, not as the main hierarchy.

## Emergency UX: the highest standard

### Principles

- One screen, one decision, one dominant action.
- Status must be observable without opening another page.
- Timers must survive navigation and reconnection.
- Every action must say whether it is local, team-scoped, department-scoped, or institution-scoped.
- Never use a successful-looking green state for a queued or best-effort operation.
- Never make a responder infer whether an alert was sent, delivered, received, or acknowledged.

### Recommended IERS activation presentation

Persistent top strip:

> **Activation 1042 · North Pole · Paediatric Ward · Acknowledgement pending**

Then four compact stages:

1. **Alert** — pending / accepted / failed.
2. **Team** — assigned and current.
3. **Scene** — responding / at scene.
4. **Care** — stabilised / recovered / debrief.

The user should not need to understand the underlying event tables or role snapshots.

## Institutional workspace critique

### What works

- A shared left navigation reduces repeated launchers.
- The workspace explicitly states role scope.
- The current institution can be selected.
- Readiness, Learning, Accountability, and Administration are separated.
- Tenant-specific counts visibly change on canonical institution routes.

### What still needs redesign

- The workspace is still administrator-first rather than decision-first.
- A privileged user sees too many lanes before seeing the actual queue.
- People & roles remains conceptually split across roster, product roles, shared scopes, IERS governance, and learning governance.
- Long pages and nested tabs make the user learn the system’s internal structure.
- “Available” is weaker than an actionable state; it should explain the next decision.
- Empty states should be contextual: “No future session scheduled” should provide the exact next action and expected setup time.

### Target institutional home

Top:

- Institution + department scope chip.
- “As of” timestamp.
- Open review queue button.
- Current readiness status.

Main:

- Four queue tiles: Credential risk, Staffing risk, Learning risk, Governance risk.
- Each tile shows count, oldest item, and owner.
- One activity timeline: “What changed since your last visit.”

Secondary:

- Direct task links.
- Institution health summary.
- Export/report controls.

## Visual design direction

### Keep

- Teal/orange brand relationship.
- Warm, high-contrast light surfaces.
- Shared cards, buttons, alerts, and focus treatments.
- Dark mode as an option, not the default clinical state.
- Strong red/amber treatment for emergency states.

### Improve

- Reduce border-heavy card nesting.
- Establish a clearer type scale: page title, task title, supporting explanation, metadata, helper text.
- Reserve orange for primary action and safety attention; do not use it as generic decoration.
- Reserve red for danger or failed safety preconditions.
- Use blue for waiting/information, teal for operational readiness, violet for learning, and slate for administration.
- Increase whitespace around the next action, not around every container equally.
- Use compact data density for institutional tables and generous touch targets for bedside flows.
- Add consistent status icons plus text; never rely on color alone.

### Emotional design

“Feel like home” should not mean gamification everywhere. It should mean:

- The user’s role is recognised.
- Their progress is remembered.
- Their workplace is visible.
- Their next action is not buried.
- The system explains itself without making them feel incompetent.
- After a stressful action, the system confirms what happened and what comes next.

## Accessibility and inclusive design

### Current strengths

- Skip-link implementation exists.
- Focus rings are defined globally.
- Mobile touch-target intent exists.
- Many clinical states use `role="alert"` or `role="status"`.
- Shared primitives provide a good foundation.

### Required platform-wide standard

- Every interactive control has a visible, meaningful accessible name.
- Every form field has an associated label and error message.
- Keyboard order follows visual and clinical order.
- Dialogs trap focus and return focus to the triggering control.
- Async mutations announce pending, success, and failure states.
- Status is never conveyed by color only.
- Tables provide mobile alternatives or horizontal-scroll affordances.
- Text remains usable at 200% zoom.
- Reduced-motion preference disables non-essential motion.
- Clinical timer states remain understandable to screen readers.
- Use plain language before technical terminology.

## Content and language audit

### Rules

1. Lead with the action, not the system noun.
2. Say who owns the next step.
3. Say what is blocked and why.
4. Say whether a result is saved, queued, delivered, or only displayed locally.
5. Avoid “available” when the user still has prerequisites.
6. Replace generic “Manage” with the actual job: review, publish, appoint, reconcile, verify, resolve, or export.
7. Use “institution” consistently; do not alternate casually between facility, workplace, organisation, and account.
8. Use “licence” consistently in Kenyan-facing copy, with helper text distinguishing licence number from cadre number.

### Example rewrite

Weak:

> Check emergency-response readiness — Available

Better:

> **Publish today’s response team**  
> No current dated team is published for North Pole. Publish the team before sending an activation.

## Notification and feedback architecture

The platform needs one durable notification inbox with structured metadata:

- Domain: clinical, role, learning, finance, system.
- Institution ID.
- Department ID.
- Action type.
- Priority.
- Created at.
- Due at.
- Owner.
- Read state.
- Delivery state.
- Destination.

The header bell, Action Centre, email links, and role-specific inboxes must consume the same authoritative record. Do not create more notification panels.

## Performance and low-resource UX

- Treat initial load as a clinical reliability problem, not only a performance metric.
- Render the first actionable shell before secondary analytics.
- Avoid loading all institutional panels before the user chooses a lane.
- Query counts and queue summaries first; defer long tables.
- Provide a clear offline/poor-network state with last-synced time.
- Preserve unsent clinical drafts locally with a visible sync state.
- Do not hide a failed mutation behind a generic toast.
- Use skeletons only where the shape is stable; otherwise use honest loading text.

## Research programme that would make this academically strong

A university-quality design system needs evidence, not taste alone.

### Study 1 — Critical incident usability

Participants: PICU/paediatric nurses, doctors, ERCos.  
Task: recognise an activation, acknowledge, respond, join case, record arrival, and close with debrief.  
Measures: time to first correct action, wrong actions, missed timer, recovery after network interruption, confidence.

### Study 2 — Institutional governance

Participants: administrator, Departmental Head, Deputy, CPD Coordinator, finance.  
Task: verify credential, appoint ERCo, schedule multi-department CPD, resolve a department conflict, inspect readiness gaps.  
Measures: completion rate, unnecessary navigation, permission confusion, role-scope errors.

### Study 3 — First-session orientation

Participants: new provider with and without workplace.  
Task: complete profile, submit licence, request workplace, start BLS/IERP, find help.  
Measures: wrong role selection, time to first value, abandonment, comprehension of credential requirements.

### Study 4 — Accessibility and language

Participants using screen readers, keyboard only, low vision, low bandwidth, and English as a second language.  
Measures: task completion, focus loss, error recovery, comprehension, perceived trust.

### Instrumentation

Track event-level friction, not surveillance:

- route entry and exit;
- backtracking;
- repeated validation errors;
- time in loading state;
- action cancellation;
- scope/institution switches;
- support/help openings;
- completed next action;
- failed delivery and retry.

## Prioritised transformation backlog

### P0 — trust and emergency usability

1. Make institution context persistent in every institution-sensitive page.
2. Create one authoritative notification/task inbox.
3. Add IERS stage state: queued, sent, delivered, failed, received, acknowledged.
4. Make Action Centre queue-based with one dominant next action.
5. Add explicit scope labels to role-sensitive actions.
6. Add transaction/outbox protection to activation creation and notification fan-out.
7. Add a production persona smoke matrix with recorded evidence.

### P1 — role clarity and task efficiency

1. Redesign People & Access as person-first role assignment.
2. Create Departmental Head and Deputy home views scoped to department.
3. Create ERCo and CPD Coordinator operational homes.
4. Hide irrelevant institutional lanes by default.
5. Replace technical names such as product role/shared scope with human responsibility language.
6. Add a “what changed since last visit” timeline.
7. Standardise empty states with one clear CTA.

### P2 — emotional quality and adoption

1. Add a personal professional progress home.
2. Add meaningful recognition for completed readiness and learning milestones without implying competence certification.
3. Improve public-to-authenticated continuity so the user knows why the platform exists and where to begin.
4. Build contextual help and short guided tours only at high-confusion moments.
5. Add user-tested illustrations and diagrams for institutional concepts.

### P3 — design-system maturity

1. Audit every route for shared shell compliance.
2. Publish component usage rules and status semantics.
3. Add visual regression snapshots for critical role journeys.
4. Add accessibility checks to CI.
5. Remove or quarantine duplicate historical surfaces after usage evidence.

## Definition of done for the redesign

The redesign is successful only when:

- A new provider can reach first value without knowing the product taxonomy.
- A provider can tell their current institution, department, role, and next action everywhere.
- A Departmental Head cannot accidentally operate outside their department.
- Finance staff do not see clinical operational work by default.
- An ERCo can tell whether a response team is safe to activate in under ten seconds.
- An IERS responder can distinguish assigned, delivered, received, acknowledged, responding, and at-scene states.
- An administrator can find a person and assign a responsibility without understanding product roles or shared scopes.
- Every high-impact action explains scope, consequence, and auditability.
- Critical workflows remain usable on a small phone, poor network, and keyboard-only navigation.
- At least five representative users per primary persona complete the core tasks with no critical error.
- The platform’s measured outcomes improve: time-to-action, completion, correct routing, reduced support requests, and fewer cross-scope errors.

## Immediate implementation recommendation

Do not begin with a visual rebrand. Begin with a **context-and-queue foundation**:

1. Introduce a shared `ContextHeader` component for workspace, institution, department, and scope.
2. Introduce a shared `TaskQueue` component for Action Centre, notifications, and review queues.
3. Define a single status vocabulary and map all existing states to it.
4. Redesign the institutional People & Access entry as person-first.
5. Add user-tested critical-path prototypes before changing every page.
6. Use the existing tokens and primitives to reduce visual drift.
7. Validate with the four studies above, then expand the visual transformation.

This sequence protects the emergency flow, improves operational trust first, and prevents a costly cosmetic rewrite that leaves the actual product model confusing.
