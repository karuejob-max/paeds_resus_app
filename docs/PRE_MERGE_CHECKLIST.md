# Pre-merge checklist

Before opening or merging a PR to **`main`** (or pushing to **`develop`**).

## Commands

```bash
pnpm run verify:ci
pnpm run ci:gate
```

After dependency changes: `pnpm install` and commit `pnpm-lock.yaml`.

## Branch flow

| Target | Flow |
|--------|------|
| Integration | feature → PR → **`develop`** → smoke staging |
| Production | PR **`develop` → `main`** (or hotfix → `main`) after green **`gate`** |

Direct push to **`main`** is blocked.

## Links

- [ENGINEERING_ACCEPTANCE_CHECKLIST.md](./ENGINEERING_ACCEPTANCE_CHECKLIST.md)
- [STAGING_DEPLOYMENT.md](./STAGING_DEPLOYMENT.md)
- [GITHUB_NOTIFICATIONS.md](./GITHUB_NOTIFICATIONS.md)
