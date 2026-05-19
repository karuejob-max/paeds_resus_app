/**
 * Phase 4: Clinician Override with Accountability
 * 
 * This file defines the schema extensions for override logging and audit trails.
 * These tables capture when clinicians deviate from the system's recommendations
 * and provide accountability for quality improvement.
 */

import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean } from 'drizzle-orm/mysql-core';

/**
 * CPR Override Log - Captures when clinicians override system recommendations
 * Used for quality improvement and identifying patterns in clinical decision-making
 */
export const cprOverrideLogs = mysqlTable("cprOverrideLogs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Session reference
  cprSessionId: int("cprSessionId").notNull(), // FK to cprSessions
  
  // Override context
  overrideType: mysqlEnum("overrideType", [
    "skip_rhythm_check",           // Skipped scheduled rhythm assessment
    "medication_timing",            // Gave medication outside recommended window
    "shock_energy",                 // Manually adjusted defibrillation energy
    "antiarrhythmic_selection",     // Chose different antiarrhythmic than recommended
    "skip_medication",              // Declined recommended medication
    "continue_cpr_beyond_protocol", // Continued CPR beyond standard termination time
    "other"                         // Other override reason
  ]).notNull(),
  
  // Clinical context at time of override
  arrestDurationSeconds: int("arrestDurationSeconds"), // How long CPR had been running
  rhythmType: varchar("rhythmType", { length: 32 }), // VF/pVT, PEA, asystole, etc.
  shockCount: int("shockCount"), // Number of shocks given
  epiDoseCount: int("epiDoseCount"), // Number of epinephrine doses
  
  // Override details
  recommendedAction: text("recommendedAction"), // What the system recommended
  actualAction: text("actualAction"), // What the clinician did instead
  justification: text("justification"), // Why they overrode (mandatory)
  
  // Clinician accountability
  overriddenBy: int("overriddenBy").notNull(), // userId of clinician who overrode
  overriddenAt: timestamp("overriddenAt").defaultNow().notNull(),
  
  // Outcome tracking
  sessionOutcome: varchar("sessionOutcome", { length: 64 }), // ROSC, mortality, ongoing, etc.
  
  // Admin review
  reviewedBy: int("reviewedBy"), // userId of admin who reviewed
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"), // Admin comments on the override
  isHighRisk: boolean("isHighRisk").default(false), // Flagged for quality review
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CprOverrideLog = typeof cprOverrideLogs.$inferSelect;
export type InsertCprOverrideLog = typeof cprOverrideLogs.$inferInsert;

/**
 * Override Statistics - Aggregated metrics for admin dashboard
 * Tracks patterns and trends in clinician overrides
 */
export const overrideStatistics = mysqlTable("overrideStatistics", {
  id: int("id").autoincrement().primaryKey(),
  
  // Time period
  periodStart: timestamp("periodStart").notNull(), // Start of aggregation period
  periodEnd: timestamp("periodEnd").notNull(), // End of aggregation period
  
  // Override counts by type
  skipRhythmCheckCount: int("skipRhythmCheckCount").default(0),
  medicationTimingCount: int("medicationTimingCount").default(0),
  shockEnergyCount: int("shockEnergyCount").default(0),
  antiarrhythmicSelectionCount: int("antiarrhythmicSelectionCount").default(0),
  skipMedicationCount: int("skipMedicationCount").default(0),
  continueCprBeyondProtocolCount: int("continueCprBeyondProtocolCount").default(0),
  otherCount: int("otherCount").default(0),
  
  // Total counts
  totalOverrides: int("totalOverrides").default(0),
  totalSessions: int("totalSessions").default(0),
  overridePercentage: int("overridePercentage").default(0), // Percentage of sessions with overrides
  
  // High-risk overrides
  highRiskCount: int("highRiskCount").default(0),
  
  // Provider stats
  uniqueProvidersCount: int("uniqueProvidersCount").default(0),
  topOverridingProvider: int("topOverridingProvider"), // userId of provider with most overrides
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OverrideStatistics = typeof overrideStatistics.$inferSelect;
export type InsertOverrideStatistics = typeof overrideStatistics.$inferInsert;

/**
 * Override Justification Templates - Pre-defined reasons for common overrides
 * Helps clinicians quickly select a reason and standardizes documentation
 */
export const overrideJustificationTemplates = mysqlTable("overrideJustificationTemplates", {
  id: int("id").autoincrement().primaryKey(),
  
  overrideType: mysqlEnum("overrideType", [
    "skip_rhythm_check",
    "medication_timing",
    "shock_energy",
    "antiarrhythmic_selection",
    "skip_medication",
    "continue_cpr_beyond_protocol",
    "other"
  ]).notNull(),
  
  // Template text
  templateText: text("templateText").notNull(), // e.g., "Patient unstable, unable to safely assess rhythm"
  category: varchar("category", { length: 64 }), // e.g., "patient_condition", "equipment", "clinical_judgment"
  
  // Usage tracking
  usageCount: int("usageCount").default(0),
  
  // Admin management
  isActive: boolean("isActive").default(true),
  createdBy: int("createdBy"), // userId of admin who created
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OverrideJustificationTemplate = typeof overrideJustificationTemplates.$inferSelect;
export type InsertOverrideJustificationTemplate = typeof overrideJustificationTemplates.$inferInsert;
