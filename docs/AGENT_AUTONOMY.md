# Agent autonomy v2 — ship work without re-briefing every session

**Version:** 2.0 | **Last updated:** 2026-05-28  
**Audience:** **Cursor, Manus, Codex**, and any automated agent or developer in this repository.  
**Canonical companions:** [AGENTS.md](../AGENTS.md), [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) (PSOT), [CRITICAL_FIX_PLAYBOOK.md](./CRITICAL_FIX_PLAYBOOK.md).

> **Work = Distance × Effort.** High effort with zero distance (local-only, sandbox-only, unmerged branch) is **not** done.

---

## 1. Read first (every session)

Before writing code or running destructive commands:

1. **[AGENTS.md](../AGENTS.md)** — brand, products, fellowship rules, non-negotiable data rules.
2. **[WORK_STATUS.md](./WORK_STATUS.md)** — Done, In progress, Blocked, Critique / review.
3. **PSOT** — [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md), especially §19–22 and §21 document registry.
4. **[CRITICAL_FIX_PLAYBOOK.md](./CRITICAL_FIX_PLAYBOOK.md)** — when fixing any learner-facing or production bug.

If AGENTS.md and PSOT conflict, **PSOT wins**; then update AGENTS.md to match.

**Manus-specific:** also read [MANUS_AGENT_RULES.md](./MANUS_AGENT_RULES.md) before closing any task.

---

## 2. Definition of Done (Distance)

Work is **NOT done** until **all** of the following are true (unless Blocked with CEO-only action documented):

| Gate | Requirement |
|------|-------------|
| **On `origin/main`** | Changes merged to `main` with merge commit hash recorded — **not** local-only, not sandbox-only, not “PR opened but not merged” |
| **WORK_STATUS** | Dated **Done** entry with PR URL + merge commit hash + who (Cursor / Manus / Codex) |
| **Verification recorded** | Output of `pnpm run check`, `pnpm run test:unit`, or a targeted verify script (e.g. `pnpm run quiz:verify-answer`, `pnpm run db:verify-0044`) pasted or summarized in WORK_STATUS or PR body |
| **DB-backed fixes** | Verify script run **or** row-level proof (question id, `evaluatorMatch: true`, migration applied) |

**Sandbox is not production.** Manus (and any isolated environment) must not mark **Done** when artifacts exist only in that environment.

---

## 3. Forbidden “Done”

These statuses **must not** appear as **Done** in WORK_STATUS or handoff messages:

| Forbidden claim | Why |
|-----------------|-----|
| “Fixed locally” / “committed in sandbox” | Not on `origin/main` — zero distance |
| “I wrote a plan” / “analysis complete” | Effort without merged artifact |
| Branch exists but never merged | Protected-branch gate means learners still see old behavior |
| WORK_STATUS **Done** without PR link + merge commit | Unverifiable; breaks team sync |
| “Deployed” without merge to `main` | Deploy from unmerged branch ≠ platform truth |
| DB hotfix run but code/seed not merged | Next seed or deploy can regress |

**Allowed instead of Done:**

- **Handoff** — branch pushed, PR opened, verification commands listed, Kolb reflection included ([MANUS_AGENT_RULES.md](./MANUS_AGENT_RULES.md)).
- **Blocked** — CEO-only item from §6 with explicit ask in WORK_STATUS **Blocked / needs decision**.

---

## 4. Autonomous shipping loop

```
implement → check / test:unit / build → branch → PR → CI green → merge main → WORK_STATUS
```

| Step | Command / action |
|------|------------------|
| Typecheck | `pnpm run check` |
| Unit tests | `pnpm run test:unit` |
| Clinical (Resus/clinical) | `pnpm run test:clinical` when touching clinical code |
| Pre-merge gate | `pnpm run ci:gate` before merging to `main` |
| Build | `pnpm run build` |
| Branch | Feature branch off `main`; never force-push `main` |
| PR | `gh pr create` with summary + test plan + verify output |
| Merge | Merge when GitHub **CI** workflow is green |
| Log | Dated entry in [WORK_STATUS.md](./WORK_STATUS.md) with PR + merge commit |

**Git rules (non-negotiable):**

- Never `git push --force` to `main` / `master`.
- Never change `git config`.
- Use **`gh`** for PRs, checks, and issues.

**DB / migrations (Windows → Aiven):**

- Use SSL + IPv4 via [scripts/db-connection-config.mjs](../scripts/db-connection-config.mjs).
- Idempotent `scripts/*.mjs` with `dotenv/config` and `DATABASE_URL`.
- Log applied migrations in WORK_STATUS per PSOT §22.2.

