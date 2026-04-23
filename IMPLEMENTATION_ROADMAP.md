# Paeds Resus Platform: Implementation Roadmap
**Date:** April 23, 2026  
**Author:** Manus AI

This roadmap translates the findings from the Provider-User Audit into actionable, trackable implementation phases. It strictly follows the project's DNA: prioritizing clinical usefulness at the bedside, reliability under pressure, and fast implementation for low-resource hospitals.

## Phase 1: Core Bedside Reliability & Clinical Safety (Immediate)

These items address direct patient safety risks and core functionality failures during emergency use.

| ID | Task | Component | Priority | Status |
|---|---|---|---|---|
| **1.1** | **Fix Defibrillation Energy Formula** | `CPRClockTeam.tsx` | CRITICAL | Pending |
| | *Description:* Update shock calculation to AHA pediatric guidelines: 2 J/kg for shock 1, 4 J/kg for shock 2, ≥4 J/kg (max 10 J/kg) for subsequent shocks. Currently uses incorrect `2 + newShockCount` formula. | | | |
| **1.2** | **Decouple SBAR Export from Sync** | `ResusGPS.tsx` | HIGH | Pending |
| | *Description:* Ensure `exportClinicalRecord` copies to clipboard immediately and does not fail if `recordSessionMutation` (backend sync) fails due to network drop. | | | |
| **1.3** | **Bulletproof Reassessment Timers** | `Reassessment.tsx`, `CPRClockTeam.tsx` | HIGH | Pending |
| | *Description:* Replace `setInterval` with `requestAnimationFrame` or a Web Worker-based timer to prevent browser background throttling during long resuscitations. | | | |
| **1.4** | **Implement Missing Resource Capture** | `abcdeEngine.ts`, `ResusGPS.tsx` | HIGH | Pending |
| | *Description:* Add a "Not Available" toggle to interventions. If an item (e.g., IO needle) is unavailable, capture this for Care Signal and offer an alternative pathway if possible. | | | |

## Phase 2: Provider Onboarding & Journey Unification (Short-Term)

These items resolve UX fragmentation and confusing terminology that block provider adoption and commercial success.

| ID | Task | Component | Priority | Status |
|---|---|---|---|---|
| **2.1** | **Rename "Individual" to "Provider"** | `Home.tsx`, Auth Router | HIGH | Pending |
| | *Description:* Update the role selection terminology. "Individual" is confusing; "Healthcare Provider" clearly defines the workspace. | | | |
| **2.2** | **Consolidate Provider Dashboards** | `ProviderDashboard.tsx`, `LearnerDashboard.tsx` | MEDIUM | Pending |
| | *Description:* Merge certificate downloads, performance stats, and course nudges into a single, unified Provider Hub (`/home`), eliminating the legacy gray-styled dashboards. | | | |
| **2.3** | **Unify the Checkout Flow** | `Payment.tsx`, `Enroll.tsx` | MEDIUM | Pending |
| | *Description:* Refactor the payment and enrollment flows to gracefully handle Fellowship enrollments alongside AHA courses, rather than explicitly rejecting Fellowship and forcing a separate funnel. | | | |

## Phase 3: Offline Persistence & Scale (Medium-Term)

These items ensure the platform functions flawlessly in LMIC environments with intermittent connectivity.

| ID | Task | Component | Priority | Status |
|---|---|---|---|---|
| **3.1** | **Implement IndexedDB Case State** | `ResusGPS.tsx`, `offlineStorage.ts` | HIGH | Pending |
| | *Description:* Wire ResusGPS to save every event to IndexedDB immediately. On load, check for an active case and offer to resume, protecting against accidental browser refreshes. | | | |
| **3.2** | **Background Sync for Analytics** | `ResusGPS.tsx`, Service Worker | MEDIUM | Pending |
| | *Description:* Move `recordSessionMutation` and `recordCaseMutation` to a background sync queue so providers never wait for a network request during or immediately after a code. | | | |

---

*Execution of Phase 1 begins immediately following the approval of this roadmap.*
