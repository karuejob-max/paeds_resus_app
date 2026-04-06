# Tier 2.5: Practical Collaboration Infrastructure

**Status:** Active  
**Date:** 2026-04-06  
**Purpose:** Enable real-time collaboration between Job (local), Manus (sandbox), and the team.

---

## What is Tier 2.5?

Tier 2.5 is a **pragmatic collaboration setup** that provides 80-85% of Tier 3 benefits without the complexity of real-time file sync:

- ✅ **Shared Aiven Database** — No divergence between local and sandbox
- ✅ **Render API Monitoring** — Real-time deployment alerts
- ✅ **GitHub Source of Truth** — Single git history
- ✅ **Slack Integration** — Team notifications
- ✅ **ngrok Tunnel** — Remote testing of local changes
- ✅ **Sync Scripts** — Manual but reliable synchronization

---

## Quick Start (5 minutes)

### Step 1: Verify Shared Database
```bash
echo $DATABASE_URL
# Should show: mysql://user:pass@aiven-host.aivencloud.com:port/paeds_resus
```

### Step 2: Start Local Dev Server
```bash
cd /path/to/paeds_resus_app
pnpm run dev
# Output: Server running on http://localhost:3000/
```

### Step 3: Expose with ngrok
```bash
# In a new terminal
ngrok http 3000
# Output: Forwarding https://abc123.ngrok.io -> http://localhost:3000
```

### Step 4: Share URL with Manus
```
"My local dev server is at https://abc123.ngrok.io"
```

### Step 5: Sync When Ready
```bash
./scripts/tier2-5-sync.sh
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ You (Local Machine)                                             │
│ ├─ VS Code / Cursor                                             │
│ ├─ pnpm run dev (localhost:3000)                                │
│ ├─ ngrok tunnel (https://abc123.ngrok.io)                       │
│ └─ Aiven MySQL                                                  │
└─────────────────────────────────────────────────────────────────┘
           │
           │ git push
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ GitHub (Single Source of Truth)                                 │
│ ├─ karuejob-max/paeds_resus_app                                 │
│ └─ All changes tracked                                          │
└─────────────────────────────────────────────────────────────────┘
           │
           │ git pull
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Manus (Sandbox)                                                 │
│ ├─ Reads latest code                                            │
│ ├─ Runs tests                                                   │
│ ├─ Validates changes                                            │
│ ├─ Accesses your local dev server via ngrok                     │
│ └─ Aiven MySQL (same database)                                  │
└─────────────────────────────────────────────────────────────────┘
           │
           │ Render API monitoring
           │ + Slack webhooks
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Render (Production)                                             │
│ ├─ paedsresus-mhrec3b6.manus.space                              │
│ ├─ Real users, real data                                        │
│ └─ Monitored by Render API + Slack alerts                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Workflow Example

### Scenario: You build offline-first ResusGPS locally

**Step 1: Local Development**
```bash
# Terminal 1: Start dev server
pnpm run dev
# Server running on http://localhost:3000/

# Terminal 2: Expose with ngrok
ngrok http 3000
# Forwarding https://abc123.ngrok.io -> http://localhost:3000
```

**Step 2: Tell Manus to Test**
```
"I've built offline-first ResusGPS. Test it at https://abc123.ngrok.io

Test cases:
- Open ResusGPS without internet
- Check if protocols load from cache
- Validate Safe-Truth submissions queue for sync"
```

**Step 3: Manus Tests and Validates**
- Accesses your local dev server via ngrok
- Runs tests in sandbox
- Finds bugs, suggests improvements
- Commits fixes to GitHub

**Step 4: You Sync and Deploy**
```bash
# Sync your local changes to GitHub
./scripts/tier2-5-sync.sh --message "feat: offline-first ResusGPS"

# Deploy to production
./scripts/tier2-5-sync.sh --deploy
```

**Step 5: Monitor Deployment**
- Render API monitoring checks deployment status
- Slack alerts if anything fails
- You see real-time logs in Slack

---

## Scripts

### tier2-5-sync.sh
Sync local changes to GitHub and optionally deploy to Render.

```bash
# Just sync to GitHub
./scripts/tier2-5-sync.sh

# Sync and deploy to production
./scripts/tier2-5-sync.sh --deploy

# Sync with custom commit message
./scripts/tier2-5-sync.sh --message "feat: offline-first"
```

**What it does:**
1. Stages all changes
2. Commits with auto-generated or custom message
3. Pushes to GitHub
4. (Optional) Triggers Render deployment
5. Sends Slack notification

### tier2-5-render-monitor.mjs
Monitor Render deployments and alert on failures.

```bash
# Run manually
node scripts/tier2-5-render-monitor.mjs

