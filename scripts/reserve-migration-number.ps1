<#
.SYNOPSIS
  Reserves the next migration number INSTANTLY, before you write a single
  line of the actual migration -- closing the gap that "fetch and check
  right before naming" (AGENTS.md's existing protocol) cannot close on its
  own when multiple sessions are working concurrently.

.DESCRIPTION
  Three real collisions happened in quick succession (migrations 0069,
  0079, 0080) even though every session involved checked origin/main
  immediately before naming its migration. The problem isn't the check --
  it's the WINDOW between checking and merging. A session can check,
  see a number is free, then spend 20 minutes building the actual
  migration and its surrounding code -- and lose the race to a different
  session that checked five minutes later and finished first.

  This script closes that window by making the reservation itself
  instant and visible, independent of how long the real work takes
  afterward. It does this by pushing a throwaway branch directly to the
  remote -- NOT a PR, so it needs no review or merge, and is visible to
  anyone who fetches within seconds, not whenever the real PR eventually
  lands.

  Run this FIRST, before writing your migration script. Use the number
  it gives you. When your real PR (with the actual scripts/apply-00NN-*.mjs
  file and its package.json entry) merges to main, delete the reservation
  branch -- it has served its purpose.

.PARAMETER Description
  A short description of what this migration is for (e.g. "care signal
  redaction retry state"). Used only in the reservation branch's commit
  message, so anyone checking `git branch -a` can see who claimed what
  and why, not just a bare number.

.EXAMPLE
  .\scripts\reserve-migration-number.ps1 -Description "care signal redaction retry state"
#>

param(
  [Parameter(Mandatory = $true)]
  [string]$Description
)

if (-not (Test-Path "package.json") -or -not (Test-Path "scripts")) {
  Write-Host "ERROR: run this from the repo root (C:\Users\Admin\Documents\Paeds_Resus_App), not scripts\." -ForegroundColor Red
  exit 1
}

$uncommittedChanges = git status --porcelain
if ($uncommittedChanges) {
  Write-Host "ERROR: you have uncommitted changes. Commit or stash them first, then re-run this." -ForegroundColor Red
  Write-Host "(This script switches branches to reserve the number, which could fail or carry" -ForegroundColor Gray
  Write-Host " your changes somewhere unexpected if your working tree isn't clean right now.)" -ForegroundColor Gray
  git status --short
  exit 1
}

Write-Host ""
Write-Host "=== Reserving the next migration number ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Fetching origin (all branches, so reservation branches are visible too)..." -ForegroundColor Gray
git fetch origin | Out-Null

# Highest number already in use on origin/main itself.
$mainPackageJson = git show origin/main:package.json
$highestOnMain = 0
[regex]::Matches($mainPackageJson, '"db:apply-(\d{4})"') | ForEach-Object {
  $n = [int]$_.Groups[1].Value
  if ($n -gt $highestOnMain) { $highestOnMain = $n }
}

# Highest number already RESERVED by some other session's placeholder
# branch, even if their real PR hasn't merged yet. This is the check that
# actually closes the race-condition window.
$remoteBranches = git ls-remote --heads origin
$highestReserved = 0
$reservationDetails = @()
foreach ($line in $remoteBranches) {
  if ($line -match "refs/heads/migration-reserved-(\d{4})") {
    $n = [int]$matches[1]
    if ($n -gt $highestReserved) { $highestReserved = $n }
    $reservationDetails += $matches[1]
  }
}

if ($reservationDetails.Count -gt 0) {
  Write-Host "  Existing reservation branch(es) found: $($reservationDetails -join ', ')" -ForegroundColor Yellow
  Write-Host "  (If any of these look stale -- their real PR merged a while ago -- someone should clean them up with:" -ForegroundColor Gray
  Write-Host "     git push origin --delete migration-reserved-00NN" -ForegroundColor Gray
  Write-Host "   Not done automatically here, since only a human can judge 'stale'.)" -ForegroundColor Gray
}

$nextNumber = [Math]::Max($highestOnMain, $highestReserved) + 1
$nextNumberPadded = "{0:D4}" -f $nextNumber
$branchName = "migration-reserved-$nextNumberPadded"

Write-Host ""
Write-Host "  Highest number in use on origin/main:  $("{0:D4}" -f $highestOnMain)" -ForegroundColor Gray
Write-Host "  Highest number already reserved:       $("{0:D4}" -f $highestReserved)" -ForegroundColor Gray
Write-Host "  ==> Reserving:                          $nextNumberPadded" -ForegroundColor Green
Write-Host ""

# Create the reservation as a tiny, throwaway branch off origin/main --
# NOT off your feature branch, so this reservation is visible/valid
# regardless of what else you're doing locally.
$currentBranch = git branch --show-current
git checkout -B $branchName origin/main 2>&1 | Out-Null

$placeholderPath = "scripts/.reserved-$nextNumberPadded"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss K"
$content = @"
Migration number $nextNumberPadded reserved.

Description: $Description
Reserved at: $timestamp

This is a placeholder, not a real migration. It exists only to make this
number visible to other sessions the instant it's claimed, closing the
race-condition window between "checked, it's free" and "PR merged."

Once the real PR (with scripts/apply-$nextNumberPadded-*.mjs and its
package.json entry) has merged to main, this whole branch can be deleted:
  git push origin --delete $branchName
"@
Set-Content -Path $placeholderPath -Value $content

git add $placeholderPath
git commit -m "Reserve migration $nextNumberPadded : $Description" | Out-Null
git push origin $branchName 2>&1 | Out-Null

# Return to whatever branch the user was actually working on.
if ($currentBranch) {
  git checkout $currentBranch 2>&1 | Out-Null
  git branch -D $branchName 2>&1 | Out-Null
}

Write-Host "Reserved and pushed. Anyone who fetches now will see migration $nextNumberPadded is taken." -ForegroundColor Green
Write-Host ""
Write-Host "Use $nextNumberPadded for your actual migration script:" -ForegroundColor Cyan
Write-Host "  scripts/apply-$nextNumberPadded-<short-name>.mjs" -ForegroundColor Cyan
Write-Host ('  package.json entry: "db:apply-' + $nextNumberPadded + '": "node scripts/apply-' + $nextNumberPadded + '-<short-name>.mjs"') -ForegroundColor Cyan
Write-Host ""
Write-Host "When your real PR merges, delete this reservation branch:" -ForegroundColor Gray
Write-Host "  git push origin --delete $branchName" -ForegroundColor Gray
Write-Host ""
