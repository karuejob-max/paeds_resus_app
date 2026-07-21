<#
.SYNOPSIS
  Pre-merge collision check for the four high-collision files this repo's
  AGENTS.md protocol names: drizzle/schema.ts, docs/WORK_STATUS.md,
  package.json, and AGENTS.md itself.

.DESCRIPTION
  Multiple accounts/agents work on this repo in parallel. This script
  codifies AGENTS.md's "Shared-file collision protocol" (steps 1, 1a, 4)
  into one command instead of relying on remembering each step by hand.
  It does NOT replace step 2 (post-merge verification) or step 1b
  (re-diffing a zip before packaging) - those still need a change-specific
  grep only you know the right substring for. Run this BEFORE merging any
  PR, on the PR's own branch.

.PARAMETER Branch
  The branch to check. Defaults to whatever branch is currently checked out.

.PARAMETER AutoMerge
  If set, automatically runs `git merge origin/main` when the branch is
  behind, instead of just reporting it. You still have to resolve any
  conflicts and push yourself - this never pushes or force-does anything.

.EXAMPLE
  .\scripts\pre-merge-check.ps1
  .\scripts\pre-merge-check.ps1 -Branch fix/some-branch -AutoMerge
#>

param(
  [string]$Branch = (git branch --show-current),
  [switch]$AutoMerge
)

if (-not (Test-Path "package.json") -or -not (Test-Path "scripts")) {
  Write-Host "ERROR: run this from the repo root (C:\Users\Admin\Documents\Paeds_Resus_App), not scripts\." -ForegroundColor Red
  exit 1
}

$HighCollisionFiles = @(
  "drizzle/schema.ts",
  "docs/WORK_STATUS.md",
  "package.json",
  "AGENTS.md"
)

Write-Host ""
Write-Host "=== Pre-merge collision check for '$Branch' ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: fetch fresh, immediately before checking - not relying on an
# earlier fetch from when the branch was created.
Write-Host "Fetching origin/main..." -ForegroundColor Gray
git fetch origin main | Out-Null

# Step 1 (cont.): did anything land on any of the four high-collision
# files since this branch's own history diverged from main?
$anyDrift = $false
foreach ($file in $HighCollisionFiles) {
  $commits = git log "HEAD..origin/main" --oneline -- $file
  if ($commits) {
    $anyDrift = $true
    Write-Host ""
    Write-Host "  DRIFT on $file :" -ForegroundColor Yellow
    $commits | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
  }
}

if (-not $anyDrift) {
  Write-Host "  No drift on any of the four high-collision files. Clean so far." -ForegroundColor Green
}

# Step 1a: is this branch behind main at all (not just on the four files -
# any commit)? If so, offer to bring it current before you merge the PR,
# rather than letting GitHub's merge UI reconcile a stale branch silently.
$behindCount = (git rev-list --count "HEAD..origin/main")
Write-Host ""
if ([int]$behindCount -gt 0) {
  Write-Host "  Branch is $behindCount commit(s) behind origin/main." -ForegroundColor Yellow
  if ($AutoMerge) {
    Write-Host "  -AutoMerge set: merging origin/main now..." -ForegroundColor Gray
    git merge origin/main
    if ($LASTEXITCODE -ne 0) {
      Write-Host ""
      Write-Host "  MERGE CONFLICT. Do not resolve schema.ts, package.json, or" -ForegroundColor Red
      Write-Host "  WORK_STATUS.md blind - paste the conflicting file names to Claude first." -ForegroundColor Red
      exit 1
    } else {
      Write-Host "  Merged cleanly. Review the four files above yourself before" -ForegroundColor Green
      Write-Host "  trusting it - a clean auto-merge is not proof nothing was silently" -ForegroundColor Green
      Write-Host "  dropped (see AGENTS.md's account-types and fellowship-recovery incidents)." -ForegroundColor Green
      Write-Host "  Then: git push" -ForegroundColor Gray
    }
  } else {
    Write-Host "  Run with -AutoMerge, or manually:" -ForegroundColor Gray
    Write-Host "    git merge origin/main" -ForegroundColor Gray
    Write-Host "    git push" -ForegroundColor Gray
  }
} else {
  Write-Host "  Branch is current with origin/main. No update needed." -ForegroundColor Green
}

# Step 4: migration script <-> package.json consistency check. For every
# scripts/apply-00NN-*.mjs file, confirm its exact filename is referenced
# SOMEWHERE in package.json - not assuming a fixed "db:apply-00NN" key
# name, since this repo also uses other prefixes (e.g. db:backfill-00NN).
# This is exactly the check that would have caught the fellowship-recovery
# PR's dropped db:apply-0072 entry, and the earlier 0069-vs-0069 collision,
# before either reached a human.
Write-Host ""
Write-Host "=== Migration script <-> package.json consistency ===" -ForegroundColor Cyan

$migrationFileObjects = Get-ChildItem -Path "scripts" -Filter "apply-0*.mjs" -File
$packageJsonContent = Get-Content -Path "package.json" -Raw

# Duplicate-number check first - this is the exact failure mode hit twice
# already (0069 claimed by two different PRs' scripts in the same window).
$numberGroups = $migrationFileObjects | Where-Object { $_.Name -match "^apply-\d{4}-" } |
  Group-Object { if ($_.Name -match "^(apply-\d{4})-") { $matches[1] } }
foreach ($group in $numberGroups) {
  if ($group.Count -gt 1) {
    Write-Host "  NUMBER COLLISION: $($group.Count) files claim $($group.Name)-*.mjs :" -ForegroundColor Red
    $group.Group | ForEach-Object { Write-Host "    $($_.Name)" -ForegroundColor Red }
  }
}

$problem = $false
foreach ($fileObj in $migrationFileObjects) {
  if ($packageJsonContent -notlike "*$($fileObj.Name)*") {
    $problem = $true
    Write-Host "  ORPHAN SCRIPT: scripts/$($fileObj.Name) is not referenced anywhere in package.json" -ForegroundColor Red
  }
}
if (-not $problem) {
  Write-Host "  Every scripts/apply-0*.mjs file is referenced somewhere in package.json." -ForegroundColor Green
} else {
  Write-Host "  (This may be a pre-existing, already-run migration with no npm script -" -ForegroundColor Gray
  Write-Host "   not necessarily something this PR broke. Check before assuming it's new.)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Reminder: this script does NOT do everything ===" -ForegroundColor Cyan
Write-Host "  - Step 1b (if this PR came from a zip): re-diff the zip's copy of" -ForegroundColor Gray
Write-Host "    each high-collision file against fresh origin/main before packaging," -ForegroundColor Gray
Write-Host "    not just before you started editing." -ForegroundColor Gray
Write-Host "  - Step 2 (after merging): grep origin/main for the SPECIFIC thing" -ForegroundColor Gray
Write-Host "    this PR added, e.g.:" -ForegroundColor Gray
Write-Host '      git show origin/main:<file> | Select-String "<short ASCII substring>"' -ForegroundColor Gray
Write-Host "    Use a short, ASCII-only substring - not a retyped phrase with an" -ForegroundColor Gray
Write-Host "    em dash or other punctuation that can silently fail to match." -ForegroundColor Gray
Write-Host ""
