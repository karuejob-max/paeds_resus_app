#!/bin/bash

# Git Sync Script: Sync Manus local with GitHub main
# Purpose: Ensure Manus agent is always in sync with GitHub source of truth
# Usage: ./scripts/sync-with-github.sh
# Author: Manus Agent
# Date: March 25, 2026

set -e

echo "🔄 Syncing Manus workspace with GitHub main..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get current directory
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "📍 Repository: $REPO_ROOT"
echo ""

# Step 1: Check current git state
echo "📊 Current git state:"
echo "   Remote: $(git remote get-url origin)"
echo "   Branch: $(git rev-parse --abbrev-ref HEAD)"
echo "   Commit: $(git rev-parse --short HEAD)"
echo ""

# Step 2: Add GitHub as secondary remote if not exists
if ! git remote get-url github &>/dev/null; then
    echo "➕ Adding GitHub as secondary remote..."
    git remote add github https://github.com/karuejob-max/paeds_resus_app.git
    echo "✅ GitHub remote added"
else
    echo "✅ GitHub remote already configured"
fi
echo ""

# Step 3: Fetch latest from GitHub
echo "⬇️  Fetching latest from GitHub..."
git fetch github main
echo "✅ Fetch complete"
echo ""

# Step 4: Check for divergence
echo "🔍 Checking for divergence..."
BEHIND=$(git rev-list --count origin/main..github/main 2>/dev/null || echo "0")
AHEAD=$(git rev-list --count github/main..origin/main 2>/dev/null || echo "0")

if [ "$BEHIND" -eq 0 ] && [ "$AHEAD" -eq 0 ]; then
    echo "✅ Local is in sync with GitHub"
elif [ "$BEHIND" -gt 0 ]; then
    echo "${YELLOW}⚠️  Local is $BEHIND commits behind GitHub${NC}"
    echo "   Will merge GitHub changes..."
else
    echo "${YELLOW}⚠️  Local is $AHEAD commits ahead of GitHub${NC}"
    echo "   This is unusual. Verify before pushing."
fi
echo ""

# Step 5: Merge if behind
if [ "$BEHIND" -gt 0 ]; then
    echo "🔀 Merging GitHub main into local..."
    git merge github/main
    echo "✅ Merge complete"
    echo ""
fi

# Step 6: Verify sync
echo "✔️  Final verification:"
echo "   Branch: $(git rev-parse --abbrev-ref HEAD)"
echo "   Commit: $(git rev-parse --short HEAD)"
echo "   Latest: $(git log -1 --pretty=format:'%h - %s')"
echo ""

# Step 7: Summary
if [ "$BEHIND" -gt 0 ]; then
    echo "${GREEN}✅ Sync complete! Local is now in sync with GitHub.${NC}"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Run: webdev_save_checkpoint \"Synced with GitHub main\""
    echo "   2. Verify changes: git status"
    echo "   3. Continue with analysis/work"
else
    echo "${GREEN}✅ Already in sync with GitHub!${NC}"
    echo ""
    echo "📝 You can proceed with analysis/work"
fi
echo ""
