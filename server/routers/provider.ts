import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  providerProfiles,
  providerProfessionalRoles,
  providerPerformanceMetrics,
  users,
  cpdAttendees,
  institutionMemberships,
  institutionalAccounts,
  institutionalStaffMembers,
  professionalCredentials,
  institutionDepartmentHeads,
  institutionEducationCoordinators,
  institutionProductRoles,
  institutionAccountScopes,
  facilityDepartments,
  institutionDepartmentResponseCoordinators,
} from "../../drizzle/schema";
import { eq, and, desc, or, sql, isNull } from "drizzle-orm";
import { autoLinkCpdFacilitiesForUser, syncProviderProfileFacility } from "../services/facility-registry.service";
import { canonicalizeDepartmentLabel } from "../../shared/clinical-departments";

type ProviderFacilityHistoryEntry = {
  institutionId: number;
  institutionName: string;
  relationship: "permanent_facility" | "locum_outreach";
  membershipStatus: "invited" | "active" | "suspended" | "ended" | "declined" | null;
  lastAttendedAt: Date | null;
  departments: string[];
};

type ProviderAssignedRole = {
  institutionId: number;
  institutionName: string;
  department: string | null;
  roleKey: string;
  roleLabel: string;
  status: string;
};

const ROLE_LABELS: Record<string, string> = {
  department_head: "Departmental Head",
  department_head_deputy: "Deputy Departmental Head",
  cpd_coordinator: "CPD Coordinator",
  cpd_coordinator_deputy: "Deputy CPD Coordinator",
  erco: "Emergency Response Coordinator",
  deputy_erco: "Deputy Emergency Response Coordinator",
  iers_coordinator: "IERS Coordinator",
  iers_governance: "IERS Governance",
  iers_reviewer: "IERS Reviewer",
  iers_responder: "IERS Responder",
  cpd_viewer: "CPD Viewer",
  cpd_reporter: "CPD Reporter",
  cpd_reviewer: "CPD Reviewer",
  credential_manager: "Credential Manager",
};

function roleLabel(roleKey: string): string {
  return ROLE_LABELS[roleKey] ?? roleKey.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());
}

const LICENSED_PROVIDER_TYPES = new Set([
  "nurse",
  "doctor",
  "pharmacist",
  "paramedic",
  "lab_tech",
  "respiratory_therapist",
  "midwife",
]);

const LIFE_SUPPORT_CREDENTIAL_TYPES = [
  "paeds_resus_bls_cognitive",
  "paeds_resus_bls_simulation",
  "paeds_resus_bls_provider",
  "external_aha_bls",
  "external_aha_acls",
  "external_aha_pals",
  "external_aha_nrp",
  "external_aha_other",
] as const;

export function calculateProviderIdentityReadiness(
  profile: Record<string, any>,
  licenseRequired: boolean,
  licenseCurrent: boolean,
) {
  const identityFields = [
    profile.specialization,
    profile.yearsOfExperience,
    profile.bio,
    profile.languages,
  ];
  const requirements = [
    ...identityFields,
    ...(licenseRequired ? [licenseCurrent] : []),
  ];
  const completed = requirements.filter(value => value === true || (value !== undefined && value !== null && value !== false && value !== "" && value !== "[]")).length;
  const completionPercentage = requirements.length === 0 ? 0 : Math.round((completed / requirements.length) * 100);
  return {
    completionPercentage,
    identityComplete: identityFields.every(value => value !== undefined && value !== null && value !== "" && value !== "[]"),
  } as const;
}

/** Select the effective verified regulatory licence without relying on row order. */
export function selectEffectiveRegulatoryLicence(
  credentials: Array<typeof professionalCredentials.$inferSelect>,
) {
  return credentials
    .filter(credential => credential.credentialType === "regulatory_license" && credential.status === "verified")
    .sort((a, b) => {
      const issuedAt = (b.issuedAt?.getTime() ?? 0) - (a.issuedAt?.getTime() ?? 0);
      if (issuedAt !== 0) return issuedAt;
      return (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0);
    })[0] ?? null;
}

export function calculateLicenceExperienceYears(
  issuedAt: Date | null | undefined,
  now = new Date(),
) {
  if (!issuedAt || issuedAt.getTime() > now.getTime()) return null;
  const years = now.getUTCFullYear() - issuedAt.getUTCFullYear();
  const beforeAnniversary = now.getUTCMonth() < issuedAt.getUTCMonth() ||
    (now.getUTCMonth() === issuedAt.getUTCMonth() && now.getUTCDate() < issuedAt.getUTCDate());
  return Math.max(0, years - (beforeAnniversary ? 1 : 0));
}

