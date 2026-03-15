# Unlinked pages integration — summary

**Goal:** Make all existing pages reachable and fix every button/link that pointed to a path with no route, without adding new pages.

---

## 1. New routes added (pages that existed but had no route)

| Path | Page | Where it's linked from |
|------|------|------------------------|
| `/referral` | Referral | BottomNav (Refer), navigation |
| `/personal-impact` | PersonalImpactDashboard | BottomNav (Impact) |
| `/kaizen-dashboard` | KaizenDashboard | DashboardSidebar, navigation, PredictiveInterventionDashboard, PersonalizedLearningDashboard |
| `/personalized-learning` | PersonalizedLearningDashboard | DashboardSidebar, navigation, PredictiveInterventionDashboard |
| `/predictive-intervention` | PredictiveInterventionDashboard | DashboardSidebar, navigation, PersonalizedLearningDashboard |
| `/targeted-solutions` | TargetedSolutions | Reassessment, ProblemIdentification |
| `/problem-identification` | ProblemIdentification | TargetedSolutions |
| `/reassessment` | Reassessment | TargetedSolutions |
| `/circulation-assessment` | CirculationAssessment | ProblemIdentification |
| `/course/bls` | CourseBLS | navigation.ts, DashboardSidebar |
| `/institutional-onboarding` | InstitutionalOnboarding | navigation.ts, Footer |

---

## 2. Redirects (paths that had links but no page — now redirect to an existing page)

| Path | Redirects to | Rationale |
|------|--------------|-----------|
| `/case-analysis` | `/targeted-solutions` | Reassessment button; no CaseAnalysis page |
| `/dashboard` | `/home` | Provider hub |
| `/institutional-dashboard` | `/hospital-admin-dashboard` | Institutional dashboard |
| `/pricing-calculator` | `/institutional` | Calculator section is on Institutional page |
| `/roi-calculator` | `/institutional` | Same |
| `/contact` | `/institutional` | Contact section on Institutional |
| `/resources` | `/learner-dashboard` | Learning resources |
| `/privacy` | `/institutional` | Until a Privacy page exists |
| `/terms` | `/institutional` | Until a Terms page exists |
| `/about` | `/institutional` | Until an About page exists |
| `/faq` | `/learner-dashboard` | Until an FAQ page exists |
| `/success-stories` | `/parent-safe-truth` | Parent stories |
| `/elite-fellowship` | `/enroll` | Enrollment / courses |

---

## 3. Link fixes (href/navigate updated so they point to real or redirected paths)

- **DashboardSidebar:** `/dashboard` → `/home`, `/elite-fellowship` → `/enroll`, `/success-stories` → `/parent-safe-truth`, `/faq` → `/learner-dashboard`, `/contact` → `/institutional`.
- **Institutional.tsx:** `/institutional-dashboard` → `/hospital-admin-dashboard`, `/pricing-calculator` and `/roi-calculator` → `/institutional`, `/contact` → `/institutional`, `/resources` → `/learner-dashboard`.
- **Footer:** Privacy, Terms, About → `/institutional`.
- **ProtectedPageWrapper:** “View Resources” → `/learner-dashboard`.
- **CourseCalculator:** Contact link → `/institutional`.
- **DashboardLayout:** Placeholder “Page 1” / “Page 2” → “Home” (`/home`) and “Learner Dashboard” (`/learner-dashboard`).

---

## 4. Result

- Every path linked from the app either has a real route or a redirect.
- BottomNav (Refer, Impact), DashboardSidebar, Institutional cards, Footer, and ProtectedPageWrapper buttons now go to working routes.
- Clinical flow (Problem Identification → Circulation Assessment → Targeted Solutions → Reassessment → Case Analysis) works; Case Analysis redirects to Targeted Solutions.
- Build passes; no new pages were added.
