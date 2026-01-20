# Paeds Resus - Project TODO

## Phase 1: Database Schema & Infrastructure
- [x] Extend Drizzle schema with all required tables (enrollments, payments, certificates, institutional accounts, etc.)
- [x] Set up database migrations
- [x] Create database query helpers in server/db.ts
- [ ] Configure AWS SES email service
- [ ] Set up node-cron scheduler for automated tasks

## Phase 2: Pages & Components (30 Pages)
- [x] Home/Landing page with hero section
- [x] Healthcare Providers page with program offerings
- [x] Institutional page with pricing calculator and ROI
- [x] Parents & Caregivers education page
- [x] Enrollment page with form
- [x] Learner Dashboard page with progress tracking
- [ ] Elite Fellowship page (Head, Heart, Hands framework)
- [ ] Safe-Truth tool page
- [ ] Institutional accreditation page
- [ ] Payment instructions page (M-Pesa & Bank Transfer)
- [ ] Training schedules page
- [ ] Success stories/blog page
- [ ] Facility locator page
- [ ] AHA elearning integration page
- [ ] Certificate verification page
- [ ] FAQ page
- [ ] Support/Help page
- [ ] Community page
- [ ] Resources page
- [ ] Contact page
- [ ] Admin dashboard page
- [ ] Cohort management page
- [ ] Settings page
- [ ] Profile page
- [ ] About page
- [ ] Terms of Service page
- [ ] Privacy Policy page

## Phase 3: Social Media Integration
- [x] Add social media links to Footer component
- [x] Add social media links to Header component
- [x] Create provider-specific channels section (Telegram, WhatsApp)
- [ ] Implement social sharing functionality

## Phase 4: Enrollment & Payment System
- [x] Build enrollment form with user type selection
- [x] Create enrollment tRPC procedures
- [ ] Implement M-Pesa payment integration
- [x] Create payment tracking system (database)
- [x] Set up SMS integration for payment confirmations
- [ ] Build bank transfer instructions page
- [ ] Implement payment status tracking

## Phase 5: Institutional Features
- [ ] Build institutional dashboard
- [ ] Create pricing calculator
- [ ] Implement ROI calculator
- [ ] Build bulk discount system
- [ ] Create institutional contact form modal
- [ ] Implement institutional inquiry database
- [ ] Build staff invitation system

## Phase 6: Certificate System
- [x] Implement certificate generation
- [x] Build certificate verification system
- [x] Create certificate download functionality
- [ ] Integrate AHA elearning platform
- [ ] Build pre-course completion tracking

## Phase 7: Learner Features
- [ ] Build learner progress tracking
- [ ] Implement badge system
- [ ] Create leaderboard with rankings
- [ ] Build social sharing for achievements
- [ ] Implement referral program with M-Pesa rewards
- [ ] Create learner onboarding wizard

## Phase 8: Email Automation
- [x] Set up AWS SES email service
- [x] Implement enrollment confirmation emails
- [x] Create payment reminder emails
- [x] Create training confirmation emails
- [x] Implement automated reminder scheduler with node-cron
- [ ] Create SMS reminder system

## Phase 9: Google Maps Integration
- [ ] Integrate Google Maps for facility locator
- [ ] Build training location management
- [ ] Implement location search functionality
- [ ] Create map-based facility discovery

## Phase 10: Testing & Deployment
- [x] Write vitest unit tests for critical features (92 tests passing)
- [ ] Perform end-to-end testing
- [ ] Optimize performance and load times
- [ ] Create deployment checkpoint
- [ ] Deploy to production

---

## Completed Features
- SMS Integration Service (Africastalking & Twilio support)
- Certificate Generation & Verification System
- SMS Router with tRPC procedures
- Certificate Router with tRPC procedures
- 92 vitest tests passing (including 22 SMS tests + 21 certificate tests)
- TypeScript compilation with 0 errors

---

## Known Issues & Blockers
- M-Pesa business till approval pending (user will provide credentials when ready)
- S3 integration for certificate storage not yet implemented
- WhatsApp and Telegram automation deferred to later phase
