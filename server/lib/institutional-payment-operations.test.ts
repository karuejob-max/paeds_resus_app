import { describe, expect, it } from "vitest";
import { runInstitutionalPaymentOperations } from "./institutional-payment-operations";

describe("institutional payment operations", () => {
  it("marks due invoices overdue and reports finance-review items", async () => {
    const updates: Array<{ id: number; status: string }> = [];
    const db = {
      select: () => ({
        from: () => ({
          where: (condition: unknown) => ({
            limit: async (_limit: number) => {
              void condition;
              return [{ id: 7 }, { id: 8 }];
            },
          }),
        }),
      }),
      update: () => ({
        set: (values: { status: string }) => ({
          where: async (condition: unknown) => {
            void condition;
            updates.push({ id: updates.length + 7, status: values.status });
            return [];
          },
        }),
      }),
    } as never;
    const result = await runInstitutionalPaymentOperations(db, new Date("2026-09-06T00:00:00Z"));
    expect(result.overdueMarked).toBe(2);
    expect(result.financeReviewRequired).toBe(2);
    expect(updates).toHaveLength(2);
  });
});
