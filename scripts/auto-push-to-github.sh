#!/bin/bash

# Auto-push to GitHub after Manus checkpoint saves
# This script is called after webdev_save_checkpoint completes

set -e

PROJECT_DIR="/home/ubuntu/paeds_resus_app"
SSH_KEY="$HOME/.ssh/id_ed25519"
GITHUB_REPO="git@github.com:karuejob-max/paeds_resus_app.git"

cd "$PROJECT_DIR"

# Ensure SSH key is available
if [ ! -f "$SSH_KEY" ]; then
    echo "⚠️  SSH key not found at $SSH_KEY"
    exit 1
fi

# Configure git SSH
export GIT_SSH_COMMAND="ssh -i $SSH_KEY -o StrictHostKeyChecking=no"

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Check if there are unpushed commits
UNPUSHED=$(git rev-list --count origin/$BRANCH..$BRANCH 2>/dev/null || echo "0")

if [ "$UNPUSHED" -gt 0 ]; then
    echo "📤 Pushing $UNPUSHED commit(s) to GitHub ($BRANCH)..."
    
    if git push origin $BRANCH; then
        echo "✅ Successfully pushed to GitHub"
        echo "🚀 Render webhook triggered — paedsresus.com will update shortly"
    else
        echo "❌ Failed to push to GitHub"
        exit 1
    fi
else
    echo "✓ No unpushed commits"
fi
