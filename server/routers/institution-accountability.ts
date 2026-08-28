import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  cpdEvents,
  facilityDepartments,
  institutionDepartmentHeadEvents,
  institutionDepartmentHeads,
  institutionEducationCoordinators,
  institutionalAccounts,
  institutionAccountScopes,
  institutionProductSubscriptions,
  institutionalProducts,
  institutionalStaffMembers,
  institutionMemberships,
  professionalCredentials,
  users,
} from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  assertInstitutionAccess,
  getAdministeredInstitutionIds,
  isInstitutionAdmin,
  type AppDb,
} from "../lib/institution-access";
import { assertInstitutionAccountScope } from "../lib/institution-account-scopes";
import { isMissingTableError } from "../lib/is-missing-db-table";
import { isRegisteredRnProfile } from "../lib/iers-provider-eligibility";
import { loadInstitutionLearningDashboard } from "../lib/institution-learning-dashboard";
import { storageGet, storagePut } from "../storage";
import {
  syncDerivedCredentialsForUser,
  syncDerivedCredentialsForUsers,
} from "../services/professional-credentials.service";

const EXTERNAL_CREDENTIAL_TYPES = [
  "regulatory_license",
  "external_aha_bls",
  "external_aha_acls",
  "external_aha_pals",
  "external_aha_nrp",
  "external_aha_other",
] as const;

type ExternalCredentialType = (typeof EXTERNAL_CREDENTIAL_TYPES)[number];

const LIFE_SUPPORT_TYPES = [
  "paeds_resus_bls_cognitive",
  "paeds_resus_bls_simulation",
  "paeds_resus_bls_provider",
  "external_aha_bls",
  "external_aha_acls",
  "external_aha_pals",
  "external_aha_nrp",
  "external_aha_other",
] as const;

const LICENSED_PROVIDER_TYPES = new Set([
  "nurse",
  "doctor",
  "pharmacist",
  "paramedic",
  "lab_tech",
  "respiratory_therapist",
  "midwife",
]);

function requireDb(): Promise<AppDb> {
  return getDb().then(db => {
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed.",
      });
    return db;
  });
}

function parseDateOnly(
  value: string | null | undefined,
  label: string
): Date | null {
  if (value == null || value === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${label} must use YYYY-MM-DD.`,
    });
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${label} is not a valid date.`,
    });
  }
  return date;
}

function credentialDisplayStatus(credential: {
  status: string;
  expiresAt: Date | null;
}):
  | "current"
  | "expiring"
  | "expired"
  | "pending"
  | "rejected"
  | "revoked"
  | "superseded" {
  if (credential.status !== "verified") return credential.status as any;
  if (!credential.expiresAt) return "current";
  const now = Date.now();
  const expiry = credential.expiresAt.getTime();
  if (expiry <= now) return "expired";
  if (expiry <= now + 90 * 24 * 60 * 60 * 1000) return "expiring";
  return "current";
}

function credentialSourceLabel(
  sourceType: string,
  credentialType: string
): string {
  if (sourceType === "paeds_resus") return "Paeds Resus Learning Portal";
  if (sourceType === "external_aha") {
    const course = credentialType.replace("external_aha_", "").toUpperCase();
    return `External AHA ${course}`;
  }
  if (credentialType === "regulatory_license") return "Regulatory licence";
  return "Imported credential";
}

function credentialProjection(
  credential: typeof professionalCredentials.$inferSelect
) {
  return {
    id: credential.id,
    credentialType: credential.credentialType,
    sourceType: credential.sourceType,
    sourceLabel: credentialSourceLabel(
      credential.sourceType,
      credential.credentialType
    ),
    issuer: credential.issuer,
    jurisdiction: credential.jurisdiction,
    cadre: credential.cadre,
    credentialNumber: credential.credentialNumber,
    issuedAt: credential.issuedAt,
    expiresAt: credential.expiresAt,
    status: credential.status,
    displayStatus: credentialDisplayStatus(credential),
    evidenceUploaded: credential.evidenceKey != null,
    verifiedAt: credential.verifiedAt,
    reviewReason: credential.reviewReason,
    createdAt: credential.createdAt,
  };
}

function latestCredential(
  rows: Array<typeof professionalCredentials.$inferSelect>,
  predicate: (row: typeof professionalCredentials.$inferSelect) => boolean
) {
  return (
    rows
      .filter(predicate)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] ?? null
  );
}

