# Codex ↔ Manus Collaboration Protocol

This document defines a single, repeatable workflow so Codex, Manus, and any human developer can collaborate without branch confusion or "missing commit" errors.

## 1) Single Source of Truth

- **GitHub is source of truth** for all code.
- Local-only branches are not considered shared state.
- Every change intended for collaboration must be pushed to GitHub.

## 2) Standard Branch Model

- `main`: release-ready branch used by Manus publish pipeline.
- `feature/<topic>`: development branches for Codex/humans.
- Optional: `hotfix/<topic>` for urgent fixes.

Do not use ambiguous local names (for example `work`) unless pushed and documented.

## 3) Required Handoff Packet (every time)

When handing work from Codex to Manus (or vice versa), always provide:

1. **Exact repo**: `owner/repo`
2. **Exact branch**: e.g. `feature/resus-age-weight`
3. **Commit SHA**: full hash (40 chars preferred)
4. **Changed files list**
5. **Acceptance checks** run

Use this template:

```text
Repo: karuejob-max/paeds_resus_app
Branch: <branch-name>
Commit: <full-sha>
Changed files:
- path/a
- path/b
Checks run:
- <command> -> <result>
```

## 4) Push Discipline (prevents "I can't see your branch")

Before requesting sync or review:

```bash
git status
git push -u origin <branch>
git fetch origin --prune
git branch -r
```

If your branch is not visible under `origin/<branch>`, it is not shared yet.

## 5) Manus Sync Checklist

If Manus cannot find commits:

1. Confirm branch exists on GitHub (web UI).
2. Confirm Manus project is connected to correct `owner/repo`.
3. Confirm Manus is tracking correct branch (`main` or explicitly selected feature branch).
4. Re-sync in Manus after push.
5. If still stale, provide Manus the handoff packet from section 3.

## 6) Merge Strategy

- Prefer small PRs with clear titles.
- Merge feature branches into `main` only after checks pass.
- Avoid force-push on shared branches unless absolutely required and announced.

## 7) New Developer Onboarding (minimum)

Every new contributor should run:

```bash
git remote -v
git branch -a
git log --oneline -n 10
```

They should know:

- which branch Manus deploys,
- where to post handoff packets,
- how to verify their branch is on GitHub before asking others to pull.

## 8) Communication Rules

- Never reference only a short/informal commit name like "the canary commit".
- Always include branch + SHA + file list.
- If a commit was rebased/replaced, explicitly say "superseded by <new-sha>".

## 9) Fast Troubleshooting Commands

```bash
# show exact current position
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD

# show what changed in current commit
git show --name-only --pretty=format: HEAD

# compare branch with main
git diff --name-status origin/main...HEAD
```

## 10) Definition of Done for Cross-Tool Work

A task is not done until:

- code is committed,
- branch is pushed to GitHub,
- handoff packet is shared,
- receiving side confirms it can fetch the branch and see commit SHA.
