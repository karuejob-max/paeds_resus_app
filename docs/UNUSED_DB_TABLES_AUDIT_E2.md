# Unused DB Tables Audit (E2)

**Purpose:** Document which tables in `drizzle/schema.ts` are actively used vs reserved. Prefer document "reserved" over delete; do not remove tables unless clearly obsolete.

---

## 1. Actively used (core product)

These tables are referenced in `server/db.ts`, routers, or services for live features:

| Table | Used in |
|-------|---------|
| users | Auth, admin-stats, certificates, enrollment, institution, etc. |
| enrollments | db, admin-stats, enrollment, certificates, mpesa-webhook, scheduler, kaizen-metrics, learning |
| payments | db, admin-stats, mpesa-webhook, scheduler, mpesa, referral-rewards, dashboards |
| certificates | db, admin-stats, certificates.ts, kaizen-metrics, learning |
| analyticsEvents | db, admin-stats, events |
| parentSafeTruthSubmissions | admin-stats, parent-safetruth |
| parentSafeTruthEvents | parent-safetruth |
| systemDelayAnalysis | parent-safetruth |
| hospitalImprovementMetrics | parent-safetruth |
| clinicalReferrals | admin-stats, referrals |
| institutionalInquiries | db |
| smsReminders | db, enrollment, scheduler |
| adminAuditLog | db |
| institutionalAccounts | db, institution, institutional-enrollment |
| institutionalStaffMembers | db, institution |
| quotations, contracts | db, institution |
| trainingSchedules, trainingAttendance | db |
| certificationExams, incidents, institutionalAnalytics | db |
| learnerProgress, userFeedback | db |
| experiments, experimentAssignments, performanceMetrics, errorTracking | db |
| supportTickets, supportTicketMessages | db, dashboards |
| featureFlags, userCohorts, userCohortMembers, conversionFunnelEvents, npsSurveyResponses | db |
| referrals | referral-rewards |
| courses, modules, quizzes, quizQuestions | seed-courses, learningPath, learning |
| userProgress | learningPath, learning |
| guidelines, guidelineChanges, protocolStatus, protocolGuidelines | guideline-monitor, guidelines router |
| cprSessions, cprEvents, cprTeamMembers | cpr-session, cprClock, session-details.test |
| emergencyProtocols, protocolSteps, etc. | emergencyProtocols router |
| patients, patientVitals | patients, vitals routers |
| interventions, outcomes, impactMetrics | interventions, outcomes routers |
| providerProfiles, providerPerformanceMetrics | provider router |
| safetruthEvents, facilityScores | facility-scoring, safetruth-events |
| userInsights | recommendations.service |
| Alerts-related tables | alerts router |
| Chat/support tables | chat-support router |
| Investigations/diagnosis tables | investigations router |
| Vitals, interventions, performance | performance, vitals, interventions routers |

---

## 2. Reserved / future use

Defined in schema; used in few or optional flows. **Do not delete** — keep for future or optional features.

| Table | Notes |
|-------|--------|
| platformSettings | App/config settings; may be used by config loader or future admin. |
| eventOutcomes, systemGaps | Safe-Truth / event outcome tracking. |
| accreditationApplications, accreditedFacilities | Institutional accreditation (future). |
| userProfiles | Extended profile data (future). |
| chainOfSurvivalCheckpoints, eventOutcomes | Safe-Truth / chain-of-survival. |
| assessments, diagnosisHistory, diagnosisAccuracy, differentialDiagnosisScores | Clinical assessment / diagnosis (future or optional). |
| medicalConditions, symptoms, conditionSymptomMapping | Clinical reference (future). |
| investigationResults, investigationAnalysis, investigationHistory, investigationTrends | Investigations deep-dive (future). |
| providerStats, leaderboardRankings, achievements, performanceHistory, teamPerformance, performanceEvents | Gamification / leaderboards (future or optional). |
| alertConfigurations, alerts, alertDeliveryLog, alertSubscriptions, alertHistory, alertStatistics | Alerting (used in alerts router; some sub-tables reserved). |
| chatConversations, chatMessages, supportAgents, cannedResponses | Chat/support (used in chat-support). |
| patients, patientVitals, vitalSignsHistory, referenceRanges, interventionLog, riskScoreHistory | Clinical vitals/risk (vitals router; some reserved). |
| cprProtocols, emergencyMedications, medicationLog, defibrillatorEvents | CPR/medication detail (future). |
| trainingSchedules, trainingAttendance | Training (db import; wire when needed). |

---

## 3. Recommendation

- **No tables removed.** All are either in use or documented as reserved.
- **Migrations:** Do not drop tables without product decision. To retire a table later: add a migration and document in this file.
- **New features:** Prefer reusing reserved tables over adding new ones where the schema already fits.

---

*Audit completed (E2) by Cursor 2026-02-25.*
