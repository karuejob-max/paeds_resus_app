# Staging branch setup (PSOT §10)

**PSOT:** [PLATFORM_SOURCE_OF_TRUTH.md §10](./PLATFORM_SOURCE_OF_TRUTH.md) — today **single production**; when staging exists, **`develop` → staging**, **`main` → production**.

This document is an **operational checklist**. It does not change PSOT.

---

## 1. Repository

1. Create long-lived branch **`develop`** from current `main` (or default trunk policy your team uses).
2. Protect **`main`** (**enabled 2026-05-18** via GitHub API): require PR (0 approvals — CI is the gate), required status check **`gate`** (workflow `CI`), strict up-to-date, no force-push, admins included. Re-apply from `scripts/github-branch-protection-main.json` if settings are reset:  
   `gh api -X PUT repos/karuejob-max/paeds_resus_app/branches/main/protection --input scripts/github-branch-protection-main.json`
3. Protect **`develop`**: same checks where possible; allow fast iteration.

---

## 2. Hosting (e.g. Render — adjust for your provider)

1. **Production service:** deploy from **`main`** (existing).
2. **Staging service:** new Web Service, deploy from **`develop`**, **distinct** `DATABASE_URL` (staging DB)—never point staging at production MySQL.
3. Set **`APP_BASE_URL`**, **`VITE_TRPC_URL`** (if used), **`JWT_SECRET`**, **`OWNER_OPEN_ID`**, M-Pesa/Daraja keys to **sandbox** or non-production values on staging.
4. Optional: subdomain `staging.paedsresus.com` or provider default URL.

---

## 3. Release flow

1. Feature branches merge → **`develop`** → verify on **staging URL**.
2. When ready for production: PR **`develop` → `main`**, verify `ci:gate` + smoke on staging, then merge and deploy production.
3. Use the repository **pull request template** (`.github/pull_request_template.md`) so risky areas (auth, payments, migrations) are explicitly checked.

---

## 4. Database

1. Run Drizzle migrations against **staging DB** before or with first staging deploy.
2. Never run experimental migrations only against production.

---

## 5. When complete

Update **PSOT §10** only when leadership confirms staging is live (single sentence: “Staging environment available at …”). Until then PSOT remains accurate: **no staging yet**.
