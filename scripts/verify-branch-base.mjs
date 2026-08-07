#!/usr/bin/env node
/**
 * Backstop for the rule in AGENTS.md: "before starting ANY new task, branch
 * fresh from `main`". Doesn't enforce that rule (can't -- by the time this
 * runs, the branch already exists) but catches the two concrete symptoms
 * that showed up when it was skipped on PR #407 (2026-08-06):
 *
 *   1. Merge commits pulling in OTHER named branches -- a clean single-task
 *      branch should essentially never contain these. #407 had
 *      "Merge branch 'feat/instructor-landing-route' into ci/mysql-service"
 *      and similar, which is exactly how unrelated work ends up tangled in.
 *   2. A stale fork point -- the branch's merge-base with origin/main is
 *      many commits behind main's current tip, suggesting it was built on
 *      top of an old local checkout (possibly another feature branch)
 *      rather than a freshly-fetched main.
 *
 * Run standalone any time: `node scripts/verify-branch-base.mjs`
 * Also called automatically from scripts/pre-merge-check.ps1.
 * Exits 0 even when it warns -- this is advisory, not a hard gate, since a
 * false positive here should never block a real merge. Read the warnings.
 */
import { execSync } from "child_process";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function tryShLines(cmd) {
  try {
    const out = sh(cmd);
    return out ? out.split("\n") : [];
  } catch {
    return [];
  }
}

const STALE_COMMIT_THRESHOLD = 10;
const WIDE_DIFF_FILE_THRESHOLD = 15;

function main() {
  let branch;
  try {
    branch = sh("git rev-parse --abbrev-ref HEAD");
  } catch {
    console.error("[verify-branch-base] Not a git repo, or no commits yet -- skipping.");
    return;
  }

  if (branch === "main" || branch === "HEAD") {
    console.log(`[verify-branch-base] On ${branch} -- nothing to check.`);
    return;
  }

  try {
    sh("git fetch origin main --quiet");
  } catch {
    console.warn("[verify-branch-base] Could not fetch origin/main -- checking against local main instead (may be stale).");
  }

  let mainRef = "origin/main";
  try {
    sh("git rev-parse --verify origin/main");
  } catch {
    mainRef = "main";
  }

  let mergeBase;
  try {
    mergeBase = sh(`git merge-base HEAD ${mainRef}`);
  } catch {
    console.warn(`[verify-branch-base] No merge-base with ${mainRef} found -- this branch may not descend from main at all. Investigate before opening a PR.`);
    return;
  }

  const warnings = [];

  // --- Check 1: merge commits pulling in other named branches ---
  const mergeCommits = tryShLines(`git log ${mergeBase}..HEAD --merges --pretty=format:%s`);
  const suspiciousMerges = mergeCommits.filter(
    (line) => !/merge (branch 'main'|pull request .* from .*\/main\b)/i.test(line)
  );
  if (suspiciousMerges.length > 0) {
    warnings.push(
      `Found ${suspiciousMerges.length} merge commit(s) pulling in something other than main:\n` +
        suspiciousMerges.map((l) => `    - ${l}`).join("\n") +
        `\n  This is exactly the pattern that let unrelated work accumulate on PR #407. If this branch is meant for one task, these likely shouldn't be here.`
    );
  }

  // --- Check 2: stale fork point ---
  let behindCount = 0;
  try {
    behindCount = parseInt(sh(`git rev-list --count ${mergeBase}..${mainRef}`), 10) || 0;
  } catch {
    // ignore
  }
  if (behindCount > STALE_COMMIT_THRESHOLD) {
    warnings.push(
      `This branch forked ${behindCount} commits behind ${mainRef}'s current tip. If you didn't intend to build on an old checkout, ` +
        `consider rebasing onto fresh ${mainRef} (git fetch origin main && git rebase origin/main) or, if this branch has picked up unrelated ` +
        `work, rebuilding it clean from main instead.`
    );
  }

  // --- Check 3: unusually wide diff (soft signal, not proof of anything) ---
  const changedFiles = tryShLines(`git diff ${mergeBase}..HEAD --name-only`);
  if (changedFiles.length > WIDE_DIFF_FILE_THRESHOLD) {
    warnings.push(
      `This branch touches ${changedFiles.length} files relative to its fork point. Worth a quick sanity check that they're all really ` +
        `part of the same task before opening a PR -- a CI-only or single-feature change is rarely this wide.`
    );
  }

  if (warnings.length === 0) {
    console.log(`[verify-branch-base] OK -- "${branch}" looks like a clean fork from ${mainRef} (${changedFiles.length} file(s) changed).`);
    return;
  }

  console.warn(`[verify-branch-base] WARNING on branch "${branch}":\n`);
  warnings.forEach((w, i) => console.warn(`${i + 1}. ${w}\n`));
  console.warn("Advisory only -- not blocking. Review before opening/merging the PR.");
}

main();
