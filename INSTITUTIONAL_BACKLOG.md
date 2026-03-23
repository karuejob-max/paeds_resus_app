# Paeds Resus - Institutional Platform Backlog

**Last Updated:** 2026-03-24  
**Project:** Institutional Platform MVP  
**Status:** In Development

---

## 📋 Overview

This backlog tracks all features, bugs, and improvements for the institutional platform. It serves as the source of truth for development priorities and progress tracking.

**Legend:**
- 🔴 **P0 (Blocker)** - Blocks institutional deployment
- 🟡 **P1 (High)** - Critical for MVP
- 🟢 **P2 (Medium)** - Important but not blocking
- 🔵 **P3 (Low)** - Nice-to-have

**Status:**
- `[ ]` Not Started
- `[🔄]` In Progress
- `[✅]` Done
- `[❌]` Blocked

---

## 🔴 P0: Blocking Issues (Must Have for MVP)

### P0-1: Staff Enrollment & Management UI
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 8 points  
**Sprint:** -

**Description:**
Create UI for institutional admins to enroll individual staff members.

**Acceptance Criteria:**
- [ ] Form to add single staff member (name, email, phone, designation, department)
- [ ] Validation: email format, required fields
- [ ] Success confirmation with staff ID
- [ ] Ability to edit staff details after creation
- [ ] Ability to delete/deactivate staff members
- [ ] Staff list view with search/filter by name, department, status

**Subtasks:**
- [ ] Create `AddStaffForm.tsx` component
- [ ] Add tRPC procedure `institution.addStaffMember`
- [ ] Add database migration if needed
- [ ] Create staff list view component
- [ ] Add edit staff modal
- [ ] Write tests for form validation

**Notes:**
- Should integrate with existing `HospitalAdminDashboard.tsx`
- Consider adding avatar/profile picture upload

**Related Files:**
- `client/src/pages/HospitalAdminDashboard.tsx`
- `server/routers/institution.ts`
- `drizzle/schema.ts`

---

### P0-2: Bulk Staff Import (CSV/Excel)
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 13 points  
**Sprint:** -

**Description:**
Allow institutional admins to upload CSV/Excel file with multiple staff members at once.

**Acceptance Criteria:**
- [ ] CSV template download (with example data)
- [ ] File upload UI (drag-and-drop + file picker)
- [ ] CSV parsing with error handling
- [ ] Validation preview before import (show errors, warnings)
- [ ] Bulk insert with transaction (all-or-nothing)
- [ ] Import summary report (X created, Y skipped, Z errors)
- [ ] Ability to download error report

**CSV Format:**
```
First Name,Last Name,Email,Phone,Designation,Department
John,Doe,john@hospital.com,0712345678,Nurse,ICU
Jane,Smith,jane@hospital.com,0712345679,Doctor,Emergency
```

**Subtasks:**
- [ ] Create CSV template file
- [ ] Build file upload component with validation
- [ ] Implement CSV parsing library (papaparse already installed)
- [ ] Add tRPC procedure `institution.bulkImportStaff`
- [ ] Create import preview modal
- [ ] Add error handling and reporting
- [ ] Write tests for CSV parsing

**Related Files:**
- `client/src/components/BulkStaffImport.tsx` (new)
- `server/routers/institution.ts`
- `public/templates/staff-import-template.csv` (new)

---

### P0-3: Course Assignment & Enrollment
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 13 points  
**Sprint:** -

**Description:**
Allow admins to assign staff members to courses and track enrollment status.

