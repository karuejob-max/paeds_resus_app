import { and, inArray, isNotNull, lt, or, eq } from "drizzle-orm";
import { institutionalPaymentAttempts, institutionalSubscriptionInvoices } from "../../drizzle/schema";

type Db = Awaited<ReturnType<typeof import("../db").getDb>>;

export async function runInstitutionalPaymentOperations(db: NonNullable<Db>, now = new Date()) {
  const dueInvoices = await db.select({ id: institutionalSubscriptionInvoices.id }).from(institutionalSubscriptionInvoices).where(and(inArray(institutionalSubscriptionInvoices.status, ["issued", "payment_pending"]), isNotNull(institutionalSubscriptionInvoices.dueAt), lt(institutionalSubscriptionInvoices.dueAt, now))).limit(500);
  for (const invoice of dueInvoices) {
    await db.update(institutionalSubscriptionInvoices).set({ status: "overdue", updatedAt: now }).where(eq(institutionalSubscriptionInvoices.id, invoice.id));
  }
  const unreconciledAttempts = await db.select({ id: institutionalPaymentAttempts.id }).from(institutionalPaymentAttempts).where(or(eq(institutionalPaymentAttempts.reconciliationStatus, "unreconciled"), eq(institutionalPaymentAttempts.reconciliationStatus, "mismatch"))).limit(500);
  return { overdueMarked: dueInvoices.length, financeReviewRequired: unreconciledAttempts.length };
}