# Or schedule via cron (every 5 minutes)
*/5 * * * * cd /path/to/paeds_resus_app && node scripts/tier2-5-render-monitor.mjs
```

---

## Environment Variables

| Variable | Purpose | Where to Get |
|----------|---------|-------------|
| `DATABASE_URL` | Aiven MySQL connection | In BYOK (already set) |
| `RENDER_API_TOKEN` | Render deployment API | In BYOK (already set) |
| `SLACK_WEBHOOK_URL` | Slack notifications | In BYOK (already set) |
| `RENDER_SERVICE_ID` | Your Render service ID | Render dashboard |
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook verification | (Optional) |

---

## Troubleshooting

### Database divergence (local ≠ sandbox)

**Symptom:** Schema mismatch, migration errors

**Fix:**
```bash
# Both local and sandbox should use same DATABASE_URL
echo $DATABASE_URL
# Should be: mysql://user:pass@aiven-host.aivencloud.com:port/paeds_resus

# If different, update .env
DATABASE_URL=mysql://user:pass@aiven-host.aivencloud.com:port/paeds_resus
```

### ngrok tunnel not working

**Symptom:** "Connection refused" when Manus tries to access local server

**Fix:**
```bash
# Make sure local dev server is running
pnpm run dev

# Make sure ngrok is connected
ngrok http 3000

# Test the tunnel
curl https://abc123.ngrok.io/
# Should return your app HTML
```

### Slack notifications not sending

**Symptom:** No alerts in Slack

**Fix:**
```bash
# Check webhook URL is set
echo $SLACK_WEBHOOK_URL

# Test webhook manually
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  $SLACK_WEBHOOK_URL
```

### Render deployment fails

**Symptom:** Deployment triggered but failed

**Fix:**
```bash
# Check Render logs
# Go to: https://dashboard.render.com → Your Service → Logs

# Common issues:
# - Missing environment variables
# - Database migration failed
# - Build errors (TypeScript, dependencies)
# - Port already in use

# Rollback to previous deployment
# Go to: https://dashboard.render.com → Your Service → Deployments
# Click "Redeploy" on the previous successful deployment
```

---

## Team Coordination

### WORK_STATUS.md

Update this file when you start/complete work:

```markdown
## Done

| Date | Who | What | Commit |
|------|-----|------|--------|
| 2026-04-06 | Job | Offline-first ResusGPS | abc123 |

## In Progress

| Date | Who | What | Blocker |
|------|-----|------|---------|
| 2026-04-06 | Manus | Testing offline scenarios | None |

## Blocked

| Date | Who | What | Reason |
|------|-----|------|--------|
| 2026-04-06 | Cursor | M-Pesa integration | Waiting for credentials |
```

### Slack Notifications

All team activity flows through Slack:
- ✅ Push events (you committed code)
- ✅ Deployment events (code went live)
- ✅ Render errors (production broke)
- ✅ Test failures (Manus found a bug)

---

## Tier 2.5 vs Tier 3

| Feature | Tier 2.5 | Tier 3 |
|---------|----------|--------|
| **Real-time file sync** | Manual (git-based) | Automatic (file watcher) |
| **See edits as you type** | No (batch via commits) | Yes (live updates) |
| **Shared database** | ✅ Yes | ✅ Yes |
| **Deployment monitoring** | ✅ Yes | ✅ Yes |
| **Team notifications** | ✅ Yes | ✅ Yes |
| **Local dev access** | ✅ Yes (ngrok) | ✅ Yes |
| **Setup complexity** | Low (2-3 hours) | High (1-2 days) |
| **Effectiveness** | 80-85% | 95%+ |

**Recommendation:** Start with Tier 2.5. If you need Tier 3, we can upgrade later.

---

## Next Steps

1. **Verify setup:**
   ```bash
   echo $DATABASE_URL  # Should show Aiven URL
   pnpm run dev        # Should start on localhost:3000
   ```

2. **Start ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Share URL with Manus:**
   ```
   "My local dev server is at https://abc123.ngrok.io"
   ```

4. **Start building:**
   - Make changes locally
   - Test with ngrok tunnel
   - Sync to GitHub when ready
   - Deploy to production

5. **Monitor:**
   - Watch Slack for notifications
   - Check Render logs for errors
   - Review WORK_STATUS.md for team progress

---

**Last updated:** 2026-04-06  
**Maintained by:** Manus + Job  
**Status:** Active and tested
