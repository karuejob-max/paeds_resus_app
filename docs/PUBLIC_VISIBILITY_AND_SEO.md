# Public visibility & SEO — operator guide

**Audience:** Job Karue (CEO), marketing, engineering  
**Canonical PSOT:** [PLATFORM_SOURCE_OF_TRUTH.md §23](./PLATFORM_SOURCE_OF_TRUTH.md#23-public-visibility--discovery)  
**Last updated:** 2026-05-29

---

## Purpose

Ensure providers, trainees, parents, and institutions **find Paeds Resus** when searching for paediatric emergency training, bedside tools, and family resources in Kenya and the East African Community.

---

## What shipped (engineering)

| Asset | Location |
|-------|----------|
| Public compound home | `/` — `client/src/pages/PublicHome.tsx` |
| Training SEO landings | `/training`, `/training/bls`, `/training/acls`, `/training/pals`, `/training/nrp` |
| Stakeholder pages | `/for-providers`, `/for-institutions`, `/for-parents` |
| Public AHA overview | `/aha-courses` (anonymous); provider hub when signed in |
| Sitemap | `client/public/sitemap.xml` |
| JSON-LD helpers | `client/src/lib/seo-schema.ts` |
| Meta tags | `usePageMeta` + `client/index.html` defaults |
| Payment conversion thank-you | `/payment/success` — `noindex`; Google Ads conversion URL (auth + paid enrollment required) |

---

## Google Ads conversion tracking

| Setting | Value |
|---------|--------|
| **Conversion URL** | `https://www.paedsresus.com/payment/success` |
| **When it fires (UX)** | After M-Pesa confirms payment; user lands on thank-you page (3s auto-redirect to course or **Start course** CTA) |
| **Validation** | Server `enrollment.getPaymentSuccessView` — enrollment must belong to signed-in user and `paymentStatus === completed` |
| **Bank transfer** | Do **not** use this URL until payment is confirmed (webhook/admin); stay on `/payment` |
| **Analytics** | `provider_conversion` / `payment_success_page_view` on validated mount; `payment_completed_redirect` on course redirect |

Paste the conversion URL in Google Ads → Goals → Conversions → Website → URL contains `/payment/success`.

---

## CEO ops checklist (manual)

### 1. Google Search Console

1. Verify property: `https://www.paedsresus.com` (www subdomain is canonical per PSOT §10).
2. Submit sitemap: `https://www.paedsresus.com/sitemap.xml`
3. Request indexing for high-intent URLs after each deploy:
   - `/`
   - `/training/pals`, `/training/acls`, `/training/bls`
   - `/for-providers`, `/for-institutions`
4. Monitor **Performance** → queries containing: `PALS Kenya`, `ACLS course`, `paediatric resuscitation`, `Paeds Resus`.
5. Fix **Coverage** issues (404s, redirect chains) within one sprint.

### 2. Google Business Profile

1. Claim or update **Paeds Resus Limited** / **Paeds Resus** listing (Nairobi / primary service area).
2. Category suggestions: *Emergency training*, *Health consultant*, *Educational institution* (pick best fit).
3. Website URL: `https://www.paedsresus.com`
4. **Paste-ready description (no URLs in body):** [GBP_PROFILE_COPY.md](./GBP_PROFILE_COPY.md)
5. Add photos: logo, training sessions (with consent), team in clinical education context.
6. Post monthly: ERS/ERT readiness, new cohort dates, institutional pilot process metrics (no unsupported outcome claims).

### 3. Content refresh cadence

| Frequency | Action |
|-----------|--------|
| **Quarterly** | Review training landing FAQ accuracy (pricing, durations, cohort availability) |
| **After pricing change** | Update `client/src/const/pricing.ts` + training landings auto-read prices |
| **After new public route** | Add to `sitemap.xml`, PSOT §23.1, `PUBLIC_SEO_ROUTES` in `seo-schema.ts` |
| **After counsel sign-off** | Update certification claims consistently across `/training/*` |

### 4. Keyword targets (priority)

| Priority | Keywords | Target page |
|----------|----------|-------------|
| P0 | PALS training Kenya, pediatric advanced life support Kenya | `/training/pals` |
| P0 | ACLS course Kenya, advanced cardiovascular life support | `/training/acls` |
| P0 | BLS certification Kenya, basic life support course | `/training/bls` |
| P1 | NRP neonatal resuscitation Kenya | `/training/nrp` |
| P1 | Paeds Resus, paediatric emergency platform Kenya | `/` |
| P2 | hospital emergency response system Kenya, paediatric readiness Nyeri | `/institutional`, `/for-institutions` |
| P2 | paediatric resuscitation app, ResusGPS | `/for-providers` |
| P2 | parent child safety emergency Kenya | `/for-parents` |

### 5. LLM / AI discovery

- Pages use **semantic HTML** (`<article>`, `<section>`, `<h1>`–`<h2>`, FAQ accordions).
- Visible text answers natural questions (e.g. “Where to do PALS in Kenya?”) — not image-only marketing.
- `Organization` and `Course` JSON-LD on key pages.

### 6. Brand discipline (PSOT §1)

- **Paeds Resus** = organisation / platform  
- **Paeds Resus Limited** = training legal entity on course pages  
- **ResusGPS** = bedside product only  
- **AHA-aligned** — not “AHA-certified” unless counsel approves exact wording  

---

## Engineering verification after changes

```bash
pnpm run check
pnpm run test:unit
pnpm run build
```

Spot-check in browser (logged out):

- `/` shows compound sections, not ResusGPS redirect
- `/training/pals` has unique title, H1, FAQ
- View source / DevTools → JSON-LD script present
- `/start` redirects to `/`

---

## EAC expansion (future)

When launching country-specific pages:

1. Add route + sitemap entry  
2. Note in PSOT §23.5  
3. Consider `hreflang` if duplicate English content exists per country  
4. CEO: local GBP or regional listings only with verified address / service area  

---

*Questions: paedsresus254@gmail.com · Engineering: `docs/WORK_STATUS.md`*
