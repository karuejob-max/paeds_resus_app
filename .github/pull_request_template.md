## Summary

<!-- What changed and why (1–3 sentences). -->

## Risk / area

- [ ] Auth / sessions / passwords
- [ ] Payments / M-Pesa / webhooks
- [ ] Database migrations
- [ ] Admin-only or PII-adjacent flows
- [ ] None of the above (routine UI/copy)

## Verification

- [ ] `pnpm run ci:gate` — see `docs/PRE_MERGE_CHECKLIST.md`
- [ ] If `package.json` dependencies changed: `pnpm install` and commit `pnpm-lock.yaml`
- [ ] Tested on **staging** for risky changes (auth, payments, migrations) — `docs/RENDER_STAGING_SETUP.md`
- [ ] No `.env` or secrets in the diff

## PSOT / analytics

- [ ] Product-facing analytics use standard **`events.trackEvent`** → **`analyticsEvents`** (`docs/PLATFORM_SOURCE_OF_TRUTH.md` §8)
