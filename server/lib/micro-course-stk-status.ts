import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { microCourseEnrollments } from "../../drizzle/schema";
import { getDb } from "../db";
import { queryStk } from "../mpesa";
import { classifyStkResult, describeStkResult } from "./stk-payment-policy";

/** Payment success is trusted only for the checkout stored on this learner's row. */
export async function checkOwnedMicroCourseStk(input: {
  enrollmentId: number;
  userId: number;
  checkoutRequestId: string;
}) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Payment database unavailable",
    });
  const [enrollment] = await db
    .select()
    .from(microCourseEnrollments)
    .where(
      and(
        eq(microCourseEnrollments.id, input.enrollmentId),
        eq(microCourseEnrollments.userId, input.userId)
      )
    )
    .limit(1);
  if (!enrollment)
    throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
  if (
    !enrollment.transactionId ||
    enrollment.transactionId !== input.checkoutRequestId
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Checkout does not belong to this enrollment",
    });
  }
  if (
    enrollment.paymentStatus === "completed" ||
    enrollment.paymentStatus === "free"
  ) {
    return {
      status: "completed" as const,
      transactionId: enrollment.transactionId,
      enrollment,
    };
  }
  const stk = await queryStk(enrollment.transactionId);
  if (
    stk.checkoutRequestID &&
    stk.checkoutRequestID !== enrollment.transactionId
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Provider returned a different checkout",
    });
  }
  const status = classifyStkResult(stk);
  if (status === "completed") {
    const expectedKes = Math.ceil((enrollment.amountPaid ?? 0) / 100);
    const amount = (stk as { amount?: number }).amount;
    if (
      expectedKes <= 0 ||
      (amount !== undefined &&
        (!Number.isFinite(Number(amount)) || Number(amount) !== expectedKes))
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment amount could not be matched to this enrollment",
      });
    }
    await db
      .update(microCourseEnrollments)
      .set({
        paymentStatus: "completed",
        enrollmentStatus: "active",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(microCourseEnrollments.id, enrollment.id),
          eq(microCourseEnrollments.userId, input.userId),
          eq(microCourseEnrollments.transactionId, input.checkoutRequestId),
          eq(microCourseEnrollments.paymentStatus, "pending")
        )
      );
    console.info(
      "[M-Pesa STK] reconciled",
      JSON.stringify({
        enrollmentId: enrollment.id,
        checkoutRequestId: input.checkoutRequestId,
        amountKes: expectedKes,
      })
    );
    return { status, transactionId: enrollment.transactionId, enrollment };
  }
  return {
    status,
    errorMessage: `${String(stk.resultCode) === "QUERY_TRANSPORT_ERROR" ? "QUERY_TRANSPORT_ERROR: " : ""}${describeStkResult(stk)}`,
    resultCode: String(stk.resultCode ?? ""),
    enrollment,
  };
}
