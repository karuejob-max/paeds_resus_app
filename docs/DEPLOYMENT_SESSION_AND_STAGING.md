# Deployment: sessions and staging (PSOT §10–§11)

## Session max age (`SESSION_MAX_AGE_MS`)

**PSOT:** [PLATFORM_SOURCE_OF_TRUTH.md §11](../docs/PLATFORM_SOURCE_OF_TRUTH.md) — default cookie lifetime can be long for backward compatibility; production may set **`SESSION_MAX_AGE_MS`** (milliseconds) for a shorter bound.

**Recommendation:** For production, set an explicit value (e.g. `1800000` for 30 minutes) once leadership agrees; record the chosen value in deployment notes or [WORK_STATUS.md](./WORK_STATUS.md).

```bash
# Example — 30 minute sessions
SESSION_MAX_AGE_MS=1800000
```

See `.env.example` for the variable name.

---

## Staging vs production

**PSOT §10:** Until a second environment exists, production is the only deployed stack. When staging is added:

- **`develop`** branch → **staging** service (its **own** `DATABASE_URL`).
- **`main`** branch → **production**.

Operational checklist: [STAGING_BRANCH_SETUP.md](./STAGING_BRANCH_SETUP.md).
