# AGENTS.md — Mandatory Pre-Read for Everyone Working in This Repository

> **Read this entire file before taking any action in this repository.**
> This applies to **anyone or anything** touching this codebase — AI agents (Manus, Cursor, Codex, Claude, etc.), contractors, and Job himself. It is not an AI-only file; it's the pre-read, full stop.
> This file is the distillation of the Platform's Source of Truth (PSOT) for whoever is about to write code or make a decision here.
> The canonical PSOT lives at `docs/PLATFORM_SOURCE_OF_TRUTH.md`. If this file and the PSOT ever conflict, **the PSOT wins**. Update this file to match.

**Last updated:** August 22, 2026 | **Owner:** Job Karue (CEO, Paeds Resus)

---

**CRITICAL INSTRUCTION FOR EVERYONE — AI AGENTS (Manus, Cursor, Codex, Claude, etc.) AND HUMANS ALIKE**

If you are about to take any action in this repository — writing code, reviewing a PR, applying a migration, or making a design call — you **MUST** read this file and follow its instructions first. Don't skip it because you assume it's "just for the AI tools."

### Read this first for shipping and production DB

**[docs/AGENT_OPERATIONS_PLAYBOOK.md](docs/AGENT_OPERATIONS_PLAYBOOK.md)** — step-by-step runbooks: protected-branch PR/merge (`gh`), production fellowship seed (chunked batches, verify script, Render Shell), ETIMEDOUT recovery, honest multitask status. Cross-links [AGENT_AUTONOMY.md](docs/AGENT_AUTONOMY.md); does not replace it.



### Production deploy & database migrations (Manus + all agents)

Schema and content ship on **different tracks**. Merging code to `origin/main` does **not** apply SQL to production.

1. **Ship code:** feature branch **created from a freshly-fetched `main`** → `gh pr create` → CI green → merge to `main` (never push directly to `main`).
   - **Before starting ANY new task, run `git checkout main && git fetch origin main && git merge origin/main --ff-only` first — every time, even if a branch is already checked out locally.** Never add commits for a new/different task onto whatever branch happens to be checked out, and never build a new feature branch off another feature branch. This is not optional housekeeping: PR #407 (2026-08-06) was opened for CI infra work alone, then two different sessions each found *some* branch already checked out and kept building on it instead of starting fresh from `main` — by the time it was caught, one CI-only PR had picked up an entire unrelated AHA course-type feature and a separate "Code Signal" system with its own migration, all tangled into one branch with several merge commits. Untangling it after the fact was judged too risky (real chance of silently dropping or duplicating something); the CI work had to be rebuilt from scratch on `main` as PR #409, and the other feature work re-shipped separately as PR #410. `scripts/verify-branch-base.mjs` (run automatically by `pre-merge-check.ps1`, and safe to run standalone any time) checks this for you and warns loudly if a branch didn't fork from a recent `main` — but it's a backstop, not a replacement for starting from `main` in the first place.
2. **Apply migrations on production DB** when the PR adds or changes `drizzle/schema.ts` or numbered `drizzle/00NN_*.sql`:
   - From a trusted environment with production `DATABASE_URL` (Render Shell preferred if desktop ETIMEDOUT): `pnpm run db:test-connection` then `pnpm run db:apply-00NN` for each new script (e.g. **`pnpm run db:apply-0050`** for `fellowshipSimulations` + `userProgress.fellowshipSimulationId`).
   - Apply scripts are **idempotent**; "already exists" is success.
3. **Seed content:** `pnpm run seed:fellowship-content:all` (or rely on production `pnpm start` auto-seed after deploy).
4. **Verify:** `pnpm exec tsx --import dotenv/config scripts/verify-fellowship-seed.ts` (or targeted verify). Paste summarized output into **WORK_STATUS** as **Production Verify Output**.
5. **Manus:** Sandbox success is **not** Done. Hand off with migration + seed commands above; confirm production verify before claiming learner-facing completion.

### Definition of Done — Distance = merged on `origin/main`

**Work = Distance × Effort.** High effort without merged artifacts on `main` is **NOT done**.

Work is **NOT done** until:

- Changes are on **`origin/main`** (merge commit hash), **or** CEO-only blocker documented in WORK_STATUS **Blocked**
- **Production Seeding Confirmed:** For any new course or content, the production database **MUST** be seeded and verified (e.g., via `verify-fellowship-seed.ts` or a targeted check script).
- **[WORK_STATUS.md](docs/WORK_STATUS.md)** updated with PR link + merge commit + **Production Verify Output**.
- Verification recorded: `pnpm run check`, `test:unit`, `build`, or a targeted verify script.

**Forbidden Done:** local-only, sandbox-only (especially **Manus**), plan-only, branch never merged, WORK_STATUS claim without PR, **code merged but production schema not migrated**, **code merged but production DB not seeded/verified**.

### Autonomous shipping (read every session)

| Agent | Start here |
|-------|------------|
| **All agents** | **[docs/AGENT_OPERATIONS_PLAYBOOK.md](docs/AGENT_OPERATIONS_PLAYBOOK.md)** — shipping to `main`, prod DB seed, common errors |
| **All agents** | **[docs/AGENT_AUTONOMY.md](docs/AGENT_AUTONOMY.md)** — Kolb cycle, shipping loop, CEO stop list, effort vs distance |
| **Manus** | **[docs/MANUS_AGENT_RULES.md](docs/MANUS_AGENT_RULES.md)** — Handoff template; sandbox ≠ production |
| **Codex / Cursor** | Same Definition of Done; **[docs/AI_TEAM_WORKFLOW.md](docs/AI_TEAM_WORKFLOW.md)** |
| **Any critical fix** | **[docs/CRITICAL_FIX_PLAYBOOK.md](docs/CRITICAL_FIX_PLAYBOOK.md)** — content, env, legal, payments, SEO, clinical |

Loop: read AGENTS + WORK_STATUS + PSOT → implement → check / test:unit / build → PR → merge when CI passes → update WORK_STATUS. Quiz/content appendix: [CONTENT_HOTFIX_PLAYBOOK.md](docs/CONTENT_HOTFIX_PLAYBOOK.md).

### Active engineering priorities

**Before starting new work not already assigned to you, check `docs/WORK_STATUS.md` → "Active Gap Remediation Queue"** — a prioritized, dated list derived from a full gap analysis against the five constitutional documents (North Star, Observation Architecture, FPKB Schema, Event Models, Financial Strategy). It tracks what's shipped and what's next in priority order. Don't re-derive priorities from scratch or duplicate work already queued there.

### IERS staging and smoke-test safety (2026-08-22)

- **Real-router authorization matrix:** use `IERS_STAGING_ENABLE=1 IERS_STAGING_DATABASE_URL=<disposable-local-url> DATABASE_URL=<disposable-local-url> pnpm run test:iers-provider-auth:staging` with a disposable local MySQL/MariaDB database. The explicit flag prevents normal CI or stale `.env` values from starting the staging suite. The test seeds two tenants, calls the real `appRouter.createCaller` procedures, covers cross-tenant/non-assignee/decline/ended-duty/membership-revocation/role-revocation/readiness cases, and tears down its rows. Never point this command at production.
- **Shared testing identity:** use `paedsresus254@gmail.com` for the named provider in future labelled IERS tests. This is a testing identity only; it is not evidence of a real emergency response, clinical competency, or dispatch guarantee.
- **Institution setup order:** during onboarding, the institutional admin confirms the canonical facility department list; the IERS Lead then assigns every confirmed operational department to a response pole. Administration can later add or reactivate a canonical local department with an explicit reason; future CPD registration and linked provider profiles receive that department before users reach `Other`. The Administration traceability card lists the captured name, email, phone, cadre, event, recorded department, and canonical-link status for exact `Other` or unresolved custom CPD submissions. Literal `Other` submissions are reviewed per attendee and may resolve to different canonical departments; they must never be merged merely because several users selected `Other`. Unresolved custom labels remain a separate grouped pattern queue. Linked provider preset or institution-created departments resolve to canonical IDs. Accepted ERCo coordinators can open Shift staffing for their own department, assign an ERCo where governance permits, choose an optional monthly UTL source, add a manual nurse candidate for account linking, and fill dated shifts explicitly; no workflow may silently select the first provider. ERCo is a standing governance champion appointed by the department in charge, not a day-to-day emergency responder; the optional second person is an Assistant ERCo for continuity. An ERCo participates in an ERT shift only when separately nominated and accepted as that shift’s UTL or ERTL. Each provider must still accept the dated duty. Weekly ERTL selection uses the same canonical department and refreshes generated shift flags when the department changes. The setup panel remains available for later updates, renames, additions, deactivation, pole remapping, and monthly regeneration.
- **Smoke-test cleanup:** `pnpm run cleanup:iers-smoke-test -- --institution-name "<exact name>"` is a dry-run by default and can resolve one unique institution by exact name; add `--institution-id <id>` when known for a second safety check. It only targets departments whose names begin with `SMOKE TEST - ` and related ERCo/ERTL/UTL/readiness-evidence rows. Applying requires both `--apply` and `--confirm DELETE_SMOKE_TEST_RECORDS`; do not apply against production without explicit CEO confirmation. The command never deletes the institution, users, memberships, product roles, subscriptions, entitlements, CPD data, or non-prefixed departments.
- **Department source of truth:** IERS `facility_departments` is the institution-scoped canonical department registry. CPD registrations and institutional staff rows retain historical department text but store `facilityDepartmentId` when they match a configured IERS department; unmatched legacy text must not be guessed or silently remapped. The preferred label source is the existing shared preset catalog in `shared/clinical-departments.ts`, already used by profile and CPD selectors. IERS must use that catalog first; `Other` is the explicit exception for a genuinely missing facility department. Within each pole, the first eligible department added receives sequence 1, then sequence 2, and weekly ERTL selection cycles automatically through that persisted order; changing pole membership refreshes future unaccepted ERTL/shift flags without rewriting accepted history.
- **People & roles duty visibility:** Administration → People & roles exposes IERS product roles such as IERS Lead, response operator, reviewer, governance, and viewer, and separately shows the standing ERCo/Assistant ERCo governance appointments plus dated ERTL/UTL assignment, acceptance, decline, and readiness state. The Institution Workspace uses URL-addressable sticky CPD/IERS/People & profile subtabs so mobile users can reach sessions, analytics, exports, workforce, ERCo governance, reconciliation, and shift staffing without scrolling through every card. Account administrators remove institutional members through a reason-required, non-destructive action that ends this institution’s membership and active product permissions, revokes future duty participation, preserves historical records, blocks self-removal, enforces minimum administrator coverage, and writes an append-only removal event. A product role, roster row, or governance responsibility never proves provider acceptance, competency, or emergency dispatch.
- **Scalable ERT poles:** migration `0117` adds an explicit pole display order. Step 2 supports any number of institution-defined poles, so facilities may use North/South, North/South/East/West, or another locally meaningful sequence. Administrators can reorder poles for navigation and management; each pole independently receives eligible departments. Pole ordering must not be used to infer staff coverage or change accepted historical duties. The real-router staging matrix must cover multi-pole reorder and member removal on a disposable tenant, never against production.