**Acceptance Criteria:**
- [ ] Course selection dropdown (BLS, ACLS, PALS, Bronze, Silver, Gold)
- [ ] Staff multi-select (or bulk select all)
- [ ] Training start date picker
- [ ] Training end date picker (auto-calculated based on course duration)
- [ ] Batch enrollment with confirmation
- [ ] Enrollment status tracking (not started, in progress, completed)
- [ ] Ability to unenroll staff from course
- [ ] View staff-course matrix (who's in what)

**Acceptance Criteria:**
- [ ] Bulk assign course to multiple staff
- [ ] Set training schedule (start/end dates)
- [ ] Automatic email notification to staff
- [ ] Enrollment status dashboard
- [ ] Ability to extend deadlines
- [ ] Cancel enrollment with reason

**Subtasks:**
- [ ] Create `CourseAssignmentModal.tsx` component
- [ ] Add database schema for course enrollments
- [ ] Add tRPC procedures:
  - `institution.assignCourse`
  - `institution.bulkAssignCourse`
  - `institution.getEnrollments`
  - `institution.unenrollStaff`
- [ ] Create staff-course matrix view
- [ ] Implement email notifications
- [ ] Write tests

**Related Files:**
- `client/src/components/CourseAssignmentModal.tsx` (new)
- `server/routers/institution.ts`
- `drizzle/schema.ts`

---

### P0-4: Progress Tracking Dashboard
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 13 points  
**Sprint:** -

**Description:**
Create detailed progress tracking view showing individual staff completion status.

**Acceptance Criteria:**
- [ ] Staff progress table with columns:
  - Staff name
  - Course assigned
  - Start date
  - End date
  - Completion status (%)
  - Last activity date
  - Status badge (Not Started, In Progress, Completed, Overdue)
- [ ] Filterable by: status, course, department, date range
- [ ] Sortable columns
- [ ] Drill-down to individual staff details
- [ ] Identify overdue staff
- [ ] Identify at-risk staff (< 50% complete)

**Acceptance Criteria:**
- [ ] Table with 100+ rows (pagination)
- [ ] Search by staff name/email
- [ ] Export to CSV
- [ ] Color-coded status indicators
- [ ] Quick actions (send reminder, extend deadline, mark complete)

**Subtasks:**
- [ ] Create `StaffProgressTable.tsx` component
- [ ] Add tRPC procedure `institution.getStaffProgress`
- [ ] Implement filtering logic
- [ ] Add export to CSV functionality
- [ ] Create quick action buttons
- [ ] Write tests

**Related Files:**
- `client/src/components/StaffProgressTable.tsx` (new)
- `server/routers/institution.ts`

---

### P0-5: Certificate Management & Verification
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 13 points  
**Sprint:** -

**Description:**
Create certificate management system for institutional admins and public verification.

**Acceptance Criteria:**
- [ ] Admin view: List of issued certificates
- [ ] Filter by: staff member, course, date range, status
- [ ] Ability to view certificate details
- [ ] Ability to reissue certificate (if lost)
- [ ] Ability to revoke certificate (with reason)
- [ ] Certificate expiry tracking
- [ ] Public verification page (verify certificate by ID + name)
- [ ] Certificate download (PDF)

**Public Verification:**
- [ ] URL: `/verify-certificate?id=CERT123&name=John+Doe`
- [ ] Shows: Staff name, course, issue date, expiry date, institution
- [ ] Tamper-proof (QR code or signature)

**Subtasks:**
- [ ] Create `CertificateManagement.tsx` component
- [ ] Create `VerifyCertificate.tsx` public page
- [ ] Add tRPC procedures:
  - `institution.getCertificates`
  - `institution.reissueCertificate`
  - `institution.revokeCertificate`
  - `certificate.verify` (public)
- [ ] Implement PDF generation (certificate template)
- [ ] Add certificate ID generation (unique, tamper-proof)
- [ ] Write tests

**Related Files:**
- `client/src/components/CertificateManagement.tsx` (new)
- `client/src/pages/VerifyCertificate.tsx` (new)
- `server/routers/institution.ts`
- `server/routers/certificate.ts` (new)

---

## 🟡 P1: High Priority (MVP)

### P1-1: Role-Based Access Control (RBAC)
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 21 points  
**Sprint:** -

**Description:**
Implement role-based permissions for institutional users.

**Roles:**
- **Hospital Director** - Full access to all data
- **Training Coordinator** - Manage staff, courses, view reports
- **Finance Officer** - View costs, payments, billing
- **Department Head** - View only their department's data
- **Staff Member** - View own progress, certificates

**Acceptance Criteria:**
- [ ] Role assignment during onboarding
- [ ] Role management UI (admin can change roles)
- [ ] Permission checks on all queries
- [ ] Data filtering by role/department
- [ ] UI elements hidden based on permissions
- [ ] Audit log of role changes

**Subtasks:**
- [ ] Add role field to user schema
- [ ] Add role selection to onboarding
- [ ] Create permission middleware for tRPC
- [ ] Implement data filtering by role
- [ ] Update all queries to respect permissions
- [ ] Create role management component
- [ ] Write tests for permissions

**Related Files:**
- `drizzle/schema.ts`
- `server/_core/context.ts`
- `server/routers/institution.ts`

---

### P1-2: Bulk Actions (Reminders, Reassign, etc.)
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 13 points  
**Sprint:** -

**Description:**
Add bulk operations for common administrative tasks.

**Bulk Actions:**
- [ ] Send reminder emails to incomplete staff
- [ ] Extend deadline for multiple staff
- [ ] Reassign course to different staff
- [ ] Mark as complete (admin override)
- [ ] Deactivate multiple staff members

**Acceptance Criteria:**
- [ ] Multi-select checkbox in staff table
- [ ] Bulk action dropdown menu
- [ ] Confirmation dialog before action
- [ ] Progress indicator during bulk operation
- [ ] Success/error summary after completion
- [ ] Undo option (where applicable)

**Subtasks:**
- [ ] Add multi-select to staff table
- [ ] Create bulk action menu component
- [ ] Add tRPC procedures for each bulk action
- [ ] Implement email sending for reminders
- [ ] Add progress tracking
- [ ] Write tests

**Related Files:**
- `client/src/components/StaffProgressTable.tsx`
- `server/routers/institution.ts`

---

### P1-3: Institution Settings & Configuration
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 8 points  
**Sprint:** -

**Description:**
Allow institutional admins to update settings after onboarding.

**Settings:**
- [ ] Institution details (name, address, phone, email)
- [ ] Contact person (name, title, email, phone)
- [ ] Training preferences (default duration, schedule type)
- [ ] Notification preferences (email reminders, frequency)
- [ ] Billing information (payment method, invoice email)

**Acceptance Criteria:**
- [ ] Settings form with validation
- [ ] Save changes with confirmation
- [ ] Audit log of changes
- [ ] Ability to update institution logo/branding

**Subtasks:**
- [ ] Create `InstitutionSettings.tsx` component
- [ ] Add tRPC procedure `institution.updateSettings`
- [ ] Add form validation
- [ ] Write tests

**Related Files:**
- `client/src/components/InstitutionSettings.tsx` (new)
- `server/routers/institution.ts`

---

### P1-4: Email Notifications & Reminders
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 13 points  
**Sprint:** -

**Description:**
Implement automated email notifications for staff and admins.

**Email Types:**
- [ ] Staff enrollment confirmation
- [ ] Course assignment notification
- [ ] Training reminder (1 day before start)
- [ ] Progress reminder (50% complete, 75% complete)
- [ ] Deadline approaching (3 days before)
- [ ] Overdue notification
- [ ] Completion congratulations
- [ ] Certificate issued notification

**Acceptance Criteria:**
- [ ] Email templates for each type
- [ ] Customizable email content
- [ ] Scheduled email sending (not real-time)
- [ ] Email delivery tracking
- [ ] Unsubscribe option
- [ ] Admin can manually send emails

**Subtasks:**
- [ ] Create email templates
- [ ] Add email service integration
- [ ] Create email queue system
- [ ] Add tRPC procedures for manual emails
- [ ] Implement scheduled email sending
- [ ] Write tests

**Related Files:**
- `server/services/email.ts` (new)
- `server/routers/institution.ts`

---

### P1-5: Compliance & Audit Logging
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 13 points  
**Sprint:** -

**Description:**
Track all institutional actions for compliance and auditing.

**Audit Log Should Track:**
- [ ] User login/logout
- [ ] Staff enrollment/deletion
- [ ] Course assignment/removal
- [ ] Certificate issuance/revocation
- [ ] Settings changes
- [ ] Role changes
- [ ] Bulk operations
- [ ] Data exports

**Acceptance Criteria:**
- [ ] Audit log table with: timestamp, user, action, details, IP address
- [ ] Filterable by: user, action, date range
- [ ] Exportable to CSV
- [ ] Retention policy (keep for 2 years)
- [ ] Admin view of audit logs

**Subtasks:**
- [ ] Add audit log schema
- [ ] Create audit logging middleware
- [ ] Add audit log view component
- [ ] Implement export functionality
- [ ] Write tests

**Related Files:**
- `drizzle/schema.ts`
- `server/_core/audit.ts` (new)
- `server/routers/institution.ts`

---

## 🟢 P2: Medium Priority

### P2-1: Advanced Analytics & Reporting
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 21 points  
**Sprint:** -

**Description:**
Create advanced analytics and custom reporting for institutional leaders.

**Reports:**
- [ ] Completion trends (over time)
- [ ] Department comparison
- [ ] Course performance (which courses have highest completion)
- [ ] Staff performance (top performers, at-risk)
- [ ] ROI calculation (cost per certification)
- [ ] Impact metrics (estimated lives saved)

**Acceptance Criteria:**
- [ ] Charts and visualizations
- [ ] Exportable to PDF/Excel
- [ ] Scheduled report delivery (email)
- [ ] Custom report builder
- [ ] Benchmarking (compare with other institutions)

**Subtasks:**
- [ ] Create analytics dashboard component
- [ ] Add chart library (already have plotly)
- [ ] Add tRPC procedures for analytics data
- [ ] Create report templates
- [ ] Implement PDF export
- [ ] Write tests

**Related Files:**
- `client/src/components/AnalyticsDashboard.tsx` (new)
- `server/routers/analytics.ts` (new)

---

### P2-2: Training Schedule Calendar
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 13 points  
**Sprint:** -

**Description:**
Visual calendar for managing training schedules.

**Acceptance Criteria:**
- [ ] Month/week/day view
- [ ] Drag-and-drop to reschedule
- [ ] Color-coded by course
- [ ] Show staff count per session
- [ ] Ability to create recurring sessions
- [ ] Conflict detection (overlapping schedules)

**Subtasks:**
- [ ] Choose calendar library
- [ ] Create calendar component
- [ ] Add drag-and-drop functionality
- [ ] Implement conflict detection
- [ ] Write tests

**Related Files:**
- `client/src/components/TrainingCalendar.tsx` (new)

---

### P2-3: Staff Performance Analytics
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 13 points  
**Sprint:** -

**Description:**
Individual staff member performance tracking and insights.

**Metrics:**
- [ ] Course completion time (vs average)
- [ ] Quiz/assessment scores
- [ ] Engagement metrics (time spent, sessions attended)
- [ ] Certification status
- [ ] Performance trend (improving, declining)

**Acceptance Criteria:**
- [ ] Individual staff profile page
- [ ] Performance charts
- [ ] Recommendations for improvement
- [ ] Comparison with peer group

**Subtasks:**
- [ ] Create staff profile component
- [ ] Add analytics queries
- [ ] Create performance charts
- [ ] Write tests

---

## 🔵 P3: Low Priority (Nice-to-Have)

### P3-1: AI-Powered Recommendations
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 21 points  
**Sprint:** -

**Description:**
Use AI to provide actionable recommendations for institutional improvement.

**Recommendations:**
- [ ] "Staff in ICU have 40% lower completion - consider on-site training"
- [ ] "BLS course has 90% completion - consider expanding"
- [ ] "John Doe is 2 weeks behind - send personalized reminder"
- [ ] "Your institution is in bottom 10% for completion - here's why"

**Subtasks:**
- [ ] Design recommendation engine
- [ ] Integrate with LLM
- [ ] Create recommendation UI
- [ ] Write tests

---

### P3-2: Mobile App
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 55 points  
**Sprint:** -

**Description:**
Native mobile app for institutional staff to access training on mobile.

---

### P3-3: Integration with Hospital Systems
**Status:** `[ ]` Not Started  
**Assigned to:** -  
**Effort:** 34 points  
**Sprint:** -

**Description:**
Integrate with hospital HRIS/LMS systems (SAP, Workday, etc.)

---

## 📊 Tracking & Assignment

### How to Use This Backlog

1. **Assign a Task:**
   ```
   **Assigned to:** @cursor (or @manus)
   ```

2. **Update Status:**
   ```
   **Status:** `[🔄]` In Progress → `[✅]` Done
   ```

3. **Add Comments:**
   ```
   **Notes:**
   - Started implementation on 2026-03-24
   - Blocked by P0-1 (waiting for staff schema)
   - PR: #123
   ```

4. **Track Progress:**
   - Move to next sprint
   - Update effort estimate if needed
   - Add blockers/dependencies

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/P0-1-staff-enrollment

# Commit with reference
git commit -m "feat: Add staff enrollment UI (P0-1)"

# Push and create PR
git push origin feature/P0-1-staff-enrollment

# Update backlog
# Update INSTITUTIONAL_BACKLOG.md with PR link and status
git commit -m "docs: Update backlog - P0-1 in progress"
```

### Sprint Planning

**Current Sprint:** Sprint 1 (2026-03-24 to 2026-04-07)

**Sprint Goals:**
- [ ] Complete P0-1: Staff Enrollment UI
- [ ] Complete P0-2: Bulk Import
- [ ] Complete P0-3: Course Assignment

---

## 🔗 Related Documents

- [Project README](./README.md)
- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [Database Schema](./drizzle/schema.ts)
- [API Documentation](./docs/API.md)

---

## 📞 Questions?

For questions about backlog items:
1. Check the "Notes" section for context
2. Review related files
3. Ask in the PR/issue comments
4. Schedule a sync with the team

---

**Last Updated By:** Manus  
**Last Updated:** 2026-03-24 14:30 UTC  
**Next Review:** 2026-03-31 (Sprint Planning)
