import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm";
import { z } from "zod";
import {
  globalEntitlements,
  globalEntitlementRedemptions,
  institutionalAccounts,
  microCourses,
  courses,
  users,
} from "../../drizzle/schema";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  GLOBAL_ENTITLEMENT_BENEFIT_TYPES,
  GLOBAL_ENTITLEMENT_PROGRAM_TYPES,
  createAccessCode,
  hashRecipientEmail,
  newEntitlementReference,
} from "../lib/global-entitlements";

const programmeLabels = {
  ierp: "IERP — Intern Emergency Readiness Program",
  nerp: "NERP — Nurses Emergency Readiness Program",
  paeds_resus_ils: "ILSP — Institutional Life Support Program",
  self_pay: "Self-pay fellowship microcourse",
  bls: "Self-pay BLS",
  acls: "Self-pay ACLS",
  pals: "Self-pay PALS",
  heartsaver: "Self-pay Heartsaver",
  nrp: "Self-pay NRP",
  instructor: "Self-pay Instructor Course",
} as const;

export const createEntitlementInput = z
  .object({
    programType: z.enum(GLOBAL_ENTITLEMENT_PROGRAM_TYPES),
    targetUserId: z.number().int().positive().nullable().optional(),
    targetInstitutionalAccountId: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),
    selfPayCourseId: z.string().trim().min(1).max(128).nullable().optional(),
    benefitType: z.enum(GLOBAL_ENTITLEMENT_BENEFIT_TYPES),
    discountPercent: z.number().int().min(1).max(99).nullable().optional(),
    reason: z.string().trim().min(10).max(500),
    expiresAt: z.string().date(),
    maxRedemptions: z.number().int().min(1).max(1000).default(1),
    shareable: z.boolean().default(false),
    recipientEmail: z.string().trim().email().max(320).nullable().optional(),
  })
  .superRefine((input, ctx) => {
    const targetUser = input.targetUserId != null;
    const targetInstitution = input.targetInstitutionalAccountId != null;
    const shareable = input.shareable === true;
    if (shareable && !input.recipientEmail) {
      ctx.addIssue({
        code: "custom",
        path: ["recipientEmail"],
        message: "Enter the one learner email address this code is for.",
      });
    }
    if (!shareable && input.recipientEmail) {
      ctx.addIssue({
        code: "custom",
        path: ["recipientEmail"],
        message: "Recipient email is only used for shareable access codes.",
      });
    }
    if (input.programType === "paeds_resus_ils") {
      if (!targetInstitution || targetUser) {
        ctx.addIssue({
          code: "custom",
          path: ["targetInstitutionalAccountId"],
          message: "ILSP entitlements must target an institution only.",
        });
      }
      if (input.selfPayCourseId) {
        ctx.addIssue({
          code: "custom",
          path: ["selfPayCourseId"],
          message: "ILSP does not use a self-pay course scope.",
        });
      }
    } else {
      const shareableProgram = ["self_pay", "bls", "acls", "pals", "heartsaver", "nrp", "instructor"].includes(input.programType);
      if (shareable && (!shareableProgram || targetUser || targetInstitution)) {
        ctx.addIssue({ code: "custom", path: ["shareable"], message: "Shareable codes are available only for self-pay courses and cannot target a named account." });
      }
      if (!shareable && (!targetUser || targetInstitution)) {
        ctx.addIssue({
          code: "custom",
          path: ["targetUserId"],
          message:
            "This entitlement must target one named Paeds Resus user account only.",
        });
      }
      if (["self_pay", "bls", "acls", "pals", "heartsaver", "nrp", "instructor"].includes(input.programType) && !input.selfPayCourseId) {
        ctx.addIssue({
          code: "custom",
          path: ["selfPayCourseId"],
          message: "Select the self-pay course scope.",
        });
      }
      if (!["self_pay", "bls", "acls", "pals", "heartsaver", "nrp", "instructor"].includes(input.programType) && input.selfPayCourseId) {
        ctx.addIssue({
          code: "custom",
          path: ["selfPayCourseId"],
          message: "Only self-pay entitlements may have a course scope.",
        });
      }
    }
    if (shareable && input.benefitType !== "free") {
      ctx.addIssue({
        code: "custom",
        path: ["benefitType"],
        message: "Shareable learner codes must be full-waiver grants.",
      });
    }
    if (input.benefitType === "free" && input.discountPercent != null) {
      ctx.addIssue({
        code: "custom",
        path: ["discountPercent"],
        message: "Free entitlements do not also take a discount percentage.",
      });
    }
    if (
      input.benefitType === "percentage_discount" &&
      input.discountPercent == null
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["discountPercent"],
        message: "Enter a discount from 1% to 99%.",
      });
    }
  });

