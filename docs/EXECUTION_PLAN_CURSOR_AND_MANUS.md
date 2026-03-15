# Execution Plan: Hidden Opportunities Implementation
**Cursor & Manus Shared Execution Plan**  
**Last Updated:** March 15, 2026  
**Status:** In Progress

---

## Overview

This plan breaks down the 14 hidden opportunities into 4 phases, executed in order. Each task is marked with status and owner (Cursor or Manus).

**Execution order is critical** — some tasks depend on earlier ones (e.g., C1 depends on A1).

---

## Phase 1: Analytics & Visibility (Foundation)
*These tasks enable all downstream reporting. Do these first.*

### A1: Instrument ResusGPS with Analytics
- **Status:** [ ] Not Started
- **Owner:** 
- **Effort:** 15 minutes
- **Impact:** Admin gets real product visibility; unlocks "App activity" metric
- **Details:** See MANUS_HIDDEN_OPPORTUNITIES_REPORT.md, Section A1
- **Files to change:**
  - `client/src/pages/ResusGPS.tsx` — add useAnalytics hook, track page view, button clicks, assessment completion
- **Completion date:** 

### C1: Add "Active Users This Week" to Admin Reports
- **Status:** [ ] Not Started
- **Owner:** 
- **Effort:** 30 minutes
- **Impact:** Admin sees engagement, not just registration
- **Depends on:** A1 (ResusGPS must emit events first)
- **Details:** See MANUS_HIDDEN_OPPORTUNITIES_REPORT.md, Section C1
- **Files to change:**
  - `server/routers/admin-stats.ts` — query analyticsEvents for unique users in last 7 days
  - `client/src/pages/AdminReports.tsx` — add card showing active users count
- **Completion date:** 

### D1: Replace "No data available" with Actionable CTAs
- **Status:** [ ] Not Started
- **Owner:** 
- **Effort:** 10 minutes
- **Impact:** Users know what to do when they see empty states
- **Details:** See MANUS_HIDDEN_OPPORTUNITIES_REPORT.md, Section D1
- **Files to change:**
  - `client/src/pages/PerformanceDashboard.tsx` — replace "No data available" with context-specific CTA
- **Completion date:** 

---

## Phase 2: Referrals & Safe-Truth (Feature Completion)
*Wire existing features that are partially built.*

### A2: Wire Referral Page to Backend
- **Status:** [ ] Not Started
- **Owner:** 
- **Effort:** 1 hour
- **Impact:** Unlocks growth/revenue channel
- **Details:** See MANUS_HIDDEN_OPPORTUNITIES_REPORT.md, Section A2
- **Files to change:**
  - `server/routers/referrals.ts` (new) — create getReferrals() and submitReferral() procedures
  - `client/src/pages/Referral.tsx` — implement TODO items, call tRPC procedures
- **Completion date:** 

### A3: Add Referral Count to Admin Reports
- **Status:** [ ] Not Started
- **Owner:** 
- **Effort:** 30 minutes
- **Impact:** Admin can track referral growth
- **Depends on:** A2 (referrals must be wired first)
- **Details:** See MANUS_HIDDEN_OPPORTUNITIES_REPORT.md, Section A3
- **Files to change:**
  - `server/routers/admin-stats.ts` — query referrals table for monthly count
  - `client/src/pages/AdminReports.tsx` — add referrals card
- **Completion date:** 

### A5: Surface Safe-Truth Usage in Parent Dashboard
- **Status:** [ ] Not Started
- **Owner:** 
- **Effort:** 45 minutes
- **Impact:** Parents see their engagement; encourages repeat use
- **Details:** See MANUS_HIDDEN_OPPORTUNITIES_REPORT.md, Section A5
- **Files to change:**
  - `server/routers/parent-safetruth.ts` — add getSafeTruthStats() query
  - `client/src/pages/ParentSafeTruth.tsx` — call query, display stats card
- **Completion date:** 

---

## Phase 3: Flows & Reporting (Completeness)
*Fix incomplete flows and add depth to reporting.*

### B1: Complete the Enrollment → Payment → Certificate Flow
- **Status:** [ ] Not Started
- **Owner:** 
- **Effort:** 1.5 hours
- **Impact:** Enrollment becomes a complete, rewarding journey
- **Details:** See MANUS_HIDDEN_OPPORTUNITIES_REPORT.md, Section B1
- **Files to change:**
  - `server/routers/payments.ts` or `mpesa.ts` — add certificate creation logic on payment success
  - `client/src/pages/LearnerDashboard.tsx` — add certificates section
- **Completion date:** 