**Team workflow:** [AI_TEAM_WORKFLOW.md](./AI_TEAM_WORKFLOW.md) — handoff template, Manus/Codex/Cursor parity.

---

## 5. Kolb cycle — every non-trivial fix

Use [David Kolb's Experiential Learning Cycle](https://learning-theories.com/experiential-learning-kolb.html) so the same class of bug does not repeat:

| Phase | Agent action | Where to record |
|-------|--------------|-----------------|
| **1. Concrete experience** | Reproduce what the user/learner sees — prod URL, API response, DB row, admin report | WORK_STATUS **Done** or PR description |
| **2. Reflective observation** | Root cause: source-of-truth (DB vs seed vs env), schema shape, deploy path, branch not merged | WORK_STATUS **Critique / review** or playbook note |
| **3. Abstract conceptualization** | Which guardrail applies — [CRITICAL_FIX_PLAYBOOK.md](./CRITICAL_FIX_PLAYBOOK.md) category, [quiz-answer-contract](../shared/quiz-answer-contract.ts), CEO stop list | PR / playbook cross-link |
| **4. Active experimentation** | Patch **runtime first** if learner-facing → then code/seed → test → merge `main` → re-verify | Merge commit + verify command output |

---

## 6. CEO-only stop list

Do **not** proceed without explicit CEO (Job Karue) instruction:

| Area | Why |
|------|-----|
| **Staging provision** | Render/Aiven staging URLs, go-live — [STAGING_GO_LIVE_CHECKLIST.md](./STAGING_GO_LIVE_CHECKLIST.md) |
| **Legal counsel sign-off** | Terms, privacy, MOU language — [LEGAL_COMPLIANCE_BASELINE.md](./LEGAL_COMPLIANCE_BASELINE.md), [legal/LEGAL_IMPLEMENTATION_INDEX.md](./legal/LEGAL_IMPLEMENTATION_INDEX.md) |
| **Institutional / pilot MOU** | Hospital pilot contracts — CEO signs |
| **`fellowTitleEnabled`** | Fellowship §11 launch gate — `shared/fellowship-launch-gate.ts` stays `false` until CEO enables |
| **Production pilot flags** | Clinical outcomes pilot, production-only feature toggles — [CLINICAL_OUTCOMES_PILOT.md](./CLINICAL_OUTCOMES_PILOT.md) |

Engineering may implement gates, docs, and code paths; **flipping these to “live” is CEO-only.** Document as **Blocked** in WORK_STATUS, not Done.

---

## 7. Effort vs Distance

| Scenario | Effort | Distance | Verdict |
|----------|--------|----------|---------|
| Manus edits 12 files in sandbox, marks Done, nothing pushed | High | **Zero** | **Not done** — Handoff or push + PR |
| Agent writes 3-page plan, no PR | Medium | **Zero** | **Not done** |
| Local commit, user asked to merge, agent stops | Low | **Zero** | **Not done** |
| DB hotfix script run on prod, seed file not merged | Medium | **Partial** | **Not done** until `main` has seed + script |
| Small one-line copy fix, PR merged, `check` green | Low | **High** | **Done** |
| Idempotent verify script + test + merge | Medium | **High** | **Done** |

**Optimize for distance first**, then depth. Prefer merged, verified slices over long unmerged branches.

---

## 8. Critical fixes — triage

Any production or learner-facing bug (content, infra, legal copy, payments, SEO, clinical pathways):

1. Follow **[CRITICAL_FIX_PLAYBOOK.md](./CRITICAL_FIX_PLAYBOOK.md)** — verify runtime source → hotfix path → long-term code → verify on `main`.
2. Quiz/content appendix: [CONTENT_HOTFIX_PLAYBOOK.md](./CONTENT_HOTFIX_PLAYBOOK.md) (§ Appendix in CRITICAL_FIX).
3. Quiz answer contract: [shared/quiz-answer-contract.ts](../shared/quiz-answer-contract.ts) — **value-based** option text, not index.

Clinical content changes still need **CEO approval** before merge (AGENTS.md §9).

---

## 9. Large work — multitask / delegation

For audits, multi-file features, or platform-wide fixes:

- Split into reviewable PRs.
- Use parallel subtasks for exploration vs implementation.
- Track initiatives in [TEAMWORK_TASK_FORMAT.md](./TEAMWORK_TASK_FORMAT.md).
- Each sub-PR must still satisfy **Definition of Done (Distance)**.

---

## 10. Acceptance

Before marking done: [ENGINEERING_ACCEPTANCE_CHECKLIST.md](./ENGINEERING_ACCEPTANCE_CHECKLIST.md).
