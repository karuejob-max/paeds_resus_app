# GitHub notification settings (operators)

Reduce CI noise while keeping failures visible.

## Recommended settings

1. Open [GitHub → Settings → Notifications](https://github.com/settings/notifications).
2. Under **Actions**, choose **only notify for failed workflows** (wording may vary).
3. Disable email on every successful workflow run if enabled.
4. Keep security alerts and @mentions enabled.

## Branch protection (already configured)

| Branch | Policy |
|--------|--------|
| `main` | PR required (0 approvals), **`gate`** CI required, strict, no force-push |
| `develop` | Direct push OK; ruleset **`develop-ci-gate`** requires green **`gate`** |

Re-apply if reset:

```bash
gh api -X PUT repos/karuejob-max/paeds_resus_app/branches/main/protection --input scripts/github-branch-protection-main.json
gh api repos/karuejob-max/paeds_resus_app/rulesets -X POST --input scripts/github-ruleset-develop.json
```
