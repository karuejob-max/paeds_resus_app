import { describe, expect, it } from "vitest";
import {
  globalEntitlementRedemptions,
  globalEntitlements,
  ierpProgramEnrollments,
} from "../../drizzle/schema";
import { applyIerpEntitlementToPendingEnrollmentInTransaction } from "./ierp-sponsored-access";

type EnrollmentState = {
  id: number;
  userId: number;
  programKey: "ierp";
  totalPaidAmount: string;
  paymentStatus: string;
  entitlementId: number | null;
  effectiveFeeKes: number | null;
  paymentLockoutAt: Date | null;
  updatedAt: Date;
};

type EntitlementState = {
  id: number;
  grantReference: string;
  targetUserId: number;
  targetInstitutionalAccountId: null;
  selfPayCourseId: null;
  programType: "ierp";
  benefitType: "free";
  discountPercent: null;
  redemptionCount: number;
  maxRedemptions: number;
  status: "active" | "exhausted";
  expiresAt: Date;
};

function createEntitlement(id: number): EntitlementState {
  return {
    id,
    grantReference: `ENT-TEST-${id}`,
    targetUserId: 7,
    targetInstitutionalAccountId: null,
    selfPayCourseId: null,
    programType: "ierp",
    benefitType: "free",
    discountPercent: null,
    redemptionCount: 0,
    maxRedemptions: 1,
    status: "active",
    expiresAt: new Date(Date.now() + 86_400_000),
  };
}

function createFixture(input?: {
  paymentStatus?: string;
  totalPaidAmount?: string;
  entitlementId?: number | null;
}) {
  const enrollment: EnrollmentState = {
    id: 31,
    userId: 7,
    programKey: "ierp",
    totalPaidAmount: input?.totalPaidAmount ?? "0.00",
    paymentStatus: input?.paymentStatus ?? "pending",
    entitlementId: input?.entitlementId ?? null,
    effectiveFeeKes: null,
    paymentLockoutAt: null,
    updatedAt: new Date(0),
  };
  const entitlements = new Map<number, EntitlementState>([
    [101, createEntitlement(101)],
    [102, createEntitlement(102)],
  ]);
  const redemptions: Array<Record<string, unknown>> = [];
  let lockTail: Promise<void> = Promise.resolve();

  async function acquireEnrollmentLock() {
    let release = () => {};
    const currentLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previousLock = lockTail;
    lockTail = previousLock.then(() => currentLock);
    await previousLock;
    return release;
  }

  function createTransaction(entitlementId: number) {
    const releases: Array<() => void> = [];

    function select() {
      let table: unknown;
      const readRows = async (forUpdate = false) => {
        if (table === ierpProgramEnrollments) {
          if (forUpdate) releases.push(await acquireEnrollmentLock());
          if (
            enrollment.paymentStatus === "pending" &&
            enrollment.totalPaidAmount === "0.00" &&
            enrollment.entitlementId === null
          ) {
            return [{ ...enrollment }];
          }
          return [];
        }
        if (table === globalEntitlements) {
          const grant = entitlements.get(entitlementId);
          return grant ? [{ ...grant }] : [];
        }
        return [];
      };
      const query: any = {
        from(nextTable: unknown) {
          table = nextTable;
          return query;
        },
        where() {
          return query;
        },
        orderBy() {
          return query;
        },
        limit() {
          return query;
        },
        for(lockMode: string) {
          if (lockMode !== "update") throw new Error(`Unexpected lock: ${lockMode}`);
          return {
            then: (resolve: (value: any) => any, reject?: (reason: any) => any) =>
              readRows(true).then(resolve, reject),
          };
        },
        then: (resolve: (value: any) => any, reject?: (reason: any) => any) =>
          readRows(false).then(resolve, reject),
      };
      return query;
    }

    return {
      select,
      update(table: unknown) {
        return {
          set(values: Record<string, unknown>) {
            return {
              async where() {
                if (table === globalEntitlements) {
                  const grant = entitlements.get(entitlementId);
                  if (
                    !grant ||
                    grant.status !== "active" ||
                    grant.redemptionCount >= grant.maxRedemptions
                  ) {
                    return [{ affectedRows: 0 }];
                  }
                  grant.redemptionCount += 1;
                  if (grant.redemptionCount >= grant.maxRedemptions) {
                    grant.status = "exhausted";
                  }
                  return [{ affectedRows: 1 }];
                }
                if (table === ierpProgramEnrollments) {
                  if (
                    enrollment.paymentStatus !== "pending" ||
                    enrollment.totalPaidAmount !== "0.00" ||
                    enrollment.entitlementId !== null
                  ) {
                    return [{ affectedRows: 0 }];
                  }
                  Object.assign(enrollment, values);
                  return [{ affectedRows: 1 }];
                }
                return [{ affectedRows: 0 }];
              },
            };
          },
        };
      },
      insert(table: unknown) {
        return {
          async values(values: Record<string, unknown>) {
            if (table === globalEntitlementRedemptions) redemptions.push(values);
            return [];
          },
        };
      },
      releaseLocks() {
        releases.splice(0).forEach(release => release());
      },
    };
  }

  async function reconcile(entitlementId: number) {
    const tx = createTransaction(entitlementId);
    try {
      return await applyIerpEntitlementToPendingEnrollmentInTransaction(tx, {
        entitlementId,
        targetUserId: 7,
        redeemedByUserId: 99,
      });
    } finally {
      tx.releaseLocks();
    }
  }

  return { enrollment, entitlements, redemptions, reconcile };
}

describe("sponsored IERP entitlement reconciliation", () => {
  it("serializes concurrent grants so one enrollment consumes at most one entitlement", async () => {
    const fixture = createFixture();

    const results = await Promise.all([
      fixture.reconcile(101),
      fixture.reconcile(102),
    ]);

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(fixture.redemptions).toHaveLength(1);
    expect(
      [...fixture.entitlements.values()].filter(grant => grant.redemptionCount > 0)
    ).toHaveLength(1);
    expect(fixture.enrollment.paymentStatus).toBe("not_required");
    expect(fixture.enrollment.effectiveFeeKes).toBe(0);
  });

  it("is idempotent when the same sponsored enrollment is reconciled again", async () => {
    const fixture = createFixture();

    expect(await fixture.reconcile(101)).toMatchObject({ effectiveAmountKes: 0 });
    expect(await fixture.reconcile(101)).toBeNull();
    expect(fixture.redemptions).toHaveLength(1);
    expect(fixture.entitlements.get(101)?.redemptionCount).toBe(1);
  });

  it("does not replace an entitlement already applied to a pending learner enrollment", async () => {
    const fixture = createFixture({ entitlementId: 88 });

    expect(await fixture.reconcile(101)).toBeNull();
    expect(fixture.enrollment.entitlementId).toBe(88);
    expect(fixture.redemptions).toHaveLength(0);
    expect(fixture.entitlements.get(101)?.redemptionCount).toBe(0);
  });

  it.each([
    { paymentStatus: "partial", totalPaidAmount: "2500.00" },
    { paymentStatus: "not_required", totalPaidAmount: "0.00" },
    { paymentStatus: "paid_in_full", totalPaidAmount: "15000.00" },
  ])("does not alter non-pending or previously paid enrollment state (%o)", async state => {
    const fixture = createFixture(state);

    expect(await fixture.reconcile(101)).toBeNull();
    expect(fixture.redemptions).toHaveLength(0);
    expect(fixture.entitlements.get(101)?.redemptionCount).toBe(0);
    expect(fixture.enrollment.paymentStatus).toBe(state.paymentStatus);
  });
});