async function getCredentialAccess(
  db: AppDb,
  user: any,
  institutionId: number
) {
  if (
    user.role === "admin" ||
    (await isInstitutionAdmin(db, user.id, institutionId))
  ) {
    return {
      role: "institution_admin" as const,
      departmentIds: null as number[] | null,
      canViewIndividuals: true,
      canViewEvidence: true,
    };
  }

  try {
    await assertInstitutionAccountScope(db, user, institutionId, [
      "credential_manager",
    ]);
    return {
      role: "credential_manager" as const,
      departmentIds: null as number[] | null,
      canViewIndividuals: true,
      canViewEvidence: true,
    };
  } catch (error) {
    if (
      !(error instanceof TRPCError) ||
      !["FORBIDDEN", "PRECONDITION_FAILED"].includes(error.code)
    )
      throw error;
  }

  let headRows: Array<{ departmentId: number }> = [];
  try {
    headRows = await db
      .select({ departmentId: institutionDepartmentHeads.departmentId })
      .from(institutionDepartmentHeads)
      .where(
        and(
          eq(institutionDepartmentHeads.institutionalAccountId, institutionId),
          eq(institutionDepartmentHeads.userId, user.id),
          eq(institutionDepartmentHeads.assignmentStatus, "active")
        )
      );
  } catch (error) {
    if (!isMissingTableError(error, "institutionDepartmentHeads")) throw error;
  }
  if (headRows.length) {
    return {
      role: "department_head" as const,
      departmentIds: headRows.map(row => row.departmentId),
      canViewIndividuals: true,
      canViewEvidence: false,
    };
  }

  const educationRows = await db
    .select({ departmentId: institutionEducationCoordinators.departmentId })
    .from(institutionEducationCoordinators)
    .where(
      and(
        eq(
          institutionEducationCoordinators.institutionalAccountId,
          institutionId
        ),
        eq(institutionEducationCoordinators.userId, user.id),
        eq(institutionEducationCoordinators.assignmentStatus, "active")
      )
    );
  if (educationRows.length) {
    return {
      role: "education_coordinator" as const,
      departmentIds: educationRows.map(row => row.departmentId),
      canViewIndividuals: true,
      canViewEvidence: false,
    };
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message:
      "You do not have credential or departmental accountability access for this institution.",
  });
}

function activeAssignmentKey(
  institutionId: number,
  departmentId: number
): string {
  return `${institutionId}:${departmentId}`;
}

