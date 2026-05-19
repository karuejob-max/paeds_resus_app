# ResusGPS Institutional Operating System (IOS) — Integration Blueprint
**Version:** 1.0  
**Author:** Manus AI (Execution Agent, Paeds Resus)  
**Date:** May 1, 2026  
**Status:** Implementation-Ready

---

## 1. The Strategic Vision

> "We don't go hospital by hospital. We go app by app."

The goal is to make the **ResusGPS Institutional Portal** a complete, plug-and-play **Emergency Response Operating System** for any hospital in Africa and beyond. When Consolata Hospital Mathari (CHM) succeeds, the entire CHM setup — their departments, their ERT protocol, their training sign-up flow, their Code Blue analytics, and their provider scorecards — becomes the **Gold Standard Template** that any new institution can deploy in under 60 minutes.

The new hospital does not need a consultant visit, a Google Form, or a WhatsApp group. They go to the app.

---

## 2. What We Built at CHM (The Gold Standard)

Everything built in this chat session maps directly to features that must live in the Institutional Portal:

| What We Built (CHM) | Where It Lives in the App | Status |
| :--- | :--- | :--- |
| ERT Training Sign-Up Form | **"ERT Recruitment"** tab in Institutional Portal | **To Build** |
| Department list + sub-departments | **Onboarding Wizard** (Step 2: Configure Departments) | **Partial (exists)** |
| Nurse totals per department | **Staff Management** tab (headcount field) | **Partial (exists)** |
| 100% Sponsorship Challenge | **"ERT Recruitment"** tab — Sponsorship Tracker widget | **To Build** |
| AHA Installment Payment Plan | **Payments** tab — Installment Schedule feature | **To Build** |
| V2 Emergency Response Protocol | **"ERT Protocol"** tab — Protocol Library | **To Build** |
| Code Blue Reporting Form | **"Incidents"** tab (already exists, needs ERT fields) | **Extend Existing** |
| 0-10 Granular Scoring Rubric | **"ERT Analytics"** tab — Auto-scoring engine | **To Build** |
| North/South Pole Leaderboard | **"ERT Analytics"** tab — Pole vs. Pole widget | **To Build** |
| Provider Scorecards | **"ERT Analytics"** tab — Individual Scorecard view | **To Build** |
| Weekly WhatsApp Leaderboard | **Automated Notifications** — Weekly digest | **To Build** |

---

## 3. The 4-Module Institutional OS Architecture

### MODULE 1: ERT SETUP (Onboarding)
*"Configure your hospital's emergency response structure in 10 minutes."*

**Flow:**
1. Admin logs into Institutional Portal.
2. Clicks **"Set Up ERT"** (new button on Overview tab).
3. **Step 1:** Name your ERT (e.g., "CHM Emergency Response Team").
4. **Step 2:** Select departments from a pre-loaded list (or add custom ones with sub-departments).
5. **Step 3:** Enter headcount per department (used for 100% Challenge tracking).
6. **Step 4:** Assign ERCs (Emergency Response Coordinators) per department from existing staff list.
7. **Step 5:** Select Pole structure (North/South or custom groupings).
8. **Step 6:** Upload or select Emergency Response Protocol (from Protocol Library or upload PDF).
9. **Done:** System generates a unique **ERT Dashboard** for the institution.

**Key Principle:** CHM's setup is saved as the **"Level 5 Kenya Template"** — any similar hospital can import it with one click and just change the names.

---

### MODULE 2: ERT RECRUITMENT (Training Sign-Up)
*"Replace the Google Form. The app IS the form."*

**Features:**
- **Shareable Sign-Up Link:** Every institution gets a unique, branded sign-up URL (e.g., `resusgps.com/join/chm-ert`).
- **Training Selection:** BLS / ACLS / Both (with AHA-aligned descriptions).
- **AHA eCard Verification:** Upload or link existing certificate for exemption.
- **Installment Schedule:** Displayed clearly with M-Pesa STK Push integration for deposit collection.
- **100% Challenge Tracker:** Live widget showing department sign-up % and sponsorship status.
- **Auto-Add to WhatsApp Group:** After sign-up, a redirect to the institution's training WhatsApp group (configurable by admin).
- **Duplicate Prevention:** Built-in (phone number deduplication, same as Google Form logic).

**For the Admin:**
- Real-time dashboard showing sign-ups by department.
- One-click export to CSV.
- Automatic email/SMS confirmation to each registrant.

---

### MODULE 3: ERT PROTOCOL LIBRARY
*"The protocol is in the app, not in a PDF on a WhatsApp group."*

**Features:**
- **Protocol Viewer:** Renders the V2 CHM Emergency Response Protocol natively in the app (not a PDF download).
- **Role-Based View:** A nurse sees their role. An ERC sees the full protocol + their coordination duties.
- **Resus Board Generator:** Admin can print/display the 8-role Resus Board for any shift directly from the app.
- **Crash Cart Checklist:** Digital version of the CHMCRASHCARTV1 checklist, with shift-by-shift sign-off.
- **Protocol Version Control:** When a new version is published, all staff are notified and must acknowledge.

---

### MODULE 4: ERT ANALYTICS (The Scoreboard)
*"Every Code Blue becomes a data point. Every data point improves the next response."*

This is the most powerful module. It extends the existing **"Incidents"** tab with the full ERT analytics engine.

**Sub-Features:**

