import { getDb } from "../db";
import { analyticsEvents } from "../../drizzle/schema";

/**
 * A1: ResusGPS Analytics Instrumentation
 * Tracks core product usage events for admin visibility
 */

export type ResusGpsEventType =
  | "assessment_started"
  | "assessment_completed"
  | "protocol_viewed"
  | "decision_made"
  | "intervention_recorded"
  | "reassessment_triggered"
  | "handover_generated"
  | "error_encountered";

export interface ResusGpsEvent {
  userId: number;
  eventType: ResusGpsEventType;
  eventName: string;
  pageUrl?: string;
  eventData?: Record<string, unknown>;
  sessionId?: string;
  duration?: number;
}

/**
 * Track ResusGPS event for analytics
 */
export async function trackResusGpsEvent(event: ResusGpsEvent): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[ResusGPS Analytics] Database unavailable");
      return false;
    }

    await db.insert(analyticsEvents).values({
      userId: event.userId,
      eventType: "resus_gps",
      eventName: event.eventName,
      pageUrl: event.pageUrl || "",
      eventData: event.eventData ? JSON.stringify(event.eventData) : null,
      sessionId: event.sessionId || "",
      duration: event.duration || 0,
      createdAt: new Date(),
    });

    console.log(`[ResusGPS Analytics] Event tracked: ${event.eventName}`);
    return true;
  } catch (error) {
    console.error("[ResusGPS Analytics] Error tracking event:", error);
    return false;
  }
}

/**
 * Track assessment started event
 */
export async function trackAssessmentStarted(
  userId: number,
  sessionId: string,
  patientAge?: number,
  patientWeight?: number
): Promise<boolean> {
  return trackResusGpsEvent({
    userId,
    eventType: "assessment_started",
    eventName: "Assessment Started",
    sessionId,
    eventData: {
      patientAge,
      patientWeight,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track assessment completed event
 */
export async function trackAssessmentCompleted(
  userId: number,
  sessionId: string,
  duration: number,
  protocolsUsed?: string[],
  decisionsCount?: number
): Promise<boolean> {
  return trackResusGpsEvent({
    userId,
    eventType: "assessment_completed",
    eventName: "Assessment Completed",
    sessionId,
    duration,
    eventData: {
      protocolsUsed,
      decisionsCount,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track protocol viewed event
 */
export async function trackProtocolViewed(
  userId: number,
  sessionId: string,
  protocolId: string,
  protocolName: string
): Promise<boolean> {
  return trackResusGpsEvent({
    userId,
    eventType: "protocol_viewed",
    eventName: `Viewed Protocol: ${protocolName}`,
    sessionId,
    eventData: {
      protocolId,
      protocolName,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track decision made event
 */
export async function trackDecisionMade(
  userId: number,
  sessionId: string,
  decisionType: string,
  decisionValue?: string
): Promise<boolean> {
  return trackResusGpsEvent({
    userId,
    eventType: "decision_made",
    eventName: `Decision Made: ${decisionType}`,
    sessionId,
    eventData: {
      decisionType,
      decisionValue,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track intervention recorded event
 */
export async function trackInterventionRecorded(
  userId: number,
  sessionId: string,
  interventionType: string,
  interventionName: string
): Promise<boolean> {
  return trackResusGpsEvent({
    userId,
    eventType: "intervention_recorded",
    eventName: `Intervention: ${interventionName}`,
    sessionId,
    eventData: {
      interventionType,
      interventionName,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track reassessment triggered event
 */
export async function trackReassessmentTriggered(
  userId: number,
  sessionId: string,
  reason: string
): Promise<boolean> {
  return trackResusGpsEvent({
    userId,
    eventType: "reassessment_triggered",
    eventName: "Reassessment Triggered",
    sessionId,
    eventData: {
      reason,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track handover generated event
 */
export async function trackHandoverGenerated(
  userId: number,
  sessionId: string,
  handoverType: string,
  handoverUrl?: string
): Promise<boolean> {
  return trackResusGpsEvent({
    userId,
    eventType: "handover_generated",
    eventName: "Handover Generated",
    sessionId,
    eventData: {
      handoverType,
      handoverUrl,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Track error encountered event
 */
export async function trackErrorEncountered(
  userId: number,
  sessionId: string,
  errorType: string,
  errorMessage: string
): Promise<boolean> {
  return trackResusGpsEvent({
    userId,
    eventType: "error_encountered",
    eventName: `Error: ${errorType}`,
    sessionId,
    eventData: {
      errorType,
      errorMessage,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Get ResusGPS usage statistics for admin reports
 */
export async function getResusGpsStats(daysBack: number = 30): Promise<{
  totalAssessments: number;
  activeUsers: number;
  averageDuration: number;
  topProtocols: Array<{ protocol: string; count: number }>;
  topDecisions: Array<{ decision: string; count: number }>;
}> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[ResusGPS Analytics] Database unavailable");
      return {
        totalAssessments: 0,
        activeUsers: 0,
        averageDuration: 0,
        topProtocols: [],
        topDecisions: [],
      };
    }

    // This is a placeholder implementation
    // In production, this would query the analyticsEvents table
    // and aggregate ResusGPS-specific events
    return {
      totalAssessments: 0,
      activeUsers: 0,
      averageDuration: 0,
      topProtocols: [],
      topDecisions: [],
    };
  } catch (error) {
    console.error("[ResusGPS Analytics] Error getting stats:", error);
    return {
      totalAssessments: 0,
      activeUsers: 0,
      averageDuration: 0,
      topProtocols: [],
      topDecisions: [],
    };
  }
}
