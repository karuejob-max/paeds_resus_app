import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, desc, eq, inArray } from "drizzle-orm";
import { appRouter } from "../routers";
import { getDb } from "../db";
import type { TrpcContext } from "../_core/context";
import {
  users,
  institutionalAccounts,
  institutionalAccountAdmins,
  institutionalProducts,
  institutionalProductCapabilities,
  institutionProductSubscriptions,
  institutionProductEntitlements,
  institutionProductRoles,
  institutionMemberships,
  institutionMembershipEvents,
  institutionAccountScopes,
  institutionalStaffMembers,
  facilityPoles,
  facilityDepartments,
  institutionDepartmentResponseCoordinators,
  institutionDepartmentResponseCoordinatorEvents,
  ertlWeeklyRotations,
  monthlyUtlRotations,
  shiftUtlRosters,
  institutionShiftTemplates,
  iersEvidenceRecords,
  careFacilities,
  providerProfiles,
  cpdAttendees,
  cpdEvents,
  iersShiftTeams,
  iersShiftRoleAssignments,
  iersShiftRoleEvents,
  iersActivationEvents,
  iersActivationResponders,
  iersActivationResources,
  iersActivationArrivals,
  iersActivationTimeline,
  iersActivationTeamSnapshots,
  inAppNotifications,
  iersReadinessTemplates,
  iersReadinessTemplateItems,
} from "../../drizzle/schema";

const stagingUrl = process.env.IERS_STAGING_DATABASE_URL || "";
const isLocalStaging = process.env.IERS_STAGING_ENABLE === "1" && (() => {
  try {
    const url = new URL(stagingUrl);
    return ["127.0.0.1", "localhost", "::1"].includes(url.hostname) && /staging/i.test(url.pathname);
  } catch {
    return false;
  }
})();

const describeStaging = isLocalStaging ? describe : describe.skip;

type FixtureIds = {
  institutionId: number;
  otherInstitutionId: number;
  adminId: number;
  assignedProviderId: number;
  staffMemberId: number;
  unrelatedProviderId: number;
  replacementProviderId: number;
  otherTenantProviderId: number;
  poleId: number;
  otherPoleId: number;
  departmentId: number;
  otherDepartmentId: number;
  ercoAssignmentId: number;
  rotationId: number;
  reassignmentRotationId: number;
  rosterId: number;
  endedRotationId: number;
  productId: number;
  readinessCapabilityId: number;
  workspaceCapabilityId: number;
  facilityId: number;
  registeredProviderId: number;
  cpdOnlyProviderId: number;
  publishedTeamId: number;
  publishedUtlAssignmentId: number;
  directTeamId: number;
  directUtlAssignmentId: number;
  declineRosterId: number;
  declineTeamId: number;
  declineAssignmentId: number;
};

const now = new Date();
const today = now.toISOString().slice(0, 10);
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const nextWeek = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

