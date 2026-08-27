import { describe, expect, it } from "vitest";
import {
  enrollments,
  ilsDeliverySessions,
  ilsOperationalCases,
  ilsReminderEvents,
  institutionalTrainingOrderProviders,
  institutionalTrainingOrders,
  payments,
} from "../../drizzle/schema";
import { applyInstitutionalLifeSupportPaymentFailure } from "./institutional-life-support-payments";

type FakeState = {
  payment: Record<string, any>;
  order: Record<string, any>;
  session: Record<string, any>;
  assignments: Record<string, any>[];
  enrollmentRows: Record<string, any>[];
  reminders: Record<string, any>[];
  cases: Record<string, any>[];
};

function createFakeDb(state: FakeState) {
  const selectRows = (table: unknown) => {
    if (table === payments) return [state.payment];
    if (table === institutionalTrainingOrders) return [state.order];
    if (table === institutionalTrainingOrderProviders) return state.assignments;
    if (table === enrollments) return state.enrollmentRows;
    if (table === ilsReminderEvents) return state.reminders;
    if (table === ilsOperationalCases) return state.cases;
    return [];
  };

  const db: any = {
    select: () => {
      const query: any = {
        from: (table: unknown) => {
          query.table = table;
          return query;
        },
        where: () => query,
        then: (
          resolve: (value: Record<string, any>[]) => unknown,
          reject: (reason: unknown) => unknown
        ) => Promise.resolve(selectRows(query.table)).then(resolve, reject),
        limit: () => Promise.resolve(selectRows(query.table)),
      };
      return query;
    },
    update: (table: unknown) => {
      const query: any = {
        values: {},
        set: (values: Record<string, any>) => {
          query.values = values;
          return query;
        },
        where: () => {
          if (table === institutionalTrainingOrders) {
            if (
              state.order.paymentStatus === "pending" &&
              ["draft", "ready_for_payment", "payment_pending"].includes(
                state.order.orderStatus
              )
            ) {
              Object.assign(state.order, query.values);
              return Promise.resolve([{ affectedRows: 1 }]);
            }
            return Promise.resolve([{ affectedRows: 0 }]);
          }
          if (table === ilsReminderEvents) {
            for (const reminder of state.reminders) {
              if (
                reminder.status === "queued" &&
                reminder.reminderType === "payment"
              ) {
                Object.assign(reminder, query.values);
              }
            }
          }
          if (table === enrollments) {
            for (const enrollment of state.enrollmentRows) {
              if (enrollment.enrollmentStatus === "active")
                Object.assign(enrollment, query.values);
            }
          }
          if (table === institutionalTrainingOrderProviders) {
            for (const assignment of state.assignments) {
              if (assignment.assignmentStatus === "active")
                Object.assign(assignment, query.values);
            }
          }
          if (table === ilsDeliverySessions) {
            state.session.reservedCount -= state.order.providerCount;
            Object.assign(state.session, query.values, {
              reservedCount: state.session.reservedCount,
            });
          }
          return Promise.resolve([{ affectedRows: 1 }]);
        },
      };
      return query;
    },
    insert: (table: unknown) => ({
      values: (values: Record<string, any>) => {
        if (table === ilsOperationalCases)
          state.cases.push({ id: state.cases.length + 1, ...values });
        return Promise.resolve({ insertId: state.cases.length });
      },
    }),
    transaction: async (callback: (tx: any) => Promise<void>) => callback(db),
  };
  return db;
}

function baseState(): FakeState {
  return {
    payment: {
      id: 77,
      status: "failed",
      institutionalTrainingOrderId: 12,
      userId: 501,
    },
    order: {
      id: 12,
      institutionalAccountId: 9,
      orderStatus: "payment_pending",
      paymentStatus: "pending",
      providerCount: 2,
      deliverySessionId: 33,
    },
    session: { id: 33, reservedCount: 2 },
    assignments: [
      { id: 1, orderId: 12, enrollmentId: 101, assignmentStatus: "active" },
      { id: 2, orderId: 12, enrollmentId: 102, assignmentStatus: "active" },
    ],
    enrollmentRows: [
      { id: 101, enrollmentStatus: "active" },
      { id: 102, enrollmentStatus: "active" },
    ],
    reminders: [
      { id: 1, orderId: 12, reminderType: "payment", status: "queued" },
    ],
    cases: [],
  };
}

describe("ILS payment-failure settlement", () => {
  it("blocks the order, cancels unpaid access, releases capacity, and is idempotent", async () => {
    const state = baseState();
    const db = createFakeDb(state);

    await applyInstitutionalLifeSupportPaymentFailure(
      db,
      77,
      "User cancelled the payment prompt."
    );

    expect(state.order).toMatchObject({
      orderStatus: "blocked",
      paymentStatus: "failed",
    });
    expect(state.session.reservedCount).toBe(0);
    expect(
      state.assignments.every(row => row.assignmentStatus === "removed")
    ).toBe(true);
    expect(
      state.enrollmentRows.every(row => row.enrollmentStatus === "cancelled")
    ).toBe(true);
    expect(state.reminders[0]?.status).toBe("cancelled");
    expect(state.cases).toHaveLength(1);
    expect(state.cases[0]).toMatchObject({
      category: "payment",
      priority: "high",
      orderId: 12,
    });

    await applyInstitutionalLifeSupportPaymentFailure(
      db,
      77,
      "Duplicate callback."
    );

    expect(state.session.reservedCount).toBe(0);
    expect(state.cases).toHaveLength(1);
  });

  it("does not release capacity again after a cancelled order", async () => {
    const state = baseState();
    state.order.orderStatus = "cancelled";
    state.order.paymentStatus = "failed";
    const db = createFakeDb(state);

    await applyInstitutionalLifeSupportPaymentFailure(
      db,
      77,
      "Late failure callback."
    );

    expect(state.session.reservedCount).toBe(2);
    expect(
      state.assignments.every(row => row.assignmentStatus === "active")
    ).toBe(true);
    expect(state.cases).toHaveLength(0);
  });
});

describe("ILS payment amount validation", () => {
  it("accepts matching order, ledger, and callback amounts", async () => {
    const { validateIlsInstitutionalPaymentAmount } = await import(
      "./institutional-life-support-payments"
    );
    expect(
      validateIlsInstitutionalPaymentAmount({
        orderTotalAmountKes: 20_000,
        ledgerAmountCents: 2_000_000,
        receivedAmountKes: 20_000,
      })
    ).toEqual({
      valid: true,
      expectedCents: 2_000_000,
      receivedCents: 2_000_000,
    });
  });

  it("rejects a missing or mismatched callback amount", async () => {
    const { validateIlsInstitutionalPaymentAmount } = await import(
      "./institutional-life-support-payments"
    );
    expect(
      validateIlsInstitutionalPaymentAmount({
        orderTotalAmountKes: 20_000,
        ledgerAmountCents: 2_000_000,
        receivedAmountKes: null,
      })
    ).toMatchObject({ valid: false });
    expect(
      validateIlsInstitutionalPaymentAmount({
        orderTotalAmountKes: 20_000,
        ledgerAmountCents: 1_000_000,
        receivedAmountKes: 10_000,
      })
    ).toMatchObject({
      valid: false,
      reason: expect.stringContaining("ledger mismatch"),
    });
  });
});
