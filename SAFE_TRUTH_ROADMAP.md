# Safe Truth: Standalone Gap Analysis & Execution Roadmap

**Date:** April 23, 2026  
**Author:** Manus AI  
**Component:** Parent Safe-Truth  

---

## 1. Executive Summary: The True Purpose of Safe Truth

Safe-Truth is **not** a feature of ResusGPS. It is a standalone, parent-facing product designed to capture the realities of the healthcare system that clinicians often miss or normalize. According to the strategic foundation (`STRATEGIC_FOUNDATION.md` §9 and §10), a single well-documented guardian complaint can reveal systemic failures—such as administrative flows delaying clinical triage, walk-in emergencies being bypassed, or perceived two-tier services. 

Its goal is to act as a **community voice diagnostic** for institutions. If a hospital admin wants to understand why children are deteriorating in their waiting rooms, Safe-Truth must provide the data to answer that question. 

However, the current implementation of Safe-Truth fails to collect the *right* data, and its architecture is deeply fragmented, rendering it virtually useless to a hospital administrator trying to fix their system.

---

## 2. The Structural & Data Collection Failures

### 2.1 The Data Collection Gap (Form vs. Admin Needs)
To fix a system, a hospital admin needs specific, actionable data. The current `ParentSafeTruthForm` asks:
- Age of the child
- Type of emergency (broad categories)
- "Did you recognize a problem?"
- "Did you call for help?"
- "How long until help arrived?" (under 5, 5-10, 10-20, 20+ mins)
- "What could have been better?" (7 broad checkboxes like "communication" or "equipment")

**Why this is insufficient for a Hospital Admin:**
If an admin sees a report saying "It took 20 minutes to get help and equipment was missing," they cannot act on it. They need to know:
1. **Where** did this happen? (Outpatient queue? Casualty? Inpatient ward?)
2. **When** did this happen? (Night shift? Weekend? During handover?)
3. **What specifically** delayed care? (Was it the billing queue? Was it the registration desk? Was the triage nurse absent?)
4. **What equipment** was missing? (Oxygen? IV lines? Medications?)

The form currently collects *feelings* but lacks the structured *operational data* required for an admin to implement a "Treat first, stabilise, then bill" policy (`STRATEGIC_FOUNDATION.md` §10).

### 2.2 The Architectural Fragmentation
The codebase reveals a severe architectural split that breaks the Safe-Truth data pipeline:

1. **The Form Calls the Wrong Router:** 
   The `ParentSafeTruthForm` component currently submits data using `trpc.careSignalEvents.logEvent.useMutation()`. `CareSignal` is explicitly defined in the DNA as the **provider-facing** incident reporting tool. By pushing parent data into the `careSignalEvents` table, the system conflates subjective parent timelines with objective provider clinical logs.
   
2. **Abandoned Database Tables:** 
   The database contains highly specific tables for Safe-Truth (`parentSafeTruthSubmissions`, `parentSafeTruthEvents`, `systemDelayAnalysis`). Furthermore, the `parent-safetruth.ts` router has a dedicated `submitTimeline` endpoint designed to capture a detailed sequence of events (arrival → doctor seen → intervention → monitoring). **The current UI form does not use this endpoint or these tables.**

3. **Missing Institutional Routing:**
   Even if the data were collected perfectly, there is no mechanism routing it to the specific hospital. The `hospitalId` field is either optional or missing in the current form submission flow, meaning reports float in the ether rather than landing on a specific Hospital Admin's dashboard.

---

## 3. The Execution Roadmap: Building a Diagnostic Engine

To transform Safe-Truth into a tool that hospital administrators can actually use to drive institutional change, we must rebuild the form and the data pipeline.

### Phase 1: Fix the Architecture & Routing (The "Plumbing")
*Goal: Ensure parent data goes to the correct database tables and is linked to the correct hospital.*

| Priority | Task | Description | Technical Implementation |
| :--- | :--- | :--- | :--- |
| **1.1** | **Switch to Correct Router** | Point the `ParentSafeTruthForm` to the `parentSafeTruth.submitTimeline` endpoint instead of `careSignalEvents.logEvent`. | Refactor `client/src/components/ParentSafeTruthForm.tsx`. |
| **1.2** | **Mandatory Facility Selection** | Ensure every Safe-Truth submission is tied to a specific facility. | Add a facility search/dropdown to the form. If a facility isn't listed, allow text entry but flag it for global admin mapping. |
| **1.3** | **Hospital Admin Dashboard** | Surface Safe-Truth data to institutional users. | Create a dedicated tab in the `HospitalAdminDashboard` that pulls from `parentSafeTruthSubmissions` where `hospitalId` matches the admin's facility. |

### Phase 2: Redesign the Form for Actionable QI Data
*Goal: Ask the right questions so hospital admins can fix specific bottlenecks.*

| Priority | Task | Description | Technical Implementation |
| :--- | :--- | :--- | :--- |
| **2.1** | **Capture the "Front Door" Journey** | Ask specific questions about the triage and registration process to identify administrative delays (`STRATEGIC_FOUNDATION.md` §10). | Add questions: "Were you asked to pay or register before a nurse checked your child?" and "Where did the delay happen? (Gate, Registration, Waiting Room, Ward)." |
| **2.2** | **Specific Gap Details** | If a parent ticks "Equipment missing," dynamically prompt for details. | Add conditional text inputs: "What did they say was missing?" (e.g., Oxygen, specific drug). |
| **2.3** | **Shift & Location Data** | Capture the exact time of arrival and the specific department to identify shift-based failures. | Add fields for "Time of arrival (Morning/Night)" and "Department (Casualty/Ward)." |

### Phase 3: The Timeline Reconstruction
*Goal: Utilize the abandoned `parentSafeTruthEvents` schema to build a visual timeline of the parent's experience.*

| Priority | Task | Description | Technical Implementation |
| :--- | :--- | :--- | :--- |
| **3.1** | **Timeline UI Component** | Redesign the form from a single static page into a step-by-step timeline builder (Arrival → Seen by Nurse → Seen by Doctor → Intervention). | Build a new multi-step wizard UI that maps to the `eventSchema` in `parent-safetruth.ts`. |
| **3.2** | **Automated Delay Calculation** | Use the `analyzeSystemDelays` helper function to automatically calculate the minutes lost between arrival and intervention. | Ensure the `submitTimeline` mutation correctly triggers the delay analysis and populates the `systemDelayAnalysis` table. |

### Phase 4: Language & Accessibility
*Goal: Ensure the tool is accessible to the target demographic in LMICs.*

| Priority | Task | Description | Technical Implementation |
| :--- | :--- | :--- | :--- |
| **4.1** | **Swahili Translation** | The form must be fully translated into Swahili using the existing `i18n` framework. | Wrap all text in `ParentSafeTruthForm` with `t()` and add missing keys to `shared/i18n.ts`. |

---

## 4. Conclusion & Next Best Step

Safe-Truth is currently operating as a generic feedback form rather than a sharp diagnostic tool. By fixing the architectural routing and redesigning the form to capture operational bottlenecks (specifically the "registration before triage" anti-pattern), we can give hospital administrators the exact data they need to reorganize their emergency flows.

**The single highest-impact next action is Phase 1.1 and 1.2:** Refactor the `ParentSafeTruthForm` to use the `parentSafeTruth.submitTimeline` endpoint and enforce facility selection. Until the data lands in the right tables attached to the right hospitals, no further analysis or UI improvements will matter.
