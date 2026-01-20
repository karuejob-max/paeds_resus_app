import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  saveCertificate,
  verifyCertificate,
  getCertificateByEnrollmentId,
  getCertificateStats,
} from "../certificates";

const certificateSchema = z.object({
  enrollmentId: z.number(),
  recipientName: z.string(),
  programType: z.enum(["bls", "acls", "pals", "fellowship"]),
  trainingDate: z.date(),
  instructorName: z.string(),
});

const verifyCertificateSchema = z.object({
  certificateNumber: z.string(),
  recipientName: z.string(),
});

export const certificateRouter = router({
  // Generate and save a new certificate
  generate: protectedProcedure
    .input(certificateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await saveCertificate(
          input.enrollmentId,
          input.recipientName,
          input.programType,
          input.trainingDate,
          input.instructorName
        );

        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          certificateNumber: result.certificateNumber,
          verificationCode: result.verificationHash,
        };
      } catch (error) {
        console.error("[Certificate Router] Error generating certificate:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  // Verify a certificate
  verify: publicProcedure
    .input(verifyCertificateSchema)
    .query(async ({ input }) => {
      try {
        const result = await verifyCertificate(
          input.certificateNumber,
          input.recipientName
        );

        return {
          valid: result.valid,
          error: result.error,
          certificate: result.certificate
            ? {
                certificateNumber: result.certificate.certificateNumber,
                programType: result.certificate.programType,
                issueDate: result.certificate.issueDate,
                expiryDate: result.certificate.expiryDate,
              }
            : null,
        };
      } catch (error) {
        console.error("[Certificate Router] Error verifying certificate:", error);
        return {
          valid: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  // Get certificate by enrollment ID
  getByEnrollmentId: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ input }) => {
      try {
        const certificate = await getCertificateByEnrollmentId(input.enrollmentId);

        if (!certificate) {
          return {
            success: false,
            error: "Certificate not found",
          };
        }

        return {
          success: true,
          certificate: {
            certificateNumber: certificate.certificateNumber,
            programType: certificate.programType,
            issueDate: certificate.issueDate,
            expiryDate: certificate.expiryDate,
            certificateUrl: certificate.certificateUrl,
          },
        };
      } catch (error) {
        console.error("[Certificate Router] Error getting certificate:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  // Get certificate statistics (admin only)
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Check if user is admin
      if (ctx.user.role !== "admin") {
        return {
          success: false,
          error: "Unauthorized: Admin access required",
        };
      }

      const result = await getCertificateStats();

      return result;
    } catch (error) {
      console.error("[Certificate Router] Error getting stats:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  // Download certificate (placeholder)
  download: protectedProcedure
    .input(z.object({ certificateNumber: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        // TODO: Implement certificate download from S3
        return {
          success: true,
          downloadUrl: `/api/certificates/download/${input.certificateNumber}`,
        };
      } catch (error) {
        console.error("[Certificate Router] Error downloading certificate:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
});
