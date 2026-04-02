# Staging Deployment Guide

**Purpose:** Document the branch model, manual deploy workflow, staging setup, and rollback procedures for Paeds Resus platform.

**Status:** Phase 2 — Staging environment documentation (develop → staging, main → production).

---

## Branch Model

| Branch | Purpose | Deploys to | Audience |
|--------|---------|-----------|----------|
| `main` | Production-ready code | Production (Render) | End users (providers, parents, institutions) |
| `develop` | Staging/testing code | Staging (Render) | Internal QA, team testing |
| Feature branches | Work in progress | None (local + PR review) | Developer |

**Workflow:**
1. Create feature branch from `develop`: `git checkout -b feature/your-feature develop`
2. Push to GitHub and create PR against `develop`
3. Verify on staging (after merge to develop)
4. When staging is validated, create PR from `develop` → `main`
5. Merge to `main` and deploy to production

---

## Manual Deploy Workflow

### Prerequisites

- Access to Render dashboard (https://render.com)
- Access to Aiven dashboard (https://aiven.io)
- GitHub push access to main/develop branches
- Environment variables configured for each environment

### Deploy to Staging (develop → staging Render)

**Step 1: Merge to develop**
```bash
git checkout develop
git pull github develop
git merge --no-ff feature/your-feature
git push github develop
```

**Step 2: Trigger staging deploy on Render**
- Go to Render dashboard → Paeds Resus Staging service
- Click "Manual Deploy" or wait for auto-deploy (if webhook is configured)
- Monitor build logs at https://dashboard.render.com/services/[staging-service-id]
- Verify deployment: https://staging.paedsresus.com (or your staging domain)

**Step 3: QA Testing on Staging**
- Test the feature on staging environment
- Verify database changes with staging Aiven instance
- Check admin reports, user flows, and edge cases
- Document any issues in GitHub PR

**Step 4: Promote to main (if staging passes)**
```bash
git checkout main
git pull github main
git merge --no-ff develop
git push github main
```

### Deploy to Production (main → production Render)

**Step 1: Verify main is ready**
```bash
git log --oneline github/main -5
# Confirm latest commits are the ones you want in production
```

**Step 2: Trigger production deploy on Render**
- Go to Render dashboard → Paeds Resus Production service
- Click "Manual Deploy" or wait for auto-deploy
- Monitor build logs
- Verify deployment: https://paedsresus.com

**Step 3: Post-deployment validation**
- Check production health: `/api/health` endpoint (if available)
- Verify admin reports show data from production Aiven
- Spot-check key user flows (login, ResusGPS assessment, admin dashboard)
- Monitor error logs for 30 minutes post-deploy

---

## Staging Environment Setup

### Render Staging Service

**Configuration:**
- **Service name:** Paeds Resus Staging
- **Repository:** karuejob-max/paeds_resus_app
- **Branch:** `develop`
- **Build command:** `pnpm install && pnpm run build`
- **Start command:** `node dist/server.js` (or as configured in package.json)
- **Environment variables:** (see below)

**Environment Variables for Staging:**
```
NODE_ENV=production
DATABASE_URL=mysql://[user]:[pass]@[staging-aiven-host]:3306/[staging-db-name]
JWT_SECRET=[staging-jwt-secret]
VITE_APP_ID=[your-app-id]
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=[your-oauth-portal-url]
OWNER_OPEN_ID=[your-open-id]
OWNER_NAME=[your-name]
BUILT_IN_FORGE_API_KEY=[staging-api-key]
BUILT_IN_FORGE_API_URL=[staging-api-url]
VITE_FRONTEND_FORGE_API_KEY=[staging-frontend-key]
VITE_FRONTEND_FORGE_API_URL=[staging-api-url]
VITE_ANALYTICS_ENDPOINT=[staging-analytics-endpoint]
VITE_ANALYTICS_WEBSITE_ID=[staging-website-id]
```

### Aiven Staging Database

**Configuration:**
- **Service name:** paeds-resus-staging (separate from production)
- **Type:** MySQL 8.0 (same version as production)
- **Plan:** Same as production (for realistic testing)
- **Backups:** Daily (7-day retention)

**Setup:**
1. Create new Aiven MySQL service named `paeds-resus-staging`
2. Create database: `paeds_resus_staging`
3. Create user with full privileges on staging database
4. Note connection string: `mysql://user:pass@host:port/paeds_resus_staging`
5. Add to Render staging service as `DATABASE_URL`

**Schema sync:**
```bash
# Run migrations on staging database
DATABASE_URL=[staging-connection-string] pnpm db:push
```

### Domain Configuration

**Staging domain:** `staging.paedsresus.com` (or `staging-paeds.render.com` if custom domain not set up)

**DNS (if using custom domain):**
- Add CNAME: `staging.paedsresus.com` → `[render-staging-domain]`
- Or use Render's auto-generated domain

---

## Weekly discipline (operator checklist)

Use this so **develop → staging → main** stays predictable (CEO priority #2: staging before production).

1. **Sync branches:** `git fetch`; ensure `develop` contains merged feature work intended for QA; no long-lived drift from `main` without intent.
2. **Staging deploy:** After merge to `develop`, confirm Render (or CI) deployed staging; open staging URL and smoke-test login.
3. **Measurement (Sprint 1):** On staging DB, run `pnpm run verify:analytics` with staging `DATABASE_URL` (optional `VERIFY_LAST_DAYS=7`). Confirm event types appear after test journeys.
4. **Admin Reports:** Log in as admin on staging → Reports → confirm **App & Paeds Resus activity** and **ResusGPS** counts match expectations for the rolling window.
5. **Promote:** Only when staging passes, open PR **develop → main**, merge, deploy production, repeat post-deploy validation (see above).

---

## PR Verification Workflow

### Before Merging develop → main

1. **Code review:** At least one approval on GitHub PR
2. **Staging validation:** Feature tested on staging environment
3. **Database migration check:** If schema changed, verify `pnpm db:push` succeeds on staging
4. **Admin reports:** If analytics added, verify events appear in admin reports on staging
5. **Security check:** If auth/secrets changed, verify no credentials in logs
6. **Documentation:** Update WORK_STATUS.md and relevant docs

### Checklist for PR approval

```markdown
- [ ] Code review completed
- [ ] Feature tested on staging
- [ ] Database migrations pass on staging
- [ ] Analytics events visible in staging admin reports (if applicable)
- [ ] No sensitive data in logs or commits
- [ ] Documentation updated (WORK_STATUS.md, etc.)
- [ ] Ready for production
```

---

## Rollback Procedure

### If production deploy breaks

**Immediate action (within 5 minutes):**
```bash
# Revert main to previous commit
git log --oneline github/main -5
git revert [bad-commit-hash]
git push github main
```

**On Render:**
1. Go to production service
2. Click "Manual Deploy"
3. Render will deploy the reverted commit
4. Verify production is stable

**Post-rollback:**
1. Investigate what went wrong
2. Fix in feature branch from `develop`
3. Re-test on staging
4. Re-deploy to production

### If staging deploy breaks

No user impact. Simply:
1. Fix in feature branch
2. Push to `develop`
3. Render will auto-redeploy
4. Or manually trigger "Manual Deploy" on staging service

---

## Monitoring and Alerts

### Production Monitoring

- **Error logs:** Check Render logs for 500 errors
- **Database:** Monitor Aiven CPU, memory, connections
- **Admin reports:** Verify analytics events are flowing
- **User reports:** Monitor Slack/email for user-reported issues

### Staging Monitoring

- Less critical, but check for:
  - Build failures (indicates code issue)
  - Database connection errors (indicates schema/env issue)
  - Analytics events (if testing new events)

---

## Troubleshooting

### Build fails on Render

**Check:**
1. `pnpm install` succeeds locally: `pnpm install`
2. `pnpm run build` succeeds locally: `pnpm run build`
3. All environment variables are set in Render
4. Node version matches (check package.json engines)

**Fix:**
```bash
# Locally
pnpm install
pnpm run build
# If it works locally but not on Render, check env vars in Render dashboard
```

### Database migration fails

**Check:**
1. Connection string is correct: `mysql://user:pass@host:port/db`
2. User has privileges on database
3. Schema is compatible with Drizzle ORM version

**Fix:**
```bash
# Locally with staging DB
DATABASE_URL=[staging-connection-string] pnpm db:push
# If it works locally, Render will succeed too
```

### Analytics events not appearing in admin reports

**Check:**
1. Events are being tracked in ResusGPS (check browser console)
2. Events router is working: `/api/trpc/events.trackEvent`
3. analyticsEvents table exists in database
4. Admin reports query is correct

**Fix:**
```bash
# Verify table exists
mysql -u [user] -p [staging-db-name]
SHOW TABLES LIKE 'analyticsEvents';
DESC analyticsEvents;
```

---

## Future: GitHub Actions Automation

When ready, automate:
- Auto-deploy develop → staging on push
- Auto-deploy main → production on push
- Run tests on PR before allowing merge
- Slack notifications on deploy success/failure

See `GITHUB_ACTIONS_AUTOMATION.md` (to be created) for implementation.

---

## Questions?

- **Deployment issue:** Check Render logs and this guide's troubleshooting section
- **Database issue:** Check Aiven dashboard and connection string
- **Code issue:** Check local build and test before pushing
- **Process issue:** Update this doc and commit the change

---

Last updated: 2025-03-07 (Phase 2 documentation)
