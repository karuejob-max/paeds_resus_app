import { mysqlTable, varchar, text, datetime, int, decimal, index } from "drizzle-orm/mysql-core";
import { mysqlEnum } from "drizzle-orm/mysql-core";

// Parent Safe-Truth Events Table
export const parentSafeTruthEvents = mysqlTable(
  "parent_safe_truth_events",
  {
    id: varchar("id", { length: 36 }).primaryKey().default("uuid()"),
    submissionId: varchar("submission_id", { length: 36 }).notNull(),
    eventType: mysqlEnum("event_type", [
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
    eventTime: datetime("event_time").notNull(),
    description: text("description").notNull(),
    createdAt: datetime("created_at").notNull().default(new Date()),
  },
  (table) => ({
    submissionIdIdx: index("submission_id_idx").on(table.submissionId),
    eventTimeIdx: index("event_time_idx").on(table.eventTime),
  })
);

// Parent Safe-Truth Submissions Table
export const parentSafeTruthSubmissions = mysqlTable(
  "parent_safe_truth_submissions",
  {
    id: varchar("id", { length: 36 }).primaryKey().default("uuid()"),
    userId: varchar("user_id", { length: 36 }).notNull(),
    hospitalId: varchar("hospital_id", { length: 36 }),
    childName: varchar("child_name", { length: 255 }),
    childAge: int("child_age"),
    childOutcome: mysqlEnum("child_outcome", ["discharged", "referred", "passed-away"]).notNull(),
    arrivalTime: datetime("arrival_time").notNull(),
    dischargeOrReferralTime: datetime("discharge_or_referral_time"),
    
    // Calculated metrics
    totalDurationMinutes: int("total_duration_minutes"),
    communicationGaps: int("communication_gaps").default(0),
    interventionDelays: int("intervention_delays").default(0),
    monitoringGaps: int("monitoring_gaps").default(0),
    
    // Analysis results
    delayAnalysis: text("delay_analysis"), // JSON string
    improvements: text("improvements"), // JSON string
    
    // Privacy
    isAnonymous: int("is_anonymous").default(1),
    parentName: varchar("parent_name", { length: 255 }),
    parentEmail: varchar("parent_email", { length: 255 }),
    
    // Metadata
    status: mysqlEnum("status", ["draft", "submitted", "reviewed", "archived"]).default("submitted"),
    createdAt: datetime("created_at").notNull().default(new Date()),
    updatedAt: datetime("updated_at").notNull().default(new Date()),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
    hospitalIdIdx: index("hospital_id_idx").on(table.hospitalId),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
    childOutcomeIdx: index("child_outcome_idx").on(table.childOutcome),
  })
);

// System Delay Analysis Results Table
export const systemDelayAnalysis = mysqlTable(
  "system_delay_analysis",
  {
    id: varchar("id", { length: 36 }).primaryKey().default("uuid()"),
    submissionId: varchar("submission_id", { length: 36 }).notNull(),
    hospitalId: varchar("hospital_id", { length: 36 }).notNull(),
    
    // Delay metrics (in minutes)
    arrivalToDoctorDelay: int("arrival_to_doctor_delay"),
    doctorToInterventionDelay: int("doctor_to_intervention_delay"),
    interventionToMonitoringDelay: int("intervention_to_monitoring_delay"),
    communicationDelay: int("communication_delay"),
    
    // Gap identification
    hasMonitoringGap: int("has_monitoring_gap").default(0),
    hasCommunicationGap: int("has_communication_gap").default(0),
    hasInterventionDelay: int("has_intervention_delay").default(0),
    
    // Recommendations
    recommendations: text("recommendations"), // JSON array
    improvementAreas: text("improvement_areas"), // JSON array
    
    // Severity scoring
    severityScore: decimal("severity_score", { precision: 3, scale: 1 }), // 0-10 scale
    
    createdAt: datetime("created_at").notNull().default(new Date()),
  },
  (table) => ({
    submissionIdIdx: index("submission_id_idx").on(table.submissionId),
    hospitalIdIdx: index("hospital_id_idx").on(table.hospitalId),
    severityIdx: index("severity_idx").on(table.severityScore),
  })
);

// Hospital Improvement Metrics (aggregated from parent feedback)
export const hospitalImprovementMetrics = mysqlTable(
  "hospital_improvement_metrics",
  {
    id: varchar("id", { length: 36 }).primaryKey().default("uuid()"),
    hospitalId: varchar("hospital_id", { length: 36 }).notNull().unique(),
    
    // Metrics
    totalSubmissions: int("total_submissions").default(0),
    avgArrivalToDoctorDelay: decimal("avg_arrival_to_doctor_delay", { precision: 5, scale: 1 }),
    avgDoctorToInterventionDelay: decimal("avg_doctor_to_intervention_delay", { precision: 5, scale: 1 }),
    communicationGapPercentage: decimal("communication_gap_percentage", { precision: 5, scale: 1 }),
    monitoringGapPercentage: decimal("monitoring_gap_percentage", { precision: 5, scale: 1 }),
    
    // Trends
    improvementTrend: mysqlEnum("improvement_trend", ["improving", "stable", "declining"]),
    lastAnalyzedAt: datetime("last_analyzed_at"),
    
    // Top improvement areas
    topImprovementAreas: text("top_improvement_areas"), // JSON array
    
    updatedAt: datetime("updated_at").notNull().default(new Date()),
  },
  (table) => ({
    hospitalIdIdx: index("hospital_id_idx").on(table.hospitalId),
  })
);

export type ParentSafeTruthEvent = typeof parentSafeTruthEvents.$inferSelect;
export type ParentSafeTruthSubmission = typeof parentSafeTruthSubmissions.$inferSelect;
export type SystemDelayAnalysis = typeof systemDelayAnalysis.$inferSelect;
export type HospitalImprovementMetrics = typeof hospitalImprovementMetrics.$inferSelect;
