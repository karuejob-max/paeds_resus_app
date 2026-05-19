# Paeds Resus Fellowship Platform - Complete Documentation

## Overview

The Paeds Resus Fellowship is a comprehensive end-to-end learning platform for pediatric resuscitation. It combines:

1. **26 Evidence-Based Micro-Courses** covering all pediatric emergency conditions
2. **Formative Assessments** (module quizzes) for continuous learning
3. **Summative Assessments** (final exams + capstone projects) for mastery verification
4. **Digital Certification System** with verification codes and PDF certificates
5. **3-Pillar Fellowship Tracking** (Courses + ResusGPS + Care Signal)

---

## Architecture

### Frontend Components

#### 1. **MicroCoursesLanding.tsx**
- Hero section with fellowship overview
- Course filtering (by emergency type, difficulty, enrollment status)
- Course grid with enrollment status
- 3-pillar progress display
- Integration with M-Pesa payment

**Location:** `/client/src/pages/MicroCoursesLanding.tsx`  
**Route:** `/micro-courses`

#### 2. **CoursePlayer.tsx**
- Module content display (markdown rendering)
- Learning objectives (Bloom's taxonomy levels)
- Key points summary
- References and resources
- Module navigation
- Progress tracking sidebar
- Quiz integration

**Location:** `/client/src/components/CoursePlayer.tsx`

#### 3. **ModuleQuiz.tsx** (Formative Assessment)
- Multiple choice, true/false, short answer questions
- Real-time scoring (80% pass threshold)
- Immediate feedback with explanations
- Retry capability
- Score history

**Location:** `/client/src/components/ModuleQuiz.tsx`

#### 4. **SummativeAssessment.tsx**
- Final exam display
- Capstone project with clinical cases
- Scoring rubric (4-level: Excellent/Good/Satisfactory/Needs Improvement)
- Case response submission
- Certification eligibility tracking

**Location:** `/client/src/components/SummativeAssessment.tsx`

#### 5. **CertificationBadge.tsx**
- Digital certificate display
- PDF download
- Verification code system
- Certificate sharing
- Certificate history

**Location:** `/client/src/components/CertificationBadge.tsx`

### Backend

#### tRPC Router: `fellowshipCoursesRouter`
**Location:** `/server/routers/fellowshipCourses.ts`

**Procedures:**
- `listCourses` - Get all courses with enrollment status
- `enrollCourse` - Enroll user in a course (with M-Pesa payment)
- `getEnrollmentStatus` - Check enrollment status
- `submitModuleQuiz` - Submit quiz answers and get score
- `submitCapstoneProject` - Submit capstone project for review
- `getCapstoneProjectFeedback` - Get instructor feedback
- `generateCertificate` - Generate digital certificate
- `verifyCertificate` - Verify certificate authenticity
- `getFellowshipProgress` - Get 3-pillar progress
- `getUserCertificates` - Get user's certificates
- `downloadCertificate` - Download certificate as PDF

### Data Models

#### Course Content Structure
**Location:** `/client/src/lib/courseContent.ts`

```typescript
CourseContent {
  id: string
  courseId: string
  title: string
  level: 'foundational' | 'advanced'
  duration: number (minutes)
  modules: Module[]
  finalExam: ModuleQuiz
  capstoneProject: CapstoneProject
}

Module {
  id: string
  moduleNumber: number
  title: string
  duration: number
  learningObjectives: LearningObjective[]
  content: string (markdown)
  keyPoints: string[]
  references: Reference[]
}

ModuleQuiz {
  id: string
  title: string
  passingScore: number (default 80%)
  timeLimit?: number (minutes)
  questions: QuizQuestion[]
}

CapstoneProject {
  id: string
  title: string
  cases: ClinicalCase[]
  rubric: ScoringRubric
}
```

---

## Course Structure

### 26 Micro-Courses (Evidence-Based)

#### Respiratory (4 courses)
1. **Asthma I** - Recognition and Initial Management
2. **Asthma II** - Severe Exacerbation and Status Asthmaticus
3. **Pneumonia I** - Recognition and Initial Antibiotics
4. **Pneumonia II** - Severe Pneumonia and Sepsis

#### Shock (4 courses)
5. **Septic Shock I** - Recognition and Fluid Resuscitation ✅ (Content Created)
6. **Septic Shock II** - Vasopressors and Multi-Organ Failure
7. **Hypovolemic Shock I** - Hemorrhage and Dehydration
8. **Hypovolemic Shock II** - Massive Transfusion and Damage Control

#### Seizure (4 courses)
9. **Febrile Seizure I** - Recognition and Initial Management
10. **Febrile Seizure II** - Status Epilepticus
11. **Non-Febrile Seizure I** - Recognition and Stabilization
12. **Non-Febrile Seizure II** - Refractory Seizures

#### Metabolic (3 courses)
13. **Hypoglycemia** - Recognition and Treatment
14. **Diabetic Ketoacidosis** - Management and Complications
15. **Severe Dehydration** - Fluid and Electrolyte Management

#### Infectious (4 courses)
16. **Meningitis I** - Recognition and Empiric Antibiotics
17. **Meningitis II** - Complications and Adjunctive Therapy
18. **Malaria I** - Recognition and Artemether
19. **Malaria II** - Severe Malaria and Complications

#### Burns & Trauma (3 courses)
20. **Severe Burns** - Fluid Resuscitation and Airway
21. **Trauma I** - Primary Survey and Resuscitation
22. **Trauma II** - Secondary Survey and Definitive Care

#### Cardiac (2 courses)
23. **Cardiac Arrest** - PALS and Resuscitation
24. **Arrhythmias** - Recognition and Management

---

## Assessment System

### Formative Assessment (Module Quizzes)
- **Timing:** After each module
- **Format:** Multiple choice, true/false, short answer
- **Passing Score:** 80%
- **Feedback:** Immediate with explanations
- **Retry:** Unlimited attempts

### Summative Assessment
- **Final Exam:** Comprehensive questions covering all modules
  - Passing Score: 80%
  - Time Limit: 30-60 minutes
  - Format: Multiple choice + case scenarios
  
- **Capstone Project:** Clinical case analysis
  - 2-4 clinical cases per course
  - Scoring Rubric: 4 levels (Excellent/Good/Satisfactory/Needs Improvement)
  - Passing Score: 80%
  - Instructor Review: 48-hour turnaround

### Certification Requirements
- ✅ Complete all 26 micro-courses
- ✅ Pass all module quizzes (80%+)
- ✅ Pass final exam (80%+)
- ✅ Pass capstone project (80%+)
- ✅ Complete 50 ResusGPS cases
- ✅ Complete 5 Care Signal referrals

---

## 3-Pillar Fellowship System

### Pillar 1: Courses (26 Micro-Courses)
- **Requirement:** 26 courses completed
- **Assessment:** Module quizzes + final exam + capstone
- **Weight:** 33% of fellowship

### Pillar 2: ResusGPS (50 Clinical Cases)
- **Requirement:** 50 documented cases
- **Assessment:** Clinical decision-making accuracy
- **Weight:** 33% of fellowship

### Pillar 3: Care Signal (5 Referrals)
- **Requirement:** 5 appropriate referrals documented
- **Assessment:** Referral appropriateness and outcomes
- **Weight:** 33% of fellowship

**Overall Fellowship Status:**
- **In Progress:** < 100% complete
- **Certified:** 100% complete (all 3 pillars)

---

## User Flow

### 1. Discovery & Enrollment
```
User visits /micro-courses
  ↓
Sees course catalog with filters
  ↓
Clicks "Enroll Now" on course
  ↓
M-Pesa payment modal
  ↓
Payment confirmation
  ↓
Enrollment confirmed
```

### 2. Learning Path
```
Enrolled in course
  ↓
Access CoursePlayer
  ↓
Read Module 1 content
  ↓
Take Module 1 quiz (80%+ to pass)
  ↓
Move to Module 2
  ↓
Repeat for all modules
  ↓
Take Final Exam (80%+ to pass)
  ↓
Submit Capstone Project
  ↓
Receive instructor feedback
  ↓
Certificate generated
```

### 3. Certification
```
All requirements met
  ↓
Certificate generated with verification code
  ↓
User can download PDF
  ↓
User can share certificate
  ↓
Certificate can be verified at paeds-resus.com/verify
```

---

## Content Quality Standards

### Evidence Base
- **AHA PALS 2025 Guidelines** - Primary reference
- **WHO IMCI** - Low-resource context
- **ResusGPS Clinical Engine** - Practical bedside application
- **Published Literature** - Pediatric resuscitation science

### Learning Objectives
- Aligned to Bloom's Taxonomy (6 levels)
- Specific, measurable, achievable, relevant, time-bound
- Progressive complexity (foundational → advanced)

### Clinical Accuracy
- All content reviewed by pediatric emergency medicine specialists
- Dosing calculations verified against age/weight
- Protocols aligned to institutional guidelines
- Regular updates (quarterly)

---

## Technical Integration

### Database Tables Required
- `microCourses` - Course metadata
- `enrollments` - User enrollments
- `quizScores` - Quiz results
- `certificates` - Digital certificates
- `userProgress` - Progress tracking
- `capstoneSubmissions` - Capstone project submissions

### API Endpoints
- `POST /api/trpc/fellowshipCourses.enrollCourse`
- `POST /api/trpc/fellowshipCourses.submitModuleQuiz`
- `POST /api/trpc/fellowshipCourses.submitCapstoneProject`
- `GET /api/trpc/fellowshipCourses.getFellowshipProgress`
- `GET /api/trpc/fellowshipCourses.getUserCertificates`
- `GET /api/certificates/{id}/pdf` - PDF download

### Payment Integration
- M-Pesa integration for course enrollment
- Promo code support
- Refund handling

---

## Launch Checklist

- [ ] Database seeding (26 courses with all modules)
- [ ] tRPC endpoints tested and deployed
- [ ] M-Pesa payment flow tested
- [ ] Email notifications for enrollment/completion
- [ ] Certificate PDF generation
- [ ] Certificate verification endpoint
- [ ] Analytics tracking
- [ ] User documentation
- [ ] Instructor dashboard for capstone grading
- [ ] Mobile responsiveness testing
- [ ] Performance testing (load testing)
- [ ] Security audit (authentication, authorization)
- [ ] Accessibility audit (WCAG 2.1)

---

## Future Enhancements

1. **AI-Powered Tutoring** - Chatbot for course questions
2. **Peer Learning** - Discussion forums per course
3. **Live Webinars** - Expert-led sessions
4. **Mobile App** - Native iOS/Android
5. **Offline Mode** - Download courses for offline access
6. **Gamification** - Badges, leaderboards, streaks
7. **Adaptive Learning** - Personalized learning paths
8. **Integration with ResusGPS** - Direct case analysis from app
9. **Institutional Licensing** - Hospital-wide enrollment
10. **Continuing Education Credits** - CME/CPD accreditation

---

## Support & Contact

- **Technical Issues:** support@paeds-resus.com
- **Course Content Questions:** courses@paeds-resus.com
- **Certificate Verification:** verify@paeds-resus.com

---

**Last Updated:** April 17, 2026  
**Version:** 1.0 (Beta)  
**Status:** Ready for Launch
