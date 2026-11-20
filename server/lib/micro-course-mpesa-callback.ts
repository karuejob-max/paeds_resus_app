import { and, desc, eq } from "drizzle-orm";
import {
  enrollments,
  microCourseEnrollments,
  microCourses,
} from "../../drizzle/schema";
import type { getDb } from "../db";
import { queryStk } from "../mpesa-real";
import { classifyStkResult } from "./stk-payment-policy";
import {
  INTUBATION_SAMPLE_MICRO_COURSE_ID,
  getIntubationSampleCourseId,
} from "./ensure-intubation-sample-course-catalog";

type CallbackDb = NonNullable<Awaited<ReturnType<typeof getDb>>>;
export type VerifiedStkQuery = Awaited<ReturnType<typeof queryStk>>;
export type StkCallback = {
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  amountKes: number | null;
  receipt: string | null;
  phoneNumber: string | null;
  metadataValid: boolean;
};

/** Strict parsing of the real nested Daraja STK payload, including string result codes. */
export function parseStkCallback(body: unknown): StkCallback | null {
  const callback = (body as any)?.Body?.stkCallback;
  if (!callback || typeof callback !== "object") return null;
  const checkoutRequestId =
    typeof callback.CheckoutRequestID === "string"
      ? callback.CheckoutRequestID.trim()
      : "";
  const code = callback.ResultCode;
  if (
    !checkoutRequestId ||
    checkoutRequestId.length > 255 ||
    !(
      (typeof code === "number" && Number.isSafeInteger(code) && code >= 0) ||
      (typeof code === "string" && /^\d+$/.test(code))
    )
  )
    return null;
  const resultCode = Number(code);
  if (!Number.isSafeInteger(resultCode)) return null;
  const values = new Map<string, unknown>();
  let metadataValid = Array.isArray(callback.CallbackMetadata?.Item);
  if (metadataValid) {
    for (const item of callback.CallbackMetadata.Item) {
      if (!item || typeof item.Name !== "string" || values.has(item.Name)) {
        metadataValid = false;
        break;
      }
      values.set(item.Name, item.Value);
    }
  }
  const rawAmount = values.get("Amount");
  const amount =
    typeof rawAmount === "number" ||
    (typeof rawAmount === "string" && /^\d+(\.\d{1,2})?$/.test(rawAmount))
      ? Number(rawAmount)
      : NaN;
  const rawReceipt = values.get("MpesaReceiptNumber");
  const receipt =
    typeof rawReceipt === "string" &&
    /^[A-Za-z0-9]{6,30}$/.test(rawReceipt.trim())
      ? rawReceipt.trim()
      : null;
  const rawPhone = values.get("PhoneNumber");
  const phone =
    typeof rawPhone === "number" || typeof rawPhone === "string"
      ? String(rawPhone).trim()
      : "";
  const phoneNumber = /^254[17]\d{8}$/.test(phone) ? phone : null;
  const amountKes =
    Number.isFinite(amount) &&
    amount > 0 &&
    Math.abs(amount * 100 - Math.round(amount * 100)) < 1e-6 &&
    Number.isSafeInteger(Math.round(amount * 100))
      ? amount
      : null;
  return {
    checkoutRequestId,
    resultCode,
    resultDesc:
      typeof callback.ResultDesc === "string"
        ? callback.ResultDesc.slice(0, 512)
        : "",
    amountKes,
    receipt,
    phoneNumber,
    metadataValid:
      metadataValid &&
      amountKes !== null &&
      receipt !== null &&
      phoneNumber !== null,
  };
}

export class MpesaCallbackRetryError extends Error {}

/** enrollWithPayment sends whole KES rounded UP, while amountPaid stores cents. */
export function expectedStkAmountKes(expectedCents: number | null): number {
  if (
    expectedCents == null ||
    !Number.isSafeInteger(expectedCents) ||
    expectedCents <= 0
  ) {
    throw new MpesaCallbackRetryError(
      "Stored M-Pesa enrollment amount is invalid"
    );
  }
  return Math.ceil(expectedCents / 100);
}

/** Pure verification contract reusable by polling: a query is proof only for the stored checkout. */
export function verifiedStkOutcome(
  checkoutRequestId: string,
  query: VerifiedStkQuery
): "completed" | "failed" {
  if (
    query.checkoutRequestID !== checkoutRequestId ||
    !/^\d+$/.test(query.resultCode)
  ) {
    throw new MpesaCallbackRetryError(
      "Provider verification unavailable or not bound to stored checkout"
    );
  }
  const outcome = classifyStkResult(query);
  if (outcome === "pending")
    throw new MpesaCallbackRetryError(
      "Provider payment outcome is still pending"
    );
  return outcome === "completed" ? "completed" : "failed";
}

export type MicroCourseCallbackResult = {
  enrollmentId: number;
  status: "completed" | "failed";
  duplicate: boolean;
  amountCents: number | null;
  receipt: string | null;
};

/**
 * Returns null ONLY when no micro-course enrollment owns this checkout (caller must
 * continue institution/AHA dispatch). Throws on verification/persistence failure;
 * HTTP callers must return a retryable 5xx, never acknowledge an unpersisted result.
 * No callback value chooses the learner/course: transactionId must already be stored.
 * Failed attempts use enrollmentStatus=expired, paymentStatus=pending (existing enum).
 */
