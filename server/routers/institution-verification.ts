import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { institutionalAccounts, institutionVerificationEvents } from "../../drizzle/schema";
import { assertInstitutionAccess } from "../lib/institution-access";
import {
  VERIFICATION_METHODS,
  archiveInstitution,
  restoreInstitution,
  findVerifiedKmhflConflict,
  reviewInstitutionVerification,
  submitVerificationEvidence,
} from "../lib/institution-verification";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
  return db;
}

const httpsUrl = z
  .string()
  .trim()
  .url()
  .max(1000)
  .refine((value) => value.startsWith("https://"), "Evidence link must use https");

export const institutionVerificationRouter = router({
  /** Institution administrator: current verification state (never reveals who else claims a facility). */
  status: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [account] = await db
        .select({
          verificationStatus: institutionalAccounts.verificationStatus,
          verificationMethod: institutionalAccounts.verificationMethod,
          verificationReviewNote: institutionalAccounts.verificationReviewNote,
          verificationSubmittedAt: institutionalAccounts.verificationSubmittedAt,
          verifiedAt: institutionalAccounts.verifiedAt,
        })
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, input.institutionId))
        .limit(1);
      if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found" });
      return {
        ...account,
        grandfathered: account.verificationMethod === "grandfathered",
        facilityClaimedElsewhere: Boolean(await findVerifiedKmhflConflict(db, input.institutionId)),
      };
    }),

  /** Institution administrator: send evidence for review. */
  submitEvidence: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        method: z.enum(VERIFICATION_METHODS),
        evidenceUrl: httpsUrl,
        note: z.string().trim().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      await submitVerificationEvidence(db, {
        institutionId: input.institutionId,
        actorUserId: ctx.user.id,
        method: input.method,
        evidenceUrl: input.evidenceUrl,
        note: input.note,
      });
      return { success: true as const, status: "pending_review" as const };
    }),

  /** Platform administrator: institutions awaiting review, and grandfathered ones still to be reviewed. */
  listForReview: adminProcedure
    .input(z.object({ filter: z.enum(["pending_review", "grandfathered", "unverified", "archived"]).default("pending_review") }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const rows = await db
        .select({
          id: institutionalAccounts.id,
          companyName: institutionalAccounts.companyName,
          contactName: institutionalAccounts.contactName,
          contactEmail: institutionalAccounts.contactEmail,
          registrationNumber: institutionalAccounts.registrationNumber,
          kmhflFacilityId: institutionalAccounts.kmhflFacilityId,
          verificationStatus: institutionalAccounts.verificationStatus,
          verificationMethod: institutionalAccounts.verificationMethod,
          verificationEvidenceUrl: institutionalAccounts.verificationEvidenceUrl,
          verificationEvidenceNote: institutionalAccounts.verificationEvidenceNote,
          verificationSubmittedAt: institutionalAccounts.verificationSubmittedAt,
          archivedAt: institutionalAccounts.archivedAt,
          archiveReason: institutionalAccounts.archiveReason,
        })
        .from(institutionalAccounts)
        .where(
          input.filter === "archived"
            ? isNotNull(institutionalAccounts.archivedAt)
            : and(
                isNull(institutionalAccounts.archivedAt),
                input.filter === "pending_review"
                  ? eq(institutionalAccounts.verificationStatus, "pending_review")
                  : input.filter === "unverified"
                    ? eq(institutionalAccounts.verificationStatus, "unverified")
                    : eq(institutionalAccounts.verificationMethod, "grandfathered"),
              ),
        )
        .orderBy(desc(institutionalAccounts.id))
        .limit(200);
      const withConflicts = [];
      for (const row of rows) {
        withConflicts.push({ ...row, conflictingInstitutionId: (await findVerifiedKmhflConflict(db, row.id))?.institutionId ?? null });
      }
      return { institutions: withConflicts };
    }),

  /** Platform administrator: verify, reject, or revoke. A note is required and recorded. */
  review: adminProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        decision: z.enum(["verify", "reject", "revoke"]),
        note: z.string().trim().min(3).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await reviewInstitutionVerification(db, {
        institutionId: input.institutionId,
        reviewerUserId: ctx.user.id,
        decision: input.decision,
        note: input.note,
      });
      return { success: true as const, status: result.status };
    }),

  /** Platform administrator: archive a duplicate or mistaken institution (reversible, recorded). */
  archive: adminProcedure
    .input(z.object({ institutionId: z.number().int().positive(), reason: z.string().trim().min(3).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await archiveInstitution(db, { institutionId: input.institutionId, actorUserId: ctx.user.id, reason: input.reason });
      return { success: true as const };
    }),

  restore: adminProcedure
    .input(z.object({ institutionId: z.number().int().positive(), reason: z.string().trim().min(3).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await restoreInstitution(db, { institutionId: input.institutionId, actorUserId: ctx.user.id, reason: input.reason });
      return { success: true as const };
    }),

  /** Platform administrator: decision history for one institution. */
  history: adminProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const events = await db
        .select()
        .from(institutionVerificationEvents)
        .where(eq(institutionVerificationEvents.institutionalAccountId, input.institutionId))
        .orderBy(desc(institutionVerificationEvents.createdAt))
        .limit(100);
      return { events };
    }),
});