async function calculateProviderProfileReadiness(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  profile: Record<string, any>,
) {
  const [user] = await db
    .select({ providerType: users.providerType })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const licenseRequired = user?.providerType != null && LICENSED_PROVIDER_TYPES.has(user.providerType);
  let credentials: Array<typeof professionalCredentials.$inferSelect> = [];
  try {
    credentials = await db
      .select()
      .from(professionalCredentials)
      .where(eq(professionalCredentials.userId, userId));
  } catch {
    // The additive migration may be rolling out; unverified is safer than complete.
  }
  const now = Date.now();
  const isCurrent = (credential: (typeof credentials)[number]) =>
    credential.status === "verified" &&
    (credential.expiresAt == null || credential.expiresAt.getTime() > now);
  const licenseCredential = selectEffectiveRegulatoryLicence(credentials);
  const experienceYears = calculateLicenceExperienceYears(licenseCredential?.issuedAt);
  const lifeSupportCredential = credentials.find(credential =>
    (LIFE_SUPPORT_CREDENTIAL_TYPES as readonly string[]).includes(credential.credentialType) && isCurrent(credential),
  );

  const identityReadiness = calculateProviderIdentityReadiness(
    profile,
    licenseRequired,
    licenseCredential != null && isCurrent(licenseCredential),
  );
  return {
    completionPercentage: identityReadiness.completionPercentage,
    identityComplete: identityReadiness.identityComplete,
    verificationComplete: !licenseRequired || (licenseCredential != null && isCurrent(licenseCredential)),
    licenseRequired,
    licenseStatus: licenseCredential == null ? "missing" : licenseCredential.status === "verified" && !isCurrent(licenseCredential) ? "expired" : licenseCredential.status,
    lifeSupportStatus: lifeSupportCredential ? "current" : credentials.some(credential => (LIFE_SUPPORT_CREDENTIAL_TYPES as readonly string[]).includes(credential.credentialType) && credential.status === "verified") ? "expired" : "missing",
    experienceYears,
    experienceSource: experienceYears == null ? "self_declared_or_unverified" : "verified_first_licence_date",
    credentials,
  } as const;
}

async function getProviderFacilityHistory(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  email: string | null | undefined,
): Promise<ProviderFacilityHistoryEntry[]> {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return [];

  const [attendanceRows, membershipRows] = await Promise.all([
    db
      .select({
        institutionId: cpdAttendees.institutionalAccountId,
        institutionName: institutionalAccounts.companyName,
        attendanceType: cpdAttendees.attendanceType,
        submittedAt: cpdAttendees.submittedAt,
        department: cpdAttendees.department,
      })
      .from(cpdAttendees)
      .innerJoin(institutionalAccounts, eq(institutionalAccounts.id, cpdAttendees.institutionalAccountId))
      .where(sql`LOWER(TRIM(${cpdAttendees.email})) = LOWER(TRIM(${normalizedEmail}))`)
      .orderBy(desc(cpdAttendees.submittedAt)),
    db
      .select({
        institutionId: institutionMemberships.institutionalAccountId,
        institutionName: institutionalAccounts.companyName,
        membershipStatus: institutionMemberships.membershipStatus,
      })
      .from(institutionMemberships)
      .innerJoin(institutionalAccounts, eq(institutionalAccounts.id, institutionMemberships.institutionalAccountId))
      .where(and(
        or(
          eq(institutionMemberships.userId, userId),
          sql`LOWER(TRIM(${institutionMemberships.invitedEmail})) = LOWER(TRIM(${normalizedEmail}))`,
        ),
        sql`${institutionMemberships.membershipStatus} IN ('invited', 'active', 'suspended', 'ended')`,
      ))
      .orderBy(desc(institutionMemberships.updatedAt)),
  ]);

  const byInstitution = new Map<number, ProviderFacilityHistoryEntry>();
  for (const row of attendanceRows) {
    const existing = byInstitution.get(row.institutionId);
    const department = row.department?.trim();
    if (!existing) {
      byInstitution.set(row.institutionId, {
        institutionId: row.institutionId,
        institutionName: row.institutionName,
        relationship: row.attendanceType === "locum_outreach" ? "locum_outreach" : "permanent_facility",
        membershipStatus: null,
        lastAttendedAt: row.submittedAt,
        departments: department ? [department] : [],
      });
      continue;
    }
    if (row.attendanceType === "primary_facility") existing.relationship = "permanent_facility";
    if (!existing.lastAttendedAt || row.submittedAt > existing.lastAttendedAt) existing.lastAttendedAt = row.submittedAt;
    if (department && !existing.departments.includes(department)) existing.departments.push(department);
  }

  for (const row of membershipRows) {
    const existing = byInstitution.get(row.institutionId);
    if (existing) {
      existing.membershipStatus = row.membershipStatus;
      continue;
    }
    byInstitution.set(row.institutionId, {
      institutionId: row.institutionId,
      institutionName: row.institutionName,
      relationship: "permanent_facility",
      membershipStatus: row.membershipStatus,
      lastAttendedAt: null,
      departments: [],
    });
  }

  return Array.from(byInstitution.values()).sort((a, b) => {
    const aTime = a.lastAttendedAt?.getTime() ?? 0;
    const bTime = b.lastAttendedAt?.getTime() ?? 0;
    return bTime - aTime || a.institutionName.localeCompare(b.institutionName);
  });
}