export async function reconcileMicroCourseStkCallback(
  db: CallbackDb,
  callback: StkCallback,
  query: (checkoutRequestId: string) => Promise<VerifiedStkQuery> = queryStk
): Promise<MicroCourseCallbackResult | null> {
  const rows = await db
    .select()
    .from(microCourseEnrollments)
    .where(
      and(
        eq(microCourseEnrollments.transactionId, callback.checkoutRequestId),
        eq(microCourseEnrollments.paymentMethod, "m-pesa")
      )
    )
    .limit(2);
  if (!rows.length) return null;
  if (rows.length !== 1)
    throw new MpesaCallbackRetryError(
      "Ambiguous micro-course checkout binding"
    );
  const row = rows[0];
  if (row.paymentStatus === "completed" || row.paymentStatus === "free") {
    return {
      enrollmentId: row.id,
      status: "completed",
      duplicate: true,
      amountCents: row.amountPaid,
      receipt: null,
    };
  }
  const expectedKes = expectedStkAmountKes(row.amountPaid);
  const provider = await query(row.transactionId!);
  const status = verifiedStkOutcome(row.transactionId!, provider);
  if (status === "completed") {
    // STK query often has no amount/receipt; then the validated success callback
    // supplies metadata, but ONLY after the authenticated provider query confirms it.
    if (
      !callback.metadataValid ||
      callback.resultCode !== 0 ||
      callback.amountKes !== expectedKes
    ) {
      throw new MpesaCallbackRetryError(
        "Successful payment metadata is missing or amount does not match stored enrollment"
      );
    }
    if (
      (provider.amount != null && Number(provider.amount) !== expectedKes) ||
      (provider.mpesaReceiptNumber != null &&
        provider.mpesaReceiptNumber !== callback.receipt)
    ) {
      throw new MpesaCallbackRetryError(
        "Provider payment metadata conflicts with callback"
      );
    }
  }
  return db.transaction(async tx => {
    const [current] = await tx
      .select()
      .from(microCourseEnrollments)
      .where(eq(microCourseEnrollments.id, row.id))
      .limit(1)
      .for("update");
    if (
      !current ||
      current.transactionId !== callback.checkoutRequestId ||
      current.userId !== row.userId ||
      current.microCourseId !== row.microCourseId ||
      current.paymentMethod !== "m-pesa" ||
      current.amountPaid !== row.amountPaid
    ) {
      throw new MpesaCallbackRetryError(
        "Enrollment checkout binding changed during verification"
      );
    }
    if (
      current.paymentStatus === "completed" ||
      current.paymentStatus === "free"
    ) {
      return {
        enrollmentId: row.id,
        status: "completed",
        duplicate: true,
        amountCents: current.amountPaid,
        receipt: null,
      };
    }
    if (current.paymentStatus !== "pending") {
      throw new MpesaCallbackRetryError("Unexpected enrollment payment state");
    }
    const duplicate =
      status === "failed" && current.enrollmentStatus === "expired";
    await tx
      .update(microCourseEnrollments)
      .set(
        status === "completed"
          ? {
              paymentStatus: "completed",
              enrollmentStatus:
                current.enrollmentStatus === "completed"
                  ? "completed"
                  : "active",
              // Retain immutable expected cents and checkout binding; receipt is logged separately.
              updatedAt: new Date(),
            }
          : {
              enrollmentStatus: "expired",
              updatedAt: new Date(),
            }
      )
      .where(
        and(
          eq(microCourseEnrollments.id, row.id),
          eq(microCourseEnrollments.transactionId, callback.checkoutRequestId),
          eq(microCourseEnrollments.paymentStatus, "pending")
        )
      );
    if (status === "completed") {
      const [course] = await tx
        .select({ courseId: microCourses.courseId })
        .from(microCourses)
        .where(eq(microCourses.id, row.microCourseId))
        .limit(1);
      // This one legacy sample has a separate fellowship learning enrollment. Do
      // not seed content in a payment callback, nor touch unrelated AHA enrollments.
      if (course?.courseId === INTUBATION_SAMPLE_MICRO_COURSE_ID) {
        const courseId = await getIntubationSampleCourseId(tx);
        if (courseId == null)
          throw new MpesaCallbackRetryError(
            "Intubation learning course is missing"
          );
        const [learning] = await tx
          .select({ id: enrollments.id })
          .from(enrollments)
          .where(
            and(
              eq(enrollments.userId, row.userId),
              eq(enrollments.programType, "fellowship"),
              eq(enrollments.courseId, courseId)
            )
          )
          .orderBy(desc(enrollments.id))
          .limit(1);
        if (!learning)
          throw new MpesaCallbackRetryError(
            "Intubation learning enrollment is missing"
          );
        await tx
          .update(enrollments)
          .set({
            paymentStatus: "completed",
            amountPaid: row.amountPaid,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(enrollments.id, learning.id),
              eq(enrollments.paymentStatus, "pending")
            )
          );
      }
    }
    return {
      enrollmentId: row.id,
      status,
      duplicate,
      amountCents: row.amountPaid,
      receipt: status === "completed" ? callback.receipt : null,
    };
  });
}
