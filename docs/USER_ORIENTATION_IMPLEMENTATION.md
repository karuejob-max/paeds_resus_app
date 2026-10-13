# Paeds Resus user orientation implementation

**Status:** Implemented in the orientation foundation slice

## Operating principle

Paeds Resus should answer four questions at the point of work:

1. **What should I do now?**
2. **Where do I do it?**
3. **Why does it matter?**
4. **What happens next?**

The emergency flow remains unchanged: open the app, enter findings, receive priority next actions, and reassess.

## Implemented

### Provider Today

- Added a persistent **Your Action Centre** to `/home`.
- Preserves the existing server/workplace-authoritative next-action state machine.
- Shows explicit destinations for:
  - Profile and credentials
  - ResusGPS
  - Learn
  - My Shift
- Explains the multiple-institution case before the provider acts on workplace data.
- Shows a setup action when no workplace is linked.

### Institutional Workspace

- Added a role-aware institutional Action Centre to the overview.
- Provides plain-language orientation for:
  - Institutional administrators
  - Departmental leadership
  - Emergency response coordination
  - CPD coordination
  - Institutional team members
- Shows only actions allowed by the current workspace projection:
  - Accountability / credential review
  - Readiness
  - Learning and CPD
  - Administration
- Explains that the view is scoped to the selected institution and current permissions.

### First-time role selection

- Corrected legacy role-prompt destinations to canonical `/home` and `/institution` routes.
- Clarified that users may switch views later.
- Removed the unused third-column layout.

## Orientation contract for future work

Every new high-risk workflow must provide:

- A short purpose statement.
- The required inputs.
- The responsible reviewer or next actor.
- A visible status: not started, incomplete, submitted, under review, verified, rejected, expired, or complete.
- A corrective action when blocked.
- An explicit destination back to the next step.

Use plain language first, then programme names. For example:

> **Emergency response team coordinator (ERCo)** — the person responsible for coordinating the department's emergency response team.

## Learning track separation

The UI must continue to distinguish:

- **Paeds Resus Fellowship:** the professional learning journey.
- **AHA certifications:** separate certification courses such as BLS, ACLS, and PALS.
- **Micro-courses:** standalone enrolments that may also open Paeds Resus learning and ResusGPS access.

Do not present AHA certification as an automatic Fellowship requirement.

## Validation scenarios

Use QA fixtures to verify:

- New provider sees profile/credential setup guidance.
- Provider with a live activation sees the activation action before generic learning.
- Provider with two institutions sees the institution-scope warning.
- Departmental Head sees accountability and department-scoped review actions.
- Deputy Departmental Head sees only delegated actions.
- Institutional ERCo sees readiness actions.
- Institutional CPD Coordinator sees learning actions.
- Finance sees neither clinical credential nor UTL staffing actions.
- A direct blocked route explains why access is denied and where to go next.

## Deferred follow-up slices

These should reuse the same contract rather than introduce separate onboarding systems:

1. Add journey/status trackers to credential, role acceptance, CPD registration, and IERS setup forms.
2. Standardise empty-state CTAs across data-dependent pages.
3. Add role-specific restartable tours for provider and institution workspaces.
4. Add Action Centre aggregation for notifications, waiting-on-someone-else states, and recently completed actions.
5. Add telemetry for time-to-first-action, unnecessary clicks, permission dead ends, and incomplete submissions.
6. Add institution setup templates only after the current role-scoped workflow is proven with pilot facilities.

## Safety boundary

Orientation may explain and route. It must not imply that:

- A facility membership proves competence.
- A course completion proves clinical authorization.
- A role acceptance proves presence at a scene.
- A dashboard score replaces professional judgement or local policy.
