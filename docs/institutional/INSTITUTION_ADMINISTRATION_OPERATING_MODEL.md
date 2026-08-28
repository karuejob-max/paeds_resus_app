# Institutional Administration Operating Model

## Purpose

Institution Administration is the institution’s **control plane**. It prepares the organization to use Paeds Resus products safely by keeping identity, roster, access, billing, programme handoffs, data, and support in order. It is not a replacement for the IERS Readiness workspace, the Learning/CPD workspace, the ILS operating workspace, or the provider’s bedside workflow.

## Phase 0 audit findings

The previous dashboard was functionally rich but operationally fragmented. A coordinator had to move through nested tabs without a single attention view. Roster/link requests, department mismatches, product renewal risk, and ILS order state were not presented together. The shared summary displayed only IERS and CPD subscription state even though ILS is a separate institution-paid cohort programme. Data, support, notifications, retention, and recovery were grouped despite having different owners and urgency.

The previous billing surface also exposed a platform-admin subscription status override inside the institution dashboard. That control belonged to Paeds Resus platform operations, not institution self-service, and has been removed from the institutional surface. The old BLS/ACLS/PALS institutional bulk-payment component was also removed from Administration and Learning operations. Institutions now use the ILS workspace for the current institution-paid Paeds Resus cohort journey; AHA add-on requests remain separate and learner-specific.

## Target information architecture

| Lane                     | Owns                                                                                                                     | Primary action                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| **Overview**             | Current attention, roster count, product risk, ILS order summary, and navigation                                         | Review the next decision                            |
| **People & access**      | Institution profile, classification, roster, departments, account admins, product roles, scopes, links, and staff import | Make the correct person and responsibility explicit |
| **Products & billing**   | IERS/CPD product access, renewal requests, contracts, and subscription history                                           | Resolve access and commercial lifecycle issues      |
| **Programme operations** | Handoffs to IERS Readiness, Learning/CPD, and ILS operations                                                             | Open the product lane that executes the work        |
| **Data & support**       | Exports, retention, recovery, managed services, notifications, and support tickets                                       | Preserve evidence and route exceptions to an owner  |

## Overview attention rules

The overview shows attention only when an authoritative query returns the relevant state. It must never infer that a failed query means a clean institution. Current attention signals include pending staff-link requests, department mismatches, roster members without a department, product renewal/access risk, and ILS orders in draft, readiness, payment, or blocked states. Each signal has one clear review destination.

The roster metric counts active institution records and excludes retired records. ILS is summarized as an order-based programme, not as an IERS/CPD subscription. ILS execution remains at `/training/institutional-life-support`, where roster confirmation, capacity, payment, delivery, practical assessment, certificate, AHA review, and pilot controls are enforced.

## Role boundaries

Institution administrators can manage their institution’s identity, roster, account admins, roles, scopes, departments, renewal requests, data policies, and support requests according to the existing server-side scope checks. Platform administrators may operate platform-level subscription and service controls, but those controls must not be presented as institution self-service actions. Product-specific clinical and learning decisions remain in their product workspaces.

## Safety and continuity principles

Administration must preserve historical evidence and audit records. Retirement, unlinking, suspension, expiry, and recovery are state transitions, not destructive deletion. Product status is never inferred from a missing query. ILS is never represented as an individual self-pay course in an institutional lane. AHA wording must remain separate from Paeds Resus competency certification. No dashboard reorganization may change the emergency bedside flow: open the app, enter findings, receive next actions, and reassess.

## Definition of done for this reorganization

The dashboard exposes an actionable overview; lanes are named by the decision they own; ILS is visible without being mistaken for a subscription; the platform-admin subscription override is removed from institution self-service; the legacy institutional AHA bulk-payment panel is no longer rendered; classification is visible in the institution profile; all existing mutations remain server-authorized; focused TypeScript/tests/build checks pass; the operating model is documented; and release follows the protected branch workflow. No production test records are required for this UI reorganization.
