# Provider-User Audit & Remediation Plan
**Date:** April 23, 2026  
**Auditor:** Manus AI  
**Focus:** Provider User Journey, Clinical Workflows, and UX Fragmentation  

## 1. Executive Summary

This audit evaluated the Paeds Resus Platform from the perspective of a healthcare provider user, focusing on the core emergency flow (ResusGPS), onboarding, commercial architecture, and clinical tool reliability. 

**The Verdict:** The platform has powerful clinical engines (e.g., ABCDE logic, CPR clock, accurate weight-based dosing), but the provider experience is heavily fragmented. Providers face multiple competing dashboards, confusing commercial pathways (AHA vs. Fellowship), and gaps in critical bedside features (offline persistence, missing resource capture). 

**The Goal:** Unify the provider workspace into a single, reliable, low-friction tool that optimizes for clinical usefulness at the bedside, reliability under pressure, and fast implementation for low-resource hospitals.

---

## 2. Identified Gaps & Friction Points

### 2.1. Journey & Workspace Fragmentation (UX/Architecture)
- **Role Selection Friction:** The initial `/home` route forces a provider to self-identify as "individual" rather than "provider" to access their workspace. This terminology is confusing.
- **Competing Dashboards:** Providers have multiple overlapping hubs: `/home` (role gate), `/provider-profile` (legacy gray styling, performance stats), and `/learner-dashboard` (mixed role, certificate downloads, course nudges). There is no single "Provider Home."
- **Commercial Disconnect:** The `/enroll` and `/payment` flows handle AHA courses and generic Paeds Resus pathways but explicitly reject Fellowship payments, forcing providers into separate funnels.

### 2.2. Clinical Engine & Bedside Reliability (ResusGPS)
- **Offline Reliability Risk:** ResusGPS is intended for emergency use, but the audit found no robust IndexedDB or ServiceWorker integration actively persisting active case state during an assessment. If the browser refreshes or loses connection mid-code, the case data may be lost.
- **Missing Resource Capture:** The platform assumes all recommended interventions (e.g., amiodarone, IO needles) are available. There is no "Recommended X, Unavailable Y" flow to capture resource gaps in low-resource hospitals, which is critical for both the provider's immediate pivot and the platform's systemic data collection (Care Signal).
- **SBAR/Handoff Export:** While an export function exists (`exportClinicalRecord`), it is heavily dependent on the backend (`recordSessionMutation`). If the backend call fails, the export logs an error. Bedside handoff must be decoupled from backend sync to ensure it works 100% of the time.
- **Reassessment Timer:** The reassessment logic relies on a basic `setInterval` that is vulnerable to browser background throttling.

### 2.3. Clinical Accuracy & Guidelines
- **Defibrillation Energy:** The CPR Clock uses `2 + newShockCount` J/kg (resulting in 3 J/kg for shock 1, 4 J/kg for shock 2). AHA 2020 pediatric guidelines recommend 2 J/kg for the first shock, 4 J/kg for the second, and ≥4 J/kg (max 10 J/kg) for subsequent shocks. The current formula is clinically inaccurate.
- **Glucose Units:** The engine correctly supports mmol/L and mg/dL conversions, aligning with LMIC/Kenya standards.

---

## 3. Prioritized Remediation Plan

The following plan is prioritized based on clinical impact, bedside reliability, and rollout readiness for low-resource hospitals.

### Priority 1: Core Bedside Reliability & Clinical Safety (Immediate Execution)
1. **Fix Defibrillation Energy Formula:** Update `CPRClockTeam.tsx` to strictly follow AHA dosing (2 J/kg first shock, 4 J/kg second shock, ≥4 J/kg subsequent).
2. **Implement "Missing Resource" Capture:** Add a "Not Available" toggle to all intervention prompts in ResusGPS. If selected, prompt an alternative (if applicable) and flag it for Care Signal data collection.
3. **Bulletproof Reassessment Timers:** Replace `setInterval` in `Reassessment.tsx` and `CPRClockTeam.tsx` with `requestAnimationFrame` or Web Worker-based timing to prevent browser background throttling during long codes.
4. **Decouple SBAR Export from Sync:** Ensure `exportClinicalRecord` generates the clipboard text immediately, regardless of whether `recordSessionMutation` succeeds.

### Priority 2: Provider Onboarding & Journey Unification (Short-Term)
1. **Rename "Individual" to "Provider":** Update the database schema and `Home.tsx` role selection to use clear, professional terminology.
2. **Consolidate Dashboards:** Merge the critical features of `/learner-dashboard` (certificates) and `/provider-profile` (stats) into the modern `/home` (Provider Hub) to create a single source of truth.
3. **Unify the Checkout Flow:** Refactor `/payment` and `/enroll` to gracefully handle Fellowship enrollments alongside AHA courses, eliminating the fragmented purchase experience.

### Priority 3: Offline Persistence & Scale (Medium-Term)
1. **Implement IndexedDB Case State:** Wire ResusGPS to save every event to IndexedDB immediately. On load, check for an active case and offer to resume.
2. **Background Sync for Analytics:** Move `recordSessionMutation` and `recordCaseMutation` to a background sync queue so providers never wait for a network request during or immediately after a code.

---

## 4. Next Best Step

**The single highest-impact next action:** 
Fix the defibrillation energy formula in the CPR Clock and implement the "Missing Resource" capture in ResusGPS. This directly impacts patient safety and provides critical data for low-resource hospital rollouts.
