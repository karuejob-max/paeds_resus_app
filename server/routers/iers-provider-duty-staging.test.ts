import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
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
  let unrelatedCaller: ReturnType<typeof appRouter.createCaller>;
  let replacementCaller: ReturnType<typeof appRouter.createCaller>;
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
    await db.insert(institutionProductEntitlements).values({
      institutionalAccountId: institutionId,
      productId,
      subscriptionId,
      capabilityKey: "iers.team_readiness.operate",
      entitlementStatus: "active",
      startsAt: now,
      createdAt: now,
      updatedAt: now,
    });

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
      { institutionalAccountId: otherInstitutionId, productId, userId: otherTenantProviderId, invitedEmail: `staging-other-tenant-${suffix}@example.test`, roleKey: "iers_responder", roleStatus: "active", grantedByUserId: adminId, grantedAt: now, createdAt: now, updatedAt: now },
    ]);

    const [poleInsert] = await db.insert(facilityPoles).values({ institutionId, poleName: "STAGING ZONE ALPHA", description: "Ephemeral authorization fixture", createdAt: now });
    const poleId = Number((poleInsert as unknown as { insertId: number }).insertId);
    const [otherPoleInsert] = await db.insert(facilityPoles).values({ institutionId: otherInstitutionId, poleName: "STAGING ZONE BRAVO", description: "Ephemeral authorization fixture", createdAt: now });
    const otherPoleId = Number((otherPoleInsert as unknown as { insertId: number }).insertId);

    const [departmentInsert] = await db.insert(facilityDepartments).values({ institutionId, poleId, departmentName: "STAGING DEPARTMENT ALPHA", isActive: true, requiresPole: true, confirmedAt: now, confirmedByUserId: adminId, createdAt: now });
    const departmentId = Number((departmentInsert as unknown as { insertId: number }).insertId);
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
      utlUserId: assignedProviderId,
      isShiftErtl: false,
      assignmentStatus: "pending_acceptance",
      status: "active",
      createdAt: now,
    });
    const rosterId = Number((rosterInsert as unknown as { insertId: number }).insertId);

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
    };

    adminCaller = appRouter.createCaller(createContext({ id: adminId, name: "Staging IERS Administrator", email: `staging-admin-${suffix}@example.test` }));
    assignedCaller = appRouter.createCaller(createContext({ id: assignedProviderId, name: "Staging Assigned Provider", email: assignedEmail }));
    unrelatedCaller = appRouter.createCaller(createContext({ id: unrelatedProviderId, name: "Staging Unrelated Provider", email: `staging-unrelated-${suffix}@example.test` }));
    replacementCaller = appRouter.createCaller(createContext({ id: replacementProviderId, name: "Staging Replacement Provider", email: `staging-replacement-${suffix}@example.test` }));
    otherTenantCaller = appRouter.createCaller(createContext({ id: otherTenantProviderId, name: "Staging Other Tenant Provider", email: `staging-other-tenant-${suffix}@example.test` }));
  });

  afterAll(async () => {
    if (!isLocalStaging || !db || !ids) return;
    const institutionIds = [ids.institutionId, ids.otherInstitutionId];
    const userIds = [ids.adminId, ids.assignedProviderId, ids.unrelatedProviderId, ids.replacementProviderId, ids.otherTenantProviderId];
    await db.delete(iersEvidenceRecords).where(inArray(iersEvidenceRecords.institutionId, institutionIds));
    await db.delete(shiftUtlRosters).where(inArray(shiftUtlRosters.institutionId, institutionIds));
    await db.delete(monthlyUtlRotations).where(inArray(monthlyUtlRotations.institutionId, institutionIds));
    await db.delete(ertlWeeklyRotations).where(inArray(ertlWeeklyRotations.institutionId, institutionIds));
    await db.delete(institutionDepartmentResponseCoordinatorEvents).where(inArray(institutionDepartmentResponseCoordinatorEvents.institutionId, institutionIds));
    await db.delete(institutionDepartmentResponseCoordinators).where(inArray(institutionDepartmentResponseCoordinators.institutionId, institutionIds));
    await db.delete(institutionMembershipEvents).where(inArray(institutionMembershipEvents.institutionalAccountId, institutionIds));
    await db.delete(institutionalStaffMembers).where(inArray(institutionalStaffMembers.institutionalAccountId, institutionIds));
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
    expect(monthlyResult.generatedShifts).toBe(0);
    const monthlyRows = await adminCaller.institution.getMonthlyUtlRota({ institutionId: ids.institutionId, poleId: ids.poleId, monthStart: "2026-08-01" });
    expect(monthlyRows).toEqual(expect.arrayContaining([
      expect.objectContaining({ departmentId: ids.departmentId, providerUserId: ids.assignedProviderId, assignmentStatus: "pending_acceptance" }),
    ]));
    const generatedRows = await db.select().from(shiftUtlRosters).where(and(
      eq(shiftUtlRosters.institutionId, ids.institutionId),
      eq(shiftUtlRosters.departmentId, ids.departmentId),
      eq(shiftUtlRosters.monthlyUtlRotationId, monthlyRows[0]?.id ?? -1),
    ));
    expect(generatedRows.length).toBe(0);

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

    const utlAccepted = await assignedCaller.institution.respondToShiftUtlRoster({ rosterId: ids.rosterId, response: "accept" });
    expect(utlAccepted.assignmentStatus).toBe("active");
    const readiness = await assignedCaller.iers.getMyShiftReadiness();
    expect(readiness.some((assignment) => assignment.id === ids.rosterId)).toBe(true);
    const signedOff = await assignedCaller.iers.signOffShiftReadiness({ shiftRosterId: ids.rosterId, note: "Staging readiness evidence" });
    expect(signedOff.success).toBe(true);

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
