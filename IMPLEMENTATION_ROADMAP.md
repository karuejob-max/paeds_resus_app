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

## Remaining Backlog (Phase 4+)

These items are not blockers for pilot launch but should be addressed before national rollout.

| ID | Task | Priority | Notes |
|---|---|---|---|
| 4.1 | SAMPLE history auto-populate from previous sessions | MEDIUM | Data model exists; needs UI wiring |
| 4.2 | Referral letter pre-fill from active ResusGPS session | MEDIUM | Reduces handoff time at transfer |
| 4.3 | Role-based persistent header toggle (Provider / Parent / Institution) | LOW | UX polish; data model already supports it |
| 4.4 | Institutional dashboard: staff roster + completion rate on Provider Hub | LOW | Already in LearnerDashboard; surface in hub |
| 4.5 | Care Signal: surface resource gap trends to hospital admin | LOW | Data is now being captured; needs reporting UI |

---

*All Phase 1, 2, and 3 items shipped and live on `main` as of April 23, 2026.*  
*Build: `vite ✓ 0 errors`. Commits: `52ba5d5` → `14e82c6` → `44d4e8c`.*