export const institutionAccountabilityRouter = router({
  /** Workspace entry projection: institution admins and active linked members only. */
  getMyWorkspace: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const administeredIds = await getAdministeredInstitutionIds(
      db,
      ctx.user.id
    );
    const email = ctx.user.email?.trim().toLowerCase();
    const identity = email
      ? or(
          eq(institutionMemberships.userId, ctx.user.id),
          eq(institutionMemberships.invitedEmail, email)
        )
      : eq(institutionMemberships.userId, ctx.user.id);

    const membershipRows = await db
      .select({ institutionId: institutionalAccounts.id })
      .from(institutionMemberships)
      .innerJoin(
        institutionalAccounts,
        eq(
          institutionalAccounts.id,
          institutionMemberships.institutionalAccountId
        )
      )
      .where(
        and(eq(institutionMemberships.membershipStatus, "active"), identity)
      );
    let headRows: Array<{ institutionId: number }> = [];
    try {
      headRows = await db
        .select({
          institutionId: institutionDepartmentHeads.institutionalAccountId,
        })
        .from(institutionDepartmentHeads)
        .where(
          and(
            eq(institutionDepartmentHeads.userId, ctx.user.id),
            eq(institutionDepartmentHeads.assignmentStatus, "active")
          )
        );
    } catch (error) {
      if (!isMissingTableError(error, "institutionDepartmentHeads"))
        throw error;
    }
    const coordinatorRows = await db
      .select({
        institutionId: institutionEducationCoordinators.institutionalAccountId,
      })
      .from(institutionEducationCoordinators)
      .where(
        and(
          eq(institutionEducationCoordinators.userId, ctx.user.id),
          eq(institutionEducationCoordinators.assignmentStatus, "active")
        )
      );
    const credentialScopeRows = await db
      .select({
        institutionId: institutionAccountScopes.institutionalAccountId,
      })
      .from(institutionAccountScopes)
      .where(
        and(
          eq(institutionAccountScopes.userId, ctx.user.id),
          eq(institutionAccountScopes.scopeKey, "credential_manager"),
          eq(institutionAccountScopes.scopeStatus, "active")
        )
      );
    const accountabilityInstitutionIds = new Set([
      ...administeredIds,
      ...headRows.map(row => row.institutionId),
      ...coordinatorRows.map(row => row.institutionId),
      ...credentialScopeRows.map(row => row.institutionId),
    ]);
    const institutionIds = Array.from(
      new Set([
        ...administeredIds,
        ...membershipRows.map(row => row.institutionId),
        ...headRows.map(row => row.institutionId),
        ...coordinatorRows.map(row => row.institutionId),
      ])
    );
    if (!institutionIds.length)
      return {
        institution: null,
        institutions: [],
        productAccess: [],
        isInstitutionAdmin: false,
        canViewAccountability: false,
      };

    const institutions = await db
      .select({
        id: institutionalAccounts.id,
        companyName: institutionalAccounts.companyName,
        industry: institutionalAccounts.industry,
        status: institutionalAccounts.status,
        registrationNumber: institutionalAccounts.registrationNumber,
      })
      .from(institutionalAccounts)
      .where(inArray(institutionalAccounts.id, institutionIds))
      .orderBy(asc(institutionalAccounts.companyName));

    const productRows = await db
      .select({
        institutionId: institutionProductSubscriptions.institutionalAccountId,
        productKey: institutionalProducts.productKey,
        displayName: institutionalProducts.displayName,
        subscriptionStatus: institutionProductSubscriptions.subscriptionStatus,
      })
      .from(institutionProductSubscriptions)
      .innerJoin(
        institutionalProducts,
        eq(institutionalProducts.id, institutionProductSubscriptions.productId)
      )
      .where(
        inArray(
          institutionProductSubscriptions.institutionalAccountId,
          institutionIds
        )
      );

    const first = institutions[0] ?? null;
    return {
      institution: first,
      institutions,
      productAccess: productRows,
      isInstitutionAdmin: first ? administeredIds.includes(first.id) : false,
      canViewAccountability: first
        ? accountabilityInstitutionIds.has(first.id)
        : false,
    };
  }),

  /** Provider-owned structured credential view. Evidence keys never leave the server. */
  getMyCredentials: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    try {
      await syncDerivedCredentialsForUser(db, ctx.user.id);
    } catch {
      // The provider still receives their stored records during a rolling migration.
    }
    let rows: Array<typeof professionalCredentials.$inferSelect> = [];
    try {
      rows = await db
        .select()
        .from(professionalCredentials)
        .where(eq(professionalCredentials.userId, ctx.user.id))
        .orderBy(desc(professionalCredentials.updatedAt));
    } catch (error) {
      if (!isMissingTableError(error, "professionalCredentials")) throw error;
    }
    return rows.map(credentialProjection);
  }),

  /** Provider submits a regulatory licence or external AHA certificate. */
  submitCredential: protectedProcedure
    .input(
      z.object({
        credentialType: z.enum(EXTERNAL_CREDENTIAL_TYPES),
        issuer: z.string().trim().min(2).max(255),
        jurisdiction: z.string().trim().max(128).optional(),
        cadre: z.string().trim().max(128).optional(),
        credentialNumber: z.string().trim().max(255).optional(),
        issuedAt: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        expiresAt: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        evidenceBase64: z.string().max(7_000_000).optional(),
        evidenceFileName: z.string().trim().max(255).optional(),
        evidenceContentType: z
          .enum(["application/pdf", "image/jpeg", "image/png"])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [user] = await db
        .select({
          providerType: users.providerType,
          cadre: users.cadre,
          cadreOther: users.cadreOther,
        })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      const activeNurseStaff = await db
        .select({ id: institutionalStaffMembers.id })
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(institutionalStaffMembers.userId, ctx.user.id),
            eq(institutionalStaffMembers.staffRole, "nurse"),
            isNull(institutionalStaffMembers.removedAt),
          ),
        )
        .limit(1);
      const hasLicensedIdentity =
        Boolean(user?.providerType && LICENSED_PROVIDER_TYPES.has(user.providerType)) ||
        activeNurseStaff.length > 0 ||
        isRegisteredRnProfile({
          providerType: user?.providerType,
          cadre: user?.cadre,
          cadreOther: user?.cadreOther,
        });
      if (input.credentialType === "regulatory_license") {
        if (!hasLicensedIdentity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Set your professional identity to a licensed provider or Registered Nurse before submitting a regulatory licence. Your IERP intern profile and nursing credentials are stored separately.",
          });
        }
        if (
          !input.credentialNumber ||
          !input.expiresAt ||
          !input.evidenceBase64 ||
          !input.evidenceFileName ||
          !input.evidenceContentType
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Licence number, expiry date, and licence evidence are required.",
          });
        }
      } else if (
        !input.issuedAt ||
        !input.expiresAt ||
        !input.evidenceBase64 ||
        !input.evidenceFileName ||
        !input.evidenceContentType
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "External AHA course date, expiry date, and certificate evidence are required.",
        });
      }
      const issuedAt = parseDateOnly(input.issuedAt, "Issue date");
      const expiresAt = parseDateOnly(input.expiresAt, "Expiry date");
      if (issuedAt && expiresAt && expiresAt <= issuedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Expiry date must be after the issue date.",
        });
      }

      let evidenceKey: string | undefined;
      let evidenceSizeBytes: number | undefined;
      if (
        input.evidenceBase64 &&
        input.evidenceFileName &&
        input.evidenceContentType
      ) {
        const encoded = input.evidenceBase64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(encoded, "base64");
        if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Credential evidence must be between 1 byte and 5 MB.",
          });
        }
        const stored = await storagePut(
          `professional-credentials/${ctx.user.id}/${randomUUID()}-${input.evidenceFileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
          buffer,
          input.evidenceContentType
        );
        evidenceKey = stored.key;
        evidenceSizeBytes = buffer.length;
      }

      await db
        .update(professionalCredentials)
        .set({ status: "superseded", updatedAt: new Date() })
        .where(
          and(
            eq(professionalCredentials.userId, ctx.user.id),
            eq(professionalCredentials.credentialType, input.credentialType),
            or(
              eq(professionalCredentials.status, "pending"),
              eq(professionalCredentials.status, "verified")
            )
          )
        );

      const result = await db.insert(professionalCredentials).values({
        userId: ctx.user.id,
        credentialType: input.credentialType,
        sourceType:
          input.credentialType === "regulatory_license"
            ? "regulatory"
            : "external_aha",
        issuer: input.issuer,
        jurisdiction: input.jurisdiction?.trim() || null,
          cadre: input.cadre?.trim() || user?.providerType || (activeNurseStaff.length > 0 ? "nurse" : user?.cadre) || null,
        credentialNumber: input.credentialNumber?.trim() || null,
        issuedAt,
        expiresAt,
        status: "pending",
        evidenceKey: evidenceKey ?? null,
        evidenceFileName: input.evidenceFileName ?? null,
        evidenceContentType: input.evidenceContentType ?? null,
        evidenceSizeBytes: evidenceSizeBytes ?? null,
      });
      return {
        success: true as const,
        credentialId: (result as unknown as { insertId: number }).insertId,
        status: "pending" as const,
      };
    }),

  /** Provider may obtain a short-lived private evidence URL for their own credential. */
  getMyCredentialEvidenceUrl: protectedProcedure
    .input(z.object({ credentialId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const [row] = await db
        .select({ evidenceKey: professionalCredentials.evidenceKey })
        .from(professionalCredentials)
        .where(
          and(
            eq(professionalCredentials.id, input.credentialId),
            eq(professionalCredentials.userId, ctx.user.id)
          )
        )
        .limit(1);
      if (!row?.evidenceKey)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential evidence not found.",
        });
      return storageGet(row.evidenceKey);
    }),

  /** Credential/compliance manager or institution admin verifies a scoped credential. */
  reviewCredential: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        credentialId: z.number().int().positive(),
        decision: z.enum(["verified", "rejected", "revoked"]),
        reason: z.string().trim().min(3).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const access = await getCredentialAccess(
        db,
        ctx.user,
        input.institutionId
      );
      const [credential] = await db
        .select()
        .from(professionalCredentials)
        .where(eq(professionalCredentials.id, input.credentialId))
        .limit(1);
      if (!credential)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found.",
        });
      const staffRows = await db
        .select({
          departmentId: institutionalStaffMembers.facilityDepartmentId,
        })
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(
              institutionalStaffMembers.institutionalAccountId,
              input.institutionId
            ),
            eq(institutionalStaffMembers.userId, credential.userId),
            sql`${institutionalStaffMembers.removedAt} IS NULL`
          )
        );
      if (!staffRows.length)
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "This credential owner is not an active staff member of the institution.",
        });
      if (
        access.departmentIds &&
        !staffRows.some(
          row =>
            row.departmentId != null &&
            access.departmentIds!.includes(row.departmentId)
        )
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This credential is outside your assigned department scope.",
        });
      }
      if (!access.canViewEvidence) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Evidence verification requires a credential manager or institution administrator.",
        });
      }
      await db
        .update(professionalCredentials)
        .set({
          status: input.decision,
          verifiedByUserId: ctx.user.id,
          verifiedAt: new Date(),
          reviewReason: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(professionalCredentials.id, credential.id));
      return { success: true as const, decision: input.decision };
    }),

  /** Scoped institution compliance, learning engagement, targets, and department results. */
  getComplianceDashboard: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        periodType: z
          .enum(["monthly", "quarterly", "annual"])
          .default("quarterly"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const access = await getCredentialAccess(
        db,
        ctx.user,
        input.institutionId
      );
      const staffRows = await db
        .select({
          id: institutionalStaffMembers.id,
          userId: institutionalStaffMembers.userId,
          fullName: institutionalStaffMembers.staffName,
          department: institutionalStaffMembers.department,
          facilityDepartmentId: institutionalStaffMembers.facilityDepartmentId,
          staffRole: institutionalStaffMembers.staffRole,
        })
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(
              institutionalStaffMembers.institutionalAccountId,
              input.institutionId
            ),
            sql`${institutionalStaffMembers.removedAt} IS NULL`,
            access.departmentIds
              ? inArray(
                  institutionalStaffMembers.facilityDepartmentId,
                  access.departmentIds
                )
              : sql`1=1`
          )
        )
        .orderBy(asc(institutionalStaffMembers.staffName));
      const userIds = staffRows
        .map(row => row.userId)
        .filter((id): id is number => id != null);
      try {
        await syncDerivedCredentialsForUsers(db, userIds);
      } catch {
        // A rolling deployment may not have created the table yet; return other accountability data.
      }
      let credentialRows: Array<typeof professionalCredentials.$inferSelect> =
        [];
      if (userIds.length) {
        try {
          credentialRows = await db
            .select()
            .from(professionalCredentials)
            .where(inArray(professionalCredentials.userId, userIds));
        } catch (error) {
          if (!isMissingTableError(error, "professionalCredentials"))
            throw error;
        }
      }
      const departmentRows = await db
        .select({
          id: facilityDepartments.id,
          name: facilityDepartments.departmentName,
        })
        .from(facilityDepartments)
        .where(
          and(
            eq(facilityDepartments.institutionId, input.institutionId),
            eq(facilityDepartments.isActive, true)
          )
        );
      const learning = await loadInstitutionLearningDashboard(
        db,
        input.institutionId,
        { periodType: input.periodType },
        access.departmentIds,
        {
          includeIndividualDetails: access.canViewIndividuals,
          includeContactDetails: false,
        }
      );
      const learningByStaffId = new Map(
        learning.individuals.map(row => [row.staffId, row])
      );
      const departmentById = new Map(
        departmentRows.map(row => [row.id, row.name])
      );
      const staffByDepartment = new Map<number, number>();
      const currentLicenseCounts = new Map<number, number>();
      const lifeSupportCurrentCounts = new Map<number, number>();
      const people = staffRows.map(staff => {
        const rows = credentialRows.filter(row => row.userId === staff.userId);
        const license = latestCredential(
          rows,
          row =>
            row.credentialType === "regulatory_license" &&
            row.status !== "superseded"
        );
        const lifeRows = rows.filter(
          row =>
            (LIFE_SUPPORT_TYPES as readonly string[]).includes(
              row.credentialType
            ) && row.status !== "superseded"
        );
        const lifeCurrent = lifeRows.filter(row =>
          ["current", "expiring"].includes(credentialDisplayStatus(row))
        );
        const licenseStatus = license
          ? credentialDisplayStatus(license)
          : "missing";
        const lifeSupportStatus = lifeCurrent.length
          ? lifeCurrent.some(row => credentialDisplayStatus(row) === "current")
            ? "current"
            : "expiring"
          : lifeRows.some(row => credentialDisplayStatus(row) === "expired")
            ? "expired"
            : "missing";
        if (staff.facilityDepartmentId != null) {
          staffByDepartment.set(
            staff.facilityDepartmentId,
            (staffByDepartment.get(staff.facilityDepartmentId) ?? 0) + 1
          );
          if (["current", "expiring"].includes(licenseStatus))
            currentLicenseCounts.set(
              staff.facilityDepartmentId,
              (currentLicenseCounts.get(staff.facilityDepartmentId) ?? 0) + 1
            );
          if (["current", "expiring"].includes(lifeSupportStatus))
            lifeSupportCurrentCounts.set(
              staff.facilityDepartmentId,
              (lifeSupportCurrentCounts.get(staff.facilityDepartmentId) ?? 0) +
                1
            );
        }
        const learningRow = learningByStaffId.get(staff.id);
        const targetRows = learning.targets.filter(
          row => row.scope === "individual" && row.scopeLabel === staff.fullName
        );
        return {
          staffId: staff.id,
          userId: staff.userId,
          fullName: staff.fullName,
          department:
            staff.department ??
            (staff.facilityDepartmentId != null
              ? (departmentById.get(staff.facilityDepartmentId) ?? "Unassigned")
              : "Unassigned"),
          cadre: staff.staffRole,
          licenseStatus,
          licenseExpiresAt: license?.expiresAt ?? null,
          lifeSupportStatus,
          lifeSupportSources: lifeRows.map(row =>
            credentialSourceLabel(row.sourceType, row.credentialType)
          ),
          cpdAttendanceRate: learningRow?.attendanceRate ?? 0,
          cpdAttendedSessions: learningRow?.attendedSessions ?? 0,
          cpdEligibleSessions: learningRow?.eligibleSessions ?? 0,
          cpdStatus: learningRow?.status ?? "no_data",
          targets: targetRows,
          evidenceAvailableToViewer: access.canViewEvidence
            ? Boolean(
                license?.evidenceKey || lifeRows.some(row => row.evidenceKey)
              )
            : false,
        };
      });
      const departmentResults = departmentRows
        .filter(
          row => !access.departmentIds || access.departmentIds.includes(row.id)
        )
        .map(row => ({
          departmentId: row.id,
          department: row.name,
          staffCount: staffByDepartment.get(row.id) ?? 0,
          licensedCurrentOrExpiring: currentLicenseCounts.get(row.id) ?? 0,
          lifeSupportCurrentOrExpiring:
            lifeSupportCurrentCounts.get(row.id) ?? 0,
          sessionsHeld:
            learning.departments.find(item => item.departmentId === row.id)
              ?.sessionsAvailable ?? 0,
          attendanceRate:
            learning.departments.find(item => item.departmentId === row.id)
              ?.attendanceRate ?? 0,
          status:
            learning.departments.find(item => item.departmentId === row.id)
              ?.status ?? "no_data",
        }));
      const heads = access.canViewIndividuals
        ? await db
            .select({
              id: institutionDepartmentHeads.id,
              departmentId: institutionDepartmentHeads.departmentId,
              department: facilityDepartments.departmentName,
              userId: institutionDepartmentHeads.userId,
              fullName: users.name,
              assignmentStatus: institutionDepartmentHeads.assignmentStatus,
              assignedAt: institutionDepartmentHeads.assignedAt,
            })
            .from(institutionDepartmentHeads)
            .leftJoin(
              facilityDepartments,
              eq(
                facilityDepartments.id,
                institutionDepartmentHeads.departmentId
              )
            )
            .leftJoin(users, eq(users.id, institutionDepartmentHeads.userId))
            .where(
              and(
                eq(
                  institutionDepartmentHeads.institutionalAccountId,
                  input.institutionId
                ),
                eq(institutionDepartmentHeads.assignmentStatus, "active"),
                access.departmentIds
                  ? inArray(
                      institutionDepartmentHeads.departmentId,
                      access.departmentIds
                    )
                  : sql`1=1`
              )
            )
        : [];
      return {
        access: {
          role: access.role,
          canViewIndividuals: access.canViewIndividuals,
          canViewEvidence: access.canViewEvidence,
        },
        summary: {
          staffCount: people.length,
          licensedCurrentOrExpiring: people.filter(row =>
            ["current", "expiring"].includes(row.licenseStatus)
          ).length,
          licensedExpired: people.filter(row => row.licenseStatus === "expired")
            .length,
          licensedMissing: people.filter(row => row.licenseStatus === "missing")
            .length,
          lifeSupportCurrentOrExpiring: people.filter(row =>
            ["current", "expiring"].includes(row.lifeSupportStatus)
          ).length,
          lifeSupportExpired: people.filter(
            row => row.lifeSupportStatus === "expired"
          ).length,
          lifeSupportMissing: people.filter(
            row => row.lifeSupportStatus === "missing"
          ).length,
          cpdSessionsHeld: learning.summary.totalSessions,
          cpdAttendanceRate: learning.summary.attendanceRate,
          departmentsNeedingSupport: departmentResults.filter(
            row => row.status === "needs_support"
          ).length,
        },
        departments: departmentResults,
        people: access.canViewIndividuals ? people : [],
        peopleRestricted: !access.canViewIndividuals,
        heads,
        learning: {
          period: learning.period,
          narrative: learning.narrative,
          summary: learning.summary,
          targets: access.canViewIndividuals
            ? learning.targets
            : learning.targets.filter(target => target.scope !== "individual"),
        },
      };
    }),

  /** List active Departmental Head appointments for the institution or assigned scope. */
  listDepartmentHeads: protectedProcedure
    .input(z.object({ institutionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const access = await getCredentialAccess(
        db,
        ctx.user,
        input.institutionId
      );
      if (!access.canViewIndividuals) return [];
      return db
        .select({
          id: institutionDepartmentHeads.id,
          departmentId: institutionDepartmentHeads.departmentId,
          department: facilityDepartments.departmentName,
          userId: institutionDepartmentHeads.userId,
          fullName: users.name,
          assignmentStatus: institutionDepartmentHeads.assignmentStatus,
          assignedAt: institutionDepartmentHeads.assignedAt,
        })
        .from(institutionDepartmentHeads)
        .leftJoin(
          facilityDepartments,
          eq(facilityDepartments.id, institutionDepartmentHeads.departmentId)
        )
        .leftJoin(users, eq(users.id, institutionDepartmentHeads.userId))
        .where(
          and(
            eq(
              institutionDepartmentHeads.institutionalAccountId,
              input.institutionId
            ),
            eq(institutionDepartmentHeads.assignmentStatus, "active"),
            access.departmentIds
              ? inArray(
                  institutionDepartmentHeads.departmentId,
                  access.departmentIds
                )
              : sql`1=1`
          )
        );
    }),

  /** Institution administrator appoints or reassigns one Departmental Head per department. */
  assignDepartmentHead: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        departmentId: z.number().int().positive(),
        userId: z.number().int().positive(),
        note: z.string().trim().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [department] = await db
        .select({ id: facilityDepartments.id })
        .from(facilityDepartments)
        .where(
          and(
            eq(facilityDepartments.id, input.departmentId),
            eq(facilityDepartments.institutionId, input.institutionId),
            eq(facilityDepartments.isActive, true)
          )
        )
        .limit(1);
      if (!department)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Active department not found in this institution.",
        });
      const [staff] = await db
        .select({ userId: institutionalStaffMembers.userId })
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(
              institutionalStaffMembers.institutionalAccountId,
              input.institutionId
            ),
            eq(institutionalStaffMembers.userId, input.userId),
            sql`${institutionalStaffMembers.removedAt} IS NULL`
          )
        )
        .limit(1);
      if (!staff?.userId)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Departmental Heads must be active linked institution staff.",
        });

      return db.transaction(async tx => {
        const [active] = await tx
          .select()
          .from(institutionDepartmentHeads)
          .where(
            and(
              eq(
                institutionDepartmentHeads.institutionalAccountId,
                input.institutionId
              ),
              eq(institutionDepartmentHeads.departmentId, input.departmentId),
              eq(institutionDepartmentHeads.assignmentStatus, "active")
            )
          )
          .limit(1);
        if (active && active.userId === input.userId) {
          return {
            success: true as const,
            assignmentId: active.id,
            action: "unchanged" as const,
          };
        }
        let assignmentId: number;
        if (active) {
          await tx
            .update(institutionDepartmentHeads)
            .set({
              assignmentStatus: "ended",
              activeAssignmentKey: null,
              endedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(institutionDepartmentHeads.id, active.id));
          await tx.insert(institutionDepartmentHeadEvents).values({
            institutionalAccountId: input.institutionId,
            departmentId: input.departmentId,
            assignmentId: active.id,
            eventType: "reassigned",
            previousUserId: active.userId,
            currentUserId: input.userId,
            actorUserId: ctx.user.id,
            note: input.note ?? null,
          });
        }
        const [endedForUser] = await tx
          .select({ id: institutionDepartmentHeads.id })
          .from(institutionDepartmentHeads)
          .where(
            and(
              eq(
                institutionDepartmentHeads.institutionalAccountId,
                input.institutionId
              ),
              eq(institutionDepartmentHeads.departmentId, input.departmentId),
              eq(institutionDepartmentHeads.userId, input.userId),
              eq(institutionDepartmentHeads.assignmentStatus, "ended")
            )
          )
          .orderBy(desc(institutionDepartmentHeads.updatedAt))
          .limit(1);
        if (endedForUser) {
          assignmentId = endedForUser.id;
          await tx
            .update(institutionDepartmentHeads)
            .set({
              assignmentStatus: "active",
              activeAssignmentKey: activeAssignmentKey(
                input.institutionId,
                input.departmentId
              ),
              assignedByUserId: ctx.user.id,
              assignedAt: new Date(),
              endedAt: null,
              updatedAt: new Date(),
            })
            .where(eq(institutionDepartmentHeads.id, endedForUser.id));
        } else {
          const result = await tx.insert(institutionDepartmentHeads).values({
            institutionalAccountId: input.institutionId,
            departmentId: input.departmentId,
            userId: input.userId,
            assignmentStatus: "active",
            activeAssignmentKey: activeAssignmentKey(
              input.institutionId,
              input.departmentId
            ),
            assignedByUserId: ctx.user.id,
          });
          assignmentId = (result as unknown as { insertId: number }).insertId;
        }
        await tx.insert(institutionDepartmentHeadEvents).values({
          institutionalAccountId: input.institutionId,
          departmentId: input.departmentId,
          assignmentId,
          eventType: active ? "reassigned" : "assigned",
          previousUserId: active?.userId ?? null,
          currentUserId: input.userId,
          actorUserId: ctx.user.id,
          note: input.note ?? null,
        });
        return {
          success: true as const,
          assignmentId,
          action: active ? ("reassigned" as const) : ("assigned" as const),
        };
      });
    }),

  /** Institution administrator ends an appointment without deleting history. */
  endDepartmentHead: protectedProcedure
    .input(
      z.object({
        institutionId: z.number().int().positive(),
        assignmentId: z.number().int().positive(),
        note: z.string().trim().min(3).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await assertInstitutionAccess(db, ctx.user, input.institutionId);
      const [assignment] = await db
        .select()
        .from(institutionDepartmentHeads)
        .where(
          and(
            eq(institutionDepartmentHeads.id, input.assignmentId),
            eq(
              institutionDepartmentHeads.institutionalAccountId,
              input.institutionId
            ),
            eq(institutionDepartmentHeads.assignmentStatus, "active")
          )
        )
        .limit(1);
      if (!assignment)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Active Departmental Head appointment not found.",
        });
      await db.transaction(async tx => {
        await tx
          .update(institutionDepartmentHeads)
          .set({
            assignmentStatus: "ended",
            activeAssignmentKey: null,
            endedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(institutionDepartmentHeads.id, assignment.id));
        await tx.insert(institutionDepartmentHeadEvents).values({
          institutionalAccountId: input.institutionId,
          departmentId: assignment.departmentId,
          assignmentId: assignment.id,
          eventType: "ended",
          previousUserId: assignment.userId,
          currentUserId: null,
          actorUserId: ctx.user.id,
          note: input.note,
        });
      });
      return { success: true as const };
    }),
});