**4a. Code Blue Report (Extended)**
- Extends the existing incident form with the new fields: Patient Name, Primary Diagnosis, CCF %, Time to First Shock, Expert Consultation Time.
- Auto-calculates the **0-10 score** for each KPI immediately on submission.
- Generates a **"Code Blue Score Card"** PDF for debrief.

**4b. Pole vs. Pole Leaderboard**
- Real-time comparison of North Pole vs. South Pole performance.
- Metrics: Avg. Response Time, Avg. CCF%, ROSC Rate, Avg. Score.
- Resets weekly. Historical data preserved.

**4c. Department Leaderboard**
- Ranks all 13 departments by their average Code Blue score.
- Color-coded: Green (Elite 90+), Yellow (Developing 70-89), Red (Critical <70).
- Visible to all staff (motivational transparency).

**4d. Individual Provider Scorecards**
- Tracks every nurse's performance as ERTL across all codes they've led.
- Metrics: Codes Led, Avg. Score, Personal Best CCF, ROSC Rate.
- Certification Impact: Compares ACLS vs. BLS-only vs. Uncertified provider scores.
- **"Golden Stethoscope"** award badge for consistent Elite performers.

**4e. Automated Weekly Digest**
- Every Monday at 8:00 AM, the system sends a WhatsApp/SMS message to the institution's nursing group with the previous week's leaderboard.
- Format: Pole standings, Top 3 departments, Top 3 individual performers.
- No manual work required from the admin.

---

## 4. The "New Hospital" Experience (Scalability)

When a new hospital (e.g., Nyeri County Hospital) signs up for the Institutional Portal:

1. **Onboarding Wizard** asks: "Are you setting up an ERT for the first time?"
2. If Yes → **"Use a Template"** option appears.
3. Available templates: **"Level 5 Kenya (CHM)"**, **"District Hospital"**, **"Subcounty Hospital"**.
4. Admin selects a template → all departments, pole structure, and protocol are pre-loaded.
5. Admin only needs to: add their staff, set headcounts, and assign ERCs.
6. **Total setup time: < 30 minutes.**

This is the "GPS" model: the route is pre-calculated. You just drive.

---

## 5. Implementation Priority (Scrum Backlog Additions)

| Priority | Feature | Effort | Sprint |
| :---: | :--- | :---: | :--- |
| **P0** | Extend Incidents tab with ERT Code Blue fields + auto-scoring | 8 pts | Sprint 1 |
| **P0** | ERT Recruitment tab (sign-up form + installment display) | 13 pts | Sprint 1 |
| **P1** | 100% Challenge Tracker widget | 5 pts | Sprint 2 |
| **P1** | Pole vs. Pole Leaderboard widget | 8 pts | Sprint 2 |
| **P1** | Department Leaderboard widget | 5 pts | Sprint 2 |
| **P1** | Individual Provider Scorecard view | 8 pts | Sprint 2 |
| **P2** | ERT Protocol Library (native viewer) | 13 pts | Sprint 3 |
| **P2** | Crash Cart Digital Checklist | 5 pts | Sprint 3 |
| **P2** | Resus Board Generator (printable) | 3 pts | Sprint 3 |
| **P2** | Automated Weekly WhatsApp Digest | 8 pts | Sprint 3 |
| **P3** | Hospital Template System (CHM as Gold Standard) | 13 pts | Sprint 4 |
| **P3** | AHA eCard Verification integration | 8 pts | Sprint 4 |

---

## 6. Revenue Model (Why This Scales Financially)

| Tier | What They Get | Price |
| :--- | :--- | :--- |
| **Free** | ResusGPS clinical decision support (individual) | KES 0 |
| **Institutional Basic** | Staff management + training enrollment | KES 5,000/month |
| **Institutional Pro** | Full IOS (ERT Setup + Recruitment + Analytics) | KES 15,000/month |
| **Institutional Enterprise** | Multi-facility + custom templates + dedicated support | KES 50,000/month |

**CHM is the first Pro customer.** Their success story is the sales pitch for every other hospital.

---

## 7. Files to Create/Modify in the App

### New Files:
- `client/src/components/ERTRecruitmentTab.tsx`
- `client/src/components/ERTAnalyticsTab.tsx`
- `client/src/components/PoleLeaderboard.tsx`
- `client/src/components/DepartmentLeaderboard.tsx`
- `client/src/components/ProviderScorecard.tsx`
- `client/src/components/SponsorshipTracker.tsx`
- `client/src/components/CrashCartChecklist.tsx`
- `server/routers/ert-analytics.ts`
- `server/routers/ert-recruitment.ts`
- `drizzle/migrations/xxxx_ert_analytics.sql`

### Files to Modify:
- `client/src/pages/HospitalAdminDashboard.tsx` — Add "ERT Recruitment" and "ERT Analytics" tabs
- `server/routers/institution.ts` — Add ERT setup procedures
- `drizzle/schema.ts` — Add ERT tables (code_blue_reports, ert_scores, provider_scorecards)

---

## 8. The One-Line Pitch for New Hospitals

> "Sign up for ResusGPS Institutional. In 30 minutes, your hospital has a fully configured Emergency Response Team, a training recruitment system, a real-time Code Blue analytics dashboard, and a weekly performance leaderboard — all aligned with AHA 2030 standards. No consultants. No Google Forms. No WhatsApp chaos. Just the app."
