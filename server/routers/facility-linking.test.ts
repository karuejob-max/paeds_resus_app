import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { appRouter } from "../routers";
import { getDb } from "../db";
import type { TrpcContext } from "../_core/context";
import {
  careFacilities,
  facilityMembershipRequests,
  inAppNotifications,
  institutionalAccounts,
  institutionalAccountAdmins,
  institutionalStaffMembers,
  institutionMemberships,
  institutionProductRoles,
  users,
} from "../../drizzle/schema";

const stagingUrl =
  process.env.FACILITY_LINK_STAGING_DATABASE_URL ||
  process.env.IERS_STAGING_DATABASE_URL ||
  "";
const isLocalStaging =
  process.env.FACILITY_LINK_STAGING_ENABLE === "1" &&
  (() => {
    try {
      const url = new URL(stagingUrl);
      return (
        ["127.0.0.1", "localhost", "::1"].includes(url.hostname) &&
        /staging/i.test(url.pathname)
      );
    } catch {
      return false;
    }
  })();
const describeStaging = isLocalStaging ? describe : describe.skip;

const now = new Date();

type SeedIds = {
  adminId: number;
  providerIds: number[];
  institutionId: number;
  facilityId: number;
};

function createContext(user: {
  id: number;
  email: string;
  name: string;
  role?: "user" | "admin";
}): TrpcContext {
  return {
    user: {
      id: user.id,
      openId: `facility-link-staging-${user.id}`,
      name: user.name,
      email: user.email,
      phone: null,
      loginMethod: "staging",
      passwordHash: null,
      role: user.role ?? "user",
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

describeStaging(
  "real tRPC facility-linking workflow on an ephemeral staging tenant",
  () => {
    let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
    let ids: SeedIds;
    let providerCaller: ReturnType<typeof appRouter.createCaller>;
    let rejectingProviderCaller: ReturnType<typeof appRouter.createCaller>;
    let withdrawingProviderCaller: ReturnType<typeof appRouter.createCaller>;
    let adminCaller: ReturnType<typeof appRouter.createCaller>;
    let unrelatedCaller: ReturnType<typeof appRouter.createCaller>;

    beforeAll(async () => {
      db = (await getDb())!;
      if (!db)
        throw new Error(
          "The facility-link staging database connection could not be created."
        );
      const suffix = Date.now();
      const adminEmail = `facility-link-admin-${suffix}@example.test`;
      const providerEmails = [1, 2, 3].map(
        index => `facility-link-provider-${index}-${suffix}@example.test`
      );
      const unrelatedEmail = `facility-link-unrelated-${suffix}@example.test`;
      const openIds = [
        `facility-link-admin-${suffix}`,
        ...providerEmails.map((_, index) => `facility-link-provider-${index + 1}-${suffix}`),
        `facility-link-unrelated-${suffix}`,
      ];

      await db.insert(users).values([
        {
          openId: openIds[0],
          name: "Facility Link Admin",
          email: adminEmail,
          role: "user",
          userType: "individual",
          providerType: "nurse",
          loginMethod: "staging",
          lastSignedIn: now,
        },
        ...providerEmails.map((email, index) => ({
          openId: openIds[index + 1],
          name: `Facility Link Provider ${index + 1}`,
          email,
          role: "user" as const,
          userType: "individual" as const,
          providerType: "nurse" as const,
          loginMethod: "staging",
          lastSignedIn: now,
        })),
        {
          openId: openIds[4],
          name: "Unrelated Provider",
          email: unrelatedEmail,
          role: "user",
          userType: "individual",
          providerType: "nurse",
          loginMethod: "staging",
          lastSignedIn: now,
        },
      ]);
      const seededUsers = await db
        .select({ id: users.id, openId: users.openId })
        .from(users)
        .where(inArray(users.openId, openIds));
      const idByOpenId = new Map(seededUsers.map((user) => [user.openId, user.id]));
      const adminId = idByOpenId.get(openIds[0]);
      const providerIds = openIds.slice(1, 4).map((openId) => idByOpenId.get(openId));
      const unrelatedId = idByOpenId.get(openIds[4]);
      if (!adminId || providerIds.some((id): id is undefined => id == null) || !unrelatedId) {
        throw new Error("Could not resolve seeded facility-link test users.");
      }
      const resolvedProviderIds = providerIds as number[];

      const institutionName = `Facility Link Staging Institution ${suffix}`;
      await db.insert(institutionalAccounts).values({
        userId: adminId,
        companyName: institutionName,
        industry: "hospital",
        staffCount: 10,
        contactName: "Facility Link Admin",
        contactEmail: adminEmail,
        status: "active",
      });
      const [institution] = await db
        .select({ id: institutionalAccounts.id })
        .from(institutionalAccounts)
        .where(eq(institutionalAccounts.companyName, institutionName))
        .limit(1);
      const institutionId = institution?.id;
      if (!institutionId) throw new Error("Could not resolve facility-link test institution.");
      await db.insert(institutionalAccountAdmins).values({
        institutionalAccountId: institutionId,
        userId: adminId,
        addedByUserId: null,
      });

      const facilityName = `Facility Link Staging Hospital ${suffix}`;
      await db.insert(careFacilities).values({
        name: facilityName,
        county: "Nairobi",
        country: "Kenya",
        institutionalAccountId: institutionId,
        isSystem: false,
      });
      const [facility] = await db
        .select({ id: careFacilities.id })
        .from(careFacilities)
        .where(and(eq(careFacilities.name, facilityName), eq(careFacilities.institutionalAccountId, institutionId)))
        .limit(1);
      const facilityId = facility?.id;
      if (!facilityId) throw new Error("Could not resolve facility-link test facility.");

      ids = { adminId, providerIds, institutionId, facilityId };
      providerCaller = appRouter.createCaller(
        createContext({
          id: providerIds[0],
          email: providerEmails[0],
          name: "Facility Link Provider 1",
        })
      );
      rejectingProviderCaller = appRouter.createCaller(
        createContext({
          id: providerIds[1],
          email: providerEmails[1],
          name: "Facility Link Provider 2",
        })
      );
      withdrawingProviderCaller = appRouter.createCaller(
        createContext({
          id: providerIds[2],
          email: providerEmails[2],
          name: "Facility Link Provider 3",
        })
      );
      adminCaller = appRouter.createCaller(
        createContext({
          id: adminId,
          email: adminEmail,
          name: "Facility Link Admin",
        })
      );
      unrelatedCaller = appRouter.createCaller(
        createContext({
          id: unrelatedId,
          email: unrelatedEmail,
          name: "Unrelated Provider",
        })
      );
    });

    afterAll(async () => {
      if (!db || !ids) return;
      await db
        .delete(inAppNotifications)
        .where(
          inArray(inAppNotifications.userId, [
            ids.adminId,
            ...ids.providerIds,
            ids.adminId + 4,
          ])
        );
      await db
        .delete(facilityMembershipRequests)
        .where(
          eq(
            facilityMembershipRequests.institutionalAccountId,
            ids.institutionId
          )
        );
      await db
        .delete(institutionProductRoles)
        .where(
          eq(institutionProductRoles.institutionalAccountId, ids.institutionId)
        );
      await db
        .delete(institutionMemberships)
        .where(
          eq(institutionMemberships.institutionalAccountId, ids.institutionId)
        );
      await db
        .delete(institutionalStaffMembers)
        .where(
          eq(
            institutionalStaffMembers.institutionalAccountId,
            ids.institutionId
          )
        );
      await db
        .delete(institutionalAccountAdmins)
        .where(
          eq(
            institutionalAccountAdmins.institutionalAccountId,
            ids.institutionId
          )
        );
      await db
        .delete(careFacilities)
        .where(eq(careFacilities.id, ids.facilityId));
      await db
        .delete(institutionalAccounts)
        .where(eq(institutionalAccounts.id, ids.institutionId));
      await db
        .delete(users)
        .where(
          inArray(users.id, [ids.adminId, ...ids.providerIds, ids.adminId + 4])
        );
    });

    it("prevents duplicates, isolates tenants, and atomically approves general membership only", async () => {
      const first = await providerCaller.facilityLinking.requestLink({
        facilityId: ids.facilityId,
        relationshipType: "permanent_staff",
      });
      expect(first).toMatchObject({
        success: true,
        status: "pending",
        duplicate: false,
      });
      const duplicate = await providerCaller.facilityLinking.requestLink({
        facilityId: ids.facilityId,
        relationshipType: "permanent_staff",
      });
      expect(duplicate).toMatchObject({
        success: true,
        status: "pending",
        duplicate: true,
        requestId: first.requestId,
      });

      const pending = await adminCaller.facilityLinking.getPendingRequests({
        institutionId: ids.institutionId,
      });
      expect(pending).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: first.requestId,
            requesterUserId: ids.providerIds[0],
            facilityId: ids.facilityId,
            status: "pending",
          }),
        ])
      );
      await expectTrpcError(
        () =>
          unrelatedCaller.facilityLinking.getPendingRequests({
            institutionId: ids.institutionId,
          }),
        "FORBIDDEN"
      );
      await expectTrpcError(
        () =>
          providerCaller.facilityLinking.reviewRequest({
            institutionId: ids.institutionId,
            requestId: first.requestId!,
            approve: true,
          }),
        "FORBIDDEN"
      );

      const approved = await adminCaller.facilityLinking.reviewRequest({
        institutionId: ids.institutionId,
        requestId: first.requestId!,
        approve: true,
      });
      expect(approved).toMatchObject({ success: true, status: "approved" });
      const [membership] = await db
        .select()
        .from(institutionMemberships)
        .where(
          and(
            eq(
              institutionMemberships.institutionalAccountId,
              ids.institutionId
            ),
            eq(institutionMemberships.userId, ids.providerIds[0])
          )
        );
      const [staff] = await db
        .select()
        .from(institutionalStaffMembers)
        .where(
          and(
            eq(
              institutionalStaffMembers.institutionalAccountId,
              ids.institutionId
            ),
            eq(institutionalStaffMembers.userId, ids.providerIds[0])
          )
        );
      expect(membership).toMatchObject({
        membershipStatus: "active",
        responsibilityRole: "general_staff",
      });
      expect(staff).toMatchObject({
        facilityLinkStatus: "linked",
        enrollmentStatus: "enrolled",
      });
      const productRoles = await db
        .select()
        .from(institutionProductRoles)
        .where(
          and(
            eq(
              institutionProductRoles.institutionalAccountId,
              ids.institutionId
            ),
            eq(institutionProductRoles.userId, ids.providerIds[0])
          )
        );
      expect(productRoles).toHaveLength(0);
      const repeatedApproval = await adminCaller.facilityLinking.reviewRequest({
        institutionId: ids.institutionId,
        requestId: first.requestId!,
        approve: true,
      });
      expect(repeatedApproval).toMatchObject({
        status: "approved",
        alreadyReviewed: true,
      });
    });

    it("requires a rejection reason and supports provider withdrawal", async () => {
      const rejected =
        await rejectingProviderCaller.facilityLinking.requestLink({
          facilityId: ids.facilityId,
          relationshipType: "permanent_staff",
        });
      await expectTrpcError(
        () =>
          adminCaller.facilityLinking.reviewRequest({
            institutionId: ids.institutionId,
            requestId: rejected.requestId!,
            approve: false,
            reason: "too short",
          }),
        "BAD_REQUEST"
      );
      const rejection = await adminCaller.facilityLinking.reviewRequest({
        institutionId: ids.institutionId,
        requestId: rejected.requestId!,
        approve: false,
        reason: "Provider identity requires verification.",
      });
      expect(rejection).toMatchObject({ success: true, status: "rejected" });

      const withdrawn =
        await withdrawingProviderCaller.facilityLinking.requestLink({
          facilityId: ids.facilityId,
          relationshipType: "permanent_staff",
        });
      const withdrawal =
        await withdrawingProviderCaller.facilityLinking.withdrawRequest({
          requestId: withdrawn.requestId!,
        });
      expect(withdrawal).toMatchObject({ success: true, status: "withdrawn" });
      const requests =
        await withdrawingProviderCaller.facilityLinking.getMyRequests();
      expect(requests).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: withdrawn.requestId,
            status: "withdrawn",
          }),
        ])
      );
    });
  }
);
