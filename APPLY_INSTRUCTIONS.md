# How to apply this package

Your earlier note is right — no migration-collision fix needed from me this time.
I re-fetched `origin/main` before starting and found your other two sessions had
already resolved the 0069 collision themselves (PR #311, confirmed deployed in
PR #312) and caught a related `schema.ts` drift (PR #313), plus added a new
"shared-file collision protocol" section to `AGENTS.md` (PR #314). I read all of
that, reconciled my work on top of it, and dropped my now-duplicate fix entirely
rather than re-adding it. Nothing in this package touches `AGENTS.md`,
`package.json`, or `scripts/` — no collision risk there this time.

## Steps

1. `git fetch origin main && git checkout main && git pull`
2. `git checkout -b fix/item-15-premium-analytics-legal-catchup`
3. Extract this zip into the repo root, overwriting existing files:
   ```powershell
   Expand-Archive -Path <this-zip> -DestinationPath C:\Users\Admin\Documents\Paeds_Resus_App -Force
   ```
4. Ignore `APPLY_INSTRUCTIONS.md` itself — packaging note, not part of the repo.
5. `git add -A && git status` — you should see:
   - modified: `docs/WORK_STATUS.md`, `docs/legal/CARE_SIGNAL_DATA_PROCESSING_NOTICE.md`, `docs/legal/PRIVACY_POLICY_FULL.md`, `server/lib/fpkb-pattern-detector.test.ts`, `server/lib/fpkb-pattern-detector.ts`, `server/routers/admin-stats.ts`, `shared/legal-versions.ts`
   - new: `docs/legal/LEGAL_SIGNOFF_BACKLOG.md`, `server/lib/premium-analytics-readiness.ts`
6. Per the new shared-file collision protocol in `AGENTS.md`: **before you merge**, re-run `git log HEAD..origin/main --oneline -- docs/WORK_STATUS.md` one more time — if anything landed on that file in the meantime, the entries I inserted at the top may no longer be at the right position and should be re-checked, not blindly force-pushed.
7. `pnpm run check` / `tsc --noEmit` and `pnpm run test:unit` if you want to re-verify locally — both clean/green in the sandbox: `tsc` clean; `fpkb-pattern-detector.test.ts` 13/13; `shared/legal-consent.test.ts` 4/4; full `vitest.unit.config.ts` gate 597/597.
8. **After merging, per the new protocol's step 2:** confirm your specific change actually survived —
   ```
   git show origin/main:server/lib/fpkb-pattern-detector.ts | grep -n "CANDIDATE_SUCCESS: 6 \* 30"
   git show origin/main:shared/legal-versions.ts | grep -n "1.1.0"
   ```
   Both should return a match. A clean merge and green CI prove the result compiles — they don't prove these specific lines are still there, per the lesson your other session just wrote up.
9. Commit, push, `gh pr create`.

## No migrations to run

Everything in this package is code/docs-only. The version bump in
`shared/legal-versions.ts` takes effect the moment this deploys — no separate
step, but it does mean every existing user will hit the terms/privacy and
Care Signal re-consent gates on their next protected action, per your
instruction to re-consent them now.
