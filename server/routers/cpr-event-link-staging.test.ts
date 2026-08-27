import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { and, eq } from "drizzle-orm";
import { appRouter } from "../routers";
import { getDb } from "../db";
import type { TrpcContext } from "../_core/context";
import {
  users,
  institutionalAccounts,
  institutionMemberships,
  iersActivationEvents,
  iersActivationResponders,
  cprSessions,
  cprEventLinks,
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

function createContext(user: { id: number; email: string; name: string }): TrpcContext {
  return {
    user: {
      id: user.id,
      openId: `cpr-link-staging-${user.id}`,
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

describeStaging("real CPR event-link router on an ephemeral staging tenant", () => {
  let db: NonNullable<Awaited<ReturnType<typeof getDb>>>;
  let assignedUser: { id: number; email: string; name: string };
  let institutionId: number;
  let membershipId: number;
  let activationId: number;
  let secondActivationId: number;
  let cprSessionId: number;
  let secondCprSessionId: number;

  beforeAll(async () => {
    db = (await getDb())!;
    if (!db) throw new Error("The staging database connection could not be created.");
    const suffix = Date.now();
    assignedUser = {
      id: 0,
      email: `cpr-link-assigned-${suffix}@example.test`,
      name: "CPR Link Assigned Provider",
    };

    const [userInsert] = await db.insert(users).values({
      openId: `cpr-link-assigned-${suffix}`,
      name: assignedUser.name,
      email: assignedUser.email,
      loginMethod: "staging",
      role: "user",
      providerType: "nurse",
      userType: "individual",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    });
    assignedUser.id = Number((userInsert as unknown as { insertId: number }).insertId);

    const [institutionInsert] = await db.insert(institutionalAccounts).values({
      userId: assignedUser.id,
      companyName: `STAGING CPR Link Tenant ${suffix}`,
      contactName: assignedUser.name,
      contactEmail: assignedUser.email,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    institutionId = Number((institutionInsert as unknown as { insertId: number }).insertId);

    const [membershipInsert] = await db.insert(institutionMemberships).values({
      institutionalAccountId: institutionId,
      userId: assignedUser.id,
      invitedEmail: assignedUser.email,
      membershipStatus: "active",
      responsibilityRole: "ert_responder",
      acceptedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    membershipId = Number((membershipInsert as unknown as { insertId: number }).insertId);

    const [activationInsert] = await db.insert(iersActivationEvents).values({
      institutionalAccountId: institutionId,
      activatedByUserId: assignedUser.id,
      activationType: "code_blue",
      priority: "critical",
      location: "Staging CPR Bay",
      status: "responding",
      triggeredAt: now,
      createdAt: now,
      updatedAt: now,
    });
    activationId = Number((activationInsert as unknown as { insertId: number }).insertId);

    const [secondActivationInsert] = await db.insert(iersActivationEvents).values({
      institutionalAccountId: institutionId,
      activatedByUserId: assignedUser.id,
      activationType: "code_blue",
      priority: "critical",
      location: "Staging CPR Bay 2",
      status: "responding",
      triggeredAt: now,
      createdAt: now,
      updatedAt: now,
    });
    secondActivationId = Number((secondActivationInsert as unknown as { insertId: number }).insertId);

    await db.insert(iersActivationResponders).values([
      {
        activationEventId: activationId,
        institutionalAccountId: institutionId,
        membershipId,
        userId: assignedUser.id,
        responsibilityRole: "ert_responder",
        notificationStatus: "acknowledged",
        acknowledgedAt: now,
        responseAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        activationEventId: secondActivationId,
        institutionalAccountId: institutionId,
        membershipId,
        userId: assignedUser.id,
        responsibilityRole: "ert_responder",
        notificationStatus: "acknowledged",
        acknowledgedAt: now,
        responseAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const [cprInsert] = await db.insert(cprSessions).values({
      sessionCode: `C${String(suffix).slice(-7)}`,
      providerId: assignedUser.id,
      createdBy: assignedUser.id,
      patientWeight: "10",
      patientAgeMonths: 60,
      startTime: now,
      status: "active",
      outcome: "ongoing",
      createdAt: now,
      updatedAt: now,
    });
    cprSessionId = Number((cprInsert as unknown as { insertId: number }).insertId);

    const [secondCprInsert] = await db.insert(cprSessions).values({
      sessionCode: `D${String(suffix).slice(-7)}`,
      providerId: assignedUser.id,
      createdBy: assignedUser.id,
      patientWeight: "10",
      patientAgeMonths: 60,
      startTime: now,
      status: "active",
      outcome: "ongoing",
      createdAt: now,
      updatedAt: now,
    });
    secondCprSessionId = Number((secondCprInsert as unknown as { insertId: number }).insertId);
  });

  afterAll(async () => {
    if (!db) return;
    await db.delete(cprEventLinks).where(eq(cprEventLinks.institutionalAccountId, institutionId));
    await db.delete(cprSessions).where(eq(cprSessions.providerId, assignedUser.id));
    await db.delete(iersActivationResponders).where(eq(iersActivationResponders.userId, assignedUser.id));
    await db.delete(iersActivationEvents).where(eq(iersActivationEvents.institutionalAccountId, institutionId));
    await db.delete(institutionMemberships).where(eq(institutionMemberships.id, membershipId));
    await db.delete(institutionalAccounts).where(eq(institutionalAccounts.id, institutionId));
    await db.delete(users).where(eq(users.id, assignedUser.id));
  });

  it("links once and is idempotent on retry", async () => {
    const caller = appRouter.createCaller(createContext(assignedUser));
    const first = await caller.cprEventLink.linkSession({
      activationEventId: activationId,
      cprSessionId,
      resusGpsSessionKey: "staging-case-1",
      pathwayKey: "PALS",
      contentVersion: "2026-governed",
    });
    expect(first.success).toBe(true);
    expect(first.idempotent).toBe(false);

    const retry = await caller.cprEventLink.linkSession({
      activationEventId: activationId,
      cprSessionId,
      resusGpsSessionKey: "staging-case-1",
      pathwayKey: "PALS",
      contentVersion: "2026-governed",
    });
    expect(retry).toMatchObject({ success: true, idempotent: true, linkId: first.linkId });
  });

  it("rejects linking the same CPR session to a second activation", async () => {
    const caller = appRouter.createCaller(createContext(assignedUser));
    await expectTrpcError(
      () => caller.cprEventLink.linkSession({ activationEventId: secondActivationId, cprSessionId }),
      "CONFLICT",
    );
  });

  it("allows a second CPR session for a different activation", async () => {
    const caller = appRouter.createCaller(createContext(assignedUser));
    const result = await caller.cprEventLink.linkSession({ activationEventId: secondActivationId, cprSessionId: secondCprSessionId, pathwayKey: "PALS" });
    expect(result.success).toBe(true);
  });

  it("rejects the revoked membership on reads and outcome writes", async () => {
    await db.update(institutionMemberships).set({ membershipStatus: "ended", endedAt: now, updatedAt: now }).where(and(
      eq(institutionMemberships.id, membershipId),
      eq(institutionMemberships.institutionalAccountId, institutionId),
    ));
    const caller = appRouter.createCaller(createContext(assignedUser));
    await expectTrpcError(() => caller.cprEventLink.getForActivation({ activationEventId: activationId }), "FORBIDDEN");
    await expectTrpcError(() => caller.cprEventLink.recordOutcome({ cprSessionId, outcome: "ROSC" }), "FORBIDDEN");
  });
});
