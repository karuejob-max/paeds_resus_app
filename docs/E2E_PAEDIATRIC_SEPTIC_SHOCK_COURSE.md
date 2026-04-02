# End-to-end: Paediatric septic shock course (PALS micro-course, KES 200)

**Purpose:** Verify enroll → M-Pesa STK → learning modules → certificate on learner dashboard for the **septic shock** SKU (separate from the seriously ill child PALS micro-course).

## One-time: database

### Migration: enrollment course binding

PALS micro-courses use `enrollments.courseId` so payment unlocks **one** catalog course. Apply once per environment:

```bash
pnpm run db:apply-0029
```

### Catalog content

The server **ensures** the septic shock course, modules, and quizzes on demand (`ensurePaediatricSepticShockCatalog` when enrolling or loading PALS catalog). No separate seed script is required if the app has run against that DB after deployment.

If you need a manual SQL check: `courses` row for paediatric septic shock, linked `modules` / `quizzes` / `quizQuestions`.

## Pricing (app)

- **File:** `client/src/const/pricing.ts`
- **Course / SKU id:** `pals_septic` (checkout still uses `programType = pals` with `pricingSku = pals_septic` on enrollment create)
- **Display name:** Paediatric septic shock (or as shown on Enroll card)
- **Price:** KES **200** (accessible entry tier; adjust in `pricing.ts` with product approval)

## Where it appears in the app

- **Enroll:** `/enroll` — septic shock card; anchor **`/enroll#course-septic-shock`**
- **Payment:** `/payment?enrollmentId=…&courseId=pals_septic` (or `pals` where URL uses program type; Payment page resolves SKU from enrollment)
- **Learning:** **`/course/paediatric-septic-shock`** (optional `?enrollmentId=` after checkout)
- **Learner dashboard:** “Continue: Paediatric septic shock”

## Flow

1. **Sign in** as a learner.
2. **Enroll:** `/enroll#course-septic-shock` → choose **Paediatric septic shock** → submit checkout → enrollment created with **`courseId`** set to the septic catalog course.
3. **Pay:** `/payment` — M-Pesa STK; amount **KES 200** (per `pricing.ts`).
4. **After payment:** redirect to **`/course/paediatric-septic-shock?enrollmentId=…`** (if not, open manually with the same id).
5. **Learning:** complete all modules for **this** course → quizzes (passing score per quiz row).
6. **Certificate:** issued when payment is completed **and** all modules for **this enrollment’s course** are complete (see `server/certificates.ts` + pals completion helper).

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| Wrong modules (seriously ill content) | Enrollment must have `courseId` = septic course; `pricingSku` `pals_septic` on create. |
| `db:apply-0029` not run | `enrollments.courseId` column missing → migration. |
| No catalog rows | Hit enroll or `learning.getCourses` with PALS so ensure runs; check DB connectivity. |

## Related docs

- Clinical protocol + ResusGPS mapping: [`clinical-protocols/paediatric-septic-shock.md`](./clinical-protocols/paediatric-septic-shock.md)
- Seriously ill child (other PALS micro-course): [`E2E_SERIOUSLY_ILL_CHILD_COURSE.md`](./E2E_SERIOUSLY_ILL_CHILD_COURSE.md)

## Related code

- Catalog: `server/lib/ensure-paediatric-septic-shock-catalog.ts`
- Enrollment SKU: `server/routers/enrollment.ts` (`pricingSku`)
- Learning UI: `client/src/pages/CoursePaediatricSepticShock.tsx`, `client/src/components/LearningPath.tsx`
- Payment redirect: `client/src/pages/Payment.tsx`
