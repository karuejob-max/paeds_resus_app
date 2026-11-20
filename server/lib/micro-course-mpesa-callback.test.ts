import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  enrollments,
  microCourseEnrollments,
  microCourses,
} from "../../drizzle/schema";
import {
  parseStkCallback,
  reconcileMicroCourseStkCallback,
} from "./micro-course-mpesa-callback";

vi.mock("../mpesa-real", () => ({
  queryStk: vi.fn(() => {
    throw new Error("Real provider access forbidden in tests");
  }),
}));
vi.mock("./ensure-intubation-sample-course-catalog", () => ({
  INTUBATION_SAMPLE_MICRO_COURSE_ID: "intubation-essentials",
  getIntubationSampleCourseId: vi.fn(async () => 90),
}));

function payload(code: number | string = 0, amount: unknown = 200) {
  return {
    Body: {
      stkCallback: {
        CheckoutRequestID: "checkout-stored",
        ResultCode: code,
        ResultDesc: "result",
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: amount },
            { Name: "MpesaReceiptNumber", Value: "ABC123XYZ" },
            { Name: "PhoneNumber", Value: 254712345678 },
          ],
        },
      },
    },
  };
}
const callback = () => parseStkCallback(payload())!;
const success = () => ({
  resultCode: "0",
  resultDesc: "paid",
  checkoutRequestID: "checkout-stored",
});

function fakeDb(overrides: Record<string, unknown> = {}) {
  const row: any = {
    id: 12,
    userId: 7,
    microCourseId: 8,
    transactionId: "checkout-stored",
    paymentMethod: "m-pesa",
    paymentStatus: "pending",
    enrollmentStatus: "pending",
    amountPaid: 20000,
    ...overrides,
  };
  const db: any = {};
  let lookups = 0;
  db.missing = false;
  db.ambiguous = false;
  db.failPersist = false;
  db.beforeLock = () => {};
  db.courseSlug = "asthma-i";
  db.writes = [] as any[];
  db.select = vi.fn(() => ({
    from: (table: any) => {
      const rows = () => {
        if (table === microCourseEnrollments) {
          lookups++;
          return db.missing
            ? []
            : db.ambiguous
              ? [{ ...row }, { ...row, id: 13 }]
              : [{ ...row }];
        }
        if (table === microCourses) return [{ courseId: db.courseSlug }];
        if (table === enrollments) return [{ id: 42 }];
        throw new Error("Unexpected DB table");
      };
      const chain: any = {
        where: () => chain,
        orderBy: () => chain,
        limit: () => chain,
        for: async () => {
          db.beforeLock();
          return rows();
        },
        then: (resolve: any, reject: any) =>
          Promise.resolve(rows()).then(resolve, reject),
      };
      return chain;
    },
  }));
  db.update = vi.fn((table: any) => ({
    set: (values: any) => ({
      where: async () => {
        if (db.failPersist) throw new Error("database write failed");
        db.writes.push({ table, values });
        if (table === microCourseEnrollments && row.paymentStatus === "pending")
          Object.assign(row, values);
      },
    }),
  }));
  // Transactions are rollback-capable and serialize to model a row lock.
  let queue: Promise<any> = Promise.resolve();
  db.transaction = vi.fn((fn: any) => {
    const run = queue.then(async () => {
      const snapshot = { ...row };
      try {
        return await fn(db);
      } catch (error) {
        Object.assign(row, snapshot);
        throw error;
      }
    });
    queue = run.catch(() => {});
    return run;
  });
  return { db, row, lookups: () => lookups };
}

describe("nested callback parsing", () => {
  it("normalizes string success codes and numeric/string KES metadata", () => {
    expect(parseStkCallback(payload("0", "200"))).toMatchObject({
      resultCode: 0,
      amountKes: 200,
      metadataValid: true,
    });
  });
  it.each([1032, 1037, 1, 2001, 1019, 1001, 1025, 9999])(
    "parses terminal code %s from Body.stkCallback without metadata",
    code => {
      expect(
        parseStkCallback({
          Body: {
            stkCallback: {
              CheckoutRequestID: "checkout-stored",
              ResultCode: code,
            },
          },
        })
      ).toMatchObject({ resultCode: code, metadataValid: false });
    }
  );
  it.each([undefined, null, "", "oops", true, -1])(
    "rejects invalid result code %s",
    code => {
      const body = payload();
      body.Body.stkCallback.ResultCode = code as any;
      expect(parseStkCallback(body)).toBeNull();
    }
  );
  it.each([null, "", -1, "NaN", "Infinity", {}, 0, 200.001])(
    "does not accept malformed amount %s",
    amount => {
      expect(parseStkCallback(payload(0, amount))?.metadataValid).toBe(false);
    }
  );
  it("rejects duplicate metadata and non-array metadata", () => {
    const body = payload();
    body.Body.stkCallback.CallbackMetadata.Item.push({
      Name: "Amount",
      Value: 200,
    });
    expect(parseStkCallback(body)?.metadataValid).toBe(false);
    expect(
      parseStkCallback({
        Body: {
          stkCallback: {
            CheckoutRequestID: "checkout-stored",
            ResultCode: 0,
            CallbackMetadata: { Item: {} },
          },
        },
      })?.metadataValid
    ).toBe(false);
  });
});

