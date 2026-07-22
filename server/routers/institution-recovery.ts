import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  institutionalRecoveryRequests,
  institutionalAdminInvites,
  institutionalAccounts,
} from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * North Star v2.0 §6.1: "Account recovery requires institutional identity
 * verification — facility letterhead, MoH registration number — not
 * personal credential reset. If both admin contacts are unreachable,
 * recovery is via institutional verification only."
 *
 * `submit` is deliberately public/no-auth — the entire scenario this exists
 * for is "nobody at this institution can log in." Matching a submission to
 * a real institutionalAccountId is a manual step by the reviewing platform
 * admin (design conversation, option A: the requester types the
 * institution's claimed name/registration number rather than referencing an
 * internal ID they likely don't have) — this router does not attempt to
 * auto-match, on purpose. The human reviewer, weighing the letterhead and
 * registration number evidence, is the actual security control here, not
 * the code.
 */
export const institutionRecoveryRouter = router({
  /** Public — anyone can submit a recovery request without being logged in. */
  submit: publicProcedure
    .input(
      z.object({
        companyNameClaimed: z.string().min(2),
        claimedRegistrationNumber: z.string().optional(),
        requesterName: z.string().min(1),
        requesterEmail: z.string().email(),
        requesterPhone: z.string().optional(),
        requesterRoleClaim: z.string().optional(),
        letterheadUrl: z.string().url(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }

      const result = await db.insert(institutionalRecoveryRequests).values({
        companyNameClaimed: input.companyNameClaimed,
        claimedRegistrationNumber: input.claimedRegistrationNumber,
        requesterName: input.requesterName,
        requesterEmail: input.requesterEmail,
        requesterPhone: input.requesterPhone,
        requesterRoleClaim: input.requesterRoleClaim,
        letterheadUrl: input.letterheadUrl,
        notes: input.notes,
        status: "pending",
      });

      const requestId = (result as unknown as { insertId: number }).insertId;
      return { success: true, requestId };
    }),

  /** Platform-admin-only review queue. */
  list: adminProcedure
    .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }

      const rows = input?.status
        ? await db
            .select()
            .from(institutionalRecoveryRequests)
            .where(eq(institutionalRecoveryRequests.status, input.status))
            .orderBy(desc(institutionalRecoveryRequests.createdAt))
        : await db
            .select()
            .from(institutionalRecoveryRequests)
            .orderBy(desc(institutionalRecoveryRequests.createdAt));

      return { requests: rows };
    }),

  /**
   * Approve or reject a recovery request. Approval requires the reviewer to
   * specify which institutionalAccountId this was manually matched to, and
   * creates an institutionalAdminInvites row for the requester's email on
   * that institution — reusing the same accept-on-next-login primitive as a
   * live admin's ordinary invite (institutionAdmins.acceptInvite).
   */
  review: adminProcedure
    .input(
      z.object({
        requestId: z.number().int().positive(),
        decision: z.enum(["approve", "reject"]),
        matchedInstitutionalAccountId: z.number().int().positive().optional(),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }

      const [request] = await db
        .select()
        .from(institutionalRecoveryRequests)
        .where(eq(institutionalRecoveryRequests.id, input.requestId))
        .limit(1);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recovery request not found" });
      }
      if (request.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This request has already been reviewed." });
      }

      if (input.decision === "reject") {
        await db
          .update(institutionalRecoveryRequests)
          .set({
            status: "rejected",
            reviewedByUserId: ctx.user.id,
            reviewedAt: new Date(),
            reviewNotes: input.reviewNotes,
          })
          .where(eq(institutionalRecoveryRequests.id, input.requestId));
        return { success: true, status: "rejected" as const };
      }

      if (!input.matchedInstitutionalAccountId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Approving a recovery request requires matching it to an institution first.",
        });
      }

      const [institution] = await db
        .select({ id: institutionalAccounts.id })
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, input.matchedInstitutionalAccountId))
        .limit(1);
      if (!institution) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Matched institution not found" });
      }

      await db
        .update(institutionalRecoveryRequests)
        .set({
          status: "approved",
          matchedInstitutionalAccountId: input.matchedInstitutionalAccountId,
          reviewedByUserId: ctx.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes,
        })
        .where(eq(institutionalRecoveryRequests.id, input.requestId));

      await db.insert(institutionalAdminInvites).values({
        institutionalAccountId: input.matchedInstitutionalAccountId,
        invitedEmail: request.requesterEmail,
        invitedName: request.requesterName,
        invitedPhone: request.requesterPhone,
        invitedByUserId: null,
        source: "recovery_approval",
        status: "pending",
      });

      return { success: true, status: "approved" as const };
    }),
});