### B2: Institutional Onboarding → First Login to Portal
- **Status:** [ ] Not Started
- **Owner:** 
- **Effort:** 30 minutes
- **Impact:** Institutional users complete onboarding and immediately see value
- **Details:** See MANUS_HIDDEN_OPPORTUNITIES_REPORT.md, Section B2
- **Files to change:**
  - `client/src/pages/InstitutionalOnboarding.tsx` — add redirect to `/institutional-portal`
  - `client/src/pages/InstitutionalPortal.tsx` — add welcome state for first-time users
- **Completion date:** 

### C2: Add "Top Protocols Viewed" to Admin Reports
- **Status:** [ ] Not Started
- **Owner:** 
- **Effort:** 45 minutes
- **Impact:** Admin sees which protocols are most valuable
- **Depends on:** A1 (ResusGPS must emit "View Protocol" events first)
- **Details:** See MANUS_HIDDEN_OPPORTUNITIES_REPORT.md, Section C2
- **Files to change:**
  - `server/routers/admin-stats.ts` — query analyticsEvents for "View Protocol" events, group by protocol
  - `client/src/pages/AdminReports.tsx` — add top protocols card
- **Completion date:** 

### C3: Add "Conversion Funnel" to Admin Reports
- **Status:** [ ] Not Started
- **Owner:** 
- **Effort:** 30 minutes
- **Impact:** Admin sees course completion rates and drop-off points
- **Details:** See MANUS_HIDDEN_OPPORTUNITIES_REPORT.md, Section C3
- **Files to change:**
  - `server/routers/admin-stats.ts` — query enrollments and certificates, calculate conversion rate
  - `client/src/pages/AdminReports.tsx` — add funnel card
- **Completion date:** 

---

## Phase 4: Clean-up & Polish (Optional)
*Remove unused code and complete TODOs. Do these if time permits.*

### D2: Complete TODO Items
- **Status:** [ ] Not Started
- **Owner:** 
- **Effort:** Varies (see details)
- **Impact:** Reduces technical debt
- **Details:** See MANUS_HIDDEN_OPPORTUNITIES_REPORT.md, Section D2
- **TODOs to complete:**
  - `InterventionSidebar.tsx:244` — Add export to file functionality (LOW priority)
  - `SupportAgentDashboard.tsx:86` — Send message via tRPC (MEDIUM priority)
  - `ClinicalAssessmentGPS.tsx:610, 640` — Build DKAManagement & TraumaProtocol modules (LOW priority)
  - `Referral.tsx:33, 66` — Already covered by A2
- **Completion date:** 

### E1: Audit Orphaned Pages and Decide: Wire or Remove
- **Status:** [x] Done (by Cursor)
- **Owner:** Cursor
- **Effort:** 2 hours
- **Impact:** Cleaner codebase
- **Details:** See MANUS_HIDDEN_OPPORTUNITIES_REPORT.md, Section E1
- **Note:** Cursor already wired orphaned routes to App.tsx (A4). No action needed.
- **Completion date:** March 15, 2026

### E2: Audit Unused Database Tables and Decide: Populate or Remove
- **Status:** [ ] Not Started
- **Owner:** 
- **Effort:** 1 hour
- **Impact:** Cleaner schema
- **Details:** See MANUS_HIDDEN_OPPORTUNITIES_REPORT.md, Section E2
- **Unused tables to audit:**
  - institutionalInquiries, smsReminders, learnerProgress, platformSettings, experimentAssignments, errorTracking, supportTickets, supportTicketMessages, featureFlags, userCohorts, userCohortMembers, conversionFunnelEvents, npsSurveyResponses, userProfiles, safetruthEvents, chainOfSurvivalCheckpoints, eventOutcomes, userInsights, facilityScores, accreditationApplications, accreditedFacilities
- **Completion date:** 

---

## Summary

| Phase | Tasks | Status | Effort |
|-------|-------|--------|--------|
| **Phase 1** | A1, C1, D1 | Not Started | 55 min |
| **Phase 2** | A2, A3, A5 | Not Started | 2h 15m |
| **Phase 3** | B1, B2, C2, C3 | Not Started | 3h 15m |
| **Phase 4** | D2, E1, E2 | E1 Done (Cursor) | 3h |
| **Total** | 14 tasks | 1 done | ~9h |

---

## Notes

- **Execution order matters**: Phase 1 enables Phase 2, which enables Phase 3. Don't skip ahead.
- **A4 (Wire orphaned routes) is already done by Cursor** — all routes are in App.tsx. Skip it.
- **When you finish a task**: Update this file with status, owner, and completion date.
- **For detailed specs**: See `docs/MANUS_HIDDEN_OPPORTUNITIES_REPORT.md`.
- **Preserve existing structure**: Don't replace code; extend it. Respect multi-role auth and existing patterns.

---

## Completed Tasks

- [x] **E1: Audit Orphaned Pages** (by Cursor, March 15, 2026) — All orphaned routes wired to App.tsx