describe("checkout-bound micro-course callback reconciliation", () => {
  beforeEach(() => vi.clearAllMocks());
  it("verifies via query of stored checkout, then activates micro enrollment retaining cents and checkout", async () => {
    const { db, row } = fakeDb();
    const query = vi.fn(async () => success());
    expect(
      await reconcileMicroCourseStkCallback(db, callback(), query)
    ).toMatchObject({
      status: "completed",
      duplicate: false,
      receipt: "ABC123XYZ",
      amountCents: 20000,
    });
    expect(query).toHaveBeenCalledWith(row.transactionId);
    expect(row).toMatchObject({
      paymentStatus: "completed",
      enrollmentStatus: "active",
      amountPaid: 20000,
      transactionId: "checkout-stored",
    });
    expect(db.writes).toHaveLength(1);
  });
  it("matches the exact whole-KES round-up used by enrollWithPayment", async () => {
    const { db, row } = fakeDb({ amountPaid: 19901 });
    await reconcileMicroCourseStkCallback(db, callback(), async () =>
      success()
    );
    expect(row.amountPaid).toBe(19901);
  });
  it("keeps ordinary AHA enrollment with same numeric ID untouched", async () => {
    const { db } = fakeDb();
    await reconcileMicroCourseStkCallback(db, callback(), async () =>
      success()
    );
    expect(db.writes.every((write: any) => write.table !== enrollments)).toBe(
      true
    );
  });
  it("returns null for unmatched checkout without querying provider", async () => {
    const { db } = fakeDb();
    db.missing = true;
    const query = vi.fn();
    expect(
      await reconcileMicroCourseStkCallback(db, callback(), query)
    ).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });
  it("rejects ambiguous checkout binding", async () => {
    const { db } = fakeDb();
    db.ambiguous = true;
    await expect(
      reconcileMicroCourseStkCallback(db, callback(), async () => success())
    ).rejects.toThrow("Ambiguous");
    expect(db.update).not.toHaveBeenCalled();
  });
  it.each([1032, 1037, 1, 2001, 1019, 1001, 1025, 9999])(
    "records verified terminal %s without granting access",
    async code => {
      const { db, row } = fakeDb();
      const parsed = parseStkCallback({
        Body: {
          stkCallback: {
            CheckoutRequestID: row.transactionId,
            ResultCode: code,
          },
        },
      })!;
      await reconcileMicroCourseStkCallback(db, parsed, async () => ({
        ...success(),
        resultCode: String(code),
      }));
      expect(row).toMatchObject({
        paymentStatus: "pending",
        enrollmentStatus: "expired",
        transactionId: "checkout-stored",
      });
    }
  );
  it.each([
    "2031",
    "",
    "QUERY_TRANSPORT_ERROR",
    "QUERY_CONFIG_ERROR",
    "weird",
    "400",
  ])("does not downgrade pending provider result %s", async code => {
    const { db, row } = fakeDb();
    await expect(
      reconcileMicroCourseStkCallback(db, callback(), async () => ({
        ...success(),
        resultCode: code,
      }))
    ).rejects.toThrow();
    expect(db.update).not.toHaveBeenCalled();
    expect(row.enrollmentStatus).toBe("pending");
  });
  it("rejects provider checkout mismatch and missing binding", async () => {
    for (const checkoutRequestID of [undefined, "other-checkout"]) {
      const { db } = fakeDb();
      await expect(
        reconcileMicroCourseStkCallback(db, callback(), async () => ({
          ...success(),
          checkoutRequestID,
        }))
      ).rejects.toThrow("bound");
      expect(db.update).not.toHaveBeenCalled();
    }
  });
  it.each([199, 201, 20000])(
    "does not grant on amount mismatch %s",
    async amount => {
      const { db } = fakeDb();
      await expect(
        reconcileMicroCourseStkCallback(
          db,
          parseStkCallback(payload(0, amount))!,
          async () => success()
        )
      ).rejects.toThrow("amount");
      expect(db.update).not.toHaveBeenCalled();
    }
  );
  it("rejects malformed success metadata after real-provider verification", async () => {
    const { db } = fakeDb();
    await expect(
      reconcileMicroCourseStkCallback(
        db,
        { ...callback(), metadataValid: false },
        async () => success()
      )
    ).rejects.toThrow("metadata");
    expect(db.update).not.toHaveBeenCalled();
  });
  it("rejects contradictory provider amount or receipt", async () => {
    for (const provider of [
      { ...success(), amount: 1 },
      { ...success(), mpesaReceiptNumber: "DIFFERENT" },
    ]) {
      const { db } = fakeDb();
      await expect(
        reconcileMicroCourseStkCallback(db, callback(), async () => provider)
      ).rejects.toThrow("conflicts");
      expect(db.update).not.toHaveBeenCalled();
    }
  });
  it("does not trust callback failure to downgrade a provider-confirmed success", async () => {
    const { db } = fakeDb();
    await expect(
      reconcileMicroCourseStkCallback(
        db,
        { ...callback(), resultCode: 1032 },
        async () => success()
      )
    ).rejects.toThrow();
    expect(db.update).not.toHaveBeenCalled();
  });
  it("completed duplicate and late failure do not query or downgrade", async () => {
    const { db, row } = fakeDb({
      paymentStatus: "completed",
      enrollmentStatus: "completed",
    });
    const query = vi.fn();
    expect(
      await reconcileMicroCourseStkCallback(
        db,
        { ...callback(), resultCode: 1037 },
        query
      )
    ).toMatchObject({ status: "completed", duplicate: true });
    expect(query).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
    expect(row.enrollmentStatus).toBe("completed");
  });
  it("provider-confirmed success repairs an expired same-checkout attempt", async () => {
    const { db, row } = fakeDb({ enrollmentStatus: "expired" });
    await reconcileMicroCourseStkCallback(db, callback(), async () =>
      success()
    );
    expect(row.enrollmentStatus).toBe("active");
  });
  it("rechecks binding after query to guard concurrent retry mutation", async () => {
    const other = fakeDb();
    other.db.beforeLock = () => {
      other.row.transactionId = "new-checkout";
    };
    await expect(
      reconcileMicroCourseStkCallback(other.db, callback(), async () =>
        success()
      )
    ).rejects.toThrow("changed");
    expect(other.db.update).not.toHaveBeenCalled();
  });
  it("concurrent duplicate callbacks activate only once", async () => {
    const { db } = fakeDb();
    const results = await Promise.all(
      [1, 2].map(() =>
        reconcileMicroCourseStkCallback(db, callback(), async () => success())
      )
    );
    expect(results.filter(r => r?.duplicate)).toHaveLength(1);
    expect(db.writes).toHaveLength(1);
  });
  it("concurrent late failure cannot downgrade completed status under row lock", async () => {
    const { db, row } = fakeDb();
    await Promise.all([
      reconcileMicroCourseStkCallback(db, callback(), async () => success()),
      reconcileMicroCourseStkCallback(
        db,
        { ...callback(), resultCode: 1037 },
        async () => ({ ...success(), resultCode: "1037" })
      ),
    ]);
    expect(row.paymentStatus).toBe("completed");
    expect(row.enrollmentStatus).toBe("active");
  });
  it("persistence failure rejects instead of acknowledging or losing the callback", async () => {
    const { db, row } = fakeDb();
    db.failPersist = true;
    await expect(
      reconcileMicroCourseStkCallback(db, callback(), async () => success())
    ).rejects.toThrow("write failed");
    expect(row.paymentStatus).toBe("pending");
  });
  it("atomically syncs the intubation-only fellowship mirror", async () => {
    const { db } = fakeDb();
    db.courseSlug = "intubation-essentials";
    await reconcileMicroCourseStkCallback(db, callback(), async () =>
      success()
    );
    expect(db.writes).toHaveLength(2);
    expect(db.writes[1]).toMatchObject({
      table: enrollments,
      values: { paymentStatus: "completed", amountPaid: 20000 },
    });
  });
});
