# AGENTS.md — Mandatory Pre-Read for Everyone Working in This Repository

> **Read this entire file before taking any action in this repository.**
> This applies to **anyone or anything** touching this codebase — AI agents (Manus, Cursor, Codex, Claude, etc.), contractors, and Job himself. It is not an AI-only file; it's the pre-read, full stop.
> This file is the distillation of the Platform's Source of Truth (PSOT) for whoever is about to write code or make a decision here.
> The canonical PSOT lives at `docs/PLATFORM_SOURCE_OF_TRUTH.md`. If this file and the PSOT ever conflict, **the PSOT wins**. Update this file to match.

**Last updated:** July 15, 2026 | **Owner:** Job Karue (CEO, Paeds Resus)

---

**CRITICAL INSTRUCTION FOR EVERYONE — AI AGENTS (Manus, Cursor, Codex, Claude, etc.) AND HUMANS ALIKE**

If you are about to take any action in this repository — writing code, reviewing a PR, applying a migration, or making a design call — you **MUST** read this file and follow its instructions first. Don't skip it because you assume it's "just for the AI tools."

### Read this first for shipping and production DB

**[docs/AGENT_OPERATIONS_PLAYBOOK.md](docs/AGENT_OPERATIONS_PLAYBOOK.md)** — step-by-step runbooks: protected-branch PR/merge (`gh`), production fellowship seed (chunked batches, verify script, Render Shell), ETIMEDOUT recovery, honest multitask status. Cross-links [AGENT_AUTONOMY.md](docs/AGENT_AUTONOMY.md); does not replace it.



### Production deploy & database migrations (Manus + all agents)

Schema and content ship on **different tracks**. Merging code to `origin/main` does **not** apply SQL to production.

1. **Ship code:** feature branch → `gh pr create` → CI green → merge to `main` (never push directly to `main`).
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

### Shared-file collision protocol (multi-agent repo — read before touching schema.ts, WORK_STATUS.md, package.json, or AGENTS.md)

This repo has multiple agents (Manus, Codex, Cursor, Claude, etc.) working in parallel, often on unrelated features that both happen to touch the same file. Four files see the most collisions because nearly every PR touches at least one: **`drizzle/schema.ts`**, **`docs/WORK_STATUS.md`**, **`package.json`** (migration script entries), and **`AGENTS.md`** itself. The 2026-07-19 incident above is the concrete example of what goes wrong and why the existing "fetch before editing" convention isn't sufficient on its own — the fetch was current when the PR was built, but another PR landed on the same file in the gap before merge, and the merge silently dropped one side's edit without a conflict.

**Do all of this, not just the first step:**

1. **Fetch `origin/main` immediately before you start** (existing convention) — but also **fetch again immediately before you merge**, not just before you begin. Run `git log HEAD..origin/main --oneline -- <file>` for each of the four high-collision files your PR touches. If anything landed on that file since your branch's base, treat the upcoming merge as untrusted until step 2 confirms it.
1a. **If your branch is behind `main` (GitHub will say "out-of-date with the base branch"), update it before merging the PR, not after:** `git fetch origin main && git merge origin/main`, resolve anything that conflicts, `git push`, then merge the PR. Merging an out-of-date branch and letting GitHub's own merge commit reconcile it is the same untrusted-until-verified situation as any other collision on these four files — a clean auto-merge there is not proof either side survived intact, same as step 2 below. Bring the branch current yourself, on your own machine, where you can actually see what changed, rather than trusting GitHub's merge UI to get it right silently.
2. **After your PR merges, re-fetch and verify your specific change is actually there** — a green CI run and a conflict-free merge only prove the merged result compiles; they do not prove your specific edit survived. Grep the merged file on `origin/main` for the exact thing you added: `git show origin/main:<file> | grep -n "<what you added>"`. For a schema/enum change, this is not optional — do it every time, immediately after merge.
3. **For `WORK_STATUS.md` specifically:** insert new entries as the first entry after the `---` header (reverse-chronological), and re-check that position is still correct immediately before merging — if another PR's entry landed above where you expected, your insertion point has moved and a blind reapply can collide.
4. **For migration numbers specifically:** re-check the highest `apply-00NN` number right before naming a new one (existing convention) — and additionally, after your migration PR merges, confirm on `origin/main` that your migration number wasn't claimed by a parallel PR in the same window (`ls scripts/apply-00NN-*` on the freshly-fetched `main`).
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
- **Every migration script MUST have a corresponding `"db:apply-NNNN"` entry in `package.json` scripts** so the CEO can run `pnpm run db:apply-NNNN` without remembering file paths.
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

