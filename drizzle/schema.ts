import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, date, time, json, uniqueIndex, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  institutionalRole: mysqlEnum("institutionalRole", ["director", "coordinator", "finance_officer", "department_head", "staff_member"]),
  providerType: mysqlEnum("providerType", ["nurse", "doctor", "pharmacist", "paramedic", "lab_tech", "respiratory_therapist", "midwife", "other"]),
  userType: mysqlEnum("userType", ["individual", "institutional"]).default("individual"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  /** Set by platform admin; user may be assigned as `trainingSchedules.instructorId` for B2B sessions. */
  instructorApprovedAt: timestamp("instructorApprovedAt"),
  /** Unique Paeds Resus instructor ID after completing the Instructor Course (certificate issued). */
  instructorNumber: varchar("instructorNumber", { length: 32 }).unique(),
  instructorCertifiedAt: timestamp("instructorCertifiedAt"),
  /** Provisional -> qualified -> lead_instructor (CEO decision, 2026-07-21; renamed from "faculty" to avoid echoing Fellowship-program language). Null until instructorApprovedAt is set. */
  instructorTier: mysqlEnum("instructorTier", ["provisional", "qualified", "lead_instructor"]),
  /** Rolling ResusGPS access window: extended by 30 days when a fellowship micro-course is completed (null = unrestricted legacy). */
  resusGpsAccessExpiresAt: timestamp("resusGpsAccessExpiresAt"),
  /** Legal consent — Terms of Use click-wrap (migration 0044) */
  termsAcceptedAt: timestamp("termsAcceptedAt"),
  termsVersion: varchar("termsVersion", { length: 16 }),
  /** Legal consent — Privacy Policy click-wrap (migration 0044) */
  privacyAcceptedAt: timestamp("privacyAcceptedAt"),
  privacyVersion: varchar("privacyVersion", { length: 16 }),
  /** Care Signal QI processing consent (migration 0044) */
  careSignalConsentAt: timestamp("careSignalConsentAt"),
  careSignalConsentVersion: varchar("careSignalConsentVersion", { length: 16 }),
  /** Code Signal QI processing consent (migration 0090) */
  codeSignalConsentAt: timestamp("codeSignalConsentAt"),
  codeSignalConsentVersion: varchar("codeSignalConsentVersion", { length: 16 }),
  /** Institutional B2B addendum acceptance (migration 0044) */
  institutionalB2bAcceptedAt: timestamp("institutionalB2bAcceptedAt"),
  institutionalB2bVersion: varchar("institutionalB2bVersion", { length: 16 }),
  /** ResusGPS clinical disclaimer session acknowledgment (migration 0044) */
  resusGpsAckAt: timestamp("resusGpsAckAt"),
  resusGpsAckVersion: varchar("resusGpsAckVersion", { length: 16 }),
  /** Parent Safe-Truth guardian acknowledgment (migration 0044) */
  safeTruthGuardianAckAt: timestamp("safeTruthGuardianAckAt"),
  safeTruthGuardianAckVersion: varchar("safeTruthGuardianAckVersion", { length: 16 }),
  cadre: varchar("cadre", { length: 128 }),
  cadreOther: varchar("cadreOther", { length: 128 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Password reset tokens (for "forgot password" flow; expire after 24h)
export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// Enrollments table
export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** When set, PALS learning path is limited to this catalog course (micro-course SKU). */
  courseId: int("courseId"),
  programType: mysqlEnum("programType", ["bls", "acls", "pals", "fellowship", "instructor", "fellowship_diploma", "heartsaver", "nrp"]).notNull(),
  trainingDate: timestamp("trainingDate").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "partial", "completed"]).default("pending"),
  amountPaid: int("amountPaid").default(0), // in cents (KES)
  ahaPrecourseCompleted: boolean("ahaPrecourseCompleted").default(false),
  ahaCertificateUrl: text("ahaCertificateUrl"),
  certificateVerified: boolean("certificateVerified").default(false),
  reminderSent: boolean("reminderSent").default(false),
  reminderSentAt: timestamp("reminderSentAt"),
  /** AHA-CERT-1: Set by server when all cognitive (online) modules are completed */
  cognitiveModulesComplete: boolean("cognitiveModulesComplete").default(false).notNull(),
  /** AHA-CERT-1: Set by an approved instructor after the hands-on skills assessment */
  practicalSkillsSignedOff: boolean("practicalSkillsSignedOff").default(false).notNull(),
  practicalSignedOffAt: timestamp("practicalSignedOffAt"),
  practicalSignedOffByUserId: int("practicalSignedOffByUserId"),
  practicalSignedOffByName: varchar("practicalSignedOffByName", { length: 255 }),
  /**
   * Fellowship grandfathering (North Star v2.1 addendum §6, CEO decision
   * 2026-07-29): a lead_instructor can mark a course as fully meeting its
   * Fellowship requirement for a learner who completed physical, in-person
   * training before the online Phase 2 simulation model existed and has no
   * digital trail of cognitive/precourse/simulation completion to check
   * against. Deliberately a full override (not a partial waiver of just
   * the simulation count) -- see getFellowshipPillarACourseStatus in
   * server/lib/fellowship-phase2-completion.ts.
   */
  fellowshipGrandfathered: boolean("fellowshipGrandfathered").default(false).notNull(),
  fellowshipGrandfatheredAt: timestamp("fellowshipGrandfatheredAt"),
  fellowshipGrandfatheredByUserId: int("fellowshipGrandfatheredByUserId"),
  fellowshipGrandfatheredByName: varchar("fellowshipGrandfatheredByName", { length: 255 }),
  /**
   * NOTE (2026-08-01): ahaPrecourseCompleted/ahaCertificateUrl above have
   * zero usage anywhere in the codebase -- an earlier, never-wired-up
   * attempt at this same idea. Superseded by the columns below, which match
   * the CEO's 2026-07-31 respec (docs/IERP_NERP_PROGRAM_V2_SPEC.md §3):
   * two distinct elearning.heart.org documents per course (Video Prework +
   * Precourse Self-Assessment, the latter with a pass/fail result), gated
   * on this enrollment's own cognitiveModulesComplete plus the learner's
   * separate BLS enrollment's cognitiveModulesComplete (BLS-cognitive is a
   * prerequisite for every other course's elearning step, same spirit as
   * the platform-wide BLS-before-ACLS/PALS rule in ensureAhaEnrollment, but
   * checked against the lighter cognitive-modules bar here, not full
   * certification -- see the upload gate for the reasoning).
   */
  videoPreworkCertificateUrl: text("videoPreworkCertificateUrl"),
  precourseAssessmentCertificateUrl: text("precourseAssessmentCertificateUrl"),
  precourseAssessmentPassed: boolean("precourseAssessmentPassed").default(false),
  elearningProofSubmittedAt: timestamp("elearningProofSubmittedAt"),
  elearningProofVerifiedAt: timestamp("elearningProofVerifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;

/**
 * User-owned Intern Emergency Readiness Program state.
 *
 * This is deliberately separate from institutionalStaffMembers: IERP training
 * participation does not grant IERS access and must remain possible when a
 * learner has no facility roster row or recognised institutional account.
 */
export const ierpProgramEnrollments = mysqlTable("ierpProgramEnrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  programKey: mysqlEnum("programKey", ["ierp"]).default("ierp").notNull(),
  designation: mysqlEnum("designation", ["noi", "coi_bsc", "coi_diploma", "moi"]).notNull(),
  cohortCode: varchar("cohortCode", { length: 128 }),
  cohortName: varchar("cohortName", { length: 255 }),
  lifecycleStatus: mysqlEnum("lifecycleStatus", ["active", "completed", "withdrawn"]).default("active").notNull(),
  phaseStatus: mysqlEnum("phaseStatus", ["phase_1", "phase_2", "phase_3", "completed"]).default("phase_1").notNull(),
  phase1Status: mysqlEnum("phase1Status", ["not_started", "in_progress", "submitted", "verified", "rejected"]).default("not_started").notNull(),
  phase1VerifiedAt: timestamp("phase1VerifiedAt"),
  phase2CompletedAt: timestamp("phase2CompletedAt"),
  phase3CompletedAt: timestamp("phase3CompletedAt"),
  totalPaidAmount: decimal("totalPaidAmount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["not_required", "pending", "partial", "paid_in_full", "locked"]).default("pending").notNull(),
  paymentLockoutAt: timestamp("paymentLockoutAt"),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userProgramUnique: uniqueIndex("ierp_program_enrollments_user_program_uq").on(table.userId, table.programKey),
  userStatusIdx: index("ierp_program_enrollments_user_status_idx").on(table.userId, table.lifecycleStatus),
}));

export type IerpProgramEnrollment = typeof ierpProgramEnrollments.$inferSelect;
export type InsertIerpProgramEnrollment = typeof ierpProgramEnrollments.$inferInsert;

/** Private object metadata for IERP Phase 1 evidence. Bytes live in storage. */
export const ierpPhase1Evidence = mysqlTable("ierpPhase1Evidence", {
  id: int("id").autoincrement().primaryKey(),
  programEnrollmentId: int("programEnrollmentId").notNull(),
  userId: int("userId").notNull(),
  documentType: mysqlEnum("documentType", ["video_prework", "precourse_assessment"]).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  contentType: varchar("contentType", { length: 128 }).notNull(),
  fileSizeBytes: int("fileSizeBytes").notNull(),
  status: mysqlEnum("status", ["submitted", "verified", "rejected"]).default("submitted").notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  reviewReason: text("reviewReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  enrollmentDocumentUnique: uniqueIndex("ierp_phase1_evidence_enrollment_document_uq").on(table.programEnrollmentId, table.documentType),
  userStatusIdx: index("ierp_phase1_evidence_user_status_idx").on(table.userId, table.status),
}));

export type IerpPhase1Evidence = typeof ierpPhase1Evidence.$inferSelect;
export type InsertIerpPhase1Evidence = typeof ierpPhase1Evidence.$inferInsert;

/** DB-backed IERP payment ledger; amounts are whole KES and callbacks are idempotent. */
export const ierpPayments = mysqlTable("ierpPayments", {
  id: int("id").autoincrement().primaryKey(),
  programEnrollmentId: int("programEnrollmentId").notNull(),
  userId: int("userId").notNull(),
  amountKsh: int("amountKsh").notNull(),
  phase: mysqlEnum("phase", ["phase_1", "phase_2", "phase_3", "general"]).default("general").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["mpesa", "bank_transfer", "card"]).notNull(),
  checkoutRequestId: varchar("checkoutRequestId", { length: 255 }).unique(),
  providerReference: varchar("providerReference", { length: 255 }),
  idempotencyKey: varchar("idempotencyKey", { length: 255 }).unique(),
  mpesaReceiptNumber: varchar("mpesaReceiptNumber", { length: 50 }).unique(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  failureReason: text("failureReason"),
  reconciledAt: timestamp("reconciledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userStatusIdx: index("ierp_payments_user_status_idx").on(table.userId, table.status),
  programStatusIdx: index("ierp_payments_program_status_idx").on(table.programEnrollmentId, table.status),
}));

export type IerpPayment = typeof ierpPayments.$inferSelect;
export type InsertIerpPayment = typeof ierpPayments.$inferInsert;

/** Paused/draft-only IERP outreach definition. sendingEnabled is permanently false in this initiative. */
export const ierpEmailCampaigns = mysqlTable("ierpEmailCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  programKey: mysqlEnum("programKey", ["ierp"]).default("ierp").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  templateVersion: varchar("templateVersion", { length: 64 }).notNull(),
  audienceFilterJson: text("audienceFilterJson").notNull(),
  scheduleState: mysqlEnum("scheduleState", ["draft", "paused"]).default("draft").notNull(),
  sendingEnabled: boolean("sendingEnabled").default(false).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IerpEmailCampaign = typeof ierpEmailCampaigns.$inferSelect;
export type InsertIerpEmailCampaign = typeof ierpEmailCampaigns.$inferInsert;

export const ierpEmailPreferences = mysqlTable("ierpEmailPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  programKey: mysqlEnum("programKey", ["ierp"]).default("ierp").notNull(),
  consentStatus: mysqlEnum("consentStatus", ["unknown", "opted_in", "opted_out"]).default("unknown").notNull(),
  consentSource: varchar("consentSource", { length: 128 }),
  consentedAt: timestamp("consentedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userProgramUnique: uniqueIndex("ierp_email_preferences_user_program_uq").on(table.userId, table.programKey),
}));

export type IerpEmailPreference = typeof ierpEmailPreferences.$inferSelect;
export type InsertIerpEmailPreference = typeof ierpEmailPreferences.$inferInsert;

export const ierpEmailSuppressions = mysqlTable("ierpEmailSuppressions", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  reason: mysqlEnum("reason", ["unsubscribe", "hard_bounce", "manual"]).notNull(),
  suppressedAt: timestamp("suppressedAt").defaultNow().notNull(),
  createdByUserId: int("createdByUserId"),
});

export type IerpEmailSuppression = typeof ierpEmailSuppressions.$inferSelect;
export type InsertIerpEmailSuppression = typeof ierpEmailSuppressions.$inferInsert;

export const ierpEmailAttributions = mysqlTable("ierpEmailAttributions", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  userId: int("userId"),
  eventType: mysqlEnum("eventType", ["previewed", "clicked", "registered", "paid", "completed"]).notNull(),
  attributionKey: varchar("attributionKey", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  campaignEventIdx: index("ierp_email_attributions_campaign_event_idx").on(table.campaignId, table.eventType),
  attributionUnique: uniqueIndex("ierp_email_attributions_key_uq").on(table.attributionKey),
}));

export type IerpEmailAttribution = typeof ierpEmailAttributions.$inferSelect;
export type InsertIerpEmailAttribution = typeof ierpEmailAttributions.$inferInsert;

export const ierpEmailAuditLog = mysqlTable("ierpEmailAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId"),
  actorUserId: int("actorUserId").notNull(),
  action: mysqlEnum("action", ["created", "updated", "paused", "previewed", "send_blocked", "consent_updated", "suppressed"]).notNull(),
  detailJson: text("detailJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  campaignAuditIdx: index("ierp_email_audit_campaign_idx").on(table.campaignId, table.createdAt),
}));

export type IerpEmailAuditLogRow = typeof ierpEmailAuditLog.$inferSelect;
export type InsertIerpEmailAuditLogRow = typeof ierpEmailAuditLog.$inferInsert;