function createContext(user: { id: number; email: string; name: string }): TrpcContext {
  return {
    user: {
      id: user.id,
      openId: `staging-${user.id}`,
      name: user.name,
      email: user.email,
      phone: null,
      loginMethod: "staging",
      passwordHash: null,
      role: "user",
      institutionalRole: null,
      providerType: "nurse",
      userType: "individual",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

async function expectTrpcError(action: () => Promise<unknown>, code: string) {
  try {
    await action();
    throw new Error(`Expected tRPC error ${code}, but the call succeeded.`);
  } catch (error) {
    expect(error).toMatchObject({ code });
  }
}

describeStaging("real tRPC provider-duty authorization matrix on an ephemeral staging tenant", () => {
  let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
  let ids: FixtureIds;
  let adminCaller: ReturnType<typeof appRouter.createCaller>;
  let assignedCaller: ReturnType<typeof appRouter.createCaller>;
  let registeredCaller: ReturnType<typeof appRouter.createCaller>;
  let unrelatedCaller: ReturnType<typeof appRouter.createCaller>;
  let replacementCaller: ReturnType<typeof appRouter.createCaller>;
  let cpdOnlyCaller: ReturnType<typeof appRouter.createCaller>;
  let otherTenantCaller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    if (!isLocalStaging) return;
    db = (await getDb())!;
    if (!db) throw new Error("The staging database connection could not be created.");

    const suffix = Date.now();
    const assignedEmail = "paedsresus254@gmail.com";
    const [adminInsert] = await db.insert(users).values({
      openId: `staging-admin-${suffix}`,
      name: "Staging IERS Administrator",
      email: `staging-admin-${suffix}@example.test`,
      loginMethod: "staging",
      role: "user",
      userType: "institutional",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    });
    const adminId = Number((adminInsert as unknown as { insertId: number }).insertId);

    const [assignedInsert] = await db.insert(users).values({
      openId: `staging-assigned-${suffix}`,
      name: "Staging Assigned Provider",
      email: assignedEmail,
      loginMethod: "staging",
      role: "user",
      providerType: "nurse",
      userType: "individual",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    });
    const assignedProviderId = Number((assignedInsert as unknown as { insertId: number }).insertId);

    const registeredEmail = `staging-registered-rn-${suffix}@example.test`;
    const [registeredInsert] = await db.insert(users).values({
      openId: `staging-registered-rn-${suffix}`,
      name: "Staging Newly Registered Staff RN",
      email: registeredEmail,
      loginMethod: "staging",
      role: "user",
      providerType: null,
      cadre: "Staff RN",
      cadreOther: null,
      userType: "individual",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    });
    const registeredProviderId = Number((registeredInsert as unknown as { insertId: number }).insertId);

    const cpdOnlyEmail = `staging-cpd-only-rn-${suffix}@example.test`;
    const [cpdOnlyInsert] = await db.insert(users).values({
      openId: `staging-cpd-only-rn-${suffix}`,
      name: "Staging CPD-only Staff RN",
      email: cpdOnlyEmail,
      loginMethod: "staging",
      role: "user",
      providerType: null,
      cadre: null,
      cadreOther: null,
      userType: "individual",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    });
    const cpdOnlyProviderId = Number((cpdOnlyInsert as unknown as { insertId: number }).insertId);

    const [unrelatedInsert] = await db.insert(users).values({
      openId: `staging-unrelated-${suffix}`,
      name: "Staging Unrelated Provider",
      email: `staging-unrelated-${suffix}@example.test`,
      loginMethod: "staging",
      role: "user",
      providerType: "nurse",
      userType: "individual",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    });
    const unrelatedProviderId = Number((unrelatedInsert as unknown as { insertId: number }).insertId);

    const [replacementInsert] = await db.insert(users).values({
      openId: `staging-replacement-${suffix}`,
      name: "Staging Replacement Provider",
      email: `staging-replacement-${suffix}@example.test`,
      loginMethod: "staging",
      role: "user",
      providerType: "nurse",
      userType: "individual",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    });
    const replacementProviderId = Number((replacementInsert as unknown as { insertId: number }).insertId);

    const [otherTenantInsert] = await db.insert(users).values({
      openId: `staging-other-tenant-${suffix}`,
      name: "Staging Other Tenant Provider",
      email: `staging-other-tenant-${suffix}@example.test`,
      loginMethod: "staging",
      role: "user",
      providerType: "nurse",
      userType: "individual",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    });
    const otherTenantProviderId = Number((otherTenantInsert as unknown as { insertId: number }).insertId);

    const [institutionInsert] = await db.insert(institutionalAccounts).values({
      userId: adminId,
      companyName: `STAGING IERS Tenant Alpha ${suffix}`,
      contactName: "Staging IERS Administrator",
      contactEmail: `staging-admin-${suffix}@example.test`,
      contactPhone: "+254700000001",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    const institutionId = Number((institutionInsert as unknown as { insertId: number }).insertId);

    const [otherInstitutionInsert] = await db.insert(institutionalAccounts).values({
      userId: adminId,
      companyName: `STAGING IERS Tenant Bravo ${suffix}`,
      contactName: "Staging IERS Administrator",
      contactEmail: `staging-admin-${suffix}@example.test`,
      contactPhone: "+254700000001",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    const otherInstitutionId = Number((otherInstitutionInsert as unknown as { insertId: number }).insertId);

    await db.insert(institutionalAccountAdmins).values({ institutionalAccountId: institutionId, userId: adminId, addedByUserId: null, createdAt: now });
    await db.insert(institutionalAccountAdmins).values({ institutionalAccountId: otherInstitutionId, userId: adminId, addedByUserId: null, createdAt: now });

    const [facilityInsert] = await db.insert(careFacilities).values({
      name: `STAGING REGISTERED FACILITY ${suffix}`,
      country: "Kenya",
      institutionalAccountId: institutionId,
      createdAt: now,
      updatedAt: now,
    });
    const facilityId = Number((facilityInsert as unknown as { insertId: number }).insertId);

    const [product] = await db.select({ id: institutionalProducts.id }).from(institutionalProducts).where(eq(institutionalProducts.productKey, "iers")).limit(1);
    if (!product) throw new Error("The IERS product registry is missing from the staging database.");
    const productId = product.id;

    const [capability] = await db
      .select({ id: institutionalProductCapabilities.id })
      .from(institutionalProductCapabilities)
      .where(and(
        eq(institutionalProductCapabilities.productId, productId),
        eq(institutionalProductCapabilities.capabilityKey, "iers.team_readiness.operate"),
        eq(institutionalProductCapabilities.status, "active"),
      ))
      .limit(1);
    if (!capability) throw new Error("The IERS team-readiness capability is missing from the staging database.");
    const [workspaceCapability] = await db
      .select({ id: institutionalProductCapabilities.id })
      .from(institutionalProductCapabilities)
      .where(and(
        eq(institutionalProductCapabilities.productId, productId),
        eq(institutionalProductCapabilities.capabilityKey, "iers.workspace.read"),
        eq(institutionalProductCapabilities.status, "active"),
      ))
      .limit(1);
    if (!workspaceCapability) throw new Error("The IERS workspace-read capability is missing from the staging database.");
    for (const capabilityKey of ["iers.activation.operate", "iers.activation.respond"] as const) {
      const [activationCapability] = await db
        .select({ id: institutionalProductCapabilities.id })
        .from(institutionalProductCapabilities)
        .where(and(
          eq(institutionalProductCapabilities.productId, productId),
          eq(institutionalProductCapabilities.capabilityKey, capabilityKey),
          eq(institutionalProductCapabilities.status, "active"),
        ))
        .limit(1);
      if (!activationCapability) throw new Error(`The ${capabilityKey} capability is missing from the staging database.`);
    }

    const [subscriptionInsert] = await db.insert(institutionProductSubscriptions).values({
      institutionalAccountId: institutionId,
      productId,
      subscriptionStatus: "active",
      source: "pilot",
      startsAt: now,
      renewsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    });
    const subscriptionId = Number((subscriptionInsert as unknown as { insertId: number }).insertId);
    await db.insert(institutionProductEntitlements).values([
      {
        institutionalAccountId: institutionId,
        productId,
        subscriptionId,
        capabilityKey: "iers.team_readiness.operate",
        entitlementStatus: "active",
        startsAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        institutionalAccountId: institutionId,
        productId,
        subscriptionId,
        capabilityKey: "iers.workspace.read",
        entitlementStatus: "active",
        startsAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        institutionalAccountId: institutionId,
        productId,
        subscriptionId,
        capabilityKey: "iers.activation.operate",
        entitlementStatus: "active",
        startsAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        institutionalAccountId: institutionId,
        productId,
        subscriptionId,
        capabilityKey: "iers.activation.respond",
        entitlementStatus: "active",
        startsAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await db.insert(institutionMemberships).values([
      { institutionalAccountId: institutionId, userId: assignedProviderId, invitedEmail: assignedEmail, membershipStatus: "active", responsibilityRole: "er_coordinator", acceptedAt: now, createdAt: now, updatedAt: now },
      { institutionalAccountId: institutionId, userId: unrelatedProviderId, invitedEmail: `staging-unrelated-${suffix}@example.test`, membershipStatus: "active", responsibilityRole: "general_staff", acceptedAt: now, createdAt: now, updatedAt: now },
      { institutionalAccountId: institutionId, userId: replacementProviderId, invitedEmail: `staging-replacement-${suffix}@example.test`, membershipStatus: "active", responsibilityRole: "unit_team_leader", acceptedAt: now, createdAt: now, updatedAt: now },
      { institutionalAccountId: otherInstitutionId, userId: otherTenantProviderId, invitedEmail: `staging-other-tenant-${suffix}@example.test`, membershipStatus: "active", responsibilityRole: "unit_team_leader", acceptedAt: now, createdAt: now, updatedAt: now },
    ]);

    await db.insert(institutionProductRoles).values([
      { institutionalAccountId: institutionId, productId, userId: adminId, invitedEmail: `staging-admin-${suffix}@example.test`, roleKey: "iers_governance", roleStatus: "active", grantedByUserId: adminId, grantedAt: now, createdAt: now, updatedAt: now },
      { institutionalAccountId: institutionId, productId, userId: assignedProviderId, invitedEmail: assignedEmail, roleKey: "iers_responder", roleStatus: "active", grantedByUserId: adminId, grantedAt: now, createdAt: now, updatedAt: now },
      { institutionalAccountId: institutionId, productId, userId: unrelatedProviderId, invitedEmail: `staging-unrelated-${suffix}@example.test`, roleKey: "iers_responder", roleStatus: "active", grantedByUserId: adminId, grantedAt: now, createdAt: now, updatedAt: now },
      { institutionalAccountId: institutionId, productId, userId: replacementProviderId, invitedEmail: `staging-replacement-${suffix}@example.test`, roleKey: "iers_responder", roleStatus: "active", grantedByUserId: adminId, grantedAt: now, createdAt: now, updatedAt: now },
      { institutionalAccountId: institutionId, productId, userId: registeredProviderId, invitedEmail: registeredEmail, roleKey: "iers_responder", roleStatus: "active", grantedByUserId: adminId, grantedAt: now, createdAt: now, updatedAt: now },
      { institutionalAccountId: otherInstitutionId, productId, userId: otherTenantProviderId, invitedEmail: `staging-other-tenant-${suffix}@example.test`, roleKey: "iers_responder", roleStatus: "active", grantedByUserId: adminId, grantedAt: now, createdAt: now, updatedAt: now },
    ]);

    const [poleInsert] = await db.insert(facilityPoles).values({ institutionId, poleName: "STAGING ZONE ALPHA", description: "Ephemeral authorization fixture", createdAt: now });
    const poleId = Number((poleInsert as unknown as { insertId: number }).insertId);
    const [otherPoleInsert] = await db.insert(facilityPoles).values({ institutionId: otherInstitutionId, poleName: "STAGING ZONE BRAVO", description: "Ephemeral authorization fixture", createdAt: now });
    const otherPoleId = Number((otherPoleInsert as unknown as { insertId: number }).insertId);

    const [departmentInsert] = await db.insert(facilityDepartments).values({ institutionId, poleId, departmentName: "STAGING DEPARTMENT ALPHA", isActive: true, requiresPole: true, confirmedAt: now, confirmedByUserId: adminId, createdAt: now });
    const departmentId = Number((departmentInsert as unknown as { insertId: number }).insertId);
    await db.insert(institutionalStaffMembers).values({
      institutionalAccountId: institutionId,
      userId: cpdOnlyProviderId,
      staffName: "Staging CPD-only Staff RN",
      staffEmail: cpdOnlyEmail,
      staffRole: "nurse",
      governanceRole: "general_staff",
      department: "STAGING DEPARTMENT ALPHA",
      facilityDepartmentId: departmentId,
      facilityLinkStatus: "linked",
      enrollmentStatus: "enrolled",
      createdAt: now,
      updatedAt: now,
    });
    const [cpdEventInsert] = await db.insert(cpdEvents).values({
      institutionalAccountId: institutionId,
      name: "Staging IERS CPD event",
      eventDate: today,
      isOpen: false,
      createdAt: now,
    });
    const cpdEventId = Number((cpdEventInsert as unknown as { insertId: number }).insertId);
    await db.insert(cpdAttendees).values({
      cpdEventId,
      institutionalAccountId: institutionId,
      fullName: "Staging CPD-only Staff RN",
      email: cpdOnlyEmail,
      phone: "+254700000099",
      cadre: "Staff RN",
      department: "STAGING DEPARTMENT ALPHA",
      facilityDepartmentId: departmentId,
      attendanceType: "primary_facility",
      roleInEvent: "attendee",
      checkInPunctuality: "on_time",
      submittedAt: now,
    });
    await db.insert(providerProfiles).values({
      userId: registeredProviderId,
      facilityId,
      department: "STAGING DEPARTMENT ALPHA",
      profileCompleted: false,
      profileCompletionPercentage: 0,
      createdAt: now,
      updatedAt: now,
    });
    const [staffInsert] = await db.insert(institutionalStaffMembers).values({
      institutionalAccountId: institutionId,
      userId: assignedProviderId,
      staffName: "Staging Assigned Provider",
      staffEmail: assignedEmail,
      staffRole: "nurse",
      governanceRole: "unit_team_leader",
      department: "STAGING DEPARTMENT ALPHA",
      facilityDepartmentId: departmentId,
      facilityLinkStatus: "linked",
      enrollmentStatus: "enrolled",
      createdAt: now,
      updatedAt: now,
    });
    const staffMemberId = Number((staffInsert as unknown as { insertId: number }).insertId);
    await db.insert(institutionalStaffMembers).values({
      institutionalAccountId: institutionId,
      userId: replacementProviderId,
      staffName: "Staging Replacement Provider",
      staffEmail: `staging-replacement-${suffix}@example.test`,
      staffRole: "nurse",
      governanceRole: "unit_team_leader",
      department: "STAGING DEPARTMENT ALPHA",
      facilityDepartmentId: departmentId,
      facilityLinkStatus: "linked",
      enrollmentStatus: "enrolled",
      createdAt: now,
      updatedAt: now,
    });
    const [otherDepartmentInsert] = await db.insert(facilityDepartments).values({ institutionId: otherInstitutionId, poleId: otherPoleId, departmentName: "STAGING DEPARTMENT BRAVO", isActive: true, requiresPole: true, confirmedAt: now, confirmedByUserId: adminId, createdAt: now });
    const otherDepartmentId = Number((otherDepartmentInsert as unknown as { insertId: number }).insertId);

    const [ercoInsert] = await db.insert(institutionDepartmentResponseCoordinators).values({
      institutionId,
      departmentId,
      coordinatorUserId: assignedProviderId,
      backupUserId: null,
      assignmentStatus: "pending_acceptance",
      effectiveFrom: new Date(today),
      effectiveUntil: new Date(nextWeek),
      assignedByUserId: adminId,
      assignedAt: now,
      updatedAt: now,
    });
    const ercoAssignmentId = Number((ercoInsert as unknown as { insertId: number }).insertId);

    const [rotationInsert] = await db.insert(ertlWeeklyRotations).values({
      institutionId,
      poleId,
      departmentId,
      weekNumber: 34,
      year: 2026,
      startDate: new Date(today),
      endDate: new Date(nextWeek),
      ertlUserId: assignedProviderId,
      assignmentStatus: "pending_acceptance",
      createdAt: now,
    });
    const rotationId = Number((rotationInsert as unknown as { insertId: number }).insertId);

    const [reassignmentRotationInsert] = await db.insert(ertlWeeklyRotations).values({
      institutionId,
      poleId,
      departmentId,
      weekNumber: 35,
      year: 2026,
      startDate: new Date(today),
      endDate: new Date(nextWeek),
      ertlUserId: assignedProviderId,
      assignmentStatus: "active",
      acceptedAt: now,
      createdAt: now,
    });
    const reassignmentRotationId = Number((reassignmentRotationInsert as unknown as { insertId: number }).insertId);

    const [rosterInsert] = await db.insert(shiftUtlRosters).values({
      institutionId,
      poleId,
      departmentId,
      shiftDate: new Date(today),
      shiftType: "morning",
      shiftStartTime: "00:00:00",
      shiftEndTime: "23:59:59",
      shiftEndDayOffset: 0,
      utlUserId: assignedProviderId,
      isShiftErtl: false,
      assignmentStatus: "pending_acceptance",
      status: "active",
      createdAt: now,
    });
    const rosterId = Number((rosterInsert as unknown as { insertId: number }).insertId);

    const [publishedTeamInsert] = await db.insert(iersShiftTeams).values({
      institutionId,
      poleId,
      shiftDate: new Date(today),
      shiftType: "morning",
      // Keep this disposable activation team current regardless of the hour
      // when the local matrix is executed; production teams retain exact shift times.
      shiftStartTime: "00:00:00",
      shiftEndTime: "23:59:59",
      shiftEndDayOffset: 0,
      teamVersion: 1,
      status: "published",
      createdByUserId: adminId,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    const publishedTeamId = Number((publishedTeamInsert as unknown as { insertId: number }).insertId);
    const [publishedAssignmentInsert] = await db.insert(iersShiftRoleAssignments).values({
      teamId: publishedTeamId,
      institutionId,
      poleId,
      departmentId,
      providerUserId: assignedProviderId,
      shiftUtlRosterId: rosterId,
      roleScope: "utl",
      roleKey: "utl",
      assignmentStatus: "pending_acceptance",
      proposedByUserId: adminId,
      createdAt: now,
      updatedAt: now,
    });
    const publishedUtlAssignmentId = Number((publishedAssignmentInsert as unknown as { insertId: number }).insertId);

    const [directRosterInsert] = await db.insert(shiftUtlRosters).values({
      institutionId,
      poleId,
      departmentId,
      shiftDate: new Date(tomorrow),
      shiftType: "evening",
      shiftStartTime: "17:30:00",
      shiftEndTime: "21:30:00",
      shiftEndDayOffset: 0,
      utlUserId: assignedProviderId,
      isShiftErtl: false,
      assignmentStatus: "pending_acceptance",
      status: "active",
      createdAt: now,
    });
    const directRosterId = Number((directRosterInsert as unknown as { insertId: number }).insertId);
    const [directTeamInsert] = await db.insert(iersShiftTeams).values({
      institutionId,
      poleId,
      shiftDate: new Date(tomorrow),
      shiftType: "evening",
      shiftStartTime: "17:30:00",
      shiftEndTime: "21:30:00",
      shiftEndDayOffset: 0,
      teamVersion: 1,
      status: "published",
      createdByUserId: adminId,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    const directTeamId = Number((directTeamInsert as unknown as { insertId: number }).insertId);
    const [directAssignmentInsert] = await db.insert(iersShiftRoleAssignments).values({
      teamId: directTeamId,
      institutionId,
      poleId,
      departmentId,
      providerUserId: assignedProviderId,
      shiftUtlRosterId: directRosterId,
      roleScope: "utl",
      roleKey: "utl",
      assignmentStatus: "pending_acceptance",
      proposedByUserId: adminId,
      createdAt: now,
      updatedAt: now,
    });
    const directUtlAssignmentId = Number((directAssignmentInsert as unknown as { insertId: number }).insertId);

    const [declineRosterInsert] = await db.insert(shiftUtlRosters).values({
      institutionId,
      poleId,
      departmentId,
      shiftDate: new Date(nextWeek),
      shiftType: "night",
      shiftStartTime: "21:30:00",
      shiftEndTime: "05:30:00",
      shiftEndDayOffset: 1,
      utlUserId: assignedProviderId,
      isShiftErtl: false,
      assignmentStatus: "pending_acceptance",
      status: "active",
      createdAt: now,
    });
    const declineRosterId = Number((declineRosterInsert as unknown as { insertId: number }).insertId);
    const [declineTeamInsert] = await db.insert(iersShiftTeams).values({
      institutionId,
      poleId,
      shiftDate: new Date(nextWeek),
      shiftType: "night",
      shiftStartTime: "21:30:00",
      shiftEndTime: "05:30:00",
      shiftEndDayOffset: 1,
      teamVersion: 1,
      status: "published",
      createdByUserId: adminId,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    const declineTeamId = Number((declineTeamInsert as unknown as { insertId: number }).insertId);
    const [declineAssignmentInsert] = await db.insert(iersShiftRoleAssignments).values({
      teamId: declineTeamId,
      institutionId,
      poleId,
      departmentId,
      providerUserId: assignedProviderId,
      shiftUtlRosterId: declineRosterId,
      roleScope: "utl",
      roleKey: "utl",
      assignmentStatus: "pending_acceptance",
      proposedByUserId: adminId,
      createdAt: now,
      updatedAt: now,
    });
    const declineAssignmentId = Number((declineAssignmentInsert as unknown as { insertId: number }).insertId);

    const [endedRotationInsert] = await db.insert(ertlWeeklyRotations).values({
      institutionId,
      poleId,
      departmentId,
      weekNumber: 36,
      year: 2026,
      startDate: new Date(today),
      endDate: new Date(tomorrow),
      ertlUserId: assignedProviderId,
      assignmentStatus: "ended",
      acceptedAt: now,
      createdAt: now,
    });
    const endedRotationId = Number((endedRotationInsert as unknown as { insertId: number }).insertId);

    await db.insert(shiftUtlRosters).values({
      institutionId: otherInstitutionId,
      poleId: otherPoleId,
      departmentId: otherDepartmentId,
      shiftDate: new Date(today),
      shiftType: "morning",
      utlUserId: otherTenantProviderId,
      isShiftErtl: false,
      assignmentStatus: "active",
      acceptedAt: now,
      status: "active",
      createdAt: now,
    });

    ids = {
      institutionId,
      otherInstitutionId,
      adminId,
      assignedProviderId,
      staffMemberId,
      unrelatedProviderId,
      replacementProviderId,
      otherTenantProviderId,
      poleId,
      otherPoleId,
      departmentId,
      otherDepartmentId,
      ercoAssignmentId,
      rotationId,
      reassignmentRotationId,
      rosterId,
      endedRotationId,
      productId,
      readinessCapabilityId: capability.id,
      workspaceCapabilityId: workspaceCapability.id,
      facilityId,
      registeredProviderId,
      cpdOnlyProviderId,
      publishedTeamId,
      publishedUtlAssignmentId,
      directTeamId,
      directUtlAssignmentId,
      declineRosterId,
      declineTeamId,
      declineAssignmentId,
    };

    registeredCaller = appRouter.createCaller(createContext({ id: registeredProviderId, name: "Staging Newly Registered Staff RN", email: registeredEmail }));
    adminCaller = appRouter.createCaller(createContext({ id: adminId, name: "Staging IERS Administrator", email: `staging-admin-${suffix}@example.test` }));
    assignedCaller = appRouter.createCaller(createContext({ id: assignedProviderId, name: "Staging Assigned Provider", email: assignedEmail }));
    unrelatedCaller = appRouter.createCaller(createContext({ id: unrelatedProviderId, name: "Staging Unrelated Provider", email: `staging-unrelated-${suffix}@example.test` }));
    replacementCaller = appRouter.createCaller(createContext({ id: replacementProviderId, name: "Staging Replacement Provider", email: `staging-replacement-${suffix}@example.test` }));
    cpdOnlyCaller = appRouter.createCaller(createContext({ id: cpdOnlyProviderId, name: "Staging CPD-only Staff RN", email: cpdOnlyEmail }));
    otherTenantCaller = appRouter.createCaller(createContext({ id: otherTenantProviderId, name: "Staging Other Tenant Provider", email: `staging-other-tenant-${suffix}@example.test` }));
  });

  afterAll(async () => {
    if (!isLocalStaging || !db || !ids) return;
    const institutionIds = [ids.institutionId, ids.otherInstitutionId];
    const userIds = [ids.adminId, ids.assignedProviderId, ids.registeredProviderId, ids.cpdOnlyProviderId, ids.unrelatedProviderId, ids.replacementProviderId, ids.otherTenantProviderId];
    await db.delete(iersEvidenceRecords).where(inArray(iersEvidenceRecords.institutionId, institutionIds));
    await db.delete(cpdAttendees).where(inArray(cpdAttendees.institutionalAccountId, institutionIds));
    await db.delete(cpdEvents).where(inArray(cpdEvents.institutionalAccountId, institutionIds));
    await db.delete(iersActivationArrivals).where(inArray(iersActivationArrivals.institutionId, institutionIds));
    await db.delete(iersActivationResources).where(inArray(iersActivationResources.institutionId, institutionIds));
    await db.delete(iersActivationResponders).where(inArray(iersActivationResponders.institutionalAccountId, institutionIds));
    await db.delete(iersActivationTimeline).where(inArray(iersActivationTimeline.institutionalAccountId, institutionIds));
    await db.delete(iersActivationTeamSnapshots).where(inArray(iersActivationTeamSnapshots.institutionId, institutionIds));
    await db.delete(iersActivationEvents).where(inArray(iersActivationEvents.institutionalAccountId, institutionIds));
    const readinessTemplateRows = await db.select({ id: iersReadinessTemplates.id }).from(iersReadinessTemplates).where(inArray(iersReadinessTemplates.institutionId, institutionIds));
    const readinessTemplateIds = readinessTemplateRows.map((row) => row.id);
    if (readinessTemplateIds.length > 0) await db.delete(iersReadinessTemplateItems).where(inArray(iersReadinessTemplateItems.templateId, readinessTemplateIds));
    await db.delete(iersReadinessTemplates).where(inArray(iersReadinessTemplates.institutionId, institutionIds));
    await db.delete(iersShiftRoleEvents).where(inArray(iersShiftRoleEvents.institutionId, institutionIds));
    await db.delete(iersShiftRoleAssignments).where(inArray(iersShiftRoleAssignments.institutionId, institutionIds));
    await db.delete(iersShiftTeams).where(inArray(iersShiftTeams.institutionId, institutionIds));
    await db.delete(shiftUtlRosters).where(inArray(shiftUtlRosters.institutionId, institutionIds));
    await db.delete(monthlyUtlRotations).where(inArray(monthlyUtlRotations.institutionId, institutionIds));
    await db.delete(ertlWeeklyRotations).where(inArray(ertlWeeklyRotations.institutionId, institutionIds));
    await db.delete(institutionDepartmentResponseCoordinatorEvents).where(inArray(institutionDepartmentResponseCoordinatorEvents.institutionId, institutionIds));
    await db.delete(institutionDepartmentResponseCoordinators).where(inArray(institutionDepartmentResponseCoordinators.institutionId, institutionIds));
    await db.delete(institutionMembershipEvents).where(inArray(institutionMembershipEvents.institutionalAccountId, institutionIds));
    await db.delete(institutionalStaffMembers).where(inArray(institutionalStaffMembers.institutionalAccountId, institutionIds));
    await db.delete(providerProfiles).where(inArray(providerProfiles.userId, userIds));
    await db.delete(inAppNotifications).where(inArray(inAppNotifications.userId, userIds));
    await db.delete(careFacilities).where(eq(careFacilities.id, ids.facilityId));
    await db.delete(facilityDepartments).where(inArray(facilityDepartments.institutionId, institutionIds));
    await db.delete(facilityPoles).where(inArray(facilityPoles.institutionId, institutionIds));
    await db.delete(institutionProductEntitlements).where(and(
      eq(institutionProductEntitlements.institutionalAccountId, ids.institutionId),
      eq(institutionProductEntitlements.productId, ids.productId),
    ));
    await db.delete(institutionProductSubscriptions).where(and(
      eq(institutionProductSubscriptions.institutionalAccountId, ids.institutionId),
      eq(institutionProductSubscriptions.productId, ids.productId),
    ));
    await db.delete(institutionProductRoles).where(inArray(institutionProductRoles.institutionalAccountId, institutionIds));
    await db.delete(institutionMemberships).where(inArray(institutionMemberships.institutionalAccountId, institutionIds));
    await db.delete(institutionalAccountAdmins).where(inArray(institutionalAccountAdmins.institutionalAccountId, institutionIds));
    await db.delete(institutionalAccounts).where(inArray(institutionalAccounts.id, institutionIds));
    await db.delete(users).where(inArray(users.id, userIds));
  });

  it("executes the complete denial, acceptance, revocation, and readiness matrix through real tRPC callers", async () => {
    const preSyncCandidates = await adminCaller.institution.getDepartmentNurseCandidates({ institutionId: ids.institutionId, departmentId: ids.departmentId });
    expect(preSyncCandidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ userId: ids.registeredProviderId, assignable: false, facilityLinkStatus: "pending", needsAccountLink: true }),
      expect.objectContaining({ userId: ids.cpdOnlyProviderId, assignable: true, facilityLinkStatus: "linked", membershipStatus: "active", needsAccountLink: false }),
    ]));

    const profileSaved = await registeredCaller.provider.updateProfile({
      facilityId: ids.facilityId,
      department: "STAGING DEPARTMENT ALPHA",
    });
    expect(profileSaved.success).toBe(true);
    const pendingStaff = await db.select().from(institutionalStaffMembers).where(and(
      eq(institutionalStaffMembers.institutionalAccountId, ids.institutionId),
      eq(institutionalStaffMembers.userId, ids.registeredProviderId),
    ));
    expect(pendingStaff).toHaveLength(1);
    expect(pendingStaff[0]).toEqual(expect.objectContaining({
      facilityDepartmentId: ids.departmentId,
      facilityLinkStatus: "pending",
      staffRole: "nurse",
    }));
    const pendingCandidates = await adminCaller.institution.getDepartmentNurseCandidates({ institutionId: ids.institutionId, departmentId: ids.departmentId });
    expect(pendingCandidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ userId: ids.registeredProviderId, assignable: false, needsAccountLink: true }),
      expect.objectContaining({ userId: ids.cpdOnlyProviderId, assignable: true, facilityDepartmentId: ids.departmentId, facilityLinkStatus: "linked", membershipStatus: "active", needsAccountLink: false }),
    ]));
    const invitation = await adminCaller.institution.inviteProvider({
      institutionId: ids.institutionId,
      email: pendingStaff[0].staffEmail,
      staffName: "Staging Newly Registered Staff RN",
      staffRole: "nurse",
      responsibilityRole: "general_staff",
      department: "STAGING DEPARTMENT ALPHA",
    });
    expect(invitation.success).toBe(true);
    const [pendingMembership] = await db.select({ id: institutionMemberships.id }).from(institutionMemberships).where(and(
      eq(institutionMemberships.institutionalAccountId, ids.institutionId),
      eq(institutionMemberships.invitedEmail, pendingStaff[0].staffEmail),
      eq(institutionMemberships.membershipStatus, "invited"),
    )).orderBy(institutionMemberships.id).limit(1);
    expect(pendingMembership?.id).toBeGreaterThan(0);
    const invitationAccepted = await registeredCaller.institution.acceptMembershipInvite({ membershipId: pendingMembership.id });
    expect(invitationAccepted.success).toBe(true);
    const activeCandidates = await adminCaller.institution.getDepartmentNurseCandidates({ institutionId: ids.institutionId, departmentId: ids.departmentId });
    expect(activeCandidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ userId: ids.registeredProviderId, assignable: true, facilityLinkStatus: "linked", membershipStatus: "active" }),
    ]));

    const initialAssignments = await assignedCaller.institution.getMyProviderDutyAssignments();
    expect(initialAssignments.ertl.some((assignment) => assignment.id === ids.rotationId)).toBe(true);
    expect(initialAssignments.utl.some((assignment) => assignment.id === ids.rosterId)).toBe(true);

    const linkedDepartments = await assignedCaller.institution.getMyLinkedFacilityDepartments();
    expect(linkedDepartments).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: ids.departmentId, departmentName: "STAGING DEPARTMENT ALPHA" }),
    ]));

    const ercoAssignments = await assignedCaller.institution.getMyDepartmentResponseAssignments();
    expect(ercoAssignments.some((assignment) => assignment.id === ids.ercoAssignmentId)).toBe(true);

    await expectTrpcError(
      () => unrelatedCaller.institution.respondToShiftUtlRoster({ rosterId: ids.rosterId, response: "accept" }),
      "NOT_FOUND",
    );
    await expectTrpcError(
      () => otherTenantCaller.institution.respondToShiftUtlRoster({ rosterId: ids.rosterId, response: "accept" }),
      "NOT_FOUND",
    );
    await expectTrpcError(
      () => assignedCaller.institution.respondToShiftUtlRoster({ rosterId: ids.rosterId, response: "decline" }),
      "BAD_REQUEST",
    );
    await expectTrpcError(
      () => assignedCaller.iers.signOffShiftReadiness({ shiftRosterId: ids.rosterId, note: "Before acceptance" }),
      "BAD_REQUEST",
    );

    const ercoAccepted = await assignedCaller.institution.respondToDepartmentResponseCoordinatorAssignment({
      assignmentId: ids.ercoAssignmentId,
      response: "accept",
    });
    expect(ercoAccepted.assignmentStatus).toBe("active");

    const ercoAuthoredRoster = await assignedCaller.institution.submitShiftUtlRoster({
      institutionId: ids.institutionId,
      poleId: ids.poleId,
      departmentId: ids.departmentId,
      shiftDate: tomorrow,
      shiftType: "evening",
      utlUserId: ids.assignedProviderId,
      isShiftErtl: false,
      status: "active",
    });
    expect(ercoAuthoredRoster.success).toBe(true);

    const canonicalDepartmentOptions = await adminCaller.institution.getErtlDepartmentOptions({ institutionId: ids.institutionId, poleId: ids.poleId });
    expect(canonicalDepartmentOptions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: ids.departmentId, departmentName: "STAGING DEPARTMENT ALPHA" }),
    ]));
    const monthlyResult = await assignedCaller.institution.autopopulateMonthlyUtlRota({
      institutionId: ids.institutionId,
      poleId: ids.poleId,
      monthStart: "2026-08-01",
      assignments: [{ departmentId: ids.departmentId, providerUserId: ids.assignedProviderId }],
    });
    expect(monthlyResult.assignedDepartments).toBe(1);
    expect(monthlyResult.generatedShifts).toBeGreaterThan(0);
    const monthlyRows = await adminCaller.institution.getMonthlyUtlRota({ institutionId: ids.institutionId, poleId: ids.poleId, monthStart: "2026-08-01" });
    expect(monthlyRows).toEqual(expect.arrayContaining([
      expect.objectContaining({ departmentId: ids.departmentId, providerUserId: ids.assignedProviderId, assignmentStatus: "pending_acceptance" }),
    ]));
    const generatedRows = await db.select().from(shiftUtlRosters).where(and(
      eq(shiftUtlRosters.institutionId, ids.institutionId),
      eq(shiftUtlRosters.departmentId, ids.departmentId),
      eq(shiftUtlRosters.monthlyUtlRotationId, monthlyRows[0]?.id ?? -1),
    ));
    expect(generatedRows.length).toBeGreaterThan(0);
    const generatedTeam = await db.select().from(iersShiftTeams).where(and(
      eq(iersShiftTeams.institutionId, ids.institutionId),
      eq(iersShiftTeams.poleId, ids.poleId),
      eq(iersShiftTeams.shiftDate, generatedRows[0]!.shiftDate),
      eq(iersShiftTeams.shiftType, generatedRows[0]!.shiftType),
      eq(iersShiftTeams.status, "published"),
    )).limit(1);
    expect(generatedTeam[0]).toEqual(expect.objectContaining({ shiftDate: generatedRows[0]!.shiftDate, shiftType: generatedRows[0]!.shiftType }));

    const shiftTemplate = await adminCaller.institution.createInstitutionShiftTemplate({
      institutionId: ids.institutionId,
      templateName: "Staging overnight coverage",
      startTime: "21:30",
      endTime: "05:30",
      endDayOffset: 1,
    });
    expect(shiftTemplate.success).toBe(true);
    const templates = await adminCaller.institution.getInstitutionShiftTemplates({ institutionId: ids.institutionId });
    expect(templates).toEqual(expect.arrayContaining([
      expect.objectContaining({ templateName: "Staging overnight coverage", startTime: "21:30:00", endTime: "05:30:00", endDayOffset: 1 }),
    ]));
    const createdTemplate = templates.find((template) => template.templateName === "Staging overnight coverage");
    expect(createdTemplate).toBeTruthy();

    const bulkUtl = await assignedCaller.institution.bulkAssignShiftUtlProvider({
      institutionId: ids.institutionId,
      poleId: ids.poleId,
      utlUserId: ids.assignedProviderId,
      assignments: [{
        departmentId: ids.departmentId,
        shiftDate: nextWeek,
        shiftType: "night",
        shiftStartTime: "21:30",
        shiftEndTime: "05:30",
        shiftEndDayOffset: 1,
        shiftTemplateId: createdTemplate?.id ?? null,
      }],
    });
    expect(bulkUtl.savedCount).toBe(1);
    const exactShift = await db.select().from(shiftUtlRosters).where(and(
      eq(shiftUtlRosters.institutionId, ids.institutionId),
      eq(shiftUtlRosters.departmentId, ids.departmentId),
      eq(shiftUtlRosters.shiftDate, new Date(nextWeek)),
      eq(shiftUtlRosters.shiftType, "night"),
    )).limit(1);
    expect(exactShift[0]).toEqual(expect.objectContaining({
      shiftStartTime: "21:30:00",
      shiftEndTime: "05:30:00",
      shiftEndDayOffset: 1,
      shiftTemplateId: createdTemplate?.id,
      utlUserId: ids.assignedProviderId,
    }));
    const providerDuties = await assignedCaller.institution.getMyProviderDutyAssignments();
    expect(providerDuties.nextUtl ?? providerDuties.utl.find((assignment) => assignment.id === exactShift[0]?.id)).toBeTruthy();

    const autoErtl = await adminCaller.institution.setWeeklyErtlRotation({
      institutionId: ids.institutionId,
      poleId: ids.poleId,
      departmentId: ids.departmentId,
      weekNumber: 37,
      year: 2026,
      startDate: "2026-08-24",
      endDate: "2026-08-30",
      ertlUserId: undefined,
    });
    expect(autoErtl.ertlUserId).toBeNull();
    const autoErtlRotation = await db.select().from(ertlWeeklyRotations).where(and(
      eq(ertlWeeklyRotations.institutionId, ids.institutionId),
      eq(ertlWeeklyRotations.poleId, ids.poleId),
      eq(ertlWeeklyRotations.weekNumber, 37),
      eq(ertlWeeklyRotations.year, 2026),
    ));
    expect(autoErtlRotation[0]?.assignmentStatus).toBe("unassigned");

    // A configured rotation department without a nominated ERTL must use the
    // explicitly staffed UTL for the same department as the dated Scene Commander.
    await db.update(ertlWeeklyRotations).set({ assignmentStatus: "pending_acceptance" }).where(eq(ertlWeeklyRotations.id, autoErtlRotation[0]!.id));
    const projectedDirectTeams = await assignedCaller.iersShiftTeam.listMyShiftTeams({ horizonDays: 7 });
    const projectedDirectTeam = projectedDirectTeams.find((team) => team.teamId === ids.directTeamId);
    expect(projectedDirectTeam?.assignments).toEqual(expect.arrayContaining([
      expect.objectContaining({ roleScope: "utl", providerUserId: ids.assignedProviderId, shiftUtlRosterId: expect.any(Number) }),
      expect.objectContaining({ roleScope: "ertl", providerUserId: ids.assignedProviderId, shiftUtlRosterId: expect.any(Number), assignmentStatus: "pending_acceptance" }),
    ]));
    const projectedDirectErtl = projectedDirectTeam?.assignments.find((assignment) => assignment.roleScope === "ertl");
    expect(projectedDirectErtl?.shiftUtlRosterId).toBeTruthy();
    const repeatedProjection = await assignedCaller.iersShiftTeam.listMyShiftTeams({ horizonDays: 7 });
    expect(repeatedProjection.find((team) => team.teamId === ids.directTeamId)?.assignments.filter((assignment) => assignment.roleScope === "ertl")).toHaveLength(1);
    const directScopeRows = await db.select({ roleScope: iersShiftRoleAssignments.roleScope }).from(iersShiftRoleAssignments).where(and(
      eq(iersShiftRoleAssignments.teamId, ids.directTeamId),
      eq(iersShiftRoleAssignments.shiftUtlRosterId, projectedDirectErtl?.shiftUtlRosterId ?? -1),
    ));
    expect(directScopeRows.map((row) => row.roleScope).sort()).toEqual(["ertl", "utl"]);

    const utlAccepted = await assignedCaller.institution.respondToShiftUtlRoster({ rosterId: ids.rosterId, response: "accept" });
    expect(utlAccepted.assignmentStatus).toBe("active");
    const projectedLegacyAssignment = await db.select({ assignmentStatus: iersShiftRoleAssignments.assignmentStatus }).from(iersShiftRoleAssignments).where(eq(iersShiftRoleAssignments.id, ids.publishedUtlAssignmentId)).limit(1);
    expect(projectedLegacyAssignment[0]?.assignmentStatus).toBe("accepted");
    const visibleTeamsAfterLegacyAcceptance = await assignedCaller.iersShiftTeam.listMyShiftTeams({ horizonDays: 7 });
    expect(visibleTeamsAfterLegacyAcceptance).toEqual(expect.arrayContaining([
      expect.objectContaining({
        teamId: ids.publishedTeamId,
        assignments: expect.arrayContaining([expect.objectContaining({ id: ids.publishedUtlAssignmentId, assignmentStatus: "accepted", roleScope: "utl" })]),
      }),
    ]));
    // UTL acceptance must not require a standing IERS product role: it is a dated
    // operational responsibility available to eligible linked Staff/RN providers.
    await db.update(institutionProductRoles).set({ roleStatus: "ended", endedAt: new Date() }).where(and(
      eq(institutionProductRoles.institutionalAccountId, ids.institutionId),
      eq(institutionProductRoles.productId, ids.productId),
      eq(institutionProductRoles.userId, ids.assignedProviderId),
      eq(institutionProductRoles.roleKey, "iers_responder"),
    ));
    const directRoleAccepted = await assignedCaller.iersShiftTeam.respondToRole({ assignmentId: ids.directUtlAssignmentId, decision: "accepted" });
    expect(directRoleAccepted.assignmentStatus).toBe("accepted");
    await db.update(institutionProductRoles).set({ roleStatus: "active", endedAt: null }).where(and(
      eq(institutionProductRoles.institutionalAccountId, ids.institutionId),
      eq(institutionProductRoles.productId, ids.productId),
      eq(institutionProductRoles.userId, ids.assignedProviderId),
      eq(institutionProductRoles.roleKey, "iers_responder"),
    ));
    const directLegacyRoster = await db.select({ assignmentStatus: shiftUtlRosters.assignmentStatus }).from(shiftUtlRosters).where(eq(shiftUtlRosters.shiftDate, new Date(tomorrow))).limit(1);
    expect(directLegacyRoster[0]?.assignmentStatus).toBe("active");
    const readiness = await assignedCaller.iers.getMyShiftReadiness();
    expect(readiness.some((assignment) => assignment.id === ids.rosterId)).toBe(true);
    const universalChecklist = await assignedCaller.iersReadiness.getForMyUtl({ teamId: ids.publishedTeamId, shiftUtlRosterId: ids.rosterId });
    expect(universalChecklist.template).toEqual(expect.objectContaining({ status: "active", templateVersion: "v1" }));
    expect(universalChecklist.items.length).toBe(23);

    const signedOff = await assignedCaller.iers.signOffShiftReadiness({ shiftRosterId: ids.rosterId, note: "Staging readiness evidence" });
    expect(signedOff.success).toBe(true);

    await db.insert(iersShiftRoleAssignments).values({
      teamId: ids.publishedTeamId,
      institutionId: ids.institutionId,
      poleId: ids.poleId,
      departmentId: ids.departmentId,
      providerUserId: ids.assignedProviderId,
      shiftUtlRosterId: null,
      roleScope: "ertl",
      roleKey: "ertl",
      assignmentStatus: "pending_acceptance",
      proposedByUserId: ids.adminId,
      createdAt: now,
      updatedAt: now,
    });
    const [directErtlRow] = await db.select({ id: iersShiftRoleAssignments.id }).from(iersShiftRoleAssignments).where(and(
      eq(iersShiftRoleAssignments.teamId, ids.publishedTeamId),
      eq(iersShiftRoleAssignments.institutionId, ids.institutionId),
      eq(iersShiftRoleAssignments.providerUserId, ids.assignedProviderId),
      eq(iersShiftRoleAssignments.roleScope, "ertl"),
      eq(iersShiftRoleAssignments.roleKey, "ertl"),
      eq(iersShiftRoleAssignments.assignmentStatus, "pending_acceptance"),
    )).orderBy(desc(iersShiftRoleAssignments.id)).limit(1);
    const directErtlAssignmentId = directErtlRow?.id ?? Number.NaN;
    await db.update(institutionProductRoles).set({ roleStatus: "ended", endedAt: new Date() }).where(and(
      eq(institutionProductRoles.institutionalAccountId, ids.institutionId),
      eq(institutionProductRoles.productId, ids.productId),
      eq(institutionProductRoles.userId, ids.assignedProviderId),
      eq(institutionProductRoles.roleKey, "iers_responder"),
    ));
    const ertlAccepted = await assignedCaller.iersShiftTeam.respondToRole({ assignmentId: directErtlAssignmentId, decision: "accepted" });
    expect(ertlAccepted.assignmentStatus).toBe("accepted");
    await db.update(institutionProductRoles).set({ roleStatus: "active", endedAt: null }).where(and(
      eq(institutionProductRoles.institutionalAccountId, ids.institutionId),
      eq(institutionProductRoles.productId, ids.productId),
      eq(institutionProductRoles.userId, ids.assignedProviderId),
      eq(institutionProductRoles.roleKey, "iers_responder"),
    ));
    const memberCandidates = await assignedCaller.iersShiftTeam.listErtMemberCandidates({ teamId: ids.publishedTeamId });
    expect(memberCandidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ providerUserId: ids.replacementProviderId, departmentId: ids.departmentId }),
    ]));
    const nominatedMember = await assignedCaller.iersShiftTeam.nominateMemberRole({
      teamId: ids.publishedTeamId,
      providerUserId: ids.replacementProviderId,
      roleKey: "runner",
      reason: "Staging ERTL member nomination",
    });
    expect(nominatedMember.status).toBe("pending_acceptance");
    const nominatedMemberRow = await db.select({ providerUserId: iersShiftRoleAssignments.providerUserId, roleScope: iersShiftRoleAssignments.roleScope, roleKey: iersShiftRoleAssignments.roleKey, assignmentStatus: iersShiftRoleAssignments.assignmentStatus, acceptedAt: iersShiftRoleAssignments.acceptedAt }).from(iersShiftRoleAssignments).where(eq(iersShiftRoleAssignments.id, nominatedMember.assignmentId)).limit(1);
    expect(nominatedMemberRow[0]).toEqual(expect.objectContaining({ providerUserId: ids.replacementProviderId, roleScope: "ert_member", roleKey: "runner", assignmentStatus: "pending_acceptance", acceptedAt: null }));
    await db.insert(iersShiftRoleAssignments).values({
      teamId: ids.publishedTeamId,
      institutionId: ids.institutionId,
      poleId: ids.poleId,
      departmentId: ids.departmentId,
      providerUserId: ids.unrelatedProviderId,
      shiftUtlRosterId: null,
      roleScope: "ert_member",
      roleKey: "runner",
      assignmentStatus: "pending_acceptance",
      proposedByUserId: ids.adminId,
      createdAt: now,
      updatedAt: now,
    });
    const [memberAssignmentRow] = await db.select({ id: iersShiftRoleAssignments.id }).from(iersShiftRoleAssignments).where(and(
      eq(iersShiftRoleAssignments.teamId, ids.publishedTeamId),
      eq(iersShiftRoleAssignments.institutionId, ids.institutionId),
      eq(iersShiftRoleAssignments.providerUserId, ids.unrelatedProviderId),
      eq(iersShiftRoleAssignments.roleScope, "ert_member"),
      eq(iersShiftRoleAssignments.roleKey, "runner"),
      eq(iersShiftRoleAssignments.assignmentStatus, "pending_acceptance"),
    )).orderBy(desc(iersShiftRoleAssignments.id)).limit(1);
    const memberAssignmentId = memberAssignmentRow?.id ?? Number.NaN;
    const assignedRole = await assignedCaller.iersShiftTeam.assignMemberRole({
      teamId: ids.publishedTeamId,
      assignmentId: memberAssignmentId,
      roleKey: "airway_lead",
      reason: "Staging ERTL role allocation",
    });
    expect(assignedRole.status).toBe("pending_acceptance");
    const reassignedMember = await db.select({ roleKey: iersShiftRoleAssignments.roleKey, assignmentStatus: iersShiftRoleAssignments.assignmentStatus, acceptedAt: iersShiftRoleAssignments.acceptedAt, declinedAt: iersShiftRoleAssignments.declinedAt }).from(iersShiftRoleAssignments).where(eq(iersShiftRoleAssignments.id, memberAssignmentId)).limit(1);
    expect(reassignedMember[0]).toEqual(expect.objectContaining({ roleKey: "airway_lead", assignmentStatus: "pending_acceptance", acceptedAt: null, declinedAt: null }));
    await expectTrpcError(
      () => replacementCaller.iersShiftTeam.recommendRole({ assignmentId: memberAssignmentId, requestedRoleKey: "breathing_lead", reason: "Staging non-assignee denial" }),
      "NOT_FOUND",
    );
    const memberAccepted = await unrelatedCaller.iersShiftTeam.respondToRole({ assignmentId: memberAssignmentId, decision: "accepted" });
    expect(memberAccepted.assignmentStatus).toBe("accepted");
    const recommendation = await unrelatedCaller.iersShiftTeam.recommendRole({ assignmentId: memberAssignmentId, requestedRoleKey: "breathing_lead", reason: "Staging airway workload" });
    expect(recommendation.recommendationId).toBeGreaterThan(0);
    const recommendationDecision = await assignedCaller.iersShiftTeam.decideRoleRecommendation({ recommendationId: recommendation.recommendationId, decision: "approved", note: "Staging ERTL approval" });
    expect(recommendationDecision.status).toBe("approved");
    const recommendationReset = await db.select({ roleKey: iersShiftRoleAssignments.roleKey, assignmentStatus: iersShiftRoleAssignments.assignmentStatus, acceptedAt: iersShiftRoleAssignments.acceptedAt }).from(iersShiftRoleAssignments).where(eq(iersShiftRoleAssignments.id, memberAssignmentId)).limit(1);
    expect(recommendationReset[0]).toEqual(expect.objectContaining({ roleKey: "breathing_lead", assignmentStatus: "pending_acceptance", acceptedAt: null }));
    await expectTrpcError(
      () => unrelatedCaller.iersShiftTeam.assignMemberRole({ teamId: ids.publishedTeamId, assignmentId: memberAssignmentId, roleKey: "circulation_lead", reason: "Should be denied to a non-ERTL" }),
      "FORBIDDEN",
    );

    const replacementRoleAccepted = await replacementCaller.iersShiftTeam.respondToRole({ assignmentId: nominatedMember.assignmentId, decision: "accepted" });
    expect(replacementRoleAccepted.assignmentStatus).toBe("accepted");
    const decliningMember = await assignedCaller.iersShiftTeam.nominateMemberRole({
      teamId: ids.publishedTeamId,
      providerUserId: ids.registeredProviderId,
      roleKey: "medications_lead",
      reason: "Staging activation decline responder",
    });
    expect(decliningMember.status).toBe("pending_acceptance");

    const notificationStatus = await assignedCaller.iersNotifications.getStatus();
    expect(notificationStatus).toEqual(expect.objectContaining({ migrationReady: true, configured: false, active: false }));
    const notificationWithoutServerKeys = await assignedCaller.iersNotifications.subscribe({
      endpoint: "https://push.example.test/staging-subscription",
      keys: { p256dh: "staging-p256dh-key-123456", auth: "staging-auth-key" },
      userAgent: "IERS staging fixture",
    });
    expect(notificationWithoutServerKeys).toEqual({ success: false, reason: "not_configured" });

    await expectTrpcError(
      () => otherTenantCaller.iers.triggerActivation({
        institutionId: ids.institutionId,
        teamId: ids.publishedTeamId,
        activationType: "code_blue",
        location: "STAGING WARD",
        bedNumber: "B-405",
        department: "STAGING DEPARTMENT ALPHA",
        priority: "critical",
      }),
      "FORBIDDEN",
    );

    const activation = await assignedCaller.iers.triggerActivation({
      institutionId: ids.institutionId,
      teamId: ids.publishedTeamId,
      activationType: "code_blue",
      location: "STAGING WARD",
      bedNumber: "B-404",
      department: "STAGING DEPARTMENT ALPHA",
      priority: "critical",
      resourceNeeds: [
        { label: "Portable defibrillator", quantity: 1 },
        { label: "Pediatric airway kit", quantity: 1 },
      ],
      notes: "Disposable staging activation; simulation fixture.",
    });
    expect(activation).toEqual(expect.objectContaining({ success: true, notifiedCount: 4, escalationFailed: false }));
    const activationEventId = activation.activationEventId;
    const [activationEvent] = await db.select().from(iersActivationEvents).where(eq(iersActivationEvents.id, activationEventId)).limit(1);
    expect(activationEvent).toEqual(expect.objectContaining({
      institutionalAccountId: ids.institutionId,
      teamId: ids.publishedTeamId,
      status: "notifying",
      location: "STAGING WARD",
      bedNumber: "B-404",
      department: "STAGING DEPARTMENT ALPHA",
      caseQrNonce: null,
    }));
    expect(activationEvent?.notes).not.toContain("patient");

    const [activationSnapshotRows, activationResponderRows, activationResourceRows] = await Promise.all([
      db.select().from(iersActivationTeamSnapshots).where(eq(iersActivationTeamSnapshots.activationEventId, activationEventId)),
      db.select().from(iersActivationResponders).where(eq(iersActivationResponders.activationEventId, activationEventId)),
      db.select().from(iersActivationResources).where(eq(iersActivationResources.activationEventId, activationEventId)),
    ]);
    expect(activationSnapshotRows).toEqual(expect.arrayContaining([
      expect.objectContaining({ providerUserId: ids.assignedProviderId, roleScope: "utl", assignmentStatus: "accepted" }),
      expect.objectContaining({ providerUserId: ids.assignedProviderId, roleScope: "ertl", assignmentStatus: "accepted" }),
      expect.objectContaining({ providerUserId: ids.replacementProviderId, roleScope: "ert_member", assignmentStatus: "accepted" }),
      expect.objectContaining({ providerUserId: ids.registeredProviderId, roleScope: "ert_member", assignmentStatus: "pending_acceptance" }),
    ]));
    expect(new Set(activationResponderRows.map((row) => row.userId))).toEqual(new Set([
      ids.assignedProviderId,
      ids.replacementProviderId,
      ids.unrelatedProviderId,
      ids.registeredProviderId,
    ]));
    expect(activationResponderRows).toHaveLength(4);
    expect(activationResourceRows).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Portable defibrillator", status: "needed", quantity: 1 }),
      expect.objectContaining({ label: "Pediatric airway kit", status: "needed", quantity: 1 }),
    ]));
    expect(activationResourceRows.every((resource) => resource.status === "needed")).toBe(true);

    const assignedActivations = await assignedCaller.iers.getMyActivations();
    expect(assignedActivations).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: activationEventId, location: "STAGING WARD", bedNumber: "B-404", responderStatus: "sent", caseQrAvailable: false }),
    ]));
    const assignedCaseBeforeQr = await assignedCaller.iers.getMyActivationCase({ activationEventId });
    expect(assignedCaseBeforeQr).toEqual(expect.objectContaining({ caseLinked: true, caseQrAvailable: false, caseToken: null, location: "STAGING WARD", bedNumber: "B-404" }));
    expect(assignedCaseBeforeQr.resources).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Portable defibrillator", status: "needed", claimedByMe: false }),
    ]));
    expect(assignedCaseBeforeQr.teamMembers.filter((member) => member.providerUserId === ids.assignedProviderId)).toHaveLength(1);

    await registeredCaller.iers.receiveActivation({ activationEventId });
    const declineResult = await registeredCaller.iers.acknowledge({ activationEventId, accept: false, reason: "Staging provider unavailable for this response." });
    expect(declineResult).toEqual({ success: true, status: "declined" });
    const [declinedResponder] = await db.select().from(iersActivationResponders).where(and(eq(iersActivationResponders.activationEventId, activationEventId), eq(iersActivationResponders.userId, ids.registeredProviderId))).limit(1);
    expect(declinedResponder).toEqual(expect.objectContaining({ notificationStatus: "declined", declineReason: "Staging provider unavailable for this response." }));

    await assignedCaller.iers.receiveActivation({ activationEventId });
    expect((await assignedCaller.iers.acknowledge({ activationEventId, accept: true })).status).toBe("acknowledged");
    expect((await assignedCaller.iers.markResponse({ activationEventId, state: "responding" })).status).toBe("responding");
    const qr = await assignedCaller.iers.generateCaseQr({ activationEventId });
    expect(qr).toEqual(expect.objectContaining({ success: true, activationEventId, caseToken: expect.any(String) }));
    const [qrState] = await db.select({ caseQrNonce: iersActivationEvents.caseQrNonce, caseQrGeneratedByUserId: iersActivationEvents.caseQrGeneratedByUserId }).from(iersActivationEvents).where(eq(iersActivationEvents.id, activationEventId)).limit(1);
    expect(qrState?.caseQrNonce).toBeTruthy();
    expect(qrState?.caseQrGeneratedByUserId).toBe(ids.assignedProviderId);
    await expectTrpcError(() => replacementCaller.iers.generateCaseQr({ activationEventId }), "PRECONDITION_FAILED");

    await replacementCaller.iers.receiveActivation({ activationEventId });
    expect((await replacementCaller.iers.acknowledge({ activationEventId, accept: true })).status).toBe("acknowledged");
    const [replacementResource] = await db.select({ id: iersActivationResources.id }).from(iersActivationResources).where(and(eq(iersActivationResources.activationEventId, activationEventId), eq(iersActivationResources.label, "Portable defibrillator"))).limit(1);
    if (!replacementResource) throw new Error("The staging activation resource was not created.");
    await expectTrpcError(() => unrelatedCaller.iers.claimActivationResource({ resourceId: replacementResource.id }), "FORBIDDEN");
    expect((await replacementCaller.iers.claimActivationResource({ resourceId: replacementResource.id, note: "Staging responder bringing defibrillator" })).status).toBe("claimed");
    const [claimedResource] = await db.select({ status: iersActivationResources.status }).from(iersActivationResources).where(eq(iersActivationResources.id, replacementResource.id)).limit(1);
    expect(claimedResource?.status).toBe("claimed");
    const replacementCaseBeforeArrival = await replacementCaller.iers.getMyActivationCase({ activationEventId });
    expect(replacementCaseBeforeArrival.resources).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: replacementResource.id, status: "claimed", claimedByMe: true }),
    ]));
    expect((await replacementCaller.iers.markActivationResourceArrived({ resourceId: replacementResource.id, note: "Staging arrival confirmed" })).status).toBe("arrived");
    const [arrivedResource] = await db.select({ status: iersActivationResources.status, arrivedAt: iersActivationResources.arrivedAt }).from(iersActivationResources).where(eq(iersActivationResources.id, replacementResource.id)).limit(1);
    expect(arrivedResource?.status).toBe("arrived");
    expect(arrivedResource?.arrivedAt).toBeTruthy();

    const joined = await replacementCaller.iers.joinByCaseQr({ caseToken: qr.caseToken });
    expect(joined).toEqual(expect.objectContaining({ success: true, activationEventId, status: "at_scene", caseToken: qr.caseToken }));
    const repeatedJoin = await replacementCaller.iers.joinByCaseQr({ caseToken: qr.caseToken });
    expect(repeatedJoin).toEqual(expect.objectContaining({ success: true, activationEventId, status: "at_scene" }));
    const replacementArrivals = await db.select().from(iersActivationArrivals).where(and(eq(iersActivationArrivals.activationEventId, activationEventId), eq(iersActivationArrivals.providerUserId, ids.replacementProviderId), eq(iersActivationArrivals.arrivalType, "qr_scan")));
    expect(replacementArrivals).toHaveLength(1);
    await expectTrpcError(() => cpdOnlyCaller.iers.joinByCaseQr({ caseToken: qr.caseToken }), "FORBIDDEN");
    await expectTrpcError(() => otherTenantCaller.iers.joinByCaseQr({ caseToken: qr.caseToken }), "FORBIDDEN");

    const [unrelatedResponder] = await db.select({ notificationStatus: iersActivationResponders.notificationStatus }).from(iersActivationResponders).where(and(eq(iersActivationResponders.activationEventId, activationEventId), eq(iersActivationResponders.userId, ids.unrelatedProviderId))).limit(1);
    expect(unrelatedResponder?.notificationStatus).toBe("sent");
    await expectTrpcError(() => unrelatedCaller.iers.recordActivationArrival({ activationEventId, providerUserId: ids.assignedProviderId, arrivalType: "witnessed", note: "Not at scene" }), "FORBIDDEN");
    expect((await assignedCaller.iers.recordActivationArrival({ activationEventId, providerUserId: ids.unrelatedProviderId, arrivalType: "witnessed", note: "Staging ERTL witnessed responder arrival" })).status).toBe("at_scene");
    await expectTrpcError(() => assignedCaller.iers.recordActivationArrival({ activationEventId, providerUserId: ids.registeredProviderId, arrivalType: "witnessed", note: "Declined provider must not be recorded" }), "CONFLICT");
    const activationArrivals = await db.select().from(iersActivationArrivals).where(eq(iersActivationArrivals.activationEventId, activationEventId));
    expect(activationArrivals).toEqual(expect.arrayContaining([
      expect.objectContaining({ providerUserId: ids.replacementProviderId, arrivalType: "qr_scan" }),
      expect.objectContaining({ providerUserId: ids.unrelatedProviderId, arrivalType: "witnessed", recordedByUserId: ids.assignedProviderId }),
    ]));

    const activationCase = await assignedCaller.iers.getMyActivationCase({ activationEventId });
    expect(activationCase.status).toBe("at_scene");
    expect(activationCase.teamMembers.filter((member) => member.providerUserId === ids.assignedProviderId)).toHaveLength(1);
    const activationTimeline = await assignedCaller.iers.getTimeline({ institutionId: ids.institutionId, activationEventId });
    expect(activationTimeline.map((entry) => entry.eventType)).toEqual(expect.arrayContaining([
      "activation_triggered",
      "responder_notification_received",
      "responder_acknowledged",
      "responder_declined",
      "responder_responding",
      "case_qr_generated",
      "case_qr_scanned",
      "activation_resource_claimed",
      "activation_resource_arrived",
      "responder_arrival_witnessed",
    ]));
    expect(activationTimeline.every((entry) => entry.institutionalAccountId === ids.institutionId)).toBe(true);
        expect(activationTimeline.map((entry) => entry.note ?? "").join(" ")).not.toMatch(/patient|name|identifier/i);
    await expectTrpcError(
      () => unrelatedCaller.iers.advance({ institutionId: ids.institutionId, activationEventId, state: "cancelled", note: "Unauthorized call-off" }),
      "FORBIDDEN",
    );
    await expectTrpcError(
      () => assignedCaller.iers.advance({ institutionId: ids.institutionId, activationEventId, state: "cancelled" }),
      "BAD_REQUEST",
    );
    const calledOff = await assignedCaller.iers.advance({
      institutionId: ids.institutionId,
      activationEventId,
      state: "cancelled",
      note: "Staging response no longer required after team arrival.",
    });
    expect(calledOff).toEqual({ success: true, status: "cancelled" });
    const [cancelledEvent] = await db.select({ status: iersActivationEvents.status, cancellationReason: iersActivationEvents.cancellationReason }).from(iersActivationEvents).where(eq(iersActivationEvents.id, activationEventId)).limit(1);
    expect(cancelledEvent).toEqual(expect.objectContaining({ status: "cancelled", cancellationReason: "Staging response no longer required after team arrival." }));
    const cancelledCase = await assignedCaller.iers.getMyActivationCase({ activationEventId });
    expect(cancelledCase.status).toBe("cancelled");
    const cancelledTimeline = await assignedCaller.iers.getTimeline({ institutionId: ids.institutionId, activationEventId });
    expect(cancelledTimeline.map((entry) => entry.eventType)).toContain("activation_cancelled");
    const reassignedUtl = await assignedCaller.institution.submitShiftUtlRoster({
      institutionId: ids.institutionId,
      poleId: ids.poleId,
      departmentId: ids.departmentId,
      shiftDate: today,
      shiftType: "morning",
      shiftStartTime: "07:30",
      shiftEndTime: "17:30",
      shiftEndDayOffset: 0,
      utlUserId: ids.replacementProviderId,
      isShiftErtl: false,
      status: "active",
    });
    expect(reassignedUtl.success).toBe(true);
    expect(reassignedUtl.changed).toBe(true);
    const reassignedRow = await db.select().from(shiftUtlRosters).where(eq(shiftUtlRosters.id, ids.rosterId)).limit(1);
    expect(reassignedRow[0]).toEqual(expect.objectContaining({
      utlUserId: ids.replacementProviderId,
      assignmentStatus: "pending_acceptance",
      acceptedAt: null,
      readinessSignOffAt: null,
    }));
    const replacementAccepted = await replacementCaller.institution.respondToShiftUtlRoster({ rosterId: ids.rosterId, response: "accept" });
    expect(replacementAccepted.assignmentStatus).toBe("active");
    const reassignedRoleRows = await db.select({ providerUserId: iersShiftRoleAssignments.providerUserId, assignmentStatus: iersShiftRoleAssignments.assignmentStatus }).from(iersShiftRoleAssignments).where(eq(iersShiftRoleAssignments.teamId, ids.publishedTeamId));
    expect(reassignedRoleRows).toEqual(expect.arrayContaining([
      expect.objectContaining({ providerUserId: ids.assignedProviderId, assignmentStatus: "superseded" }),
      expect.objectContaining({ providerUserId: ids.replacementProviderId, assignmentStatus: "accepted" }),
    ]));

    const declined = await assignedCaller.institution.respondToShiftUtlRoster({ rosterId: ids.declineRosterId, response: "decline", declineReason: "Staging UTL decline" });
    expect(declined.assignmentStatus).toBe("declined");
    const declinedRole = await db.select({ assignmentStatus: iersShiftRoleAssignments.assignmentStatus }).from(iersShiftRoleAssignments).where(eq(iersShiftRoleAssignments.id, ids.declineAssignmentId)).limit(1);
    expect(declinedRole[0]?.assignmentStatus).toBe("declined");
    const declineNotifications = await db.select({ id: inAppNotifications.id }).from(inAppNotifications).where(and(
      eq(inAppNotifications.userId, ids.assignedProviderId),
      eq(inAppNotifications.relatedId, ids.declineRosterId),
      eq(inAppNotifications.title, "UTL duty declined — replacement required"),
    ));
    expect(declineNotifications).toHaveLength(1);

    await expectTrpcError(
      () => assignedCaller.institution.respondToWeeklyErtlRotation({ rotationId: ids.rotationId, response: "decline" }),
      "BAD_REQUEST",
    );
    const ertlDeclined = await assignedCaller.institution.respondToWeeklyErtlRotation({
      rotationId: ids.rotationId,
      response: "decline",
      declineReason: "Staging coverage test",
    });
    expect(ertlDeclined.assignmentStatus).toBe("declined");

    await db.update(ertlWeeklyRotations).set({
      ertlUserId: ids.replacementProviderId,
      assignmentStatus: "pending_acceptance",
      acceptedAt: null,
      declinedAt: null,
      declineReason: null,
    }).where(eq(ertlWeeklyRotations.id, ids.reassignmentRotationId));
    await expectTrpcError(
      () => assignedCaller.institution.respondToWeeklyErtlRotation({ rotationId: ids.reassignmentRotationId, response: "accept" }),
      "NOT_FOUND",
    );
    const reassignedAccepted = await replacementCaller.institution.respondToWeeklyErtlRotation({
      rotationId: ids.reassignmentRotationId,
      response: "accept",
    });
    expect(reassignedAccepted.assignmentStatus).toBe("active");

    await db.update(ertlWeeklyRotations).set({ assignmentStatus: "ended" }).where(eq(ertlWeeklyRotations.id, ids.endedRotationId));
    await expectTrpcError(
      () => assignedCaller.institution.respondToWeeklyErtlRotation({ rotationId: ids.endedRotationId, response: "accept" }),
      "BAD_REQUEST",
    );

    await db.update(institutionMemberships).set({ membershipStatus: "suspended" }).where(and(
      eq(institutionMemberships.institutionalAccountId, ids.institutionId),
      eq(institutionMemberships.userId, ids.assignedProviderId),
    ));
    const afterMembershipRevocation = await assignedCaller.institution.getMyProviderDutyAssignments();
    expect(afterMembershipRevocation.ertl).toHaveLength(0);
    expect(afterMembershipRevocation.utl).toHaveLength(0);
    await expectTrpcError(
      () => assignedCaller.institution.respondToDepartmentResponseCoordinatorAssignment({ assignmentId: ids.ercoAssignmentId, response: "accept" }),
      "FORBIDDEN",
    );

    await db.update(institutionMemberships).set({ membershipStatus: "active" }).where(and(
      eq(institutionMemberships.institutionalAccountId, ids.institutionId),
      eq(institutionMemberships.userId, ids.assignedProviderId),
    ));
    await db.update(institutionProductRoles).set({ roleStatus: "ended", endedAt: new Date() }).where(and(
      eq(institutionProductRoles.institutionalAccountId, ids.institutionId),
      eq(institutionProductRoles.productId, ids.productId),
      eq(institutionProductRoles.userId, ids.assignedProviderId),
      eq(institutionProductRoles.roleKey, "iers_responder"),
    ));
    const afterRoleRevocation = await assignedCaller.iers.getMyShiftReadiness();
    expect(afterRoleRevocation).toHaveLength(0);
    await expectTrpcError(
      () => assignedCaller.institution.signOffShiftReadiness({ shiftRosterId: ids.rosterId, note: "After role revocation" }),
      "BAD_REQUEST",
    );

    const [secondPoleInsert] = await db.insert(facilityPoles).values({ institutionId: ids.institutionId, poleName: "STAGING ZONE BETA", description: "Ephemeral multi-pole ordering fixture", createdAt: new Date() });
    const secondPoleId = Number((secondPoleInsert as unknown as { insertId: number }).insertId);
    const reordered = await adminCaller.institution.reorderFacilityPoles({ institutionId: ids.institutionId, poleIds: [secondPoleId, ids.poleId] });
    expect(reordered.poleCount).toBe(2);
    const orderedPoles = await adminCaller.institution.getFacilityPoles({ institutionId: ids.institutionId });
    expect(orderedPoles.map((pole) => pole.id)).toEqual([secondPoleId, ids.poleId]);

    const [assignedMembership] = await db.select({ id: institutionMemberships.id }).from(institutionMemberships).where(and(
      eq(institutionMemberships.institutionalAccountId, ids.institutionId),
      eq(institutionMemberships.userId, ids.assignedProviderId),
    )).limit(1);
    if (!assignedMembership) throw new Error("The staging assigned-provider membership was not created.");
    const removed = await adminCaller.institution.removeInstitutionMember({
      institutionId: ids.institutionId,
      membershipId: assignedMembership.id,
      reason: "Staging member departure and future duty revocation",
    });
    expect(removed.success).toBe(true);
    const [endedMembership] = await db.select({ membershipStatus: institutionMemberships.membershipStatus }).from(institutionMemberships).where(eq(institutionMemberships.id, assignedMembership.id)).limit(1);
    expect(endedMembership?.membershipStatus).toBe("ended");
    const [removedStaff] = await db.select({ removedAt: institutionalStaffMembers.removedAt, removalReason: institutionalStaffMembers.removalReason }).from(institutionalStaffMembers).where(eq(institutionalStaffMembers.id, ids.staffMemberId)).limit(1);
    expect(removedStaff?.removedAt).toBeTruthy();
    expect(removedStaff?.removalReason).toContain("member departure");
    const [removalEvent] = await db.select({ eventType: institutionMembershipEvents.eventType }).from(institutionMembershipEvents).where(and(
      eq(institutionMembershipEvents.institutionalAccountId, ids.institutionId),
      eq(institutionMembershipEvents.membershipId, assignedMembership.id),
    )).limit(1);
    expect(removalEvent?.eventType).toBe("removed");
    const afterRemovalAssignments = await assignedCaller.institution.getMyProviderDutyAssignments();
    expect(afterRemovalAssignments.ertl).toHaveLength(0);
    expect(afterRemovalAssignments.utl).toHaveLength(0);

    const templateRows = await db.select({ id: institutionShiftTemplates.id }).from(institutionShiftTemplates).where(eq(institutionShiftTemplates.institutionId, ids.institutionId));
    expect(templateRows.length).toBeGreaterThan(0);
  });
});
