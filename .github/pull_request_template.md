## Summary

<!-- What changed and why (1–3 sentences). -->

## Risk / area

- [ ] Auth / sessions / passwords
- [ ] Payments / M-Pesa / webhooks
- [ ] Database migrations
- [ ] Admin-only or PII-adjacent flows
- [ ] None of the above (routine UI/copy)

## Verification

- [ ] `pnpm run ci:gate` (or `pnpm run check` + `pnpm run test:unit` + `pnpm run build`)
- [ ] Tested on **staging** (when staging exists — see `docs/STAGING_BRANCH_SETUP.md`)

## PSOT / analytics

- [ ] Product-facing analytics use standard **`events.trackEvent`** → **`analyticsEvents`** (`docs/PLATFORM_SOURCE_OF_TRUTH.md` §8)