// Payments table
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(), // in cents (KES)
  paymentMethod: mysqlEnum("paymentMethod", ["mpesa", "bank_transfer", "card"]).notNull(),
  transactionId: varchar("transactionId", { length: 255 }),
  // MPESA-4: Idempotency key to prevent duplicate webhook processing
  idempotencyKey: varchar("idempotencyKey", { length: 255 }).unique(),
  // Migration 00XX (CEO decision, 2026-08-05): retired the dormant, never-
  // wired individualInstallmentPayments table in favor of these two columns
  // here, so every payment -- installment or not -- lives in one ledger.
  // Nullable: only mpesa payments populate them, and only once the receipt
  // is known (not at STK-push initiation, where transactionId still holds
  // the CheckoutRequestID for webhook lookup -- see server/webhooks/).
  mpesaReceiptNumber: varchar("mpesaReceiptNumber", { length: 50 }).unique(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  /** Nullable NERP installment ownership; standalone payments remain unchanged. */
  nerpOfferEnrollmentId: int("nerpOfferEnrollmentId"),
  installmentNumber: int("installmentNumber"),
  nerpLedgerAppliedAt: timestamp("nerpLedgerAppliedAt"),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending"),
  smsConfirmationSent: boolean("smsConfirmationSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// Certificates table
export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull(),
  userId: int("userId").notNull(),
  certificateNumber: varchar("certificateNumber", { length: 255 }).unique(),
  programType: mysqlEnum("programType", ["bls", "acls", "pals", "fellowship", "instructor", "fellowship_diploma", "heartsaver", "nrp", "bls_cognitive", "acls_cognitive", "pals_cognitive", "heartsaver_cognitive", "nrp_cognitive"]).notNull(),
  issueDate: timestamp("issueDate").notNull(),
  expiryDate: timestamp("expiryDate"),
  certificateUrl: text("certificateUrl"),
  verificationCode: varchar("verificationCode", { length: 255 }).unique(),
  /** Set when user or scheduled job sends a renewal reminder (HI-CERT-1 dedupe). */
  renewalReminderSentAt: timestamp("renewalReminderSentAt"),
  /** For micro-course certs: the microCourseEnrollments.id (avoids enrollmentId collision with AHA enrollments table) */
  microCourseEnrollmentId: int("microCourseEnrollmentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

/** One pre-download feedback row per user per certificate (before PDF download). */
export const certificateDownloadFeedback = mysqlTable("certificateDownloadFeedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  certificateId: int("certificateId").notNull(),
  rating: int("rating").notNull(),
  improvements: text("improvements"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CertificateDownloadFeedback = typeof certificateDownloadFeedback.$inferSelect;
export type InsertCertificateDownloadFeedback = typeof certificateDownloadFeedback.$inferInsert;

/** Provider Care Signal (incident / near-miss) events; fellowship pillar. Parent short-form may use same table with eventType parent-observation. */
export const careSignalEvents = mysqlTable("careSignalEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  /** Facility ID from providerProfiles — enables institutional reporting (migration 0037) */
  facilityId: int("facilityId"),
  eventDate: timestamp("eventDate").notNull(),
  childAge: int("childAge").notNull(),
  eventType: varchar("eventType", { length: 255 }).notNull(),
  presentation: text("presentation").notNull(),
  isAnonymous: boolean("isAnonymous").default(false).notNull(),
  chainOfSurvival: text("chainOfSurvival").notNull(),
  systemGaps: text("systemGaps").notNull(),
  gapDetails: text("gapDetails").notNull(),
  outcome: varchar("outcome", { length: 512 }).notNull(),
  neurologicalStatus: varchar("neurologicalStatus", { length: 512 }).notNull(),
  status: varchar("status", { length: 32 }).default("submitted").notNull(),
  /** Admin/coordinator who reviewed this event (migration 0037) */
  reviewerId: int("reviewerId"),
  /** Whether this event qualifies for Fellowship Pillar C (migration 0037) */
  eligibleForFellowship: boolean("eligibleForFellowship").default(true).notNull(),
  /** Form version used for submission — audit trail (migration 0037) */
  submissionVersion: varchar("submissionVersion", { length: 16 }).default("v1").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  // ── Care Signal v3 fields (migration 0056) ──────────────────────────────
  country: varchar("country", { length: 2 }),
  adminLevel1: varchar("admin_level_1", { length: 128 }),
  /**
   * Locality (sub-county / district / area) — per the CEO's "global from
   * day 1" instruction (gap-analysis #11, 2026-07-16). Added via migration
   * 0065, populated best-effort from the selected facility's own
   * adminLevel2/subCounty; see FacilityPicker.tsx for the paths that don't
   * carry it yet.
   */
  adminLevel2: varchar("admin_level_2", { length: 128 }),
  facilityOwnership: varchar("facility_ownership", { length: 64 }),
  schemaVersion: varchar("schema_version", { length: 16 }).default("1.0").notNull(),
  conditionCategory: varchar("condition_category", { length: 64 }),
  childAgeBand: varchar("child_age_band", { length: 32 }),
  outcomeCategory: varchar("outcome_category", { length: 64 }),
  roleAtTimeOfEvent: varchar("role_at_time_of_event", { length: 64 }),
  providerCadre: varchar("provider_cadre", { length: 64 }),
  reportTrack: varchar("report_track", { length: 16 }).default("FAILURE").notNull(),
  failureModeCodes: text("failure_mode_codes"),
  successFactorCodes: text("success_factor_codes"),
  rawNarrative: text("raw_narrative"),
  redactedNarrative: text("redacted_narrative"),
  /**
   * Redaction retry state (migration 0081, closing a gap found in code
   * review 2026-07-29): before this, the only signal was
   * `redactedNarrative IS NULL` = pending, with no way to tell "not yet
   * attempted" apart from "has failed 40 times already" — a permanently
   * unredactable narrative (LLM safety-filter refusal, malformed input,
   * anything non-transient) would retry every 10 minutes forever, with
   * zero operator visibility. `redactionAttempts` counts tries;
   * `redactionLastAttemptAt` drives real exponential backoff (see
   * care-signal-redact.ts's isEligibleForRetry, not just "wait for the
   * next 10-minute cron tick regardless"); once attempts reach
   * MAX_REDACTION_ATTEMPTS the row stops being retried automatically and
   * needs manual attention (`redactionLastError` records why, for whoever
   * looks). None of this affects anonymization's fallback: a row that
   * never gets a redactedNarrative still safely falls back to the
   * existing pattern-based redaction at the 7-year/DSAR cutoff, per
   * care-signal-anonymize.ts.
   */
  redactionAttempts: int("redaction_attempts").default(0).notNull(),
  redactionLastAttemptAt: timestamp("redaction_last_attempt_at"),
  redactionLastError: text("redaction_last_error"),
  temporalIntervals: text("temporal_intervals"),
  eventId: varchar("event_id", { length: 36 }),
  // ── Fellowship pseudonymous token model (migration 0064, gap-analysis #10) ─
  /**
   * Which of the three Observation Architecture §5.5 submission modes this
   * event used. Supersedes `isAnonymous` as the source of truth for whether
   * `userId` is populated and whether Fellowship credit applies — kept
   * because `isAnonymous` still separately controls facility-view visibility
   * (PSOT §20.3 rule 4), which is a distinct concern from identity storage.
   *   - named: userId set, full credit, visible to institution as before.
   *   - pseudonymous: userId NULL, fellowshipTokenId set, credit accrues to
   *     the token (see fellowshipTokens table). Platform does not store who
   *     submitted this event.
   *   - anonymous: userId NULL, fellowshipTokenId NULL, no Fellowship credit
   *     (matches §5.5 Layer 1 exactly — this is the true "no identity, no
   *     credit" option; previously the checkbox labeled "anonymous" behaved
   *     like pseudonymous-with-real-userId-still-stored, which is why this
   *     migration exists).
   */
  submissionMode: mysqlEnum("submissionMode", ["named", "pseudonymous", "anonymous"])
    .default("named")
    .notNull(),
  /** Set only when submissionMode = 'pseudonymous'. References fellowshipTokens.tokenId. */
  fellowshipTokenId: varchar("fellowshipTokenId", { length: 36 }),
});

export type CareSignalEventRow = typeof careSignalEvents.$inferSelect;
export type InsertCareSignalEvent = typeof careSignalEvents.$inferInsert;

/**
 * Code Signal — adult/whole-hospital resuscitation incident & near-miss
 * reporting. CEO decision 2026-08-06 (docs/NORTH_STAR_V2_3_ADDENDUM_WHOLE_HOSPITAL_READINESS.md):
 * the paediatric ERT model requires whole-hospital reciprocity (paeds and
 * adult ward staff form one shared responder network per IERMS Domain 1.3),
 * so the same near-miss learning discipline that exists for children needs
 * an adult-scoped counterpart. Deliberately a SEPARATE table from
 * `careSignalEvents`, not a shared one with a patient-type discriminator —
 * this preserves Care Signal's paediatric-only dataset as a clean, citable
 * research artifact and avoids retrofitting a child-shaped schema
 * (childAge NOT NULL, paediatric-only condition/failure taxonomy) onto an
 * adult population. See the design conversation in chat, 2026-08-06.
 *
 * Deliberately NOT wired into (flagged, not silently dropped — each is a
 * separate follow-up decision):
 *  - Fellowship credit / Pillar C (Care Signal-specific; whether adult
 *    reporting should ever count toward a paediatric-titled Fellowship is
 *    a real open question, not assumed either way here).
 *  - FPKB pattern-detection engine (`kb_pattern_observations.observationSource`
 *    enum would need a new CODE_SIGNAL value; not added in this pass).
 *  - Institutional follow-up / admin review queue / analytics dashboard
 *    (Care Signal's equivalents are ~1600 lines in care-signal-events.ts;
 *    Code Signal ships submit + list only this pass).
 *  - A dedicated versioned legal consent document (Care Signal's consent
 *    gate is tied to `LEGAL_DOCUMENT_VERSIONS.careSignalNotice` and
 *    explicitly promises Fellowship credit in its copy — reusing it for
 *    Code Signal would misstate what the submission does. Code Signal's
 *    form carries an inline, unversioned consent notice instead until a
 *    real "Code Signal Notice" document is drafted and signed off.)
 */
export const codeSignalEvents = mysqlTable("codeSignalEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  facilityId: int("facilityId"),
  eventDate: timestamp("eventDate").notNull(),
  /** Who the patient was — not just "an adult"; mothers and staff collapsing at the bedside are explicitly in scope per the CEO's stated rationale. */
  patientCategory: mysqlEnum("patient_category", [
    "ADULT_PATIENT", "MOTHER_OF_PATIENT", "STAFF_MEMBER", "OTHER",
  ]).notNull(),
  conditionCategory: varchar("condition_category", { length: 64 }).notNull(),
  outcomeCategory: varchar("outcome_category", { length: 64 }).notNull(),
  roleAtTimeOfEvent: varchar("role_at_time_of_event", { length: 64 }).notNull(),
  country: varchar("country", { length: 2 }),
  adminLevel1: varchar("admin_level_1", { length: 128 }),
  adminLevel2: varchar("admin_level_2", { length: 128 }),
  facilityOwnership: varchar("facility_ownership", { length: 64 }),
  schemaVersion: varchar("schema_version", { length: 16 }).default("1.0").notNull(),
  reportTrack: mysqlEnum("report_track", ["FAILURE", "SUCCESS"]).default("FAILURE").notNull(),
  failureDomains: text("failure_domains"),
  failureModeCodes: text("failure_mode_codes"),
  successDomains: text("success_domains"),
  successFactorCodes: text("success_factor_codes"),
  rawNarrative: text("raw_narrative").notNull(),
  redactedNarrative: text("redacted_narrative"),
  status: varchar("status", { length: 32 }).default("submitted").notNull(),
  eventId: varchar("event_id", { length: 36 }),
  /** Same three-mode identity model as Care Signal §5.5 — no pseudonymous-token linkage yet since Code Signal has no Fellowship pillar to accrue credit against. */
  submissionMode: mysqlEnum("submissionMode", ["named", "anonymous"]).default("named").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /**
   * Admin review queue fields (migration 0091, WORK_STATUS 2026-08-07 "In
   * progress" queue item #1). Dedicated columns rather than Care Signal's
   * `gapDetails` JSON-blob pattern — Code Signal has no equivalent legacy
   * column to shoehorn this into, so plain typed columns are simpler here.
   */
  reviewOutcome: varchar("review_outcome", { length: 32 }),
  reviewerNotes: text("reviewer_notes"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: int("reviewed_by"),
});

export type CodeSignalEventRow = typeof codeSignalEvents.$inferSelect;
export type InsertCodeSignalEvent = typeof codeSignalEvents.$inferInsert;

// Institutional Accounts table
export const institutionalAccounts = mysqlTable("institutionalAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  /** CPD service: name printed on the certificate signature line (migration 0078). */
  cpdCoordinatorName: varchar("cpdCoordinatorName", { length: 255 }),
  /** CPD service: base64 PNG data URL of the coordinator's drawn signature, embedded above the certificate signature line (migration 0078). */
  cpdCoordinatorSignature: text("cpdCoordinatorSignature"),
  industry: varchar("industry", { length: 255 }),
  staffCount: int("staffCount"),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }),
  /** MoH registration number (or equivalent), promoted to a real column (migration 0071) so
   *  institutional recovery requests (North Star §6.1) can be matched against it directly —
   *  previously only captured inside institutionalInquiries.specificNeeds as opaque JSON. */
  registrationNumber: varchar("registrationNumber", { length: 255 }),
  status: mysqlEnum("status", ["prospect", "active", "inactive"]).default("prospect"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstitutionalAccount = typeof institutionalAccounts.$inferSelect;
export type InsertInstitutionalAccount = typeof institutionalAccounts.$inferInsert;

/**
 * North Star v2.0 §6.1: "the Organisation Actor account belongs to the
 * institution, not the person who created it. A minimum of two named admin
 * contacts must always be registered." This table grants account-admin
 * access to more than one user per institution — institutionalAccounts.userId
 * remains as the original/primary owner for backward compat with every
 * existing query, but access checks (assertInstitutionAccess) also honor
 * membership here. Existing accounts are backfilled with their owner as the
 * first row (migration 0071).
 *
 * Deliberately no composite DB unique constraint on (institutionalAccountId,
 * userId) — this codebase has no precedent for composite unique indexes on
 * drizzle-orm/mysql-core tables, so de-duplication is enforced at the
 * application layer (check-before-insert) instead. Flagging as a known
 * simplification, not an oversight.
 */
export const institutionalAccountAdmins = mysqlTable("institutionalAccountAdmins", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  userId: int("userId").notNull(),
  /** Null for the original owner (backfilled) or a recovery-approval grant; set for a live admin's own invite action. */
  addedByUserId: int("addedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InstitutionalAccountAdmin = typeof institutionalAccountAdmins.$inferSelect;
export type InsertInstitutionalAccountAdmin = typeof institutionalAccountAdmins.$inferInsert;

/**
 * Pending admin grants for an email that doesn't have a platform account yet
 * (or hasn't accepted). Used by two flows that both need the same "grant
 * access to an email, whether or not they've signed up" primitive: (1) the
 * second-admin field collected at institutional registration/onboarding,
 * and (2) an approved institutionalRecoveryRequests row. Accepted by
 * acceptInvite matching the logged-in user's own email — see
 * server/routers/institution-admins.ts for the known limitation this implies
 * (no single-use token; matched by email equality at accept-time).
 */
export const institutionalAdminInvites = mysqlTable("institutionalAdminInvites", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  invitedEmail: varchar("invitedEmail", { length: 320 }).notNull(),
  invitedName: varchar("invitedName", { length: 255 }),
  invitedPhone: varchar("invitedPhone", { length: 20 }),
  /** Null when created by a recovery approval (no live admin performed it) or at registration (self-invite of the second contact). */
  invitedByUserId: int("invitedByUserId"),
  source: mysqlEnum("source", ["registration", "admin_invite", "recovery_approval"]).notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "revoked"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
});

export type InstitutionalAdminInvite = typeof institutionalAdminInvites.$inferSelect;
export type InsertInstitutionalAdminInvite = typeof institutionalAdminInvites.$inferInsert;

/**
 * North Star v2.0 §6.1: "Account recovery requires institutional identity
 * verification — facility letterhead, MoH registration number — not
 * personal credential reset. If both admin contacts are unreachable,
 * recovery is via institutional verification only." Deliberately a public,
 * no-auth submission (the whole scenario is "nobody can log in"); matching
 * to a real institutionalAccountId is a manual step by the reviewing
 * platform admin (option A from the design conversation — the requester
 * types the institution's claimed name/registration number rather than
 * referencing an internal ID they may not have), not automated. letterheadUrl
 * follows the same pasted-URL precedent as institutionalStaffMembers.phase1ProofUrl
 * — no file-upload infrastructure exists in this codebase yet.
 */
export const institutionalRecoveryRequests = mysqlTable("institutionalRecoveryRequests", {
  id: int("id").autoincrement().primaryKey(),
  companyNameClaimed: varchar("companyNameClaimed", { length: 255 }).notNull(),
  claimedRegistrationNumber: varchar("claimedRegistrationNumber", { length: 255 }),
  requesterName: varchar("requesterName", { length: 255 }).notNull(),
  requesterEmail: varchar("requesterEmail", { length: 320 }).notNull(),
  requesterPhone: varchar("requesterPhone", { length: 20 }),
  /** Free text — e.g. "new hospital administrator", "IT lead", "board member" — for reviewer context only. */
  requesterRoleClaim: varchar("requesterRoleClaim", { length: 255 }),
  letterheadUrl: text("letterheadUrl").notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending"),
  /** Set by the reviewing admin on approval — the institution this request was manually matched to. */
  matchedInstitutionalAccountId: int("matchedInstitutionalAccountId"),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstitutionalRecoveryRequest = typeof institutionalRecoveryRequests.$inferSelect;
export type InsertInstitutionalRecoveryRequest = typeof institutionalRecoveryRequests.$inferInsert;

// Institutional Inquiries table
export const institutionalInquiries = mysqlTable("institutionalInquiries", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  staffCount: int("staffCount").notNull(),
  specificNeeds: text("specificNeeds"),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "rejected"]).default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstitutionalInquiry = typeof institutionalInquiries.$inferSelect;
export type InsertInstitutionalInquiry = typeof institutionalInquiries.$inferInsert;

// SMS Reminders table
export const smsReminders = mysqlTable("smsReminders", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull(),
  userId: int("userId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  reminderType: mysqlEnum("reminderType", ["enrollment_confirmation", "payment_reminder", "training_reminder", "post_training"]).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SmsReminder = typeof smsReminders.$inferSelect;
export type InsertSmsReminder = typeof smsReminders.$inferInsert;

// Learner Progress table
export const learnerProgress = mysqlTable("learnerProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  enrollmentId: int("enrollmentId").notNull(),
  progressPercentage: int("progressPercentage").default(0),
  modulesCompleted: int("modulesCompleted").default(0),
  totalModules: int("totalModules").default(0),
  badges: text("badges"), // JSON array of badge names
  leaderboardRank: int("leaderboardRank"),
  lastActivityAt: timestamp("lastActivityAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearnerProgress = typeof learnerProgress.$inferSelect;
export type InsertLearnerProgress = typeof learnerProgress.$inferInsert;

// Platform Settings table
export const platformSettings = mysqlTable("platformSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 255 }).unique().notNull(),
  settingValue: text("settingValue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type InsertPlatformSetting = typeof platformSettings.$inferInsert;

// Referrals table
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending"),
  rewardAmount: int("rewardAmount"), // in KES
  rewardProcessedAt: timestamp("rewardProcessedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// User Feedback table
export const userFeedback = mysqlTable("userFeedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  feedbackType: mysqlEnum("feedbackType", ["course", "instructor", "payment", "platform", "general"]).notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  status: mysqlEnum("status", ["new", "reviewed", "addressed", "archived"]).default("new"),
  followUpRequired: boolean("followUpRequired").default(false),
  followUpSentAt: timestamp("followUpSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = typeof userFeedback.$inferInsert;

// Analytics Events table
export const analyticsEvents = mysqlTable("analyticsEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  eventType: varchar("eventType", { length: 255 }).notNull(), // page_view, button_click, form_submit, etc.
  eventName: varchar("eventName", { length: 255 }).notNull(),
  pageUrl: text("pageUrl"),
  eventData: text("eventData"), // JSON object with event details
  sessionId: varchar("sessionId", { length: 255 }),
  duration: int("duration"), // milliseconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

// Admin audit log (Phase 3 security baseline)
export const adminAuditLog = mysqlTable("adminAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  adminUserId: int("adminUserId").notNull(),
  procedurePath: varchar("procedurePath", { length: 255 }).notNull(),
  inputSummary: text("inputSummary"), // sanitized, no secrets
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLog.$inferInsert;

// A/B Experiments table
export const experiments = mysqlTable("experiments", {
  id: int("id").autoincrement().primaryKey(),
  experimentName: varchar("experimentName", { length: 255 }).unique().notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "running", "paused", "completed", "archived"]).default("draft"),
  variant: mysqlEnum("variant", ["control", "treatment_a", "treatment_b", "treatment_c"]).notNull(),
  trafficPercentage: int("trafficPercentage").default(50), // percentage of users to include
  metric: varchar("metric", { length: 255 }), // conversion_rate, avg_time, engagement, etc.
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  winner: varchar("winner", { length: 255 }), // winning variant
  statisticalSignificance: decimal("statisticalSignificance", { precision: 5, scale: 2 }), // p-value
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Experiment = typeof experiments.$inferSelect;
export type InsertExperiment = typeof experiments.$inferInsert;

// Experiment Assignments table (tracks which users are in which variant)
export const experimentAssignments = mysqlTable("experimentAssignments", {
  id: int("id").autoincrement().primaryKey(),
  experimentId: int("experimentId").notNull(),
  userId: int("userId").notNull(),
  variant: varchar("variant", { length: 255 }).notNull(),
  conversionValue: decimal("conversionValue", { precision: 10, scale: 2 }),
  convertedAt: timestamp("convertedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExperimentAssignment = typeof experimentAssignments.$inferSelect;
export type InsertExperimentAssignment = typeof experimentAssignments.$inferInsert;

// Performance Metrics table
export const performanceMetrics = mysqlTable("performanceMetrics", {
  id: int("id").autoincrement().primaryKey(),
  metricType: varchar("metricType", { length: 255 }).notNull(), // api_response_time, page_load_time, error_rate, etc.
  metricName: varchar("metricName", { length: 255 }).notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }), // ms, %, count, etc.
  endpoint: varchar("endpoint", { length: 255 }), // for API metrics
  statusCode: int("statusCode"), // HTTP status code
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;

// Error Tracking table
export const errorTracking = mysqlTable("errorTracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  errorType: varchar("errorType", { length: 255 }).notNull(),
  errorMessage: text("errorMessage"),
  stackTrace: text("stackTrace"),
  endpoint: varchar("endpoint", { length: 255 }),
  statusCode: int("statusCode"),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium"),
  status: mysqlEnum("status", ["new", "acknowledged", "investigating", "resolved"]).default("new"),
  occurrenceCount: int("occurrenceCount").default(1),
  lastOccurredAt: timestamp("lastOccurredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ErrorTracking = typeof errorTracking.$inferSelect;
export type InsertErrorTracking = typeof errorTracking.$inferInsert;

// Support Tickets table
export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ticketNumber: varchar("ticketNumber", { length: 255 }).unique().notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["technical", "billing", "enrollment", "certificate", "payment", "other"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  status: mysqlEnum("status", ["open", "in_progress", "waiting_user", "resolved", "closed"]).default("open"),
  assignedTo: int("assignedTo"), // admin user id
  resolution: text("resolution"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

// Support Ticket Messages table
export const supportTicketMessages = mysqlTable("supportTicketMessages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  userId: int("userId").notNull(),
  message: text("message"),
  isInternal: boolean("isInternal").default(false), // internal notes only visible to admins
  attachmentUrl: text("attachmentUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupportTicketMessage = typeof supportTicketMessages.$inferSelect;
export type InsertSupportTicketMessage = typeof supportTicketMessages.$inferInsert;

// Feature Flags table
export const featureFlags = mysqlTable("featureFlags", {
  id: int("id").autoincrement().primaryKey(),
  flagName: varchar("flagName", { length: 255 }).unique().notNull(),
  description: text("description"),
  isEnabled: boolean("isEnabled").default(false),
  rolloutPercentage: int("rolloutPercentage").default(0), // 0-100%
  targetUserType: mysqlEnum("targetUserType", ["all", "admin", "individual", "institutional"]).default("all"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;

// User Cohorts table
export const userCohorts = mysqlTable("userCohorts", {
  id: int("id").autoincrement().primaryKey(),
  cohortName: varchar("cohortName", { length: 255 }).notNull(),
  description: text("description"),
  criteria: text("criteria"), // JSON object with cohort criteria
  userCount: int("userCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCohort = typeof userCohorts.$inferSelect;
export type InsertUserCohort = typeof userCohorts.$inferInsert;

// User Cohort Members table
export const userCohortMembers = mysqlTable("userCohortMembers", {
  id: int("id").autoincrement().primaryKey(),
  cohortId: int("cohortId").notNull(),
  userId: int("userId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type UserCohortMember = typeof userCohortMembers.$inferSelect;
export type InsertUserCohortMember = typeof userCohortMembers.$inferInsert;

// Conversion Funnel Events table
export const conversionFunnelEvents = mysqlTable("conversionFunnelEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 255 }).notNull(),
  funnelName: varchar("funnelName", { length: 255 }).notNull(), // enrollment_funnel, payment_funnel, etc.
  step: int("step").notNull(), // 1, 2, 3, etc.
  stepName: varchar("stepName", { length: 255 }).notNull(), // course_selection, payment_info, confirmation, etc.
  completedAt: timestamp("completedAt"),
  droppedAt: timestamp("droppedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversionFunnelEvent = typeof conversionFunnelEvents.$inferSelect;
export type InsertConversionFunnelEvent = typeof conversionFunnelEvents.$inferInsert;

// NPS Survey Responses table
export const npsSurveyResponses = mysqlTable("npsSurveyResponses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  score: int("score").notNull(), // 0-10
  category: mysqlEnum("category", ["promoter", "passive", "detractor"]), // calculated from score
  feedback: text("feedback"),
  followUpEmail: varchar("followUpEmail", { length: 320 }),
  followUpSent: boolean("followUpSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NpsSurveyResponse = typeof npsSurveyResponses.$inferSelect;
export type InsertNpsSurveyResponse = typeof npsSurveyResponses.$inferInsert;


// ============================================
// SAFE-TRUTH PLATFORM TABLES
// ============================================

// User Roles and Workstation Information
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  primaryRole: mysqlEnum("primaryRole", [
    "clinician",
    "nurse",
    "paramedic",
    "facility_manager",
    "parent_caregiver",
    "government",
    "insurance",
    "other",
  ]),
  workstation: mysqlEnum("workstation", [
    "emergency_department",
    "icu",
    "ward",
    "clinic",
    "home",
    "other",
  ]),
  facilityId: int("facilityId"), // for institutional users
  facilityName: varchar("facilityName", { length: 255 }),
  yearsOfExperience: int("yearsOfExperience").default(0),
  specialization: varchar("specialization", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// Safe-Truth Events (pediatric emergency cases)
export const safetruthEvents = mysqlTable("safetruthEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  facilityId: int("facilityId"),
  facilityName: varchar("facilityName", { length: 255 }),
  eventDate: timestamp("eventDate").notNull(),
  childAge: int("childAge").default(0), // in months
  childAgeGroup: mysqlEnum("childAgeGroup", [
    "newborn_0_3m",
    "infant_3_12m",
    "toddler_1_3y",
    "preschool_3_5y",
    "school_5_12y",
    "adolescent_12_18y",
  ]),
  eventType: mysqlEnum("eventType", [
    "cardiac_arrest",
    "respiratory_failure",
    "severe_sepsis",
    "trauma",
    "drowning",
    "choking",
    "other",
  ]).notNull(),
  initialPresentation: text("initialPresentation"), // detailed description
  isAnonymous: boolean("isAnonymous").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SafetruthEvent = typeof safetruthEvents.$inferSelect;
export type InsertSafetruthEvent = typeof safetruthEvents.$inferInsert;

// Chain of Survival Checkpoints
export const chainOfSurvivalCheckpoints = mysqlTable("chainOfSurvivalCheckpoints", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  recognitionCompleted: boolean("recognitionCompleted").default(false),
  recognitionNotes: text("recognitionNotes"),
  activationCompleted: boolean("activationCompleted").default(false),
  activationNotes: text("activationNotes"),
  cprCompleted: boolean("cprCompleted").default(false),
  cprQuality: mysqlEnum("cprQuality", ["excellent", "good", "adequate", "poor", "not_performed"]),
  cprNotes: text("cprNotes"),
  defibrillationCompleted: boolean("defibrillationCompleted").default(false),
  defibrillationNotes: text("defibrillationNotes"),
  advancedCareCompleted: boolean("advancedCareCompleted").default(false),
  advancedCareDetails: text("advancedCareDetails"),
  postResuscitationCompleted: boolean("postResuscitationCompleted").default(false),
  postResuscitationNotes: text("postResuscitationNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChainOfSurvivalCheckpoint = typeof chainOfSurvivalCheckpoints.$inferSelect;
export type InsertChainOfSurvivalCheckpoint = typeof chainOfSurvivalCheckpoints.$inferInsert;

// Event Outcomes
export const eventOutcomes = mysqlTable("eventOutcomes", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull().unique(),
  outcome: mysqlEnum("outcome", [
    "pCOSCA",
    "ROSC_with_disability",
    "ROSC_unknown",
    "mortality",
    "ongoing_resuscitation",
  ]).notNull(),
  neurologicalStatus: mysqlEnum("neurologicalStatus", [
    "intact",
    "mild_impairment",
    "moderate_impairment",
    "severe_impairment",
    "unknown",
  ]),
  timeToROSC: int("timeToROSC"), // in seconds
  hospitalStayDays: int("hospitalStayDays"),
  dischargeDiagnosis: text("dischargeDiagnosis"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EventOutcome = typeof eventOutcomes.$inferSelect;
export type InsertEventOutcome = typeof eventOutcomes.$inferInsert;

// System Gaps Identified
export const systemGaps = mysqlTable("systemGaps", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  gapCategory: mysqlEnum("gapCategory", [
    "knowledge_gap",
    "resources_gap",
    "leadership_gap",
    "communication_gap",
    "protocol_gap",
    "equipment_gap",
    "training_gap",
    "staffing_gap",
    "infrastructure_gap",
    "other",
  ]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium"),
  description: text("description").notNull(),
  impact: text("impact"), // how this gap affected the outcome
  remediationStatus: mysqlEnum("remediationStatus", [
    "identified",
    "in_progress",
    "resolved",
    "not_applicable",
  ]).default("identified"),
  remediationDate: timestamp("remediationDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemGap = typeof systemGaps.$inferSelect;
export type InsertSystemGap = typeof systemGaps.$inferInsert;

// User Insights and Recommendations
export const userInsights = mysqlTable("userInsights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  insightType: mysqlEnum("insightType", [
    "performance_metric",
    "peer_comparison",
    "gap_recommendation",
    "improvement_suggestion",
    "milestone_achievement",
    "alert",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  actionable: boolean("actionable").default(true),
  actionUrl: text("actionUrl"), // link to take action
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserInsight = typeof userInsights.$inferSelect;
export type InsertUserInsight = typeof userInsights.$inferInsert;

// Facility Scores (hidden scoring system)
export const facilityScores = mysqlTable("facilityScores", {
  id: int("id").autoincrement().primaryKey(),
  facilityId: int("facilityId").notNull().unique(),
  facilityName: varchar("facilityName", { length: 255 }).notNull(),
  pCOSCARate: decimal("pCOSCARate", { precision: 5, scale: 2 }).default("0"), // percentage
  totalEventsReported: int("totalEventsReported").default(0),
  systemGapRemediationSpeed: int("systemGapRemediationSpeed").default(0), // average days to remediate
  staffEngagementScore: decimal("staffEngagementScore", { precision: 5, scale: 2 }).default("0"), // 0-100
  eventReportingFrequency: int("eventReportingFrequency").default(0), // events per month
  insightAdoptionRate: decimal("insightAdoptionRate", { precision: 5, scale: 2 }).default("0"), // percentage
  overallScore: decimal("overallScore", { precision: 5, scale: 2 }).default("0"), // 0-100 composite score
  scoreVisibility: mysqlEnum("scoreVisibility", ["hidden", "visible_to_facility", "public"]).default("hidden"),
  lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FacilityScore = typeof facilityScores.$inferSelect;
export type InsertFacilityScore = typeof facilityScores.$inferInsert;

// Accreditation Applications
export const accreditationApplications = mysqlTable("accreditationApplications", {
  id: int("id").autoincrement().primaryKey(),
  facilityId: int("facilityId").notNull(),
  facilityName: varchar("facilityName", { length: 255 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }).notNull(),
  applicationDate: timestamp("applicationDate").defaultNow().notNull(),
  status: mysqlEnum("status", [
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "accredited",
    "revoked",
  ]).default("submitted"),
  reviewerNotes: text("reviewerNotes"),
  facilityScore: decimal("facilityScore", { precision: 5, scale: 2 }),
  badgeAwarded: boolean("badgeAwarded").default(false),
  badgeAwardedDate: timestamp("badgeAwardedDate"),
  accreditationExpiryDate: timestamp("accreditationExpiryDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccreditationApplication = typeof accreditationApplications.$inferSelect;
export type InsertAccreditationApplication = typeof accreditationApplications.$inferInsert;

// Accredited Facilities Directory
export const accreditedFacilities = mysqlTable("accreditedFacilities", {
  id: int("id").autoincrement().primaryKey(),
  facilityId: int("facilityId").notNull().unique(),
  facilityName: varchar("facilityName", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  county: varchar("county", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  pCOSCARate: decimal("pCOSCARate", { precision: 5, scale: 2 }),
  accreditationDate: timestamp("accreditationDate").notNull(),
  expiryDate: timestamp("expiryDate"),
  badgeUrl: text("badgeUrl"),
  publicProfile: boolean("publicProfile").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccreditedFacility = typeof accreditedFacilities.$inferSelect;
export type InsertAccreditedFacility = typeof accreditedFacilities.$inferInsert;


// Courses table
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  programType: mysqlEnum("programType", ["bls", "acls", "pals", "fellowship", "instructor", "fellowship_diploma", "heartsaver", "nrp"]).notNull(),
  duration: int("duration"), // in minutes
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced"]).default("beginner"),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

// Micro-Courses table (26 courses: foundational + advanced tiers)
export const microCourses = mysqlTable("microCourses", {
  id: int("id").autoincrement().primaryKey(),
  courseId: varchar("courseId", { length: 64 }).notNull().unique(), // e.g., 'asthma-i', 'septic-shock-ii'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  level: mysqlEnum("level", ["foundational", "advanced"]).notNull(),
  emergencyType: mysqlEnum("emergencyType", ["respiratory", "shock", "seizure", "toxicology", "metabolic", "infectious", "burns", "trauma"]).notNull(),
  duration: int("duration").notNull(), // in minutes
  price: int("price").notNull(), // in KES cents (800 KES = 80000 cents)
  prerequisiteId: varchar("prerequisiteId", { length: 64 }), // e.g., 'asthma-i' is prerequisite for 'asthma-ii'
  order: int("order").default(0),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MicroCourse = typeof microCourses.$inferSelect;
export type InsertMicroCourse = typeof microCourses.$inferInsert;

// Promo Codes table
export const promoCodes = mysqlTable("promoCodes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(), // e.g., 'EARLYBIRD20', 'ADMIN100'
  discountPercent: int("discountPercent").default(0), // 0-100, 0 means free
  maxUses: int("maxUses"), // NULL = unlimited
  usesCount: int("usesCount").default(0),
  expiresAt: timestamp("expiresAt"),
  createdBy: int("createdBy").notNull(), // admin user id
  description: text("description"), // e.g., "Early bird discount for first 100 users"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

// Micro-Course Enrollments table
export const microCourseEnrollments = mysqlTable("microCourseEnrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  microCourseId: int("microCourseId").notNull(),
  enrollmentStatus: mysqlEnum("enrollmentStatus", ["pending", "active", "completed", "expired"]).default("pending"),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "free"]).default("pending"),
  paymentMethod: mysqlEnum("paymentMethod", ["m-pesa", "admin-free", "promo-code"]), // how they enrolled
  paymentId: int("paymentId"), // links to payments table if paid via M-Pesa
  promoCodeId: int("promoCodeId"), // links to promoCodes table if used promo code
  amountPaid: int("amountPaid"), // actual amount paid in KES cents (after discount)
  transactionId: varchar("transactionId", { length: 255 }), // M-Pesa reference
  progressPercentage: int("progressPercentage").default(0),
  quizScore: int("quizScore"), // percentage (80+ = pass)
  certificateUrl: text("certificateUrl"),
  certificateIssuedAt: timestamp("certificateIssuedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MicroCourseEnrollment = typeof microCourseEnrollments.$inferSelect;
export type InsertMicroCourseEnrollment = typeof microCourseEnrollments.$inferInsert;

// Modules table
export const modules = mysqlTable("modules", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"), // HTML content
  duration: int("duration"), // in minutes
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


export type Module = typeof modules.$inferSelect;
export type InsertModule = typeof modules.$inferInsert;

// Module Sections table (Breakdown each module into interactive sections)
export const moduleSections = mysqlTable("moduleSections", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"), // HTML content for this section
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ModuleSection = typeof moduleSections.$inferSelect;
export type InsertModuleSection = typeof moduleSections.$inferInsert;

// Quizzes table
export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  passingScore: int("passingScore").default(70), // percentage
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

// Quiz Questions table
export const quizQuestions = mysqlTable("quizQuestions", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  question: text("question").notNull(),
  questionType: mysqlEnum("questionType", ["multiple_choice", "true_false", "short_answer"]).default("multiple_choice"),
  options: text("options"), // JSON array of options
  correctAnswer: text("correctAnswer"), // JSON
  explanation: text("explanation"),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

// User Progress table
// ============================================
// CAPSTONE SUBMISSIONS TABLE
// ============================================
export const capstoneSubmissions = mysqlTable("capstoneSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  enrollmentId: int("enrollmentId").notNull(),
  courseId: varchar("courseId", { length: 255 }).notNull(),
  caseResponse: text("caseResponse").notNull(),
  status: mysqlEnum("status", ["pending", "under_review", "graded", "passed", "failed"]).default("pending").notNull(),
  score: int("score"), // 0-100
  instructorId: int("instructorId"),
  instructorFeedback: text("instructorFeedback"),
  gradedAt: timestamp("gradedAt"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CapstoneSubmission = typeof capstoneSubmissions.$inferSelect;
export type InsertCapstoneSubmission = typeof capstoneSubmissions.$inferInsert;

export const userProgress = mysqlTable("userProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  enrollmentId: int("enrollmentId").notNull(),
  moduleId: int("moduleId").notNull(),
  quizId: int("quizId"),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started"),
  score: int("score"), // percentage
  attempts: int("attempts").default(0),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  /** Optional reference to a fellowship simulation (migration 0043) */
  fellowshipSimulationId: int("fellowshipSimulationId"),
});

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;


// ============================================
// INSTITUTIONAL PORTAL TABLES
// ============================================

export const designationEnum = mysqlEnum("designation", [
  "noi",
  "coi_bsc",
  "coi_diploma",
  "moi",
  "permanent_nurse",
  "permanent_doctor",
  "other"
]);

export const governanceRoleEnum = mysqlEnum("governance_role", [
  "executive",               // Hospital Executive (CEO / Medical Director / CNO)
  "erc_chair",              // Emergency Readiness Committee Chair
  "erc_member",             // Emergency Readiness Committee Member
  "er_coordinator",         // Emergency Readiness Coordinator (Operational Lead)
  "unit_team_leader",       // Unit Team Leader (UTL / Ward In-Charge)
  "ert_leader",             // ERT Team Leader (ERTL)
  "ert_responder",          // ERT Primary Responder
  "general_staff"           // Staff Member
]);

// Institutional Staff Members
export const institutionalStaffMembers = mysqlTable("institutionalStaffMembers", {
  id: int("id").autoincrement().primaryKey(),
  // Nullable as of 2026-08-04 (docs/IERP_NERP_PROGRAM_V2_SPEC.md §2, root
  // cause found while investigating why self-service phase tracking wasn't
  // working: syncProviderProfileFacility only ever created this row when
  // the learner's facility mapped to a *recognized* institutional account,
  // and declareMyDesignation hard-required the row to exist -- so a
  // learner whose facility isn't listed on the platform (explicitly a
  // supported case per §2) could never even declare their designation, let
  // alone progress through any phase. Same pattern as the
  // trainingSchedules.institutionalAccountId nullable change from slice 2:
  // self-service rows now get created with this null and
  // facilityLinkStatus auto-set to "linked" (no coordinator exists to
  // approve it, per §7). Institution-scoped queries that join/filter on
  // institutionalAccountId correctly exclude these rows -- a self-service
  // learner shouldn't show up in any one institution's coordinator view.
  institutionalAccountId: int("institutionalAccountId"),
  userId: int("userId"),
  staffName: varchar("staffName", { length: 255 }).notNull(),
  staffEmail: varchar("staffEmail", { length: 320 }).notNull(),
  staffPhone: varchar("staffPhone", { length: 20 }),
  staffRole: mysqlEnum("staffRole", ["doctor", "nurse", "paramedic", "midwife", "lab_tech", "respiratory_therapist", "support_staff", "other"]).notNull(),
  designation: designationEnum.default("other"),
  governanceRole: governanceRoleEnum.default("general_staff"),
  institutionalRole: mysqlEnum("institutionalRole", ["director", "coordinator", "finance_officer", "department_head", "staff_member"]).default("staff_member"),
  department: varchar("department", { length: 255 }),
  /** Canonical IERS facility-department identity; legacy department text remains for display/history. */
  facilityDepartmentId: int("facilityDepartmentId"),
  yearsOfExperience: int("yearsOfExperience").default(0),
  assignedCourses: text("assignedCourses"), // JSON array of course IDs
  enrollmentStatus: mysqlEnum("enrollmentStatus", ["pending", "enrolled", "in_progress", "completed", "dropped"]).default("pending"),
  phaseStatus: mysqlEnum("phaseStatus", ["phase_1", "phase_2", "phase_3", "completed"]).default("phase_1"),
  facilityLinkStatus: mysqlEnum("facilityLinkStatus", ["pending", "linked", "rejected"]).default("pending"),
  /** Set when an institution removes the person; roster and history remain retained. */
  removedAt: timestamp("removedAt"),
  removedByUserId: int("removedByUserId"),
  removalReason: text("removalReason"),
  totalPaidAmount: decimal("totalPaidAmount", { precision: 10, scale: 2 }).default("0.00"),
  /** Phase 1: URL of the uploaded elearning.heart.org completion proof (PDF or image) */
  phase1ProofUrl: text("phase1ProofUrl"),
  /** Phase 1: Timestamp when an institutional coordinator approved the uploaded proof */
  phase1ProofApprovedAt: timestamp("phase1ProofApprovedAt"),
  enrollmentDate: timestamp("enrollmentDate"),
  completionDate: timestamp("completionDate"),
  certificationStatus: mysqlEnum("certificationStatus", ["not_started", "in_progress", "certified", "expired", "renewal_pending"]).default("not_started"),
  certificationDate: timestamp("certificationDate"),
  certificationExpiryDate: timestamp("certificationExpiryDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstitutionalStaffMember = typeof institutionalStaffMembers.$inferSelect;
export type InsertInstitutionalStaffMember = typeof institutionalStaffMembers.$inferInsert;

/** Canonical institution-facing products. Administration is shared and is not subscription-gated. */
export const institutionalProducts = mysqlTable("institutionalProducts", {
  id: int("id").autoincrement().primaryKey(),
  productKey: varchar("productKey", { length: 64 }).notNull().unique(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  description: text("description").notNull(),
  productKind: mysqlEnum("productKind", ["core", "transitional"]).default("core").notNull(),
  lifecycleStatus: mysqlEnum("lifecycleStatus", ["active", "pilot", "preview", "coming_soon", "deprecated"]).default("active").notNull(),
  ownerTeam: varchar("ownerTeam", { length: 255 }).notNull(),
  privacyClass: varchar("privacyClass", { length: 64 }).default("institutional").notNull(),
  routeKey: varchar("routeKey", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InstitutionalProduct = typeof institutionalProducts.$inferSelect;
export type InsertInstitutionalProduct = typeof institutionalProducts.$inferInsert;

/** Product capabilities are the server-side access vocabulary for route and mutation gates. */
export const institutionalProductCapabilities = mysqlTable("institutionalProductCapabilities", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  capabilityKey: varchar("capabilityKey", { length: 128 }).notNull(),
  capabilityClass: mysqlEnum("capabilityClass", ["read", "operate", "review", "govern", "commercial"]).default("read").notNull(),
  renewalPolicy: mysqlEnum("renewalPolicy", ["full", "read_only", "operational_continuity", "blocked"]).default("full").notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["active", "retired"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productCapabilityUnique: uniqueIndex("institutionalProductCapabilities_product_capability_unique").on(table.productId, table.capabilityKey),
  productStatusIndex: index("institutionalProductCapabilities_product_status_idx").on(table.productId, table.status),
}));
export type InstitutionalProductCapability = typeof institutionalProductCapabilities.$inferSelect;
export type InsertInstitutionalProductCapability = typeof institutionalProductCapabilities.$inferInsert;

/** Commercial plan metadata; prices are snapshots at contract/subscription time. */
export const institutionalProductPlans = mysqlTable("institutionalProductPlans", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  planKey: varchar("planKey", { length: 64 }).notNull(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  billingInterval: mysqlEnum("billingInterval", ["monthly", "annual", "custom"]).default("custom").notNull(),
  billingModel: mysqlEnum("billingModel", ["institution", "per_staff", "per_seat", "custom"]).default("institution").notNull(),
  currency: varchar("currency", { length: 3 }).default("KES").notNull(),
  priceAmount: int("priceAmount"),
  status: mysqlEnum("status", ["active", "retired"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productPlanUnique: uniqueIndex("institutionalProductPlans_product_plan_unique").on(table.productId, table.planKey),
  productStatusIndex: index("institutionalProductPlans_product_status_idx").on(table.productId, table.status),
}));
export type InstitutionalProductPlan = typeof institutionalProductPlans.$inferSelect;
export type InsertInstitutionalProductPlan = typeof institutionalProductPlans.$inferInsert;

/** One current commercial relationship per institution/product; history lives in institutionSubscriptionEvents. */
export const institutionProductSubscriptions = mysqlTable("institutionProductSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  productId: int("productId").notNull(),
  planId: int("planId"),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["trial", "active", "grace", "past_due", "expired", "suspended", "cancelled", "legacy_unclassified", "not_subscribed"]).default("legacy_unclassified").notNull(),
  startsAt: timestamp("startsAt"),
  renewsAt: timestamp("renewsAt"),
  expiresAt: timestamp("expiresAt"),
  graceEndsAt: timestamp("graceEndsAt"),
  cancelledAt: timestamp("cancelledAt"),
  source: mysqlEnum("source", ["contract", "quotation", "payment", "pilot", "manual_override", "legacy_migration"]).default("legacy_migration").notNull(),
  contractId: int("contractId"),
  quotationId: int("quotationId"),
  externalReference: varchar("externalReference", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionProductUnique: uniqueIndex("institutionProductSubscriptions_institution_product_unique").on(table.institutionalAccountId, table.productId),
  institutionStatusIndex: index("institutionProductSubscriptions_institution_status_idx").on(table.institutionalAccountId, table.subscriptionStatus),
  renewalIndex: index("institutionProductSubscriptions_renewal_idx").on(table.subscriptionStatus, table.renewsAt),
}));
export type InstitutionProductSubscription = typeof institutionProductSubscriptions.$inferSelect;
export type InsertInstitutionProductSubscription = typeof institutionProductSubscriptions.$inferInsert;

/** Effective capability grants derived from a product subscription. */
export const institutionProductEntitlements = mysqlTable("institutionProductEntitlements", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  productId: int("productId").notNull(),
  subscriptionId: int("subscriptionId"),
  capabilityKey: varchar("capabilityKey", { length: 128 }).notNull(),
  entitlementStatus: mysqlEnum("entitlementStatus", ["active", "grace", "read_only", "blocked", "revoked"]).default("active").notNull(),
  limitValue: int("limitValue"),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionCapabilityUnique: uniqueIndex("institutionProductEntitlements_institution_capability_unique").on(table.institutionalAccountId, table.productId, table.capabilityKey),
  institutionStatusIndex: index("institutionProductEntitlements_institution_status_idx").on(table.institutionalAccountId, table.entitlementStatus),
}));
export type InstitutionProductEntitlement = typeof institutionProductEntitlements.$inferSelect;
export type InsertInstitutionProductEntitlement = typeof institutionProductEntitlements.$inferInsert;

/** Product-specific roles, separate from shared account administration and IERS responsibility roles. */
export const institutionProductRoles = mysqlTable("institutionProductRoles", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  productId: int("productId").notNull(),
  userId: int("userId"),
  invitedEmail: varchar("invitedEmail", { length: 320 }).notNull(),
  roleKey: varchar("roleKey", { length: 128 }).notNull(),
  roleStatus: mysqlEnum("roleStatus", ["invited", "active", "suspended", "ended"]).default("invited").notNull(),
  grantedByUserId: int("grantedByUserId"),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionEmailRoleUnique: uniqueIndex("institutionProductRoles_institution_product_email_role_unique").on(table.institutionalAccountId, table.productId, table.invitedEmail, table.roleKey),
  institutionUserIndex: index("institutionProductRoles_institution_user_idx").on(table.institutionalAccountId, table.userId),
  productStatusIndex: index("institutionProductRoles_product_status_idx").on(table.productId, table.roleStatus),
}));
export type InstitutionProductRole = typeof institutionProductRoles.$inferSelect;
export type InsertInstitutionProductRole = typeof institutionProductRoles.$inferInsert;

/** Shared institution scopes are intentionally separate from IERS and CPD product roles. */
export const institutionAccountScopes = mysqlTable("institutionAccountScopes", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  userId: int("userId"),
  invitedEmail: varchar("invitedEmail", { length: 320 }).notNull(),
  scopeKey: varchar("scopeKey", { length: 64 }).notNull(),
  scopeStatus: mysqlEnum("scopeStatus", ["invited", "active", "suspended", "ended"]).default("invited").notNull(),
  grantedByUserId: int("grantedByUserId"),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionEmailScopeUnique: uniqueIndex("institutionAccountScopes_inst_email_scope_uq").on(table.institutionalAccountId, table.invitedEmail, table.scopeKey),
  institutionUserIndex: index("institutionAccountScopes_inst_user_idx").on(table.institutionalAccountId, table.userId),
  institutionStatusIndex: index("institutionAccountScopes_inst_status_idx").on(table.institutionalAccountId, table.scopeStatus),
}));
export type InstitutionAccountScope = typeof institutionAccountScopes.$inferSelect;
export type InsertInstitutionAccountScope = typeof institutionAccountScopes.$inferInsert;

/** Append-only history for shared institution-scope assignments. */
export const institutionAccountScopeEvents = mysqlTable("institutionAccountScopeEvents", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  scopeId: int("scopeId").notNull(),
  eventType: varchar("eventType", { length: 32 }).notNull(),
  previousStatus: varchar("previousStatus", { length: 32 }),
  currentStatus: varchar("currentStatus", { length: 32 }),
  actorUserId: int("actorUserId"),
  reason: text("reason"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
}, (table) => ({
  institutionScopeIndex: index("institutionAccountScopeEvents_inst_scope_idx").on(table.institutionalAccountId, table.scopeId),
  occurredIndex: index("institutionAccountScopeEvents_occurred_idx").on(table.occurredAt),
}));
export type InstitutionAccountScopeEvent = typeof institutionAccountScopeEvents.$inferSelect;
export type InsertInstitutionAccountScopeEvent = typeof institutionAccountScopeEvents.$inferInsert;

/** Append-only commercial and entitlement state history. */
export const institutionSubscriptionEvents = mysqlTable("institutionSubscriptionEvents", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  productId: int("productId").notNull(),
  subscriptionId: int("subscriptionId"),
  eventType: mysqlEnum("eventType", ["created", "activated", "renewed", "payment_succeeded", "payment_failed", "grace_started", "past_due", "expired", "suspended", "resumed", "cancelled", "manual_override", "legacy_migrated"]).notNull(),
  previousStatus: varchar("previousStatus", { length: 64 }),
  currentStatus: varchar("currentStatus", { length: 64 }),
  actorUserId: int("actorUserId"),
  reason: text("reason"),
  reference: varchar("reference", { length: 255 }),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});
export type InstitutionSubscriptionEvent = typeof institutionSubscriptionEvents.$inferSelect;
export type InsertInstitutionSubscriptionEvent = typeof institutionSubscriptionEvents.$inferInsert;

/** Product access decisions and manual overrides for auditability. */
export const institutionEntitlementAuditLog = mysqlTable("institutionEntitlementAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  productId: int("productId").notNull(),
  capabilityKey: varchar("capabilityKey", { length: 128 }).notNull(),
  decision: mysqlEnum("decision", ["allowed", "denied", "read_only", "override"]).notNull(),
  userId: int("userId"),
  reason: varchar("reason", { length: 512 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  institutionDecisionIndex: index("institutionEntitlementAuditLog_institution_decision_idx").on(table.institutionalAccountId, table.decision),
  productCreatedIndex: index("institutionEntitlementAuditLog_product_created_idx").on(table.productId, table.createdAt),
}));
export type InstitutionEntitlementAuditLog = typeof institutionEntitlementAuditLog.$inferSelect;
export type InsertInstitutionEntitlementAuditLog = typeof institutionEntitlementAuditLog.$inferInsert;

/** Product-scoped retention and legal-hold policy. */
export const institutionDataLifecyclePolicies = mysqlTable("institutionDataLifecyclePolicies", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  productKey: varchar("productKey", { length: 64 }).notNull(),
  retentionDays: int("retentionDays").default(3650).notNull(),
  legalHold: boolean("legalHold").default(false).notNull(),
  updatedByUserId: int("updatedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionProductUnique: uniqueIndex("institutionDataLifecyclePolicies_institution_product_unique").on(table.institutionalAccountId, table.productKey),
}));
export type InstitutionDataLifecyclePolicy = typeof institutionDataLifecyclePolicies.$inferSelect;
export type InsertInstitutionDataLifecyclePolicy = typeof institutionDataLifecyclePolicies.$inferInsert;

/** Append-only control-plane requests for export, retention, recovery, and offboarding. */
export const institutionDataLifecycleRequests = mysqlTable("institutionDataLifecycleRequests", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  productKey: varchar("productKey", { length: 64 }).notNull(),
  requestType: mysqlEnum("requestType", ["export", "retention_change", "recovery", "offboarding"]).notNull(),
  status: mysqlEnum("status", ["requested", "approved", "in_progress", "completed", "cancelled"]).default("requested").notNull(),
  requestedByUserId: int("requestedByUserId").notNull(),
  reviewedByUserId: int("reviewedByUserId"),
  reason: text("reason").notNull(),
  format: varchar("format", { length: 32 }),
  metadata: json("metadata"),
  exportedAt: timestamp("exportedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionStatusIndex: index("institutionDataLifecycleRequests_institution_status_idx").on(table.institutionalAccountId, table.status),
  institutionProductIndex: index("institutionDataLifecycleRequests_institution_product_idx").on(table.institutionalAccountId, table.productKey),
}));
export type InstitutionDataLifecycleRequest = typeof institutionDataLifecycleRequests.$inferSelect;
export type InsertInstitutionDataLifecycleRequest = typeof institutionDataLifecycleRequests.$inferInsert;

/** Payment receipts linked to an institutional product subscription. */
export const institutionSubscriptionPayments = mysqlTable("institutionSubscriptionPayments", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  productId: int("productId").notNull(),
  subscriptionId: int("subscriptionId"),
  paymentMethod: mysqlEnum("paymentMethod", ["mpesa", "bank_transfer", "card"]).notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 3 }).default("KES").notNull(),
  paymentReference: varchar("paymentReference", { length: 255 }).notNull(),
  idempotencyKey: varchar("idempotencyKey", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("completed").notNull(),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  paymentIdempotencyUnique: uniqueIndex("inst_sub_pay_idem_uq").on(table.idempotencyKey),
  paymentReferenceUnique: uniqueIndex("inst_sub_pay_ref_uq").on(table.paymentReference),
  institutionProductIndex: index("inst_sub_pay_prod_idx").on(table.institutionalAccountId, table.productId),
}));
export type InstitutionSubscriptionPayment = typeof institutionSubscriptionPayments.$inferSelect;
export type InsertInstitutionSubscriptionPayment = typeof institutionSubscriptionPayments.$inferInsert;

/** Pending institutional M-Pesa checkout intents linked to one product subscription. */
export const institutionSubscriptionPaymentIntents = mysqlTable("institutionSubscriptionPaymentIntents", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  productId: int("productId").notNull(),
  planId: int("planId"),
  renewsAt: timestamp("renewsAt").notNull(),
  expiresAt: timestamp("expiresAt"),
  amountCents: int("amountCents").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  accountReference: varchar("accountReference", { length: 40 }).notNull(),
  checkoutRequestId: varchar("checkoutRequestId", { length: 255 }).notNull(),
  merchantRequestId: varchar("merchantRequestId", { length: 255 }),
  idempotencyKey: varchar("idempotencyKey", { length: 255 }).notNull(),
  mpesaReceiptNumber: varchar("mpesaReceiptNumber", { length: 50 }),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  resultCode: int("resultCode"),
  failureReason: text("failureReason"),
  createdByUserId: int("createdByUserId").notNull(),
  receivedAt: timestamp("receivedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  checkoutRequestUnique: uniqueIndex("inst_sub_intent_checkout_uq").on(table.checkoutRequestId),
  idempotencyUnique: uniqueIndex("inst_sub_intent_idem_uq").on(table.idempotencyKey),
  receiptUnique: uniqueIndex("inst_sub_intent_receipt_uq").on(table.mpesaReceiptNumber),
  institutionStatusIndex: index("inst_sub_intent_status_idx").on(table.institutionalAccountId, table.status),
}));
export type InstitutionSubscriptionPaymentIntent = typeof institutionSubscriptionPaymentIntents.$inferSelect;
export type InsertInstitutionSubscriptionPaymentIntent = typeof institutionSubscriptionPaymentIntents.$inferInsert;

/** Institution-owned renewal reminder preferences; external channels remain opt-in. */
export const institutionRenewalNotificationPreferences = mysqlTable("institutionRenewalNotificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  productKey: varchar("productKey", { length: 64 }).notNull(),
  inAppEnabled: boolean("inAppEnabled").default(true).notNull(),
  emailEnabled: boolean("emailEnabled").default(false).notNull(),
  smsEnabled: boolean("smsEnabled").default(false).notNull(),
  reminderDays: varchar("reminderDays", { length: 64 }).default("30,14,7,0").notNull(),
  updatedByUserId: int("updatedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionProductUnique: uniqueIndex("inst_renew_pref_inst_prod_uq").on(table.institutionalAccountId, table.productKey),
}));
export type InstitutionRenewalNotificationPreference = typeof institutionRenewalNotificationPreferences.$inferSelect;
export type InsertInstitutionRenewalNotificationPreference = typeof institutionRenewalNotificationPreferences.$inferInsert;

/** Deduplicated renewal notices and delivery history. */
export const institutionRenewalNotifications = mysqlTable("institutionRenewalNotifications", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  productId: int("productId").notNull(),
  subscriptionId: int("subscriptionId"),
  recipientUserId: int("recipientUserId").notNull(),
  notificationType: mysqlEnum("notificationType", ["renewal_30d", "renewal_14d", "renewal_7d", "renewal_due", "past_due", "grace_started", "expired"]).notNull(),
  channel: mysqlEnum("channel", ["in_app", "email", "sms"]).default("in_app").notNull(),
  status: mysqlEnum("status", ["queued", "sent", "failed", "cancelled"]).default("queued").notNull(),
  dedupeKey: varchar("dedupeKey", { length: 255 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  body: text("body").notNull(),
  actionUrl: varchar("actionUrl", { length: 512 }),
  scheduledFor: timestamp("scheduledFor").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
  failureReason: text("failureReason"),
  attempts: int("attempts").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  dedupeUnique: uniqueIndex("inst_renew_notif_dedupe_uq").on(table.dedupeKey),
  institutionStatusIndex: index("inst_renew_notif_status_idx").on(table.institutionalAccountId, table.status),
  scheduledIndex: index("inst_renew_notif_sched_idx").on(table.status, table.scheduledFor),
}));
export type InstitutionRenewalNotification = typeof institutionRenewalNotifications.$inferSelect;
export type InsertInstitutionRenewalNotification = typeof institutionRenewalNotifications.$inferInsert;

/** Persisted registry for adjacent, transitional, and connected institutional services. */
export const institutionConnectedServices = mysqlTable("institutionConnectedServices", {
  id: int("id").autoincrement().primaryKey(),
  serviceKey: varchar("serviceKey", { length: 64 }).notNull(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  description: text("description").notNull(),
  owner: varchar("owner", { length: 255 }).notNull(),
  lifecycleStatus: mysqlEnum("lifecycleStatus", ["connected", "transitional", "compatibility", "pilot", "retired"]).default("transitional").notNull(),
  privacyClass: mysqlEnum("privacyClass", ["institutional_aggregate", "provider_workflow", "accountless_public", "individual_learning", "mixed_review_required"]).default("mixed_review_required").notNull(),
  entitlementProductKey: varchar("entitlementProductKey", { length: 64 }),
  routeKey: varchar("routeKey", { length: 255 }),
  reviewLabel: varchar("reviewLabel", { length: 255 }),
  lastReviewedAt: timestamp("lastReviewedAt"),
  nextReviewAt: timestamp("nextReviewAt"),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  serviceKeyUnique: uniqueIndex("inst_conn_services_key_uq").on(table.serviceKey),
  lifecycleIndex: index("inst_conn_services_lifecycle_idx").on(table.lifecycleStatus, table.enabled),
}));
export type InstitutionConnectedService = typeof institutionConnectedServices.$inferSelect;
export type InsertInstitutionConnectedService = typeof institutionConnectedServices.$inferInsert;

/** Safe Truth governance boundary and processing contract. */
export const safeTruthGovernancePolicies = mysqlTable("safeTruthGovernancePolicies", {
  id: int("id").autoincrement().primaryKey(),
  policyKey: varchar("policyKey", { length: 64 }).notNull(),
  boundaryStatus: mysqlEnum("boundaryStatus", ["accountless_public", "provider_workflow", "institutional_aggregate", "mixed_review_required"]).notNull(),
  allowedRoute: varchar("allowedRoute", { length: 255 }).notNull(),
  institutionalAnalyticsAllowed: boolean("institutionalAnalyticsAllowed").default(false).notNull(),
  patientIdentifiersAllowed: boolean("patientIdentifiersAllowed").default(false).notNull(),
  providerLinkageAllowed: boolean("providerLinkageAllowed").default(false).notNull(),
  retentionDays: int("retentionDays"),
  policyVersion: varchar("policyVersion", { length: 32 }).notNull(),
  approvedByUserId: int("approvedByUserId"),
  approvedAt: timestamp("approvedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  policyKeyUnique: uniqueIndex("safe_truth_governance_policy_key_uq").on(table.policyKey),
}));
export type SafeTruthGovernancePolicy = typeof safeTruthGovernancePolicies.$inferSelect;
export type InsertSafeTruthGovernancePolicy = typeof safeTruthGovernancePolicies.$inferInsert;

/** Append-only review history for the Connected Services registry. */
export const institutionConnectedServiceEvents = mysqlTable("institutionConnectedServiceEvents", {
  id: int("id").autoincrement().primaryKey(),
  serviceId: int("serviceId").notNull(),
  eventType: mysqlEnum("eventType", ["created", "reviewed", "status_changed", "updated"]).notNull(),
  previousStatus: varchar("previousStatus", { length: 64 }),
  currentStatus: varchar("currentStatus", { length: 64 }),
  actorUserId: int("actorUserId"),
  reason: text("reason"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});
export type InstitutionConnectedServiceEvent = typeof institutionConnectedServiceEvents.$inferSelect;
export type InsertInstitutionConnectedServiceEvent = typeof institutionConnectedServiceEvents.$inferInsert;

/** Append-only approval history for Safe Truth boundary changes. */
export const safeTruthGovernancePolicyEvents = mysqlTable("safeTruthGovernancePolicyEvents", {
  id: int("id").autoincrement().primaryKey(),
  policyId: int("policyId").notNull(),
  eventType: mysqlEnum("eventType", ["created", "reviewed", "updated"]).notNull(),
  previousVersion: varchar("previousVersion", { length: 32 }),
  currentVersion: varchar("currentVersion", { length: 32 }).notNull(),
  actorUserId: int("actorUserId"),
  reason: text("reason"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});
export type SafeTruthGovernancePolicyEvent = typeof safeTruthGovernancePolicyEvents.$inferSelect;
export type InsertSafeTruthGovernancePolicyEvent = typeof safeTruthGovernancePolicyEvents.$inferInsert;

/**
 * Explicit provider requests to join an institution-owned facility. This is
 * separate from providerProfiles.facilityId: selecting a facility for care
 * context does not prove employment or grant institution access.
 */
export const facilityMembershipRequests = mysqlTable("facilityMembershipRequests", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  careFacilityId: int("careFacilityId").notNull(),
  userId: int("userId").notNull(),
  requesterEmail: varchar("requesterEmail", { length: 320 }).notNull(),
  requesterName: varchar("requesterName", { length: 255 }),
  relationshipType: mysqlEnum("relationshipType", ["permanent_staff", "locum_outreach"]).default("permanent_staff").notNull(),
  /** Non-null only while pending; MySQL unique indexes allow multiple NULLs. */
  pendingRequestKey: varchar("pendingRequestKey", { length: 128 }),
  department: varchar("department", { length: 255 }),
  facilityDepartmentId: int("facilityDepartmentId"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "withdrawn"]).default("pending").notNull(),
  staffMemberId: int("staffMemberId"),
  membershipId: int("membershipId"),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  reviewReason: text("reviewReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  pendingRequestKeyUnique: uniqueIndex("facilityMembershipRequests_pending_request_key_unique").on(table.pendingRequestKey),
  institutionStatusIndex: index("facilityMembershipRequests_institution_status_idx").on(table.institutionalAccountId, table.status, table.createdAt),
  userStatusIndex: index("facilityMembershipRequests_user_status_idx").on(table.userId, table.status, table.createdAt),
  facilityIndex: index("facilityMembershipRequests_facility_idx").on(table.careFacilityId, table.status),
}));
export type FacilityMembershipRequest = typeof facilityMembershipRequests.$inferSelect;
export type InsertFacilityMembershipRequest = typeof facilityMembershipRequests.$inferInsert;

/**
 * Shared provider–institution membership. This is deliberately separate from
 * institutionalStaffMembers: the latter remains the operational roster and
 * training record, while this table is the identity/permission contract for
 * provider participation in IERS workflows.
 */
export const institutionMemberships = mysqlTable("institutionMemberships", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  userId: int("userId"),
  invitedEmail: varchar("invitedEmail", { length: 320 }).notNull(),
  staffMemberId: int("staffMemberId"),
  membershipStatus: mysqlEnum("membershipStatus", ["invited", "active", "suspended", "ended"]).default("invited").notNull(),
  responsibilityRole: mysqlEnum("responsibilityRole", [
    "executive",
    "erc_chair",
    "erc_member",
    "er_coordinator",
    "unit_team_leader",
    "ert_leader",
    "ert_responder",
    "general_staff",
  ]).default("general_staff").notNull(),
  invitedByUserId: int("invitedByUserId"),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  suspendedAt: timestamp("suspendedAt"),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionEmailUnique: uniqueIndex("institutionMemberships_institution_email_unique").on(table.institutionalAccountId, table.invitedEmail),
  institutionUserIndex: index("institutionMemberships_institution_user_idx").on(table.institutionalAccountId, table.userId),
  institutionStatusIndex: index("institutionMemberships_institution_status_idx").on(table.institutionalAccountId, table.membershipStatus),
}));
export type InstitutionMembership = typeof institutionMemberships.$inferSelect;
export type InsertInstitutionMembership = typeof institutionMemberships.$inferInsert;

/** Append-only audit history for institution membership and roster removal decisions. */
export const institutionMembershipEvents = mysqlTable("institution_membership_events", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutional_account_id").notNull(),
  membershipId: int("membership_id").notNull(),
  staffMemberId: int("staff_member_id"),
  userId: int("user_id"),
  eventType: mysqlEnum("event_type", ["removed", "restored", "suspended", "reactivated"]).notNull(),
  previousMembershipStatus: varchar("previous_membership_status", { length: 32 }),
  currentMembershipStatus: varchar("current_membership_status", { length: 32 }).notNull(),
  actorUserId: int("actor_user_id").notNull(),
  reason: text("reason").notNull(),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
}, (table) => ({
  institutionMembershipIndex: index("institution_membership_events_inst_membership_idx").on(table.institutionalAccountId, table.membershipId),
  occurredIndex: index("institution_membership_events_occurred_idx").on(table.occurredAt),
}));
export type InstitutionMembershipEvent = typeof institutionMembershipEvents.$inferSelect;
export type InsertInstitutionMembershipEvent = typeof institutionMembershipEvents.$inferInsert;

/** Durable IERS emergency activation record. */
export const iersActivationEvents = mysqlTable("iersActivationEvents", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  activatedByUserId: int("activatedByUserId").notNull(),
  /** The exact published/active dated team used for this activation, when available. */
  teamId: int("teamId"),
  teamVersion: int("teamVersion"),
  poleId: int("poleId"),
  /** Opaque case-link nonce; the QR payload is signed server-side and contains no patient identifier. */
  caseQrNonce: varchar("caseQrNonce", { length: 128 }),
  caseQrGeneratedByUserId: int("caseQrGeneratedByUserId"),
  caseQrGeneratedAt: timestamp("caseQrGeneratedAt"),
  activationType: mysqlEnum("activationType", ["code_blue", "code_yellow", "neonatal", "sepsis", "anaphylaxis", "trauma", "other"]).notNull(),
  priority: mysqlEnum("priority", ["critical", "high", "routine"]).default("critical").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  bedNumber: varchar("bedNumber", { length: 64 }),
  department: varchar("department", { length: 255 }),
  source: mysqlEnum("source", ["provider", "unit_team_leader", "ert_leader", "institution_admin", "downtime_reconciliation"]).default("provider").notNull(),
  status: mysqlEnum("status", ["draft", "triggered", "notifying", "acknowledged", "responding", "at_scene", "stabilized", "recovered", "debrief_pending", "closed", "cancelled", "false_alarm", "downtime_pending_sync", "failed_escalation"]).default("triggered").notNull(),
  triggeredAt: timestamp("triggeredAt").defaultNow().notNull(),
  firstAcknowledgedAt: timestamp("firstAcknowledgedAt"),
  firstResponderAt: timestamp("firstResponderAt"),
  atSceneAt: timestamp("atSceneAt"),
  stabilizedAt: timestamp("stabilizedAt"),
  closedAt: timestamp("closedAt"),
  closedByUserId: int("closedByUserId"),
  cancellationReason: text("cancellationReason"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionStatusIndex: index("iersActivationEvents_institution_status_idx").on(table.institutionalAccountId, table.status),
  institutionTriggeredIndex: index("iersActivationEvents_institution_triggered_idx").on(table.institutionalAccountId, table.triggeredAt),
}));
export type IersActivationEvent = typeof iersActivationEvents.$inferSelect;
export type InsertIersActivationEvent = typeof iersActivationEvents.$inferInsert;

/** Per-provider notification, acknowledgement, escalation, and response evidence. */
export const iersActivationResponders = mysqlTable("iersActivationResponders", {
  id: int("id").autoincrement().primaryKey(),
  activationEventId: int("activationEventId").notNull(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  membershipId: int("membershipId"),
  userId: int("userId").notNull(),
  assignmentType: mysqlEnum("assignmentType", ["primary", "backup", "observer"]).default("primary").notNull(),
  responsibilityRole: mysqlEnum("responsibilityRole", ["ert_leader", "ert_responder", "unit_team_leader", "er_coordinator", "erc_member", "general_staff"]).default("ert_responder").notNull(),
  notificationStatus: mysqlEnum("notificationStatus", ["pending", "sent", "delivered", "failed", "received", "acknowledged", "declined", "timed_out"]).default("pending").notNull(),
  notifiedAt: timestamp("notifiedAt"),
  receivedAt: timestamp("receivedAt"),
  acknowledgedAt: timestamp("acknowledgedAt"),
  caseJoinedAt: timestamp("caseJoinedAt"),
  caseJoinMethod: mysqlEnum("caseJoinMethod", ["activation_assignment", "qr_scan"]).default("activation_assignment"),
  declinedAt: timestamp("declinedAt"),
  declineReason: varchar("declineReason", { length: 500 }),
  responseAt: timestamp("responseAt"),
  atSceneAt: timestamp("atSceneAt"),
  handoffAt: timestamp("handoffAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  activationUserUnique: uniqueIndex("iersActivationResponders_activation_user_unique").on(table.activationEventId, table.userId),
  institutionUserIndex: index("iersActivationResponders_institution_user_idx").on(table.institutionalAccountId, table.userId),
}));
export type IersActivationResponder = typeof iersActivationResponders.$inferSelect;
export type InsertIersActivationResponder = typeof iersActivationResponders.$inferInsert;

/** One browser/device subscription per endpoint; endpointHash avoids indexing a long URL. */
export const iersPushSubscriptions = mysqlTable("iers_push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  endpointHash: varchar("endpoint_hash", { length: 64 }).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: varchar("p256dh", { length: 512 }).notNull(),
  auth: varchar("auth", { length: 256 }).notNull(),
  userAgent: varchar("user_agent", { length: 512 }),
  isActive: boolean("is_active").default(true).notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  endpointHashUnique: uniqueIndex("iers_push_subscriptions_endpoint_hash_unique").on(table.endpointHash),
  userActiveIndex: index("iers_push_subscriptions_user_active_idx").on(table.userId, table.isActive),
}));
export type IersPushSubscription = typeof iersPushSubscriptions.$inferSelect;
export type InsertIersPushSubscription = typeof iersPushSubscriptions.$inferInsert;

/** Durable outbound push attempt evidence; sent means accepted by the push service, not device receipt. */
export const iersPushDeliveryLog = mysqlTable("iers_push_delivery_log", {
  id: int("id").autoincrement().primaryKey(),
  deliveryKey: varchar("delivery_key", { length: 191 }).notNull(),
  activationEventId: int("activation_event_id").notNull(),
  userId: int("user_id").notNull(),
  subscriptionId: int("subscription_id").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "expired"]).default("pending").notNull(),
  errorMessage: varchar("error_message", { length: 500 }),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  deliveryKeyUnique: uniqueIndex("iers_push_delivery_log_key_unique").on(table.deliveryKey),
  activationIndex: index("iers_push_delivery_log_activation_idx").on(table.activationEventId, table.status),
  subscriptionIndex: index("iers_push_delivery_log_subscription_idx").on(table.subscriptionId, table.createdAt),
}));
export type IersPushDeliveryLog = typeof iersPushDeliveryLog.$inferSelect;
export type InsertIersPushDeliveryLog = typeof iersPushDeliveryLog.$inferInsert;

/** Resource needs and claims attached to one activation; claims remain visible until arrival is confirmed. */
export const iersActivationResources = mysqlTable("iers_activation_resources", {
  id: int("id").autoincrement().primaryKey(),
  activationEventId: int("activation_event_id").notNull(),
  institutionId: int("institution_id").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  sourceType: mysqlEnum("source_type", ["readiness_gap", "manual"]).default("manual").notNull(),
  sourceReadinessItemId: int("source_readiness_item_id"),
  status: mysqlEnum("status", ["needed", "claimed", "in_transit", "arrived", "unavailable", "replaced"]).default("needed").notNull(),
  claimedByUserId: int("claimed_by_user_id"),
  claimedAt: timestamp("claimed_at"),
  arrivedAt: timestamp("arrived_at"),
  arrivalRecordedByUserId: int("arrival_recorded_by_user_id"),
  note: varchar("note", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  activationStatusIndex: index("iers_activation_resources_activation_status_idx").on(table.activationEventId, table.status),
  institutionIndex: index("iers_activation_resources_institution_idx").on(table.institutionId, table.createdAt),
}));
export type IersActivationResource = typeof iersActivationResources.$inferSelect;
export type InsertIersActivationResource = typeof iersActivationResources.$inferInsert;

/** Append-only individual arrival evidence; self, witnessed, and QR-scanned arrivals remain distinguishable. */
export const iersActivationArrivals = mysqlTable("iers_activation_arrivals", {
  id: int("id").autoincrement().primaryKey(),
  activationEventId: int("activation_event_id").notNull(),
  institutionId: int("institution_id").notNull(),
  teamId: int("team_id"),
  roleSnapshotId: int("role_snapshot_id"),
  providerUserId: int("provider_user_id").notNull(),
  roleKey: varchar("role_key", { length: 64 }),
  arrivalType: mysqlEnum("arrival_type", ["self", "witnessed", "qr_scan"]).notNull(),
  recordedByUserId: int("recorded_by_user_id").notNull(),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  note: varchar("note", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  activationArrivalIndex: index("iers_activation_arrivals_activation_time_idx").on(table.activationEventId, table.occurredAt),
  providerArrivalIndex: index("iers_activation_arrivals_provider_idx").on(table.providerUserId, table.occurredAt),
}));
export type IersActivationArrival = typeof iersActivationArrivals.$inferSelect;
export type InsertIersActivationArrival = typeof iersActivationArrivals.$inferInsert;

/** Append-only state transition log for activation evidence and auditability. */
export const iersActivationTimeline = mysqlTable("iersActivationTimeline", {
  id: int("id").autoincrement().primaryKey(),
  activationEventId: int("activationEventId").notNull(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  actorUserId: int("actorUserId"),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  fromStatus: varchar("fromStatus", { length: 64 }),
  toStatus: varchar("toStatus", { length: 64 }),
  note: text("note"),
  metadata: text("metadata"),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  activationTimeIndex: index("iersActivationTimeline_activation_time_idx").on(table.activationEventId, table.occurredAt),
}));
export type IersActivationTimeline = typeof iersActivationTimeline.$inferSelect;
export type InsertIersActivationTimeline = typeof iersActivationTimeline.$inferInsert;

// Fellowship Simulations table
export const fellowshipSimulations = mysqlTable("fellowshipSimulations", {
  id: int("id").autoincrement().primaryKey(),
  courseId: varchar("courseId", { length: 255 }).notNull(), // Microcourse slug
  level: mysqlEnum("level", ["foundational", "advanced"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  scenarioData: json("scenarioData").notNull(), // JSON blob of the simulation scenario
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FellowshipSimulation = typeof fellowshipSimulations.$inferSelect;
export type InsertFellowshipSimulation = typeof fellowshipSimulations.$inferInsert;

// Quotations
export const quotations = mysqlTable("quotations", {
  id: int("id").autoincrement().primaryKey(),
  quotationNumber: varchar("quotationNumber", { length: 255 }).unique().notNull(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  userId: int("userId").notNull(),
  staffCount: int("staffCount").notNull(),
  courseSelections: text("courseSelections"), // JSON array of selected courses
  basePricePerStaff: int("basePricePerStaff").notNull(), // in cents (KES)
  discountPercentage: int("discountPercentage").default(0),
  totalPrice: int("totalPrice").notNull(), // in cents (KES)
  paymentTerms: mysqlEnum("paymentTerms", ["one_time", "monthly", "quarterly", "semi_annual", "annual"]).default("one_time"),
  installmentCount: int("installmentCount").default(1),
  installmentAmount: int("installmentAmount"), // in cents (KES)
  implementationTimeline: varchar("implementationTimeline", { length: 255 }), // e.g., "8 weeks"
  validityPeriod: int("validityPeriod").default(30), // days
  validUntil: timestamp("validUntil"),
  status: mysqlEnum("status", ["draft", "sent", "viewed", "accepted", "rejected", "expired"]).default("draft"),
  sentAt: timestamp("sentAt"),
  acceptedAt: timestamp("acceptedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = typeof quotations.$inferInsert;

// Contracts
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  contractNumber: varchar("contractNumber", { length: 255 }).unique().notNull(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  quotationId: int("quotationId").notNull(),
  userId: int("userId").notNull(),
  contractType: mysqlEnum("contractType", ["service_agreement", "training_agreement", "data_sharing_agreement"]).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  totalValue: int("totalValue").notNull(), // in cents (KES)
  paymentTerms: text("paymentTerms"), // JSON object with payment schedule
  termsAndConditions: text("termsAndConditions"),
  dataPrivacyTerms: text("dataPrivacyTerms"),
  supportTerms: text("supportTerms"),
  cancellationPolicy: text("cancellationPolicy"),
  status: mysqlEnum("status", ["draft", "pending_signature", "signed", "active", "completed", "terminated"]).default("draft"),
  signedAt: timestamp("signedAt"),
  signatureUrl: text("signatureUrl"),
  signedByName: varchar("signedByName", { length: 255 }),
  signedByEmail: varchar("signedByEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

// Training Schedules
export const trainingSchedules = mysqlTable("trainingSchedules", {
  id: int("id").autoincrement().primaryKey(),
  // Nullable as of 2026-08-02 (docs/IERP_NERP_PROGRAM_V2_SPEC.md §2, §4):
  // instructor-declared Phase 2 sessions are self-service and cross-program
  // (IERP/NERP/standard learners share a session) -- they genuinely don't
  // belong to one institution. Coordinator-created sessions (Phase 3,
  // legacy) still set this normally; only self-declared Phase 2 rows are
  // expected to have it null.
  institutionalAccountId: int("institutionalAccountId"),
  courseId: int("courseId").notNull(),
  trainingType: mysqlEnum("trainingType", ["online", "hands_on", "hybrid"]).notNull(),
  scheduledDate: timestamp("scheduledDate").notNull(),
  /** Final calendar day for multi-day sessions; null means the scheduledDate day only. */
  endDate: timestamp("endDate"),
  startTime: varchar("startTime", { length: 10 }), // HH:MM format
  endTime: varchar("endTime", { length: 10 }), // HH:MM format
  location: varchar("location", { length: 255 }),
  instructorId: int("instructorId"),
  instructorName: varchar("instructorName", { length: 255 }),
  maxCapacity: int("maxCapacity").notNull(),
  enrolledCount: int("enrolledCount").default(0),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrainingSchedule = typeof trainingSchedules.$inferSelect;
export type InsertTrainingSchedule = typeof trainingSchedules.$inferInsert;

// Phase 2 role-based booking (docs/IERP_NERP_PROGRAM_V2_SPEC.md §4.2, CEO
// 2026-07-31 respec) adds the six named team-member roles plus "observer"
// below. Deliberately additive, not a replacement: "team_member" and
// "team_leader" stay, because this enum is also used by the Fellowship
// program's simulation tracking (fellowship-progress.service.ts) and by
// the existing Phase 3 hands-on/hybrid booking flow in courses.ts, both of
// which only know the old 2-value model and shouldn't be forced to change
// just because Phase 2 booking now wants more granular roles. New,
// self-service Phase 2 bookings use the named values; everything else
// keeps using "team_member"/"team_leader" exactly as before. Capacity per
// role is enforced in application code, not the schema: team_leader and
// each named team_member_* role max 1 per session, observer up to 7.
export const simulationRoleEnum = mysqlEnum("simulationRole", [
  "team_member",
  "team_leader",
  "team_member_airway_ventilation",
  "team_member_compressor_1",
  "team_member_compressor_2",
  "team_member_monitor_defib_cpr_coach",
  "team_member_iv_io_meds",
  "team_member_scribe",
  "observer",
]);

// Training Attendance
export const trainingAttendance = mysqlTable("trainingAttendance", {
  id: int("id").autoincrement().primaryKey(),
  trainingScheduleId: int("trainingScheduleId").notNull(),
  staffMemberId: int("staffMemberId").notNull(),
  attendanceStatus: mysqlEnum("attendanceStatus", ["registered", "attended", "absent", "cancelled", "waitlisted"]).default("registered"),
  simulationRole: simulationRoleEnum,
  // Repurposed 2026-08-02 (docs/IERP_NERP_PROGRAM_V2_SPEC.md §4.5): now
  // means "the instructor who ran this session confirmed the learner
  // actually filled this role" -- a session role only counts toward Phase 2
  // completion once this is true. Booking a slot alone (attendanceStatus =
  // registered/attended) does not count on its own.
  simulationCompetencyPassed: boolean("simulationCompetencyPassed").default(false),
  skillsAssessmentScore: int("skillsAssessmentScore"), // 0-100
  feedback: text("feedback"),
  certificateIssued: boolean("certificateIssued").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * IERS-specific competency projection. Raw trainingAttendance remains the
 * source record for session administration; this table prevents generic staff
 * enrollment fields from being mistaken for per-program emergency readiness.
 */
export const iersCompetencyRecords = mysqlTable("iersCompetencyRecords", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  staffMemberId: int("staffMemberId").notNull(),
  trainingScheduleId: int("trainingScheduleId").notNull(),
  trainingAttendanceId: int("trainingAttendanceId").notNull().unique(),
  programType: mysqlEnum("programType", ["bls", "acls", "pals", "fellowship"]).notNull(),
  competencyStatus: mysqlEnum("competencyStatus", ["pending", "attended", "absent", "cancelled", "verified"]).default("pending").notNull(),
  verifiedByUserId: int("verifiedByUserId"),
  verifiedAt: timestamp("verifiedAt"),
  verificationNotes: text("verificationNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IersCompetencyRecord = typeof iersCompetencyRecords.$inferSelect;
export type InsertIersCompetencyRecord = typeof iersCompetencyRecords.$inferInsert;

// Retrospective role-fill claims (docs/IERP_NERP_PROGRAM_V2_SPEC.md §4.5,
// CEO 2026-07-31 respec): when the person who booked a role doesn't show
// and someone else present (often an observer) actually performs it
// instead, that person can submit a claim after the fact. The instructor
// who ran the session must approve it before it counts toward the
// claimant's Phase 2 completion the same way a confirmed trainingAttendance
// row does. Deliberately a separate table, not a trainingAttendance row --
// the claimant didn't book this role ahead of time, so there's no existing
// row to update, and keeping "how I actually got this role" (booked vs.
// claimed) visible has real audit value.
export const retrospectiveRoleClaims = mysqlTable("retrospectiveRoleClaims", {
  id: int("id").autoincrement().primaryKey(),
  trainingScheduleId: int("trainingScheduleId").notNull(),
  claimantUserId: int("claimantUserId").notNull(),
  role: simulationRoleEnum.notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});



// Subsidised ACLS/BLS Cohort Program — Phase 3 cross-facility overflow valve
// (CEO decision, 2026-07-19). Phase 2 (online team simulation) is always
// same-facility, no exceptions — that's where the team-training clinical
// value lives. Phase 3 (hands-on Megacode, closer to individual competency
// assessment) defaults to same-facility too, but a platform admin may
// explicitly approve a specific Phase-3-ready learner to book a specific
// out-of-facility session, so a small facility that hasn't reached 8
// Phase-3-ready learners doesn't bottleneck them. One row per
// (staffMemberId, scheduleId) — a visible, logged exception, not a
// standing permission.
export const phase3CrossFacilityApprovals = mysqlTable("phase3CrossFacilityApprovals", {
  id: int("id").autoincrement().primaryKey(),
  staffMemberId: int("staffMemberId").notNull(),
  scheduleId: int("scheduleId").notNull(),
  approvedByUserId: int("approvedByUserId").notNull(),
  notes: varchar("notes", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────
// Instructor per-course competency & mentorship pathway (CEO decision,
// 2026-07-21). "Not all instructors are the same" — an instructor's global
// instructorApprovedAt/instructorCertifiedAt flags are necessary but not
// sufficient; they must also have personally completed a given provider
// course (BLS/ACLS/PALS/etc.) to be qualified to instruct that specific
// course. Separately, a new instructor progresses through three tiers
// (users.instructorTier): provisional -> qualified -> lead_instructor, gated by a
// NAMED mentor's manual confirmation of independently-led groups — not
// auto-computed from attendance data, since "was this genuinely
// independent and well-run" is a real credentialing judgment call.
// ─────────────────────────────────────────────────────────────────────────

// One row per (userId, programType) the instructor is qualified to teach.
// Auto-populated when both instructorCertifiedAt is set AND the user has a
// completed (practicalSkillsSignedOff) enrollment in that programType
// themselves — whichever of the two conditions completes second is what
// triggers the insert.
export const instructorQualifications = mysqlTable("instructorQualifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  programType: mysqlEnum("programType", ["bls", "acls", "pals", "fellowship", "instructor", "fellowship_diploma", "heartsaver", "nrp"]).notNull(),
  qualifiedAt: timestamp("qualifiedAt").defaultNow().notNull(),
});

// One mentor for a mentee's whole provisional period (CEO: "a named
// mentor", not a different one per group). Set by an admin/lead instructor,
// or by the bootstrap override for founder-trained instructors who predate
// this system.
export const instructorMentorships = mysqlTable("instructorMentorships", {
  id: int("id").autoincrement().primaryKey(),
  menteeUserId: int("menteeUserId").notNull().unique(),
  mentorUserId: int("mentorUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// One row per independently-led group the mentor has manually confirmed.
// 3 confirmed rows for a mentorship -> mentee promoted to "qualified".
// 10 distinct mentees promoted to "qualified" under one mentor -> that
// mentor promoted to "lead_instructor" (counted directly off instructorMentorships
// + users.instructorTier, no separate table needed for that count).
export const instructorMentorshipGroups = mysqlTable("instructorMentorshipGroups", {
  id: int("id").autoincrement().primaryKey(),
  mentorshipId: int("mentorshipId").notNull(),
  institutionalAccountId: int("institutionalAccountId"),
  programType: mysqlEnum("programType", ["bls", "acls", "pals", "fellowship", "instructor", "fellowship_diploma", "heartsaver", "nrp"]).notNull(),
  confirmedByUserId: int("confirmedByUserId").notNull(),
  notes: varchar("notes", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrainingAttendance = typeof trainingAttendance.$inferSelect;
export type InsertTrainingAttendance = typeof trainingAttendance.$inferInsert;

// Certification Exams
export const certificationExams = mysqlTable("certificationExams", {
  id: int("id").autoincrement().primaryKey(),
  staffMemberId: int("staffMemberId").notNull(),
  courseId: int("courseId").notNull(),
  examType: mysqlEnum("examType", ["written", "practical", "combined"]).notNull(),
  examDate: timestamp("examDate").notNull(),
  score: int("score"), // 0-100
  passingScore: int("passingScore").default(80),
  status: mysqlEnum("status", ["scheduled", "completed", "passed", "failed", "retake_scheduled"]).default("scheduled"),
  certificateIssued: boolean("certificateIssued").default(false),
  certificateUrl: text("certificateUrl"),
  verificationCode: varchar("verificationCode", { length: 255 }).unique(),
  expiryDate: timestamp("expiryDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CertificationExam = typeof certificationExams.$inferSelect;
export type InsertCertificationExam = typeof certificationExams.$inferInsert;

// Incidents (Real-world emergency events)
export const incidents = mysqlTable("incidents", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  incidentDate: timestamp("incidentDate").notNull(),
  incidentType: mysqlEnum("incidentType", ["cardiac_arrest", "respiratory_failure", "severe_sepsis", "shock", "trauma", "other"]).notNull(),
  patientAge: int("patientAge"), // in months
  responseTime: int("responseTime"), // in seconds
  staffInvolved: text("staffInvolved"), // JSON array of staff IDs
  protocolsUsed: text("protocolsUsed"), // JSON array of protocol names
  outcome: mysqlEnum("outcome", ["pCOSCA", "ROSC", "mortality", "ongoing_resuscitation", "unknown"]).notNull(),
  neurologicalStatus: mysqlEnum("neurologicalStatus", ["intact", "mild_impairment", "moderate_impairment", "severe_impairment", "unknown"]),
  systemGapsIdentified: text("systemGapsIdentified"), // JSON array of gap descriptions
  improvementsImplemented: text("improvementsImplemented"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = typeof incidents.$inferInsert;

/** Facility-level QI action log: gap identified → documented system change (Phase 4 pilot). */
export const institutionalActionLogs = mysqlTable("institutionalActionLogs", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  createdByUserId: int("createdByUserId"),
  gapIdentified: text("gapIdentified").notNull(),
  systemChange: text("systemChange").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "completed"]).default("open").notNull(),
  careSignalEventId: int("careSignalEventId"),
  /** Code Signal counterpart (migration 0092) — same optional link pattern as careSignalEventId. */
  codeSignalEventId: int("codeSignalEventId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstitutionalActionLog = typeof institutionalActionLogs.$inferSelect;
export type InsertInstitutionalActionLog = typeof institutionalActionLogs.$inferInsert;

// Institutional Analytics (Aggregated metrics)
export const institutionalAnalytics = mysqlTable("institutionalAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull().unique(),
  totalStaffEnrolled: int("totalStaffEnrolled").default(0),
  totalStaffCertified: int("totalStaffCertified").default(0),
  averageCompletionTime: int("averageCompletionTime"), // in days
  certificationRate: int("certificationRate"), // percentage
  incidentsHandled: int("incidentsHandled").default(0),
  livesImprovedEstimate: int("livesImprovedEstimate").default(0),
  averageResponseTime: int("averageResponseTime"), // in seconds
  survivalRateImprovement: int("survivalRateImprovement"), // percentage
  systemGapsResolved: int("systemGapsResolved").default(0),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InstitutionalAnalytics = typeof institutionalAnalytics.$inferSelect;
export type InsertInstitutionalAnalytics = typeof institutionalAnalytics.$inferInsert;

// ============ WEEK 1 MVP: PATIENT DATA, INTERVENTIONS, IMPACT ============

// Patients table
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  hospitalId: int("hospitalId"),
  name: varchar("name", { length: 255 }).notNull(),
  age: int("age"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  diagnosis: varchar("diagnosis", { length: 255 }),
  patientId: varchar("patientId", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

// Patient Vitals table
export const patientVitals = mysqlTable("patientVitals", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  heartRate: int("heartRate"),
  respiratoryRate: int("respiratoryRate"),
  systolicBP: int("systolicBP"),
  diastolicBP: int("diastolicBP"),
  oxygenSaturation: int("oxygenSaturation"),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  symptoms: text("symptoms"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PatientVital = typeof patientVitals.$inferSelect;
export type InsertPatientVital = typeof patientVitals.$inferInsert;

// Interventions table
export const interventions = mysqlTable("interventions", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  userId: int("userId").notNull(),
  interventionType: varchar("interventionType", { length: 100 }).notNull(),
  description: text("description"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Intervention = typeof interventions.$inferSelect;
export type InsertIntervention = typeof interventions.$inferInsert;

// Outcomes table
export const outcomes = mysqlTable("outcomes", {
  id: int("id").autoincrement().primaryKey(),
  interventionId: int("interventionId").notNull(),
  patientId: int("patientId").notNull(),
  outcome: mysqlEnum("outcome", ["improved", "stable", "deteriorated", "died"]).notNull(),
  timeToOutcome: int("timeToOutcome"), // hours
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Outcome = typeof outcomes.$inferSelect;
export type InsertOutcome = typeof outcomes.$inferInsert;

// Impact Metrics table
export const impactMetrics = mysqlTable("impactMetrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  period: mysqlEnum("period", ["daily", "weekly", "monthly"]).notNull(),
  interventionsLogged: int("interventionsLogged").default(0),
  outcomesLogged: int("outcomesLogged").default(0),
  livesSaved: int("livesSaved").default(0),
  coursesCompleted: int("coursesCompleted").default(0),
  certificationsEarned: int("certificationsEarned").default(0),
  referralsMade: int("referralsMade").default(0),
  viralCoefficient: decimal("viralCoefficient", { precision: 5, scale: 2 }).default("0"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ImpactMetric = typeof impactMetrics.$inferSelect;
export type InsertImpactMetric = typeof impactMetrics.$inferInsert;

// ============ WEEK 2-3: LEARNING, COURSES, REFERRALS, LEADERBOARDS ============

// Assessments table
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assessmentType: varchar("assessmentType", { length: 50 }).notNull(), // 'safe_truth', 'baseline'
  responses: text("responses"), // JSON
  score: int("score"),
  recommendedCourses: text("recommendedCourses"), // JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

// Note: courses, modules, quizzes tables already exist above
// Adding new tables for ML-driven learning system

// Note: referrals, achievements, leaderboardRankings tables already exist above
// Using existing tables for referral system and leaderboards


// ============ PROVIDER PROFILE SYSTEM ============
// Provider Profile table - Extended profile for healthcare providers
export const providerProfiles = mysqlTable("providerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // One profile per user
  licenseNumber: varchar("licenseNumber", { length: 255 }),
  licenseExpiry: timestamp("licenseExpiry"),
  specialization: varchar("specialization", { length: 255 }), // e.g., "Pediatrics", "Emergency Medicine"
  yearsOfExperience: int("yearsOfExperience"),
  /** Canonical facility — preferred over free-text facilityName */
  facilityId: int("facilityId"),
  facilityName: varchar("facilityName", { length: 255 }),
  facilityType: mysqlEnum("facilityType", ["primary_health_center", "health_post", "district_hospital", "private_clinic", "ngo_clinic", "other"]),
  facilityRegion: varchar("facilityRegion", { length: 255 }), // legacy; prefer county on careFacilities
  /**
   * Locality (sub-county/district/area) — flagged as a known gap while
   * building gap-analysis #11's "global from day 1" geo work (2026-07-16):
   * fresh facility searches carried `adminLevel2` through fine, but this
   * cached profile row (used to prefill the Care Signal form on return
   * visits, before any new search happens) had nowhere to store it. Fixed
   * 2026-07-17 — see syncProviderProfileFacility in
   * facility-registry.service.ts, which sets this on every named
   * submission, so existing providers' profiles self-heal on their next
   * submission with no backfill job needed.
   */
  facilityAdminLevel2: varchar("facilityAdminLevel2", { length: 128 }),
  facilityCountry: varchar("facilityCountry", { length: 255 }).default("Kenya"),
  facilityPhone: varchar("facilityPhone", { length: 20 }),
  facilityEmail: varchar("facilityEmail", { length: 320 }),
  averagePatientLoad: int("averagePatientLoad"), // Patients per day
  department: varchar("department", { length: 255 }),
  profileCompleted: boolean("profileCompleted").default(false),
  profileCompletionPercentage: int("profileCompletionPercentage").default(0),
  bio: text("bio"),
  certifications: text("certifications"), // JSON array of certifications
  languages: text("languages"), // JSON array of languages
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProviderProfile = typeof providerProfiles.$inferSelect;
export type InsertProviderProfile = typeof providerProfiles.$inferInsert;

// Provider Performance Metrics table
export const providerPerformanceMetrics = mysqlTable("providerPerformanceMetrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  period: mysqlEnum("period", ["daily", "weekly", "monthly", "yearly"]).notNull(),
  decisionsLogged: int("decisionsLogged").default(0),
  diagnosticAccuracy: decimal("diagnosticAccuracy", { precision: 5, scale: 2 }).default("0"), // 0-100%
  avgDecisionTime: int("avgDecisionTime"), // seconds
  protocolAdherence: decimal("protocolAdherence", { precision: 5, scale: 2 }).default("0"), // 0-100%
  patientSurvivalRate: decimal("patientSurvivalRate", { precision: 5, scale: 2 }).default("0"), // 0-100%
  livesSavedCount: int("livesSavedCount").default(0),
  patientsMonitoredCount: int("patientsMonitoredCount").default(0),
  coursesCompleted: int("coursesCompleted").default(0),
  certificationsEarned: int("certificationsEarned").default(0),
  referralsMade: int("referralsMade").default(0),
  earnings: int("earnings").default(0), // in cents (KES)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProviderPerformanceMetric = typeof providerPerformanceMetrics.$inferSelect;
export type InsertProviderPerformanceMetric = typeof providerPerformanceMetrics.$inferInsert;


// ============ PHASE A: VITAL SIGNS & INTERVENTION TRACKING ============

// Vital Signs History table - Track all vital sign measurements with timestamps
export const vitalSignsHistory = mysqlTable("vitalSignsHistory", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  userId: int("userId").notNull(), // Provider who recorded
  heartRate: int("heartRate"), // beats per minute
  respiratoryRate: int("respiratoryRate"), // breaths per minute
  systolicBP: int("systolicBP"), // mmHg
  diastolicBP: int("diastolicBP"), // mmHg
  oxygenSaturation: int("oxygenSaturation"), // percentage (0-100)
  temperature: decimal("temperature", { precision: 5, scale: 2 }), // Celsius
  weight: decimal("weight", { precision: 6, scale: 2 }), // kg
  height: decimal("height", { precision: 6, scale: 2 }), // cm
  age: int("age"), // years
  ageMonths: int("ageMonths"), // additional months for infants
  riskScore: int("riskScore"), // 0-100 calculated risk score
  riskLevel: mysqlEnum("riskLevel", ["CRITICAL", "HIGH", "MEDIUM", "LOW"]).notNull(),
  symptoms: text("symptoms"), // JSON array of symptoms
  notes: text("notes"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VitalSignsHistory = typeof vitalSignsHistory.$inferSelect;
export type InsertVitalSignsHistory = typeof vitalSignsHistory.$inferInsert;

// Reference Ranges table - Age-weight-based normal ranges for vital signs
export const referenceRanges = mysqlTable("referenceRanges", {
  id: int("id").autoincrement().primaryKey(),
  ageMin: int("ageMin"), // years
  ageMax: int("ageMax"), // years
  weightMin: decimal("weightMin", { precision: 6, scale: 2 }), // kg
  weightMax: decimal("weightMax", { precision: 6, scale: 2 }), // kg
  heartRateMin: int("heartRateMin"),
  heartRateMax: int("heartRateMax"),
  respiratoryRateMin: int("respiratoryRateMin"),
  respiratoryRateMax: int("respiratoryRateMax"),
  systolicBPMin: int("systolicBPMin"),
  systolicBPMax: int("systolicBPMax"),
  diastolicBPMin: int("diastolicBPMin"),
  diastolicBPMax: int("diastolicBPMax"),
  oxygenSaturationMin: int("oxygenSaturationMin"),
  temperatureMin: decimal("temperatureMin", { precision: 5, scale: 2 }),
  temperatureMax: decimal("temperatureMax", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReferenceRange = typeof referenceRanges.$inferSelect;
export type InsertReferenceRange = typeof referenceRanges.$inferInsert;

// Intervention Log table - Track all interventions (medications, procedures, monitoring)
export const interventionLog = mysqlTable("interventionLog", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  userId: int("userId").notNull(), // Provider who performed intervention
  interventionType: mysqlEnum("interventionType", ["medication", "procedure", "monitoring", "referral", "other"]).notNull(),
  interventionName: varchar("interventionName", { length: 255 }).notNull(), // e.g., "Epinephrine", "IV insertion"
  dosage: varchar("dosage", { length: 100 }), // e.g., "0.01 mg/kg"
  route: varchar("route", { length: 100 }), // e.g., "IV", "IM", "PO"
  indication: text("indication"), // Why this intervention was given
  outcome: varchar("outcome", { length: 255 }), // e.g., "successful", "failed", "pending"
  notes: text("notes"),
  performedAt: timestamp("performedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InterventionLog = typeof interventionLog.$inferSelect;
export type InsertInterventionLog = typeof interventionLog.$inferInsert;

// Risk Score History table - Track risk score changes over time
export const riskScoreHistory = mysqlTable("riskScoreHistory", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  vitalSignsHistoryId: int("vitalSignsHistoryId").notNull(),
  riskScore: int("riskScore"), // 0-100
  riskLevel: mysqlEnum("riskLevel", ["CRITICAL", "HIGH", "MEDIUM", "LOW"]).notNull(),
  riskFactors: text("riskFactors"), // JSON array of factors contributing to risk
  deteriorationPattern: varchar("deteriorationPattern", { length: 100 }), // e.g., "stable", "improving", "deteriorating"
  timeToDeterioration: int("timeToDeterioration"), // hours until predicted deterioration
  recommendations: text("recommendations"), // JSON array of recommended actions
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RiskScoreHistory = typeof riskScoreHistory.$inferSelect;
export type InsertRiskScoreHistory = typeof riskScoreHistory.$inferInsert;


// CPR Clock Sessions table - Track CPR sessions for each patient
export const cprSessions = mysqlTable("cprSessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionCode: varchar("sessionCode", { length: 8 }).unique(), // Short code for QR/manual entry
  patientId: int("patientId"),
  providerId: int("providerId"),
  patientWeight: decimal("patientWeight", { precision: 5, scale: 2 }),
  patientAgeMonths: int("patientAgeMonths"),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
  outcome: mysqlEnum("outcome", ["ROSC", "pCOSCA", "mortality", "ongoing"]).default("ongoing"),
  totalDuration: int("totalDuration"), // seconds
  cprQuality: mysqlEnum("cprQuality", ["excellent", "good", "adequate", "poor"]),
  notes: text("notes"),
  createdBy: int("createdBy"), // userId of session creator
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CprSession = typeof cprSessions.$inferSelect;
export type InsertCprSession = typeof cprSessions.$inferInsert;

// CPR Clock Events table - Track individual events during CPR (compressions, medications, etc.)
export const cprEvents = mysqlTable("cprEvents", {
  id: int("id").autoincrement().primaryKey(),
  cprSessionId: int("cprSessionId").notNull(),
  memberId: int("memberId"), // who logged the event (from cprTeamMembers)
  eventType: mysqlEnum("eventType", ["compression_cycle", "medication", "defibrillation", "airway", "note", "outcome"]).notNull(),
  eventTime: int("eventTime"), // seconds from start of CPR
  description: text("description"),
  value: varchar("value", { length: 255 }), // e.g., compression rate, medication name
  metadata: text("metadata"), // JSON object for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CprEvent = typeof cprEvents.$inferSelect;
export type InsertCprEvent = typeof cprEvents.$inferInsert;

/**
 * Canonical bridge between one authorized IERS activation and one CPR-GPS
 * session. It stores only operational linkage and provenance; no patient
 * identifier is permitted here. The activation and CPR records remain the
 * source of truth for their own timelines.
 */
export const cprEventLinks = mysqlTable("cprEventLinks", {
  id: int("id").autoincrement().primaryKey(),
  activationEventId: int("activationEventId").notNull(),
  cprSessionId: int("cprSessionId").notNull(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  linkedByUserId: int("linkedByUserId").notNull(),
  /** Opaque ResusGPS case/session key; never a patient identifier. */
  resusGpsSessionKey: varchar("resusGpsSessionKey", { length: 64 }),
  pathwayKey: varchar("pathwayKey", { length: 32 }),
  contentVersion: varchar("contentVersion", { length: 32 }),
  linkStatus: mysqlEnum("linkStatus", ["active", "outcome_recorded", "debrief_pending", "closed"]).default("active").notNull(),
  terminalOutcome: varchar("terminalOutcome", { length: 32 }),
  outcomeRecordedAt: timestamp("outcomeRecordedAt"),
  debriefSubmittedAt: timestamp("debriefSubmittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  activationUnique: uniqueIndex("cprEventLinks_activation_unique").on(table.activationEventId),
  cprSessionUnique: uniqueIndex("cprEventLinks_cpr_session_unique").on(table.cprSessionId),
  institutionStatusIndex: index("cprEventLinks_institution_status_idx").on(table.institutionalAccountId, table.linkStatus),
}));

export type CprEventLink = typeof cprEventLinks.$inferSelect;
export type InsertCprEventLink = typeof cprEventLinks.$inferInsert;

/**
 * Provenance bridge for an optional post-arrest Care Signal report.
 * One CPR event may receive multiple provider observations, but one Care
 * Signal row is linked at most once. No patient identifiers are stored here.
 */
export const cprCareSignalLinks = mysqlTable("cprCareSignalLinks", {
  id: int("id").autoincrement().primaryKey(),
  cprSessionId: int("cprSessionId").notNull(),
  careSignalEventId: int("careSignalEventId").notNull().unique(),
  activationEventId: int("activationEventId"),
  institutionalAccountId: int("institutionalAccountId"),
  linkedByUserId: int("linkedByUserId").notNull(),
  relationship: mysqlEnum("relationship", ["post_event_prompt", "manual"]).notNull().default("post_event_prompt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  cprSessionIndex: index("cprCareSignalLinks_cpr_session_idx").on(table.cprSessionId),
  activationIndex: index("cprCareSignalLinks_activation_idx").on(table.activationEventId),
}));

export type CprCareSignalLink = typeof cprCareSignalLinks.$inferSelect;
export type InsertCprCareSignalLink = typeof cprCareSignalLinks.$inferInsert;

// Medications table - Pediatric emergency medications with weight-based dosing
export const emergencyMedications = mysqlTable("emergencyMedications", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Epinephrine"
  category: mysqlEnum("category", ["vasopressor", "antiarrhythmic", "sedative", "paralytic", "reversal", "other"]).notNull(),
  dosagePerKg: decimal("dosagePerKg", { precision: 10, scale: 3 }), // mg/kg
  maxDose: decimal("maxDose", { precision: 10, scale: 3 }), // maximum dose in mg
  route: mysqlEnum("route", ["IV", "IO", "IM", "ET", "IN"]).notNull(),
  concentration: varchar("concentration", { length: 100 }), // e.g., "1:10000"
  interval: int("interval"), // seconds between doses (e.g., 300 for q5min)
  indication: text("indication"), // when to use this medication
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmergencyMedication = typeof emergencyMedications.$inferSelect;
export type InsertEmergencyMedication = typeof emergencyMedications.$inferInsert;

// Medication Administration Log table - Track medications given during CPR
export const medicationLog = mysqlTable("medicationLog", {
  id: int("id").autoincrement().primaryKey(),
  cprSessionId: int("cprSessionId").notNull(),
  medicationId: int("medicationId").notNull(),
  administeredAt: int("administeredAt"), // seconds from start of CPR
  dose: decimal("dose", { precision: 10, scale: 3 }), // actual dose given in mg
  dosePerKg: decimal("dosePerKg", { precision: 10, scale: 3 }), // calculated dose per kg
  route: mysqlEnum("route", ["IV", "IO", "IM", "ET", "IN"]).notNull(),
  administeredBy: int("administeredBy"), // provider ID
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MedicationLog = typeof medicationLog.$inferSelect;
export type InsertMedicationLog = typeof medicationLog.$inferInsert;

// Defibrillator Events table - Track defibrillation attempts
export const defibrillatorEvents = mysqlTable("defibrillatorEvents", {
  id: int("id").autoincrement().primaryKey(),
  cprSessionId: int("cprSessionId").notNull(),
  eventTime: int("eventTime"), // seconds from start of CPR
  rhythm: mysqlEnum("rhythm", ["VF", "pulseless_VT", "asystole", "PEA", "sinus", "unknown"]).notNull(),
  shockDelivered: boolean("shockDelivered").default(false),
  energyLevel: int("energyLevel"), // joules (e.g., 2, 4, 8 J/kg)
  energyPerKg: decimal("energyPerKg", { precision: 10, scale: 3 }), // J/kg
  outcome: mysqlEnum("outcome", ["ROSC", "no_change", "deterioration"]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DefibrillatorEvent = typeof defibrillatorEvents.$inferSelect;
export type InsertDefibrillatorEvent = typeof defibrillatorEvents.$inferInsert;

// CPR Protocols table - Store standard CPR protocols by age group
export const cprProtocols = mysqlTable("cprProtocols", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Infant CPR", "Pediatric CPR"
  ageMin: int("ageMin"), // months
  ageMax: int("ageMax"), // months
  weightMin: decimal("weightMin", { precision: 10, scale: 3 }), // kg
  weightMax: decimal("weightMax", { precision: 10, scale: 3 }), // kg
  compressionRate: varchar("compressionRate", { length: 100 }), // e.g., "100-120 bpm"
  compressionDepth: varchar("compressionDepth", { length: 100 }), // e.g., "4-5 cm"
  ventilationRate: varchar("ventilationRate", { length: 100 }), // e.g., "12-20 breaths/min"
  handPosition: text("handPosition"), // description of hand position
  paddleSize: varchar("paddleSize", { length: 100 }), // e.g., "Pediatric pads"
  initialEnergy: int("initialEnergy"), // joules
  subsequentEnergy: int("subsequentEnergy"), // joules
  medications: text("medications"), // JSON array of recommended medications
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CprProtocol = typeof cprProtocols.$inferSelect;
export type InsertCprProtocol = typeof cprProtocols.$inferInsert;


// Emergency Protocols table - Store clinical protocols for common pediatric emergencies
export const emergencyProtocols = mysqlTable("emergencyProtocols", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Severe Diarrhea", "Pneumonia", "Malaria", "Meningitis", "Shock"
  category: mysqlEnum("category", ["diarrhea", "pneumonia", "malaria", "meningitis", "shock"]).notNull(),
  description: text("description"),
  ageMin: int("ageMin"), // months
  ageMax: int("ageMax"), // months
  severity: mysqlEnum("severity", ["mild", "moderate", "severe", "critical"]),
  estimatedMortality: decimal("estimatedMortality", { precision: 5, scale: 2 }), // percentage
  keySymptoms: text("keySymptoms"), // JSON array of symptoms
  redFlags: text("redFlags"), // JSON array of danger signs
  diagnosticCriteria: text("diagnosticCriteria"), // JSON object with criteria
  initialAssessment: text("initialAssessment"), // Initial steps to take
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmergencyProtocol = typeof emergencyProtocols.$inferSelect;
export type InsertEmergencyProtocol = typeof emergencyProtocols.$inferInsert;

// Protocol Steps table - Store individual steps within each protocol
export const protocolSteps = mysqlTable("protocolSteps", {
  id: int("id").autoincrement().primaryKey(),
  protocolId: int("protocolId").notNull(),
  stepNumber: int("stepNumber").notNull(), // 1, 2, 3, etc.
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  action: text("action"), // What the provider should do
  expectedOutcome: text("expectedOutcome"), // What should happen after this step
  timeframe: varchar("timeframe", { length: 100 }), // e.g., "Immediately", "Within 5 minutes"
  vitalSignThreshold: text("vitalSignThreshold"), // JSON object with vital sign criteria
  nextStepIfYes: int("nextStepIfYes"), // Protocol step ID if condition met
  nextStepIfNo: int("nextStepIfNo"), // Protocol step ID if condition not met
  medications: text("medications"), // JSON array of medications for this step
  investigations: text("investigations"), // JSON array of tests/investigations
  warnings: text("warnings"), // JSON array of warnings/contraindications
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProtocolStep = typeof protocolSteps.$inferSelect;
export type InsertProtocolStep = typeof protocolSteps.$inferInsert;

// Protocol Adherence Log table - Track provider adherence to protocols
export const protocolAdherenceLog = mysqlTable("protocolAdherenceLog", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  providerId: int("providerId").notNull(),
  protocolId: int("protocolId").notNull(),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
  status: mysqlEnum("status", ["started", "in_progress", "completed", "abandoned"]).default("started"),
  stepsCompleted: int("stepsCompleted").default(0),
  totalSteps: int("totalSteps"),
  adherenceScore: decimal("adherenceScore", { precision: 5, scale: 2 }), // 0-100%
  deviations: text("deviations"), // JSON array of protocol deviations
  outcome: mysqlEnum("outcome", ["improved", "stable", "deteriorated", "transferred", "unknown"]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProtocolAdherenceLog = typeof protocolAdherenceLog.$inferSelect;
export type InsertProtocolAdherenceLog = typeof protocolAdherenceLog.$inferInsert;

// Protocol Decision Points table - Store decision trees within protocols
export const protocolDecisionPoints = mysqlTable("protocolDecisionPoints", {
  id: int("id").autoincrement().primaryKey(),
  protocolId: int("protocolId").notNull(),
  stepId: int("stepId").notNull(),
  question: text("question").notNull(), // e.g., "Is child having seizures?"
  yesAction: text("yesAction"), // What to do if yes
  noAction: text("noAction"), // What to do if no
  yesNextStep: int("yesNextStep"), // Next step ID if yes
  noNextStep: int("noNextStep"), // Next step ID if no
  vitalSignCriteria: text("vitalSignCriteria"), // JSON object with vital sign thresholds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProtocolDecisionPoint = typeof protocolDecisionPoints.$inferSelect;
export type InsertProtocolDecisionPoint = typeof protocolDecisionPoints.$inferInsert;

// Protocol Recommendations table - AI-generated protocol recommendations based on patient data
export const protocolRecommendations = mysqlTable("protocolRecommendations", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  providerId: int("providerId").notNull(),
  protocolId: int("protocolId").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100%
  matchingSymptoms: text("matchingSymptoms"), // JSON array of matching symptoms
  matchingVitalSigns: text("matchingVitalSigns"), // JSON array of matching vital signs
  reasoning: text("reasoning"), // Why this protocol is recommended
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProtocolRecommendation = typeof protocolRecommendations.$inferSelect;
export type InsertProtocolRecommendation = typeof protocolRecommendations.$inferInsert;


// ============================================================================
// REAL-TIME ALERTS & NOTIFICATIONS
// ============================================================================

export const alertConfigurations = mysqlTable("alertConfigurations", {
  id: int("id").primaryKey().autoincrement(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  alertType: mysqlEnum("alertType", [
    "critical_risk_score",
    "vital_sign_change",
    "patient_deterioration",
    "intervention_reminder",
    "protocol_recommendation",
    "peer_comparison",
    "learning_milestone",
  ]).notNull(),
  riskScoreThreshold: int("riskScoreThreshold").default(70), // Alert when risk score > threshold
  vitalSignThresholds: text("vitalSignThresholds"), // JSON: {heartRate: {min, max}, temp: {min, max}, ...}
  enabled: boolean("enabled").default(true),
  soundEnabled: boolean("soundEnabled").default(true),
  vibrationEnabled: boolean("vibrationEnabled").default(true),
  pushNotificationEnabled: boolean("pushNotificationEnabled").default(true),
  emailNotificationEnabled: boolean("emailNotificationEnabled").default(false),
  quietHoursStart: varchar("quietHoursStart", { length: 5 }), // HH:MM format
  quietHoursEnd: varchar("quietHoursEnd", { length: 5 }), // HH:MM format
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type AlertConfiguration = typeof alertConfigurations.$inferSelect;
export type InsertAlertConfiguration = typeof alertConfigurations.$inferInsert;

export const alerts = mysqlTable("alerts", {
  id: int("id").primaryKey().autoincrement(),
  patientId: int("patientId").notNull(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  alertType: mysqlEnum("alertType", [
    "critical_risk_score",
    "vital_sign_change",
    "patient_deterioration",
    "intervention_reminder",
    "protocol_recommendation",
    "peer_comparison",
    "learning_milestone",
  ]).notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON: additional context (vital signs, risk score, etc.)
  isRead: boolean("isRead").default(false),
  isAcknowledged: boolean("isAcknowledged").default(false),
  acknowledgedAt: timestamp("acknowledgedAt"),
  actionTaken: varchar("actionTaken", { length: 255 }), // What action provider took
  actionTakenAt: timestamp("actionTakenAt"),
  status: mysqlEnum("status", ["pending", "delivered", "read", "acknowledged", "dismissed"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Alert expires after this time
});
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

export const alertDeliveryLog = mysqlTable("alertDeliveryLog", {
  id: int("id").primaryKey().autoincrement(),
  alertId: int("alertId").notNull(),
  deliveryMethod: mysqlEnum("deliveryMethod", [
    "push_notification",
    "email",
    "sms",
    "in_app",
    "websocket",
  ]).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "delivered", "failed"]).default("pending"),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AlertDeliveryLog = typeof alertDeliveryLog.$inferSelect;
export type InsertAlertDeliveryLog = typeof alertDeliveryLog.$inferInsert;

export const alertSubscriptions = mysqlTable("alertSubscriptions", {
  id: int("id").primaryKey().autoincrement(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  patientId: int("patientId").notNull(),
  subscriptionType: mysqlEnum("subscriptionType", [
    "all_alerts",
    "critical_only",
    "vital_signs_only",
    "protocol_only",
  ]).default("all_alerts"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type AlertSubscription = typeof alertSubscriptions.$inferSelect;
export type InsertAlertSubscription = typeof alertSubscriptions.$inferInsert;

export const alertHistory = mysqlTable("alertHistory", {
  id: int("id").primaryKey().autoincrement(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  alertsReceivedToday: int("alertsReceivedToday").default(0),
  alertsAcknowledgedToday: int("alertsAcknowledgedToday").default(0),
  criticalAlertsToday: int("criticalAlertsToday").default(0),
  averageResponseTime: int("averageResponseTime"), // milliseconds
  lastAlertTime: timestamp("lastAlertTime"),
  dateField: date("date").notNull(),
});
export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;

export const alertStatistics = mysqlTable("alertStatistics", {
  id: int("id").primaryKey().autoincrement(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  alertType: varchar("alertType", { length: 100 }).notNull(),
  totalAlerts: int("totalAlerts").default(0),
  acknowledgedAlerts: int("acknowledgedAlerts").default(0),
  dismissedAlerts: int("dismissedAlerts").default(0),
  actionTakenAlerts: int("actionTakenAlerts").default(0),
  averageTimeToAcknowledge: int("averageTimeToAcknowledge"), // milliseconds
  period: mysqlEnum("period", ["daily", "weekly", "monthly"]).notNull(),
  dateField: date("date").notNull(),
});
export type AlertStatistics = typeof alertStatistics.$inferSelect;
export type InsertAlertStatistics = typeof alertStatistics.$inferInsert;


// ============================================================================
// DIFFERENTIAL DIAGNOSIS ENGINE
// ============================================================================

export const medicalConditions = mysqlTable("medicalConditions", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icdCode: varchar("icdCode", { length: 20 }), // ICD-10 code
  category: mysqlEnum("category", [
    "infectious",
    "nutritional",
    "metabolic",
    "cardiovascular",
    "respiratory",
    "gastrointestinal",
    "neurological",
    "endocrine",
    "hematologic",
    "other",
  ]).notNull(),
  severity: mysqlEnum("severity", ["mild", "moderate", "severe", "critical"]).default("moderate"),
  prevalence: varchar("prevalence", { length: 50 }), // e.g., "common", "rare"
  ageGroupsAffected: text("ageGroupsAffected"), // JSON array: ["0-1", "1-3", "3-6", "6-12", "12-18"]
  commonSymptoms: text("commonSymptoms"), // JSON array of symptom IDs
  criticalVitalSigns: text("criticalVitalSigns"), // JSON: {heartRate: {min, max}, temp: {min, max}, ...}
  treatmentApproach: text("treatmentApproach"),
  emergencyActions: text("emergencyActions"), // JSON array of emergency steps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type MedicalCondition = typeof medicalConditions.$inferSelect;
export type InsertMedicalCondition = typeof medicalConditions.$inferInsert;

export const symptoms = mysqlTable("symptoms", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "fever",
    "cough",
    "diarrhea",
    "vomiting",
    "rash",
    "lethargy",
    "seizure",
    "difficulty_breathing",
    "abdominal_pain",
    "other",
  ]).notNull(),
  severity: mysqlEnum("severity", ["mild", "moderate", "severe"]).default("mild"),
  duration: varchar("duration", { length: 100 }), // e.g., "acute", "chronic"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Symptom = typeof symptoms.$inferSelect;
export type InsertSymptom = typeof symptoms.$inferInsert;

export const conditionSymptomMapping = mysqlTable("conditionSymptomMapping", {
  id: int("id").primaryKey().autoincrement(),
  conditionId: int("conditionId").notNull(),
  symptomId: int("symptomId").notNull(),
  frequency: mysqlEnum("frequency", ["always", "often", "sometimes", "rare"]).default("often"),
  importance: int("importance").default(50), // 0-100 weight for diagnosis scoring
});
export type ConditionSymptomMapping = typeof conditionSymptomMapping.$inferSelect;
export type InsertConditionSymptomMapping = typeof conditionSymptomMapping.$inferInsert;

export const diagnosisHistory = mysqlTable("diagnosisHistory", {
  id: int("id").primaryKey().autoincrement(),
  patientId: int("patientId").notNull(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  symptoms: text("symptoms"), // JSON array of symptom IDs
  vitalSigns: text("vitalSigns"), // JSON of vital signs at time of diagnosis
  suggestedConditions: text("suggestedConditions"), // JSON array of suggested conditions with scores
  selectedCondition: int("selectedCondition"), // Condition ID provider selected
  selectedConditionName: varchar("selectedConditionName", { length: 255 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100
  aiExplanation: text("aiExplanation"), // LLM explanation of diagnosis
  providerNotes: text("providerNotes"),
  outcome: mysqlEnum("outcome", ["confirmed", "ruled_out", "pending", "unknown"]).default("pending"),
  outcomeCondition: int("outcomeCondition"), // Actual condition if confirmed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type DiagnosisHistory = typeof diagnosisHistory.$inferSelect;
export type InsertDiagnosisHistory = typeof diagnosisHistory.$inferInsert;

export const diagnosisAccuracy = mysqlTable("diagnosisAccuracy", {
  id: int("id").primaryKey().autoincrement(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  conditionId: int("conditionId").notNull(),
  totalDiagnoses: int("totalDiagnoses").default(0),
  correctDiagnoses: int("correctDiagnoses").default(0),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }).default("0"), // 0-100%
  averageConfidence: decimal("averageConfidence", { precision: 5, scale: 2 }).default("0"),
  period: mysqlEnum("period", ["all_time", "monthly", "quarterly"]).default("all_time"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
export type DiagnosisAccuracy = typeof diagnosisAccuracy.$inferSelect;
export type InsertDiagnosisAccuracy = typeof diagnosisAccuracy.$inferInsert;

export const differentialDiagnosisScores = mysqlTable("differentialDiagnosisScores", {
  id: int("id").primaryKey().autoincrement(),
  diagnosisHistoryId: int("diagnosisHistoryId").notNull(),
  conditionId: int("conditionId").notNull(),
  conditionName: varchar("conditionName", { length: 255 }),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(), // 0-100
  matchedSymptoms: int("matchedSymptoms").default(0),
  totalSymptoms: int("totalSymptoms").default(0),
  vitalSignMatch: decimal("vitalSignMatch", { precision: 5, scale: 2 }).default("0"), // 0-100
  reasoning: text("reasoning"),
  rank: int("rank"), // 1 = most likely, 2 = second, etc.
});
export type DifferentialDiagnosisScore = typeof differentialDiagnosisScores.$inferSelect;
export type InsertDifferentialDiagnosisScore = typeof differentialDiagnosisScores.$inferInsert;




// Investigation Analysis tables
export const investigations = mysqlTable("investigations", {
  id: int("id").primaryKey().autoincrement(),
  patientId: int("patientId").notNull(),
  providerId: int("providerId").notNull(),
  investigationType: mysqlEnum("investigationType", ["lab", "imaging", "other"]).notNull(),
  testName: varchar("testName", { length: 255 }).notNull(),
  description: text("description"),
  uploadedAt: timestamp("uploadedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Investigation = typeof investigations.$inferSelect;
export type InsertInvestigation = typeof investigations.$inferInsert;

export const investigationResults = mysqlTable("investigationResults", {
  id: int("id").primaryKey().autoincrement(),
  investigationId: int("investigationId").notNull(),
  resultType: mysqlEnum("resultType", ["numeric", "text", "image", "other"]).notNull(),
  resultName: varchar("resultName", { length: 255 }).notNull(),
  resultValue: text("resultValue"),
  unit: varchar("unit", { length: 100 }),
  normalRange: varchar("normalRange", { length: 255 }),
  isAbnormal: boolean("isAbnormal").default(false),
  severity: mysqlEnum("severity", ["normal", "mild", "moderate", "severe"]).default("normal"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InvestigationResult = typeof investigationResults.$inferSelect;
export type InsertInvestigationResult = typeof investigationResults.$inferInsert;

export const investigationAnalysis = mysqlTable("investigationAnalysis", {
  id: int("id").primaryKey().autoincrement(),
  investigationId: int("investigationId").notNull(),
  aiInterpretation: text("aiInterpretation"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("0"), // 0-100
  differentialDiagnoses: text("differentialDiagnoses"), // JSON array
  recommendations: text("recommendations"), // JSON array
  clinicalSignificance: text("clinicalSignificance"),
  followUpSuggestions: text("followUpSuggestions"),
  analyzedAt: timestamp("analyzedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InvestigationAnalysis = typeof investigationAnalysis.$inferSelect;
export type InsertInvestigationAnalysis = typeof investigationAnalysis.$inferInsert;

export const investigationHistory = mysqlTable("investigationHistory", {
  id: int("id").primaryKey().autoincrement(),
  patientId: int("patientId").notNull(),
  providerId: int("providerId").notNull(),
  testName: varchar("testName", { length: 255 }).notNull(),
  result: text("result"),
  interpretation: text("interpretation"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InvestigationHistory = typeof investigationHistory.$inferSelect;
export type InsertInvestigationHistory = typeof investigationHistory.$inferInsert;

export const investigationTrends = mysqlTable("investigationTrends", {
  id: int("id").primaryKey().autoincrement(),
  patientId: int("patientId").notNull(),
  testName: varchar("testName", { length: 255 }).notNull(),
  trend: mysqlEnum("trend", ["improving", "stable", "deteriorating"]).notNull(),
  changePercent: decimal("changePercent", { precision: 8, scale: 2 }),
  daysAnalyzed: int("daysAnalyzed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InvestigationTrend = typeof investigationTrends.$inferSelect;
export type InsertInvestigationTrend = typeof investigationTrends.$inferInsert;


// ============================================
// PERFORMANCE DASHBOARD TABLES
// ============================================

// Provider Statistics Table
export const providerStats = mysqlTable("providerStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalPatientsServed: int("totalPatientsServed").default(0),
  totalInterventions: int("totalInterventions").default(0),
  averageResponseTime: decimal("averageResponseTime", { precision: 10, scale: 2 }).default("0"), // in minutes
  successRate: decimal("successRate", { precision: 5, scale: 2 }).default("0"), // percentage 0-100
  patientsImproved: int("patientsImproved").default(0),
  certificationsCompleted: int("certificationsCompleted").default(0),
  trainingHoursCompleted: int("trainingHoursCompleted").default(0),
  performanceScore: decimal("performanceScore", { precision: 5, scale: 2 }).default("0"), // 0-100
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProviderStat = typeof providerStats.$inferSelect;
export type InsertProviderStat = typeof providerStats.$inferInsert;

// Leaderboard Rankings Table
export const leaderboardRankings = mysqlTable("leaderboardRankings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 255 }).notNull(), // 'performance', 'interventions', 'patients_served', 'training'
  rank: int("rank").notNull(),
  score: decimal("score", { precision: 10, scale: 2 }).notNull(),
  percentile: decimal("percentile", { precision: 5, scale: 2 }).default("0"), // 0-100
  previousRank: int("previousRank"),
  rankChange: int("rankChange").default(0), // positive = improvement
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LeaderboardRanking = typeof leaderboardRankings.$inferSelect;
export type InsertLeaderboardRanking = typeof leaderboardRankings.$inferInsert;

// Performance Achievements Table
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementType: varchar("achievementType", { length: 255 }).notNull(), // 'milestone', 'badge', 'certification', 'record'
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 255 }), // emoji or icon reference
  earnedAt: timestamp("earnedAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

// Performance History Table (for trend analysis)
export const performanceHistory = mysqlTable("performanceHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  metricType: varchar("metricType", { length: 255 }).notNull(), // 'success_rate', 'response_time', 'patients_served', etc.
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  recordedAt: timestamp("recordedAt").defaultNow(),
});
export type PerformanceHistoryRecord = typeof performanceHistory.$inferSelect;
export type InsertPerformanceHistoryRecord = typeof performanceHistory.$inferInsert;

// Team Performance Table (for institutional comparisons)
export const teamPerformance = mysqlTable("teamPerformance", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull().unique(),
  teamName: varchar("teamName", { length: 255 }),
  totalStaffCount: int("totalStaffCount").default(0),
  averagePerformanceScore: decimal("averagePerformanceScore", { precision: 5, scale: 2 }).default("0"),
  totalPatientsServed: int("totalPatientsServed").default(0),
  totalInterventions: int("totalInterventions").default(0),
  teamRank: int("teamRank"),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TeamPerformance = typeof teamPerformance.$inferSelect;
export type InsertTeamPerformance = typeof teamPerformance.$inferInsert;

// Real-time Performance Events Table
export const performanceEvents = mysqlTable("performanceEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventType: varchar("eventType", { length: 255 }).notNull(), // 'intervention_completed', 'patient_improved', 'training_completed', etc.
  eventData: text("eventData"), // JSON stringified
  severity: varchar("severity", { length: 50 }), // 'info', 'warning', 'critical'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PerformanceEvent = typeof performanceEvents.$inferSelect;
export type InsertPerformanceEvent = typeof performanceEvents.$inferInsert;


// ============================================================================
// PARENT SAFE-TRUTH REPORTING SYSTEM
// ============================================================================

// Parent Safe-Truth Events Table
export const parentSafeTruthEvents = mysqlTable("parentSafeTruthEvents", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  eventType: mysqlEnum("eventType", [
    "arrival",
    "symptoms",
    "doctor-seen",
    "intervention",
    "oxygen",
    "communication",
    "fluids",
    "concern-raised",
    "monitoring",
    "medication",
    "referral-decision",
    "referral-organized",
    "transferred",
    "update",
  ]).notNull(),
  eventTime: timestamp("eventTime").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ParentSafeTruthEvent = typeof parentSafeTruthEvents.$inferSelect;
export type InsertParentSafeTruthEvent = typeof parentSafeTruthEvents.$inferInsert;

// Parent Safe-Truth Submissions Table
export const parentSafeTruthSubmissions = mysqlTable("parentSafeTruthSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  hospitalId: int("hospitalId"),
  childName: varchar("childName", { length: 255 }),
  childAge: int("childAge"),
  childOutcome: mysqlEnum("childOutcome", ["discharged", "referred", "passed-away"]).notNull(),
  arrivalTime: timestamp("arrivalTime").notNull(),
  dischargeOrReferralTime: timestamp("dischargeOrReferralTime"),
  totalDurationMinutes: int("totalDurationMinutes"),
  communicationGaps: int("communicationGaps").default(0),
  interventionDelays: int("interventionDelays").default(0),
  monitoringGaps: int("monitoringGaps").default(0),
  delayAnalysis: text("delayAnalysis"), // JSON string
  improvements: text("improvements"), // JSON string
  isAnonymous: boolean("isAnonymous").default(true),
  parentName: varchar("parentName", { length: 255 }),
  parentEmail: varchar("parentEmail", { length: 255 }),
  status: mysqlEnum("status", ["draft", "submitted", "reviewed", "archived"]).default("submitted"),

  // ── Pre-hospital journey fields ────────────────────────────────────────────
  // When did the parent/caregiver first notice the child was unwell?
  symptomOnsetDate: varchar("symptomOnsetDate", { length: 20 }),   // YYYY-MM-DD
  // How long after symptom onset did the family decide to seek care?
  decisionDelayBand: varchar("decisionDelayBand", { length: 50 }), // "immediate"|"under-1h"|"1-6h"|"6-24h"|"over-24h"
  // Why did they wait before seeking care?
  decisionDelayReasons: text("decisionDelayReasons"),              // JSON: string[]
  // How did the child reach this facility?
  transportMode: varchar("transportMode", { length: 50 }),         // "personal-vehicle"|"matatu"|"boda-boda"|"ambulance"|"walked"|"other"
  transportDurationBand: varchar("transportDurationBand", { length: 50 }), // "under-15m"|"15-30m"|"30-60m"|"over-1h"
  // Was an ambulance called? How long did it take?
  ambulanceCalled: boolean("ambulanceCalled").default(false),
  ambulanceWaitBand: varchar("ambulanceWaitBand", { length: 50 }), // "under-15m"|"15-30m"|"30-60m"|"over-1h"|"never-came"
  // Did the child visit another facility before this one?
  priorFacilityVisit: boolean("priorFacilityVisit").default(false),
  // JSON array of prior stops: [{name, type, reasonLeft, timeSpentBand}]
  priorFacilityChain: text("priorFacilityChain"),
  // Why did they leave the prior facility / get referred?
  referralReason: varchar("referralReason", { length: 100 }),      // "no-equipment"|"no-specialist"|"no-blood"|"self-referred"|"advised-to-go"|"other"
  // Computed: symptom onset → arrival at this facility (minutes)
  preHospitalDelayMinutes: int("preHospitalDelayMinutes"),
  // ──────────────────────────────────────────────────────────────────────────

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParentSafeTruthSubmission = typeof parentSafeTruthSubmissions.$inferSelect;
export type InsertParentSafeTruthSubmission = typeof parentSafeTruthSubmissions.$inferInsert;

/**
 * Safe-Truth v1 — Event Models v1.0 §2, gap-analysis queue item #11, Phase A.
 *
 * DELIBERATELY A NEW TABLE, not a retrofit of `parentSafeTruthSubmissions`
 * above. Two reasons: (1) the old table's `userId` column is NOT NULL —
 * structurally incompatible with §2.2's "no account required, submission is
 * permanently anonymous" requirement; (2) the field taxonomy is completely
 * different (plain-language journey-stage fields per §2.3–2.7, not the old
 * ad-hoc delay-band fields). The old table and its router/UI
 * (`parent-safetruth.ts`, `ParentSafeTruthForm.tsx`, route
 * `/parent-safe-truth`) are left untouched — existing historical
 * submissions stay exactly as they are. This is forward-looking only, same
 * precedent as gap-analysis #10.
 *
 * NO userId COLUMN AT ALL, by design — not nullable-and-usually-empty, but
 * structurally absent, so it's impossible for a future edit to
 * accidentally start populating it and quietly re-introduce identity
 * storage.
 *
 * Field types deliberately use VARCHAR/TEXT with zod-validated option sets
 * at the tRPC layer, not literal MySQL ENUM, even though §2.3–2.7's tables
 * say "ENUM" — that's describing "constrained single-select from a list,"
 * not mandating the SQL column type. These option lists are caregiver-facing
 * copy that may need wording tweaks over time; a MySQL ENUM alteration is a
 * blocking schema change for that, a zod enum update is not.
 */
export const safeTruthSubmissions = mysqlTable("safeTruthSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  /** UUID, client-visible, used for "my submission" links without an account (no login = no submissions list otherwise). */
  submissionUuid: varchar("submission_uuid", { length: 36 }).notNull().unique(),
  observationTimestamp: timestamp("observation_timestamp").defaultNow().notNull(),
  schemaVersion: varchar("schema_version", { length: 16 }).default("1.0").notNull(),
  /** Always 'CAREGIVER' per §2.3 — stored for symmetry with Care Signal's observer_class, not because it varies. */
  observerClass: varchar("observer_class", { length: 16 }).default("CAREGIVER").notNull(),

  // ── §2.3 Shared classifier fields ───────────────────────────────────────
  country: varchar("country", { length: 2 }).notNull(),
  adminLevel1: varchar("admin_level_1", { length: 128 }).notNull(),
  /** Locality — added beyond §2.3's literal spec per CEO instruction, 2026-07-16 ("global from day 1"). */
  adminLevel2: varchar("admin_level_2", { length: 128 }),
  facilityNameRaw: text("facility_name_raw").notNull(),
  /** Null until the Phase C fuzzy-matching job runs. Never shown to the caregiver. */
  facilityIdMatched: varchar("facility_id_matched", { length: 36 }),
  facilityLevel: varchar("facility_level", { length: 64 }),
  childAgeBand: varchar("child_age_band", { length: 32 }).notNull(),
  conditionCategory: varchar("condition_category", { length: 64 }).notNull(),
  outcomeCategory: varchar("outcome_category", { length: 64 }).notNull(),
  isCaseLinkageConsented: boolean("is_case_linkage_consented").default(false).notNull(),
  /** Optional — a Care Signal event's eventId, for consent-based case linkage. */
  eventCodeEntered: varchar("event_code_entered", { length: 36 }),
  /**
   * Set by the Phase C matching job (gap-analysis #11) when
   * `eventCodeEntered` is confirmed to match a real `careSignalEvents.eventId`
   * — i.e. a genuine link between this caregiver's account and a
   * provider's Care Signal report of the same event. NULL until resolved;
   * stays NULL forever if the code never matches (typo, or the provider
   * hasn't submitted yet — the job re-checks on every run, so a late
   * provider submission can still resolve an earlier caregiver entry).
   */
  eventCodeResolvedCareSignalEventId: int("event_code_resolved_care_signal_event_id"),

  // ── §2.4 Journey Stage 1 — Before Seeking Care ──────────────────────────
  symptomOnsetDaysAgo: varchar("symptom_onset_days_ago", { length: 32 }).notNull(),
  firstSymptomNoticed: text("first_symptom_noticed"),
  /** JSON array of plain-language danger-sign strings. */
  dangerSignsPresent: text("danger_signs_present"),
  /** JSON array — multi-select per §2.4. */
  adviceReceivedBeforeFacility: text("advice_received_before_facility").notNull(),
  adviceContentRaw: text("advice_content_raw"),
  reassuredDespiteDanger: boolean("reassured_despite_danger"),
  decisionToSeekCareTrigger: text("decision_to_seek_care_trigger"),

  // ── §2.5 Journey Stage 2 — Getting to Care ──────────────────────────────
  /** JSON array — multi-select for multi-leg journeys per §2.5. */
  transportUsed: text("transport_used").notNull(),
  transportDelayOccurred: boolean("transport_delay_occurred").notNull(),
  transportDelayReason: text("transport_delay_reason"),
  travelTimeToFirstFacility: varchar("travel_time_to_first_facility", { length: 32 }).notNull(),
  costBarrierOccurred: boolean("cost_barrier_occurred").notNull(),
  costBarrierDetails: text("cost_barrier_details"),
  facilitiesVisitedCount: varchar("facilities_visited_count", { length: 64 }).notNull(),

  // ── §2.7 Journey Stage 4 — After Care ───────────────────────────────────
  followUpInstructionsReceived: boolean("follow_up_instructions_received"),
  ableToFollowInstructions: boolean("able_to_follow_instructions"),
  unableToFollowReason: text("unable_to_follow_reason"),
  overallExperienceRating: varchar("overall_experience_rating", { length: 32 }),
  whatCouldHaveBeenBetter: text("what_could_have_been_better"),
  /**
   * Presented FIRST on the form per §2.7's note — stored here for schema
   * simplicity, display order is a UI concern (Phase B), not a storage one.
   * Immutable after submission — same raw-narrative-immutability principle
   * as Care Signal (gap-analysis #9), enforced at the application layer
   * for this table (no BEFORE UPDATE trigger yet — Phase A ships the
   * column; the trigger is a small, easy follow-up once Phase B's real
   * submission flow exists to test it against).
   */
  rawNarrative: text("raw_narrative").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SafeTruthSubmission = typeof safeTruthSubmissions.$inferSelect;
export type InsertSafeTruthSubmission = typeof safeTruthSubmissions.$inferInsert;

/**
 * Safe-Truth v1 repeatable facility visits — Event Models v1.0 §2.6.
 * One row per facility the caregiver's journey included; `visitSequence`
 * orders them. No userId here either, same rationale as the parent table.
 */
export const safeTruthFacilityVisits = mysqlTable("safeTruthFacilityVisits", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submission_id").notNull(),
  visitSequence: int("visit_sequence").notNull(),
  visitFacilityNameRaw: text("visit_facility_name_raw").notNull(),
  visitFacilityIdMatched: varchar("visit_facility_id_matched", { length: 36 }),
  visitFacilityIsFinal: boolean("visit_facility_is_final").default(false).notNull(),
  wasSeenPromptly: varchar("was_seen_promptly", { length: 32 }).notNull(),
  turnedAway: boolean("turned_away").default(false).notNull(),
  turnedAwayReason: text("turned_away_reason"),
  informationReceived: varchar("information_received", { length: 64 }),
  familyInvolvement: varchar("family_involvement", { length: 64 }),
  visitExperienceRaw: text("visit_experience_raw"),
  dangerSignAdviceAtDischarge: boolean("danger_sign_advice_at_discharge"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SafeTruthFacilityVisit = typeof safeTruthFacilityVisits.$inferSelect;
export type InsertSafeTruthFacilityVisit = typeof safeTruthFacilityVisits.$inferInsert;

/**
 * Device-local disclaimer acknowledgment log for the no-auth Safe-Truth
 * flow (gap-analysis #11 Phase A). Replaces the old
 * `legal.acceptSafeTruthGuardian` mutation, which requires a logged-in
 * account (`getMyConsentStatus` reads a per-user row) — structurally
 * incompatible with §2.2. This table exists purely as an anonymous audit
 * trail ("X sessions saw and accepted the disclaimer") — it is NEVER
 * joined to a submission or an identity. `deviceSessionId` is a random
 * client-generated value, not a fingerprint of any kind.
 */
export const safeTruthDisclaimerAcks = mysqlTable("safeTruthDisclaimerAcks", {
  id: int("id").autoincrement().primaryKey(),
  deviceSessionId: varchar("device_session_id", { length: 36 }).notNull(),
  disclaimerVersion: varchar("disclaimer_version", { length: 16 }).notNull(),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
});

export type SafeTruthDisclaimerAck = typeof safeTruthDisclaimerAcks.$inferSelect;
export type InsertSafeTruthDisclaimerAck = typeof safeTruthDisclaimerAcks.$inferInsert;

// System Delay Analysis Results Table
export const systemDelayAnalysis = mysqlTable("systemDelayAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull(),
  hospitalId: int("hospitalId").notNull(),
  arrivalToDoctorDelay: int("arrivalToDoctorDelay"),
  doctorToInterventionDelay: int("doctorToInterventionDelay"),
  interventionToMonitoringDelay: int("interventionToMonitoringDelay"),
  communicationDelay: int("communicationDelay"),
  hasMonitoringGap: boolean("hasMonitoringGap").default(false),
  hasCommunicationGap: boolean("hasCommunicationGap").default(false),
  hasInterventionDelay: boolean("hasInterventionDelay").default(false),
  recommendations: text("recommendations"), // JSON array
  improvementAreas: text("improvementAreas"), // JSON array
  severityScore: decimal("severityScore", { precision: 3, scale: 1 }), // 0-10 scale
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SystemDelayAnalysis = typeof systemDelayAnalysis.$inferSelect;
export type InsertSystemDelayAnalysis = typeof systemDelayAnalysis.$inferInsert;

// Hospital Improvement Metrics (aggregated from parent feedback)
export const hospitalImprovementMetrics = mysqlTable("hospitalImprovementMetrics", {
  id: int("id").autoincrement().primaryKey(),
  hospitalId: int("hospitalId").notNull().unique(),
  totalSubmissions: int("totalSubmissions").default(0),
  avgArrivalToDoctorDelay: decimal("avgArrivalToDoctorDelay", { precision: 5, scale: 1 }),
  avgDoctorToInterventionDelay: decimal("avgDoctorToInterventionDelay", { precision: 5, scale: 1 }),
  communicationGapPercentage: decimal("communicationGapPercentage", { precision: 5, scale: 1 }),
  monitoringGapPercentage: decimal("monitoringGapPercentage", { precision: 5, scale: 1 }),
  improvementTrend: mysqlEnum("improvementTrend", ["improving", "stable", "declining"]),
  lastAnalyzedAt: timestamp("lastAnalyzedAt"),
  topImprovementAreas: text("topImprovementAreas"), // JSON array
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HospitalImprovementMetrics = typeof hospitalImprovementMetrics.$inferSelect;
export type InsertHospitalImprovementMetrics = typeof hospitalImprovementMetrics.$inferInsert;


// ============================================================================
// CHAT SUPPORT SYSTEM
// ============================================================================

// Chat Conversations Table
export const chatConversations = mysqlTable("chatConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: int("agentId"),
  topic: mysqlEnum("topic", ["activation_help", "password_reset", "course_enrollment", "payment_issue", "technical_support", "other"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  status: mysqlEnum("status", ["open", "assigned", "in_progress", "resolved", "closed"]).default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

// Chat Messages Table
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  senderType: mysqlEnum("senderType", ["user", "agent", "system"]).notNull(),
  content: text("content").notNull(),
  messageType: mysqlEnum("messageType", ["text", "file", "system"]).default("text"),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// Support Agents Table
export const supportAgents = mysqlTable("supportAgents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentName: varchar("agentName", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["available", "busy", "offline"]).default("offline"),
  activeConversations: int("activeConversations").default(0),
  totalResolved: int("totalResolved").default(0),
  avgResolutionTime: int("avgResolutionTime"), // in minutes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportAgent = typeof supportAgents.$inferSelect;
export type InsertSupportAgent = typeof supportAgents.$inferInsert;

// Canned Responses Table
export const cannedResponses = mysqlTable("cannedResponses", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId"),
  title: varchar("title", { length: 255 }).notNull(),
  shortcut: varchar("shortcut", { length: 50 }).unique(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CannedResponse = typeof cannedResponses.$inferSelect;
export type InsertCannedResponse = typeof cannedResponses.$inferInsert;

// Chat Analytics Table
export const chatAnalytics = mysqlTable("chatAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  totalConversations: int("totalConversations").default(0),
  resolvedConversations: int("resolvedConversations").default(0),
  avgResolutionTime: int("avgResolutionTime"), // in minutes
  avgCustomerSatisfaction: decimal("avgCustomerSatisfaction", { precision: 3, scale: 2 }), // 0-5 scale
  totalMessagesHandled: int("totalMessagesHandled").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatAnalytics = typeof chatAnalytics.$inferSelect;
export type InsertChatAnalytics = typeof chatAnalytics.$inferInsert;

// CPR Team Members table - Track team members and their roles
export const cprTeamMembers = mysqlTable("cprTeamMembers", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId"), // null if anonymous/guest provider
  providerName: varchar("providerName", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["team_leader", "compressions", "airway", "iv_access", "medications", "recorder", "observer"]),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  leftAt: timestamp("leftAt"),
});

export type CprTeamMember = typeof cprTeamMembers.$inferSelect;
export type InsertCprTeamMember = typeof cprTeamMembers.$inferInsert;



// Guideline Version Control System

// Guidelines table - tracks authoritative clinical guidelines
export const guidelines = mysqlTable("guidelines", {
  id: int("id").autoincrement().primaryKey(),
  organization: mysqlEnum("organization", ["AHA", "WHO", "ACOG", "ERC", "ILCOR", "AAP", "RCOG", "NICE"]).notNull(),
  title: text("title").notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  publicationDate: date("publicationDate").notNull(),
  effectiveDate: date("effectiveDate"),
  url: text("url"),
  documentHash: varchar("documentHash", { length: 64 }), // SHA-256 hash for change detection
  status: mysqlEnum("status", ["current", "superseded", "withdrawn"]).default("current").notNull(),
  category: mysqlEnum("category", [
    "cardiac_arrest",
    "respiratory",
    "shock",
    "trauma",
    "toxicology",
    "neonatal",
    "obstetric",
    "pediatric",
    "general"
  ]).notNull(),
  summary: text("summary"),
  keyChanges: json("keyChanges"), // Array of key changes from previous version
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Guideline = typeof guidelines.$inferSelect;
export type InsertGuideline = typeof guidelines.$inferInsert;

// Protocol Guidelines Mapping - links protocols to their source guidelines
export const protocolGuidelines = mysqlTable("protocolGuidelines", {
  id: int("id").autoincrement().primaryKey(),
  protocolId: varchar("protocolId", { length: 100 }).notNull(), // e.g., "dka", "septic_shock"
  protocolName: text("protocolName").notNull(),
  guidelineId: int("guidelineId").notNull(),
  relevance: mysqlEnum("relevance", ["primary", "secondary", "reference"]).default("primary").notNull(),
  specificSections: json("specificSections"), // Array of specific guideline sections referenced
  lastReviewed: timestamp("lastReviewed").defaultNow().notNull(),
  reviewedBy: int("reviewedBy"), // User ID of reviewer
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProtocolGuideline = typeof protocolGuidelines.$inferSelect;
export type InsertProtocolGuideline = typeof protocolGuidelines.$inferInsert;

// Guideline Changes - tracks detected changes and their impact
export const guidelineChanges = mysqlTable("guidelineChanges", {
  id: int("id").autoincrement().primaryKey(),
  guidelineId: int("guidelineId").notNull(),
  previousVersion: varchar("previousVersion", { length: 50 }),
  newVersion: varchar("newVersion", { length: 50 }).notNull(),
  changeType: mysqlEnum("changeType", [
    "major_revision",
    "minor_update",
    "clarification",
    "new_evidence",
    "withdrawn_recommendation"
  ]).notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "moderate", "low"]).notNull(),
  changeDescription: text("changeDescription").notNull(),
  affectedProtocols: json("affectedProtocols"), // Array of protocol IDs
  clinicalImpact: text("clinicalImpact"),
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "under_review", "implemented", "not_applicable"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  implementationNotes: text("implementationNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GuidelineChange = typeof guidelineChanges.$inferSelect;
export type InsertGuidelineChange = typeof guidelineChanges.$inferInsert;

// Protocol Status - tracks current status of each protocol
export const protocolStatus = mysqlTable("protocolStatus", {
  id: int("id").autoincrement().primaryKey(),
  protocolId: varchar("protocolId", { length: 100 }).notNull().unique(),
  protocolName: text("protocolName").notNull(),
  currentStatus: mysqlEnum("currentStatus", ["current", "outdated", "under_review", "flagged"]).default("current").notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  lastReviewed: timestamp("lastReviewed").defaultNow().notNull(),
  nextReviewDue: date("nextReviewDue"),
  pendingChanges: int("pendingChanges").default(0), // Count of unimplemented guideline changes
  flagReason: text("flagReason"),
  assignedTo: int("assignedTo"), // User ID of assigned reviewer
  priority: mysqlEnum("priority", ["urgent", "high", "normal", "low"]).default("normal").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProtocolStatus = typeof protocolStatus.$inferSelect;
export type InsertProtocolStatus = typeof protocolStatus.$inferInsert;

// Clinical Referrals - tracks patient referrals to other facilities
export const clinicalReferrals = mysqlTable("clinicalReferrals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Provider who created the referral
  patientName: varchar("patientName", { length: 255 }).notNull(),
  patientAge: int("patientAge").notNull(),
  diagnosis: text("diagnosis").notNull(),
  urgency: mysqlEnum("urgency", ["routine", "urgent", "emergency"]).default("routine").notNull(),
  reason: text("reason").notNull(),
  referralType: mysqlEnum("referralType", ["hospital", "specialist", "imaging", "lab"]).notNull(),
  facilityName: varchar("facilityName", { length: 255 }).notNull(),
  /** Optional: receiving facility contact for referral notifications (REF-1). */
  facilityContactEmail: varchar("facilityContactEmail", { length: 320 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "completed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClinicalReferral = typeof clinicalReferrals.$inferSelect;
export type InsertClinicalReferral = typeof clinicalReferrals.$inferInsert;

// Webhook retry queue (for MPESA-6: resilience)
export const webhookRetryQueue = mysqlTable("webhookRetryQueue", {
  id: int("id").autoincrement().primaryKey(),
  webhookType: varchar("webhookType", { length: 50 }).notNull(), // "mpesa_callback", "mpesa_query", etc.
  payload: json("payload").notNull(), // Original webhook payload
  checkoutRequestID: varchar("checkoutRequestID", { length: 255 }), // For M-Pesa
  retryCount: int("retryCount").default(0),
  maxRetries: int("maxRetries").default(5),
  nextRetryAt: timestamp("nextRetryAt"),
  lastError: text("lastError"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "dead_letter"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WebhookRetryQueue = typeof webhookRetryQueue.$inferSelect;
export type InsertWebhookRetryQueue = typeof webhookRetryQueue.$inferInsert;

// Audit Logs - immutable log of all admin actions, auth events, and sensitive data access
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // User who performed the action (nullable for system events)
  action: varchar("action", { length: 50 }).notNull(), // LOGIN, LOGOUT, PASSWORD_CHANGE, USER_CREATE, etc.
  resource: varchar("resource", { length: 50 }).notNull(), // user, course, care_signal, safe_truth, etc.
  resourceId: int("resourceId"), // ID of the resource affected (nullable for system events)
  changes: json("changes"), // JSON object of what changed (for UPDATE operations)
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  userAgent: text("userAgent"), // Browser/client user agent
  status: mysqlEnum("status", ["success", "failure", "denied"]).notNull(), // Outcome of the action
  errorMessage: text("errorMessage"), // Error details if status is failure/denied
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  archivedAt: timestamp("archivedAt"), // When log was archived (for retention policy)
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============================================================================
// FELLOWSHIP QUALIFICATION SYSTEM (3 Pillars: Courses, ResusGPS, Care Signal)
// ============================================================================

/**
 * ResusGPS Sessions — track each ResusGPS case session initiated by a provider.
 * Pillar 2: ResusGPS cases (≥3 attributable cases per taught condition).
 */
export const resusGPSSessions = mysqlTable("resusGPSSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(), // UUID for session tracking
  /** Primary diagnosis/condition (e.g., "septic-shock", "asthma", "status-epilepticus") */
  primaryDiagnosis: varchar("primaryDiagnosis", { length: 255 }).notNull(),
  /** Secondary diagnoses if multi-diagnosis session */
  secondaryDiagnoses: text("secondaryDiagnoses"), // JSON array of diagnosis strings
  /** Patient age in months (for depth validation) */
  patientAgeMonths: int("patientAgeMonths").notNull(),
  /** Patient weight in kg (for dose validation) */
  patientWeightKg: decimal("patientWeightKg", { precision: 5, scale: 2 }),
  /** Trauma case? (for trauma pathway tracking) */
  isTrauma: boolean("isTrauma").default(false),
  /** Cardiac arrest case? (for CPR tracking) */
  isCardiacArrest: boolean("isCardiacArrest").default(false),
  /** Session status: ongoing, completed, abandoned */
  status: mysqlEnum("status", ["ongoing", "completed", "abandoned"]).default("ongoing"),
  /** Number of interventions recorded in session */
  interventionCount: int("interventionCount").default(0),
  /** Number of reassessments performed */
  reassessmentCount: int("reassessmentCount").default(0),
  /** Session duration in seconds */
  durationSeconds: int("durationSeconds"),
  /** Outcome: survived, transferred, other */
  outcome: varchar("outcome", { length: 64 }),
  /** Depth score (0-100) for anti-gaming validation */
  depthScore: int("depthScore").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResusGPSSession = typeof resusGPSSessions.$inferSelect;
export type InsertResusGPSSession = typeof resusGPSSessions.$inferInsert;

/**
 * ResusGPS Cases — individual cases within a session (for detailed tracking).
 * Each session may have multiple cases if provider switches between patients.
 */
export const resusGPSCases = mysqlTable("resusGPSCases", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(), // FK to resusGPSSessions.sessionId
  userId: int("userId").notNull(),
  /** Case identifier within session */
  caseNumber: int("caseNumber").notNull(), // 1st case, 2nd case, etc.
  /** Diagnosis for this specific case */
  diagnosis: varchar("diagnosis", { length: 255 }).notNull(),
  /** ABCDE assessment completed? */
  abcdeCompleted: boolean("abcdeCompleted").default(false),
  /** Interventions performed (JSON array of intervention objects) */
  interventions: text("interventions"), // JSON array
  /** Reassessments performed (JSON array of reassessment findings) */
  reassessments: text("reassessments"), // JSON array
  /** Case outcome */
  outcome: varchar("outcome", { length: 64 }),
  /** Depth score for this case (0-100) */
  depthScore: int("depthScore").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResusGPSCase = typeof resusGPSCases.$inferSelect;
export type InsertResusGPSCase = typeof resusGPSCases.$inferInsert;

/**
 * Fellowship Progress — cumulative tracking of all 3 pillars for each user.
 * Single row per user; updated as they progress through courses, ResusGPS, Care Signal.
 */
export const fellowshipProgress = mysqlTable("fellowshipProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // One row per user
  
  // PILLAR 1: Courses (all 26 ADF micro-courses; BLS, ACLS, PALS are optional, standalone)
  /** Total courses required for fellowship (26 ADF micro-courses + legacy courses) */
  totalCoursesRequired: int("totalCoursesRequired").default(26),
  /** Courses completed (count of certificates with completion date) */
  coursesCompleted: int("coursesCompleted").default(0),
  /** Percentage of courses completed (0-100) */
  coursesPercentage: int("coursesPercentage").default(0),
  
  // PILLAR 2: ResusGPS Cases (≥3 cases per taught condition)
  /** Total ResusGPS cases completed */
  resusGPSCasesCompleted: int("resusGPSCasesCompleted").default(0),
  /** Conditions with ≥3 cases (count of conditions meeting threshold) */
  conditionsWithThreshold: int("conditionsWithThreshold").default(0),
  /** Total conditions taught (from courses) */
  totalConditionsTaught: int("totalConditionsTaught").default(0),
  /** Percentage of conditions with ≥3 cases */
  resusGPSPercentage: int("resusGPSPercentage").default(0),
  
  // PILLAR 3: Care Signal (24 consecutive qualifying months)
  /** Consecutive months of Care Signal participation (0-24+) */
  careSignalStreak: int("careSignalStreak").default(0),
  /** Total Care Signal events submitted */
  careSignalEventsSubmitted: int("careSignalEventsSubmitted").default(0),
  /** Percentage of 24-month requirement (0-100) */
  careSignalPercentage: int("careSignalPercentage").default(0),
  
  // OVERALL FELLOWSHIP STATUS
  /** Fellowship qualified? (all 3 pillars at 100%) */
  isQualified: boolean("isQualified").default(false),
  /** Date when fellowship was achieved (if qualified) */
  qualifiedAt: timestamp("qualifiedAt"),
  /** Overall completion percentage (average of 3 pillars) */
  overallPercentage: int("overallPercentage").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FellowshipProgress = typeof fellowshipProgress.$inferSelect;
export type InsertFellowshipProgress = typeof fellowshipProgress.$inferInsert;

/**
 * Fellowship pseudonymous tokens — Observation Architecture v1.1 §5.5, Layer 2.
 *
 * Lets a provider earn Fellowship Pillar C credit for Care Signal submissions
 * WITHOUT the platform ever storing their real identity against those events
 * — `careSignalEvents.userId` stays NULL for every submission made under a
 * token; `fellowshipTokenId` is the only link, and this table is the only
 * place that token's own credit ledger lives.
 *
 * `linkedUserId` is set ONLY via an explicit, separate "reveal" action
 * (fellowship.linkToken) — never at token creation, and never implicitly.
 * This is what makes it genuinely pseudonymous rather than just "hidden in
 * the UI": a direct database query joining fellowshipTokens to users only
 * works after the provider has deliberately chosen to reveal themselves.
 *
 * KNOWN LIMITATION (documented, not silently glossed over): Care Signal
 * requires a logged-in platform account to submit at all (protectedProcedure
 * — see care-signal-events.ts), so token *creation* necessarily happens
 * within an authenticated request. This table itself never records that
 * association, but standard request/access logs at the moment of creation
 * could in principle correlate a session to a token. This model protects
 * the *application data layer* (Care Signal events, Fellowship credit,
 * anything queryable through the schema) from casual or even direct-SQL
 * identification — it does not claim to defeat server-log-level traffic
 * analysis, which no in-app token scheme can.
 *
 * `titleDisplayRevokedAt`: per CEO decision (2026-07-15, gap-analysis #10),
 * "revoking" a reveal only stops the Fellow title from being publicly
 * displayed going forward — it does NOT unlink or re-anonymize the
 * already-linked credit history, consistent with how withdrawal is handled
 * elsewhere for anonymized-not-deleted data (see gap-analysis #13).
 *
 * `recoveryCodeLookupHash` (added 2026-07-20, closing a documented scaling
 * limit from #10): recovery codes are bcrypt-hashed in `recoveryCodeHash`,
 * which is one-way by design and therefore can't be a WHERE-clause lookup
 * — the original implementation fetched every token row and bcrypt-compared
 * each one, O(n) in total tokens ever created. This column is a plain
 * SHA-256 HMAC of the normalized code, keyed by the same server-side secret
 * already used for session signing (`JWT_SECRET`, with a domain-separation
 * label — see `server/lib/fellowship-token.ts`'s `hashRecoveryCodeForLookup`)
 * — deterministic, so it CAN be indexed and looked up in O(1), but it is
 * NEVER the actual security check on its own: a lookup-hash match only
 * narrows to a candidate row, which is then still bcrypt-verified against
 * `recoveryCodeHash` before recovery succeeds. Nullable because bcrypt
 * hashes can't be reversed to backfill this for tokens created before this
 * column existed — those rows keep `recoveryCodeLookupHash = NULL` forever
 * and fall back to the old O(n) scan, now bounded to only the
 * (shrinking, non-growing) set of pre-migration tokens rather than the
 * whole table. See migration 0073's own doc comment for the exact
 * cutover mechanics.
 */
export const fellowshipTokens = mysqlTable("fellowshipTokens", {
  id: int("id").autoincrement().primaryKey(),
  /** UUID, generated client-side-visible at creation, stored on the provider's device. */
  tokenId: varchar("tokenId", { length: 36 }).notNull().unique(),
  /** Hash of a one-time-shown recovery code — never store the code itself. */
  recoveryCodeHash: varchar("recoveryCodeHash", { length: 128 }).notNull(),
  /** Keyed SHA-256 of the normalized recovery code — O(1) index lookup only, NEVER the actual auth check (that's still recoveryCodeHash + bcrypt). NULL for tokens created before 2026-07-20 (migration 0073). */
  recoveryCodeLookupHash: varchar("recoveryCodeLookupHash", { length: 64 }),
  /** Mirrors fellowshipProgress's Pillar 3 fields, computed the same way, keyed by token instead of userId. */
  careSignalStreak: int("careSignalStreak").default(0),
  careSignalEventsSubmitted: int("careSignalEventsSubmitted").default(0),
  careSignalPercentage: int("careSignalPercentage").default(0),
  /** NULL until the provider explicitly reveals themselves via fellowship.linkToken. */
  linkedUserId: int("linkedUserId"),
  linkedAt: timestamp("linkedAt"),
  /** Set when the provider revokes public display of the Fellow title earned via this token (display-only; see class doc above). */
  titleDisplayRevokedAt: timestamp("titleDisplayRevokedAt"),
  lastSubmissionAt: timestamp("lastSubmissionAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FellowshipToken = typeof fellowshipTokens.$inferSelect;
export type InsertFellowshipToken = typeof fellowshipTokens.$inferInsert;

/**
 * Fellowship Grace Usage — track grace periods used per user per calendar year (EAT).
 * Max 2 grace periods per calendar year; after using grace, next month must have ≥3 events.
 */
export const fellowshipGraceUsage = mysqlTable("fellowshipGraceUsage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /**
   * Which monthly Pillar C requirement this grace was used against — Care
   * Signal and CPD each get their own independent grace budget (up to 2
   * per calendar year each), not a shared pool (North Star v2.1 addendum
   * §3, CEO decision 2026-07-29: CPD "inherits Care Signal's existing
   * rules" as a template, not a shared allowance). Defaults to
   * care_signal since every row before this column existed was implicitly
   * Care Signal grace.
   */
  requirementType: mysqlEnum("requirementType", ["care_signal", "cpd"]).default("care_signal").notNull(),
  /** Calendar year (EAT) when grace was used */
  year: int("year").notNull(),
  /** Month (1-12, EAT) when grace was used */
  month: int("month").notNull(),
  /** Reason for grace: "zero_events", "insufficient_events", "technical_issue" */
  reason: varchar("reason", { length: 64 }).notNull(),
  /** Notes about the grace period */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FellowshipGraceUsage = typeof fellowshipGraceUsage.$inferSelect;
export type InsertFellowshipGraceUsage = typeof fellowshipGraceUsage.$inferInsert;

/**
 * Fellowship Streak Resets — track when Care Signal streak resets (pillar C only).
 * Pillar A (courses) and B (ResusGPS) do not reset; only C resets on 3rd failure.
 */
export const fellowshipStreakResets = mysqlTable("fellowshipStreakResets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Calendar year (EAT) when reset occurred */
  year: int("year").notNull(),
  /** Month (1-12, EAT) when reset occurred */
  month: int("month").notNull(),
  /** Reason: "third_failure", "manual_admin_reset" */
  reason: varchar("reason", { length: 64 }).notNull(),
  /** Previous streak value before reset */
  previousStreak: int("previousStreak").notNull(),
  /** Admin notes if manual reset */
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FellowshipStreakReset = typeof fellowshipStreakResets.$inferSelect;
export type InsertFellowshipStreakReset = typeof fellowshipStreakResets.$inferInsert;


/**
 * Provider SAMPLE History — stores the last SAMPLE history per provider.
 * Used to pre-fill the SAMPLE fields in ResusGPS for returning patients.
 * One row per user, upserted on every ResusGPS case completion.
 */
export const providerSampleHistory = mysqlTable("providerSampleHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  signs: text("signs"),
  allergies: text("allergies"),
  medications: text("medications"),
  pastHistory: text("pastHistory"),
  lastMeal: text("lastMeal"),
  events: text("events"),
  caseWeight: decimal("caseWeight", { precision: 5, scale: 1 }),
  caseAge: varchar("caseAge", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProviderSampleHistory = typeof providerSampleHistory.$inferSelect;
export type InsertProviderSampleHistory = typeof providerSampleHistory.$inferInsert;

/**
 * Care Signal Reviews — admin/MOH responses to resource gap reports.
 */
export const careSignalReviews = mysqlTable("careSignalReviews", {
  id: int("id").autoincrement().primaryKey(),
  analyticsEventId: int("analyticsEventId").notNull(),
  reporterUserId: int("reporterUserId").notNull(),
  reviewerUserId: int("reviewerUserId").notNull(),
  interventionName: varchar("interventionName", { length: 128 }).notNull(),
  responseText: text("responseText").notNull(),
  actionTaken: varchar("actionTaken", { length: 64 }).notNull().default("acknowledged"),
  expectedResolutionDate: varchar("expectedResolutionDate", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CareSignalReview = typeof careSignalReviews.$inferSelect;
export type InsertCareSignalReview = typeof careSignalReviews.$inferInsert;

/**
 * In-App Notifications — lightweight notification inbox for providers.
 */
export const inAppNotifications = mysqlTable("inAppNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  body: text("body").notNull(),
  actionUrl: varchar("actionUrl", { length: 512 }),
  relatedId: int("relatedId"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InAppNotification = typeof inAppNotifications.$inferSelect;
export type InsertInAppNotification = typeof inAppNotifications.$inferInsert;

/** Durable user-owned notification preferences for Account & security. */
export const userNotificationPreferences = mysqlTable(
  "userNotificationPreferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    emailNotifications: boolean("emailNotifications").notNull().default(true),
    smsNotifications: boolean("smsNotifications").notNull().default(true),
    pushNotifications: boolean("pushNotifications").notNull().default(true),
    enrollmentAlerts: boolean("enrollmentAlerts").notNull().default(true),
    paymentAlerts: boolean("paymentAlerts").notNull().default(true),
    certificateAlerts: boolean("certificateAlerts").notNull().default(true),
    courseUpdates: boolean("courseUpdates").notNull().default(true),
    quizReminders: boolean("quizReminders").notNull().default(true),
    achievementNotifications: boolean("achievementNotifications").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIdUnique: uniqueIndex("userNotificationPreferences_userId_unique").on(table.userId),
  })
);
export type UserNotificationPreferences = typeof userNotificationPreferences.$inferSelect;
export type InsertUserNotificationPreferences = typeof userNotificationPreferences.$inferInsert;

/** Audit log for every inbound M-Pesa / Daraja callback (forensics beyond payments.status). */
export const mpesaWebhookLog = mysqlTable("mpesaWebhookLog", {
  id: int("id").autoincrement().primaryKey(),
  callbackType: mysqlEnum("callbackType", [
    "stk",
    "stk_timeout",
    "stk_query",
    "c2b_validation",
    "c2b_confirmation",
  ]).notNull(),
  checkoutRequestId: varchar("checkoutRequestId", { length: 255 }),
  resultCode: int("resultCode"),
  resultDesc: varchar("resultDesc", { length: 512 }),
  httpStatus: int("httpStatus").notNull(),
  outcome: mysqlEnum("outcome", [
    "received",
    "signature_rejected",
    "invalid_payload",
    "duplicate_idempotency",
    "payment_not_found",
    "payment_completed",
    "payment_failed",
    "already_finalized",
    "persist_error",
    "acknowledged",
    "error",
  ]).notNull(),
  paymentId: int("paymentId"),
  enrollmentId: int("enrollmentId"),
  amountCents: int("amountCents"),
  mpesaReceiptNumber: varchar("mpesaReceiptNumber", { length: 64 }),
  errorMessage: text("errorMessage"),
  payloadSnippet: text("payloadSnippet"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MpesaWebhookLog = typeof mpesaWebhookLog.$inferSelect;
export type InsertMpesaWebhookLog = typeof mpesaWebhookLog.$inferInsert;

/** Dedupes platform admin alert emails/SMS (one per rule per cooldown window). */
export const adminAlertDispatches = mysqlTable("adminAlertDispatches", {
  id: int("id").autoincrement().primaryKey(),
  ruleKey: varchar("ruleKey", { length: 64 }).notNull(),
  channel: mysqlEnum("channel", ["email", "sms"]).default("email").notNull(),
  recipient: varchar("recipient", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  bodySnippet: text("bodySnippet"),
  metricValue: int("metricValue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminAlertDispatch = typeof adminAlertDispatches.$inferSelect;
export type InsertAdminAlertDispatch = typeof adminAlertDispatches.$inferInsert;

/**
 * Canonical facility registry for providers, Care Signal, and geographic QI rollups.
 * Use `mergedIntoId` when admin merges duplicate names; always resolve via registry helper.
 */
export const careFacilities = mysqlTable("careFacilities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  county: varchar("county", { length: 128 }),
  country: varchar("country", { length: 128 }).notNull().default("Kenya"),
  subCounty: varchar("subCounty", { length: 128 }),
  facilityType: mysqlEnum("facilityType", [
    "primary_health_center",
    "health_post",
    "district_hospital",
    "private_clinic",
    "ngo_clinic",
    "other",
  ]),
  /** Points to canonical row after admin merge */
  mergedIntoId: int("mergedIntoId"),
  institutionalAccountId: int("institutionalAccountId"),
  isSystem: boolean("isSystem").default(false).notNull(),
  /** Stable key for seeded system rows (e.g. outreach-mobile) */
  systemSlug: varchar("systemSlug", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CareFacility = typeof careFacilities.$inferSelect;
export type InsertCareFacility = typeof careFacilities.$inferInsert;

/** Published legal document version registry (migration 0044) */
export const legalDocumentVersions = mysqlTable("legalDocumentVersions", {
  id: int("id").autoincrement().primaryKey(),
  documentKey: varchar("documentKey", { length: 64 }).notNull().unique(),
  version: varchar("version", { length: 16 }).notNull(),
  effectiveAt: timestamp("effectiveAt").notNull(),
  summary: text("summary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LegalDocumentVersion = typeof legalDocumentVersions.$inferSelect;
export type InsertLegalDocumentVersion = typeof legalDocumentVersions.$inferInsert;

/** Data subject access / deletion / correction requests (migration 0044) */
export const legalDataRequests = mysqlTable("legalDataRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  requesterEmail: varchar("requesterEmail", { length: 320 }).notNull(),
  requesterName: varchar("requesterName", { length: 255 }),
  requestType: mysqlEnum("requestType", ["access", "correction", "deletion", "objection", "portability"]).notNull(),
  details: text("details"),
  status: mysqlEnum("status", ["received", "in_progress", "completed", "rejected"]).default("received").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LegalDataRequest = typeof legalDataRequests.$inferSelect;
export type InsertLegalDataRequest = typeof legalDataRequests.$inferInsert;

/** Audit trail for consent events (migration 0044) */
export const userConsentEvents = mysqlTable("userConsentEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  consentType: varchar("consentType", { length: 64 }).notNull(),
  documentVersion: varchar("documentVersion", { length: 16 }),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserConsentEvent = typeof userConsentEvents.$inferSelect;
export type InsertUserConsentEvent = typeof userConsentEvents.$inferInsert;

/** Learner reports of unsafe or incorrect fellowship content (migration 0047). */
export const contentSafetyReports = mysqlTable("contentSafetyReports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: varchar("courseId", { length: 64 }).notNull(),
  moduleId: int("moduleId"),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["open", "reviewed", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContentSafetyReport = typeof contentSafetyReports.$inferSelect;
export type InsertContentSafetyReport = typeof contentSafetyReports.$inferInsert;

export const platformFeedbackTickets = mysqlTable("platformFeedbackTickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: mysqlEnum("category", [
    "course_content",
    "resus_gps",
    "care_signal",
    "payment_technical",
    "safety_concern",
    "other",
  ]).notNull(),
  issueType: mysqlEnum("issueType", ["bug", "content", "ux", "billing", "clinical", "other"]),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  contextJson: json("contextJson"),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "wont_fix", "duplicate"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["normal", "safety"]).default("normal").notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  adminResponse: text("adminResponse"),
  respondedAt: timestamp("respondedAt"),
  respondedBy: int("respondedBy"),
  assignedAgent: varchar("assignedAgent", { length: 64 }),
  agentTags: json("agentTags"),
  statusHistoryJson: json("statusHistoryJson"),
  duplicateOfTicketId: int("duplicateOfTicketId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformFeedbackTicket = typeof platformFeedbackTickets.$inferSelect;
export type InsertPlatformFeedbackTicket = typeof platformFeedbackTickets.$inferInsert;

/** AHA Practice Lab simulation attempts (migration 0049) */
export const ahaPracticeLabAttempts = mysqlTable("ahaPracticeLabAttempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  enrollmentId: int("enrollmentId").notNull(),
  programType: mysqlEnum("programType", ["bls", "acls", "pals", "heartsaver", "nrp"]).notNull(),
  trackId: varchar("trackId", { length: 64 }).notNull(),
  scenarioId: varchar("scenarioId", { length: 64 }).notNull(),
  score: int("score").notNull(),
  passed: boolean("passed").default(false).notNull(),
  eventLog: json("eventLog"),
  isBooster: boolean("isBooster").default(false).notNull(),
  durationSeconds: int("durationSeconds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AhaPracticeLabAttempt = typeof ahaPracticeLabAttempts.$inferSelect;
export type InsertAhaPracticeLabAttempt = typeof ahaPracticeLabAttempts.$inferInsert;

/**
 * CPD (Continuous Professional Development) attendance automation service (migration 0078).
 * Multi-tenant: every event/attendee is scoped to an institutionalAccounts.id.
 * One open event per institution at a time (admin opens/closes; public registers while open).
 */
export const cpdEvents = mysqlTable("cpdEvents", {
  id: int("id").autoincrement().primaryKey(),
  /** Owning institution (institutionalAccounts.id). */
  institutionalAccountId: int("institutionalAccountId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  /** Free-text event date (e.g. "12 June 2026"); stored as entered by the admin. */
  eventDate: varchar("eventDate", { length: 64 }).notNull(),
  isOpen: boolean("isOpen").default(false).notNull(),
  openedAt: timestamp("openedAt"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  cpdCode: varchar("cpdCode", { length: 128 }),
  approvingCouncil: varchar("approvingCouncil", { length: 128 }),
  cpdPoints: decimal("cpdPoints", { precision: 4, scale: 1 }),
  eventType: mysqlEnum("eventType", ["cne", "cme", "cpd_general", "grand_rounds", "journal_club", "workshop", "m_and_m", "other_cadre"]).default("cpd_general").notNull(),
  /** Audience determines who should be expected to attend and how the session appears in reports. */
  audienceScope: mysqlEnum("audienceScope", ["facility_wide", "nursing_wide", "clinical", "m_and_m", "other_cadre"]).default("facility_wide").notNull(),
  /** Optional label for other-cadre audiences, such as Finance, Housekeeping, or Kitchen staff. */
  audienceLabel: varchar("audienceLabel", { length: 128 }),
  /** Canonical institution department for department-scoped sessions; legacy presenterDepartment remains for display. */
  facilityDepartmentId: int("facilityDepartmentId"),
  /** ISO calendar date for reliable monthly, quarterly, and annual reporting; eventDate remains the legacy display field. */
  eventDateAt: date("eventDateAt"),
  presenterUserId: int("presenterUserId"),
  presenterName: varchar("presenterName", { length: 255 }),
  presenterCadre: varchar("presenterCadre", { length: 128 }),
  presenterDepartment: varchar("presenterDepartment", { length: 128 }),
  scheduledStartTime: varchar("scheduledStartTime", { length: 10 }),
  scheduledEndTime: varchar("scheduledEndTime", { length: 10 }),
});

export type CpdEvent = typeof cpdEvents.$inferSelect;
export type InsertCpdEvent = typeof cpdEvents.$inferInsert;

/** Presenter roster for a CPD session; presenters are not counted as attendees unless they register separately. */
export const cpdEventCoPresenters = mysqlTable("cpdEventCoPresenters", {
  id: int("id").autoincrement().primaryKey(),
  cpdEventId: int("cpdEventId").notNull(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  userId: int("userId"),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  cadre: varchar("cadre", { length: 128 }),
  department: varchar("department", { length: 128 }),
  addedByUserId: int("addedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  eventIndex: index("cpd_event_co_presenters_event_idx").on(table.cpdEventId),
  institutionIndex: index("cpd_event_co_presenters_institution_idx").on(table.institutionalAccountId),
}));
export type CpdEventCoPresenter = typeof cpdEventCoPresenters.$inferSelect;
export type InsertCpdEventCoPresenter = typeof cpdEventCoPresenters.$inferInsert;

/** Public CPD registrations (one row per registrant per event). */
export const cpdAttendees = mysqlTable("cpdAttendees", {
  id: int("id").autoincrement().primaryKey(),
  cpdEventId: int("cpdEventId").notNull(),
  /** Denormalized owning institution for fast tenant scoping on certificate routes. */
  institutionalAccountId: int("institutionalAccountId").notNull(),
  fullName: varchar("fullName", { length: 256 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  cadre: varchar("cadre", { length: 128 }).notNull(),
  cadreOther: varchar("cadreOther", { length: 128 }),
  higherDiploma: varchar("higherDiploma", { length: 256 }),
  department: varchar("department", { length: 256 }).notNull(),
  /** Canonical IERS facility-department identity when the registration belongs to that institution. */
  facilityDepartmentId: int("facilityDepartmentId"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  attendanceType: mysqlEnum("attendanceType", ["primary_facility", "locum_outreach", "guest_external"]).default("primary_facility").notNull(),
  roleInEvent: mysqlEnum("roleInEvent", ["attendee", "presenter", "co_presenter", "moderator"]).default("attendee").notNull(),
  checkInPunctuality: mysqlEnum("checkInPunctuality", ["on_time", "late_15m", "late_30m+"]).default("on_time").notNull(),
  clinicalTakeaway: text("clinicalTakeaway"),
});

export type CpdAttendee = typeof cpdAttendees.$inferSelect;
export type InsertCpdAttendee = typeof cpdAttendees.$inferInsert;

/** Logs tracking when CPD secret codes are revealed to attendees for auditing/sharing prevention. */
export const cpdCodeRevealLogs = mysqlTable("cpdCodeRevealLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cpdAttendeeId: int("cpdAttendeeId").notNull(),
  cpdEventId: int("cpdEventId").notNull(),
  revealedAt: timestamp("revealedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 512 }),
});

export type CpdCodeRevealLog = typeof cpdCodeRevealLogs.$inferSelect;
export type InsertCpdCodeRevealLog = typeof cpdCodeRevealLogs.$inferInsert;

/** Kenya Master Health Facility Registry (KMHFL) facilities seed table for institutional onboarding autocomplete. */
export const kmhflFacilities = mysqlTable("kmhflFacilities", {
  id: int("id").autoincrement().primaryKey(),
  /** Facility name from KMHFL registry (searchable). */
  name: varchar("name", { length: 255 }).notNull(),
  /** KMHFL facility code / registration number (may be null for some facilities). */
  code: varchar("code", { length: 64 }),
  /** County name where the facility is located. */
  county: varchar("county", { length: 100 }),
  /** Facility type (e.g., "hospital", "clinic", "health_center"). */
  facilityType: varchar("facilityType", { length: 100 }),
  /** Operational status (e.g., "operational", "non_operational"). */
  operationalStatus: varchar("operationalStatus", { length: 50 }),
  /** Timestamp when the record was created or last synced from KMHFL. */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KmhflFacility = typeof kmhflFacilities.$inferSelect;
export type InsertKmhflFacility = typeof kmhflFacilities.$inferInsert;

/**
 * Global Facilities Reference Table (migration 0059).
 * Implements Observation Architecture v1.1 §5.1 "Global Geographic Hierarchy":
 * Country → admin_level_1 → admin_level_2 → Facility, portable to any country
 * from day one (North Star v2.0 §7.3 "Global from Day One").
 *
 * ADDITIVE — does not replace careFacilities or kmhflFacilities yet.
 * Those keep being used by existing code until a later, separate migration
 * repoints the app at this table (see legacy_care_facility_id / legacy_kmhfl_facility_id
 * bridge columns, reserved for that future step).
 */
export const facilities = mysqlTable("facilities", {
  facilityId: varchar("facility_id", { length: 36 }).primaryKey(),
  internalName: varchar("internal_name", { length: 255 }).notNull(),
  /** ISO 3166-1 alpha-2 (e.g. "KE", "UG"). */
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  /** County / state / province / region. */
  adminLevel1: varchar("admin_level_1", { length: 128 }),
  /** Sub-county / district, where available. */
  adminLevel2: varchar("admin_level_2", { length: 128 }),
  /** Country-specific level label as commonly used locally (e.g. "Level 4"). */
  facilityLevel: varchar("facility_level", { length: 64 }),
  /** WHO Level 1-6 equivalent, for cross-country analysis. */
  facilityLevelWho: varchar("facility_level_who", { length: 16 }),
  facilityOwnership: mysqlEnum("facility_ownership", [
    "GOVERNMENT", "FAITH_BASED", "PRIVATE_FOR_PROFIT",
    "PRIVATE_NOT_FOR_PROFIT", "MILITARY", "OTHER",
  ]),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  /** Where this row came from, for re-sync and dedupe. */
  source: mysqlEnum("source", [
    "HEALTHSITES_IO", "KMHFL", "OTHER_NATIONAL_REGISTRY", "MANUAL",
  ]).default("MANUAL").notNull(),
  /** Original ID in the source system, e.g. healthsites.io node id or KMHFL code. */
  sourceRecordId: varchar("source_record_id", { length: 128 }),
  /** Bridges to existing careFacilities.id during a later migration — not yet used. */
  legacyCareFacilityId: int("legacy_care_facility_id"),
  /** Bridges to existing kmhflFacilities.id during a later migration — not yet used. */
  legacyKmhflFacilityId: int("legacy_kmhfl_facility_id"),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type FacilityRow = typeof facilities.$inferSelect;
export type InsertFacility = typeof facilities.$inferInsert;

/**
 * Failure Pattern Knowledge Base (FPKB) — Drizzle bindings for the 11 `kb_` tables
 * created by migration 0057 (scripts/apply-0057-fpkb-schema.mjs) and seeded by
 * migration 0058. Implements FPKB_SCHEMA_V1.md §5.3 and North Star v2.0 Stage 6
 * of the holistic loop ("System intelligence → Knowledge Base").
 *
 * These tables already exist in production. This block does not change schema —
 * it gives the application (routers, UI) typed read/write access to data that,
 * until now, only existed as raw rows nobody queried.
 */

const KB_FAILURE_DOMAINS = [
  "RECOGNITION", "ESCALATION", "VASCULAR_ACCESS", "TREATMENT",
  "REFERRAL", "MONITORING", "COMMUNICATION", "RESOURCE_AVAILABILITY",
] as const;

export const kbFailureModes = mysqlTable("kb_failure_modes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  failureModeCode: varchar("failure_mode_code", { length: 64 }).notNull().unique(),
  failureDomain: mysqlEnum("failure_domain", KB_FAILURE_DOMAINS).notNull(),
  failureModeName: varchar("failure_mode_name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  /** JSON array of condition_category values. */
  conditionCategories: text("condition_categories"),
  taxonomyVersion: varchar("taxonomy_version", { length: 16 }).default("1.0").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  retiredAt: timestamp("retired_at"),
  retiredReason: text("retired_reason"),
});
export type KbFailureMode = typeof kbFailureModes.$inferSelect;
export type InsertKbFailureMode = typeof kbFailureModes.$inferInsert;

export const kbSuccessFactors = mysqlTable("kb_success_factors", {
  id: varchar("id", { length: 36 }).primaryKey(),
  successFactorCode: varchar("success_factor_code", { length: 64 }).notNull().unique(),
  successDomain: mysqlEnum("success_domain", KB_FAILURE_DOMAINS).notNull(),
  successFactorName: varchar("success_factor_name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  conditionCategories: text("condition_categories"),
  taxonomyVersion: varchar("taxonomy_version", { length: 16 }).default("1.0").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  retiredAt: timestamp("retired_at"),
  retiredReason: text("retired_reason"),
});
export type KbSuccessFactor = typeof kbSuccessFactors.$inferSelect;
export type InsertKbSuccessFactor = typeof kbSuccessFactors.$inferInsert;

export const kbPatterns = mysqlTable("kb_patterns", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patternTrack: mysqlEnum("pattern_track", ["FAILURE", "SUCCESS"]).notNull(),
  patternCode: varchar("pattern_code", { length: 64 }).notNull().unique(),
  patternName: varchar("pattern_name", { length: 512 }).notNull(),
  primaryDomain: mysqlEnum("primary_domain", KB_FAILURE_DOMAINS).notNull(),
  description: text("description").notNull(),
  confidenceLevel: mysqlEnum("confidence_level", [
    "SIGNAL", "CANDIDATE", "CONFIRMED", "ESTABLISHED",
    "CANDIDATE_SUCCESS", "EMERGING_SUCCESS", "VALIDATED_SUCCESS", "STANDARD_PRACTICE",
  ]).default("SIGNAL").notNull(),
  /** JSON: {clinical, statistical, external_evidence, platform_replication, geographic_diversity, recency} */
  confidenceDimensions: text("confidence_dimensions").notNull(),
  supportingObservationCount: int("supporting_observation_count").default(0).notNull(),
  firstDetectedAt: timestamp("first_detected_at"),
  lastConfirmedAt: timestamp("last_confirmed_at"),
  trendDirection: mysqlEnum("trend_direction", ["INCREASING", "DECREASING", "STABLE", "INSUFFICIENT_DATA"]),
  /** JSON array of country codes. */
  geographicScope: text("geographic_scope"),
  /** JSON array of admin_level_1 values. */
  adminScope: text("admin_scope"),
  /** JSON array of condition_category values. */
  conditionScope: text("condition_scope"),
  facilityLevelScope: text("facility_level_scope"),
  cadreScope: text("cadre_scope"),
  /** JSON: {L0,L1,L2,L3,L4,L5: count} */
  preventabilityDistribution: text("preventability_distribution"),
  taxonomyVersion: varchar("taxonomy_version", { length: 16 }).default("1.0").notNull(),
  knowledgeStatus: mysqlEnum("knowledge_status", ["ACTIVE", "UNDER_REVIEW", "RETIRED"]).default("ACTIVE").notNull(),
  reviewDueAt: timestamp("review_due_at"),
  retiredAt: timestamp("retired_at"),
  retiredReason: text("retired_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  createdBy: varchar("created_by", { length: 36 }).default("system").notNull(),
});
export type KbPattern = typeof kbPatterns.$inferSelect;
export type InsertKbPattern = typeof kbPatterns.$inferInsert;

export const kbPatternModes = mysqlTable("kb_pattern_modes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patternId: varchar("pattern_id", { length: 36 }).notNull(),
  /** FK to kb_failure_modes.id OR kb_success_factors.id, disambiguated by modeTrack. */
  modeId: varchar("mode_id", { length: 36 }).notNull(),
  modeTrack: mysqlEnum("mode_track", ["FAILURE", "SUCCESS"]).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  sequencePosition: int("sequence_position"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type KbPatternMode = typeof kbPatternModes.$inferSelect;
export type InsertKbPatternMode = typeof kbPatternModes.$inferInsert;

export const kbPatternObservations = mysqlTable("kb_pattern_observations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patternId: varchar("pattern_id", { length: 36 }).notNull(),
  observationSource: mysqlEnum("observation_source", [
    "CARE_SIGNAL", "SAFE_TRUTH", "RESUSGPS", "ASSESSMENT", "INSTITUTIONAL_AUDIT",
  ]).notNull(),
  /** Soft reference — not a DB FK (cross-table flexibility). */
  observationId: varchar("observation_id", { length: 36 }).notNull(),
  /** careSignalEvents | parentSafeTruthSubmissions | resusGPSCases | etc. */
  observationTable: varchar("observation_table", { length: 64 }).notNull(),
  country: varchar("country", { length: 2 }),
  adminLevel1: varchar("admin_level_1", { length: 128 }),
  facilityLevel: varchar("facility_level", { length: 32 }),
  conditionCategory: varchar("condition_category", { length: 64 }),
  /** EAT YYYY-MM. */
  observationPeriod: varchar("observation_period", { length: 7 }).notNull(),
  linkedAt: timestamp("linked_at").defaultNow().notNull(),
  linkedBy: varchar("linked_by", { length: 36 }).default("system").notNull(),
  taxonomyVersionAtLink: varchar("taxonomy_version_at_link", { length: 16 }).default("1.0").notNull(),
});
export type KbPatternObservation = typeof kbPatternObservations.$inferSelect;
export type InsertKbPatternObservation = typeof kbPatternObservations.$inferInsert;

export const kbEvidenceLinks = mysqlTable("kb_evidence_links", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patternId: varchar("pattern_id", { length: 36 }).notNull(),
  evidenceSourceType: mysqlEnum("evidence_source_type", ["OBSERVATIONAL", "EXPERIMENTAL", "EXPERT", "ADAPTIVE"]).notNull(),
  evidenceDescription: text("evidence_description").notNull(),
  evidenceDirection: mysqlEnum("evidence_direction", ["SUPPORTS", "CHALLENGES", "NEUTRAL", "SUPERSEDES"]).notNull(),
  citation: text("citation"),
  guidelineBody: varchar("guideline_body", { length: 255 }),
  guidelineYear: int("guideline_year"),
  lmicApplicability: mysqlEnum("lmic_applicability", ["HIGH", "MODERATE", "LOW", "NOT_ASSESSED"]),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  addedBy: varchar("added_by", { length: 36 }).notNull(),
});
export type KbEvidenceLink = typeof kbEvidenceLinks.$inferSelect;
export type InsertKbEvidenceLink = typeof kbEvidenceLinks.$inferInsert;

export const kbRecommendations = mysqlTable("kb_recommendations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sourcePatternId: varchar("source_pattern_id", { length: 36 }).notNull(),
  recommendationCode: varchar("recommendation_code", { length: 64 }).notNull(),
  recommendationType: mysqlEnum("recommendation_type", [
    "TRAINING", "PROCUREMENT", "PROTOCOL", "STAFFING",
    "RESUSGPS_UPDATE", "CURRICULUM_UPDATE", "CARE_SIGNAL_RULE", "INSTITUTIONAL_PROCESS", "OTHER",
  ]).notNull(),
  recommendationText: text("recommendation_text").notNull(),
  targetAudience: mysqlEnum("target_audience", [
    "INDIVIDUAL_PROVIDER", "FACILITY", "NETWORK", "MINISTRY", "CURRICULUM_TEAM", "RESUSGPS_TEAM",
  ]).notNull(),
  confidenceLevelAtGeneration: varchar("confidence_level_at_generation", { length: 64 }).notNull(),
  /** JSON: {observational_count, experimental_references, expert_references, adaptive_evidence} */
  evidenceBasis: text("evidence_basis").notNull(),
  governanceStatus: mysqlEnum("governance_status", ["PENDING", "APPROVED", "REJECTED", "SUPERSEDED"]).default("PENDING").notNull(),
  governanceApprovedBy: varchar("governance_approved_by", { length: 36 }),
  governanceApprovedAt: timestamp("governance_approved_at"),
  governanceNotes: text("governance_notes"),
  supersededById: varchar("superseded_by_id", { length: 36 }),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 36 }).default("system").notNull(),
});
export type KbRecommendation = typeof kbRecommendations.$inferSelect;
export type InsertKbRecommendation = typeof kbRecommendations.$inferInsert;

export const kbInterventions = mysqlTable("kb_interventions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  recommendationId: varchar("recommendation_id", { length: 36 }).notNull(),
  committingEntityType: mysqlEnum("committing_entity_type", [
    "FACILITY", "NETWORK", "MINISTRY", "TRAINING_INSTITUTION", "OTHER",
  ]).notNull(),
  /** facility UUID or other entity ID — never a facility name. */
  committingEntityId: varchar("committing_entity_id", { length: 36 }).notNull(),
  interventionScope: mysqlEnum("intervention_scope", ["ED_ONLY", "WARD", "HOSPITAL_WIDE", "NETWORK", "NATIONAL"]).notNull(),
  interventionDescription: text("intervention_description").notNull(),
  plannedImplementationDate: date("planned_implementation_date"),
  definedOutcomeMeasure: text("defined_outcome_measure").notNull(),
  evaluationWindowMonths: int("evaluation_window_months").default(6).notNull(),
  interventionStatus: mysqlEnum("intervention_status", ["PLANNED", "IN_PROGRESS", "COMPLETED", "ABANDONED"]).default("PLANNED").notNull(),
  statusUpdatedAt: timestamp("status_updated_at"),
  abandonmentReason: text("abandonment_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type KbIntervention = typeof kbInterventions.$inferSelect;
export type InsertKbIntervention = typeof kbInterventions.$inferInsert;

export const kbImplementations = mysqlTable("kb_implementations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  interventionId: varchar("intervention_id", { length: 36 }).notNull(),
  actualImplementationDate: date("actual_implementation_date"),
  actualScope: mysqlEnum("actual_scope", ["ED_ONLY", "WARD", "HOSPITAL_WIDE", "NETWORK", "NATIONAL"]),
  modificationsFromPlan: text("modifications_from_plan"),
  implementationFidelity: mysqlEnum("implementation_fidelity", ["HIGH", "PARTIAL", "LOW", "NOT_IMPLEMENTED"]),
  /** NEVER auto-assigned — requires human Knowledge Stewardship review. */
  outcomeLabel: mysqlEnum("outcome_label", ["IMPROVED", "NO_IMPROVEMENT", "WORSENED", "EVALUATION_PENDING"]),
  outcomeEvidenceNotes: text("outcome_evidence_notes"),
  /** JSON array of observation IDs. */
  outcomeObservationIds: text("outcome_observation_ids"),
  outcomeRecordedAt: timestamp("outcome_recorded_at"),
  outcomeRecordedBy: varchar("outcome_recorded_by", { length: 36 }),
  confidenceImpactApplied: boolean("confidence_impact_applied").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type KbImplementation = typeof kbImplementations.$inferSelect;
export type InsertKbImplementation = typeof kbImplementations.$inferInsert;

export const kbReviewSchedule = mysqlTable("kb_review_schedule", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patternId: varchar("pattern_id", { length: 36 }).notNull(),
  reviewDueAt: timestamp("review_due_at").notNull(),
  reviewType: mysqlEnum("review_type", [
    "SCHEDULED", "TRIGGERED_BY_NEW_EVIDENCE", "TRIGGERED_BY_CONCEPT_DRIFT", "MANUAL",
  ]).notNull(),
  reviewStatus: mysqlEnum("review_status", ["PENDING", "IN_PROGRESS", "COMPLETED", "DEFERRED"]).default("PENDING").notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by", { length: 36 }),
  reviewOutcome: mysqlEnum("review_outcome", [
    "CONFIDENCE_MAINTAINED", "CONFIDENCE_UPGRADED", "CONFIDENCE_DOWNGRADED",
    "PATTERN_RETIRED", "PATTERN_SPLIT", "DEFERRED_TO_NEXT_CYCLE",
  ]),
  reviewNotes: text("review_notes"),
  nextReviewDueAt: timestamp("next_review_due_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type KbReviewScheduleRow = typeof kbReviewSchedule.$inferSelect;
export type InsertKbReviewSchedule = typeof kbReviewSchedule.$inferInsert;

export const kbContentVersions = mysqlTable("kb_content_versions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  contentType: mysqlEnum("content_type", [
    "RESUSGPS_PATHWAY", "MICROCOURSE_CONTENT", "CARE_SIGNAL_RULE",
    "FELLOWSHIP_CURRICULUM", "ERS_STANDARD", "OTHER",
  ]).notNull(),
  contentIdentifier: varchar("content_identifier", { length: 255 }).notNull(),
  contentVersion: varchar("content_version", { length: 32 }).notNull(),
  changeDescription: text("change_description").notNull(),
  /** JSON array of kb_patterns.id. */
  sourcePatternIds: text("source_pattern_ids"),
  /** JSON array of kb_recommendations.id. */
  sourceRecommendationIds: text("source_recommendation_ids"),
  externalGuidelineReference: text("external_guideline_reference"),
  knowledgeStewardshipApprovedBy: varchar("knowledge_stewardship_approved_by", { length: 36 }).notNull(),
  knowledgeStewardshipApprovedAt: timestamp("knowledge_stewardship_approved_at").notNull(),
  deployedAt: timestamp("deployed_at"),
  deprecatedAt: timestamp("deprecated_at"),
  deprecatedByVersionId: varchar("deprecated_by_version_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type KbContentVersion = typeof kbContentVersions.$inferSelect;
export type InsertKbContentVersion = typeof kbContentVersions.$inferInsert;

/** Append-only — no UPDATE or DELETE ever permitted on this table. */
export const kbGovernanceAudit = mysqlTable("kb_governance_audit", {
  id: varchar("id", { length: 36 }).primaryKey(),
  /** "system" for automated actions. */
  actorUserId: varchar("actor_user_id", { length: 36 }).notNull(),
  actionType: mysqlEnum("action_type", [
    "PATTERN_CREATED", "PATTERN_CONFIDENCE_CHANGED", "PATTERN_RETIRED", "PATTERN_REINSTATED",
    "RECOMMENDATION_APPROVED", "RECOMMENDATION_REJECTED", "RECOMMENDATION_SUPERSEDED",
    "CONTENT_VERSION_APPROVED", "CONTENT_VERSION_DEPLOYED",
    "IMPLEMENTATION_OUTCOME_LABELLED", "REVIEW_COMPLETED", "OTHER",
  ]).notNull(),
  entityType: mysqlEnum("entity_type", [
    "PATTERN", "FAILURE_MODE", "SUCCESS_FACTOR", "RECOMMENDATION",
    "INTERVENTION", "IMPLEMENTATION", "CONTENT_VERSION", "REVIEW",
  ]).notNull(),
  entityId: varchar("entity_id", { length: 36 }).notNull(),
  /** JSON — null for creation actions. */
  previousState: text("previous_state"),
  /** JSON — null for deletion actions. */
  newState: text("new_state"),
  reasoning: text("reasoning"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type KbGovernanceAuditRow = typeof kbGovernanceAudit.$inferSelect;
export type InsertKbGovernanceAudit = typeof kbGovernanceAudit.$inferInsert;

/**
 * Append-only log written exclusively by the trg_care_signal_raw_narrative_immutable
 * DB trigger (migration 0061) when the legal-override session variable path is used.
 * Should almost never have rows — its existence, not its contents, is the point.
 */
export const careSignalRawNarrativeAudit = mysqlTable("care_signal_raw_narrative_audit", {
  id: int("id").autoincrement().primaryKey(),
  careSignalEventId: int("care_signal_event_id").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  reason: text("reason").notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});
export type CareSignalRawNarrativeAuditRow = typeof careSignalRawNarrativeAudit.$inferSelect;

// ============================================
// IERMS™ INSTITUTIONAL READINESS TABLES
// ============================================

// 1. Facility Poles (Geographic ERT Zones)
export const facilityPoles = mysqlTable("facility_poles", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  poleName: varchar("pole_name", { length: 128 }).notNull(),
  description: text("description"),
  /** 1-based display order for institution-defined poles; not limited to North/South. */
  poleOrder: int("pole_order"),
  /** Monday anchor for deterministic weekly ERTL rotation within this pole. */
  rotationAnchorDate: date("rotation_anchor_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type FacilityPole = typeof facilityPoles.$inferSelect;
export type InsertFacilityPole = typeof facilityPoles.$inferInsert;

/** One durable administrator decision for a literal CPD `Other` attendance row. */
export const institutionCpdDepartmentResolutions = mysqlTable("institution_cpd_department_resolutions", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutional_account_id").notNull(),
  cpdAttendeeId: int("cpd_attendee_id").notNull(),
  recordedDepartment: varchar("recorded_department", { length: 256 }).notNull(),
  facilityDepartmentId: int("facility_department_id"),
  status: mysqlEnum("status", ["resolved", "deferred", "dismissed", "open"]).default("open").notNull(),
  resolvedByUserId: int("resolved_by_user_id"),
  resolvedAt: timestamp("resolved_at"),
  decisionReason: text("decision_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  attendeeUnique: uniqueIndex("inst_cpd_dept_resolution_attendee_uq").on(table.institutionalAccountId, table.cpdAttendeeId),
  institutionStatusIndex: index("inst_cpd_dept_resolution_inst_status_idx").on(table.institutionalAccountId, table.status),
}));
export type InstitutionCpdDepartmentResolution = typeof institutionCpdDepartmentResolutions.$inferSelect;
export type InsertInstitutionCpdDepartmentResolution = typeof institutionCpdDepartmentResolutions.$inferInsert;

// 2. Department Mapping to Poles
export const facilityDepartments = mysqlTable("facility_departments", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  poleId: int("pole_id"),
  departmentName: varchar("department_name", { length: 128 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  /** Explicit account-admin decision: only these confirmed active departments require an IERS pole. */
  requiresPole: boolean("requires_pole").default(false).notNull(),
  /** Stable 1-based order within the current pole; used for automatic weekly ERTL rotation. */
  poleSequence: int("pole_sequence"),
  confirmedAt: timestamp("confirmed_at"),
  confirmedByUserId: int("confirmed_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  iersPoleRequirementIndex: index("facility_depts_iers_pole_req_idx").on(table.institutionId, table.isActive, table.requiresPole, table.poleId),
}));
export type FacilityDepartment = typeof facilityDepartments.$inferSelect;
export type InsertFacilityDepartment = typeof facilityDepartments.$inferInsert;

/** Department-scoped CPD Education Coordinator assignments; independent of IERS response roles. */
export const institutionEducationCoordinators = mysqlTable("institutionEducationCoordinators", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  departmentId: int("departmentId").notNull(),
  userId: int("userId").notNull(),
  assignmentStatus: mysqlEnum("assignmentStatus", ["active", "ended"]).default("active").notNull(),
  assignedByUserId: int("assignedByUserId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  departmentIndex: index("institution_education_coordinators_department_idx").on(table.institutionalAccountId, table.departmentId, table.assignmentStatus),
  userIndex: index("institution_education_coordinators_user_idx").on(table.institutionalAccountId, table.userId, table.assignmentStatus),
}));
export type InstitutionEducationCoordinator = typeof institutionEducationCoordinators.$inferSelect;
export type InsertInstitutionEducationCoordinator = typeof institutionEducationCoordinators.$inferInsert;

/** Facility, department, or individual learning expectations for a bounded reporting period. */
export const institutionLearningTargets = mysqlTable("institutionLearningTargets", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  targetScope: mysqlEnum("targetScope", ["facility", "department", "individual"]).notNull(),
  departmentId: int("departmentId"),
  userId: int("userId"),
  metricKey: mysqlEnum("metricKey", ["cpd_sessions", "cpd_attendance_rate", "cne_sessions", "clinical_cpd_sessions", "m_and_m_sessions", "life_support_completed", "course_phase_completion"]).notNull(),
  periodType: mysqlEnum("periodType", ["monthly", "quarterly", "annual"]).notNull(),
  periodStart: date("periodStart").notNull(),
  periodEnd: date("periodEnd").notNull(),
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }).notNull(),
  courseProgramType: mysqlEnum("courseProgramType", ["bls", "acls", "pals", "nrp", "heartsaver", "instructor"]),
  coursePhase: mysqlEnum("coursePhase", ["cognitive", "phase_2", "phase_3", "completed"]),
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  periodIndex: index("institution_learning_targets_period_idx").on(table.institutionalAccountId, table.status, table.periodStart, table.periodEnd),
  scopeIndex: index("institution_learning_targets_scope_idx").on(table.institutionalAccountId, table.targetScope, table.departmentId, table.userId),
}));
export type InstitutionLearningTarget = typeof institutionLearningTargets.$inferSelect;
export type InsertInstitutionLearningTarget = typeof institutionLearningTargets.$inferInsert;

/** Structured provider credentials: regulatory licences, Paeds Resus-derived competencies, and external AHA certificates. */
export const professionalCredentials = mysqlTable("professionalCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  credentialType: mysqlEnum("credentialType", [
    "regulatory_license",
    "paeds_resus_bls_cognitive",
    "paeds_resus_bls_simulation",
    "paeds_resus_bls_provider",
    "external_aha_bls",
    "external_aha_acls",
    "external_aha_pals",
    "external_aha_nrp",
    "external_aha_other",
  ]).notNull(),
  sourceType: mysqlEnum("sourceType", ["regulatory", "paeds_resus", "external_aha", "legacy_import"]).notNull(),
  issuer: varchar("issuer", { length: 255 }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 128 }),
  cadre: varchar("cadre", { length: 128 }),
  credentialNumber: varchar("credentialNumber", { length: 255 }),
  issuedAt: timestamp("issuedAt"),
  expiresAt: timestamp("expiresAt"),
  status: mysqlEnum("status", ["pending", "verified", "rejected", "revoked", "superseded"]).default("pending").notNull(),
  evidenceKey: varchar("evidenceKey", { length: 512 }),
  evidenceFileName: varchar("evidenceFileName", { length: 255 }),
  evidenceContentType: varchar("evidenceContentType", { length: 128 }),
  evidenceSizeBytes: int("evidenceSizeBytes"),
  verifiedByUserId: int("verifiedByUserId"),
  verifiedAt: timestamp("verifiedAt"),
  reviewReason: text("reviewReason"),
  sourceRecordType: varchar("sourceRecordType", { length: 128 }),
  sourceRecordId: int("sourceRecordId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  userIndex: index("professional_credentials_user_idx").on(table.userId, table.status),
  expiryIndex: index("professional_credentials_expiry_idx").on(table.status, table.expiresAt),
  sourceIndex: index("professional_credentials_source_idx").on(table.sourceType, table.sourceRecordType, table.sourceRecordId),
  sourceRecordUnique: uniqueIndex("professional_credentials_source_record_uq").on(table.userId, table.credentialType, table.sourceRecordType, table.sourceRecordId),
}));
export type ProfessionalCredential = typeof professionalCredentials.$inferSelect;
export type InsertProfessionalCredential = typeof professionalCredentials.$inferInsert;

/** Idempotent reminder delivery ledger for credential expiry notifications. */
export const professionalCredentialReminderEvents = mysqlTable("professionalCredentialReminderEvents", {
  id: int("id").autoincrement().primaryKey(),
  credentialId: int("credentialId").notNull(),
  userId: int("userId").notNull(),
  reminderStage: mysqlEnum("reminderStage", ["three_months", "two_months", "one_month", "weekly_overdue"]).notNull(),
  duePeriod: date("duePeriod").notNull(),
  channel: mysqlEnum("channel", ["in_app", "email"]).notNull(),
  deliveryStatus: mysqlEnum("deliveryStatus", ["queued", "sent", "failed"]).default("queued").notNull(),
  sentAt: timestamp("sentAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  dedupeUnique: uniqueIndex("professional_credential_reminder_dedupe_uq").on(table.credentialId, table.reminderStage, table.duePeriod, table.channel),
  userIndex: index("professional_credential_reminder_user_idx").on(table.userId, table.duePeriod),
}));
export type ProfessionalCredentialReminderEvent = typeof professionalCredentialReminderEvents.$inferSelect;
export type InsertProfessionalCredentialReminderEvent = typeof professionalCredentialReminderEvents.$inferInsert;

/** One active Departmental Head appointment per institution and canonical department. */
export const institutionDepartmentHeads = mysqlTable("institutionDepartmentHeads", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  departmentId: int("departmentId").notNull(),
  userId: int("userId").notNull(),
  assignmentStatus: mysqlEnum("assignmentStatus", ["active", "ended"]).default("active").notNull(),
  activeAssignmentKey: varchar("activeAssignmentKey", { length: 128 }),
  assignedByUserId: int("assignedByUserId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  departmentIndex: index("institution_department_heads_department_idx").on(table.institutionalAccountId, table.departmentId, table.assignmentStatus),
  userIndex: index("institution_department_heads_user_idx").on(table.institutionalAccountId, table.userId, table.assignmentStatus),
  activeAssignmentUnique: uniqueIndex("institution_department_heads_active_uq").on(table.activeAssignmentKey),
}));
export type InstitutionDepartmentHead = typeof institutionDepartmentHeads.$inferSelect;
export type InsertInstitutionDepartmentHead = typeof institutionDepartmentHeads.$inferInsert;

/** Append-only history for Departmental Head assignment, reassignment, and ending. */
export const institutionDepartmentHeadEvents = mysqlTable("institutionDepartmentHeadEvents", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutionalAccountId").notNull(),
  departmentId: int("departmentId").notNull(),
  assignmentId: int("assignmentId").notNull(),
  eventType: mysqlEnum("eventType", ["assigned", "reassigned", "ended"]).notNull(),
  previousUserId: int("previousUserId"),
  currentUserId: int("currentUserId"),
  actorUserId: int("actorUserId").notNull(),
  note: varchar("note", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  assignmentIndex: index("institution_department_head_events_assignment_idx").on(table.assignmentId, table.createdAt),
  institutionIndex: index("institution_department_head_events_institution_idx").on(table.institutionalAccountId, table.createdAt),
}));
export type InstitutionDepartmentHeadEvent = typeof institutionDepartmentHeadEvents.$inferSelect;
export type InsertInstitutionDepartmentHeadEvent = typeof institutionDepartmentHeadEvents.$inferInsert;

/** Current review state for one normalized historic CPD department label per institution. */
export const institutionDepartmentReconciliations = mysqlTable("institution_department_reconciliations", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutional_account_id").notNull(),
  /** Lowercase, whitespace-collapsed key; rawLabel remains the first observed reporting text. */
  normalizedLabel: varchar("normalized_label", { length: 256 }).notNull(),
  rawLabel: varchar("raw_label", { length: 256 }).notNull(),
  status: mysqlEnum("status", ["open", "mapped", "deferred", "dismissed"]).default("open").notNull(),
  suggestedCatalogLabel: varchar("suggested_catalog_label", { length: 256 }),
  suggestionConfidence: mysqlEnum("suggestion_confidence", ["none", "exact", "alias", "ambiguous"]).default("none").notNull(),
  reviewedFacilityDepartmentId: int("reviewed_facility_department_id"),
  reviewedByUserId: int("reviewed_by_user_id"),
  reviewedAt: timestamp("reviewed_at"),
  reviewReason: text("review_reason"),
  backfilledCount: int("backfilled_count").default(0).notNull(),
  backfilledByUserId: int("backfilled_by_user_id"),
  backfilledAt: timestamp("backfilled_at"),
  firstUsedAt: timestamp("first_used_at").notNull(),
  lastUsedAt: timestamp("last_used_at").notNull(),
  attendanceCount: int("attendance_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionLabelUnique: uniqueIndex("inst_dept_recon_institution_label_uq").on(table.institutionalAccountId, table.normalizedLabel),
  institutionStatusIndex: index("inst_dept_recon_inst_status_idx").on(table.institutionalAccountId, table.status),
}));
export type InstitutionDepartmentReconciliation = typeof institutionDepartmentReconciliations.$inferSelect;
export type InsertInstitutionDepartmentReconciliation = typeof institutionDepartmentReconciliations.$inferInsert;

/** Append-only record of department mapping, review, backfill, and pole-eligibility decisions. */
export const institutionDepartmentAuditEvents = mysqlTable("institution_department_audit_events", {
  id: int("id").autoincrement().primaryKey(),
  institutionalAccountId: int("institutional_account_id").notNull(),
  reconciliationId: int("reconciliation_id"),
  departmentId: int("department_id"),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  previousStatus: varchar("previous_status", { length: 32 }),
  currentStatus: varchar("current_status", { length: 32 }),
  previousDepartmentId: int("previous_department_id"),
  currentDepartmentId: int("current_department_id"),
  previousRequiresPole: boolean("previous_requires_pole"),
  currentRequiresPole: boolean("current_requires_pole"),
  backfilledCount: int("backfilled_count").default(0).notNull(),
  actorUserId: int("actor_user_id").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  institutionEventIndex: index("inst_dept_audit_inst_created_idx").on(table.institutionalAccountId, table.createdAt),
  reconciliationEventIndex: index("inst_dept_audit_recon_created_idx").on(table.reconciliationId, table.createdAt),
  departmentEventIndex: index("inst_dept_audit_dept_created_idx").on(table.departmentId, table.createdAt),
}));
export type InstitutionDepartmentAuditEvent = typeof institutionDepartmentAuditEvents.$inferSelect;
export type InsertInstitutionDepartmentAuditEvent = typeof institutionDepartmentAuditEvents.$inferInsert;

/** Exactly one standing Emergency Response Coordinator (ERCo) assignment per department. */
export const institutionDepartmentResponseCoordinators = mysqlTable("institution_department_response_coordinators", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  departmentId: int("department_id").notNull(),
  coordinatorUserId: int("coordinator_user_id").notNull(),
  backupUserId: int("backup_user_id"),
  assignmentStatus: mysqlEnum("assignment_status", ["pending_acceptance", "active", "declined", "ended"]).default("pending_acceptance").notNull(),
  effectiveFrom: date("effective_from").notNull(),
  effectiveUntil: date("effective_until"),
  assignedByUserId: int("assigned_by_user_id").notNull(),
  acceptedAt: timestamp("accepted_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: varchar("decline_reason", { length: 500 }),
  backupAcceptedAt: timestamp("backup_accepted_at"),
  backupDeclinedAt: timestamp("backup_declined_at"),
  backupDeclineReason: varchar("backup_decline_reason", { length: 500 }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionDepartmentUnique: uniqueIndex("institution_department_erc_unique").on(table.institutionId, table.departmentId),
  coordinatorIndex: index("institution_erc_coordinator_idx").on(table.institutionId, table.coordinatorUserId),
  backupIndex: index("institution_erc_backup_idx").on(table.institutionId, table.backupUserId),
  statusIndex: index("institution_erc_status_idx").on(table.institutionId, table.assignmentStatus),
}));
export type InstitutionDepartmentResponseCoordinator = typeof institutionDepartmentResponseCoordinators.$inferSelect;
export type InsertInstitutionDepartmentResponseCoordinator = typeof institutionDepartmentResponseCoordinators.$inferInsert;

export const institutionDepartmentResponseCoordinatorEvents = mysqlTable("institution_department_response_coordinator_events", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  departmentId: int("department_id").notNull(),
  assignmentId: int("assignment_id").notNull(),
  eventType: mysqlEnum("event_type", ["assigned", "reassigned", "accepted", "declined", "backup_accepted", "backup_declined", "ended"]).notNull(),
  actorUserId: int("actor_user_id").notNull(),
  note: varchar("note", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  assignmentIndex: index("institution_erc_event_assignment_idx").on(table.assignmentId, table.createdAt),
  institutionIndex: index("institution_erc_event_institution_idx").on(table.institutionId, table.createdAt),
}));
export type InstitutionDepartmentResponseCoordinatorEvent = typeof institutionDepartmentResponseCoordinatorEvents.$inferSelect;
export type InsertInstitutionDepartmentResponseCoordinatorEvent = typeof institutionDepartmentResponseCoordinatorEvents.$inferInsert;

// 3. Weekly ERTL Department Rotation
export const ertlWeeklyRotations = mysqlTable("ertl_weekly_rotations", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  poleId: int("pole_id").notNull(),
  departmentId: int("department_id").notNull(),
  weekNumber: int("week_number").notNull(),
  year: int("year").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  ertlUserId: int("ertl_user_id"),
  assignmentStatus: mysqlEnum("assignment_status", ["unassigned", "pending_acceptance", "active", "declined", "ended"]).default("unassigned").notNull(),
  acceptedAt: timestamp("accepted_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: varchar("decline_reason", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ErtlWeeklyRotation = typeof ertlWeeklyRotations.$inferSelect;
export type InsertErtlWeeklyRotation = typeof ertlWeeklyRotations.$inferInsert;

/**
 * Department-owned monthly UTL rotation. One row is the source of truth for a
 * department's nominated provider for a calendar month; dated shift rosters
 * point back to it so future changes can be propagated safely.
 */
export const monthlyUtlRotations = mysqlTable("monthly_utl_rotations", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  poleId: int("pole_id").notNull(),
  departmentId: int("department_id").notNull(),
  monthStart: date("month_start").notNull(),
  providerUserId: int("provider_user_id"),
  assignmentStatus: mysqlEnum("assignment_status", ["unassigned", "pending_acceptance", "active", "declined", "ended"]).default("unassigned").notNull(),
  acceptedAt: timestamp("accepted_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: varchar("decline_reason", { length: 500 }),
  assignedByUserId: int("assigned_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionDepartmentMonthUnique: uniqueIndex("monthly_utl_rotation_unique").on(table.institutionId, table.departmentId, table.monthStart),
  departmentMonthIndex: index("monthly_utl_rotation_department_month_idx").on(table.departmentId, table.monthStart),
  providerIndex: index("monthly_utl_rotation_provider_idx").on(table.institutionId, table.providerUserId),
}));
export type MonthlyUtlRotation = typeof monthlyUtlRotations.$inferSelect;
export type InsertMonthlyUtlRotation = typeof monthlyUtlRotations.$inferInsert;

/** Reusable institution-defined UTL shift-hour presets. Times are facility-local clock times; endDayOffset=1 represents an overnight shift. */
export const institutionShiftTemplates = mysqlTable("institution_shift_templates", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  templateName: varchar("template_name", { length: 128 }).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  endDayOffset: int("end_day_offset").default(0).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdByUserId: int("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionNameUnique: uniqueIndex("institution_shift_templates_institution_name_unique").on(table.institutionId, table.templateName),
  institutionOrderIndex: index("institution_shift_templates_institution_order_idx").on(table.institutionId, table.sortOrder),
}));
export type InstitutionShiftTemplate = typeof institutionShiftTemplates.$inferSelect;
export type InsertInstitutionShiftTemplate = typeof institutionShiftTemplates.$inferInsert;

// 4. Shift UTL & ERT Roster
export const shiftUtlRosters = mysqlTable("shift_utl_rosters", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  poleId: int("pole_id").notNull(),
  departmentId: int("department_id").notNull(),
  shiftDate: date("shift_date").notNull(),
  shiftType: mysqlEnum("shift_type", ["morning", "evening", "night"]).notNull(),
  shiftStartTime: time("shift_start_time").default("07:30:00").notNull(),
  shiftEndTime: time("shift_end_time").default("17:30:00").notNull(),
  shiftEndDayOffset: int("shift_end_day_offset").default(0).notNull(),
  shiftTemplateId: int("shift_template_id"),
  utlUserId: int("utl_user_id").notNull(),
  isShiftErtl: boolean("is_shift_ertl").default(false).notNull(),
  assignmentStatus: mysqlEnum("assignment_status", ["unassigned", "pending_acceptance", "active", "declined", "ended"]).default("unassigned").notNull(),
  acceptedAt: timestamp("accepted_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: varchar("decline_reason", { length: 500 }),
  readinessSignOffAt: timestamp("readiness_signoff_at"),
  readinessSignedOffByUserId: int("readiness_signed_off_by_user_id"),
  readinessNote: text("readiness_note"),
  monthlyUtlRotationId: int("monthly_utl_rotation_id"),
  status: mysqlEnum("status", ["active", "completed", "absent"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ShiftUtlRoster = typeof shiftUtlRosters.$inferSelect;
export type InsertShiftUtlRoster = typeof shiftUtlRosters.$inferInsert;

/** Versioned planned team for one pole, date, and shift. */
export const iersShiftTeams = mysqlTable("iers_shift_teams", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  poleId: int("pole_id").notNull(),
  shiftDate: date("shift_date").notNull(),
  shiftType: mysqlEnum("shift_type", ["morning", "evening", "night"]).notNull(),
  shiftStartTime: time("shift_start_time").notNull(),
  shiftEndTime: time("shift_end_time").notNull(),
  shiftEndDayOffset: int("shift_end_day_offset").default(0).notNull(),
  teamVersion: int("team_version").default(1).notNull(),
  status: mysqlEnum("status", ["draft", "published", "active", "closed", "superseded"]).default("draft").notNull(),
  createdByUserId: int("created_by_user_id").notNull(),
  publishedAt: timestamp("published_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionShiftIndex: index("iers_shift_teams_institution_shift_idx").on(table.institutionId, table.shiftDate, table.shiftType),
  poleShiftIndex: index("iers_shift_teams_pole_shift_idx").on(table.poleId, table.shiftDate, table.shiftType, table.teamVersion),
}));
export type IersShiftTeam = typeof iersShiftTeams.$inferSelect;
export type InsertIersShiftTeam = typeof iersShiftTeams.$inferInsert;

/** One provider's dated operational role in a versioned shift team. */
export const iersShiftRoleAssignments = mysqlTable("iers_shift_role_assignments", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("team_id").notNull(),
  institutionId: int("institution_id").notNull(),
  poleId: int("pole_id").notNull(),
  departmentId: int("department_id"),
  providerUserId: int("provider_user_id").notNull(),
  shiftUtlRosterId: int("shift_utl_roster_id"),
  roleScope: mysqlEnum("role_scope", ["utl", "ertl", "ert_member"]).notNull(),
  roleKey: varchar("role_key", { length: 64 }).notNull(),
  assignmentStatus: mysqlEnum("assignment_status", ["proposed", "approved", "pending_acceptance", "accepted", "declined", "expired", "superseded", "ended"]).default("proposed").notNull(),
  assignmentVersion: int("assignment_version").default(1).notNull(),
  proposedByUserId: int("proposed_by_user_id").notNull(),
  approvedByUserId: int("approved_by_user_id"),
  acceptedAt: timestamp("accepted_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: varchar("decline_reason", { length: 500 }),
  supersededAt: timestamp("superseded_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  teamProviderIndex: index("iers_shift_role_assignments_team_provider_idx").on(table.teamId, table.providerUserId),
  institutionProviderIndex: index("iers_shift_role_assignments_institution_provider_idx").on(table.institutionId, table.providerUserId, table.assignmentStatus),
  teamRoleIndex: index("iers_shift_role_assignments_team_role_idx").on(table.teamId, table.roleScope, table.roleKey),
}));
export type IersShiftRoleAssignment = typeof iersShiftRoleAssignments.$inferSelect;
export type InsertIersShiftRoleAssignment = typeof iersShiftRoleAssignments.$inferInsert;

/** A provider's proposed alternative role awaiting ERTL decision and provider acceptance. */
export const iersShiftRoleRecommendations = mysqlTable("iers_shift_role_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignment_id").notNull(),
  teamId: int("team_id").notNull(),
  institutionId: int("institution_id").notNull(),
  requestedByUserId: int("requested_by_user_id").notNull(),
  requestedRoleKey: varchar("requested_role_key", { length: 64 }).notNull(),
  reason: varchar("reason", { length: 1000 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "declined", "withdrawn"]).default("pending").notNull(),
  decidedByUserId: int("decided_by_user_id"),
  decisionNote: varchar("decision_note", { length: 1000 }),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  assignmentStatusIndex: index("iers_shift_role_recommendations_assignment_status_idx").on(table.assignmentId, table.status),
  teamStatusIndex: index("iers_shift_role_recommendations_team_status_idx").on(table.teamId, table.status),
}));
export type IersShiftRoleRecommendation = typeof iersShiftRoleRecommendations.$inferSelect;
export type InsertIersShiftRoleRecommendation = typeof iersShiftRoleRecommendations.$inferInsert;

/** Append-only role assignment events for audit, dispute resolution, and learning. */
export const iersShiftRoleEvents = mysqlTable("iers_shift_role_events", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignment_id").notNull(),
  teamId: int("team_id").notNull(),
  institutionId: int("institution_id").notNull(),
  actorUserId: int("actor_user_id"),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  fromStatus: varchar("from_status", { length: 64 }),
  toStatus: varchar("to_status", { length: 64 }),
  fromRoleKey: varchar("from_role_key", { length: 64 }),
  toRoleKey: varchar("to_role_key", { length: 64 }),
  reason: text("reason"),
  metadata: text("metadata"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
}, (table) => ({
  assignmentOccurredIndex: index("iers_shift_role_events_assignment_occurred_idx").on(table.assignmentId, table.occurredAt),
  institutionOccurredIndex: index("iers_shift_role_events_institution_occurred_idx").on(table.institutionId, table.occurredAt),
}));
export type IersShiftRoleEvent = typeof iersShiftRoleEvents.$inferSelect;
export type InsertIersShiftRoleEvent = typeof iersShiftRoleEvents.$inferInsert;

/** Institution-governed, versioned UTL readiness checklist template. */
export const iersReadinessTemplates = mysqlTable("iers_readiness_templates", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  templateName: varchar("template_name", { length: 128 }).notNull(),
  templateVersion: varchar("template_version", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["draft", "approved", "active", "superseded"]).default("active").notNull(),
  approvedByUserId: int("approved_by_user_id"),
  approvedAt: timestamp("approved_at"),
  effectiveFrom: date("effective_from").notNull(),
  supersededAt: timestamp("superseded_at"),
  createdByUserId: int("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionStatusIndex: index("iers_readiness_templates_institution_status_idx").on(table.institutionId, table.status),
  institutionVersionUnique: uniqueIndex("iers_readiness_templates_institution_version_unique").on(table.institutionId, table.templateVersion),
}));
export type IersReadinessTemplate = typeof iersReadinessTemplates.$inferSelect;
export type InsertIersReadinessTemplate = typeof iersReadinessTemplates.$inferInsert;

/** Controlled item taxonomy for an approved readiness template. */
export const iersReadinessTemplateItems = mysqlTable("iers_readiness_template_items", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("template_id").notNull(),
  itemCode: varchar("item_code", { length: 96 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  itemLabel: varchar("item_label", { length: 255 }).notNull(),
  itemKind: mysqlEnum("item_kind", ["equipment", "drug", "safety", "document", "access"]).notNull(),
  ageBand: mysqlEnum("age_band", ["universal", "neonatal", "infant_child", "adolescent_adult", "maternity", "trauma", "local"]).notNull(),
  urgency: mysqlEnum("urgency", ["immediate", "accessible"]).notNull(),
  isCritical: boolean("is_critical").default(false).notNull(),
  expectedQuantity: int("expected_quantity"),
  quantityUnit: varchar("quantity_unit", { length: 32 }),
  requiresExpiryCheck: boolean("requires_expiry_check").default(false).notNull(),
  requiresFunctionCheck: boolean("requires_function_check").default(false).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  templateCodeUnique: uniqueIndex("iers_readiness_template_items_code_unique").on(table.templateId, table.itemCode),
  templateOrderIndex: index("iers_readiness_template_items_order_idx").on(table.templateId, table.sortOrder),
}));
export type IersReadinessTemplateItem = typeof iersReadinessTemplateItems.$inferSelect;
export type InsertIersReadinessTemplateItem = typeof iersReadinessTemplateItems.$inferInsert;

/** One UTL physical readiness check against a fixed template version. */
export const iersUtlReadinessChecks = mysqlTable("iers_utl_readiness_checks", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  poleId: int("pole_id").notNull(),
  departmentId: int("department_id").notNull(),
  teamId: int("team_id"),
  shiftUtlRosterId: int("shift_utl_roster_id"),
  templateId: int("template_id").notNull(),
  checkedByUserId: int("checked_by_user_id").notNull(),
  idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["draft", "submitted", "ready", "ready_with_gaps", "not_ready", "superseded"]).default("draft").notNull(),
  attestation: varchar("attestation", { length: 500 }).notNull(),
  generalNote: text("general_note"),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionCheckedIndex: index("iers_utl_readiness_checks_institution_checked_idx").on(table.institutionId, table.checkedAt),
  teamStatusIndex: index("iers_utl_readiness_checks_team_status_idx").on(table.teamId, table.status),
  idempotencyUnique: uniqueIndex("iers_utl_readiness_checks_idempotency_unique").on(table.checkedByUserId, table.idempotencyKey),
}));
export type IersUtlReadinessCheck = typeof iersUtlReadinessChecks.$inferSelect;
export type InsertIersUtlReadinessCheck = typeof iersUtlReadinessChecks.$inferInsert;

/** Item-level observation for one UTL readiness check. */
export const iersUtlReadinessCheckItems = mysqlTable("iers_utl_readiness_check_items", {
  id: int("id").autoincrement().primaryKey(),
  checkId: int("check_id").notNull(),
  templateItemId: int("template_item_id").notNull(),
  itemStatus: mysqlEnum("item_status", ["present_and_functional", "present_not_tested", "missing", "expired", "damaged", "insufficient_quantity", "inaccessible", "not_applicable", "not_observed"]).notNull(),
  observedQuantity: int("observed_quantity"),
  expiryDate: date("expiry_date"),
  functionTested: boolean("function_tested"),
  note: varchar("note", { length: 1000 }),
  isCriticalGap: boolean("is_critical_gap").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  checkItemUnique: uniqueIndex("iers_utl_readiness_check_items_check_item_unique").on(table.checkId, table.templateItemId),
  checkStatusIndex: index("iers_utl_readiness_check_items_check_status_idx").on(table.checkId, table.itemStatus),
}));
export type IersUtlReadinessCheckItem = typeof iersUtlReadinessCheckItems.$inferSelect;
export type InsertIersUtlReadinessCheckItem = typeof iersUtlReadinessCheckItems.$inferInsert;

/** Immutable activation-time copy of the planned team and role assignments. */
export const iersActivationTeamSnapshots = mysqlTable("iers_activation_team_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  activationEventId: int("activation_event_id").notNull(),
  teamId: int("team_id").notNull(),
  teamVersion: int("team_version").notNull(),
  institutionId: int("institution_id").notNull(),
  poleId: int("pole_id").notNull(),
  departmentId: int("department_id").notNull(),
  providerUserId: int("provider_user_id").notNull(),
  roleScope: mysqlEnum("role_scope", ["utl", "ertl", "ert_member"]).notNull(),
  roleKey: varchar("role_key", { length: 64 }).notNull(),
  assignmentStatus: varchar("assignment_status", { length: 32 }).notNull(),
  snapshottedAt: timestamp("snapshotted_at").defaultNow().notNull(),
}, (table) => ({
  activationProviderUnique: uniqueIndex("iers_activation_team_snapshots_provider_unique").on(table.activationEventId, table.providerUserId, table.roleKey),
  activationIndex: index("iers_activation_team_snapshots_activation_idx").on(table.activationEventId, table.teamId),
}));
export type IersActivationTeamSnapshot = typeof iersActivationTeamSnapshots.$inferSelect;
export type InsertIersActivationTeamSnapshot = typeof iersActivationTeamSnapshots.$inferInsert;

/** Named, activation-linked, role-specific operational observation. */
export const iersTargetedRoleReports = mysqlTable("iers_targeted_role_reports", {
  id: int("id").autoincrement().primaryKey(),
  activationEventId: int("activation_event_id").notNull(),
  teamId: int("team_id").notNull(),
  assignmentId: int("assignment_id").notNull(),
  roleSnapshotId: int("role_snapshot_id").notNull(),
  institutionId: int("institution_id").notNull(),
  poleId: int("pole_id").notNull(),
  departmentId: int("department_id").notNull(),
  providerUserId: int("provider_user_id").notNull(),
  idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
  roleAtEvent: varchar("role_at_event", { length: 64 }).notNull(),
  reportPhase: mysqlEnum("report_phase", ["recognition", "activation", "response", "stabilization", "recovery_debrief"]).notNull(),
  observationCode: varchar("observation_code", { length: 96 }).notNull(),
  timingCategory: varchar("timing_category", { length: 64 }),
  narrative: varchar("narrative", { length: 2000 }),
  noPatientIdentifiersAcknowledged: boolean("no_patient_identifiers_acknowledged").notNull().default(false),
  submissionState: mysqlEnum("submission_state", ["submitted", "accepted", "returned", "superseded"]).notNull().default("submitted"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  supersededByReportId: int("superseded_by_report_id"),
}, (table) => ({
  activationSubmittedIndex: index("iers_targeted_role_reports_activation_submitted_idx").on(table.activationEventId, table.submittedAt),
  providerSubmittedIndex: index("iers_targeted_role_reports_provider_submitted_idx").on(table.providerUserId, table.submittedAt),
  idempotencyUnique: uniqueIndex("iers_targeted_role_reports_idempotency_unique").on(table.providerUserId, table.idempotencyKey),
}));
export type IersTargetedRoleReport = typeof iersTargetedRoleReports.$inferSelect;
export type InsertIersTargetedRoleReport = typeof iersTargetedRoleReports.$inferInsert;

// 5. IERMS Facility Audit Scorecards
export const iermsAuditScorecards = mysqlTable("ierms_audit_scorecards", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  auditorUserId: int("auditor_user_id").notNull(),
  auditDate: timestamp("audit_date").defaultNow().notNull(),
  domain1Score: int("domain1_score").notNull(),
  domain2Score: int("domain2_score").notNull(),
  domain3Score: int("domain3_score").notNull(),
  domain4Score: int("domain4_score").notNull(),
  domain5Score: int("domain5_score").notNull(),
  totalScore: int("total_score").notNull(),
  accreditationLevel: mysqlEnum("accreditation_level", [
    "level_1_unprepared",
    "level_2_baseline",
    "level_3_certified",
    "level_4_exemplar"
  ]).notNull(),
  notes: text("notes"),
  validUntil: timestamp("valid_until").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type IermsAuditScorecard = typeof iermsAuditScorecards.$inferSelect;
export type InsertIermsAuditScorecard = typeof iermsAuditScorecards.$inferInsert;

// 6. Equipment Audit Logs
export const equipmentAuditLogs = mysqlTable("equipment_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  department: varchar("department", { length: 128 }).notNull(),
  auditedByUserId: int("audited_by_user_id").notNull(),
  auditType: mysqlEnum("audit_type", ["daily_seal_check", "monthly_100_percent"]).notNull(),
  cartSealIntact: boolean("cart_seal_intact").default(true).notNull(),
  hasPaedsAirways: boolean("has_paeds_airways").default(true).notNull(),
  hasPaedsBvm: boolean("has_paeds_bvm").default(true).notNull(),
  hasIoNeedles: boolean("has_io_needles").default(true).notNull(),
  hasPaedsDefibPads: boolean("has_paeds_defib_pads").default(true).notNull(),
  hasPaedsSuction: boolean("has_paeds_suction").default(true).notNull(),
  deficitsFound: text("deficits_found"),
  auditDate: timestamp("audit_date").defaultNow().notNull(),
});
export type EquipmentAuditLog = typeof equipmentAuditLogs.$inferSelect;
export type InsertEquipmentAuditLog = typeof equipmentAuditLogs.$inferInsert;

/** Criterion-level evidence for IERS readiness, audit review, and accreditation snapshots. */
export const iersEvidenceRecords = mysqlTable("iers_evidence_records", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  domain: mysqlEnum("domain", ["leadership", "workforce", "activation", "equipment", "clinical_governance", "quality_improvement", "resusgps", "training"]).notNull(),
  criterionCode: varchar("criterion_code", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  evidenceType: mysqlEnum("evidence_type", ["checklist", "document", "photo", "drill", "activation", "audit", "metric", "attestation", "external"]).notNull(),
  description: text("description").notNull(),
  evidenceUrl: text("evidence_url"),
  observedAt: timestamp("observed_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  submittedByUserId: int("submitted_by_user_id").notNull(),
  status: mysqlEnum("status", ["draft", "submitted", "accepted", "rejected", "expired", "superseded"]).default("submitted").notNull(),
  reviewedByUserId: int("reviewed_by_user_id"),
  reviewedAt: timestamp("reviewed_at"),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionDomainIndex: index("iersEvidenceRecords_institution_domain_idx").on(table.institutionId, table.domain),
  institutionCriterionIndex: index("iersEvidenceRecords_institution_criterion_idx").on(table.institutionId, table.criterionCode),
  institutionStatusIndex: index("iersEvidenceRecords_institution_status_idx").on(table.institutionId, table.status),
}));
export type IersEvidenceRecord = typeof iersEvidenceRecords.$inferSelect;
export type InsertIersEvidenceRecord = typeof iersEvidenceRecords.$inferInsert;

/** Owned improvement actions linked to evidence, activations, incidents, and QI signals. */
export const iersActionItems = mysqlTable("iers_action_items", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  sourceType: mysqlEnum("source_type", ["evidence", "activation", "equipment", "care_signal", "code_signal", "incident", "drill", "manual"]).default("manual").notNull(),
  sourceId: int("source_id"),
  /** One-way compatibility link to the legacy institutionalActionLogs row. */
  legacyActionLogId: int("legacy_action_log_id").unique(),
  title: varchar("title", { length: 255 }).notNull(),
  gapDescription: text("gap_description").notNull(),
  ownerUserId: int("owner_user_id"),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "blocked", "awaiting_verification", "closed", "cancelled"]).default("open").notNull(),
  dueDate: date("due_date"),
  closureNote: text("closure_note"),
  closureEvidenceId: int("closure_evidence_id"),
  closedByUserId: int("closed_by_user_id"),
  closedAt: timestamp("closed_at"),
  createdByUserId: int("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionStatusIndex: index("iersActionItems_institution_status_idx").on(table.institutionId, table.status),
  institutionOwnerIndex: index("iersActionItems_institution_owner_idx").on(table.institutionId, table.ownerUserId),
  institutionDueDateIndex: index("iersActionItems_institution_due_date_idx").on(table.institutionId, table.dueDate),
}));
export type IersActionItem = typeof iersActionItems.$inferSelect;
export type InsertIersActionItem = typeof iersActionItems.$inferInsert;

/** Scheduled IERS drills with response timing and debrief evidence. */
export const iersDrills = mysqlTable("iers_drills", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  scenarioType: mysqlEnum("scenario_type", ["code_blue", "code_yellow", "neonatal", "sepsis", "anaphylaxis", "trauma", "other"]).notNull(),
  /** Explicit safety attestation; legacy drills remain false until reviewed. */
  isSimulation: boolean("is_simulation").default(false).notNull(),
  simulationLabel: varchar("simulation_label", { length: 64 }),
  simulationAcknowledgedAt: timestamp("simulation_acknowledged_at"),
  noPatientIdentifiersAcknowledged: boolean("no_patient_identifiers_acknowledged").default(false).notNull(),
  noPatientIdentifiersAcknowledgedAt: timestamp("no_patient_identifiers_acknowledged_at"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: mysqlEnum("status", ["planned", "in_progress", "completed", "cancelled"]).default("planned").notNull(),
  facilitatorUserId: int("facilitator_user_id").notNull(),
  targetResponseSeconds: int("target_response_seconds").default(180).notNull(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  debriefNote: text("debrief_note"),
  lessonsLearned: text("lessons_learned"),
  createdByUserId: int("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionStatusIndex: index("iersDrills_institution_status_idx").on(table.institutionId, table.status),
  institutionScheduleIndex: index("iersDrills_institution_schedule_idx").on(table.institutionId, table.scheduledAt),
}));
export type IersDrill = typeof iersDrills.$inferSelect;
export type InsertIersDrill = typeof iersDrills.$inferInsert;

/** Drill participants and role-specific attendance evidence. */
export const iersDrillParticipants = mysqlTable("iers_drill_participants", {
  id: int("id").autoincrement().primaryKey(),
  drillId: int("drill_id").notNull(),
  institutionId: int("institution_id").notNull(),
  userId: int("user_id").notNull(),
  role: varchar("role", { length: 128 }).notNull(),
  joinedAt: timestamp("joined_at"),
  assessed: boolean("assessed").default(false).notNull(),
  assessmentNote: text("assessment_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  drillUserUnique: uniqueIndex("iersDrillParticipants_drill_user_unique").on(table.drillId, table.userId),
  institutionUserIndex: index("iersDrillParticipants_institution_user_idx").on(table.institutionId, table.userId),
}));
export type IersDrillParticipant = typeof iersDrillParticipants.$inferSelect;
export type InsertIersDrillParticipant = typeof iersDrillParticipants.$inferInsert;

/** 30/60/90-day IERS implementation milestones with explicit owners and proof. */
export const iersImplementationMilestones = mysqlTable("iers_implementation_milestones", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  phaseOrder: int("phase_order").notNull(),
  phaseName: varchar("phase_name", { length: 128 }).notNull(),
  objective: text("objective").notNull(),
  targetDate: date("target_date"),
  ownerUserId: int("owner_user_id"),
  status: mysqlEnum("status", ["not_started", "in_progress", "at_risk", "complete"]).default("not_started").notNull(),
  riskNote: text("risk_note"),
  evidenceId: int("evidence_id"),
  completedAt: timestamp("completed_at"),
  createdByUserId: int("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  institutionPhaseUnique: uniqueIndex("iersImplementationMilestones_institution_phase_unique").on(table.institutionId, table.phaseOrder),
  institutionStatusIndex: index("iersImplementationMilestones_institution_status_idx").on(table.institutionId, table.status),
}));
export type IersImplementationMilestone = typeof iersImplementationMilestones.$inferSelect;
export type InsertIersImplementationMilestone = typeof iersImplementationMilestones.$inferInsert;

// 7. 90-Day Implementation Tracker
export const iermsImplementationTrackers = mysqlTable("ierms_implementation_trackers", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institution_id").notNull(),
  phase1MouStatus: mysqlEnum("phase1_status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  phase2ErtStatus: mysqlEnum("phase2_status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  phase3TrainingStatus: mysqlEnum("phase3_status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  phase4AuditStatus: mysqlEnum("phase4_status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  targetCompletionDate: date("target_completion_date"),
  lastUpdated: timestamp("last_updated").defaultNow().onUpdateNow().notNull(),
});
export type IermsImplementationTracker = typeof iermsImplementationTrackers.$inferSelect;
export type InsertIermsImplementationTracker = typeof iermsImplementationTrackers.$inferInsert;


/** NERP ACLS pathway enrollment and six-installment ledger. */
export const nerpOfferEnrollments = mysqlTable("nerp_offer_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  offerKey: varchar("offer_key", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
  totalAmountKes: decimal("total_amount_kes", { precision: 10, scale: 2 }).notNull(),
  monthlyInstallmentKes: decimal("monthly_installment_kes", { precision: 10, scale: 2 }).notNull(),
  installmentCount: int("installment_count").notNull(),
  amountPaidKes: decimal("amount_paid_kes", { precision: 10, scale: 2 }).default("0.00").notNull(),
  nextInstallmentNumber: int("next_installment_number").default(1).notNull(),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, table => ({
  userOfferUnique: uniqueIndex("nerp_offer_enrollments_user_offer_uq").on(table.userId, table.offerKey),
  userStatusIndex: index("nerp_offer_enrollments_user_status_idx").on(table.userId, table.status),
}));
export type NerpOfferEnrollment = typeof nerpOfferEnrollments.$inferSelect;
export type InsertNerpOfferEnrollment = typeof nerpOfferEnrollments.$inferInsert;

/** Links one NERP offer to the existing BLS and ACLS enrollment records. */
export const nerpOfferCourses = mysqlTable("nerp_offer_courses", {
  id: int("id").autoincrement().primaryKey(),
  nerpOfferEnrollmentId: int("nerp_offer_enrollment_id").notNull(),
  enrollmentId: int("enrollment_id").notNull(),
  programType: mysqlEnum("program_type", ["bls", "acls"]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => ({
  offerProgramUnique: uniqueIndex("nerp_offer_courses_offer_program_uq").on(table.nerpOfferEnrollmentId, table.programType),
  enrollmentIndex: index("nerp_offer_courses_enrollment_idx").on(table.enrollmentId),
}));
export type NerpOfferCourse = typeof nerpOfferCourses.$inferSelect;
export type InsertNerpOfferCourse = typeof nerpOfferCourses.$inferInsert;

/** Global Admin-reviewed external NERP phase evidence. */
export const nerpOfferExternalVerifications = mysqlTable("nerp_offer_external_verifications", {
  id: int("id").autoincrement().primaryKey(),
  nerpOfferEnrollmentId: int("nerp_offer_enrollment_id").notNull(),
  phase: mysqlEnum("phase", ["phase_2", "phase_3"]).notNull(),
  status: mysqlEnum("status", ["verified", "rejected", "revoked"]).default("rejected").notNull(),
  completedAt: timestamp("completed_at"),
  evidenceNote: text("evidence_note"),
  evidenceReference: varchar("evidence_reference", { length: 512 }),
  verifiedByUserId: int("verified_by_user_id"),
  verifiedAt: timestamp("verified_at"),
  reviewReason: text("review_reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, table => ({
  offerPhaseUnique: uniqueIndex("nerp_offer_external_verifications_offer_phase_uq").on(table.nerpOfferEnrollmentId, table.phase),
  statusIndex: index("nerp_offer_external_verifications_status_idx").on(table.status),
}));
export type NerpOfferExternalVerification = typeof nerpOfferExternalVerifications.$inferSelect;
export type InsertNerpOfferExternalVerification = typeof nerpOfferExternalVerifications.$inferInsert;

/** Append-only audit events for NERP payments and external completion review. */
export const nerpOfferAuditEvents = mysqlTable("nerp_offer_audit_events", {
  id: int("id").autoincrement().primaryKey(),
  nerpOfferEnrollmentId: int("nerp_offer_enrollment_id").notNull(),
  action: varchar("action", { length: 96 }).notNull(),
  actorUserId: int("actor_user_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => ({
  offerCreatedIndex: index("nerp_offer_audit_events_offer_created_idx").on(table.nerpOfferEnrollmentId, table.createdAt),
}));
export type NerpOfferAuditEvent = typeof nerpOfferAuditEvents.$inferSelect;
export type InsertNerpOfferAuditEvent = typeof nerpOfferAuditEvents.$inferInsert;