async function getProviderAssignedRoles(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
): Promise<ProviderAssignedRole[]> {
  const rows: ProviderAssignedRole[] = [];

  const [heads, coordinators, productRoles, scopes, ercos] = await Promise.all([
    db.select({ institutionId: institutionDepartmentHeads.institutionalAccountId, institutionName: institutionalAccounts.companyName, department: facilityDepartments.departmentName, roleKey: sql<string>`'department_head'`, status: institutionDepartmentHeads.assignmentStatus, deputyUserId: institutionDepartmentHeads.deputyUserId, deputyStatus: institutionDepartmentHeads.deputyAssignmentStatus })
      .from(institutionDepartmentHeads)
      .innerJoin(institutionalAccounts, eq(institutionalAccounts.id, institutionDepartmentHeads.institutionalAccountId))
      .leftJoin(facilityDepartments, eq(facilityDepartments.id, institutionDepartmentHeads.departmentId))
      .where(and(eq(institutionDepartmentHeads.userId, userId), eq(institutionDepartmentHeads.assignmentStatus, "active"))),
    db.select({ institutionId: institutionEducationCoordinators.institutionalAccountId, institutionName: institutionalAccounts.companyName, department: facilityDepartments.departmentName, roleKey: sql<string>`'cpd_coordinator'`, status: institutionEducationCoordinators.assignmentStatus, deputyUserId: institutionEducationCoordinators.deputyUserId, deputyStatus: institutionEducationCoordinators.deputyAssignmentStatus })
      .from(institutionEducationCoordinators)
      .innerJoin(institutionalAccounts, eq(institutionalAccounts.id, institutionEducationCoordinators.institutionalAccountId))
      .leftJoin(facilityDepartments, eq(facilityDepartments.id, institutionEducationCoordinators.departmentId))
      .where(and(eq(institutionEducationCoordinators.userId, userId), eq(institutionEducationCoordinators.assignmentStatus, "active"))),
    db.select({ institutionId: institutionProductRoles.institutionalAccountId, institutionName: institutionalAccounts.companyName, roleKey: institutionProductRoles.roleKey, status: institutionProductRoles.roleStatus })
      .from(institutionProductRoles)
      .innerJoin(institutionalAccounts, eq(institutionalAccounts.id, institutionProductRoles.institutionalAccountId))
      .where(and(eq(institutionProductRoles.userId, userId), eq(institutionProductRoles.roleStatus, "active"))),
    db.select({ institutionId: institutionAccountScopes.institutionalAccountId, institutionName: institutionalAccounts.companyName, roleKey: institutionAccountScopes.scopeKey, status: institutionAccountScopes.scopeStatus })
      .from(institutionAccountScopes)
      .innerJoin(institutionalAccounts, eq(institutionalAccounts.id, institutionAccountScopes.institutionalAccountId))
      .where(and(
        eq(institutionAccountScopes.userId, userId),
        eq(institutionAccountScopes.scopeStatus, "active"),
      )),
    db.select({ institutionId: institutionDepartmentResponseCoordinators.institutionId, institutionName: institutionalAccounts.companyName, department: facilityDepartments.departmentName, coordinatorUserId: institutionDepartmentResponseCoordinators.coordinatorUserId, deputyUserId: institutionDepartmentResponseCoordinators.deputyUserId, deputyStatus: institutionDepartmentResponseCoordinators.deputyAssignmentStatus, status: institutionDepartmentResponseCoordinators.assignmentStatus })
      .from(institutionDepartmentResponseCoordinators)
      .innerJoin(institutionalAccounts, eq(institutionalAccounts.id, institutionDepartmentResponseCoordinators.institutionId))
      .leftJoin(facilityDepartments, eq(facilityDepartments.id, institutionDepartmentResponseCoordinators.departmentId))
      .where(and(
        or(
          eq(institutionDepartmentResponseCoordinators.coordinatorUserId, userId),
          eq(institutionDepartmentResponseCoordinators.deputyUserId, userId),
        ),
        sql`${institutionDepartmentResponseCoordinators.assignmentStatus} IN ('active', 'pending_acceptance')`,
      )),
  ]);

  for (const row of heads) {
    rows.push({ institutionId: row.institutionId, institutionName: row.institutionName, department: row.department, roleKey: row.roleKey, roleLabel: roleLabel(row.roleKey), status: row.status });
    if (row.deputyUserId === userId && row.deputyStatus && row.deputyStatus !== "ended") rows.push({ institutionId: row.institutionId, institutionName: row.institutionName, department: row.department, roleKey: "department_head_deputy", roleLabel: roleLabel("department_head_deputy"), status: row.deputyStatus });
  }
  for (const row of coordinators) {
    rows.push({ institutionId: row.institutionId, institutionName: row.institutionName, department: row.department, roleKey: row.roleKey, roleLabel: roleLabel(row.roleKey), status: row.status });
    if (row.deputyUserId === userId && row.deputyStatus && row.deputyStatus !== "ended") rows.push({ institutionId: row.institutionId, institutionName: row.institutionName, department: row.department, roleKey: "cpd_coordinator_deputy", roleLabel: roleLabel("cpd_coordinator_deputy"), status: row.deputyStatus });
  }
  for (const row of productRoles) rows.push({ ...row, department: null, roleLabel: roleLabel(row.roleKey) });
  for (const row of scopes) rows.push({ ...row, department: null, roleLabel: roleLabel(row.roleKey) });
  for (const row of ercos) {
    if (row.coordinatorUserId === userId) rows.push({ institutionId: row.institutionId, institutionName: row.institutionName, department: row.department, roleKey: "erco", roleLabel: roleLabel("erco"), status: row.status });
    if (row.deputyUserId === userId && row.deputyStatus && row.deputyStatus !== "ended") rows.push({ institutionId: row.institutionId, institutionName: row.institutionName, department: row.department, roleKey: "deputy_erco", roleLabel: roleLabel("deputy_erco"), status: row.deputyStatus });
  }

  const unique = new Map<string, ProviderAssignedRole>();
  for (const row of rows) unique.set(`${row.institutionId}:${row.department ?? "all"}:${row.roleKey}`, row);
  return Array.from(unique.values()).sort((a, b) => a.institutionName.localeCompare(b.institutionName) || a.roleLabel.localeCompare(b.roleLabel));
}

