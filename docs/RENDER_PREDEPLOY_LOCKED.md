# Pre-Deploy Command is locked on Render

## enrollments.courseId (migration 0029)

If production shows **`Unknown column 'courseId' in 'field list'`** on **`enrollments`** (often when completing enrollment on `/enroll`), the database is behind the app: PALS micro-courses need a nullable `courseId` on `enrollments`.

**Fix (one-time):** From any machine that can reach the DB with the same `DATABASE_URL` as production:

```bash
DATABASE_URL="mysql://..." pnpm run db:apply-0029
```

Or run **`pnpm run db:apply-0029`** in a **Render Shell** (if enabled) with env already set. The script is idempotent.

Equivalent raw SQL: `ALTER TABLE enrollments ADD COLUMN courseId int NULL` (see `scripts/apply-0029-enrollments-course-id.mjs`).

---

## certificateDownloadFeedback (migration 0030)

If production shows **`Table '…certificateDownloadFeedback' doesn't exist'`** (often when downloading a certificate after the feedback gate shipped), run:

```bash
DATABASE_URL="mysql://..." pnpm run db:apply-0030
```

Or run **`pnpm run db:apply-0030`** in a **Render Shell** with env already set. The script is idempotent.

Equivalent SQL: `drizzle/0030_certificate_download_feedback.sql`.

---

## careSignalEvents (migration 0031)

If production logs show **`Table '…careSignalEvents' doesn't exist'`** when submitting **Care Signal**, run:

```bash
DATABASE_URL="mysql://..." pnpm run db:apply-0031
```

Or **`pnpm run db:apply-0031`** in a Render Shell. Script is idempotent.

Equivalent SQL: `drizzle/0031_care_signal_events.sql`.

---

## certificates.renewalReminderSentAt (migration 0026)

If production logs show **`Unknown column 'renewalReminderSentAt' in 'field list'`** on `certificates`, the Aiven/MySQL schema is behind the app (HI-CERT-1 renewal dedupe column).

**Fix (one-time):** From any machine that can reach the DB with the same `DATABASE_URL` as Render:

```bash
DATABASE_URL="mysql://..." pnpm run db:apply-0026
```

Or run **`pnpm run db:apply-0026`** in a Render **Shell** (if enabled) with env already set. The script is idempotent.

Equivalent raw SQL: `drizzle/0026_certificate_renewal_reminder_sent_at.sql`.

---

The Pre-Deploy Command field shows a lock icon and cannot be edited. Common causes:

1. **Managed by Blueprint** – Service is controlled by a `render.yaml`. Edit the YAML in the repo.
2. **Plan restriction** – Pre-Deploy may require a paid plan on some accounts.

Below are workarounds to run the users-table fix script without using Pre-Deploy.

---

## Workaround A: Run the script in the Build Command (one-time)

Temporarily add the fix script to your **Build Command** so it runs during the next deploy.

1. In Render Dashboard → your Web Service → **Settings** → **Build & Deploy**.
2. Find **Build Command** (must be editable).
3. If your current command is something like:
   ```bash
   pnpm install && pnpm build
   ```
   change it to:
   ```bash
   pnpm install && node server/fix-users-columns.mjs || true && pnpm build
   ```
   The `|| true` means: if the script fails (e.g. DB unreachable), the build still continues so the deploy doesn’t get stuck.
4. Save and trigger a **Manual Deploy**.
5. Check the **build logs**. If you see `[fix-users-columns] Done`, the migration ran.
6. After that deploy, **revert** the Build Command back to your original (remove `node server/fix-users-columns.mjs || true &&`) so future builds don’t run it every time.

---

## Workaround B: One-off Background Worker

Run the script once as a separate service, then remove it.

1. In Render Dashboard, click **New +** → **Background Worker**.
2. Connect the same repo and branch as your web service.
3. **Build Command:** `pnpm install` (or `npm install`).
4. **Start Command:** `node server/fix-users-columns.mjs`
5. Add the same **Environment** variables as your web service (at least `DATABASE_URL`).
6. Create the worker and let it deploy. It will run the script; the process may exit when done.
7. Check the worker’s **Logs** for `[fix-users-columns] Done`.
8. Once confirmed, you can delete the Background Worker service.

---

## If you want to use Pre-Deploy via Blueprint

If the lock is because the service is “Managed by Blueprint”, you can add a `render.yaml` in the repo root so the Blueprint (and thus Pre-Deploy) is under your control. See the Render [Blueprint spec](https://render.com/docs/blueprint-spec) and add `preDeployCommand: node server/fix-users-columns.mjs` to your web service in that file. After you push and the service syncs from the Blueprint, the Pre-Deploy value will come from the YAML.