### Payment terms (CEO decision, 2026-07-19)
- All payments under this program, including instalments, are **non-refundable** — Terms of Use §6.4 (`docs/legal/TERMS_OF_USE_FULL.md`), synced in `client/src/legal/terms-of-use.ts` §9. `termsOfUse` bumped to 1.1.0 in `shared/legal-versions.ts` — this re-triggers the consent gate for every existing user.
- **Intern deferred-payment lockout:** for staff with an intern-type `designation` (`noi`, `coi_bsc`, `coi_diploma`, `moi`), if 4 months have passed since `enrollmentDate` (falling back to `createdAt`) with **zero** payment recorded, Phase 2 booking is blocked until a payment is made (in full or as an instalment). This is a zero-paid check, not a not-fully-paid check — the existing Phase 3 full-payment gate already covers partial payers. Surfaced proactively via `getPhaseSummary`'s `paymentDeadline`/`paymentLockoutActive` fields, not just enforced silently.

### Subsidy eligibility & nurse instalment pace (CEO decision, 2026-07-19)
- **Eligible for the KES 15,000 subsidised rate: "any nurse, or intern"** — not just anyone linked to a subsidised-program facility. Enforced in `payments.ts`'s `getIndividualBalance`: `permanent_doctor` and undeclared `other` pay the standard rate (20,000/10,000) even at a linked facility.
- **Nurses must have a licence number on file** (`providerProfiles.licenseNumber`) to qualify for the subsidised rate — the verification step. **Interns just need to have declared an intern designation**, no licence required.
- **Self-service declaration:** `institution.declareMyDesignation` — for learners auto-linked via `syncProviderProfileFacility` (which defaults `designation` to `"other"`), lets them declare nurse (with licence number, written to `providerProfiles`) or intern designation themselves, rather than waiting on a coordinator's `addStaffMember`/`bulkImportStaff`.
- **Nurse instalment-pace gate:** unlike interns, nurses get no deferral window — they must keep pace with **KES 2,500/month from enrolment** to keep Phase 2 booking access (`bookHandsOnSession`). Computed as full elapsed months since `enrollmentDate` × 2,500 (floor — grace within the current month before that month's instalment is due). Surfaced via `getPhaseSummary`'s `nursePaceRequiredByNow`/`nursePaceLockoutActive`.
- **Phase 1 (online coursework) requires no payment** — only current Terms of Use consent (already enforced platform-wide, not cohort-specific). This was true before this session too; noted here since the CEO confirmed it explicitly.

### BLS-before-ACLS/PALS prerequisite (CEO decision, 2026-07-19, platform-wide)
"One must complete BLS to start ACLS or PALS" — enforced in `courses.ts`'s `ensureAhaEnrollment` for **all learners**, not just the cohort program (PALS isn't part of this program at all). Deliberate interpretation, flagged not assumed: "complete" reads as full BLS certification (`enrollments.practicalSkillsSignedOff`), not just the cognitive/online modules — if the intent was cognitive-only, it's a one-field swap to `cognitiveModulesComplete`.

### Key Files & Locations
- **Database Schema:** `drizzle/schema.ts` (new columns on `institutionalStaffMembers` and `trainingAttendance`; tables `individualInstallmentPayments`, `phase3CrossFacilityApprovals`). No new migration for the 2026-07-19 eligibility/pace/BLS-gate work — reuses existing `institutionalStaffMembers.designation`, `providerProfiles.licenseNumber`, and `enrollments.practicalSkillsSignedOff`.
- **Migration & Apply Scripts:** `drizzle/0045_*.sql` + `scripts/apply-0066-cohort-phase-gates.mjs` (`pnpm run db:apply-0066`); `scripts/apply-0070-phase3-cross-facility-overflow.mjs` (`pnpm run db:apply-0070`).
- **Backend Routing:** `courses.ts` (`getPhaseSummary`, `bookHandsOnSession` facility + phase + payment gates, `approvePhase3CrossFacilityOverflow`, `ensureAhaEnrollment` BLS gate), `institution.ts` (`uploadPhase1Proof` + `approvePhase1Proof` + `declareMyDesignation`), `payments.ts` (`getIndividualBalance` — designation-gated eligibility).
- **Frontend Pages:** `LearnerDashboard.tsx` (payment ledger, `Phase1ProofUploadCard`), `InstitutionalPortal.tsx` (cohort progress analytics, `Phase1ProofReviewWidget`). **Known gap:** no frontend UI yet for `declareMyDesignation` — backend-only as of 2026-07-19, see `docs/INSTITUTIONAL_BACKLOG_BOARD.md` INST-16.
- **Legal:** `docs/legal/TERMS_OF_USE_FULL.md` §6.4, `client/src/legal/terms-of-use.ts` §9, `shared/legal-versions.ts`.
- **Tests:** `shared/waitlist.test.ts` (unit tests for the booking priority queue).

---

## 11. Key Files to Read Before Major Work

| File | Purpose |
| :--- | :--- |
| `docs/PLATFORM_SOURCE_OF_TRUTH.md` | **The canonical PSOT.** Read this for any architectural or product decision. §19–22 for global vision. |
| `docs/CARE_SIGNAL_STRATEGY_AND_ROADMAP.md` | Full Care Signal strategy, audit, and implementation roadmap. |
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
