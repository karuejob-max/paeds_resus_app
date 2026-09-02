import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  providerProfiles,
  providerPerformanceMetrics,
  users,
  cpdAttendees,
  institutionMemberships,
  institutionalAccounts,
  institutionalStaffMembers,
  professionalCredentials,
} from "../../drizzle/schema";
import { eq, and, desc, or, sql, isNull } from "drizzle-orm";
import { autoLinkCpdFacilitiesForUser, syncProviderProfileFacility } from "../services/facility-registry.service";
import { canonicalizeDepartmentLabel } from "../../shared/clinical-departments";

type ProviderFacilityHistoryEntry = {
  institutionId: number;
  institutionName: string;
  relationship: "permanent_facility" | "locum_outreach";
  membershipStatus: "invited" | "active" | "suspended" | "ended" | null;
  lastAttendedAt: Date | null;
  departments: string[];
};

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
  const licenseCredential = credentials.find(credential => credential.credentialType === "regulatory_license");
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

export const providerRouter = router({
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
