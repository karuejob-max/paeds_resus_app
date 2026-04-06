#!/bin/bash

###############################################################################
# Tier 2.5: Local-to-Sandbox Sync Script
#
# Synchronizes your local changes to GitHub and optionally deploys to Render.
#
# Usage:
#   ./scripts/tier2-5-sync.sh [--deploy] [--message "commit message"]
#
# Examples:
#   ./scripts/tier2-5-sync.sh                    # Just sync to GitHub
#   ./scripts/tier2-5-sync.sh --deploy           # Sync and deploy to production
#   ./scripts/tier2-5-sync.sh --message "feat: offline-first"
#
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DEPLOY=false
CUSTOM_MESSAGE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --deploy)
      DEPLOY=true
      shift
      ;;
    --message)
      CUSTOM_MESSAGE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

log_info() {
  echo -e "${BLUE}[Tier 2.5]${NC} $1"
}

log_success() {
  echo -e "${GREEN}✅${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠️${NC} $1"
}

log_error() {
  echo -e "${RED}❌${NC} $1"
}

send_slack_notification() {
  local message=$1
  local status=$2
  local webhook="${SLACK_WEBHOOK_URL}"

  if [ -z "$webhook" ]; then
    return
  fi

  local emoji="📤"
  [ "$status" = "success" ] && emoji="✅"
  [ "$status" = "error" ] && emoji="🚨"

  curl -s -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"${emoji} Tier 2.5 Sync: ${message} (${status})\"}" \
    "$webhook" > /dev/null 2>&1 || true
}

main() {
  log_info "Starting Tier 2.5 sync workflow..."

  # Check git status
  log_info "Checking git status..."
  if ! git diff-index --quiet HEAD --; then
    log_warning "Uncommitted changes detected"
  fi

  # Determine commit message
  if [ -z "$CUSTOM_MESSAGE" ]; then
    COMMIT_MESSAGE="Tier 2.5 sync: $(date '+%Y-%m-%d %H:%M:%S')"
  else
    COMMIT_MESSAGE="$CUSTOM_MESSAGE"
  fi

  log_info "Commit message: $COMMIT_MESSAGE"

  # Stage and commit
  log_info "Staging changes..."
  git add -A

  if git diff-index --quiet --cached HEAD --; then
    log_warning "No changes to commit"
  else
    log_info "Committing..."
    git commit -m "$COMMIT_MESSAGE" || log_warning "Commit failed"
  fi

  # Push to GitHub
  log_info "Pushing to GitHub..."
  git push origin main || log_error "Push failed"
  log_success "Pushed to GitHub"

  send_slack_notification "Local changes synced to GitHub" "success"

  # Optional deployment
  if [ "$DEPLOY" = true ]; then
    log_info "Deploying to production..."
    
    if [ -z "$RENDER_API_TOKEN" ]; then
      log_error "RENDER_API_TOKEN not set"
      exit 1
    fi

    SERVICE_ID="${RENDER_SERVICE_ID:-}"
    if [ -z "$SERVICE_ID" ]; then
      log_error "RENDER_SERVICE_ID not set"
      exit 1
    fi

    DEPLOY_RESPONSE=$(curl -s -X POST \
      "https://api.render.com/v1/services/${SERVICE_ID}/deploys" \
      -H "Authorization: Bearer ${RENDER_API_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{"clearCache":"do_not_clear"}')

    if echo "$DEPLOY_RESPONSE" | grep -q '"id"'; then
      log_success "Deployment triggered"
      send_slack_notification "Deployment triggered to production" "success"
    else
      log_error "Deployment failed"
      send_slack_notification "Deployment failed" "error"
      exit 1
    fi
  fi

  log_success "Tier 2.5 sync complete!"
}

main
