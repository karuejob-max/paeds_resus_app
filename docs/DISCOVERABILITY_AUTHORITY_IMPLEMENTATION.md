# Discoverability and Authority Implementation

## Implemented in code

The public site now has a consent-safe resources foundation at `/resources` with three practical articles covering BLS certification decisions, hospital emergency-readiness checklists, and paediatric shock recognition. The article pages are prerendered, included in the public sitemap, linked from the shared footer, and marked up with `Article` JSON-LD.

The provider and institutional pages now expose visible FAQ sections whose answers are also emitted as matching `FAQPage` structured data. This keeps the machine-readable answers aligned with content a visitor can actually read. The pages also emit Kenya-scoped `MedicalOrganization` and `LocalBusiness` graph nodes without inventing a facility name, address, rating, testimonial, or clinical outcome.

Unknown anonymous public paths now return HTTP 404 from the production static fallback while authenticated requests retain the SPA shell. This reduces soft-404 ambiguity for dead legacy URLs without breaking role-gated application routes.

The implementation preserves the approved public boundaries: current geography is Kenya with a Central-Kenya focus; East African Community expansion remains planned; and no unconsented facility reference is present in public source, sitemap, structured data, or resources.

## Human-owned actions that remain

| Action | Owner | Evidence of completion |
|---|---|---|
| Submit the current sitemap and inspect coverage | Verified Search Console owner | Sitemap accepted and Pages report reviewed |
| Confirm recrawl of `/`, `/for-providers`, `/for-institutions`, `/resources`, and priority articles | Verified Search Console owner | URL Inspection shows latest crawl and indexed state |
| Create or verify the Google Business Profile | Organisation owner | Profile is claimed, accurate, and publicly visible |
| Add only consented organisation imagery and proof | CEO/marketing/clinical owner | Written permission and asset register |
| Publish a sustainable resource cadence | Clinical/editorial owner | Named reviewer, source log, and release calendar |
| Earn external authority | Leadership/partnerships | Real partner, conference, publication, or professional-directory links |

## Safety and claims boundary

The resources are educational and do not replace local protocols, clinical judgement, senior supervision, formal certification, or emergency referral pathways. No review stars, patient outcomes, facility case study, or named institutional endorsement is published without verified evidence and consent.