export const adminEntitlementsRouter = router({
  supportedProgrammes: adminProcedure.query(() =>
    GLOBAL_ENTITLEMENT_PROGRAM_TYPES.map(programType => ({
      programType,
      label: programmeLabels[programType],
    }))
  ),

  /**
   * Authoritative self-pay catalog for the Global Admin course picker.
   * Keep the slug visible so an issued entitlement remains auditable.
   */
  listAhaSelfPayCourses: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return db
      .select({ courseId: courses.programType, title: courses.title, level: courses.level, duration: courses.duration })
      .from(courses)
      .where(and(inArray(courses.programType, ["bls", "acls", "pals", "heartsaver", "nrp", "instructor"]), eq(courses.isActive, true)))
      .orderBy(asc(courses.programType), asc(courses.id));
  }),

  listSelfPayCourses: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    return db
      .select({ courseId: microCourses.courseId,
        title: microCourses.title,
        level: microCourses.level,
        emergencyType: microCourses.emergencyType,
        duration: microCourses.duration,
        price: microCourses.price,
        prerequisiteId: microCourses.prerequisiteId,
        isPublished: microCourses.isPublished,
      })
      .from(microCourses)
      .orderBy(asc(microCourses.order), asc(microCourses.courseId));
  }),

  searchUsers: adminProcedure
    .input(z.object({ query: z.string().trim().min(2).max(255) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const term = `%${input.query.trim()}%`;
      return db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          providerType: users.providerType,
        })
        .from(users)
        .where(or(like(users.name, term), like(users.email, term)))
        .orderBy(users.name)
        .limit(25);
    }),

  searchInstitutions: adminProcedure
    .input(z.object({ query: z.string().trim().min(2).max(255) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const term = `%${input.query.trim()}%`;
      return db
        .select({
          id: institutionalAccounts.id,
          companyName: institutionalAccounts.companyName,
          contactEmail: institutionalAccounts.contactEmail,
          status: institutionalAccounts.status,
        })
        .from(institutionalAccounts)
        .where(like(institutionalAccounts.companyName, term))
        .orderBy(institutionalAccounts.companyName)
        .limit(25);
    }),

  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    const entitlements = await db
      .select({
        id: globalEntitlements.id,
        grantReference: globalEntitlements.grantReference,
        programType: globalEntitlements.programType,
        selfPayCourseId: globalEntitlements.selfPayCourseId,
        benefitType: globalEntitlements.benefitType,
        discountPercent: globalEntitlements.discountPercent,
        reason: globalEntitlements.reason,
        maxRedemptions: globalEntitlements.maxRedemptions,
        redemptionCount: globalEntitlements.redemptionCount,
        status: globalEntitlements.status,
        expiresAt: globalEntitlements.expiresAt,
        createdByUserId: globalEntitlements.createdByUserId,
        createdAt: globalEntitlements.createdAt,
        revokedAt: globalEntitlements.revokedAt,
        targetUserId: globalEntitlements.targetUserId,
        targetInstitutionalAccountId:
          globalEntitlements.targetInstitutionalAccountId,
        targetUserName: users.name,
        targetUserEmail: users.email,
        targetInstitutionName: institutionalAccounts.companyName,
      })
      .from(globalEntitlements)
      .leftJoin(users, eq(users.id, globalEntitlements.targetUserId))
      .leftJoin(
        institutionalAccounts,
        eq(
          institutionalAccounts.id,
          globalEntitlements.targetInstitutionalAccountId
        )
      )
      .orderBy(desc(globalEntitlements.createdAt))
      .limit(200);
    const redemptions = await db
      .select({
        entitlementId: globalEntitlementRedemptions.entitlementId,
        resourceReference: globalEntitlementRedemptions.resourceReference,
        effectiveAmountKes: globalEntitlementRedemptions.effectiveAmountKes,
        redeemedAt: globalEntitlementRedemptions.redeemedAt,
      })
      .from(globalEntitlementRedemptions)
      .orderBy(desc(globalEntitlementRedemptions.redeemedAt))
      .limit(500);
    return entitlements.map(entitlement => ({
      ...entitlement,
      programmeLabel: programmeLabels[entitlement.programType],
      redemptions: redemptions.filter(
        redemption => redemption.entitlementId === entitlement.id
      ),
    }));
  }),

  create: adminProcedure
    .input(createEntitlementInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const expiresAt = new Date(`${input.expiresAt}T23:59:59.999Z`);
      if (expiresAt.getTime() <= Date.now()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Entitlement expiry must be in the future.",
        });
      }
      if (input.targetUserId != null) {
        const [target] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, input.targetUserId))
          .limit(1);
        if (!target)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Target Paeds Resus account was not found.",
          });
      }
      if (input.targetInstitutionalAccountId != null) {
        const [target] = await db
          .select({ id: institutionalAccounts.id })
          .from(institutionalAccounts)
          .where(
            eq(institutionalAccounts.id, input.targetInstitutionalAccountId)
          )
          .limit(1);
        if (!target)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Target institution was not found.",
          });
      }
      if (input.programType === "self_pay" && input.selfPayCourseId) {
        const [selectedCourse] = await db
          .select({
            courseId: microCourses.courseId,
            isPublished: microCourses.isPublished,
          })
          .from(microCourses)
          .where(eq(microCourses.courseId, input.selfPayCourseId))
          .limit(1);
        if (!selectedCourse) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Self-pay fellowship course was not found in the catalog." });
        }
        if (!selectedCourse.isPublished) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This self-pay course is not published and cannot receive a grant." });
        }
      } else if (["bls", "acls", "pals", "heartsaver", "nrp", "instructor"].includes(input.programType) && input.selfPayCourseId) {
        if (input.selfPayCourseId !== input.programType) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "The selected AHA course does not match the entitlement programme." });
        }
        const [selectedCourse] = await db
          .select({ id: courses.id })
          .from(courses)
          .where(and(eq(courses.programType, input.programType as "bls" | "acls" | "pals" | "heartsaver" | "nrp" | "instructor"), eq(courses.isActive, true)))
          .limit(1);
        if (!selectedCourse) {
          throw new TRPCError({ code: "NOT_FOUND", message: "The selected AHA course is not available in the catalog." });
        }
      }
      const grantReference = newEntitlementReference();
      const accessCode = input.shareable ? createAccessCode() : null;
      await db.insert(globalEntitlements).values({
        grantReference,
        accessCodeHash: accessCode?.hash ?? null,
        accessCodePrefix: accessCode?.prefix ?? null,
        recipientEmailHash: input.shareable && input.recipientEmail
          ? hashRecipientEmail(input.recipientEmail)
          : null,
        targetUserId: input.targetUserId ?? null,
        targetInstitutionalAccountId:
          input.targetInstitutionalAccountId ?? null,
        programType: input.programType,
        selfPayCourseId: input.selfPayCourseId ?? null,
        benefitType: input.benefitType,
        discountPercent:
          input.benefitType === "percentage_discount"
            ? (input.discountPercent ?? null)
            : null,
        reason: input.reason,
        maxRedemptions: input.maxRedemptions,
        redemptionCount: 0,
        status: "active",
        expiresAt,
        createdByUserId: ctx.user.id,
      });
      return {
        success: true as const,
        grantReference,
        programmeLabel: programmeLabels[input.programType],
        accessCode: accessCode?.code ?? null,
      };
    }),

  revoke: adminProcedure
    .input(
      z.object({
        entitlementId: z.number().int().positive(),
        reason: z.string().trim().min(3).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const result = await db
        .update(globalEntitlements)
        .set({
          status: "revoked",
          revokedAt: new Date(),
          revokedByUserId: ctx.user.id,
          revokeReason: input.reason,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(globalEntitlements.id, input.entitlementId),
            eq(globalEntitlements.status, "active")
          )
        );
      const affectedRows = Number(
        (result as any)?.[0]?.affectedRows ?? (result as any)?.affectedRows ?? 0
      );
      if (affectedRows !== 1)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Active entitlement not found.",
        });
      return { success: true as const, entitlementId: input.entitlementId };
    }),
});
