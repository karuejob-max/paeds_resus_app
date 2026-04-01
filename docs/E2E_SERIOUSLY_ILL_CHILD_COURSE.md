# End-to-end: Seriously ill child course (PALS) at KES 100

**Purpose:** Verify enroll → M-Pesa STK → learning modules → certificate on learner dashboard.

## One-time: seed catalog content (DB)

The LMS reads from the `courses` / `modules` / `quizzes` / `quizQuestions` tables. Run:

```bash
pnpm exec tsx server/seed-pals-seriously-ill-course.ts
```

If the course already exists (title contains “seriously ill”), the script skips creating a duplicate course and only ensures module/quiz/question rows.

## Pricing (app)

- **File:** `client/src/const/pricing.ts`
- **Course id:** `pals` (maps to `enrollments.programType = 'pals'`)
- **Display name:** “The systematic approach to a seriously ill child”
- **Price:** KES **100** (test amount)

## Flow

1. **Sign in** as a learner (`userType` individual is fine).
2. **Enroll:** `/enroll` → choose **The systematic approach to a seriously ill child** → complete checkout fields → submit.  
   You are redirected to `/payment?enrollmentId=…&courseId=pals`.
3. **Pay:** M-Pesa STK — use a test phone in **sandbox/mock** (`MPESA_USE_MOCK` / dev) or real STK in production.  
   Amount shown: **KES 100**.
4. **After payment:** you should be redirected to `/course/seriously-ill-child?enrollmentId=…` (if not, open it manually with the same `enrollmentId`).
5. **Learning:** complete module content → **Take Quiz** → submit (≥70% aligns with quiz `passingScore`).
6. **Certificate:** issued when payment is **completed** (M-Pesa webhook or STK reconcile), not gated on quiz completion. Check **Learner dashboard** → **My Certificates** and download PDF if offered.

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| No course cards on learning page | Run the seed script; confirm `courses.programType = 'pals'`. |
| STK never completes locally | Mock flow: polling calls `reconcilePaymentRowByStkQuery`; wait a few seconds after PIN. |
| No certificate | `enrollment.paymentStatus` must be `completed`; webhook must hit `/api/payment/callback` or use reconcile. |
| Payment callback wrong URL | `MPESA_CALLBACK_URL` / `APP_BASE_URL` in `.env` (see `docs/MPESA_CONFIG_REFERENCE.md`). |

## Related code

- Enrollment + payment: `server/routers/enrollment.ts`, `server/routers/mpesa.ts`, `server/webhooks/mpesa-webhook.ts`
- Certificate: `server/certificates.ts` → `issueCertificateForEnrollmentIfEligible`
- Learning UI: `client/src/components/LearningPath.tsx`, `client/src/pages/CourseSeriouslyIllChild.tsx`
