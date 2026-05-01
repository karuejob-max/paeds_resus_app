import { z } from "zod";
import { inArray } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  saveCertificate,
  verifyCertificate,
  verifyCertificateByVerificationCode,
  getCertificateByEnrollmentId,
  getCertificateStats,
  getCertificatesByUserId,
  getCertificateForDownload,
  hasCertificateDownloadFeedback,
  submitCertificateDownloadFeedback,
} from "../certificates";
import { sendEmail } from "../email-service";
import { getDb } from "../db";
import { certificates } from "../../drizzle/schema";
import { generateCertificatePDF as generateCertificatePDFBranded } from "../certificate-pdf";

const certificateSchema = z.object({
  enrollmentId: z.number(),
  recipientName: z.string(),
  programType: z.enum(["bls", "acls", "pals", "fellowship", "instructor", "fellowship_diploma"]),
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

  /** Public lookup by verification hash (QR code / PDF footer). */
  verifyByCode: publicProcedure
    .input(z.object({ code: z.string().min(16).max(256) }))
    .query(async ({ input }) => {
      return verifyCertificateByVerificationCode(input.code.trim());
    }),

  // Get current user's certificates (My Certificates)
  getMyCertificates: protectedProcedure.query(async ({ ctx }) => {
    const list = await getCertificatesByUserId(ctx.user.id);
    return {
      success: true,
      certificates: list.map((c) => ({
        id: c.id,
        enrollmentId: c.enrollmentId,
        certificateNumber: c.certificateNumber,
        programType: c.programType,
        courseTitle: c.courseTitle ?? null,
        issueDate: c.issueDate,
        expiryDate: c.expiryDate,
        certificateUrl: c.certificateUrl,
      })),
    };
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

  /**
   * P1-CERT-1: Send renewal reminder email (user-initiated; requires expiring cert + email on account).
   */
  requestRenewalReminderEmail: protectedProcedure.mutation(async ({ ctx }) => {
    const email = ctx.user.email?.trim();
    if (!email) {
      return { success: false as const, error: "Add an email to your account to receive reminders." };
    }

    const list = await getCertificatesByUserId(ctx.user.id);
    const now = Date.now();
    const msPerDay = 86400000;
    const attention = list.filter((c) => {
      if (!c.expiryDate) return false;
      const t = new Date(c.expiryDate).getTime();
      if (Number.isNaN(t)) return false;
      const days = Math.ceil((t - now) / msPerDay);
      return days <= 90 && days >= -730;
    });

    if (attention.length === 0) {
      return {
        success: false as const,
        error: "No certificates need renewal within the reminder window.",
      };
    }

    const base = process.env.APP_BASE_URL?.replace(/\/$/, "") || "https://app.paedsresus.com";
    const renewLink = `${base}/enroll`;
    const programSummary = attention
      .map((c) => {
        const label = (c.programType || "course").toUpperCase();
        const exp = c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : "—";
        return `${label} - expires ${exp}`;
      })
      .join("\n");

    const result = await sendEmail(email, "certificateRenewalReminder", {
      userName: ctx.user.name?.trim() || "there",
      programSummary,
      renewLink,
    });

    if (!result.success) {
      return { success: false as const, error: result.error ?? "Email could not be sent." };
    }

    const db = await getDb();
    if (db && attention.length > 0) {
      await db
        .update(certificates)
        .set({ renewalReminderSentAt: new Date() })
        .where(
          inArray(
            certificates.id,
            attention.map((c) => c.id)
          )
        );
    }

    return { success: true as const, messageId: result.messageId };
  }),

  /** Whether pre-download feedback exists for this certificate (required before PDF). */
  getDownloadFeedbackStatus: protectedProcedure
    .input(z.object({ certificateNumber: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const data = await getCertificateForDownload(input.certificateNumber, ctx.user.id);
      if (!data) {
        return { ok: false as const, error: "not_found" as const };
      }
      const submitted = await hasCertificateDownloadFeedback(ctx.user.id, data.cert.id);
      return {
        ok: true as const,
        certificateId: data.cert.id,
        submitted,
        programType: data.cert.programType,
        courseTitle: data.courseDisplayName ?? null,
      };
    }),

  /** Save one-time feedback before certificate download. */
  submitDownloadFeedback: protectedProcedure
    .input(
      z.object({
        certificateId: z.number().int().positive(),
        rating: z.number().int().min(1).max(5),
        improvements: z.string().min(10).max(8000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await submitCertificateDownloadFeedback({
        userId: ctx.user.id,
        certificateId: input.certificateId,
        rating: input.rating,
        improvements: input.improvements,
      });
      return result.success
        ? { success: true as const }
        : { success: false as const, error: result.error ?? "Failed" };
    }),

  // Download certificate (generate PDF on demand)
  download: protectedProcedure
    .input(z.object({ certificateNumber: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const data = await getCertificateForDownload(input.certificateNumber, ctx.user.id);
        if (!data) {
          return { success: false, error: "Certificate not found or access denied" };
        }
        const feedbackOk = await hasCertificateDownloadFeedback(ctx.user.id, data.cert.id);
        if (!feedbackOk) {
          return {
            success: false,
            error: "feedback_required",
            certificateId: data.cert.id,
          };
        }
        const { cert, trainingDate, recipientName, courseDisplayName } = data;
        const verificationCode = cert.verificationCode ?? cert.certificateNumber ?? "";
        const pdfBuffer = await generateCertificatePDFBranded({
          recipientName,
          programType: cert.programType,
          trainingDate,
          instructorName: "Paeds Resus",
          certificateNumber: cert.certificateNumber ?? "",
          verificationCode,
          ...(courseDisplayName ? { courseDisplayName } : {}),
        });
        const pdfBase64 = pdfBuffer.toString("base64");
        const slug =
          (courseDisplayName || cert.programType || "certificate")
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 48) || "certificate";
        const filename = `${slug}-${cert.certificateNumber ?? "download"}.pdf`;
        return { success: true, pdfBase64, filename };
      } catch (error) {
        console.error("[Certificate Router] Error downloading certificate:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
});
