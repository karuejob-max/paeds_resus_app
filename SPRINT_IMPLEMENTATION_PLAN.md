# Institutional Platform - Sprint Implementation Plan

**Goal:** Build production-ready institutional platform MVP with excellent UX  
**Timeline:** Aggressive - Complete all P0 items + key P1 items  
**Status:** In Progress

---

## Implementation Strategy

### Phase 1: Core Staff Management (P0-1, P0-2, P0-3)
**Objective:** Enable admins to manage staff and assign courses

**Components to Build:**
1. ✅ AddStaffForm.tsx - Add individual staff
2. ✅ BulkStaffImport.tsx - CSV upload
3. ✅ StaffList.tsx - Display staff with filtering
4. **CourseAssignmentModal.tsx** - Assign courses to staff
5. **EnrollmentMatrix.tsx** - View staff-course assignments
6. **QuickActions.tsx** - Bulk actions (email, reassign, etc.)

**Backend Procedures:**
- ✅ institution.addStaffMember
- ✅ institution.bulkImportStaff
- ✅ institution.getStaffMembers
- **institution.assignCourse** - Assign course to staff
- **institution.bulkAssignCourse** - Assign course to multiple staff
- **institution.getEnrollments** - Get all enrollments
- **institution.unenrollStaff** - Remove staff from course

---

### Phase 2: Progress Tracking (P0-4)
**Objective:** Track staff training progress and identify at-risk staff

**Components:**
- **StaffProgressTable.tsx** - Main progress dashboard
- **ProgressFilters.tsx** - Filter by status, course, dept
- **ProgressExport.tsx** - Export to CSV
- **ProgressQuickActions.tsx** - Send reminders, extend deadlines

**Backend:**
- **institution.getStaffProgress** - Get progress data
- **institution.sendReminder** - Send email reminder
- **institution.extendDeadline** - Extend course deadline

---

### Phase 3: Certificate Management (P0-5)
**Objective:** Issue, manage, and verify certificates

**Components:**
- **CertificateManagement.tsx** - Admin certificate dashboard
- **VerifyCertificate.tsx** - Public verification page
- **CertificateTemplate.tsx** - PDF certificate design

**Backend:**
- **institution.getCertificates** - List certificates
- **institution.reissueCertificate** - Reissue lost certificate
- **institution.revokeCertificate** - Revoke certificate
- **certificate.verify** - Public verification endpoint

---

### Phase 4: RBAC & Security (P1-1)
**Objective:** Restrict access based on user roles

**Implementation:**
- Add role field to institutionalUsers table (if not exists)
- Create adminProcedure for admin-only operations
- Add permission checks in all procedures
- Create role selector in dashboard

---

## UX Priorities

### 1. Institutional Admin Dashboard
- **Hero Section:** Welcome message + quick stats (staff count, courses assigned, completion rate)
- **Main Tabs:**
  - Overview (KPIs, recent activity)
  - Staff Management (add, import, list, edit)
  - Course Assignments (assign, view matrix)
  - Progress Tracking (dashboard, filters, export)
  - Certificates (manage, verify, issue)
  - Settings (institution details, users, roles)

### 2. Navigation & Accessibility
- Persistent sidebar with all sections
- Breadcrumbs for context
- Search bar for quick navigation
- Mobile-responsive design

### 3. Data Tables
- Sortable columns
- Filterable rows
- Pagination (50/100 rows per page)
- Bulk actions (checkboxes)
- Export to CSV

### 4. Forms & Dialogs
- Clear labels and placeholders
- Inline validation
- Error messages with solutions
- Success confirmations
- Cancel/Back buttons

### 5. Notifications
- Toast notifications for actions
- Email notifications for staff
- Reminder system for overdue staff
- Activity log/audit trail

---

## Implementation Order

### Sprint 1 (Immediate)
1. **CourseAssignmentModal.tsx** - Core feature
2. **institution.assignCourse** - Backend
3. **EnrollmentMatrix.tsx** - View assignments
4. **StaffProgressTable.tsx** - Track progress
5. **institution.getStaffProgress** - Backend

### Sprint 2 (Next)
1. **CertificateManagement.tsx** - Certificate admin
2. **VerifyCertificate.tsx** - Public verification
3. **institution.getCertificates** - Backend
4. **RBAC implementation** - Security layer
5. **Email notifications** - Staff communication

### Sprint 3 (Polish)
1. Advanced analytics
2. Performance optimization
3. Mobile responsiveness
4. Testing & QA
5. Documentation

---

## Database Schema Updates

### Required Tables
- ✅ institutionalStaffMembers
- **institutionalCourseEnrollments** (if not exists)
  - id, institutionId, staffId, courseId, startDate, endDate, status, createdAt
- **institutionalCertificates** (if not exists)
  - id, institutionId, staffId, courseId, issueDate, expiryDate, status, certificateId, revoked
- **institutionalUsers** (if not exists)
  - id, institutionId, userId, role (admin, manager, viewer), createdAt

---

## Testing Strategy

### Unit Tests
- Form validation
- CSV parsing
- Date calculations
- Permission checks

### Integration Tests
- Staff enrollment workflow
- Course assignment workflow
- Progress tracking
- Certificate issuance

### E2E Tests
- Admin dashboard flow
- Staff management flow
- Certificate verification flow

---

## Success Metrics

- [ ] All P0 items completed
- [ ] All forms have validation
- [ ] All tables have filtering/sorting
- [ ] All actions have confirmations
- [ ] All features have tests
- [ ] Mobile responsive
- [ ] <2s page load time
- [ ] Zero console errors

---

## Notes

- Use existing components (Button, Card, Dialog, Table, etc.)
- Follow existing styling (Tailwind + shadcn/ui)
- Keep components reusable
- Add loading states
- Add error handling
- Add empty states
- Add success messages

---

**Last Updated:** 2026-03-24  
**Next Review:** After Sprint 1 completion
