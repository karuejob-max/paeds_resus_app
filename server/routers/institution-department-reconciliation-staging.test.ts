import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { appRouter } from "../routers";
import { getDb } from "../db";
import type { TrpcContext } from "../_core/context";
import {
  cpdAttendees,
  cpdEvents,
  facilityDepartments,
  institutionDepartmentAuditEvents,
  institutionDepartmentReconciliations,
  institutionalAccounts,
  institutionalAccountAdmins,
  institutionalProductCapabilities,
  institutionProductEntitlements,
  institutionProductRoles,
  institutionProductSubscriptions,
  institutionalProducts,
  users,
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
const now = new Date();

type FixtureIds = {
  alphaInstitutionId: number;
  bravoInstitutionId: number;
  adminId: number;
  leadId: number;
  ordinaryUserId: number;
  productId: number;
  subscriptionId: number;
  targetDepartmentId: number;
  pharmacyDepartmentId: number;
  operationalDepartmentId: number;
  attendeeId: number;
  pharmacyAttendeeId: number;
};

function createContext(user: { id: number; email: string; name: string }): TrpcContext {
  return {
    user: {
      id: user.id,
      openId: `department-reconciliation-staging-${user.id}`,
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

function insertedId(result: unknown): number {
  return Number((result as { insertId: number }).insertId);
}

describeStaging("real tRPC department reconciliation and pole eligibility matrix", () => {
  let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
  let ids: FixtureIds;
  let adminCaller: ReturnType<typeof appRouter.createCaller>;
  let leadCaller: ReturnType<typeof appRouter.createCaller>;
  let ordinaryCaller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    db = (await getDb())!;
    if (!db) throw new Error("The staging database connection could not be created.");
    const suffix = Date.now();
    const adminEmail = `department-admin-${suffix}@example.test`;
    const leadEmail = `department-lead-${suffix}@example.test`;
    const ordinaryEmail = `department-ordinary-${suffix}@example.test`;

    const [adminInsert] = await db.insert(users).values({
      openId: `department-reconciliation-admin-${suffix}`,
      name: "Department Reconciliation Admin",
      email: adminEmail,
      loginMethod: "staging",
      role: "user",
      userType: "institutional",
      createdAt: now,
      updatedAt: now,
    });
    const adminId = insertedId(adminInsert);
    const [leadInsert] = await db.insert(users).values({
      openId: `department-reconciliation-lead-${suffix}`,
      name: "IERS Lead",
      email: leadEmail,
      loginMethod: "staging",
      role: "user",
      userType: "individual",
      providerType: "nurse",
      createdAt: now,
      updatedAt: now,
    });
    const leadId = insertedId(leadInsert);
    const [ordinaryInsert] = await db.insert(users).values({
      openId: `department-reconciliation-ordinary-${suffix}`,
      name: "Unrelated Provider",
      email: ordinaryEmail,
      loginMethod: "staging",
      role: "user",
      userType: "individual",
      providerType: "nurse",
      createdAt: now,
      updatedAt: now,
    });
    const ordinaryUserId = insertedId(ordinaryInsert);

    const [alphaInsert] = await db.insert(institutionalAccounts).values({
      userId: adminId,
      companyName: `STAGING DEPARTMENT ALPHA ${suffix}`,
      contactName: "Department Reconciliation Admin",
      contactEmail: adminEmail,
      contactPhone: "+254700000101",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    const alphaInstitutionId = insertedId(alphaInsert);
    const [bravoInsert] = await db.insert(institutionalAccounts).values({
      userId: ordinaryUserId,
      companyName: `STAGING DEPARTMENT BRAVO ${suffix}`,
      contactName: "Unrelated Provider",
      contactEmail: ordinaryEmail,
      contactPhone: "+254700000102",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    const bravoInstitutionId = insertedId(bravoInsert);
    await db.insert(institutionalAccountAdmins).values({ institutionalAccountId: alphaInstitutionId, userId: adminId, addedByUserId: null, createdAt: now });

    let [product] = await db.select({ id: institutionalProducts.id }).from(institutionalProducts).where(eq(institutionalProducts.productKey, "iers")).limit(1);
    if (!product) {
      const [productInsert] = await db.insert(institutionalProducts).values({
        productKey: "iers",
        displayName: "Institutional Emergency Readiness System",
        description: "Disposable staging product fixture.",
        productKind: "core",
        lifecycleStatus: "active",
        ownerTeam: "Paeds Resus",
        routeKey: "/institution/iers",
        createdAt: now,
        updatedAt: now,
      });
      product = { id: insertedId(productInsert) };
    }
    const productId = product.id;
    let [capability] = await db.select({ id: institutionalProductCapabilities.id }).from(institutionalProductCapabilities).where(and(
      eq(institutionalProductCapabilities.productId, productId),
      eq(institutionalProductCapabilities.capabilityKey, "iers.workspace.read"),
      eq(institutionalProductCapabilities.status, "active"),
    )).limit(1);
    if (!capability) {
      const [capabilityInsert] = await db.insert(institutionalProductCapabilities).values({
        productId,
        capabilityKey: "iers.workspace.read",
        capabilityClass: "read",
        renewalPolicy: "operational_continuity",
        description: "Disposable staging workspace-read capability.",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      capability = { id: insertedId(capabilityInsert) };
    }
    const [subscriptionInsert] = await db.insert(institutionProductSubscriptions).values({
      institutionalAccountId: alphaInstitutionId,
      productId,
      subscriptionStatus: "active",
      source: "pilot",
      startsAt: now,
      renewsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    });
    const subscriptionId = insertedId(subscriptionInsert);
    await db.insert(institutionProductEntitlements).values({
      institutionalAccountId: alphaInstitutionId,
      productId,
      subscriptionId,
      capabilityKey: "iers.workspace.read",
      entitlementStatus: "active",
      startsAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(institutionProductRoles).values({
      institutionalAccountId: alphaInstitutionId,
      productId,
      userId: leadId,
      invitedEmail: leadEmail,
      roleKey: "iers_coordinator",
      roleStatus: "active",
      grantedByUserId: adminId,
      grantedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const [targetInsert] = await db.insert(facilityDepartments).values({
      institutionId: alphaInstitutionId,
      departmentName: "Out Patient Department: Accident and Emergency / Casualty",
      poleId: null,
      isActive: true,
      requiresPole: false,
      confirmedAt: now,
      confirmedByUserId: adminId,
      createdAt: now,
    });
    const targetDepartmentId = insertedId(targetInsert);
    const [pharmacyInsert] = await db.insert(facilityDepartments).values({
      institutionId: alphaInstitutionId,
      departmentName: "Pharmacy",
      poleId: null,
      isActive: true,
      requiresPole: false,
      confirmedAt: now,
      confirmedByUserId: adminId,
      createdAt: now,
    });
    const pharmacyDepartmentId = insertedId(pharmacyInsert);
    const [operationalInsert] = await db.insert(facilityDepartments).values({
      institutionId: alphaInstitutionId,
      departmentName: "Critical Care: PICU",
      poleId: null,
      isActive: true,
      requiresPole: true,
      confirmedAt: now,
      confirmedByUserId: adminId,
      createdAt: now,
    });
    const operationalDepartmentId = insertedId(operationalInsert);

    const [eventInsert] = await db.insert(cpdEvents).values({
      institutionalAccountId: alphaInstitutionId,
      name: "Staging CPD reconciliation event",
      eventDate: "2026-08-23",
      isOpen: false,
      createdAt: now,
    });
    const cpdEventId = insertedId(eventInsert);
    const [attendeeInsert] = await db.insert(cpdAttendees).values({
      cpdEventId,
      institutionalAccountId: alphaInstitutionId,
      fullName: "Staging CPD Attendee",
      email: "paedsresus254@gmail.com",
      phone: "+254700000103",
      cadre: "nurse",
      department: "A&E",
      submittedAt: now,
    });
    const attendeeId = insertedId(attendeeInsert);
    const [pharmacyAttendeeInsert] = await db.insert(cpdAttendees).values({
      cpdEventId,
      institutionalAccountId: alphaInstitutionId,
      fullName: "Staging Pharmacy Attendee",
      email: "pharmacy-staging@example.test",
      phone: "+254700000104",
      cadre: "pharmacist",
      department: "Pharmacy",
      submittedAt: now,
    });
    const pharmacyAttendeeId = insertedId(pharmacyAttendeeInsert);

    ids = { alphaInstitutionId, bravoInstitutionId, adminId, leadId, ordinaryUserId, productId, subscriptionId, targetDepartmentId, pharmacyDepartmentId, operationalDepartmentId, attendeeId, pharmacyAttendeeId };
    adminCaller = appRouter.createCaller(createContext({ id: adminId, email: adminEmail, name: "Department Reconciliation Admin" }));
    leadCaller = appRouter.createCaller(createContext({ id: leadId, email: leadEmail, name: "IERS Lead" }));
    ordinaryCaller = appRouter.createCaller(createContext({ id: ordinaryUserId, email: ordinaryEmail, name: "Unrelated Provider" }));
  });

  afterAll(async () => {
    if (!db || !ids) return;
    await db.delete(institutionDepartmentAuditEvents).where(inArray(institutionDepartmentAuditEvents.institutionalAccountId, [ids.alphaInstitutionId, ids.bravoInstitutionId]));
    await db.delete(institutionDepartmentReconciliations).where(inArray(institutionDepartmentReconciliations.institutionalAccountId, [ids.alphaInstitutionId, ids.bravoInstitutionId]));
    await db.delete(cpdAttendees).where(inArray(cpdAttendees.institutionalAccountId, [ids.alphaInstitutionId, ids.bravoInstitutionId]));
    await db.delete(cpdEvents).where(inArray(cpdEvents.institutionalAccountId, [ids.alphaInstitutionId, ids.bravoInstitutionId]));
    await db.delete(facilityDepartments).where(inArray(facilityDepartments.institutionId, [ids.alphaInstitutionId, ids.bravoInstitutionId]));
    await db.delete(institutionProductEntitlements).where(and(eq(institutionProductEntitlements.institutionalAccountId, ids.alphaInstitutionId), eq(institutionProductEntitlements.productId, ids.productId)));
    await db.delete(institutionProductSubscriptions).where(and(eq(institutionProductSubscriptions.institutionalAccountId, ids.alphaInstitutionId), eq(institutionProductSubscriptions.productId, ids.productId)));
    await db.delete(institutionProductRoles).where(inArray(institutionProductRoles.institutionalAccountId, [ids.alphaInstitutionId, ids.bravoInstitutionId]));
    await db.delete(institutionalAccountAdmins).where(inArray(institutionalAccountAdmins.institutionalAccountId, [ids.alphaInstitutionId, ids.bravoInstitutionId]));
    await db.delete(institutionalAccounts).where(inArray(institutionalAccounts.id, [ids.alphaInstitutionId, ids.bravoInstitutionId]));
    await db.delete(users).where(inArray(users.id, [ids.adminId, ids.leadId, ids.ordinaryUserId]));
  });

  it("enforces tenant and role boundaries, preserves raw CPD text, and alerts only for explicit pole eligibility", async () => {
    const dashboard = await adminCaller.institutionDepartmentReconciliation.getDepartmentReconciliationDashboard({ institutionId: ids.alphaInstitutionId });
    expect(dashboard.labels).toEqual(expect.arrayContaining([
      expect.objectContaining({ rawLabel: "A&E", currentlyUnmappedCount: 1 }),
      expect.objectContaining({ rawLabel: "Pharmacy", currentlyUnmappedCount: 1 }),
    ]));
    expect(dashboard.missingPoleDepartments).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: ids.operationalDepartmentId, departmentName: "Critical Care: PICU" }),
    ]));
    expect(dashboard.missingPoleDepartments).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: ids.pharmacyDepartmentId }),
    ]));

    await expectTrpcError(
      () => adminCaller.institutionDepartmentReconciliation.getDepartmentReconciliationDashboard({ institutionId: ids.bravoInstitutionId }),
      "FORBIDDEN",
    );
    await expectTrpcError(
      () => ordinaryCaller.institutionDepartmentReconciliation.mapDepartmentLabel({ institutionId: ids.alphaInstitutionId, normalizedLabel: "a&e", targetFacilityDepartmentId: ids.targetDepartmentId, backfillUnlinkedAttendance: true, reason: "Unauthorized staging attempt" }),
      "FORBIDDEN",
    );
    await expectTrpcError(
      () => leadCaller.institutionDepartmentReconciliation.mapDepartmentLabel({ institutionId: ids.alphaInstitutionId, normalizedLabel: "a&e", targetFacilityDepartmentId: ids.targetDepartmentId, backfillUnlinkedAttendance: true, reason: "IERS Lead must not edit CPD reconciliation" }),
      "FORBIDDEN",
    );
    const adminAlerts = await adminCaller.institutionDepartmentReconciliation.getIersMissingPoleAlerts({ institutionId: ids.alphaInstitutionId });
    expect(adminAlerts).toEqual(expect.arrayContaining([expect.objectContaining({ id: ids.operationalDepartmentId })]));

    const leadAlerts = await leadCaller.institutionDepartmentReconciliation.getIersMissingPoleAlerts({ institutionId: ids.alphaInstitutionId });
    expect(leadAlerts).toEqual(expect.arrayContaining([expect.objectContaining({ id: ids.operationalDepartmentId })]));
    expect(leadAlerts).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: ids.pharmacyDepartmentId })]));

    const mapped = await adminCaller.institutionDepartmentReconciliation.mapDepartmentLabel({
      institutionId: ids.alphaInstitutionId,
      normalizedLabel: "a&e",
      targetFacilityDepartmentId: ids.targetDepartmentId,
      backfillUnlinkedAttendance: true,
      reason: "Reviewed against the shared CPD/profile catalog.",
    });
    expect(mapped.backfilledCount).toBe(1);

    const [attendance] = await db.select({ department: cpdAttendees.department, facilityDepartmentId: cpdAttendees.facilityDepartmentId }).from(cpdAttendees).where(eq(cpdAttendees.id, ids.attendeeId));
    expect(attendance).toEqual({ department: "A&E", facilityDepartmentId: ids.targetDepartmentId });
    const auditRows = await adminCaller.institutionDepartmentReconciliation.listDepartmentAuditEvents({ institutionId: ids.alphaInstitutionId, reconciliationId: mapped.reconciliationId ?? undefined });
    expect(auditRows).toEqual(expect.arrayContaining([expect.objectContaining({ eventType: "mapped_and_backfilled", backfilledCount: 1 })]));

    await adminCaller.institutionDepartmentReconciliation.setDepartmentPoleEligibility({ institutionId: ids.alphaInstitutionId, departmentId: ids.pharmacyDepartmentId, requiresPole: true, reason: "Staging eligibility transition" });
    const alertsAfterPharmacyEnabled = await leadCaller.institutionDepartmentReconciliation.getIersMissingPoleAlerts({ institutionId: ids.alphaInstitutionId });
    expect(alertsAfterPharmacyEnabled).toEqual(expect.arrayContaining([expect.objectContaining({ id: ids.pharmacyDepartmentId })]));
    await adminCaller.institutionDepartmentReconciliation.setDepartmentPoleEligibility({ institutionId: ids.alphaInstitutionId, departmentId: ids.pharmacyDepartmentId, requiresPole: false, reason: "Pharmacy is CPD/reporting only" });
    const alertsAfterPharmacyExcluded = await leadCaller.institutionDepartmentReconciliation.getIersMissingPoleAlerts({ institutionId: ids.alphaInstitutionId });
    expect(alertsAfterPharmacyExcluded).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: ids.pharmacyDepartmentId })]));
  });
});
