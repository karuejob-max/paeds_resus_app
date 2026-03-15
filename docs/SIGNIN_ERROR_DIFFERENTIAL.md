# Sign-in error — differential diagnosis

**Presenting error (user):**  
"Failed query: select `id`, `openId`, `name`, `email`, `phone`, `loginMethod`, `passwordHash`, `role`, `providerType`, `userType`, `createdAt`, `updatedAt`, `lastSignedIn` from `users` where `users`.`email` = ? limit ? params: karuejob@gmail.com, 1"

**Meaning:** The app runs this query during login to fetch the user by email. Something causes that query to fail (or the connection to the DB to fail before/during it).

---

## What we know so far

| Finding | Detail |
|--------|--------|
| **When it happens** | On sign-in (login with email/password). |
| **Query** | `SELECT ... FROM users WHERE email = ?` (correct SQL for login). |
| **`.env` vs Aiven** | `DATABASE_URL` in `.env` matches Aiven Service URI exactly (host, port 10359, ssl-mode=REQUIRED). No typo. |
| **Internet (this machine)** | Works. `Test-NetConnection google.com -Port 443` → TcpTestSucceeded : True. |
| **DNS (this machine)** | Hostname `karuejob-dbmysql-karuejob-paeds-resus.a.aivencloud.com` does **not** resolve. |
| **DNS with Google (8.8.8.8)** | Same: "Non-existent domain". So the hostname is not in public DNS. |
| **Fix-users script** | `pnpm db:fix-users` was run from this machine → failed with `getaddrinfo ENOTFOUND` (could not resolve DB host). So this machine cannot reach the DB. |
| **Code change** | `getUserByEmail` in `server/db.ts` now catches "Unknown column" and suggests running `pnpm db:fix-users`. |

---

## Differential diagnosis

### Ruled OUT

| Cause | Why ruled out |
|-------|----------------|
| **Wrong or mistyped `DATABASE_URL`** | User confirmed it matches Aiven Service URI character-for-character. |
| **Only this PC’s DNS (router)** | Tested with Google DNS (8.8.8.8); hostname still "Non-existent domain". So not just router DNS. |
| **No internet** | google.com:443 connects from this machine. |
| **Wrong port** | Port 10359 is in the URL and matches Aiven (non-default port). |

---

### Ruled IN (confirmed or very likely)

| Cause | Evidence |
|-------|----------|
| **Database hostname not in public DNS** | nslookup fails with both router DNS and 8.8.8.8. So the Aiven hostname is either private, or different from what we’re using, or public access is off. |
| **This machine cannot reach the DB** | `pnpm db:fix-users` from this machine fails with ENOTFOUND. So any app or script running on this same machine that uses `DATABASE_URL` will also fail to connect. |
| **Sign-in failure is due to DB unreachable or query failing** | Login needs a successful `getUserByEmail` (that same query). If the server can’t connect (e.g. same ENOTFOUND) or the query fails (e.g. missing column), the client sees "Failed query" with that SQL. |

---

### Still possible (not ruled out)

| Cause | Status |
|-------|--------|
| **Missing columns on `users` table** | Likely in play if the app *does* connect somewhere. Schema expects e.g. `passwordHash`, `userType`, `phone`, `providerType`. If any are missing, MySQL returns an error and the query "fails". We have not been able to run `pnpm db:fix-users` from this machine to fix or confirm. |
| **App runs in a different environment** | If you run `pnpm dev` (or the app) on another machine/network where the Aiven hostname *does* resolve or where a different `DATABASE_URL` is used, then "Failed query" there could be **only** schema (missing columns), not DNS. |
| **Aiven service is private / no public access** | Would explain why the hostname doesn’t resolve in public DNS. Then you must use Aiven’s intended way to connect (e.g. their web SQL console, or a network that has access). |

---

## Summary table

| Diagnosis | Ruled out? | Ruled in? |
|-----------|------------|-----------|
| Typo or wrong `DATABASE_URL` | Yes | — |
| Router/local DNS only | Yes | — |
| No internet | Yes | — |
| DB hostname not in public DNS | — | Yes |
| This machine cannot reach DB | — | Yes |
| Missing columns on `users` | No | Possible (if app can connect) |
| Aiven service private / no public access | No | Possible |

---

## Recommended next steps

1. **In Aiven Console:** Confirm whether the MySQL service has **public access** and what the **exact** hostname and (if shown) **public IP** are. Enable public access if you need to connect from this PC.
2. **If an IP is shown:** Add a hosts entry on this machine so the hostname resolves to that IP; then run `pnpm db:fix-users` again.
3. **If the service is private:** Don’t rely on this machine reaching it. Run the SQL in `drizzle/fix-users-columns-manual.sql` from a place that can connect (e.g. Aiven web SQL console).
4. **After the DB is reachable and schema is fixed:** Try sign-in again; if it still fails, the next error message (e.g. "Unknown column" or a new message) will narrow it further.