### Lessons learned (for agents)

High-signal mistakes from recent sessions — **full runbooks:** [docs/AGENT_OPERATIONS_PLAYBOOK.md](docs/AGENT_OPERATIONS_PLAYBOOK.md).

- **Protected `main`:** Feature branch → `gh pr create` → CI green → merge. **Never** `git push origin main` (GH006).
- **Local commit ≠ Done:** Record **`origin/main` merge hash** + **WORK_STATUS** + verify output (`check`, `test:unit`, or targeted script).
- **Code on `main` ≠ learner content until deploy:** On deploy, **`pnpm run seed:fellowship-content:all`** runs automatically (`pnpm start` → `deploy:seed-fellowship` → `scripts/run-fellowship-auto-seed.mjs`; CEO approved). Verify target **29** courses, 0 failures. Staging: `AUTO_SEED_FELLOWSHIP_ON_START=false`. Manual one-shot: same script with `--force`; chunked batches for ETIMEDOUT recovery.
- **Summative exam integrity:** Player must use **`getSummativeExamQuestions`** (shuffled); **`recordQuizAttempt`** server-grades summative — never trust client score; strip `correctAnswer` from summative in **`getModuleContent`**.
- **ETIMEDOUT on seed/migrate:** Chunk with `--batch=` / `--only=`; use **`scripts/db-connection-config.mjs`** / IPv4 **`server/db.ts`**; fallback **Render Shell** with production `DATABASE_URL`.
- **Scripts DB access (PALS seed lesson, PR #155):** Never **`mysql.createConnection(DATABASE_URL)`** in scripts — use **`await getDb()`** from **`server/db.ts`** (IPv4 resolve, Aiven SSL `servername`, pool, `connectTimeout`, retries). **PALS:** `pnpm run seed:pals`; **fellowship:** `seed:fellowship-content:*`. Run **`pnpm run db:test-connection`** before blaming credentials; desktop ETIMEDOUT → Render Shell ([playbook](./docs/AGENT_OPERATIONS_PLAYBOOK.md) §2–3).
- **Clinical harm audit before "complete":** **mmol/L** for glucose; **never KCl IV push**; **DKA — no insulin bolus**; **neonates — no benzos first-line** for seizures; spot-check seeded HTML, not just TypeScript.
- **Honest gap docs:** Use [FELLOWSHIP_WHAT_IS_MISSING.md](docs/FELLOWSHIP_WHAT_IS_MISSING.md) for CEO — do not reassure that prod DB matches code without seed + verify evidence.
- **CEO post-deploy sign-off:** Log **CEO sign-off: pending** in WORK_STATUS; **does not block merge** when engineering is mandated to ship ([CLINICAL_CONTENT_GOVERNANCE.md](docs/CLINICAL_CONTENT_GOVERNANCE.md)).
- **Don't flag a doc ambiguity from one section alone (gap-analysis item #15, 2026-07-15):** A prior session flagged "CANDIDATE's review window is never stated" against Observation Architecture §7.3 — true of that section's prose, but §6.6's Pattern Record field table stated it plainly a few hundred lines away ("6 months for Signal and Candidate"). The guess made in the meantime (12 months, by analogy) was wrong and shipped as a real bug in `fpkb-pattern-detector.ts`'s downgrade pass before being caught. **Before writing "ambiguous" or "not specified" into WORK_STATUS or a code comment, grep the whole constitutional doc for the field/term in question** — field-definition tables, schemas, and glossaries often answer questions that a single narrative section leaves open. If it's still unstated after that check, it's a real ambiguity — flag it and stop; don't guess by analogy and ship the guess as if it were settled.
- **UI copy claiming a privacy guarantee is a claim about the code, not decoration — verify it against the actual insert/query, not the label (gap-analysis item #10, 2026-07-15):** Care Signal's "Submit anonymously" checkbox said "No identity stored," but the insert code stored the real `userId` for every provider submission regardless of that checkbox — `isAnonymous` only hid identity from facility-facing views (PSOT §20.3 rule 4), it never controlled whether the platform itself retained identity. This was deliberate (a code comment cited §20.3 explicitly) but contradicted both the UI's own copy and Observation Architecture §5.5's stricter Layer 1 (no identity, no credit) / Layer 2 (token-based pseudonymity, no real `userId` ever stored) split. Fixed by adding a genuine `fellowshipTokens` table + `submissionMode` column so Layer 2 credit is possible without the platform storing who submitted. **The general rule: when a feature makes a privacy or security claim in its UI copy ("anonymous," "encrypted," "not shared," "no identity stored"), trace that claim to the exact line of code that would make it true or false before trusting either the copy or an assumption of what "should" be true — labels drift from implementation silently, and nobody notices until an agent actually reads the insert statement.**
- **A NOT NULL column on an existing table is a strong signal to build new tables, not retrofit (gap-analysis item #11 Phase A, 2026-07-16):** Safe-Truth v1 requires genuinely no user account (Event Models §2.2). The legacy `parentSafeTruthSubmissions` table has `userId: int("userId").notNull()` — structurally incompatible, not just unused-in-practice. Rather than make it nullable and hope nothing downstream assumes it's always populated (admin dashboards, analytics, exports all likely do), built three new tables (`safeTruthSubmissions`, `safeTruthFacilityVisits`, `safeTruthDisclaimerAcks`) and left the old table/router/UI/route completely untouched. **The general rule: when a redesign's core requirement (no auth, no PII, different cardinality, etc.) conflicts with an existing table's NOT NULL constraint or structural shape, that's usually a sign to build fresh rather than loosen the old constraint — loosening it silently changes the contract for every other reader of that table, which is a much bigger and less visible blast radius than a new, clearly-named table living alongside it.**
- **"Global from day 1" is a platform-wide requirement, not a per-feature one — check every product's data model when it's invoked (2026-07-16):** The CEO's instruction to capture country → admin_level_1 → admin_level_2 (locality) geography applied to a Safe-Truth design conversation but explicitly covered Care Signal too. Checking found the unified `facilities` table already had `adminLevel2`/`subCounty` — it just wasn't wired through Care Signal's facility-search response, payload builder, or `careSignalEvents` schema, and wasn't in Safe-Truth's field list at all. **When a CEO instruction is framed as a general principle ("global from day 1," "every submission gets X") rather than a fix to the specific thing being discussed, treat it as license — and obligation — to check other products' data models for the same gap, not just the one on the table.**
- **`vitest.unit.config.ts`'s fast gate didn't cover `client/src/pages/**` at all (found building Safe-Truth v1 Phase B, 2026-07-16):** Every prior component test in this repo lived under `client/src/components/`; the include list and `environmentMatchGlobs` (which controls jsdom vs. node) were scoped accordingly. The first page-level component test (`SafeTruthV1.test.tsx`) silently matched zero files until both were extended to include `client/src/pages/**`. **If a new test file "passes" by reporting zero collected tests, that's not a pass — check the config's include/exclude and environment globs before trusting a clean run.**
- **Re-verify a gap you flagged yourself before fixing it — the earlier note might be imprecise, not just stale (2026-07-17):** Gap-analysis #11's original geo work flagged "`setMyFacility`'s return shape doesn't carry `adminLevel2`" as a known follow-up. Re-checking before fixing it: `setMyFacility` returns the result of `getFacilityById`, which already carried `adminLevel2` correctly the whole time — the original flag was simply wrong (or the underlying code had already been fixed by the same PR without updating the comment). The real, narrower gap was elsewhere (`providerProfiles`'s cached prefill row had no locality column at all). **A flag written in a hurry, even one you wrote yourself an hour ago, is a hypothesis to re-check against current code — not a fact to build on top of.** Building the wrong fix on top of an inaccurate flag would have been wasted work at best and a false sense of completeness at worst.
- **"That number doesn't appear anywhere in the doc" needs checking against every relevant document, not the one you happened to have open (gap-analysis #12, 2026-07-17):** Item #14/#15 "corrected" a prior memory of 18/24/12/6-month downgrade thresholds, calling them a misremembering, because they don't appear in Observation Architecture §7.3. They do appear — in `FPKB_SCHEMA_V1.md` §7.2, a different constitutional document entirely, one this file's own header comment had correctly cited back in gap-analysis #9. **A "this doesn't exist in the spec" claim is only as good as how many of the five constitutional documents were actually searched** — checking one document thoroughly is not the same as checking whether a number appears "anywhere in the doc[s]." This is the cross-document version of the #15 lesson above (which was about sections within one document); the same discipline applies at the multi-document level, and is more expensive to get wrong, since it can lead to un-correcting something that was already right.
- **A conflict-free merge is not proof your change survived (account-types PR1, 2026-07-19):** Two parallel PRs (this account-types work, and the Subsidised Cohort Program's Phase 3 overflow valve) both independently added a migration numbered `0069` and both edited `drizzle/schema.ts`. The number collision was caught and fixed (renumbered to `0070`) — but a second, quieter failure slipped through underneath it: a later merge of the cohort-program PRs into `main` silently reverted the account-types PR's `schema.ts` enum edit and dropped its `WORK_STATUS.md` log entry, with **no conflict markers and no failed CI** — git's merge resolved the overlapping edits to the same file as one continuous hunk favoring the wrong side. It was only caught because a human noticed the live production database and the checked-in schema had drifted apart; nothing in the pipeline would have surfaced it otherwise. **A green CI run proves the merged result compiles and type-checks — it does not prove your specific edit is still in the file.** See the new "Shared-file collision protocol" section below for the concrete fix.
- **The verification step itself can produce a false alarm if the search string isn't character-exact (2026-07-19, PR #315's own post-merge check):** Step 2's `Select-String "item #15 - actually closed"` came back empty on a genuinely intact merge — the actual `WORK_STATUS.md` text used an em dash (`—`), the PowerShell command used a plain hyphen (`-`). For a moment this looked exactly like the account-types drift above. **Before concluding a merge dropped something, re-run the check with a shorter, ASCII-only substring that can't have a typographic-character mismatch** (a distinctive word or two, not a whole phrase with punctuation) — and if a longer phrase is needed, copy it verbatim from the actual file rather than retyping it from memory. A false "it's gone" is cheap to create and expensive to chase if taken at face value.
- **An em dash doesn't just break a `Select-String` match — it can break a `.ps1` file's parsing entirely (2026-07-20, `scripts/pre-merge-check.ps1`):** A script full of em dashes (used freely elsewhere in this repo's `.md` and `.ts` files) failed on the CEO's actual Windows machine with `Missing closing '}' in statement block`, at a spot where the braces were genuinely balanced — Windows PowerShell 5.1 can misread a UTF-8 `.ps1` file via the system ANSI codepage, corrupting a multi-byte character like an em dash into stray bytes that break string/token boundaries somewhere downstream of where the parser actually reports the error. This couldn't be reproduced or caught in advance — no PowerShell is available in the sandbox this session runs in, so the file was verified only via a hand-written brace tracer and file-content reasoning, both of which missed it. **Any `.ps1` file in this repo needs to be plain ASCII — no em dashes, smart quotes, or other typographic characters — even though that convention is fine, and used constantly, in this repo's `.md` and `.ts` files.** A useful pre-ship check going forward: `python3 -c "open('file.ps1', encoding='ascii').read()"` (or equivalent) raises immediately on any non-ASCII byte.
- **A zip built for the CEO to apply is a snapshot, not a live diff — it goes stale the moment `main` moves after you build it, even if your branch's own git history is fine (fellowship-recovery PR #321, 2026-07-20):** A session built a zip containing `drizzle/schema.ts` and `package.json` from a local checkout captured before PR #320 (the `bsn_intern` → `noi` rename) had merged. The CEO applied it with `Expand-Archive -Force` on a branch whose commit history genuinely *did* have PR #320 as an ancestor — but `-Force` overwrites each file's on-disk content wholesale with whatever the zip snapshot contains, regardless of what the branch's own git log says. Result: `designationEnum` silently reverted `noi` back to `bsn_intern`, and the `db:apply-0072` line vanished from `package.json` — both with no merge conflict, because extracting a zip never diffs against the file's current state, it just replaces it. CI caught this one only because the regression happened to break a type check (`institution.ts` disagreeing with the reverted enum); a change that touched data or logic but not types could have shipped silently, the same way the account-types drift above did. **The general rule: for any of the four high-collision files, a zip is not "build once, ship whenever" — re-fetch `origin/main` and diff the zip's copy of that file against the fresh version immediately before creating the zip, not just before starting the session's edits. If the file moved on `main` in that gap, rebuild the zip's copy from the fresh version with your edit reapplied; don't ship the stale snapshot and rely on the branch's ancestry to save it.**

### Shared-file collision protocol (multi-agent repo — read before touching schema.ts, WORK_STATUS.md, package.json, or AGENTS.md)

This repo has multiple agents (Manus, Codex, Cursor, Claude, etc.) working in parallel, often on unrelated features that both happen to touch the same file. Four files see the most collisions because nearly every PR touches at least one: **`drizzle/schema.ts`**, **`docs/WORK_STATUS.md`**, **`package.json`** (migration script entries), and **`AGENTS.md`** itself. The 2026-07-19 incident above is the concrete example of what goes wrong and why the existing "fetch before editing" convention isn't sufficient on its own — the fetch was current when the PR was built, but another PR landed on the same file in the gap before merge, and the merge silently dropped one side's edit without a conflict.

**Do all of this, not just the first step:**

**Two scripts now automate most of this:** `scripts/reserve-migration-number.ps1` (run FIRST, before writing a migration — see step 0 below) and `scripts/pre-merge-check.ps1` (run before merging any PR — automates steps 1, 1a, and 4 in one command): re-fetches `origin/main`, reports drift on each of the four high-collision files, reports whether the branch is behind and can auto-merge (`-AutoMerge`), cross-checks every `scripts/apply-00NN-*.mjs` file against `package.json` in both directions — including a direct duplicate-number check — and lists any active migration reservation branches. Neither replaces step 1b or step 2 below — those need a change-specific substring only you know.

1. **Fetch `origin/main` immediately before you start** (existing convention) — but also **fetch again immediately before you merge**, not just before you begin. Run `git log HEAD..origin/main --oneline -- <file>` for each of the four high-collision files your PR touches. If anything landed on that file since your branch's base, treat the upcoming merge as untrusted until step 2 confirms it.
1a. **If your branch is behind `main` (GitHub will say "out-of-date with the base branch"), update it before merging the PR, not after:** `git fetch origin main && git merge origin/main`, resolve anything that conflicts, `git push`, then merge the PR. Merging an out-of-date branch and letting GitHub's own merge commit reconcile it is the same untrusted-until-verified situation as any other collision on these four files — a clean auto-merge there is not proof either side survived intact, same as step 2 below. Bring the branch current yourself, on your own machine, where you can actually see what changed, rather than trusting GitHub's merge UI to get it right silently.
1b. **When packaging a zip for the CEO to apply (not pushing directly from a sandbox with `origin` access), re-fetch `origin/main` and diff the zip's copy of each of the four high-collision files against it immediately before creating the zip — not just before you started editing.** A zip is a snapshot; `Expand-Archive -Force` overwrites a file's on-disk content wholesale with whatever's in the snapshot, regardless of what the target branch's own git history says. If `main` moved on one of these files after your session started but before you package, the snapshot is stale even though the branch's ancestry looks fine — rebuild the zip's copy of that file from the fresh `origin/main` version with your edit reapplied, don't ship the old one. See the 2026-07-20 lesson above for the concrete incident this caused.
2. **After your PR merges, re-fetch and verify your specific change is actually there** — a green CI run and a conflict-free merge only prove the merged result compiles; they do not prove your specific edit survived. Grep the merged file on `origin/main` for the exact thing you added: `git show origin/main:<file> | grep -n "<what you added>"`. For a schema/enum change, this is not optional — do it every time, immediately after merge.
3. **For `WORK_STATUS.md` specifically:** insert new entries as the first entry after the `---` header (reverse-chronological), and re-check that position is still correct immediately before merging — if another PR's entry landed above where you expected, your insertion point has moved and a blind reapply can collide.
0. **Reserve your migration number FIRST, before writing a single line of the actual migration** — `.\scripts\reserve-migration-number.ps1 -Description "short reason"` (run from the repo root). Three real collisions happened in a row (0069, 0079, 0080) even though every session checked `origin/main` right before naming — the check alone can't close the race, since it only sees what's already merged, not what another session is mid-flight on. This script closes that gap by pushing a tiny, instant, review-free placeholder branch (`migration-reserved-00NN`) the moment a number is claimed — visible to anyone who fetches within seconds, not whenever the real PR eventually lands. It checks BOTH `origin/main`'s highest used number AND any existing reservation branches, so it accounts for other sessions' in-flight work too. Once your real PR (with the actual `apply-00NN-*.mjs` and its `package.json` entry) merges, delete the reservation branch — `git push origin --delete migration-reserved-00NN` — it's only needed while your work is still in flight. `scripts/pre-merge-check.ps1` now also lists any active reservation branches so leftover ones don't get forgotten indefinitely.
4. **For migration numbers specifically:** the reservation step above is now the primary defense — but still re-check the highest `apply-00NN` number right before naming (existing convention, belt-and-suspenders) — and additionally, after your migration PR merges, confirm on `origin/main` that your migration number wasn't claimed by a parallel PR in the same window (`ls scripts/apply-00NN-*` on the freshly-fetched `main`).
5. **Keep PRs touching these four files small and merge them fast.** The smaller the diff and the shorter it sits open before merging, the smaller the collision window.
6. **If you find a drift like this one** (checked-in file doesn't match what a merged PR should have produced): don't just silently re-apply and move on. Log the original incident and the fix as separate, dated `WORK_STATUS.md` entries — this file's own convention already asks for that, and the record is what let this one get caught and traced at all.

---

## 1. The Platform Source of Truth (PSOT)

The file `docs/PLATFORM_SOURCE_OF_TRUTH.md` is the canonical reference for the entire Paeds Resus platform. It defines who we are, what we build, our data models, and our global strategic vision.

**Before starting any work, you MUST:**
1. Read `docs/PLATFORM_SOURCE_OF_TRUTH.md` (specifically §19–22 for the holistic product ecosystem and all-agents mandate).
2. Identify which product(s) your task touches.
3. Read the canonical strategy docs linked in PSOT §21 for those specific products.

---

## 2. The Global Ambition

Paeds Resus is building toward recognition as the **global benchmark for paediatric resuscitation science in LMICs** — by WHO, Harvard, CDC, and Ministries of Health. Every technical decision you make must support this level of clinical rigour, data integrity, and institutional trust.

**Concrete mechanism for "global from day 1" (CEO instruction, 2026-07-16):** every submission across Care Signal and Safe-Truth captures country → admin_level_1 (county/state/province) → admin_level_2 (locality), for geographic pattern mapping. `shared/geo-taxonomy.ts` is the single source of truth for country ISO2 codes and per-country admin-level labels (labels vary — "County" in Kenya, "District" in Uganda). Only Kenya has a populated admin_level_1 options list today (single-country pilot); the shape is ready for more countries without a redesign. When adding a new product surface that captures location, wire it through this config rather than inventing another inline country/label map.

---

## 3. Mandatory PSOT Updates

If your work involves any of the following, you **MUST update `docs/PLATFORM_SOURCE_OF_TRUTH.md`** before completing your task:
- Adding a new product, feature, or integration point (update §19)
- Modifying the database schema or shared data spine (update §19.2)
- Changing KPI definitions or admin reports (update §8)
- Creating a new strategic document (add it to the registry in §21)

---

## 4. Non-Negotiable Data Rules

- **Never** combine Care Signal (provider QI) KPIs with Safe-Truth (parent/guardian) KPIs.
- **Never** combine Fellowship pillar data across pillars in a single metric.
- **Never** add patient identifiers to any Care Signal schema.
- **Never** treat AHA courses (BLS/ACLS/PALS) as part of the Fellowship pathway.

---

## 5. Execution Updates

Do not put execution updates, sprint plans, or weekly progress in the PSOT. Use `docs/WORK_STATUS.md` for all execution logging.

---

## 6. Brand Architecture — The Most Common Agent Error

This is the single most frequent source of mistakes. Read it once. Apply it always.

| Term | Meaning | When to use it |
| :--- | :--- | :--- |
| **Paeds Resus** | The **organisation** and the **software platform** (one brand, multiple products). | All user-facing copy, logos, copyright, social media, institutional references. |
| **Paeds Resus Limited** | The **legal entity / AHA-Aligned Training Provider**. | Invoices, certificates, training sign-up forms, WhatsApp messages about BLS/ACLS/PALS training. |
| **ResusGPS** | **One product** on the platform: real-time paediatric emergency **clinical guidance** (ABCDE flows, protocols, CPR Clock, drug calculators). It is **not** the name of the company or the whole platform. | The `/resus` route and all bedside clinical decision support references only. |
| **Care Signal** | **One product**: provider-facing incident and near-miss reporting (QI culture). | The `/care-signal` route. |
| **Parent Safe-Truth** | **One product**: parent and guardian resources. Distinct audience and tone from ResusGPS. | The `/parent-safe-truth` route. |
| **Institutional / Hospital Admin** | The hospital-facing management surface (staff, schedules, metrics, ERT). | `/hospital-admin-dashboard` and all institutional portal references. |

### The Non-Negotiable Rule (verbatim from PSOT §1):

> **Do not treat "Paeds Resus" and "ResusGPS" as the same thing.** In code, docs, and UI: say **Paeds Resus** when you mean the organisation or the whole platform; say **ResusGPS** only when you mean that specific product.

### Correct vs. Incorrect Usage:

- ✅ "Sign up for training delivered by **Paeds Resus Limited**."
- ✅ "During a Code Blue, open **ResusGPS** on your phone for bedside guidance."
- ✅ "The **Paeds Resus** Institutional Portal manages your hospital's ERT."
- ✅ "**Paeds Resus** sponsors your BLS for free."
- ✅ "Earn the title of **Paeds Resus Fellow** by completing the **Paeds Resus Fellowship**."
- ❌ "Sign up for training on **ResusGPS**." ← ResusGPS is the bedside tool, not the training system.
- ❌ "The **ResusGPS** Institutional Portal..." ← The portal belongs to Paeds Resus, not ResusGPS.
- ❌ "**ResusGPS** will sponsor your BLS..." ← Paeds Resus Limited sponsors training.
- ❌ "ADF Fellow" or "ResusGPS Fellowship" ← Use **Paeds Resus Fellow/Fellowship**.
- ❌ Using "Paeds Resus" and "ResusGPS" interchangeably in any context.

---

## 7. Platform Products (All First-Class — None Are Add-Ons)

```
Paeds Resus (Organisation & Platform)
├── Paeds Resus Limited (Legal entity — AHA-Aligned Training Provider)
│   ├── BLS (6 hours)
│   ├── ACLS (16 hours)
│   ├── PALS (16 hours)
│   └── Instructor Course (train-the-trainer)
├── ResusGPS (Product — Bedside Clinical Decision Support)
│   ├── ABCDE Assessment Flow
│   ├── CPR Clock
│   ├── Weight-Based Drug Calculators
│   └── Emergency Protocols
├── Micro-Courses / ADF (Condition-focused learning modules)
├── Care Signal (Product — Provider Incident & Near-Miss Reporting)
│   ├── Provider QI reporting (post-event, near-miss)
│   ├── Fellowship Pillar C (24 qualifying months)
│   ├── Institutional review workflow
│   └── National Aggregate Signal (MOH/WHO surveillance dashboard)
├── Parent Safe-Truth (Product — Family Safety Information)
│   └── **Safe-Truth v1 redesign (gap-analysis #11) — all three phases
│       code-complete.** No-auth architecture + schema
│       (`safeTruthSubmissions`, `safeTruthFacilityVisits`,
│       `safeTruthDisclaimerAcks`, `safeTruthV1` router), the full
│       caregiver-facing form (`SafeTruthV1.tsx`, live at `/safe-truth` —
│       the old redirect-to-Care-Signal bug is fixed), and the facility
│       fuzzy-matcher + Care Signal event-code linkage job
│       (`server/lib/safe-truth-facility-matcher.ts`) are all shipped.
│       **Runs automatically** — scheduled daily at 04:50 server time in
│       `server/scheduler.ts` (execute mode, CEO decision 2026-07-17,
│       after initially shipping CLI-only). `pnpm run safe-truth:match-facilities`
│       still works manually too, for on-demand runs or dry-run inspection.
│       The OLD authenticated flow (`parent-safetruth.ts`,
│       `ParentSafeTruthForm.tsx`, route `/parent-safe-truth`) is left
│       running alongside the new one, not removed — both coexist.
└── Institutional Portal (Surface — Hospital Management & ERT)
    ├── Hospital Admin Dashboard
    ├── ERT (Emergency Response Team) management
    └── Facility-level Care Signal review
```

---

## 7.1 IERS Build and Production Recovery Playbook

This section records the end-to-end IERS implementation path and the production lessons learned on 2026-08-21. Read it before changing the Institutional Portal, IERS migrations, provider responsibility flows, or production verification scripts. The detailed operating model is in [`docs/institutional/IERS_BUILD_BLUEPRINT_V1.md`](docs/institutional/IERS_BUILD_BLUEPRINT_V1.md), and the operator sequence is in [`docs/institutional/IERS_OPERATING_GUIDE_V1.md`](docs/institutional/IERS_OPERATING_GUIDE_V1.md).

### What the IERS is supposed to be

IERS is not a static hospital scorecard. It is a shared provider–institution operating system:

> **Provider identifies or participates in the event → the institution coordinates → the system records a durable timeline → the team debriefs → evidence is reviewed → actions are owned and verified → readiness score and executive report update.**

Providers are first-class operators. Institutional administrators configure the facility, roles, departments, rosters, evidence requirements, and governance; providers trigger or respond to activations, sign off shifts, submit evidence, report gaps, participate in drills, and progress assigned actions. Leaders verify closure. Never build a provider-passive IERS workflow in which administrators are the only people who can create useful evidence.

### Implementation sequence that worked

| Stage | What was built or verified | Canonical artifacts |
|---|---|---|
| Phase 0 | Froze the baseline, safety states, role model, evidence rules, release gates, and the provider responsibility contract. | `IERS_BUILD_BLUEPRINT_V1.md` |
| Identity | Added provider–institution memberships, invitation/acceptance, explicit responsibility roles, lifecycle state, and existing-staff backfill. | Migration `0094`; `institutionMemberships`; provider responsibility card |
| Activation | Added provider-triggered activations, responder notification state, acknowledgement/escalation, response timestamps, append-only timeline, and downtime reconciliation. | Migration `0095`; `server/routers/iers.ts` |
| Shift readiness | Added provider-owned shift sign-off and operational notes. | Migration `0096`; provider shift-readiness card |
| Evidence and closure | Added criterion-level evidence, owned action items, leader verification, closure evidence, and evidence-derived scoring with critical-criteria gating. | Migration `0097`; `iers-criteria.ts` |
| Drills and learning | Added drills, participation, response timing, debriefs, and conversion of completed operations into reviewable evidence. | Migration `0098`; drill panel |
| Governance and reporting | Added 30/60/90-day milestones, Care Signal/Code Signal linkage, data-quality correction, and executive snapshots. | Migration `0099`; IERS operating guide |
| Institutional product control plane | Separated IERS and CPD Portal into independently subscribable products with shared Administration and a managed Connected Services transition area. | Migration `0100`; `INSTITUTIONAL_PORTAL_ARCHITECTURE_V1.md`; `institution-products.ts` |
| Provider duty operation | Made emergency responsibilities provider-owned and operationally truthful: exactly one standing ERCo per department, optional backup, dated named ERTL/UTL assignments, explicit accept/decline, append-only history, and readiness gating. | Migrations `0111`–`0112`; `IERS_PROVIDER_INTEGRATION_AND_INDIVIDUAL_PORTAL_ARCHITECTURE_V1.md`; provider duty portal cards; `iers-department-governance.ts` |

### Safe production rollout

Code and database are separate release tracks. A merged PR does not apply SQL to production. For a new environment, use this order from a trusted environment or the Render Web Shell:

1. Deploy the latest `main` and confirm the Shell instance contains the expected commit.
2. From `/opt/render/project/src`, confirm that `DATABASE_URL` is set without printing its value.
3. Run the guarded one-command runner:

   ```bash
   pnpm run db:apply-iers
   ```

4. The runner tests the connection, applies migrations `0094` through `0112` in order, stops on the first failure, and runs `db:verify-iers`. Do not continue manually if it stops. Migrations `0111` and `0112` add department ERCo governance and explicit provider acceptance for named ERTL/UTL duties.
5. When all migrations have already passed and only verification fails, **do not rerun the migrations**. Deploy the latest verifier fix and run only:

   ```bash
   pnpm run db:verify-iers
   ```

6. Complete a clearly labelled IERS drill with a linked provider only after the provider-operation release gates below pass. Never use a real clinical emergency as the first acceptance test.

### Provider duty-operation release gates

- There is exactly one current ERCo assignment row for each `(institutionId, departmentId)`, with an optional backup; replacing an ERCo updates the same current department record and appends history rather than creating a second current coordinator.
- ERCo, backup, named ERTL, and shift UTL assignments are dated and identity-bound. A membership role, generic roster row, administrator assignment, notification, or attendance record does not count as accepted emergency duty.
- The assigned provider must explicitly accept the duty. Decline requires a reason, ended duties cannot be accepted, reassignment resets acceptance and readiness evidence, and cross-tenant or non-assignee reads/responses must be denied.
- Shift-readiness sign-off is unavailable until the assigned provider has accepted the active dated shift duty. Legacy assigned rows are conservatively migrated to `pending_acceptance`, never silently treated as accepted.
- Production acceptance must verify both institution governance/history and provider response/readiness behavior before the labelled pilot drill is considered.

### Production failures already encountered and their fixes

| Failure | Actual cause | Correct response |
|---|---|---|
| `Unknown column 's.governanceRole'` in migration `0094` | Production had schema drift: `institutionalStaffMembers` lacked `governanceRole`. | Stop. Deploy the repaired `0094` migration, which inspects `information_schema`, uses `governanceRole` when present, maps legacy `institutionalRole` when available, and otherwise defaults to `general_staff`. Rerun the guarded runner because `0094` is idempotent. See PR [#467](https://github.com/karuejob-max/paeds_resus_app/pull/467). |
| Migrations `0094`–`0099` pass but verifier reports 10 missing objects | The verifier expected snake_case names while `0094`–`0095` created the repository's camelCase tables. | Do not rerun migrations. Deploy the corrected verifier and run only `pnpm run db:verify-iers`. See PR [#469](https://github.com/karuejob-max/paeds_resus_app/pull/469). |
| TLS `DEP0123` warning | Node emitted a deprecation warning while connecting to the Aiven endpoint; the connection still passed. | Treat it as a warning unless the command exits non-zero. Do not misdiagnose it as a migration failure. |
| Render Web Shell does not paste reliably | The production Shell input can require manual typing. | Keep `pnpm run db:apply-iers` as the single operator command; never require six manually typed migration commands. |
| **CPD labels and IERS poles were conflated** | A CPD attendee can use a valid department label that is not an IERS operational unit, such as Pharmacy. | Keep reconciliation and pole eligibility separate. Only a confirmed active `facility_departments` row with `requires_pole = true` and `pole_id IS NULL` is an IERS missing-pole alert. |

### Naming and schema-drift guardrails

The IERS migrations intentionally preserve the names already deployed. The first operational tables are camelCase: `institutionMemberships`, `iersActivationEvents`, `iersActivationResponders`, and `iersActivationTimeline`. The evidence, actions, drills, and milestone tables are snake_case: `iers_evidence_records`, `iers_action_items`, `iers_drills`, `iers_drill_participants`, and `iers_implementation_milestones`. Any verifier or migration repair must check the actual database contract rather than assume one naming convention.

When a production table may differ from the checked-in schema, inspect `information_schema` before constructing a query. Never reference an optional legacy column directly in an `INSERT ... SELECT`. Use an explicit compatibility expression and a safe default. Add a regression test for every discovered schema-drift path.

### 7.2 Institutional portal product architecture

The Institutional Portal is organized into two independently subscribable products plus shared controls:

- **IERS:** emergency readiness, practical competency, team response, drills, evidence, QI, and institutional learning.
- **CPD Portal:** staff professional-development records, CPD sessions, attendance, certificates, performance, and decision intelligence.
- **Administration:** people, roles, product access, billing, renewals, exports, and account recovery. It is shared and is not a product subscription.
- **Connected Services:** Safe Truth, Care Signal/Code Signal entrypoints, individual training, and other transitional capabilities that must remain visible and owned until product placement is decided.

The source of truth for this split is [`docs/institutional/INSTITUTIONAL_PORTAL_ARCHITECTURE_V1.md`](docs/institutional/INSTITUTIONAL_PORTAL_ARCHITECTURE_V1.md). Do not use frontend navigation as the security boundary: IERS and CPD operations must be gated server-side by institution relationship, product entitlement, capability, and renewal state. Expired subscriptions preserve history and necessary exports; active IERS events and safety timelines must not be interrupted by billing state.

### Department reconciliation and pole-eligibility runbook

- The shared preset catalog in `shared/clinical-departments.ts` remains the preferred source for CPD, provider profiles, onboarding, and local IERS departments. `Other` is for genuine missing-catalog exceptions only.
- Migration `0115` is reserved through the remote `migration-reserved-0115` branch before schema work. It adds `facility_departments.requires_pole` with a fail-closed `false` default, `institution_department_reconciliations` for current review state, and `institution_department_audit_events` for append-only decisions.
- Account administrators use the Administration reconciliation panel to review historic labels. Mapping requires an explicit target and reason. Optional backfill updates only nullable `cpdAttendees.facilityDepartmentId`; it must never overwrite `cpdAttendees.department` or other attendance fields. Defer, dismiss, and reopen are review states, not deletion.
- IERS Leads may view missing-pole alerts and allocate poles, but they cannot map CPD labels or backfill attendance. A missing-pole alert is valid only for a confirmed active department where `requires_pole=true` and `pole_id IS NULL`; never infer it from catalog membership, CPD attendance, cadre, or a custom label.
- Local real-router coverage is opt-in and fail-closed: set `IERS_STAGING_ENABLE=1`, use an `IERS_STAGING_DATABASE_URL` whose host is localhost and whose database name contains `staging`, set `DATABASE_URL` to that same disposable URL for the process, run `pnpm run test:iers-department-reconciliation:staging`, and destroy the database/user afterward. Do not run this with a production URL.

### Definition of true IERS completion

Do not call IERS production-ready merely because the build passes or the migrations exist. The following evidence is required:

- `pnpm run check`, the unit gate, and the production build pass.
- The 0115 department-reconciliation tests pass, including cross-tenant denial, account-admin mapping, IERS Lead boundary, raw CPD text preservation, and CPD-only department pole exclusion.
- `pnpm run db:verify-iers` reports zero missing tables and columns.
- At least one provider is linked to the institution with an explicit responsibility role.
- A labelled drill proves provider acknowledgement, response, arrival, institution monitoring, timeline persistence, and debrief.
- Criterion evidence is reviewable and an institution leader verifies at least one action closure.
- The executive snapshot reflects real activation, drill, evidence, and action data.
- Production logs and user-facing controls do not claim formal accreditation, real-time telecom escalation, or clinical outcome improvement that has not been verified.

### Information-safety rules for Render Shell recovery

Never paste or send `DATABASE_URL`, passwords, API keys, or `.env` contents. It is acceptable to share sanitized command names, exit codes, table names, and error messages. The connection test may show host, port, database, and password length; do not treat the length as a credential and do not share any actual secret. Record the sanitized result in [`docs/WORK_STATUS.md`](docs/WORK_STATUS.md).

### Source trail

The implementation and recovery history is recorded in [`docs/WORK_STATUS.md`](docs/WORK_STATUS.md). The canonical product architecture is in [`docs/PLATFORM_SOURCE_OF_TRUTH.md`](docs/PLATFORM_SOURCE_OF_TRUTH.md). The institutional portal contract is [`docs/institutional/INSTITUTIONAL_PORTAL_ARCHITECTURE_V1.md`](docs/institutional/INSTITUTIONAL_PORTAL_ARCHITECTURE_V1.md). The applicable schema scripts are `scripts/apply-0094-institution-memberships.mjs` through `scripts/apply-0115-department-reconciliation.mjs`; the guarded runner is `scripts/apply-iers-migrations.mjs`; and the final verifier is `scripts/verify-iers-readiness.mjs`.

---

## 8. The Paeds Resus Fellowship — One Fellowship, Three Pillars

**There is exactly one fellowship: the Paeds Resus Fellowship.**
A provider who completes all three pillars earns the title **Paeds Resus Fellow**.

| Pillar | Requirement | Source of Truth |
| :--- | :--- | :--- |
| **A — Micro-Courses** | Complete **every** active ADF micro-course in the MECE catalog. | `certificates` / `enrollments` DB rows per course. |
| **B — ResusGPS** | ≥3 attributable cases **per taught condition** (server-side, anti-gaming). | `analyticsEvents` |
| **C — Care Signal** | 24 consecutive qualifying months of monthly reporting (EAT), with grace/catch-up rules. | `careSignalEvents` (+ `fellowshipTokens` for pseudonymous submissions, gap-analysis #10) |

**Critical rules (from PSOT §17 and FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md):**

- **Fellow status is 100% automated** — no manual conferral in v1. If automation is incomplete, do not ship Fellow UI.
- **No fellowship surcharge** — fellowship is earned through platform use, not a bundled purchase. Providers pay per course/micro-course SKU.
- **BLS, ACLS, PALS are NOT required** for fellowship qualification. They are optional, standalone AHA-certified offerings on a separate track.
- **Care Signal ≠ Safe-Truth.** Care Signal is the staff incident/near-miss reporting product (fellowship pillar C). Safe-Truth is the parent/guardian product. Never mix them.
- **Do not** show "Fellow" title or fellowship progress UI until the §11 launch checklist in FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md fully passes.
- **Pillar C has three submission modes, not a binary anonymous/named toggle** (Observation Architecture §5.5, gap-analysis #10): `named` (real `userId`, full credit), `pseudonymous` (no `userId` — a `fellowshipTokens` row instead, still full credit), `anonymous` (no identity anywhere, no credit — the true Layer 1). `isAnonymous` on `careSignalEvents` is legacy/display-only now (hides from facility views per PSOT §20.3 rule 4) — `submissionMode` is the source of truth for identity storage and credit eligibility. See `server/lib/fellowship-token.ts` and `drizzle/schema.ts`'s `fellowshipTokens` doc comment before touching this.

**Canonical detail:** `docs/FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md` and PSOT §17.

---

## 9. Development Guardrails (from PSOT §13)

### ResusGPS — Zero-ambiguity clinical UX (mandatory)

Lives depend on bedside decisions. ResusGPS must enforce **structured, individual evidence capture** — no bulk "done/N/A" shortcuts.

| Rule | Requirement |
|------|-------------|
| **Phase order** | After E (Exposure): **SAMPLE / secondary survey** → **diagnostic evidence** → **diagnosis** → **definitive care** |
| **Each field** | Enter a **specific value** OR tap **Not available** individually (LMIC policy data — captures resource gaps) |
| **Reassessment** | After fluid bolus: each overload and perfusion sign submitted separately |
| **Vitals** | Abnormal values highlighted **during input** and on summary (HR, RR, BP, SpO₂, temp, glucose mmol/L) |
| **Management** | No ambiguous bulk-complete for intervention lists; individual step confirmation only |
| **Fellowship conditions** | DKA is gold template; same rigor pattern for all 15 fellowship conditions (`shared/fellowship-clinical-rigor.ts`) |

Code: `shared/clinical-evidence.ts`, `shared/secondary-survey-gating.ts`, `StructuredClinicalEvidencePanel`.

- **Extend, don't replace.** New features plug into existing routes, tRPC procedures, admin reports, and event tracking unless there is a deliberate architectural decision.
- **Preserve the user model.** No single-role lock; preserve multi-context switching in the UI.
- **Preserve report definitions.** "This month" = EAT calendar month; "last 7 days" = rolling 7×24 hours.
- **No hardcoded credentials.** Use env vars and document in `.env.example`.
- **Never break the core emergency flow:** open app → enter findings → get priority next actions → reassessment prompts.
- **Small, reviewable changes only.** No big rewrites unless absolutely necessary.
- **Extend, Don't Replace:** Never remove detailed content to add "improved" but simplified versions. "Improvement" must always result in a net increase in clinical depth and detail.
- **Feedback triage regression guard:** When fixing user feedback (especially `content` / `clinical` issue types), **never delete or shallow existing modules, sections, or protocols** to resolve the ticket. Fix the reported bug; preserve working depth. CEO cited shallow content regression from prior "improvements" — this is a **hard stop**. See [`docs/FEEDBACK_TICKET_WORKFLOW.md`](docs/FEEDBACK_TICKET_WORKFLOW.md).
- **Clinical content changes** require explicit approval from Job Karue before merging.
- **All changes must be pushed to GitHub** for Cursor and other developers to access.
- **Brand naming:** Always use "Paeds Resus" in user-facing copy. "ResusGPS" is reserved for the bedside clinical tool only.

---

## 9.1 Database & Migration Rules

Every new table in `drizzle/schema.ts` MUST have a corresponding migration script and seed workflow. Failures in this workflow have blocked production deployments and caused data inconsistency.

### Migration script requirements

- **Every new table in `drizzle/schema.ts` MUST have a matching idempotent migration script** at `scripts/apply-NNNN-<feature>.mjs` (e.g., `apply-0052-kmhfl-facilities.mjs`).
- **Every migration script MUST have a corresponding `"db:apply-NNNN"` entry in `package.json` scripts** so the CEO can run `pnpm run db:apply-NNNN` without remembering file paths. Migration `0115` is registered as `db:apply-0115` and is included in the guarded `db:apply-iers` sequence.
- **Migration scripts use `scripts/db-connection-config.mjs`** for SSL + IPv4 (Aiven configuration).
- **All migrations are idempotent** (safe to re-run) — use `IF NOT EXISTS` / `tableExists()` checks to prevent "table already exists" errors.
- **Migration numbers can collide across parallel PRs — `git fetch origin main` and check the highest existing `apply-00NN-*.mjs` right before naming a new one, not just at session start.** Building #11 Phase C, migration 0066 was picked (the next free number at branch time), but a different parallel PR claimed 0066 for something unrelated and merged first. Caught during the routine pre-edit fetch/rebase, not after a production collision — renumbered to 0067 before shipping. Multiple agents working the same repo concurrently makes this a real, recurring risk, not a one-off.
- **When a migration's raw SQL references an EXISTING column (e.g. `ALTER TABLE ... AFTER \`someColumn\``), verify the literal DB column-name string in `drizzle/schema.ts` — do not assume it matches the JS property name.** Several older columns use snake_case DB names under a camelCase JS field (e.g. `eventId: varchar("event_id", ...)` on `careSignalEvents` — the JS property is `eventId`, the real column is `event_id`). Migration 0064 shipped with `AFTER \`eventId\`` and failed on production with `ER_BAD_FIELD_ERROR` before this was caught and fixed. Grep schema.ts for the field, read the string literal inside the column-builder call, and use that exact string in raw SQL.

### Seed script requirements

- **Seed scripts MUST explicitly import all table references they use** from `../drizzle/schema.ts` (e.g., `import { kmhflFacilities } from '../drizzle/schema.ts'`). Missing imports cause `ReferenceError: X is not defined`.
- **Seed scripts MUST be run with dotenv loaded:** `pnpm tsx -r dotenv/config scripts/seed-*.mjs` (not `pnpm tsx scripts/seed-*.mjs` alone).
- **Seed scripts must import `getDb()` from `server/db.ts`** for database access, not raw `mysql.createConnection(DATABASE_URL)` (which ignores SSL and Aiven configuration).

### Definition of Done for database features

Code merged to `main` is **NOT done** for database features until:

1. **Code merged** to `origin/main` (merge commit hash recorded).
2. **Migration applied on production** — CEO runs locally: `pnpm run db:apply-NNNN` on Windows/PowerShell with production `DATABASE_URL` in `.env`.
3. **Seed run (if applicable)** — CEO or agent runs: `pnpm tsx -r dotenv/config scripts/seed-*.mjs` (or `pnpm run seed:*` if npm script exists).
4. **Verify logged in WORK_STATUS** — record which migration/seed commands were run and their output.

**Agent responsibility:** Provide exact PowerShell commands for CEO to run locally (the CEO runs migrations, not the agent in sandbox).

### Common migration errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Table doesn't exist` | Migration script was never created or applied | Create `apply-NNNN-*.mjs` and add `db:apply-NNNN` to `package.json`; CEO runs locally |
| `ReferenceError: X is not defined` | Seed script missing import | Add `import { tableName } from '../drizzle/schema.ts'` at top of seed script |
| `Missing script: db:apply-NNNN` | Forgot to add npm script entry | Add `"db:apply-NNNN": "tsx -r dotenv/config scripts/apply-NNNN-*.mjs"` to `package.json` scripts |
| `ETIMEDOUT` on seed | Long-running seed on desktop or agent network | Use Render Shell with production `DATABASE_URL` already set; or chunk seed with `--batch=` flag |
| `Database client not initialized` | Seed script not using `getDb()` | Replace `mysql.createConnection()` with `await getDb()` from `server/db.ts` |

---

## 10. The Subsidised ACLS/BLS Cohort Program & Phase Gates

The Subsidised Cohort Program is a 6-month training pathway offering discounted pricing (KES 15,000 instead of KES 20,000) for affiliated facility members (e.g., interns at CHM).

### The Three-Phase Progression & Gating Rules
The program is split into three gates, enforced server-side inside `bookHandsOnSession` (`server/routers/courses.ts`):
1. **Phase 1 (Cognitive):** Done on `elearning.heart.org`. Learners upload completion proof URLs from `LearnerDashboard.tsx`. Approved by facility coordinators via the `Phase1ProofReviewWidget` on the Staff tab of `InstitutionalPortal.tsx`.
2. **Phase 2 (Online Simulations):** Unlocked only after Phase 1 proof approval. Requires booking online sessions via the training calendar. Learner must attend a minimum of 3 sessions as a `team_member` and 3 as a `team_leader` and be signed off on competency by an instructor.
   - **Waitlist Priority:** If simulations are overbooked, the booking waitlist algorithm prioritizes learners with a higher payment percentage (total paid / KES 15,000) with registration timestamp as a tiebreaker.
3. **Phase 3 (Physical Megacodes):** Unlocked only when Phase 2 simulations are complete AND the learner has paid their fees in full (total paid $\ge$ KES 15,000).

### Facility matching (CEO decision, 2026-07-19)
Cohort training is same-facility by design — the clinical value of Phase 2 (shared mental models, team roles, closed-loop communication) depends on training with the people you'll actually work a code with.
- **Phase 2 (online):** strictly same-facility. `bookHandsOnSession` compares the session's `institutionalAccountId` against the learner's own; a mismatch is a hard `FORBIDDEN`, no override exists.
- **Phase 3 (hands-on):** same-facility by default, with a controlled overflow valve — a platform admin (`ctx.user.role === "admin"`) can call `approvePhase3CrossFacilityOverflow` to grant one named learner permission to book one named out-of-facility session, so a small facility that hasn't reached 8 Phase-3-ready learners doesn't bottleneck them. Each approval is a logged row in `phase3CrossFacilityApprovals`, not a standing permission.

### Payment terms (CEO decision, 2026-07-19; IERP timing clarified 2026-08-27)
- All payments under this program, including any legacy partial payments, are **non-refundable** — Terms of Use §6.4 (`docs/legal/TERMS_OF_USE_FULL.md`), synced in `client/src/legal/terms-of-use.ts` §9. **§6.4 remains split into §6.4.1 (IERP) and §6.4.2 (Nurse Cohort Program)**, each with its own clearly labeled rules. `termsOfUse` is now 1.3.0 in `shared/legal-versions.ts`, re-triggering the consent gate for existing users after the IERP timing clarification. IERP now uses a calendar rule: August–November starters may access Phase 1–2 before payment until 1 December EAT; December–July starters require the full KES 15,000 before cognitive access; the remaining balance is requested in one payment, not as a Lipa Mdogo Mdogo schedule. Phase 3 requires full payment for both tracks.
- **`LegalReconsentGate.tsx` now reads its explanation from `LEGAL_CHANGE_SUMMARY` in `shared/legal-versions.ts`** (keyed by `termsOfUse` version) instead of a hardcoded sentence in the component itself. The 1.1.0 explanation had to be manually updated the very next time this bumped (this entry) — that's the exact problem this fixes. **Add one entry to `LEGAL_CHANGE_SUMMARY` on every future `termsOfUse` bump; nothing else needs touching.**
- **IERP payment timing:** for an intern-type `designation` (`noi`, `coi_bsc`, `coi_diploma`, `moi`), an August–November start permits Phase 1–2 access before payment until 1 December EAT. From December onward, or immediately for a December–July start, the full KES 15,000 is required before cognitive access or further Phase 2 booking. Phase 3 always requires full payment. The rule is surfaced through the standalone IERP summary and the legacy `getPhaseSummary` fields, and is enforced at course-detail, module-content, quiz, completion, Phase 2, and Phase 3 boundaries.

### Cadre-taxonomy auto-mapping (CEO decision, 2026-07-21)
A separate, platform-wide "cadre taxonomy" (`client/src/lib/cadre-taxonomy.ts`, `users.cadre`) exists for general profile/CPD purposes — much deeper than this program's `designation` enum (nursing sub-cadres down to individual sub-specialties). **Deliberately not merged into `designation`**: the cohort program's eligibility rules only need 3 buckets (intern/nurse/other), and matching against 20+ free-text taxonomy leaves to decide subsidy eligibility would add real risk (an unmapped new sub-cadre silently falling through) for no corresponding business value. Instead, `shared/cadre-designation-mapping.ts`'s `inferDesignationFromCadre(cadre)` auto-applies `designation` for the genuinely unambiguous cases: any RN-family cadre leaf (regardless of level/sub-specialty) → `permanent_nurse`; `NOI`/`MOI` → their matching intern designation. **`COI` is deliberately NOT auto-mapped** — the taxonomy has one flat `COI` value with no BSc/Diploma split, so guessing between `coi_bsc`/`coi_diploma` would be a silent, possibly-wrong eligibility call; those learners still pick manually. Wired in two places: `syncProviderProfileFacility` (`server/services/facility-registry.service.ts`) applies it at the moment a pending institutional link is created, instead of always defaulting to `"other"`; `DesignationDeclarationCard` (`LearnerDashboard.tsx`) pre-selects (not locks) the same inference as a fallback, for staff records created before the cadre was set. **Known drift risk, flagged not hidden:** the RN-family leaf list is hand-maintained, not imported from `cadre-taxonomy.ts` (a client-only path, fragile to import from `shared`/`server`) — if the taxonomy's RN branch changes, this list needs a matching update. Tested in `shared/cadre-designation-mapping.test.ts`.

### Subsidy eligibility & nurse instalment pace (CEO decision, 2026-07-19)
- **Eligible for the KES 15,000 subsidised rate: "any nurse, or intern"** — not just anyone linked to a subsidised-program facility. Enforced in `payments.ts`'s `getIndividualBalance`: `permanent_doctor` and undeclared `other` pay the standard rate (20,000/10,000) even at a linked facility.
- **Nurses must have a licence number on file** (`providerProfiles.licenseNumber`) to qualify for the subsidised rate — the verification step. **Interns just need to have declared an intern designation**, no licence required.
- **Self-service declaration:** `institution.declareMyDesignation` — for learners auto-linked via `syncProviderProfileFacility` (which defaults `designation` to `"other"`), lets them declare nurse (with licence number, written to `providerProfiles`) or intern designation themselves, rather than waiting on a coordinator's `addStaffMember`/`bulkImportStaff`.
- **Nurse instalment-pace gate:** unlike interns, nurses get no deferral window — they must keep pace with **KES 2,500/month from enrolment** to keep Phase 2 booking access (`bookHandsOnSession`). Computed as full elapsed months since `enrollmentDate` × 2,500 (floor — grace within the current month before that month's instalment is due). Surfaced via `getPhaseSummary`'s `nursePaceRequiredByNow`/`nursePaceLockoutActive`.
- **Phase 1 (online coursework) requires no payment** — only current Terms of Use consent (already enforced platform-wide, not cohort-specific). This was true before this session too; noted here since the CEO confirmed it explicitly.

### BLS-before-ACLS/PALS prerequisite (CEO decision, 2026-07-19, platform-wide)
"One must complete BLS to start ACLS or PALS" — enforced in `courses.ts`'s `ensureAhaEnrollment` for **all learners**, not just the cohort program (PALS isn't part of this program at all). Deliberate interpretation, flagged not assumed: "complete" reads as full BLS certification (`enrollments.practicalSkillsSignedOff`), not just the cognitive/online modules — if the intent was cognitive-only, it's a one-field swap to `cognitiveModulesComplete`.

### Instructor pathway: per-course competency + mentorship tiers (CEO decision, 2026-07-21)
**Scoped to this Cohort Program specifically** — a separate, unrelated system from the Fellowship program's "Instructor"/"Fellow Instructor" tiers (North Star v2.1 addendum). The two do not interact; naming was deliberately kept distinct (see below) to avoid the next agent assuming they're the same thing.

- **Per-course competency:** `instructorApprovedAt`/`instructorCertifiedAt` are necessary but not sufficient — an instructor must have personally completed a specific provider course (BLS/ACLS/PALS/etc.) themselves to be qualified to instruct it. Tracked in `instructorQualifications` (userId, programType), auto-populated by `syncInstructorQualificationsForUser` (`server/lib/instructor-qualifications.ts`) whenever either condition (instructor-certified, or completed a provider course themselves) becomes newly true. Enforced server-side at sign-off time (`signOffPracticalSkills` in `certificates.ts`) and used to filter `institution.listAssignableInstructors` by `programType` — not just a dropdown convenience, the sign-off itself is blocked if unqualified.
- **Three tiers** (`users.instructorTier`): **Provisional** (completed Instructor Course, admin-approved, paired with a named mentor) → **Qualified** (mentor has manually confirmed 3 independently-led groups, start to finish, across all three phases — auto-promotes) → **Lead Instructor** (has mentored 10 different mentees to Qualified — auto-promotes). Named "Lead Instructor," not "Faculty" — the original name echoed Fellowship-program language ("Fellow"/"Fellowship") closely enough to cause confusion, even though the two systems don't logically conflict.
- **Manual confirmation, not auto-computed:** whether a group was genuinely led well and independently is a real credentialing judgment call, not something attendance data alone should certify — deliberate design choice, see `instructorMentorshipGroups`.
- **One mentor per mentee**, for their whole provisional period (`instructorMentorships`, `menteeUserId` unique). Mentor assignment is admin-only (`assignMentor`), not self-service.
- **Bootstrap override:** `setInstructorTierOverride` (admin-only) — for instructors the CEO trained directly before this system existed, who have no real mentor to log into it.
- **Migration 0075** (`scripts/apply-0075-instructor-competency-mentorship.mjs`, `pnpm run db:apply-0075`): adds `users.instructorTier` and the three new tables.
- **Instructor Course content expanded** from a 1-module MVP stub to 6 real modules (`server/lib/ensure-instructor-course-catalog.ts`): adult learning principles & facilitation, running Phase 1-3 to a consistent standard, objective skills testing & GAS-structured debriefing, the mentorship pathway itself, and platform tools/QA. Idempotency is per-module (matched by title) — the original MVP's "does any module exist" check would have silently blocked new modules from ever seeding on an already-migrated environment.
- **Known gaps, not addressed here:** no dedicated frontend UI yet for `assignMentor`/`confirmMentorshipGroup`/`getMyMentees` — mentors would need direct API access or a future admin/instructor-portal UI; the three new gaps a coordinator/admin still can't act on through the UI (double-booking protection, batch sign-off, assignment notifications) from the earlier three-gap audit remain open too.

### Key Files & Locations
- **Database Schema:** `drizzle/schema.ts` (new columns on `institutionalStaffMembers` and `trainingAttendance`; tables `individualInstallmentPayments`, `phase3CrossFacilityApprovals`, `instructorQualifications`, `instructorMentorships`, `instructorMentorshipGroups`; `users.instructorTier`). No new migration for the 2026-07-19 eligibility/pace/BLS-gate work — reuses existing `institutionalStaffMembers.designation`, `providerProfiles.licenseNumber`, and `enrollments.practicalSkillsSignedOff`.
- **Migration & Apply Scripts:** `drizzle/0045_*.sql` + `scripts/apply-0066-cohort-phase-gates.mjs` (`pnpm run db:apply-0066`); `scripts/apply-0070-phase3-cross-facility-overflow.mjs` (`pnpm run db:apply-0070`); `scripts/apply-0075-instructor-competency-mentorship.mjs` (`pnpm run db:apply-0075`).
- **Backend Routing:** `courses.ts` (`getPhaseSummary`, `bookHandsOnSession` facility + phase + payment gates, `approvePhase3CrossFacilityOverflow`, `ensureAhaEnrollment` BLS gate), `institution.ts` (`uploadPhase1Proof` + `approvePhase1Proof` + `declareMyDesignation` + `listAssignableInstructors` course filter), `payments.ts` (`getIndividualBalance` — designation-gated eligibility), `instructor.ts` (`assignMentor`, `confirmMentorshipGroup`, `setInstructorTierOverride`, `getMyMentees`), `certificates.ts` (`signOffPracticalSkills` per-course qualification gate), `server/lib/instructor-qualifications.ts`.
- **Frontend Pages:** `LearnerDashboard.tsx` (payment ledger, `Phase1ProofUploadCard`, `DesignationDeclarationCard`), `InstitutionalPortal.tsx` (cohort progress analytics, `Phase1ProofReviewWidget`), `HospitalAdminDashboard.tsx` (course-filtered instructor assignment dropdowns for both create and edit forms). `declareMyDesignation` now has a real frontend caller (INST-16, closed 2026-07-20) — this note previously said it didn't; corrected.
- **Legal:** `docs/legal/TERMS_OF_USE_FULL.md` §6.4, `client/src/legal/terms-of-use.ts` §9, `shared/legal-versions.ts`.
- **Tests:** `shared/waitlist.test.ts` (unit tests for the booking priority queue).

---

## 11. Key Files to Read Before Major Work

| File | Purpose |
| :--- | :--- |
| `docs/PLATFORM_SOURCE_OF_TRUTH.md` | **The canonical PSOT.** Read this for any architectural or product decision. §19–22 for global vision. |
| `docs/CARE_SIGNAL_STRATEGY_AND_ROADMAP.md` | Full Care Signal strategy, audit, and implementation roadmap. |
| `docs/NORTH_STAR_V2_3_ADDENDUM_WHOLE_HOSPITAL_READINESS.md` | Adult/whole-hospital scope decision (Code Signal), and why it doesn't change the paediatric mission. Read before touching Care Signal, Code Signal, or any "is this platform paediatric-only" question. |
| `docs/CARE_SIGNAL_WORLD_CHANGING_POTENTIAL.md` | Strategic analysis of Care Signal's global impact potential. |
| `RESUSGPS_DNA.md` | Core platform DNA — 7 strands, mission, success metrics. |
| `docs/STRATEGIC_FOUNDATION.md` | Theory of change, clinical origin narrative, honest success criteria. |
| `docs/FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md` | Fellowship qualification rules, Pillar C Care Signal policy. |
| `docs/FEEDBACK_TICKET_WORKFLOW.md` | CEO feedback inbox (`/admin/feedback`), agent export, triage loop, regression guard. |
| `docs/BRAND_UPDATE_PAEDS_RESUS.md` | Full brand update history (ResusGPS → Paeds Resus naming). |
| `docs/INSTITUTIONAL_BACKLOG_BOARD.md` | Current institutional feature backlog (INST-0 to INST-15+). |
| `docs/BACKLOG_BOARD.md` | Platform-wide scrum backlog. |
| `docs/CEO_Platform_Update_And_Reply_To_AI_Team.md` | CEO operational narrative. If PSOT and CEO brief conflict on product/technical decisions, update PSOT to match CEO's stated decision. |
| `CHM_GOLD_STANDARD_TEMPLATE.md` | CHM configuration as reusable institutional template. |
| `INSTITUTIONAL_OS_BLUEPRINT.md` | 4-module Institutional OS architecture blueprint. |

---

## 12. Contact & Ownership

- **CEO / Owner:** Job Karue — PICU Nurse, Entrepreneur, ERT Chair
- **Email:** paedsresus254@gmail.com
- **Phone:** +254706781260
- **LinkedIn:** https://www.linkedin.com/company/paeds-resus/
- **Website:** https://www.paedsresus.com

---

*This file must be updated whenever a major strategic, brand, or architectural decision is made. Any change to canonical decisions belongs in `docs/PLATFORM_SOURCE_OF_TRUTH.md` first — then reflected here.*

*By reading this file, you acknowledge the all-agents mandate. Proceed with your task in full alignment with the PSOT.*


### Exact-time UTL and provider rota controls (migration 0118)

The Shift staffing surface is date- and time-based. An ERCo or authorised IERS governance user selects the actual UTL provider and exact facility-local start/end interval for each dated shift. Same-day and overnight intervals are supported through an explicit end-day offset; the server rejects zero, backwards, and over-24-hour intervals. Existing morning/evening/night labels are only safe legacy presets, not proof that a provider works every shift.

Institution administrators may save reusable shift-hours templates. An ERCo may assign one provider to explicitly selected dates through the bulk UTL action, but monthly source planning must never silently apply one provider to every dated shift. A profile-linked nurse is only a candidate until the dated duty is explicitly assigned and the provider accepts it; changing the provider or interval resets acceptance/readiness.

Department-scoped nurse pickers are the default for ERCo, ERTL, UTL, and other high-cardinality provider choices. Candidate lists must be filtered to active canonical members of the relevant department. Manual candidates must be marked as requiring account linkage before provider duty can be accepted.

Provider IERS dashboards show the next actionable UTL/ERTL duty first and keep the full rota behind an explicit expand action. Exact hours appear in both views. ERTL department selection remains server-derived from pole order and anchor; only the named provider is explicitly nominated and accepted.

Before production use, register migration `0118` in the guarded sequence, deploy the code, obtain explicit confirmation for the production schema write, run `pnpm run db:apply-iers` exactly once, and then run strict `pnpm run db:verify-iers`. Use an isolated localhost MariaDB fixture for exact-time, bulk-assignment, provider-summary, authorization, and acceptance tests. Never use patient data or a live emergency for this validation.
