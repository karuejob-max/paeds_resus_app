# Manus agent rules

**Read first:** [AGENT_AUTONOMY.md](./AGENT_AUTONOMY.md) (Definition of Done, Kolb cycle, forbidden Done).  
**Then:** [AGENTS.md](../AGENTS.md), [WORK_STATUS.md](./WORK_STATUS.md), [CRITICAL_FIX_PLAYBOOK.md](./CRITICAL_FIX_PLAYBOOK.md).

---

## Sandbox is not production

Manus often runs in an **isolated sandbox** with no push access to GitHub. That environment is **not** `origin/main` and **not** what learners see.

| Sandbox state | Allowed status | Forbidden status |
|---------------|----------------|------------------|
| Files edited, not pushed | **Handoff** | Done |
| Branch pushed, PR open, CI pending | **Handoff** | Done |
| PR merged to `main`, verify recorded | **Done** | — |
| CEO-only blocker (staging, counsel, MOU) | **Blocked** | Done |

---

## No “Done” without GitHub merge

Manus **must not** close a task as **Done** unless:

1. Changes are on **`origin/main`** (merge commit hash known), **or**
2. WORK_STATUS **Blocked** documents a CEO-only action (see AGENT_AUTONOMY §6).

If Manus cannot push or merge:

- **Status = Handoff** (not Done).
- Push branch if the environment allows; otherwise list every changed file for Job to push.
- Open PR with `gh pr create` when GitHub access exists; otherwise include ready-to-paste PR title/body.

---

## Required Handoff message template

Copy this block into the Manus response **and** WORK_STATUS **In progress** or handoff note:

```markdown
## Handoff — [short title]

**Status:** Handoff (not Done) | Done (merge: `<hash>`) | Blocked (CEO: …)

**PR:** https://github.com/<org>/<repo>/pull/<n> (or "not opened — need push access")

**Branch:** `<branch-name>` @ `<commit-short>`

**On main after merge:** [bullets: files/features now on main]

**Blocked on main:** [anything not merged or CEO-only]

**Verify commands run:**
- `pnpm run check` — pass/fail
- `pnpm run test:unit` — pass/fail
- `pnpm run build` — pass/fail
- [targeted: e.g. `pnpm run quiz:verify-answer --questionText "…"`]

**Kolb reflection (required for non-trivial fixes):**
1. **Concrete experience:** What user/learner saw (prod URL, wrong answer text, etc.)
2. **Reflective observation:** Root cause (e.g. DB row vs seed file, index vs value encoding)
3. **Abstract conceptualization:** Playbook section — CRITICAL_FIX / CONTENT_HOTFIX / category
4. **Active experimentation:** What was patched (runtime first), PR link, post-merge verify plan

**Files changed:**
- `path/to/file` — one-line summary
```

Path for humans: **`docs/MANUS_AGENT_RULES.md`** (this file).

---

## Manus MUST

1. Read AGENT_AUTONOMY.md before starting.
2. Update WORK_STATUS.md (Done / In progress / Blocked / Critique).
3. Push branch and open PR when GitHub access exists.
4. Include Kolb reflection in every non-trivial handoff.
5. Run verification commands and paste results in handoff or PR body.

## Manus MUST NOT

1. Mark **Done** with sandbox-only changes.
2. Claim “deployed” or “fixed” without merge commit on `main`.
3. Skip WORK_STATUS update because “Job will sync later.”
4. Patch seed files only without checking DB runtime source for learner-facing quiz bugs.

---

## Same standard as Cursor and Codex

Cursor and Codex follow the same Definition of Done ([AI_TEAM_WORKFLOW.md](./AI_TEAM_WORKFLOW.md)). Manus is not exempt because the sandbox feels complete.

When Manus completes a slice Job can push: list exact files and commit message so Job can finish the loop without re-discovery.
