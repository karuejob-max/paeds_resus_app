# Fellowship / micro-course enrollment disconnect — audit (2026-04-13)

**Symptoms reported:** Fellowship → View courses → Enroll (e.g. Paediatric Asthma) shows **KES 800**, then **M-Pesa does not fire** and error **"Course not found"**. “Test courses” still work elsewhere.

**Verdict:** Your diagnosis is **correct**: the **catalog UI** and **paid enrollment** do not use the same source of truth, and **pricing is not aligned** with the agreed **200 KES** micro-course price in several places.

---

## 1. Why you see “Course not found” (root cause)

Paid enrollment goes through `enrollment.enrollWithPayment` → `getCourseDetails(courseId)` in `server/db-enrollment.ts`, which **only** reads the **`microCourses` MySQL table**.

```52:58:server/db-enrollment.ts
export async function getCourseDetails(courseId: string) {
  try {
    const course = await db
      .select()
      .from(microCourses)
      .where(eq(microCourses.courseId, courseId))
```

If there is **no row** for `asthma-i` (etc.), `getCourseDetails` returns `null` → **`throw new Error("Course not found")`** in `enrollment.ts`.

The Fellowship dashboard lists courses via `trpc.courses.listAll` (`server/routers/courses.ts`). That procedure:

- If **`microCourses` has at least one row**, it returns **only** those DB rows.
- If the table is **empty**, it **falls back** to a hardcoded array `ALL_COURSES` (all 26 courses including `asthma-i`).

So users can **see and click** courses that **do not exist in the database** (empty DB → full fallback list). Payment then **correctly fails** because the DB row is missing.

**“Test courses work”** = those course **slugs exist in `microCourses`** (seeded or inserted). **Fellowship asthma** fails when **that slug is not in the DB** (typical when only partial seed or no seed).

**Who should create them?** **Backend/ops** (or whoever runs migrations): run the existing seed **`server/seed-micro-courses.ts`** (see README / package script if present) against the target `DATABASE_URL` so **every** course id the UI can show has a matching row. **Product** should confirm whether production should show 26 courses or a subset before seeding.

---

## 2. Why you see KES 800 instead of 200

- Hardcoded catalog **`ALL_COURSES`** in `server/routers/courses.ts` uses **`price: 80000`** for foundational micro-courses (stored as **cents**; `80000 / 100 = 800` KES in `EnrollmentModal`).
- The same **80000** values appear in **`server/seed-micro-courses.ts`**.
- **`client/src/const/pricing.ts`** lists other products (BLS/ACLS/PALS, `pals_septic` at **200 KES**) but is **not** the single source for these 26 fellowship micro-courses today.

So the **800 KES** number is **consistent with current code**, but **inconsistent** with your **agreed 200 KES** — that is a **product + code alignment** task (update seed + `ALL_COURSES` + any admin copy; use **20000** cents for 200 KES if the rest of the stack uses cents).

---

## 3. “Disconnected pages” — multiple UIs, not one catalog

| Surface | Router / procedure | Behaviour |
|--------|-------------------|-----------|
| **Fellowship dashboard** | `courses.listAll` | DB or **fallback 26** |
| **Paid enrollment** | `enrollment.enrollWithPayment` + DB only | **DB required** |
| **`CoursesPage.tsx`** | `microCourses.listCourses` | **Stub**: fake septic course + wrong id shape |
| **Learning journeys (CoursesPage)** | Hardcoded `price={800}` + **$** badge via `(price/100)` | Decorative / inconsistent currency labelling |

So M-Pesa can **work** on paths that hit **seeded** `microCourses` rows and **fail** on paths that only show **fallback** or **stub** data.

---

## 4. Did the provider homepage change “break” M-Pesa?

**Not directly.** `Home.tsx` for providers (`userType === individual`) now sends people to **`/fellowship`** or **`/aha-courses`** (`client/src/pages/Home.tsx`). That **increases traffic** to the Fellowship flow where the **list vs DB** bug lives. The regression is **architectural** (catalog vs enrollment), not the homepage **calling** Daraja differently.

---

## 5. Recommendations (agree as a team)

1. **Ship blocker — data:** Ensure **`microCourses`** is seeded for **every** `courseId` exposed in the UI (full `seed-micro-courses` or subset + hide the rest). Re-run on staging/production after deploy.
2. **Ship blocker — code:** Stop showing fallback courses when DB is empty **or** make `getCourseDetails` resolve the same canonical list (prefer **one module** importing shared catalog + upsert seed). Simplest UX: if `microCourses.length === 0`, show **“Catalog loading — contact admin”** instead of 26 fake-enrollable courses.
3. **Pricing:** Decide **200 KES** for foundational / **tiered** for advanced, then change **`ALL_COURSES`**, **seed**, and **EnrollmentModal** display in one change set; align **`CoursesPage`** journey cards (remove misleading **$** labels for KES).
4. **Deprecate or wire `microCourses.listCourses` stub** so no page advertises courses that cannot be paid for.
5. **QA:** After seed + pricing fix, smoke: Fellowship → Asthma I → STK → webhook → enrollment row.

---

## 6. Quick checks (operators)

```bash
pnpm run db:ship-readiness
# Or SQL: SELECT courseId, title, price FROM microCourses WHERE courseId = 'asthma-i';
```

If this returns **no row**, **“Course not found”** on pay is expected until seed.
