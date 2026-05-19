# Operational Gap Analysis: AHA Training Site Readiness

**Date:** April 2026
**Author:** Manus AI
**Target:** PaedsResusGPS Platform

## Executive Summary
This report assesses the operational readiness of the PaedsResusGPS platform to function as an aligned training site delivering American Heart Association (AHA) BLS, ACLS, and PALS courses. While the platform has strong foundational elements for institutional management and micro-course delivery, significant structural and operational gaps exist that prevent it from meeting AHA compliance standards and delivering a seamless training site experience. 

The most critical gaps revolve around the lack of a true scheduling system for hands-on skills sessions, premature certificate issuance, missing instructor assignment workflows, and incomplete course content delivery.

---

## 1. Course Delivery & Content Completeness

### Current State
The platform currently treats BLS and ACLS courses primarily as structural placeholders. When a user enrolls in BLS or ACLS, they are directed to a `LearningPath` component that attempts to load modules. However, the actual content (videos, interactive lessons, AHA-specific quizzes) is largely missing or hardcoded as dummy data.

### Gaps Identified
*   **Missing Core Content:** The BLS and ACLS course pages (`CourseBLS.tsx`, `CourseACLS.tsx`) do not currently deliver the comprehensive, AHA-mandated video and text content required for cognitive learning.
*   **No "Hands-On" Skills Integration:** AHA certification requires a hands-on skills assessment (e.g., Megacode for PALS/ACLS, high-quality CPR demonstration for BLS). The platform currently lacks a mechanism to block cognitive completion until a practical skills session is attended and passed.

### Required Actions
1.  **Build Out Course Content:** fully populate the database and `LearningPath` with the actual cognitive modules, videos, and AHA-aligned formative assessments.
2.  **Implement a Two-Part Completion Flow:** Separate the cognitive portion (online modules) from the practical portion (hands-on skills session). The system must track both independently.

---

## 2. Scheduling & Roster Management

### Current State
The platform has an `InstitutionalPortal` and `HospitalAdminDashboard` that include basic UI for scheduling "Training Sessions" and managing a "Staff Roster." However, this functionality is superficially implemented.

### Gaps Identified
*   **No True Booking System:** While an admin can create a schedule entry, there is no workflow for individual learners to view available AHA classes, select a date/time/venue, and book a seat for their required hands-on skills session.
*   **Instructor Assignment Disconnect:** The schedule form allows selecting an "Instructor," but this does not integrate with a robust instructor availability calendar or notify the instructor of their assignment.
*   **Attendance Tracking is Manual Only:** Attendance is marked manually by an admin, rather than through a secure sign-in/sign-out process at the venue (e.g., QR code scanning), which is often required for AHA audit trails.

### Required Actions
1.  **Develop a Learner Booking Flow:** Create a user-facing calendar where enrolled learners can book their hands-on skills sessions based on capacity and location.
2.  **Enhance Instructor Workflows:** Build out the `InstructorPortal` so instructors can view their assigned classes, manage rosters, and officially sign off on practical skills assessments.

---

## 3. Certification & Compliance

### Current State
The certificate generation logic (`certificates.ts`) creates a PDF and a verification hash. However, the trigger for issuing AHA certificates is fundamentally flawed.

### Gaps Identified
*   **Premature Issuance on Payment:** The function `issueCertificateForEnrollmentIfEligible` currently issues a certificate immediately upon payment completion for AHA courses, bypassing the requirement to actually complete the course modules or the hands-on skills assessment.
*   **Validity Period Discrepancy:** The code currently hardcodes a 1-year validity period for all certificates (`expiryDate = new Date(issueDate.getTime() + 365 * 24 * 60 * 60 * 1000)`). AHA BLS, ACLS, and PALS provider cards must be valid for exactly **2 years**.
*   **Lack of AHA Provider Card Format:** The current PDF generation (`certificate-pdf.ts`) produces a generic "Paeds Resus" branded certificate. It does not generate or integrate with the official AHA eCard system, which is mandatory for aligned training sites.

### Required Actions
1.  **Fix Issuance Triggers:** Rewrite the certificate issuance logic so that AHA certificates are *only* generated when both the cognitive modules are 100% complete AND an instructor has marked the practical skills assessment as "Passed" in the roster.
2.  **Correct Validity Period:** Update the expiration logic to 2 years (730 days) specifically for `programType` of `bls`, `acls`, and `pals`.
3.  **AHA eCard Integration/Formatting:** Investigate integration with the AHA Instructor Network API for direct eCard issuance, or redesign the PDF to strictly match the AHA required format for printed provider cards (if permitted by the specific alignment agreement).

---

## 4. Enrollment & Payment Workflows

### Current State
The `Enroll.tsx` page allows users to select BLS, ACLS, or PALS and proceed to a checkout step. 

### Gaps Identified
*   **Lack of Prerequisites Checking:** ACLS and PALS often require a valid BLS certification as a prerequisite. The enrollment flow does not currently check the user's profile for a valid BLS cert before allowing enrollment in advanced courses.
*   **Institutional Bulk Payment Disconnect:** While the backend has a `processBulkEnrollment` function, the frontend institutional portal's payment flow for bulk staff training is not fully wired to generate the correct invoices and automatically enroll the selected staff roster upon payment confirmation.

### Required Actions
1.  **Implement Prerequisite Logic:** Add validation during enrollment to ensure users meet the baseline requirements for advanced AHA courses.
2.  **Finalize Institutional Checkout:** Complete the end-to-end flow where a hospital admin can select 50 staff members, generate a quote, pay via M-Pesa (using the updated Paybill 247247, Account 606854), and have those 50 staff automatically enrolled and notified.

---

## Priority Remediation Plan

To achieve operational readiness as an AHA Training Site, the following sequence of development is recommended:

**Phase 1: Compliance & Core Logic (Immediate)**
*   Fix the certificate issuance trigger (must require course completion + skills sign-off, NOT just payment).
*   Update AHA certificate validity to 2 years.
*   Implement the two-part completion tracking (Cognitive + Practical).

**Phase 2: Content & Delivery (Short-term)**
*   Populate the BLS and ACLS database tables with the actual, finalized cognitive curriculum.
*   Remove placeholder/dummy data from the `LearningPath` component.

**Phase 3: Scheduling & Instructor Tools (Medium-term)**
*   Build the learner-facing class booking calendar for hands-on sessions.
*   Complete the `InstructorPortal` to allow instructors to view rosters and input practical skills grades/sign-offs.

**Phase 4: Institutional Scaling (Long-term)**
*   Finalize the bulk enrollment and M-Pesa payment flow for institutional clients.
*   Implement automated prerequisite checking for course enrollments.
