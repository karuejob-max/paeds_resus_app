# Render Environment Variables Setup

This guide explains how to configure environment variables in Render for the Paeds Resus application.

## Overview

The application uses environment variables for configuration. These are managed in Manus Settings but need to be synced to Render for deployment.

## Current Environment Variables

| Variable | Current Value | Purpose |
|----------|---------------|---------|
| `VITE_APP_TITLE` | Paeds Resus | Website display name |
| `VITE_APP_LOGO` | https://files.manuscdn.com/user_upload_by_module/web_dev_logo/310519663302160278/YsmPcJxJApiXFSbZ.png | Logo URL |
| `DATABASE_URL` | [Set in Manus] | MySQL database connection |
| `VITE_APP_ID` | [Set in Manus] | OAuth application ID |
| `OAUTH_SERVER_URL` | https://api.manus.im | OAuth server endpoint |
| `VITE_OAUTH_PORTAL_URL` | [Set in Manus] | OAuth login portal |
| `JWT_SECRET` | [Set in Manus] | Session signing secret |
| `BUILT_IN_FORGE_API_URL` | [Set in Manus] | Manus API endpoint |
| `BUILT_IN_FORGE_API_KEY` | [Set in Manus] | Manus API key |
| `VITE_FRONTEND_FORGE_API_URL` | [Set in Manus] | Frontend API endpoint |
| `VITE_FRONTEND_FORGE_API_KEY` | [Set in Manus] | Frontend API key |
| `OWNER_NAME` | Job Karue | Project owner name |
| `OWNER_OPEN_ID` | [Set in Manus] | Owner's OpenID |
| `VITE_ANALYTICS_ENDPOINT` | [Set in Manus] | Analytics service URL |
| `VITE_ANALYTICS_WEBSITE_ID` | [Set in Manus] | Analytics website ID |

## How to Update Render Environment Variables

### Step 1: Access Render Dashboard
1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Select your service (paeds_resus_app)
3. Go to **Settings** → **Environment**

### Step 2: Update Variables
1. Click **Add Environment Variable**
2. Enter the variable name and value
3. Click **Save**

### Step 3: Trigger Redeploy
1. Go to **Deploys** tab
2. Click **Deploy latest commit** or wait for auto-redeploy
3. Service will redeploy with new env vars

## Syncing Changes

**When you update env vars in Manus:**
1. Update the corresponding variable in Render dashboard
2. Render auto-redeploys
3. paedsresus.com updates with new values

**Example:** If you change the website name in Manus:
- Update `VITE_APP_TITLE` in Render
- Render redeploys
- paedsresus.com shows the new name

## Automation (Optional)

To automate env var syncing, consider:
- Using Render's API to update variables programmatically
- Creating a GitHub Actions workflow that updates Render on changes
- Using Render's native environment variable sync features

For now, manual updates in the Render dashboard are recommended.

## Troubleshooting

**Changes not showing on paedsresus.com?**
1. Verify the env var was saved in Render
2. Check that Render redeploy completed successfully
3. Clear browser cache (Ctrl+Shift+Delete)
4. Wait 1-2 minutes for CDN to update

**Env var not found error?**
1. Ensure the variable is set in Render dashboard
2. Check the variable name spelling (case-sensitive)
3. Restart the service in Render
