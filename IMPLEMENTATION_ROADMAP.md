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

## Phase 5: Clinical Depth & Scale ✅ COMPLETE

| ID | Task | Component | Priority | Status |
|---|---|---|---|---|
| **5.1** | **Condition-Specific Protocols** | `conditionProtocols.ts`, `ConditionProtocolSheet.tsx` | HIGH | ✅ Done |
| | *Full AHA/WHO-aligned step-by-step protocols for Septic Shock, Status Epilepticus, and DKA. Weight-based drug doses, titration steps, monitoring checkpoints, reassessment triggers. Accessible via Layers (🗂) button in ResusGPS top bar.* | | | |
| **5.2** | **Server-Side SAMPLE Persistence** | `sample-history.ts`, `schema.ts`, `ResusGPS.tsx` | MEDIUM | ✅ Done |
| | *New `providerSampleHistory` DB table. `sampleHistoryRouter` with `saveSampleHistory` + `getLastSampleHistory` endpoints. ResusGPS saves SAMPLE to server on case end; loads from server on idle start. Survives device/browser changes — account-linked.* | | | |
| **5.3** | **Referral Letter PDF Export** | `ExportDocumentsPanel.tsx` | MEDIUM | ✅ Done |
| | *`printAsPdf()` uses browser print dialog for A4 print/PDF output. Fully offline, no library, no server call. "Print / PDF" button added alongside Copy + Download .txt in ExportDocumentsPanel.* | | | |
| **5.4** | **Multi-Facility Benchmark** | `care-signal-events.ts`, `MultiFacilityBenchmarkWidget.tsx` | LOW | ✅ Done |
| | *`getMultiFacilityBenchmark` endpoint aggregates anonymised cross-facility resource gap data (≥5 events threshold). `MultiFacilityBenchmarkWidget` shows platform-wide vs my-facility comparison, unique-to-me gaps (local procurement), and widespread gaps (systemic issue). Surfaced on CareSignal and HospitalAdminDashboard.* | | | |

*Committed: `fc170af` on April 23, 2026*

---

## Phase 6: PWA, Fellowship Credit & MOH Export ✅ COMPLETE

| ID | Task | Component | Status | Commit |
|---|---|---|---|---|
| **6.1** | **Mobile Offline PWA** | `sw.js`, `PWAInstallBanner.tsx` | ✅ Done | `d49ad04` |
| | *SW rewritten with correct route cache, background sync for analytics + SAMPLE queues, push notification support. PWAInstallBanner (banner + card variants, 7-day snooze) wired into ResusGPS (idle only) and ProviderDashboard.* | | | |
| **6.2** | **Cross-Device SAMPLE Sync** | `ResusGPS.tsx` | ✅ Done (Phase 5.2) | `fc170af` |
| | *Already implemented via server-side `getLastSampleHistory` query in Phase 5.2. Verified complete — no additional work needed.* | | | |
| **6.3** | **Condition Protocol → Fellowship Pillar B Credit** | `ConditionProtocolSheet.tsx`, `ResusGPS.tsx` | ✅ Done | `d49ad04` |
| | *`onProtocolProgress` callback fires on every step marked done. ResusGPS tracks `protocolsUsed` state and includes `protocol:conditionId:N/M` strings in `recordResusGPSCase` call for Pillar B credit.* | | | |
| **6.4** | **MOH CSV Export** | `care-signal-events.ts`, `MultiFacilityBenchmarkWidget.tsx` | ✅ Done | `d49ad04` |
| | *`getMOHExportData` endpoint returns anonymised platform-wide resource gaps (≥5 event threshold, severity tiers). MOH Export section added to MultiFacilityBenchmarkWidget with timeframe selector and Download CSV button.* | | | |

*Committed: `d49ad04` on April 23, 2026*

---

## Phase 7 — Clinical Breadth, MCI & Mobile ✅ COMPLETE

| ID | Task | Component | Status |
|---|---|---|---|
| **7.1** | **NRP Protocol** | `conditionProtocols.ts` | ✅ Done |
| | *6-step NRP algorithm: warmth/stimulation, PPV (21% O₂), chest compressions (3:1 ratio), adrenaline 0.01–0.03 mg/kg UVC, reassessment at 30s intervals.* | | |
| **7.2** | **Anaphylaxis + Severe Asthma Protocols** | `conditionProtocols.ts`, `ConditionProtocolSheet.tsx` | ✅ Done |
| | *Anaphylaxis: Adrenaline 0.01 mg/kg IM (max 0.5 mg), antihistamines, steroids, fluid bolus. Severe Asthma: Salbutamol 2.5–5 mg neb, ipratropium, MgSO4 40 mg/kg IV, NIPPV, RSI. All 6 protocols now in ConditionProtocolSheet.* | | |
| **7.3** | **Multi-Patient MCI Board** | `MultiPatientBoard.tsx`, `ResusGPS.tsx` | ✅ Done |
| | *Triage tag system (Red/Yellow/Green/Black). Per-patient weight + active threat tracking. MCI button (👥 Users) in ResusGPS TopBar. Designed for mass casualty scenarios at county hospitals.* | | |
| **7.4** | **Care Signal Push Notifications** | `care-signal-review.ts`, `NotificationBell.tsx`, `Header.tsx` | ✅ Done |
| | *`careSignalReviews` + `inAppNotifications` DB tables. Router: `submitReview`, `getMyNotifications`, `markRead`, `markAllRead`, `getUnreadCount`. NotificationBell replaces static Bell in Header — live unread count badge, 60s polling, mark-all-read.* | | |
| **7.5** | **React Native / Expo Mobile Scaffold** | `mobile/` | ✅ Done |
| | *Full Expo Router scaffold: Home, ResusGPS, Protocols, Profile tabs. Active ResusGPS screen with wall-clock timer, ABCDE phases, CPR/shock controls (AHA-correct 2→4→≥4 J/kg), expo-keep-awake, expo-haptics, AsyncStorage persistence. All 6 protocols in Protocols tab. EAS build config for APK/IPA distribution.* | | |

*Committed: `0924648` on April 23, 2026*

---

## Phase 8 Backlog (Next)

| ID | Task | Priority |
|---|---|---|
| 8.1 | Full ABCDE engine port to mobile (shared `conditionProtocols.ts`) | HIGH |
| 8.2 | CPR Clock with 2-minute cycle timer and haptic pulse on mobile | HIGH |
| 8.3 | Offline-first drug calculator with weight-based doses on mobile | HIGH |
| 8.4 | Voice command support ("Next step", "Shock delivered") | MEDIUM |
| 8.5 | Bluetooth pulse oximeter integration | MEDIUM |
| 8.6 | EAS OTA updates for instant clinical guideline patches | LOW |

---

*All Phase 1–7 items shipped and live on `main` as of April 23, 2026.*  
*Build: `vite ✓ 0 errors, 8.28s`. Final commit: `0924648`.*
