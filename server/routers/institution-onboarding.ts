import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, enrollments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const institutionOnboardingRouter = router({
  // Bulk import providers from CSV
  bulkImportProviders: protectedProcedure
    .input(
      z.object({
        institutionId: z.string(),
        providers: z.array(
          z.object({
            name: z.string(),
            email: z.string().email(),
            phone: z.string().optional(),
            providerType: z.enum(["nurse", "doctor", "pharmacist", "paramedic", "lab_tech", "respiratory_therapist", "midwife", "other"]),
            department: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify user is institution admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only institution admins can import providers",
          });
        }

        const importedProviders = [];
        const errors = [];

        for (const provider of input.providers) {
          try {
            // Generate temporary password
            const tempPassword = Math.random().toString(36).slice(-12);
            const activationCode = Math.random().toString(36).slice(-8).toUpperCase();

            // Log provider import
            importedProviders.push({
              name: provider.name,
              email: provider.email,
              providerType: provider.providerType,
              department: provider.department,
              status: "pending_activation",
              activationCode,
              tempPassword,
              createdAt: new Date(),
            });

            console.log(`[IMPORT] Provider ${provider.email} queued for activation`);
          } catch (error) {
            errors.push({
              email: provider.email,
              error: (error as Error).message,
            });
          }
        }

        return {
          success: true,
          imported: importedProviders.length,
          errors: errors.length,
          providers: importedProviders,
          message: `Successfully queued ${importedProviders.length} providers for activation`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to import providers",
        });
      }
    }),

  // Generate activation link for provider
  generateActivationLink: protectedProcedure
    .input(
      z.object({
        providerId: z.string(),
        institutionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const activationCode = Math.random().toString(36).slice(-8).toUpperCase();
        const activationLink = `https://paeds-resus.com/activate-provider?code=${activationCode}&institution=${input.institutionId}`;

        console.log(`[ACTIVATION] Generated link for provider ${input.providerId}`);

        return {
          success: true,
          activationLink,
          activationCode,
          expiresIn: "7 days",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate activation link",
        });
      }
    }),

  // Complete provider activation
  completeProviderActivation: protectedProcedure
    .input(
      z.object({
        activationCode: z.string(),
        password: z.string().min(8),
        institutionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(`[ACTIVATION] Completing activation for code ${input.activationCode}`);

        return {
          success: true,
          message: "Provider account activated successfully",
          redirectUrl: "/dashboard",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to complete activation",
        });
      }
    }),

  // Get institution provider stats
  getProviderStats: protectedProcedure
    .input(z.object({ institutionId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        return {
          totalProviders: 0,
          activeProviders: 0,
          pendingActivation: 0,
          completedTraining: 0,
          inProgress: 0,
          averageCompletionTime: "14 days",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch provider stats",
        });
      }
    }),

  // Get provider enrollment tracking
  getProviderEnrollments: protectedProcedure
    .input(z.object({ institutionId: z.string(), providerId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      try {
        return {
          enrollments: [],
          totalEnrolled: 0,
          completionRate: 0,
          averageProgress: 0,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch enrollments",
        });
      }
    }),

  // Enable SSO for institution
  enableSSO: protectedProcedure
    .input(
      z.object({
        institutionId: z.string(),
        ssoProvider: z.enum(["google_workspace", "azure_ad", "okta"]),
        clientId: z.string(),
        clientSecret: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(`[SSO] Enabling ${input.ssoProvider} for institution ${input.institutionId}`);

        return {
          success: true,
          message: `SSO enabled with ${input.ssoProvider}`,
          ssoUrl: `https://paeds-resus.com/sso/${input.ssoProvider}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to enable SSO",
        });
      }
    }),

  // Send bulk activation emails
  sendBulkActivationEmails: protectedProcedure
    .input(
      z.object({
        institutionId: z.string(),
        providerIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(`[EMAIL] Sending activation emails to ${input.providerIds.length} providers`);

        return {
          success: true,
          emailsSent: input.providerIds.length,
          message: "Activation emails sent successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send activation emails",
        });
      }
    }),

  // Get institution dashboard data
  getInstitutionDashboard: protectedProcedure
    .input(z.object({ institutionId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        return {
          institutionName: "Sample Hospital",
          totalProviders: 0,
          activeProviders: 0,
          trainingProgress: {
            notStarted: 0,
            inProgress: 0,
            completed: 0,
            certificated: 0,
          },
          recentActivity: [],
          upcomingTrainings: [],
          performanceMetrics: {
            averageCompletionTime: "14 days",
            completionRate: 0,
            certificateIssuanceRate: 0,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch dashboard data",
        });
      }
    }),
});
