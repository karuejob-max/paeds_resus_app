# Unlinked pages analysis

**Purpose:** Identify pages that exist in the repo but are not reachable from the current platform (no route or no navigation link). Maximize effectiveness by wiring them in instead of rebuilding.

---

## 1. Linked from platform but **no route** (broken links)

These are linked from Home, Header, or Footer but have **no** `<Route>` in `App.tsx`. Users get the catch-all (ResusGPS) or a blank/404.

| Path | Page component | Linked from | Action |
|------|----------------|-------------|--------|
| `/enroll` | Enroll.tsx | Home ("Enrol in a course") | **Add route** |
| `/learner-dashboard` | LearnerDashboard.tsx | Home ("My learning"), Header (Courses) | **Add route** |
| `/patients` | PatientsList.tsx | Header (Patients) | **Add route** |
| `/protocols` | EmergencyProtocols.tsx | Header (Protocols) | **Add route** |
| `/performance-dashboard` | PerformanceDashboard.tsx | Header (Performance) | **Add route** |
| `/safe-truth` | SafeTruth.tsx | Header (Safe-Truth for providers) | **Add route** (provider Safe-Truth; parent is `/parent-safe-truth`) |
| `/provider-profile` | ProviderProfile.tsx | Header (Profile) | **Add route** |
| `/institutional` | Institutional.tsx | Footer (For Institutions) | **Add route** or redirect to `/hospital-admin-dashboard` (legacy `/institutional-portal` redirect) |
| `/cpr-monitoring` | CPRMonitoring.tsx | SessionDetails, internal links | **Add route** |
| `/payment` | Payment.tsx | LearnerDashboard (payment flow) | **Add route** |

**Recommendation:** Add all of the above to `App.tsx` so existing navigation works. No new pages; just connect what’s already there.

---

## 2. Protocol / clinical pages (exist, not in main nav)

These are full pages that could be reached from ResusGPS, an emergency launcher, or a “Protocols” index. Many are already used internally (e.g. from ResusGPS or EmergencyProtocols).

| Page | Likely entry | Suggestion |
|------|--------------|------------|
| DKAProtocol, SepticShockProtocol, AnaphylaxisProtocol, StatusEpilepticusProtocol, etc. | ResusGPS / quick launch / protocol list | Keep as-is if ResusGPS or EmergencyProtocols links to them; otherwise add links from `/protocols` or a protocol index. |
| MaternalCardiacArrestProtocol, TraumaProtocol, PostpartumHemorrhageProtocol, EclampsiaProtocol, CroupProtocol, BronchiolitisProtocol, SeverePneumoniaProtocol, AsthmaEmergency, NRPAssessment | Same | Ensure `/protocols` (EmergencyProtocols) or a single “protocol index” page links to these where appropriate. |
| ClinicalAssessment, ClinicalAssessmentGPS, ClinicalGPSv2, BreathingAssessment, CirculationAssessment, DisabilityAssessment, TraumaAssessment, ExposureAssessment, Reassessment | Clinical flow | Often reached from ResusGPS or a “clinical assessment” entry; document or add one clear entry (e.g. from Home or `/protocols`). |
| SessionDetails | CPR / session flow | Link from CPRMonitoring or ResusGPS when a session exists. |
| JoinSession, CollaborativeSession | Collaboration | Add route `/join-session`, `/collaborative-session/:id` if you want join/collab from nav; otherwise keep internal. |
| EmergencyProtocols | Header “Protocols” | Already mapped above; add route `/protocols`. |

**Recommendation:** Add routes only for pages that should be top-level (e.g. `/protocols`). For protocol-specific URLs (e.g. `/protocol/dka`), either add a small route table or have EmergencyProtocols and ResusGPS link to them by path so they’re reachable once `/protocols` exists.

---

## 3. Other pages (dashboards, tools, one-offs)

| Page | Suggestion |
|------|------------|
| InstitutionalOnboarding | Link from InstitutionalPortal or Institutional when onboarding new institutions. |
| SafeTruthAnalytics | Link from Admin or Safe-Truth (provider) if it’s admin/analytics. |
| PersonalizedLearningDashboard, PredictiveInterventionDashboard, KaizenDashboard, PersonalImpactDashboard | Link from Home or LearnerDashboard or Admin as “insights” / “analytics” if still relevant. |
| GuidelineManagement | Likely admin; link from Admin hub if in use. |
| CourseBLS, Payment | CourseBLS: link from Enroll or learner dashboard. Payment: add route (see above). |
| Referral, HealthcareWorkerApp | Link from provider dashboard or Home if you want referral/healthcare-worker flows. |
| ProblemIdentification, ClinicalReasoningResults, PatientDetail, Investigations | If part of a clinical flow, reach them from ResusGPS or SessionDetails; no need for main nav unless you want a direct URL. |
| GPSDemo | Demo; link from Admin or a “Demo” link if you want it visible. |
| NotFound | Use as catch-all fallback (after ResusGPS) if you want a dedicated 404 page. |

---

## 4. Footer links with no page yet

Footer links: `/privacy`, `/terms`, `/about`, `/contact`. If those routes don’t exist, either add simple placeholder pages or remove/update the footer links.

---

## 5. Summary: what to do

1. **Add routes in App.tsx** for: `/enroll`, `/learner-dashboard`, `/patients`, `/protocols`, `/performance-dashboard`, `/safe-truth`, `/provider-profile`, `/institutional` (or redirect to `/hospital-admin-dashboard`; keep `/institutional-portal` as legacy redirect), `/cpr-monitoring`, `/payment`. This fixes broken navigation and reuses existing pages.
2. **Optional:** Add `/join-session` and `/collaborative-session/:id` if you want join/collab in the main app.
3. **Protocols:** Ensure `/protocols` (EmergencyProtocols) and, if needed, ResusGPS link to individual protocol pages so nothing is orphaned.
4. **Footer:** Add minimal Privacy/Terms/About/Contact pages or point footer links to existing content/URLs.

No need to reinvent: the pages exist; wiring routes and a few links will make the platform coherent and effective.
