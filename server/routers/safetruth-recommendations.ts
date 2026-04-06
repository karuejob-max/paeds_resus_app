import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  generateRoleBasedRecommendations,
  Recommendation,
} from "../services/recommendations.service";

export const safeTruthRecommendationsRouter = router({
  /**
   * Get personalized recommendations for current user
   */
  getRecommendations: protectedProcedure
    .input(
      z.object({
        role: z.enum(["clinician", "nurse", "facility_manager", "parent_caregiver", "government"]),
        systemGaps: z.array(z.string()).optional(),
        workstation: z.string().optional(),
        eventOutcome: z.string().optional(),
        limit: z.number().default(5),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const recommendations = await generateRoleBasedRecommendations({
          userId: ctx.user.id,
          systemGapsIdentified: input.systemGaps || [],
          userRole: input.role,
          workstation: input.workstation,
          eventOutcome: input.eventOutcome || "",
        });

        return {
          success: true,
          data: recommendations.slice(0, input.limit),
          total: recommendations.length,
        };
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        return {
          success: false,
          data: [],
          total: 0,
          error: "Failed to fetch recommendations",
        };
      }
    }),

  /**
   * Get recommendations by priority
   */
  getByPriority: protectedProcedure
    .input(
      z.object({
        role: z.enum(["clinician", "nurse", "facility_manager", "parent_caregiver", "government"]),
        systemGaps: z.array(z.string()).optional(),
        priority: z.enum(["high", "medium", "low"]).optional(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const recommendations = await generateRoleBasedRecommendations({
          userId: ctx.user.id,
          systemGapsIdentified: input.systemGaps || [],
          userRole: input.role,
          eventOutcome: "",
        });

        let filtered = recommendations;
        if (input.priority) {
          filtered = recommendations.filter((r: any) => r.priority === input.priority);
        }

        return {
          success: true,
          data: filtered.slice(0, input.limit),
          total: filtered.length,
        };
      } catch (error) {
        console.error("Error fetching recommendations by priority:", error);
        return {
          success: false,
          data: [],
          total: 0,
          error: "Failed to fetch recommendations",
        };
      }
    }),




});
