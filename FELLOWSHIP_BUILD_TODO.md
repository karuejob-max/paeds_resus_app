# Fellowship Courses Build - Complete End-to-End Implementation

## Phase 1: Audit & Planning ✅
- [x] Audit existing micro-courses (18 courses found: asthma-ii, anaphylaxis-i/ii, burns-i/ii, dka-i/ii, etc.)
- [x] Check existing assessment schema (modules, quizzes, enrollments in place)
- [x] Review FellowshipDashboard structure (3-pillar system: courses, ResusGPS, Care Signal)
- [x] Identify existing pages (CourseCatalog, FellowshipDashboard, LearnerDashboard)
- [x] Review tRPC endpoints (courses.listAll, courses.enroll, courses.getUserEnrollments)

## Phase 2: Micro-Courses Landing Page UI 🔄
- [ ] Create MicroCoursesLanding.tsx page
  - [ ] Hero section with fellowship overview
  - [ ] Course grid/list with filtering (by condition, level, enrollment status)
  - [ ] Course cards showing: title, duration, level, price, enrollment status
  - [ ] "Start Fellowship" CTA button
  - [ ] Progress tracking for enrolled users
- [ ] Add route to App.tsx (/micro-courses or /fellowship/courses)
- [ ] Integrate with existing CourseCatalog styling/patterns
- [ ] Add enrollment modal integration (MpesaEnrollmentModal)

## Phase 3: Course Content Completion 🔄
- [ ] Verify all 18 micro-courses have complete content
  - [ ] Asthma II (advanced)
  - [ ] Anaphylaxis I & II
  - [ ] Burns I & II
  - [ ] DKA I & II
  - [ ] Hypovolemic Shock I & II
  - [ ] Cardiogenic Shock I & II
  - [ ] Severe Pneumonia/ARDS I & II
  - [ ] Status Epilepticus II
  - [ ] Meningitis I & II (check if exists)
  - [ ] Severe Malaria I & II (check if exists)
  - [ ] Acute Kidney Injury I (check if exists)
  - [ ] Severe Anaemia I (check if exists)
- [ ] Each course must have:
  - [ ] 3-5 modules with learning objectives
  - [ ] Markdown content aligned to ResusGPS ABCDE
  - [ ] Duration estimates (total + per module)
  - [ ] Evidence-based references (AHA PALS 2025, WHO IMCI, etc.)

## Phase 4: Formative Assessment System 🔄
- [ ] Create formative assessment endpoints in courses.ts router
  - [ ] getModuleQuiz(courseId, moduleId)
  - [ ] submitModuleQuiz(enrollmentId, quizId, answers)
  - [ ] getModuleProgress(enrollmentId, moduleId)
- [ ] Design module-level quizzes (3-5 questions per module)
  - [ ] Multiple choice (70%)
  - [ ] True/false (20%)
  - [ ] Short answer (10%)
- [ ] Create quiz UI component (QuizInterface.tsx)
  - [ ] Question display with timer (optional)
  - [ ] Answer selection/input
  - [ ] Immediate feedback (correct/incorrect + explanation)
  - [ ] Progress indicator
- [ ] Implement checkpoint system (user must pass module quiz before next module)
  - [ ] 70% pass threshold for formative assessments
  - [ ] Unlimited retries allowed
  - [ ] Show explanations for incorrect answers

## Phase 5: Summative Assessment System 🔄
- [ ] Create course-level final exam
  - [ ] 20-30 questions covering all modules
  - [ ] 80% pass threshold (required for certification)
  - [ ] 60-minute time limit
  - [ ] Mix of question types (MCQ, true/false, short answer)
- [ ] Create capstone project system
  - [ ] Clinical case analysis (1-2 cases per course)
  - [ ] Provider submits written response (500-1000 words)
  - [ ] Rubric-based scoring (clinical accuracy, reasoning, evidence use)
  - [ ] Instructor review + feedback (async, within 7 days)
- [ ] Create summative assessment UI
  - [ ] Final exam interface (QuizInterface with timer)
  - [ ] Capstone submission form (text editor + file upload)
  - [ ] Results dashboard (score, feedback, pass/fail status)

## Phase 6: Certification & Badge System 🔄
- [ ] Create certificate generation endpoint
  - [ ] generateCertificate(enrollmentId, courseId)
  - [ ] Include: course name, completion date, verification code, provider name
  - [ ] PDF generation (use existing template or create new)
- [ ] Create digital badge system
  - [ ] Badge design for each course (SVG or image)
  - [ ] Badge metadata (issuer, criteria, evidence)
  - [ ] Shareable badge URL (OpenBadges format)
- [ ] Create certificate verification page
  - [ ] Lookup by verification code
  - [ ] Display certificate details + badge
  - [ ] Share/download options
- [ ] Add certificates to user profile
  - [ ] Display all earned certificates
  - [ ] Show expiry date (if applicable)
  - [ ] Download/share functionality

## Phase 7: Fellowship Progress Tracking 🔄
- [ ] Update fellowshipProgress table tracking
  - [ ] Track courses completed (count + percentage)
  - [ ] Track conditions taught (from courses)
  - [ ] Track ResusGPS cases per condition
  - [ ] Track Care Signal monthly reporting
- [ ] Create progress dashboard
  - [ ] 3-pillar visualization (Courses, ResusGPS, Care Signal)
  - [ ] Overall fellowship percentage (0-100%)
  - [ ] Qualification status (eligible/not eligible)
  - [ ] Time to qualification estimate
