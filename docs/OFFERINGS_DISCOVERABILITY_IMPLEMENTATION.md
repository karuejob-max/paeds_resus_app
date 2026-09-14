# Offerings discoverability implementation

## Scope

This release extends the earlier BLS work across the public catalogue, with **ACLS as the next priority**. It improves the public individual-provider entry points without changing authenticated learning, payment, eligibility, clinical guidance, or institutional entitlement logic.

## ACLS changes

The canonical `/training/acls` page now uses the search-facing title **ACLS Training in Kenya — AHA-Aligned Certification** and explicitly covers ACLS training in Kenya, ACLS training in Nairobi, AHA ACLS Kenya, advanced cardiovascular life support, and cardiac-arrest training. Visible content now explains the online cognitive pathway, the separate practical megacode assessment, the distinction between ACLS and PALS, the institutional cohort pathway, and the need to confirm the practical-session date and location during booking.

The page now displays the approved ACLS pricing of **KES 20,000 per person** and **KES 17,500 per person for cohorts of 7 or more**. It emits visible-content-matched `Course`, `FAQPage`, and `BreadcrumbList` structured data, and provides a direct WhatsApp route for asking about the next practical ACLS session. It also links to the BLS foundation pathway, which reflects the actual progression relationship without creating a duplicate ACLS/BLS page.

A new public authority resource, `/resources/acls-course-cost-kenya`, gives prospective learners a neutral checklist for comparing ACLS scope, blended delivery, practical megacode assessment, price, certificate evidence, and renewal requirements. The resource is included in the canonical public SEO route list and production prerender list.

## Other individual pathways

The public NERP page now has explicit Kenya-focused metadata, a `Course` structured-data entity with the six-payment programme offer, and a canonical breadcrumb hierarchy. The public IERP page now has explicit Kenya-focused metadata, a `Course` structured-data entity with the KES 15,000 programme offer, and a canonical breadcrumb hierarchy. Existing provider and institutional pages already contain the product-family metadata, FAQ structured data, approved pricing, and canonical ILSP/IERS/ICPD positioning, so they were not rewritten unnecessarily.

## Technical delivery

The production prerender list now includes the ACLS authority resource as well as the individual ACLS, BLS, PALS, and NRP landing pages. The generated HTML was checked for route titles, H1 content, Kenya intent, pricing, FAQ or breadcrumb structured data where applicable, and the consent boundary. No `Consolata Hospital Mathari` reference was introduced.

## Human-owned actions

Code cannot create a truthful Google Business Profile, confirm a permanent ACLS practical venue, publish real session dates, collect genuine learner reviews, or establish external authority links. The owner must represent the operating model accurately, especially if sessions rotate or occur at client facilities. After deployment, Search Console should be monitored separately for BLS, ACLS, PALS, NRP, NERP, IERP, and the ACLS resource; Google Business Profile performance should be monitored separately from organic search.

## Guardrails

No venue, review, facility endorsement, patient outcome, unsupported AHA claim, or consent-restricted organisation reference was invented. No authenticated learner, institutional, payment, entitlement, or clinical data was accessed or changed.
