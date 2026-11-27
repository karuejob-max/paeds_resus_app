import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { institutionalAccounts, institutionVerificationEvents, kmhflFacilities } from "../../drizzle/schema";
import { storageGet } from "../storage";
import { storeEvidenceFile } from "../lib/institution-verification-evidence";
import { assertInstitutionAccess } from "../lib/institution-access";
import {
  VERIFICATION_METHODS,
  archiveInstitution,
  restoreInstitution,
  registryNameMatch,
  setInstitutionFacility,
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

type RouterDb = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** The registry facility an institution is linked to, for display. */
async function registryFacility(db: RouterDb, kmhflFacilityId: number | null) {
  if (!kmhflFacilityId) return null;
  const [facility] = await db
    .select({
      id: kmhflFacilities.id,
      name: kmhflFacilities.name,
      code: kmhflFacilities.code,
      county: kmhflFacilities.county,
      facilityType: kmhflFacilities.facilityType,
      operationalStatus: kmhflFacilities.operationalStatus,
    })
    .from(kmhflFacilities)
    .where(eq(kmhflFacilities.id, kmhflFacilityId))
    .limit(1);
  return facility ?? null;
}

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
          kmhflFacilityId: institutionalAccounts.kmhflFacilityId,
          verificationLicenceNumber: institutionalAccounts.verificationLicenceNumber,
          verificationEvidenceFileName: institutionalAccounts.verificationEvidenceFileName,
          verificationEvidenceUrl: institutionalAccounts.verificationEvidenceUrl,
          verificationFacilityNotListed: institutionalAccounts.verificationFacilityNotListed,
        })
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, input.institutionId))
        .limit(1);
      if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Institution not found" });
      return {
        ...account,
        facility: await registryFacility(db, account.kmhflFacilityId),
        grandfathered: account.verificationMethod === "grandfathered",
        facilityClaimedElsewhere: Boolean(await findVerifiedKmhflConflict(db, input.institutionId)),
      };
    }),

  /** Institution administrator: choose the registry facility (before the evidence is under review). */
  setFacility: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive(), kmhflFacilityId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const facility = await setInstitutionFacility(db, { ...input, asPlatformAdmin: false, actorUserId: ctx.user.id });
      return { success: true as const, ...facility };
    }),

  /** Institution administrator: send the facility, licence number and evidence in one step. */
  submitEvidence: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        method: z.enum(VERIFICATION_METHODS),
        /** The registry facility chosen in the picker. Omit if already chosen, or if facilityNotListed. */
        kmhflFacilityId: z.number().int().positive().optional(),
        facilityNotListed: z.boolean().optional(),
        licenceNumber: z.string().trim().max(100).optional(),
        evidenceUrl: httpsUrl.optional(),
        evidenceBase64: z.string().max(8 * 1024 * 1024).optional(),
        evidenceFileName: z.string().trim().max(255).optional(),
        evidenceContentType: z.string().trim().max(100).optional(),
        note: z.string().trim().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      if (input.kmhflFacilityId && !input.facilityNotListed) {
        await setInstitutionFacility(db, { institutionId: input.institutionId, kmhflFacilityId: input.kmhflFacilityId, asPlatformAdmin: false, actorUserId: ctx.user.id });
      }
      let evidenceFile: { key: string; fileName: string; contentType: string } | null = null;
      if (input.evidenceBase64) {
        if (!input.evidenceFileName || !input.evidenceContentType) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "The file name and type are required." });
        }
        evidenceFile = await storeEvidenceFile(input.institutionId, {
          base64: input.evidenceBase64,
          fileName: input.evidenceFileName,
          contentType: input.evidenceContentType,
        });
      }
      await submitVerificationEvidence(db, {
        institutionId: input.institutionId,
        actorUserId: ctx.user.id,
        method: input.method,
        evidenceUrl: input.evidenceUrl ?? null,
        evidenceFile,
        licenceNumber: input.licenceNumber,
        facilityNotListed: input.facilityNotListed,
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
          verificationLicenceNumber: institutionalAccounts.verificationLicenceNumber,
          verificationEvidenceFileName: institutionalAccounts.verificationEvidenceFileName,
          verificationEvidenceKey: institutionalAccounts.verificationEvidenceKey,
          verificationFacilityNotListed: institutionalAccounts.verificationFacilityNotListed,
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
        const { verificationEvidenceKey, ...rest } = row;
        const facility = await registryFacility(db, row.kmhflFacilityId);
        withConflicts.push({
          ...rest,
          hasEvidenceFile: Boolean(verificationEvidenceKey),
          facility,
          nameMatch: registryNameMatch(row.companyName, facility?.name),
          conflictingInstitutionId: (await findVerifiedKmhflConflict(db, row.id))?.institutionId ?? null,
        });
      }
      return { institutions: withConflicts };
    }),

  /** Platform administrator: short-lived private link to the uploaded evidence file. */
  evidenceFileUrl: adminProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const [row] = await db
        .select({ key: institutionalAccounts.verificationEvidenceKey, fileName: institutionalAccounts.verificationEvidenceFileName })
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.id, input.institutionId))
        .limit(1);
      if (!row?.key) throw new TRPCError({ code: "NOT_FOUND", message: "No uploaded file for this institution." });
      const { url } = await storageGet(row.key);
      return { url, fileName: row.fileName };
    }),

  /** Platform administrator: link or correct the registry facility on any institution. */
  adminSetFacility: adminProcedure
    .input(z.object({ institutionId: z.number().int().positive(), kmhflFacilityId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const facility = await setInstitutionFacility(db, { ...input, asPlatformAdmin: true, actorUserId: ctx.user.id });
      return { success: true as const, ...facility };
    }),

  /** Platform administrator: verify, reject, or revoke. A note is required and recorded. */
  review: adminProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        decision: z.enum(["verify", "reject", "revoke"]),
        note: z.string().trim().min(3).max(1000),
        /** Confirm that this institution is genuinely not a registry facility (e.g. a training body). */
        allowWithoutRegistry: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const result = await reviewInstitutionVerification(db, {
        institutionId: input.institutionId,
        reviewerUserId: ctx.user.id,
        decision: input.decision,
        note: input.note,
        allowWithoutRegistry: input.allowWithoutRegistry,
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
