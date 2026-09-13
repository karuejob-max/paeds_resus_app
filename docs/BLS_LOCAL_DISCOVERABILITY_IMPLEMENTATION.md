# BLS local discoverability implementation

## Purpose

This release improves the canonical BLS training page for Kenya-focused organic search, local-intent conversion, and AI-readable retrieval without inventing a permanent venue, reviews, AHA claims, institutional endorsements, or unconsented facility information.

## Implemented

The canonical `/training/bls` page now uses the approved search-facing title **BLS Training in Kenya — AHA-Aligned Certification**, with explicit BLS training, Kenya, Nairobi, AHA BLS, and basic-life-support terminology. The visible page now explains the Kenya/Nairobi practical-session pathway, the distinction between online cognitive completion and full practical certification, approved pricing of KES 10,000 per person and KES 7,500 per person for cohorts of 7 or more, institutional cohort options, and a direct WhatsApp request path for confirming the next practical session.

The page now emits visible-content-matched `FAQPage` and `BreadcrumbList` JSON-LD in addition to its existing Organization and Course data. The training hub and public homepage now provide descriptive internal links to the canonical BLS page, including the anchor **BLS training in Kenya**. The existing BLS cost resource remains linked from the page.

The production prerender allowlist now includes `/training/bls`, `/training/acls`, `/training/pals`, and `/training/nrp`. Before this change, the build prerendered `/training` but not the individual AHA course landing routes, which weakened the HTML-first delivery path for crawlers and AI retrieval. The generated `dist/public/training/bls/index.html` now contains the route title, H1, Kenya/Nairobi content, FAQPage data, BreadcrumbList data, and no `Consolata Hospital Mathari` reference.

## Human-owned actions still required

Code cannot verify a Google Business Profile, create a legitimate service-area profile, collect real reviews, confirm a permanent practical venue, or publish actual session dates. The organisation owner must complete those actions using accurate operating facts. If training uses rotating venues or client facilities, the profile and copy must represent that model honestly; no false Nairobi address should be added.

After deployment, the verified Search Console owner should inspect impressions and queries for `/training/bls`, `BLS training Kenya`, `BLS course Nairobi`, `AHA BLS Kenya`, and pricing queries. Google Business Profile performance should be monitored separately from organic Search Console performance.

## Guardrails

The page continues to describe the offering as AHA-aligned and preserves the existing certification disclaimer. It does not claim an unverified permanent venue, guaranteed local availability, fabricated reviews, patient outcomes, or facility endorsement. The consent boundary excluding Consolata Hospital Mathari remains enforced.
