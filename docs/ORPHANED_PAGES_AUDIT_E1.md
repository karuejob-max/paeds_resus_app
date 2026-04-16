# Orphaned Pages Audit (E1)

**Purpose:** Categorise pages in `client/src/pages/` as wired, assessment, dashboard, backup, or unused. Wire where useful; remove only obvious backups.

**Reference:** A4 (routes) already done — `docs/UNLINKED_PAGES_INTEGRATION.md`. This audit covers pages that have **no route** in `App.tsx`.

---

## 1. Pages with routes (wired in App.tsx)

These 30 pages are reachable and linked:

| Page | Path |
|------|------|
| ResusGPS | `/`, `/resus` |
| Login | `/login` |
| Register | `/register` |
| Home | `/home` |
| ParentSafeTruth | `/parent-safe-truth` |
| SafeTruth | `/safe-truth` |
| InstitutionalPortal | `/institutional-portal` (legacy redirect to `/hospital-admin-dashboard`) |
| Institutional | `/institutional` |
| AdminHub | `/admin` |
| AdminReports | `/admin/reports` |
| HospitalAdminDashboard | `/hospital-admin-dashboard` |
| AdvancedAnalytics | `/advanced-analytics` |
| Enroll | `/enroll` |
| LearnerDashboard | `/learner-dashboard` |
| PatientsList | `/patients` |
| EmergencyProtocols | `/protocols` |
| PerformanceDashboard | `/performance-dashboard` |
| ProviderProfile | `/provider-profile` |
| CPRMonitoring | `/cpr-monitoring` |
| Payment | `/payment` |
| Referral | `/referral` |
| PersonalImpactDashboard | `/personal-impact` |
| KaizenDashboard | `/kaizen-dashboard` |
| PersonalizedLearningDashboard | `/personalized-learning` |
| PredictiveInterventionDashboard | `/predictive-intervention` |
| TargetedSolutions | `/targeted-solutions` |
| ProblemIdentification | `/problem-identification` |
| Reassessment | `/reassessment` |
| CirculationAssessment | `/circulation-assessment` |
| CourseBLS | `/course/bls` |
| InstitutionalOnboarding | `/institutional-onboarding` |

---

## 2. Backup / duplicate (remove)

| Page | Action | Reason |
|------|--------|--------|
| **ClinicalAssessmentGPS_backup.tsx** | **Removed** | Explicit backup; logic lives in ClinicalAssessmentGPS. |

---

## 3. Assessment / protocol (subcomponents only)

Used only as children of ClinicalAssessmentGPS (which has no route). ResusGPS is the current main assessment entry. **Recommendation:** Keep as components for possible future wiring of ClinicalAssessmentGPS or protocol deep-links; do not remove.

| Page | Used by |
|------|---------|
| AsthmaEmergency | ClinicalAssessmentGPS |
| DKAProtocol | ClinicalAssessmentGPS |
| SepticShockProtocol | ClinicalAssessmentGPS |
| AnaphylaxisProtocol | ClinicalAssessmentGPS |
| StatusEpilepticusProtocol | ClinicalAssessmentGPS |
| BronchiolitisProtocol | ClinicalAssessmentGPS |
| CroupProtocol | ClinicalAssessmentGPS |
| SeverePneumoniaProtocol | ClinicalAssessmentGPS |
| PostpartumHemorrhageProtocol | ClinicalAssessmentGPS |
| EclampsiaProtocol | ClinicalAssessmentGPS |
| MaternalCardiacArrestProtocol | ClinicalAssessmentGPS |
| TraumaProtocol | ClinicalAssessmentGPS |

---

## 4. Legacy / alternate flows (no route)

Not wired; kept for reference or future use. **Recommendation:** Keep; wire only if product asks for them.

| Page | Notes |
|------|--------|
| ClinicalAssessmentGPS | Legacy assessment flow; uses protocol pages above. ResusGPS is primary. |
| ClinicalReasoningResults | Likely outcome/results view. |
| CollaborativeSession | Session/collab feature. |
| DisabilityAssessment | Assessment variant. |
| ExposureAssessment | Assessment step. |
| BreathingAssessment | Assessment step. |
| TraumaAssessment | Assessment variant. |
| ClinicalAssessment | Generic assessment. |
| NRPAssessment | NRP-specific assessment. |
| Investigations | Investigations UI. |
| SessionDetails | Session detail view. |
| PatientDetail | Patient detail view. |
| JoinSession | Join session flow. |
| GuidelineManagement | Guideline admin. |
| HealthcareWorkerApp | Alternate app entry. |
| GPSDemo | Demo page. |
| SafeTruthAnalytics | Analytics view. |
| NotFound | 404 component; catch-all currently sends to ResusGPS. |

---

## 5. Summary

- **Removed:** 1 file — `ClinicalAssessmentGPS_backup.tsx` (obvious backup).
- **Wired:** 30 pages (unchanged; A4 already done).
- **Kept, not wired:** Assessment/protocol subcomponents and legacy pages; prefer wiring later over deletion.
- **No further removals** unless product explicitly retires a flow.

---

*Audit completed (E1) by Cursor 2026-02-25.*
