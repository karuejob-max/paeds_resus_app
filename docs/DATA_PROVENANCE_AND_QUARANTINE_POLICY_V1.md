# Data Provenance and Quarantine Policy v1

## Rule

No event is production clinical evidence merely because it was entered through a production deployment. Every adaptive-learning, QI, fellowship, benchmark, and institutional report must use a server-controlled provenance class and an explicit eligibility predicate.

## Classes

| Class | Meaning | Production clinical analytics by default |
|---|---|---|
| `production_clinical` | Labelled live clinical observation with verified tenant and case context. | Eligible only after governed writer validation. |
| `training_simulation` | Course or scenario practice. | Excluded. |
| `manikin_drill` | Labelled synthetic/manikin IERS or ResusGPS validation. | Excluded. |
| `synthetic_fixture` | Automated or disposable test data. | Excluded. |
| `test` | Technical test record. | Excluded. |
| `unknown` | Legacy or incomplete provenance. | Excluded pending review. |

## Current hardening behavior

ResusGPS clinical events written by the current safety slice receive a server-controlled provenance envelope with `dataClass: unknown`, `quarantineStatus: pending_review`, and `analyticsEligible: false`. The client cannot claim production status. This is an interim safe default until the full tenant/scenario provenance migration is approved and applied.

## Required future migration

The next governed data migration must add typed provenance columns and tenant joins to ResusGPS, Care Signal, Code Signal, IERS drill/evidence, analytics, and QI snapshots. Legacy rows must remain `unknown` or `pending_review`; they must not be silently backfilled as production clinical evidence. Exports must record the policy version and exclusion counts.

## Non-negotiable controls

Synthetic/manikin runs use labelled test accounts and no patient identifiers. Clinical dashboards, Fellowship credit, facility benchmarks, adaptive-learning recommendations, and mortality/survival indicators exclude non-production and quarantined rows. Any quarantine clearance requires an authorised reviewer, a reason, a timestamp, and append-only audit evidence.

The existing hard-coded clinical-looking QI placeholder metrics must remain outside clinical surfaces or be visibly marked `synthetic_fixture`; they are not evidence of facility performance or lives saved.
