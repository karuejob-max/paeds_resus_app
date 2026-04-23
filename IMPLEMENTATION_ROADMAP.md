# Paeds Resus Platform: Implementation Roadmap
**Date:** April 23, 2026  
**Author:** Manus AI

This roadmap translates the findings from the Provider-User Audit into actionable, trackable implementation phases. It strictly follows the project's DNA: prioritizing clinical usefulness at the bedside, reliability under pressure, and fast implementation for low-resource hospitals.

---

## Phase 1: Core Bedside Reliability & Clinical Safety ✅ COMPLETE

These items address direct patient safety risks and core functionality failures during emergency use.

| ID | Task | Component | Priority | Status |
|---|---|---|---|---|
| **1.1** | **Fix Defibrillation Energy Formula** | `CPRClockTeam.tsx` | CRITICAL | ✅ Done |
| | *AHA-compliant: 2 J/kg shock 1, 4 J/kg shock 2, ≥4 J/kg (max 10 J/kg) subsequent. Was using incorrect `2 + newShockCount` formula.* | | | |
| **1.2** | **Decouple SBAR Export from Sync** | `ResusGPS.tsx` | HIGH | ✅ Done |
| | *Export fires immediately to clipboard/file. Backend sync is fire-and-forget and never blocks handoff.* | | | |
| **1.3** | **Bulletproof Timers** | `ResusGPS.tsx`, `CPRClockTeam.tsx` | HIGH | ✅ Done |
| | *Replaced `setInterval` with wall-clock-anchored `requestAnimationFrame` in both ResusGPS and CPR Clock. Immune to browser background throttling.* | | | |
| **1.4** | **Missing Resource Capture** | `abcdeEngine.ts`, `ResusGPS.tsx` | HIGH | ✅ Done |
| | *"Not Available" button on every intervention card. Logs resource gap to Care Signal, marks intervention as skipped with orange icon.* | | | |

*Committed: `52ba5d5` → `14e82c6` on April 23, 2026*

---

## Phase 2: Provider Onboarding & Journey Unification ✅ COMPLETE

These items resolve UX fragmentation and confusing terminology that block provider adoption and commercial success.

| ID | Task | Component | Priority | Status |
|---|---|---|---|---|
| **2.1** | **Registration UX Upgrade** | `Register.tsx` | HIGH | ✅ Done |
| | *Register page rebuilt with icon-rich role cards and descriptions (matching Home.tsx onboarding style). Eliminates plain radio button confusion.* | | | |
| **2.2** | **Unified Provider Hub** | `ProviderDashboard.tsx` | MEDIUM | ✅ Done |
| | *ProviderDashboard rebuilt as a single Provider Hub: next-step engine, status badges, certificate renewal alerts, certificate download, quick-access tool strip (ResusGPS, Care Signal, Fellowship, AHA). Providers no longer need to visit `/learner-dashboard`.* | | | |
| **2.3** | **Navigation Consolidation** | `App.tsx`, 14 course/nav files | MEDIUM | ✅ Done |
| | *`/learner-dashboard` redirects to `/home`. All 14 course pages, nav constants, and DashboardLayout updated to point to the unified hub.* | | | |

*Committed: `44d4e8c` on April 23, 2026*

---

## Phase 3: Offline Persistence & Scale ✅ COMPLETE

These items ensure the platform functions flawlessly in LMIC environments with intermittent connectivity.

| ID | Task | Component | Priority | Status |
|---|---|---|---|---|
| **3.1** | **IndexedDB Case Persistence** | `resusSessionStore.ts`, `ResusGPS.tsx` | HIGH | ✅ Done |
| | *New `resusSessionStore.ts` module. ResusGPS auto-persists session on every state change (DB v2, `resusSession` store). On load, checks for unfinished case and shows Resume/Start-fresh dialog. Session cleared on explicit reset.* | | | |
| **3.2** | **Offline Analytics Queue** | `useResusAnalytics.ts` | MEDIUM | ✅ Done |
| | *Analytics events queued to IndexedDB (`analyticsQueue` store, DB v3) on network failure. Drained automatically on reconnect. New `trackResourceUnavailable()` event feeds Care Signal resource gap data.* | | | |

*Committed: `44d4e8c` on April 23, 2026*

---

## Phase 4: Clinical Intelligence & Institutional Scale ✅ COMPLETE

These items complete the clinical documentation loop and surface data to institutional decision-makers.

| ID | Task | Component | Priority | Status |
|---|---|---|---|---|
| **4.1** | **SAMPLE History Auto-Populate** | `resusSessionStore.ts`, `ResusGPS.tsx` | MEDIUM | ✅ Done |
| | *SAMPLE fields persisted to IndexedDB on every change. On new case start, last saved SAMPLE is pre-filled with a "From previous case — confirm or clear" banner. Saves documentation time at the start of a resuscitation.* | | | |
| **4.2** | **Referral Letter + Progress Note** | `clinicalDocuments.ts`, `ExportDocumentsPanel.tsx` | MEDIUM | ✅ Done |
| | *Two pure generator functions read directly from the active ResusGPS session. ExportDocumentsPanel (BookOpen button in TopBar) provides 3-tab sheet: Referral Letter (SBAR), Nursing Progress Note (SOAPIE + ISBAR), Medical Continuation Note. Copy to clipboard or download as .txt.* | | | |
| **4.3** | **Mobile Role Pill** | `Header.tsx` | LOW | ✅ Done |
| | *Compact role pill added to mobile header bar (always visible). Taps to open the role-selection menu. Eliminates invisible role state on mobile.* | | | |
| **4.4** | **Institutional Staff Roster on Provider Hub** | `ProviderDashboard.tsx` | LOW | ✅ Done |
| | *Institutional users see a staff roster widget on their Provider Hub: total/enrolled/completed counts, completion and enrollment rate progress bars, top-5 staff preview with status badges, and a "Manage full roster" CTA.* | | | |
| **4.5** | **Care Signal Resource Gap Trends** | `care-signal-events.ts`, `ResourceGapWidget.tsx` | LOW | ✅ Done |
| | *`getResourceGapTrends` endpoint aggregates `resus_resource_gap` analytics events from the DB. `ResourceGapWidget` renders a ranked bar chart of most-frequently unavailable interventions with timeframe selector. Surfaced on CareSignal page and HospitalAdminDashboard overview tab.* | | | |

*Committed: `9016cc1` → `cbfe751` on April 23, 2026*

---

## Remaining Backlog (Phase 5+)

| ID | Task | Priority | Notes |
|---|---|---|---|
| 5.1 | Condition-specific protocols (DKA, Status Epilepticus, Septic Shock) in ABCDE engine | HIGH | Expands clinical coverage beyond cardiac arrest |
| 5.2 | SAMPLE history server-side persistence (link to user account, not just device) | MEDIUM | Required for multi-device use |
| 5.3 | Referral letter PDF export (print/fax-ready) | MEDIUM | Needed for facilities without EHR |
| 5.4 | Care Signal: facility-level resource gap benchmarking (anonymised) | LOW | Requires multi-facility data volume |
| 5.5 | Mobile offline PWA (Service Worker + background sync) | LOW | Phase after web stabilisation |

---

*All Phase 1–4 items shipped and live on `main` as of April 23, 2026.*  
*Build: `vite ✓ 0 errors, 7.15s`. Final commit: `cbfe751`.*