- [ ] Add progress notifications
  - [ ] Course completion milestone
  - [ ] Pillar achievement milestone
  - [ ] Fellowship qualification alert

## Phase 8: Backend Integration 🔄
- [ ] Update courses.ts router
  - [ ] Add getCourseDetails(courseId) endpoint
  - [ ] Add getModuleContent(courseId, moduleId) endpoint
  - [ ] Add submitModuleQuiz(enrollmentId, quizId, answers) endpoint
  - [ ] Add submitFinalExam(enrollmentId, courseId, answers) endpoint
  - [ ] Add submitCapstone(enrollmentId, courseId, response) endpoint
  - [ ] Add getCertificate(enrollmentId, courseId) endpoint
- [ ] Update fellowship.ts router
  - [ ] Add getProgress(userId) endpoint (already exists, verify it works)
  - [ ] Add getCourseProgress(userId, courseId) endpoint
  - [ ] Add getQualificationStatus(userId) endpoint
- [ ] Ensure tRPC procedures are properly typed
  - [ ] Input validation (Zod schemas)
  - [ ] Error handling
  - [ ] Response types

## Phase 9: Frontend Integration 🔄
- [ ] Create course detail page (CourseDetail.tsx)
  - [ ] Display course info + modules
  - [ ] Module list with completion status
  - [ ] "Start Course" button
  - [ ] Progress bar (modules completed / total)
- [ ] Create module viewer (ModuleViewer.tsx)
  - [ ] Display module content (markdown)
  - [ ] Learning objectives
  - [ ] Module quiz button
  - [ ] Next/previous module navigation
- [ ] Create quiz interface (QuizInterface.tsx)
  - [ ] Question display
  - [ ] Answer options/input
  - [ ] Submit button
  - [ ] Results display (score, feedback)
- [ ] Create final exam interface (FinalExamInterface.tsx)
  - [ ] Timer display
  - [ ] Question navigation
  - [ ] Submit exam button
  - [ ] Results display
- [ ] Create capstone submission form (CapstoneForm.tsx)
  - [ ] Text editor for response
  - [ ] File upload (optional)
  - [ ] Submit button
  - [ ] Submission status display
- [ ] Update FellowshipDashboard
  - [ ] Add "Courses" tab with course list
  - [ ] Show course progress (modules completed)
  - [ ] Show enrollment status (enrolled/in-progress/completed)
  - [ ] Add "Enroll" button for new courses
  - [ ] Link to course detail page

## Phase 10: Testing & Validation 🔄
- [ ] Test complete course flow
  - [ ] Enroll in course
  - [ ] Complete all modules
  - [ ] Pass module quizzes (formative)
  - [ ] Pass final exam (summative)
  - [ ] Submit capstone
  - [ ] Receive certificate
- [ ] Test edge cases
  - [ ] Fail module quiz (should allow retry)
  - [ ] Fail final exam (should allow retry)
  - [ ] Incomplete capstone submission
  - [ ] Missing prerequisites
- [ ] Test fellowship progress calculation
  - [ ] Courses pillar updates correctly
  - [ ] ResusGPS pillar updates correctly
  - [ ] Care Signal pillar updates correctly
  - [ ] Overall percentage calculates correctly
- [ ] Performance testing
  - [ ] Load time for course catalog
  - [ ] Load time for course detail page
  - [ ] Quiz submission latency
  - [ ] Certificate generation time

## Phase 11: Documentation & Launch 🔄
- [ ] Create user documentation
  - [ ] How to enroll in a course
  - [ ] How to complete a course
  - [ ] How to view certificate
  - [ ] How to track fellowship progress
- [ ] Create instructor documentation
  - [ ] How to review capstone submissions
  - [ ] How to provide feedback
  - [ ] How to grade assessments
- [ ] Create admin documentation
  - [ ] How to manage courses
  - [ ] How to view enrollment analytics
  - [ ] How to issue certificates
- [ ] Create launch checklist
  - [ ] All courses have complete content
  - [ ] All assessments are functional
  - [ ] All certificates are generated correctly
  - [ ] All routes are working
  - [ ] All tests pass
  - [ ] Performance benchmarks met
  - [ ] Documentation is complete
  - [ ] User testing completed

## Success Criteria
- ✅ Single unified "Paeds Resus Fellowship" with all 26 micro-courses
- ✅ Micro-courses landing page with course discovery and enrollment
- ✅ Complete course content (modules + learning objectives)
- ✅ Formative assessments (module quizzes, 70% pass threshold)
- ✅ Summative assessments (final exam 80%, capstone project)
- ✅ Digital certificates with verification codes
- ✅ Fellowship progress tracking (3-pillar system)
- ✅ End-to-end course flow (enroll → learn → assess → certify)
- ✅ All tRPC endpoints functional
- ✅ All UI components responsive and user-friendly
- ✅ Documentation complete
- ✅ Ready for launch

## Notes
- Keep all changes in sync with GitHub repo (before/after each phase)
- Use existing patterns from CourseCatalog, FellowshipDashboard
- Reuse existing components (EnrollmentModal, MpesaEnrollmentModal, etc.)
- Evidence-based content: AHA PALS 2025, WHO IMCI, ResusGPS clinical engine
- Focus on solving real problems (learner journey from intro → certification)
- No hallucination: all content must be grounded in evidence
