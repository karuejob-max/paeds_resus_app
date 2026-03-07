# Strategic Decisions: Monetization and Platform Activation

## Purpose

This document records the product and business decisions required to monetize the capabilities already present in the platform.

## Decision 1 — Monetization follows a 4-lane model

We will monetize through four lanes in parallel:

1. **Clinical training products** (BLS, ACLS, PALS, Fellowship)
2. **Institutional licenses** (seat-based, bulk discounted)
3. **Parent/caregiver training** (entry-level, high-volume)
4. **Marketplace add-ons/extensions** (paid integrations, plugins, analytics)

**Why:** All four lanes already have foundation in the current codebase and pricing definitions.

## Decision 2 — Payments are Kenya-first, globally extensible

Payment prioritization:

1. **M-Pesa first** for local conversion and institutional onboarding
2. **Stripe/PayPal** for regional and international expansion
3. **Bank transfer** for enterprise procurement cycles

**Why:** Existing payment routers already support this mixed strategy.

## Decision 3 — Product-led upsell is mandatory

Every paid learner journey must support progression:

- Parent/basic courses → BLS
- BLS → ACLS/PALS
- ACLS/PALS → Fellowship
- Individual learners → institutional champions (hospital conversions)

**Why:** This improves LTV and aligns with existing course/fellowship structure.

## Decision 4 — Certification will be treated as recurring revenue

Certification and verification are not one-time artifacts.
We will add recurring value through:

- recertification reminders,
- renewal offers,
- institutional verification/reporting packages.

**Why:** Existing certificate schema supports verification and expiry workflows.

## Decision 5 — Marketplace becomes a second growth engine

Marketplace strategy:

- Launch first-party premium extensions first.
- Add third-party partner extensions with rev-share once governance is stable.
- Use verified badges and rating/review signals to increase trust.

**Why:** Marketplace routes already include extension creation, installation, pricing, reviews, and stats.

## Decision 6 — Activation hub is the default user entry point

The application root route must surface all high-value modules (clinical, training, institutional, analytics, payments) in one place.

**Why:** This improves discoverability and ensures users benefit from what has already been built.

## Decision 7 — Weekly monetization operating cadence

The team will review every week:

- conversion rate by funnel,
- paid enrollments,
- institutional pipeline stage movement,
- payment success/failure rates,
- average revenue per user/account,
- extension revenue contribution.

**Why:** Decisions should be metric-driven and adjusted continuously.

## Non-goals (for this activation cycle)

- Building entirely new major product lines.
- Multi-quarter re-architecture before monetization starts.
- Delaying launch until every edge-case integration is complete.

## Success criteria for this cycle

- Users can clearly discover and access monetizable modules from one entry point.
- Existing pricing and payment rails are visibly connected to product journeys.
- Strategic decisions are documented and version-controlled.
