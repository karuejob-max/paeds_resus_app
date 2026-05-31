# Agent Operations Playbook — shipping, production DB, and recovery

**Version:** 1.0 · **Last updated:** 2026-05-30  
**Audience:** Cursor, Manus, Codex, and any agent operating in this repository.  
**Purpose:** Practical runbooks for operational tactics that caused agents to stall in recent sessions — protected-branch shipping, production seeding, network failures, and honest status reporting.

**Read with (do not duplicate):**

| Doc | Role |
|-----|------|
| [AGENTS.md](../AGENTS.md) | Brand, products, Definition of Done summary |
| [AGENT_AUTONOMY.md](./AGENT_AUTONOMY.md) | Kolb cycle, forbidden Done, CEO stop list, effort vs distance |
| [AI_TEAM_WORKFLOW.md](./AI_TEAM_WORKFLOW.md) | Team sync, handoff template, WORK_STATUS discipline |
| [PRE_MERGE_CHECKLIST.md](./PRE_MERGE_CHECKLIST.md) | Local `ci:gate` before merge |
| [CRITICAL_FIX_PLAYBOOK.md](./CRITICAL_FIX_PLAYBOOK.md) | Learner-facing / production bug triage |

---

## Quick start — what agents missed

1. **`git push origin main` is rejected (GH006).** `main` is protected. Always: feature branch → PR → CI green → merge → record merge hash in WORK_STATUS.
2. **Local commit ≠ Done.** Definition of Done requires **`origin/main` merge commit** + WORK_STATUS + verify output ([AGENT_AUTONOMY.md](./AGENT_AUTONOMY.md) §2).
3. **Merge to `main` ≠ learners see new content.** Fellowship micro-course content lives in the **production DB** until seed scripts run ([§ Production database operations](#2-production-database-operations)).
4. **`db:test-connection` OK once does not guarantee a 30-minute seed.** Use **chunked batches** or **Render Shell** when ETIMEDOUT hits.
5. **CEO post-deploy review ≠ merge blocker** when engineering is mandated to ship; log **CEO sign-off: pending** in WORK_STATUS and handoff — do not block merge on interim clinical review ([CLINICAL_CONTENT_GOVERNANCE.md](./CLINICAL_CONTENT_GOVERNANCE.md)).

---

## 1. Shipping to `origin/main`

`main` has branch protection: direct push fails with **GH006** (*protected branch hook declined*). This is intentional.

### 1.1 Step-by-step (every agent)

```powershell
# From repo root — pull latest main first
git fetch origin
git checkout main
git pull origin main

# Create a focused feature branch
git checkout -b feat/your-short-description

# Implement, then verify locally before opening PR
pnpm run check
pnpm run test:unit
pnpm run ci:gate   # full pre-merge gate (see PRE_MERGE_CHECKLIST.md)

# Commit and push the branch (NOT main)
git add .
git commit -m "Short descriptive message"
git push -u origin HEAD
```

```powershell
# Open PR (PowerShell — use gh, not raw push to main)
gh pr create --base main --head feat/your-short-description --title "Your PR title" --body @"
## Summary
- What changed and why

## Test plan
- [ ] pnpm run check
- [ ] pnpm run test:unit
- [ ] pnpm run ci:gate (or subset if doc-only)

## Verify output
(paste key command results)
"@

# Wait for CI — list checks
gh pr checks

# Merge when green (squash or merge per repo default)
gh pr merge --merge --delete-branch

# Record the merge commit hash
git fetch origin
git log origin/main -1 --format="%H %s"
```

### 1.2 After merge (mandatory)

1. Update **[WORK_STATUS.md](./WORK_STATUS.md)** **Done** row: date, who, summary, **PR #**, **merge commit hash**, verify commands.
2. If canonical docs changed, update **PSOT §21** registry when adding new strategic docs.
3. If DB migrations or seed **code** changed, see [§2 Production database operations](#2-production-database-operations) — merge alone does not apply seed data.

### 1.3 Why agents got stuck on push

| Symptom | Root cause | Fix |
|---------|------------|-----|
| `GH006: protected branch hook declined` | Pushed to `main` directly | Feature branch + `gh pr create` + merge |
| "I committed and pushed" but WORK_STATUS says Done | Pushed to feature branch only, never merged | `gh pr merge` then record merge hash |
| `.cursor/rules/commit-and-push-after-changes.mdc` says "git push" | Rule predates protected `main`; push **branch**, not `main` | Follow this playbook §1.1 |
| CI red, agent stops | Gate failed | Fix, push to same branch, re-run checks |
| "Deployed" / Render green | Code on Render tracks `main`; unmerged branch ≠ production truth | Merge first |

### 1.4 Handoff when merge is blocked

If you cannot push or merge: status = **Handoff**, not Done. Template: [AI_TEAM_WORKFLOW.md](./AI_TEAM_WORKFLOW.md) · [MANUS_AGENT_RULES.md](./MANUS_AGENT_RULES.md).

---

## 2. Production database operations

**Rule:** Code merged to `main` deploys to Render; **learner-facing fellowship module HTML and quiz rows** come from **`scripts/seed-fellowship-content.ts`** (and related seeds), not from the deploy alone.

### 2.1 Connectivity first

```powershell
pnpm run db:test-connection
```

Uses `scripts/test-db-connection.mjs` → **IPv4 DNS lookup + Aiven SSL** (same pattern as `scripts/db-connection-config.mjs` and `server/db.ts` `getConnectionConfig`).

| Result | Next step |
|--------|-----------|
| OK | Proceed with seed or migration script |
| ETIMEDOUT | [§3 Network failures](#3-when-local-or-agent-network-fails) — Render Shell or Aiven IP allowlist |
| Auth error | Check `DATABASE_URL` in `.env` (local) or Render env (Shell) — never commit secrets |

**Windows / agent env:** Prefer scripts that import `scripts/db-connection-config.mjs`. Raw `drizzle-kit migrate` may ignore SSL in URL and timeout against Aiven.

### 2.2 Fellowship content seed (chunked — preferred)

Full catalog in one run can **ETIMEDOUT** on long connections. Use batches:

```bash
pnpm run seed:fellowship-content:p0          # dka, SE, asthma (6 courses)
pnpm run seed:fellowship-content:respiratory
pnpm run seed:fellowship-content:shock
pnpm run seed:fellowship-content:infectious
pnpm run seed:fellowship-content:trauma
pnpm run seed:fellowship-content:metabolic
```

**Single course:**

```bash
pnpm exec tsx --import dotenv/config scripts/seed-fellowship-content.ts --only=status-epilepticus-i
```

**P0-only shortcut:** `pnpm run seed:fellowship-content:p0` (same as `--batch=p0`).

**Slug note:** Status epilepticus uses `status-epilepticus-i` / `status-epilepticus-ii` — not `se-i`.

Expect `Processing: …` per course and `Seeding complete!` at end. Idempotent — safe to re-run.

### 2.3 Verify seed (do not claim success without this)

```bash
pnpm exec tsx --import dotenv/config scripts/verify-fellowship-seed.ts
```

Spot-checks catalog rows, modules, disclaimer footer, mmol/L on DKA, diagnostic + summative quiz titles on slugs: `dka-i`, `status-epilepticus-i`, `septic-shock-ii`, `pneumonia-i`.

Record verify output in WORK_STATUS when marking seed work Done.

### 2.4 Where to run seed

| Environment | When to use |
|-------------|-------------|
| **Render Shell** (preferred) | Local/agent ETIMEDOUT; `DATABASE_URL` already set; same region as API |
| **CEO local machine** | Production `DATABASE_URL` in `.env` only — never commit |
| **Agent / CI** | Only when connectivity proven; use **chunked** batches |

**Aiven allowlist:** If desktop IP is not allowlisted, Shell avoids timeout without opening firewall to arbitrary agent IPs.

**Not in CI today:** Production DB writes require explicit ops approval — no silent auto-seed on deploy ([MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md](./MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md)).

**Post-deploy fellowship checklist (safe — idempotent):** After MECE/content merges on `main`, run all six `seed:fellowship-content:*` batches **plus** `pnpm run seed:seriously-ill-child-course`, then `pnpm exec tsx --import dotenv/config scripts/verify-fellowship-seed.ts` (target **29 courses, 0 failure(s)**). Do **not** wire auto-seed into Render deploy hooks until CEO approves — partial seed on a cold DB is worse than a documented manual runbook.

### 2.5 Migrations (pattern)

For numbered migrations, prefer idempotent apply scripts:

```powershell
pnpm run db:apply-0044    # example — see package.json for current scripts
pnpm run db:verify-0044
```

Log applied migration + verify result in WORK_STATUS per PSOT §22.2.

---

## 3. When local or agent network fails

### 3.1 Retry strategy

1. **`pnpm run db:test-connection`** — if fail, do not start long seed.
2. **Chunk** — smaller `--batch=` or `--only=` (see §2.2).
3. **Render Shell** — run same `pnpm run seed:…` commands with production env.
4. **Aiven console** — allowlist operator IP if Shell unavailable (CEO/ops).
5. **Re-verify** — `verify-fellowship-seed.ts` or targeted `db:verify-*` after each successful chunk.

### 3.2 Do not claim success

| Forbidden | Required instead |
|-----------|------------------|
| "Seed should work" | Log which batches completed + verify output |
| "Deployed, content live" | Confirm seed + spot-check on production URL |
| WORK_STATUS Done for partial seed | Done only when mandated scope seeded **and** verified, or Handoff with exact remaining batches |
| Hide ETIMEDOUT after one batch | List completed vs failed batches honestly |

### 3.3 IPv4 + SSL (already in codebase)

- `server/db.ts` — `dns.lookup` family 4, `connectTimeout`, Aiven `servername` in SSL
- `scripts/db-connection-config.mjs` — shared by apply/verify/E2E scripts
- Env override: `DB_CONNECT_TIMEOUT_MS` (default 60000)

If `db:test-connection` succeeds but long job times out, **chunking** or **Shell** is the fix — not disabling SSL.

---

## 4. Multitask / long-running work

Large clinical E2E programs (micro-courses, ResusGPS alignment, exam policy) must not ship as one unreviewable PR or one unverifiable "done" message.

### 4.1 Phased PR series

| Phase | Typical PR scope | Verify |
|-------|------------------|--------|
| Policy / shared types | Exam policy, gates, contracts | `check`, `test:unit` |
| Content authoring | `server/data/micro-courses-*.ts`, CST | `test:clinical` |
| Seed pipeline | `--batch`, verify script, npm scripts | Seed batch + `verify-fellowship-seed.ts` on prod |
| Handoff / WORK_STATUS | CEO checklist, known backlog | N/A |

Each PR: own branch, CI green, merge, WORK_STATUS row with merge hash.

### 4.2 Honest status tables

Use execution-plan tables ([TEAMWORK_TASK_FORMAT.md](./TEAMWORK_TASK_FORMAT.md)) with columns: **Task | Status | Evidence | Blocker**.

Example statuses: `Merged`, `Seed pending`, `CEO review pending`, `ETIMEDOUT — use Shell`, `Not started`.

**Do not** reassure the user that work is "complete" when only code is on `main` and prod DB is stale — say exactly which batches remain.

### 4.3 CEO sign-off vs ship

| Item | Blocks merge? | Blocks "engineering Done"? |
|------|---------------|----------------------------|
| CI `gate` failed | Yes | Yes |
| Clinical content CEO review pending | No (when ship mandated) | No — log pending in WORK_STATUS + handoff |
| `fellowTitleEnabled` / pilot flags | Yes (CEO-only flip) | Blocked in AGENT_AUTONOMY §6 |
| Production seed not run | No for code merge | Yes for "learners see content" Done |

Post-deploy CEO click-test: [MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md](./MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md).

---

## 5. Clinical content program

Engineering ships **infrastructure + authored content + seed pipeline**; clinical authority and conflict presentation rules live elsewhere.

| Topic | Canonical doc |
|-------|----------------|
| What we teach, conflict templates, Pass 1/2 scope | [CLINICAL_CONTENT_GOVERNANCE.md](./CLINICAL_CONTENT_GOVERNANCE.md) |
| Per-condition spines (DKA, SE, asthma, shock…) | [CLINICAL_SOURCE_OF_TRUTH.md](./CLINICAL_SOURCE_OF_TRUTH.md) |
| CEO click-test after deploy | [MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md](./MICROCOURSE_CLINICAL_REVIEW_HANDOFF.md) |
| Quiz / DB hotfix path | [CONTENT_HOTFIX_PLAYBOOK.md](./CONTENT_HOTFIX_PLAYBOOK.md) |
| Bedside engine change control | [CLINICAL_SAFETY_REGISTER.md](./CLINICAL_SAFETY_REGISTER.md) |

**Agent rule:** Clinical copy changes still need **CEO approval before merge** (AGENTS.md §9) unless explicitly waived for a mandated engineering slice — even then, document **CEO sign-off: pending live review**.

---

## 6. Common errors — quick reference

| Error / symptom | Likely cause | Recovery |
|-----------------|--------------|----------|
| **ETIMEDOUT** (mysql2, seed, migrate) | IPv6 route, long run, IP not allowlisted, SSL not applied | `db:test-connection`; chunk seed; Render Shell; `db-connection-config.mjs` scripts |
| **GH006** protected branch | Direct push to `main` | Feature branch → `gh pr create` → merge |
| **CI / `gate` failed** | Typecheck, unit, clinical, build | Read failed job log; fix on branch; push; re-run |
| **Seed incomplete** | Full seed timeout mid-catalog | Run remaining `--batch=` commands; verify script |
| **Learners see old modules** | Code merged but prod seed not run | Chunked seed on prod DB + verify |
| **`Database client not initialized`** | Sync `db` proxy before pool ready | Use `getDb()` in async scripts (see `server/db.ts`) |
| **`Course not found` on enroll** | Catalog row missing in DB | Run appropriate seed; check `microCourses` |
| **Agent "stuck" / user asked to merge** | Stopped at local commit or open PR | Complete §1.1 merge loop + WORK_STATUS |
| **drizzle-kit migrate ETIMEDOUT** | URL SSL ignored by drizzle-kit | Use `pnpm run db:apply-*` / manual SQL with SSL config |

---

## 7. Related deployment docs

- [DEPLOYMENT.md](../DEPLOYMENT.md) — platform deployment overview (env vars, architecture)
- [RENDER_PREDEPLOY_LOCKED.md](./RENDER_PREDEPLOY_LOCKED.md) — locked Render config; Shell for apply scripts
- [STAGING_GO_LIVE_CHECKLIST.md](./STAGING_GO_LIVE_CHECKLIST.md) — staging provision (CEO-only)
- [E2E_TEST_SETUP.md](./E2E_TEST_SETUP.md) — E2E DB connectivity (IPv4 + SSL pattern)

---

*This playbook captures session learnings (2026-05-27 — 2026-05-30): fellowship seed ETIMEDOUT, protected `main`, incomplete Definition of Done, deploy vs DB content, and Render Shell preference. Update when new operational failure modes appear; log significant additions in WORK_STATUS Critique / review.*
