# Institutional UX Phase 0 Baseline

**Prepared:** 2026-09-28  
**Repository baseline:** freshly fetched `origin/main` before this documentation branch  
**Purpose:** Evidence record for `INSTITUTIONAL_PLATFORM_UX_IMPLEMENTATION_PLAN.md` before revenue, legal, public-copy, or workflow changes.

## Executive finding

The institutional platform has substantial working foundations, but the public funnel and executable commercial rules are not yet a single trustworthy contract. The highest-risk mismatch is pricing: the executable source currently produces IERS standard prices of KES 80,000 / 150,000 / 250,000 for Levels 4 / 5 / 6, while the institutional documents and earlier briefing use KES 200,000 / 350,000 / 600,000 and the public institutional page uses a flat KES 200,000 statement. ILSP and ICPD public copy also diverge from the current executable rules.

**No pricing, legal identity, domain, consent, or public claim was changed in this baseline phase.** Those changes remain gated by the owner decisions in the implementation plan.

## Baseline results

### 1. Executable pricing output

Source inspected: `shared/institutional-pricing.ts`.

| Product / input | Standard executable amount | Founding Partner amount | Private-mode amount |
|---|---:|---:|---:|
| IERS Level 4 | KES 80,000 | KES 40,000 | KES 104,000 |
| IERS Level 5 | KES 150,000 | KES 75,000 | KES 195,000 |
| IERS Level 6 | KES 250,000 | KES 125,000 | KES 325,000 |
| ICPD, 50 staff | KES 50,000 | KES 25,000 | Not calculated in this pass |
| ICPD, 150 staff | KES 135,000 | KES 67,500 | Not calculated in this pass |
| ICPD, 400 staff | KES 320,000 | KES 160,000 | Not calculated in this pass |
| ICPD, 600 staff | KES 420,000 | KES 210,000 | Not calculated in this pass |

ICPD per-staff tiers in executable code are KES 1,000 (1–100), KES 900 (101–300), KES 800 (301–500), KES 700 (501–1,000), and KES 600 (1,001–2,000).

The public page currently contains a flat `IERS and ICPD are each KES 200,000` statement. The public For Institutions page currently says ILSP is KES 10,000 per staff member, while the approved institutional executable rate is KES 7,000 per provider. These are revenue-affecting discrepancies and must not be patched by guessing.

### 2. Production migration scripts

The repository contains scripts through migration `0166` at this baseline. No `apply-0164`, `verify-0164`, `apply-0165`, `verify-0165`, `apply-0166`, or `verify-0166` files were found under the exact naming patterns checked in the attached plan. This is a repository observation only; it is **not** evidence that production migrations are unapplied. Production state must be checked from Render Shell using the project’s actual scripts and database verification commands.

### 3. Production inquiry count

A read-only inquiry count could not be run from this sandbox because `DATABASE_URL` is unavailable here. The plan’s correction remains important: lead submissions write to `institutionalInquiries`, but the baseline code search found no connected admin inbox/reader path in the examined implementation. Run the production status/age count from Render Shell before implementing lead operations.

Required query shape:

```sql
SELECT status, COUNT(*) AS count, MIN(createdAt) AS oldestCreatedAt
FROM institutionalInquiries
GROUP BY status
ORDER BY status;
```

Do not paste credentials into the repository or task messages.

### 4. Public route HTTP observations

Requests were made against `https://paedsresus.com` with redirects followed where the server responded:

| Route | Observed result |
|---|---|
| `/` | 301 to `https://www.paedsresus.com/`, then 200 |
| `/for-institutions` | 301 to `https://www.paedsresus.com/for-institutions`, then 200 |
| `/institutional` | timed out during this run; requires repeat from production/network and should not be treated as verified |
| `/contact` | connection failure during this run; requires repeat |
| `/start` | 301 to `https://www.paedsresus.com/start`, then 200 |
| `/definitely-not-a-page` | redirect observed, final response did not complete within the run; real 404 remains unverified |

The route matrix is therefore **inconclusive**, not a pass. Repeat it after Render/Cloudflare stability is confirmed and record final status codes and canonicals in the relevant PR.

### 5. Domain observations

- `paedsresus.com` resolves and redirects to `www.paedsresus.com`.
- `www.paedsresus.com` resolves and responds.
- `paeds-resus.com` and `www.paeds-resus.com` did not resolve in this environment.
- This does not prove ownership, expiry, or certificate safety. Do not change certificate verification URLs or email domains until the owner confirms domain ownership and monitoring.

### 6. Obsolete audit

`docs/INSTITUTIONAL_PLATFORM_AUDIT.md` is dated 2026-02-25 and contains claims that are explicitly superseded by later implementation work, including statements that leads are not stored and onboarding is mock-only. It is now marked as superseded and points readers to the current plan, this baseline, and `docs/PLATFORM_CURRENT_STATE.md`.

## Decisions required before implementation of blocked phases

The attached plan identifies these owner decisions as material:

- **D1:** Canonical IERS price by facility level.
- **D2:** Public ILSP display: KES 10,000 list, KES 7,000 effective, or current cohort offer.
- **D3:** Public ICPD display: tier table or another approved presentation.
- **D4:** Founding Partner term/renewal/data-sharing rule and whether it is public or proposal-only.
- **D5:** Exact ILSP credential and AHA add-on wording.
- **D6:** Canonical domain and institutional role inbox.
- **D7:** Legal identity/address/ODPC/AHA identifiers that are real and approved for publication.
- **D8:** Evidence wording and what consented proof may be shown publicly.
- **D9:** Product vocabulary: ICPD vs CPD Portal, Family & Caregivers, Paediatric spelling policy.
- **D10:** Keep separate institutional sales pages or merge to one canonical sales page.
- **D11:** Lead response owner and service-level promise.
- **D12:** Which payment launch preconditions are complete.

Manus should not select values for D1–D9 or D11–D12 because they affect revenue, legal identity, consent, external claims, or operational commitments.

## Work that can proceed without those decisions

1. Production inquiry count and migration verification from Render Shell.
2. Admin lead inbox design using existing inquiry rows, provided migration numbering is rechecked immediately before implementation.
3. Lead notification plumbing after the response SLA (D11) is supplied; the technical failure policy can remain fail-open for email while preserving the database save.
4. Public-route/404/canonical test coverage and repeatable HTTP diagnostics.
5. Superseding stale audit documents and maintaining the current-state map.
6. Workflow evidence collection for empty states, mobile behavior, and authenticated onboarding, without changing pricing or legal copy.

## Exit status

**Phase 0 evidence baseline: substantially complete.** Production migration state, production inquiry counts, authenticated workspace UX, Lighthouse measurements, and final route status codes remain external/deployed checks. Phase 1 truth-and-trust work is blocked on D1–D9; Phase 2 lead notification is blocked on D11, while the lead inbox can be designed and implemented separately.