export const providerRouter = router({
  listProfessionalRoles: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    return db.select().from(providerProfessionalRoles)
      .where(and(eq(providerProfessionalRoles.userId, ctx.user.id), eq(providerProfessionalRoles.status, "active")))
      .orderBy(desc(providerProfessionalRoles.isPrimary), desc(providerProfessionalRoles.updatedAt));
  }),

  addProfessionalRole: protectedProcedure
    .input(z.object({
      cadre: z.string().trim().min(1).max(128),
      cadreOther: z.string().trim().max(128).nullable().optional(),
      specialization: z.string().trim().max(255).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const [existing] = await db.select({ id: providerProfessionalRoles.id })
        .from(providerProfessionalRoles)
        .where(and(eq(providerProfessionalRoles.userId, ctx.user.id), eq(providerProfessionalRoles.cadre, input.cadre), eq(providerProfessionalRoles.status, "active")))
        .limit(1);
      if (existing) return { success: true as const, roleId: existing.id, alreadyExists: true as const };
      const [created] = await db.insert(providerProfessionalRoles).values({
        userId: ctx.user.id,
        cadre: input.cadre,
        cadreOther: input.cadreOther ?? null,
        specialization: input.specialization ?? null,
        isPrimary: false,
        status: "active",
      });
      return { success: true as const, roleId: created.insertId, alreadyExists: false as const };
    }),

  archiveProfessionalRole: protectedProcedure
    .input(z.object({ roleId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      await db.update(providerProfessionalRoles).set({ status: "archived", updatedAt: new Date() })
        .where(and(eq(providerProfessionalRoles.id, input.roleId), eq(providerProfessionalRoles.userId, ctx.user.id)));
      return { success: true as const };
    }),

  // Get or create provider profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    let profile = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.userId, ctx.user.id))
      .limit(1);

    if (!profile[0]) {
      // Create default profile if doesn't exist
      await db.insert(providerProfiles).values({
        userId: ctx.user.id,
        profileCompleted: false,
        profileCompletionPercentage: 0,
      });

      profile = await db
        .select()
        .from(providerProfiles)
        .where(eq(providerProfiles.userId, ctx.user.id))
        .limit(1);
    }

    if (!profile[0]) return null;
    await autoLinkCpdFacilitiesForUser(db, { userId: ctx.user.id, email: ctx.user.email ?? "" });
    const readiness = await calculateProviderProfileReadiness(db, ctx.user.id, profile[0]);
    return {
      ...profile[0],
      profileCompletionPercentage: readiness.completionPercentage,
      profileCompleted: readiness.identityComplete,
      professionalReadiness: readiness,
      facilityHistory: await getProviderFacilityHistory(db, ctx.user.id, ctx.user.email),
      assignedInstitutionRoles: await getProviderAssignedRoles(db, ctx.user.id),
    };
  }),

  // Update provider profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        licenseNumber: z.string().optional(),
        licenseExpiry: z.date().optional(),
        specialization: z.string().optional(),
        yearsOfExperience: z.number().int().min(0).max(80).optional(),
        facilityId: z.number().int().positive().optional(),
        facilityName: z.string().optional(),
        facilityType: z.enum([
          "primary_health_center",
          "health_post",
          "district_hospital",
          "private_clinic",
          "ngo_clinic",
          "other",
        ]).optional(),
        facilityRegion: z.string().optional(),
        facilityCountry: z.string().optional(),
        facilityPhone: z.string().optional(),
        facilityEmail: z.string().optional(),
        averagePatientLoad: z.number().optional(),
        bio: z.string().optional(),
        certifications: z.array(z.string()).optional(),
        languages: z.array(z.string()).optional(),
        department: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const [existingProfile] = await db
        .select()
        .from(providerProfiles)
        .where(eq(providerProfiles.userId, ctx.user.id))
        .limit(1);

      // Calculate completion from the merged persisted profile. Dedicated workplace
      // edits must not make professional-profile completion fall backward merely
      // because they do not resubmit unchanged facility context. Professional
      // verification is completed only by structured, current credentials.
      const mergedProfile = { ...existingProfile, ...input };
      const readinessBeforeSave = await calculateProviderProfileReadiness(db, ctx.user.id, mergedProfile);
      const completionPercentage = readinessBeforeSave.completionPercentage;

      const updateData: any = {
        ...input,
        department: input.department?.trim() ? canonicalizeDepartmentLabel(input.department) : input.department,
        certifications: input.certifications ? JSON.stringify(input.certifications) : undefined,
        languages: input.languages ? JSON.stringify(input.languages) : undefined,
        profileCompletionPercentage: completionPercentage,
        profileCompleted: completionPercentage >= 80,
        updatedAt: new Date(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      await db
        .update(providerProfiles)
        .set(updateData)
        .where(eq(providerProfiles.userId, ctx.user.id));

      const [savedProfile] = await db
        .select()
        .from(providerProfiles)
        .where(eq(providerProfiles.userId, ctx.user.id))
        .limit(1);
      const readinessAfterSave = savedProfile
        ? await calculateProviderProfileReadiness(db, ctx.user.id, savedProfile)
        : readinessBeforeSave;

      // Keep institutional staffing eligibility aligned when a provider changes
      // only their department. Previously this sync ran only when facilityId was
      // submitted, leaving institutionalStaffMembers.department and
      // facilityDepartmentId stale after a profile department edit.
      if (input.yearsOfExperience !== undefined) {
        await db
          .update(institutionalStaffMembers)
          .set({ yearsOfExperience: input.yearsOfExperience, updatedAt: new Date() })
          .where(and(
            eq(institutionalStaffMembers.userId, ctx.user.id),
            isNull(institutionalStaffMembers.removedAt),
          ));
      }

      if (input.facilityId !== undefined || input.department !== undefined) {
        const [updatedProfile] = await db
          .select({ facilityId: providerProfiles.facilityId })
          .from(providerProfiles)
          .where(eq(providerProfiles.userId, ctx.user.id))
          .limit(1);
        if (updatedProfile?.facilityId) {
          await syncProviderProfileFacility(ctx.user.id, updatedProfile.facilityId);
        }
      }

      return {
        success: true,
        completionPercentage: readinessAfterSave.completionPercentage,
        professionalReadiness: readinessAfterSave,
      };
    }),

  // Get provider performance metrics
  getPerformanceMetrics: protectedProcedure
    .input(z.object({ period: z.enum(["daily", "weekly", "monthly", "yearly"]).optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const query = db
        .select()
        .from(providerPerformanceMetrics)
        .where(eq(providerPerformanceMetrics.userId, ctx.user.id));

      let metrics = await query;

      if (input.period) {
        metrics = metrics.filter(m => m.period === input.period);
      }

      return metrics.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }),

  // Get provider dashboard data
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get user info
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    // Get profile
    const profile = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.userId, ctx.user.id))
      .limit(1);

    // Get latest monthly metrics
    const metrics = await db
      .select()
      .from(providerPerformanceMetrics)
      .where(and(
        eq(providerPerformanceMetrics.userId, ctx.user.id),
        eq(providerPerformanceMetrics.period, "monthly")
      ))
      .orderBy(desc(providerPerformanceMetrics.createdAt))
      .limit(1);

    const currentMetrics = metrics[0] || {
      decisionsLogged: 0,
      diagnosticAccuracy: 0,
      avgDecisionTime: 0,
      protocolAdherence: 0,
      patientSurvivalRate: 0,
      livesSavedCount: 0,
      patientsMonitoredCount: 0,
      coursesCompleted: 0,
      certificationsEarned: 0,
      referralsMade: 0,
      earnings: 0,
    };

    return {
      user: user[0],
      profile: profile[0],
      currentMetrics,
      profileCompletion: profile[0]?.profileCompletionPercentage || 0,
    };
  }),

  // Initialize provider performance metrics for a new period
  initializeMetrics: protectedProcedure
    .input(z.object({ period: z.enum(["daily", "weekly", "monthly", "yearly"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db.insert(providerPerformanceMetrics).values({
        userId: ctx.user.id,
        period: input.period,
      });

      return { success: true };
    }),

  // Update provider performance metrics
  updateMetrics: protectedProcedure
    .input(
      z.object({
        period: z.enum(["daily", "weekly", "monthly", "yearly"]),
        decisionsLogged: z.number().optional(),
        diagnosticAccuracy: z.string().optional(),
        avgDecisionTime: z.number().optional(),
        protocolAdherence: z.string().optional(),
        patientSurvivalRate: z.string().optional(),
        livesSavedCount: z.number().optional(),
        patientsMonitoredCount: z.number().optional(),
        coursesCompleted: z.number().optional(),
        certificationsEarned: z.number().optional(),
        referralsMade: z.number().optional(),
        earnings: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get or create metrics for this period
      const existing = await db
        .select()
        .from(providerPerformanceMetrics)
        .where(and(
          eq(providerPerformanceMetrics.userId, ctx.user.id),
          eq(providerPerformanceMetrics.period, input.period)
        ))
        .orderBy(desc(providerPerformanceMetrics.createdAt))
        .limit(1);

      const { period, ...updates } = input;

      if (existing[0]) {
        await db
          .update(providerPerformanceMetrics)
          .set({
            ...updates,
            updatedAt: new Date(),
          } as any)
          .where(eq(providerPerformanceMetrics.id, existing[0].id));
      } else {
        await db.insert(providerPerformanceMetrics).values({
          userId: ctx.user.id,
          period,
          ...updates,
        } as any);
      }

      return { success: true };
    }),

  // Get the authenticated provider's latest self metrics only. Peer averages
  // and percentiles are deliberately not returned from the provider portal.
  getProviderStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const myMetrics = await db
      .select()
      .from(providerPerformanceMetrics)
      .where(and(
        eq(providerPerformanceMetrics.userId, ctx.user.id),
        eq(providerPerformanceMetrics.period, "monthly")
      ))
      .orderBy(desc(providerPerformanceMetrics.createdAt))
      .limit(1);

    return { myStats: myMetrics[0] ?? null };
  }),

  // Note: a `updateMyCohortDesignation` mutation used to live here (from the
  // original Antigravity PR #301) — removed 2026-07-19. It was unused (no
  // frontend ever called it) and fully superseded by `institution.declareMyDesignation`,
  // which does the same thing plus the nurse licence-number handling this one
  // never had. Found while renaming bsn_intern -> noi; flagging honestly that
  // this duplication existed for a while without being noticed, including by
  // the session that built declareMyDesignation without searching for it first.
});
