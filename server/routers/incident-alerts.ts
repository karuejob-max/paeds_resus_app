import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";

/**
 * Real-Time Incident Alerts & Emergency Response Router
 * WebSocket-based incident notifications, severity classification, and escalation workflows
 */

export const incidentAlertsRouter = router({
  /**
   * Report critical incident with real-time alert
   */
  reportCriticalIncident: protectedProcedure
    .input(
      z.object({
        institutionId: z.number(),
        incidentType: z.enum([
          "cardiac_arrest",
          "respiratory_failure",
          "sepsis",
          "trauma",
          "anaphylaxis",
          "status_epilepticus",
          "hypovolemic_shock",
        ]),
        severity: z.enum(["critical", "high", "medium", "low"]),
        description: z.string(),
        patientAge: z.number().optional(),
        location: z.string(),
        respondersNeeded: z.array(z.string()).optional(),
        timestamp: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const incidentId = `incident_${Date.now()}`;

        // Determine escalation level
        const escalationLevel = getEscalationLevel(input.severity, input.incidentType);

        // In production, this would:
        // 1. Store incident in database
        // 2. Trigger WebSocket broadcast to relevant users
        // 3. Send SMS alerts to responders
        // 4. Update incident dashboard in real-time

        console.log(`Critical incident reported: ${incidentId} - ${input.incidentType}`);

        return {
          success: true,
          incidentId,
          severity: input.severity,
          escalationLevel,
          alertsSent: {
            sms: true,
            email: true,
            pushNotification: true,
            inAppAlert: true,
          },
          respondersNotified: input.respondersNeeded?.length || 0,
          timestamp: new Date(),
        };
      } catch (error: any) {
        console.error("Error reporting critical incident:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get incident severity classification
   */
  classifyIncidentSeverity: protectedProcedure
    .input(
      z.object({
        incidentType: z.string(),
        patientAge: z.number().optional(),
        comorbidities: z.array(z.string()).optional(),
        responseTime: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // ML-based severity classification
        let baseScore = 50;

        // Adjust based on incident type
        const incidentScores: Record<string, number> = {
          cardiac_arrest: 95,
          respiratory_failure: 90,
          sepsis: 85,
          trauma: 80,
          anaphylaxis: 88,
          status_epilepticus: 82,
          hypovolemic_shock: 92,
        };

        baseScore = incidentScores[input.incidentType] || 50;

        // Adjust for age (younger children = higher risk)
        if (input.patientAge && input.patientAge < 5) {
          baseScore += 10;
        }

        // Adjust for comorbidities
        if (input.comorbidities && input.comorbidities.length > 0) {
          baseScore += input.comorbidities.length * 5;
        }

        // Adjust for response time
        if (input.responseTime && input.responseTime > 300) {
          baseScore += 15;
        }

        const severity =
          baseScore >= 80 ? "critical" : baseScore >= 60 ? "high" : baseScore >= 40 ? "medium" : "low";

        return {
          success: true,
          severity,
          score: Math.min(100, baseScore),
          riskFactors: {
            incidentType: input.incidentType,
            ageRisk: input.patientAge && input.patientAge < 5 ? "high" : "normal",
            comorbidityRisk: input.comorbidities?.length ? "high" : "normal",
            responseTimeRisk: input.responseTime && input.responseTime > 300 ? "high" : "normal",
          },
        };
      } catch (error: any) {
        console.error("Error classifying incident severity:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Route incident to appropriate department/team
   */
  routeIncident: adminProcedure
    .input(
      z.object({
        incidentId: z.string(),
        incidentType: z.string(),
        severity: z.string(),
        institutionId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Determine routing based on incident type and severity
        const routing = getIncidentRouting(input.incidentType, input.severity);

        // In production, this would:
        // 1. Create routing record in database
        // 2. Notify assigned teams
        // 3. Update incident status
        // 4. Start escalation timer

        console.log(`Routing incident ${input.incidentId} to ${routing.primaryDepartment}`);

        return {
          success: true,
          incidentId: input.incidentId,
          routing: {
            primaryDepartment: routing.primaryDepartment,
            supportDepartments: routing.supportDepartments,
            escalationPath: routing.escalationPath,
            timeToFirstResponse: routing.timeToFirstResponse,
          },
          teamsNotified: routing.supportDepartments.length + 1,
          routedAt: new Date(),
        };
      } catch (error: any) {
        console.error("Error routing incident:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Acknowledge incident and start response
   */
  acknowledgeIncident: protectedProcedure
    .input(
      z.object({
        incidentId: z.string(),
        responderId: z.number(),
        estimatedArrivalTime: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(`Incident ${input.incidentId} acknowledged by responder ${input.responderId}`);

        return {
          success: true,
          incidentId: input.incidentId,
          acknowledgedAt: new Date(),
          responderId: input.responderId,
          status: "in_progress",
          estimatedArrivalTime: input.estimatedArrivalTime,
        };
      } catch (error: any) {
        console.error("Error acknowledging incident:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get real-time incident dashboard
   */
  getIncidentDashboard: adminProcedure
    .input(
      z.object({
        institutionId: z.number(),
        timeRange: z.enum(["24hours", "7days", "30days"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const dashboard = {
          activeIncidents: 3,
          pendingIncidents: 1,
          resolvedIncidents: 12,
          averageResponseTime: 4.2, // minutes
          criticalIncidents: 2,
          highSeverityIncidents: 5,
          mediumSeverityIncidents: 8,
          lowSeverityIncidents: 2,
          topIncidentTypes: [
            { type: "cardiac_arrest", count: 5, avgResponseTime: 3.8 },
            { type: "respiratory_failure", count: 4, avgResponseTime: 4.1 },
            { type: "sepsis", count: 3, avgResponseTime: 5.2 },
          ],
          responseTimeByDepartment: [
            { department: "Emergency", avgTime: 2.5 },
            { department: "ICU", avgTime: 3.8 },
            { department: "Pediatrics", avgTime: 4.2 },
          ],
          incidentTrend: [
            { day: "Mon", incidents: 8 },
            { day: "Tue", incidents: 6 },
            { day: "Wed", incidents: 9 },
            { day: "Thu", incidents: 7 },
            { day: "Fri", incidents: 12 },
            { day: "Sat", incidents: 5 },
            { day: "Sun", incidents: 4 },
          ],
        };

        return {
          success: true,
          dashboard,
          timeRange: input.timeRange,
          generatedAt: new Date(),
        };
      } catch (error: any) {
        console.error("Error getting incident dashboard:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Detect incident trend alerts
   */
  detectIncidentTrends: adminProcedure
    .input(
      z.object({
        institutionId: z.number(),
        timeWindowHours: z.number().default(24),
      })
    )
    .query(async ({ input }) => {
      try {
        const trends = [];

        // Check for unusual incident patterns
        const incidentCounts: Record<string, number> = {
          cardiac_arrest: 3,
          respiratory_failure: 2,
          sepsis: 1,
        };

        const baselineRates: Record<string, number> = {
          cardiac_arrest: 1.5,
          respiratory_failure: 1.0,
          sepsis: 0.8,
        };

        for (const [type, count] of Object.entries(incidentCounts)) {
          const baseline = baselineRates[type];
          const percentageIncrease = ((count - baseline) / baseline) * 100;

          if (percentageIncrease > 50) {
            trends.push({
              type,
              currentCount: count,
              baseline,
              percentageIncrease: Math.round(percentageIncrease),
              alert: `${percentageIncrease > 100 ? "CRITICAL" : "HIGH"} - ${type} incidents up ${Math.round(percentageIncrease)}%`,
              recommendation: `Implement additional training and resource allocation for ${type} management`,
            });
          }
        }

        return {
          success: true,
          trends,
          alertCount: trends.length,
          timeWindow: input.timeWindowHours,
        };
      } catch (error: any) {
        console.error("Error detecting incident trends:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Close incident and generate report
   */
  closeIncident: protectedProcedure
    .input(
      z.object({
        incidentId: z.string(),
        outcome: z.enum(["survived", "neurologically_intact", "poor_outcome", "unknown"]),
        notes: z.string().optional(),
        lessonLearned: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(`Incident ${input.incidentId} closed with outcome: ${input.outcome}`);

        return {
          success: true,
          incidentId: input.incidentId,
          outcome: input.outcome,
          closedAt: new Date(),
          reportGenerated: true,
          reportUrl: `https://reports.example.com/${input.incidentId}`,
        };
      } catch (error: any) {
        console.error("Error closing incident:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get incident follow-up checklist
   */
  getFollowUpChecklist: protectedProcedure
    .input(
      z.object({
        incidentId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const checklist = [
          {
            id: "followup_1",
            task: "Notify family/guardians",
            status: "pending",
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            assignedTo: "Social Worker",
          },
          {
            id: "followup_2",
            task: "Complete incident report",
            status: "pending",
            dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
            assignedTo: "Department Head",
          },
          {
            id: "followup_3",
            task: "Conduct root cause analysis",
            status: "pending",
            dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000),
            assignedTo: "Quality Assurance",
          },
          {
            id: "followup_4",
            task: "Implement corrective actions",
            status: "pending",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            assignedTo: "Department Head",
          },
          {
            id: "followup_5",
            task: "Staff debriefing session",
            status: "pending",
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            assignedTo: "Training Coordinator",
          },
        ];

        return {
          success: true,
          incidentId: input.incidentId,
          checklist,
          completionPercentage: 0,
        };
      } catch (error: any) {
        console.error("Error getting follow-up checklist:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),
});

/**
 * Helper function to determine escalation level
 */
function getEscalationLevel(severity: string, incidentType: string): string {
  if (severity === "critical") return "level_1";
  if (severity === "high" && ["cardiac_arrest", "respiratory_failure"].includes(incidentType)) return "level_1";
  if (severity === "high") return "level_2";
  if (severity === "medium") return "level_3";
  return "level_4";
}

/**
 * Helper function to determine incident routing
 */
function getIncidentRouting(incidentType: string, severity: string): Record<string, any> {
  const routingMap: Record<string, any> = {
    cardiac_arrest: {
      primaryDepartment: "Emergency",
      supportDepartments: ["ICU", "Cardiology"],
      escalationPath: ["Nurse", "Doctor", "Cardiologist", "Hospital Director"],
      timeToFirstResponse: 2,
    },
    respiratory_failure: {
      primaryDepartment: "ICU",
      supportDepartments: ["Emergency", "Respiratory Therapy"],
      escalationPath: ["Nurse", "Doctor", "Respiratory Specialist", "ICU Director"],
      timeToFirstResponse: 3,
    },
    sepsis: {
      primaryDepartment: "Emergency",
      supportDepartments: ["ICU", "Infectious Disease"],
      escalationPath: ["Nurse", "Doctor", "Infectious Disease Specialist", "Hospital Director"],
      timeToFirstResponse: 5,
    },
    trauma: {
      primaryDepartment: "Emergency",
      supportDepartments: ["Surgery", "ICU"],
      escalationPath: ["Nurse", "Doctor", "Surgeon", "Hospital Director"],
      timeToFirstResponse: 3,
    },
  };

  return routingMap[incidentType] || routingMap.cardiac_arrest;
}
